import type { Session } from './types'

const sessions = new Map<string, Session>()

function generateSessionId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function createSession(userId: string | number, data: Record<string, unknown> = {}, lifetime = 3600): Session {
  const session: Session = {
    id: generateSessionId(),
    userId,
    data,
    expiresAt: new Date(Date.now() + lifetime * 1000),
  }

  sessions.set(session.id, session)
  return session
}

export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId)
  if (!session)
    return null

  if (!isSessionValid(session)) {
    sessions.delete(sessionId)
    return null
  }

  return session
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function isSessionValid(session: Session): boolean {
  return new Date() < session.expiresAt
}

/** Exposed for testing — clears all sessions from the in-memory store */
export function clearAllSessions(): void {
  sessions.clear()
}
