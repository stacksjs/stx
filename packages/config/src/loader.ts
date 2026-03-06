import process from 'node:process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadEnvFile(filePath?: string): Record<string, string> {
  const envPath = filePath ?? resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    return {}
  }

  const content = readFileSync(envPath, 'utf-8')
  const vars: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }

    // Strip inline comments (only outside quotes)
    const commentIndex = value.indexOf(' #')
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim()
    }

    vars[key] = value
  }

  return vars
}

export function getEnvValue(key: string): string | undefined {
  // Bun.env is preferred, falls back to process.env
  if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
    return (globalThis as any).Bun.env[key]
  }

  // Deno
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    try {
      return (globalThis as any).Deno.env.get(key)
    }
    catch {
      return undefined
    }
  }

  // Node.js / fallback
  return process.env[key]
}
