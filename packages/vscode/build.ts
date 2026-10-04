import process from 'node:process'
import { buildTsPluginBundle, writeTsPluginPackage } from './scripts/ts-plugin-package'
import { writeStxDeclarations } from './src/ts-plugin-declarations'

console.log('Building VSCode extension...')

try {
  // 1. Build the main extension (CJS for VSCode). Everything but the `vscode`
  //    module the editor provides is bundled: the extension is packaged with
  //    `vsce package --no-dependencies`, so the installed extension has no
  //    node_modules to resolve `@stacksjs/ts-css` or `prettier` from.
  //
  //    bunfig is the exception. The utility-class engine imports it only to
  //    load a config file, which the extension never asks it to, and bunfig's
  //    logger has a module-scope `await` and `import.meta.require`: in a CJS
  //    bundle either one is a syntax error, and VS Code's Node host refuses
  //    the whole extension. test/manifest.test.ts parses the bundle the way
  //    Node does.
  const result = await Bun.build({
    entrypoints: ['./src/extension.ts'],
    outdir: './dist',
    target: 'node',
    format: 'cjs',
    external: ['vscode', 'bunfig'],
    minify: true,
    sourcemap: 'external',
  })

  if (!result.success) {
    console.error('Extension build failed:', result.logs)
    process.exit(1)
  }

  // 2. Build the TypeScript plugin (CJS for TS server). The entry sets
  //    `module.exports` to the factory, which is what tsserver calls, and the
  //    package tsserver resolves it by is written next to the extension's
  //    other node_modules (see scripts/ts-plugin-package.ts).
  await buildTsPluginBundle('./dist', 'external')

  // The runtime's declarations the plugin adds to a program holding a `.stx`
  // file, beside the bundle that looks for them (stacksjs/stx#2028).
  writeStxDeclarations(`${import.meta.dir}/dist/types`)

  const manifest = await Bun.file(new URL('./package.json', import.meta.url)).json()
  writeTsPluginPackage(import.meta.dir, manifest.version)

  // 3. Build the library entry point (ESM for importing in other projects)
  const libResult = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'node',
    format: 'esm',
    external: [
      'vscode',
      '@stacksjs/ts-css',
      '@stacksjs/ts-css/engine'
    ],
    naming: '[dir]/[name].mjs',
    minify: true,
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
