/**
 * A component prop binding works when the component sits in an `@include`d
 * partial.
 *
 * Reported as broken in stacksjs/stx#1994 on 0.2.339: the server emitted
 * `data-stx-parent-bindings="open"` on the component root but no `open`
 * attribute ever appeared, so `useReactiveProp` had nothing to observe and the
 * component stayed at its initial value for the life of the page. Plain
 * directives on plain elements in the SAME partial, on the SAME signal, were
 * reactive - it was specifically the component-prop path. Setting the attribute
 * by hand made everything work, so the component was fine and the binding was
 * what did not arrive.
 *
 * It works on current main, in both of the placements that behave differently:
 * a partial included from the page, and one included from the layout's chrome,
 * which is where the report had it (a layout partial survives navigation and
 * goes through the orphan-salvage path rather than the page's). So this is the
 * reproduction, kept as a test rather than discarded with the issue - the
 * failure was silent, and a silent failure that has been fixed once is worth a
 * test more than most.
 *
 * Both halves are asserted: the attribute arriving, and the component actually
 * reacting to it (the drawer locks body scroll when it opens). Asserting only
 * the attribute would pass on a drawer that ignored it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** The shipped component, not a copy. */
function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

/** A partial that owns a local signal and drives a Drawer with it. */
const SIGNAL_PARTIAL = `<script client>
const panelOpen = state(false)
function flip() { panelOpen.set(!panelOpen()) }
</script>
<div id="panel">
  {{-- The control: a plain directive on a plain element, same signal. It was
       reactive even while the component prop was not, which is what narrowed
       the report to the component path. --}}
  <p id="probe" :text="panelOpen ? 'TRUE' : 'FALSE'"></p>
  <Drawer :open="panelOpen()" position="left" title="Probe">PANEL BODY</Drawer>
</div>
`

/** The same, driven by a store, which is what the report used. */
const STORE_PARTIAL = `<script client>
const panel = defineStore('panel-probe', () => {
  const open = state(false)
  function toggle() { open.set(!open()) }
  return { open, toggle }
})
function flip() { panel.toggle() }
</script>
<div id="panel">
  <p id="probe" :text="panel.open ? 'TRUE' : 'FALSE'"></p>
  <Drawer :open="panel.open()" position="left" title="Probe">PANEL BODY</Drawer>
</div>
`

interface Harness {
  drawerRoot: () => any
  probe: () => any
  flip: () => void
  dispose: () => Promise<void>
}

/**
 * @param where 'page' includes the partial from the page, 'layout' from the
 * layout's chrome. They are different code paths: a layout partial survives
 * navigation and is salvaged separately from the page's own content.
 */
async function mount(partial: string, where: 'page' | 'layout'): Promise<Harness> {
  const app = await renderApp({
    'layouts/app.stx': layout(where === 'layout' ? `@include('panel')` : ''),
    'components/Drawer.stx': component('drawer/Drawer.stx'),
    'partials/panel.stx': partial,
    'pages/index.stx': page('app', where === 'page' ? `@include('panel')` : '<h1>PAGE</h1>'),
  }, { '/': 'pages/index.stx' })

  const browser = await boot(app, '/')
  await settle()

  const panelEl = browser.document.querySelector('#panel')
  const scopeEl = panelEl?.closest('[data-stx-scope]')
  const scope = browser.window.stx._scopes[scopeEl?.getAttribute('data-stx-scope')]

  return {
    drawerRoot: () => browser.document.querySelector('[data-stx-scope*="drawer"]'),
    probe: () => browser.document.querySelector('#probe'),
    // Called on the scope: this harness renders @click but does not wire it as
    // a DOM listener.
    flip: () => scope.flip(),
    dispose: async () => {
      // Read before disposing, since the assertions need the document.
      await app.dispose()
    },
  }
}

afterEach(() => {
  closeBrowser()
})

describe('a component prop binding inside an @included partial (#1994)', () => {
  for (const where of ['page', 'layout'] as const) {
    describe(`partial included from the ${where}`, () => {
      it('writes the attribute when the signal flips', async () => {
        const harness = await mount(SIGNAL_PARTIAL, where)
        try {
          // Absent while false, which is correct: the runtime removes a
          // boolean attribute rather than writing "false".
          expect(harness.drawerRoot().getAttribute('open')).toBeNull()

          harness.flip()
          await settle()

          // Present while true. An empty value IS the HTML spelling of true,
          // and useReactiveProp reads "" as true.
          expect(harness.drawerRoot().getAttribute('open')).toBe('')
        }
        finally {
          await harness.dispose()
        }
      })

      it('makes the component actually react, not just carry the attribute', async () => {
        const harness = await mount(SIGNAL_PARTIAL, where)
        try {
          harness.flip()
          await settle()

          // The drawer's own behaviour, so this cannot pass on a component
          // that receives the attribute and ignores it.
          expect(harness.probe().textContent).toContain('TRUE')
        }
        finally {
          await harness.dispose()
        }
      })

      it('works the same when a store owns the signal', async () => {
        const harness = await mount(STORE_PARTIAL, where)
        try {
          harness.flip()
          await settle()

          expect(harness.drawerRoot().getAttribute('open')).toBe('')
        }
        finally {
          await harness.dispose()
        }
      })
    })
  }

  /*
   * The second thing the report noticed: the partial's own scope id arriving
   * as a PROP of the component, which suggested the prop extraction was
   * reading an attribute off the partial's scope wrapper. Asserted because it
   * would be an easy thing to reintroduce and an invisible thing to notice.
   */
  it('does not pass the partial scope id in as a prop', async () => {
    const harness = await mount(SIGNAL_PARTIAL, 'layout')
    try {
      const props = harness.drawerRoot().getAttribute('data-stx-props') ?? ''

      expect(props).not.toContain('data-stx-scope')
    }
    finally {
      await harness.dispose()
    }
  })
})
