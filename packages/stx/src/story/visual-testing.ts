/**
 * STX Story - Visual Testing with Screenshots
 * Uses very-happy-dom for zero-dependency screenshot capture
 */

import type { ServerStoryFile, StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Visual test options
 */
export interface VisualTestOptions {
  /** Update snapshots instead of comparing */
  update?: boolean
  /** Threshold for pixel difference (0-1) */
  threshold?: number
  /** Directory to store snapshots */
  snapshotDir?: string
  /** Viewport width */
  width?: number
  /** Viewport height */
  height?: number
  /** Device scale factor */
  deviceScaleFactor?: number
  /** Only test specific components */
  filter?: string[]
}

/**
 * Visual test result
 */
export interface VisualTestResult {
  /** Total number of tests */
  total: number
  /** Number of passed tests */
  passed: number
  /** Number of failed tests */
  failed: number
  /** Number of new snapshots */
  new: number
  /** Test failures */
  failures: VisualTestFailure[]
  /** Duration in milliseconds */
  duration: number
}

/**
 * Visual test failure
 */
export interface VisualTestFailure {
  /** Story ID */
  storyId: string
  /** Variant ID */
  variantId: string
  /** Component name */
  component: string
  /** Error message */
  message: string
  /** Path to baseline image */
  baselinePath?: string
  /** Path to actual image */
  actualPath?: string
  /** Path to diff image */
  diffPath?: string
  /** Difference percentage */
  diffPercentage?: number
}

/**
 * Run visual regression tests
 */
export async function runScreenshotTests(
  ctx: StoryContext,
  options: VisualTestOptions = {},
): Promise<VisualTestResult> {
  const startTime = performance.now()
  const {
    update = false,
    threshold = 0.1,
    snapshotDir = path.join(ctx.root, '.stx', 'story', 'snapshots'),
    width = 800,
    height = 600,
    deviceScaleFactor = 1,
    filter,
  } = options

  const result: VisualTestResult = {
    total: 0,
    passed: 0,
    failed: 0,
    new: 0,
    failures: [],
    duration: 0,
  }

  // Ensure snapshot directory exists
  await fs.promises.mkdir(snapshotDir, { recursive: true })

  // Import very-happy-dom dynamically
  let vhd: any
  try {
    vhd = await import('very-happy-dom')
  }
  catch {
    console.warn('very-happy-dom not installed, using fallback HTML comparison')
    return runHtmlComparisonTests(ctx, options)
  }

  const { HtmlRenderer, ImageDiff } = vhd
  const renderer = new HtmlRenderer()
  const differ = new ImageDiff()

  // Get stories to test
  const stories = filter
    ? ctx.storyFiles.filter(f => filter.some(p => f.fileName.includes(p)))
    : ctx.storyFiles

  for (const story of stories) {
    const variants = story.story?.variants || [{ id: 'default', title: 'Default', state: {} }]

    for (const variant of variants) {
      result.total++

      const snapshotPath = path.join(
        snapshotDir,
        `${story.fileName}-${variant.id}.png`,
      )
      const actualPath = path.join(
        snapshotDir,
        `${story.fileName}-${variant.id}.actual.png`,
      )
      const diffPath = path.join(
        snapshotDir,
        `${story.fileName}-${variant.id}.diff.png`,
      )

      try {
        // Render the component
        const html = await renderStoryToHtml(ctx, story, variant.id)

        // Capture screenshot
        const screenshot = await renderer.render(html, {
          width,
          height,
          deviceScaleFactor,
          format: 'png',
        })

        const snapshotExists = await fileExists(snapshotPath)

        if (update || !snapshotExists) {
          // Save new snapshot
          await fs.promises.writeFile(snapshotPath, screenshot.data)

          if (!snapshotExists) {
            result.new++
          }
          result.passed++
        }
        else {
          // Compare with baseline
          const baseline = await fs.promises.readFile(snapshotPath)
          const comparison = await differ.compare(baseline, screenshot.data, {
            threshold,
          })

          if (comparison.match) {
            result.passed++
            // Clean up any previous actual/diff files
            await safeUnlink(actualPath)
            await safeUnlink(diffPath)
          }
          else {
            result.failed++

            // Save actual and diff images
            await fs.promises.writeFile(actualPath, screenshot.data)
            if (comparison.diffImage) {
              await fs.promises.writeFile(diffPath, comparison.diffImage)
            }

            result.failures.push({
              storyId: story.id,
              variantId: variant.id,
              component: story.fileName,
              message: `Visual difference: ${comparison.diffPercentage.toFixed(2)}% pixels differ`,
              baselinePath: snapshotPath,
              actualPath,
              diffPath,
              diffPercentage: comparison.diffPercentage,
            })
          }
        }
      }
      catch (error) {
        result.failed++
        result.failures.push({
          storyId: story.id,
          variantId: variant.id,
          component: story.fileName,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  result.duration = performance.now() - startTime
  return result
}

/**
 * Fallback HTML comparison when very-happy-dom is not available
 */
async function runHtmlComparisonTests(
  ctx: StoryContext,
  options: VisualTestOptions,
): Promise<VisualTestResult> {
  const startTime = performance.now()
  const {
    update = false,
    snapshotDir = path.join(ctx.root, '.stx', 'story', 'snapshots'),
    filter,
  } = options

  const result: VisualTestResult = {
    total: 0,
    passed: 0,
    failed: 0,
    new: 0,
    failures: [],
    duration: 0,
  }

  await fs.promises.mkdir(snapshotDir, { recursive: true })

  const stories = filter
    ? ctx.storyFiles.filter(f => filter.some(p => f.fileName.includes(p)))
    : ctx.storyFiles

  for (const story of stories) {
    const variants = story.story?.variants || [{ id: 'default', title: 'Default', state: {} }]

    for (const variant of variants) {
      result.total++

      const snapshotPath = path.join(
        snapshotDir,
        `${story.fileName}-${variant.id}.html`,
      )

      try {
        const html = await renderStoryToHtml(ctx, story, variant.id)
        const snapshotExists = await fileExists(snapshotPath)

        if (update || !snapshotExists) {
          await fs.promises.writeFile(snapshotPath, html)
          if (!snapshotExists) {
            result.new++
          }
          result.passed++
        }
        else {
          const baseline = await fs.promises.readFile(snapshotPath, 'utf-8')
          const normalizedBaseline = normalizeHtml(baseline)
          const normalizedActual = normalizeHtml(html)

          if (normalizedBaseline === normalizedActual) {
            result.passed++
          }
          else {
            result.failed++
            result.failures.push({
              storyId: story.id,
              variantId: variant.id,
              component: story.fileName,
              message: 'HTML content differs from baseline',
              baselinePath: snapshotPath,
            })
          }
        }
      }
      catch (error) {
        result.failed++
        result.failures.push({
          storyId: story.id,
          variantId: variant.id,
          component: story.fileName,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  result.duration = performance.now() - startTime
  return result
}

/**
 * Render a story variant to HTML
 */
async function renderStoryToHtml(
  ctx: StoryContext,
  story: ServerStoryFile,
  variantId: string,
): Promise<string> {
  // Try to use the renderer module
  try {
    const { renderStoryVariant, generatePreviewDocument } = await import('./renderer')
    const result = await renderStoryVariant(ctx, story, variantId)
    return generatePreviewDocument(result, { title: story.fileName })
  }
  catch {
    // Fallback to reading raw content
    const content = await fs.promises.readFile(story.path, 'utf-8')
    return `<!DOCTYPE html><html><head><title>${story.fileName}</title></head><body>${content}</body></html>`
  }
}

/**
 * Normalize HTML for comparison
 */
function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

/**
 * Check if file exists
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
 * Safely unlink a file (ignore errors)
 */
async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath)
  }
  catch {
    // Ignore
  }
}

/**
 * Generate visual test report HTML
 */
export function generateVisualTestReport(result: VisualTestResult): string {
  const statusClass = result.failed > 0 ? 'failed' : 'passed'

  const failureRows = result.failures.map(f => `
    <tr class="failure-row">
      <td>${f.component}</td>
      <td>${f.variantId}</td>
      <td>${f.message}</td>
      <td>${f.diffPercentage ? `${f.diffPercentage.toFixed(2)}%` : '-'}</td>
      <td>
        ${f.baselinePath ? `<a href="file://${f.baselinePath}">Baseline</a>` : ''}
        ${f.actualPath ? `<a href="file://${f.actualPath}">Actual</a>` : ''}
        ${f.diffPath ? `<a href="file://${f.diffPath}">Diff</a>` : ''}
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <title>Visual Test Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; }
    .summary { padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .summary.passed { background: #d4edda; }
    .summary.failed { background: #f8d7da; }
    .stats { display: flex; gap: 20px; margin-top: 10px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .failure-row { background: #fff5f5; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>Visual Test Report</h1>

  <div class="summary ${statusClass}">
    <h2>${result.failed > 0 ? '❌ Tests Failed' : '✅ All Tests Passed'}</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${result.total}</div>
        <div>Total</div>
      </div>
      <div class="stat">
        <div class="stat-value">${result.passed}</div>
        <div>Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${result.failed}</div>
        <div>Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${result.new}</div>
        <div>New</div>
      </div>
      <div class="stat">
        <div class="stat-value">${result.duration.toFixed(0)}ms</div>
        <div>Duration</div>
      </div>
    </div>
  </div>

  ${result.failures.length > 0
    ? `
  <h2>Failures</h2>
  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Variant</th>
        <th>Message</th>
        <th>Diff %</th>
        <th>Images</th>
      </tr>
    </thead>
    <tbody>
      ${failureRows}
    </tbody>
  </table>
  `
    : ''}
</body>
</html>`
}
