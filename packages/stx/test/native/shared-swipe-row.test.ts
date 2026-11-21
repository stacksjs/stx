import { afterEach, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

afterEach(() => {
  unmountAllNativeScreens()
  return closeBrowser()
})

const screen = `<script client>
const items = state([{ id: 'a' }, { id: 'b' }])
const picked = state('')
const busy = state(false)
</script>
<List>
  <SwipeRow :for="item in items()" :key="item.id" :testID="item.id" :disabled="busy()"
    :actions="[{ id: 'delete', label: 'Delete ' + item.id, destructive: true }]"
    @action="picked.set(item.id + ':' + $event)">
    <button type="button" @click="picked.set('opened:' + item.id)">Open</button>
  </SwipeRow>
  <button type="button" testID="busy" @click="busy.set(true)">Busy</button>
  <p testID="picked" :text="picked()"></p>
</List>`

async function fixture() {
  const root = createTempDir('stx-swipe-row-')
  const file = join(root, 'Screen.stx')
  const plugin = join(import.meta.dir, '../../../components/stx-plugin.ts')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: ${JSON.stringify([plugin])} }`)
  await Bun.write(file, screen)
  return { root, file }
}

it('reveals native actions, closes the previous keyed row, and only runs a chosen action', async () => {
  const { root, file } = await fixture()
  const { code, diagnostics } = await compileSharedScreenBundle(file, { root })
  expect(diagnostics.filter(diagnostic => diagnostic.message.includes('unread-event'))).toEqual([])
  for (const platform of ['ios', 'android'] as const) {
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    expect(phone.byTestID('a')?.props).toMatchObject({ swipeEnabled: true, swipeDirection: 'left' })
    expect(phone.byTestID('a-delete')).toBeUndefined()
    phone.press(phone.byTestID('a')!, 'onSwipe', { direction: 'left' })
    await phone.settle()
    expect(phone.byTestID('a')?.props.swipeDirection).toBe('right')
    expect(phone.byTestID('a-delete')).toBeDefined()
    expect(phone.byTestID('a')?.children[0]).toMatchObject({ style: { transform: [{ translateX: -88 }] } })
    expect(phone.byTestID('picked')?.children).not.toContain('a:delete')

    phone.press(phone.byTestID('b-actions')!)
    await phone.settle()
    expect(phone.byTestID('a-delete')).toBeUndefined()
    phone.press(phone.byTestID('b')!, 'onSwipe', { direction: 'right' })
    await phone.settle()
    expect(phone.byTestID('b-delete')).toBeUndefined()

    phone.press(phone.byTestID('b')!, 'onSwipe', { direction: 'left' })
    await phone.settle()
    phone.press(phone.byTestID('b-delete')!)
    await phone.settle()
    expect(phone.byTestID('picked')?.children).toContain('b:delete')
    expect(phone.byTestID('b-delete')).toBeUndefined()

    phone.press(phone.byTestID('a-actions')!)
    await phone.settle()
    phone.press(phone.byTestID('busy')!)
    await phone.settle()
    expect(phone.byTestID('a')?.props.swipeEnabled).toBe(false)
    expect(phone.byTestID('a-delete')).toBeUndefined()
    phone.unmount()
  }
})


it('opens from a browser button and closes with Escape', async () => {
  const { root, file } = await fixture()
  const config = await loadStxConfig(root)
  const html = await processDirectives(`<!doctype html><html><head><title>Rows</title></head><body>${screen}</body></html>`, {}, file, { ...defaultConfig, ...config, root, cache: false, autoShell: true, buildMode: undefined, debug: true }, new Set<string>())
  const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
  await settle()
  expect(browser.errors).toEqual([])
  const more = find(browser, '[testid="a-actions"]') as HTMLButtonElement
  more.click()
  await settle()
  expect(more.getAttribute('aria-expanded')).toBe('true')
  expect(find(browser, '[testid="a-delete"]').textContent?.trim()).toBe('Delete a')
  more.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settle()
  expect(more.getAttribute('aria-expanded')).toBe('false')
  expect(browser.window.document.querySelector('[testid="a-delete"]')).toBeNull()
})
