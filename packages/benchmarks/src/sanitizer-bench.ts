import { Bench } from 'tinybench'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'

// Our implementation
import { sanitize } from '@stacksjs/sanitizer'

// Competitors
import DOMPurify from 'isomorphic-dompurify'
import sanitizeHtml from 'sanitize-html'
import { filterXSS } from 'xss'

// Setup JSDOM for DOMPurify
const { window } = new JSDOM('<!DOCTYPE html>')

// Load fixtures
const fixturesDir = join(import.meta.dir, '../fixtures')
const safeHtml = readFileSync(join(fixturesDir, 'html-safe.html'), 'utf-8')
const dangerousHtml = readFileSync(join(fixturesDir, 'html-dangerous.html'), 'utf-8')

// Create a large HTML document for stress testing
const largeHtml = `
<div class="container">
  ${Array.from({ length: 100 }, (_, i) => `
    <article class="post-${i}">
      <h2>Article ${i}</h2>
      <p>This is paragraph ${i} with <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
      <a href="https://example.com/article/${i}">Read more</a>
      <img src="https://example.com/image${i}.jpg" alt="Image ${i}">
    </article>
  `).join('\n')}
</div>
`

function formatResult(name: string, bench: any) {
  const opsPerSec = (1000000000 / bench.mean).toFixed(0)
  const timeMs = (bench.mean / 1000000).toFixed(3)
  return `${name.padEnd(25)} ${opsPerSec.padStart(10)} ops/sec  ±${bench.rme.toFixed(2)}%  (${timeMs}ms avg)`
}

console.log('\n📊 HTML Sanitization Benchmarks\n')
console.log('='.repeat(70))

// Safe HTML benchmark
console.log('\n📄 Safe HTML (no XSS)\n')
const safeBench = new Bench({ time: 1000 })

safeBench
  .add('@stacksjs/sanitizer', () => {
    sanitize(safeHtml, 'basic')
  })
  .add('DOMPurify', () => {
    DOMPurify.sanitize(safeHtml)
  })
  .add('sanitize-html', () => {
    sanitizeHtml(safeHtml)
  })
  .add('xss', () => {
    filterXSS(safeHtml)
  })

await safeBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of safeBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const safeFastest = safeBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
)
console.log(`\n🏆 Fastest: ${safeFastest.name}`)

// Dangerous HTML benchmark
console.log('\n' + '='.repeat(70))
console.log('\n📄 Dangerous HTML (with XSS attempts)\n')
const dangerousBench = new Bench({ time: 1000 })

dangerousBench
  .add('@stacksjs/sanitizer', () => {
    sanitize(dangerousHtml, 'basic')
  })
  .add('DOMPurify', () => {
    DOMPurify.sanitize(dangerousHtml)
  })
  .add('sanitize-html', () => {
    sanitizeHtml(dangerousHtml)
  })
  .add('xss', () => {
    filterXSS(dangerousHtml)
  })

await dangerousBench.run()

console.log('Library                     Operations     Speed')
console.log('-'.repeat(70))
for (const task of dangerousBench.tasks) {
  console.log(formatResult(task.name, task.result!))
}

const dangerousFastest = dangerousBench.tasks.reduce((a, b) =>
  (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
)
console.log(`\n🏆 Fastest: ${dangerousFastest.name}`)

// Large HTML benchmark
console.log('\n' + '='.repeat(70))
console.log('\n📄 Large HTML (100 articles, ~15KB)\n')
const largeBench = new Bench({ time: 1000 })

largeBench
  .add('@stacksjs/sanitizer', () => {
    sanitize(largeHtml, 'basic')
  })
  .add('DOMPurify', () => {
    DOMPurify.sanitize(largeHtml)
  })
  .add('sanitize-html', () => {
    sanitizeHtml(largeHtml)
  })
  .add('xss', () => {
    filterXSS(largeHtml)
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
  { name: 'Safe HTML', bench: safeBench },
  { name: 'Dangerous HTML', bench: dangerousBench },
  { name: 'Large HTML', bench: largeBench },
]

for (const { name, bench } of allBenches) {
  const stacksjsTask = bench.tasks.find(t => t.name === '@stacksjs/sanitizer')
  const fastest = bench.tasks.reduce((a, b) =>
    (a.result?.mean || Infinity) < (b.result?.mean || Infinity) ? a : b
  )

  if (stacksjsTask && fastest && stacksjsTask.result && fastest.result) {
    const speedup = fastest.result.mean / stacksjsTask.result.mean
    if (speedup < 1) {
      console.log(`${name}: @stacksjs/sanitizer is ${(1 / speedup).toFixed(2)}x faster than ${fastest.name}`)
    } else if (speedup > 1.05) {
      console.log(`${name}: @stacksjs/sanitizer is ${speedup.toFixed(2)}x slower than ${fastest.name}`)
    } else {
      console.log(`${name}: @stacksjs/sanitizer is comparable to ${fastest.name}`)
    }
  }
}

console.log('\n' + '='.repeat(70) + '\n')
