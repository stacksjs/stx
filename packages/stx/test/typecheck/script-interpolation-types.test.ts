/** Server interpolation is typed in its own scope; edits map back to authored positions (#2150). */
import { afterAll, expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import init from '../../../vscode/src/typescript-stx-plugin'
import { dirname } from 'node:path'
import { buildVirtualTypeScript, lineStarts, offsetToPosition, resolvePosition } from '../../src/stx-virtual-ts'
import { typecheckStxFiles } from '../../src/typecheck'
import { createTempDir } from '../../src/temp-dir'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()
const root = createTempDir('stx-interpolation-types-')
afterAll(() => rmSync(root, { recursive: true, force: true }))
const source = `<script server>
import { palette, make } from './values'
const a = ['red', 'blue']
const config = { count: 2, title: 'Chart' }
const hidden = 'server only'
function read() { return config }
defineClientPayload({ config })
</script>
<script client>
const a = 42
const read = () => false
const palette = 'client'
const colors = {{a}}; const raw = {!!a!!}; const object = {{ read() }}
const imported = {{ make(palette) }}
const clientPalette: string = palette
const clientRead: boolean = read()
const item: string = colors[0]
const length: number = raw.length
const title: string = object.title
const importedTitle: string = imported.title
const text: string = {{ config.title }}
const count: number = {{ config.count }}
const wrongArray: number = colors
const wrongObject: string = object.count
const privateName = hidden
const payloadWrong: number = config.title
const multi = {{
  config
}}; const closingWrong: string = 9
const sameLine = {{a}}; const next = {!!a!!}; const tailWrong: string = 3
const short = {{a}}; const rawShort = {!!a!!}; const finalWrong: number = 'bad'
</script>`
const faults = ['wrongArray', 'wrongObject', 'hidden\n', 'payloadWrong', 'closingWrong', 'tailWrong', 'finalWrong']
function at(text: string, token: string) {
  const offset = text.lastIndexOf(token)
  expect(offset).toBeGreaterThanOrEqual(0)
  return offsetToPosition(lineStarts(text), offset)
}
async function fixture(name: string, content = source) {
  await Bun.write(join(root, 'values.ts'), "export const palette = ['red']; export function make(colors: string[]) { return { title: colors[0] } }")
  const file = join(root, name)
  await Bun.write(file, content)
  return file
}

it('infers server arrays, objects, calls and imports without weakening client errors or leaking private values', async () => {
  const file = await fixture('types.stx')
  const result = await typecheckStxFiles([file], { templates: false })
  expect(result.failure).toBeUndefined()
  const errors = result.diagnostics.filter(d => d.category === 'error')
  expect(errors.map(d => ({ code: d.code, line: d.line, column: d.column }))).toEqual(faults.map(token => ({ code: token === 'hidden\n' ? 2304 : 2322, ...at(source, token) })))
})

it('the shared editor buffer infers the same interpolation types and maps expanded and multiline edits', async () => {
  // The editor already documents a separate bare server-name visibility gap.
  // Interpolation must nevertheless evaluate in SERVER scope, not the client's shadows.
  const editorSource = source.replace('const privateName = hidden\n', '').replace('const payloadWrong: number = config.title\n', '').replace('const a = 42\nconst read = () => false\nconst palette = \'client\'\n', '').replace('const clientPalette: string = palette\nconst clientRead: boolean = read()\n', '').replace(/<\/script>$/, `function clientShadow() {
  const read = () => false
  const a = 42
  const object = {{ read() }}
  const array = {{a}}
  const title: string = object.title
  const first: string = array[0]
}
</script>`)
  const file = await fixture('editor.stx', editorSource)
  const virtual = buildVirtualTypeScript(editorSource, { originDir: root })
  const virtualFile = `${file}.ts`
  await Bun.write(virtualFile, virtual.text)
  const compiler = join(dirname(require.resolve('typescript/package.json')), 'lib/tsc.js')
  const proc = Bun.spawn([process.execPath, compiler, virtualFile, '--noEmit', '--strict', '--skipLibCheck', '--target', 'esnext', '--module', 'esnext', '--moduleResolution', 'bundler', '--pretty', 'false', '--ignoreConfig'], { stdout: 'pipe', stderr: 'pipe' })
  const [output, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  await proc.exited
  expect(stderr).toBe('')
  const diagnostics = [...output.matchAll(/\((\d+),(\d+)\): error TS(\d+): ([^\n]*)/g)].map(match => ({ line: Number(match[1]), column: Number(match[2]), code: Number(match[3]), message: match[4] }))
  const mapped = diagnostics.map(d => ({ ...d, position: resolvePosition(virtual, d.line, d.column) })).filter(d => d.position)
  const expected = faults.filter(token => !['hidden\n', 'payloadWrong'].includes(token)).map(token => ({ code: 2322, ...at(editorSource, token) }))
  expect(mapped.map(d => ({ code: d.code, line: d.position!.line, column: d.position!.column }))).toEqual(expected)

  // Pass actual compiler diagnostics through the editor plugin's remapping boundary.
  const snapshots = { fromString: (text: string) => ({ getText: (start: number, end: number) => text.slice(start, end), getLength: () => text.length, getChangeRange: () => undefined }) }
  const host = { getScriptSnapshot: (name: string) => name === file ? snapshots.fromString(editorSource) : undefined, getScriptVersion: () => '1' }
  let emitted: any[] = []
  let queried: number | undefined
  const service = init({ typescript: { ScriptSnapshot: snapshots } } as any).create({ languageServiceHost: host, languageService: { getSemanticDiagnostics: () => emitted, getQuickInfoAtPosition: (_file: string, position: number) => { queried = position; return undefined } }, project: { projectService: { logger: { info() {} } } } } as any)
  const snapshot = host.getScriptSnapshot(file)!
  const editorText = snapshot.getText(0, snapshot.getLength())
  // The plugin uses contextScope=global; the authored script edits are identical.
  emitted = diagnostics.filter(d => d.line <= virtual.sourceLineCount).map(d => ({ code: d.code, category: 1, messageText: d.message, start: lineStarts(editorText)[d.line - 1] + d.column - 1, length: 1 }))
  expect(service.getSemanticDiagnostics(file).map(d => ({ code: d.code, ...offsetToPosition(lineStarts(editorSource), d.start!) }))).toEqual(expected)
  service.getQuickInfoAtPosition(file, editorSource.lastIndexOf('finalWrong'))
  expect(queried).toBe(editorText.lastIndexOf('finalWrong'))
})

it('the public CLI preserves inferred types and exact diagnostic columns', async () => {
  const file = await fixture('cli.stx', source.replace('const privateName = hidden\n', ''))
  const proc = Bun.spawn([process.execPath, join(import.meta.dir, '../../bin/cli.ts'), 'typecheck', file, '--no-templates'], { stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
  const output = `${stdout}\n${stderr}`.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
  expect(exitCode).toBe(1)
  for (const token of faults.filter(token => token !== 'hidden\n')) {
    const position = at(source.replace('const privateName = hidden\n', ''), token)
    expect(output).toContain(`${file}:${position.line}:${position.column}  error TS2322`)
  }
  expect(output).not.toContain('TS7053')
  expect(output).not.toContain('TS2339')
})

it('keeps server expression errors, inline columns, literal text and narrowly opaque props', async () => {
  const content = `<script server>const a = { title: 'x' }</script>
<script client>const text = '{{ a.title }}'; const value = {{a}}; const bad: number = value.title;
const missing = {{ a.missing }}
const opaque = {{ $props.value }}
const quoted = {{ 'text' }}
const wrong: number = quoted
</script>`
  const file = await fixture('inline.stx', content)
  const result = await typecheckStxFiles([file], { templates: false })
  expect(result.failure).toBeUndefined()
  expect(result.diagnostics.filter(d => d.category === 'error').map(d => ({ code: d.code, line: d.line, column: d.column }))).toEqual([
    { code: 2322, ...at(content, 'bad:') },
    { code: 2339, ...at(content, 'missing }}') },
    { code: 2322, ...at(content, 'wrong:') },
  ])
})

it('infers default, namespace and type-only imports in server scope without executing the server', async () => {
  await Bun.write(join(root, 'model.ts'), `export interface Item { title: string }
export default function make(items: Item[]) { return items[0] }
export const rows: Item[] = [{ title: 'server' }]`)
  const content = `<script server>
import make, { type Item } from './model'
import * as model from './model'
const rows: Item[] = model.rows
throw new Error('the checker must not execute server code')
</script>
<script client>
const make = () => false
const model = 42
const rows = 'client'
const object = {{ make(rows) }}
const importedRows = {!! model.rows !!}
const title: string = object.title
const other: string = importedRows[0].title
const wrong: number = object.title
</script>`
  const file = await fixture('import-kinds.stx', content)
  const result = await typecheckStxFiles([file], { templates: false })
  expect(result.failure).toBeUndefined()
  expect(result.diagnostics.filter(d => d.category === 'error').map(d => ({ code: d.code, line: d.line, column: d.column }))).toEqual([{ code: 2322, ...at(content, 'wrong:') }])
})

it('does not mistake braces in comments or strings for interpolation boundaries', async () => {
  const content = `<script server>const a = ['red']</script>
<script client>
const text = '{{'
// {{ neverDeclared }}
const values = {{a}}
const quoted = {{ '}}' }}
const raw = {!! '!!}' !!}
const item: string = values[0]
const closing: string = quoted
const rawClosing: string = raw
const wrong: number = quoted
</script>`
  const file = await fixture('quoted-braces.stx', content)
  const result = await typecheckStxFiles([file], { templates: false })
  expect(result.failure).toBeUndefined()
  expect(result.diagnostics.filter(d => d.category === 'error').map(d => ({ code: d.code, line: d.line, column: d.column }))).toEqual([{ code: 2322, ...at(content, 'wrong:') }])
})
