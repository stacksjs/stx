/**
 * #1998: what #1875 did not cover.
 *
 * The focus trap, focus restore and listener cleanup from #1875 hold up. Six
 * things around them did not, and five of the six were each dialog behaving as
 * if it were the only one on the page:
 *
 *  1. The page scrolled behind an aria-modal dialog, because nothing touched
 *     overflow on body or documentElement. The backdrop is fixed, so the
 *     content behind it scrolled away underneath.
 *  2. aria-modal was asserted while the background stayed in the accessibility
 *     tree. The Tab trap covers the keyboard; a virtual cursor could still
 *     browse the page behind the dialog.
 *  3. Initial focus was an unconditional okBtn.focus(), including when type was
 *     'error' and that button was the destructive one - so a stray Enter
 *     confirmed the delete.
 *  4. One Escape resolved EVERY open dialog, because each binds its own
 *     capture-phase handler on document and none checked whether it was on top.
 *  5. The inline transitions ignored prefers-reduced-motion.
 *  6. The backdrop kept hit-testing for 200ms after the promise resolved, at
 *     z-index 999999 across the whole viewport.
 *
 * Driven against the real generated runtime, which is the only place this
 * behaviour exists.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

function bootRuntime(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

/** Every dialog still in the document, oldest first. */
function dialogs(): any[] {
  return Array.from(document.querySelectorAll('[role="alertdialog"]'))
}

function top(): any {
  const all = dialogs()
  return all[all.length - 1]
}

function buttonsOf(el: any): any[] {
  return Array.from(el.firstChild.querySelectorAll('button'))
}

/*
 * Invoked as the property, not el.click(). very-happy-dom's click() does not
 * run an onclick assigned as a property, and the dialog wires its buttons that
 * way - so .click() left the promise pending and the test timed out at 5s
 * rather than failing. dialog-a11y.test.ts does the same for the same reason.
 */
function press(el: any): void {
  el.onclick()
}

const settle = (ms = 0) => new Promise(r => setTimeout(r, ms))

function escape(): void {
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
}

beforeEach(() => {
  bootRuntime()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

describe('#1998 — the page behind a dialog is inert and does not scroll', () => {
  it('locks scrolling on body and documentElement while open', async () => {
    const p = window.stxConfirm('Delete server web-01?', { type: 'error', title: 'Delete server' })
    await settle()

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')

    escape()
    await p
    await settle(10)

    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
  })

  /*
   * Restored to what the APP had, not to empty. An app that keeps the page
   * unscrollable for its own reasons must still be unscrollable afterwards.
   */
  it('restores the app\'s own overflow rather than clearing it', async () => {
    document.body.style.overflow = 'clip'
    const p = window.stxAlert('done', { title: 'Done' })
    await settle()
    expect(document.body.style.overflow).toBe('hidden')

    press(buttonsOf(top())[0])
    await p
    await settle(10)

    expect(document.body.style.overflow).toBe('clip')
  })

  it('makes the page behind it inert, and lets it go again', async () => {
    const behind = document.createElement('div')
    behind.id = 'behind'
    document.body.appendChild(behind)

    const p = window.stxAlert('hello', { title: 'Hi' })
    await settle()

    expect(behind.inert).toBe(true)
    // The dialog itself is not inert, or nothing inside it could be used.
    expect(!!top().inert).toBe(false)

    press(buttonsOf(top())[0])
    await p
    await settle(10)

    expect(!!behind.inert).toBe(false)
  })

  /*
   * An app that had already marked something inert keeps it that way. The
   * restore walks only what the dialog itself set.
   */
  it('never clears an inert the app set itself', async () => {
    const theirs = document.createElement('div')
    theirs.inert = true
    document.body.appendChild(theirs)

    const p = window.stxAlert('hello', { title: 'Hi' })
    await settle()
    press(buttonsOf(top())[0])
    await p
    await settle(10)

    expect(theirs.inert).toBe(true)
  })
})

describe('#1998 — initial focus does not land on a destructive action', () => {
  it('focuses Cancel on an error-type confirm', async () => {
    const p = window.stxConfirm('Delete server web-01? This cannot be undone.', {
      type: 'error', title: 'Delete server', confirmText: 'Delete', cancelText: 'Cancel',
    })
    await settle()

    expect(document.activeElement.textContent).toBe('Cancel')

    escape()
    expect(await p).toBe(false)
  })

  it('still focuses the primary action on an ordinary confirm', async () => {
    const p = window.stxConfirm('Save changes?', { title: 'Save', confirmText: 'Save' })
    await settle()

    expect(document.activeElement.textContent).toBe('Save')

    escape()
    await p
  })

  it('takes defaultFocus over the type-based default, in both directions', async () => {
    const a = window.stxConfirm('Delete?', { type: 'error', confirmText: 'Delete', defaultFocus: 'confirm' })
    await settle()
    expect(document.activeElement.textContent).toBe('Delete')
    escape()
    await a

    const b = window.stxConfirm('Save?', { confirmText: 'Save', cancelText: 'Nope', defaultFocus: 'cancel' })
    await settle()
    expect(document.activeElement.textContent).toBe('Nope')
    escape()
    await b
  })

  /*
   * An alert has one button, so it keeps it: there is nothing destructive to
   * land on, and focus has to go somewhere inside the trap.
   */
  it('focuses the only button on an error-type alert', async () => {
    const p = window.stxAlert('Disk full', { type: 'error', title: 'Error', confirmText: 'Dismiss' })
    await settle()

    expect(document.activeElement.textContent).toBe('Dismiss')

    escape()
    await p
  })
})

describe('#1998 — one Escape answers one dialog', () => {
  it('resolves only the topmost, leaving the one underneath open', async () => {
    let a: unknown = 'unanswered'
    let b: unknown = 'unanswered'
    const first = window.stxConfirm('Cancel your subscription?', { title: 'Billing' }).then((v: unknown) => { a = v })
    await settle()
    const second = window.stxConfirm('Also delete all invoices?', { title: 'Invoices' }).then((v: unknown) => { b = v })
    await settle()

    expect(dialogs().length).toBe(2)

    escape()
    await second
    await settle(10)

    // The whole bug: this used to answer both.
    expect(b).toBe(false)
    expect(a).toBe('unanswered')

    escape()
    await first
    expect(a).toBe(false)
  })

  it('keeps the page locked until the LAST dialog closes', async () => {
    const first = window.stxConfirm('one', { title: 'One' })
    await settle()
    const second = window.stxConfirm('two', { title: 'Two' })
    await settle()

    escape()
    await second
    await settle(10)

    expect(document.body.style.overflow).toBe('hidden')

    escape()
    await first
    await settle(10)

    expect(document.body.style.overflow).toBe('')
  })

  /*
   * The backgrounded dialog goes inert, which is what stops the two focus
   * traps competing for Tab while both are open.
   */
  it('makes a backgrounded dialog inert so its trap stops competing', async () => {
    const first = window.stxConfirm('one', { title: 'One' })
    await settle()
    const underneath = top()
    const second = window.stxConfirm('two', { title: 'Two' })
    await settle()

    expect(underneath.inert).toBe(true)
    expect(!!top().inert).toBe(false)

    escape()
    await second
    await settle(10)

    // Handed back when the one above it goes away.
    expect(!!underneath.inert).toBe(false)

    escape()
    await first
  })
})

describe('#1998 — the backdrop stops swallowing clicks when it resolves', () => {
  it('drops pointer events before the caller resumes', async () => {
    const p = window.stxConfirm('timing', { title: 'T' })
    await settle()
    const bd = top()

    press(buttonsOf(bd)[1])
    await p

    // Still in the document for the fade, which is fine - it just must not be
    // hit-testing across the whole viewport any more.
    expect(bd.style.pointerEvents).toBe('none')
  })
})
