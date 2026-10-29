import { expect, test } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { FALLBACK_SYMBOL, resolveIconName } from '../../src/native/compiler/icons'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

test('resolves collection-qualified names without borrowing another collection\'s mapping', () => {
  for (const name of ['i-hugeicons-workout-run', 'hugeicons:workout-run'])
    expect(resolveIconName(name)).toEqual({ symbol: 'figure.run', iconify: 'i-hugeicons-workout-run', known: true })
  expect(resolveIconName('i-other-workout-run')).toMatchObject({ symbol: FALLBACK_SYMBOL, known: false })
  for (const name of ['constructor', 'toString', 'i-constructor-home'])
    expect(resolveIconName(name)).toMatchObject({ symbol: FALLBACK_SYMBOL, known: false })
  expect(resolveIconName('circle')).toMatchObject({ symbol: 'circle', known: true })
  expect(resolveIconName('heart.fill')).toEqual({ symbol: 'heart.fill', known: true })
})

test('reports unmapped static icons while preserving mapped icons and explicit symbols', async () => {
  for (const html of ['<i class="i-other-workout-run"></i>', '<span class="i-other-workout-run"></span>', '<span data-native="Icon" name="other:workout-run"></span>']) {
    const { root, diagnostics } = await translateHtmlToIR(html)
    expect(root.type).toBe('Icon')
    expect(root.props.symbol).toBe(FALLBACK_SYMBOL)
    expect(diagnostics).toContainEqual({ kind: 'unknown-icon', tag: html.startsWith('<i ') ? 'i' : 'span', name: html.includes('name=') ? 'other:workout-run' : 'i-other-workout-run' })
  }
  for (const html of ['<i class="h-12 w-12 i-hugeicons-workout-run"></i>', '<span data-native="Icon" name="hugeicons:workout-run"></span>', '<span data-native="Icon" symbol="figure.run"></span>']) {
    const { root, diagnostics } = await translateHtmlToIR(html)
    expect(root.props.symbol).toBe('figure.run')
    expect(diagnostics.filter(item => item.kind === 'unknown-icon')).toEqual([])
  }
  const deferred = await translateHtmlToIR('<i :class="icon"></i>')
  expect(deferred.diagnostics.filter(item => item.kind === 'unknown-icon')).toEqual([])
})

test.each([false, true])('keeps unknown-icon in bundle diagnostics (minify=%s)', async (minify) => {
  const { diagnostics } = await compileNativeScreen('<div><i class="i-other-workout-run"></i><Icon name="other:workout-run" /></div>', { minify })
  expect(diagnostics).toContainEqual({ level: 'warning', message: 'unknown-icon: i: i-other-workout-run' })
  expect(diagnostics).toContainEqual({ level: 'warning', message: 'unknown-icon: span: other:workout-run' })
})

test.each([
  ['ios', false], ['ios', true], ['android', false], ['android', true],
] as const)('reports reactive class/name fallbacks and retains icon identity (%s, minify=%s)', async (platform, minify) => {
  const { code } = await compileNativeScreen(`<script client>
const icon = state('i-hugeicons-workout-run')
const name = state('hugeicons:workout-run')
const shown = state(true)
window.probe = { icon, name, shown }
</script><div><div :if="shown">
<i testID="class-icon" class="h-12 w-12" :class="icon"></i>
<Icon testID="name-icon" :name="name" />
</div></div>`, { minify })
  const warnings: string[] = []
  const phone = mountNativeScreen(code, 'Screen', { platform, globals: { console: { ...console, warn: (...args: unknown[]) => warnings.push(args.join(' ')) } } })
  try {
    await phone.settle()
    const byClass = () => phone.byTestID('class-icon')!
    const byName = () => phone.byTestID('name-icon')!
    const original = byClass()
    expect(original.props.symbol).toBe('figure.run')
    expect(byName().props.symbol).toBe('figure.run')
    expect(warnings.filter(item => item.includes('unknown-icon'))).toEqual([])
    phone.context.probe.icon.set('i-other-workout-run')
    phone.context.probe.name.set('other:workout-run')
    await phone.settle()
    expect(byClass()).toBe(original)
    expect(byClass().props.symbol).toBe(FALLBACK_SYMBOL)
    expect(byName().props.symbol).toBe(FALLBACK_SYMBOL)
    expect(warnings.filter(item => item.includes('unknown-icon'))).toHaveLength(2)
    expect(warnings.some(item => item.includes(original.id) && item.includes('i-other-workout-run') && item.includes('explicit Icon symbol'))).toBe(true)
    phone.context.probe.icon.set('h-8 i-other-workout-run')
    await phone.settle()
    expect(warnings.filter(item => item.includes('unknown-icon'))).toHaveLength(2)
    phone.context.probe.icon.set('i-lucide-circle')
    phone.context.probe.name.set('hugeicons:workout-run')
    await phone.settle()
    expect(byClass().props.symbol).toBe('circle')
    expect(byName().props.symbol).toBe('figure.run')
    phone.context.probe.shown.set(false)
    await phone.settle()
    phone.context.probe.icon.set('i-hugeicons-workout-run')
    phone.context.probe.shown.set(true)
    await phone.settle()
    expect(byClass().props.symbol).toBe('figure.run')
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
})
