/**
 * A `:for` with repeated `:key` values renders one row per item.
 *
 * Reuse was gated on "this key has not been seen in this pass yet", so the
 * second item sharing a key always built a NEW group, while the removal pass
 * asked only whether the key had been used and therefore left the old groups in
 * the document. The list grew by one row on every update, without bound, and
 * shrinking it left rows behind.
 *
 * The item signals were also held in a Map keyed by key, so two rows sharing one
 * overwrote each other there: the row that reused the surviving entry was bound
 * to a signal the reconciliation never wrote to, and its content froze at the
 * first render. Each group now carries its own signals.
 *
 * Duplicate keys are an application bug -- the runtime warns once per loop -- but
 * the render has to stay sane, which is what Vue does too.
 */
import { beforeAll, describe, expect, it, spyOn } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

function boot(markup: string, scope: Record<string, unknown>, name: string): Promise<void> {
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  return settle()
}

const rows = (): string[] => [...document.querySelectorAll('[data-row]')]
  // eslint-disable-next-line ts/no-explicit-any
  .filter((node: any) => node.isConnected)
  // eslint-disable-next-line ts/no-explicit-any
  .map((node: any) => node.textContent.trim())

const LIST = '<ul><li :for="row in items" :key="row.id" data-row>{{ row.label }}</li></ul>'

describe('a :for with duplicate keys', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('keeps one row per item across updates, and updates both', async () => {
    const items = window.stx.state([{ id: 1, label: 'a' }, { id: 1, label: 'b' }])
    await boot(LIST, { items }, 'dup_grow')
    expect(rows()).toEqual(['a', 'b'])

    // Each update used to append one more row and freeze the first duplicate.
    items.set([{ id: 1, label: 'a2' }, { id: 1, label: 'b2' }])
    await settle()
    expect(rows()).toEqual(['a2', 'b2'])

    items.set([{ id: 1, label: 'a3' }, { id: 1, label: 'b3' }])
    await settle()
    expect(rows()).toEqual(['a3', 'b3'])
  })

  it('reuses the existing rows rather than rebuilding them', async () => {
    // Identity is the point of keyed reuse: a rebuilt row loses focus, caret and
    // selection, which is what #1882 was about. Matching duplicates in order
    // keeps every row, not just the first occurrence of the key.
    const items = window.stx.state([{ id: 1, label: 'a' }, { id: 1, label: 'b' }])
    await boot(LIST, { items }, 'dup_identity')
    const before = [...document.querySelectorAll('[data-row]')]
    expect(before).toHaveLength(2)

    items.set([{ id: 1, label: 'a2' }, { id: 1, label: 'b2' }])
    await settle()

    const after = [...document.querySelectorAll('[data-row]')]
    expect(after).toHaveLength(2)
    expect(after[0]).toBe(before[0])
    expect(after[1]).toBe(before[1])
    expect(rows()).toEqual(['a2', 'b2'])
  })

  it('drops the extra row when the list shrinks', async () => {
    const items = window.stx.state([
      { id: 1, label: 'a' },
      { id: 1, label: 'b' },
      { id: 2, label: 'c' },
    ])
    await boot(LIST, { items }, 'dup_shrink')
    expect(rows()).toEqual(['a', 'b', 'c'])

    items.set([{ id: 1, label: 'a' }, { id: 2, label: 'c' }])
    await settle()
    expect(rows()).toEqual(['a', 'c'])
  })

  it('grows again when another item takes the shared key', async () => {
    const items = window.stx.state([{ id: 7, label: 'only' }])
    await boot(LIST, { items }, 'dup_grow_back')
    expect(rows()).toEqual(['only'])

    items.set([{ id: 7, label: 'first' }, { id: 7, label: 'second' }])
    await settle()
    expect(rows()).toEqual(['first', 'second'])
  })

  it('warns once, naming the repeated key', async () => {
    const warn = spyOn(console, 'warn')
    try {
      const items = window.stx.state([
        { id: 5, label: 'a' },
        { id: 5, label: 'b' },
        { id: 5, label: 'c' },
      ])
      await boot(LIST, { items }, 'dup_warn')
      const duplicateWarnings = warn.mock.calls
        .map(call => String(call[0]))
        .filter(message => message.includes('more than one item with the key'))
      expect(duplicateWarnings).toHaveLength(1)
      expect(duplicateWarnings[0]).toContain('5')
    }
    finally {
      warn.mockRestore()
    }
  })

  it('says nothing and behaves as before when keys are unique', async () => {
    const warn = spyOn(console, 'warn')
    try {
      const items = window.stx.state([{ id: 1, label: 'a' }, { id: 2, label: 'b' }])
      await boot(LIST, { items }, 'dup_none')
      expect(rows()).toEqual(['a', 'b'])

      // Reorder, then remove the middle: the keyed path still tracks identity.
      items.set([{ id: 2, label: 'b' }, { id: 1, label: 'a' }])
      await settle()
      expect(rows()).toEqual(['b', 'a'])

      items.set([{ id: 1, label: 'a' }])
      await settle()
      expect(rows()).toEqual(['a'])

      expect(warn.mock.calls.filter(call => String(call[0]).includes('more than one item'))).toHaveLength(0)
    }
    finally {
      warn.mockRestore()
    }
  })
})
