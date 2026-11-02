import { expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const kinds = ['Link', 'TouchableOpacity', 'TouchableHighlight', 'Pressable'] as const
const source = `<script client>
const href = state('  /terms?lang=en#read  ')
const to = state('/fallback')
const disabled = state(false)
const shown = state(true)
window.calls = []
window.probe = { href, to, disabled, shown }
</script><View>
<View :if="shown">
${kinds.map(kind => `<${kind} testID="${kind}" :href="href" :to="to" :disabled="disabled" @click="window.calls.push('${kind}')">Open</${kind}>
<${kind} testID="bare-${kind}" :to="to" :disabled="disabled">Open</${kind}>`).join('\n')}
</View>
<div data-native="Button" testID="button" href="/not-a-link" @click="$event.preventDefault(); window.calls.push('button')">Button</div>
<View testID="view" href="/not-a-link" @click="$event.preventDefault(); window.calls.push('view')" />
<Text testID="missing">No action</Text>
<Pressable testID="lifecycle" href="/life" @click="window.calls.push('press')" @press-in="window.calls.push($event.marker)" @press-out="window.calls.push($event.marker)" @longpress="window.calls.push($event.marker)">Life</Pressable>
</View>`
const compiled = new Map<boolean, ReturnType<typeof compileNativeScreen>>()
async function fixture(platform: 'ios' | 'android', minify: boolean) {
  let bundle = compiled.get(minify)
  if (!bundle) { bundle = compileNativeScreen(source, { minify }); compiled.set(minify, bundle) }
  const phone = mountNativeScreen((await bundle).code, 'Screen', { platform })
  await phone.settle()
  return phone
}

const modes = [['ios', false], ['ios', true], ['android', false], ['android', true]] as const
it.each(modes)('native tap targets take precedence over handlers (%s, minify=%s)', async (platform, minify) => {
  const phone = await fixture(platform, minify)
  for (const kind of kinds) {
    phone.press(phone.byTestID(kind)!)
    expect(phone.context.calls).toEqual([])
    expect(phone.opened).toEqual(kinds.slice(0, kinds.indexOf(kind) + 1).map(() => '/terms?lang=en#read'))
  }
  // Navigation is the host's action, not a fabricated screen EVENT/request.
  expect(phone.messages.filter(message => message.type === 'NAVIGATE_OPEN')).toEqual([])
}, 30_000)

it.each(modes)('handlerless links navigate and disabled links stay inert (%s, minify=%s)', async (platform, minify) => {
  const phone = await fixture(platform, minify)
  for (const kind of kinds) {
    const bare = phone.byTestID(`bare-${kind}`)!
    expect(bare.events.onPress).toBeUndefined()
    phone.press(bare)
    phone.press(bare, 'onClick')
  }
  expect(phone.opened).toEqual(Array(8).fill('/fallback'))
  phone.context.probe.disabled.set(true)
  await phone.settle()
  for (const kind of kinds) {
    phone.press(phone.byTestID(kind)!)
    phone.press(phone.byTestID(`bare-${kind}`)!)
    phone.press(phone.byTestID(kind)!, 'onClick')
  }
  expect(phone.opened).toHaveLength(8)
  expect(phone.context.calls).toEqual([])
}, 30_000)

it.each(modes)('exposes the broken consent row while the same business gate accepts its handler-only fix (%s, minify=%s)', async (platform, minify) => {
  const { code } = await compileNativeScreen(`<script client>window.pages = []</script><View>
<Pressable testID="broken" href="/terms" @click="$event.preventDefault(); window.pages.push('/terms')">Read terms</Pressable>
<Pressable testID="fixed" @click="$event.preventDefault(); window.pages.push('/terms')">Read terms</Pressable>
</View>`, { minify })
  for (const row of ['broken', 'fixed']) {
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const readGate = () => {
      expect(phone.context.pages).toEqual(['/terms'])
      expect(phone.opened).toEqual([])
    }
    phone.press(phone.byTestID(row)!)
    if (row === 'broken') {
      expect(() => readGate()).toThrow()
      expect(phone.context.pages).toEqual([])
      expect(phone.opened).toEqual(['/terms'])
    }
    else readGate()
    phone.unmount()
  }
}, 30_000)

it.each(modes)('tap targets follow current bindings and their ordered string fallbacks (%s, minify=%s)', async (platform, minify) => {
  const phone = await fixture(platform, minify)
  const probe = phone.context.probe
  const node = phone.byTestID('Pressable')!
  for (const value of ['', ' \n\t ', null, 42, { invalid: true }]) {
    probe.href.set(value)
    await phone.settle()
    phone.press(node)
  }
  expect(phone.opened).toEqual(Array(5).fill('/fallback'))
  expect(phone.context.calls).toEqual([])
  probe.to.set('  https://example.invalid/privacy?x=%20#read  ')
  await phone.settle()
  phone.press(node)
  expect(phone.opened.at(-1)).toBe('https://example.invalid/privacy?x=%20#read')
  probe.to.set(' \n ')
  await phone.settle()
  phone.press(node)
  expect(phone.context.calls).toEqual(['Pressable'])
  expect(phone.opened).toHaveLength(6)
  probe.href.set('/current')
  await phone.settle()
  expect(phone.byTestID('Pressable')).toBe(node)
  phone.press(node)
  expect(phone.opened.at(-1)).toBe('/current')
  expect(phone.context.calls).toEqual(['Pressable'])
}, 30_000)

it.each(modes)('only host link kinds pre-empt taps; other native events still reach their handler (%s, minify=%s)', async (platform, minify) => {
  const phone = await fixture(platform, minify)
  phone.press(phone.byTestID('button')!)
  phone.press(phone.byTestID('view')!)
  const lifecycle = phone.byTestID('lifecycle')!
  for (const event of ['onPressIn', 'onPressOut', 'onLongPress']) phone.press(lifecycle, event, { marker: event })
  expect(phone.context.calls).toEqual(['button', 'view', 'onPressIn', 'onPressOut', 'onLongPress'])
  expect(phone.opened).toEqual([])
  expect(() => phone.press(phone.byTestID('missing')!)).toThrow('Text has no onPress')
}, 30_000)

it.each(modes)('removed, replaced and disposed nodes cannot navigate (%s, minify=%s)', async (platform, minify) => {
  const phone = await fixture(platform, minify)
  const old = phone.byTestID('Pressable')!
  phone.context.probe.shown.set(false)
  await phone.settle()
  phone.press(old)
  expect(phone.opened).toEqual([])
  phone.context.probe.href.set('/remounted')
  phone.context.probe.shown.set(true)
  await phone.settle()
  phone.press(old)
  expect(phone.opened).toEqual([])
  const current = phone.byTestID('Pressable')!
  phone.press(current)
  expect(phone.opened).toEqual(['/remounted'])
  phone.unmount()
  phone.press(current)
  expect(phone.opened).toEqual(['/remounted'])
  expect(phone.context.calls).toEqual([])
}, 30_000)
