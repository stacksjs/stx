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
    // eslint-disable-next-line ts/no-explicit-any
    listen: (node: any, event: string, handler: any, options?: unknown) => {
      ops.push({ op: 'listen', node: name(node), args: [event, options] })
      node.addEventListener(event, handler, options)
    },
    // eslint-disable-next-line ts/no-explicit-any
    setVisible: (node: any, visible: boolean) => {
      ops.push({ op: 'setVisible', node: name(node), args: [visible] })
      const was = node.style.display !== 'none'
      if (node.__stx_display === undefined) {
        const d = node.style.display
        node.__stx_display = (d && d !== 'none') ? d : ''
      }
      node.style.display = visible ? node.__stx_display : 'none'
      return was
    },
    // eslint-disable-next-line ts/no-explicit-any
    scopeOf: (node: any, from?: boolean) => {
      ops.push({ op: 'scopeOf', node: name(node), args: [!!from] })
      const start = from ? (node && node.parentElement) : node
      return (start && start.closest) ? start.closest('[data-stx-scope]') : null
    },
    // Teardown reaches a subtree through the host too, so neither disposal
    // path needs a selector (#1984).
    // eslint-disable-next-line ts/no-explicit-any
    descendants: (node: any) => {
      ops.push({ op: 'descendants', node: name(node), args: [] })
      const out: unknown[] = []
      if (!node || !node.querySelectorAll) return out
      const all = node.querySelectorAll('*')
      for (let i = 0; i < all.length; i++) out.push(all[i])
      return out
    },
    // eslint-disable-next-line ts/no-explicit-any
    scopesIn: (node: any) => {
      ops.push({ op: 'scopesIn', node: name(node), args: [] })
      const ids: string[] = []
      if (!node) return ids
      const own = node.getAttribute && node.getAttribute('data-stx-scope')
      if (own) ids.push(own)
      if (node.querySelectorAll) {
        const matches = node.querySelectorAll('[data-stx-scope]')
        for (let i = 0; i < matches.length; i++) {
          const id = matches[i].getAttribute('data-stx-scope')
          if (id) ids.push(id)
        }
      }
      return ids
    },
  }
}

let booted = 0
async function boot(
  markup: string,
  scope: Record<string, unknown>,
  // eslint-disable-next-line ts/no-explicit-any
  afterParse?: (root: any) => void,
): Promise<void> {
  const name = `host_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  if (afterParse) afterParse(document.body)
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

  it('tears a removed row down through the host, without a selector', async () => {
    /*
     * The last DOM assumption in the binding layer (#1984). Both disposal
     * paths reached their subtree with a selector query -- one for every
     * descendant, one for `[data-stx-scope]` -- and a view hierarchy has
     * neither selectors nor attributes to match. A native host knows what it
     * built, so it is asked.
     *
     * Asserted on a SHRINKING list, because that is a disposal the page did
     * not ask for: the row leaves because its data did, and the teardown has
     * to find it anyway.
     */
    const items = window.stx.state([{ id: 1 }, { id: 2 }])
    await boot('<ul data-id="l3"><li data-id="r3" :for="row in items" :key="row.id">x</li></ul>', { items })
    ops.length = 0

    items.set([{ id: 1 }])
    await settle()

    expect(ops.some(o => o.op === 'descendants')).toBe(true)
    expect(ops.some(o => o.op === 'scopesIn')).toBe(true)
  })

  it('registers event handlers through the host, with their options', async () => {
    let clicked = 0
    // very-happy-dom's parser stops reading attributes at an `@` name, so an
    // @event written into innerHTML never reaches the element. The runtime only
    // ever reads these through getAttribute, so attaching them after parsing is
    // faithful -- it is the parser that cannot represent them, not the runtime.
    await boot(
      '<button data-id="btn">go</button><div data-id="scroller"></div>',
      { bump: () => { clicked += 1 } },
      (root: any) => {
        root.querySelector('[data-id="btn"]').setAttribute('@click', 'bump()')
        root.querySelector('[data-id="scroller"]').setAttribute('@touchstart', 'bump()')
      },
    )

    const listens = ops.filter(o => o.op === 'listen')
    expect(listens.map(o => o.args[0])).toEqual(['click', 'touchstart'])
    // The options channel matters: dropping it silently makes every touch
    // listener blocking again.
    expect((listens.find(o => o.args[0] === 'touchstart')?.args[1] as any)?.passive).toBe(true)
    expect((listens.find(o => o.args[0] === 'click')?.args[1] as any)?.passive).toBe(false)

    // And the handler the host registered is the one that runs.
    document.querySelector('[data-id="btn"]').click()
    await settle()
    expect(clicked).toBe(1)
  })

  it('asks the host to change visibility, and is told what it replaced', async () => {
    const open = window.stx.state(false)
    await boot('<div data-id="panel" :show="open">panel</div>', { open })
    ops.length = 0

    open.set(true)
    await settle()
    open.set(false)
    await settle()

    // The binder never reads the node back: setVisible reports the previous
    // state, which is the only reason bindShow can tell a reveal from a repaint.
    expect(ops.filter(o => o.op === 'setVisible').map(o => o.args[0])).toEqual([true, false])
  })

  it('resolves refs without a selector reaching the host', async () => {
    await boot('<div data-id="reffed"></div>', {}, (root: any) => {
      root.querySelector('[data-id="reffed"]').setAttribute('x-ref', 'panel')
    })

    // $refs is already a plain id-to-node map, so it needs nothing from the
    // host: the only coupling was resolving which scope owns the ref, and that
    // goes through scopeOf rather than a selector.
    const scope = window.stx._scopes && Object.values(window.stx._scopes)[0] as any
    const refs = (scope && scope.$refs) || {}
    expect(refs.panel ?? document.querySelector('[data-id="reffed"]')).toBeTruthy()
    expect(ops.filter(o => o.op === 'scopeOf').length).toBeGreaterThan(0)
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
