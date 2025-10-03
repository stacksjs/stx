#!/usr/bin/env bun
import { watch } from 'node:fs'
import { build } from '/Users/chrisbreuer/Code/headwind/packages/headwind/src/index.ts'
import { defaultConfig } from '/Users/chrisbreuer/Code/headwind/packages/headwind/src/config.ts'
import config from '../headwind.config.ts'
import path from 'node:path'

console.log('🚀 Starting Headwind in watch mode...')
console.log('👀 Watching for changes in:', config.content)
console.log('')

// Merge with default config
const fullConfig = {
  ...defaultConfig,
  ...config,
}

// Initial build
async function buildCSS() {
  try {
    const startTime = performance.now()
    const result = await build(fullConfig)
    const duration = performance.now() - startTime

    console.log(`✅ Built ${result.classes.size} classes in ${duration.toFixed(2)}ms`)

    const fileSize = Bun.file(config.output!)
    const sizeKB = ((await fileSize.size) / 1024).toFixed(2)
    console.log(`📦 File size: ${sizeKB} KB`)
    console.log('')
  } catch (error) {
    console.error('❌ Build failed:', error)
  }
}

// Run initial build
await buildCSS()

// Watch for changes
const watchDirs = new Set<string>()
for (const pattern of config.content) {
  const dir = path.dirname(pattern.replace('/**/*', ''))
  watchDirs.add(dir)
}

console.log('👀 Watching directories:')
for (const dir of watchDirs) {
  console.log(`   ${dir}`)

  watch(dir, { recursive: true }, async (eventType, filename) => {
    if (filename && (filename.endsWith('.stx') || filename.endsWith('.html') || filename.endsWith('.tsx') || filename.endsWith('.jsx'))) {
      console.log(`\n📝 ${filename} changed, rebuilding...`)
      await buildCSS()
    }
  })
}

console.log('')
console.log('Press Ctrl+C to stop watching')
