import { getDatabase } from './database.mjs'

function parsePayload(value) {
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

export async function getCachedValue(cacheKey) {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT payload, fetched_at, expires_at
       FROM api_cache
      WHERE cache_key = ? AND expires_at > UTC_TIMESTAMP()`,
    [cacheKey],
  )
  const row = result.rows[0]
  return row ? { ...row, payload: parsePayload(row.payload) } : null
}

export async function getLatestCachedValue(cacheKey) {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT payload, fetched_at, expires_at
       FROM api_cache
      WHERE cache_key = ?
        AND fetched_at > UTC_TIMESTAMP() - INTERVAL 30 DAY`,
    [cacheKey],
  )
  const row = result.rows[0]
  return row ? { ...row, payload: parsePayload(row.payload) } : null
}

export async function putCachedValue({ cacheKey, provider, value, ttlMs }) {
  const db = await getDatabase()
  const expiresAt = new Date(Date.now() + ttlMs)
  await db.query(
    `INSERT INTO api_cache (cache_key, provider, payload, fetched_at, expires_at, updated_at)
     VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE
       provider = VALUES(provider),
       payload = VALUES(payload),
       fetched_at = VALUES(fetched_at),
       expires_at = VALUES(expires_at),
       updated_at = UTC_TIMESTAMP()`,
    [cacheKey, provider, JSON.stringify(value), expiresAt],
  )
}

export async function logProviderSync({ provider, operation, cacheKey, status, durationMs, errorMessage = null }) {
  const db = await getDatabase()
  await db.query(
    `INSERT INTO provider_sync_logs (provider, operation, cache_key, status, duration_ms, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [provider, operation, cacheKey, status, Math.round(durationMs), errorMessage],
  )
}

export async function cachedSql({ cacheKey, provider, operation, ttlMs, loader }) {
  const cached = await getCachedValue(cacheKey)
  if (cached) return { value: cached.payload, cache: 'hit', fetchedAt: cached.fetched_at }

  const startedAt = performance.now()
  try {
    const value = await loader()
    await putCachedValue({ cacheKey, provider, value, ttlMs })
    await logProviderSync({ provider, operation, cacheKey, status: 'success', durationMs: performance.now() - startedAt })
    return { value, cache: 'miss', fetchedAt: new Date() }
  } catch (error) {
    await logProviderSync({ provider, operation, cacheKey, status: 'error', durationMs: performance.now() - startedAt, errorMessage: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000) })
    const stale = await getLatestCachedValue(cacheKey)
    if (stale) return { value: stale.payload, cache: 'stale', fetchedAt: stale.fetched_at }
    throw error
  }
}
