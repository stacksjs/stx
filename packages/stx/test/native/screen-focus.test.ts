/**
 * A screen the host prepares out of sight starts unfocused.
 *
 * Craft's iOS shell makes the tab next to the current one ahead of a swipe,
 * hidden. Its script used to assume it was in front until told otherwise, and
 * the host's "hidden" could arrive before there was a script to hear it, so a
 * prepared Record tab ran its sign-in guard and pushed Login over the Feed at
 * launch. The host now sets `__stxNativeFocused = false` before the script
 * runs, and the bridge starts from it.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

afterEach(unmountAllNativeScreens)

const SCREEN = `<script client>
const seen = state([])
onMount(() => {
  seen.set([...seen(), 'mount:' + craft.navigation.isFocused()])
  craft.navigation.onAppear(() => seen.set([...seen(), 'appear:' + craft.navigation.isFocused()]))
})
window.probe = { seen }
</script><View><Text :text="seen().join(' ')" /></View>`

describe('screen focus at mount', () => {
  it('starts unfocused when the host prepared the screen hidden, and hears the showing', async () => {
    const { code } = await compileNativeScreen(SCREEN, { name: 'Prepared' })
    const phone = mountNativeScreen(code, 'Prepared', { globals: { __stxNativeFocused: false } })
    await phone.settle()
    expect(phone.context.probe.seen()).toEqual(['mount:false'])
    phone.appear()
    await phone.settle()
    expect(phone.context.probe.seen()).toEqual(['mount:false', 'appear:true'])
  })

  it('starts focused when the host said nothing', async () => {
    const { code } = await compileNativeScreen(SCREEN, { name: 'Shown' })
    const phone = mountNativeScreen(code, 'Shown')
    await phone.settle()
    expect(phone.context.probe.seen()).toEqual(['mount:true'])
  })
})
