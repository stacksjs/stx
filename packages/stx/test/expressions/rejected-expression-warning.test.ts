import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processExpressions, resetRejectedExpressionWarnings } from '../../src/expressions'
import { processDirectives } from '../../src/process'

/**
 * A `{{ }}` the safe evaluator rejects still renders as an empty string, but
 * no longer silently: in development it warns with the file, the expression
 * and the rule that rejected it.
 *
 * Found building marioadrion: the footer's `{{ new Date().getFullYear() }}`
 * vanished, with nothing in the output to say why.
 */

let warn: ReturnType<typeof spyOn>
let savedEnv: { NODE_ENV?: string, STX_DEBUG?: string }

const warnings = (): string[] => warn.mock.calls.map(args => String(args[0]))

beforeEach(() => {
  resetRejectedExpressionWarnings()
  savedEnv = { NODE_ENV: process.env.NODE_ENV, STX_DEBUG: process.env.STX_DEBUG }
  process.env.NODE_ENV = 'development'
  delete process.env.STX_DEBUG
  warn = spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined)
      delete process.env[key]
    else
      process.env[key] = value
  }
})

describe('rejected expression warning', () => {
  it('reproduces the report: the allowlisted year renders, the rest still work', async () => {
    const out = await processDirectives(
      `<p>{{ new Date(0).getUTCFullYear() }}</p><p>{{ Math.max(1, 2) }}</p>`,
      {},
      'page.stx',
      {} as any,
      new Set(),
    )
    expect(out).toBe('<p>1970</p><p>2</p>')
    expect(warnings()).toEqual([])
  })

  it('warns with the file, the expression and the rule, and still renders empty', () => {
    const out = processExpressions('<p>\n  {{ new Map().size }}\n</p>', {}, 'views/page.stx')
    expect(out).toBe('<p>\n  \n</p>')

    const messages = warnings()
    expect(messages).toHaveLength(1)
    expect(messages[0]).toStartWith('views/page.stx:2: stx warning:')
    expect(messages[0]).toContain('{{ new Map().size }} rendered as an empty string')
    expect(messages[0]).toContain('`new Map().size`')
    expect(messages[0]).toContain('matched /\\bnew\\s+/')
    expect(messages[0]).toContain('new Date()')
    expect(messages[0]).toContain('<script server>')
  })

  it('names the rule for non-`new` rejections', () => {
    processExpressions('<p>{{ user.constructor }}</p>', { user: {} }, 'page.stx')
    expect(warnings()[0]).toContain('identifier constructor')
  })

  it('reads the line from the file on disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-reject-'))
    const file = path.join(dir, 'footer.stx')
    const source = '<footer>\n  <p>Made here</p>\n  <p>© {{ new Map().size }}</p>\n</footer>\n'
    fs.writeFileSync(file, source)
    try {
      // The template this pass sees has lost the first two lines, as it would
      // after a layout or include is expanded around it.
      processExpressions('<p>© {{ new Map().size }}</p>', {}, file)
      expect(warnings()[0]).toStartWith(`${file}:3: stx warning:`)
    }
    finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('warns for {!! !!} and {{{ }}} as well', () => {
    processExpressions('{!! new Map() !!}', {}, 'a.stx')
    processExpressions('{{{ new Set() }}}', {}, 'b.stx')
    const messages = warnings()
    expect(messages).toHaveLength(2)
    expect(messages[0]).toContain('{!! new Map() !!}')
    expect(messages[1]).toContain('{{{ new Set() }}}')
  })

  it('warns when the rejected part is the base of a filter chain', () => {
    processExpressions('<p>{{ new Map() | json }}</p>', {}, 'page.stx')
    expect(warnings()).toHaveLength(1)
    expect(warnings()[0]).toContain('`new Map()`')
  })

  it('warns once per file and expression, not once per render', () => {
    for (let i = 0; i < 5; i++)
      processExpressions('<p>{{ new Map().size }}</p>', {}, 'page.stx')
    processExpressions('<p>{{ new Map().size }}</p>', {}, 'other.stx')
    expect(warnings()).toHaveLength(2)
  })

  it('stays quiet in production', () => {
    process.env.NODE_ENV = 'production'
    const out = processExpressions('<p>{{ new Map().size }}</p>', {}, 'page.stx')
    expect(out).toBe('<p></p>')
    expect(warnings()).toEqual([])
  })

  it('does not warn for an expression that is merely undefined', () => {
    processExpressions('<p>{{ maybe }}</p><p>{{ user.missing }}</p>', { user: {} }, 'page.stx')
    expect(warnings()).toEqual([])
  })

  it('does not warn for an expression preserved for the client', () => {
    // `:if` marks the template client-reactive; `items` is client-only.
    const out = processExpressions('<div :if="x">{{ new Map(items).size }}</div>', {}, 'page.stx')
    expect(out).toContain('{{ new Map(items).size }}')
    expect(warnings()).toEqual([])
  })
})

describe('client-reactive templates', () => {
  it('evaluates an allowlisted `new` on the server instead of shipping the mustache', () => {
    // `new` used to count as a client-only identifier, so this shipped as the
    // raw `{{ }}`, hidden under x-cloak, to a browser that never bound it.
    const out = processExpressions('<footer :if="x">© {{ new Date(0).getUTCFullYear() }}</footer>', {}, 'page.stx')
    expect(out).toContain('© 1970')
    expect(out).not.toContain('{{')
  })

  it('still preserves an expression that reads a client-only variable', () => {
    const out = processExpressions('<p :if="x">{{ new Date(stamp).getUTCFullYear() }}</p>', {}, 'page.stx')
    expect(out).toContain('{{ new Date(stamp).getUTCFullYear() }}')
  })
})
