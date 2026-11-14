import { describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

describe('native component author program', () => {
  test('types metadata, methods and lexical template this at authored positions', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-check-'))
    const file = path.join(directory, 'counter.stx')
    const lines = [
      '<script component type="application/json">',
      '{"tag":"typed-counter","properties":{"count":{"type":"number"},"label":{"type":"string"},"enabled":{"type":"boolean"}}}',
      '</script>',
      '<script client>',
      'function increment(step: number): number { this.count += step; this.emit("change", this.count); return this.count }',
      'function wrong(): void { this.count = "bad"; this.increment("bad"); this.missing() }',
      '</script>',
      '<template>',
      '<span>{{ this.label.toUpperCase() }}</span>',
      '<span>{{ this.count.toUpperCase() }}</span>',
      '<button @click="this.increment(1)">{{ this.missing }}</button>',
      '</template>',
    ]
    await Bun.write(file, lines.join('\n'))
    try {
      const result = await typecheckStxFiles([file])
      expect(result.failure).toBeUndefined()
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(errors.map(item => [item.line, item.code])).toEqual([[6, 2322], [6, 2345], [6, 2339], [10, 2339], [11, 2339]])
      expect(errors[0].column).toBe(lines[5]!.indexOf('this.count') + 1)
      expect(errors[1].column).toBe(lines[5]!.indexOf('"bad"', lines[5]!.indexOf('increment')) + 1)
      expect(errors.every(item => item.file === file)).toBe(true)
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)
  test('refines private state without weakening metadata and checks lexical loop shapes', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-state-'))
    const file = path.join(directory, 'rows.stx')
    const lines = [
      '<script component type="application/json">',
      '{"tag":"typed-rows","properties":{"rows":{"type":"array"},"count":{"type":"number"}}}',
      '</script>',
      '<script client>',
      'interface ComponentState { rows: { title: string, children: { total: number }[] }[], _abort?: AbortController, count: string }',
      'function setup() { this._abort = new AbortController(); this.rows = [] }',
      'function identity<T>(value: T): T { return value }',
      'function sample(): number { return this.identity(2) }',
      '</script>',
      '<template>',
      '@foreach(this.rows as row)',
      '<p>{{ row.title.toUpperCase() }}</p>',
      '@foreach(row.children as row)',
      '<p>{{ row.total.toFixed(2) }} {{ row.missing }}</p>',
      '@endforeach',
      '<p>{{ row.title }} {{ row.total }}</p>',
      '@endforeach',
      '<p>{{ row }}</p>',
      '</template>',
    ]
    await Bun.write(file, lines.join('\n'))
    try {
      const result = await typecheckStxFiles([file])
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(result.failure).toBeUndefined()
      expect(errors.some(item => item.line === 5 && item.message.includes('count'))).toBe(true)
      expect(errors.some(item => item.line === 14 && item.message.includes('missing'))).toBe(true)
      expect(errors.some(item => item.line === 16 && item.message.includes('total'))).toBe(true)
      expect(errors.some(item => item.line === 18 && item.code === 2304)).toBe(true)
      expect(errors.some(item => [6, 7, 8, 12].includes(item.line))).toBe(false)
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

  test('keeps component instance context out of server and ordinary page functions', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-isolation-'))
    const component = path.join(directory, 'component.stx'), page = path.join(directory, 'page.stx')
    await Bun.write(component, `<script component type="application/json">{"tag":"typed-isolated","properties":{"count":{"type":"number"}}}</script>
<script server>
function read() { return this.count }
</script>
<script client>
function read() { return this.count }
</script>
<template>{{ this.count }}</template>`)
    await Bun.write(page, '<script client>function read() { return this.count }</script>')
    try {
      const result = await typecheckStxFiles([component, page])
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(errors.filter(item => item.file === component).map(item => [item.line, item.code])).toEqual([[3, 2683]])
      expect(errors.filter(item => item.file === page).map(item => item.code)).toEqual([2683])
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

  test('checks JSON metadata defaults and invalid JSON without treating metadata as executable code', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-metadata-'))
    const file = path.join(directory, 'metadata.stx'), invalid = path.join(directory, 'invalid.stx')
    await Bun.write(file, '<script component>\n{"tag":"typed-default","properties":{"count":{"type":"number","default":"bad"}}}\n</script>')
    await Bun.write(invalid, '<script component type="application/json">not JSON</script>')
    try {
      const result = await typecheckStxFiles([file, invalid])
      expect(result.failure).toBeUndefined()
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(errors.some(item => item.file === file && item.line === 2 && item.code === 2322 && item.blockKind === 'component')).toBe(true)
      expect(errors.some(item => item.file === invalid && item.line === 1 && item.message.includes('JSON metadata'))).toBe(true)
      expect(result.blockCount).toBe(0)
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

  test('types object key/value loops with the emitted renderer syntax', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-object-'))
    const file = path.join(directory, 'object.stx')
    await Bun.write(file, `<script component type="application/json">{"tag":"typed-object","properties":{"rows":{"type":"object"}}}</script>
<script client>
interface ComponentState { rows: { first: { label: string } } }
function setup() { this.rows = { first: { label: ')' } } }
</script>
<template>
@foreach(this.rows as key => row)
<p>{{ key.toUpperCase() }} {{ row.label }} {{ row.missing }}</p>
@endforeach
</template>`)
    try {
      const result = await typecheckStxFiles([file])
      expect(result.failure).toBeUndefined()
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(errors.map(item => [item.line, item.code])).toEqual([[8, 2339]])
      expect(errors[0]!.message).toContain('missing')
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

  test('checks methods installed from multiple client blocks as one native class', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-method-scope-'))
    const file = path.join(directory, 'methods.stx')
    await Bun.write(file, `<script component type="application/json">{"tag":"typed-methods","properties":{"count":{"type":"number"}}}</script>
<script client>
function identity<T>(value: T): T { return value }
</script>
<script client>
function sample(): number { return this.identity(2) }
function bad(): void { this.identity<number>('wrong') }
</script>`)
    try {
      const result = await typecheckStxFiles([file])
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(result.failure).toBeUndefined()
      expect(errors.map(item => [item.line, item.code])).toEqual([[7, 2345]])
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

  test('does not grant a page an element context from a metadata example in a comment', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-comment-'))
    const file = path.join(directory, 'page.stx')
    await Bun.write(file, `<!-- <script component type="application/json">{"properties":{"count":{"type":"number"}}}</script> -->
<script client>function read() { return this.count }</script>`)
    try {
      const result = await typecheckStxFiles([file])
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(errors.map(item => [item.line, item.code])).toEqual([[2, 2683]])
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

  test('preserves the real native DOM property API beside attribute metadata', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'stx-native-dom-'))
    const file = path.join(directory, 'style.stx')
    await Bun.write(file, `<script component type="application/json">{"tag":"typed-native-dom","properties":{"style":{"type":"string"},"onclick":{"type":"string"}}}</script>
<script client>
function ready() { this.style.setProperty('--color', 'red'); this.onclick = event => event.preventDefault() }
function bad() { this.style.toUpperCase() }
</script>`)
    try {
      const result = await typecheckStxFiles([file])
      const errors = result.diagnostics.filter(item => item.category === 'error')
      expect(errors.map(item => [item.line, item.code])).toEqual([[4, 2339]])
      expect(errors[0]!.message).toContain('toUpperCase')
    }
    finally { await rm(directory, { recursive: true, force: true }) }
  }, 120_000)

})
