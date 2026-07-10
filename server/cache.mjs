import { getDatabase } from './database.mjs'

export async function getCachedValue(cacheKey) {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT payload, fetched_at, expires_at
       FROM api_cache
      WHERE cache_key = $1 AND expires_at > NOW()`,
    [cacheKey],
  )
  return result.rows[0] || null
}

export async function putCachedValue({ cacheKey, provider, value, ttlMs }) {
  const db = await getDatabase()
  await db.query(
    `INSERT INTO api_cache (cache_key, provider, payload, fetched_at, expires_at, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW(), NOW() + ($4 * INTERVAL '1 millisecond'), NOW())
     ON CONFLICT (cache_key) DO UPDATE SET
       provider = EXCLUDED.provider,
       payload = EXCLUDED.payload,
       fetched_at = EXCLUDED.fetched_at,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()`,
    [cacheKey, provider, JSON.stringify(value), ttlMs],
  )
}

export async function logProviderSync({ provider, operation, cacheKey, status, durationMs, errorMessage = null }) {
  const db = await getDatabase()
  await db.query(
    `INSERT INTO provider_sync_logs (provider, operation, cache_key, status, duration_ms, error_message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
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
    throw error
  }
}