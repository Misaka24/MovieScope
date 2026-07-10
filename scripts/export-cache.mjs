import { writeFile } from 'node:fs/promises'
import { loadEnv } from '../server/env.mjs'
import { getDatabase } from '../server/database.mjs'

loadEnv()

const outputPath = process.argv[2] || 'api-cache-export.json'
try {
  const db = await getDatabase()
  const cache = await db.query(
  `SELECT cache_key, provider, payload, fetched_at, expires_at, updated_at
     FROM api_cache
    ORDER BY provider, cache_key`,
)
  const syncLogs = await db.query(
  `SELECT id, provider, operation, cache_key, status, duration_ms, error_message, created_at
     FROM provider_sync_logs
    ORDER BY id`,
)

  await writeFile(outputPath, JSON.stringify({ api_cache: cache.rows, provider_sync_logs: syncLogs.rows }, null, 2), 'utf8')
  console.log(`缓存数据已导出到 ${outputPath}`)
  await db.close()
} catch (error) {
  console.error('无法打开缓存数据库。请先停止 API 服务，再重新执行此命令。')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
