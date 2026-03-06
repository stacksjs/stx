import type { Session, User } from './types'
import { hashPassword, verifyPassword } from './password'
import { createSession, destroySession, getSession } from './session'

export async function login(
  email: string,
  password: string,
  findUser: (email: string) => Promise<(User & { password: string }) | null>,
): Promise<Session | null> {
  const user = await findUser(email)
  if (!user)
    return null

  const valid = await verifyPassword(password, user.password)
  if (!valid)
    return null

  return createSession(user.id, { email: user.email, name: user.name })
}

export function logout(sessionId: string): void {
  destroySession(sessionId)
}

export async function register(
  data: { email: string, password: string, name?: string },
  createUser: (userData: { email: string, password: string, name?: string }) => Promise<User>,
): Promise<User> {
  const hashed = await hashPassword(data.password)
  return createUser({ ...data, password: hashed })
}

export function getUser(sessionId: string): { userId: string | number, data: Record<string, unknown> } | null {
  const session = getSession(sessionId)
  if (!session)
    return null

  return { userId: session.userId, data: session.data }
}
