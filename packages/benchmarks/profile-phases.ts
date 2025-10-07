import { readFileSync } from 'fs'

const large = readFileSync('../benchmarks/fixtures/large.md', 'utf-8')

// Import parser directly to access internal functions
import { parse } from './src/index'

console.log('Testing parsing vs rendering phases...\n')

// Measure total time
const totalStart = performance.now()
for (let i = 0; i < 100; i++) {
  parse(large)
}
const totalEnd = performance.now()
const totalTime = totalEnd - totalStart

console.log(`Total time for 100 iterations: ${totalTime.toFixed(2)}ms`)
console.log(`Average per iteration: ${(totalTime / 100).toFixed(4)}ms`)
console.log(`Operations per second: ${Math.floor(100000 / totalTime)}`)
