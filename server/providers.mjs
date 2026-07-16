import { cachedSql } from "./cache.mjs";
import { getProviderRuntime } from "./runtime-config.mjs";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

const TMDB_BASE = "https://api.themoviedb.org/3";
const requestTimeout = Number(process.env.API_TIMEOUT_MS || 25000);
const retryableBusinessCodes = new Set([301, 302, 303, 500, 600, 602]);
let tmdbDnsCache = { addresses: [], expiresAt: 0 };
let tmdbDnsPromise;

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

export function parseDohAddresses(payload) {
  return [
    ...new Set(
      (payload?.Answer || [])
        .filter((answer) => Number(answer?.type) === 1)
        .map((answer) => String(answer?.data || "").trim())
        .filter((address) => isIP(address) === 4),
    ),
  ];
}

async function resolveTmdbAddresses() {
  if (
    tmdbDnsCache.addresses.length &&
    tmdbDnsCache.expiresAt > Date.now()
  )
    return tmdbDnsCache.addresses;
  if (tmdbDnsPromise) return tmdbDnsPromise;
  tmdbDnsPromise = (async () => {
    const url = new URL(
      process.env.TMDB_DOH_URL || "https://doh.pub/resolve",
    );
    url.searchParams.set("name", "api.themoviedb.org");
    url.searchParams.set("type", "A");
    const response = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(Math.min(requestTimeout, 8000)),
    });
    if (!response.ok) throw new Error(`DoH ${response.status}`);
    const payload = await response.json();
    const addresses = parseDohAddresses(payload);
    if (!addresses.length) throw new Error("DoH 未返回可用的 IPv4 地址");
    const ttlValues = (payload.Answer || [])
      .map((answer) => Number(answer?.TTL))
      .filter(Number.isFinite);
    const ttlSeconds = Math.max(
      60,
      Math.min(600, ...(ttlValues.length ? ttlValues : [60])),
    );
    tmdbDnsCache = {
      addresses,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    return addresses;
  })().finally(() => {
    tmdbDnsPromise = undefined;
  });
  return tmdbDnsPromise;
}

function requestViaAddress(url, options, timeoutMs, address) {
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpsRequest(
      url,
      {
        method: options.method || "GET",
        headers: options.headers,
        servername: url.hostname,
        lookup: (_hostname, lookupOptions, callback) => {
          const result = { address, family: 4 };
          if (lookupOptions?.all) callback(null, [result]);
          else callback(null, address, 4);
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const headers = new Map(
            Object.entries(response.headers).map(([key, value]) => [
              key.toLowerCase(),
              Array.isArray(value) ? value.join(", ") : String(value || ""),
            ]),
          );
          resolveRequest({
            ok:
              Number(response.statusCode) >= 200 &&
              Number(response.statusCode) < 300,
            status: Number(response.statusCode || 0),
            headers: { get: (name) => headers.get(name.toLowerCase()) || null },
            text: async () => Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    request.setTimeout(timeoutMs, () =>
      request.destroy(new Error(`连接 ${address} 超时`)),
    );
    request.on("error", rejectRequest);
    if (options.body) request.write(options.body);
    request.end();
  });
}

async function fetchTmdb(url, options, timeoutMs) {
  try {
    const addresses = await resolveTmdbAddresses();
    let lastError;
    for (const address of addresses) {
      try {
        return await requestViaAddress(url, options, timeoutMs, address);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("DoH 地址均不可用");
  } catch {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
  }
}

async function fetchJson(
  url,
  options = {},
  timeoutMs = requestTimeout,
  requestFactory = null,
) {
  let response;
  try {
    response = requestFactory
      ? await requestFactory(url, options, timeoutMs)
      : await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(timeoutMs),
        });
  } catch (error) {
    const reason =
      error?.cause?.code ||
      error?.cause?.message ||
      error?.message ||
      String(error);
    throw new Error(`无法连接上游服务 ${url.hostname}: ${reason}`);
  }
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`上游接口 ${response.status}: ${body.slice(0, 200)}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`上游接口返回非 JSON 内容: ${body.slice(0, 200)}`);
  }
  if (!body.trim()) throw new Error("上游接口返回空响应");
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`上游接口返回无效 JSON: ${body.slice(0, 200)}`);
  }
}

function appendParams(url, params) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
}

export async function tmdb(path, params = {}, ttlMs = 15 * 60 * 1000) {
  const runtime = await getProviderRuntime("tmdb", {
    baseUrl: TMDB_BASE,
    requestTimeoutMs: requestTimeout,
  });
  if (!runtime.enabled) throw new Error("TMDB Provider 已在管理后台停用");
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error("缺少 TMDB_ACCESS_TOKEN");
  const url = new URL(`${runtime.baseUrl}${path}`);
  appendParams(url, params);
  const cacheKey = `tmdb:${path}:${url.searchParams.toString()}`;
  const result = await cachedSql({
    cacheKey,
    provider: "tmdb",
    operation: path,
    ttlMs,
    loader: () =>
      fetchJson(
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
        runtime.requestTimeoutMs,
        fetchTmdb,
      ),
  });
  return { ...result.value, _cache: result.cache };
}

export async function justOne(path, params = {}, ttlMs = 30 * 60 * 1000) {
  const runtime = await getProviderRuntime("justone", {
    baseUrl: process.env.JUSTONE_API_BASE_URL || "https://api.justoneapi.com",
    requestTimeoutMs: requestTimeout,
  });
  if (!runtime.enabled)
    throw new Error("Just One API Provider 已在管理后台停用");
  const token = process.env.JUSTONE_API_TOKEN;
  if (!token) throw new Error("缺少 JUSTONE_API_TOKEN");
  const url = new URL(`${runtime.baseUrl}${path}`);
  url.searchParams.set("token", token);
  appendParams(url, params);
  const cacheKey = `justone:${path}:${JSON.stringify(params)}`;
  const result = await cachedSql({
    cacheKey,
    provider: "justone",
    operation: path,
    ttlMs,
    loader: async () => {
      let lastResponse;
      for (let attempt = 0; attempt < 1; attempt += 1) {
        const response = await fetchJson(url, {}, runtime.requestTimeoutMs);
        lastResponse = response;
        if (response.code === 0) return response.data;
        if (!retryableBusinessCodes.has(response.code)) break;
      }
      throw new Error(
        lastResponse?.message || `Just One API 业务错误 ${lastResponse?.code}`,
      );
    },
  });
  return { ...result.value, _cache: result.cache };
}
