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
 * And the symmetry the first fix stopped short of: hiding the branch fires
 * the component's `onDestroy`, and showing it again fires its `onMount` again.
 * The scope itself is still kept across the toggle -- #1737 needs the
 * registration to survive for the re-show -- so this is a lifecycle that
 * follows the toggle, not a teardown and rebuild. Without it the modal shell
 * did everything right on its first opening and nothing on any later one:
 * no focus moved in, the page scrolled behind it, and Escape did nothing.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

/** A component whose client script is nothing but lifecycle hooks. */
function lifecycleChild(name: string): string {
  return `<script client>
onMount(() => {
  (window.MOUNTS = window.MOUNTS || []).push('${name}')
  onDestroy(() => { (window.MOUNT_CLEANUPS = window.MOUNT_CLEANUPS || []).push('${name}') })
})
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

  it('destroys it when the condition goes false', async () => {
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    browser.window.SET_HOST(true)
    await settle()
    browser.window.SET_HOST(false)
    await settle()

    expect(browser.window.DESTROYS).toEqual(['gated'])
    expect(observed(browser)).toEqual({ mounts: ['ungated', 'gated'], rendered: 1 })

    await app.dispose()
  })

  it('mounts it again each time it is shown again, and destroys it each time it hides', async () => {
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    for (const value of [true, false, true, false, true]) {
      browser.window.SET_HOST(value)
      await settle()
    }

    expect(browser.window.MOUNTS).toEqual(['ungated', 'gated', 'gated', 'gated'])
    expect(browser.window.DESTROYS).toEqual(['gated', 'gated'])
    expect(browser.window.MOUNT_CLEANUPS).toEqual(['gated', 'gated'])
    expect(observed(browser).rendered).toBe(2)
    expect(browser.errors).toEqual([])

    await app.dispose()
  })

  it('never mounts it twice without a hide in between', async () => {
    // A condition re-evaluating to the same truthy value is not a re-show.
    const app = await renderApp(FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    browser.window.SET_HOST(true)
    await settle()
    browser.window.SET_HOST(1)
    await settle()

    expect(browser.window.MOUNTS).toEqual(['ungated', 'gated'])
    expect(browser.window.DESTROYS ?? []).toEqual([])

    await app.dispose()
  })
})

/**
 * A cleanup handed back by `onMount` belongs to that mount: it runs at the
 * hide that ends it, once, and the next mount hands back its own.
 */
const CLEANUP_FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/Returns.stx': `<script client>
onMount(() => {
  window.LIVE = (window.LIVE || 0) + 1
  return () => { window.LIVE -= 1; (window.CLEANUPS = window.CLEANUPS || []).push('returned') }
})
</script>
<div class="returns">returns</div>
`,
  'views/gate.stx': page('default', `<script client>
const hostOpen = state(false)
window.SET_HOST = value => hostOpen.set(value)
</script>
<div>
  <div :if="hostOpen">
    <Returns />
  </div>
</div>
`),
}

describe('a cleanup returned from onMount', () => {
  it('runs once per hide, so nothing it released is held twice or leaked', async () => {
    const app = await renderApp(CLEANUP_FILES, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    for (const value of [true, false, true, false]) {
      browser.window.SET_HOST(value)
      await settle()
    }

    expect(browser.window.LIVE).toBe(0)
    expect(browser.window.CLEANUPS).toEqual(['returned', 'returned'])

    browser.window.SET_HOST(true)
    await settle()
    expect(browser.window.LIVE).toBe(1)

    await app.dispose()
  })
})

/** The same component in each branch shape a condition can take. */
const SHAPE_FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/Gated.stx': lifecycleChild('gated'),
  'components/Other.stx': lifecycleChild('other'),
  'views/chain.stx': page('default', `<script client>
const pick = state('a')
window.PICK = value => pick.set(value)
</script>
<div>
  <div :if="pick === 'a'"><Gated /></div>
  <div :else><Other /></div>
</div>
`),
  'views/template.stx': page('default', `<script client>
const hostOpen = state(false)
window.SET_HOST = value => hostOpen.set(value)
</script>
<div>
  <template :if="hostOpen"><Gated /></template>
</div>
`),
}

describe('a component in an :if / :else chain', () => {
  it('unmounts with its branch and mounts again when the branch comes back', async () => {
    const app = await renderApp(SHAPE_FILES, { '/chain': 'views/chain.stx' })
    const browser = await boot(app, '/chain')

    expect(browser.window.MOUNTS).toEqual(['gated'])

    browser.window.PICK('b')
    await settle()
    browser.window.PICK('a')
    await settle()

    expect(browser.window.MOUNTS).toEqual(['gated', 'other', 'gated'])
    expect(browser.window.DESTROYS).toEqual(['gated', 'other'])
    expect(browser.errors).toEqual([])

    await app.dispose()
  })
})

describe('a component in a <template :if>', () => {
  it('unmounts when the branch hides and mounts when it is cloned back', async () => {
    const app = await renderApp(SHAPE_FILES, { '/template': 'views/template.stx' })
    const browser = await boot(app, '/template')

    for (const value of [true, false, true]) {
      browser.window.SET_HOST(value)
      await settle()
    }

    expect(browser.window.MOUNTS).toEqual(['gated', 'gated'])
    expect(browser.window.DESTROYS).toEqual(['gated'])
    expect(browser.errors).toEqual([])

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

  it('follows the partial\'s condition both ways', async () => {
    const app = await renderApp({
      ...PARTIAL_FILES,
      'partials/gate-local.stx': PARTIAL_FILES['partials/gate-local.stx'].replace(
        'const localOpen = state(false)',
        'const localOpen = state(false)\nwindow.SET_LOCAL = value => localOpen.set(value)',
      ),
    }, { '/gate': 'views/gate.stx' })
    const browser = await boot(app, '/gate')

    for (const value of [true, false, true]) {
      browser.window.SET_LOCAL(value)
      await settle()
    }

    expect(browser.window.MOUNTS).toEqual(['gated', 'gated'])
    expect(browser.window.DESTROYS).toEqual(['gated'])

    await app.dispose()
  })
})

/**
 * A component with an `:if` of its own, hidden by its page after it was bound.
 *
 * The component's `:if` binds its children in a microtask. When the page hid
 * the component in between -- a saved choice restored in a promise, a fetch
 * that lands -- that pass found the branch off the page and gave up, and as
 * its condition never changed again nothing retried it. Shown again, the
 * component kept its `:for` rows as raw markup: a coach's strength session
 * editor read `{{ row.title }}` once Strength was picked.
 */
const LIST_FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/RowList.stx': `<script client>
const listRows = useReactiveProp('rows', [])
const listShown = derived(() => (listRows() || []).length > 0)
</script>
<div class="row-list">
  <ol :if="listShown">
    <li :for="row in listRows" :key="row.id" class="row-item">{{ row.name }}</li>
  </ol>
</div>
`,
  'views/list.stx': page('default', `<script client>
const listOpen = state(true)
const pageRows = state([{ id: 1, name: 'Squat' }, { id: 2, name: 'Plank' }])
Promise.resolve().then(() => listOpen.set(false))
window.SET_LIST = value => listOpen.set(value)
</script>
<div>
  <div :if="listOpen">
    <RowList :rows="pageRows" />
  </div>
</div>
`),
}

describe('a component hidden by its page between its bind and its :if pass', () => {
  it('binds its rows when the page shows it again', async () => {
    const app = await renderApp(LIST_FILES, { '/list': 'views/list.stx' })
    const browser = await boot(app, '/list')
    expect(browser.document.querySelector('.row-list')).toBeNull()

    browser.window.SET_LIST(true)
    await settle()

    const rows = Array.from(browser.document.querySelectorAll('.row-item')).map((row: any) => row.textContent.trim())
    expect(rows).toEqual(['Squat', 'Plank'])
    expect(browser.errors).toEqual([])

    await app.dispose()
  })
})
