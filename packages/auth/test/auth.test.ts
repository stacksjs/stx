import { afterEach, describe, expect, test } from 'bun:test'
import {
  authMiddleware,
  can,
  createSession,
  definePermissions,
  destroySession,
  getSession,
  getUser,
  guestMiddleware,
  hashPassword,
  isSessionValid,
  login,
  logout,
  register,
  verifyPassword,
} from '../src'
import { clearAllSessions } from '../src/session'
import { clearPermissions } from '../src/permissions'
import type { User } from '../src'

afterEach(() => {
  clearAllSessions()
  clearPermissions()
})

describe('password hashing', () => {
  test('hashPassword returns a hashed string', async () => {
    const hashed = await hashPassword('secret123')
    expect(hashed).toBeDefined()
    expect(hashed).not.toBe('secret123')
  })

  test('verifyPassword returns true for correct password', async () => {
    const hashed = await hashPassword('secret123')
    const result = await verifyPassword('secret123', hashed)
    expect(result).toBe(true)
  })

  test('verifyPassword returns false for wrong password', async () => {
    const hashed = await hashPassword('secret123')
    const result = await verifyPassword('wrong', hashed)
    expect(result).toBe(false)
  })
})

describe('session management', () => {
  test('createSession returns a session with id', () => {
    const session = createSession(1, { email: 'test@example.com' })
    expect(session.id).toBeDefined()
    expect(session.userId).toBe(1)
    expect(session.data.email).toBe('test@example.com')
    expect(session.expiresAt).toBeInstanceOf(Date)
  })

  test('getSession returns the session', () => {
    const session = createSession(1)
    const retrieved = getSession(session.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.userId).toBe(1)
  })

  test('getSession returns null for unknown id', () => {
    expect(getSession('nonexistent')).toBeNull()
  })

  test('destroySession removes the session', () => {
    const session = createSession(1)
    destroySession(session.id)
    expect(getSession(session.id)).toBeNull()
  })

  test('isSessionValid returns false for expired session', () => {
    const session = createSession(1, {}, -1) // negative lifetime = already expired
    expect(isSessionValid(session)).toBe(false)
  })

  test('getSession returns null for expired session', () => {
    const session = createSession(1, {}, -1)
    expect(getSession(session.id)).toBeNull()
  })
})

describe('login flow', () => {
  const mockUsers: Record<string, User & { password: string }> = {}

  async function setupUser() {
    const hashed = await hashPassword('password123')
    mockUsers['user@test.com'] = {
      id: 1,
      email: 'user@test.com',
      name: 'Test User',
      password: hashed,
    }
  }

  async function findUser(email: string) {
    return mockUsers[email] ?? null
  }

  test('login succeeds with correct credentials', async () => {
    await setupUser()
    const session = await login('user@test.com', 'password123', findUser)
    expect(session).not.toBeNull()
    expect(session!.userId).toBe(1)
  })

  test('login fails with wrong password', async () => {
    await setupUser()
    const session = await login('user@test.com', 'wrong', findUser)
    expect(session).toBeNull()
  })

  test('login fails with unknown email', async () => {
    const session = await login('nobody@test.com', 'password123', findUser)
    expect(session).toBeNull()
  })

  test('logout destroys the session', async () => {
    await setupUser()
    const session = await login('user@test.com', 'password123', findUser)
    expect(session).not.toBeNull()
    logout(session!.id)
    expect(getSession(session!.id)).toBeNull()
  })

  test('getUser returns user data from session', async () => {
    await setupUser()
    const session = await login('user@test.com', 'password123', findUser)
    const user = getUser(session!.id)
    expect(user).not.toBeNull()
    expect(user!.userId).toBe(1)
  })

  test('getUser returns null for invalid session', () => {
    expect(getUser('invalid')).toBeNull()
  })
})

describe('register', () => {
  test('register hashes password and calls createUser', async () => {
    let storedData: any = null
    const user = await register(
      { email: 'new@test.com', password: 'plain', name: 'New' },
      async (data) => {
        storedData = data
        return { id: 2, email: data.email, name: data.name }
      },
    )
    expect(user.id).toBe(2)
    expect(user.email).toBe('new@test.com')
    expect(storedData.password).not.toBe('plain')
  })
})

describe('permissions', () => {
  test('can returns true when permission handler passes', () => {
    definePermissions([
      { name: 'edit-post', handler: (user: User) => user.id === 1 },
    ])
    expect(can({ id: 1, email: 'a@b.com' }, 'edit-post')).toBe(true)
  })

  test('can returns false when permission handler fails', () => {
    definePermissions([
      { name: 'edit-post', handler: (user: User) => user.id === 1 },
    ])
    expect(can({ id: 2, email: 'a@b.com' }, 'edit-post')).toBe(false)
  })

  test('can returns false for undefined permission', () => {
    expect(can({ id: 1, email: 'a@b.com' }, 'nonexistent')).toBe(false)
  })

  test('permission handler receives extra args', () => {
    definePermissions([
      {
        name: 'owns-resource',
        handler: (user: User, resourceOwnerId: number) => user.id === resourceOwnerId,
      },
    ])
    expect(can({ id: 1, email: 'a@b.com' }, 'owns-resource', 1)).toBe(true)
    expect(can({ id: 1, email: 'a@b.com' }, 'owns-resource', 2)).toBe(false)
  })
})

describe('middleware', () => {
  test('authMiddleware redirects when no session', async () => {
    const mw = authMiddleware()
    const result = await mw(undefined)
    expect(result.authenticated).toBe(false)
    expect(result.redirect).toBe('/login')
  })

  test('authMiddleware authenticates with valid session', async () => {
    const session = createSession(1, { email: 'test@test.com' })
    const mw = authMiddleware()
    const result = await mw(session.id)
    expect(result.authenticated).toBe(true)
    expect(result.user!.userId).toBe(1)
  })

  test('authMiddleware redirects with invalid session id', async () => {
    const mw = authMiddleware()
    const result = await mw('bad-id')
    expect(result.authenticated).toBe(false)
    expect(result.redirect).toBe('/login')
  })

  test('guestMiddleware allows unauthenticated', () => {
    const mw = guestMiddleware()
    const result = mw(undefined)
    expect(result.authenticated).toBe(false)
    expect(result.redirect).toBeUndefined()
  })

  test('guestMiddleware redirects authenticated users', () => {
    const session = createSession(1)
    const mw = guestMiddleware()
    const result = mw(session.id)
    expect(result.authenticated).toBe(true)
    expect(result.redirect).toBe('/dashboard')
  })
})
