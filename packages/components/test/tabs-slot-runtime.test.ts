/**
 * The Tabs slot API, driven by the real runtime in a real DOM.
 *
 * `<Tabs>` with `<TabPanel>` children - the API the component's own header
 * comment documents - rendered a tab strip with NO tabs and left every panel
 * hidden. The component was invisible: no strip, no content, no console error
 * (stacksjs/stx#1979). The legacy `tabs={[…]}` prop path was unaffected.
 *
 * ## Why the existing tests did not catch it
 *
 * Everything covering #1703 reads the .stx source as text and asserts that a
 * marker string is present in it. That cannot fail for a component that
 * renders nothing: the source contains `discoveredTabs` and
 * `[data-stx-tab-panel]` either way. The markers were all correct - the
 * panels really were in the DOM with their data-label attributes. What did not
 * happen was the other half, and only running it shows that.
 *
 * So this renders the shipped component through processDirectives and hydrates
 * it with the real signals runtime, and asserts on tabs a reader would see.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** The shipped component, not a copy: the point is to test what apps install. */
function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Tabs.stx': component('tabs/Tabs.stx'),
  'components/TabPanel.stx': component('tabs/TabPanel.stx'),
  'components/Accordion.stx': component('accordion/Accordion.stx'),
  'components/AccordionItem.stx': component('accordion/AccordionItem.stx'),
  'pages/tabs.stx': page('app', `<Tabs>
  <TabPanel label="Overview">TAB-ONE-BODY</TabPanel>
  <TabPanel label="History">TAB-TWO-BODY</TabPanel>
</Tabs>`),
  'pages/accordion.stx': page('app', `<Accordion :defaultOpen="[0]">
  <AccordionItem title="First">ITEM-ONE-BODY</AccordionItem>
  <AccordionItem title="Second">ITEM-TWO-BODY</AccordionItem>
</Accordion>`),
}

const ROUTES = { '/tabs': 'pages/tabs.stx', '/accordion': 'pages/accordion.stx' }

afterEach(() => {
  closeBrowser()
})

describe('Tabs in slot mode renders a tab per panel (#1979)', () => {
  it('builds the strip from the panels it finds on mount', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/tabs')
      await settle()

      const panels = browser.document.querySelectorAll('[data-stx-tab-panel]')
      const tabs = browser.document.querySelectorAll('[role="tab"]')

      // The panels were always there. The tabs were not.
      expect(panels.length).toBe(2)
      expect(tabs.length).toBe(2)
      /*
       * `toContain` on each label rather than equality on textContent:
       * very-happy-dom stops parsing a tag's attributes at an `@`-prefixed
       * name, so the `@click`/`@keydown` source text ends up inside the
       * button as text in this DOM. A browser does not do that, and it is not
       * what this is about.
       */
      expect(tabs[0].textContent).toContain('Overview')
      expect(tabs[1].textContent).toContain('History')
    }
    finally {
      await app.dispose()
    }
  })

  it('shows the default tab instead of leaving every panel hidden', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/tabs')
      await settle()

      const panels = [...browser.document.querySelectorAll('[data-stx-tab-panel]')]

      expect(panels.length).toBe(2)
      expect(panels[0].hasAttribute('hidden')).toBe(false)
      expect(panels[1].hasAttribute('hidden')).toBe(true)
      expect(browser.document.body.textContent).toContain('TAB-ONE-BODY')
    }
    finally {
      await app.dispose()
    }
  })

  /*
   * Driven through the exposed selectTab rather than by clicking, because
   * very-happy-dom drops the `@click` attribute while parsing (it stops at an
   * `@`-prefixed attribute name), so no click handler is bound in this DOM. The
   * attribute IS in the rendered markup - pinned by the test below - so what is
   * left to check here is that selecting a tab moves the panels.
   */
  it('switches panels when another tab is selected', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/tabs')
      await settle()

      const scopeId = browser.document.querySelector('[data-stx-scope]').getAttribute('data-stx-scope')
      browser.window.stx._scopes[scopeId].selectTab(1)
      await settle()

      const panels = [...browser.document.querySelectorAll('[data-stx-tab-panel]')]

      expect(panels[0].hasAttribute('hidden')).toBe(true)
      expect(panels[1].hasAttribute('hidden')).toBe(false)
    }
    finally {
      await app.dispose()
    }
  })

  it('renders the tab buttons with their click and key handlers', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const html = app.documents.get('/tabs')!

      expect(html).toContain('@click="selectTab(idx)"')
      expect(html).toContain('@keydown="onTabKey($event, idx)"')
    }
    finally {
      await app.dispose()
    }
  })
})

describe('Accordion in slot mode has the same discovery path (#1979)', () => {
  /*
   * Accordion took its container ref exactly the way Tabs did, so it failed
   * the same way for the same reason. Covered here so a fix to one is not
   * mistaken for a fix to both.
   */
  it('opens defaultOpen and leaves the rest closed', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/accordion')
      await settle()

      const items = [...browser.document.querySelectorAll('[data-stx-accordion-item]')]

      expect(items.length).toBe(2)

      // Both content panels are served hidden; the effect un-hides the open
      // one. Before the fix it never ran with a reachable DOM, so both stayed
      // hidden and neither header got aria-expanded at all.
      const content = items.map((item: any) => item.querySelector('[data-stx-accordion-content]'))

      expect(content[0].hasAttribute('hidden')).toBe(false)
      expect(content[1].hasAttribute('hidden')).toBe(true)
    }
    finally {
      await app.dispose()
    }
  })

  it('tells assistive technology which item is open', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/accordion')
      await settle()

      const headers = [...browser.document.querySelectorAll('[data-stx-accordion-header]')]

      expect(headers.map((header: any) => header.getAttribute('aria-expanded'))).toEqual(['true', 'false'])
    }
    finally {
      await app.dispose()
    }
  })
})
