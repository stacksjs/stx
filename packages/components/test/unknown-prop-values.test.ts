/**
 * An unrecognised prop value must not delete the classes it was supposed to
 * pick.
 *
 * Every component in the library styles itself by indexing a lookup table with
 * a prop: `sizeClasses[size]`, `variantClasses[variant]`. Unguarded, a value
 * that is not a key of the map evaluates to undefined, and the template
 * literal it sits in stringifies that to the literal word "undefined" - so the
 * class attribute gets a class nobody defines, and the utility it replaced is
 * simply gone.
 *
 * What goes missing is usually the thing making the component work.
 * `<Drawer position="centre">` lost `inset-y-0 right-0 …`, leaving a `fixed`
 * element with no insets - not a mis-positioned drawer but an unpositioned
 * one. `<Progress size="large">` lost its height, so the bar had none to
 * fill. `<Badge variant="danger">` on a map that spells it "error" lost its
 * entire background and text colour.
 *
 * And it was silent: no throw, no warning, nothing in the console. A typo in a
 * prop produced a component that rendered, looked broken, and said nothing
 * about why. stacksjs/stx#1995 reported it for Skeleton; #2001 found 21
 * prop/component pairs.
 *
 * The props are DISCOVERED from each component's source rather than listed
 * here, so a new component that indexes a new map is covered the day it lands
 * instead of the day someone remembers to add it.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a dist that lags
// the source. Same reason as renders-under-current-stx.test.ts.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')

function componentFiles(): string[] {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      return walk(full)
    return entry.endsWith('.stx') ? [full] : []
  })
  return [...walk(path.join(ROOT, 'src/ui')), ...walk(path.join(ROOT, 'src/components'))]
}

/**
 * Props this component uses as a lookup key: declared from `$props`, and used
 * to index something.
 *
 * Deliberately conservative. A key built from an expression
 * (`paddingClasses[image ? 'none' : padding]`) is skipped, because the point is
 * to enumerate props a caller can get wrong, and `padding` is already in the
 * list from its other use site.
 */
function lookupProps(source: string): string[] {
  const fromProps = new Set(
    [...source.matchAll(/\b(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*\$props\.(\w+)/g)]
      .filter(([, local, prop]) => local === prop)
      .map(([, local]) => local),
  )

  const used = new Set<string>()
  for (const [, key] of source.matchAll(/[A-Za-z_$][\w$]*\[\s*([A-Za-z_$][\w$]*)\s*\]/g)) {
    if (fromProps.has(key))
      used.add(key)
  }
  return [...used].sort()
}

async function render(tag: string, dir: string): Promise<string> {
  return processDirectives(
    tag,
    {},
    path.join(ROOT, 'unknown-prop-audit.stx'),
    { componentsDir: dir, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/**
 * `undefined` standing alone as a class token.
 *
 * Scoped to class attributes so a legitimate `undefined` elsewhere - in a
 * component's own client script, say - is not mistaken for this bug.
 */
function undefinedClassTokens(html: string): string[] {
  return [...html.matchAll(/\sclass="([^"]*)"/g)]
    .map(([, value]) => value)
    .filter(value => value.split(/\s+/).includes('undefined'))
}

/*
 * A value no map has a key for. Spelled to read unmistakably in a failure
 * message rather than looking like a plausible option someone chose.
 */
const NOT_A_KEY = 'no-such-value'

describe('an unrecognised prop value falls back instead of deleting the class', () => {
  const cases: { tag: string, prop: string, dir: string }[] = []
  for (const file of componentFiles()) {
    const tag = path.basename(file, '.stx')
    for (const prop of lookupProps(readFileSync(file, 'utf-8')))
      cases.push({ tag, prop, dir: path.dirname(file) })
  }

  it('finds lookup props to check in the first place', () => {
    // If the discovery regex ever stops matching, every case below silently
    // passes by not existing. Assert the shape of the sweep, not just its
    // result.
    expect(cases.length).toBeGreaterThan(15)
    expect(cases.map(c => `${c.tag}.${c.prop}`)).toContain('Skeleton.variant')
  })

  for (const { tag, prop, dir } of cases) {
    it(`<${tag} ${prop}="${NOT_A_KEY}">`, async () => {
      const html = await render(`<${tag} ${prop}="${NOT_A_KEY}" />`, dir)

      expect(undefinedClassTokens(html)).toEqual([])
    })
  }
})
