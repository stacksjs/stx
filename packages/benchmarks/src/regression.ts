/**
 * Performance Regression Testing
 *
 * This module provides utilities for running performance benchmarks
 * and detecting regressions by comparing against baseline thresholds.
 *
 * Features:
 * - Define performance thresholds for critical operations
 * - Run benchmarks and compare against baselines
 * - Generate reports in multiple formats (JSON, Markdown, Console)
 * - CI-friendly exit codes for automated pipelines
 * - Historical tracking with baseline file support
 *
 * @example
 * ```typescript
 * // Run regression tests
 * const results = await runRegressionTests({
 *   thresholds: {
 *     'simple-template': { maxMs: 5, minOpsPerSec: 10000 },
 *     'complex-template': { maxMs: 20, minOpsPerSec: 2000 },
 *   }
 * })
 *
 * if (results.hasRegressions) {
 *   process.exit(1)
 * }
 * ```
 */

import { bench, run } from 'mitata'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives, defaultConfig } from '@stacksjs/stx'

// =============================================================================
// Types
// =============================================================================

/**
 * Performance threshold for a single benchmark
 */
export interface PerformanceThreshold {
  /** Maximum allowed time in milliseconds */
  maxMs?: number
  /** Minimum operations per second */
  minOpsPerSec?: number
  /** Maximum allowed standard deviation (percentage) */
  maxStdDevPercent?: number
  /** Allowed regression percentage from baseline */
  allowedRegressionPercent?: number
}

/**
 * Result of a single benchmark
 */
export interface BenchmarkResult {
  name: string
  /** Average time in nanoseconds */
  avgNs: number
  /** Average time in milliseconds */
  avgMs: number
  /** Operations per second */
  opsPerSec: number
  /** Standard deviation in nanoseconds */
  stdDevNs: number
  /** Standard deviation as percentage of average */
  stdDevPercent: number
  /** Number of iterations */
  iterations: number
  /** Timestamp of the benchmark */
  timestamp: number
}

/**
 * Regression test result
 */
export interface RegressionResult {
  benchmark: string
  passed: boolean
  result: BenchmarkResult
  threshold?: PerformanceThreshold
  baseline?: BenchmarkResult
  violations: string[]
}

/**
 * Complete regression test report
 */
export interface RegressionReport {
  timestamp: number
  platform: string
  nodeVersion: string
  bunVersion: string
  results: RegressionResult[]
  summary: {
    total: number
    passed: number
    failed: number
    hasRegressions: boolean
  }
}

/**
 * Regression test configuration
 */
export interface RegressionTestConfig {
  /** Performance thresholds for each benchmark */
  thresholds?: Record<string, PerformanceThreshold>
  /** Path to baseline file for comparison */
  baselinePath?: string
  /** Save results as new baseline */
  saveBaseline?: boolean
  /** Output format */
  outputFormat?: 'json' | 'markdown' | 'console'
  /** Output file path */
  outputPath?: string
  /** Verbose output */
  verbose?: boolean
  /** Custom benchmarks to run */
  benchmarks?: BenchmarkDefinition[]
}

/**
 * Benchmark definition
 */
export interface BenchmarkDefinition {
  name: string
  fn: () => void | Promise<void>
  threshold?: PerformanceThreshold
}

// =============================================================================
// Default Thresholds
// =============================================================================

/**
 * Default performance thresholds for stx operations
 */
export const DEFAULT_THRESHOLDS: Record<string, PerformanceThreshold> = {
  // Template rendering
  'stx-simple-template': {
    maxMs: 10,
    minOpsPerSec: 5000,
    allowedRegressionPercent: 15,
  },
  'stx-complex-template': {
    maxMs: 50,
    minOpsPerSec: 1000,
    allowedRegressionPercent: 20,
  },
  'stx-expression-only': {
    maxMs: 2,
    minOpsPerSec: 30000,  // Adjusted based on benchmarks
    allowedRegressionPercent: 15,
  },
  'stx-loop-rendering': {
    maxMs: 50,  // Loops with 100 items take longer
    minOpsPerSec: 1000,  // Adjusted based on benchmarks
    allowedRegressionPercent: 20,
  },
  'stx-conditional-rendering': {
    maxMs: 5,
    minOpsPerSec: 10000,
    allowedRegressionPercent: 10,
  },
  // Component operations
  'stx-component-simple': {
    maxMs: 20,
    minOpsPerSec: 3000,
    allowedRegressionPercent: 15,
  },
  'stx-component-nested': {
    maxMs: 50,
    minOpsPerSec: 1000,
    allowedRegressionPercent: 20,
  },
  // Cache operations
  'stx-cache-hit': {
    maxMs: 1,
    minOpsPerSec: 100000,
    allowedRegressionPercent: 10,
  },
  'stx-cache-miss': {
    maxMs: 20,
    minOpsPerSec: 3000,
    allowedRegressionPercent: 15,
  },
}

// =============================================================================
// Test Templates
// =============================================================================

const SIMPLE_TEMPLATE = `
<div>
  <h1>{{ title }}</h1>
  <p>{{ message }}</p>
  @if(showFooter)
    <footer>{{ footer }}</footer>
  @endif
</div>
`

const COMPLEX_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">
</head>
<body>
  <header>
    <nav>
      @foreach(navItems as item)
        <a href="{{ item.url }}">{{ item.label }}</a>
      @endforeach
    </nav>
  </header>

  <main>
    <h1>{{ heading }}</h1>

    @if(user.isAdmin)
      <div class="admin-badge">Admin: {{ user.name }}</div>
    @endif

    <section class="products">
      @foreach(products as product)
        <article class="product">
          <h2>{{ product.name }}</h2>
          <p>{{ product.description }}</p>
          @if(product.onSale)
            <span class="sale">Sale! Was {{ product.originalPrice }}</span>
          @endif
          <span class="price">{{ product.price }}</span>
          @if(product.inStock)
            <button>Add to Cart</button>
          @else
            <span class="out-of-stock">Out of Stock</span>
          @endif
        </article>
      @endforeach
    </section>

    @if(showTestimonials)
      <section class="testimonials">
        @foreach(testimonials as testimonial)
          <blockquote>
            <p>{{ testimonial.text }}</p>
            <cite>{{ testimonial.author }}</cite>
          </blockquote>
        @endforeach
      </section>
    @endif
  </main>

  <footer>
    <p>{{ footer }}</p>
    <p>&copy; {{ year }} {{ company }}</p>
  </footer>
</body>
</html>
`

const EXPRESSION_ONLY_TEMPLATE = `{{ title }} - {{ message }}`

const LOOP_TEMPLATE = `
@foreach(items as item)
  <div>{{ item.name }}: {{ item.value }}</div>
@endforeach
`

const CONDITIONAL_TEMPLATE = `
@if(condition1)
  <div>Condition 1</div>
@elseif(condition2)
  <div>Condition 2</div>
@else
  <div>Default</div>
@endif
`

// Test data
const SIMPLE_DATA = {
  title: 'Hello World',
  message: 'This is a test',
  showFooter: true,
  footer: 'Copyright 2025',
}

const COMPLEX_DATA = {
  title: 'E-commerce Store',
  description: 'The best online shopping experience',
  heading: 'Featured Products',
  user: { name: 'John Doe', isAdmin: true },
  navItems: [
    { url: '/home', label: 'Home' },
    { url: '/products', label: 'Products' },
    { url: '/about', label: 'About' },
    { url: '/contact', label: 'Contact' },
  ],
  products: [
    { name: 'Product 1', description: 'Amazing', price: 99.99, originalPrice: 149.99, onSale: true, inStock: true },
    { name: 'Product 2', description: 'Great', price: 49.99, onSale: false, inStock: true },
    { name: 'Product 3', description: 'Nice', price: 79.99, onSale: false, inStock: false },
  ],
  showTestimonials: true,
  testimonials: [
    { text: 'Great!', author: 'Alice' },
    { text: 'Fast!', author: 'Bob' },
  ],
  footer: 'Contact us',
  year: 2025,
  company: 'Example Corp',
}

const LOOP_DATA = {
  items: Array.from({ length: 100 }, (_, i) => ({ name: `Item ${i}`, value: i * 10 })),
}

const CONDITIONAL_DATA = {
  condition1: false,
  condition2: true,
}

// =============================================================================
// Benchmark Runner
// =============================================================================

/**
 * Run a single benchmark and collect results
 */
async function runSingleBenchmark(
  name: string,
  fn: () => void | Promise<void>,
): Promise<BenchmarkResult> {
  const iterations: number[] = []
  const warmupRuns = 100
  const benchmarkRuns = 1000

  // Warmup
  for (let i = 0; i < warmupRuns; i++) {
    await fn()
  }

  // Benchmark
  for (let i = 0; i < benchmarkRuns; i++) {
    const start = Bun.nanoseconds()
    await fn()
    const end = Bun.nanoseconds()
    iterations.push(end - start)
  }

  // Calculate statistics
  const sum = iterations.reduce((a, b) => a + b, 0)
  const avgNs = sum / iterations.length
  const avgMs = avgNs / 1_000_000
  const opsPerSec = 1_000_000_000 / avgNs

  // Standard deviation
  const squaredDiffs = iterations.map(x => Math.pow(x - avgNs, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length
  const stdDevNs = Math.sqrt(avgSquaredDiff)
  const stdDevPercent = (stdDevNs / avgNs) * 100

  return {
    name,
    avgNs,
    avgMs,
    opsPerSec,
    stdDevNs,
    stdDevPercent,
    iterations: iterations.length,
    timestamp: Date.now(),
  }
}

/**
 * Check if a benchmark result violates thresholds
 */
function checkThreshold(
  result: BenchmarkResult,
  threshold: PerformanceThreshold,
  baseline?: BenchmarkResult,
): string[] {
  const violations: string[] = []

  if (threshold.maxMs !== undefined && result.avgMs > threshold.maxMs) {
    violations.push(`Exceeded max time: ${result.avgMs.toFixed(3)}ms > ${threshold.maxMs}ms`)
  }

  if (threshold.minOpsPerSec !== undefined && result.opsPerSec < threshold.minOpsPerSec) {
    violations.push(`Below min ops/sec: ${result.opsPerSec.toFixed(0)} < ${threshold.minOpsPerSec}`)
  }

  if (threshold.maxStdDevPercent !== undefined && result.stdDevPercent > threshold.maxStdDevPercent) {
    violations.push(`Exceeded max std dev: ${result.stdDevPercent.toFixed(1)}% > ${threshold.maxStdDevPercent}%`)
  }

  // Check regression from baseline
  if (baseline && threshold.allowedRegressionPercent !== undefined) {
    const regressionPercent = ((result.avgMs - baseline.avgMs) / baseline.avgMs) * 100
    if (regressionPercent > threshold.allowedRegressionPercent) {
      violations.push(`Regression from baseline: ${regressionPercent.toFixed(1)}% > ${threshold.allowedRegressionPercent}%`)
    }
  }

  return violations
}

/**
 * Load baseline results from file
 */
function loadBaseline(path: string): Record<string, BenchmarkResult> | null {
  try {
    if (!existsSync(path)) {
      return null
    }
    const content = readFileSync(path, 'utf-8')
    const data = JSON.parse(content)
    return data.results?.reduce((acc: Record<string, BenchmarkResult>, r: RegressionResult) => {
      acc[r.benchmark] = r.result
      return acc
    }, {}) || null
  } catch {
    return null
  }
}

/**
 * Save results as baseline
 */
function saveBaseline(report: RegressionReport, path: string): void {
  writeFileSync(path, JSON.stringify(report, null, 2))
}

// =============================================================================
// Main Runner
// =============================================================================

/**
 * Get default benchmarks for stx
 */
function getDefaultBenchmarks(): BenchmarkDefinition[] {
  return [
    {
      name: 'stx-simple-template',
      fn: async () => {
        await processDirectives(SIMPLE_TEMPLATE, { ...SIMPLE_DATA }, 'test.stx', defaultConfig, new Set())
      },
      threshold: DEFAULT_THRESHOLDS['stx-simple-template'],
    },
    {
      name: 'stx-complex-template',
      fn: async () => {
        await processDirectives(COMPLEX_TEMPLATE, { ...COMPLEX_DATA }, 'test.stx', defaultConfig, new Set())
      },
      threshold: DEFAULT_THRESHOLDS['stx-complex-template'],
    },
    {
      name: 'stx-expression-only',
      fn: async () => {
        await processDirectives(EXPRESSION_ONLY_TEMPLATE, { ...SIMPLE_DATA }, 'test.stx', defaultConfig, new Set())
      },
      threshold: DEFAULT_THRESHOLDS['stx-expression-only'],
    },
    {
      name: 'stx-loop-rendering',
      fn: async () => {
        await processDirectives(LOOP_TEMPLATE, { ...LOOP_DATA }, 'test.stx', defaultConfig, new Set())
      },
      threshold: DEFAULT_THRESHOLDS['stx-loop-rendering'],
    },
    {
      name: 'stx-conditional-rendering',
      fn: async () => {
        await processDirectives(CONDITIONAL_TEMPLATE, { ...CONDITIONAL_DATA }, 'test.stx', defaultConfig, new Set())
      },
      threshold: DEFAULT_THRESHOLDS['stx-conditional-rendering'],
    },
  ]
}

/**
 * Run regression tests
 */
export async function runRegressionTests(
  config: RegressionTestConfig = {},
): Promise<RegressionReport> {
  const {
    thresholds = DEFAULT_THRESHOLDS,
    baselinePath,
    saveBaseline: shouldSaveBaseline = false,
    outputFormat = 'console',
    outputPath,
    verbose = false,
    benchmarks = getDefaultBenchmarks(),
  } = config

  // Load baseline if provided
  const baseline = baselinePath ? loadBaseline(baselinePath) : null

  if (verbose) {
    console.log('\n🔬 Running Performance Regression Tests\n')
    console.log('='.repeat(60))
    if (baseline) {
      console.log(`📊 Comparing against baseline: ${baselinePath}`)
    }
    console.log('')
  }

  const results: RegressionResult[] = []

  for (const benchmark of benchmarks) {
    if (verbose) {
      process.stdout.write(`  Running ${benchmark.name}... `)
    }

    const result = await runSingleBenchmark(benchmark.name, benchmark.fn)
    const threshold = benchmark.threshold || thresholds[benchmark.name]
    const baselineResult = baseline?.[benchmark.name]

    const violations = threshold
      ? checkThreshold(result, threshold, baselineResult)
      : []

    const passed = violations.length === 0

    results.push({
      benchmark: benchmark.name,
      passed,
      result,
      threshold,
      baseline: baselineResult,
      violations,
    })

    if (verbose) {
      console.log(passed ? '✅' : '❌')
      console.log(`     ${result.avgMs.toFixed(3)}ms | ${result.opsPerSec.toFixed(0)} ops/sec | ±${result.stdDevPercent.toFixed(1)}%`)
      if (!passed) {
        violations.forEach(v => console.log(`     ⚠️  ${v}`))
      }
    }
  }

  const report: RegressionReport = {
    timestamp: Date.now(),
    platform: process.platform,
    nodeVersion: process.version,
    bunVersion: Bun.version,
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      hasRegressions: results.some(r => !r.passed),
    },
  }

  // Save baseline if requested
  if (shouldSaveBaseline && baselinePath) {
    saveBaseline(report, baselinePath)
    if (verbose) {
      console.log(`\n📁 Saved baseline to: ${baselinePath}`)
    }
  }

  // Output report
  if (outputPath || outputFormat !== 'console') {
    const output = formatReport(report, outputFormat)
    if (outputPath) {
      writeFileSync(outputPath, output)
    }
  }

  // Console summary
  if (verbose) {
    console.log('\n' + '='.repeat(60))
    console.log(`\n📋 Summary: ${report.summary.passed}/${report.summary.total} passed`)
    if (report.summary.hasRegressions) {
      console.log('❌ Performance regressions detected!')
    } else {
      console.log('✅ All benchmarks within thresholds')
    }
    console.log('')
  }

  return report
}

/**
 * Format report based on output type
 */
function formatReport(report: RegressionReport, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(report, null, 2)

    case 'markdown':
      return formatMarkdownReport(report)

    default:
      return formatConsoleReport(report)
  }
}

/**
 * Format report as Markdown
 */
function formatMarkdownReport(report: RegressionReport): string {
  let md = `# Performance Regression Report\n\n`
  md += `**Date:** ${new Date(report.timestamp).toISOString()}\n`
  md += `**Platform:** ${report.platform}\n`
  md += `**Bun Version:** ${report.bunVersion}\n\n`

  md += `## Summary\n\n`
  md += `| Metric | Value |\n`
  md += `|--------|-------|\n`
  md += `| Total Tests | ${report.summary.total} |\n`
  md += `| Passed | ${report.summary.passed} |\n`
  md += `| Failed | ${report.summary.failed} |\n`
  md += `| Status | ${report.summary.hasRegressions ? '❌ Regressions Detected' : '✅ All Passed'} |\n\n`

  md += `## Results\n\n`
  md += `| Benchmark | Time (ms) | Ops/sec | Std Dev | Status |\n`
  md += `|-----------|-----------|---------|---------|--------|\n`

  for (const r of report.results) {
    const status = r.passed ? '✅' : '❌'
    md += `| ${r.benchmark} | ${r.result.avgMs.toFixed(3)} | ${r.result.opsPerSec.toFixed(0)} | ±${r.result.stdDevPercent.toFixed(1)}% | ${status} |\n`
  }

  // Add violations section if any
  const failedResults = report.results.filter(r => !r.passed)
  if (failedResults.length > 0) {
    md += `\n## Violations\n\n`
    for (const r of failedResults) {
      md += `### ${r.benchmark}\n\n`
      for (const v of r.violations) {
        md += `- ${v}\n`
      }
      md += '\n'
    }
  }

  return md
}

/**
 * Format report for console
 */
function formatConsoleReport(report: RegressionReport): string {
  let output = '\n'
  output += '='.repeat(70) + '\n'
  output += '  PERFORMANCE REGRESSION REPORT\n'
  output += '='.repeat(70) + '\n\n'

  output += `  Date:     ${new Date(report.timestamp).toISOString()}\n`
  output += `  Platform: ${report.platform}\n`
  output += `  Bun:      ${report.bunVersion}\n\n`

  output += '-'.repeat(70) + '\n'
  output += '  RESULTS\n'
  output += '-'.repeat(70) + '\n\n'

  for (const r of report.results) {
    const status = r.passed ? '✅' : '❌'
    output += `  ${status} ${r.benchmark}\n`
    output += `     Time: ${r.result.avgMs.toFixed(3)}ms | Ops/sec: ${r.result.opsPerSec.toFixed(0)} | StdDev: ±${r.result.stdDevPercent.toFixed(1)}%\n`
    if (!r.passed) {
      for (const v of r.violations) {
        output += `     ⚠️  ${v}\n`
      }
    }
    output += '\n'
  }

  output += '='.repeat(70) + '\n'
  output += `  SUMMARY: ${report.summary.passed}/${report.summary.total} passed\n`
  output += `  STATUS:  ${report.summary.hasRegressions ? '❌ REGRESSIONS DETECTED' : '✅ ALL PASSED'}\n`
  output += '='.repeat(70) + '\n'

  return output
}

// =============================================================================
// CLI Entry Point
// =============================================================================

/**
 * Run regression tests from CLI
 */
export async function runCLI(): Promise<void> {
  const args = process.argv.slice(2)

  const config: RegressionTestConfig = {
    verbose: true,
    outputFormat: 'console',
  }

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--baseline':
        config.baselinePath = args[++i]
        break
      case '--save-baseline':
        config.saveBaseline = true
        break
      case '--output':
        config.outputPath = args[++i]
        break
      case '--format':
        config.outputFormat = args[++i] as any
        break
      case '--quiet':
        config.verbose = false
        break
      case '--help':
        console.log(`
Usage: bun run regression.ts [options]

Options:
  --baseline <path>   Path to baseline file for comparison
  --save-baseline     Save results as new baseline
  --output <path>     Write report to file
  --format <type>     Output format: json, markdown, console (default)
  --quiet             Suppress verbose output
  --help              Show this help message
`)
        process.exit(0)
    }
  }

  const report = await runRegressionTests(config)

  // Exit with error code if regressions detected
  if (report.summary.hasRegressions) {
    process.exit(1)
  }
}

// Run CLI if executed directly
if (import.meta.main) {
  runCLI()
}
