import process from 'node:process'

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  return !isProduction() || process.env.STX_DEBUG === 'true'
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}
