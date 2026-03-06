export class StxError extends Error {
  code: string
  filePath?: string
  line?: number
  column?: number
  hint?: string

  constructor(message: string, options?: { code?: string, filePath?: string, line?: number, column?: number, hint?: string }) {
    super(message)
    this.name = 'StxError'
    this.code = options?.code ?? 'STX_ERROR'
    this.filePath = options?.filePath
    this.line = options?.line
    this.column = options?.column
    this.hint = options?.hint
  }
}

export class NotFoundError extends StxError {
  constructor(resource?: string) {
    super(resource ? `Not found: ${resource}` : 'Not found', { code: 'NOT_FOUND' })
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends StxError {
  errors: Record<string, string[]>

  constructor(errors: Record<string, string[]>) {
    const count = Object.keys(errors).length
    super(`Validation failed with ${count} error${count === 1 ? '' : 's'}`, { code: 'VALIDATION_ERROR' })
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class AuthenticationError extends StxError {
  constructor(message?: string) {
    super(message ?? 'Authentication required', { code: 'AUTHENTICATION_ERROR' })
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends StxError {
  constructor(message?: string) {
    super(message ?? 'Access denied', { code: 'AUTHORIZATION_ERROR' })
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends StxError {
  query?: string

  constructor(message: string, query?: string) {
    super(message, { code: 'DATABASE_ERROR' })
    this.name = 'DatabaseError'
    this.query = query
  }
}

export class ConfigError extends StxError {
  key?: string

  constructor(message: string, key?: string) {
    super(message, { code: 'CONFIG_ERROR' })
    this.name = 'ConfigError'
    this.key = key
  }
}
