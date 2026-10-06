/**
 * A component behind a false `:if` does not mount (stacksjs/stx#2036).
 *
 * `:if` did what it says to the markup -- nothing rendered -- while the child
 * component's `<script client>` ran anyway, so `onMount` fired for a component
 * that was not on the page and `onDestroy` never fired at all. A component
 * whose job starts at mount therefore could not be gated from outside: the
 * reported case was a modal shell that moves focus into its panel, traps Tab,
 * locks body scroll and claims Escape in `onMount`. Three of those behind
 * `:if` locked the document's scroll before anything had been opened, and
 * Escape reached whichever instance had registered last. The symptom was a
 * page you could not scroll with no dialog on it.
 *
 * Two things had to change, and both are covered here because they fix
 * different placements:
 *
 *   - `onMount`/`onDestroy` now count as needing a scope boundary
 *     (`hasSignalScripts`, utils.ts). Without one, a lifecycle-only component
 *     put its hooks on the runtime's GLOBAL mount queue -- a list with no link
 *     to any element -- which the DOMContentLoaded handler drains
 *     unconditionally. There was nothing to check a condition against. The same
 *     two names were already in `SIGNAL_API_RE`, which decides the identical
 *     question for a page script, and the two lists disagreeing is why this was
 *     reachable from a component and not from a page.
 *
 *   - the DOMContentLoaded scope walk skips a scope whose root is detached. A
 *     component gated inside a PARTIAL is still found by the walk -- the
 *     partial's own scope is on the page -- so the first change alone does not
 *     cover it.
 *
 * What is NOT claimed here: `:if` going true -> false does not fire
 * `onDestroy`, and a second show does not mount again. `bindIf` deliberately
 * does not dispose scopes on hide, because `:if` is a toggle and #1737 needs
 * the registration to survive for the re-show. So this delivers the deferral
 * the issue named as sufficient ("or for `:if` to defer the mount"), not full
 * symmetry. A component that must release something on hide still needs a
 * bound prop it can watch.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

/** A component whose client script is nothing but lifecycle hooks. */
function lifecycleChild(name: string): string {
  return `<script client>
onMount(() => { (window.MOUNTS = window.MOUNTS || []).push('${name}') })
onDestroy(() => { (window.DESTROYS = window.DESTROYS || []).push('${name}') })
</script>
<div class="gate-child gate-${name}">${name}</div>
`
}

const FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/Gated.stx': lifecycleChild('gated'),
  'components/Ungated.stx': lifecycleChild('ungated'),
  'views/gate.stx': page('default', `<script client>
const hostOpen = state(false)
window.SET_HOST = value => hostOpen.set(value)
</script>
<div>
  <div :if="hostOpen">
    <Gated />
  </div>
  <Ungated />
</div>
`),
}

/** The same component, gated by a signal the PARTIAL declares. */
const PARTIAL_FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/Gated.stx': lifecycleChild('gated'),
  'partials/gate-local.stx': `<script client>
const localOpen = state(false)
</script>
<div :if="localOpen">
  <Gated />
</div>
`,
  'views/gate.stx': page('default', `<div>@include('gate-local')</div>`),
}

function observed(browser: { window: any, document: any }) {
  return {
    mounts: browser.window.MOUNTS ?? [],
    rendered: browser.document.querySelectorAll('.gate-child').length,
  }
}

describe('a component gated by :if in the view', () => {
  it('does not mount while the condition is false', async () => {
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    // `ungated` is the control: it proves the page hydrated at all, so an
    // empty mount list cannot pass by nothing having run.
    expect(observed(browser)).toEqual({ mounts: ['ungated'], rendered: 1 })
    expect(browser.errors).toEqual([])

    await app.dispose()
  })

  it('renders nothing for it either, so the assertion is not vacuous', async () => {
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    expect(browser.document.querySelector('.gate-gated')).toBeNull()

    await app.dispose()
  })

  it('mounts and renders it once the condition is true', async () => {
    // The other half: deferring the mount is only correct if showing the
    // subtree still delivers it.
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    browser.window.SET_HOST(true)
    await settle()

    expect(observed(browser)).toEqual({ mounts: ['ungated', 'gated'], rendered: 2 })

    await app.dispose()
  })

  it('does not mount it a second time when shown again', async () => {
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    browser.window.SET_HOST(true)
    await settle()
    browser.window.SET_HOST(false)
    await settle()
    browser.window.SET_HOST(true)
    await settle()

    expect(browser.window.MOUNTS).toEqual(['ungated', 'gated'])

    await app.dispose()
  })
})

describe('a component gated by :if inside a partial', () => {
  it('does not mount while the partial\'s own condition is false', async () => {
    // The placement the scope boundary alone does not fix: the partial's scope
    // IS on the page, so the DOMContentLoaded walk reaches the component's
    // scope and has to notice its root is detached.
    const app = await renderApp(PARTIAL_FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    expect(observed(browser)).toEqual({ mounts: [], rendered: 0 })
    expect(browser.errors).toEqual([])

    await app.dispose()
  })
})
