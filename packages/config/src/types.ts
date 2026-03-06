export type EnvType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'port'

export interface EnvVarDef<T = unknown> {
  type: EnvType
  required?: boolean
  default?: T
  description?: string
  validate?: (value: T) => boolean
  choices?: T[]
}

export type TypedEnv<T extends Record<string, EnvVarDef>> = {
  [K in keyof T]: T[K] extends { type: 'number' } ? number
    : T[K] extends { type: 'port' } ? number
      : T[K] extends { type: 'boolean' } ? boolean
        : string
}

export interface EnvValidationError {
  key: string
  message: string
}

export interface EnvAccessor {
  get: (key: string) => string | undefined
  getOrThrow: (key: string) => string
  has: (key: string) => boolean
  all: () => Record<string, string>
}
