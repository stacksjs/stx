/**
 * What a string operation actually costs in this engine (stacksjs/stx#1945).
 *
 * `render-view-allocation-probe.ts` counts the bytes every `String.prototype`
 * call materialises. That number guided the #1945 work, and it is a PROXY: it
 * charges the slice that produced the content, while JSC charges the flatten
 * that consumes it. This script is the evidence for that claim, kept runnable
 * so the next person can check it against their own build instead of trusting
 * the comment.
 *
 * Run: bun packages/stx/test/performance/string-cost-model.ts
 *
 * Not a test. It reads RSS, which is allocator high-water and moves with GC
 * timing and platform, so asserting on it in CI would buy a flaky gate for a
 * fact that only needs to be reproducible on demand.
 *
 * Measured on Bun 1.3.14 / arm64 darwin:
 *
 *   base, one 38MB parent string                         rss  61.1MB
 *   + 20 large slices retained (763MB of "content")      rss  61.5MB   <- free
 *   + 20 concatenations retained, unflattened            rss  61.6MB   <- free
 *   + the same 20 forced flat                            rss 803.5MB   <- paid
 *
 * The two conclusions that change how an optimisation is judged:
 *
 *   1. A large slice shares the parent's buffer. Rewriting code to avoid
 *      re-slicing a string it already holds removes bytes from the probe and no
 *      work from the machine.
 *   2. Concatenation is a rope, deferred until something needs contiguous
 *      characters. The cost lands at the regex or indexOf that follows, and is
 *      attributed by the probe to whatever built the pieces.
 *
 * So: optimise away whole-document rebuilds, scans and regex passes. Confirm
 * every win against latency, never against the probe alone.
 */

function rssMB(): string {
  return (process.memoryUsage.rss() / 1048576).toFixed(1)
}

const BIG = 40_000_000
const big = 'x'.repeat(BIG)
Bun.gc(true)
// eslint-disable-next-line no-console
console.log(`base (one ${(BIG / 1048576).toFixed(0)}MB parent string)        rss=${rssMB()}MB`)

const slices: string[] = []
for (let i = 0; i < 20; i++)
  slices.push(big.slice(i, i + BIG - 1000))
Bun.gc(true)
// eslint-disable-next-line no-console
console.log(`+ 20 large slices (${(20 * (BIG - 1000) / 1048576).toFixed(0)}MB of content)  rss=${rssMB()}MB  len=${slices[0].length}`)

const ropes: string[] = []
for (let i = 0; i < 20; i++)
  ropes.push(`${big.slice(0, 100)}${big.slice(100)}`)
Bun.gc(true)
// eslint-disable-next-line no-console
console.log(`+ 20 concatenations, unflattened          rss=${rssMB()}MB`)

// indexOf needs contiguous characters, so each rope is flattened here.
let sink = 0
for (const rope of ropes)
  sink += rope.indexOf('yz')
Bun.gc(true)
// eslint-disable-next-line no-console
console.log(`+ those 20 forced flat                    rss=${rssMB()}MB  (sink=${sink})`)
