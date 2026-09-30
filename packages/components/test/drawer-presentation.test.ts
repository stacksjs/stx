/**
 * Drawer's three silent presentation defects, and the library-wide rule behind
 * one of them.
 *
 * Reported in stacksjs/stx#1982 and #2002 by an app adopting the component.
 * None of them threw, warned, or failed a build.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const DRAWER_DIR = path.join(ROOT, 'src/ui/drawer')

async function renderDrawer(tag: string): Promise<string> {
  return processDirectives(
    tag,
    {},
    path.join(ROOT, 'drawer-presentation.stx'),
    { componentsDir: DRAWER_DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/**
 * Markup only.
 *
 * A component ships its own template inside a client script as well, mustaches
 * and all, and that copy is not what the browser renders - so an assertion
 * about rendered output has to exclude it or it reads the source back and
 * proves nothing.
 */
function markup(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

/**
 * Source with its comments removed.
 *
 * Needed because this file's assertions are about what the CODE says, and
 * Drawer's comments quote the broken spellings they replaced - so a naive
 * search finds the explanation and reads it as the bug.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('Drawer size reaches the stylesheet (#2002)', () => {
  /*
   * The width utility was built as `max-w-${size}`, so the string `max-w-xl`
   * existed nowhere in the source tree. A content-scanning CSS engine emits a
   * rule for a class it can see; it never saw this one, so the panel had no
   * max-width and fell back to `w-screen` - full width, which is what `size`
   * is there to prevent. The default worked, because 'max-w-md' WAS a literal
   * in that expression, so the prop was broken only once you passed it.
   */
  it('emits the width class as a literal the scanner can find', async () => {
    const html = await renderDrawer('<Drawer size="xl" />')

    expect(markup(html)).toContain('max-w-xl')
  })

  it('has every offered width spelled out in the source', () => {
    const source = readFileSync(path.join(DRAWER_DIR, 'Drawer.stx'), 'utf-8')

    // This is the assertion the engine actually depends on: the literal, in
    // this file. Rendering alone would pass on an interpolation again.
    for (const width of ['max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-full'])
      expect(source).toContain(`'${width}'`)

    expect(code(source)).not.toMatch(/max-w-\$\{/)
  })

  it('falls back to md rather than dropping the class', async () => {
    const html = await renderDrawer('<Drawer size="enormous" />')

    expect(markup(html)).toContain('max-w-md')
    expect(markup(html)).not.toContain('max-w-enormous')
  })
})

describe('Drawer slides in from its edge (#1982)', () => {
  /*
   * There was one @keyframes slideIn whose `from` transform was a mustache
   * over `position`. A component's style block is lifted out of the source
   * before expressions run, so the mustache shipped verbatim, the declaration
   * was invalid, the browser dropped it, and the 0% frame was empty - the
   * panel appeared in place instead of sliding. fadeIn, in the same block,
   * was fine, because it had nothing to interpolate.
   */
  it('names a static keyframe per edge instead of interpolating one', async () => {
    const html = await renderDrawer('<Drawer position="left" />')

    expect(markup(html)).toContain('animation: slideInLeft')
    for (const name of ['slideInRight', 'slideInLeft', 'slideInTop', 'slideInBottom'])
      expect(html).toContain(`@keyframes ${name}`)
  })

  it('gives each keyframe a from-transform', () => {
    const source = readFileSync(path.join(DRAWER_DIR, 'Drawer.stx'), 'utf-8')

    for (const offset of ['translateX(100%)', 'translateX(-100%)', 'translateY(-100%)', 'translateY(100%)'])
      expect(source).toContain(offset)
  })
})

describe('Drawer title becomes the accessible name (#1982)', () => {
  /*
   * The attribute was assembled as a string - `'aria-label="' + title + '"'` -
   * inside a mustache, which escapes its result. So the quotes meant to be
   * attribute syntax arrived as &quot; AFTER the parser needed them, and a
   * two-word title produced aria-label='"Workout' plus a second attribute
   * named `details&quot;`. Every drawer with a multi-word title had the wrong
   * accessible name, which is the one thing `title` sets.
   */
  it('keeps a multi-word title in one attribute', async () => {
    const html = markup(await renderDrawer('<Drawer title="Workout details" />'))

    expect(html).toContain('aria-label="Workout details"')

    /*
     * Asserted on the panel's own opening tag, not on the whole document: the
     * props JSON in data-stx-props escapes its quotes legitimately, so a
     * document-wide search for &quot; finds that and says nothing about this.
     *
     * Both halves of the old failure are covered by the tag being clean - the
     * truncated value (aria-label=&quot;Workout) and the junk attribute the
     * remainder became (details&quot;).
     */
    const panelTag = html.match(/<div\b[^>]*data-stx-drawer-panel[^>]*>/)

    expect(panelTag?.[0]).toBeString()
    expect(panelTag![0]).not.toContain('&quot;')
  })

  it('does not build the attribute as an escaped string', () => {
    const source = readFileSync(path.join(DRAWER_DIR, 'Drawer.stx'), 'utf-8')

    expect(code(source)).not.toContain('\'aria-label="\'')
  })
})

/**
 * The general rule behind the keyframe bug, applied to the whole library.
 *
 * A component's style block is extracted before expressions run, so an
 * expression in one is never evaluated and never can be. It is not a thing
 * that works sometimes - it is always dead, and it always ships as literal
 * text into a stylesheet. Cheap to check, and it would have caught #1982 the
 * day it was written.
 */
describe('no component interpolates inside its style block', () => {
  function styleBlocks(source: string): string[] {
    // Anchored to the line start so a style tag NAMED in a comment - as
    // Drawer's own explanation of this bug does - is not read as one.
    return [...source.matchAll(/^<style\b[^>]*>([\s\S]*?)^<\/style>/gm)].map(([, body]) => body)
  }

  function stxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory())
        return stxFiles(full)
      return full.endsWith('.stx') ? [full] : []
    })
  }

  it('finds style blocks to check, so the sweep is not vacuous', () => {
    const withStyle = stxFiles(path.join(ROOT, 'src'))
      .filter(file => styleBlocks(readFileSync(file, 'utf-8')).length > 0)

    expect(withStyle.length).toBeGreaterThan(0)
  })

  it('leaves no expression in one', () => {
    const offenders: string[] = []
    const src = path.join(ROOT, 'src')

    for (const file of stxFiles(src)) {
      for (const body of styleBlocks(readFileSync(file, 'utf-8'))) {
        for (const [expression] of body.matchAll(/\{\{[^}]*\}\}|\{!![\s\S]*?!!\}/g))
          offenders.push(`${file.slice(src.length + 1)}: ${expression.trim()}`)
      }
    }

    expect(offenders).toEqual([])
  })
})
