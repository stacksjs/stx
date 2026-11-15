/**
 * A DatePicker is told which language to write its dates in
 * (craft-native/craft#546).
 *
 * The host writes dates the way the device is set, so an account whose
 * interface is German on an English phone read "Nov 16, 2026" in a German
 * screen. The host now takes `locale`; this is that prop reaching it, typed,
 * written or bound, and following its signal.
 */
import { afterEach, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import type { DatePickerProps } from '../../src/native/components/primitives'

afterEach(unmountAllNativeScreens)

it('is a typed prop', () => {
  const props: DatePickerProps = { mode: 'date', value: '2026-11-16', locale: 'de-DE' }
  expect(props.locale).toBe('de-DE')
})

it.each(['ios', 'android'] as const)('reaches the host written and bound, and follows its signal on %s', async (platform) => {
  const { code } = await compileNativeScreen(`<script client>
const language = state('de')
window.probe = { language }
</script>
<section>
  <DatePicker testID="written" mode="date" value="2026-11-16" locale="en-GB" />
  <DatePicker testID="bound" mode="date" value="2026-11-16" :locale="language()" />
  <DatePicker testID="device" mode="date" value="2026-11-16" />
</section>`)
  const phone = mountNativeScreen(code, 'Screen', { platform })
  await phone.settle()
  expect(phone.byTestID('written')!.type).toBe('DatePicker')
  expect(phone.byTestID('written')!.props.locale).toBe('en-GB')
  expect(phone.byTestID('bound')!.props.locale).toBe('de')
  // Left out, the device's own: nothing is sent.
  expect(phone.byTestID('device')!.props.locale).toBeUndefined()

  phone.context.probe.language.set('fr-CA')
  await phone.settle()
  expect(phone.byTestID('bound')!.props.locale).toBe('fr-CA')
  expect(phone.byTestID('bound')!.props.value).toBe('2026-11-16')
}, 30_000)
