/**
 * @stacksjs/benchmarks
 *
 * Performance benchmarks comparing @stacksjs/markdown and @stacksjs/sanitizer
 * against popular competitors in the ecosystem.
 *
 * Usage:
 *   bun run bench              - Run all benchmarks
 *   bun run bench:markdown     - Run markdown parsing benchmarks
 *   bun run bench:frontmatter  - Run frontmatter parsing benchmarks
 *   bun run bench:yaml         - Run YAML parsing benchmarks
 *   bun run bench:sanitizer    - Run HTML sanitization benchmarks
 */

export { default as runAllBenchmarks } from './all-bench'
