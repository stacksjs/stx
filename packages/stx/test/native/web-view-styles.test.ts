/**
 * A web view's classes, natively: one UI source for the web and the phone.
 *
 * Web views are written for every screen size and for a pointer: `md:` and
 * `lg:` layouts, hover states, transitions, the app's own Crosswind shortcuts
 * (`card`, `btn-primary`) and theme colours (`bg-hq-action`), icons as
 * `<i class="i-lucide-sun">`. Natively all of that was reported unknown and
 * dropped, so a web view could not be the phone's screen. Now width variants
 * are layers the host applies for the screen's width, pointer-only variants
 * are accepted and ignored on touch, shortcuts and theme colours come from the
 * project's CSS config, and `<i>` icons are Icons.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { setNativeStyleConfig } from '../../src/native/compiler/style-config'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const APP_CONFIG = {
  shortcuts: {
    'card': 'bg-white dark:bg-hq-panel-dark rounded-xl p-5 hover:bg-slate-50 transition-colors',
    'btn-primary': 'px-4 py-2 bg-hq-action hover:bg-hq-action-hover dark:bg-hq-action-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    'stack': 'flex flex-col gap-2 md:flex-row',
  },
  colors: { hq: { 'action': 'var(--hq-action, #007aff)', 'action-dark': 'var(--hq-action-dark, #0a84ff)', 'action-hover': '#0062cc', 'panel-dark': 'var(--hq-panel-dark, #111827)' } },
}

afterEach(() => setNativeStyleConfig({}))

describe('web view classes on a native host', () => {
  it('keeps width variants as layers, smallest first, with their dark styles', () => {
    const compiled = compileClassStyles('grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 p-4 md:p-8 lg:dark:p-10 dark:md:bg-black')
    expect(compiled.style).toEqual({ display: 'grid', gridColumns: 1, padding: 16 })
    expect(compiled.responsive).toEqual([
      { min: 640, style: { gridColumns: 2 } },
      { min: 768, style: { padding: 32 }, dark: { backgroundColor: '#000000' } },
      { min: 1024, style: { gridColumns: 3 }, dark: { padding: 40 } },
    ])
    expect(compiled.unknown).toEqual([])
  })

  it('accepts what only a pointer or the browser means, and still reports what nothing understands', () => {
    const compiled = compileClassStyles('p-2 hover:bg-red-500 group-hover:opacity-50 active:scale-95 transition-all duration-150 ease-out cursor-pointer select-none focus:outline-none wobble')
    expect(compiled.style).toEqual({ padding: 8 })
    expect(compiled.unknown).toEqual(['wobble'])
    // Beside a focus variant a hover stays diagnostic, as focus styles always were.
    expect(compileClassStyles('focus-within:hover:p-4', undefined, { focusWithin: true }).unknown).toEqual(['focus-within:hover:p-4'])
  })

  it('expands the app\'s shortcuts and theme colours, carrying a variant onto every class', () => {
    setNativeStyleConfig(APP_CONFIG)
    const card = compileClassStyles('card')
    expect(card.style).toEqual({ backgroundColor: '#ffffff', borderRadius: 12, padding: 20 })
    expect(card.dark).toEqual({ backgroundColor: '#111827' })
    expect(card.unknown).toEqual([])
    const stack = compileClassStyles('stack lg:card')
    expect(stack.style).toMatchObject({ flexDirection: 'column', gap: 8 })
    expect(stack.responsive).toEqual([
      { min: 768, style: { flexDirection: 'row' } },
      { min: 1024, style: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20 }, dark: { backgroundColor: '#111827' } },
    ])
    expect(compileClassStyles('bg-hq-action/50 text-hq-action-hover').style).toEqual({ backgroundColor: '#007aff80', color: '#0062cc' })
    // The screen's own variable wins over the theme's fallback (a gym's brand colour).
    expect(compileClassStyles('bg-hq-action', new Map([['--hq-action', '#ff2d55']])).style).toEqual({ backgroundColor: '#ff2d55' })
  })

  it('keeps disabled: apart for the host to apply to a disabled control', () => {
    setNativeStyleConfig(APP_CONFIG)
    const button = compileClassStyles('btn-primary')
    expect(button.style).toMatchObject({ backgroundColor: '#007aff', paddingHorizontal: 16 })
    expect(button.disabled).toEqual({ style: { opacity: 0.5 } })
    expect(button.unknown).toEqual([])
  })

  it('maps the layout utilities web views lean on to what a native host draws', () => {
    expect(compileClassStyles('z-10 z-[90]').style).toEqual({ zIndex: 90 })
    expect(compileClassStyles('absolute inset-x-3 top-2 -left-1').style).toEqual({ position: 'absolute', left: -4, right: 12, top: 8 })
    expect(compileClassStyles('fixed inset-0').style).toEqual({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 })
    expect(compileClassStyles('max-w-md mx-auto').style).toMatchObject({ alignSelf: 'center' })
    expect(compileClassStyles('grid grid-cols-[1.35fr_1fr]').style).toEqual({ display: 'grid', gridColumns: 2 })
    expect(compileClassStyles('border border-slate-900/[0.04]').style).toEqual({ borderWidth: 1, borderColor: '#0f172a0a' })
    expect(compileClassStyles('sr-only').style).toEqual({ position: 'absolute', width: 1, height: 1, overflow: 'hidden' })
    const image = compileClassStyles('w-full object-cover')
    expect(image.resizeMode).toBe('cover')
    expect(compileClassStyles('whitespace-nowrap').numberOfLines).toBe(1)
    for (const name of ['inline-block', 'align-middle', 'whitespace-pre-line', 'break-words', 'focus:ring-2', 'focus-visible:ring-accent', 'group-focus-within:ring-blue-500/60', 'focus:outline-none'])
      expect([name, compileClassStyles(name).unknown]).toEqual([name, []])
    // Auto margins and column spans need the hosts first: still reported.
    expect(compileClassStyles('ml-auto col-span-2').unknown).toEqual(['ml-auto', 'col-span-2'])
  })

  it('draws an <i> or <span> icon class as an Icon', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div><i class="i-lucide-sun w-4 h-4"></i><span class="i-lucide-heart"></span></div>')
    const [sun, heart] = root.children as any[]
    expect(sun.type).toBe('Icon')
    expect(sun.props.symbol).toBeTruthy()
    expect(sun.style).toMatchObject({ width: 16, height: 16 })
    expect(heart.type).toBe('Icon')
    expect(diagnostics).toEqual([])
  })
})

describe('a web view compiled for the phone, with the project\'s CSS config', () => {
  it('applies width layers for the screen\'s width, disabled styles, shortcuts and theme colours', async () => {
    const root = createTempDir('stx-web-view-styles-')
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(join(root, 'config/css.ts'), `export default ${JSON.stringify({ shortcuts: APP_CONFIG.shortcuts, theme: { colors: APP_CONFIG.colors } })}`)
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const busy = state(false)
const tone = state('p-2')
window.probe = { busy, tone }
</script>
<div testID="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div testID="card" class="card">Card</div>
  <button testID="save" class="btn-primary" :disabled="busy">Save</button>
  <div testID="bound" :class="tone">Bound</div>
</div>`)
    const result = await compileSharedScreenBundle(file, { root })
    expect(result.diagnostics.filter(diagnostic => diagnostic.message.startsWith('unknown-class'))).toEqual([])
    const phone = mountNativeScreen(result.code, 'Screen', { viewportWidth: 390 })
    try {
      await phone.settle()
      const list = () => phone.byTestID('list')!
      expect(list().style.gridColumns).toBe(1)
      expect(phone.byTestID('card')!.style).toMatchObject({ backgroundColor: '#ffffff', borderRadius: 12, padding: 20 })
      expect(phone.byTestID('save')!.style).toMatchObject({ backgroundColor: '#007aff' })
      expect(phone.byTestID('save')!.style.opacity).toBeUndefined()

      // An iPad in landscape, then split view: the layout follows the width.
      phone.viewport(1180)
      await phone.settle()
      expect(list().style.gridColumns).toBe(3)
      phone.viewport(800)
      await phone.settle()
      expect(list().style.gridColumns).toBe(2)

      // disabled: follows the control's state.
      phone.context.probe.busy.set(true)
      await phone.settle()
      expect(phone.byTestID('save')!.style.opacity).toBe(0.5)
      phone.context.probe.busy.set(false)
      await phone.settle()
      expect(phone.byTestID('save')!.style.opacity ?? 1).toBe(1)

      // A class bound at runtime reads the same config the compiler did.
      phone.context.probe.tone.set('card md:p-8')
      await phone.settle()
      expect(phone.byTestID('bound')!.style).toMatchObject({ backgroundColor: '#ffffff', padding: 32 })
      phone.appearance('dark')
      await phone.settle()
      expect(phone.byTestID('card')!.style.backgroundColor).toBe('#111827')
    }
    finally {
      phone.unmount?.()
    }
  })
})
