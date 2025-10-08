/**
 * Compare optimized vs unoptimized STX implementation
 */

import path from 'node:path'
import { runAllBenchmarks } from './runner'

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('   STX Optimization Comparison')
  console.log('═══════════════════════════════════════════════════════\n')

  const originalPath = path.join(import.meta.dir, 'index.stx')
  const optimizedPath = path.join(import.meta.dir, 'index-optimized.stx')

  console.log('📊 Running ORIGINAL implementation...\n')
  const originalResults = await runAllBenchmarks(originalPath)

  console.log('\n\n📊 Running OPTIMIZED implementation...\n')
  const optimizedResults = await runAllBenchmarks(optimizedPath)

  // Calculate improvements
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('   OPTIMIZATION RESULTS')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('| Operation | Original | Optimized | Improvement |')
  console.log('|-----------|----------|-----------|-------------|')

  for (let i = 0; i < originalResults.results.length; i++) {
    const original = originalResults.results[i]
    const optimized = optimizedResults.results[i]

    const improvement = ((original.duration - optimized.duration) / original.duration) * 100
    const speedup = original.duration / optimized.duration

    const improvementStr = improvement > 0
      ? `✅ ${improvement.toFixed(1)}% faster (${speedup.toFixed(2)}x)`
      : `❌ ${Math.abs(improvement).toFixed(1)}% slower (${speedup.toFixed(2)}x)`

    console.log(`| ${original.name} | ${original.duration.toFixed(2)}ms | ${optimized.duration.toFixed(2)}ms | ${improvementStr} |`)
  }

  console.log('\n**Geometric Mean**\n')
  console.log(`- Original: ${originalResults.geometricMean.toFixed(2)}ms`)
  console.log(`- Optimized: ${optimizedResults.geometricMean.toFixed(2)}ms`)
  const totalImprovement = ((originalResults.geometricMean - optimizedResults.geometricMean) / originalResults.geometricMean) * 100
  console.log(`- Overall improvement: ${totalImprovement.toFixed(1)}%\n`)

  // Compare with other frameworks
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('   OPTIMIZED VS OTHER FRAMEWORKS')
  console.log('═══════════════════════════════════════════════════════\n')

  const frameworks = {
    'VanillaJS': [23.2, 25.8, 10.1, 2.4, 12.3, 10.3, 239.0, 27.4, 9.1],
    'Vue Vapor': [24.4, 28.0, 11.3, 2.5, 13.4, 10.6, 261.6, 28.8, 9.2],
    'Svelte 5': [24.2, 28.3, 11.0, 3.3, 13.7, 10.6, 257.0, 28.2, 10.3],
    'Solid': [24.0, 27.8, 10.9, 2.5, 14.0, 10.7, 258.5, 29.2, 11.8],
    'React 19': [28.6, 33.3, 15.1, 4.5, 105.3, 11.9, 390.6, 33.7, 18.0],
  }

  console.log('| Operation | STX Optimized | VanillaJS | Vue Vapor | Svelte 5 | Solid | React 19 |')
  console.log('|-----------|---------------|-----------|-----------|----------|-------|----------|')

  for (let i = 0; i < optimizedResults.results.length; i++) {
    const result = optimizedResults.results[i]
    const stxValue = result.duration.toFixed(1)

    const values = [
      stxValue,
      frameworks['VanillaJS'][i].toFixed(1),
      frameworks['Vue Vapor'][i].toFixed(1),
      frameworks['Svelte 5'][i].toFixed(1),
      frameworks['Solid'][i].toFixed(1),
      frameworks['React 19'][i].toFixed(1),
    ]

    // Find the best (lowest) value
    const minValue = Math.min(...values.map(v => parseFloat(v)))
    const formattedValues = values.map(v =>
      parseFloat(v) === minValue ? `**${v}**` : v,
    )

    console.log(`| ${result.name} | ${formattedValues.join(' | ')} |`)
  }

  console.log('\n✅ Comparison complete!\n')

  // Save results
  const resultsDir = path.join(import.meta.dir, '..', 'results')

  const comparisonMd = `# STX Optimization Comparison

## Performance Improvements

| Operation | Original | Optimized | Improvement |
|-----------|----------|-----------|-------------|
${originalResults.results.map((original, i) => {
  const optimized = optimizedResults.results[i]
  const improvement = ((original.duration - optimized.duration) / original.duration) * 100
  const speedup = original.duration / optimized.duration
  const improvementStr = improvement > 0
    ? `✅ ${improvement.toFixed(1)}% faster (${speedup.toFixed(2)}x)`
    : `❌ ${Math.abs(improvement).toFixed(1)}% slower`
  return `| ${original.name} | ${original.duration.toFixed(2)}ms | ${optimized.duration.toFixed(2)}ms | ${improvementStr} |`
}).join('\n')}

**Geometric Mean**

- Original: ${originalResults.geometricMean.toFixed(2)}ms
- Optimized: ${optimizedResults.geometricMean.toFixed(2)}ms
- Overall improvement: ${totalImprovement.toFixed(1)}%

## Optimized STX vs Other Frameworks

| Operation | STX Optimized | VanillaJS | Vue Vapor | Svelte 5 | Solid | React 19 |
|-----------|---------------|-----------|-----------|----------|-------|----------|
${optimizedResults.results.map((result, i) => {
  const stxValue = result.duration.toFixed(1)
  const values = [
    stxValue,
    frameworks['VanillaJS'][i].toFixed(1),
    frameworks['Vue Vapor'][i].toFixed(1),
    frameworks['Svelte 5'][i].toFixed(1),
    frameworks['Solid'][i].toFixed(1),
    frameworks['React 19'][i].toFixed(1),
  ]
  const minValue = Math.min(...values.map(v => parseFloat(v)))
  const formattedValues = values.map(v => parseFloat(v) === minValue ? `**${v}**` : v)
  return `| ${result.name} | ${formattedValues.join(' | ')} |`
}).join('\n')}
`

  await Bun.write(path.join(resultsDir, 'optimization-comparison.md'), comparisonMd)
  console.log('📝 Results saved to results/optimization-comparison.md\n')
}

main()
