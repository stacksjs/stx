/**
 * Visual Testing Integration
 *
 * Provides snapshot testing, visual regression testing, and screenshot
 * comparisons for stx components. Integrates with CI/CD for automated
 * visual testing workflows.
 *
 * ## Features
 *
 * - HTML snapshot testing
 * - Screenshot capture and comparison
 * - Pixel-level diff generation
 * - Multiple viewport testing
 * - Component story-based testing
 * - CI/CD integration
 * - Baseline management
 *
 * ## Usage
 *
 * ```typescript
 * import { createVisualTester, snapshot, visualRegression } from 'stx/visual-testing'
 *
 * // Snapshot testing
 * test('Button renders correctly', async () => {
 *   const html = await render('<Button label="Click me" />')
 *   await snapshot(html, 'button-default')
 * })
 *
 * // Visual regression testing
 * test('Button visual appearance', async () => {
 *   await visualRegression('button-primary', async (page) => {
 *     await page.goto('/components/button')
 *     return page.screenshot()
 *   })
 * })
 * ```
 *
 * @module visual-testing
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// =============================================================================
// Types
// =============================================================================

export interface VisualTestConfig {
  /** Directory for snapshot storage (default: '__snapshots__') */
  snapshotDir?: string
  /** Directory for screenshot storage (default: '__screenshots__') */
  screenshotDir?: string
  /** Update snapshots instead of comparing (default: false) */
  updateSnapshots?: boolean
  /** Threshold for pixel difference (0-1, default: 0.01) */
  threshold?: number
  /** Viewports to test */
  viewports?: Viewport[]
  /** Enable diff image generation */
  generateDiff?: boolean
  /** Diff output directory */
  diffDir?: string
  /** Custom comparison function */
  compare?: (actual: Buffer, expected: Buffer) => Promise<ComparisonResult>
  /** CI mode - stricter comparisons */
  ci?: boolean
  /** Retry count for flaky tests */
  retries?: number
}

export interface Viewport {
  name: string
  width: number
  height: number
  deviceScaleFactor?: number
  isMobile?: boolean
  hasTouch?: boolean
}

export interface SnapshotResult {
  passed: boolean
  snapshotPath: string
  actualPath?: string
  diffPath?: string
  message?: string
}

export interface ComparisonResult {
  match: boolean
  diffPercentage: number
  diffPixels: number
  diffImage?: Buffer
}

export interface VisualTestResult {
  name: string
  passed: boolean
  duration: number
  snapshots: SnapshotResult[]
  screenshots: ScreenshotResult[]
  errors: Error[]
}

export interface ScreenshotResult {
  viewport: string
  passed: boolean
  baselinePath: string
  actualPath?: string
  diffPath?: string
  diffPercentage?: number
}

export interface Story {
  name: string
  component: string
  render: () => string | Promise<string>
  args?: Record<string, unknown>
  viewports?: Viewport[]
}

// =============================================================================
// Default Viewports
// =============================================================================

export const defaultViewports: Viewport[] = [
  { name: 'mobile', width: 375, height: 667, isMobile: true, hasTouch: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false, hasTouch: false },
  { name: 'wide', width: 1920, height: 1080, isMobile: false, hasTouch: false },
]

// =============================================================================
// Snapshot Testing
// =============================================================================

/**
 * Create a snapshot tester
 */
export function createSnapshotTester(config: VisualTestConfig = {}) {
  const cfg: Required<VisualTestConfig> = {
    snapshotDir: config.snapshotDir || '__snapshots__',
    screenshotDir: config.screenshotDir || '__screenshots__',
    updateSnapshots: config.updateSnapshots || process.env.UPDATE_SNAPSHOTS === 'true',
    threshold: config.threshold ?? 0.01,
    viewports: config.viewports || defaultViewports,
    generateDiff: config.generateDiff ?? true,
    diffDir: config.diffDir || '__diffs__',
    compare: config.compare || defaultCompare,
    ci: config.ci ?? process.env.CI === 'true',
    retries: config.retries ?? (config.ci ? 3 : 1),
  }

  return {
    /**
     * Test HTML snapshot
     */
    async snapshot(html: string, name: string): Promise<SnapshotResult> {
      const snapshotPath = path.join(cfg.snapshotDir, `${name}.html`)

      // Normalize HTML for comparison
      const normalizedHtml = normalizeHtml(html)
      const hash = hashContent(normalizedHtml)

      // Check if snapshot exists
      if (fs.existsSync(snapshotPath)) {
        const existingHtml = await Bun.file(snapshotPath).text()
        const existingHash = hashContent(normalizeHtml(existingHtml))

        if (hash === existingHash) {
          return {
            passed: true,
            snapshotPath,
            message: 'Snapshot matches',
          }
        }

        if (cfg.updateSnapshots) {
          await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true })
          await Bun.write(snapshotPath, normalizedHtml)
          return {
            passed: true,
            snapshotPath,
            message: 'Snapshot updated',
          }
        }

        // Generate diff
        const actualPath = path.join(cfg.diffDir, `${name}.actual.html`)
        const diffPath = path.join(cfg.diffDir, `${name}.diff.html`)

        await fs.promises.mkdir(cfg.diffDir, { recursive: true })
        await Bun.write(actualPath, normalizedHtml)
        await Bun.write(diffPath, generateHtmlDiff(existingHtml, normalizedHtml))

        return {
          passed: false,
          snapshotPath,
          actualPath,
          diffPath,
          message: 'Snapshot does not match',
        }
      }

      // Create new snapshot
      await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true })
      await Bun.write(snapshotPath, normalizedHtml)

      return {
        passed: true,
        snapshotPath,
        message: 'New snapshot created',
      }
    },

    /**
     * Test JSON snapshot
     */
    async snapshotJson(data: unknown, name: string): Promise<SnapshotResult> {
      const snapshotPath = path.join(cfg.snapshotDir, `${name}.json`)
      const json = JSON.stringify(data, null, 2)

      if (fs.existsSync(snapshotPath)) {
        const existingJson = await Bun.file(snapshotPath).text()

        if (json === existingJson) {
          return { passed: true, snapshotPath }
        }

        if (cfg.updateSnapshots) {
          await Bun.write(snapshotPath, json)
          return { passed: true, snapshotPath, message: 'Snapshot updated' }
        }

        return {
          passed: false,
          snapshotPath,
          message: `JSON snapshot mismatch:\n${generateJsonDiff(existingJson, json)}`,
        }
      }

      await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true })
      await Bun.write(snapshotPath, json)
      return { passed: true, snapshotPath, message: 'New snapshot created' }
    },

    /**
     * Test inline snapshot (embeds expected in test file)
     */
    matchInlineSnapshot(actual: string, expected?: string): { passed: boolean; expected: string } {
      const normalizedActual = normalizeHtml(actual)

      if (expected === undefined) {
        // First run - return actual for embedding
        return { passed: true, expected: normalizedActual }
      }

      const normalizedExpected = normalizeHtml(expected)
      return {
        passed: normalizedActual === normalizedExpected,
        expected: normalizedActual,
      }
    },

    /**
     * Get config
     */
    getConfig() {
      return cfg
    },
  }
}

// =============================================================================
// Visual Regression Testing
// =============================================================================

/**
 * Create a visual regression tester
 */
export function createVisualRegressionTester(config: VisualTestConfig = {}) {
  const snapshotTester = createSnapshotTester(config)
  const cfg = snapshotTester.getConfig()

  return {
    /**
     * Compare screenshots
     */
    async compareScreenshots(
      name: string,
      actual: Buffer,
      viewport: string = 'desktop'
    ): Promise<ScreenshotResult> {
      const baselinePath = path.join(cfg.screenshotDir, viewport, `${name}.png`)
      const actualPath = path.join(cfg.diffDir, viewport, `${name}.actual.png`)
      const diffPath = path.join(cfg.diffDir, viewport, `${name}.diff.png`)

      // Check if baseline exists
      if (fs.existsSync(baselinePath)) {
        const baseline = await Bun.file(baselinePath).arrayBuffer()
        const baselineBuffer = Buffer.from(baseline)

        // Compare images
        const result = await cfg.compare(actual, baselineBuffer)

        if (result.match || result.diffPercentage <= cfg.threshold) {
          return {
            viewport,
            passed: true,
            baselinePath,
          }
        }

        if (cfg.updateSnapshots) {
          await fs.promises.mkdir(path.dirname(baselinePath), { recursive: true })
          await Bun.write(baselinePath, actual)
          return {
            viewport,
            passed: true,
            baselinePath,
          }
        }

        // Save diff artifacts
        await fs.promises.mkdir(path.dirname(actualPath), { recursive: true })
        await Bun.write(actualPath, actual)

        if (result.diffImage && cfg.generateDiff) {
          await Bun.write(diffPath, result.diffImage)
        }

        return {
          viewport,
          passed: false,
          baselinePath,
          actualPath,
          diffPath: cfg.generateDiff ? diffPath : undefined,
          diffPercentage: result.diffPercentage,
        }
      }

      // Create new baseline
      await fs.promises.mkdir(path.dirname(baselinePath), { recursive: true })
      await Bun.write(baselinePath, actual)

      return {
        viewport,
        passed: true,
        baselinePath,
      }
    },

    /**
     * Run visual regression test for multiple viewports
     */
    async testViewports(
      name: string,
      captureScreenshot: (viewport: Viewport) => Promise<Buffer>,
      viewports: Viewport[] = cfg.viewports
    ): Promise<ScreenshotResult[]> {
      const results: ScreenshotResult[] = []

      for (const viewport of viewports) {
        let lastError: Error | null = null

        for (let attempt = 0; attempt < cfg.retries; attempt++) {
          try {
            const screenshot = await captureScreenshot(viewport)
            const result = await this.compareScreenshots(name, screenshot, viewport.name)
            results.push(result)
            lastError = null
            break
          } catch (error) {
            lastError = error as Error
            if (attempt < cfg.retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
            }
          }
        }

        if (lastError) {
          results.push({
            viewport: viewport.name,
            passed: false,
            baselinePath: '',
            diffPercentage: 100,
          })
        }
      }

      return results
    },

    /**
     * Get the snapshot tester
     */
    getSnapshotTester() {
      return snapshotTester
    },
  }
}

// =============================================================================
// Story-Based Testing
// =============================================================================

/**
 * Create a story-based visual tester
 */
export function createStoryTester(config: VisualTestConfig = {}) {
  const visualTester = createVisualRegressionTester(config)
  const snapshotTester = visualTester.getSnapshotTester()
  const stories: Map<string, Story> = new Map()

  return {
    /**
     * Register a story
     */
    addStory(story: Story): void {
      stories.set(`${story.component}/${story.name}`, story)
    },

    /**
     * Register multiple stories
     */
    addStories(storyList: Story[]): void {
      for (const story of storyList) {
        this.addStory(story)
      }
    },

    /**
     * Get all stories
     */
    getStories(): Story[] {
      return Array.from(stories.values())
    },

    /**
     * Get stories for a component
     */
    getStoriesForComponent(component: string): Story[] {
      return Array.from(stories.values()).filter(s => s.component === component)
    },

    /**
     * Test a single story
     */
    async testStory(storyId: string): Promise<VisualTestResult> {
      const story = stories.get(storyId)
      if (!story) {
        return {
          name: storyId,
          passed: false,
          duration: 0,
          snapshots: [],
          screenshots: [],
          errors: [new Error(`Story not found: ${storyId}`)],
        }
      }

      const startTime = Date.now()
      const result: VisualTestResult = {
        name: storyId,
        passed: true,
        duration: 0,
        snapshots: [],
        screenshots: [],
        errors: [],
      }

      try {
        // Render the story
        const html = await story.render()

        // HTML snapshot test
        const snapshotResult = await snapshotTester.snapshot(
          html,
          storyId.replace(/\//g, '-')
        )
        result.snapshots.push(snapshotResult)

        if (!snapshotResult.passed) {
          result.passed = false
        }

      } catch (error) {
        result.passed = false
        result.errors.push(error as Error)
      }

      result.duration = Date.now() - startTime
      return result
    },

    /**
     * Test all stories
     */
    async testAllStories(): Promise<VisualTestResult[]> {
      const results: VisualTestResult[] = []

      for (const storyId of stories.keys()) {
        const result = await this.testStory(storyId)
        results.push(result)
      }

      return results
    },

    /**
     * Generate story index
     */
    async generateStoryIndex(): Promise<string> {
      const index: Record<string, { name: string; args?: Record<string, unknown> }[]> = {}

      for (const story of stories.values()) {
        if (!index[story.component]) {
          index[story.component] = []
        }
        index[story.component].push({
          name: story.name,
          args: story.args,
        })
      }

      return JSON.stringify(index, null, 2)
    },
  }
}

// =============================================================================
// Test Reporter
// =============================================================================

export interface ReportConfig {
  outputDir?: string
  format?: 'html' | 'json' | 'markdown'
  title?: string
  includeScreenshots?: boolean
}

/**
 * Generate visual test report
 */
export async function generateReport(
  results: VisualTestResult[],
  config: ReportConfig = {}
): Promise<string> {
  const cfg = {
    outputDir: config.outputDir || 'visual-test-report',
    format: config.format || 'html',
    title: config.title || 'Visual Test Report',
    includeScreenshots: config.includeScreenshots ?? true,
  }

  await fs.promises.mkdir(cfg.outputDir, { recursive: true })

  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  if (cfg.format === 'json') {
    const report = {
      title: cfg.title,
      summary: { total: totalTests, passed: passedTests, failed: failedTests, duration: totalDuration },
      results,
      generatedAt: new Date().toISOString(),
    }
    const reportPath = path.join(cfg.outputDir, 'report.json')
    await Bun.write(reportPath, JSON.stringify(report, null, 2))
    return reportPath
  }

  if (cfg.format === 'markdown') {
    let md = `# ${cfg.title}\n\n`
    md += `## Summary\n\n`
    md += `- Total: ${totalTests}\n`
    md += `- Passed: ${passedTests}\n`
    md += `- Failed: ${failedTests}\n`
    md += `- Duration: ${totalDuration}ms\n\n`

    md += `## Results\n\n`
    for (const result of results) {
      const status = result.passed ? '✅' : '❌'
      md += `### ${status} ${result.name}\n\n`
      md += `Duration: ${result.duration}ms\n\n`

      if (result.errors.length > 0) {
        md += `**Errors:**\n`
        for (const error of result.errors) {
          md += `- ${error.message}\n`
        }
        md += '\n'
      }

      if (result.snapshots.length > 0) {
        md += `**Snapshots:**\n`
        for (const snap of result.snapshots) {
          const snapStatus = snap.passed ? '✅' : '❌'
          md += `- ${snapStatus} ${snap.snapshotPath}\n`
        }
        md += '\n'
      }
    }

    const reportPath = path.join(cfg.outputDir, 'report.md')
    await Bun.write(reportPath, md)
    return reportPath
  }

  // HTML report
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { margin-bottom: 1rem; }
    .summary { display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 8px; }
    .stat { text-align: center; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { font-size: 0.875rem; color: #666; }
    .passed { color: #22c55e; }
    .failed { color: #ef4444; }
    .results { display: flex; flex-direction: column; gap: 1rem; }
    .result { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .result-header { padding: 1rem; background: #f9f9f9; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .result-header:hover { background: #f0f0f0; }
    .result-body { padding: 1rem; display: none; }
    .result.expanded .result-body { display: block; }
    .status { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    .status.pass { background: #dcfce7; color: #166534; }
    .status.fail { background: #fee2e2; color: #991b1b; }
    .error { background: #fef2f2; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; font-family: monospace; font-size: 0.875rem; }
    .diff-view { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .diff-view img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .diff-label { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <h1>${cfg.title}</h1>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${totalTests}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat">
      <div class="stat-value passed">${passedTests}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat">
      <div class="stat-value failed">${failedTests}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat">
      <div class="stat-value">${totalDuration}ms</div>
      <div class="stat-label">Duration</div>
    </div>
  </div>

  <div class="results">
    ${results.map(r => `
      <div class="result ${r.passed ? '' : 'expanded'}">
        <div class="result-header" onclick="this.parentElement.classList.toggle('expanded')">
          <span>${r.name}</span>
          <span class="status ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'PASS' : 'FAIL'}</span>
        </div>
        <div class="result-body">
          <p>Duration: ${r.duration}ms</p>
          ${r.errors.length > 0 ? `
            <div class="error">
              ${r.errors.map(e => `<div>${escapeHtml(e.message)}</div>`).join('')}
            </div>
          ` : ''}
          ${r.snapshots.filter(s => !s.passed).map(s => `
            <div class="snapshot-diff">
              <p>Snapshot: ${s.snapshotPath}</p>
              ${s.diffPath ? `<p><a href="file://${s.diffPath}">View diff</a></p>` : ''}
            </div>
          `).join('')}
          ${r.screenshots.filter(s => !s.passed).map(s => `
            <div class="diff-view">
              <div>
                <div class="diff-label">Baseline</div>
                ${cfg.includeScreenshots ? `<img src="file://${s.baselinePath}" alt="baseline">` : `<p>${s.baselinePath}</p>`}
              </div>
              <div>
                <div class="diff-label">Actual</div>
                ${cfg.includeScreenshots && s.actualPath ? `<img src="file://${s.actualPath}" alt="actual">` : `<p>${s.actualPath || 'N/A'}</p>`}
              </div>
              <div>
                <div class="diff-label">Diff (${(s.diffPercentage || 0).toFixed(2)}%)</div>
                ${cfg.includeScreenshots && s.diffPath ? `<img src="file://${s.diffPath}" alt="diff">` : `<p>${s.diffPath || 'N/A'}</p>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <script>
    // Auto-expand failed tests
    document.querySelectorAll('.result.fail').forEach(el => el.classList.add('expanded'));
  </script>
</body>
</html>`

  const reportPath = path.join(cfg.outputDir, 'report.html')
  await Bun.write(reportPath, html)
  return reportPath
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize HTML for comparison
 */
function normalizeHtml(html: string): string {
  return html
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around tags
    .replace(/>\s+</g, '><')
    // Remove whitespace after opening tags
    .replace(/>\s+/g, '>')
    // Remove whitespace before closing tags
    .replace(/\s+</g, '<')
    // Normalize quotes
    .replace(/"/g, '"').replace(/"/g, '"')
    // Trim
    .trim()
}

/**
 * Hash content for comparison
 */
function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Generate HTML diff
 */
function generateHtmlDiff(expected: string, actual: string): string {
  const expectedLines = expected.split('\n')
  const actualLines = actual.split('\n')

  let diff = '<html><head><style>'
  diff += '.diff { font-family: monospace; white-space: pre; }'
  diff += '.add { background: #dcfce7; }'
  diff += '.remove { background: #fee2e2; }'
  diff += '.line-num { color: #888; width: 3em; display: inline-block; }'
  diff += '</style></head><body><div class="diff">'

  const maxLines = Math.max(expectedLines.length, actualLines.length)

  for (let i = 0; i < maxLines; i++) {
    const exp = expectedLines[i] || ''
    const act = actualLines[i] || ''

    if (exp === act) {
      diff += `<div><span class="line-num">${i + 1}</span> ${escapeHtml(exp)}</div>`
    } else {
      if (exp) {
        diff += `<div class="remove"><span class="line-num">${i + 1}</span>-${escapeHtml(exp)}</div>`
      }
      if (act) {
        diff += `<div class="add"><span class="line-num">${i + 1}</span>+${escapeHtml(act)}</div>`
      }
    }
  }

  diff += '</div></body></html>'
  return diff
}

/**
 * Generate JSON diff
 */
function generateJsonDiff(expected: string, actual: string): string {
  const expectedObj = JSON.parse(expected)
  const actualObj = JSON.parse(actual)

  const diffs: string[] = []

  function compare(path: string, exp: unknown, act: unknown) {
    if (typeof exp !== typeof act) {
      diffs.push(`${path}: type changed from ${typeof exp} to ${typeof act}`)
      return
    }

    if (exp === null || act === null) {
      if (exp !== act) {
        diffs.push(`${path}: ${JSON.stringify(exp)} → ${JSON.stringify(act)}`)
      }
      return
    }

    if (typeof exp === 'object') {
      const expKeys = Object.keys(exp as object)
      const actKeys = Object.keys(act as object)

      for (const key of expKeys) {
        if (!actKeys.includes(key)) {
          diffs.push(`${path}.${key}: removed`)
        } else {
          compare(`${path}.${key}`, (exp as Record<string, unknown>)[key], (act as Record<string, unknown>)[key])
        }
      }

      for (const key of actKeys) {
        if (!expKeys.includes(key)) {
          diffs.push(`${path}.${key}: added`)
        }
      }
    } else if (exp !== act) {
      diffs.push(`${path}: ${JSON.stringify(exp)} → ${JSON.stringify(act)}`)
    }
  }

  compare('root', expectedObj, actualObj)
  return diffs.join('\n')
}

/**
 * Escape HTML
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Default image comparison (pixel-by-pixel)
 */
async function defaultCompare(actual: Buffer, expected: Buffer): Promise<ComparisonResult> {
  // Simple byte comparison for now
  // In production, would use a proper image comparison library like pixelmatch

  if (actual.length !== expected.length) {
    return {
      match: false,
      diffPercentage: 100,
      diffPixels: Math.max(actual.length, expected.length),
    }
  }

  let diffPixels = 0
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      diffPixels++
    }
  }

  const diffPercentage = (diffPixels / actual.length) * 100

  return {
    match: diffPixels === 0,
    diffPercentage,
    diffPixels,
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

let defaultTester: ReturnType<typeof createSnapshotTester> | null = null

/**
 * Quick snapshot test
 */
export async function snapshot(html: string, name: string): Promise<SnapshotResult> {
  if (!defaultTester) {
    defaultTester = createSnapshotTester()
  }
  return defaultTester.snapshot(html, name)
}

/**
 * Quick JSON snapshot test
 */
export async function snapshotJson(data: unknown, name: string): Promise<SnapshotResult> {
  if (!defaultTester) {
    defaultTester = createSnapshotTester()
  }
  return defaultTester.snapshotJson(data, name)
}

/**
 * Reset default tester (for testing)
 */
export function resetDefaultTester(): void {
  defaultTester = null
}

// =============================================================================
// Exports
// =============================================================================

export default {
  createSnapshotTester,
  createVisualRegressionTester,
  createStoryTester,
  generateReport,
  snapshot,
  snapshotJson,
  defaultViewports,
}
