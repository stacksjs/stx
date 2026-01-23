/**
 * STX Bundle Analyzer
 *
 * Analyze and visualize bundle composition for optimization.
 *
 * @module bundle-analyzer
 *
 * @example
 * ```bash
 * # Generate HTML treemap
 * stx analyze dist/
 *
 * # JSON output for CI
 * stx analyze dist/ --json
 *
 * # Check size threshold
 * stx analyze dist/ --threshold 500KB
 * ```
 *
 * @example
 * ```typescript
 * import { collectBundleStats, generateReport, generateTreemap } from 'stx/bundle-analyzer'
 *
 * const stats = await collectBundleStats('dist/')
 * console.log(generateReport(stats, { format: 'text' }))
 * ```
 */

// ============================================================================
// Collector Exports
// ============================================================================

export {
  collectBundleStats,
  formatBytes,
  parseSize,
  percentage,
  type ModuleInfo,
  type ModuleType,
  type ChunkInfo,
  type DuplicateModule,
  type BundleStats,
  type CollectorOptions,
} from './collector'

// ============================================================================
// Report Exports
// ============================================================================

export {
  generateReport,
  analyzeBundle,
  getModuleRecommendation,
  type ReportOptions,
  type AnalysisResult,
  type AnalysisIssue,
  type Recommendation,
} from './report'

// ============================================================================
// Treemap Exports
// ============================================================================

export {
  generateTreemap,
  openInBrowser,
  type TreemapOptions,
} from './treemap'

// ============================================================================
// High-Level API
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { collectBundleStats, formatBytes, parseSize, type CollectorOptions } from './collector'
import { generateReport, analyzeBundle, type ReportOptions } from './report'
import { generateTreemap, openInBrowser, type TreemapOptions } from './treemap'

export interface AnalyzeOptions {
  /** Build directory to analyze */
  directory?: string
  /** Output file path */
  output?: string
  /** Output format */
  format?: 'html' | 'json' | 'text' | 'markdown'
  /** Open HTML report in browser */
  open?: boolean
  /** Show gzip sizes */
  gzip?: boolean
  /** Size threshold for warnings */
  threshold?: string | number
  /** Include recommendations */
  recommendations?: boolean
  /** Number of top modules to show */
  topModules?: number
  /** Parse imports */
  parseImports?: boolean
}

/**
 * Analyze a bundle directory and generate a report
 */
export async function analyze(options: AnalyzeOptions = {}): Promise<{
  stats: ReturnType<typeof collectBundleStats> extends Promise<infer T> ? T : never
  report: string
  outputPath?: string
  exceedsThreshold: boolean
}> {
  const {
    directory = 'dist',
    output,
    format = 'html',
    open = true,
    gzip = true,
    threshold,
    recommendations = true,
    topModules = 20,
    parseImports = true,
  } = options

  // Collect stats
  const collectorOptions: CollectorOptions = {
    parseImports,
    detectDuplicates: true,
    topModulesCount: topModules,
  }

  const stats = await collectBundleStats(directory, collectorOptions)

  // Parse threshold
  const thresholdBytes = threshold
    ? typeof threshold === 'string'
      ? parseSize(threshold)
      : threshold
    : undefined

  // Check threshold
  const exceedsThreshold = thresholdBytes
    ? stats.totalSize > thresholdBytes
    : false

  // Generate report
  let report: string
  let outputPath: string | undefined

  if (format === 'html') {
    const treemapOptions: TreemapOptions = {
      title: `Bundle Analysis - ${path.basename(path.resolve(directory))}`,
      gzip,
    }

    report = generateTreemap(stats, treemapOptions)
    outputPath = output || path.join(directory, 'bundle-report.html')

    // Write HTML file
    await fs.promises.writeFile(outputPath, report)

    // Open in browser
    if (open) {
      openInBrowser(outputPath)
    }
  }
  else {
    const reportOptions: ReportOptions = {
      format: format as 'text' | 'json' | 'markdown',
      threshold: thresholdBytes,
      recommendations,
      topModules,
      showGzip: gzip,
    }

    report = generateReport(stats, reportOptions)

    // Write to file if output specified
    if (output) {
      outputPath = output
      await fs.promises.writeFile(outputPath, report)
    }
  }

  return {
    stats,
    report,
    outputPath,
    exceedsThreshold,
  }
}

/**
 * Quick summary of bundle size
 */
export async function getBundleSummary(directory: string): Promise<{
  totalSize: number
  totalSizeFormatted: string
  gzipSize: number
  gzipSizeFormatted: string
  moduleCount: number
  chunkCount: number
}> {
  const stats = await collectBundleStats(directory, {
    parseImports: false,
    detectDuplicates: false,
    topModulesCount: 0,
  })

  return {
    totalSize: stats.totalSize,
    totalSizeFormatted: formatBytes(stats.totalSize),
    gzipSize: stats.totalGzipSize,
    gzipSizeFormatted: formatBytes(stats.totalGzipSize),
    moduleCount: stats.moduleCount,
    chunkCount: stats.chunks.length,
  }
}
