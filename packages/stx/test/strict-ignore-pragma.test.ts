/**
 * A per-line exemption, written at the site that needs it (stacksjs/stx#2049).
 *
 * `allowPatterns` is rule-global. Exempting one justified call site turned the
 * rule off for the whole app -- and it is the rule you most want enforced
 * everywhere else, so the choice was: lose the rule, or leave
 * `failOnViolation: false` on for ever.
 *
 * That second option is the one that matters. `failOnViolation: true` is the
 * only state where this guard prevents a regression rather than reporting one,
 * and an app reaches it by emptying its queue. If the queue can contain entries
 * that are CORRECT and unfixable, it never empties and the guard stays
 * advisory -- close to the problem strict mode was added to solve, where an
 * absent `strict` key dropped every finding silently.
 *
 * The reported case: an auth form that must intercept its own submit before
 * hydration, because the endpoint parses JSON and the native POST exists only
 * so password managers recognise the form. A plain `<script>` with
 * `getElementById` is the correct implementation there, and it trips the rule
 * for ever.
 */
import { describe, expect, it } from 'bun:test'
import { parseStrictIgnores, validateClientScript } from '../src/script-validation'

const STRICT = { enabled: true, failOnViolation: true }

/** Does this script survive strict mode? */
function accepts(code: string): boolean {
  try {
    validateClientScript(code, `/app/${Math.random()}.stx`, STRICT)
    return true
  }
  catch {
    return false
  }
}

/** The message thrown, for asserting on what was reported. */
function rejection(code: string): string {
  try {
    validateClientScript(code, `/app/${Math.random()}.stx`, STRICT)
    return ''
  }
  catch (error) {
    return (error as Error).message
  }
}

describe('without a directive, nothing changes', () => {
  it('still rejects a prohibited call', () => {
    expect(accepts(`var f = document.getElementById('signin')`)).toBe(false)
  })

  it('still accepts a clean script', () => {
    expect(accepts(`const f = useRef('signin')`)).toBe(true)
  })
})

describe('stx-strict-ignore-next-line', () => {
  it('exempts the line that follows it', () => {
    expect(accepts(
      `// stx-strict-ignore-next-line\nvar f = document.getElementById('signin')`,
    )).toBe(true)
  })

  it('exempts a named rule', () => {
    expect(accepts(
      `// stx-strict-ignore-next-line getElementById\nvar f = document.getElementById('signin')`,
    )).toBe(true)
  })

  it('carries a reason that it ignores', () => {
    // The reason is the whole point of preferring this to a config entry: it
    // puts the justification where the reviewer is looking.
    expect(accepts(
      `// stx-strict-ignore-next-line getElementById -- pre-hydration submit guard\n`
      + `var f = document.getElementById('signin')`,
    )).toBe(true)
  })

  it('does NOT exempt a rule it did not name', () => {
    // Naming querySelector must not excuse getElementById, or the directive is
    // just allowPatterns with extra steps.
    expect(accepts(
      `// stx-strict-ignore-next-line querySelector\nvar f = document.getElementById('signin')`,
    )).toBe(false)
  })

  it('exempts several named rules at once', () => {
    expect(accepts(
      `// stx-strict-ignore-next-line getElementById, querySelector\n`
      + `var f = document.getElementById('a') || document.querySelector('b')`,
    )).toBe(true)
  })
})

describe('a trailing directive governs its own line', () => {
  it('exempts the code it sits beside', () => {
    expect(accepts(
      `var f = document.getElementById('signin') // stx-strict-ignore`,
    )).toBe(true)
  })

  it('exempts a named rule inline', () => {
    expect(accepts(
      `var f = document.getElementById('signin') // stx-strict-ignore getElementById -- why`,
    )).toBe(true)
  })

  it('does not leak onto the next line', () => {
    expect(accepts(
      `var a = document.getElementById('a') // stx-strict-ignore\n`
      + `var b = document.getElementById('b')`,
    )).toBe(false)
  })
})

describe('suppression is per line, not per file', () => {
  it('still reports a violation three lines down', () => {
    // The property that makes this safe to adopt: exempting one justified call
    // must not quietly cover the debt around it.
    const message = rejection(
      `// stx-strict-ignore-next-line getElementById\n`
      + `var a = document.getElementById('a')\n`
      + `var b = document.getElementById('b')`,
    )
    expect(message).toContain('script line 3')
    expect(message).not.toContain('line 2')
  })

  it('reports the unexempted rule when another is exempted on the same line', () => {
    const message = rejection(
      `// stx-strict-ignore-next-line getElementById\n`
      + `var f = document.getElementById('a') || document.querySelector('b')`,
    )
    expect(message).toContain('querySelector')
    expect(message).not.toContain('getElementById()')
  })
})

describe('comment spellings', () => {
  it('accepts a block comment', () => {
    expect(accepts(
      `/* stx-strict-ignore-next-line getElementById */\nvar f = document.getElementById('x')`,
    )).toBe(true)
  })

  it('accepts an stx template comment', () => {
    expect(accepts(
      `{{-- stx-strict-ignore-next-line getElementById --}}\nvar f = document.getElementById('x')`,
    )).toBe(true)
  })
})

describe('parseStrictIgnores', () => {
  it('reads a bare directive as every rule on the next line', () => {
    const parsed = parseStrictIgnores('// stx-strict-ignore-next-line\ncode')
    expect(parsed.get(2)).toEqual(new Set())
  })

  it('reads named rules', () => {
    const parsed = parseStrictIgnores('// stx-strict-ignore-next-line a, b\ncode')
    expect(parsed.get(2)).toEqual(new Set(['a', 'b']))
  })

  it('drops the reason', () => {
    const parsed = parseStrictIgnores('// stx-strict-ignore-next-line a -- because b and c\ncode')
    expect(parsed.get(2)).toEqual(new Set(['a']))
  })

  it('lets a bare directive widen a named one on the same line', () => {
    const parsed = parseStrictIgnores(
      '// stx-strict-ignore-next-line getElementById\n// stx-strict-ignore-next-line\ncode',
    )
    // Line 3 is covered by the bare directive on line 2; the named one on line
    // 1 applies to line 2, which has no code.
    expect(parsed.get(3)).toEqual(new Set())
  })

  it('finds nothing in a script with no directives', () => {
    expect(parseStrictIgnores('const x = 1\nconst y = 2').size).toBe(0)
  })
})

describe('the directive does not reopen the holes allowPatterns closed', () => {
  it('ignores punctuation, which names no rule', () => {
    // allowPatterns rejects an entry with no word character because `['(']`
    // disabled almost every rule (#1792 P3). The same reasoning applies here.
    expect(accepts(
      `// stx-strict-ignore-next-line ((\nvar f = document.getElementById('x')`,
    )).toBe(false)
  })

  it('is not matched when it only appears inside a string', () => {
    // A script that PRINTS the directive has not used it.
    expect(accepts(
      `var help = "// stx-strict-ignore-next-line"\nvar f = document.getElementById('x')`,
    )).toBe(false)
  })
})
