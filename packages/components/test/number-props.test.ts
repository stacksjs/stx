/**
 * A number prop written as a plain attribute is a number.
 *
 * The numeric half of `boolean-props.test.ts`, and the same trap: a prop
 * written as an attribute arrives as a STRING. For booleans that flipped the
 * answer; for numbers it depends on the operator, which is what made it hard
 * to see. `-`, `*`, `/` and `<` coerce and quietly work, so most of a
 * component behaves. `+` concatenates, and `===` against a real number is
 * always false.
 *
 * So `<StepperStep stepNumber="2">` rendered its step label as **"21"**, and
 * `stepNumber="0"` as "01", because the template says `{{ stepNumber + 1 }}`.
 * Nothing else about that component looked wrong, and the arithmetic around it
 * -- which step is complete, which is upcoming -- kept working, because those
 * use `<` and `>`.
 *
 * `$num` is the engine binding that fixes it, beside `$bool`: `""` (a bare
 * attribute) and a non-numeric string both take the fallback rather than
 * becoming NaN, since NaN poisons every expression it reaches and renders as
 * the text "NaN" across a component.
 *
 * The props are DISCOVERED from the declared types, the same way the boolean
 * sweep does it, so a new one is covered the day it lands. Writing this sweep
 * is also what exposed two holes in that one: it required `?:`, so a REQUIRED
 * prop was invisible, and it ended at the type name, so a prop with a trailing
 * `// comment` was too. `stepNumber` is required and `firstDayOfWeek` carries a
 * comment -- the two the first draft of this file missed, and the required one
 * was the only prop actually broken.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const SRC = path.join(ROOT, 'src')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? files(full) : [full]
  })
}

const all = files(SRC)

interface Declared { component: string, prop: string }

/** Every prop declared `number` in a published interface, optional or not. */
function declaredNumberProps(): Declared[] {
  const found: Declared[] = []
  for (const file of all.filter(f => f.endsWith('.ts'))) {
    const source = readFileSync(file, 'utf-8')
    for (const [, component, body] of source.matchAll(/export interface (\w+)Props\s*\{([\s\S]*?)\n\}/g)) {
      for (const [, prop] of body.matchAll(/^ {2}(\w+)\??:\s*number\s*(?:\/\/.*)?$/gm))
        found.push({ component, prop })
    }
  }
  return found
}

const sources = new Map(all.filter(f => f.endsWith('.stx')).map(f => [path.basename(f, '.stx'), readFileSync(f, 'utf-8')]))
const dirs = new Map(all.filter(f => f.endsWith('.stx')).map(f => [path.basename(f, '.stx'), path.dirname(f)]))

async function render(markup: string, dir: string): Promise<string> {
  return processDirectives(
    markup,
    {},
    path.join(ROOT, 'number-prop-audit.stx'),
    { componentsDir: dir, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** Per-instance noise removed, so two renders of one component can be compared. */
function comparable(html: string): string {
  return html
    .replace(/stx_[a-z_]*\d+_[a-z0-9]+/g, 'SCOPE')
    .replace(/\s*data-stx-props="[^"]*"/g, '')
    .replace(/\s+>/g, '>')
    .replace(/\/_stx\/css\.[a-f0-9]+\.css/g, '/_stx/css.HASH.css')
    // A bundled client script is named by its content, and the content differs
    // by the value baked into it, which is the thing under test either way.
    .replace(/__stxBundle_[a-f0-9]+/g, 'BUNDLE')
    .replace(/bundle-tmp\/[a-f0-9-]+/g, 'bundle-tmp/ID')
}

describe('a prop declared number is read as one', () => {
  const declared = declaredNumberProps()

  it('finds the declarations to check against', () => {
    // A sweep over an empty list passes by checking nothing.
    expect(declared.length).toBeGreaterThan(20)
    expect(declared.map(d => `${d.component}.${d.prop}`)).toContain('StepperStep.stepNumber')
  })

  it('reads every one of them through $num', () => {
    /*
     * Two exemptions, both deliberate. `Notification.duration` coerces with
     * `Number(...)` already. `Textarea.maxLength` has no default and means "no
     * limit" when unset, and both of its uses are string-safe -- an HTML
     * `maxlength` attribute and a label -- so giving it a numeric zero would
     * invent a limit nobody asked for.
     */
    const exempt = new Set(['Notification.duration', 'Textarea.maxLength'])
    const raw = declared.filter(({ component, prop }) => {
      const source = sources.get(component)
      if (!source || exempt.has(`${component}.${prop}`))
        return false
      if (source.includes(`$num($props.${prop}`))
        return false
      return new RegExp(`\\$props\\.${prop}\\b`).test(source)
    })

    expect(raw.map(d => `${d.component}.${d.prop}`)).toEqual([])
  })
})

describe('the attribute and the expression agree', () => {
  /*
   * The comparison the bug was measured with: rendering with the value as a
   * plain attribute has to be indistinguishable from passing it as an
   * expression, which is the only spelling that was ever correct.
   */
  const cases: Array<[string, string]> = [
    ['Tabs', 'defaultTab="1"'],
    ['Stepper', 'currentStep="2"'],
    ['StepperStep', 'currentStep="2" stepNumber="2"'],
    ['Progress', 'value="50" max="100"'],
    ['Pagination', 'siblingCount="2" currentPage="5" totalPages="20"'],
    ['Skeleton', 'count="3"'],
    ['TwoFactorChallenge', 'codeLength="4"'],
    ['Calendar', 'firstDayOfWeek="1"'],
    ['Breadcrumb', 'maxItems="2"'],
    ['Tooltip', 'delay="200"'],
  ]

  for (const [tag, attrs] of cases) {
    it(`<${tag} ${attrs}> renders as the expression form`, async () => {
      const dir = dirs.get(tag)
      expect(dir, `${tag} was found`).toBeTruthy()

      const asAttribute = await render(`<${tag} ${attrs} />`, dir!)
      const asExpression = await render(`<${tag} ${attrs.replace(/(\w+)="(\d+)"/g, ':$1="$2"')} />`, dir!)

      expect(comparable(asAttribute)).toBe(comparable(asExpression))
    })
  }

  it('renders the step label as a number, not a concatenation', async () => {
    // The reported shape, asserted on the output rather than on a comparison,
    // so the failure reads as "21" instead of as a diff.
    const html = await render('<StepperStep stepNumber="2" title="Shipping" />', dirs.get('StepperStep')!)
    const labels = [...html.matchAll(/>\s*(\d+)\s*</g)].map(match => match[1])

    expect(labels).toContain('3')
    expect(labels).not.toContain('21')
  })
})
