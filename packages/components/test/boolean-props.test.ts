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
 * Both spellings are discovered: the $bool call, and the bare
 * `$props.x || false` idiom this replaced. Matching only the fixed form would
 * mean the sweep stops checking a prop the moment someone writes the broken
 * one again - a guard that opts out exactly when it is needed.
 */
const BOOLEAN_PROP = /export const (\w+) = (?:\$bool\(\$props\.\1(?:,\s*(true|false))?\)|\$props\.\1\s*(?:\|\||\?\?)\s*(true|false))/g

const cases: Case[] = []
for (const file of stxFiles(SRC)) {
  const tag = path.basename(file, '.stx')
  const source = readFileSync(file, 'utf-8')
  for (const [, prop, boolFallback, bareFallback] of source.matchAll(BOOLEAN_PROP))
    cases.push({ tag, prop, dir: path.dirname(file), fallback: (boolFallback ?? bareFallback) === 'true' })
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
