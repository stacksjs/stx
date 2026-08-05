/**
 * The DOM-API diagnostic points somewhere you can act on (stacksjs/stx#1836).
 *
 * It used to print only a basename — `default.stx` — for a violation authored in
 * a view. `filePath` is the LAYOUT once a view has been composed into one, so the
 * named file did not contain the offending code; the reporter of #1836 checked
 * all nine `default.stx` files in the project before finding it in
 * `resources/views/login.stx`.
 *
 * The line number compounded it: it counts lines of the extracted `<script>`
 * body, not of any file, so `line: 8` indexed neither — and `default.stx` was
 * five lines long.
 */
import { describe, expect, it } from 'bun:test'
import { validateClientScript } from '../src/script-validation'

function capture(fn: () => void): string {
  const original = console.warn
  let out = ''
  console.warn = (...args: unknown[]) => { out += args.join(' ') }
  try { fn() }
  finally { console.warn = original }
  return out
}

const STRICT = { enabled: true, failOnViolation: false }

describe('DOM API diagnostics (#1836)', () => {
  it('names the view a script was authored in, not just the layout', () => {
    const out = capture(() => {
      validateClientScript(
        'const t = localStorage.getItem("x")',
        '/app/resources/layouts/default.stx',
        STRICT,
        '/app/resources/views/login.stx',
      )
    })

    expect(out).toContain('resources/views/login.stx')
    // The layout is still named — it is where the composed template came from —
    // but it is clearly the container, not the author.
    expect(out).toContain('composed into')
    expect(out).toContain('resources/layouts/default.stx')
  })

  it('reports a path, not a bare basename', () => {
    const out = capture(() => {
      validateClientScript('document.getElementById("a")', '/app/resources/views/login.stx', STRICT)
    })
    // `default.stx` alone matched nine files in the reporting project.
    expect(out).toContain('resources/views/login.stx')
  })

  it('says line numbers count the script body, and quotes the line', () => {
    const src = [
      'const a = 1',
      'const b = 2',
      'document.querySelector(".btn")',
    ].join('\n')

    const out = capture(() => {
      validateClientScript(src, '/app/resources/views/x.stx', STRICT)
    })

    // Labelled as script-relative rather than a bare `line: 3` that reads as a
    // file line and indexes nothing.
    expect(out).toContain('script line')
    expect(out).toContain('3')
    // And quoted, so it is findable by search rather than by counting.
    expect(out).toContain('document.querySelector(".btn")')
  })

  it('still reports normally when there is no layout composition', () => {
    const out = capture(() => {
      validateClientScript('document.cookie', '/app/resources/views/solo.stx', STRICT)
    })
    expect(out).toContain('resources/views/solo.stx')
    expect(out).not.toContain('composed into')
  })
})
