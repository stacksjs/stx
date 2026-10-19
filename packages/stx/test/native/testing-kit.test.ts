/**
 * The native screen test kit (`@stacksjs/stx/native/testing`): a compiled
 * screen in a vm phone, the API it reads, the host it asks, and a screen that
 * stops completely when it is unmounted.
 */
import { describe, expect, it } from 'bun:test'
import type { NativeScreen } from '../../src/native/testing'
import { compileNativeScreen, mountNativeScreen, status } from '../../src/native/testing'

const SCREEN = `<script client>
const items = state([])
const typed = state('')
const problem = state('')
const kept = state('')
async function load() {
  try {
    const response = await fetch('https://fixture.invalid/api/items?page=1', { headers: { Authorization: 'Bearer ' + (craft.secureStorage.getSync('auth.token') || '') } })
    const body = await response.json()
    if (!response.ok) { problem.set('status ' + response.status); return }
    problem.set('')
    items.set(body.items)
  }
  catch (error) { problem.set('offline') }
}
async function keep() {
  await craft.secureStorage.set('note', typed())
  kept.set('kept')
}
onMount(() => {
  load()
  setInterval(() => { globalThis.__ticks = (globalThis.__ticks || 0) + 1 }, 5)
})
</script>
<View>
  <Text testID="count" :text="'items ' + items().length" />
  <Text testID="problem" :text="problem()" />
  <TextInput testID="field" :value="typed" @input="typed.set($event.text)" />
  <Text testID="typed" :text="typed()" />
  <Text testID="kept" :text="kept()" />
  <View testID="reload" @click="load()" />
  <View testID="keep" @click="keep()" />
</View>`

let compiled: Promise<{ code: string }> | null = null
const screen = () => (compiled ||= compileNativeScreen(SCREEN, { name: 'Kit' }))

const text = (phone: NativeScreen, id: string) =>
  (phone.byTestID(id)?.children.filter(child => typeof child === 'string') ?? []).join('')

describe('mountNativeScreen', () => {
  it('native host contract: keeps navigation buttons across partial option updates', () => {
    const phone = mountNativeScreen('', 'Navigation')
    const navigation = phone.context.craft.navigation
    navigation.setOptions({ rightButtons: [{ id: 'done', title: 'Done' }] })
    navigation.setOptions({ title: 'Workout' })
    expect(phone.barButtons()).toEqual(['done'])
    expect(() => phone.tapBar('done')).not.toThrow()
    navigation.setOptions({ rightButtons: [] })
    expect(phone.barButtons()).toEqual([])
    expect(() => phone.tapBar('done')).toThrow('no bar button done')
  })

  it('native host contract: observes synchronous reads without changing their values', () => {
    const reads: Array<[string, string]> = []
    const phone = mountNativeScreen('', 'HostReads', {
      secureStorage: { token: 'signed-in' }, storage: { setting: 'metric' }, snapshots: { profile: { name: 'Athlete' } },
      onHostRead: (namespace, key) => reads.push([namespace, key]),
    })
    const host = phone.context.craft
    expect(host.secureStorage.getSync('token')).toBe('signed-in')
    expect(host.storage.getSync('setting')).toBe('metric')
    expect(host.snapshots.get('profile')).toEqual({ name: 'Athlete' })
    expect(reads).toEqual([['secureStorage', 'token'], ['storage', 'setting'], ['snapshots', 'profile']])
  })

  it('native host contract: ignores a native write finishing after unmount', async () => {
    const entered = Promise.withResolvers<void>()
    const finish = Promise.withResolvers<boolean>()
    const phone = mountNativeScreen('', 'DelayedWrite', {
      native: () => { entered.resolve(); return finish.promise },
    })
    phone.context.__stxNativeBridge.postMessage(JSON.stringify({
      id: 'late-write', type: 'API_REQUEST', payload: { module: 'SecureStorage', method: 'set', args: ['note', 'late result'] },
    }))
    await entered.promise
    phone.unmount()
    finish.resolve(true)
    await Bun.sleep(10)
    expect(phone.secureStorage.note).toBeUndefined()
  })

  it('answers the API by path below apiBase and records each request', async () => {
    const phone = mountNativeScreen((await screen()).code, 'Kit', {
      apiBase: 'https://fixture.invalid/api',
      api: path => path === '/items?page=1' ? { items: [1, 2, 3] } : undefined,
      secureStorage: { 'auth.token': 'fixture-token' },
    })
    await phone.waitFor(() => text(phone, 'count') === 'items 3', 'the items')
    expect(phone.requests).toEqual(['GET /items?page=1'])
    expect(phone.headers[0]).toEqual({ Authorization: 'Bearer fixture-token' })
    expect(phone.messages.some(message => message.type === 'RENDER')).toBe(true)
  })

  it('answers with another status, and fails every request while offline', async () => {
    let answer: unknown = status(403, { error: 'no' })
    const phone = mountNativeScreen((await screen()).code, 'Kit', { apiBase: 'https://fixture.invalid/api', api: () => answer })
    await phone.waitFor(() => text(phone, 'problem') === 'status 403', 'the refusal')
    phone.setOnline(false)
    answer = { items: [1] }
    phone.press(phone.byTestID('reload')!)
    await phone.waitFor(() => text(phone, 'problem') === 'offline', 'no network')
    phone.setOnline(true)
    phone.press(phone.byTestID('reload')!)
    await phone.waitFor(() => text(phone, 'count') === 'items 1', 'back online')
  })

  it('types into a text input', async () => {
    const phone = mountNativeScreen((await screen()).code, 'Kit')
    await phone.settle()
    phone.type(phone.byTestID('field')!, 'hello')
    await phone.waitFor(() => text(phone, 'typed') === 'hello', 'the typed text')
  })

  it('keeps what the screen stores in the keychain through the host', async () => {
    const phone = mountNativeScreen((await screen()).code, 'Kit', { capabilities: ['secureStorage'] })
    await phone.settle()
    phone.type(phone.byTestID('field')!, 'remember me')
    await phone.settle(10)
    phone.press(phone.byTestID('keep')!)
    await phone.waitFor(() => text(phone, 'kept') === 'kept', 'the keychain write')
    expect(phone.secureStorage.note).toBe('remember me')
    expect(phone.natives).toContain('SecureStorage.set')
  })

  it('stops the screen completely on unmount: no timer, no request, no message', async () => {
    const phone = mountNativeScreen((await screen()).code, 'Kit', { api: () => ({ items: [] }) })
    await phone.waitFor(() => (phone.context.__ticks || 0) > 1, 'the interval')
    phone.unmount()
    expect(phone.ended).toBe(true)
    const ticks = phone.context.__ticks
    const requests = phone.requests.length
    await Bun.sleep(30)
    expect(phone.context.__ticks).toBe(ticks)
    // A press after the end reaches nothing.
    phone.press(phone.byTestID('reload')!)
    await Bun.sleep(20)
    expect(phone.requests.length).toBe(requests)
  })

  it('tells the screen what the host would: app state, focus, params, snapshots', async () => {
    const phone = mountNativeScreen((await screen()).code, 'Kit', { snapshots: { header: { name: 'A' } } })
    await phone.settle()
    expect(() => {
      phone.background()
      phone.resume()
      phone.disappear()
      phone.appear()
      phone.newParams({ id: 1 })
      phone.keepSnapshot('header', { name: 'B' })
      phone.craftEvent('craftPushToken', { token: 't' })
    }).not.toThrow()
    expect(phone.snapshots.header).toEqual({ name: 'B' })
    phone.keepSnapshot('header', null)
    expect(phone.snapshots.header).toBeUndefined()
  })
})

const SESSION_SCREEN = `<script client>
const heard = state([])
onMount(() => craft.session.onChange((token, previous) => heard.set([...heard(), (token || '-') + '<' + (previous || '-')])))
async function signOut() { await craft.secureStorage.remove('auth.token') }
</script>
<View>
  <Text testID="heard" :text="heard().join(' ')" />
  <View testID="out" @click="signOut()" />
</View>`

describe('the signed-in account', () => {
  it('advertises session events only on the host that can deliver them', async () => {
    const { code } = await compileNativeScreen(SESSION_SCREEN, { name: 'Session' })
    const current = mountNativeScreen(code, 'Session')
    const old = mountNativeScreen(code, 'Session', { sessionEvents: false })
    expect(current.context.craft.session.supportsEvents).toBe(true)
    expect(old.context.craft.session.supportsEvents).toBe(false)
    current.unmount()
    old.unmount()
  })

  it('reports token changes as craft.session events, from the host or from a write on the screen', async () => {
    const { code } = await compileNativeScreen(SESSION_SCREEN, { name: 'Session' })
    const phone = mountNativeScreen(code, 'Session', { secureStorage: { 'auth.token': 'a' } })
    await phone.settle()
    phone.setSessionToken('b')
    phone.setSessionToken('b')
    phone.press(phone.byTestID('out')!)
    await phone.waitFor(() => text(phone, 'heard') === 'b<a -<b', 'both changes heard')
    expect(phone.secureStorage['auth.token']).toBeUndefined()
    phone.unmount()
  })

  it('is silent on a host older than Craft 0.0.245', async () => {
    const { code } = await compileNativeScreen(SESSION_SCREEN, { name: 'Session' })
    const phone = mountNativeScreen(code, 'Session', { secureStorage: { 'auth.token': 'a' }, sessionEvents: false })
    await phone.settle()
    phone.setSessionToken('b')
    await phone.settle()
    expect(text(phone, 'heard')).toBe('')
    expect(phone.secureStorage['auth.token']).toBe('b')
    phone.unmount()
  })
})
