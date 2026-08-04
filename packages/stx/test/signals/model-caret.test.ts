/**
 * `x-model` does not move the text cursor (stacksjs/stx#1799).
 *
 * The text branch of `bindModel` wrote `el.value` on every effect run with no
 * check that it differed. Typing forms a loop — `input` → `setValue` → the
 * signal changes → the effect re-runs → the write — and assigning to `.value`
 * moves the caret to the END of the control. So every character sent the cursor
 * back to the end.
 *
 * It stayed unnoticed because it is a no-op in the common case: when you are
 * typing at the end of a field, "caret jumps to the end" changes nothing. It
 * only bites when the cursor sits in the middle of existing text — a login form
 * felt fine, a textarea people actually edit did not. Worse inside `:for`,
 * where key-based reuse updates the item signal on reuse (#1669) and
 * re-evaluates the reused row's bindings on every keystroke.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

let seq = 0

/** Mount a control bound to a fresh signal, through the normal hydration path. */
async function mount(tag: string, attrs: string, initial: string) {
  const setupName = `__stx_setup_model_${++seq}`
  const text = window.stx.state(initial)
  window[setupName] = () => ({ text })

  document.body.innerHTML = `<main data-stx="${setupName}"><${tag} id="ctl" ${attrs}></${tag}></main>`
  document.querySelector('#ctl').setAttribute('x-model', 'text')
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 20))

  return { el: document.querySelector('#ctl'), text }
}

/**
 * Give a control the selection API, which very-happy-dom does not implement.
 *
 * Critically this reproduces the browser behaviour the bug depends on:
 * **assigning `.value` collapses the caret to the end**. Without that, a test
 * cannot tell a guarded write from an unguarded one, and would pass against the
 * unfixed runtime. `writes` counts assignments so the guard itself is testable.
 */
function withSelection(el: any) {
  let raw = String(el.value ?? '')
  let start = raw.length
  let end = raw.length
  const state = { writes: 0 }

  Object.defineProperty(el, 'value', {
    configurable: true,
    get: () => raw,
    set(v: unknown) {
      state.writes++
      raw = String(v ?? '')
      start = raw.length
      end = raw.length
    },
  })
  Object.defineProperty(el, 'selectionStart', {
    configurable: true,
    get: () => start,
    set(v: number) { start = v },
  })
  Object.defineProperty(el, 'selectionEnd', {
    configurable: true,
    get: () => end,
    set(v: number) { end = v },
  })
  el.setSelectionRange = (s: number, e: number) => { start = s; end = e }

  return state
}

/** What a browser does on a keystroke: splice the character in, fire input. */
function type(el: any, char: string, at: number) {
  el.value = el.value.slice(0, at) + char + el.value.slice(at)
  el.setSelectionRange(at + char.length, at + char.length)
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
}

describe('x-model — caret preservation', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('leaves the caret where the user typed, mid-text', async () => {
    // The reported symptom, exactly: cursor in the middle, type one character.
    const { el } = await mount('input', 'value="hello world"', 'hello world')
    withSelection(el)
    el.focus()
    el.setSelectionRange(5, 5)

    type(el, 'X', 5)

    expect(el.value).toBe('helloX world')
    expect(el.selectionStart).toBe(6)
  })

  it('survives several mid-text keystrokes in a row', async () => {
    const { el } = await mount('input', 'value="ab"', 'ab')
    withSelection(el)
    el.focus()
    for (let i = 0; i < 3; i++)
      type(el, '-', 1 + i)

    expect(el.value).toBe('a---b')
    expect(el.selectionStart).toBe(4)
  })

  it('still applies a genuine external change', async () => {
    // The guard must stop redundant writes, not real updates.
    const { el, text } = await mount('input', 'value="before"', 'before')
    text.set('after')
    expect(el.value).toBe('after')
  })

  it('keeps the offset when the value changes from elsewhere while focused', async () => {
    // A formatter or a remote sync rewriting the field the user is sitting in
    // — the case the equality guard alone cannot cover.
    const { el, text } = await mount('input', 'value="abcdef"', 'abcdef')
    withSelection(el)
    el.focus()
    el.setSelectionRange(3, 3)

    text.set('abcXdef')

    expect(el.value).toBe('abcXdef')
    expect(el.selectionStart).toBe(3)
  })

  it('clamps the offset when the new value is shorter', async () => {
    const { el, text } = await mount('input', 'value="abcdefghij"', 'abcdefghij')
    withSelection(el)
    el.focus()
    el.setSelectionRange(9, 9)

    text.set('ab')

    expect(el.value).toBe('ab')
    expect(el.selectionStart).toBe(2)
  })

  it('preserves a selection range, not just a collapsed caret', async () => {
    const { el, text } = await mount('input', 'value="abcdefgh"', 'abcdefgh')
    withSelection(el)
    el.focus()
    el.setSelectionRange(2, 5)

    text.set('abcdefgh!')

    expect(el.selectionStart).toBe(2)
    expect(el.selectionEnd).toBe(5)
  })

  it('works the same for a textarea', async () => {
    // The control the bug actually blocks — an editor people edit mid-text.
    const { el } = await mount('textarea', '', 'line one')
    withSelection(el)
    el.focus()
    el.setSelectionRange(4, 4)

    type(el, 'Z', 4)

    expect(el.value).toBe('lineZ one')
    expect(el.selectionStart).toBe(5)
  })

  it('does not throw on an input type without selection support', async () => {
    // selectionStart throws on number/email/date, so the read must be guarded.
    const { el, text } = await mount('input', 'type="number" value="1"', '1')
    el.focus()
    expect(() => text.set('42')).not.toThrow()
    expect(el.value).toBe('42')
  })
})
