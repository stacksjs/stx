import { expect, test } from 'bun:test'
import { NativeWebStorage } from '../../src/native/runtime/web-storage'

function nativeStore() {
  const values = new Map<string, unknown>()
  return {
    values,
    getSync(key: string) {
      if (key.includes('\0') || key.length > 512) throw new Error('Invalid native key')
      return values.get(key) ?? null
    },
    setSync(key: string, value: unknown) {
      if (key.includes('\0') || key.length > 512) throw new Error('Invalid native key')
      if (value === null) values.delete(key)
      else values.set(key, JSON.parse(JSON.stringify(value)))
    },
  }
}

test('web storage works with native key constraints without reserving any user key', () => {
  const store = nativeStore()
  const local = new NativeWebStorage(() => store, 'stx.localStorage:')
  const keys = ['auth_token', '\0keys', '', '__proto__', 'keys', 'values', 'x'.repeat(1024)]
  for (const [index, key] of keys.entries()) local.setItem(key, `value-${index}`)
  const reopened = new NativeWebStorage(() => store, 'stx.localStorage:')
  expect(reopened.length).toBe(keys.length)
  for (const [index, key] of keys.entries()) {
    expect(reopened.key(index)).toBe(key)
    expect(reopened.getItem(key)).toBe(`value-${index}`)
  }
  expect(store.values.get('stx.localStorage:auth_token')).toBe('value-0')
  reopened.removeItem('\0keys')
  expect(reopened.getItem('\0keys')).toBeNull()
  expect(reopened.length).toBe(keys.length - 1)
  reopened.clear()
  expect(reopened.length).toBe(0)
  expect(store.values.size).toBe(0)
})

test('legacy indexes migrate without losing existing normal values', () => {
  const values = new Map<string, unknown>([['local:\0keys', ['token']], ['local:token', 'old']])
  const store = { getSync: (key: string) => values.get(key) ?? null, setSync: (key: string, value: unknown) => { if (value === null) values.delete(key); else values.set(key, value) } }
  const local = new NativeWebStorage(() => store, 'local:')
  expect(local.length).toBe(1)
  local.setItem('other', 'new')
  expect(local.getItem('token')).toBe('old')
  expect([local.key(0), local.key(1)]).toEqual(['token', 'other'])
  local.clear()
  expect(local.length).toBe(0)
  expect(values.size).toBe(0)
})
