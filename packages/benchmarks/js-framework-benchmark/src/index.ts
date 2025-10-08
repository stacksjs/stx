/**
 * Main entry point for js-framework-benchmark
 */

import path from 'node:path'
import { compareWithFrameworks, formatResults, formatResultsJSON, runAllBenchmarks } from './runner'

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('   STX Framework - JS Framework Benchmark Suite')
  console.log('═══════════════════════════════════════════════════════\n')

  const templatePath = path.join(import.meta.dir, 'index.stx')

  try {
    // Run all benchmarks
    const results = await runAllBenchmarks(templatePath)

    // Format and display results
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('   RESULTS')
    console.log('═══════════════════════════════════════════════════════\n')

    const markdown = formatResults(results)
    console.log(markdown)

    // Display comparison
    const comparison = compareWithFrameworks(results)
    console.log(comparison)

    // Save results to files
    const resultsDir = path.join(import.meta.dir, '..', 'results')
    await Bun.write(path.join(resultsDir, 'results.md'), markdown)
    await Bun.write(path.join(resultsDir, 'results.json'), formatResultsJSON(results))
    await Bun.write(path.join(resultsDir, 'comparison.md'), comparison)

    console.log('\n✨ Results saved to packages/benchmarks/js-framework-benchmark/results/')
    console.log('   - results.md')
    console.log('   - results.json')
    console.log('   - comparison.md\n')
  }
  catch (error) {
    console.error('❌ Error running benchmarks:', error)
    process.exit(1)
  }
}

main()
