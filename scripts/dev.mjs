import { spawn } from 'node:child_process'
import { get } from 'node:http'

const apiUrl = 'http://127.0.0.1:8787/api/v1/health'
const webUrl = 'http://127.0.0.1:5173/'
const commands = []

async function probe(url, validate) {
  return new Promise((resolveProbe) => {
    const request = get(url, { timeout: 1500 }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        resolveProbe({ occupied: true, expected: Boolean(response.statusCode && response.statusCode < 400) && validate(body) })
      })
    })
    request.on('timeout', () => request.destroy(new Error('timeout')))
    request.on('error', (error) => {
      resolveProbe({ occupied: error?.code !== 'ECONNREFUSED', expected: false })
    })
  })
}

const api = await probe(apiUrl, (body) => {
  try {
    return JSON.parse(body)?.data?.status === 'ok'
  } catch {
    return false
  }
})
const web = await probe(webUrl, (body) => body.includes('<title>MovieScope'))

if (api.occupied && !api.expected) {
  console.error('端口 8787 已被其他程序占用，无法启动 MovieScope API。')
  process.exit(1)
}
if (web.occupied && !web.expected) {
  console.error('端口 5173 已被其他程序占用，无法启动 MovieScope 前端。')
  process.exit(1)
}

if (api.expected) console.log('复用已运行的 MovieScope API：http://127.0.0.1:8787')
else commands.push(spawn(process.execPath, ['server/server.mjs'], { stdio: 'inherit', shell: false }))

if (web.expected) console.log('复用已运行的 MovieScope 前端：http://127.0.0.1:5173')
else commands.push(spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { stdio: 'inherit', shell: false }))

if (!commands.length) {
  console.log('MovieScope 已在本地运行。')
}

let closing = false
function shutdown() {
  if (closing) return
  closing = true
  for (const command of commands) command.kill()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
for (const command of commands) {
  command.on('error', (error) => {
    console.error(`开发服务启动失败：${error.message}`)
    shutdown()
    process.exitCode = 1
  })
  command.on('exit', (code) => {
    if (!closing) shutdown()
    if (code && code !== 0) process.exitCode = code
  })
}
