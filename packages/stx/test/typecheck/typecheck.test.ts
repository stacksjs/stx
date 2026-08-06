/**
 * #1852: nothing type-checked the TypeScript inside a `.stx` file.
 *
 * tsc treats `.stx` as an unknown extension, so `<script server>` and
 * `<script client>` blocks were verified by nothing, and apps split pages by
 * "can tsc see it" rather than by cohesion.
 *
 * The extraction and line-mapping are pure functions and tested directly. The
 * end-to-end check shells out to tsc, so it is kept to one case.
 */
import { describe, expect, it } from 'bun:test'
import {
  buildVirtualSource,
  extractScriptBlocks,
  formatTypecheckDiagnostics,
  sourcePathFor,
  typecheckStxFiles,
  virtualPathFor,
} from '../../src/typecheck'

describe('extractScriptBlocks (#1852)', () => {
  it('distinguishes server, client and plain blocks', () => {
    const src = '<script server>\na\n</script>\n<script client>\nb\n</script>\n<script>\nc\n</script>'
    expect(extractScriptBlocks(src).map(b => b.kind)).toEqual(['server', 'client', 'plain'])
  })

  it('records the line each body starts on', () => {
    const src = [
      '<script server>', // 1
      'const a = 1', //     2
      '</script>', //       3
      '', //                4
      '<div>x</div>', //    5
      '', //                6
      '<script client>', // 7
      'const b = 2', //     8
      '</script>', //       9
    ].join('\n')

    const blocks = extractScriptBlocks(src)
    expect(blocks[0].startLine).toBe(1)
    expect(blocks[1].startLine).toBe(7)
  })

  it('skips src scripts and non-JS script types', () => {
    const src = '<script src="/a.js"></script><script type="application/ld+json">{}</script>'
    expect(extractScriptBlocks(src)).toEqual([])
  })

  it('keeps the body verbatim', () => {
    const blocks = extractScriptBlocks('<script server>\nconst a: number = 1\n</script>')
    expect(blocks[0].code).toContain('const a: number = 1')
  })
})

describe('buildVirtualSource line preservation (#1852)', () => {
  it('pads so the block body lands on its original line', () => {
    // This is what makes a diagnostic's line number directly usable: no offset
    // table, and nothing to get wrong when a file has several blocks.
    const virtual = buildVirtualSource({ kind: 'client', code: 'const a = 1', startLine: 7 })
    const lines = virtual.split('\n')
    expect(lines.length).toBe(7)
    expect(lines[6]).toBe('const a = 1')
  })

  it('does not pad a block that starts on line 1', () => {
    expect(buildVirtualSource({ kind: 'server', code: 'x', startLine: 1 })).toBe('x')
  })
})

describe('virtual path round-trip', () => {
  it('maps back to the originating .stx file', () => {
    const v = virtualPathFor('/app/views/page.stx', 'server', 0)
    expect(v).toBe('/app/views/page.stx.__stx_server0.ts')
    expect(sourcePathFor(v)).toBe('/app/views/page.stx')
  })
})

describe('formatTypecheckDiagnostics', () => {
  it('renders file:line:col with the block it came from', () => {
    const out = formatTypecheckDiagnostics([{
      file: 'a.stx',
      line: 12,
      column: 5,
      code: 2322,
      message: 'Type mismatch',
      category: 'error',
      blockKind: 'server',
    }])
    expect(out).toBe('a.stx:12:5  error TS2322  Type mismatch  [<script server>]')
  })
})

describe('typecheckStxFiles end to end (#1852)', () => {
  it('reports errors in both block kinds at their real .stx line numbers', async () => {
    const dir = `${import.meta.dir}/__fixture-${Date.now()}`
    const file = `${dir}/page.stx`
    await Bun.write(file, [
      '<script server>', //             1
      'const count: number = \'nope\'', // 2 — error
      '</script>', //                   3
      '', //                            4
      '<div>x</div>', //                5
      '', //                            6
      '<script client>', //             7
      'const n: number = 42', //        8
      'const bad: string = n', //       9 — error
      '</script>', //                  10
    ].join('\n'))

    try {
      const result = await typecheckStxFiles([file])
      expect(result.blockCount).toBe(2)

      const errors = result.diagnostics.filter(d => d.category === 'error')
      expect(errors.length).toBe(2)

      const server = errors.find(d => d.blockKind === 'server')
      const client = errors.find(d => d.blockKind === 'client')
      expect(server?.line).toBe(2)
      expect(client?.line).toBe(9)
      // Reported against the .stx file, not the virtual one.
      expect(server?.file).toBe(file)
    }
    finally {
      await Bun.$`rm -rf ${dir}`.quiet().nothrow()
    }
  }, 120_000)

  it('is clean on a file with no type errors', async () => {
    const dir = `${import.meta.dir}/__fixture-ok-${Date.now()}`
    const file = `${dir}/ok.stx`
    await Bun.write(file, '<script server>\nconst title: string = \'ok\'\n</script>\n<div>x</div>')

    try {
      const result = await typecheckStxFiles([file])
      expect(result.blockCount).toBe(1)
      expect(result.diagnostics.filter(d => d.category === 'error')).toEqual([])
    }
    finally {
      await Bun.$`rm -rf ${dir}`.quiet().nothrow()
    }
  }, 120_000)
})
