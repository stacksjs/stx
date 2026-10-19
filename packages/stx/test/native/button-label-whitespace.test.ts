import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it.each([false, true])('keeps formatting whitespace out of a native leaf button label (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
const presses = state(0)
</script><div><button testID="toggle" @click="presses.set(presses() + 1)">
  Toggle safe edges
</button><Text testID="count" :text="presses" /></div>`, { minify })
  const phone = mountNativeScreen(code, 'Screen')
  try {
    await phone.settle()
    expect(phone.byTestID('toggle')!.type).toBe('Button')
    expect(phone.byTestID('toggle')!.children).toEqual(['Toggle safe edges'])
    phone.press(phone.byTestID('toggle')!)
    await phone.settle()
    expect(phone.byTestID('count')!.children).toEqual(['1'])
    expect(phone.byTestID('toggle')!.children).toEqual(['Toggle safe edges'])
  }
  finally { phone.unmount() }
}, 30_000)
