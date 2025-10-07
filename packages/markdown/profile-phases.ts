/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { parse } from './src/index'

const large = readFileSync('../benchmarks/fixtures/large.md', 'utf-8')

const totalStart = performance.now()
for (let i = 0; i < 100; i++) {
  parse(large)
}
const totalEnd = performance.now()
const totalTime = totalEnd - totalStart

console.log('Total time for 100 iterations:', totalTime.toFixed(2), 'ms')
console.log('Average:', (totalTime / 100).toFixed(4), 'ms')
console.log('Ops/sec:', Math.floor(100000 / totalTime))
