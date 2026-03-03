import { dts } from 'bun-plugin-dtsx'
import { cpSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Build the main library
await Bun.build({
  entrypoints: ['./src/index.ts'],
  splitting: false,
  outdir: './dist',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  packages: 'external',
})

// Build CLI separately
await Bun.build({
  entrypoints: ['./bin/cli.ts'],
  splitting: false,
  outdir: './dist',
  target: 'bun',
  minify: true,
  packages: 'external',
})

// Add shebang to CLI
const cliPath = './dist/cli.js'
const cliContent = await Bun.file(cliPath).text()
if (!cliContent.startsWith('#!/')) {
  await Bun.write(cliPath, `#!/usr/bin/env bun\n${cliContent}`)
}

// Build the client-side library
await Bun.build({
  entrypoints: ['./client.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'browser',
})

// Build optional modules as separate entry points
const optionalModules = [
  { entry: './src/craft-entry.ts', name: 'craft' },
  { entry: './src/database.ts', name: 'database' },
  { entry: './src/ssg.ts', name: 'ssg' },
  { entry: './src/pwa.ts', name: 'pwa' },
  { entry: './src/visual-testing.ts', name: 'visual-testing' },
  { entry: './src/bundle-analyzer/index.ts', name: 'bundle-analyzer' },
]

await Promise.all(optionalModules.map(mod =>
  Bun.build({
    entrypoints: [mod.entry],
    splitting: false,
    outdir: './dist',
    naming: `${mod.name}.js`,
    plugins: [dts()],
    target: 'bun',
    minify: true,
    packages: 'external',
  }),
))

// Copy built-in components to dist
mkdirSync(resolve('./dist/components'), { recursive: true })
cpSync(resolve('./src/components'), resolve('./dist/components'), { recursive: true })
