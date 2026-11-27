/**
 * `<CommandPalette>` from the keyboard, in a real browser (stacksjs/stx#2231).
 *
 * The search field is a combobox over the results: focus stays in it, the
 * arrow keys move the ACTIVE command (aria-activedescendant, aria-selected),
 * and Enter selects it exactly as a click does. The items used to be plain
 * divs with a click handler, so Arrow Down and Enter selected nothing.
 */
import { afterAll, beforeAll, expect, it } from 'bun:test'
import { type BrowserPage, openBrowserPage } from './support/browser-page'

let page: BrowserPage
beforeAll(async () => {
  page = await openBrowserPage({
    name: 'command-palette-keyboard',
    ready: 'window.paletteProbe && window.stx && window.paletteProbe.scope()',
    body: `<script client>
const hideBeta = state(false)
const selected = []
// On a component tag, $event is what the component emitted.
function onSelect(value) { selected.push(value) }
window.paletteProbe = {
  hideBeta,
  selected,
  scope: () => Object.values(window.stx._scopes || {}).find(s => s && typeof s.show === 'function' && typeof s.query === 'function'),
  input: () => document.querySelector('[data-stx-command-palette-input]'),
  items: () => [...document.querySelectorAll('[data-stx-command-item]')],
  active: () => { const id = window.paletteProbe.input().getAttribute('aria-activedescendant'); return id ? document.getElementById(id).textContent.trim() : null },
  marked: () => window.paletteProbe.items().filter(item => item.getAttribute('aria-selected') === 'true').map(item => item.textContent.trim()),
  press: key => window.paletteProbe.input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })),
  open: () => { document.getElementById('opener').focus(); window.paletteProbe.scope().show() },
}
</script>
<button id="opener" type="button">Commands</button>
<CommandPalette @select="onSelect($event)">
  <CommandPaletteItem value="alpha">Alpha</CommandPaletteItem>
  <div :show="!hideBeta()"><CommandPaletteItem value="beta">Beta</CommandPaletteItem></div>
  <CommandPaletteItem value="gamma">Gamma</CommandPaletteItem>
</CommandPalette>`,
  })
}, 90_000)
afterAll(() => page?.close())

const openPalette = async () => {
  await page.run('paletteProbe.open()')
  expect(await page.until('document.activeElement === paletteProbe.input()')).toBe(true)
}

it('names the search field a combobox over a listbox of options', async () => {
  const semantics = await page.json(`
    const input = paletteProbe.input()
    const list = document.getElementById(input.getAttribute('aria-controls'))
    return {
      role: input.getAttribute('role'), autocomplete: input.getAttribute('aria-autocomplete'), expanded: input.getAttribute('aria-expanded'),
      list: list && list.getAttribute('role'),
      options: paletteProbe.items().map(item => item.getAttribute('role') + ':' + item.getAttribute('aria-selected')),
    }`)
  expect(semantics).toEqual({ role: 'combobox', autocomplete: 'list', expanded: 'true', list: 'listbox', options: ['option:false', 'option:false', 'option:false'] })
})

it('moves the active command with the arrows, keeps focus in the search, and Enter selects it once', async () => {
  await openPalette()
  expect(await page.json('return paletteProbe.active()')).toBeNull()
  await page.run("paletteProbe.press('ArrowDown')")
  expect(await page.json('return paletteProbe.active()')).toBe('Alpha')
  await page.run("paletteProbe.press('ArrowDown')")
  expect(await page.json('return [paletteProbe.active(), paletteProbe.marked(), document.activeElement === paletteProbe.input()]')).toEqual(['Beta', ['Beta'], true])
  await page.run("paletteProbe.press('ArrowUp'); paletteProbe.press('ArrowUp')")
  expect(await page.json('return paletteProbe.active()'), 'wraps').toBe('Gamma')
  await page.run("paletteProbe.press('Home')")
  expect(await page.json('return paletteProbe.active()')).toBe('Alpha')
  await page.run("paletteProbe.press('End'); paletteProbe.press('ArrowUp')")
  expect(await page.json('return paletteProbe.active()')).toBe('Beta')

  await page.run("paletteProbe.press('Enter')")
  expect(await page.until('paletteProbe.scope().isOpen() === false')).toBe(true)
  expect(await page.json('return paletteProbe.selected')).toEqual(['beta'])
  expect(await page.until('document.activeElement === document.getElementById("opener")'), 'focus back on the opener').toBe(true)
  expect(await page.json('return [paletteProbe.active(), paletteProbe.marked()]')).toEqual([null, []])
  expect(await page.errors()).toEqual([])
})

it('selects with the pointer as before', async () => {
  await page.run('paletteProbe.selected.length = 0')
  await openPalette()
  await page.run('paletteProbe.items()[2].click()')
  expect(await page.until('paletteProbe.scope().isOpen() === false')).toBe(true)
  expect(await page.json('return paletteProbe.selected')).toEqual(['gamma'])
})

it('closes on Escape without selecting, and Enter with nothing active does nothing', async () => {
  await page.run('paletteProbe.selected.length = 0')
  await openPalette()
  await page.run("paletteProbe.press('Enter')")
  expect(await page.json('return [paletteProbe.scope().isOpen(), paletteProbe.selected]')).toEqual([true, []])
  await page.run("paletteProbe.press('ArrowDown'); paletteProbe.press('Escape')")
  expect(await page.until('paletteProbe.scope().isOpen() === false')).toBe(true)
  expect(await page.json('return [paletteProbe.selected, paletteProbe.active()]')).toEqual([[], null])
  expect(await page.until('document.activeElement === document.getElementById("opener")')).toBe(true)
})

it('follows a changing result set: a hidden command is skipped and stops being active', async () => {
  await page.run('paletteProbe.selected.length = 0')
  await openPalette()
  await page.run("paletteProbe.press('ArrowDown'); paletteProbe.press('ArrowDown')")
  expect(await page.json('return paletteProbe.active()')).toBe('Beta')
  await page.run('paletteProbe.hideBeta.set(true)')
  expect(await page.until('paletteProbe.active() === null'), 'the hidden command is no longer active').toBe(true)
  await page.run("paletteProbe.press('ArrowDown'); paletteProbe.press('ArrowDown')")
  expect(await page.json('return paletteProbe.active()'), 'Beta is skipped').toBe('Gamma')
  await page.run("paletteProbe.press('Enter')")
  expect(await page.json('return paletteProbe.selected')).toEqual(['gamma'])
  await page.run('paletteProbe.hideBeta.set(false)')
  expect(await page.errors()).toEqual([])
})
