/**
 * STX Story - Visual Regression Testing
 * Snapshot-based testing for component renders
 */

import type { ServerStoryFile, StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { checkA11y } from '../a11y'

/**
 * Test options
 */
export interface TestOptions {
  /** Update snapshots instead of comparing */
  update?: boolean
  /** Only test specific components */
  filter?: string[]
  /** Threshold for pixel difference (0-1) */
  threshold?: number
  /** Directory to store snapshots */
  snapshotDir?: string
}

/**
 * Test result
 */
export interface TestResult {
  /** Total number of tests */
  total: number
  /** Number of passed tests */
  passed: number
  /** Number of failed tests */
  failed: number
  /** Number of new snapshots */
  new: number
  /** Test failures */
  failures: TestFailure[]
  /** Duration in milliseconds */
  duration: number
}

/**
 * Test failure details
 */
export interface TestFailure {
  /** Story ID */
  storyId: string
  /** Variant ID */
  variantId: string
  /** Component name */
  component: string
  /** Error message */
  message: string
  /** Path to diff image (if applicable) */
  diffPath?: string
  /** Difference percentage */
  difference?: number
}

/**
 * Snapshot metadata
 */
export interface SnapshotMeta {
  /** Story ID */
  storyId: string
  /** Variant ID */
  variantId: string
  /** Component name */
  component: string
  /** Timestamp of snapshot creation */
  timestamp: number
  /** Hash of the rendered content */
  hash: string
}

/**
 * Run visual regression tests
 */
export async function runVisualTests(
  ctx: StoryContext,
  options: TestOptions = {},
): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    total: 0,
    passed: 0,
    failed: 0,
    new: 0,
    failures: [],
    duration: 0,
  }

  const snapshotDir = options.snapshotDir || path.join(ctx.root, '.stx', 'story', 'snapshots')

  // Ensure snapshot directory exists
  await fs.promises.mkdir(snapshotDir, { recursive: true })

  // Filter stories if specified
  let storyFiles = ctx.storyFiles
  if (options.filter && options.filter.length > 0) {
    storyFiles = storyFiles.filter(f =>
      options.filter!.some(filter =>
        f.fileName.toLowerCase().includes(filter.toLowerCase()),
      ),
    )
  }

  // Test each story
  for (const storyFile of storyFiles) {
    await testStoryFile(storyFile, snapshotDir, options, result)
  }

  result.duration = Date.now() - startTime
  return result
}

/**
 * Test a single story file
 */
async function testStoryFile(
  storyFile: ServerStoryFile,
  snapshotDir: string,
  options: TestOptions,
  result: TestResult,
): Promise<void> {
  const story = storyFile.story
  if (!story) {
    // No parsed story data, skip
    return
  }

  for (const variant of story.variants) {
    result.total++

    const snapshotPath = path.join(
      snapshotDir,
      `${storyFile.id}-${variant.id}.snap`,
    )

    // Generate current render hash
    const currentHash = generateHash(variant.source || '')

    // Check if snapshot exists
    const snapshotExists = await fileExists(snapshotPath)

    if (options.update || !snapshotExists) {
      // Create or update snapshot
      const meta: SnapshotMeta = {
        storyId: storyFile.id,
        variantId: variant.id,
        component: storyFile.fileName,
        timestamp: Date.now(),
        hash: currentHash,
      }

      await fs.promises.writeFile(
        snapshotPath,
        JSON.stringify(meta, null, 2),
      )

      if (!snapshotExists) {
        result.new++
      }
      result.passed++
    }
    else {
      // Compare with existing snapshot
      try {
        const snapshotContent = await fs.promises.readFile(snapshotPath, 'utf-8')
        const snapshot: SnapshotMeta = JSON.parse(snapshotContent)

        if (snapshot.hash === currentHash) {
          result.passed++
        }
        else {
          result.failed++
          result.failures.push({
            storyId: storyFile.id,
            variantId: variant.id,
            component: storyFile.fileName,
            message: 'Snapshot mismatch',
            difference: calculateDifference(snapshot.hash, currentHash),
          })
        }
      }
      catch (error) {
        result.failed++
        result.failures.push({
          storyId: storyFile.id,
          variantId: variant.id,
          component: storyFile.fileName,
          message: `Error reading snapshot: ${error}`,
        })
      }
    }
  }
}

/**
 * Update all snapshots
 */
export async function updateSnapshots(
  ctx: StoryContext,
  options: TestOptions = {},
): Promise<number> {
  const result = await runVisualTests(ctx, { ...options, update: true })
  return result.total
}

/**
 * Generate a hash from content
 */
function generateHash(content: string): string {
  // Simple hash function (for production, use crypto)
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(16)
}

/**
 * Calculate difference between two hashes (simplified)
 */
function calculateDifference(hash1: string, hash2: string): number {
  if (hash1 === hash2)
    return 0
  // Simple difference calculation
  const diff = Math.abs(Number.parseInt(hash1, 16) - Number.parseInt(hash2, 16))
  return Math.min(diff / 1000000, 1) // Normalize to 0-1
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath)
    return true
  }
  catch {
    return false
  }
}

/**
 * Format test results for console output
 */
export function formatTestResults(result: TestResult): string {
  const lines: string[] = []

  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('  STX Story Visual Regression Tests')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  if (result.failures.length > 0) {
    lines.push('  ❌ Failures:')
    lines.push('')
    for (const failure of result.failures) {
      lines.push(`    • ${failure.component} / ${failure.variantId}`)
      lines.push(`      ${failure.message}`)
      if (failure.difference !== undefined) {
        lines.push(`      Difference: ${(failure.difference * 100).toFixed(2)}%`)
      }
      lines.push('')
    }
  }

  lines.push('  Summary:')
  lines.push(`    Total:  ${result.total}`)
  lines.push(`    Passed: ${result.passed} ✓`)
  lines.push(`    Failed: ${result.failed} ✗`)
  if (result.new > 0) {
    lines.push(`    New:    ${result.new} ⚡`)
  }
  lines.push(`    Time:   ${result.duration}ms`)
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  return lines.join('\n')
}

/**
 * Run accessibility tests on stories
 */
export async function runA11yTests(
  ctx: StoryContext,
  _options: TestOptions = {},
): Promise<TestResult> {
  const startTime = performance.now()
  const failures: TestFailure[] = []
  let passed = 0
  let failed = 0

  // Test each story file for accessibility violations
  for (const storyFile of ctx.storyFiles) {
    try {
      // Read the rendered HTML content
      const htmlContent = await Bun.file(storyFile.path).text()

      // Run accessibility checks
      const violations = await checkA11y(htmlContent, storyFile.path)

      if (violations.length > 0) {
        // Record failures for each violation
        for (const violation of violations) {
          failures.push({
            storyId: storyFile.id,
            variantId: 'default',
            component: storyFile.component,
            message: `A11y: ${violation.message}`,
            expected: 'No accessibility violations',
            actual: `${violation.type}: ${violation.message} (impact: ${violation.impact})`,
          })
        }
        failed++
      }
      else {
        passed++
      }
    }
    catch (error) {
      // If we can't read the file, record it as a failure
      failures.push({
        storyId: storyFile.id,
        variantId: 'default',
        component: storyFile.component,
        message: `Failed to check a11y: ${error instanceof Error ? error.message : String(error)}`,
        expected: 'File readable for a11y check',
        actual: 'File read error',
      })
      failed++
    }
  }

  const duration = performance.now() - startTime

  return {
    total: ctx.storyFiles.length,
    passed,
    failed,
    new: 0,
    failures,
    duration,
  }
}
