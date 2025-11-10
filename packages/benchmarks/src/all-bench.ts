#!/usr/bin/env bun
/* eslint-disable no-console */
/**
 * Comprehensive Benchmark Suite
 *
 * Compares @stacksjs/markdown and @stacksjs/sanitizer performance
 * against popular competitors in the ecosystem.
 */

import { $ } from 'bun'

console.log(`\n${'='.repeat(70)}`)
console.log('🚀 STX FRAMEWORK PERFORMANCE BENCHMARKS')
console.log('='.repeat(70))
console.log('\nComparing STX framework components (@stacksjs/stx, @stacksjs/sanitizer)')
console.log('against popular competitors in the ecosystem.')
console.log(`\nRuntime: Bun v${Bun.version}`)
console.log('Platform:', process.platform, process.arch)
console.log('Node version:', process.version)
console.log(`\n${'='.repeat(70)}`)

// Run all benchmarks sequentially
const benchmarks = [
  { name: 'Template Engine Performance', file: 'templating-bench.ts' },
  { name: 'HTML Sanitization', file: 'sanitizer-bench.ts' },
]

for (const benchmark of benchmarks) {
  console.log(`\n\n${'='.repeat(70)}`)
  console.log(`Running: ${benchmark.name}`)
  console.log('='.repeat(70))

  try {
    await $`bun run ${import.meta.dir}/${benchmark.file}`
  }
  catch (error) {
    console.error(`\n❌ Error running ${benchmark.name}:`, error)
  }

  // Small delay between benchmarks
  await new Promise(resolve => setTimeout(resolve, 1000))
}

console.log(`\n${'='.repeat(70)}`)
console.log('✅ All benchmarks completed!')
console.log(`${'='.repeat(70)}\n`)
