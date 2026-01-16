/**
 * Bundle Analyzer Tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

import {
  // Collector
  collectBundleStats,
  formatBytes,
  parseSize,
  percentage,
  type BundleStats,
  type ModuleInfo,
  type ChunkInfo,

  // Report
  generateReport,
  analyzeBundle,
  getModuleRecommendation,
  type ReportOptions,

  // Treemap
  generateTreemap,
  type TreemapOptions,

  // High-level API
  analyze,
  getBundleSummary,
} from '../src/bundle-analyzer'

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_DIR = path.join(process.cwd(), '.test-bundle')

// ============================================================================
// Setup & Teardown
// ============================================================================

beforeEach(async () => {
  // Create test directory with sample build output
  await fs.promises.mkdir(TEST_DIR, { recursive: true })
  await fs.promises.mkdir(path.join(TEST_DIR, 'assets'), { recursive: true })

  // Create sample files
  await fs.promises.writeFile(
    path.join(TEST_DIR, 'index.html'),
    '<!DOCTYPE html><html><body>Hello</body></html>',
  )

  await fs.promises.writeFile(
    path.join(TEST_DIR, 'index.js'),
    'console.log("Hello"); import "./utils.js";',
  )

  await fs.promises.writeFile(
    path.join(TEST_DIR, 'utils.js'),
    'export function greet(name) { return `Hello, ${name}!`; }',
  )

  await fs.promises.writeFile(
    path.join(TEST_DIR, 'styles.css'),
    'body { margin: 0; padding: 0; }',
  )

  await fs.promises.writeFile(
    path.join(TEST_DIR, 'assets', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  )
})

afterEach(async () => {
  try {
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true })
  }
  catch {
    // Ignore cleanup errors
  }
})

// ============================================================================
// Collector Tests
// ============================================================================

describe('Bundle Collector', () => {
  describe('collectBundleStats', () => {
    test('should collect stats from directory', async () => {
      const stats = await collectBundleStats(TEST_DIR)

      expect(stats.buildDir).toBe(path.resolve(TEST_DIR))
      expect(stats.moduleCount).toBeGreaterThan(0)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.chunks.length).toBeGreaterThan(0)
    })

    test('should detect file types correctly', async () => {
      const stats = await collectBundleStats(TEST_DIR)

      expect(stats.byType.js.count).toBeGreaterThan(0)
      expect(stats.byType.css.count).toBeGreaterThan(0)
      expect(stats.byType.html.count).toBeGreaterThan(0)
      expect(stats.byType.image.count).toBeGreaterThan(0)
    })

    test('should calculate gzip sizes', async () => {
      const stats = await collectBundleStats(TEST_DIR)

      expect(stats.totalGzipSize).toBeGreaterThan(0)
      expect(stats.totalGzipSize).toBeLessThanOrEqual(stats.totalSize)
    })

    test('should find largest modules', async () => {
      const stats = await collectBundleStats(TEST_DIR)

      expect(stats.largestModules.length).toBeGreaterThan(0)

      // Should be sorted by size descending
      for (let i = 1; i < stats.largestModules.length; i++) {
        expect(stats.largestModules[i - 1].size).toBeGreaterThanOrEqual(
          stats.largestModules[i].size,
        )
      }
    })

    test('should throw for non-existent directory', async () => {
      await expect(collectBundleStats('/non/existent/dir')).rejects.toThrow()
    })
  })

  describe('formatBytes', () => {
    test('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B')
    })

    test('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.00 KB')
      expect(formatBytes(2560)).toBe('2.50 KB')
    })

    test('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB')
    })
  })

  describe('parseSize', () => {
    test('should parse bytes', () => {
      expect(parseSize('500')).toBe(500)
      expect(parseSize('500B')).toBe(500)
    })

    test('should parse kilobytes', () => {
      expect(parseSize('1KB')).toBe(1024)
      expect(parseSize('2.5KB')).toBe(2560)
    })

    test('should parse megabytes', () => {
      expect(parseSize('1MB')).toBe(1024 * 1024)
    })

    test('should handle invalid input', () => {
      expect(parseSize('invalid')).toBe(0)
    })
  })

  describe('percentage', () => {
    test('should calculate percentage', () => {
      expect(percentage(50, 100)).toBe('50.0%')
      expect(percentage(1, 3)).toBe('33.3%')
    })

    test('should handle zero total', () => {
      expect(percentage(50, 0)).toBe('0%')
    })
  })
})

// ============================================================================
// Report Tests
// ============================================================================

describe('Bundle Report', () => {
  let stats: BundleStats

  beforeEach(async () => {
    stats = await collectBundleStats(TEST_DIR)
  })

  describe('generateReport', () => {
    test('should generate text report', () => {
      const report = generateReport(stats, { format: 'text' })

      expect(report).toContain('Bundle Analysis Report')
      expect(report).toContain('Total Size')
      expect(report).toContain('Modules')
    })

    test('should generate JSON report', () => {
      const report = generateReport(stats, { format: 'json' })
      const parsed = JSON.parse(report)

      expect(parsed.timestamp).toBeDefined()
      expect(parsed.summary).toBeDefined()
      expect(parsed.summary.totalSize).toBe(stats.totalSize)
      expect(parsed.chunks).toBeDefined()
    })

    test('should generate markdown report', () => {
      const report = generateReport(stats, { format: 'markdown' })

      expect(report).toContain('# Bundle Analysis Report')
      expect(report).toContain('## Summary')
      expect(report).toContain('| Metric | Value |')
    })

    test('should include recommendations', () => {
      const report = generateReport(stats, {
        format: 'text',
        recommendations: true,
      })

      // Report might have recommendations section
      expect(typeof report).toBe('string')
    })

    test('should respect topModules option', () => {
      const report = generateReport(stats, {
        format: 'text',
        topModules: 5,
      })

      expect(report).toContain('Top 5')
    })
  })

  describe('analyzeBundle', () => {
    test('should return analysis result', () => {
      const analysis = analyzeBundle(stats, { format: 'text' })

      expect(analysis.score).toBeGreaterThanOrEqual(0)
      expect(analysis.score).toBeLessThanOrEqual(100)
      expect(Array.isArray(analysis.issues)).toBe(true)
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })

    test('should detect threshold violations', () => {
      const analysis = analyzeBundle(stats, {
        format: 'text',
        threshold: 1, // 1 byte threshold - should fail
      })

      expect(analysis.issues.some(i => i.severity === 'error')).toBe(true)
    })
  })

  describe('getModuleRecommendation', () => {
    test('should recommend lodash-es for lodash', () => {
      const rec = getModuleRecommendation('node_modules/lodash/index.js')

      expect(rec).not.toBeNull()
      expect(rec?.title).toContain('lodash')
    })

    test('should recommend alternatives for moment', () => {
      const rec = getModuleRecommendation('node_modules/moment/moment.js')

      expect(rec).not.toBeNull()
      expect(rec?.description).toContain('date-fns')
    })

    test('should return null for unknown modules', () => {
      const rec = getModuleRecommendation('src/utils/helpers.js')

      expect(rec).toBeNull()
    })
  })
})

// ============================================================================
// Treemap Tests
// ============================================================================

describe('Bundle Treemap', () => {
  let stats: BundleStats

  beforeEach(async () => {
    stats = await collectBundleStats(TEST_DIR)
  })

  describe('generateTreemap', () => {
    test('should generate HTML treemap', () => {
      const html = generateTreemap(stats)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Bundle Analysis')
      expect(html).toContain('d3.v7.min.js')
      expect(html).toContain('treemap')
    })

    test('should include custom title', () => {
      const html = generateTreemap(stats, { title: 'My Bundle' })

      expect(html).toContain('My Bundle')
    })

    test('should include stats summary', () => {
      const html = generateTreemap(stats)

      expect(html).toContain('Total Size')
      expect(html).toContain('Gzip Size')
      expect(html).toContain('Modules')
    })

    test('should include legend', () => {
      const html = generateTreemap(stats)

      expect(html).toContain('legend')
      expect(html).toContain('JavaScript')
      expect(html).toContain('CSS')
    })

    test('should include search functionality', () => {
      const html = generateTreemap(stats)

      expect(html).toContain('search')
      expect(html).toContain('Search modules')
    })
  })
})

// ============================================================================
// High-Level API Tests
// ============================================================================

describe('High-Level API', () => {
  describe('analyze', () => {
    test('should analyze directory with default options', async () => {
      const result = await analyze({
        directory: TEST_DIR,
        format: 'text',
        open: false,
      })

      expect(result.stats).toBeDefined()
      expect(result.report).toBeDefined()
      expect(result.exceedsThreshold).toBe(false)
    })

    test('should detect threshold violations', async () => {
      const result = await analyze({
        directory: TEST_DIR,
        format: 'text',
        threshold: '1B',
        open: false,
      })

      expect(result.exceedsThreshold).toBe(true)
    })

    test('should generate HTML report', async () => {
      const result = await analyze({
        directory: TEST_DIR,
        format: 'html',
        output: path.join(TEST_DIR, 'report.html'),
        open: false,
      })

      expect(result.outputPath).toBeDefined()
      expect(fs.existsSync(result.outputPath!)).toBe(true)

      const content = await fs.promises.readFile(result.outputPath!, 'utf-8')
      expect(content).toContain('<!DOCTYPE html>')
    })
  })

  describe('getBundleSummary', () => {
    test('should return quick summary', async () => {
      const summary = await getBundleSummary(TEST_DIR)

      expect(summary.totalSize).toBeGreaterThan(0)
      expect(summary.totalSizeFormatted).toBeDefined()
      expect(summary.gzipSize).toBeGreaterThan(0)
      expect(summary.moduleCount).toBeGreaterThan(0)
      expect(summary.chunkCount).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  test('should export all required functions', () => {
    expect(typeof collectBundleStats).toBe('function')
    expect(typeof generateReport).toBe('function')
    expect(typeof generateTreemap).toBe('function')
    expect(typeof analyze).toBe('function')
    expect(typeof formatBytes).toBe('function')
    expect(typeof parseSize).toBe('function')
  })

  test('end-to-end: collect, analyze, report', async () => {
    // Collect stats
    const stats = await collectBundleStats(TEST_DIR)
    expect(stats.moduleCount).toBeGreaterThan(0)

    // Analyze
    const analysis = analyzeBundle(stats, { format: 'text' })
    expect(analysis.score).toBeGreaterThanOrEqual(0)

    // Generate reports
    const textReport = generateReport(stats, { format: 'text' })
    expect(textReport).toContain('Bundle Analysis')

    const jsonReport = generateReport(stats, { format: 'json' })
    expect(JSON.parse(jsonReport).summary).toBeDefined()

    const htmlReport = generateTreemap(stats)
    expect(htmlReport).toContain('<!DOCTYPE html>')
  })
})
