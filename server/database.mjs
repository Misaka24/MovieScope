import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

let databasePromise

async function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl?.startsWith('postgres://') || databaseUrl?.startsWith('postgresql://')) {
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: databaseUrl })
    return {
      query: (text, values = []) => pool.query(text, values),
      close: () => pool.end(),
      mode: 'postgresql',
    }
  }

  const dataDirectory = resolve(process.env.PGLITE_DATA_DIR || '.data/pglite')
  await mkdir(dirname(dataDirectory), { recursive: true })
  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite(dataDirectory)
  return {
    query: (text, values = []) => db.query(text, values),
    close: () => db.close(),
    mode: 'pglite',
  }
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = createDatabase().then(async (db) => {
      const migration = await readFile(resolve('db/migrations/001_api_cache.sql'), 'utf8')
      for (const statement of migration.split(';').map((value) => value.trim()).filter(Boolean)) {
        await db.query(statement)
      }
      return db
    })
  }
  return databasePromise
}