import { cachedSql } from './cache.mjs'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const JUSTONE_BASE = process.env.JUSTONE_API_BASE_URL || 'https://api.justoneapi.com'
const requestTimeout = Number(process.env.API_TIMEOUT_MS || 25000)

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(requestTimeout) })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`上游接口 ${response.status}: ${body.slice(0, 200)}`)
  }
  return response.json()
}

export async function tmdb(path, params = {}, ttlMs = 15 * 60 * 1000) {
  const token = process.env.TMDB_ACCESS_TOKEN
  if (!token) throw new Error('缺少 TMDB_ACCESS_TOKEN')
  const url = new URL(`${TMDB_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  const cacheKey = `tmdb:${path}:${url.searchParams.toString()}`
  const result = await cachedSql({
    cacheKey,
    provider: 'tmdb',
    operation: path,
    ttlMs,
    loader: () => fetchJson(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
  })
  return { ...result.value, _cache: result.cache }
}

export async function justOne(path, params = {}, ttlMs = 30 * 60 * 1000) {
  const token = process.env.JUSTONE_API_TOKEN
  if (!token) throw new Error('缺少 JUSTONE_API_TOKEN')
  const url = new URL(`${JUSTONE_BASE}${path}`)
  url.searchParams.set('token', token)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  const cacheKey = `justone:${path}:${JSON.stringify(params)}`
  const result = await cachedSql({
    cacheKey,
    provider: path.includes('/douban/') ? 'douban' : 'imdb',
    operation: path,
    ttlMs,
    loader: async () => {
      const response = await fetchJson(url)
      if (response.code !== 0) throw new Error(response.message || `Just One API 业务错误 ${response.code}`)
      return response.data
    },
  })
  return { ...result.value, _cache: result.cache }
}