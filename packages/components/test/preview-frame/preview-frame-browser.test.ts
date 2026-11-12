/**
 * <PreviewFrame> in a real browser. Whether a frame's page can reach its host,
 * and what its `prefers-color-scheme` reports, are decided by the engine, so
 * this is the only place they can be checked.
 *
 * A page that is allowed scripts tells the host what it sees with
 * `postMessage`, which is the one channel a sandboxed frame has.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { EVENTS, openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

// What a page reports about itself and about what it can reach.
/*
 * It reports once it has loaded and been laid out, not as it is parsed: a
 * frame's size and colour scheme come from the element that embeds it, and
 * Chrome has not handed them over yet while the frame's first script runs
 * (the page saw a width of 0 and the system scheme).
 */
const REPORT = `<p id="p">hello</p><script>
  const attempt = fn => { try { return String(fn()) } catch (e) { return 'blocked' } }
  addEventListener('load', () => setTimeout(() => parent.postMessage({
    from: NAME,
    dark: matchMedia('(prefers-color-scheme: dark)').matches,
    width: innerWidth,
    origin: location.origin,
    hostDocument: attempt(() => parent.document.title),
    hostStorage: attempt(() => parent.localStorage.length),
    ownStorage: attempt(() => localStorage.length),
    hostSecret: attempt(() => parent.secret),
    cookie: attempt(() => document.cookie),
  }, '*'), 60))
</script>`
const report = (name: string): string => REPORT.replace('NAME', JSON.stringify(name))

const HELPERS = `
  ${EVENTS}
  const host = id => document.getElementById(id)
  const api = id => host(id).closest('[data-stx-scope]').__stx_exposed
  const frame = id => host(id).querySelector('iframe')
  const said = name => window.messages.filter(m => m.from === name)
  const last = name => said(name).slice(-1)[0] || null
  const box = el => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } }
  const later = (fn, ms) => new Promise(done => setTimeout(() => done(fn()), ms || 500))
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'preview-frame-browser',
    width: 1100,
    height: 900,
    ready: `document.querySelectorAll('[data-preview-ready]').length === 4 && window.messages && window.messages.length >= 2`,
    context: { scripted: report('scripted'), silent: report('silent'), phone: report('phone') },
    body: `
<script>window.messages = []; window.secret = 'host only'; addEventListener('message', e => window.messages.push(e.data)); document.title = 'Host page'; localStorage.setItem('host-key', '1'); document.cookie = 'host=1'</script>
<script client>
const events = { load: [], reload: [], viewport: [], scheme: [] }
const markup = state({{ scripted }})
const scheme = state('dark')
window.probe = { events, markup, scheme }
</script>
<div style="width: 600px">
  <PreviewFrame id="scripted" scripts title="Welcome mail" height="300px" :html="markup()" :scheme="scheme()"
    @load="events.load.push($event)" @reload="events.reload.push($event)" @viewport="events.viewport.push($event)" @scheme="events.scheme.push($event)" />
</div>
<div style="width: 600px">
  <PreviewFrame id="silent" height="200px" html="{{ silent }}" />
</div>
<div style="width: 600px">
  <PreviewFrame id="phone" scripts viewport="phone" scheme="light" height="454px" html="{{ phone }}" />
</div>
<div style="width: 600px" class="dark">
  <PreviewFrame id="bare" toolbar="false" height="120px" html="<p>bare</p>" />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('isolation', () => {
  it('raises no script errors on the host', async () => {
    expect(await page.errors()).toEqual([])
  })

  it('runs no script in the page unless asked', async () => {
    const result = await page.json(on(`return later(() => ({ sandbox: frame('silent').getAttribute('sandbox'), has: frame('silent').hasAttribute('sandbox'), said: said('silent').length }))`))

    // Empty, and present: a frame with no sandbox attribute is not sandboxed.
    expect(result).toEqual({ sandbox: '', has: true, said: 0 })
  })

  it('gives a page that may run scripts no way to the host', async () => {
    const result = await page.json(on(`return { sandbox: frame('scripted').getAttribute('sandbox'), report: last('scripted') }`))

    expect(result.sandbox).toBe('allow-scripts')
    expect(result.report.origin).toBe('null')
    expect(result.report.hostDocument).toBe('blocked')
    expect(result.report.hostStorage).toBe('blocked')
    expect(result.report.hostSecret).toBe('blocked')
    // Not the host's storage or cookies either: it has none of its own to read.
    expect(result.report.ownStorage).toBe('blocked')
    expect(result.report.cookie).not.toContain('host=1')
  })

  it('cannot be read from the host by accident either', async () => {
    const result = await page.json(on(`
      let reached = 'blocked'
      try { reached = String(frame('scripted').contentDocument) } catch (e) {}
      return { reached, referrer: frame('scripted').getAttribute('referrerpolicy'), title: frame('scripted').title }
    `))

    expect(result.reached === 'null' || result.reached === 'blocked').toBe(true)
    expect(result.referrer).toBe('no-referrer')
    expect(result.title).toBe('Welcome mail')
  })
})

describe('the colour scheme', () => {
  /*
   * What the page inside reports is the engine's doing, and the two engines
   * this suite runs in do different things (stacksjs/stx#2186).
   *
   * Chromium hands a frame's `color-scheme` to its page, so a frame drawn dark
   * holds a page that prefers dark. WebKit does not: the page keeps the
   * system's scheme whatever its frame is drawn with. Written as one
   * expectation, this case passed or failed by the appearance of the machine
   * it ran on (a Mac set to dark agreed with the dark frame and not the light
   * one) and never ran in WebKit on CI at all.
   *
   * So each engine is held to what it does. If WebKit starts passing the
   * scheme on, its half fails, and the README's limit can come out.
   */
  const pageSees = async (forced: boolean): Promise<boolean> =>
    page.apple ? page.json<boolean>(`return matchMedia('(prefers-color-scheme: dark)').matches`) : forced

  it('is drawn on the frame, and reaches the page where the engine passes it on', async () => {
    const result = await page.json(on(`return { scripted: last('scripted').dark, phone: last('phone').dark, style: frame('scripted').style.colorScheme, phoneStyle: frame('phone').style.colorScheme, attr: host('scripted').getAttribute('data-scheme'), phoneAttr: host('phone').getAttribute('data-scheme') }`))

    // The host's side is the component's own, and the same in every engine.
    expect(result).toMatchObject({ style: 'dark', attr: 'dark', phoneStyle: 'light', phoneAttr: 'light' })
    // The page's side: forced where the engine allows it, the system's where not.
    expect({ scripted: result.scripted, phone: result.phone }).toEqual({ scripted: await pageSees(true), phone: await pageSees(false) })
  })

  it('changes without reloading the page when the prop changes', async () => {
    const result = await page.json(on(`
      const before = frame('scripted')
      window.schemeChanges = []
      // The page itself is told: its media query changes under it.
      probe.scheme.set('light')
      return later(() => ({ same: frame('scripted') === before, style: frame('scripted').style.colorScheme, event: probe.events.scheme.slice(-1)[0] }), 80)
    `))

    expect(result.same).toBe(true)
    expect(result.style).toBe('light')
    expect(result.event).toMatchObject({ scheme: 'light', effectiveScheme: 'light' })
  })

  it('toggles from the toolbar, and says which it is', async () => {
    const result = await page.json(on(`
      const button = host('scripted').querySelector('[data-pf-action="scheme"]')
      const before = { pressed: button.getAttribute('aria-pressed'), text: button.textContent.trim() }
      button.click()
      const after = { pressed: button.getAttribute('aria-pressed'), text: button.textContent.trim(), style: frame('scripted').style.colorScheme, label: button.getAttribute('aria-label') }
      api('scripted').reload()
      return later(() => ({ before, after, page: last('scripted').dark }))
    `))

    expect(result.before).toEqual({ pressed: 'false', text: 'Light' })
    expect(result.after).toEqual({ pressed: 'true', text: 'Dark', style: 'dark', label: 'Dark colour scheme' })
    expect(result.page).toBe(await pageSees(true))
  })

  it('follows a dark host page when left on auto', async () => {
    const result = await page.json(on(`return { state: api('bare').getState(), style: frame('bare').style.colorScheme }`))

    expect(result.state.scheme).toBe('auto')
    expect(result.state.effectiveScheme).toBe('dark')
    expect(result.style).toBe('dark')
  })
})

describe('viewports', () => {
  it('fills its box by default', async () => {
    const result = await page.json(on(`return { frame: box(frame('scripted')), stage: box(host('scripted').querySelector('[data-pf="stage"]')), width: last('scripted').width, state: api('scripted').getState() }`))

    expect(result.frame).toEqual(result.stage)
    expect(result.width).toBe(598)
    expect(result.state).toMatchObject({ viewport: 'fill', width: null, height: null, scale: 1 })
  })

  it('lays a phone out at its real width and draws it smaller', async () => {
    const result = await page.json(on(`
      const stage = box(host('phone').querySelector('[data-pf="stage"]')), device = box(host('phone').querySelector('[data-pf="device"]'))
      return { stage, device, layout: [frame('phone').offsetWidth, frame('phone').offsetHeight], page: last('phone').width, state: api('phone').getState(), size: host('phone').querySelector('[data-pf="size"]').textContent }
    `))

    // The page's own media queries see 390, whatever the box is.
    expect(result.page).toBe(390)
    expect(result.layout).toEqual([390, 844])
    expect(result.state.scale).toBeLessThan(1)
    expect(result.device.h).toBeLessThanOrEqual(result.stage.h - 30)
    expect(result.device.w / result.device.h).toBeCloseTo(390 / 844, 1)
    expect(result.size).toBe('390 × 844 at ' + Math.round(result.state.scale * 100) + '%')
  })

  it('is a radio group the arrow keys move through', async () => {
    const result = await page.json(on(`
      const buttons = () => Array.from(host('phone').querySelectorAll('[data-pf-viewport]'))
      const read = () => buttons().map(b => b.getAttribute('aria-checked') + ':' + b.tabIndex).join(' ')
      const out = { group: buttons()[0].parentElement.getAttribute('role'), role: buttons()[0].getAttribute('role'), start: read() }
      const chosen = buttons().find(b => b.tabIndex === 0); chosen.focus()
      out.handled = !press(chosen, 'ArrowRight'); out.right = read(); out.focus = document.activeElement.textContent.trim()
      press(document.activeElement, 'ArrowLeft'); press(document.activeElement, 'ArrowLeft'); out.left = read()
      out.ignored = press(document.activeElement, 'a')
      out.state = api('phone').getState()
      return out
    `))

    expect(result.group).toBe('radiogroup')
    expect(result.role).toBe('radio')
    expect(result.start).toBe('false:-1 true:0 false:-1 false:-1')
    expect(result.handled).toBe(true)
    expect(result.right).toBe('false:-1 false:-1 true:0 false:-1')
    expect(result.focus).toBe('Tablet')
    expect(result.left).toBe('true:0 false:-1 false:-1 false:-1')
    expect(result.ignored).toBe(true)
    expect(result.state.viewport).toBe('fill')
  })

  it('turns a phone on its side, and has nothing to turn when filling', async () => {
    const result = await page.json(on(`
      const rotate = host('phone').querySelector('[data-pf-action="rotate"]')
      const out = { disabledWhenFilling: rotate.disabled }
      host('phone').querySelector('[data-pf-viewport="phone"]').click()
      out.enabled = !rotate.disabled
      rotate.click()
      out.state = api('phone').getState(); out.pressed = rotate.getAttribute('aria-pressed'); out.layout = [frame('phone').offsetWidth, frame('phone').offsetHeight]
      host('phone').querySelector('[data-pf-viewport="desktop"]').click()
      out.desktop = { disabled: rotate.disabled, layout: [frame('phone').offsetWidth, frame('phone').offsetHeight] }
      return out
    `))

    expect(result.disabledWhenFilling).toBe(true)
    expect(result.enabled).toBe(true)
    expect(result.state).toMatchObject({ viewport: 'phone', width: 844, height: 390, landscape: true })
    expect(result.pressed).toBe('true')
    expect(result.layout).toEqual([844, 390])
    expect(result.desktop).toEqual({ disabled: true, layout: [1280, 800] })
  })

  it('takes a size of its own from the page', async () => {
    const result = await page.json(on(`
      api('scripted').setViewport('fill', { width: 300, height: 200 })
      const out = { state: api('scripted').getState(), layout: [frame('scripted').offsetWidth, frame('scripted').offsetHeight], event: probe.events.viewport.slice(-1)[0], checked: host('scripted').querySelectorAll('[data-pf-viewport][aria-checked="true"]').length, reachable: host('scripted').querySelectorAll('[data-pf-viewport][tabindex="0"]').length }
      api('scripted').setViewport('fill', { width: null, height: null })
      return out
    `))

    expect(result.state).toMatchObject({ viewport: 'custom', width: 300, height: 200, scale: 1 })
    expect(result.layout).toEqual([300, 200])
    expect(result.event).toMatchObject({ viewport: 'custom', width: 300 })
    // No button is the custom size, and the group can still be tabbed into.
    expect(result.checked).toBe(0)
    expect(result.reachable).toBe(1)
  })
})

describe('loading', () => {
  it('says when the page has loaded', async () => {
    const loads = await page.json(on(`return probe.events.load`))

    expect(loads.length).toBeGreaterThan(0)
    expect(loads[0]).toMatchObject({ viewport: 'fill' })
  })

  it('reloads from nothing, and says so', async () => {
    const result = await page.json(on(`
      const before = frame('scripted'), count = said('scripted').length, reloads = probe.events.reload.length
      host('scripted').querySelector('[data-pf-action="reload"]').click()
      return later(() => ({ fresh: frame('scripted') !== before, frames: host('scripted').querySelectorAll('iframe').length, ran: said('scripted').length - count, reloads: probe.events.reload.length - reloads, sandbox: frame('scripted').getAttribute('sandbox') }))
    `))

    expect(result).toEqual({ fresh: true, frames: 1, ran: 1, reloads: 1, sandbox: 'allow-scripts' })
  })

  it('shows new markup when the prop changes', async () => {
    const result = await page.json(on(`
      const count = window.messages.length
      probe.markup.set(probe.markup().replace('"scripted"', '"second"'))
      return later(() => ({ second: said('second').length, doc: frame('scripted').srcdoc.slice(0, 15) }))
    `))

    expect(result.second).toBe(1)
    expect(result.doc).toBe('<!doctype html>')
  })

  it('leaves out the toolbar when told to', async () => {
    const result = await page.json(on(`return { toolbar: host('bare').querySelectorAll('[role="toolbar"]').length, frame: box(frame('bare')), other: host('scripted').querySelector('[role="toolbar"]').getAttribute('aria-label') }`))

    expect(result.toolbar).toBe(0)
    expect(result.frame.h).toBe(118)
    expect(result.other).toBe('Welcome mail controls')
  })
})
