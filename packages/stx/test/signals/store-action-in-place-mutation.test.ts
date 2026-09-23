/**
 * An options-store action that mutated state in place — `this.list.push(x)`,
 * `this.list[i] = x` — never went through set(), so nothing that had read the
 * list re-ran.
 *
 * Found on a trail page reached by client-side navigation: it fetched the
 * trail, the action pushed it into `trails`, and the page's
 * `derived(() => store.trails().find(...))` stayed null, rendering "Trail not
 * found". A full page load hid it, because the bootstrap reassigned the whole
 * list a moment later.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

function boot(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

// eslint-disable-next-line ts/no-explicit-any
function listStore(id: string): any {
  return window.stx.defineStore(id, {
    state: () => ({
      items: [{ id: 1 }] as { id: number }[],
      byId: {} as Record<string, number>,
      other: [] as unknown[],
    }),
    actions: {
      add(item: { id: number }) { this.items.push(item) },
      replace(item: { id: number }) {
        const index = this.items.findIndex((c: { id: number }) => c.id === item.id)
        if (index >= 0) this.items[index] = item
      },
      put(key: string, value: number) { this.byId[key] = value },
      drop(key: string) { delete this.byId[key] },
      sortDesc() { this.items.sort((a: { id: number }, b: { id: number }) => b.id - a.id) },
      alias() { this.other = this.items },
      has(item: { id: number }) { return this.items.includes(item) },
    },
  })
}

describe('options-store actions that mutate state in place', () => {
  beforeEach(() => boot())

  it('re-runs a derived that reads an array the action pushed to', () => {
    const store = listStore('push')
    const found = window.stx.derived(() => store.items().find((t: { id: number }) => t.id === 2) ?? null)
    expect(found()).toBeNull()

    store.add({ id: 2 })

    expect(found()).toEqual({ id: 2 })
  })

  it('notifies on an index assignment and on a sort', () => {
    const store = listStore('index')
    const seen: unknown[] = []
    window.stx.effect(() => { seen.push(store.items().map((t: { id: number }) => t.id).join(',')) })

    store.replace({ id: 1 })
    store.add({ id: 3 })
    store.sortDesc()

    expect(seen).toEqual(['1', '1', '1,3', '3,1'])
  })

  it('notifies once per array method call, not once per index written', () => {
    const store = listStore('once')
    let runs = 0
    window.stx.effect(() => { store.items(); runs++ })
    runs = 0

    store.add({ id: 2 })
    store.sortDesc()

    expect(runs).toBe(2)
  })

  it('notifies on an object key set and delete', () => {
    const store = listStore('object')
    const seen: unknown[] = []
    window.stx.effect(() => { seen.push(JSON.stringify(store.byId())) })

    store.put('a', 1)
    store.drop('a')
    store.drop('missing')

    expect(seen).toEqual(['{}', '{"a":1}', '{}'])
  })

  it('keeps raw values in state and keeps identity checks working', () => {
    const store = listStore('raw')
    const first = store.items()[0]

    expect(store.has(first)).toBe(true)
    store.alias()
    // Assigning what an action read stores the raw array, not the view.
    expect(store.other()).toBe(store.items())
    expect(Array.isArray(store.items())).toBe(true)
  })
})
