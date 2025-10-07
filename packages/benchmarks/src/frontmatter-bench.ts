import { Bench } from 'tinybench'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Our implementation
import { parseFrontmatter } from '@stacksjs/markdown'

// Competitor
import grayMatter from 'gray-matter'

// Load fixture
const fixturesDir = join(import.meta.dir, '../fixtures')
const frontmatterContent = readFileSync(join(fixturesDir, 'frontmatter.md'), 'utf-8')

// Create a larger frontmatter document for stress testing
const largeFrontmatter = `---
${Array.from({ length: 100 }, (_, i) => `field${i}: value${i}\ntags${i}:\n  - tag1\n  - tag2\n  - tag3`).join('\n')}
---

# Content

This is the content after frontmatter.
`

function formatResult(name: string, bench: any) {
  const opsPerSec = (1000000000 / bench.mean).toFixed(0)
  const timeMs = (bench.mean / 1000000).toFixed(3)
  return `${name.padEnd(25)} ${opsPerSec.padStart(10)} ops/sec  ±${bench.rme.toFixed(2)}%  (${timeMs}ms avg)`
}

console.log('\n📊 Frontmatter Parsing Benchmarks\n')
console.log('='.repeat(70))

// Standard frontmatter benchmark
console.log('\n📄 Standard Frontmatter (15 fields)\n')
const standardBench = new Bench({ time: 1000 })

standardBench
  .add('@stacksjs/markdown', () => {
    parseFrontmatter(frontmatterContent)
  })
  .add('gray-matter', () => {
    grayMatter(frontmatterContent)
  })

await standardBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of standardBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const standardFastest = standardBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
)
console.log(`\n🏆 Fastest: ${standardFastest.name}`)

// Large frontmatter benchmark
console.log('\n' + '='.repeat(70))
console.log('\n📄 Large Frontmatter (100+ fields)\n')
const largeBench = new Bench({ time: 1000 })

largeBench
  .add('@stacksjs/markdown', () => {
    parseFrontmatter(largeFrontmatter)
  })
  .add('gray-matter', () => {
    grayMatter(largeFrontmatter)
  })

await largeBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of largeBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const largeFastest = largeBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
)
console.log(`\n🏆 Fastest: ${largeFastest.name}`)

// Summary
console.log('\n' + '='.repeat(70))
console.log('\n📈 Summary\n')

const allBenches = [
  { name: 'Standard', bench: standardBench },
  { name: 'Large', bench: largeBench },
]

for (const { name, bench } of allBenches) {
  const stacksjsTask = bench.tasks.find(t => t.name === '@stacksjs/markdown')
  const grayMatterTask = bench.tasks.find(t => t.name === 'gray-matter')

  if (stacksjsTask && grayMatterTask && stacksjsTask.result && grayMatterTask.result) {
    const speedup = grayMatterTask.result.mean / stacksjsTask.result.mean
    if (speedup > 1.05) {
      console.log(`${name}: @stacksjs/markdown is ${speedup.toFixed(2)}x faster than gray-matter`)
    } else if (speedup < 0.95) {
      console.log(`${name}: @stacksjs/markdown is ${(1 / speedup).toFixed(2)}x slower than gray-matter`)
    } else {
      console.log(`${name}: @stacksjs/markdown is comparable to gray-matter`)
    }
  }
}

console.log('\n' + '='.repeat(70) + '\n')
