import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path, { join } from 'node:path'
import process from 'node:process'
import { dts } from 'bun-plugin-dtsx'

console.log('Building @stacksjs/components...')

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true })
}

// The dist bundle used to fail with `SyntaxError: Exported binding 'defaultN'
// needs to refer to a top-level declared variable.` because Bun's bundler
// synthesized `defaultN` references for `.stx` re-exports without ever
// invoking plugin hooks — particularly for files containing real `import`
// statements like `src/components/CodeBlock.stx`. We work around it by
// generating a temporary entry file in OS tmpdir (so Bun's bundler doesn't
// hit whatever package-local-resolution path produces the bad emit when
// the entry lives inside packages/components/), rewriting every `.stx`
// re-export to a tiny JS-default stub. Non-Bun consumers get a stub
// object (`{ __stx: true, src }`) instead of a SyntaxError; Bun consumers
// fall through to `src/` via the `bun:` exports condition for real
// rendering. See stacksjs/stx#1690.
const srcDir = path.resolve('./src')
const srcIndex = readFileSync(join(srcDir, 'index.ts'), 'utf8')

const tmpRoot = mkdtempSync(join(tmpdir(), 'stx-components-build-'))
const stubsDir = join(tmpRoot, 'stubs')
mkdirSync(stubsDir, { recursive: true })

let stubCounter = 0
const stubMap = new Map<string, string>()
const tmpIndexContent = srcIndex.replace(
  /from\s+(['"])((?:\.\/|\.\.\/)[^'"\n]+)\1/g,
  (_full, q, importPath) => {
    if (importPath.endsWith('.stx')) {
      let stubFile = stubMap.get(importPath)
      if (!stubFile) {
        stubFile = join(stubsDir, `stub-${stubCounter++}.js`)
        stubMap.set(importPath, stubFile)
        writeFileSync(
          stubFile,
          `export default { __stx: true, src: ${JSON.stringify(importPath)} };\n`,
        )
      }
      return `from ${q}${stubFile}${q}`
    }
    // Rewrite all other relative imports to absolute paths so the entry
    // can live outside the package without breaking resolution.
    return `from ${q}${path.resolve(srcDir, importPath)}${q}`
  },
)
const tmpEntry = join(tmpRoot, 'index.ts')
writeFileSync(tmpEntry, tmpIndexContent)

let result
try {
  result = await Bun.build({
    entrypoints: [tmpEntry],
    outdir: './dist',
    plugins: [dts()],
    target: 'bun',
    // Minification miscompiles the re-exports — turning `default` aliases
    // into renamed `defaultN` / `Ig`-style bindings that aren't declared
    // at top level. Leaving minify off avoids it; stubbed modules keep
    // dist small anyway.
    minify: false,
    splitting: false,
    external: [
      '@stacksjs/stx',
      '@cwcss/crosswind',
      'ts-syntax-highlighter',
    ],
  })
}
finally {
  rmSync(tmpRoot, { recursive: true, force: true })
}

if (!result.success) {
  console.error('Build failed!')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Build individual component files
console.log('Building individual components...')

const componentsDir = './src/components'
const componentFiles = [
  'CodeBlock.stx',
  'Hero.stx',
  'Footer.stx',
  'Installation.stx',
]

for (const file of componentFiles) {
  const componentPath = join(componentsDir, file)
  if (existsSync(componentPath)) {
    console.log(`  - ${file}`)
    // Components will be processed by the STX plugin at runtime
  }
}

// Build utilities
console.log('Building utilities...')

const utilResult = await Bun.build({
  entrypoints: [
    './src/utils/highlighter.ts',
    './src/composables/index.ts',
  ],
  outdir: './dist',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  splitting: false,
  external: [
    '@stacksjs/stx',
    '@cwcss/crosswind',
    'ts-syntax-highlighter',
  ],
})

if (!utilResult.success) {
  console.error('Utilities build failed!')
  for (const log of utilResult.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log('✓ Build completed successfully!')
console.log(`  - Output: ./dist`)
console.log(`  - Components: ${componentFiles.length}`)
console.log(`  - Composables: 3 (useCopyCode, useDarkMode, useSEO)`)
