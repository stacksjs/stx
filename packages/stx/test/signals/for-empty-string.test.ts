/**
 * A string `@empty` goes away when the list fills.
 *
 * `@empty="'Nothing here'"` inserted a text node and recorded it in
 * currentElements, which teardown does not walk -- it walks currentGroups -- so
 * nothing ever removed it: a list that went from empty to filled read
 * "Nothing herea". Re-entering the empty state stacked another copy for the
 * same reason.
 *
 * It now lives in the slot the `@for-empty` template form already used, which
 * hideEmpty owns.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

// The test DOM's HTML parser stops parsing attributes at an `@` name, turning
// the rest of the tag into text, so @empty is attached after parsing. The
// runtime only ever reads it through getAttribute, so this is equivalent.
function boot(markup: string, scope: Record<string, unknown>, name: string, empty = '\'Nothing here\''): Promise<void> {
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  document.querySelector('[data-row]').setAttribute('@empty', empty)
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  return settle()
}

const listText = (): string => document.querySelector('#list').textContent.replace(/\s+/g, ' ').trim()

const LIST = '<ul id="list"><li :for="x in items" data-row>{{ x }}</li></ul>'

describe('a :for with a string @empty', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('shows the text while empty and removes it once the list fills', async () => {
    const items = window.stx.state([])
    await boot(LIST, { items }, 'empty_string')
    expect(listText()).toBe('Nothing here')

    items.set(['a'])
    await settle()
    expect(listText()).toBe('a')
  })

  it('brings the text back, once, when the list empties again', async () => {
    const items = window.stx.state(['a', 'b'])
    await boot(LIST, { items }, 'empty_roundtrip')
    // No whitespace between the rows: the markup has none between the <li>s.
    expect(listText()).toBe('ab')

    items.set([])
    await settle()
    expect(listText()).toBe('Nothing here')

    // Emptying twice used to stack a second copy of the text.
    items.set([])
    await settle()
    items.set([])
    await settle()
    expect(listText()).toBe('Nothing here')

    items.set(['c'])
    await settle()
    expect(listText()).toBe('c')
  })

  it('follows the expression when what it evaluates to changes', async () => {
    const items = window.stx.state([])
    const label = window.stx.state('none yet')
    await boot(LIST, { items, label }, 'empty_expr', 'label()')
    expect(listText()).toBe('none yet')

    label.set('still none')
    await settle()
    expect(listText()).toBe('still none')
  })
})
