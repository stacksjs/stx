/**
 * The host decides what the fragment cache may keep (stacksjs/stx#1945).
 *
 * Keeping rendered output is what makes an unchanged page cheap to re-render,
 * and that memory is real. How much of it is worth spending is a property of
 * the machine, not of stx: a build box has room a container under an OOM limit
 * does not, and #1945 was reported by someone whose server was the second kind.
 * A ceiling only stx knows about is one they cannot answer with.
 */

import { afterEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderView } from '../src/build-views'
import { clearDevCaches } from '../src/caching'
import { LRUCache } from '../src/performance-utils'

const made: string[] = []

afterEach(() => {
  clearDevCaches()
  for (const dir of made.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})

function app(counter: string): { page: string, options: Record<string, unknown> } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-budget-'))
  made.push(dir)
  const componentsDir = path.join(dir, 'components')
  fs.mkdirSync(componentsDir, { recursive: true })
  fs.writeFileSync(
    path.join(componentsDir, 'Widget.stx'),
    `<script server cache>\nglobalThis.${counter} = (globalThis.${counter} || 0) + 1\nconst renders = globalThis.${counter}\n</script>\n<script client>\n  const open = state(false)\n</script>\n<div class="widget">{{ renders }}</div>\n`,
  )
  const page = path.join(dir, 'page.stx')
  fs.writeFileSync(page, `<html><body><Widget /></body></html>`)
  return { page, options: { componentsDir } }
}

describe('componentRenderCacheBytes', () => {
  it('memoises under the default budget', async () => {
    const { page, options } = app('__budgetA')
    ;(globalThis as any).__budgetA = 0

    await renderView(page, {}, options as any)
    await renderView(page, {}, options as any)

    expect((globalThis as any).__budgetA).toBe(1)
    delete (globalThis as any).__budgetA
  })

  it('keeps nothing at all when the host asks for 0', async () => {
    // Not "a very small cache" -- no cache. A host that says it would rather
    // spend the time than the memory has to actually get that.
    const { page, options } = app('__budgetB')
    ;(globalThis as any).__budgetB = 0

    await renderView(page, {}, { ...options, componentRenderCacheBytes: 0 } as any)
    await renderView(page, {}, { ...options, componentRenderCacheBytes: 0 } as any)

    expect((globalThis as any).__budgetB).toBe(2)
    delete (globalThis as any).__budgetB
  })

  it('renders the same page whether or not it was cached', async () => {
    // The budget is a memory decision, never a correctness one.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-budget-eq-'))
    made.push(dir)
    const componentsDir = path.join(dir, 'components')
    fs.mkdirSync(componentsDir, { recursive: true })
    fs.writeFileSync(
      path.join(componentsDir, 'Widget.stx'),
      `<script server cache>\nconst label = $props.label || 'w'\n</script>\n<script client>\n  const open = state(false)\n</script>\n<div class="widget">{{ label }}</div>\n`,
    )
    const page = path.join(dir, 'page.stx')
    fs.writeFileSync(page, `<html><body><Widget label="x" /></body></html>`)

    const uncached = await renderView(page, {}, { componentsDir, componentRenderCacheBytes: 0 } as any)
    clearDevCaches()
    const cached = await renderView(page, {}, { componentsDir } as any)

    expect(cached).toBe(uncached)
  })
})

describe('LRUCache.setMaxBytes', () => {
  it('evicts down to the new budget straight away', async () => {
    // A host that has just asked for less is not helped by a cache that keeps
    // what it already holds until those entries happen to age out.
    const cache = new LRUCache<string, string>(100, { maxBytes: 1000, sizeOf: v => v.length })
    cache.set('a', 'a'.repeat(400))
    cache.set('b', 'b'.repeat(400))
    expect(cache.byteSize).toBe(800)

    cache.setMaxBytes(500)

    expect(cache.byteSize).toBeLessThanOrEqual(500)
    expect(cache.get('a')).toBeUndefined()   // oldest goes first
    expect(cache.get('b')).toBeDefined()
  })

  it('does nothing to a cache that was never byte-bounded', async () => {
    // It measured nothing, so evicting against a total that is always 0 would
    // empty it for no reason.
    const cache = new LRUCache<string, string>(10)
    cache.set('a', 'a'.repeat(400))
    cache.setMaxBytes(1)
    expect(cache.get('a')).toBeDefined()
  })
})
