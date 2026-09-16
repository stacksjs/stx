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
 *      (then runs the slice-size sweep, one child process per case)
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
 * Slices share at every size measured, not only large ones. An earlier version
 * of this comment said "large", and a commit built on that word claimed small
 * slices copy -- so the sweep below exists to pin the threshold rather than
 * imply it. Each case runs in its own process against a random, flattened
 * parent, next to a CONTROL that forces a real copy of the same characters, so
 * a slice that did copy would be visible:
 *
 *   slice size    48MB of content as slices    as forced copies
 *        256B              rss  +17.1MB             rss +124.7MB
 *       4096B              rss   +2.5MB             rss  +78.6MB
 *      23000B              rss   +1.8MB             rss  +69.0MB
 *
 * What a small slice does cost is its string object: +17.1MB over 196,608
 * retained 256-byte slices is about 87 bytes each, which at small sizes can
 * exceed the characters themselves.
 *
 * The two conclusions that change how an optimisation is judged:
 *
 *   1. A slice shares the parent's buffer at any size. Rewriting code to avoid
 *      re-slicing a string removes its length from the probe but only one
 *      string object from the machine.
 *   2. Concatenation is a rope, deferred until something needs contiguous
 *      characters. The cost lands at the regex or indexOf that follows, and is
 *      attributed by the probe to whatever built the pieces.
 *
 * So: optimise away whole-document rebuilds, scans and regex passes. Confirm
 * every win against latency, never against the probe alone.
 */

const SWEEP_SIZES = [256, 4096, 23000]

/**
 * One sweep case, in a fresh process so no earlier case's retention is in its
 * RSS. `copy` is the control: the same characters, forced into a new string.
 */
function sweepCase(size: number, mode: string): void {
  const count = Math.min(Math.floor((48 * 1048576) / size), 200_000)
  const pieces: string[] = []
  let length = 0
  while (length < size + count + 4096) {
    const piece = `${crypto.randomUUID()}<div class="a">${Math.random()}`
    pieces.push(piece)
    length += piece.length
  }
  const parent = pieces.join('')
  parent.indexOf('~~not-present~~') // force it flat before measuring

  const kept: string[] = []
  Bun.gc(true)
  const base = process.memoryUsage.rss()
  for (let i = 0; i < count; i++) {
    const slice = parent.slice(i, i + size)
    kept.push(mode === 'copy' ? Buffer.from(slice, 'latin1').toString('latin1') : slice)
  }
  Bun.gc(true)
  const grew = (process.memoryUsage.rss() - base) / 1048576
  // eslint-disable-next-line no-console
  console.log(`${String(size).padStart(6)}B x${String(kept.length).padStart(6)}  ${mode.padEnd(5)}  content=${((count * size) / 1048576).toFixed(0)}MB  rss +${grew.toFixed(1)}MB`)
}

if (process.argv[2] === 'sweep') {
  sweepCase(Number(process.argv[3]), process.argv[4])
  process.exit(0)
}

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

// eslint-disable-next-line no-console
console.log('\nslice-size sweep (each case in its own process):')
for (const size of SWEEP_SIZES) {
  for (const mode of ['slice', 'copy']) {
    const child = Bun.spawnSync(['bun', import.meta.path, 'sweep', String(size), mode])
    process.stdout.write(child.stdout)
  }
}
