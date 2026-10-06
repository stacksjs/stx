/**
 * A boolean prop set to "false" turns the thing OFF.
 *
 * Every component read its boolean props as `$props.disabled || false`. A prop
 * written as a plain attribute arrives as a string, so that left the string
 * "false" - truthy. `<Radio disabled="false">` was disabled,
 * `<Video muted="false">` was muted, `<Card clickable="false">` was clickable,
 * and `<Dialog open="false">` opened over the page and locked its scroll.
 *
 * Measured on the unfixed library by rendering each component twice, once with
 * the prop set to "false" and once without it, and comparing: 103 of the 104
 * boolean props rendered differently, which is only possible if "false" was
 * being read as on. stacksjs/stx#2006.
 *
 * Nothing reported it, and the symptom misdirects - a prop that turns
 * something on when you ask for it off reads as the component ignoring the
 * prop, so you go looking at the component rather than at the coercion.
 *
 * The props are DISCOVERED from each component's source, so a new one is
 * covered the day it lands rather than the day someone remembers to add it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const SRC = path.join(ROOT, 'src')

function stxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      return stxFiles(full)
    return full.endsWith('.stx') ? [full] : []
  })
}

async function render(markup: string, dir: string): Promise<string> {
  return processDirectives(
    markup,
    {},
    path.join(ROOT, 'boolean-prop-audit.stx'),
    { componentsDir: dir, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/**
 * Output with the per-instance noise removed, so two renders of the same
 * component can be compared at all: the scope id carries a counter, and the
 * serialised props necessarily differ because one render passed a prop.
 */
function comparable(html: string): string {
  return html
    .replace(/stx_[a-z_]*\d+_[a-z0-9]+/g, 'SCOPE')
    // Leading whitespace included, or removing the attribute leaves a space
    // before the `>` and every comparison fails on that alone.
    .replace(/\s*data-stx-props="[^"]*"/g, '')
    .replace(/\s+>/g, '>')
    .replace(/\/_stx\/css\.[a-f0-9]+\.css/g, '/_stx/css.HASH.css')
}

interface Case { tag: string, prop: string, dir: string, fallback: boolean }

/*
 * Every spelling is discovered: the $bool call, and the three bare idioms it
 * replaced. Matching only the fixed form would mean the sweep stops checking a
 * prop the moment someone writes a broken one again - a guard that opts out
 * exactly when it is needed.
 *
 * `!== false` and `=== true` were missed by the first version of this sweep,
 * which looked only for `||` and `??`, and nine props were still reading their
 * own attribute wrong behind them: `<Transition show="false">` showed,
 * `<Image lazy="false">` stayed lazy, `<TableRow hoverable="false">` hovered.
 * `=== true` fails the other way and is harder to spot for it - `"true"` is
 * not `true`, so `<Form validateOnChange="true">` could not turn validation ON
 * and neither could the bare `<Form validateOnChange>`, which arrives as "".
 */
const BOOLEAN_PROP = /export const (\w+) = (\$bool\(\$props\.\1(?:,\s*(?:true|false))?\)|\$props\.\1\s*(?:\|\||\?\?)\s*(?:true|false)|\$props\.\1\s*!==\s*false|\$props\.\1\s*===\s*true)/g

/** The value the prop takes when it is not passed at all. */
function fallbackOf(read: string): boolean {
  return /,\s*true\)|(?:\|\||\?\?)\s*true|!==\s*false/.test(read)
}

const cases: Case[] = []
for (const file of stxFiles(SRC)) {
  const tag = path.basename(file, '.stx')
  const source = readFileSync(file, 'utf-8')
  for (const [, prop, read] of source.matchAll(BOOLEAN_PROP))
    cases.push({ tag, prop, dir: path.dirname(file), fallback: fallbackOf(read) })
}

describe('a boolean prop set to "false" is off', () => {
  it('finds the boolean props to check in the first place', () => {
    // A sweep over an empty list passes by checking nothing.
    expect(cases.length).toBeGreaterThan(100)
    expect(cases.map(c => `${c.tag}.${c.prop}`)).toContain('Dialog.open')
  })

  /*
   * One assertion per prop whose default is false: rendering with the prop set
   * to "false" has to be indistinguishable from not passing it. That is the
   * exact comparison the bug was measured with, so a regression reads the same
   * way it was first found.
   */
  for (const { tag, prop, dir, fallback } of cases.filter(c => !c.fallback)) {
    it(`<${tag} ${prop}="false"> renders as <${tag}>`, async () => {
      const off = await render(`<${tag} ${prop}="false" />`, dir)
      const absent = await render(`<${tag} />`, dir)

      expect(comparable(off)).toBe(comparable(absent))
      expect(fallback).toBe(false)
    })
  }

  /*
   * And the mirror, for the props that default to true: "true" has to be
   * indistinguishable from not passing it, which catches a $bool call that was
   * given the wrong fallback in the mechanical rewrite.
   */
  for (const { tag, prop, dir } of cases.filter(c => c.fallback)) {
    it(`<${tag} ${prop}="true"> renders as <${tag}>`, async () => {
      const on = await render(`<${tag} ${prop}="true" />`, dir)
      const absent = await render(`<${tag} />`, dir)

      expect(comparable(on)).toBe(comparable(absent))
    })
  }
})

/*
 * And the sweep's own blind spot, closed from the other side.
 *
 * Everything above is anchored on `export const <name> = $props.<name>`, which
 * cannot see a prop read into a differently-named variable. `SidebarHeader`
 * read its own `showWindowControls` inside the expression that resolves
 * `windowControls`, so no amount of widening the pattern above would have
 * found it -- and `showWindowControls="false"` drew the replica traffic lights
 * it was asked not to draw, which inside a real window is the six-circles bug
 * the `windowControls` prop exists to prevent.
 *
 * So the declared types are the list instead. A prop typed `boolean` in the
 * published interface has exactly one correct way to be read, wherever in the
 * script it is read, and this says so without having to guess at the shape of
 * the expression around it.
 */
interface Declared { component: string, prop: string }

function declaredBooleanProps(): Declared[] {
  const found: Declared[] = []
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory())
      return walk(full)
    return full.endsWith('.ts') ? [full] : []
  })

  for (const file of walk(SRC)) {
    const source = readFileSync(file, 'utf-8')
    for (const [, component, body] of source.matchAll(/export interface (\w+)Props\s*\{([\s\S]*?)\n\}/g)) {
      /*
       * `\??` and the trailing-comment tail are both load-bearing, though
       * neither catches anything today.
       *
       * The first version of this required `?:`, so a REQUIRED prop was
       * invisible to it, and ended at `boolean`, so a prop documented with a
       * trailing `// comment` was too. Both holes were found by writing the
       * same sweep for number props, where they did hide something: the
       * required `stepNumber` and the commented `firstDayOfWeek` were the two
       * the number sweep missed, and `stepNumber` was the one actually broken.
       * No boolean prop is written either way at the moment, which is exactly
       * why this needs saying -- the next one would have slipped through
       * silently.
       */
      for (const [, prop] of body.matchAll(/^ {2}(\w+)\??:\s*boolean\s*(?:\/\/.*)?$/gm))
        found.push({ component, prop })
    }
  }
  return found
}

describe('a prop declared boolean is read as one', () => {
  const declared = declaredBooleanProps()
  const sources = new Map(stxFiles(SRC).map(file => [path.basename(file, '.stx'), readFileSync(file, 'utf-8')]))

  it('finds the declarations to check against', () => {
    expect(declared.length).toBeGreaterThan(100)
    expect(declared.map(d => `${d.component}.${d.prop}`)).toContain('SidebarHeader.showWindowControls')
  })

  it('reads every one of them through $bool', () => {
    // A prop the component never reads from $props is left alone: some are
    // documented for a wrapper, or consumed on the client through
    // useReactiveProp, and neither is this coercion's business.
    const raw = declared.filter(({ component, prop }) => {
      const source = sources.get(component)
      if (!source || source.includes(`$bool($props.${prop}`))
        return false
      return new RegExp(`\\$props\\.${prop}\\b`).test(source)
    })

    expect(raw.map(d => `${d.component}.${d.prop}`)).toEqual([])
  })
})
