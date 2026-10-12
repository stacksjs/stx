/**
 * A component whose `<script client>` has a bare side-effect import still
 * hydrates, and the module runs once.
 *
 * Bun prints a side-effect import of an external with no space:
 * `import"stx-module:resources/functions/steps.ts";`. The registry rewrite
 * only matched `import "…"`, so that statement reached the page's classic
 * scope script as a raw ES import: "Cannot use import statement outside a
 * module", and the component's scope never registered ("hydration invariant
 * failed … not registered"). Named imports print with spaces and were fine,
 * which is why the bug hid behind `import { X } from` workarounds.
 */
import { afterEach, expect, it } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from './spa-harness'

afterEach(() => closeBrowser())

const STEPS = `globalThis.__sideEffectRuns = (globalThis.__sideEffectRuns || 0) + 1
globalThis.__tourSteps = ['welcome', 'plan', 'done']
export const unused = true
`

it('hydrates a component that only side-effect imports a module', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'functions/steps.ts': STEPS,
    'components/Tour.stx': `<script client>
import '../functions/steps'
const steps = state(globalThis.__tourSteps || [])
</script>
<p id="tour" :text="steps.length"></p>`,
    'pages/index.stx': page('app', '<Tour />'),
  }, { '/': 'pages/index.stx' })
  try {
    const html = app.documents.get('/')!
    // The raw statement, as Bun printed it, must not reach the page.
    expect(html.match(/import\s*["']stx-module:[^"']+["']/)?.[0]).toBeUndefined()

    const browser = await boot(app, '/')
    await settle()
    const win = browser.window as any
    // The harness runs page scripts against the test process global.
    expect((globalThis as any).__sideEffectRuns).toBe(1)
    const host = find(browser, '#tour').closest('[data-stx-scope]')
    expect(win.stx._scopes[host.getAttribute('data-stx-scope')]).toBeDefined()
    expect(find(browser, '#tour').textContent).toBe('3')
  }
  finally {
    delete (globalThis as any).__sideEffectRuns
    delete (globalThis as any).__tourSteps
    await app.dispose()
  }
})
