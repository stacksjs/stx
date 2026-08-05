/**
 * A page that reaches for `window.stx` always gets the runtime
 * (stacksjs/stx#1820).
 *
 * Two decisions used to be made independently about the same page:
 * `processSignals` decided whether to inject the signals runtime by reading the
 * template, and the client-script pass decided separately to emit
 * `window.stx.mount(...)`. Nothing reconciled them. When they disagreed the page
 * died on its first client line with "Cannot read properties of undefined
 * (reading 'mount')" — and because every function in the block is defined
 * *inside* that callback, the throw took every handler on the page with it.
 *
 * The gate was widened twice for this and still could not close it. Two reasons
 * it structurally cannot:
 *
 *  - It runs against a template `processEventDirectives` has already rewritten
 *    `@click` out of, so an event-only page can never match an `@event=`
 *    pattern however many are added.
 *  - Its own `data-stx-scoped` safety net is dead code as ordered — the gate
 *    runs before the client-script pass emits that attribute.
 *
 * So the invariant is asserted of the finished output instead, where both
 * decisions have already been made. These tests state it directly: if the
 * rendered page contains an unguarded reach for `window.stx`, the runtime tag
 * is there too.
 *
 * The negative cases matter as much. Keying on "has a client script" — the
 * obvious reading — would pull ~159KB onto every static page that sets a theme,
 * because the appearance bootstrap emits a self-contained `data-stx-scoped`
 * script on pages with no reactivity at all.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { outputNeedsSignalsRuntime, pageShipsSignalsRuntime } from '../../src/runtime-injection'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: true,
} as never

function render(template: string): Promise<string> {
  return processDirectives(template, {}, '/app/page.stx', base, new Set<string>())
}

/** Everything except the runtime script itself — that is allowed to use window.stx. */
function withoutRuntimeScript(html: string): string {
  return html.replace(/<script[^>]*\bdata-stx-runtime\b[\s\S]*?<\/script>/gi, '')
}

describe('mount implies runtime', () => {
  it('ships the runtime for a client script of plain functions bound by @click', async () => {
    // The shape the gate structurally cannot see: processEventDirectives
    // rewrites the @click away before the gate reads the template.
    const out = await render(`<script client>
function doThing() { console.log('hi') }
</script>
<main><button @click="doThing()">go</button></main>`)

    expect(out).toContain('window.stx.mount(')
    expect(pageShipsSignalsRuntime(out)).toBe(true)
  })

  it('ships the runtime for the reported useStore page', async () => {
    // Verbatim from the report: a store, one bound attribute, two handlers.
    const out = await render(`<script client>
const themeStore = useStore('theme')
const theme = themeStore.theme
function toggleTheme() { themeStore.toggle() }
function logout() { console.log('out') }
</script>
<main :data-t="theme()">
  <button @click="toggleTheme">toggle</button>
  <button @click="logout">Log out</button>
</main>`)

    expect(pageShipsSignalsRuntime(out)).toBe(true)
  })

  it('leaves a page with no client code alone', async () => {
    const out = await render('<main><h1>Hi</h1><p>Plain.</p></main>')

    expect(outputNeedsSignalsRuntime(withoutRuntimeScript(out))).toBe(false)
    expect(pageShipsSignalsRuntime(out)).toBe(false)
  })

  it('leaves a <script server>-only page alone', async () => {
    const out = await render(`<script server>
const t = 'x'
</script>
<main><h1>{{ t }}</h1></main>`)

    expect(pageShipsSignalsRuntime(out)).toBe(false)
  })

  it('does not let the appearance bootstrap pull in the runtime', async () => {
    // It emits a self-contained data-stx-scoped script and touches no stx API.
    // Keying the invariant on the presence of a client script would ship the
    // whole runtime to every static page that remembers a theme.
    const out = await render(`@appearanceBootstrap
<main><h1>Hi</h1></main>`)

    expect(pageShipsSignalsRuntime(out)).toBe(false)
  })
})

describe('the unguarded-reach predicate', () => {
  it('flags the spellings that throw', () => {
    for (const code of [
      'window.stx.mount(function() {})',
      'window.stx.mountEl(el, fn)',
      'var { state, derived } = window.stx;',
      'if (!window.stx._scopes) window.stx._scopes = {};',
    ])
      expect(outputNeedsSignalsRuntime(`<script>${code}</script>`)).toBe(true)
  })

  it('ignores the guarded spellings the compiler also emits', () => {
    // Every one of these is real output from somewhere in the pipeline. A false
    // positive here means shipping the runtime to a page that does not need it.
    for (const code of [
      'var { state } = window.stx || window;',
      'var s = window.stx || {};',
      'window.stx = window.stx || {};',
      'var __s = window.stx = window.stx || {};',
      'if (window.stx) window.stx._latestSetup = null;',
      'if (window.stx && window.stx._cleanupContainer) window.stx._cleanupContainer(el);',
    ])
      expect(outputNeedsSignalsRuntime(`<script>${code}</script>`)).toBe(false)
  })

  it('says nothing about a page with no scripts', () => {
    expect(outputNeedsSignalsRuntime('<main><h1>Hi</h1></main>')).toBe(false)
  })
})
