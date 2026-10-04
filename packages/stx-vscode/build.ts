/**
 * Builds `@stacksjs/stx-vscode`, the stx extension's language support as a
 * library another VS Code extension can embed (stacksjs/stx#2020).
 *
 * There is one source: packages/vscode/src, the stx extension itself. This
 * package is its npm distribution, because the extension cannot be published
 * to npm under its own name (`vsce` takes the marketplace name from
 * package.json, and that name cannot carry the @stacksjs scope).
 *
 * dist/
 *   index.js          the library, ESM; `vscode` and the npm dependencies stay external
 *   index.d.ts        the embedding API (src/index.d.ts)
 *   assets/           grammar, language configuration and snippets
 *   contributes.json  the manifest contributions an embedding extension must declare,
 *                     with paths relative to assets/
 */
import process from 'node:process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dir
const extension = join(here, '../vscode')
const dist = join(here, 'dist')

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })

const result = await Bun.build({
  entrypoints: [join(extension, 'src/index.ts')],
  outdir: dist,
  target: 'node',
  format: 'esm',
  external: [
    'vscode',
    '@stacksjs/ts-css',
    '@stacksjs/ts-css/engine',
    'prettier',
    'prettier/standalone',
    'prettier/parser-postcss',
  ],
})

if (!result.success) {
  console.error('stx-vscode build failed:', result.logs)
  process.exit(1)
}

cpSync(join(here, 'src/index.d.ts'), join(dist, 'index.d.ts'))

for (const dir of ['syntaxes', 'languages', 'snippets'])
  cpSync(join(extension, 'src', dir), join(dist, 'assets', dir), { recursive: true })

const manifest = JSON.parse(readFileSync(join(extension, 'package.json'), 'utf8'))
const contributes = manifest.contributes
const fromAssets = (path: string) => path.replace(/^\.\/src\//, './')

writeFileSync(join(dist, 'contributes.json'), `${JSON.stringify({
  languages: contributes.languages.map((language: any) => ({ ...language, configuration: fromAssets(language.configuration) })),
  grammars: contributes.grammars.map((grammar: any) => ({ ...grammar, path: fromAssets(grammar.path) })),
  snippets: contributes.snippets.map((snippet: any) => ({ ...snippet, path: fromAssets(snippet.path) })),
  commands: contributes.commands,
  configuration: contributes.configuration,
}, null, 2)}\n`)

console.log('Built @stacksjs/stx-vscode')
