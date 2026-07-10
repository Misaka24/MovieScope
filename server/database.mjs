import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

let databasePromise

function connectionOptions() {
  if (process.env.MYSQL_URL) return { uri: process.env.MYSQL_URL }
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'moviescope',
  }
}

async function createDatabase() {
  const mysql = await import('mysql2/promise')
  const options = connectionOptions()
  const poolOptions = {
    ...(options.uri ? { uri: options.uri } : options),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true,
  }
  const pool = mysql.createPool(poolOptions)
  const migration = await readFile(resolve('db/migrations/001_api_cache.mysql.sql'), 'utf8')
  await pool.query(migration)
  return {
    query: async (text, values = []) => {
      const [rows] = await pool.query(text, values)
      return { rows: Array.isArray(rows) ? rows : [], result: rows }
    },
    close: () => pool.end(),
    mode: 'mysql',
  }
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = createDatabase().catch((error) => {
      databasePromise = undefined
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`无法连接 MySQL 数据库：${message}。请检查 MYSQL_URL 或 MYSQL_HOST、MYSQL_PORT、MYSQL_USER、MYSQL_PASSWORD、MYSQL_DATABASE。`)
    })
  }
  return databasePromise
}
