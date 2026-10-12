/**
 * A client loop's variable shadows an app global or a server value of the
 * same name, also inside a component's slot.
 *
 * An app's auto-import barrel puts its helpers on `globalThis` for the server
 * (HQ exports a `tile` palette from resources/functions/apple-ui.ts). A screen
 * that looped `<View :for="tile in tiles()">` and bound `<Text :text="tile.label" />`
 * inside it lost every binding in the row: the slot is rendered away from the
 * `:for` on the component tag, so nothing saw a loop, `tile` looked like a
 * resolvable global, the expression was evaluated to undefined on the server,
 * and the Text nodes came out empty with no binding. Renaming the variable to
 * `stat` made it work, which is how it was found.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../src/config'
import { loopBoundNames, readsAnyName } from '../src/loop-binding'
import { compileScreenSource } from '../src/native/compiler/render-screen'
import { processDirectives } from '../src/process'

const SCRATCH = mkdtempSync(path.join(tmpdir(), 'stx-loop-shadow-'))
const COMPONENTS = path.join(SCRATCH, 'components')
mkdirSync(COMPONENTS)
writeFileSync(path.join(COMPONENTS, 'Box.stx'), '<div class="box"><slot /></div>')
writeFileSync(path.join(COMPONENTS, 'Label.stx'), '<script server>\nconst shown = $props.text\n</script><b>{{ shown }}</b>')

afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }))

const SCRIPT = `<script client lang="ts">\nfunction tiles() { return [{ label: 'A', value: '1', on: true }] }\n</script>\n`

/** What the page body rendered to, without the client script in front of it. */
async function render(body: string, context: Record<string, unknown> = {}): Promise<string> {
  const config = { ...defaultConfig, componentsDir: COMPONENTS }
  const html = await processDirectives(SCRIPT + body, context, path.join(SCRATCH, 'page.stx'), config as never, new Set())
  return html.slice(html.lastIndexOf('</script>') + '</script>'.length).trim()
}

const GLOBAL = 'tile'
const SERVER = { tile: { label: 'SERVER', value: 'SERVER', on: false } }

describe('a loop variable named like an app global', () => {
  let previous: PropertyDescriptor | undefined
  beforeEach(() => {
    previous = Object.getOwnPropertyDescriptor(globalThis, GLOBAL)
    // The shape of an auto-imported palette object: present, with none of
    // the row's fields.
    ;(globalThis as Record<string, unknown>)[GLOBAL] = { red: 'bg-red-500' }
  })
  afterEach(() => {
    if (previous)
      Object.defineProperty(globalThis, GLOBAL, previous)
    else delete (globalThis as Record<string, unknown>)[GLOBAL]
  })

  it('keeps component bindings in the slot of a component with :for', async () => {
    const html = await render('<Box :for="tile in tiles()" :key="tile.label"><Label :text="tile.label" /><Label :text="tile.value" /></Box>')
    expect(html).toContain(':text="tile.label"')
    expect(html).toContain(':text="tile.value"')
    expect(html).not.toContain('<b></b>')
  })

  it('keeps them through a component nested in the looped one', async () => {
    const html = await render('<Box :for="tile in tiles()"><Box><Label :text="tile.value" /></Box></Box>')
    expect(html).toContain(':text="tile.value"')
  })

  it('keeps them in a component slot inside a looped element', async () => {
    const html = await render('<div :for="tile in tiles()"><Box><Label :text="tile.value" /></Box></div>')
    expect(html).toContain(':text="tile.value"')
  })

  it('keeps :if on a component and turns an interpolated prop into a binding', async () => {
    const html = await render('<Box :for="tile in tiles()"><Label :if="tile.on" :text="tile.label" /><Label text="{{ tile.value }}" /><Label text="#{{ tile.label }}!" /></Box>')
    expect(html).toContain(':if="tile.on"')
    expect(html).toContain(':text="tile.label"')
    expect(html).toContain(':text="tile.value"')
    expect(html).toContain(':text="`#${tile.label}!`"')
  })

  it('keeps plain element bindings and mustaches in the slot', async () => {
    const html = await render('<Box :for="tile in tiles()"><i :class="{ on: tile.on }" :style="{ color: tile.value }" :title="tile.value" :if="tile.on">{{ tile.value }}</i></Box>')
    expect(html).toContain(':class="{ on: tile.on }"')
    expect(html).toContain(':style="{ color: tile.value }"')
    expect(html).toContain(':title="tile.value"')
    expect(html).toContain(':if="tile.on"')
    expect(html).toContain('{{ tile.value }}')
    expect(html).not.toContain('[object Object]')
  })

  it('understands an index and destructuring in the loop head', async () => {
    expect(await render('<Box :for="(tile, i) in tiles()"><Label :text="tile.value + i" /></Box>')).toContain(':text="tile.value + i"')
    expect(await render('<Box :for="{ label: tile } in tiles()"><Label :text="tile" /></Box>')).toContain(':text="tile"')
    expect(await render('<Box :for="({ label: tile }, i) in tiles()"><Label :text="tile" /></Box>')).toContain(':text="tile"')
  })

  it('still resolves the global outside the loop', async () => {
    const html = await render('<Box :for="t in tiles()"><Label :text="t.label" /></Box><Label :text="tile.red" />')
    expect(html).toContain(':text="t.label"')
    expect(html).toEndWith('<b>bg-red-500</b>')
  })

  it('keeps a native screen\'s Text bindings in the row', async () => {
    const source = `${SCRIPT}<template><View class="flex-row"><View :for="tile in tiles()" :key="tile.label" class="flex-1"><Text :text="tile.label" /><Text :text="tile.value" /></View></View></template>`
    const file = path.join(SCRATCH, 'Probe.stx')
    writeFileSync(file, source)
    const { manifest } = await compileScreenSource(source, file)
    const bindings = manifest.entries.flatMap(entry => entry.bindings.map(binding => `${binding.name}=${binding.value}`))
    expect(bindings).toContain(':for=tile in tiles()')
    expect(bindings).toContain(':text=tile.label')
    expect(bindings).toContain(':text=tile.value')
  })
})

describe('a loop variable named like a server value', () => {
  it('shadows it in a component slot, for every kind of binding', async () => {
    const html = await render('<Box :for="tile in tiles()"><Label :text="tile.label" /><i :title="tile.value">{{ tile.value }}</i></Box>', SERVER)
    expect(html).not.toContain('SERVER')
    expect(html).toContain(':text="tile.label"')
    expect(html).toContain(':title="tile.value"')
    expect(html).toContain('{{ tile.value }}')
  })

  it('leaves the server value to everything outside the loop', async () => {
    const html = await render('<Box :for="tile in tiles()"><Label :text="tile.label" /></Box><p :title="tile.value">{{ tile.label }}</p>', SERVER)
    expect(html).toContain(':text="tile.label"')
    expect(html).toEndWith('<p title="SERVER">SERVER</p>')
  })

  it('leaves a component\'s own binding of the name to the component', async () => {
    writeFileSync(path.join(COMPONENTS, 'Own.stx'), '<script server>\nconst tile = \'own\'\n</script><em :title="tile"><slot /></em>')
    const html = await render('<Own :for="tile in tiles()"><Label :text="tile.value" /></Own>', SERVER)
    expect(html).toContain('<em title="own">')
    expect(html).toContain(':text="tile.value"')
  })
})

describe('loopBoundNames', () => {
  it('names every variable a loop head binds', () => {
    expect(loopBoundNames('tile in tiles()')).toEqual(['tile'])
    expect(loopBoundNames('item of items')).toEqual(['item'])
    expect(loopBoundNames('(item, index) in items')).toEqual(['item', 'index'])
    expect(loopBoundNames('item, index in items')).toEqual(['item', 'index'])
    expect(loopBoundNames('{ id, label: name } in rows')).toEqual(['id', 'name'])
    expect(loopBoundNames('([key, value], i) in entries')).toEqual(['key', 'value', 'i'])
    expect(loopBoundNames('({ a = 1, ...rest }, i) in rows')).toEqual(['a', 'rest', 'i'])
    expect(loopBoundNames('items as idx => item')).toEqual(['item', 'idx'])
    expect(loopBoundNames('items as (item, idx)')).toEqual(['item', 'idx'])
    expect(loopBoundNames('not a loop')).toEqual([])
  })

  it('counts only variable reads, not properties, keys or strings', () => {
    expect(readsAnyName('tile.label', ['tile'])).toBe(true)
    expect(readsAnyName('{ tile }', ['tile'])).toBe(true)
    expect(readsAnyName('`${tile.label}`', ['tile'])).toBe(true)
    expect(readsAnyName('row.tile', ['tile'])).toBe(false)
    expect(readsAnyName('{ tile: 1 }', ['tile'])).toBe(false)
    expect(readsAnyName('\'tile\'', ['tile'])).toBe(false)
  })
})
