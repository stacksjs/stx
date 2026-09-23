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

const root = process.env.STX_BENCH_ROOT
  ? path.resolve(process.env.STX_BENCH_ROOT)
  : path.resolve(import.meta.dir, '../../../..')
// Overridable to match render-view-allocation-probe.ts, so the proxy and the
// ground truth can be pointed at the same page. A drop in the probe that this
// does not follow has moved work out of view rather than removed it.
const page = path.join(root, process.env.STX_BENCH_FIXTURE ?? 'packages/components/examples/sidebar-arc-spaces.stx')
const componentsDir = path.join(root, process.env.STX_BENCH_COMPONENTS ?? 'packages/components/src/ui/sidebar')
const options = { componentsDir }
const warmups = Number(process.env.STX_BENCH_WARMUPS ?? 10)
const samples = Number(process.env.STX_BENCH_SAMPLES ?? 40)

function normalize(html: string): string {
  return html.replace(/<meta name="stx-build" content="[^"]*"\s*\/?>/g, '<meta name="stx-build" content="MASKED">')
}

function digest(html: string): string {
  return new Bun.CryptoHasher('sha256').update(normalize(html)).digest('hex')
}

const first = await renderView(page, {}, options)
if (process.env.STX_BENCH_OUTPUT)
  await Bun.write(process.env.STX_BENCH_OUTPUT, normalize(first))
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
  jscCurrentBefore: before.jsc.current,
  jscCurrentAfter: after.jsc.current,
  jscPeakBefore: before.jsc.peak,
  jscPeakAfter: after.jsc.peak,
  jscCommitBefore: before.jsc.currentCommit,
  jscCommitAfter: after.jsc.currentCommit,
  jscPeakCommitAfter: after.jsc.peakCommit,
  heapBefore: before.heap.heapSize,
  heapAfter: after.heap.heapSize,
  extraMemoryBefore: before.heap.extraMemorySize,
  extraMemoryAfter: after.heap.extraMemorySize,
  objectsBefore: before.heap.objectCount,
  objectsAfter: after.heap.objectCount,
}, null, 2))
