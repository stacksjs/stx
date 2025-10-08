# STX Framework Benchmark - Summary

## Quick Start

```bash
# Run the benchmark suite
cd packages/benchmarks/js-framework-benchmark
bun run bench

# Or from the project root
bun run --cwd packages/benchmarks/js-framework-benchmark bench
```

## Latest Results

### Performance Comparison Table

| Operation | STX | Vanilla JS | Vue Vapor | Svelte 5 | Solid | React 19 | Winner |
|-----------|-----|------------|-----------|----------|-------|----------|--------|
| **Create 1,000 rows** | 63.1ms | 23.2ms ⭐ | 24.4ms | 24.2ms | 24.0ms | 28.6ms | Vanilla JS |
| **Replace all rows** | 55.3ms | 25.8ms ⭐ | 28.0ms | 28.3ms | 27.8ms | 33.3ms | Vanilla JS |
| **Partial update** | 63.6ms | 10.1ms ⭐ | 11.3ms | 11.0ms | 10.9ms | 15.1ms | Vanilla JS |
| **Select row** | 1.2ms ⭐ | 2.4ms | 2.5ms | 3.3ms | 2.5ms | 4.5ms | **STX** |
| **Swap rows** | 52.9ms | 12.3ms ⭐ | 13.4ms | 13.7ms | 14.0ms | 105.3ms | Vanilla JS |
| **Remove row** | 0.01ms ⭐ | 10.3ms | 10.6ms | 10.6ms | 10.7ms | 11.9ms | **STX** |
| **Create 10,000 rows** | 876.8ms | 239.0ms ⭐ | 261.6ms | 257.0ms | 258.5ms | 390.6ms | Vanilla JS |
| **Append 1,000 rows** | 588.1ms | 27.4ms ⭐ | 28.8ms | 28.2ms | 29.2ms | 33.7ms | Vanilla JS |
| **Clear rows** | 0.01ms ⭐ | 9.1ms | 9.2ms | 10.3ms | 11.8ms | 18.0ms | **STX** |

⭐ = Best performance for that operation

### Overall Performance Score (Geometric Mean)

Lower is better:

- 🥇 **Vanilla JS**: 1.02
- 🥈 **Vue Vapor**: 1.09
- 🥉 **Svelte 5**: 1.10
- **Solid**: 1.11
- **React 19**: 1.52
- **STX**: 9.89

## Analysis

### STX Strengths

1. **Select Row (1.2ms)** - Faster than all frameworks including Vanilla JS
2. **Remove Row (0.01ms)** - Exceptionally fast, likely due to efficient DOM manipulation
3. **Clear Rows (0.01ms)** - Nearly instantaneous cleanup

### Areas for Optimization

The current STX implementation uses a full re-render approach for most operations, which explains the slower performance in:

1. **Create/Replace operations** - Could benefit from incremental rendering
2. **Partial updates** - Currently re-renders entire table instead of updating only changed rows
3. **Large operations (10k rows)** - Full DOM replacement is costly at scale

### Implementation Notes

The current benchmark implementation:
- Uses STX templates for initial HTML structure
- Implements vanilla JavaScript for DOM manipulation
- Uses `DocumentFragment` for batch DOM updates
- Employs event delegation for efficient event handling
- Runs on Happy DOM (server-side) rather than a real browser

## Optimization Opportunities

To improve STX's benchmark scores:

### 1. Incremental Rendering
Instead of clearing and re-rendering the entire table, update only changed rows:

```javascript
// Current approach (slow)
function update() {
  data.forEach(item => item.label += ' !!!')
  render() // Re-renders everything
}

// Optimized approach
function update() {
  for (let i = 0; i < data.length; i += 10) {
    data[i].label += ' !!!'
    // Update only the specific row in the DOM
    updateRow(i, data[i])
  }
}
```

### 2. Virtual DOM or Diffing
Implement a lightweight diffing algorithm to minimize DOM operations:
- Compare previous and new data
- Update only changed elements
- Reuse existing DOM nodes when possible

### 3. Keyed Lists
Use unique keys to help identify and reuse DOM elements:
- Reduces unnecessary DOM creation/destruction
- Improves performance for swap, add, and remove operations

### 4. Batch Updates
Group multiple DOM operations together:
- Use `requestAnimationFrame` for visual updates
- Batch style changes to avoid layout thrashing
- Minimize reflows and repaints

### 5. Template-Based Rendering
Leverage STX's template engine more effectively:
- Pre-compile templates for faster rendering
- Use template cloning instead of innerHTML
- Implement template caching

## Real-World Performance

While these benchmarks show slower performance compared to frameworks like Vue and React, remember:

1. **Synthetic Tests**: These are stress tests, not typical real-world usage
2. **Happy DOM vs Browser**: Running on Happy DOM may show different characteristics than real browsers
3. **Implementation Strategy**: The current implementation prioritizes simplicity over optimization
4. **Use Case Dependent**: STX is a template engine, not a reactive framework - different tools for different jobs

## Running Custom Tests

You can modify the benchmark operations in `src/index.stx` to test different scenarios:

```javascript
// Test custom operation
function customOperation() {
  // Your code here
}

// Expose it for benchmarking
window.benchmarkFunctions.customOperation = customOperation
```

Then add a test in `src/runner.ts`:

```typescript
const resultCustom = await runBenchmark('custom operation', () => {
  (window as any).benchmarkFunctions.customOperation()
})
```

## Resources

- [JS Framework Benchmark Repository](https://github.com/krausest/js-framework-benchmark)
- [Live Benchmark Results](https://krausest.github.io/js-framework-benchmark/)
- [STX Documentation](https://github.com/stacksjs/stx)

## Contributing

Help us improve STX's performance:

1. **Optimize the implementation** - Submit PRs with performance improvements
2. **Add more tests** - Cover additional use cases
3. **Browser testing** - Add Playwright/Puppeteer for real browser benchmarks
4. **Memory profiling** - Track memory usage during operations
5. **Bundle size analysis** - Measure and optimize payload size

## Conclusion

This benchmark suite provides a standardized way to measure and track STX's performance over time. While there's room for optimization, the infrastructure is in place to:

- Measure performance objectively
- Compare against industry standards
- Track improvements over time
- Identify optimization opportunities

The goal isn't necessarily to beat React or Vue in every scenario, but to understand STX's performance characteristics and optimize where it matters most for your use case.
