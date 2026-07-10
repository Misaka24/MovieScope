import { spawn } from 'node:child_process'

const commands = [
  spawn(process.execPath, ['server/server.mjs'], { stdio: 'inherit', shell: false }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { stdio: 'inherit', shell: false }),
]

let closing = false
function shutdown() {
  if (closing) return
  closing = true
  for (const command of commands) command.kill()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
for (const command of commands) command.on('exit', (code) => {
  if (!closing) shutdown()
  if (code && code !== 0) process.exitCode = code
})
