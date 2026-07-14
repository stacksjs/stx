import { copyFileSync, cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { dts } from 'bun-plugin-dtsx'

function collectEntrypoints(dir: string): string[] {
  const entries: string[] = []

  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      entries.push(...collectEntrypoints(fullPath))
      continue
    }

    if (!name.endsWith('.ts') || name.endsWith('.d.ts'))
      continue

    entries.push(fullPath)
  }

  return entries.sort()
}

function outputPathForEntrypoint(entrypoint: string): string {
  return join('dist', relative('src', entrypoint).replace(/\.ts$/, '.js'))
}

function assertBuild(result: Awaited<ReturnType<typeof Bun.build>>, label: string): void {
  if (result.success)
    return

  const logs = result.logs.map(log => String(log)).join('\n')
  throw new Error(`${label} failed${logs ? `:\n${logs}` : ''}`)
}

function emitTscDeclaration(entrypoint: string): void {
  const result = Bun.spawnSync([
    'bun',
    '--bun',
    'tsc',
    '--ignoreConfig',
    '--declaration',
    '--emitDeclarationOnly',
    '--moduleResolution',
    'bundler',
    '--module',
    'esnext',
    '--target',
    'esnext',
    '--skipLibCheck',
    '--outDir',
    'dist',
    entrypoint,
  ], {
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
  })

  if (result.exitCode !== 0) {
    throw new Error(`declaration emit failed for ${entrypoint}:\n${result.stdout.toString()}\n${result.stderr.toString()}`)
  }
}

rmSync('./dist', { recursive: true, force: true })

const sourceEntrypoints = collectEntrypoints('./src')

// Build every source module that the package exports through the `./*`
// subpath. Keeping real JS next to every generated declaration prevents
// runtime-only failures such as `import '@stacksjs/stx/expressions'`.
//
// `splitting: true` extracts code shared across the ~350 entrypoints into a
// handful of `chunk-*.js` files that each entry imports, instead of inlining a
// full copy of the shared graph into every entry (which ballooned dist to
// ~50 MB). The named entry files still exist, so `@stacksjs/stx/<subpath>`
// imports keep resolving — they just re-export from the shared chunks.
assertBuild(await Bun.build({
  entrypoints: sourceEntrypoints,
  splitting: true,
  outdir: './dist',
  root: './src',
  naming: '[dir]/[name].js',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  packages: 'external',
}), 'stx source build')

for (const entrypoint of sourceEntrypoints) {
  const expectedOutput = outputPathForEntrypoint(entrypoint)
  if (await Bun.file(expectedOutput).exists())
    continue

  mkdirSync(dirname(expectedOutput), { recursive: true })
  assertBuild(await Bun.build({
    entrypoints: [entrypoint],
    splitting: false,
    outdir: './dist',
    root: './src',
    naming: '[dir]/[name].js',
    target: 'bun',
    minify: true,
    packages: 'external',
  }), `stx fallback source build for ${entrypoint}`)
}

// Build CLI separately
assertBuild(await Bun.build({
  entrypoints: ['./bin/cli.ts'],
  splitting: false,
  outdir: './dist',
  target: 'bun',
  minify: true,
  packages: 'external',
}), 'stx cli build')

// Add shebang to CLI
const cliPath = './dist/cli.js'
const cliContent = await Bun.file(cliPath).text()
if (!cliContent.startsWith('#!/')) {
  await Bun.write(cliPath, `#!/usr/bin/env bun\n${cliContent}`)
}

// Build the client-side library
assertBuild(await Bun.build({
  entrypoints: ['./client.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'browser',
}), 'stx client build')

// Build optional modules as separate entry points
const optionalModules = [
  { entry: './src/craft-entry.ts', name: 'craft' },
  { entry: './src/database.ts', name: 'database' },
  { entry: './src/ssg.ts', name: 'ssg' },
  { entry: './src/pwa.ts', name: 'pwa' },
  { entry: './src/visual-testing.ts', name: 'visual-testing' },
  { entry: './src/bundle-analyzer/index.ts', name: 'bundle-analyzer' },
]

await Promise.all(optionalModules.map(async (mod) => {
  assertBuild(await Bun.build({
    entrypoints: [mod.entry],
    splitting: false,
    outdir: './dist',
    naming: `${mod.name}.js`,
    plugins: [dts()],
    target: 'bun',
    minify: true,
    packages: 'external',
  }), `stx optional build for ${mod.name}`)
}))

// dtsx can truncate declarations for a few standalone public modules when
// bundling the full source graph in one call. Re-emit those public declaration
// files with TypeScript itself after every dtsx build so subpath consumers get
// the complete surface.
emitTscDeclaration('./src/safe-evaluator.ts')

// Copy built-in components to dist
mkdirSync(resolve('./dist/components'), { recursive: true })
cpSync(resolve('./src/components'), resolve('./dist/components'), { recursive: true })

// Ship ambient global type declarations.
// stx.d.ts contains module declarations for *.stx/*.md imports AND ambient
// runtime globals (state, derived, effect, defineStore, useHead, etc.) that
// the signals runtime injects into <script client> blocks. We copy it into
// dist/ and prepend a triple-slash reference to dist/index.d.ts so consumers
// pick the globals up automatically when they install @stacksjs/stx — no
// per-app stx.d.ts workaround required.
copyFileSync(resolve('./stx.d.ts'), resolve('./dist/stx.d.ts'))

const indexDtsPath = resolve('./dist/index.d.ts')
const indexDtsContent = await Bun.file(indexDtsPath).text()
const referenceLine = '/// <reference path="./stx.d.ts" />'
if (!indexDtsContent.includes(referenceLine)) {
  await Bun.write(indexDtsPath, `${referenceLine}\n${indexDtsContent}`)
}
