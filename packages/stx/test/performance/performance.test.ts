/* eslint-disable no-console */
import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createTestFile, setupTestDirs } from '../utils'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
  cache: false, // Disable cache for consistent performance tests
}

// Helper function to process a template with our test options
async function processTemplate(template: string, context: Record<string, any> = {}, filePath: string = 'test.stx', options: StxOptions = defaultOptions): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

// Benchmark function to measure execution time
async function benchmark<T>(fn: () => Promise<T>, iterations: number = 1): Promise<{ result: T, averageTime: number }> {
  const times: number[] = []
  let result: T

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    result = await fn()
    const end = performance.now()
    times.push(end - start)
  }

  // Calculate average time (excluding the first run which might include JIT compilation)
  const averageTime = times.slice(1).reduce((sum, time) => sum + time, 0) / (times.length - 1 || 1)

  return { result: result!, averageTime }
}

describe('STX Performance Tests', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  describe('Template Rendering Performance', () => {
    it('should render simple templates efficiently', async () => {
      const template = `<div>Hello, {{ name }}!</div>`

      const { averageTime } = await benchmark(
        () => processTemplate(template, { name: 'World' }),
        100, // Run 100 iterations for more accurate measurement
      )

      // Check that rendering is fast enough (adjust threshold as needed)
      expect(averageTime).toBeLessThan(5) // Should be under 5ms

      console.log(`Simple template average render time: ${averageTime.toFixed(3)}ms`)
    })

    it('should handle large templates efficiently', async () => {
      // Create a large template with many expressions and directives
      let largeTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>{{ pageTitle }}</title>
      </head>
      <body>
        <header>
          <h1>{{ siteTitle }}</h1>
          <nav>
            <ul>
              @foreach(menuItems as item)
                <li class="{{ currentPage === item.id ? 'active' : '' }}">
                  <a href="{{ item.url }}">{{ item.label }}</a>
                </li>
              @endforeach
            </ul>
          </nav>
        </header>
        <main>
      `

      // Add many repeating sections
      for (let i = 0; i < 50; i++) {
        largeTemplate += `
          <section id="section-${i}">
            <h2>Section {{ i+1 }}</h2>
            @if(sections[${i}].visible)
              <div class="content">
                <p>{{ sections[${i}].content }}</p>
                @if(sections[${i}].hasDetails)
                  <div class="details">
                    {{ sections[${i}].details }}
                  </div>
                @endif
              </div>
            @endif
          </section>
        `
      }

      largeTemplate += `
        </main>
        <footer>
          <p>&copy; {{ currentYear }} {{ companyName }}</p>
        </footer>
      </body>
      </html>
      `

      // Create test data with many items
      const context = {
        pageTitle: 'Performance Test',
        siteTitle: 'STX Template Engine',
        currentPage: 'home',
        menuItems: Array.from({ length: 10 }, (_, i) => ({
          id: `page-${i}`,
          url: `/page-${i}`,
          label: `Page ${i}`,
        })),
        sections: Array.from({ length: 50 }, (_, i) => ({
          visible: i % 3 === 0, // Only show every third section
          content: `This is the content for section ${i + 1}.`,
          hasDetails: i % 2 === 0,
          details: `These are the details for section ${i + 1}.`,
        })),
        currentYear: new Date().getFullYear(),
        companyName: 'Stacks JS',
        i: 0, // For the loop
      }

      const { averageTime } = await benchmark(
        () => processTemplate(largeTemplate, context),
        20, // Fewer iterations for large template
      )

      // Adjust threshold as needed based on expected performance
      expect(averageTime).toBeLessThan(100) // Should be under 100ms

      console.log(`Large template average render time: ${averageTime.toFixed(3)}ms`)
    })

    it('should maintain performance with nested directives', async () => {
      // Create a template with deeply nested conditionals
      let template = '<div>\n'

      // Create nested if statements 10 levels deep
      for (let i = 0; i < 10; i++) {
        template += `  ${'  '.repeat(i)}@if(level${i})\n`
      }

      // Add content at the deepest level
      template += `  ${'  '.repeat(10)}<p>Deeply nested content</p>\n`

      // Close all the if statements
      for (let i = 9; i >= 0; i--) {
        template += `  ${'  '.repeat(i)}@endif\n`
      }

      template += '</div>'

      // All conditions are true to ensure the deepest content renders
      const context = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`level${i}`, true]),
      )

      const { averageTime } = await benchmark(
        () => processTemplate(template, context),
        50,
      )

      expect(averageTime).toBeLessThan(10) // Should be under 10ms

      console.log(`Nested directives average render time: ${averageTime.toFixed(3)}ms`)
    })

    it('should efficiently process templates with many expressions', async () => {
      // Create a template with many expressions
      let template = '<table>\n'

      // Add 100 rows with multiple expressions each
      for (let i = 0; i < 100; i++) {
        template += `  <tr class="{{ i % 2 === 0 ? 'even' : 'odd' }}">\n`
        template += `    <td>{{ i+1 }}</td>\n`
        template += `    <td>{{ items[${i}].name }}</td>\n`
        template += `    <td>{{ items[${i}].value.toFixed(2) }}</td>\n`
        template += `    <td>{{ items[${i}].value > 50 ? 'High' : 'Low' }}</td>\n`
        template += `  </tr>\n`
      }

      template += '</table>'

      // Create test data
      const context = {
        items: Array.from({ length: 100 }, (_, i) => ({
          name: `Item ${i + 1}`,
          value: Math.random() * 100,
        })),
        i: 0, // For the loop counter
      }

      const { averageTime } = await benchmark(
        () => processTemplate(template, context),
        30,
      )

      expect(averageTime).toBeLessThan(50) // Should be under 50ms

      console.log(`Many expressions average render time: ${averageTime.toFixed(3)}ms`)
    })
  })

  describe('Cache Performance', () => {
    it('should handle caching correctly', async () => {
      // Use a very simple template to avoid directive errors
      const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>{{ pageTitle }}</title>
      </head>
      <body>
        <h1>{{ heading }}</h1>
        <div class="content">{{ content }}</div>
      </body>
      </html>
      `

      const context = {
        pageTitle: 'Cache Test',
        heading: 'Test Heading',
        content: 'This is test content.',
      }

      // Create unique test file paths
      const cachePath = 'test/temp/cache-test.stx'
      const noCachePath = 'test/temp/no-cache-test.stx'

      // First run with cache disabled
      const uncachedResult = await processTemplate(template, context, noCachePath, {
        ...defaultOptions,
        cache: false,
      })

      // Run with cache enabled to populate the cache
      await processTemplate(template, context, cachePath, {
        ...defaultOptions,
        cache: true,
      })

      // Second run with cache enabled should use the cached version
      const cachedResult = await processTemplate(template, context, cachePath, {
        ...defaultOptions,
        cache: true,
      })

      // Verify both results are correct
      expect(uncachedResult).toContain('Test Heading')
      expect(uncachedResult).toContain('This is test content')

      expect(cachedResult).toContain('Test Heading')
      expect(cachedResult).toContain('This is test content')

      // For informational purposes only, measure performance
      const { averageTime: timeWithoutCache } = await benchmark(
        () => processTemplate(template, context, noCachePath, {
          ...defaultOptions,
          cache: false,
        }),
        10,
      )

      const { averageTime: timeWithCache } = await benchmark(
        () => processTemplate(template, context, cachePath, {
          ...defaultOptions,
          cache: true,
        }),
        10,
      )

      console.log(`Without cache: ${timeWithoutCache.toFixed(3)}ms, With cache: ${timeWithCache.toFixed(3)}ms`)

      // Calculate improvement percentage (for information only)
      const improvement = ((timeWithoutCache - timeWithCache) / timeWithoutCache) * 100
      console.log(`Cache performance improvement: ${improvement.toFixed(2)}%`)
    })
  })

  describe('Component Performance', () => {
    it('should efficiently render templates with many components', async () => {
      // Create a component file
      await createTestFile('components/card.stx', `
      <div class="card">
        <div class="card-header">{{ title }}</div>
        <div class="card-body">
          <p>{{ content }}</p>
          @if(hasFooter)
            <div class="card-footer">{{ footer }}</div>
          @endif
        </div>
      </div>
      `)

      // Create a template that uses many components
      let template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Component Performance</title>
      </head>
      <body>
        <h1>Components Test</h1>
        <div class="container">
      `

      // Add 20 components
      for (let i = 0; i < 20; i++) {
        template += `
          <@component path="card"
            title="Card ${i + 1}"
            content="This is card ${i + 1} content"
            hasFooter="${i % 2 === 0}"
            footer="Footer for card ${i + 1}" />
        `
      }

      template += `
        </div>
      </body>
      </html>
      `

      const { averageTime } = await benchmark(
        () => processTemplate(template, {}, 'components-test.stx', {
          ...defaultOptions,
          componentsDir: 'components',
        }),
        10,
      )

      // Adjust threshold based on actual performance
      expect(averageTime).toBeLessThan(200) // Should be under 200ms

      console.log(`Component rendering average time: ${averageTime.toFixed(3)}ms`)
    })
  })
})
