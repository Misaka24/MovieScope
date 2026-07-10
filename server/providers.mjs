import { cachedSql } from './cache.mjs'
import { getProviderRuntime } from './runtime-config.mjs'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const requestTimeout = Number(process.env.API_TIMEOUT_MS || 25000)
const retryableBusinessCodes = new Set([301, 302, 303, 500, 600, 602])

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}
async function fetchJson(url, options = {}, timeoutMs = requestTimeout) {
  let response
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) })
  } catch (error) {
    const reason = error?.cause?.code || error?.cause?.message || error?.message || String(error)
    throw new Error(`无法连接上游服务 ${url.hostname}: ${reason}`)
  }
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`上游接口 ${response.status}: ${body.slice(0, 200)}`)
  }
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`上游接口返回非 JSON 内容: ${body.slice(0, 200)}`)
  }
  if (!body.trim()) throw new Error('上游接口返回空响应')
  try {
    return JSON.parse(body)
  } catch {
    throw new Error(`上游接口返回无效 JSON: ${body.slice(0, 200)}`)
  }
}

function appendParams(url, params) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item))
    } else {
      url.searchParams.set(key, String(value))
    }
  }
}

export async function tmdb(path, params = {}, ttlMs = 15 * 60 * 1000) {
  const runtime = await getProviderRuntime('tmdb', { baseUrl: TMDB_BASE, requestTimeoutMs: requestTimeout })
  if (!runtime.enabled) throw new Error('TMDB Provider 已在管理后台停用')
  const token = process.env.TMDB_ACCESS_TOKEN
  if (!token) throw new Error('缺少 TMDB_ACCESS_TOKEN')
  const url = new URL(`${runtime.baseUrl}${path}`)
  appendParams(url, params)
  const cacheKey = `tmdb:${path}:${url.searchParams.toString()}`
  const result = await cachedSql({
    cacheKey,
    provider: 'tmdb',
    operation: path,
    ttlMs,
    loader: () => fetchJson(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }, runtime.requestTimeoutMs),
  })
  return { ...result.value, _cache: result.cache }
}

export async function justOne(path, params = {}, ttlMs = 30 * 60 * 1000) {
  const runtime = await getProviderRuntime('imdb', { baseUrl: process.env.JUSTONE_API_BASE_URL || 'https://api.justoneapi.com', requestTimeoutMs: requestTimeout })
  if (!runtime.enabled) throw new Error('Just One API Provider 已在管理后台停用')
  const token = process.env.JUSTONE_API_TOKEN
  if (!token) throw new Error('缺少 JUSTONE_API_TOKEN')
  const url = new URL(`${runtime.baseUrl}${path}`)
  url.searchParams.set('token', token)
  appendParams(url, params)
  const cacheKey = `justone:${path}:${JSON.stringify(params)}`
  const result = await cachedSql({
    cacheKey,
    provider: 'imdb',
    operation: path,
    ttlMs,
    loader: async () => {
      let lastResponse
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetchJson(url, {}, runtime.requestTimeoutMs)
        lastResponse = response
        if (response.code === 0) return response.data
        if (!retryableBusinessCodes.has(response.code) || attempt === 2) break
        await delay(350 * (attempt + 1))
      }
      throw new Error(lastResponse?.message || `Just One API 业务错误 ${lastResponse?.code}`)
    },
  })
  return { ...result.value, _cache: result.cache }
}

export async function imdbApiDev(path, params = {}, ttlMs = 24 * 60 * 60 * 1000) {
  const runtime = await getProviderRuntime('imdbapi-dev', { baseUrl: process.env.IMDB_API_DEV_BASE_URL || 'https://api.imdbapi.dev', requestTimeoutMs: requestTimeout })
  if (!runtime.enabled) throw new Error('imdbapi.dev Provider 已在管理后台停用')
  const url = new URL(`${runtime.baseUrl}${path}`)
  appendParams(url, params)
  const stableParams = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value]),
  )
  const cacheKey = `imdbapi-dev:${path}:${JSON.stringify(stableParams)}`
  const result = await cachedSql({
    cacheKey,
    provider: 'imdbapi-dev',
    operation: path,
    ttlMs,
    loader: async () => {
      let lastError
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          return await fetchJson(url, { headers: { Accept: 'application/json' } }, runtime.requestTimeoutMs)
        } catch (error) {
          lastError = error
          if (attempt === 0) await delay(500)
        }
      }
      throw lastError || new Error('imdbapi.dev 请求失败')
    },
  })
  return { ...result.value, _cache: result.cache }
}
