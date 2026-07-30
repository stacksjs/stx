import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

/**
 * `item.value` inside an event handler on a `:for` row.
 *
 * A loop item is wrapped in a signal so keyed rows can update in place — an
 * implementation detail, not something the template author asked for. Every
 * signal also carries a `.value` compatibility accessor returning the whole
 * payload, and `expressionUsesSignalApi` read `option.value` in a handler as a
 * request for exactly that. So the handler was handed the raw signal and
 * `option.value` evaluated to the entire item.
 *
 * `{ id, label, value }` is an ordinary shape — a select option, a radio group,
 * a settings picker — so this is easy to hit, and it gives no error when hit:
 * the handler runs, the wrong thing is stored, and it surfaces somewhere else
 * entirely. Binding expressions already got this right through
 * `createAutoUnwrapProxy`; handlers did not.
 *
 * The `@`-prefixed attributes are attached after parsing because the test DOM's
 * parser drops them from a tag that also carries `:for` — the same workaround
 * `template-for-dom.test.ts` uses for `x-model`.
 */
describe('loop item .value in event handlers', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  // eslint-disable-next-line ts/no-explicit-any
  async function mount(html: string, wire: (root: any) => void): Promise<void> {
    document.body.innerHTML = html
    shimAttributes(document.body)
    wire(document.querySelector('main'))
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))
  }

  // eslint-disable-next-line ts/no-explicit-any
  function click(el: any): void {
    el.dispatchEvent(new window.Event('click', { bubbles: true }))
  }

  it('passes the field, not the whole item', async () => {
    const picked = window.stx.state<unknown>(null)

    window.__stx_setup_loop_value = () => ({
      options: window.stx.derived(() => [
        { id: 'macos', label: 'macOS', value: 'macos' },
        { id: 'arc', label: 'Arc', value: 'arc' },
      ]),
      picked,
      pick: (next: unknown) => picked.set(next),
    })

    await mount(
      `<main data-stx="__stx_setup_loop_value">
        <button :for="option in options" :data-id="option.id">{{ option.label }}</button>
      </main>`,
      root => root.querySelector('button').setAttribute('@click', 'pick(option.value)'),
    )

    // eslint-disable-next-line ts/no-explicit-any
    const arc = [...document.querySelectorAll('button')].find((b: any) => b.getAttribute('data-id') === 'arc')
    expect(arc).toBeTruthy()
    click(arc)

    // The field. Before the fix this was the entire { id, label, value } object,
    // which then got persisted and read back as an invalid preference.
    expect(picked()).toBe('arc')
  })

  it('still reads the field in a binding expression', async () => {
    window.__stx_setup_loop_value_bind = () => ({
      rows: window.stx.derived(() => [{ label: 'Alpha', value: 'a' }]),
    })

    await mount(
      `<main data-stx="__stx_setup_loop_value_bind">
        <span :for="row in rows" :data-value="row.value">{{ row.label }}</span>
      </main>`,
      () => {},
    )

    expect(document.querySelector('span').getAttribute('data-value')).toBe('a')
  })

  it('leaves a real signal usable through its API in the same handler', async () => {
    // The carve-out must be narrow: a genuine signal in scope still arrives as
    // a signal when the handler uses its object API, loop item alongside it.
    const count = window.stx.state(0)

    window.__stx_setup_loop_value_signal = () => ({
      items: window.stx.derived(() => [{ value: 5 }]),
      count,
    })

    await mount(
      `<main data-stx="__stx_setup_loop_value_signal">
        <button :for="item in items">go</button>
      </main>`,
      root => root.querySelector('button').setAttribute('@click', 'count.set(item.value)'),
    )

    click(document.querySelector('button'))
    expect(count()).toBe(5)
  })
})
