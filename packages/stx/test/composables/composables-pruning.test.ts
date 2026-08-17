/**
 * A page ships only the composables it can reach (stacksjs/stx#1936).
 *
 * Every module in `composablesDir` was injected into every built page whole —
 * not just the names, the bodies. A blog index that referenced none of them
 * carried the publish endpoint, the provider label table and the chart drawing
 * code, measured at +3.2KB gzipped on pages using nothing. The cost of adding a
 * composable was paid by every route in the app, including ones that cannot
 * reach it.
 *
 * The interesting cases are the ones that must NOT be pruned, because
 * under-inclusion breaks a page silently while over-inclusion only wastes
 * bytes: a composable that another composable calls, and one reached only from
 * a store. Both are asserted below, and both are why selection is transitive
 * rather than a single pass over the page.
 *
 * Assertions are on the emitted bundle rather than on byte counts, so a failure
 * says which composable leaked or went missing.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearComposableCache, getComposableScript } from '../../src/composable-loader'

const APP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-composable-prune-'))
const dir = path.join(APP, 'functions')

beforeAll(async () => {
  fs.mkdirSync(dir, { recursive: true })

  // Referenced directly by a page.
  await Bun.write(path.join(dir, 'counter.ts'), [
    `export const COUNTER_STEP = 1`,
    `export function increment(n: number): number { return n + COUNTER_STEP }`,
  ].join('\n'))

  // Referenced only by another composable — the transitive case. The body
  // carries a sentinel found nowhere else: asserting on the NAME would pass on
  // the mention inside publish.ts's own body even when this file was dropped.
  await Bun.write(path.join(dir, 'labels.ts'), [
    `export function providerLabel(id: string): string { return id.toUpperCase() + 'LABELS_BODY_SENTINEL' }`,
  ].join('\n'))

  await Bun.write(path.join(dir, 'publish.ts'), [
    `export function publishCrosspost(id: string): string {`,
    `  return '/api/postline/publish?' + providerLabel(id)`,
    `}`,
  ].join('\n'))

  // Referenced by nothing in the pages below.
  await Bun.write(path.join(dir, 'charts.ts'), [
    `export function renderAnalyticsChart(): string { return 'drawAnalyticsChart' }`,
  ].join('\n'))
})

afterAll(() => fs.rmSync(APP, { recursive: true, force: true }))

async function bundleFor(pageSource: string): Promise<string> {
  clearComposableCache()
  const code = await getComposableScript(dir, pageSource)
  return code ?? ''
}

describe('a page that references one composable', () => {
  it('ships it', async () => {
    const bundle = await bundleFor('<script client>const n = increment(1)</script>')

    expect(bundle).toContain('increment')
    expect(bundle).toContain('COUNTER_STEP')
  })

  it('does not ship the ones it cannot reach', async () => {
    const bundle = await bundleFor('<script client>const n = increment(1)</script>')

    // The bodies, which is what the measured weight was.
    expect(bundle).not.toContain('drawAnalyticsChart')
    expect(bundle).not.toContain('/api/postline/publish')
  })
})

describe('a page that references nothing', () => {
  it('gets no composable script at all', async () => {
    const bundle = await bundleFor('<html><body><h1>Blog</h1></body></html>')

    expect(bundle).toBe('')
  })
})

describe('reachability is transitive', () => {
  it('keeps a composable that another composable calls', async () => {
    // `providerLabel` appears nowhere on the page — only inside
    // `publishCrosspost`. Dropping it would leave a ReferenceError at the
    // moment the user clicked publish, which is the failure mode that makes
    // under-inclusion much worse than over-inclusion.
    const bundle = await bundleFor('<script client>publishCrosspost("bsky")</script>')

    expect(bundle).toContain('publishCrosspost')
    // The BODY, not the name. `providerLabel` appears inside publish.ts either
    // way, so a name check passes whether or not labels.ts was included — which
    // it did, until a sabotage run showed this assertion proving nothing.
    expect(bundle).toContain('LABELS_BODY_SENTINEL')
    expect(bundle).not.toContain('drawAnalyticsChart')
  })

  it('keeps a composable reached only from a store', async () => {
    // Stores are injected before composables, so the store bundle is part of
    // the page by the time selection runs. A composable a store calls is not
    // mentioned in any markup.
    const page = '<script data-stx-stores>defineStore("x", () => ({ go: () => renderAnalyticsChart() }))</script>'
    const bundle = await bundleFor(page)

    expect(bundle).toContain('drawAnalyticsChart')
  })
})

describe('the import form', () => {
  it('is recognised as a reference', async () => {
    const bundle = await bundleFor(`<script client>import { increment } from '@composables'</script>`)

    expect(bundle).toContain('increment')
  })
})

describe('omitting the page source', () => {
  it('emits everything, for callers with no page in hand', async () => {
    // Back-compat, and the guard that makes the pruning assertions meaningful:
    // if the bundle were empty for every input, every `not.toContain` above
    // would pass for the wrong reason.
    const bundle = await bundleFor(undefined as unknown as string)

    expect(bundle).toContain('increment')
    expect(bundle).toContain('drawAnalyticsChart')
    expect(bundle).toContain('/api/postline/publish')
  })
})

describe('caching', () => {
  it('does not serve one page\'s subset to another', async () => {
    // The subset is part of the cache key. Without that, the first page to
    // render would decide what every later page ships.
    clearComposableCache()
    const first = await getComposableScript(dir, '<script client>increment(1)</script>') ?? ''
    const second = await getComposableScript(dir, '<script client>renderAnalyticsChart()</script>') ?? ''

    expect(first).not.toContain('drawAnalyticsChart')
    expect(second).toContain('drawAnalyticsChart')
    expect(second).not.toContain('COUNTER_STEP')
  })
})
