import { afterEach, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { buildComponentLibrary as sourceBuild } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'
import { exerciseMethodScope, methodScopeExpected, methodScopeSource } from '../../test-utils/component-method-scope'

const buildComponentLibrary = process.env.STX_LIBRARY_DIST ? (await import('../../dist/component-library.js')).buildComponentLibrary : sourceBuild
const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })

// Compile and call actual emitted elements. This catches stale prop closures and
// render reentry; the companion Chrome test adds native loading and strict CSP.
for (const bundle of [false, true]) test(`public helpers use current props during ${bundle ? 'standalone' : 'ESM'} renders and pending updates`, async () => {
  const root = createTempDir('stx-method-scope-')
  roots.push(root)
  const inputDir = join(root, 'source'), outputDir = join(root, 'dist')
  await Bun.write(join(inputDir, 'Probe.stx'), methodScopeSource)
  await buildComponentLibrary({ inputDir, outputDir, prefix: bundle ? 'method-bundle' : 'method-esm', bundle, progressive: false })
  await rm(inputDir, { recursive: true })
  await import(join(outputDir, bundle ? 'bundle.js' : 'index.js'))
  if (!bundle) {
    await Bun.write(join(root, 'consumer.ts'), `import { Probe } from './dist/method-esm-probe.js'
const element = new Probe()
element.value = 'pending'
const current: string = element.read()
const incremented: string = element.increment()
const later: Promise<string> = element.readLater()
const recursed: string = element.recurse(4)
// @ts-expect-error Public prop remains a string.
element.value = 1
// @ts-expect-error Public helper keeps its required string argument.
element.label(1)
void [current, incremented, later, recursed]
`)
    await Bun.write(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: false, target: 'esnext', lib: ['esnext', 'dom'], module: 'esnext', moduleResolution: 'bundler', types: [] }, files: ['consumer.ts'] }))
    const compiler = Bun.spawn(['bun', 'x', '--bun', 'tsc', '-p', join(root, 'tsconfig.json'), '--pretty', 'false'], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' })
    const output = await new Response(compiler.stdout).text() + await new Response(compiler.stderr).text()
    expect(await compiler.exited, output).toBe(0)
  }
  expect(await exerciseMethodScope(bundle ? 'method-bundle-probe' : 'method-esm-probe')).toEqual(methodScopeExpected)
})
