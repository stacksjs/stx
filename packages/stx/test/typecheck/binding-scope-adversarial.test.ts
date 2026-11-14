import { expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectBlockDeclarations, extractScriptBlocks } from '../../src/stx-virtual-ts'
import { clientMethods } from '../../src/component-library'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'
allowForATypeScriptProgram()

test('only module declarations become template/context bindings', () => {
  const code = [
    '// const commentName = 1',
    'const text = "const literalName = 1"',
    'function outer(parameter: string) { const nested = parameter; return nested }',
    '{ const blockName = 1 }',
    'const expression = function privateFunction() {}',
    'const ClassExpression = class PrivateClass {}',
    'const { key: alias, deep: { title: nestedAlias } } = source',
    'const first = 1, second = 2',
    'const template = `${function templateFunction() { return 1 }}`',
    'const before = "a literal"',
    'function afterLiteral() {}',
  ].join('\n')
  expect(collectBlockDeclarations(code)).toEqual(['ClassExpression', 'afterLiteral', 'alias', 'before', 'expression', 'first', 'nestedAlias', 'outer', 'second', 'template', 'text'])
  expect(clientMethods(code).map(method => method.name)).toEqual(['outer', 'afterLiteral'])
  expect(extractScriptBlocks('<script client type="application/javascript" data-note="a > component server src b">const wrong: number = "x"</script>').map(block => block.kind)).toEqual(['client'])
})

test('nested state declarations and broad aliases cannot erase native property/method types', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-native-scope-review-'))
  const header = '<script component type="application/json">{"tag":"scope-check","properties":{"count":{"type":"number"}}}</script>\n'
  const cases = new Map<string, string>([
    ['nested-type', 'function setup() { interface ComponentState { [key: string]: any } }'],
    ['block-type', '{ interface ComponentState { [key: string]: any } }'],
    ['generic-type', 'interface ComponentState<T> { value: T }'],
    ['ambient-function', 'declare function privateFunction(): void'],
    ['any-alias', 'type ComponentState = any'],
    ['scalar-alias', 'type ComponentState = number'],
    ['index-signature', 'interface ComponentState { [key: string]: unknown }'],
    ['any-property', 'interface ComponentState { count: any }'],
    ['method-shadow', 'interface ComponentState { add: (value: any) => any }'],
    ['function-expression', 'const callback = function privateFunction() {};'],
    ['block-function', '{ function privateFunction() {} }'],
    ['template-function', 'const text = `${function privateFunction() { return 1 }}`'],
  ])
  const files: string[] = []
  for (const [name, declaration] of cases) {
    const file = path.join(root, name + '.stx'); files.push(file)
    await Bun.write(file, header + '<script client>\n' + declaration + '\nfunction add(value: number) { this.count += value }\nfunction bad() { this.count = "wrong"; this.add("wrong"); this.privateFunction() }\n</script>')
  }
  const imported = path.join(root, 'imported.stx'); files.push(imported)
  await Bun.write(path.join(root, 'state.ts'), 'export interface PrivateState { _abort?: AbortController }')
  await Bun.write(imported, header + '<script client>\nimport type { PrivateState as ComponentState } from "./state"\nfunction setup() { this._abort = new AbortController(); this._abort.abort() }\nfunction bad() { this.count = "wrong" }\n</script>')
  try {
    const result = await typecheckStxFiles(files)
    expect(result.failure).toBeUndefined()
    for (const [name] of cases) {
      const errors = result.diagnostics.filter(item => item.file === path.join(root, name + '.stx') && item.category === 'error')
      if (name === 'generic-type') { expect(errors.some(item => item.code === 2314 && item.line === 3)).toBe(true); continue }
      expect(errors.some(item => item.code === 2322 && item.line === 5), name).toBe(true)
      expect(errors.some(item => item.code === 2345 && item.line === 5), name).toBe(true)
      expect(errors.some(item => item.code === 2339 && item.line === 5), name).toBe(true)
    }
    expect(result.diagnostics.filter(item => item.file === imported).map(item => [item.line, item.code])).toEqual([[5, 2322]])
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)

test('nested object fields never become inherited names and nested declarations do not supply required caller fields', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-inherited-scope-review-'))
  const partial = path.join(root, 'partials/head.stx'), nested = path.join(root, 'partials/nested.stx')
  await Bun.write(partial, '<script server>\ninterface InheritedContext { pageTitle: string }\nfunction shadow() { const pageTitle = "local" }\nconst heading = pageTitle.toUpperCase()\n</script>')
  await Bun.write(nested, '<script server>\ninterface InheritedContext { account?: {\n  title: string\n} }\nconst titleValue = account?.title\nconst bad = title\n</script>')
  const cases = new Map<string, [string, boolean]>([
    ['nested-function', ['function shadow() { const pageTitle = "local" }', false]],
    ['nested-block', ['{ const pageTitle = "local" }', false]],
    ['literal', ['const text = "const pageTitle = 1"', false]],
    ['expression', ['const callback = function pageTitle() {}', false]],
    ['parameter', ['function shadow(pageTitle: string) { return pageTitle }', false]],
    ['ambient', ['declare const pageTitle: string', false]],
    ['alias', ['const { title: pageTitle } = { title: "valid" }', true]],
    ['nested-alias', ['const { account: { title: pageTitle } } = { account: { title: "valid" } }', true]],
    ['list', ['const other = 1, pageTitle = "valid"', true]],
  ])
  const files = [partial, nested]
  for (const [name, [code]] of cases) { const file = path.join(root, name + '.stx'); files.push(file); await Bun.write(file, '<script server>\n' + code + '\n</script>\n@include("head")') }
  try {
    const result = await typecheckStxFiles(files, { partialsDir: path.dirname(partial), layoutsDir: path.join(root, 'layouts') })
    expect(result.failure).toBeUndefined()
    expect(result.diagnostics.filter(item => item.file === partial)).toEqual([])
    expect(result.diagnostics.filter(item => item.file === nested).map(item => [item.line, item.code])).toEqual([[6, 2304]])
    for (const [name, [, valid]] of cases) {
      const errors = result.diagnostics.filter(item => item.file === path.join(root, name + '.stx') && item.category === 'error')
      expect(errors.length === 0, name).toBe(valid)
      if (!valid) expect(errors.some(item => item.line === 4 && item.message.includes('pageTitle')), name).toBe(true)
    }
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)

test('metadata errors anchor at real blocks and keys beside examples and inner type keys', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-metadata-map-review-'))
  const invalid = path.join(root, 'invalid.stx'), defaults = path.join(root, 'defaults.stx'), attributes = path.join(root, 'attributes.stx')
  await Bun.write(invalid, '<!-- <script component>example</script> -->\n<script component type="application/json">invalid</script>')
  await Bun.write(defaults, '<script component type="application/json">\n{"tag":"mapped-key","properties":{\n"value":{"type":"string"},\n"type":{"type":"number","default":"wrong"}\n}}\n</script>')
  await Bun.write(attributes, '<script client data-note="a component server src b">const count: number = "wrong"</script>')
  try {
    const result = await typecheckStxFiles([invalid, defaults, attributes])
    expect(result.failure).toBeUndefined()
    expect(result.diagnostics.filter(item => item.file === invalid).map(item => [item.line, item.column])).toEqual([[2, 1]])
    expect(result.diagnostics.filter(item => item.file === defaults).map(item => [item.line, item.column, item.code])).toEqual([[4, 1, 2322]])
    expect(result.diagnostics.filter(item => item.file === attributes).map(item => item.code)).toEqual([2322])
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)

test('unsupported inherited aliases cannot manufacture lexical any bindings', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-inherited-alias-review-'))
  const files: string[] = []
  for (const [name, declaration] of [['callable', 'type InheritedContext = () => { pageTitle: string }'], ['generic', 'interface InheritedContext<T> { pageTitle: T }'], ['any', 'type InheritedContext = any']]) {
    const file = path.join(root, name + '.stx'); files.push(file)
    await Bun.write(file, '<script server>\n' + declaration + '\nconst title = pageTitle\n</script>')
  }
  try {
    const result = await typecheckStxFiles(files)
    for (const file of files) {
      expect(result.diagnostics.some(item => item.file === file && item.line === 2 && item.message.includes('non-generic object')), file).toBe(true)
      expect(result.diagnostics.some(item => item.file === file && item.line === 3 && item.code === 2304), file).toBe(true)
    }
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)

test('value import aliases and ordinary parent bindings retain their real inherited types', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-import-shadow-review-'))
  const partial = path.join(root, 'partials/head.stx')
  await Bun.write(path.join(root, 'values.ts'), 'export const title = "Valid"; export default "Default"; export type Heading = string')
  await Bun.write(partial, '<script server>\ninterface InheritedContext { pageTitle: string; parent?: number }\nconst text = pageTitle\n</script>')
  const named = path.join(root, 'named.stx'), defaulted = path.join(root, 'default.stx'), typeOnly = path.join(root, 'type.stx'), shadow = path.join(root, 'shadow.stx')
  await Bun.write(named, '<script server>import { title as pageTitle } from "./values"</script>\n@include("head")')
  await Bun.write(defaulted, '<script server>import pageTitle from "./values"</script>\n@include("head")')
  await Bun.write(typeOnly, '<script server>import type { Heading as pageTitle } from "./values"</script>\n@include("head")')
  await Bun.write(shadow, '<script server>\nconst parent = 42, pageTitle = "Valid"\n</script>\n@include("head")')
  try {
    const result = await typecheckStxFiles([partial, named, defaulted, typeOnly, shadow], { partialsDir: path.dirname(partial), layoutsDir: path.join(root, 'layouts') })
    expect(result.failure).toBeUndefined()
    expect(result.diagnostics.filter(item => item.file !== typeOnly)).toEqual([])
    expect(result.diagnostics.some(item => item.file === typeOnly && item.line === 2 && item.message.includes('pageTitle'))).toBe(true)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)

test('private state never invents initialized callable fields', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-private-optional-review-')), file = path.join(root, 'private.stx')
  await Bun.write(file, '<script component type="application/json">{"tag":"private-proof"}</script>\n<script client>\ninterface ComponentState { _missing: () => void }\nfunction bad() { this._missing() }\n</script>')
  try {
    const result = await typecheckStxFiles([file])
    expect(result.diagnostics.some(item => item.line === 3 && item.message.includes('must be optional'))).toBe(true)
    expect(result.diagnostics.some(item => item.line === 4 && item.code === 2722)).toBe(true)
  }
  finally { await rm(root, { recursive: true, force: true }) }
}, 120_000)
