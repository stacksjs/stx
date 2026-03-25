import process from 'node:process'

console.log('Building VSCode extension...')

try {
  // 1. Build the main extension (CJS for VSCode)
  const result = await Bun.build({
    entrypoints: ['./src/extension.ts'],
    outdir: './dist',
    target: 'node',
    format: 'cjs',
    external: [
      'vscode',
      '@cwcss/crosswind',
      'prettier',
    ],
    minify: false,
    sourcemap: 'external',
  })

  if (!result.success) {
    console.error('Extension build failed:', result.logs)
    process.exit(1)
  }

  // 2. Build the TypeScript plugin (CJS for TS server)
  const pluginResult = await Bun.build({
    entrypoints: ['./src/typescript-stx-plugin.ts'],
    outdir: './dist',
    target: 'node',
    format: 'cjs',
    external: ['typescript', 'typescript/lib/tsserverlibrary'],
    minify: false,
    sourcemap: 'external',
  })

  if (!pluginResult.success) {
    console.error('TypeScript plugin build failed:', pluginResult.logs)
    process.exit(1)
  }

  // 3. Build the library entry point (ESM for importing in other projects)
  const libResult = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'node',
    format: 'esm',
    external: [
      'vscode',
      '@cwcss/crosswind'
    ],
    naming: '[dir]/[name].mjs',
    minify: false,
    sourcemap: 'external',
  })

  if (!libResult.success) {
    console.error('Library build failed:', libResult.logs)
    process.exit(1)
  }

  console.log('Build complete!')
}
catch (error) {
  console.error('Build error:', error)
  process.exit(1)
}
