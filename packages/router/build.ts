import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
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

    if (name.endsWith('.ts') && !name.endsWith('.d.ts'))
      entries.push(fullPath)
  }

  return entries.sort()
}

function assertBuild(result: Awaited<ReturnType<typeof Bun.build>>, label: string): void {
  if (result.success)
    return

  const logs = result.logs.map(log => String(log)).join('\n')
  throw new Error(`${label} failed${logs ? `:\n${logs}` : ''}`)
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

  for (const imported of sourceTranspiler.scan(output).imports) {
    const runtimeSpecifier = resolveRuntimeSpecifier(entrypoint, imported.path)
    if (runtimeSpecifier !== imported.path)
      output = output.replaceAll(JSON.stringify(imported.path), JSON.stringify(runtimeSpecifier))
  }

  const outputPath = outputPathForEntrypoint(entrypoint)
  mkdirSync(dirname(outputPath), { recursive: true })
  await Bun.write(outputPath, output)
}

rmSync('./dist', { recursive: true, force: true })
mkdirSync('./dist', { recursive: true })

const sourceEntrypoints = collectEntrypoints('./src')

// Generate declarations through dtsx, but replace Bun's JavaScript output
// below. When every source file is both an entrypoint and a dependency, Bun
// can otherwise emit entry modules that export bindings declared only in a
// different generated chunk.
const declarationBuild = await Bun.build({
  entrypoints: sourceEntrypoints,
  outdir: './dist',
  root: './src',
  naming: '[dir]/[name].js',
  target: 'bun',
  format: 'esm',
  splitting: true,
  minify: true,
  packages: 'external',
  plugins: [dts()],
})
assertBuild(declarationBuild, 'router declaration build')

// Emit one small, standards-based ESM file per public source module instead
// of bundling and duplicating the full graph into every wildcard subpath.
await Promise.all(sourceEntrypoints.map(emitRuntimeModule))

for (const output of declarationBuild.outputs) {
  if (output.kind === 'chunk' && output.path.endsWith('.js'))
    rmSync(output.path, { force: true })
}

console.log('Build complete!')
