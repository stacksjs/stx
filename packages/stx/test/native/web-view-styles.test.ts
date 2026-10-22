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

  it('accepts a page\'s CSS animations and scroll anchoring, which a native screen does not run', () => {
    // A loading skeleton pulses on the web, a spinner spins; natively the
    // shape stays and the keyframes go. Scroll margins only offset a
    // browser's jump to an anchor, which a native screen never makes.
    const compiled = compileClassStyles('h-4 animate-pulse motion-safe:animate-spin scroll-mt-20 scroll-pt-4 scroll-mx-2 snap-x snap-center overscroll-contain')
    expect(compiled.style).toEqual({ height: 16 })
    expect(compiled.unknown).toEqual([])
  })

  it('draws a card\'s cover ratio and a dashed outline, and passes over a hover group\'s marker', () => {
    expect(compileClassStyles('aspect-[16/9] group').style).toEqual({ aspectRatio: 16 / 9 })
    expect(compileClassStyles('aspect-video').style).toEqual({ aspectRatio: 16 / 9 })
    expect(compileClassStyles('aspect-[4/3]').style).toEqual({ aspectRatio: 4 / 3 })
    const dashed = compileClassStyles('border-2 border-dashed peer')
    expect(dashed.style).toMatchObject({ borderWidth: 2, borderStyle: 'dashed' })
    expect(dashed.unknown).toEqual([])
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

describe('the page\'s own class rules', () => {
  it('applies simple class rules under the utilities, with dark and width layers, and reports what it cannot read', async () => {
    const { root, diagnostics } = await translateHtmlToIR(`<style>
:root { --accent: #ff2d55; }
.panel-title { font-size: 17px; font-weight: 600; color: #1c1c1e; }
.dark .panel-title { color: #ffffff; }
html.dark .panel { background-color: #1c1c1e; }
.panel { background-color: #ffffff; border-radius: 12px; padding: 12px; }
.panel:hover { background-color: #f2f2f7; }
.chip { color: var(--accent); }
@media (min-width: 768px) { .panel { padding: 24px; } }
@media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
@keyframes pulse { from { opacity: 0 } to { opacity: 1 } }
.panel > .row { padding: 4px; }
.panel::before { content: ''; }
.elsewhere > .row { padding: 4px; }
</style>
<div class="panel p-2"><p class="panel-title">Title</p><span class="chip">Live</span></div>`)
    const find = (node: any): any => node?.props?._classes?.includes?.('panel') || /(^|\s)panel(\s|$)/.test(node?._classes ?? '') ? node : (node?.children ?? []).filter((child: any) => typeof child !== 'string').map(find).find(Boolean)
    const panel = find(root) ?? (root.type === 'View' ? root : undefined)
    // The utility wins over the rule, as on the web.
    expect(panel.style).toMatchObject({ backgroundColor: '#ffffff', borderRadius: 12, padding: 8 })
    const title = panel.children[0]
    expect(title.style).toMatchObject({ fontSize: 17, fontWeight: '600', color: '#1c1c1e' })
    expect(panel.children[1].style.color).toBe('#ff2d55')
    expect(root._stylesheetRules?.panel?.responsive).toEqual([{ min: 768, light: expect.stringContaining('padding') }])
    expect(root._stylesheetRules?.['panel-title']?.dark).toContain('color')
    const reported = diagnostics.filter(d => d.kind === 'unsupported-style-rule').map(d => d.name)
    expect(reported).toEqual(expect.arrayContaining(['.panel>.row', '.panel::before']))
    expect(reported).not.toContain('.panel:hover')
    // The app's whole stylesheet comes with every page: a rule for classes this page does not use is not its problem.
    expect(reported).not.toContain('.elsewhere>.row')
    expect(diagnostics.filter(d => d.kind === 'unknown-class')).toEqual([])
  })

  it('draws a rule\'s dark and width layers on the device', async () => {
    const root = createTempDir('stx-web-view-rules-')
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<style>
.panel { background-color: #ffffff; padding: 12px; }
.dark .panel { background-color: #1c1c1e; }
@media (min-width: 768px) { .panel { padding: 24px; } }
</style>
<div testID="panel" class="panel">Panel</div>`)
    const result = await compileSharedScreenBundle(file, { root })
    const phone = mountNativeScreen(result.code, 'Screen', { viewportWidth: 390 })
    try {
      await phone.settle()
      const panel = () => phone.byTestID('panel')!
      expect(panel().style).toMatchObject({ backgroundColor: '#ffffff', padding: 12 })
      phone.viewport(1024)
      await phone.settle()
      expect(panel().style.padding).toBe(24)
      phone.appearance('dark')
      await phone.settle()
      expect(panel().style.backgroundColor).toBe('#1c1c1e')
    }
    finally {
      phone.unmount?.()
    }
  })
})

describe('events on a web view, natively', () => {
  it('warns about browser-only events, not about a component\'s own', async () => {
    const { diagnostics } = await translateHtmlToIR('<div @done="finish()" @unverified="verify($event)" @keydown.enter="send()" @mouseenter="peek()"></div>')
    expect(diagnostics.filter(d => d.kind === 'unread-event').map(d => d.name)).toEqual(['@keydown.enter', '@mouseenter'])
  })
})

describe('compound rules and narrow-screen layers', () => {
  it('applies a compound class rule where both classes are present, and max-width layers below a width', async () => {
    const { root } = await translateHtmlToIR(`<style>
.card { padding: 20px; background-color: #ffffff; }
.card.card-flush { padding: 0px; }
@media (max-width: 639px) { .card { border-radius: 0px; } }
@media (min-width: 640px) and (max-width: 1023px) { .card { border-radius: 8px; } }
</style>
<div class="card card-flush">Flush</div>`)
    expect(root._stylesheetRules?.['card.card-flush']?.light).toContain('padding')
    expect(root._stylesheetRules?.card?.responsive).toEqual([
      { min: 0, max: 639, light: expect.stringContaining('border-radius') },
      { min: 640, max: 1023, light: expect.stringContaining('border-radius') },
    ])
    const compiled = compileClassStyles('card card-flush', undefined, { rules: root._stylesheetRules })
    expect(compiled.style).toMatchObject({ padding: 0, backgroundColor: '#ffffff' })
    expect(compiled.responsive).toEqual([
      { min: 0, max: 639, style: { borderRadius: 0 } },
      { min: 640, max: 1023, style: { borderRadius: 8 } },
    ])
    expect(compileClassStyles('p-2 max-md:p-4 md:p-8').responsive).toEqual([
      { min: 0, max: 767.98, style: { padding: 16 } },
      { min: 768, style: { padding: 32 } },
    ])
  })

  it('draws a below-a-width layer on a phone and drops it on an iPad', async () => {
    const root = createTempDir('stx-web-view-narrow-')
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    const file = join(root, 'Screen.stx')
    await Bun.write(file, '<div testID="box" class="p-8 max-md:p-2">Box</div>')
    const result = await compileSharedScreenBundle(file, { root })
    const phone = mountNativeScreen(result.code, 'Screen', { viewportWidth: 390 })
    try {
      await phone.settle()
      expect(phone.byTestID('box')!.style.padding).toBe(8)
      phone.viewport(1024)
      await phone.settle()
      expect(phone.byTestID('box')!.style.padding).toBe(32)
    }
    finally {
      phone.unmount?.()
    }
  })
})

describe('a Stacks app\'s source root', () => {
  it('finds stores, layouts and components under the config\'s root, as the web does', async () => {
    const root = createTempDir('stx-native-source-root-')
    await Bun.write(join(root, 'stx.config.ts'), `export default { root: 'resources', layoutsDir: 'layouts', componentsDir: 'components', partialsDir: 'components' }`)
    await Bun.write(join(root, 'resources/stores/counter.ts'), `import { defineStore, state } from '@stacksjs/stx'\ndefineStore('counter', () => { const count = state(41); return { count } })\n`)
    await Bun.write(join(root, 'resources/layouts/app.stx'), '<main data-layout>@yield(\'content\')</main>')
    await Bun.write(join(root, 'resources/components/Badge.stx'), '<span testID="badge" class="p-1">Badge</span>')
    const file = join(root, 'resources/views/home.stx')
    await Bun.write(file, `@extends('layouts/app')
@section('content')
<script client>
const counter = useStore('counter')
</script>
<p testID="count" :text="counter.count() + 1"></p>
<Badge />
@endsection`)
    const result = await compileSharedScreenBundle(file, { root })
    const phone = mountNativeScreen(result.code, 'Screen')
    try {
      await phone.settle()
      expect(phone.byTestID('count')!.children).toEqual(['42'])
      expect(phone.byTestID('badge')).toBeTruthy()
    }
    finally {
      phone.unmount?.()
    }
  })
})
