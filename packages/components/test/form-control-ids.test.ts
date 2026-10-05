/**
 * Two of the same form control on one page get two ids.
 *
 * Every control derived its id from the LABEL or hardcoded it outright:
 *
 *   TextInput      `input-${label}`            ->  "input-" with no label
 *   PasswordInput  id="password-input"
 *   NumberInput    id="number-input"
 *   Textarea       id="textarea-input"
 *   Select         `select-${value}`
 *   Checkbox       `checkbox-${value || label}`
 *   Radio          `radio-${value || label}`
 *
 * So an ordinary form with two text inputs emitted the same id twice, and
 * `<label for>` activated the FIRST field from both labels. The descriptions
 * were worse: every one of these pointed `aria-describedby` at a global
 * constant — `helper-text`, `checkbox-description`, `radio-description` — so
 * every field's description resolved to the first field's helper text, and a
 * screen reader read the wrong hint for every field after the first.
 *
 * A label containing a space produced `id="input-First name"`, which is not a
 * valid id at all: ids may not contain ASCII whitespace, so getElementById
 * and querySelector cannot address it even when the browser's `for` matching
 * happens to work.
 *
 * Found by rendering every component in the library TWICE and diffing the ids,
 * which nothing did before — the single-instance case is exactly where this
 * class of bug hides. The same sweep is what surfaced stacksjs/stx#2033.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { processDirectives } from '../../stx/src/process'

const SRC = path.join(import.meta.dir, '..', 'src')

/** Every control that had an id, and a usage that exercises label + description. */
const CONTROLS = [
  { tag: 'TextInput', markup: '<TextInput label="L" helperText="H" />' },
  { tag: 'EmailInput', markup: '<EmailInput label="L" helperText="H" />' },
  { tag: 'SearchInput', markup: '<SearchInput label="L" />' },
  { tag: 'PasswordInput', markup: '<PasswordInput label="L" helperText="H" />' },
  { tag: 'NumberInput', markup: '<NumberInput label="L" helperText="H" />' },
  { tag: 'Textarea', markup: '<Textarea label="L" helperText="H" />' },
  { tag: 'Select', markup: '<Select label="L" helperText="H" />' },
  { tag: 'Checkbox', markup: '<Checkbox label="L" description="D" />' },
  { tag: 'Radio', markup: '<Radio label="L" description="D" />' },
] as const

/** The sources behind those tags, for the assertions that read them. */
const CONTROL_SOURCES = [
  'input/TextInput.stx',
  'input/EmailInput.stx',
  'input/SearchInput.stx',
  'input/PasswordInput.stx',
  'input/NumberInput.stx',
  'textarea/Textarea.stx',
  'select/Select.stx',
  'checkbox/Checkbox.stx',
  'radio/Radio.stx',
] as const

let dir = ''

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-form-ids-'))
  // The tree is preserved: a component that imports a sibling by relative path
  // renders with raw `{{ }}` in every attribute once it is flattened.
  await Bun.$`cp -R ${SRC} ${dir}/components`.quiet()
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

const attr = (html: string, pattern: RegExp) => [...html.matchAll(pattern)].map(m => m[1])
const ids = (html: string) => attr(html, /\sid="([^"]+)"/g).filter(id => !id.startsWith('__stx_evt') && id !== 'stx-cloak-style')

function duplicates(values: string[]): string[] {
  const seen = new Map<string, number>()
  for (const value of values) seen.set(value, (seen.get(value) ?? 0) + 1)
  return [...seen].filter(([, n]) => n > 1).map(([value]) => value)
}

describe('a form control\'s id is unique to its instance', () => {
  for (const { tag, markup } of CONTROLS) {
    it(`${tag} rendered twice emits no duplicate id`, async () => {
      const html = await render(markup + markup)

      expect(duplicates(ids(html)), `${tag} twice`).toEqual([])
    })
  }

  it('contains no whitespace, whatever the label says', async () => {
    const html = await render('<TextInput label="First name" helperText="As on your passport" />')

    for (const id of ids(html))
      expect(id, 'an id may not contain ASCII whitespace').not.toMatch(/\s/)
  })

  it('points each label at its own control', async () => {
    const html = await render('<TextInput label="First" /><TextInput label="Last" />')
    const fors = attr(html, /<label for="([^"]+)"/g)
    const inputs = attr(html, /<input[^>]*\sid="([^"]+)"/g)

    expect(fors).toHaveLength(2)
    expect(fors).toEqual(inputs)
    expect(duplicates(fors)).toEqual([])
  })

  it('points each description at its own control\'s helper text', async () => {
    const html = await render('<TextInput label="First" helperText="one" /><TextInput label="Last" helperText="two" />')
    const described = attr(html, /aria-describedby="([^"]+)"/g)
    const helpers = attr(html, /<p id="([^"]+)"/g)

    expect(described).toHaveLength(2)
    expect(described).toEqual(helpers)
    expect(duplicates(described), 'not one global helper-text for the page').toEqual([])
  })

  /*
   * The caller can still own the id, which is what makes the control usable
   * inside a form that wires its own `for` or `aria-describedby`.
   */
  it('lets a caller supply the id', async () => {
    const html = await render('<TextInput label="L" id="chosen-by-the-caller" />')

    expect(ids(html)).toContain('chosen-by-the-caller')
    expect(attr(html, /<label for="([^"]+)"/g)).toEqual(['chosen-by-the-caller'])
  })

  it('names no global constant for a description', () => {
    const GLOBAL_IDS = /(?:aria-describedby|<p id)="(?:helper-text|checkbox-description|radio-description)"/
    const offenders = CONTROL_SOURCES.filter(rel =>
      GLOBAL_IDS.test(readFileSync(path.join(SRC, 'ui', rel), 'utf-8')),
    )

    expect(offenders).toEqual([])
  })
})
