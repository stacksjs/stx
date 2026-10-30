import { afterEach, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { nativeStyleConfigFrom, setNativeStyleConfig } from '../../src/native/compiler/style-config'

afterEach(() => { setNativeStyleConfig(null); unmountAllNativeScreens() })

it('maps generic font utilities and preserves the application font fallback list', () => {
  expect(compileClassStyles('font-mono').style.fontFamily).toBe('monospace')
  expect(compileClassStyles('font-serif').style.fontFamily).toBe('serif')
  expect(compileClassStyles('font-sans').style.fontFamily).toBe('sans-serif')
  const config = nativeStyleConfigFrom({ theme: { fontFamily: { mono: ['Training Mono', 'ui-monospace', 'monospace'] } } })
  setNativeStyleConfig(config)
  expect(compileClassStyles('font-mono font-semibold').style).toMatchObject({ fontFamily: 'Training Mono, ui-monospace, monospace', fontWeight: '600' })
})

it('excludes explicitly website-only subtrees without discarding their native siblings', async () => {
  const { root, diagnostics } = await translateHtmlToIR('<div><section DATA-NATIVE-EXCLUDE="false"><button @click="browserOnly()">Website action</button><svg><bad-path /></svg></section><p>Shared content</p></div>')
  expect(JSON.stringify(root)).not.toContain('Website action')
  expect(JSON.stringify(root)).not.toContain('browserOnly')
  expect(JSON.stringify(root)).toContain('Shared content')
  expect(diagnostics.filter(item => item.tag === 'bad-path')).toEqual([])
})


it('removes excluded binding scopes before native setup extraction', async () => {
  const { code } = await compileNativeScreen(`<div><section data-native-exclude><script client>onMount(() => { globalThis.excludedSetupRan = true })</script><button @click="missingBrowserFunction()">Web</button></section><p>Shared</p></div>`)
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  expect(phone.texts()).toContain('Shared')
  expect(phone.texts()).not.toContain('Web')
  expect(phone.context.excludedSetupRan).toBeUndefined()
  expect(phone.mutationErrors).toEqual([])
})

it('excludes a self-closed component call alone, keeping the siblings after it', async () => {
  const { excludeNativeSubtrees } = await import('../../src/native/compiler/html-to-ir')
  const source = '<form @submit="go()"><p>Before</p><PasskeySignIn :if="!inApp && a > b" data-native-exclude :label="\'x />\'" /><input id="email" /><Other data-native-exclude="false"/></form><p>After</p>'
  expect(await excludeNativeSubtrees(source)).toBe('<form @submit="go()"><p>Before</p><input id="email" /></form><p>After</p>')
  // Paired and void tags are excluded as before; a self-closed tag without the attribute stays.
  expect(await excludeNativeSubtrees('<div><section data-native-exclude><Inner /><b>gone</b></section><Keep /><input data-native-exclude /><i>end</i></div>')).toBe('<div><Keep /><i>end</i></div>')
  const { code } = await compileNativeScreen('<div><WebOnly data-native-exclude /><p>Shared</p><p>Also shared</p></div>')
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  expect(phone.texts()).toEqual(['Shared', 'Also shared'])
})

it('carries a layout wrapper\'s face onto the page it unwraps, below the page\'s own classes', async () => {
  setNativeStyleConfig(nativeStyleConfigFrom({ theme: { fontFamily: { sans: ['Barlow-Regular', 'Barlow', 'system-ui'], mono: ['Training Mono', 'monospace'] } } }))
  const { root } = await translateHtmlToIR('<html><body class="font-mono"><main class="flex-1 font-sans"><div class="p-4"><p>Today</p></div><p class="font-mono">00:42</p></main></body></html>')
  const [page, clock] = root.children as Array<{ style: Record<string, unknown>, _layoutDefaults?: Record<string, unknown> }>
  expect(page.style).toMatchObject({ fontFamily: 'Barlow-Regular, Barlow, system-ui', padding: 16 })
  expect(page._layoutDefaults).toEqual({ fontFamily: 'Barlow-Regular, Barlow, system-ui' })
  expect(clock.style.fontFamily).toBe('Training Mono, monospace')
  expect(clock._layoutDefaults).toBeUndefined()
})

it('keeps the inherited face when a bound class restyles the node', async () => {
  const { code } = await compileNativeScreen(`<script client>const on = state(false)</script><main style="font-family: Barlow-Regular, Barlow"><button testID="start" class="p-2" :class="on ? 'text-red-600' : ''" @click="on.set(!on())">Start</button></main>`)
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  const style = (): Record<string, unknown> => phone.find(node => node.type === 'Button' || node.type === 'Pressable')!.style
  expect(style().fontFamily).toBe('Barlow-Regular, Barlow')
  phone.press(phone.find(node => node.type === 'Button' || node.type === 'Pressable')!)
  await phone.settle()
  expect(style()).toMatchObject({ fontFamily: 'Barlow-Regular, Barlow', color: expect.any(String) })
  expect(phone.mutationErrors).toEqual([])
})
