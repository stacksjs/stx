#!/usr/bin/env bun
import { resolve } from 'node:path'
import { $ } from 'bun'

console.log('🚀 Building CSS with Headwind...')

const headwindPath = resolve(process.env.HOME!, 'Code/headwind')
const contentPath = resolve(import.meta.dir, '../../../examples/**/*.stx')
const outputPath = resolve(import.meta.dir, '../examples/dist/styles.css')

try {
  // Use headwind CLI directly
  const result = await $`cd ${headwindPath} && ./headwind build --content ${contentPath} --output ${outputPath}`.text()

  console.log(result)

  // Post-process to fix ocean colors
  await $`bun ${resolve(import.meta.dir, './fix-ocean-colors.ts')}`

  // Display file size
  const fileSize = Bun.file(outputPath)
  const sizeKB = ((await fileSize.size) / 1024).toFixed(2)
  console.log(`📦 Final file size: ${sizeKB} KB`)
} catch (error) {
  console.error('❌ Failed to build CSS:', error)
  process.exit(1)
}
