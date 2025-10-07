import { Bench } from 'tinybench'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Our implementation
import { parseMarkdown } from '@stacksjs/markdown'

// Competitors
import { marked } from 'marked'
import MarkdownIt from 'markdown-it'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import { Converter as ShowdownConverter } from 'showdown'

// Initialize parsers
const md = new MarkdownIt()
const showdown = new ShowdownConverter()

// Load fixtures
const fixturesDir = join(import.meta.dir, '../fixtures')
const smallMarkdown = readFileSync(join(fixturesDir, 'small.md'), 'utf-8')
const mediumMarkdown = readFileSync(join(fixturesDir, 'medium.md'), 'utf-8')
const largeMarkdown = readFileSync(join(fixturesDir, 'large.md'), 'utf-8')

async function remarkParse(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkHtml)
    .process(markdown)
  return String(result)
}

function formatResult(name: string, bench: any) {
  const opsPerSec = (1000000000 / bench.mean).toFixed(0)
  const timeMs = (bench.mean / 1000000).toFixed(3)
  return `${name.padEnd(25)} ${opsPerSec.padStart(10)} ops/sec  ±${bench.rme.toFixed(2)}%  (${timeMs}ms avg)`
}

console.log('\n📊 Markdown Parsing Benchmarks\n')
console.log('=' .repeat(70))

// Small document benchmark
console.log('\n📄 Small Document (< 1KB)\n')
const smallBench = new Bench({ time: 1000 })

smallBench
  .add('@stacksjs/markdown', () => {
    parseMarkdown(smallMarkdown)
  })
  .add('marked', () => {
    marked.parse(smallMarkdown)
  })
  .add('markdown-it', () => {
    md.render(smallMarkdown)
  })
  .add('showdown', () => {
    showdown.makeHtml(smallMarkdown)
  })

await smallBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of smallBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

// Find fastest
const smallFastest = smallBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
)
console.log(`\n🏆 Fastest: ${smallFastest.name}`)

// Medium document benchmark
console.log('\n' + '='.repeat(70))
console.log('\n📄 Medium Document (~2-3KB)\n')
const mediumBench = new Bench({ time: 1000 })

mediumBench
  .add('@stacksjs/markdown', () => {
    parseMarkdown(mediumMarkdown)
  })
  .add('marked', () => {
    marked.parse(mediumMarkdown)
  })
  .add('markdown-it', () => {
    md.render(mediumMarkdown)
  })
  .add('showdown', () => {
    showdown.makeHtml(mediumMarkdown)
  })

await mediumBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of mediumBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const mediumFastest = mediumBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
)
console.log(`\n🏆 Fastest: ${mediumFastest.name}`)

// Large document benchmark
console.log('\n' + '='.repeat(70))
console.log('\n📄 Large Document (~50KB, 50 sections)\n')
const largeBench = new Bench({ time: 1000 })

largeBench
  .add('@stacksjs/markdown', () => {
    parseMarkdown(largeMarkdown)
  })
  .add('marked', () => {
    marked.parse(largeMarkdown)
  })
  .add('markdown-it', () => {
    md.render(largeMarkdown)
  })
  .add('showdown', () => {
    showdown.makeHtml(largeMarkdown)
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
  { name: 'Small', bench: smallBench },
  { name: 'Medium', bench: mediumBench },
  { name: 'Large', bench: largeBench },
]

for (const { name, bench } of allBenches) {
  const stacksjsTask = bench.tasks.find(t => t.name === '@stacksjs/markdown')
  const fastest = bench.tasks.reduce((a, b) =>
    (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
  )

  if (stacksjsTask && fastest && stacksjsTask.result && fastest.result) {
    if (stacksjsTask.name === fastest.name) {
      console.log(`${name}: @stacksjs/markdown is the fastest`)
    } else {
      const speedup = stacksjsTask.result.mean / fastest.result.mean
      if (speedup < 1.05) {
        console.log(`${name}: @stacksjs/markdown is comparable to ${fastest.name}`)
      } else {
        console.log(`${name}: @stacksjs/markdown is ${speedup.toFixed(2)}x slower than ${fastest.name}`)
      }
    }
  }
}

console.log('\n' + '='.repeat(70) + '\n')
