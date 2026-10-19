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
