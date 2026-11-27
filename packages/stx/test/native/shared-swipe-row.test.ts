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

type Phone = ReturnType<typeof mountNativeScreen>
/** The tray of a row's actions: the parent of its first action button. */
function tray(phone: Phone, id: string) {
  const action = phone.byTestID(`${id}-delete`)!
  return phone.all().find(node => node.children.includes(action))!
}
/** Whether a row's actions can be reached: shown to assistive tech and touch. */
function reachable(phone: Phone, id: string): boolean {
  const node = tray(phone, id)
  return node.props['aria-hidden'] === 'false' && node.props.pointerEvents === 'auto'
}
/** The view that slides: the parent of the tray. */
function slider(phone: Phone, id: string) {
  const node = tray(phone, id)
  return phone.all().find(candidate => candidate.children.includes(node))!
}

it('slides native actions in from behind the edge, closes the previous keyed row, and only runs a chosen action', async () => {
  const { root, file } = await fixture()
  const { code, diagnostics } = await compileSharedScreenBundle(file, { root })
  expect(diagnostics.filter(diagnostic => diagnostic.message.includes('unread-event'))).toEqual([])
  for (const platform of ['ios', 'android'] as const) {
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    expect(phone.byTestID('a')?.props).toMatchObject({ swipeEnabled: true, swipeDirection: 'left' })
    // Rendered from the start, just past the trailing edge, and out of reach.
    expect(phone.byTestID('a-delete')).toBeDefined()
    expect(tray(phone, 'a').style).toMatchObject({ right: -88, width: 88 })
    expect(reachable(phone, 'a')).toBe(false)
    expect(slider(phone, 'a').props.swipeReveal).toBe(0)

    phone.press(phone.byTestID('a')!, 'onSwipe', { direction: 'left' })
    await phone.settle()
    expect(phone.byTestID('a')?.props.swipeDirection).toBe('right')
    expect(reachable(phone, 'a')).toBe(true)
    expect(slider(phone, 'a').style).toMatchObject({ transform: [{ translateX: -88 }] })
    expect(phone.byTestID('picked')?.children).not.toContain('a:delete')

    phone.press(phone.byTestID('b-actions')!)
    await phone.settle()
    expect(reachable(phone, 'a')).toBe(false)
    expect(reachable(phone, 'b')).toBe(true)
    phone.press(phone.byTestID('b')!, 'onSwipe', { direction: 'right' })
    await phone.settle()
    expect(reachable(phone, 'b')).toBe(false)

    phone.press(phone.byTestID('b')!, 'onSwipe', { direction: 'left' })
    await phone.settle()
    phone.press(phone.byTestID('b-delete')!)
    await phone.settle()
    expect(phone.byTestID('picked')?.children).toContain('b:delete')
    expect(reachable(phone, 'b')).toBe(false)

    phone.press(phone.byTestID('a-actions')!)
    await phone.settle()
    phone.press(phone.byTestID('busy')!)
    await phone.settle()
    expect(phone.byTestID('a')?.props.swipeEnabled).toBe(false)
    expect(reachable(phone, 'a')).toBe(false)
    phone.unmount()
  }
})

it('hands the pan to a host that drives it, and follows where it settles', async () => {
  const { root, file } = await fixture()
  const { code } = await compileSharedScreenBundle(file, { root })
  const phone = mountNativeScreen(code, 'Screen', { capabilities: ['interactiveSwipe'] })
  await phone.settle()
  // The host owns the slide: no discrete swipe, no transform from stx.
  expect(phone.byTestID('a')?.props.swipeEnabled).toBe(false)
  expect(slider(phone, 'a').props).toMatchObject({ swipeReveal: 88, swipeOpen: false })
  expect(slider(phone, 'a').style.transform).toBeUndefined()

  phone.press(slider(phone, 'a'), 'onSwipeSettle', { open: true })
  await phone.settle()
  expect(slider(phone, 'a').props.swipeOpen).toBe(true)
  expect(reachable(phone, 'a')).toBe(true)
  expect(phone.byTestID('a-actions')?.props['aria-expanded']).toBe('true')

  // Opening another row asks the host to close this one, animated by the host.
  phone.press(phone.byTestID('b-actions')!)
  await phone.settle()
  expect(slider(phone, 'a').props.swipeOpen).toBe(false)
  expect(slider(phone, 'b').props.swipeOpen).toBe(true)

  phone.press(slider(phone, 'b'), 'onSwipeSettle', { open: false })
  await phone.settle()
  expect(slider(phone, 'b').props.swipeOpen).toBe(false)
  expect(reachable(phone, 'b')).toBe(false)

  phone.press(phone.byTestID('busy')!)
  await phone.settle()
  expect(slider(phone, 'a').props.swipeReveal).toBe(0)
  phone.unmount()
})

it('opens from a browser button, slides with a transition, and closes with Escape', async () => {
  const { root, file } = await fixture()
  const config = await loadStxConfig(root)
  const html = await processDirectives(`<!doctype html><html><head><title>Rows</title></head><body>${screen}</body></html>`, {}, file, { ...defaultConfig, ...config, root, cache: false, autoShell: true, buildMode: undefined, debug: true }, new Set<string>())
  const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
  await settle()
  expect(browser.errors).toEqual([])
  const more = find(browser, '[testid="a-actions"]') as HTMLButtonElement
  const action = find(browser, '[testid="a-delete"]') as HTMLButtonElement
  const actionTray = action.parentElement!
  const sliding = actionTray.parentElement!
  // Present from the start, out of reach until open.
  expect(action.textContent?.trim()).toBe('Delete a')
  expect(actionTray.getAttribute('aria-hidden')).toBe('true')
  expect(actionTray.className).toContain('pointer-events-none')
  expect(action.getAttribute('tabindex')).toBe('-1')
  expect(sliding.style.transition).toBe('transform 250ms ease-out')
  expect(sliding.style.touchAction).toBe('pan-y')

  more.click()
  await settle()
  expect(more.getAttribute('aria-expanded')).toBe('true')
  expect(sliding.style.transform).toBe('translateX(-88px)')
  expect(actionTray.getAttribute('aria-hidden')).toBe('false')
  expect(action.getAttribute('tabindex')).toBe('0')
  more.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settle()
  expect(more.getAttribute('aria-expanded')).toBe('false')
  expect(sliding.style.transform).toBe('translateX(0px)')
  expect(actionTray.getAttribute('aria-hidden')).toBe('true')
})
