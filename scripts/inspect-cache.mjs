import { loadEnv } from '../server/env.mjs'
import { getDatabase } from '../server/database.mjs'

loadEnv()

try {
  const db = await getDatabase()
  const summary = await db.query(
  `SELECT provider,
          COUNT(*)::int AS cache_count,
          COUNT(*) FILTER (WHERE expires_at > NOW())::int AS active_count,
          MIN(fetched_at) AS oldest_fetch,
          MAX(fetched_at) AS newest_fetch
     FROM api_cache
    GROUP BY provider
    ORDER BY provider`,
)
  const recent = await db.query(
  `SELECT provider, cache_key, fetched_at, expires_at
     FROM api_cache
    ORDER BY updated_at DESC
    LIMIT 30`,
)

  console.log('缓存汇总')
  for (const row of summary.rows) {
    console.log(`${row.provider}: 共 ${row.cache_count} 条，有效 ${row.active_count} 条，最近抓取 ${row.newest_fetch}`)
  }
  console.log('\n最近缓存记录')
  for (const row of recent.rows) {
    console.log(`${row.provider} | ${row.cache_key} | 抓取 ${row.fetched_at} | 过期 ${row.expires_at}`)
  }
  await db.close()
} catch (error) {
  console.error('无法打开缓存数据库。请先停止 API 服务，再重新执行此命令。')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
