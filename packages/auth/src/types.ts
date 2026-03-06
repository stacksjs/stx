export interface AuthConfig {
  driver: 'session'
  session: { lifetime: number, cookie: string }
  hash: { algorithm: 'bcrypt' | 'argon2', rounds: number }
  oauth?: Record<string, OAuthProviderConfig>
  scaffold?: boolean
}

export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  redirectUri?: string
  scopes?: string[]
}

export interface User {
  id: string | number
  email: string
  name?: string
  [key: string]: unknown
}

export interface Session {
  id: string
  userId: string | number
  data: Record<string, unknown>
  expiresAt: Date
}

export interface Permission {
  name: string
  handler: (user: User, ...args: any[]) => boolean
}
