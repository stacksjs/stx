/**
 * Reproduce the unchanged-template renderView workload from stx#1945.
 *
 * Run with `bun packages/stx/test/performance/render-view-allocation.bench.ts`.
 * RSS and JSC committed bytes describe allocator high-water, NOT cumulative
 * allocation; they are reported separately from the timed render loop.
 */
import path from 'node:path'
import { heapStats, memoryUsage } from 'bun:jsc'
import { renderView } from '../../src/build-views'

const root = path.resolve(import.meta.dir, '../../../..')
const page = path.join(root, 'packages/components/examples/sidebar-arc-spaces.stx')
const componentsDir = path.join(root, 'packages/components/src/ui/sidebar')
const options = { componentsDir }
const warmups = Number(process.env.STX_BENCH_WARMUPS ?? 10)
const samples = Number(process.env.STX_BENCH_SAMPLES ?? 40)

function digest(html: string): string {
  const normalized = html.replace(/<meta name="stx-build" content="[^"]*"\s*\/?>/g, '<meta name="stx-build" content="MASKED">')
  return new Bun.CryptoHasher('sha256').update(normalized).digest('hex')
}

const first = await renderView(page, {}, options)
for (let i = 0; i < warmups; i++)
  await renderView(page, {}, options)

Bun.gc(true)
const before = {
  rss: process.memoryUsage().rss,
  jsc: memoryUsage(),
  heap: heapStats(),
}
let last = first
const timings: number[] = []
const start = performance.now()
for (let i = 0; i < samples; i++) {
  const renderStart = performance.now()
  last = await renderView(page, {}, options)
  timings.push(performance.now() - renderStart)
}
const elapsed = performance.now() - start
timings.sort((a, b) => a - b)
const after = {
  rss: process.memoryUsage().rss,
  jsc: memoryUsage(),
  heap: heapStats(),
}

console.log(JSON.stringify({
  fixture: path.relative(root, page),
  outputBytes: Buffer.byteLength(first),
  outputStable: digest(first) === digest(last),
  outputSha256: digest(first),
  samples,
  msPerRender: elapsed / samples,
  medianMsPerRender: timings[Math.floor(samples / 2)],
  p90MsPerRender: timings[Math.floor(samples * 0.9)],
  rssBefore: before.rss,
  rssAfter: after.rss,
  jscCommitBefore: before.jsc.currentCommit,
  jscCommitAfter: after.jsc.currentCommit,
  jscPeakCommitAfter: after.jsc.peakCommit,
  heapBefore: before.heap.heapSize,
  heapAfter: after.heap.heapSize,
}, null, 2))
