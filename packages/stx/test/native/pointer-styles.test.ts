/**
 * A Mac has a pointer: `hover:` and `active:` classes travel with the node for
 * the AppKit host to apply as the pointer moves, with the time a `transition`
 * animates over. A phone gets neither.
 */
import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const source = `<script client>const selected = state(false); window.probe = { selected }</script>
<View testID="row" :class="selected() ? 'bg-white/70 rounded-lg' : 'hover:bg-white/40 active:opacity-70 dark:hover:bg-black/40 transition duration-100 rounded-lg'"><Text>Tab</Text></View>`

it('ships hover and press layers, and the transition, to a Mac', async () => {
  const { code, diagnostics } = await compileNativeScreen(source)
  expect(diagnostics.filter(d => d.message.includes('unknown-class'))).toEqual([])
  const mac = mountNativeScreen(code, 'Main', { platform: 'macos' })
  await mac.settle()
  const row = () => mac.byTestID('row')!
  expect(row().style.transitionDuration).toBe(100)
  expect(row().style.hoverStyle).toMatchObject({ backgroundColor: expect.stringMatching(/^#ffffff/i) })
  expect(row().style.pressStyle).toMatchObject({ opacity: 0.7 })
  mac.appearance('dark')
  await mac.settle()
  expect(row().style.hoverStyle).toMatchObject({ backgroundColor: expect.stringMatching(/^#000000/i) })
  // A class change that drops the layers drops them from the host too.
  mac.context.probe.selected.set(true)
  await mac.settle()
  // A removed style key travels as null.
  expect(row().style.hoverStyle ?? undefined).toBeUndefined()
  expect(row().style.transitionDuration ?? undefined).toBeUndefined()
  mac.unmount?.()
})

it('sends a phone neither', async () => {
  const { code } = await compileNativeScreen(source)
  const phone = mountNativeScreen(code)
  await phone.settle()
  expect(phone.byTestID('row')!.style.hoverStyle).toBeUndefined()
  expect(phone.byTestID('row')!.style.transitionDuration).toBeUndefined()
  phone.unmount?.()
})
