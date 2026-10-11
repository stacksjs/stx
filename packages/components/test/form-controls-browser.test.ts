/**
 * The form controls in a real browser (stacksjs/stx#2059).
 *
 * form-control-model.test.ts drives the same component through very-happy-dom,
 * whose `select.value` is a plain property: it reads back whatever was last
 * written, whether or not an option with that value exists. A real <select>
 * does not -- setting a value before its option exists selects nothing, and
 * the browser then shows (and posts) whichever option it falls back to. That
 * is exactly the case "the options arrive after the value" is about, so it is
 * asserted here, against the browser's own `selectedIndex`.
 */
import { WebView } from 'bun'
import { afterAll, beforeAll, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

let dir = ''
let view: InstanceType<typeof WebView>

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'stx-select-options-'))
  await Bun.write(join(dir, 'Select.stx'), Bun.file(resolve(import.meta.dir, '../src/ui/select/Select.stx')))
  await Bun.write(join(dir, 'Textarea.stx'), Bun.file(resolve(import.meta.dir, '../src/ui/textarea/Textarea.stx')))
  const html = await processDirectives(`<!doctype html><html><head></head><body>
<script client>
const rooms = state([])
const room = state('r2')
const list = [{ id: 7, name: 'Ada' }, { id: 9, name: 'Grace' }]
const athlete = state('9')
const size = state('M')
window.probe = { rooms, room, athlete, size }
</script>
<div id="late"><Select :options="rooms()" v-model:value="room" /></div>
<div id="static"><Select :options="['S', 'M', 'L']" v-model:value="size" /></div>
<div id="slot"><Select v-model:value="athlete" placeholder="">
  <option :for="o in list" :value="o.id">{{ o.name }}</option>
</Select></div>
<div id="notes"><Textarea autoResize rows="1" value="one\ntwo\nthree\nfour\nfive" /></div>
</body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, cache: false, debug: false }, new Set())
  await Bun.write(join(dir, 'page.html'), html)
  view = new WebView({ headless: true })
  await view.navigate(`file://${join(dir, 'page.html')}`)
  for (let i = 0; i < 150; i++) {
    if (await view.evaluate('!!window.probe && document.querySelectorAll("#slot option").length === 2'))
      break
    await Bun.sleep(20)
  }
}, 30_000)

afterAll(() => {
  view?.close()
  rmSync(dir, { recursive: true, force: true })
})

/** The option the BROWSER has selected, by its value. */
function chosen(id: string): Promise<string> {
  return view.evaluate(`(() => { const s = document.querySelector('#${id} select'); return s.selectedIndex < 0 ? '(none)' : s.options[s.selectedIndex].value })()`) as Promise<string>
}

function values(id: string): Promise<string[]> {
  return view.evaluate(`Array.from(document.querySelectorAll('#${id} select option')).map(o => o.value)`) as Promise<string[]>
}

it('selects the bound value once a late list brings its option', async () => {
  expect(await values('late')).toEqual([''])

  await view.evaluate(`window.probe.rooms.set([{ value: 'r1', label: 'Studio' }, { value: 'r2', label: 'Hall' }])`)
  await Bun.sleep(50)

  expect(await values('late')).toEqual(['', 'r1', 'r2'])
  expect(await chosen('late')).toBe('r2')
}, 15_000)

it('hands the server-rendered options over without duplicating them', async () => {
  expect(await values('static')).toEqual(['', 'S', 'M', 'L'])
  expect(await chosen('static')).toBe('M')
}, 15_000)

it('selects among <option> children drawn by the page', async () => {
  expect(await values('slot')).toEqual(['7', '9'])
  expect(await chosen('slot')).toBe('9')
}, 15_000)

it('writes a person\'s choice back, and follows the page', async () => {
  await view.evaluate(`(() => { const s = document.querySelector('#slot select'); s.value = '7'; s.dispatchEvent(new Event('change', { bubbles: true })) })()`)
  expect(await view.evaluate('window.probe.athlete()')).toBe('7')

  await view.evaluate(`window.probe.size.set('L')`)
  await Bun.sleep(30)
  expect(await chosen('static')).toBe('L')
}, 15_000)

/*
 * autoResize sized its field on mount by looking up the fixed id
 * 'textarea-input', which stopped matching anything once every instance got
 * an id of its own -- so a textarea with content opened at its `rows` height
 * and only grew after the first keystroke.
 */
it('sizes an autoResize textarea to its content on mount', async () => {
  const height = await view.evaluate(`document.querySelector('#notes textarea').style.height`)

  expect(height).toMatch(/^\d+(\.\d+)?px$/)
}, 15_000)
