#!/usr/bin/env bun
import { resolve } from 'node:path'
import process from 'node:process'

console.log('🚀 Starting Headwind in watch mode...')
console.log('')

const headwindPath = resolve(process.env.HOME!, 'Code/headwind')
const contentPath = resolve(import.meta.dir, '../../../examples/**/*.stx')
const outputPath = resolve(import.meta.dir, '../examples/dist/styles.css')

try {
  // Use headwind CLI in watch mode
  const proc = Bun.spawn(['./headwind', 'build', '--content', contentPath, '--output', outputPath, '--watch'], {
    cwd: headwindPath,
    stdout: 'inherit',
    stderr: 'inherit',
  })

  await proc.exited
}
catch (error) {
  console.error('❌ Failed to start watch mode:', error)
  process.exit(1)
}
