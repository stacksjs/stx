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
import { afterAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildVirtualTypeScript, lineStarts, positionToOffset } from '../../stx/src/stx-virtual-ts'
import { writeStxDeclarations } from '../src/ts-plugin-declarations'
import init, { declarationEntry, findInstalledStxDeclarations } from '../src/typescript-stx-plugin'

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

function harness(fileName: string, source: string, components = new Map<string, string>(), options: { declarationsDir?: string, plugin?: ReturnType<typeof init>, service?: Record<string, unknown> } = {}): Harness {
  let diagnostics: Partial<ts.Diagnostic>[] = []

  const host = {
    getScriptSnapshot: (name: string) =>
      name === fileName ? tsLib.ScriptSnapshot.fromString(source)
        : components.has(name) ? tsLib.ScriptSnapshot.fromString(components.get(name)!) : undefined,
    getScriptVersion: () => '1',
  } as unknown as ts.LanguageServiceHost

  const languageService = {
    getSemanticDiagnostics: () => diagnostics as ts.Diagnostic[],
    getSyntacticDiagnostics: () => [] as ts.DiagnosticWithLocation[],
    getSuggestionDiagnostics: () => [] as ts.DiagnosticWithLocation[],
    getQuickInfoAtPosition: () => undefined,
    getCompletionsAtPosition: () => undefined,
    ...options.service,
  } as unknown as ts.LanguageService

  const info = {
    languageService,
    languageServiceHost: host,
    project: { projectService: { logger: { info: () => {} } } },
  } as unknown as ts.server.PluginCreateInfo

  const service = (options.plugin ?? init({ typescript: tsLib }, { declarationsDir: options.declarationsDir })).create(info)
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
  test('uses the shared contracts and refreshes when an unsaved child declaration changes', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-editor-contract-'))
    try {
      const child = join(dir, 'components/Counter.stx')
      const source = '<Counter count="bad" />'
      const file = join(dir, 'page.stx')
      const components = new Map([[child, '<script client>const p = defineProps<{ count: number }>()</script>']])
      await Bun.write(child, components.get(child)!)
      const { host } = harness(file, source, components)
      const first = host.getScriptSnapshot!(file)!
      expect(first.getText(0, first.getLength())).toContain('count: number')
      components.set(child, '<script client>const p = defineProps<{ count: string }>()</script>')
      const next = host.getScriptSnapshot!(file)!
      expect(next.getText(0, next.getLength())).toContain('count: string')
      expect(next.getText(0, next.getLength())).not.toContain('count: number')
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
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
    const { service, host, setDiagnostics } = harness('/p.stx', source)
    // The buffer the plugin really serves, which is what tsserver reports on.
    const snapshot = host.getScriptSnapshot!('/p.stx')!
    const text = snapshot.getText(0, snapshot.getLength())

    // Find the synthetic line carrying the expression and report on it.
    setDiagnostics([{
      code: 2304,
      start: text.lastIndexOf('titel'),
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

describe('the runtime declarations (stacksjs/stx#2028)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-plugin-declarations-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  const [stxModule] = writeStxDeclarations(join(dir, 'types')).filter(file => file.endsWith('stx-module.d.ts'))
  const source = '<script client>\nimport { onMount, useServerData } from \'stx\'\nconst n = state(0)\n</script>\n<p>{{ n }}</p>'
  const text = (host: ts.LanguageServiceHost, file: string) => {
    const snapshot = host.getScriptSnapshot!(file)!
    return snapshot.getText(0, snapshot.getLength())
  }

  test('are referenced from line 1, so only a program holding a .stx file loads them', () => {
    const { host } = harness('/app/p.stx', source, undefined, { declarationsDir: join(dir, 'types') })
    expect(text(host, '/app/p.stx').split('\n')[0]).toBe(`/// <reference path="${stxModule}" />`)
  })

  test('replace the `any` runtime globals, which would shadow their types', () => {
    const { host } = harness('/app/p.stx', source, undefined, { declarationsDir: join(dir, 'types') })
    expect(text(host, '/app/p.stx')).not.toContain('declare var state: any')

    // Without them it falls back to `any`, rather than to "Cannot find name".
    const fallback = harness('/app/p.stx', source)
    expect(text(fallback.host, '/app/p.stx')).toContain('declare var state: any')
  })

  test('come from the app\'s own @stacksjs/stx when it ships them', () => {
    const app = join(dir, 'app')
    const installed = join(app, 'node_modules', '@stacksjs', 'stx')
    writeStxDeclarations(installed)
    expect(findInstalledStxDeclarations(join(app, 'resources', 'views'))).toBe(join(installed, 'stx-module.d.ts'))
    expect(findInstalledStxDeclarations('/')).toBeUndefined()

    const { host } = harness(join(app, 'resources', 'p.stx'), source, undefined, { declarationsDir: join(dir, 'types') })
    expect(text(host, join(app, 'resources', 'p.stx')).split('\n')[0]).toBe(`/// <reference path="${join(installed, 'stx-module.d.ts')}" />`)
  })

  test('a name imported into the wrong kind of block is reported at the name', () => {
    const { service } = harness('/app/p.stx', source, undefined, { declarationsDir: join(dir, 'types') })
    const [diagnostic, ...rest] = service.getSemanticDiagnostics('/app/p.stx')
    expect(rest).toEqual([])
    expect(source.slice(diagnostic.start!, diagnostic.start! + diagnostic.length!)).toBe('useServerData')
    expect(diagnostic.source).toBe('stx')
  })

  test('stxTypescriptPlugin.enabled = false silences the file', () => {
    const plugin = init({ typescript: tsLib }, { declarationsDir: join(dir, 'types') })
    const { service, setDiagnostics } = harness('/app/p.stx', source, undefined, { plugin })
    setDiagnostics([{ code: 2322, start: 30, length: 1, messageText: 'nope' }])
    expect(service.getSemanticDiagnostics('/app/p.stx').length).toBeGreaterThan(0)

    plugin.onConfigurationChanged!({ enabled: false })
    expect(service.getSemanticDiagnostics('/app/p.stx')).toEqual([])
    expect(service.getSyntacticDiagnostics('/app/p.stx')).toEqual([])

    plugin.onConfigurationChanged!({ enabled: true })
    expect(service.getSemanticDiagnostics('/app/p.stx').length).toBeGreaterThan(0)
  })
})

describe('features that are not mapped answer nothing for a .stx file', () => {
  // Their answers are offsets and edits in the VIRTUAL buffer, which the
  // client would apply to the real file: a format would rewrite the markup,
  // semantic tokens would colour the wrong characters.
  const edits = [{ span: { start: 0, length: 1 }, newText: 'x' }]
  const service = {
    getFormattingEditsForDocument: () => edits,
    getCodeFixesAtPosition: () => [{ changes: [] }],
    getEncodedSemanticClassifications: () => ({ spans: [0, 1, 2], endOfLineState: 0 }),
    getOutliningSpans: () => [{ textSpan: { start: 0, length: 1 } }],
  }

  test('for .stx, and pass through for everything else', () => {
    const { service: ls } = harness('/p.stx', PAGE, undefined, { service })
    expect(ls.getFormattingEditsForDocument('/p.stx', {} as ts.FormatCodeSettings)).toEqual([])
    expect(ls.getCodeFixesAtPosition('/p.stx', 0, 1, [2322], {}, {})).toEqual([])
    expect(ls.getEncodedSemanticClassifications('/p.stx', { start: 0, length: 1 })).toBeUndefined()
    expect(ls.getOutliningSpans('/p.stx')).toEqual([])
    expect(ls.getFormattingEditsForDocument('/p.ts', {} as ts.FormatCodeSettings)).toBe(edits)
  })
})

describe('completions', () => {
  test('are offered in a script block, at the mapped position, without auto-imports', () => {
    let asked: { position: number, options: ts.GetCompletionsAtPositionOptions | undefined } | undefined
    const service = {
      getCompletionsAtPosition: (_file: string, position: number, options: ts.GetCompletionsAtPositionOptions | undefined) => {
        asked = { position, options }
        return { isGlobalCompletion: false, isMemberCompletion: false, isNewIdentifierLocation: false, entries: [{ name: 'flag', kind: 'const', sortText: '0' }, { name: '__stx_interpolated', kind: 'var', sortText: '0' }] }
      },
    }
    const { service: ls, host } = harness('/p.stx', PAGE, undefined, { service })
    const virtual = host.getScriptSnapshot!('/p.stx')!
    const result = ls.getCompletionsAtPosition('/p.stx', offsetOf(PAGE, 7, 7), { includeCompletionsForModuleExports: true })
    expect(asked!.position).toBe(offsetOf(virtual.getText(0, virtual.getLength()), 7, 7))
    expect(asked!.options?.includeCompletionsForModuleExports).toBe(false)
    expect(result!.entries.map(entry => entry.name)).toEqual(['flag'])
  })

  test('are not offered in the markup, where TypeScript would list every global', () => {
    const { service: ls } = harness('/p.stx', PAGE, undefined, { service: { getCompletionsAtPosition: () => ({ entries: [{ name: 'window' }] }) } })
    expect(ls.getCompletionsAtPosition('/p.stx', offsetOf(PAGE, 5, 3), undefined)).toBeUndefined()
  })
})

describe('definitions', () => {
  test('keep virtual offsets on a script line, which tsserver reads through the buffer', () => {
    // tsserver turns a definition's span into line/column with the language
    // service's own source file, so it must stay a buffer offset; the bound
    // span, converted through the real file, is mapped back.
    let virtualText = ''
    const service = {
      getDefinitionAndBoundSpan: () => ({
        textSpan: { start: offsetOf(virtualText, 7, 7), length: 4 },
        definitions: [
          { fileName: '/p.stx', textSpan: { start: offsetOf(virtualText, 7, 7), length: 4 }, kind: 'const', name: 'flag', containerKind: '', containerName: '' },
          { fileName: '/p.stx', textSpan: { start: virtualText.length - 2, length: 1 }, kind: 'var', name: 'x', containerKind: '', containerName: '' },
          { fileName: '/lib.d.ts', textSpan: { start: 3, length: 1 }, kind: 'var', name: 'y', containerKind: '', containerName: '' },
        ],
      }),
    }
    const { service: ls, host } = harness('/p.stx', PAGE, undefined, { service })
    const snapshot = host.getScriptSnapshot!('/p.stx')!
    virtualText = snapshot.getText(0, snapshot.getLength())

    const result = ls.getDefinitionAndBoundSpan('/p.stx', offsetOf(PAGE, 7, 7))!
    expect(result.textSpan.start).toBe(offsetOf(PAGE, 7, 7))
    expect(result.definitions!.map(d => [d.fileName, d.textSpan.start])).toEqual([
      ['/p.stx', offsetOf(virtualText, 7, 7)],
      ['/lib.d.ts', 3],
    ])
  })
})

describe('the tsconfig libs', () => {
  test('are referenced alongside the runtime declarations, through one generated entry', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-plugin-libs-'))
    let entry = ''
    try {
      const types = join(dir, 'ext-types')
      writeStxDeclarations(types)
      mkdirSync(join(dir, 'app', 'types'), { recursive: true })
      writeFileSync(join(dir, 'app', 'types', 'request.d.ts'), 'declare const requestContext: unknown\n')
      writeFileSync(join(dir, 'app', 'tsconfig.json'), JSON.stringify({ compilerOptions: { plugins: [{ name: '@stacksjs/stx-typescript-plugin', libs: ['./types/request.d.ts'] }] } }))

      const tsWithConfig = { ...tsLib, readConfigFile: (file: string) => ({ config: JSON.parse(readFileSync(file, 'utf8')) }), sys: { fileExists: existsSync, readFile: (file: string) => readFileSync(file, 'utf8') } } as unknown as typeof ts
      const file = join(dir, 'app', 'page.stx')
      const { host } = harness(file, '<script server>\nconst c = requestContext\n</script>', undefined, { plugin: init({ typescript: tsWithConfig }, { declarationsDir: types }) })

      const snapshot = host.getScriptSnapshot!(file)!
      entry = /^\/\/\/ <reference path="(.+)" \/>$/.exec(snapshot.getText(0, snapshot.getLength()).split('\n')[0])![1]
      expect(readFileSync(entry, 'utf8').trim().split('\n')).toEqual([
        `/// <reference path="${join(types, 'stx-module.d.ts')}" />`,
        `/// <reference path="${join(dir, 'app', 'types', 'request.d.ts')}" />`,
      ])
      expect(declarationEntry([join(types, 'stx-module.d.ts'), join(dir, 'app', 'types', 'request.d.ts')])).toBe(entry)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
      // The generated entry lives in the shared temp directory, by design.
      if (entry)
        rmSync(entry, { force: true })
    }
  })
})
