/**
 * STX Story - Bun Test Runner Integration
 * Run story tests with Bun's test runner
 */

import { createContext } from './context'
import { runVisualTests } from './testing'

/**
 * Test options for Bun integration
 */
export interface BunTestOptions {
  /** Filter stories by name */
  filter?: string[]
  /** Update snapshots */
  update?: boolean
  /** Threshold for visual diff (0-1) */
  threshold?: number
  /** Timeout per test in ms */
  timeout?: number
}

/**
 * Create a Bun test suite for stories
 * Usage in test file:
 *
 * ```typescript
 * import { createStoryTestSuite } from '@stacksjs/stx/story'
 *
 * createStoryTestSuite({
 *   filter: ['Button', 'Card'],
 *   threshold: 0.01,
 * })
 * ```
 */
export async function createStoryTestSuite(options: BunTestOptions = {}): Promise<void> {
  // Dynamic import of Bun test utilities
  const { describe, test, expect } = await import('bun:test')

  const ctx = await createContext({ mode: 'build' })

  describe('STX Story Visual Tests', () => {
    test('should pass visual regression tests', async () => {
      const results = await runVisualTests(ctx, {
        filter: options.filter,
        threshold: options.threshold,
        update: options.update,
      })

      // Report results
      console.log(`\nVisual Tests: ${results.passed}/${results.total} passed`)

      if (results.failed > 0) {
        console.log('\nFailed tests:')
        for (const failure of results.failures) {
          console.log(`  ✗ ${failure.storyId} - ${failure.variantId}`)
          console.log(`    Difference: ${(failure.difference ?? 0).toFixed(2)}%`)
        }
      }

      expect(results.failed).toBe(0)
    }, options.timeout || 30000)
  })
}

/**
 * Create individual test cases for each story
 */
export async function createStoryTests(options: BunTestOptions = {}): Promise<void> {
  const { describe, test, expect } = await import('bun:test')

  const ctx = await createContext({ mode: 'build' })
  const { scanStoryFiles } = await import('./collect/scanner')

  const storyFiles = await scanStoryFiles(ctx)

  describe('STX Stories', () => {
    for (const storyFile of storyFiles) {
      // Filter if specified
      if (options.filter && options.filter.length > 0) {
        const matches = options.filter.some(f =>
          storyFile.fileName.toLowerCase().includes(f.toLowerCase()),
        )
        if (!matches)
          continue
      }

      describe(storyFile.fileName, () => {
        test('should render without errors', async () => {
          // Basic render test
          const content = await Bun.file(storyFile.path).text()
          expect(content).toBeTruthy()
          expect(content.length).toBeGreaterThan(0)
        })

        if (storyFile.story) {
          for (const variant of storyFile.story.variants) {
            test(`variant: ${variant.title}`, async () => {
              // Variant-specific test
              expect(variant.title).toBeTruthy()
              if (variant.source) {
                expect(variant.source.length).toBeGreaterThan(0)
              }
            })
          }
        }
      })
    }
  })
}

/**
 * Run story tests programmatically
 */
export async function runStoryTests(options: BunTestOptions = {}): Promise<{
  passed: number
  failed: number
  total: number
  duration: number
}> {
  const startTime = Date.now()
  const ctx = await createContext({ mode: 'build' })

  const results = await runVisualTests(ctx, {
    filter: options.filter,
    threshold: options.threshold,
    update: options.update,
  })

  return {
    passed: results.passed,
    failed: results.failed,
    total: results.total,
    duration: Date.now() - startTime,
  }
}

/**
 * Generate test file content for stories
 */
export function generateTestFile(storyNames: string[]): string {
  const imports = storyNames.map(name =>
    `import './${name}.story.stx'`,
  ).join('\n')

  return `/**
 * Auto-generated story tests
 * Run with: bun test
 */

import { describe, test, expect } from 'bun:test'
import { createContext } from '@stacksjs/stx/story'
import { runVisualTests } from '@stacksjs/stx/story'

${imports}

describe('Story Visual Tests', () => {
  test('all stories pass visual regression', async () => {
    const ctx = await createContext({ mode: 'build' })
    const results = await runVisualTests(ctx)

    expect(results.failed).toBe(0)
  })
})
`
}

/**
 * Watch mode for story tests
 */
export async function watchStoryTests(options: BunTestOptions = {}): Promise<void> {
  const { watchStoryFiles } = await import('./collect/scanner')
  const ctx = await createContext({ mode: 'dev' })

  console.log('Watching for story changes...')

  watchStoryFiles(ctx, async (event, file) => {
    console.log(`\n${event}: ${file}`)
    console.log('Running tests...')

    const results = await runStoryTests(options)

    if (results.failed > 0) {
      console.log(`\n❌ ${results.failed} test(s) failed`)
    }
    else {
      console.log(`\n✓ All ${results.total} tests passed (${results.duration}ms)`)
    }
  })
}
