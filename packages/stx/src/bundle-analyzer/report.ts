/**
 * Bundle Analyzer - Report Generator
 *
 * Generates text, JSON, and analysis reports from bundle statistics.
 */

import type { BundleStats, ModuleInfo, ChunkInfo, DuplicateModule, ModuleType } from './collector'
import { formatBytes, percentage } from './collector'

// ============================================================================
// Types
// ============================================================================

export interface ReportOptions {
  /** Output format */
  format: 'text' | 'json' | 'markdown'
  /** Size threshold for warnings (bytes) */
  threshold?: number
  /** Include recommendations */
  recommendations?: boolean
  /** Show top N modules */
  topModules?: number
  /** Show gzip sizes */
  showGzip?: boolean
}

export interface AnalysisResult {
  /** Overall health score (0-100) */
  score: number
  /** Issues found */
  issues: AnalysisIssue[]
  /** Recommendations */
  recommendations: Recommendation[]
}

export interface AnalysisIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
  details?: string
}

export interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a report from bundle statistics
 */
export function generateReport(stats: BundleStats, options: ReportOptions): string {
  switch (options.format) {
    case 'json':
      return generateJsonReport(stats, options)
    case 'markdown':
      return generateMarkdownReport(stats, options)
    case 'text':
    default:
      return generateTextReport(stats, options)
  }
}

/**
 * Generate JSON report
 */
function generateJsonReport(stats: BundleStats, options: ReportOptions): string {
  const analysis = analyzeBundle(stats, options)

  return JSON.stringify({
    timestamp: stats.timestamp,
    buildDir: stats.buildDir,
    summary: {
      totalSize: stats.totalSize,
      totalSizeFormatted: formatBytes(stats.totalSize),
      totalGzipSize: stats.totalGzipSize,
      totalGzipSizeFormatted: formatBytes(stats.totalGzipSize),
      moduleCount: stats.moduleCount,
      chunkCount: stats.chunks.length,
      duplicateCount: stats.duplicates.length,
    },
    byType: Object.fromEntries(
      Object.entries(stats.byType).map(([type, data]) => [
        type,
        {
          ...data,
          sizeFormatted: formatBytes(data.size),
          gzipSizeFormatted: formatBytes(data.gzipSize),
        },
      ]),
    ),
    chunks: stats.chunks.map(chunk => ({
      name: chunk.name,
      size: chunk.size,
      sizeFormatted: formatBytes(chunk.size),
      gzipSize: chunk.gzipSize,
      gzipSizeFormatted: formatBytes(chunk.gzipSize),
      moduleCount: chunk.modules.length,
      isEntry: chunk.isEntry,
      isVendor: chunk.isVendor,
    })),
    largestModules: stats.largestModules.slice(0, options.topModules || 10).map(m => ({
      path: m.path,
      size: m.size,
      sizeFormatted: formatBytes(m.size),
      gzipSize: m.gzipSize,
      gzipSizeFormatted: formatBytes(m.gzipSize),
      type: m.type,
    })),
    duplicates: stats.duplicates,
    analysis,
    warnings: stats.warnings,
  }, null, 2)
}

/**
 * Generate text report
 */
function generateTextReport(stats: BundleStats, options: ReportOptions): string {
  const lines: string[] = []
  const showGzip = options.showGzip !== false

  // Header
  lines.push('')
  lines.push('Bundle Analysis Report')
  lines.push('═'.repeat(50))
  lines.push('')

  // Summary
  lines.push('Summary')
  lines.push('─'.repeat(50))
  if (showGzip) {
    lines.push(`Total Size:     ${formatBytes(stats.totalSize)} (${formatBytes(stats.totalGzipSize)} gzip)`)
  }
  else {
    lines.push(`Total Size:     ${formatBytes(stats.totalSize)}`)
  }
  lines.push(`Modules:        ${stats.moduleCount}`)
  lines.push(`Chunks:         ${stats.chunks.length}`)
  if (stats.duplicates.length > 0) {
    lines.push(`Duplicates:     ${stats.duplicates.length}`)
  }
  lines.push('')

  // Check threshold
  if (options.threshold && stats.totalSize > options.threshold) {
    lines.push(`⚠️  Bundle exceeds threshold of ${formatBytes(options.threshold)}!`)
    lines.push('')
  }

  // By type
  lines.push('Size by Type')
  lines.push('─'.repeat(50))
  const types: ModuleType[] = ['js', 'css', 'html', 'image', 'font', 'other']
  for (const type of types) {
    const data = stats.byType[type]
    if (data.count > 0) {
      const pct = percentage(data.size, stats.totalSize)
      const gzipStr = showGzip ? ` (${formatBytes(data.gzipSize)} gzip)` : ''
      lines.push(`  ${type.padEnd(8)} ${formatBytes(data.size).padStart(12)}${gzipStr}  ${pct.padStart(6)}  (${data.count} files)`)
    }
  }
  lines.push('')

  // Chunks
  lines.push('Chunks')
  lines.push('─'.repeat(50))
  for (const chunk of stats.chunks.slice(0, 10)) {
    const flags: string[] = []
    if (chunk.isEntry) flags.push('entry')
    if (chunk.isVendor) flags.push('vendor')
    const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : ''
    const gzipStr = showGzip ? ` (${formatBytes(chunk.gzipSize)} gzip)` : ''
    lines.push(`  ${chunk.name.padEnd(20)} ${formatBytes(chunk.size).padStart(12)}${gzipStr}${flagStr}`)
  }
  if (stats.chunks.length > 10) {
    lines.push(`  ... and ${stats.chunks.length - 10} more chunks`)
  }
  lines.push('')

  // Largest modules
  const topCount = options.topModules || 10
  lines.push(`Largest Modules (Top ${topCount})`)
  lines.push('─'.repeat(50))
  for (let i = 0; i < Math.min(topCount, stats.largestModules.length); i++) {
    const m = stats.largestModules[i]
    const gzipStr = showGzip ? ` (${formatBytes(m.gzipSize)} gzip)` : ''
    lines.push(`  ${(i + 1).toString().padStart(2)}. ${m.path}`)
    lines.push(`      ${formatBytes(m.size)}${gzipStr}`)
  }
  lines.push('')

  // Duplicates
  if (stats.duplicates.length > 0) {
    lines.push('Duplicate Modules')
    lines.push('─'.repeat(50))
    for (const dup of stats.duplicates.slice(0, 5)) {
      lines.push(`  ${dup.path}`)
      lines.push(`    ${dup.count} copies, wasting ${formatBytes(dup.wastedBytes)}`)
    }
    if (stats.duplicates.length > 5) {
      lines.push(`  ... and ${stats.duplicates.length - 5} more duplicates`)
    }
    lines.push('')
  }

  // Recommendations
  if (options.recommendations !== false) {
    const analysis = analyzeBundle(stats, options)
    if (analysis.recommendations.length > 0) {
      lines.push('Recommendations')
      lines.push('─'.repeat(50))
      for (const rec of analysis.recommendations.slice(0, 5)) {
        const impactIcon = rec.impact === 'high' ? '⚡' : rec.impact === 'medium' ? '📊' : '💡'
        lines.push(`  ${impactIcon} ${rec.title}`)
        lines.push(`    ${rec.description}`)
      }
      lines.push('')
    }
  }

  // Warnings
  if (stats.warnings.length > 0) {
    lines.push('Warnings')
    lines.push('─'.repeat(50))
    for (const warning of stats.warnings) {
      lines.push(`  ⚠️  ${warning}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(stats: BundleStats, options: ReportOptions): string {
  const lines: string[] = []
  const showGzip = options.showGzip !== false

  // Header
  lines.push('# Bundle Analysis Report')
  lines.push('')
  lines.push(`Generated: ${new Date(stats.timestamp).toISOString()}`)
  lines.push('')

  // Summary
  lines.push('## Summary')
  lines.push('')
  lines.push('| Metric | Value |')
  lines.push('|--------|-------|')
  lines.push(`| Total Size | ${formatBytes(stats.totalSize)} |`)
  if (showGzip) {
    lines.push(`| Gzip Size | ${formatBytes(stats.totalGzipSize)} |`)
  }
  lines.push(`| Modules | ${stats.moduleCount} |`)
  lines.push(`| Chunks | ${stats.chunks.length} |`)
  lines.push(`| Duplicates | ${stats.duplicates.length} |`)
  lines.push('')

  // By type
  lines.push('## Size by Type')
  lines.push('')
  lines.push('| Type | Size | Gzip | % | Files |')
  lines.push('|------|------|------|---|-------|')
  const types: ModuleType[] = ['js', 'css', 'html', 'image', 'font', 'other']
  for (const type of types) {
    const data = stats.byType[type]
    if (data.count > 0) {
      lines.push(`| ${type} | ${formatBytes(data.size)} | ${formatBytes(data.gzipSize)} | ${percentage(data.size, stats.totalSize)} | ${data.count} |`)
    }
  }
  lines.push('')

  // Chunks
  lines.push('## Chunks')
  lines.push('')
  lines.push('| Name | Size | Gzip | Modules | Type |')
  lines.push('|------|------|------|---------|------|')
  for (const chunk of stats.chunks.slice(0, 15)) {
    const type = chunk.isEntry ? 'Entry' : chunk.isVendor ? 'Vendor' : '-'
    lines.push(`| ${chunk.name} | ${formatBytes(chunk.size)} | ${formatBytes(chunk.gzipSize)} | ${chunk.modules.length} | ${type} |`)
  }
  lines.push('')

  // Largest modules
  const topCount = options.topModules || 10
  lines.push(`## Largest Modules (Top ${topCount})`)
  lines.push('')
  lines.push('| # | Path | Size | Gzip |')
  lines.push('|---|------|------|------|')
  for (let i = 0; i < Math.min(topCount, stats.largestModules.length); i++) {
    const m = stats.largestModules[i]
    lines.push(`| ${i + 1} | \`${m.path}\` | ${formatBytes(m.size)} | ${formatBytes(m.gzipSize)} |`)
  }
  lines.push('')

  // Duplicates
  if (stats.duplicates.length > 0) {
    lines.push('## Duplicates')
    lines.push('')
    lines.push('| Path | Copies | Wasted |')
    lines.push('|------|--------|--------|')
    for (const dup of stats.duplicates.slice(0, 10)) {
      lines.push(`| \`${dup.path}\` | ${dup.count} | ${formatBytes(dup.wastedBytes)} |`)
    }
    lines.push('')
  }

  // Recommendations
  if (options.recommendations !== false) {
    const analysis = analyzeBundle(stats, options)
    if (analysis.recommendations.length > 0) {
      lines.push('## Recommendations')
      lines.push('')
      for (const rec of analysis.recommendations) {
        lines.push(`### ${rec.title}`)
        lines.push('')
        lines.push(rec.description)
        lines.push('')
        lines.push(`- **Impact:** ${rec.impact}`)
        lines.push(`- **Effort:** ${rec.effort}`)
        lines.push('')
      }
    }
  }

  return lines.join('\n')
}

// ============================================================================
// Analysis
// ============================================================================

/**
 * Analyze bundle for issues and recommendations
 */
export function analyzeBundle(stats: BundleStats, options: ReportOptions): AnalysisResult {
  const issues: AnalysisIssue[] = []
  const recommendations: Recommendation[] = []

  // Check total size
  if (options.threshold && stats.totalSize > options.threshold) {
    issues.push({
      severity: 'error',
      message: `Bundle size (${formatBytes(stats.totalSize)}) exceeds threshold (${formatBytes(options.threshold)})`,
    })
  }

  // Check for large bundles (> 1MB is concerning)
  if (stats.totalSize > 1024 * 1024) {
    issues.push({
      severity: 'warning',
      message: `Bundle is over 1MB (${formatBytes(stats.totalSize)})`,
      details: 'Large bundles can significantly impact load time',
    })
  }

  // Check for duplicates
  if (stats.duplicates.length > 0) {
    const wastedTotal = stats.duplicates.reduce((sum, d) => sum + d.wastedBytes, 0)
    issues.push({
      severity: 'warning',
      message: `${stats.duplicates.length} duplicate modules found, wasting ${formatBytes(wastedTotal)}`,
    })

    recommendations.push({
      title: 'Remove Duplicate Modules',
      description: 'Consider using import aliases or ensuring consistent package versions to eliminate duplicates.',
      impact: 'medium',
      effort: 'low',
    })
  }

  // Check JS ratio
  const jsRatio = stats.byType.js.size / stats.totalSize
  if (jsRatio > 0.8 && stats.totalSize > 500 * 1024) {
    recommendations.push({
      title: 'Code Splitting',
      description: 'Over 80% of your bundle is JavaScript. Consider splitting code by route or feature.',
      impact: 'high',
      effort: 'medium',
    })
  }

  // Check for large individual modules
  const veryLargeModules = stats.largestModules.filter(m => m.size > 100 * 1024)
  if (veryLargeModules.length > 0) {
    issues.push({
      severity: 'info',
      message: `${veryLargeModules.length} modules are over 100KB`,
    })

    // Check for common large libraries
    for (const m of veryLargeModules) {
      if (m.path.includes('lodash') && !m.path.includes('lodash-es')) {
        recommendations.push({
          title: 'Use lodash-es instead of lodash',
          description: 'lodash-es supports tree-shaking and can significantly reduce bundle size.',
          impact: 'high',
          effort: 'low',
        })
      }
      if (m.path.includes('moment')) {
        recommendations.push({
          title: 'Replace moment.js',
          description: 'Consider using date-fns or dayjs for smaller date handling libraries.',
          impact: 'high',
          effort: 'medium',
        })
      }
    }
  }

  // Check image optimization
  if (stats.byType.image.size > 500 * 1024) {
    recommendations.push({
      title: 'Optimize Images',
      description: `Images account for ${formatBytes(stats.byType.image.size)}. Consider using WebP/AVIF formats and responsive images.`,
      impact: 'high',
      effort: 'low',
    })
  }

  // Calculate health score
  let score = 100

  // Deduct for size
  if (stats.totalSize > 1024 * 1024) score -= 20
  else if (stats.totalSize > 500 * 1024) score -= 10

  // Deduct for duplicates
  score -= Math.min(20, stats.duplicates.length * 2)

  // Deduct for very large modules
  score -= Math.min(15, veryLargeModules.length * 3)

  // Deduct for threshold violation
  if (options.threshold && stats.totalSize > options.threshold) {
    score -= 25
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  }
}

// ============================================================================
// Known Large Libraries
// ============================================================================

const KNOWN_LARGE_LIBRARIES: Record<string, { alternative: string; savings: string }> = {
  lodash: { alternative: 'lodash-es or individual imports', savings: '~70%' },
  moment: { alternative: 'date-fns or dayjs', savings: '~90%' },
  'chart.js': { alternative: 'chart.js with tree-shaking', savings: '~50%' },
  'highlight.js': { alternative: 'Selective language imports', savings: '~80%' },
  'fontawesome': { alternative: 'Individual icon imports', savings: '~90%' },
  'material-ui': { alternative: 'Named imports from @mui/*', savings: '~60%' },
}

/**
 * Get recommendations for a specific module
 */
export function getModuleRecommendation(modulePath: string): Recommendation | null {
  for (const [lib, info] of Object.entries(KNOWN_LARGE_LIBRARIES)) {
    if (modulePath.includes(lib)) {
      return {
        title: `Optimize ${lib}`,
        description: `Consider using ${info.alternative}. Potential savings: ${info.savings}`,
        impact: 'high',
        effort: 'low',
      }
    }
  }
  return null
}
