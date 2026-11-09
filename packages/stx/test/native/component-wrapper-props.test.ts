import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

describe('an object-valued reactive prop', () => {
  it('reaches the component typed, with its identity, and skips the attribute parse', async () => {
    const root = createTempDir('stx-object-prop-')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    // `parse` returns a marker it could never legitimately produce, so any
    // appearance of it proves the value took the attribute path instead.
    await Bun.write(path.join(root, 'components', 'Payload.stx'), `<script client>
const payload = useReactiveProp('payload', null, { parse: () => 'PARSE_RAN' })
const shown = derived(() => {
  const value = payload()
  window.probeSeen = value
  if (value && typeof value === 'object') return 'object:' + String(value.uri ?? '')
  return 'raw:' + String(value)
})
</script><Text testID="payload">{{ shown() }}</Text>`)
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const current = state({ uri: '/a.png' })
window.probe = { current }
</script><View><Payload :payload="current()" /></View>`)
    const { code } = await compileSharedScreenBundle(file, { root })
    const screen = mountNativeScreen(code, 'Screen')
    try {
      await screen.settle()
      const shown = (): string => screen.texts().join('|')
      // A parent binding hands over the caller's evaluated value, so the
      // object stays an object and `parse` never sees it. Reading it with
      // String() is what gave the shared Image the URL "[object Object]".
      expect(shown()).toBe('object:/a.png')
      expect(screen.context.probeSeen).toBe(screen.context.probe.current())
      // A replacement payload is followed, by value and by identity.
      const next = { uri: '/b.png' }
      screen.context.probe.current.set(next)
      await screen.settle()
      expect(shown()).toBe('object:/b.png')
      expect(screen.context.probeSeen).toBe(next)
      // A scalar through the same binding is delivered typed as well, rather
      // than being re-read from the attribute and parsed.
      screen.context.probe.current.set('/plain.png')
      await screen.settle()
      expect(shown()).toBe('raw:/plain.png')
      expect(screen.context.probe.current()).toBe('/plain.png')
      expect(screen.mutationErrors).toEqual([])
    }
    finally { screen.unmount() }
  }, 30_000)
})

describe('a component in a loop on a native screen', () => {
  it('gives its props to the component, not to the view around it', async () => {
    const root = createTempDir('stx-wrapper-props-')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'components', 'Row.stx'), `<script client>
const label = useReactiveProp('label', '')
const testId = useReactiveProp('testId', '')
const emit = defineEmits(['choose'])
</script><Pressable :testID="testId()" @press="emit('choose', label())"><Text>{{ label() }}</Text></Pressable>`)
    const file = path.join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const items = state([{ id: 'a' }, { id: 'b' }])
const chosen = state('')
</script><View><Row :for="item in items()" :key="item.id" :label="item.id" :test-id="'row-' + item.id" @choose="chosen.set($event)" /><Text>{{ 'chosen ' + chosen() }}</Text></View>`)
    const { code } = await compileSharedScreenBundle(file, { root })
    const screen = mountNativeScreen(code, 'Screen')
    await screen.settle()
    const tagged = screen.all().filter(node => node.props?.testID || node.props?.testId)
    expect(tagged.map(node => [node.type, node.props.testID])).toEqual([['Pressable', 'row-a'], ['Pressable', 'row-b']])
    screen.press(screen.byTestID('row-b')!)
    await screen.settle()
    expect(screen.texts()).toContain('chosen b')
  })
})
