import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

/**
 * An event handler reads the names it mentions and no others. It used to read,
 * regex-test and declare every name in its scope on each event: on a screen
 * with a few hundred names that was most of the cost of a hover.
 */
describe('an event handler on a screen with many names', () => {
  it('reads only what it mentions, and still writes signals it assigns', async () => {
    const names = Array.from({ length: 200 }, (_, i) => `const unrelated${i} = state(${i})`).join('\n')
    const { code } = await compileNativeScreen(`<script client>
${names}
const count = state(0)
const open = state(false)
// Signal-shaped, so a handler that unwraps every signal in scope calls it.
const watched = Object.assign(() => { window.reads = (window.reads || 0) + 1; return 1 }, { _isSignal: true })
window.probe = { count, open }
</script>
<View>
  <Pressable testID="bump" @press="count.set(count() + 1)"><Text>{{ 'count ' + count() }}</Text></Pressable>
  <Pressable testID="flip" @press="open = !open"><Text>{{ open() ? 'open' : 'shut' }}</Text></Pressable>
</View>`)
    const screen = mountNativeScreen(code, 'Screen')
    await screen.settle()
    const before = screen.context.reads ?? 0
    for (let i = 0; i < 5; i++) screen.press(screen.byTestID('bump')!)
    screen.press(screen.byTestID('flip')!)
    await screen.settle()
    expect(screen.context.probe.count()).toBe(5)
    expect(screen.context.probe.open()).toBe(true)
    expect(screen.texts()).toEqual(expect.arrayContaining(['count 5', 'open']))
    expect((screen.context.reads ?? 0) - before).toBe(0)
  })
})
