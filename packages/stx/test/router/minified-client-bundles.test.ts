/**
 * A minified build (`buildMode: 'compile'`) hydrates like a dev build.
 *
 * Bun prints a fully minified bundle on ONE line:
 * `import{X as n}from"stx-module:…";import{state as c}from"stx";var e=c(n);export{e as count};`.
 * Every pass after the build reads it line by line -- the registry import
 * rewrite, the external-import hoist, the export capture -- so none of them
 * matched. The export capture found nothing, the "dropped every binding" guard
 * fired, and the component shipped its UNBUNDLED source: raw imports in a
 * classic script, "Cannot use import statement outside a module", and a scope
 * that never registered.
 */
import { afterEach, expect, it } from 'bun:test'
import { generateSignalsRuntime } from '../../src/signals'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from './spa-harness'

afterEach(() => closeBrowser())

// Imports the runtime itself, so the registry bundle has an external import to
// hoist: on one line it stayed inside the bundle's function, a SyntaxError.
const STEPS = `import { state } from 'stx'
globalThis.__minifiedRuns = (globalThis.__minifiedRuns || 0) + 1
export const startingCount = state(3)
export function describeCount(value) { return 'count is ' + value }
`

it('hydrates a component whose minified bundle imports modules', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'functions/steps.ts': STEPS,
    'components/Counter.stx': `<script client>
import '../functions/steps'
import { describeCount, startingCount } from '../functions/steps'
const counterValue = startingCount
const counterLabel = derived(() => describeCount(counterValue()))
function incrementCounter() { counterValue.set(counterValue() + 1) }
</script>
<p id="label" :text="counterLabel"></p>
<button id="more" @click="incrementCounter()">More</button>`,
    'pages/index.stx': page('app', '<Counter />'),
  }, { '/': 'pages/index.stx' }, { buildMode: 'compile' })
  try {
    const html = app.documents.get('/')!
    // Nothing a classic script cannot parse.
    expect(html.match(/(?:^|[;\s])import(?:\s*["'{*]|\s+[\w$]+\s+from\b)[^\n]{0,80}/m)?.[0]).toBeUndefined()

    // The production builder swaps this placeholder for the fingerprinted
    // runtime file; the harness runs inline scripts only, so inline it.
    const runtimeTag = '<script data-stx-runtime src="/__stx/runtime.__STX_HASH__.js"></script>'
    expect(html).toContain(runtimeTag)
    app.documents.set('/', html.replace(runtimeTag, () => `<script data-stx-runtime>${generateSignalsRuntime()}</script>`))

    const browser = await boot(app, '/')
    await settle()
    // The harness runs page scripts against the test process global.
    expect((globalThis as any).__minifiedRuns).toBe(1)
    const host = find(browser, '#label').closest('[data-stx-scope]')
    const scope = (browser.window as any).stx._scopes[host.getAttribute('data-stx-scope')]
    expect(scope).toBeDefined()
    expect(find(browser, '#label').textContent).toBe('count is 3')

    scope.incrementCounter()
    await settle()
    expect(find(browser, '#label').textContent).toBe('count is 4')
  }
  finally {
    delete (globalThis as any).__minifiedRuns
    await app.dispose()
  }
})
