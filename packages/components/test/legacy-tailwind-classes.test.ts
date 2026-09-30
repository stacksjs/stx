import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { generateCss } from '../../stx/src/dev-server/ts-css'

/**
 * The library used two Tailwind spellings the CSS engine has no rule for, so
 * the classes were scanned, matched nothing, and emitted no CSS at all.
 *
 * Nothing reported it. A missing utility is not an error anywhere in the
 * chain - the class stays in the markup, the stylesheet simply has no rule for
 * it, and the element renders with whatever it inherited. A dialog backdrop
 * written `bg-black bg-opacity-25` rendered as solid black over the page
 * (stacksjs/stx#1977) and form inputs written `dark:bg-blue-gray-700` had no
 * dark mode (stacksjs/stx#1976).
 *
 * `ring-opacity-*` was the subtler half: it DOES compile, to
 * `--tc-ring-opacity`, which no other rule reads. `ring-black` writes
 * `--tc-ring-color: #000` outright and `ring-1` reads that variable, so the
 * opacity landed in a variable nothing consumes and every ring rendered fully
 * opaque. A grep for classes that emit nothing would have missed it, which is
 * why the pattern is banned by name here rather than inferred from empty
 * output.
 */
describe('the component library only uses classes the CSS engine can compile', () => {
  const SRC = join(import.meta.dir, '..', 'src')

  function sourceFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory())
        sourceFiles(full, out)
      else if (full.endsWith('.stx') || full.endsWith('.ts'))
        out.push(full)
    }
    return out
  }

  /**
   * Every offending line, as `path:line: text`, so a failure names the file
   * instead of just proving one exists.
   */
  function hits(pattern: RegExp): string[] {
    const found: string[] = []
    for (const file of sourceFiles(SRC)) {
      const lines = readFileSync(file, 'utf-8').split('\n')
      lines.forEach((line, index) => {
        if (pattern.test(line))
          found.push(`${file.slice(SRC.length + 1)}:${index + 1}: ${line.trim()}`)
      })
    }
    return found
  }

  it('has no v2 blue-gray-* classes left', () => {
    expect(hits(/\bblue-gray-\d/)).toEqual([])
  })

  it('has no v3 *-opacity-* classes left', () => {
    expect(hits(/\b(?:bg|text|border|ring|divide|placeholder|from|via|to)-opacity-\d/)).toEqual([])
  })

  /*
   * The two assertions above are taste rules on their own. These pin the
   * reason: the engine really does drop the old spelling and really does
   * honour the new one. If the engine ever learns blue-gray or bg-opacity,
   * this fails and says the ban can be lifted - rather than the ban quietly
   * outliving its cause.
   */
  it('drops the banned spellings and honours the replacements', async () => {
    const dead = await generateCss('<div class="bg-blue-gray-700 bg-opacity-25"></div>')
    expect(dead).not.toContain('blue-gray-700')
    expect(dead).not.toContain('bg-opacity-25')

    const live = await generateCss('<div class="bg-slate-700 bg-black/25 ring-black/5"></div>')
    expect(live).toContain('bg-slate-700')
    expect(live).toContain('bg-black\\/25')
    expect(live).toContain('ring-black\\/5')
  })

  /*
   * ring-opacity's failure mode, stated as an assertion: it compiles, and what
   * it compiles to is unreachable from any ring color utility.
   */
  it('confirms ring-opacity-* sets a variable no ring color reads', async () => {
    const css = await generateCss('<div class="ring-1 ring-black ring-opacity-5"></div>')

    expect(css).toContain('--tc-ring-opacity')
    // ring-black hard-codes the color, so the opacity variable is orphaned.
    expect(css).toContain('--tc-ring-color: #000')
    expect(css).not.toContain('var(--tc-ring-opacity)')
  })
})
