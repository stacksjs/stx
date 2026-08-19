import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { Glob } from 'bun'
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

const sourceTranspiler = new Bun.Transpiler({
  loader: 'ts',
  target: 'bun',
})

function resolveRuntimeSpecifier(entrypoint: string, specifier: string): string {
  if (!specifier.startsWith('.'))
    return specifier

  if (specifier.endsWith('.ts') || specifier.endsWith('.tsx'))
    return specifier.replace(/\.tsx?$/, '.js')

  // TypeScript source commonly imports a future `.js` path so the emitted ESM
  // is already Node-compatible. Leave those specifiers unchanged.
  if (specifier.endsWith('.js') || specifier.endsWith('.json'))
    return specifier

  const absolute = resolve(dirname(entrypoint), specifier)
  if (existsSync(`${absolute}.ts`) || existsSync(`${absolute}.tsx`))
    return `${specifier}.js`

  if (existsSync(join(absolute, 'index.ts')) || existsSync(join(absolute, 'index.tsx')))
    return `${specifier.replace(/\/$/, '')}/index.js`

  return specifier
}

async function emitRuntimeModule(entrypoint: string): Promise<void> {
  const source = await Bun.file(entrypoint).text()
  let output = await sourceTranspiler.transform(source)

  // Bun.Transpiler intentionally preserves module specifiers. Add explicit
  // `.js`/`index.js` suffixes so the published ESM works in standards-based
  // runtimes as well as Bun, without bundling every public source file into a
  // duplicated 30 MB distribution.
  const imports = sourceTranspiler.scan(output).imports
  for (const imported of imports) {
    const runtimeSpecifier = resolveRuntimeSpecifier(entrypoint, imported.path)
    if (runtimeSpecifier === imported.path)
      continue

    output = output.replaceAll(JSON.stringify(imported.path), JSON.stringify(runtimeSpecifier))
  }

  const outputPath = outputPathForEntrypoint(entrypoint)
  mkdirSync(dirname(outputPath), { recursive: true })
  await Bun.write(outputPath, output)
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

/**
 * Syntax errors in emitted declarations, grouped by file.
 *
 * Only TS1xxx codes are collected. Those are parse failures — unambiguous, and
 * the ones that matter here, because a SYNTAX error in a `.d.ts` cannot be
 * suppressed with `skipLibCheck` (that only silences semantic diagnostics) and
 * makes tsc abort on any consumer program that pulls the file in. Semantic
 * complaints across our own declaration graph are noise for this check.
 */
function findUnparseableDeclarations(): Map<string, string[]> {
  const files = [...new Glob('**/*.d.ts').scanSync({ cwd: resolve('./dist'), absolute: true })]
  const broken = new Map<string, string[]>()
  if (files.length === 0)
    return broken

  const result = Bun.spawnSync([
    'bun',
    '--bun',
    'tsc',
    '--ignoreConfig',
    '--noEmit',
    '--skipLibCheck',
    ...files,
  ], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' })

  const output = `${result.stdout.toString()}\n${result.stderr.toString()}`
  for (const line of output.split('\n')) {
    const match = line.match(/^(.*?)\((\d+),(\d+)\):\s+error\s+(TS1\d{3}):\s+(.*)$/)
    if (!match)
      continue
    const [, file, lineNo, col, code, message] = match
    const key = resolve(file)
    if (!broken.has(key))
      broken.set(key, [])
    broken.get(key)!.push(`${lineNo}:${col} ${code} ${message}`)
  }
  return broken
}

/**
 * Fail the build if any emitted declaration does not parse, repairing the ones
 * we can.
 *
 * dtsx truncates some declarations when it bundles the whole source graph in
 * one call — `dist/composables.d.ts` shipped as
 * `navigate: (path: string)) => unknown;`, cut off mid-signature (#1888). The
 * previous mitigation was a hand-maintained list of files to re-emit with tsc,
 * which had exactly one entry and did not include composables. A list that has
 * to be remembered is the same failure mode as the bug it patches, so this
 * detects the condition instead.
 *
 * A broken file is re-emitted with TypeScript, which is authoritative. If it
 * still does not parse afterwards, the build fails rather than publishing
 * declarations that make `tsc` abort in every consumer.
 */
function verifyEmittedDeclarations(): void {
  let broken = findUnparseableDeclarations()
  if (broken.size === 0)
    return

  const repaired: string[] = []
  for (const file of broken.keys()) {
    // dist/composables.d.ts -> ./src/composables.ts
    const relative = file.slice(resolve('./dist').length + 1).replace(/\.d\.ts$/, '')
    const source = `./src/${relative}.ts`
    if (!existsSync(resolve(source)))
      continue

    // Deliberately NOT emitTscDeclaration: that throws on a non-zero exit, and
    // tsc exits non-zero for pre-existing SEMANTIC errors in unrelated sources
    // it pulls in through the import graph. Declaration emit still succeeds in
    // that case, and whether the result is usable is decided by the parse check
    // below — which is the thing we actually care about.
    Bun.spawnSync([
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
      source,
    ], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' })
    repaired.push(relative)
  }

  if (repaired.length > 0)
    console.warn(`[stx:build] re-emitted truncated declarations with tsc: ${repaired.join(', ')}`)

  broken = findUnparseableDeclarations()
  if (broken.size > 0) {
    const detail = [...broken]
      .map(([file, errors]) => `  ${file}\n${errors.map(e => `    ${e}`).join('\n')}`)
      .join('\n')
    throw new Error(
      `Emitted declarations do not parse. These ship in dist/ and a syntax error in a .d.ts is not skipLibCheck-able, so every consumer's tsc run would abort:\n${detail}`,
    )
  }
}

rmSync('./dist', { recursive: true, force: true })

const sourceEntrypoints = collectEntrypoints('./src')

// Generate declarations for every source module exposed by the wildcard
// package export. dtsx runs through Bun's build graph, but its JavaScript
// output is deliberately replaced below: when every source file is both an
// entrypoint and a dependency, Bun 1.3 can emit shared chunks containing
// exports whose declarations live in a different entry file.
const declarationBuild = await Bun.build({
  entrypoints: sourceEntrypoints,
  splitting: true,
  outdir: './dist',
  root: './src',
  naming: '[dir]/[name].js',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  packages: 'external',
})
assertBuild(declarationBuild, 'stx declaration build')

// Emit one standards-based ESM file per source module. This is both smaller
// and safer than disabling splitting (which duplicates the full graph into
// every subpath), while retaining the exact public module layout.
await Promise.all(sourceEntrypoints.map(emitRuntimeModule))

// No transpiled module references dtsx's intermediate shared chunks.
for (const output of declarationBuild.outputs) {
  if (output.kind === 'chunk' && output.path.endsWith('.js'))
    rmSync(output.path, { force: true })
}

// Build the CLI and the optional module entries together, sharing chunks.
//
// Built one at a time with splitting off, each entry inlined every module it
// reached. `ssg.ts` is 69KB of source and became a 1.12MB bundle; `pwa.ts` is
// 8KB and became 1.15MB; `craft` another 1.23MB; the CLI 2.19MB. They are
// four views of largely the same graph — the renderer, the directive
// processor, the config loader — so the package shipped four copies of it,
// on top of the per-module ESM output that already contains all of it once.
//
// One build lets Bun put the shared modules in chunks that every entry
// imports. The entry filenames and the export map do not change; only the
// duplication does.
//
// `bundle-analyzer` keeps its own build: its entry is `src/bundle-analyzer/
// index.ts`, and with `[dir]/[name]` naming that emits `dist/index.js`, which
// is the package's own main entry. Renaming it out of the way is not worth
// putting the root export at risk.
const sharedEntries = [
  { entry: './bin/cli.ts', emitted: 'cli.js', final: 'cli.js' },
  { entry: './src/craft-entry.ts', emitted: 'craft-entry.js', final: 'craft.js' },
  { entry: './src/database.ts', emitted: 'database.js', final: 'database.js' },
  { entry: './src/ssg.ts', emitted: 'ssg.js', final: 'ssg.js' },
  { entry: './src/pwa.ts', emitted: 'pwa.js', final: 'pwa.js' },
  { entry: './src/visual-testing.ts', emitted: 'visual-testing.js', final: 'visual-testing.js' },
]

assertBuild(await Bun.build({
  entrypoints: sharedEntries.map(mod => mod.entry),
  splitting: true,
  outdir: './dist',
  naming: '[name].js',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  packages: 'external',
}), 'stx entry build')

// `craft-entry.ts` is published as `./craft`; every other entry already lands
// on its published name. Copied rather than renamed, because the wildcard
// export makes `@stacksjs/stx/craft-entry` a public subpath too, and it is the
// one the per-module output would otherwise have supplied.
for (const mod of sharedEntries) {
  if (mod.emitted === mod.final)
    continue
  copyFileSync(resolve('./dist', mod.emitted), resolve('./dist', mod.final))
}

assertBuild(await Bun.build({
  entrypoints: ['./src/bundle-analyzer/index.ts'],
  splitting: false,
  outdir: './dist',
  naming: 'bundle-analyzer.js',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  packages: 'external',
}), 'stx bundle-analyzer build')

// Add shebang to CLI
const cliPath = './dist/cli.js'
const cliContent = await Bun.file(cliPath).text()
if (!cliContent.startsWith('#!/')) {
  await Bun.write(cliPath, `#!/usr/bin/env bun\n${cliContent}`)
}

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

// Every documented entrypoint gets the reference, not just `.`. An app that
// only imports a subpath (`@stacksjs/stx/menubar`, say) never loads index.d.ts,
// so without this its `*.stx` imports and runtime globals go undeclared.
const referenceLine = '/// <reference path="./stx.d.ts" />'
const ambientEntrypoints = ['index', 'menubar', 'desktop', 'craft-entry', 'ssg', 'pwa', 'database']

for (const entrypoint of ambientEntrypoints) {
  const declarationPath = resolve(`./dist/${entrypoint}.d.ts`)
  if (!existsSync(declarationPath))
    continue

  const content = await Bun.file(declarationPath).text()
  if (!content.includes(referenceLine))
    await Bun.write(declarationPath, `${referenceLine}\n${content}`)
}

// Last, so it sees exactly what ships: everything dtsx emitted, everything
// re-emitted with tsc, and the ambient references prepended above.
verifyEmittedDeclarations()
