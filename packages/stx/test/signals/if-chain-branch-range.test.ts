/**
 * An if/else-if/else branch removes everything it rendered, and a re-show
 * renders it fresh.
 *
 * The single-template `:if` learned this in #1955: a structural directive
 * directly inside the branch renders its output as SIBLINGS of the clones --
 * `:for` replaces its own source element with a placeholder comment and inserts
 * rows next to it -- so hiding has to sweep the whole range, not just the node
 * list the branch owns. bindIfChain never got that treatment, and its clone
 * list was built once at bind time, which broke two ways:
 *
 *   - hiding removed nothing (the rows were never in the list, and the source
 *     element it did hold was already detached, so the parentNode guard skipped
 *     it) and both branches showed at once;
 *   - re-showing re-inserted that stale source element, painting the literal
 *     text of its interpolations -- rows read `{{ x }}`, `a`, `b`.
 *
 * Each show now clones from a snapshot taken before anything processed the
 * content. Cloning from the live template is not equivalent: a nested `:for`
 * moves its row source out of `content` and the attributes processing consumed
 * (`x-model`, `:id`) never return, so a later clone would arrive stripped and
 * unbindable -- which is what the x-model case at the bottom pins.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
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

const shown = (selector: string): boolean => !!document.querySelector(selector)?.isConnected

describe('an if/else chain sweeps what its branch rendered', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('removes rows a nested :for rendered when the branch goes false', async () => {
    const show = window.stx.state(true)
    const items = window.stx.state(['a', 'b'])
    await boot(
      '<template :if="show()"><div :for="x in items" data-row>{{ x }}</div><p data-foot>foot</p></template>'
      + '<p data-none :else>none</p>',
      { show, items },
      'chain_sweep',
    )
    expect(rows()).toEqual(['a', 'b'])
    expect(shown('[data-none]')).toBe(false)

    show.set(false)
    await settle()
    // The whole branch goes, and only one branch is on screen at a time.
    expect(rows()).toEqual([])
    expect(shown('[data-foot]')).toBe(false)
    expect(shown('[data-none]')).toBe(true)
  })

  it('renders interpolated rows again after a hide and re-show', async () => {
    const show = window.stx.state(true)
    const items = window.stx.state(['a', 'b'])
    await boot(
      '<template :if="show()"><div :for="x in items" data-row>{{ x }}</div></template>'
      + '<p data-none :else>none</p>',
      { show, items },
      'chain_reshow',
    )

    show.set(false)
    await settle()
    show.set(true)
    await settle()

    // The literal source element used to come back alongside the rows.
    expect(rows()).toEqual(['a', 'b'])
    expect(document.body.textContent).not.toContain('{{ x }}')
    expect(shown('[data-none]')).toBe(false)
  })

  it('picks up list changes made while the branch was hidden', async () => {
    const show = window.stx.state(true)
    const items = window.stx.state(['a'])
    await boot(
      '<template :if="show()"><div :for="x in items" data-row>{{ x }}</div></template>'
      + '<p data-none :else>none</p>',
      { show, items },
      'chain_hidden_update',
    )

    show.set(false)
    await settle()
    items.set(['x', 'y', 'z'])
    await settle()
    show.set(true)
    await settle()

    expect(rows()).toEqual(['x', 'y', 'z'])
  })

  it('leaves markup after the chain alone', async () => {
    const show = window.stx.state(true)
    const items = window.stx.state(['a'])
    await boot(
      '<template :if="show()"><div :for="x in items" data-row>{{ x }}</div></template>'
      + '<p data-none :else>none</p>'
      + '<footer data-tail>tail</footer>',
      { show, items },
      'chain_tail',
    )

    show.set(false)
    await settle()
    show.set(true)
    await settle()

    // The sweep stops at the branch's own end marker.
    expect(shown('[data-tail]')).toBe(true)
    expect(document.querySelectorAll('[data-tail]')).toHaveLength(1)
  })

  it('still toggles an element branch, which owns its whole subtree', async () => {
    const show = window.stx.state(true)
    await boot(
      '<div :if="show()" data-el><span data-inner>in</span></div><p data-none :else>none</p>',
      { show },
      'chain_element_branch',
    )
    expect(shown('[data-el]')).toBe(true)
    expect(shown('[data-inner]')).toBe(true)

    show.set(false)
    await settle()
    expect(shown('[data-el]')).toBe(false)
    expect(shown('[data-inner]')).toBe(false)
    expect(shown('[data-none]')).toBe(true)

    show.set(true)
    await settle()
    expect(shown('[data-el]')).toBe(true)
    expect(shown('[data-inner]')).toBe(true)
  })

  it('keeps x-model working in a re-shown branch', async () => {
    // The reason each show clones from a pre-processing snapshot: this input's
    // x-model and :id are consumed by the first pass and never restored on the
    // live template, so a clone taken from the element later is inert.
    const loading = window.stx.state(false)
    const fields = window.stx.state([])
    const drafts = window.stx.reactive({ docMode: false })
    await boot(
      '<div :if="loading()">Loading</div>'
      + '<template :else><form><template :for="field in fields()">'
      + '<label data-row><input :id="\'config-\' + field.key" type="checkbox" x-model="drafts[field.key]">'
      + '<span>{{ drafts[field.key] ? \'Enabled\' : \'Disabled\' }}</span></label>'
      + '</template></form></template>',
      { loading, fields, drafts },
      'chain_model',
    )

    loading.set(true)
    await settle()
    fields.set([{ key: 'docMode' }])
    await settle()
    loading.set(false)
    await settle()

    const boxes = document.querySelectorAll('input[type="checkbox"]')
    expect(boxes).toHaveLength(1)
    const box = boxes[0]
    expect(box.id).toBe('config-docMode')
    expect(box.hasAttribute('x-model')).toBe(false)

    box.checked = true
    box.dispatchEvent(new window.Event('change'))
    await settle()
    expect(drafts.docMode).toBe(true)
    expect(box.parentElement?.textContent?.trim()).toBe('Enabled')
  })
})
