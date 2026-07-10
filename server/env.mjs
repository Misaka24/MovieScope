import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadEnv(filename = '.env') {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const separator = trimmed.indexOf('=')
      if (separator < 1) continue
      const key = trimmed.slice(0, separator).trim()
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) process.env[key] = value
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}