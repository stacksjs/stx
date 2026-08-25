/**
 * Rendering the same view twice produces the same bytes (stacksjs/stx#1945).
 *
 * #1945 measures ~5MB of native churn per render of an unchanged view, with the
 * JS heap flat and nothing retained — allocator high-water, not a leak. The fix
 * for that is a cache, and a cache was impossible: every render stamped fresh
 * ids, so no caller could tell that two renders were the same answer.
 *
 * Two generators did it. Component scope ids were `${++moduleCounter}_${random}`
 * and the setup function was named `__stx_setup_${Date.now()}_${counter++}`.
 * Both now derive from what the thing IS.
 *
 * The interesting part is what determinism must not cost. An id has to stay
 * unique inside one document — two instances of a component are two instances
 * even with identical props, and one id would merge their signals — and ids
 * from different documents must not collide, or an SPA navigation puts two
 * unrelated scopes on one name. A plain content hash gives the first away and a
 * per-page counter gives the second away, so the id carries a per-render
 * sequence AND a page key. All three properties are asserted below; drop any one
 * of the three and one of these tests fails.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderView } from '../src/build-views'

const APP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-determinism-'))
const componentsDir = path.join(APP, 'components')

const options = { componentsDir } as Record<string, unknown>

beforeAll(() => {
  fs.mkdirSync(componentsDir, { recursive: true })
  fs.writeFileSync(
    path.join(componentsDir, 'Counter.stx'),
    `<script client>\nconst n = state(0)\n</script>\n<div><span :text="n()"></span></div>`,
  )
})

afterAll(() => fs.rmSync(APP, { recursive: true, force: true }))

function page(name: string, body: string): string {
  const file = path.join(APP, name)
  fs.writeFileSync(file, body)
  return file
}

/** Component scope ids in a rendered page, in document order. */
function scopeIds(html: string): string[] {
  return [...html.matchAll(/data-stx-scope="(stx_[^"]+)"/g)].map(m => m[1])
}

describe('rendering the same view twice', () => {
  it('produces byte-identical output', async () => {
    // The property the whole issue turns on. Without it a caller has no way to
    // know it already has this answer.
    const file = page('same.stx', `<script client>\nconst count = state(0)\n</script>\n<div :text="count()"></div>`)

    const first = await renderView(file, {}, options)
    const second = await renderView(file, {}, options)

    expect(first).toBe(second)
  })

  it('produces byte-identical output for a view containing components', async () => {
    const file = page('with-components.stx', `<div><Counter /><Counter /></div>`)

    const first = await renderView(file, {}, options)
    const second = await renderView(file, {}, options)

    expect(first).toBe(second)
  })

  it('reuses the same setup function name', async () => {
    const file = page('setup.stx', `<script client>\nconst count = state(0)\n</script>\n<div :text="count()"></div>`)

    const first = (await renderView(file, {}, options)).match(/__stx_setup_\w+/)
    const second = (await renderView(file, {}, options)).match(/__stx_setup_\w+/)

    expect(first).not.toBeNull()
    expect(first![0]).toBe(second![0])
  })
})

describe('scope ids stay unique where it matters', () => {
  it('gives two instances of one component different ids', async () => {
    // The reason this is a per-render sequence and not a content hash: these
    // two are identical in every respect except being two of them, and sharing
    // an id would merge their signals into one scope.
    const file = page('twice.stx', `<div><Counter /><Counter /></div>`)

    const ids = scopeIds(await renderView(file, {}, options))

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('gives two different pages different ids for the same component', async () => {
    // The reason the id carries a page key. Without one, every page starts its
    // sequence at 1, so both pages emit `stx_counter_1` — and an SPA navigation
    // holds both documents' scopes in one registry.
    const a = page('page-a.stx', `<div><Counter /></div>`)
    const b = page('page-b.stx', `<div><Counter /></div>`)

    const idsA = scopeIds(await renderView(a, {}, options))
    const idsB = scopeIds(await renderView(b, {}, options))

    expect(idsA).toHaveLength(1)
    expect(idsB).toHaveLength(1)
    expect(idsA[0]).not.toBe(idsB[0])
  })

  it('keeps the id shape callers already match on', async () => {
    // `stx_<name>_<n>_<suffix>`, the shape the random suffix produced. The page
    // key went last precisely so nothing matching the old ids had to change.
    const file = page('shape.stx', `<div><Counter /></div>`)

    const ids = scopeIds(await renderView(file, {}, options))

    expect(ids[0]).toMatch(/^stx_counter_\d+_[a-z0-9]+$/)
  })
})
