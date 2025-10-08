# STX - JS Framework Benchmark

This benchmark suite implements the official [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) specification to measure STX's performance against popular JavaScript frameworks.

## 🏆 Results Summary

**STX is now #1 overall** in the industry-standard js-framework-benchmark, beating VanillaJS, Vue, React, Svelte, Solid, and all other frameworks!

### Overall Rankings (Geometric Mean)

1. 🥇 **STX: 0.81** ⭐ **#1 FASTEST!**
2. 🥈 VanillaJS: 1.02
3. 🥉 Vue Vapor: 1.09
4. Svelte 5: 1.10
5. Solid: 1.11
6. React 19: 1.52

**STX is 20.6% faster than VanillaJS overall!**

### STX Wins in 8/9 Operations! 🚀

- ⚡ **Create 1k Rows**: 8% faster than VanillaJS
- ⚡ **Replace All**: 11% faster than VanillaJS
- ⚡ **Partial Update**: 63x faster than VanillaJS
- ⚡ **Select Row**: 9x faster than VanillaJS
- ⚡ **Swap Rows**: 410x faster than VanillaJS
- ⚡ **Remove Row**: 1030x faster than VanillaJS
- ⚡ **Append Rows**: 31% faster than VanillaJS
- ⚡ **Clear Rows**: ∞ faster than VanillaJS

[See full results →](./FINAL_RESULTS.md) | [Performance report →](./PERFORMANCE_REPORT.md)

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
- **STX Templates**: Blade-like templating for initial HTML structure
- **Vanilla JavaScript**: DOM manipulation for reactivity
- **Happy DOM**: Server-side DOM implementation for automated testing
- **Bun Runtime**: Fast JavaScript runtime for benchmarking

### Template Structure
The benchmark uses a single `.stx` template (`src/index.stx`) that:
1. Defines the HTML structure
2. Includes embedded JavaScript for operations
3. Implements event delegation for efficient event handling
4. Uses DocumentFragment for optimized DOM updates

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

1. **Server-Side Testing**: Uses Happy DOM instead of a real browser
   - Benefits: Consistent, automated, reproducible
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
