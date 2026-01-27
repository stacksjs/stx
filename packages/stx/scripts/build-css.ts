#!/usr/bin/env bun
import { $ } from 'bun'
import { resolve } from 'node:path'
import process from 'node:process'

// Skip CSS build in CI/CD environments, during npm publish, or if headwind isn't available
// CSS is only for examples and not included in published package
if (process.env.CI || process.env.npm_lifecycle_event === 'prepublishOnly') {
  console.log('⏭️  Skipping CSS build (not needed for publish)')
  process.exit(0)
}

// Check if headwind is available before trying to use it
try {
  await import('@stacksjs/headwind')
}
catch {
  try {
    await import('@stacksjs/headwind/dist/index.js')
  }
  catch {
    console.log('⏭️  Skipping CSS build (@stacksjs/headwind not available)')
    process.exit(0)
  }
}

console.log('🚀 Building CSS with Headwind...')

const contentPath = resolve(import.meta.dir, '../../../examples/**/*.stx')
const outputPath = resolve(import.meta.dir, '../examples/dist/styles.css')
const configPath = resolve(import.meta.dir, '../headwind.config.ts')

try {
  // Use headwind CLI from the linked package
  // Try standard resolve first, then fallback (headwind exports may be misconfigured)
  let headwindPkg: string
  try {
    headwindPkg = import.meta.resolve('@stacksjs/headwind')
  }
  catch {
    headwindPkg = import.meta.resolve('@stacksjs/headwind/dist/index.js')
  }
  // headwindPkg is like file:///path/to/headwind/dist/index.js
  // Go up one level from dist/ to get package root
  const pkgDir = new URL('..', headwindPkg).pathname
  const headwindCli = resolve(pkgDir, 'bin/cli.ts')
  const result = await $`bun ${headwindCli} build --content ${contentPath} --output ${outputPath} --config ${configPath}`.text()

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
