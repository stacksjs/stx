/**
 * A dialog says what it is.
 *
 * `role="dialog"` with no accessible name is announced as bare "dialog", which
 * tells a screen reader user nothing about what has just taken over the page
 * (WCAG 4.1.2). `<Dialog>` carried `role="dialog"` and `aria-modal="true"` and
 * no name at all, in either spelling.
 *
 * The library's own accessibility suite did not catch it because it read the
 * component's SOURCE and only asked whether the strings were present. Both
 * were, and still are; what was missing was a third one.
 *
 * There are two halves to the fix and they are checked differently. The
 * `title` prop renders `aria-label` on the server, so a dialog is named before
 * hydration and with JavaScript off -- that is visible in the markup. The slot
 * idiom puts the name in a `<DialogTitle>`, which the server renders as opaque
 * slot content, so the association is made on mount and can only be seen by
 * running the component.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { render } from './utils/render-component'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** The shipped component, not a copy: the point is to test what apps install. */
function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Dialog.stx': component('dialog/Dialog.stx'),
  'components/DialogTitle.stx': component('dialog/DialogTitle.stx'),
  'pages/titled.stx': page('app', `<Dialog open>
  <DialogTitle>Delete this project</DialogTitle>
  <p>This cannot be undone.</p>
</Dialog>`),
  'pages/prop.stx': page('app', `<Dialog open title="Confirm deletion">
  <p>This cannot be undone.</p>
</Dialog>`),
}

const ROUTES = { '/titled': 'pages/titled.stx', '/prop': 'pages/prop.stx' }

afterEach(() => {
  closeBrowser()
})

describe('Dialog accessible name', () => {
  it('names itself from the title prop, without running any script', async () => {
    const html = await render('<Dialog open title="Confirm deletion"><p>body</p></Dialog>')
    expect(html).toContain('aria-label="Confirm deletion"')
  })

  it('emits no aria-label at all when it has no name to give', async () => {
    // An empty aria-label is worse than none: it suppresses the name a
    // <DialogTitle> would otherwise supply on mount.
    const html = await render('<Dialog open><p>body</p></Dialog>')
    expect(html).not.toContain('aria-label=""')
  })

  it('names itself from its DialogTitle on mount', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/titled')
      await settle()

      const dialog = browser.document.querySelector('[role="dialog"]')
      expect(dialog).not.toBeNull()

      const labelledBy = dialog!.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()

      const heading = browser.document.getElementById(labelledBy!)
      expect(heading).not.toBeNull()
      expect(heading!.textContent).toContain('Delete this project')
    }
    finally {
      closeBrowser()
    }
  })

  it('leaves the prop name alone when both are present', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/prop')
      await settle()

      const dialog = browser.document.querySelector('[role="dialog"]')
      expect(dialog!.getAttribute('aria-label')).toBe('Confirm deletion')
      // The mount pass must not add a second, competing name.
      expect(dialog!.getAttribute('aria-labelledby')).toBeNull()
    }
    finally {
      closeBrowser()
    }
  })
})
