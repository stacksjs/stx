import { beforeEach, describe, expect, it } from 'bun:test'
import { showConfirmDialog, showMessageBox } from '../src/dialogs'

/**
 * The browser fallback for `showMessageBox`.
 *
 * `response` is an index into `buttons`, and the fallback has to answer in the
 * same currency the native path does. It did not: accepting a
 * `[action, 'Cancel']` dialog reported index 1 — Cancel — so every caller
 * asking `response === 0` got the opposite answer in a browser, and only in a
 * browser. A Craft build behaved, which is why it survived.
 */

let answer = true
let asked: string[] = []

beforeEach(() => {
  delete (window as any).craft
  asked = []
  answer = true
  ;(globalThis as any).confirm = (text: string) => { asked.push(text); return answer }
  ;(globalThis as any).alert = (text: string) => { asked.push(text) }
})

describe('showMessageBox without a bridge', () => {
  it('reports the button the user actually chose, not its opposite', async () => {
    answer = true
    expect(await showMessageBox({ type: 'question', message: 'Delete?', buttons: ['Delete', 'Cancel'] }))
      .toEqual({ response: 0 })

    answer = false
    expect(await showMessageBox({ type: 'question', message: 'Delete?', buttons: ['Delete', 'Cancel'] }))
      .toEqual({ response: 1 })
  })

  it('honours an explicit cancelButton rather than assuming the last one', async () => {
    answer = true
    expect(await showMessageBox({ message: 'x', buttons: ['Cancel', 'Go'], cancelButton: 0 }))
      .toEqual({ response: 1 })
    answer = false
    expect(await showMessageBox({ message: 'x', buttons: ['Cancel', 'Go'], cancelButton: 0 }))
      .toEqual({ response: 0 })
  })

  it('treats a defaultButton that IS the cancel button as a safe default, not as accept', async () => {
    // What a destructive dialog asks for: Return cancels. Confirming still has
    // to mean the destructive button, or the dialog cancels no matter what.
    answer = true
    expect(await showMessageBox({
      message: 'Erase disk?',
      buttons: ['Erase', 'Cancel'],
      defaultButton: 1,
      cancelButton: 1,
    })).toEqual({ response: 0 })
  })

  it('shows the detail text, which the native sheet renders and confirm would drop', async () => {
    await showMessageBox({ message: 'Delete 3 items?', detail: 'This cannot be undone.', buttons: ['OK', 'No'] })
    expect(asked[0]).toBe('Delete 3 items?\n\nThis cannot be undone.')
  })

  it('alerts for a single button', async () => {
    expect(await showMessageBox({ message: 'Done', buttons: ['OK'] })).toEqual({ response: 0 })
    expect(asked).toEqual(['Done'])
  })
})

describe('showConfirmDialog', () => {
  it('is true when confirmed and false when not', async () => {
    answer = true
    expect(await showConfirmDialog('Proceed?')).toBe(true)
    answer = false
    expect(await showConfirmDialog('Proceed?')).toBe(false)
  })
})

describe('showMessageBox with a bridge', () => {
  it('hands the options to the native side untouched', async () => {
    let seen: any
    ;(window as any).craft = {
      dialog: { showMessageBox: async (o: any) => { seen = o; return { response: 0 } } },
    }
    await showMessageBox({ message: 'Hi', buttons: ['A', 'B'] })
    expect(seen).toEqual({ message: 'Hi', buttons: ['A', 'B'] })
    expect(asked).toEqual([])
  })
})
