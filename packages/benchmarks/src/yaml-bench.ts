/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// Our implementation (using Bun's native YAML)
import { parseYaml, stringifyYaml } from '@stacksjs/markdown'

// Competitor
import jsYaml from 'js-yaml'

import { Bench } from 'tinybench'

// Load fixture
const fixturesDir = join(import.meta.dir, '../fixtures')
const yamlContent = readFileSync(join(fixturesDir, 'data.yaml'), 'utf-8')

// Create larger YAML for stress testing
const largeYamlObj: any = {}
for (let i = 0; i < 500; i++) {
  largeYamlObj[`key${i}`] = {
    name: `Name ${i}`,
    value: i,
    active: i % 2 === 0,
    tags: ['tag1', 'tag2', 'tag3'],
    metadata: {
      created: '2024-01-01',
      updated: '2024-01-15',
    },
  }
}
const largeYaml = jsYaml.dump(largeYamlObj)

function formatResult(name: string, bench: any) {
  const opsPerSec = (1000000000 / bench.mean).toFixed(0)
  const timeMs = (bench.mean / 1000000).toFixed(3)
  return `${name.padEnd(25)} ${opsPerSec.padStart(10)} ops/sec  ±${bench.rme.toFixed(2)}%  (${timeMs}ms avg)`
}

console.log('\n📊 YAML Parsing Benchmarks\n')
console.log('='.repeat(70))

// Parse standard YAML
console.log('\n📄 Standard YAML (~1KB)\n')
const parseBench = new Bench({ time: 1000 })

parseBench
  .add('@stacksjs/markdown (Bun)', () => {
    parseYaml(yamlContent)
  })
  .add('js-yaml', () => {
    jsYaml.load(yamlContent)
  })

await parseBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of parseBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const parseFastest = parseBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b,
)
console.log(`\n🏆 Fastest: ${parseFastest.name}`)

// Parse large YAML
console.log(`\n${'='.repeat(70)}`)
console.log('\n📄 Large YAML (500 objects, ~20KB)\n')
const largeParseBench = new Bench({ time: 1000 })

largeParseBench
  .add('@stacksjs/markdown (Bun)', () => {
    parseYaml(largeYaml)
  })
  .add('js-yaml', () => {
    jsYaml.load(largeYaml)
  })

await largeParseBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of largeParseBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const largeParseFastest = largeParseBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b,
)
console.log(`\n🏆 Fastest: ${largeParseFastest.name}`)

// Stringify benchmark
console.log(`\n${'='.repeat(70)}`)
console.log('\n📄 YAML Stringify (500 objects)\n')
const stringifyBench = new Bench({ time: 1000 })

stringifyBench
  .add('@stacksjs/markdown (Bun)', () => {
    stringifyYaml(largeYamlObj)
  })
  .add('js-yaml', () => {
    jsYaml.dump(largeYamlObj)
  })

await stringifyBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of stringifyBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const stringifyFastest = stringifyBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b,
)
console.log(`\n🏆 Fastest: ${stringifyFastest.name}`)

// Summary
console.log(`\n${'='.repeat(70)}`)
console.log('\n📈 Summary\n')

const allBenches = [
  { name: 'Parse (Standard)', bench: parseBench },
  { name: 'Parse (Large)', bench: largeParseBench },
  { name: 'Stringify', bench: stringifyBench },
]

for (const { name, bench } of allBenches) {
  const stacksjsTask = bench.tasks.find(t => t.name.includes('Bun'))
  const jsYamlTask = bench.tasks.find(t => t.name === 'js-yaml')

  if (stacksjsTask && jsYamlTask && stacksjsTask.result && jsYamlTask.result) {
    const speedup = jsYamlTask.result.mean / stacksjsTask.result.mean
    if (speedup > 1.05) {
      console.log(`${name}: Bun native YAML is ${speedup.toFixed(2)}x faster than js-yaml`)
    }
    else if (speedup < 0.95) {
      console.log(`${name}: Bun native YAML is ${(1 / speedup).toFixed(2)}x slower than js-yaml`)
    }
    else {
      console.log(`${name}: Bun native YAML is comparable to js-yaml`)
    }
  }
}

console.log(`\n${'='.repeat(70)}\n`)
