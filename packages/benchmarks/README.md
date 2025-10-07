# @stacksjs/benchmarks

Performance benchmarks comparing `@stacksjs/markdown` and `@stacksjs/sanitizer` against popular competitors in the ecosystem.

## Overview

This package provides comprehensive benchmarks to measure the performance of our Bun-powered implementations against established libraries:

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

### Example Output

```
📊 Markdown Parsing Benchmarks
======================================================================

📄 Small Document (< 1KB)

Library                     Operations     Speed
----------------------------------------------------------------------
@stacksjs/markdown              125,000 ops/sec  ±0.5%  (0.008ms avg)
marked                          100,000 ops/sec  ±0.8%  (0.010ms avg)
markdown-it                      95,000 ops/sec  ±1.2%  (0.011ms avg)
showdown                         85,000 ops/sec  ±0.9%  (0.012ms avg)

🏆 Fastest: @stacksjs/markdown

📈 Summary

Small: @stacksjs/markdown is 1.25x faster than marked
Medium: @stacksjs/markdown is 1.42x faster than marked
Large: @stacksjs/markdown is 1.38x faster than marked
```

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
