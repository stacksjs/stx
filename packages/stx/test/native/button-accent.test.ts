/**
 * A native Button's words are the app's accent unless the caller colours them.
 * A host left alone draws its system blue, so a plain button on an app whose
 * accent is emerald came out blue beside everything else.
 */
import { afterEach, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

afterEach(unmountAllNativeScreens)

it('takes the accent role, and gives way to a colour the caller asks for', async () => {
  const { code } = await compileNativeScreen(`<View>
  <Button testID="plain">Load more</Button>
  <Button testID="danger" class="text-danger">Delete</Button>
</View>`, { name: 'Buttons' })
  const phone = mountNativeScreen(code, 'Buttons')
  await phone.settle()
  const accent = phone.byTestID('plain')!.style.color
  expect(accent).toBeTruthy()
  expect(phone.byTestID('danger')!.style.color).toBeTruthy()
  expect(phone.byTestID('danger')!.style.color).not.toBe(accent)
})
