/**
 * The editor plugin reports diagnostics where the author actually wrote them
 * (stacksjs/stx#1852 ask 5).
 *
 * These tests drive `init()` with a stub language service, because the previous
 * suite asserted on the plugin's SOURCE TEXT — `expect(content).toContain(
 * "!expr.includes('|')")` and friends. That passes for any implementation that
 * happens to contain the string, so it kept passing while the plugin shifted
 * every diagnostic onto the wrong line, collided script blocks, and dropped
 * genuine typos. A test that cannot fail when the behaviour breaks is not a
 * test.
 *
 * The three behaviours pinned here are exactly the three that were broken:
 * positions, block isolation, and suppression.
 */
import type * as ts from 'typescript/lib/tsserverlibrary'
import { describe, expect, test } from 'bun:test'
import { buildVirtualTypeScript, lineStarts, positionToOffset } from '../../stx/src/stx-virtual-ts'
import init from '../src/typescript-stx-plugin'

/** Everything the plugin uses from the `typescript` module. */
const tsLib = {
  ScriptSnapshot: {
    fromString: (text: string) => ({
      getText: (start: number, end: number) => text.slice(start, end),
      getLength: () => text.length,
      getChangeRange: () => undefined,
    }),
  },
} as unknown as typeof ts

interface Harness {
  service: ts.LanguageService
  host: ts.LanguageServiceHost
  /** Diagnostics the stub returns, in VIRTUAL-file coordinates. */
  setDiagnostics: (diagnostics: Partial<ts.Diagnostic>[]) => void
}

function harness(fileName: string, source: string): Harness {
  let diagnostics: Partial<ts.Diagnostic>[] = []

  const host = {
    getScriptSnapshot: (name: string) =>
      name === fileName ? tsLib.ScriptSnapshot.fromString(source) : undefined,
    getScriptVersion: () => '1',
  } as unknown as ts.LanguageServiceHost

  const languageService = {
    getSemanticDiagnostics: () => diagnostics as ts.Diagnostic[],
    getSyntacticDiagnostics: () => [] as ts.DiagnosticWithLocation[],
    getSuggestionDiagnostics: () => [] as ts.DiagnosticWithLocation[],
    getQuickInfoAtPosition: () => undefined,
    getCompletionsAtPosition: () => undefined,
  } as unknown as ts.LanguageService

  const info = {
    languageService,
    languageServiceHost: host,
    project: { projectService: { logger: { info: () => {} } } },
  } as unknown as ts.server.PluginCreateInfo

  const service = init({ typescript: tsLib }).create(info)
  return { service, host, setDiagnostics: (d) => { diagnostics = d } }
}

/** Offset of a 1-based line/column pair in a piece of text. */
function offsetOf(text: string, line: number, column: number): number {
  return positionToOffset(lineStarts(text), line, column)
}

const PAGE = [
  '<script server>', //          1
  'const title = 1', //          2
  '</script>', //                3
  '', //                         4
  '<h1>x</h1>', //               5
  '<script client>', //          6
  'const flag = state(0)', //    7
  '</script>', //                8
].join('\n')

describe('the virtual buffer', () => {
  test('keeps every script line at the line it already occupies', () => {
    const { host } = harness('/p.stx', PAGE)

    const virtual = host.getScriptSnapshot!('/p.stx')!
    const lines = virtual.getText(0, virtual.getLength()).split('\n')

    // The old implementation concatenated the bodies and dropped the markup, so
    // `const flag` moved from line 7 to line 2.
    expect(lines[1]).toBe('const title = 1')
    expect(lines[6]).toBe('const flag = state(0)')
    expect(lines[4]).toBe('') // the <h1> is blanked, not removed
  })

  test('leaves non-stx files alone', () => {
    const { host } = harness('/p.ts', 'const a = 1')

    const snapshot = host.getScriptSnapshot!('/p.ts')!
    expect(snapshot.getText(0, snapshot.getLength())).toBe('const a = 1')
  })
})

describe('diagnostic positions', () => {
  test('a script-block error keeps its own line', () => {
    const { service, setDiagnostics } = harness('/p.stx', PAGE)
    const virtual = buildVirtualTypeScript(PAGE).text

    // Reported against `flag` on line 7 of the virtual buffer.
    setDiagnostics([{ code: 2322, start: offsetOf(virtual, 7, 7), length: 4, messageText: 'nope' }])

    const [diagnostic] = service.getSemanticDiagnostics('/p.stx')
    expect(diagnostic.start).toBe(offsetOf(PAGE, 7, 7))
  })

  test('an error on an appended ambient declaration is dropped', () => {
    // Those lines correspond to nothing the author wrote, so reporting them
    // would put a squiggle at an arbitrary place in the file.
    const { service, setDiagnostics } = harness('/p.stx', PAGE)
    const virtual = buildVirtualTypeScript(PAGE).text

    setDiagnostics([{ code: 2451, start: virtual.length - 2, length: 1, messageText: 'nope' }])

    expect(service.getSemanticDiagnostics('/p.stx')).toHaveLength(0)
  })

  test('a template expression error maps back into the markup', () => {
    const source = [
      '<script server>', //   1
      'const title = 1', //   2
      '</script>', //         3
      '<p>{{ titel }}</p>', //4
    ].join('\n')
    const { service, setDiagnostics } = harness('/p.stx', source)
    const built = buildVirtualTypeScript(source)

    // Find the synthetic line carrying the expression and report on it.
    const [line, mapped] = [...built.lineMap.entries()].find(([, m]) => m.expression)!
    setDiagnostics([{
      code: 2304,
      start: offsetOf(built.text, line, (mapped.prefixLength ?? 0) + 1),
      length: 5,
      messageText: `Cannot find name 'titel'.`,
    }])

    const [diagnostic] = service.getSemanticDiagnostics('/p.stx')
    // `<p>{{ titel }}` — `<p>` is 3 columns, `{{` two more, then a space, so
    // `titel` starts at column 7 on line 4.
    expect(diagnostic.start).toBe(offsetOf(source, 4, 7))
  })
})

describe('suppression', () => {
  test('a genuine typo in a runtime-global name is reported', () => {
    // The old plugin dropped every TS2304 whose message mentioned one of a
    // hardcoded list, so `stcate` was silently swallowed along with `state`.
    const { service, setDiagnostics } = harness('/p.stx', PAGE)
    const virtual = buildVirtualTypeScript(PAGE).text

    setDiagnostics([{
      code: 2304,
      start: offsetOf(virtual, 7, 14),
      length: 6,
      messageText: `Cannot find name 'stcate'.`,
    }])

    expect(service.getSemanticDiagnostics('/p.stx')).toHaveLength(1)
  })

  test('a name declared in both a server and a client block is not a redeclaration', () => {
    // Separate scopes at runtime; they only share one here because tsserver
    // gives a file a single buffer.
    const source = [
      '<script server>',
      'const items = []',
      '</script>',
      '<script client>',
      'const items = state([])',
      '</script>',
    ].join('\n')
    const { service, setDiagnostics } = harness('/p.stx', source)
    const virtual = buildVirtualTypeScript(source).text

    setDiagnostics([{
      code: 2451,
      start: offsetOf(virtual, 5, 7),
      length: 5,
      messageText: `Cannot redeclare block-scoped variable 'items'.`,
    }])

    expect(service.getSemanticDiagnostics('/p.stx')).toHaveLength(0)
  })

  test('a redeclaration inside one scope is still reported', () => {
    // Only the cross-scope case is an artefact. This one is the author's bug.
    const source = [
      '<script server>',
      'const dup = 1',
      'const dup = 2',
      '</script>',
    ].join('\n')
    const { service, setDiagnostics } = harness('/p.stx', source)
    const virtual = buildVirtualTypeScript(source).text

    setDiagnostics([{
      code: 2451,
      start: offsetOf(virtual, 3, 7),
      length: 3,
      messageText: `Cannot redeclare block-scoped variable 'dup'.`,
    }])

    expect(service.getSemanticDiagnostics('/p.stx')).toHaveLength(1)
  })
})

describe('plugin shape', () => {
  test('exposes create and getExternalFiles', () => {
    const plugin = init({ typescript: tsLib })

    expect(typeof plugin.create).toBe('function')
    expect(typeof plugin.getExternalFiles).toBe('function')
  })

  test('claims .stx and .md files', () => {
    const plugin = init({ typescript: tsLib })
    const project = { getFileNames: () => ['/a.stx', '/b.md', '/c.ts'] } as unknown as ts.server.Project

    expect(plugin.getExternalFiles!(project, 0)).toEqual(['/a.stx', '/b.md'])
  })
})
