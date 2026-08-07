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
    const virtual = buildVirtualSource({ kind: 'client', code: 'const a = 1', startLine: 7, attrs: 'client' })
    const lines = virtual.split('\n')
    expect(lines[6]).toBe('const a = 1')
  })

  it('does not pad a block that starts on line 1', () => {
    expect(buildVirtualSource({ kind: 'server', code: 'x', startLine: 1, attrs: 'server' }).split('\n')[0]).toBe('x')
  })

  it('closes with export {} so the buffer is a module', () => {
    // Not cosmetic. A block with no imports is otherwise a global script, and
    // every top-level declaration collides with lib.dom — `const name` and
    // `const status` in a <script server> block both reported "Cannot redeclare
    // block-scoped variable". Appended, so the lines above keep their numbers.
    const virtual = buildVirtualSource({ kind: 'server', code: 'const name = 1', startLine: 2, attrs: 'server' })

    expect(virtual.split('\n')[1]).toBe('const name = 1')
    expect(virtual).toContain('export {}')
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

/**
 * Ask 4: the markup is checked too.
 *
 * The issue's reported cost is an app whose dashboard carries ~500 lines of
 * query and shaping code with no coverage, where "a renamed column or a changed
 * row shape" is caught by nothing. That is this: the loop variable is typed from
 * the iterable it was drawn from, so the template fails to compile.
 */
describe('template expressions (#1852 ask 4)', () => {
  async function check(body: string, options?: Parameters<typeof typecheckStxFiles>[1]) {
    const dir = `${import.meta.dir}/__fixture-tpl-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const file = `${dir}/page.stx`
    await Bun.write(file, body)
    try {
      const result = await typecheckStxFiles([file], options)
      return { result, file }
    }
    finally {
      await Bun.$`rm -rf ${dir}`.quiet().nothrow()
    }
  }

  it('catches a renamed field on a row inside @foreach', async () => {
    const { result } = await check([
      '<script server>', //                         1
      'interface Row { total_visits: number }', //   2
      'const rows: Row[] = []', //                   3
      '</script>', //                                4
      '@foreach(rows as row)', //                    5
      '  <td>{{ row.total_vists }}</td>', //         6 — error
      '@endforeach', //                              7
    ].join('\n'))

    const errors = result.diagnostics.filter(d => d.category === 'error')
    expect(errors).toHaveLength(1)
    expect(errors[0].blockKind).toBe('template')
    expect(errors[0].line).toBe(6)
    // Points at `total_vists`, not at the start of the interpolation:
    // two spaces, `<td>`, `{{`, a space, then `row.` — column 14.
    expect(errors[0].column).toBe(14)
    expect(errors[0].message).toContain('total_visits')
  }, 120_000)

  it('catches a typo in an interpolation', async () => {
    const { result } = await check([
      '<script server>',
      'const title = \'x\'',
      '</script>',
      '<h1>{{ titel }}</h1>',
    ].join('\n'))

    const errors = result.diagnostics.filter(d => d.category === 'error')
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(4)
    expect(errors[0].expression).toBe('titel')
  }, 120_000)

  it('accepts the shapes real templates use', async () => {
    // Measured against the repo's own corpus: 2072 expressions produced one
    // diagnostic, and that one was a genuine bug. These are the forms that had
    // to stop being reported to get there.
    const { result } = await check([
      '<script client>',
      'const open = state(false)',
      'const rows = state([])',
      'function go() {}',
      '</script>',
      '{{-- a template comment --}}',
      '@{{ escaped }}',
      '<div :if="open" :show="!open" @click="go()">{{ $env.MODE }}</div>',
      '<button @click="open = !open">toggle</button>',
      '<li :for="(row, i) in rows" :key="row.id">{{ row.name | upper }}</li>',
      '<img :show="rows()[{{ i }}]">',
    ].join('\n'))

    expect(result.diagnostics.filter(d => d.category === 'error')).toEqual([])
    expect(result.expressionCount).toBeGreaterThan(0)
  }, 120_000)

  it('can be turned off', async () => {
    const { result } = await check(
      '<script server>\nconst title = 1\n</script>\n<h1>{{ titel }}</h1>',
      { templates: false },
    )

    expect(result.expressionCount).toBe(0)
    expect(result.diagnostics.filter(d => d.category === 'error')).toEqual([])
  }, 120_000)

  it('does not collide with a DOM global', async () => {
    // `name`, `status`, `open`, `length`, `close` are all declared by lib.dom.
    // A buffer that is not a module puts a block's declarations in the global
    // scope, so ordinary names for page data reported "Cannot redeclare
    // block-scoped variable" — a false positive in the CI gate itself.
    const { result } = await check([
      '<script server>',
      'const name = \'a\'',
      'const status = 1',
      'const length = 2',
      '</script>',
      '<p>{{ name }}</p>',
    ].join('\n'))

    expect(result.diagnostics.filter(d => d.category === 'error')).toEqual([])
  }, 120_000)

  it('does not report a block error twice', async () => {
    // The template buffer inlines the script bodies, so it sees the block's
    // errors as well — those belong to the per-block file, not to this one.
    const { result } = await check([
      '<script server>',
      'const bad: number = \'nope\'',
      '</script>',
      '<h1>{{ bad }}</h1>',
    ].join('\n'))

    const errors = result.diagnostics.filter(d => d.category === 'error')
    expect(errors).toHaveLength(1)
    expect(errors[0].blockKind).toBe('server')
  }, 120_000)
})
