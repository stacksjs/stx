import process from 'node:process'
import type { EnvVarDef, TypedEnv } from './types'
import { getEnvValue, loadEnvFile } from './loader'
import { validateEnv } from './validation'

export function defineEnv<T extends Record<string, EnvVarDef>>(schema: T): TypedEnv<T> {
  // Load .env file into process.env (if not already set)
  const fileVars = loadEnvFile()
  for (const [key, value] of Object.entries(fileVars)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  // Collect raw values from environment
  const rawValues: Record<string, string | undefined> = {}
  for (const key of Object.keys(schema)) {
    rawValues[key] = getEnvValue(key)
  }

  const { values, errors } = validateEnv(schema, rawValues)

  if (errors.length > 0) {
    const messages = errors.map(e => `  - ${e.message}`).join('\n')
    throw new Error(`Environment validation failed:\n${messages}`)
  }

  return values as TypedEnv<T>
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  return !isProduction() || process.env.STX_DEBUG === 'true'
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}
