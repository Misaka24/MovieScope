import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { loadEnv } from './env.mjs'
import { getDatabase } from './database.mjs'
import { getHomeData } from './home-service.mjs'

loadEnv()

const port = Number(process.env.API_PORT || 8787)
const allowedOrigin = process.env.WEB_ORIGIN || 'http://127.0.0.1:5173'

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(JSON.stringify(body))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/v1/health') {
      const db = await getDatabase()
      await db.query('SELECT 1 AS ok')
      sendJson(response, 200, { data: { status: 'ok', database: db.mode }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/home') {
      const data = await getHomeData()
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    sendJson(response, 404, { data: null, error: { code: 'RESOURCE_NOT_FOUND', message: '接口不存在' } })
  } catch (error) {
    console.error('[api]', error instanceof Error ? error.message : error)
    sendJson(response, 500, { data: null, error: { code: 'SERVICE_UNAVAILABLE', message: error instanceof Error ? error.message : '服务暂不可用' } })
  }
})

await getDatabase()
server.listen(port, '127.0.0.1', () => {
  console.log(`MovieScope API: http://127.0.0.1:${port}`)
})

let closing = false
async function shutdown() {
  if (closing) return
  closing = true
  await new Promise((resolveClose) => server.close(resolveClose))
  const db = await getDatabase()
  await db.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
