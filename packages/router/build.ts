import plugin from 'bun-plugin-dtsx'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

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

rmSync('./dist', { recursive: true, force: true })
mkdirSync('./dist', { recursive: true })

assertBuild(await Bun.build({
  entrypoints: collectEntrypoints('./src'),
  outdir: './dist',
  root: './src',
  naming: '[dir]/[name].js',
  target: 'bun',
  format: 'esm',
  splitting: false,
  sourcemap: 'external',
  minify: false,
  plugins: [plugin()],
}), 'router build')

console.log('Build complete!')
