import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { dts } from 'bun-plugin-dtsx'

console.log('Building @stacksjs/components...')

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true })
}

// Build the main library
const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'bun',
  minify: true,
  splitting: false,
  external: [
    '@stacksjs/stx',
    '@stacksjs/headwind',
    'ts-syntax-highlighter',
    'bun-plugin-stx',
  ],
})

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
    '@stacksjs/headwind',
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
