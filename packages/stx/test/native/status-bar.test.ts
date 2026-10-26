import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it.each([false, true])('preserves native status bar styles through compiled bindings (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
const content = state('light-content')
window.statusBarProbe = content
</script>
<View><StatusBar testID="bar" :barStyle="content" /></View>`, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    expect(phone.byTestID('bar')!.props.barStyle).toBe('light-content')
    phone.context.statusBarProbe.set('dark-content')
    await phone.settle()
    expect(phone.byTestID('bar')!.props.barStyle).toBe('dark-content')
    phone.context.statusBarProbe.set(null)
    await phone.settle()
    expect(phone.byTestID('bar')!.props.barStyle).toBeNull()
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
