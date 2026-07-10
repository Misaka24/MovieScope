import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { loadEnv } from './env.mjs'
import { getDatabase } from './database.mjs'
import { getHomeData } from './home-service.mjs'
import { discoverCatalog, getBrowsePage, getCatalogOptions, getIndustryNews, getPersonDetails, getPopularPeople, getTitleDetails, getWatchProviders, searchCatalog } from './catalog-service.mjs'

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

function queryParams(url) {
  return Object.fromEntries(url.searchParams.entries())
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

    if (request.method === 'GET' && url.pathname === '/api/v1/search') {
      const data = await searchCatalog(queryParams(url))
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/discover') {
      const params = queryParams(url)
      const data = await discoverCatalog({
        mediaType: params.media,
        page: params.page,
        sortBy: params.sort,
        genres: params.genres,
        year: params.year,
        minRating: params.rating,
        language: params.language,
        provider: params.provider,
      })
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/catalog/options') {
      const data = await getCatalogOptions()
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/browse') {
      const data = await getBrowsePage(url.searchParams.get('preset'), url.searchParams.get('page'))
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/people/popular') {
      const data = await getPopularPeople(url.searchParams.get('page'))
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/watch-providers') {
      const data = await getWatchProviders()
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/news') {
      const data = await getIndustryNews()
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    const titleMatch = url.pathname.match(/^\/api\/v1\/titles\/(movie|tv)\/(\d+)$/)
    if (request.method === 'GET' && titleMatch) {
      const data = await getTitleDetails(titleMatch[1], titleMatch[2])
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    const personMatch = url.pathname.match(/^\/api\/v1\/people\/(\d+)$/)
    if (request.method === 'GET' && personMatch) {
      const data = await getPersonDetails(personMatch[1])
      sendJson(response, 200, { data, meta: { requestId: crypto.randomUUID() }, error: null })
      return
    }

    sendJson(response, 404, { data: null, error: { code: 'RESOURCE_NOT_FOUND', message: '接口不存在' } })
  } catch (error) {
    console.error('[api]', error instanceof Error ? error.message : error)
    sendJson(response, 500, { data: null, error: { code: 'SERVICE_UNAVAILABLE', message: error instanceof Error ? error.message : '服务暂不可用' } })
  }
})

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`MovieScope API 端口 ${port} 已被占用。请复用现有服务或停止占用该端口的程序。`)
  } else {
    console.error('MovieScope API 监听失败。', error instanceof Error ? error.message : error)
  }
  process.exitCode = 1
})

try {
  await getDatabase()
  server.listen(port, '127.0.0.1', () => {
    console.log(`MovieScope API: http://127.0.0.1:${port}`)
  })
} catch (error) {
  console.error('MovieScope API 启动失败。')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}

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
