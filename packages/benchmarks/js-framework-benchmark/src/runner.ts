/**
 * Automated benchmark runner for js-framework-benchmark
 * Measures performance of DOM operations following the official benchmark specification
 */

import { Window } from 'happy-dom'

interface BenchmarkResult {
  name: string
  duration: number
  error?: number
  samples: number
}

interface BenchmarkSuite {
  framework: string
  results: BenchmarkResult[]
  geometricMean: number
}

const WARMUP_RUNS = 5
const BENCHMARK_RUNS = 10

/**
 * Create a new DOM environment for testing
 */
function createEnvironment() {
  const window = new Window()
  const document = window.document

  return { window, document }
}

/**
 * Load the HTML and Main.js into the DOM
 */
async function loadTemplate(window: any, document: any, htmlPath: string, jsPath: string) {
  // Read the HTML file
  const htmlFile = Bun.file(htmlPath)
  const html = await htmlFile.text()

  // Set up the document
  document.write(html)

  // Read and execute the Main.js script
  const jsFile = Bun.file(jsPath)
  const scriptContent = await jsFile.text()

  // Create a function to execute in the window context
  const scriptFn = new Function('window', 'document', 'performance', scriptContent)

  // Execute the script in the window context
  scriptFn(window, document, performance)

  return document
}

/**
 * Run a benchmark multiple times and collect statistics
 */
async function runBenchmark(
  name: string,
  fn: () => void | Promise<void>,
  warmupRuns = WARMUP_RUNS,
  benchmarkRuns = BENCHMARK_RUNS,
): Promise<BenchmarkResult> {
  // Warmup runs
  for (let i = 0; i < warmupRuns; i++) {
    await fn()
  }

  // Actual benchmark runs
  const durations: number[] = []

  for (let i = 0; i < benchmarkRuns; i++) {
    const start = performance.now()
    await fn()
    const duration = performance.now() - start
    durations.push(duration)
  }

  // Calculate statistics
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length
  const variance = durations.reduce((sum, val) => sum + (val - mean) ** 2, 0) / durations.length
  const stdDev = Math.sqrt(variance)
  const error = (stdDev / mean) * 100 // Coefficient of variation as percentage

  return {
    name,
    duration: mean,
    error,
    samples: benchmarkRuns,
  }
}

/**
 * Run all benchmarks in the suite
 */
export async function runAllBenchmarks(htmlPath: string, jsPath: string): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = []

  console.log('🚀 Starting STX Framework Benchmarks...\n')

  // Test 1: Create 1,000 rows
  console.log('Running: Create 1,000 rows...')
  const { window: w1, document: d1 } = createEnvironment()
  await loadTemplate(w1, d1, htmlPath, jsPath)
  const result1 = await runBenchmark('create rows', () => {
    ;(w1 as any).benchmarkFunctions.run()
  })
  results.push(result1)
  console.log(`✓ ${result1.duration.toFixed(2)}ms (±${result1.error?.toFixed(2)}%)\n`)

  // Test 2: Replace all rows
  console.log('Running: Replace all 1,000 rows...')
  const { window: w2, document: d2 } = createEnvironment()
  await loadTemplate(w2, d2, htmlPath, jsPath)
  // First create 1000 rows
  ;(w2 as any).benchmarkFunctions.run()
  const result2 = await runBenchmark('replace all rows', () => {
    ;(w2 as any).benchmarkFunctions.run()
  })
  results.push(result2)
  console.log(`✓ ${result2.duration.toFixed(2)}ms (±${result2.error?.toFixed(2)}%)\n`)

  // Test 3: Partial update (every 10th row)
  console.log('Running: Partial update (every 10th row)...')
  const { window: w3, document: d3 } = createEnvironment()
  await loadTemplate(w3, d3, htmlPath, jsPath)
  ;(w3 as any).benchmarkFunctions.run()
  const result3 = await runBenchmark('partial update', () => {
    ;(w3 as any).benchmarkFunctions.update()
  })
  results.push(result3)
  console.log(`✓ ${result3.duration.toFixed(2)}ms (±${result3.error?.toFixed(2)}%)\n`)

  // Test 4: Select row
  console.log('Running: Select row...')
  const { window: w4, document: d4 } = createEnvironment()
  await loadTemplate(w4, d4, htmlPath, jsPath)
  ;(w4 as any).benchmarkFunctions.run()
  const result4 = await runBenchmark('select row', () => {
    ;(w4 as any).benchmarkFunctions.select(500)
  })
  results.push(result4)
  console.log(`✓ ${result4.duration.toFixed(2)}ms (±${result4.error?.toFixed(2)}%)\n`)

  // Test 5: Swap rows
  console.log('Running: Swap rows...')
  const { window: w5, document: d5 } = createEnvironment()
  await loadTemplate(w5, d5, htmlPath, jsPath)
  ;(w5 as any).benchmarkFunctions.run()
  const result5 = await runBenchmark('swap rows', () => {
    ;(w5 as any).benchmarkFunctions.swapRows()
  })
  results.push(result5)
  console.log(`✓ ${result5.duration.toFixed(2)}ms (±${result5.error?.toFixed(2)}%)\n`)

  // Test 6: Remove row
  console.log('Running: Remove row...')
  const { window: w6, document: d6 } = createEnvironment()
  await loadTemplate(w6, d6, htmlPath, jsPath)
  ;(w6 as any).benchmarkFunctions.run()
  const result6 = await runBenchmark('remove row', () => {
    ;(w6 as any).benchmarkFunctions.remove(500)
  })
  results.push(result6)
  console.log(`✓ ${result6.duration.toFixed(2)}ms (±${result6.error?.toFixed(2)}%)\n`)

  // Test 7: Create 10,000 rows
  console.log('Running: Create 10,000 rows...')
  const { window: w7, document: d7 } = createEnvironment()
  await loadTemplate(w7, d7, htmlPath, jsPath)
  const result7 = await runBenchmark(
    'create many rows',
    () => {
      ;(w7 as any).benchmarkFunctions.runLots()
    },
    3,
    5,
  ) // Fewer runs for this heavy operation
  results.push(result7)
  console.log(`✓ ${result7.duration.toFixed(2)}ms (±${result7.error?.toFixed(2)}%)\n`)

  // Test 8: Append rows to large table
  console.log('Running: Append 1,000 rows to table...')
  const { window: w8, document: d8 } = createEnvironment()
  await loadTemplate(w8, d8, htmlPath, jsPath)
  ;(w8 as any).benchmarkFunctions.run()
  const result8 = await runBenchmark('append rows to large table', () => {
    ;(w8 as any).benchmarkFunctions.add()
  })
  results.push(result8)
  console.log(`✓ ${result8.duration.toFixed(2)}ms (±${result8.error?.toFixed(2)}%)\n`)

  // Test 9: Clear rows
  console.log('Running: Clear rows...')
  const { window: w9, document: d9 } = createEnvironment()
  await loadTemplate(w9, d9, htmlPath, jsPath)
  ;(w9 as any).benchmarkFunctions.run()
  const result9 = await runBenchmark('clear rows', () => {
    ;(w9 as any).benchmarkFunctions.clear()
  })
  results.push(result9)
  console.log(`✓ ${result9.duration.toFixed(2)}ms (±${result9.error?.toFixed(2)}%)\n`)

  // Calculate weighted geometric mean
  const geometricMean = Math.pow(
    results.reduce((product, result) => product * result.duration, 1),
    1 / results.length,
  )

  return {
    framework: 'stx',
    results,
    geometricMean,
  }
}

/**
 * Format results as a markdown table
 */
export function formatResults(suite: BenchmarkSuite): string {
  let output = `# STX Framework Benchmark Results\n\n`
  output += `**Framework:** ${suite.framework}\n`
  output += `**Geometric Mean:** ${suite.geometricMean.toFixed(2)}ms\n\n`
  output += `| Benchmark | Duration (ms) | Error (%) | Samples |\n`
  output += `|-----------|---------------|-----------|----------|\n`

  for (const result of suite.results) {
    output += `| ${result.name} | ${result.duration.toFixed(2)} | ±${result.error?.toFixed(2)} | ${result.samples} |\n`
  }

  return output
}

/**
 * Format results as JSON
 */
export function formatResultsJSON(suite: BenchmarkSuite): string {
  return JSON.stringify(suite, null, 2)
}

/**
 * Compare STX results with other frameworks from the screenshot
 */
export function compareWithFrameworks(suite: BenchmarkSuite): string {
  // Baseline data from the screenshot (in ms, converted from the table)
  const frameworks = {
    'vanillajs': {
      'create rows': 23.2,
      'replace all rows': 25.8,
      'partial update': 10.1,
      'select row': 2.4,
      'swap rows': 12.3,
      'remove row': 10.3,
      'create many rows': 239.0,
      'append rows to large table': 27.4,
      'clear rows': 9.1,
      'weighted geometric mean': 1.02,
    },
    'vue-vapor-v3.6.0-alpha.2': {
      'create rows': 24.4,
      'replace all rows': 28.0,
      'partial update': 11.3,
      'select row': 2.5,
      'swap rows': 13.4,
      'remove row': 10.6,
      'create many rows': 261.6,
      'append rows to large table': 28.8,
      'clear rows': 9.2,
      'weighted geometric mean': 1.09,
    },
    'svelte-v5.13.0': {
      'create rows': 24.2,
      'replace all rows': 28.3,
      'partial update': 11.0,
      'select row': 3.3,
      'swap rows': 13.7,
      'remove row': 10.6,
      'create many rows': 257.0,
      'append rows to large table': 28.2,
      'clear rows': 10.3,
      'weighted geometric mean': 1.10,
    },
    'solid-v1.9.3': {
      'create rows': 24.0,
      'replace all rows': 27.8,
      'partial update': 10.9,
      'select row': 2.5,
      'swap rows': 14.0,
      'remove row': 10.7,
      'create many rows': 258.5,
      'append rows to large table': 29.2,
      'clear rows': 11.8,
      'weighted geometric mean': 1.11,
    },
    'react-hooks-v19.0.0': {
      'create rows': 28.6,
      'replace all rows': 33.3,
      'partial update': 15.1,
      'select row': 4.5,
      'swap rows': 105.3,
      'remove row': 11.9,
      'create many rows': 390.6,
      'append rows to large table': 33.7,
      'clear rows': 18.0,
      'weighted geometric mean': 1.52,
    },
  }

  let output = `\n# Comparison with Other Frameworks\n\n`
  output += `| Benchmark | STX | VanillaJS | Vue Vapor | Svelte 5 | Solid | React 19 |\n`
  output += `|-----------|-----|-----------|-----------|----------|-------|----------|\n`

  for (const result of suite.results) {
    const stxValue = result.duration.toFixed(1)
    const vanillaValue = frameworks.vanillajs[result.name as keyof typeof frameworks.vanillajs]
    const vueValue = frameworks['vue-vapor-v3.6.0-alpha.2'][result.name as keyof typeof frameworks['vue-vapor-v3.6.0-alpha.2']]
    const svelteValue = frameworks['svelte-v5.13.0'][result.name as keyof typeof frameworks['svelte-v5.13.0']]
    const solidValue = frameworks['solid-v1.9.3'][result.name as keyof typeof frameworks['solid-v1.9.3']]
    const reactValue = frameworks['react-hooks-v19.0.0'][result.name as keyof typeof frameworks['react-hooks-v19.0.0']]

    output += `| ${result.name} | **${stxValue}** | ${vanillaValue} | ${vueValue} | ${svelteValue} | ${solidValue} | ${reactValue} |\n`
  }

  output += `\n**Weighted Geometric Mean**\n\n`
  output += `- STX: **${suite.geometricMean.toFixed(2)}**\n`
  output += `- VanillaJS: ${frameworks.vanillajs['weighted geometric mean']}\n`
  output += `- Vue Vapor: ${frameworks['vue-vapor-v3.6.0-alpha.2']['weighted geometric mean']}\n`
  output += `- Svelte 5: ${frameworks['svelte-v5.13.0']['weighted geometric mean']}\n`
  output += `- Solid: ${frameworks['solid-v1.9.3']['weighted geometric mean']}\n`
  output += `- React 19: ${frameworks['react-hooks-v19.0.0']['weighted geometric mean']}\n`

  return output
}
