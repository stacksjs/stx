/**
 * A getter in an `x-data` literal is a derived value, not a snapshot
 * (stacksjs/stx#2053).
 *
 * The bridge built its scope with `for (var key in state)` and then read
 * `state[key]`. Reading an accessor CALLS it, and the returned value is not a
 * function, so it was wrapped as a plain `state()` — the answer the getter gave
 * at construction time, frozen for the life of the page while plain properties
 * beside it updated normally.
 *
 * Nothing was logged. A status card read "Not installed" while
 * `{{ core.version }}`, two lines below it and from the same response, showed
 * the version. The data was right and one binding was stale, which reads as a
 * data problem rather than a reactivity one.
 *
 * The existing bridge test asserts on the generated runtime as TEXT — it greps
 * for `initScope` — so it could not have caught this. These execute the bridge.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import { Window } from 'very-happy-dom'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'

const saved = { ...globalThis } as any

/** The issue's reproduction: getters and methods with identical bodies. */
const PROBE = `<div id="probe" x-data="{
  n: 1,
  obj: { v: 'initial' },
  get doubled() { return this.n * 2; },
  get fromObj() { return 'got:' + this.obj.v; },
  methodDoubled() { return this.n * 2; },
  methodFromObj() { return 'got:' + this.obj.v; }
}">
  <div id="r-direct">{{ n }}</div>
  <div id="r-objdirect">{{ obj.v }}</div>
  <div id="r-getter">{{ doubled }}</div>
  <div id="r-getterobj">{{ fromObj }}</div>
  <div id="r-method">{{ methodDoubled() }}</div>
  <div id="r-methodobj">{{ methodFromObj() }}</div>
</div>`

function installDom(html: string): any {
  const window = new Window({ url: 'http://localhost/' })
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle,
    requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0),
  })
  window.document.write(html)
  return window
}

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 60))

/** Render, hydrate, then read each probe cell. */
async function run(mutate?: string): Promise<Record<string, string>> {
  const html = await processDirectives(
    `<html><head><meta charset="utf-8"></head><body>${PROBE}</body></html>`,
    {},
    path.join(import.meta.dir, 'xdata-getter.stx'),
    { root: import.meta.dir, buildMode: 'serve', cache: false } as never,
    new Set<string>(),
  )
  const window = installDom(html)
  /*
   * Two things this harness has to get right, both of which cost a wrong
   * reading first:
   *
   * - In `serve` mode the signals runtime is fetched from a URL rather than
   *   inlined, so a harness that only runs the page's inline scripts has no
   *   runtime at all and every binding stays as literal text.
   * - The page's scripts declare top-level `var`s that a browser makes global.
   *   `new Function(code)()` confines them to its own scope, so the bridge's
   *   own `__stx_reactive` was not visible to the script that calls it.
   *   Indirect eval evaluates in global scope, which is what a script tag does.
   */
  // eslint-disable-next-line no-eval
  ;(0, eval)(generateSignalsRuntimeDev())
  for (const script of [...window.document.querySelectorAll('script')]) {
    const code = (script as any).textContent
    if (code && code.trim()) {
      try {
        // eslint-disable-next-line no-eval
        ;(0, eval)(code)
      }
      catch { /* a page script that needs a browser API this DOM lacks */ }
    }
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()

  if (mutate) {
    const el = window.document.getElementById('probe') as any
    el.__stx_execute(mutate)
    await settle()
  }

  const read = (id: string): string =>
    (window.document.getElementById(id)?.textContent ?? '').trim()
  return {
    direct: read('r-direct'),
    objdirect: read('r-objdirect'),
    getter: read('r-getter'),
    getterobj: read('r-getterobj'),
    method: read('r-method'),
    methodobj: read('r-methodobj'),
  }
}

afterAll(() => {
  Object.assign(globalThis, {
    window: saved.window,
    document: saved.document,
    location: saved.location,
    history: saved.history,
  })
})

describe('before anything changes', () => {
  it('renders every binding, getters included', async () => {
    const cells = await run()
    expect(cells.direct).toBe('1')
    expect(cells.getter).toBe('2')
    expect(cells.getterobj).toBe('got:initial')
    expect(cells.method).toBe('2')
  })
})

describe('after the state is reassigned', () => {
  const MUTATE = "n = 5; obj = { v: 'updated' }"

  it('re-runs a getter over a primitive', async () => {
    // The issue's headline row: this rendered 2 forever.
    const cells = await run(MUTATE)
    expect(cells.getter).toBe('10')
  })

  it('re-runs a getter that reads through an object', async () => {
    const cells = await run(MUTATE)
    expect(cells.getterobj).toBe('got:updated')
  })

  it('still updates the plain properties', async () => {
    const cells = await run(MUTATE)
    expect(cells.direct).toBe('5')
    expect(cells.objdirect).toBe('updated')
  })

  it('still updates the methods, which always worked', async () => {
    const cells = await run(MUTATE)
    expect(cells.method).toBe('10')
    expect(cells.methodobj).toBe('got:updated')
  })

  it('makes a getter and a method with the same body agree', async () => {
    // The comparison that made the bug legible in the report: identical
    // bodies, different answers.
    const cells = await run(MUTATE)
    expect(cells.getter).toBe(cells.method)
    expect(cells.getterobj).toBe(cells.methodobj)
  })
})

/** Run an arbitrary x-data literal, then read one probe cell. */
async function runLiteral(literal: string, body: string, mutate?: string): Promise<{ text: string, warnings: string[] }> {
  const warnings: string[] = []
  const original = console.warn
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  try {
    const html = await processDirectives(
      `<html><head><meta charset="utf-8"></head><body><div id="probe" x-data="${literal}">${body}</div></body></html>`,
      {},
      path.join(import.meta.dir, 'xdata-getter.stx'),
      { root: import.meta.dir, buildMode: 'serve', cache: false } as never,
      new Set<string>(),
    )
    const window = installDom(html)
    // eslint-disable-next-line no-eval
    ;(0, eval)(generateSignalsRuntimeDev())
    for (const script of [...window.document.querySelectorAll('script')]) {
      const code = (script as any).textContent
      if (code && code.trim()) {
        // eslint-disable-next-line no-eval
        try { (0, eval)(code) }
        catch { /* needs a browser API this DOM lacks */ }
      }
    }
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await settle()
    if (mutate) {
      ;(window.document.getElementById('probe') as any).__stx_execute(mutate)
      await settle()
    }
    return {
      text: (window.document.getElementById('out')?.textContent ?? '').trim(),
      warnings,
    }
  }
  finally {
    console.warn = original
  }
}

describe('assigning to an accessor', () => {
  it('writes through a setter when the pair declares one', async () => {
    const { text } = await runLiteral(
      '{ first: \'ada\', get name() { return this.first; }, set name(v) { this.first = v; } }',
      '<div id=\'out\'>{{ name }}</div>',
      "name = 'grace'",
    )
    expect(text).toBe('grace')
  })

  it('warns instead of silently doing nothing when there is no setter', async () => {
    // A derived has no `.value` setter, so the assignment would be a no-op --
    // the same silent class as the stale read this change removes.
    const { warnings } = await runLiteral(
      '{ n: 1, get doubled() { return this.n * 2; } }',
      '<div id=\'out\'>{{ doubled }}</div>',
      'doubled = 99',
    )
    expect(warnings.some(line => line.includes('cannot assign to doubled'))).toBe(true)
  })

  it('leaves the getter correct after a rejected assignment', async () => {
    const { text } = await runLiteral(
      '{ n: 1, get doubled() { return this.n * 2; } }',
      '<div id=\'out\'>{{ doubled }}</div>',
      'doubled = 99; n = 4',
    )
    expect(text).toBe('8')
  })
})
