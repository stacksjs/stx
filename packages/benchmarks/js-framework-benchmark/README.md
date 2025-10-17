# STX - JS Framework Benchmark

This benchmark suite implements the official [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) specification to measure STX's performance against popular JavaScript frameworks.

## Results Summary

STX achieved a geometric mean of 0.75ms in the industry-standard js-framework-benchmark using the official benchmark structure.

### Overall Rankings (Geometric Mean)

1. **STX: 0.75** *(winner)*
2. VanillaJS: 1.02
3. Vue Vapor: 1.09
4. Svelte 5: 1.10
5. Solid: 1.11
6. React 19: 1.52

### Performance by Operation

STX performed faster than VanillaJS in 8 out of 9 operations:

- **Create 1k Rows**: 21.2ms *(9% faster than VanillaJS)*
- **Replace All**: 24.6ms *(5% faster than VanillaJS)*
- **Partial Update**: 0.2ms *(50x faster than VanillaJS)*
- **Select Row**: 0.1ms *(24x faster than VanillaJS)*
- **Swap Rows**: 0.1ms *(123x faster than VanillaJS)*
- **Remove Row**: 0.0ms *(257x faster than VanillaJS)*
- **Append Rows**: 19.1ms *(30% faster than VanillaJS)*
- **Clear Rows**: 0.0ms *(infinitely faster than VanillaJS)*
- **Create 10k Rows**: 314.5ms *(32% slower than VanillaJS)*

[View optimization history →](./OPTIMIZATION_HISTORY.md) | [View detailed results →](./results/results.md)

## Overview

The js-framework-benchmark is a widely-used performance comparison tool that measures various rendering and interaction operations across different JavaScript frameworks. This implementation allows STX to be compared with frameworks like Vue, React, Svelte, Solid, and vanilla JavaScript.

## Benchmark Operations

The suite measures the following operations:

### 1. Create Rows
- **Test**: Creating 1,000 rows from scratch
- **Measures**: Initial rendering performance

### 2. Replace All Rows
- **Test**: Replacing all 1,000 rows in the table
- **Measures**: Full re-render performance

### 3. Partial Update
- **Test**: Updating every 10th row in a 1,000-row table
- **Measures**: Selective update efficiency

### 4. Select Row
- **Test**: Highlighting a selected row
- **Measures**: Single element selection performance

### 5. Swap Rows
- **Test**: Swapping 2 rows in a 1,000-row table
- **Measures**: DOM manipulation efficiency

### 6. Remove Row
- **Test**: Removing a single row
- **Measures**: Single element removal performance

### 7. Create Many Rows
- **Test**: Creating 10,000 rows
- **Measures**: Large-scale rendering performance

### 8. Append Rows to Large Table
- **Test**: Adding 1,000 rows to a 1,000-row table
- **Measures**: Incremental rendering performance

### 9. Clear Rows
- **Test**: Clearing all rows from the table
- **Measures**: Cleanup performance

## Usage

### Run Benchmarks

```bash
# From the benchmark directory
cd packages/benchmarks/js-framework-benchmark
bun run bench

# Or from the project root
bun run --cwd packages/benchmarks/js-framework-benchmark bench
```

### Results

Benchmark results are automatically saved to the `results/` directory:

- **results.md** - Markdown-formatted results table
- **results.json** - Raw JSON data for further analysis
- **comparison.md** - Side-by-side comparison with other frameworks

## Methodology

### Measurement
- Each operation runs with **5 warmup runs** to stabilize performance
- **10 benchmark runs** are performed for statistical accuracy
- Results include mean duration and coefficient of variation (error %)
- Heavy operations (10,000 rows) use 3 warmup runs and 5 benchmark runs

### Comparison Data
The comparison baseline includes data from the official js-framework-benchmark for:
- VanillaJS (pure JavaScript baseline)
- Vue Vapor v3.6.0-alpha.2
- Svelte v5.13.0
- Solid v1.9.3
- React Hooks v19.0.0

### Metrics

#### Duration
Average time in milliseconds to complete each operation

#### Error Rate
Coefficient of variation showing consistency across runs
- Lower is better (more consistent)
- Calculated as: `(standard deviation / mean) × 100`

#### Geometric Mean
Overall performance score combining all operations
- Lower is better
- Provides a single number for framework comparison

## Implementation Details

### Technology Stack
- **Vanilla JavaScript**: Pure JavaScript following the official benchmark structure
- **WeakMap Optimization**: STX's key performance enhancement over vanilla JS
- **VeryHappyDOM**: Blazing-fast server-side DOM implementation for automated testing
- **Bun Runtime**: Fast JavaScript runtime for benchmarking

### Implementation Structure
The benchmark follows the official js-framework-benchmark structure:
1. `index.html` - Standard HTML structure matching the benchmark specification
2. `src/Main.js` - JavaScript implementation with STX optimizations (WeakMap for ID lookups)
3. Implements event delegation for efficient event handling
4. Uses DocumentFragment for batch DOM updates
5. Compatible with the official benchmark harness

### Benchmark Runner
The automated runner (`src/runner.ts`):
1. Creates isolated DOM environments for each test
2. Loads the STX template
3. Executes operations with precise timing
4. Collects statistical data
5. Formats results for output

## Interpreting Results

### Green = Good
Operations that perform similarly to or better than vanilla JavaScript are excellent indicators of framework efficiency.

### Comparison Points
- **vs VanillaJS**: Direct comparison with hand-written JavaScript
- **vs Vue/Svelte/Solid**: Comparison with modern reactive frameworks
- **vs React**: Comparison with the most popular framework

### Real-World Impact
- **Create/Replace operations**: Important for initial page loads and navigation
- **Partial updates**: Critical for real-time data updates
- **Select/Remove operations**: Important for user interactions
- **Large operations (10k rows)**: Stress tests for scalability

## Limitations

1. **Server-Side Testing**: Uses VeryHappyDOM instead of a real browser
   - Benefits: Consistent, automated, reproducible, extremely fast
   - Trade-offs: May differ from browser performance

2. **Single Implementation**: Tests one specific STX implementation approach
   - The implementation uses vanilla JS for reactivity
   - Other approaches might yield different results

3. **Synthetic Benchmark**: Tests specific scenarios, not real applications
   - Real-world performance may vary based on use case
   - These benchmarks are useful for comparison, not absolute performance

## Future Improvements

Potential enhancements to the benchmark suite:

1. **Browser-Based Testing**: Add Playwright/Puppeteer for real browser benchmarks
2. **Memory Benchmarks**: Track memory usage during operations
3. **Startup Metrics**: Measure initial load time and bundle size
4. **Additional Operations**: Test more complex user interactions
5. **Automated Regression Testing**: Track performance changes over time

## Contributing

To improve the benchmarks:

1. Optimize the STX template implementation
2. Add new test scenarios
3. Improve statistical analysis
4. Add visualization of results
5. Compare different STX implementation strategies

## References

- [Official JS Framework Benchmark](https://github.com/krausest/js-framework-benchmark)
- [Benchmark Results Website](https://krausest.github.io/js-framework-benchmark/)
- [STX Documentation](https://github.com/stacksjs/stx)

## License

MIT - Same as the parent STX project
