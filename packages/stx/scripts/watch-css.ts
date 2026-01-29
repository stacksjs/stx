#!/usr/bin/env bun
import { resolve } from 'node:path'
import process from 'node:process'

console.log('🚀 Starting Crosswind in watch mode...')
console.log('')

const crosswindPath = resolve(process.env.HOME!, 'Code/Tools/crosswind/packages/crosswind')
const contentPath = resolve(import.meta.dir, '../../../examples/**/*.stx')
const outputPath = resolve(import.meta.dir, '../examples/dist/styles.css')

try {
  // Use crosswind CLI in watch mode
  const proc = Bun.spawn(['bun', 'bin/cli.ts', 'build', '--content', contentPath, '--output', outputPath, '--watch'], {
    cwd: crosswindPath,
    stdout: 'inherit',
    stderr: 'inherit',
  })

  await proc.exited
}
catch (error) {
  console.error('❌ Failed to start watch mode:', error)
  process.exit(1)
}
