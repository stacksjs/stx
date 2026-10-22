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

/** HQ's auth store, as far as its storage goes: remembered or this visit only, and another screen's sign-in heard. */
const SHARED_AUTH = {
  'stores/auth.ts': `import { defineStore, state } from '@stacksjs/stx'

export const auth = defineStore('auth', () => {
  const read = () => sessionStorage.getItem('auth_token') ?? localStorage.getItem('auth_token')
  const token = state(read())
  const heard = state(0)
  function signIn(value, remember) {
    ;(remember ? localStorage : sessionStorage).setItem('auth_token', value)
    ;(remember ? sessionStorage : localStorage).removeItem('auth_token')
    token.set(value)
  }
  function signOut() {
    sessionStorage.removeItem('auth_token')
    localStorage.removeItem('auth_token')
    token.set(null)
  }
  window.addEventListener('craftsharedstorage', (event) => {
    if (event.detail.key !== 'auth_token') return
    heard.set(heard() + 1)
    token.set(read())
  })
  return { token, heard, signIn, signOut }
})
`,
  'views/account.stx': `<script client>
  const auth = useStore('auth')
  const token = auth.token
  const heard = auth.heard
  function remember() { auth.signIn('tok-web', true) }
  function visit() { auth.signIn('tok-visit', false) }
  function out() { auth.signOut() }
</script>
<div>
  <p :text="token ? 'Signed in with ' + token : 'Signed out'">…</p>
  <p :text="'Heard ' + heard">…</p>
  <button testid="remember" @click="remember()">Sign in</button>
  <button testid="visit" @click="visit()">Sign in for this visit</button>
  <button testid="out" @click="out()">Sign out</button>
</div>
`,
}
const SHARED = { auth_token: 'auth.token' }

test('a shared key is the Keychain item: a web view\'s sign-in is craft.session\'s', async () => {
  const root = webApp(SHARED_AUTH)
  const screens = { Account: 'views/account.stx' }
  const phone = await mountWebView(root, screens, 'Account', { capabilities: ['secureStorage'] }, { shareStorage: SHARED })
  expect(phone.texts()).toContain('Signed out')
  phone.press(phone.byTestID('remember')!)
  await phone.settle()
  expect(phone.secureStorage['auth.token']).toBe('tok-web')
  expect(phone.context.craft.session.token()).toBe('tok-web')
  // Held for this visit: sessionStorage has it and localStorage is cleared,
  // which must not take it out of the Keychain.
  phone.press(phone.byTestID('visit')!)
  await phone.settle()
  expect(phone.secureStorage['auth.token']).toBe('tok-visit')
  phone.press(phone.byTestID('out')!)
  await phone.settle()
  expect(phone.secureStorage['auth.token']).toBeUndefined()
  // The web view's own writes are not announced back to it.
  expect(phone.texts()).toContain('Heard 0')
})

test('a native sign-in is the web view\'s, at once and on its next draw', async () => {
  const root = webApp(SHARED_AUTH)
  const screens = { Account: 'views/account.stx' }
  // Signed in natively before the web view opened: read on its first draw.
  const opened = await mountWebView(root, screens, 'Account', { capabilities: ['secureStorage'], secureStorage: { 'auth.token': 'tok-native' } }, { shareStorage: SHARED })
  expect(opened.texts()).toContain('Signed in with tok-native')
  expect(opened.natives).toEqual([])
  // Another screen signs out, then in as someone else, while it is open.
  opened.setSessionToken(null)
  await opened.settle()
  expect(opened.texts()).toContain('Signed out')
  opened.setSessionToken('tok-other')
  await opened.settle()
  expect(opened.texts()).toContain('Signed in with tok-other')
  expect(opened.texts()).toContain('Heard 2')
  expect(opened.stored['stx.localStorage:auth_token']).toBe('tok-other')
})

test('the host can name the shared keys itself', async () => {
  const root = webApp(SHARED_AUTH)
  const phone = await mountWebView(root, { Account: 'views/account.stx' }, 'Account', { capabilities: ['secureStorage'], shareStorage: SHARED })
  phone.press(phone.byTestID('remember')!)
  await phone.settle()
  expect(phone.secureStorage['auth.token']).toBe('tok-web')
})

test('a key is not shared on a host without secure storage', async () => {
  const root = webApp(SHARED_AUTH)
  const phone = await mountWebView(root, { Account: 'views/account.stx' }, 'Account', {}, { shareStorage: SHARED })
  phone.press(phone.byTestID('remember')!)
  await phone.settle()
  expect(phone.texts()).toContain('Signed in with tok-web')
  expect(phone.stored['stx.localStorage:auth_token']).toBe('tok-web')
  expect(phone.secureStorage['auth.token']).toBeUndefined()
})
