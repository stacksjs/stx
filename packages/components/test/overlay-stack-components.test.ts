/**
 * Every overlay and popup in the library goes on the runtime's one overlay
 * stack (stacksjs/stx#2057), and none keeps an Escape listener of its own.
 *
 * Each used to listen for Escape on the document. With a menu open inside a
 * dialog, whichever listener had been added first took the key, so an Escape
 * meant for the menu could close the dialog; with two dialogs, one Escape
 * closed both. The stack's behaviour is executed in
 * packages/stx/test/signals/overlay-stack.test.ts; this holds every component
 * to joining it, so a new one cannot quietly bring its own listener back.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const UI = join(import.meta.dir, '../src/ui')
const read = (rel: string) => readFileSync(join(UI, rel), 'utf8')

const MODAL = ['dialog/Dialog.stx', 'drawer/Drawer.stx', 'command-palette/CommandPalette.stx']
const POPUPS = ['dropdown/Dropdown.stx', 'listbox/Listbox.stx', 'combobox/Combobox.stx', 'popover/Popover.stx', 'date-range-picker/DateRangePicker.stx', 'tooltip/Tooltip.stx', 'chat/ChatLauncher.stx']

/** An Escape check anywhere in a keydown handler the component binds itself. */
function ownsEscape(source: string): boolean {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  return /key\s*===?\s*'Escape'/.test(code) || /key\s*!==?\s*'Escape'/.test(code)
}

describe('the library\'s overlays', () => {
  it.each(MODAL)('%s goes on the stack as a modal layer and leaves it on destroy', (rel) => {
    const source = read(rel)
    expect(source).toMatch(/window\.stx\.overlays\.open\(\w+, \{/)
    expect(source).not.toContain('modal: false')
    expect(source).toMatch(/onDestroy\([\s\S]*?window\.stx\.overlays\.close\(/)
    expect(ownsEscape(source)).toBe(false)
  })

  it.each(POPUPS)('%s goes on the stack as a popup and leaves it on destroy', (rel) => {
    const source = read(rel)
    expect(source).toMatch(/window\.stx\.overlays\.open\([\w`$\-{}.]+, \{ modal: false/)
    expect(source).toMatch(/onDestroy\([\s\S]*?window\.stx\.overlays\.close\(/)
    expect(ownsEscape(source)).toBe(false)
  })

  it('names the command palette as a modal dialog and focuses its search', () => {
    const source = read('command-palette/CommandPalette.stx')
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-label="Command palette"')
    expect(source).toContain("initialFocus: () => panelEl()?.querySelector('input')")
  })
})
