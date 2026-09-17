/**
 * A :for empty-state placeholder disposes its bindings when it is hidden
 * (stacksjs/stx#1954).
 *
 * A :for element can be followed by a sibling carrying the @for-empty
 * attribute. bindFor lifts that sibling out of the DOM as a template, and every
 * time the list becomes empty showEmpty() clones it, inserts the clone and
 * hydrates it with a bare processElement(emptyElement). hideEmpty() only calls
 * emptyElement.remove(). Nothing wraps the hydration in trackEffects and
 * nothing disposes on hide, so each empty -> non-empty -> empty cycle leaves the
 * previous clone's effects subscribed to every signal they read. They keep
 * re-running for as long as the page is open, including while no placeholder
 * is rendered at all.
 *
 * What is pinned: on ONE update of a signal the placeholder binding reads, the
 * number of placeholder binding evaluations equals the number of placeholders
 * actually in the DOM — one while the list is empty, zero while it has rows —
 * no matter how many times the list has flipped between the two.
 *
 * ## The lifted-out template source is attributed separately
 *
 * The original @for-empty element is ALSO hydrated once at mount: the parent's
 * processElement iterates a snapshot of its children, so it still reaches the
 * sibling bindFor has just removed, and binds it while detached. That is a
 * separate, constant defect (one extra binding, created once, never growing)
 * with a different cause from the showEmpty/hideEmpty leak pinned here. To keep
 * this test about that leak, every evaluation returns a unique token that its
 * :text binding writes into its own element, and evaluations whose token lands
 * on the detached source are not counted as placeholder evaluations. Every
 * other evaluation is counted, including ones on detached leaked clones.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const CYCLES = 5

let seq = 0

const settle = () => new Promise(resolve => setTimeout(resolve, 30))
const placeholders = () => [...document.querySelectorAll('[data-empty]')]
const rows = () => [...document.querySelectorAll('[data-row]')]

/** The evaluation id a :text="probe()" binding last wrote into an element. */
// eslint-disable-next-line ts/no-explicit-any
function tokenId(el: any): number {
  const match = String(el?.textContent ?? '').match(/#(\d+)@/)
  return match ? Number(match[1]) : 0
}

/**
 * Mount a keyed list, initially empty, whose @for-empty placeholder carries a
 * binding that reads the tick signal through a counting probe.
 */
async function mountEmptyList() {
  const items = window.stx.state([])
  const tick = window.stx.state(0)
  const counter = { evaluations: 0 }
  // Each call is one binding evaluation. Its unique id is written by the
  // :text binding into the element that evaluated it.
  const probe = () => {
    const id = ++counter.evaluations
    return `empty #${id}@${tick()}`
  }

  const setupName = `__stx_setup_for_empty_leak_${++seq}`
  window[setupName] = () => ({ items, tick, probe })

  document.body.innerHTML = `
    <main data-stx="${setupName}">
      <ul id="list">
        <li :for="row in items" :key="row.id" data-row>{{ row.label }}</li>
        <li data-empty :text="probe()">Nothing here</li>
      </ul>
    </main>
  `
  // The test DOM's HTML parser cannot read an attribute name starting with @
  // (it turns the whole tag into text), so the marker is set programmatically,
  // the same way template-for-dom.test.ts sets @if / @else.
  const templateSource = document.querySelector('[data-empty]')
  templateSource.setAttribute('@for-empty', '')
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()

  /**
   * Update the signal the placeholder binding reads, exactly once, and report
   * how many placeholder binding evaluations that one update caused.
   */
  async function update() {
    await settle()
    const firstId = counter.evaluations + 1
    tick.set(tick() + 1)
    await settle()
    const total = counter.evaluations - firstId + 1
    const onTemplateSource = tokenId(templateSource) >= firstId ? 1 : 0
    const live = placeholders()
    return {
      evaluations: total - onTemplateSource,
      // Every rendered placeholder must itself have re-evaluated on this update.
      liveUpdated: live.filter(el => tokenId(el) >= firstId).length,
      value: tick(),
    }
  }

  async function fill() {
    items.set([{ id: 1, label: 'a' }, { id: 2, label: 'b' }])
    await settle()
  }

  async function empty() {
    items.set([])
    await settle()
  }

  return { update, fill, empty }
}

describe(':for @for-empty placeholder disposes its effects (#1954)', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('runs the placeholder binding once per update while shown, however many times it was re-shown', async () => {
    const list = await mountEmptyList()

    // Harness check, before any cycle: the placeholder is rendered, hydrated,
    // re-evaluates on the update, and is the only placeholder binding that
    // does. If the placeholder were not found or not hydrated this would be 0
    // and the test would stop here rather than pass vacuously below.
    expect(placeholders()).toHaveLength(1)
    expect(rows()).toHaveLength(0)
    const before = await list.update()
    expect(before.liveUpdated).toBe(1)
    expect(placeholders()[0].textContent).toContain(`@${before.value}`)
    expect(before.evaluations).toBe(placeholders().length)

    for (let i = 0; i < CYCLES; i++) {
      await list.fill()
      expect(placeholders()).toHaveLength(0)
      expect(rows()).toHaveLength(2)
      await list.empty()
      expect(placeholders()).toHaveLength(1)
      expect(rows()).toHaveLength(0)
    }

    // The DOM is correct: exactly one placeholder is shown, and it is live.
    expect(placeholders()).toHaveLength(1)
    const after = await list.update()
    expect(after.liveUpdated).toBe(1)
    // So one update must run exactly one placeholder binding.
    expect(after.evaluations).toBe(placeholders().length)
  })

  it('runs no placeholder binding while the placeholder is hidden', async () => {
    const list = await mountEmptyList()

    // Harness check, before any cycle (see above).
    expect(placeholders()).toHaveLength(1)
    const before = await list.update()
    expect(before.liveUpdated).toBe(1)
    expect(before.evaluations).toBe(placeholders().length)

    for (let i = 0; i < CYCLES; i++) {
      await list.fill()
      await list.empty()
    }

    // Leave the list non-empty: nothing is rendered in the empty state.
    await list.fill()
    expect(placeholders()).toHaveLength(0)
    expect(rows()).toHaveLength(2)
    // So an update must run zero placeholder bindings.
    const hidden = await list.update()
    expect(hidden.evaluations).toBe(placeholders().length)
  })
})
