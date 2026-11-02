import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

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
