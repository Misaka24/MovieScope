import { spawn } from 'node:child_process'

const commands = [
  spawn(process.execPath, ['server/server.mjs'], { stdio: 'inherit', shell: false }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], { stdio: 'inherit', shell: false }),
]

function shutdown() {
  for (const command of commands) command.kill()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
for (const command of commands) command.on('exit', (code) => {
  if (code && code !== 0) process.exitCode = code
})