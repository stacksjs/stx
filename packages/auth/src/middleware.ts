import type { User } from './types'
import { getSession } from './session'

export interface MiddlewareResult {
  authenticated: boolean
  user?: { userId: string | number, data: Record<string, unknown> }
  redirect?: string
}

export function authMiddleware(
  findUser?: (userId: string | number) => Promise<User | null>,
): (sessionId: string | undefined) => Promise<MiddlewareResult> {
  return async (sessionId: string | undefined): Promise<MiddlewareResult> => {
    if (!sessionId) {
      return { authenticated: false, redirect: '/login' }
    }

    const session = getSession(sessionId)
    if (!session) {
      return { authenticated: false, redirect: '/login' }
    }

    if (findUser) {
      const user = await findUser(session.userId)
      if (!user) {
        return { authenticated: false, redirect: '/login' }
      }
    }

    return {
      authenticated: true,
      user: { userId: session.userId, data: session.data },
    }
  }
}

export function guestMiddleware(): (sessionId: string | undefined) => MiddlewareResult {
  return (sessionId: string | undefined): MiddlewareResult => {
    if (sessionId) {
      const session = getSession(sessionId)
      if (session) {
        return { authenticated: true, redirect: '/dashboard' }
      }
    }

    return { authenticated: false }
  }
}
