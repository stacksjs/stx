import { beforeEach, describe, expect, it } from 'bun:test'
import { showConfirmDialog, showMessageBox, showOpenDialog } from '../src/dialogs'

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

/**
 * `showOpenDialog` and the three native panels.
 *
 * Craft's bridge picks between openFolder, openFiles and openFile by looking at
 * `options.properties` and nothing else. The friendly booleans were forwarded
 * untranslated, so the documented way to ask for a folder opened a file picker
 * — a panel that appears, works, and cannot select what was asked for.
 */
describe('showOpenDialog', () => {
  let seen: any

  beforeEach(() => {
    seen = undefined
    ;(window as any).craft = {
      dialog: { showOpenDialog: async (o: any) => { seen = o; return { canceled: true, filePaths: [] } } },
    }
  })

  it('turns canChooseDirectories into the property Craft dispatches on', async () => {
    await showOpenDialog({ title: 'Pick a folder', canChooseDirectories: true })
    expect(seen.properties).toContain('openDirectory')
    expect(seen.title).toBe('Pick a folder')
  })

  it('turns multiSelections into its property too', async () => {
    await showOpenDialog({ multiSelections: true })
    expect(seen.properties).toContain('multiSelections')
  })

  it('leaves an explicit properties array intact for callers who speak Electron', async () => {
    await showOpenDialog({ properties: ['openDirectory'] })
    expect(seen.properties).toEqual(['openDirectory'])
  })

  it('does not invent properties that were not asked for', async () => {
    await showOpenDialog({ title: 'Pick a file' })
    expect(seen.properties).toEqual([])
  })

  it('does not duplicate a property given both ways', async () => {
    await showOpenDialog({ properties: ['openDirectory'], canChooseDirectories: true })
    expect(seen.properties).toEqual(['openDirectory'])
  })
})

/**
 * The bridge's REAL dialog surface.
 *
 * `showMessageBox` was called on `window.craft.dialog` behind a guard that only
 * checked the namespace existed. The shipped bridge's namespace is
 *
 *   { openFile, openFolder, saveFile, showAlert, showConfirm, showPrompt }
 *
 * with no `showMessageBox` -- `craft-native`'s own `bridge/core.d.ts` declares
 * one that `api/dialog.d.ts` does not provide. So the call threw, the catch
 * swallowed it, and the native path fell through to the browser `confirm()` --
 * which in a packaged WebView answers `false` without drawing anything, and has
 * no console to report it in (stacksjs/stx#2040).
 *
 * The existing suite could not catch this: the shared bridge mock is a Proxy
 * that answers every namespace and every method, so it implements a richer
 * bridge than the one that ships. These tests install exactly the methods the
 * real one has.
 */
function installDialogBridge(dialog: Record<string, unknown>): void {
  ;(window as any).craft = { dialog }
}

describe('showMessageBox against the bridge that actually ships', () => {
  it('uses showAlert when the host has no showMessageBox', async () => {
    const seen: any[] = []
    installDialogBridge({
      // The real surface -- note the absence of showMessageBox.
      showAlert: async (options: any) => { seen.push(options); return 1 },
      showConfirm: async () => true,
      showPrompt: async () => null,
    })

    const result = await showMessageBox({
      type: 'question',
      title: 'Confirm',
      message: 'Delete?',
      buttons: ['Delete', 'Cancel'],
    })

    expect(result).toEqual({ response: 1 })
    expect(seen).toHaveLength(1)
    expect(seen[0].buttons).toEqual(['Delete', 'Cancel'])
    // Craft's `title` is the bold primary line; the message drops to secondary.
    expect(seen[0].title).toBe('Confirm')
    expect(seen[0].message).toContain('Delete?')
    // ...and nothing reached the browser fallback.
    expect(asked).toEqual([])
  })

  it('maps an error type onto the critical alert style', async () => {
    const seen: any[] = []
    installDialogBridge({ showAlert: async (o: any) => { seen.push(o); return 0 } })
    await showMessageBox({ type: 'error', message: 'Boom', buttons: ['OK'] })
    expect(seen[0].style).toBe('critical')
  })

  it('reads a host that answers Craft\'s buttonIndex', async () => {
    installDialogBridge({ showMessageBox: async () => ({ buttonIndex: 1 }) })
    expect(await showMessageBox({ message: 'x', buttons: ['Go', 'Cancel'] }))
      .toEqual({ response: 1 })
  })

  it('reads a host that answers Electron\'s response', async () => {
    installDialogBridge({ showMessageBox: async () => ({ response: 1 }) })
    expect(await showMessageBox({ message: 'x', buttons: ['Go', 'Cancel'] }))
      .toEqual({ response: 1 })
  })

  it('reads a host that answers a bare index', async () => {
    installDialogBridge({ showMessageBox: async () => 0 })
    expect(await showMessageBox({ message: 'x', buttons: ['Go', 'Cancel'] }))
      .toEqual({ response: 0 })
  })

  it('answers cancel, never the action button, when the reply is unreadable', async () => {
    // Defaulting to 0 would read an unanswerable dialog as consent to the
    // destructive thing it asked about.
    installDialogBridge({ showMessageBox: async () => ({ nonsense: true }) })
    expect(await showMessageBox({ message: 'Delete?', buttons: ['Delete', 'Cancel'] }))
      .toEqual({ response: 1 })

    installDialogBridge({ showMessageBox: async () => ({ nonsense: true }) })
    expect(await showMessageBox({ message: 'Delete?', buttons: ['Cancel', 'Delete'], cancelButton: 0 }))
      .toEqual({ response: 0 })
  })

  it('carries a real confirmation all the way through showConfirmDialog', async () => {
    // The end-to-end shape of the reported bug: pressing the action button on
    // a packaged app reported "not confirmed" and the action did nothing.
    installDialogBridge({ showAlert: async () => 0 })
    expect(await showConfirmDialog('Empty the trash?')).toBe(true)

    installDialogBridge({ showAlert: async () => 1 })
    expect(await showConfirmDialog('Empty the trash?')).toBe(false)
  })
})
