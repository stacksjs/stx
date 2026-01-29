#!/usr/bin/env bun
import { $ } from 'bun'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

// Skip CSS build in CI/CD environments or during npm publish
// CSS is only for examples and not included in published package
if (process.env.CI || process.env.npm_lifecycle_event === 'prepublishOnly') {
  console.log('⏭️  Skipping CSS build (not needed for publish)')
  process.exit(0)
}

// Crosswind location
const crosswindPath = resolve(process.env.HOME || '~', 'Code/Tools/crosswind/packages/crosswind')

// Check if crosswind is available
if (!existsSync(crosswindPath)) {
  console.log('⏭️  Skipping CSS build (crosswind not available at ~/Code/Tools/crosswind)')
  process.exit(0)
}

console.log('🚀 Building CSS with Crosswind...')

const contentPath = resolve(import.meta.dir, '../../../examples/**/*.stx')
const outputPath = resolve(import.meta.dir, '../examples/dist/styles.css')
const configPath = resolve(import.meta.dir, '../crosswind.config.ts')

try {
  const crosswindCli = resolve(crosswindPath, 'bin/cli.ts')
  const result = await $`bun ${crosswindCli} build --content ${contentPath} --output ${outputPath} --config ${configPath}`.text()

  console.log(result)

  // Post-process to fix ocean colors
  await $`bun ${resolve(import.meta.dir, './fix-ocean-colors.ts')}`

  // Display file size
  const fileSize = Bun.file(outputPath)
  const sizeKB = ((await fileSize.size) / 1024).toFixed(2)
  console.log(`📦 Final file size: ${sizeKB} KB`)
}
catch (error) {
  console.error('❌ Failed to build CSS:', error)
  process.exit(1)
}
