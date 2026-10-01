/**
 * Progress and Tooltip read their remaining state props as live props.
 *
 * #1704 made `Progress.value` and `Tooltip.show` reactive, and #1997 did the
 * same for `Button.disabled`/`loading`. The props beside them were still read
 * once on the server and frozen, which matters most where the frozen value is
 * the one that cannot be known at render time:
 *
 *   <Progress :max="total()" :indeterminate="!total()" :value="done()" />
 *
 * A bar is indeterminate precisely BECAUSE the total is not known yet, so the
 * moment that changes is the moment both props must change — and both were the
 * ones that could not. The bar spun forever and `aria-valuemax` kept reporting
 * a denominator the component was no longer using.
 *
 *   <Tooltip :disabled="editing()">…</Tooltip>
 *
 * Same shape: a tooltip is suppressed by state the page learns later.
 *
 * Follows stacksjs/stx#1997.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** The shipped component, not a copy: the point is to test what apps install. */
function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

/**
 * A parent owning the signals, which is the shape these bugs are about: the
 * total arrives after render, and everything derived from it has to follow.
 */
const HOST = `<script client>
  const total = state(0)
  const done = state(3)
  const editing = state(false)
  function arrive() { total.set(10) }
  function edit() { editing.set(true) }
</script>

<div id="host">
  <Progress className="bar" variant="circular" :value="done()" :max="total() || 1" :indeterminate="!total()" />
  <Tooltip className="tip" text="Hint" :disabled="editing()">
    <span>trigger</span>
  </Tooltip>
</div>`

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Progress.stx': component('progress/Progress.stx'),
  'components/Tooltip.stx': component('tooltip/Tooltip.stx'),
  'components/Host.stx': HOST,
  'pages/index.stx': page('app', '<Host />'),
}

const ROUTES = { '/': 'pages/index.stx' }

interface Harness {
  bar: () => any
  scope: (selector: string) => any
  arrive: () => void
  edit: () => void
  dispose: () => Promise<void>
}

async function mount(): Promise<Harness> {
  const app = await renderApp(FILES, ROUTES)
  const browser = await boot(app, '/')
  await settle()
  const hostEl = find(browser, '#host').closest('[data-stx-scope]')
  const hostScope = browser.window.stx._scopes[hostEl.getAttribute('data-stx-scope')]
  return {
    bar: () => find(browser, '[role="progressbar"]'),
    // A component's own setup scope, for reaching what it computed.
    scope: (selector: string) => {
      const el = find(browser, selector)?.closest('[data-stx-scope]')
      return el ? browser.window.stx._scopes[el.getAttribute('data-stx-scope')] : null
    },
    // Called on the scope rather than dispatched: the harness renders @click
    // but does not wire it as a DOM listener.
    arrive: () => hostScope.arrive(),
    edit: () => hostScope.edit(),
    dispose: () => app.dispose(),
  }
}

afterEach(() => {
  closeBrowser()
})

describe('Progress reads max and indeterminate as live props', () => {
  it('starts indeterminate while the total is unknown', async () => {
    const h = await mount()
    expect(h.scope('[role="progressbar"]').isIndeterminate()).toBe(true)
    await h.dispose()
  })

  it('stops being indeterminate once the total arrives', async () => {
    const h = await mount()
    h.arrive()
    await settle()
    // The bug: frozen, this stayed true and the bar spun forever.
    expect(h.scope('[role="progressbar"]').isIndeterminate()).toBe(false)
    await h.dispose()
  })

  it('drops animate-spin from the circular bar when the total arrives', async () => {
    const h = await mount()
    const circle = () => h.bar().querySelector('circle:last-of-type')
    expect(circle().getAttribute('class')).toContain('animate-spin')
    h.arrive()
    await settle()
    expect(circle().getAttribute('class')).not.toContain('animate-spin')
    await h.dispose()
  })

  it('reports the new denominator to assistive tech', async () => {
    const h = await mount()
    expect(h.bar().getAttribute('aria-valuemax')).toBe('1')
    h.arrive()
    await settle()
    expect(h.bar().getAttribute('aria-valuemax')).toBe('10')
    await h.dispose()
  })

  it('recomputes the percentage against the live max', async () => {
    const h = await mount()
    h.arrive()
    await settle()
    // 3 of 10, not 3 of the 1 it was built with.
    expect(Math.round(h.scope('[role="progressbar"]').percentage())).toBe(30)
    await h.dispose()
  })
})

describe('Tooltip reads disabled as a live prop', () => {
  it('is enabled while the parent signal is false', async () => {
    const h = await mount()
    expect(h.scope('[data-stx-scope] span')?.isDisabled?.()).toBe(false)
    await h.dispose()
  })

  it('suppresses itself once the parent disables it after render', async () => {
    const h = await mount()
    h.edit()
    await settle()
    const tip = h.scope('[data-stx-scope] span')
    tip.showTooltip()
    await settle()
    // Frozen, showTooltip() read a false captured at build time and showed.
    expect(tip.isVisible()).toBe(false)
    await h.dispose()
  })
})
