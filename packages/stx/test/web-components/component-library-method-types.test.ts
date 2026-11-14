import { afterEach, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

test('emitted custom elements preserve authored method contracts for a standalone TypeScript consumer', async () => {
  const root = createTempDir('stx-element-method-types-')
  roots.push(root)
  const inputDir = path.join(root, 'components'), outputDir = path.join(root, 'dist')
  await Bun.write(path.join(inputDir, 'Messenger.stx'), `
<script component type="application/json">{"shadowDOM":"open"}</script>
<script client>
interface SessionOptions {
  url: string
  token?: string
}
type Delivery = { accepted: boolean }
async function boot(options: SessionOptions, attempts = 1): Promise<Delivery> {
  return { accepted: options.url.length > 0 && attempts > 0 }
}
function update<T extends { token?: string }>(options: T): T {
  return options
}
function observe(callback: (entry: { id: string }) => void, options: { enabled?: boolean } = {}): void {
  if (options.enabled) callback({ id: 'message' })
}
function close(): void {}
</script>
<template><p>Support</p></template>
`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'typed', bundle: false })
  const declarations = await Bun.file(path.join(outputDir, 'typed-messenger.d.ts')).text()
  expect(declarations).toContain('boot(options: SessionOptions, attempts?: number): Promise<Delivery>')
  expect(declarations).toContain('update<T extends { token?: string }>(options: T): T')
  expect(declarations).toContain('observe(callback: (entry: { id: string }) => void, options?: { enabled?: boolean }): void')
  const runtime = await Bun.file(path.join(outputDir, 'typed-messenger.js')).text()
  expect(runtime).not.toContain('interface SessionOptions')
  expect(runtime).not.toContain('Promise<Delivery>')
  await Bun.write(path.join(root, 'consumer.ts'), `
import { Messenger } from './dist/typed-messenger.js'
const messenger = new Messenger()
const delivered: Promise<{ accepted: boolean }> = messenger.boot({ url: 'https://support.example' })
const identity = messenger.update({ token: 'session', extra: true as const })
const precise: true = identity.extra
messenger.observe(entry => { const id: string = entry.id; void id }, { enabled: true })
const nothing: void = messenger.close()
// @ts-expect-error URL is a string, not an Event or number.
messenger.boot({ url: 123 })
// @ts-expect-error The token contract is preserved.
messenger.update({ token: 123 })
void [delivered, precise, nothing]
`)
  await Bun.write(path.join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: false, target: 'esnext', lib: ['esnext', 'dom'], module: 'esnext', moduleResolution: 'bundler', types: [] }, files: ['consumer.ts'] }))
  const compiler = Bun.spawn(['bun', 'x', '--bun', 'tsc', '-p', path.join(root, 'tsconfig.json'), '--pretty', 'false'], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' })
  const output = await new Response(compiler.stdout).text() + await new Response(compiler.stderr).text()
  expect(await compiler.exited, output).toBe(0)
}, 30000)

test('keeps overloads, object returns and callback defaults without inventing Event parameters', async () => {
  const root = createTempDir('stx-element-method-overloads-')
  roots.push(root)
  const inputDir = path.join(root, 'components'), outputDir = path.join(root, 'dist')
  await Bun.write(path.join(inputDir, 'Lookup.stx'), `
<script>
interface Options<T extends { id: string }> {
  value: T
}
type Token =
  | 'customer'
  | 'agent'
</script>
<script client>
function lookup(id: string): string;
function lookup(id: number): number;
function lookup(id: string | number): string | number { return id }
function resolve(this: HTMLElement, options: Options<{ id: string }>): { id: string; token: Token } {
  return { id: options.value.id, token: 'customer' }
}
function run(callback: () => void = () => {}): void { callback() }
function ping(message) { return message }
</script><template><p>Lookup</p></template>
`)
  await buildComponentLibrary({ inputDir, outputDir, prefix: 'typed', bundle: false })
  const declarations = await Bun.file(path.join(outputDir, 'typed-lookup.d.ts')).text()
  expect(declarations).toContain('lookup(id: string): string')
  expect(declarations).toContain('lookup(id: number): number')
  expect(declarations).not.toContain('lookup(id: string | number)')
  expect(declarations).toContain('resolve(options: Options<{ id: string }>): { id: string; token: Token }')
  expect(declarations).toContain('run(callback?: () => void): void')
  expect(declarations).toContain('ping(message: unknown): unknown')
  expect(declarations).toContain("| 'agent'")
  const runtime = await Bun.file(path.join(outputDir, 'typed-lookup.js')).text()
  expect(runtime).toContain('run(callback = () => {})')
  expect(runtime).not.toContain('this: HTMLElement')
})

test('refuses to publish a method contract that depends on unpackaged relative types', async () => {
  const root = createTempDir('stx-element-relative-types-')
  roots.push(root)
  const inputDir = path.join(root, 'components'), outputDir = path.join(root, 'dist')
  await Bun.write(path.join(inputDir, 'Host.stx'), `<script client>
import type { Options } from './private-types'
function boot(options: Options): void {}
</script><template><p>Host</p></template>`)
  await expect(buildComponentLibrary({ inputDir, outputDir, prefix: 'typed', bundle: false })).rejects.toThrow('outside the generated package')
})
