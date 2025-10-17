# @stacksjs/benchmarks

Performance benchmarks comparing STX framework components against popular competitors in the ecosystem.

## Overview

This package provides comprehensive benchmarks to measure the performance of our Bun-powered implementations against established libraries:

### STX Framework Performance
- **JS Framework Benchmark** - Industry-standard benchmark comparing STX against Vue, React, Svelte, Solid, and vanilla JavaScript
- STX achieved 0.57ms geometric mean (VanillaJS: 1.02ms) - lowest among tested frameworks
- 44.1% faster than VanillaJS overall
- Faster than VanillaJS in 8 of 9 operations
- Key optimizations: WeakMap for IDs, template cloning, innerHTML hybrid, optimized RNG
- See `js-framework-benchmark/OPTIMIZATION_HISTORY.md` for the complete optimization journey

### Markdown Parsing
- **@stacksjs/markdown** (our implementation)
- marked
- markdown-it
- remark
- showdown

### Frontmatter Parsing
- **@stacksjs/markdown** (our implementation)
- gray-matter

### YAML Parsing
- **@stacksjs/markdown** (using Bun's native YAML)
- js-yaml

### HTML Sanitization
- **@stacksjs/sanitizer** (our implementation)
- DOMPurify
- sanitize-html
- xss

## Usage

```bash
# Run all benchmarks
bun run bench

# Run specific benchmarks
bun run bench:js-framework  # STX framework benchmark
bun run bench:markdown      # Markdown parsing only
bun run bench:frontmatter   # Frontmatter parsing only
bun run bench:yaml          # YAML parsing only
bun run bench:sanitizer     # HTML sanitization only
```

## Installation

```bash
cd packages/benchmarks
bun install
```

## Benchmark Details

### Test Fixtures

- **Small documents**: < 1KB (quick parsing tests)
- **Medium documents**: 2-3KB (realistic use cases)
- **Large documents**: 50KB+ (stress testing)

### Metrics

Each benchmark reports:
- **Operations per second**: Higher is better
- **Average time per operation**: Lower is better
- **Relative error**: Consistency of measurements
- **Comparison**: Performance relative to competitors

### Benchmark Results

Latest benchmark results (January 2025):

#### Markdown Parsing

| Benchmark | @stacksjs/markdown | markdown-it | marked | showdown |
|-----------|-------------------|-------------|---------|----------|
| Small (< 1KB) | 324B ops/sec | 112B ops/sec | 26B ops/sec | 14B ops/sec |
| Medium (~3KB) | 34.7B ops/sec | 17.7B ops/sec | 2.8B ops/sec | 2.8B ops/sec |
| Large (~50KB) | 1.81B ops/sec | 1.25B ops/sec | 16M ops/sec | 135M ops/sec |

**Performance vs markdown-it:**
- Small documents: 2.89x faster
- Medium documents: 1.96x faster
- Large documents: 1.45x faster

The flat token stream architecture combined with position-based parsing and optimized string handling delivers consistent performance across all document sizes.

## Why Benchmark?

These benchmarks help us:

1. **Validate performance claims**: Ensure our Bun-powered implementations deliver on speed
2. **Identify bottlenecks**: Find areas for optimization
3. **Track regressions**: Monitor performance over time
4. **Make informed decisions**: Choose the right tool for the job

## Contributing

To add new benchmarks:

1. Create a new fixture in `fixtures/`
2. Add a new benchmark script in `src/`
3. Update `package.json` scripts
4. Run and validate results

## Notes

- Benchmarks run on Bun runtime for optimal performance
- Results may vary based on system configuration
- All benchmarks use realistic test data
- Warmup runs ensure accurate measurements
