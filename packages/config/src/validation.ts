import type { EnvType, EnvValidationError, EnvVarDef } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/

function coerceValue(raw: string, type: EnvType): unknown {
  switch (type) {
    case 'number': {
      const n = Number(raw)
      if (Number.isNaN(n)) throw new Error(`Expected a number, got "${raw}"`)
      return n
    }
    case 'port': {
      const p = Number(raw)
      if (Number.isNaN(p) || !Number.isInteger(p) || p < 0 || p > 65535)
        throw new Error(`Expected a valid port (0-65535), got "${raw}"`)
      return p
    }
    case 'boolean': {
      const lower = raw.toLowerCase()
      if (lower === 'true' || lower === '1' || lower === 'yes') return true
      if (lower === 'false' || lower === '0' || lower === 'no') return false
      throw new Error(`Expected a boolean, got "${raw}"`)
    }
    case 'url': {
      if (!URL_RE.test(raw)) throw new Error(`Expected a URL, got "${raw}"`)
      return raw
    }
    case 'email': {
      if (!EMAIL_RE.test(raw)) throw new Error(`Expected an email, got "${raw}"`)
      return raw
    }
    case 'string':
    default:
      return raw
  }
}

export function validateEnv<T extends Record<string, EnvVarDef>>(
  schema: T,
  rawValues: Record<string, string | undefined>,
): { values: Record<string, unknown>, errors: EnvValidationError[] } {
  const values: Record<string, unknown> = {}
  const errors: EnvValidationError[] = []

  for (const [key, def] of Object.entries(schema)) {
    const raw = rawValues[key]
    const isRequired = def.required !== false

    if (raw === undefined || raw === '') {
      if (def.default !== undefined) {
        values[key] = def.default
        continue
      }
      if (isRequired) {
        errors.push({ key, message: `Missing required environment variable: ${key}` })
        continue
      }
      values[key] = undefined
      continue
    }

    try {
      const coerced = coerceValue(raw, def.type)

      if (def.choices && !def.choices.includes(coerced as any)) {
        errors.push({ key, message: `${key} must be one of [${def.choices.join(', ')}], got "${coerced}"` })
        continue
      }

      if (def.validate && !def.validate(coerced as any)) {
        errors.push({ key, message: `${key} failed custom validation` })
        continue
      }

      values[key] = coerced
    }
    catch (err: any) {
      errors.push({ key, message: `${key}: ${err.message}` })
    }
  }

  return { values, errors }
}
