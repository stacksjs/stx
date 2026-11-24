/**
 * A screen that must not be taken out of its stack (Craft 0.0.539
 * `preventRemove`): an upload that leaving would cancel, or a session whose
 * close has to save or discard what it holds. Craft refuses every removal
 * while the option is set and tells the screen with `REMOVE_BLOCKED
 * { id, action }`; the screen lets one happen with `NAVIGATE_PROCEED { id }`.
 * The bridge hands the refusal to `navigation.onRemoveBlocked` and sends the
 * proceed, and the test kit refuses as Craft does.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

afterEach(unmountAllNativeScreens)

const SCREEN = `<script client>
const heard = state([])
let release = true
onMount(() => {
  craft.navigation.setOptions({ preventRemove: true })
  return craft.navigation.onRemoveBlocked((removal) => {
    heard.set([...heard(), removal.action])
    if (release) craft.navigation.proceed(removal.id)
  })
})
function hold() { release = false }
function leave() { craft.navigation.back() }
function done() { craft.navigation.setOptions({ preventRemove: false }); craft.navigation.back() }
window.probe = { heard, hold, leave, done }
</script><View><Text :text="heard().join(' ')" /></View>`

async function mounted() {
  const { code } = await compileNativeScreen(SCREEN, { name: 'Busy' })
  const phone = mountNativeScreen(code, 'Busy')
  await phone.settle()
  return phone
}

describe('preventRemove', () => {
  it('sends the option to the host', async () => {
    const phone = await mounted()
    expect(phone.bars).toContainEqual({ preventRemove: true })
  })

  it('hears a cover\'s own close refused, and closes it by proceeding', async () => {
    const phone = await mounted()
    phone.hostRemoves('closeCover')
    await phone.settle()
    expect(phone.refused.map(removal => removal.action)).toEqual(['closeCover'])
    expect(phone.context.probe.heard()).toEqual(['closeCover'])
    expect(phone.messages.find(message => message.type === 'NAVIGATE_PROCEED')?.payload).toEqual({ id: phone.refused[0]!.id })
    expect(phone.moves).toEqual(['close'])
  })

  it('keeps the screen when it does not proceed', async () => {
    const phone = await mounted()
    phone.context.probe.hold()
    phone.hostRemoves('back')
    phone.hostRemoves('tabReselect')
    await phone.settle()
    expect(phone.context.probe.heard()).toEqual(['back', 'tabReselect'])
    expect(phone.moves).toEqual([])
  })

  it('refuses the screen\'s own Back too, until it clears the option', async () => {
    const phone = await mounted()
    phone.context.probe.hold()
    phone.context.probe.leave()
    await phone.settle()
    expect(phone.context.probe.heard()).toEqual(['back'])
    expect(phone.moves).toEqual([])
    phone.context.probe.done()
    await phone.settle()
    expect(phone.moves).toEqual(['back'])
    expect(phone.refused).toHaveLength(1)
  })

  it('carries through only the latest refusal, and none from before the option was cleared', async () => {
    const phone = await mounted()
    phone.context.probe.hold()
    phone.hostRemoves('back')
    phone.hostRemoves('closeCover')
    await phone.settle()
    const [first, latest] = phone.refused
    phone.context.craft.navigation.proceed(first!.id)
    await phone.settle()
    expect(phone.moves).toEqual([])
    phone.context.craft.navigation.setOptions({ preventRemove: false })
    phone.context.craft.navigation.setOptions({ preventRemove: true })
    phone.context.craft.navigation.proceed(latest!.id)
    await phone.settle()
    expect(phone.moves).toEqual([])
  })

  it('refuses a cover\'s own Back as closing the cover, and closes it on proceed', async () => {
    const { code } = await compileNativeScreen(SCREEN, { name: 'Cover' })
    const phone = mountNativeScreen(code, 'Cover', { cover: true })
    await phone.settle()
    phone.context.probe.leave()
    await phone.settle()
    expect(phone.context.probe.heard()).toEqual(['closeCover'])
    expect(phone.moves).toEqual(['close'])
  })

  it('keeps the guard when the option is sent unset or null, as iOS does', async () => {
    const phone = await mounted()
    phone.context.probe.hold()
    phone.context.craft.navigation.setOptions({ preventRemove: undefined })
    phone.context.craft.navigation.setOptions({ preventRemove: null })
    phone.hostRemoves('closeCover')
    await phone.settle()
    expect(phone.context.probe.heard()).toEqual(['closeCover'])
    expect(phone.moves).toEqual([])
  })

  it('lets the host remove a screen that does not prevent it', async () => {
    const { code } = await compileNativeScreen('<View><Text>Free</Text></View>', { name: 'Free' })
    const phone = mountNativeScreen(code, 'Free')
    await phone.settle()
    phone.hostRemoves('closeCover')
    expect(phone.moves).toEqual(['close'])
    expect(phone.refused).toEqual([])
  })

  it('asks for a function and an id', async () => {
    const phone = await mounted()
    expect(() => phone.context.craft.navigation.onRemoveBlocked(null)).toThrow('navigation.onRemoveBlocked needs a function')
    expect(() => phone.context.craft.navigation.proceed('')).toThrow('navigation.proceed needs the id of a refused removal')
  })
})
