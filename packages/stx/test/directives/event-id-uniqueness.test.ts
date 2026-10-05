/**
 * Two instances of a component get two element ids (stacksjs/stx#2033).
 *
 * `findElementsWithEvents` numbers the elements it stamps with a counter local
 * to the call, and a component's template is parsed once per instance — so
 * every instance started at 0 and emitted `id="__stx_evt_0"`. The generated
 * binding resolves its element with
 *
 *     var $el = document.getElementById('__stx_evt_0');
 *
 * which returns the FIRST match. So every instance's handler bound to the
 * first instance's element, and instances 2..N had no handler at all. What
 * that cost, with nothing logged and no error:
 *
 *   <Listbox> with two options        selecting either did nothing
 *   <Combobox> with two options       selecting either did nothing
 *   <Combobox>'s chevron              never opened the list, at any count
 *   two <Listbox> on one page         neither trigger opened
 *
 * `<Dropdown>` escaped it for an unrelated reason: `DropdownItem` opens its
 * client script with `defineEmits()`, which makes `hasSignalScripts` true, so
 * `skipEventDirectives` keeps its `@click` out of this path entirely and the
 * runtime binds it per element from the attribute.
 *
 * The id is namespaced with the component's uid, which cannot be a module
 * counter or anything random: `utils.ts` documents why a component id must be
 * identical across renders (a render that produces different bytes each time
 * is uncacheable, measured at ~5MB of native churn per render), and the uid
 * already satisfies that along with being unique in a document and distinct
 * across pages. A page renders once, so its own ids stay bare.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'

let dir = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-event-ids-'))
  // One event binding, no signal API: the shape that goes through events.ts.
  await Bun.write(path.join(dir, 'components', 'Tap.stx'), `<script client>\nfunction onTap(e) { void e }\n</script>\n<button data-tap @click="onTap($event)"><slot /></button>\n`)
})

afterAll(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

async function render(template: string): Promise<string> {
  const file = path.join(dir, 'page.stx')
  return processDirectives(template, { __filename: file }, file, {
    componentsDir: path.join(dir, 'components'),
    root: dir,
    buildMode: 'serve',
  } as any, new Set<string>())
}

function ids(html: string): string[] {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])
}

function duplicates(values: string[]): string[] {
  const seen = new Map<string, number>()
  for (const value of values) seen.set(value, (seen.get(value) ?? 0) + 1)
  return [...seen].filter(([, n]) => n > 1).map(([value]) => value)
}

describe('an event binding id is unique per component instance (#2033)', () => {
  it('gives three instances three different ids', async () => {
    const html = await render('<Tap>a</Tap><Tap>b</Tap><Tap>c</Tap>')
    const found = ids(html).filter(id => id.startsWith('__stx_evt_'))

    expect(found).toHaveLength(3)
    expect(duplicates(found)).toEqual([])
  })

  it('duplicates no id anywhere in the document', async () => {
    const html = await render('<Tap>a</Tap><Tap>b</Tap><Tap>c</Tap><Tap>d</Tap>')

    expect(duplicates(ids(html))).toEqual([])
  })

  /*
   * The binding looks its element up by id, so a repeated id is not a cosmetic
   * problem: it is the mechanism by which the wrong element gets the handler.
   */
  it('looks up each handler by an id that resolves to one element', async () => {
    const html = await render('<Tap>a</Tap><Tap>b</Tap>')
    const lookedUp = [...html.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1])

    expect(lookedUp.length).toBeGreaterThanOrEqual(2)
    for (const id of new Set(lookedUp))
      expect(ids(html).filter(candidate => candidate === id), id).toHaveLength(1)
    expect(duplicates(lookedUp), 'and no two handlers share a lookup').toEqual([])
  })

  it('names the instance in the id, rather than counting globally', async () => {
    const html = await render('<Tap>a</Tap><Tap>b</Tap>')
    const found = ids(html).filter(id => id.startsWith('__stx_evt_'))

    for (const id of found)
      expect(id, 'carries the component uid').toMatch(/^__stx_evt_stx_tap_\d+_/)
  })

  /*
   * A page is rendered once, so its ids were never the broken case. Leaving
   * them bare keeps this change to the case that needed it — and the page
   * context has no `$uid`, which is what the namespace is read from.
   */
  it('leaves a page\'s own ids bare', async () => {
    const html = await render('<button @click="pageTap()">x</button>')
    const found = ids(html).filter(id => id.startsWith('__stx_evt_'))

    expect(found).toEqual(['__stx_evt_0'])
  })
})
