/**
 * An absent `value` prop reaches the client as null, not as "null".
 *
 * Eight components wrote `{{ value === undefined ? 'null' : value }}` to put
 * the bare token null into their client script. An interpolation quotes a
 * string, so what they emitted was the four-character string `"null"` --
 * truthy, in the one place a value is meant to be absent. `<Listbox>`,
 * `<Combobox>` and `<RadioGroup>` therefore started with `selected()` holding
 * `"null"`, and emitted it as a change value on open.
 *
 * Nothing compared equal to it, so no selection looked wrong on screen and the
 * defect stayed invisible. `Calendar` and `DateRangePicker` already carry
 * comments saying they avoid the sentinel for this reason (stacksjs/stx#1981),
 * so it was known-bad in two places and live in eight.
 *
 * The fix is JSON.stringify on the server and raw interpolation, which is
 * correct for every type rather than for every type except the absent one.
 * Measured against the old idiom, only the absent case differed:
 *
 *   value        old            new
 *   (none)       "null"         null
 *   "apple"      "apple"        "apple"
 *   7            7              7
 *   { a: 1 }     { a: 1 }       { a: 1 }
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { processDirectives } from '../../stx/src/process'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

/** Every component that carried the sentinel, and the client binding it feeds. */
const CARRIED_THE_SENTINEL = [
  ['dropdown/DropdownItem.stx', 'itemValue'],
  ['listbox/Listbox.stx', 'initialValue'],
  ['listbox/ListboxOption.stx', 'optionValue'],
  ['combobox/Combobox.stx', 'initialValue'],
  ['combobox/ComboboxOption.stx', 'optionValue'],
  ['command-palette/CommandPaletteItem.stx', 'itemValue'],
  ['radio-group/RadioGroup.stx', 'initialValue'],
  ['radio-group/RadioGroupOption.stx', 'optionValue'],
] as const

let dir = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-absent-value-'))
  for (const [rel] of CARRIED_THE_SENTINEL) {
    const name = path.basename(rel)
    await Bun.write(path.join(dir, 'components', name), readFileSync(path.join(UI, rel), 'utf-8'))
  }
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

/** The literal a component's client script was handed for its value binding. */
function emitted(html: string, binding: string): string | undefined {
  return html.match(new RegExp(`const ${binding} = ([^\\n;]*)`))?.[1]?.trim()
}

describe('an absent value prop is null on the client (#1981)', () => {
  for (const [rel, binding] of CARRIED_THE_SENTINEL) {
    const tag = path.basename(rel, '.stx')

    it(`${tag} emits null, not the string`, async () => {
      const html = await render(`<${tag} />`)
      const value = emitted(html, binding)

      expect(value, `${tag} renders its ${binding} binding`).toBeTruthy()
      expect(value, 'the four-character string is the bug').not.toMatch(/^["']null["']/)
      expect(value).toMatch(/^null\b/)
    })
  }

  it('still carries a real value through, of any type', async () => {
    expect(emitted(await render('<DropdownItem value="apple" />'), 'itemValue')).toMatch(/^"apple"/)
    expect(emitted(await render('<DropdownItem :value="7" />'), 'itemValue')).toMatch(/^7\b/)
    expect(emitted(await render('<DropdownItem :value="{ a: 1 }" />'), 'itemValue')).toMatch(/\{\s*"?a"?:\s*1\s*\}/)
  })

  /*
   * The sentinel is gone from the source as well as from the output, so
   * copying one of these components as a template cannot reintroduce it. The
   * comments explaining the fix name the ternary without writing a live
   * interpolation, which would be evaluated inside the comment.
   */
  it('leaves the sentinel in no component source', () => {
    const offenders: string[] = []

    for (const [rel] of CARRIED_THE_SENTINEL) {
      const source = readFileSync(path.join(UI, rel), 'utf-8')
      if (/\{\{[^}]*'null'[^}]*\}\}/.test(source))
        offenders.push(rel)
    }

    expect(offenders).toEqual([])
  })

  it('builds the literal on the server, where the type is still known', () => {
    for (const [rel, binding] of CARRIED_THE_SENTINEL) {
      const source = readFileSync(path.join(UI, rel), 'utf-8')

      expect(source, rel).toContain('JSON.stringify(value === undefined ? null : value)')
      expect(source, rel).toContain(`const ${binding} = {!! valueJson !!}`)
    }
  })
})
