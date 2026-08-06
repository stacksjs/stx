/**
 * #1875: stxConfirm/stxAlert ignored the app theme, did not trap or restore
 * focus, and leaked a keydown listener on every close-by-click.
 *
 * The leak is the sharpest of the four: the escape handler removed itself ONLY
 * inside its own Escape branch, so any dialog dismissed with a button left a
 * permanent document-level keydown listener holding the whole closure alive.
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

function backdrop(): any {
  // Dialogs are removed on a 200ms timer, so a stale one can still be in the
  // document; always take the most recently appended.
  const all = document.querySelectorAll('[role="alertdialog"]')
  return all[all.length - 1]
}

function panel(): any {
  return backdrop()?.firstChild
}

function buttons(): any[] {
  return Array.from(panel().querySelectorAll('button'))
}

describe('stxConfirm/stxAlert accessibility (#1875)', () => {
  beforeEach(() => {
    bootRuntime()
    document.body.innerHTML = ''
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('removes the keydown listener when closed by a button, not only by Escape', () => {
    let added = 0
    let removed = 0
    const origAdd = document.addEventListener.bind(document)
    const origRemove = document.removeEventListener.bind(document)
    document.addEventListener = (t: string, ...rest: any[]) => {
      if (t === 'keydown') added++
      return origAdd(t, ...rest)
    }
    document.removeEventListener = (t: string, ...rest: any[]) => {
      if (t === 'keydown') removed++
      return origRemove(t, ...rest)
    }

    const p = window.stxConfirm('Delete this?')
    expect(added).toBe(1)
    // Close via the OK button — the path that used to leak.
    buttons()[1].onclick()

    return p.then(() => {
      expect(removed).toBe(1)
      document.addEventListener = origAdd
      document.removeEventListener = origRemove
    })
  })

  it('restores focus to whatever had it before the dialog opened', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'open'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const p = window.stxConfirm('Sure?')
    // The dialog takes focus for itself.
    expect(document.activeElement).not.toBe(trigger)

    buttons()[0].onclick()
    return p.then(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })

  it('follows the app theme class over the OS preference', () => {
    document.documentElement.classList.add('dark')
    window.stxAlert('themed')
    // #1f2937 is the dark panel background.
    expect(panel().style.cssText).toContain('#1f2937')
  })

  it('follows a data-theme=light attribute even when it says light', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    window.stxAlert('themed')
    expect(panel().style.cssText).toContain('#ffffff')
  })

  it('lets an explicit dark option win over the document', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    window.stxAlert('forced', { dark: true })
    expect(panel().style.cssText).toContain('#1f2937')
  })

  it('gives the alertdialog an accessible name and description', () => {
    window.stxConfirm('Really delete?', { title: 'Delete' })
    const labelledBy = backdrop().getAttribute('aria-labelledby')
    const describedBy = backdrop().getAttribute('aria-describedby')

    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy).textContent).toBe('Delete')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy).textContent).toBe('Really delete?')
  })

  it('falls back to aria-label when there is no title', () => {
    window.stxAlert('Just a message')
    expect(backdrop().getAttribute('aria-label')).toBe('Just a message')
  })
})
