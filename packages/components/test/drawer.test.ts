/**
 * The Drawer's modal behaviour.
 *
 * A drawer is a dialog, and the parts that make it one are the parts that are
 * easy to leave out: holding the page still behind it, moving focus into it,
 * letting Escape close it from anywhere, and saying what it is to a screen
 * reader. Each of those was missing, and each fails in a way that looks like
 * nothing at all on a desktop with a mouse.
 *
 * Asserted against the component source rather than a rendered DOM: these are
 * structural guarantees about what the component wires up, and the .stx
 * compiler is covered by its own tests. What matters here is that the wiring
 * does not quietly disappear in a refactor.
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(__dirname, '../src/ui/drawer/Drawer.stx'), 'utf8')

describe('Drawer', () => {
  test('holds the page still while it is open', () => {
    // Without this a drag inside the drawer scrolls the page behind it, and on
    // a phone the drawer appears frozen while the page moves under your thumb.
    expect(source).toContain('lockScroll')
    expect(source).toContain("document.body.style.overflow = 'hidden'")
  })

  test('replaces the scrollbar width so the page does not jump', () => {
    expect(source).toContain('window.innerWidth - document.documentElement.clientWidth')
    expect(source).toContain('paddingRight')
  })

  test('unlocks the page again when it closes', () => {
    // The failure here is the worst kind: the drawer is gone and the page can
    // no longer scroll, with nothing on screen to explain it.
    expect(source).toContain('unlockScroll')
  })

  test('unlocks even if it is destroyed while open', () => {
    // Removed mid-open, there is no drawer left to undo the lock.
    expect(source).toContain('onDestroy(')
  })

  test('closes on Escape from anywhere, not just from inside', () => {
    // Opening does not move focus on its own, so a handler bound to the panel
    // never sees the first Escape.
    expect(source).toContain("document.addEventListener('keydown'")
    expect(source).toContain('onDocumentKey')
  })

  test('stops listening for Escape once closed', () => {
    expect(source).toContain("document.removeEventListener('keydown'")
  })

  test('moves focus into the panel and gives it back', () => {
    // A drawer that leaves focus behind cannot be reached by keyboard at all.
    expect(source).toContain('captureFocus')
    expect(source).toContain('releaseFocus')
    expect(source).toContain('document.activeElement')
  })

  test('prefers an explicitly autofocused control', () => {
    expect(source).toContain('[autofocus]')
  })

  test('announces itself as a modal dialog', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
  })

  test('is focusable itself, for a panel with nothing focusable in it', () => {
    expect(source).toContain('tabindex="-1"')
  })

  test('hides the backdrop from screen readers', () => {
    // It is decoration with a click handler; there is nothing in it to read.
    expect(source).toMatch(/aria-hidden="true"/)
  })

  test('still exposes open, close and isOpen to a parent', () => {
    // The control: the API other code drives it with must survive all of the
    // above.
    expect(source).toContain('defineExpose({')
    expect(source).toContain('isOpen,')
  })
})
