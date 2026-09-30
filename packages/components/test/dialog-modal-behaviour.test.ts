/**
 * Dialog, driven by the real runtime, doing what role="dialog"
 * aria-modal="true" promises.
 *
 * The component announced itself as a modal and implemented none of the
 * behaviour that contract implies. Built exactly the way its README shows, a
 * dialog opened and then could not be closed by any of the three ways a reader
 * tries, and the page behind it was still fully interactive:
 *
 *   - Tab walked straight out of the dialog and onto the page behind. Six
 *     presses was enough on the reporter's delete-confirmation dialog.
 *   - document.body kept overflow: visible, so the page scrolled under the
 *     overlay.
 *   - Focus never moved into the panel on open and never returned to the
 *     trigger on close.
 *   - Escape was bound to the dialog root with @keydown, which only fires once
 *     focus is already inside - and nothing put it there. The two omissions hid
 *     each other: no initial focus made the handler unreachable, and the
 *     unreachable handler made the missing focus look harmless.
 *   - A backdrop click did nothing.
 *
 * aria-modal="true" without containment is not a missing feature, it is an
 * active misstatement to assistive technology, which is why it is worth having
 * the attribute and the trap asserted in the same file.
 *
 * stacksjs/stx#1973 and #1978, both from an app that kept its hand-rolled
 * modal rather than ship this one on a destructive confirmation.
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
  'components/Dialog.stx': component('dialog/Dialog.stx'),
  'components/DialogBackdrop.stx': component('dialog/DialogBackdrop.stx'),
  'components/DialogPanel.stx': component('dialog/DialogPanel.stx'),
  'components/DialogTitle.stx': component('dialog/DialogTitle.stx'),
  'components/DialogDescription.stx': component('dialog/DialogDescription.stx'),
  /*
   * The composition the README implies, opened on first paint, plus a button
   * outside it so the trap has somewhere wrong to go.
   */
  'pages/dialog.stx': page('app', `<button type="button" id="outside">Outside</button>
<Dialog open="true">
  <DialogBackdrop />
  <DialogPanel>
    <DialogTitle>Delete this workout?</DialogTitle>
    <DialogDescription>This cannot be undone.</DialogDescription>
    <button type="button" id="cancel">Cancel</button>
    <button type="button" id="confirm">Delete</button>
  </DialogPanel>
</Dialog>`),
}

const ROUTES = { '/dialog': 'pages/dialog.stx' }

async function openDialog(): Promise<{ browser: any, dispose: () => Promise<void> }> {
  const app = await renderApp(FILES, ROUTES)
  const browser = await boot(app, '/dialog')
  await settle()
  return { browser, dispose: () => app.dispose() }
}

/** The dialog's own scope, for reaching what it exposes. */
function dialogScope(browser: any): any {
  const root = browser.document.querySelector('[data-stx-dialog]')
  const scope = root.closest('[data-stx-scope]') ?? root
  return browser.window.stx._scopes[scope.getAttribute('data-stx-scope')]
}

afterEach(() => {
  closeBrowser()
})

describe('Dialog holds the page still while it is open (#1973)', () => {
  it('locks body scroll', async () => {
    const { browser, dispose } = await openDialog()
    try {
      expect(browser.document.body.style.overflow).toBe('hidden')
    }
    finally {
      await dispose()
    }
  })

  it('gives the scroll position back when it closes', async () => {
    const { browser, dispose } = await openDialog()
    try {
      dialogScope(browser).close()
      await settle()

      expect(browser.document.body.style.overflow).not.toBe('hidden')
    }
    finally {
      await dispose()
    }
  })
})

describe('Dialog closes the three ways a reader tries (#1978)', () => {
  it('closes on Escape pressed anywhere, not just inside it', async () => {
    const { browser, dispose } = await openDialog()
    try {
      // Dispatched on the document, which is where a reader who has not
      // clicked into the dialog is pressing it.
      browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await settle()

      expect(dialogScope(browser).isOpen()).toBeFalsy()
    }
    finally {
      await dispose()
    }
  })

  /*
   * The click handler is invoked directly rather than dispatched, because
   * very-happy-dom stops parsing a tag's attributes at an @-prefixed name, so
   * the dialog root carries no @click in this DOM at all. The attribute is in
   * the rendered markup, and the assertion after these two pins it there.
   */
  it('closes on a backdrop click', async () => {
    const { browser, dispose } = await openDialog()
    try {
      const backdrop = browser.document.querySelector('[data-stx-dialog-backdrop]')

      expect(backdrop).toBeTruthy()
      dialogScope(browser).onRootClick({ target: backdrop })
      await settle()

      expect(dialogScope(browser).isOpen()).toBeFalsy()
    }
    finally {
      await dispose()
    }
  })

  it('does not close on a click inside the panel', async () => {
    const { browser, dispose } = await openDialog()
    try {
      // The backdrop covers the viewport and sits behind the panel, so "did
      // the click land on the backdrop" has to be asked of the target, not of
      // the geometry.
      dialogScope(browser).onRootClick({ target: browser.document.querySelector('#cancel') })
      await settle()

      expect(dialogScope(browser).isOpen()).toBeTruthy()
    }
    finally {
      await dispose()
    }
  })

  it('renders the root with the click handler that calls it', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      expect(app.documents.get('/dialog')).toContain('@click="onRootClick($event)"')
    }
    finally {
      await app.dispose()
    }
  })

  it('still exposes close() to whatever opened it', async () => {
    const { browser, dispose } = await openDialog()
    try {
      dialogScope(browser).close()
      await settle()

      expect(dialogScope(browser).isOpen()).toBeFalsy()
    }
    finally {
      await dispose()
    }
  })
})

describe('Dialog keeps focus inside itself (#1973)', () => {
  it('moves focus into the panel when it opens', async () => {
    const { browser, dispose } = await openDialog()
    try {
      const panel = browser.document.querySelector('[data-stx-dialog-panel]')

      expect(panel).toBeTruthy()
      expect(panel.contains(browser.document.activeElement)).toBe(true)
    }
    finally {
      await dispose()
    }
  })

  it('wraps Tab from the last focusable back to the first', async () => {
    const { browser, dispose } = await openDialog()
    try {
      browser.document.querySelector('#confirm').focus()
      browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      await settle()

      expect(browser.document.activeElement.id).toBe('cancel')
    }
    finally {
      await dispose()
    }
  })

  it('wraps Shift+Tab from the first focusable back to the last', async () => {
    const { browser, dispose } = await openDialog()
    try {
      browser.document.querySelector('#cancel').focus()
      browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
      await settle()

      expect(browser.document.activeElement.id).toBe('confirm')
    }
    finally {
      await dispose()
    }
  })

  it('pulls focus back in if it is outside when Tab is pressed', async () => {
    const { browser, dispose } = await openDialog()
    try {
      // This is the state the old dialog left the page in permanently.
      browser.document.querySelector('#outside').focus()
      browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      await settle()

      expect(browser.document.querySelector('[data-stx-dialog-panel]').contains(browser.document.activeElement)).toBe(true)
    }
    finally {
      await dispose()
    }
  })

  it('stops trapping once it is closed', async () => {
    const { browser, dispose } = await openDialog()
    try {
      dialogScope(browser).close()
      await settle()

      browser.document.querySelector('#outside').focus()
      browser.document.dispatchEvent(new browser.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      await settle()

      expect(browser.document.activeElement.id).toBe('outside')
    }
    finally {
      await dispose()
    }
  })
})
