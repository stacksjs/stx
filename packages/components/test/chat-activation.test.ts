import { afterEach, expect, test } from 'bun:test'
import { join } from 'node:path'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

afterEach(closeBrowser)

test('an inbox refreshes on activation without subscribing to transport state', async () => {
  const chatRoot = join(import.meta.dir, '../src/ui/chat')
  const fixture = `
import { createChat } from '${join(chatRoot, 'controller.ts')}'
const account = state({ id: 1, tenant: 1, name: 'Before refresh' })
let reads = 0
defineStore('chat', () => createChat({
  selfId: () => account().id,
  scopeKey: () => account().id + ':' + account().tenant,
  request: async () => {
    reads++
    return Response.json({ contacts: [], conversations: [], max_length: 4000 })
  },
}))
window.probe = { account, reads: () => reads }
`
  const component = (await Bun.file(join(chatRoot, 'ChatInbox.stx')).text()).replace('const chat = useStore', `${fixture}\nconst chat = useStore`)
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/ChatInbox.stx': component,
    'components/contact-link.ts': await Bun.file(join(chatRoot, 'contact-link.ts')).text(),
    'components/Avatar.stx': '<span></span>',
    'pages/index.stx': page('app', `<script client>
const active = state(true)
onMount(() => { window.probe.active = active })
</script><ChatInbox :active="active" />`),
  }, { '/': 'pages/index.stx' })
  try {
    const browser = await boot(app, '/')
    await settle()
    const probe = browser.window.probe
    const initial = probe.reads()
    expect(initial).toBe(1)
    probe.account.set({ id: 1, tenant: 1, name: 'Refreshed profile' })
    await settle()
    expect(probe.reads()).toBe(initial)
    probe.active.set(false)
    await settle()
    expect(probe.reads()).toBe(initial)
    probe.active.set(true)
    await settle()
    expect(probe.reads()).toBe(initial + 1)
    probe.account.set({ id: 1, tenant: 2, name: 'Another workspace' })
    await settle()
    expect(probe.reads()).toBe(initial + 2)
    probe.account.set({ id: 2, tenant: 2, name: 'Another person' })
    await settle()
    expect(probe.reads()).toBe(initial + 3)
    Object.defineProperty(browser.document, 'visibilityState', { value: 'hidden', configurable: true })
    browser.document.dispatchEvent(new browser.window.Event('visibilitychange'))
    await settle()
    probe.account.set({ id: 2, tenant: 3, name: 'Hidden workspace change' })
    await settle()
    expect(probe.reads()).toBe(initial + 3)
    Object.defineProperty(browser.document, 'visibilityState', { value: 'visible', configurable: true })
    browser.document.dispatchEvent(new browser.window.Event('visibilitychange'))
    await settle()
    expect(probe.reads()).toBe(initial + 4)
    expect(browser.errors).toEqual([])
  }
  finally { await app.dispose() }
})
