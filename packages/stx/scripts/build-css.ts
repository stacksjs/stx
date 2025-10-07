#!/usr/bin/env bun
import config from '../headwind.config.ts'
import { defaultConfig } from '/Users/chrisbreuer/Code/headwind/packages/headwind/src/config.ts'
import { build } from '/Users/chrisbreuer/Code/headwind/packages/headwind/src/index.ts'

console.log('🚀 Building CSS with Headwind...')

// Merge with default config
const fullConfig = {
  ...defaultConfig,
  ...config,
}

const result = await build(fullConfig)

console.log(`✅ Built ${result.classes.size} classes in ${result.duration.toFixed(2)}ms`)
console.log(`📝 Output: ${config.output}`)

const fileSize = Bun.file(config.output)
const sizeKB = ((await fileSize.size) / 1024).toFixed(2)
console.log(`📦 File size: ${sizeKB} KB`)
