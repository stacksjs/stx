/**
 * Web storage on a native screen: `localStorage` and `sessionStorage` are
 * the web's synchronous Storage, kept in the app's storage (`craft.storage`),
 * so a store that reads its session before the first draw (a web app's auth
 * store) finds it there, every screen sees what another wrote, and
 * `keptState` keeps its values between screens and launches.
 */
import { expect, test } from 'bun:test'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { NATIVE_SESSION_RUN_KEY, NativeWebStorage, startNativeSessionRun } from '../../src/native/runtime/web-storage'
import { mountNativeScreen } from '../../src/native/testing'
import { mountWebView, webApp } from './web-view-app'

function memory(): { values: Record<string, unknown>, getSync: (key: string) => unknown, setSync: (key: string, value: unknown) => void } {
  const values: Record<string, unknown> = {}
  return {
    values,
    getSync: key => key in values ? JSON.parse(JSON.stringify(values[key])) : null,
    setSync: (key, value) => {
      if (value === null || value === undefined) delete values[key]
      else values[key] = JSON.parse(JSON.stringify(value))
    },
  }
}

test('localStorage is the web\'s Storage, kept in the app\'s storage', () => {
  const store = memory()
  const local = new NativeWebStorage(() => store, 'local:')
  expect(local.getItem('token')).toBeNull()
  local.setItem('token', 'abc')
  local.setItem('count', 3)
  expect(local.getItem('token')).toBe('abc')
  expect(local.getItem('count')).toBe('3')
  expect(local.length).toBe(2)
  expect([local.key(0), local.key(1), local.key(2)]).toEqual(['token', 'count', null])
  // What another screen reads: the app's storage holds it.
  expect(new NativeWebStorage(() => store, 'local:').getItem('token')).toBe('abc')
  local.removeItem('token')
  expect(local.getItem('token')).toBeNull()
  expect(local.length).toBe(1)
  local.clear()
  expect(local.length).toBe(0)
  expect(store.values).toEqual({})
  expect(Object.keys(local)).toEqual([])
  expect(Object.prototype.toString.call(local)).toBe('[object Storage]')
})

test('sessionStorage lasts for the app\'s run', () => {
  const store = memory()
  const craft = { storage: store }
  startNativeSessionRun(craft)
  const run = () => String(store.getSync(NATIVE_SESSION_RUN_KEY) ?? '')
  const session = new NativeWebStorage(() => store, 'session:', run)
  session.setItem('draft', 'hello')
  expect(new NativeWebStorage(() => store, 'session:', run).getItem('draft')).toBe('hello')
  expect(session.length).toBe(1)
  // The next launch: the app script starts a new run.
  startNativeSessionRun(craft)
  expect(session.getItem('draft')).toBeNull()
  expect(session.length).toBe(0)
})

test('a store reads the session a web view keeps in localStorage before the first draw', async () => {
  const root = webApp({
    'stores/auth.ts': `import { defineStore, state } from '@stacksjs/stx'

export const auth = defineStore('auth', () => {
  const token = state(sessionStorage.getItem('auth_token') ?? localStorage.getItem('auth_token'))
  function signIn(value, remember) {
    (remember ? localStorage : sessionStorage).setItem('auth_token', value)
    token.set(value)
  }
  function signOut() {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    token.set(null)
  }
  return { token, signIn, signOut }
})
`,
    'views/account.stx': `<script client>
  const auth = useStore('auth')
  const token = auth.token
  function remember() { auth.signIn('tok-2', true) }
  function out() { auth.signOut() }
</script>
<div>
  <p :text="token ? 'Signed in with ' + token : 'Signed out'">…</p>
  <button testid="remember" @click="remember()">Sign in</button>
  <button testid="out" @click="out()">Sign out</button>
</div>
`,
  })
  const screens = { Account: 'views/account.stx' }
  const phone = await mountWebView(root, screens, 'Account', { storage: { 'stx.localStorage:auth_token': 'tok-1' } })
  // Read synchronously, as the web reads it: no bridge round trip to wait for.
  expect(phone.texts()).toContain('Signed in with tok-1')
  expect(phone.natives).toEqual([])
  phone.press(phone.byTestID('remember')!)
  await phone.settle()
  expect(phone.stored['stx.localStorage:auth_token']).toBe('tok-2')
  // Another screen of the app sees it.
  const next = await mountWebView(root, screens, 'Account', { storage: phone.stored })
  expect(next.texts()).toContain('Signed in with tok-2')
  next.press(next.byTestID('out')!)
  await next.settle()
  expect(next.texts()).toContain('Signed out')
  expect(next.stored['stx.localStorage:auth_token']).toBeUndefined()
})

test('keptState keeps its value for the next screen', async () => {
  const root = webApp({
    'views/feed.stx': `<script client>
  setKeptScope('user-1')
  const filter = keptState('feed.filter', 'all')
  function runs() { filter.set('runs') }
</script>
<div>
  <p :text="'Showing ' + filter">…</p>
  <button testid="runs" @click="runs()">Runs</button>
</div>
`,
  })
  const screens = { Feed: 'views/feed.stx' }
  const phone = await mountWebView(root, screens, 'Feed')
  expect(phone.texts()).toContain('Showing all')
  phone.press(phone.byTestID('runs')!)
  await phone.settle()
  await phone.context.stx.flushKeptState()
  phone.unmount()
  const next = await mountWebView(root, screens, 'Feed', { storage: phone.stored })
  expect(next.texts()).toContain('Showing runs')
})

test('each launch\'s app script starts a new sessionStorage run', async () => {
  const root = webApp({
    'app.ts': 'export default function main() {}\n',
    'views/draft.stx': `<script client>
  const draft = state(sessionStorage.getItem('draft') ?? 'empty')
  function keep() { sessionStorage.setItem('draft', 'kept'); draft.set('kept') }
</script>
<div><p :text="draft">…</p><button testid="keep" @click="keep()">Keep</button></div>
`,
  })
  const { code } = await compileNativeBundle({ root, screens: { Draft: 'views/draft.stx' }, app: 'app.ts' })
  const launch = (storage: Record<string, unknown>) => mountNativeScreen(code, '__app', { storage })
  const first = launch({})
  await first.settle()
  const screen = mountNativeScreen(code, 'Draft', { storage: first.stored })
  await screen.settle()
  screen.press(screen.byTestID('keep')!)
  await screen.settle()
  // Another screen of the same run reads it.
  const same = mountNativeScreen(code, 'Draft', { storage: screen.stored })
  await same.settle()
  expect(same.texts()).toContain('kept')
  // The app quit and launched again: its app script runs once more.
  const relaunch = launch(screen.stored)
  await relaunch.settle()
  const after = mountNativeScreen(code, 'Draft', { storage: relaunch.stored })
  await after.settle()
  expect(after.texts()).toContain('empty')
})
