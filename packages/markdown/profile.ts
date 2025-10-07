/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { parseMarkdown } from './src/index'

const large = readFileSync('../benchmarks/fixtures/large.md', 'utf-8')

console.log('Document size:', large.length, 'bytes')
console.log('Running 1000 iterations...')

const start = performance.now()
for (let i = 0; i < 1000; i++) {
  parseMarkdown(large)
}
const end = performance.now()

console.log('Total time:', (end - start).toFixed(2), 'ms')
console.log('Average per iteration:', ((end - start) / 1000).toFixed(4), 'ms')
console.log('Operations per second:', Math.floor(1000000 / (end - start)))
