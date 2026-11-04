/**
 * #2158: run with Bun in a fresh process for a cold first render.
 * Component fragment caching is off; subsequent samples still rebuild HTML.
 * CPU time and operation costs are reported separately from wall-clock time.
 * STX_BENCH_SAMPLES controls render count (default 3). Set STX_BENCH_DIR
 * to the same scratch directory for cross-process output-hash comparisons.
 */
import path from 'node:path'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { renderView } from '../../src/build-views'
import { declaredNames, parameterAnalysis, unboundNames } from '../../src/client-parameter-bindings'
import { safeEvaluate, safeEvaluateCondition } from '../../src/safe-evaluator'

const root = path.resolve(import.meta.dir, '../../../..')
const sidebar = await Bun.file(path.join(root, 'packages/components/src/ui/sidebar/Sidebar.stx')).text()
const source = [...sidebar.matchAll(/<script(?! server)[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
const candidates = new Set(['state', 'delay', 'useFetch', 'effect'])
const wide = Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`pageValue${i}`, i]))

function measure(run: () => void): { wallMs: number, cpuMs: number } {
  const cpu = process.cpuUsage()
  const start = performance.now()
  run()
  const elapsed = process.cpuUsage(cpu)
  return { wallMs: performance.now() - start, cpuMs: (elapsed.user + elapsed.system) / 1000 }
}

function digest(html: string): string {
  // Only normalize per-process build IDs, generated bundle identifiers and
  // temporary source-file comments. Keep all rendered data/runtime code.
  const bundles = new Map<string, string>()
  const normalized = html
    .replace(/<meta name="stx-build" content="[^"]*"\s*\/?>/g, '<meta name="stx-build" content="MASKED">')
    .replace(/__stxBundle_[a-f0-9]{12}/g, (name) => {
      if (!bundles.has(name)) bundles.set(name, `__stxBundle_${bundles.size}`)
      return bundles.get(name)!
    })
    .replace(/\/\/ \.stx-client-[a-f0-9]{12}-\d+-[a-f0-9-]+\.ts/g, '// STX_TEMP_SOURCE')
  return new Bun.CryptoHasher('sha256').update(normalized).digest('hex')
}

const dir = process.env.STX_BENCH_DIR ?? await mkdtemp(path.join(tmpdir(), 'stx-cold-sidebar-'))
try {
  const fixture = path.join(dir, 'dashboard.stx')
  await Bun.write(fixture, '<!doctype html><html><head></head><body><Sidebar :sections="sections" /><main>{{ heading }}</main></body></html>')
  const sections = [{
    id: 'pages',
    label: 'Pages',
    items: Array.from({ length: 109 }, (_, i) => ({ id: `page-${i}`, label: `Page ${i}`, href: `/page-${i}` })),
  }]
  const renders: Array<{ wallMs: number, cpuMs: number }> = []
  let output = ''
  for (let i = 0; i < Number(process.env.STX_BENCH_SAMPLES ?? 3); i++) {
    const cpu = process.cpuUsage()
    const start = performance.now()
    output = await renderView(fixture, { ...wide, sections, heading: 'Dashboard' }, {
      componentsDir: path.join(root, 'packages/components/src/ui'),
      componentRenderCacheBytes: 0,
    })
    const elapsed = process.cpuUsage(cpu)
    renders.push({ wallMs: performance.now() - start, cpuMs: (elapsed.user + elapsed.system) / 1000 })
  }
  if (!output.includes('data-label="Page 108"')) throw new Error('sidebar did not render its final row')
  const analysis = measure(() => {
    for (let i = 0; i < 100; i++) {
      declaredNames(source)
      parameterAnalysis('const unrelated = 1')
      parameterAnalysis(source)
      unboundNames(source, candidates)
    }
  })
  let enabled = 0
  const evaluation = measure(() => {
    for (let i = 0; i < 1000; i++) {
      const context = { ...wide, row: { enabled: i % 2 === 0, label: `row${i}` } }
      enabled += Number(safeEvaluateCondition('row.enabled && pageValue42 === 42', context))
      safeEvaluate('row.label', context)
    }
  })
  if (enabled !== 500) throw new Error('condition results changed')
  if (process.env.STX_BENCH_OUTPUT) await Bun.write(process.env.STX_BENCH_OUTPUT, output)
  console.log(JSON.stringify({ analysis, evaluation, renders, outputBytes: Buffer.byteLength(output), outputSha256: digest(output) }))
}
finally {
  if (!process.env.STX_BENCH_DIR) await rm(dir, { recursive: true, force: true })
}
