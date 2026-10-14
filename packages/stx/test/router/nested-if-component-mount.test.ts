/**
 * A component behind a false `:if` stays unmounted when an ENCLOSING `:if`
 * shows (stacksjs/stx#2071).
 *
 * The reported page was a settings screen: a `loading` gate around every
 * pane, and inside it one `:if` per pane, some of them for panes the account
 * may not use. While `loading` was true the gate's subtree was detached, so
 * the inner conditionals had not been bound yet. When `loading` went false,
 * the gate's deferred pass (hydrateShownBranch) ran hydrateComponentScopes
 * over the whole subtree before binding it. That walk mounted every component
 * root it found -- including the ones still inside an inner `:if` whose
 * attribute was waiting for the same pass to evaluate it. The inner condition
 * then hid the pane, but its component had already run onMount and loaded.
 *
 * The setup half of hydrateComponentScopes already left such roots to their
 * own conditional (`hasPendingStructuralAncestor`); the mount half did not.
 * The same walk mounted the component in a `:for`'s source markup, which is
 * only ever a template for the rows (a ghost mount, even over an empty list).
 * A minimal page with a static gate did not reproduce it, because the
 * DOMContentLoaded walk binds the inner conditionals before anything mounts:
 * the gate has to start false and open later.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterAll(closeBrowser)

function lifecycleChild(name: string): string {
  return `<script client>
onMount(() => { (window.MOUNTS = window.MOUNTS || []).push('${name}') })
onDestroy(() => { (window.DESTROYS = window.DESTROYS || []).push('${name}') })
</script>
<div class="pane-child pane-${name}">${name}</div>
`
}

const PAGE = `<script client>
const loading = state(true)
const pane = state('')
const shownPane = derived(() => pane() || 'profile')
const allowed = state(false)
window.FINISH = () => loading.set(false)
window.OPEN = value => pane.set(value)
window.ALLOW = value => allowed.set(value)
</script>
<div>
  <div :if="loading">loading</div>
  <div :if="!loading">
    <div :if="shownPane === 'profile'" data-pane="profile">
      <ProfilePane />
    </div>
    <div :if="shownPane === 'doors' && allowed" data-pane="doors">
      <DoorPane />
    </div>
    <div :if="shownPane === 'till'" data-pane="till">
      <TillPane />
    </div>
  </div>
</div>
`

const FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/ProfilePane.stx': lifecycleChild('profile'),
  'components/DoorPane.stx': lifecycleChild('doors'),
  'components/TillPane.stx': lifecycleChild('till'),
  'views/settings.stx': page('default', PAGE),
}

/** The same panes inside the rows of a :for, which hydrates its rows the same way. */
const LOOP_FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/DoorPane.stx': lifecycleChild('doors'),
  'views/settings.stx': page('default', `<script client>
const rows = state([])
window.FILL = () => rows.set([{ id: 1, open: false }, { id: 2, open: true }])
</script>
<ul>
  <li :for="row in rows" :key="row.id">
    <div :if="row.open"><DoorPane /></div>
  </li>
</ul>
`),
}

/** A :for source inside the gate: its markup is a template for rows, not a component on the page. */
const LOOP_SOURCE_FILES = {
  'layouts/default.stx': layout('<header>chrome</header>'),
  'components/DoorPane.stx': lifecycleChild('doors'),
  'views/settings.stx': page('default', `<script client>
const ready = state(false)
const rows = state([])
window.FINISH = () => ready.set(true)
window.FILL = () => rows.set([{ id: 1 }])
</script>
<div :if="ready">
  <ul>
    <li :for="row in rows" :key="row.id"><DoorPane /></li>
  </ul>
</div>
`),
}

function mounts(browser: { window: any }): string[] {
  return browser.window.MOUNTS ?? []
}

describe('a component in a false :if inside an :if that opens later', () => {
  it('does not mount when the enclosing :if shows', async () => {
    const app = await renderApp(FILES, { '/settings': 'views/settings.stx' })
    const browser = await boot(app, '/settings')
    expect(mounts(browser)).toEqual([])

    browser.window.FINISH()
    await settle()

    // `profile` is the control: the enclosing branch did hydrate.
    expect(mounts(browser)).toEqual(['profile'])
    expect(browser.document.querySelector('.pane-doors')).toBeNull()
    expect(browser.document.querySelector('.pane-till')).toBeNull()
    expect(browser.errors).toEqual([])

    await app.dispose()
  })

  it('mounts it once its own condition turns true', async () => {
    const app = await renderApp(FILES, { '/settings': 'views/settings.stx' })
    const browser = await boot(app, '/settings')
    browser.window.FINISH()
    await settle()

    browser.window.OPEN('till')
    await settle()
    expect(mounts(browser)).toEqual(['profile', 'till'])
    expect(browser.window.DESTROYS).toEqual(['profile'])

    // A compound condition: the pane is picked, then allowed.
    browser.window.OPEN('doors')
    await settle()
    expect(mounts(browser)).toEqual(['profile', 'till'])
    browser.window.ALLOW(true)
    await settle()
    expect(mounts(browser)).toEqual(['profile', 'till', 'doors'])
    expect(browser.document.querySelectorAll('.pane-doors').length).toBe(1)

    await app.dispose()
  })
})

describe('a component in a false :if inside a :for row', () => {
  it('mounts only in the rows whose condition is true', async () => {
    const app = await renderApp(LOOP_FILES, { '/settings': 'views/settings.stx' })
    const browser = await boot(app, '/settings')

    browser.window.FILL()
    await settle()

    expect(mounts(browser)).toEqual(['doors'])
    expect(browser.document.querySelectorAll('.pane-doors').length).toBe(1)
    expect(browser.errors).toEqual([])

    await app.dispose()
  })

  it('does not mount the loop\'s source when an enclosing :if opens over an empty list', async () => {
    const app = await renderApp(LOOP_SOURCE_FILES, { '/settings': 'views/settings.stx' })
    const browser = await boot(app, '/settings')

    browser.window.FINISH()
    await settle()
    expect(mounts(browser)).toEqual([])
    expect(browser.document.querySelectorAll('.pane-doors').length).toBe(0)

    browser.window.FILL()
    await settle()
    expect(mounts(browser)).toEqual(['doors'])
    expect(browser.document.querySelectorAll('.pane-doors').length).toBe(1)
    expect(browser.errors).toEqual([])

    await app.dispose()
  })
})
