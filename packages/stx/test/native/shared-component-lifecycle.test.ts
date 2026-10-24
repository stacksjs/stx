import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

describe.each([false, true])('native component lifecycle (minify=%s)', (minify) => {
  it('evaluates a nested component condition in its enclosing component scope', async () => {
    const root = createTempDir('stx-native-nested-condition-')
    mkdirSync(join(root, 'components'))
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(join(root, 'components/Child.stx'), '<script client>const label = state("Child mounted")</script><p :text="label"></p>')
    await Bun.write(join(root, 'components/Form.stx'), `<script>const { flow = 'login' } = defineProps()</script>
<script client>const mode = String(useReactiveProp('flow', 'login')())</script>
<div><Child :if="mode === 'login' || mode === 'signup'" /><p :text="mode"></p></div>`)
    const file = join(root, 'Screen.stx')
    await Bun.write(file, '<Form flow="signup" />')
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const phone = mountNativeScreen(code, 'Screen')
    await phone.settle()
    expect(phone.texts()).toContain('signup')
    expect(phone.texts()).toContain('Child mounted')
    phone.unmount()
  })
  it('mounts connected component scopes even when their markup has no bindings (#2089)', async () => {
    const root = createTempDir('stx-native-component-lifecycle-')
    mkdirSync(join(root, 'components'))
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(join(root, 'components/Child.stx'), `<script client>
onMount(() => {
  window.mounts++
  onDestroy(() => { window.nestedDestroys++ })
  return () => { window.cleanups++ }
})
onDestroy(() => { window.destroys++ })
</script><p>Static child</p>`)
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
window.mounts = 0
window.cleanups = 0
window.destroys = 0
window.nestedDestroys = 0
const shown = state(false)
window.shown = shown
</script><div><Child /><Child /><section :if="shown"><Child /></section></div>`)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    expect(phone.context.mounts).toBe(2)
    phone.context.shown.set(true)
    await phone.settle()
    expect(phone.context.mounts).toBe(3)
    phone.context.shown.set(false)
    await phone.settle()
    expect(phone.context.cleanups).toBe(1)
    expect(phone.context.destroys).toBe(1)
    expect(phone.context.nestedDestroys).toBe(1)
    phone.context.shown.set(true)
    await phone.settle()
    expect(phone.context.mounts).toBe(4)
    phone.unmount()
    expect(phone.context.cleanups).toBe(4)
    expect(phone.context.destroys).toBe(4)
    expect(phone.context.nestedDestroys).toBe(4)
    phone.unmount()
    expect(phone.context.cleanups).toBe(4)
    expect(errors).toEqual([])
  }, 30_000)
})
