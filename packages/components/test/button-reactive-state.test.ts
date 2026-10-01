/**
 * Button's `disabled` and `loading` follow the parent's signal after render.
 *
 * Both props used to be evaluated once on the server and frozen:
 *
 *     const disabledNow = {{ isDisabled }}
 *     <button @if(isDisabled)disabled@endif>
 *
 * so the single most common piece of button state in an application could not
 * be expressed at all:
 *
 *     <Button :disabled="saving()" @click="save">Save</Button>
 *
 * `saving()` is a signal. On the server it is not yet meaningful, `isDisabled`
 * resolved false, and the button shipped enabled and stayed enabled for the
 * life of the page — through the exact async action it was there to guard.
 * Double-submit protection, destructive deletes and rotate-key confirmations
 * all land on this. The same freeze hid the built-in spinner: `loading` could
 * only ever be true if it had been true when the page was built, which is
 * never the case for an action that starts on a click.
 *
 * The reporting app measured 22 of its 50 otherwise-migratable buttons as
 * depending on a reactive `:disabled`, and kept a plain `<button>` for them.
 *
 * stacksjs/stx#1997.
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
 * A parent that owns the signal, which is the shape the bug is about: the value
 * is not known until something happens on the client, long after render.
 */
const HOST = `<script client>
  const saving = state(false)
  function flip() { saving.set(!saving()) }
</script>

<div id="host">
  <Button className="probe" :disabled="saving()" :loading="saving()">Save</Button>
</div>`

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Button.stx': component('button/Button.stx'),
  'components/Host.stx': HOST,
  'pages/index.stx': page('app', '<Host />'),
}

const ROUTES = { '/': 'pages/index.stx' }

interface Harness {
  /** The component's own <button>, found by the className the parent passed. */
  button: () => any
  /** The spinner, which stays in the DOM and is shown by `:show`. */
  spinner: () => any
  /** Flip the parent's signal. */
  flip: () => void
  dispose: () => Promise<void>
}

async function mount(): Promise<Harness> {
  const app = await renderApp(FILES, ROUTES)
  const browser = await boot(app, '/')
  await settle()
  const hostEl = find(browser, '#host').closest('[data-stx-scope]')
  const hostScope = browser.window.stx._scopes[hostEl.getAttribute('data-stx-scope')]
  return {
    button: () => find(browser, 'button.probe'),
    spinner: () => find(browser, 'button.probe svg'),
    // Called on the scope rather than dispatched: this harness renders the
    // @click attribute but does not wire it as a DOM listener, the same reason
    // dialog-modal-behaviour.test.ts invokes its handler directly.
    flip: () => hostScope.flip(),
    dispose: () => app.dispose(),
  }
}

/** `:show` toggles display rather than detaching, so ask the style. */
function visible(el: any): boolean {
  return !!el && el.style.display !== 'none'
}

afterEach(() => {
  closeBrowser()
})

describe('#1997 — Button reads disabled and loading as live props', () => {
  it('ships enabled while the parent signal is false', async () => {
    const h = await mount()
    expect(h.button().hasAttribute('disabled')).toBe(false)
    expect(h.button().getAttribute('aria-busy')).toBe('false')
    await h.dispose()
  })

  it('disables when the parent signal flips after render', async () => {
    const h = await mount()
    h.flip()
    await settle()
    // The whole bug: this stayed false forever, because the attribute came from
    // a value computed before the page was sent.
    expect(h.button().hasAttribute('disabled')).toBe(true)
    await h.dispose()
  })

  it('re-enables when the signal flips back, so the state is not one-way', async () => {
    const h = await mount()
    h.flip()
    await settle()
    h.flip()
    await settle()
    expect(h.button().hasAttribute('disabled')).toBe(false)
    await h.dispose()
  })

  it('marks itself busy for assistive tech while loading', async () => {
    const h = await mount()
    h.flip()
    await settle()
    expect(h.button().getAttribute('aria-busy')).toBe('true')
    await h.dispose()
  })

  it('reveals the spinner when loading turns on after render', async () => {
    const h = await mount()
    // Present from the start but hidden. It used to live inside an @if, so the
    // only way to see it was to have been loading when the page was built.
    expect(h.spinner()).toBeTruthy()
    expect(visible(h.spinner())).toBe(false)
    h.flip()
    await settle()
    expect(visible(h.spinner())).toBe(true)
    await h.dispose()
  })
})
