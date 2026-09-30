/**
 * The binding layer writes through a host, so the runtime can drive a tree that
 * is not the document (stacksjs/stx#1984).
 *
 * This is the spike behind stx-native: compiling .stx to native views is only
 * worth anything if the *runtime* can update them, and today it updates the DOM
 * directly in 268 places. The question was whether those calls factor behind an
 * interface without the web path paying for it.
 *
 * What this pins: with a host installed, a signal update arrives as an
 * operation on that host rather than as a DOM write -- and with no host
 * installed, the DOM path is byte for byte what it was, which the rest of the
 * suite proves.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

interface Op { op: string, node: string, args: unknown[] }

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

/** A host that records instead of mutating — the shape a bridge would take. */
function recordingHost(ops: Op[]) {
  // eslint-disable-next-line ts/no-explicit-any
  const name = (node: any): string => node?.getAttribute?.('data-id') ?? node?.tagName ?? '?'
  return {
    // eslint-disable-next-line ts/no-explicit-any
    setText: (node: any, value: unknown) => ops.push({ op: 'setText', node: name(node), args: [value] }),
    // eslint-disable-next-line ts/no-explicit-any
    setAttribute: (node: any, attr: string, value: unknown) => ops.push({ op: 'setAttribute', node: name(node), args: [attr, value] }),
    // eslint-disable-next-line ts/no-explicit-any
    removeAttribute: (node: any, attr: string) => ops.push({ op: 'removeAttribute', node: name(node), args: [attr] }),
    // Structural. These still build real nodes -- the recorder is watching the
    // operation stream, not replacing the tree -- so the list keeps working
    // while every insert and removal is observed.
    anchor: (label: string) => {
      ops.push({ op: 'anchor', node: label, args: [] })
      return document.createComment(label)
    },
    // eslint-disable-next-line ts/no-explicit-any
    clone: (node: any) => {
      ops.push({ op: 'clone', node: name(node), args: [] })
      return node.cloneNode(true)
    },
    // eslint-disable-next-line ts/no-explicit-any
    insert: (parent: any, node: any, before: any) => {
      ops.push({ op: 'insert', node: name(node), args: [name(parent)] })
      parent.insertBefore(node, before)
    },
    // eslint-disable-next-line ts/no-explicit-any
    remove: (node: any) => {
      ops.push({ op: 'remove', node: name(node), args: [] })
      if (node.parentNode) node.parentNode.removeChild(node)
    },
  }
}

let booted = 0
async function boot(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `host_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

describe('the runtime writes through a host', () => {
  let ops: Op[]

  // bun test shares one process, and the host is a global: leaving it installed
  // routes every later test file's bindings into this recorder, which fails
  // eight tests in files that have nothing to do with this one.
  afterEach(() => {
    delete window.__stx_host
  })

  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    ops = []
    window.__stx_host = recordingHost(ops)
    // Re-generated per test: the host is captured when the IIFE runs.
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('sends a text binding to the host instead of the node', async () => {
    const label = window.stx.state('first')
    await boot('<p data-id="label" :text="label"></p>', { label })

    expect(ops).toContainEqual({ op: 'setText', node: 'label', args: ['first'] })
    // The host swallowed the write, so the document never saw it.
    expect(document.querySelector('[data-id="label"]').textContent).toBe('')
  })

  it('keeps sending on every update, which is the whole point', async () => {
    const label = window.stx.state('one')
    await boot('<p data-id="live" :text="label"></p>', { label })
    ops.length = 0

    label.set('two')
    await settle()
    label.set('three')
    await settle()

    expect(ops.filter(o => o.op === 'setText').map(o => o.args[0])).toEqual(['two', 'three'])
  })

  it('sends attribute writes and removals', async () => {
    const title = window.stx.state('hello')
    const gone = window.stx.state('x')
    await boot('<p data-id="a" :title="title"></p><p data-id="b" :title="gone"></p>', { title, gone })
    ops.length = 0

    title.set('changed')
    gone.set(null)
    await settle()

    expect(ops).toContainEqual({ op: 'setAttribute', node: 'a', args: ['title', 'changed'] })
    expect(ops).toContainEqual({ op: 'removeAttribute', node: 'b', args: ['title'] })
  })

  it('builds a list through the host: an anchor, a clone and an insert per row', async () => {
    const items = window.stx.state([{ id: 1, label: 'a' }, { id: 2, label: 'b' }])
    await boot('<ul data-id="list"><li data-id="row" :for="row in items" :key="row.id">x</li></ul>', { items })

    // The row template is cloned rather than the runtime building nodes itself,
    // which is the operation a native host cannot take literally: it has to
    // materialise a subtree from the template instead of copying views.
    expect(ops.filter(o => o.op === 'anchor').length).toBeGreaterThan(0)
    expect(ops.filter(o => o.op === 'clone').length).toBeGreaterThanOrEqual(2)
    expect(ops.filter(o => o.op === 'insert').length).toBeGreaterThanOrEqual(2)
  })

  it('reconciles through the host: growing the list inserts, shrinking removes', async () => {
    const items = window.stx.state([{ id: 1, label: 'a' }])
    await boot('<ul data-id="l2"><li data-id="r2" :for="row in items" :key="row.id">x</li></ul>', { items })
    ops.length = 0

    items.set([{ id: 1, label: 'a' }, { id: 2, label: 'b' }, { id: 3, label: 'c' }])
    await settle()
    const grew = ops.filter(o => o.op === 'insert').length
    expect(grew).toBeGreaterThanOrEqual(2)

    ops.length = 0
    items.set([{ id: 1, label: 'a' }])
    await settle()
    expect(ops.filter(o => o.op === 'remove').length).toBeGreaterThanOrEqual(2)
  })

  it('carries a derived value through, so the graph is intact behind the host', async () => {
    const count = window.stx.state(2)
    const doubled = window.stx.derived(() => count() * 2)
    await boot('<p data-id="d" :text="doubled"></p>', { count, doubled })
    ops.length = 0

    count.set(5)
    await settle()

    expect(ops.filter(o => o.node === 'd').map(o => o.args[0])).toEqual([10])
  })
})
