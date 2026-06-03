/**
 * <TransitionGroup> — class-driven enter/leave + FLIP for keyed :for lists
 * (stacksjs/stx#1742).
 *
 * The FLIP *positioning* needs real layout (getBoundingClientRect) and so can
 * only be eyeballed in a browser, but the class lifecycle and the
 * leave-then-remove timing — the parts that decide correctness — are driven here
 * against the real runtime via the #1741 DOM shim. Every transition has a
 * timeout fallback, so a layout-less environment can't hang a leaving node; the
 * tests rely on that to converge.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom, shimAttributes } from '../../src/testing'
import { SuspenseBuiltin } from '../../src/builtins/suspense'
import { TransitionGroupBuiltin } from '../../src/builtins/transition-group'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const hasClass = (el: any, c: string) => !!el && el.classList && el.classList.contains(c)

describe('<TransitionGroup> runtime helpers (#1742)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('tgEnter applies enter-from + enter-active immediately, then enter-to', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    window.stx._tg.enter(el, 'card')
    // Synchronous starting state.
    expect(hasClass(el, 'card-enter-from')).toBe(true)
    expect(hasClass(el, 'card-enter-active')).toBe(true)
    // After two animation frames the from→to swap has happened.
    await sleep(80)
    expect(hasClass(el, 'card-enter-from')).toBe(false)
    expect(hasClass(el, 'card-enter-to')).toBe(true)
    // After the (fallback) transition end, active/to are cleaned up.
    await sleep(420)
    expect(hasClass(el, 'card-enter-active')).toBe(false)
    expect(hasClass(el, 'card-enter-to')).toBe(false)
  })

  it('tgLeave applies leave classes, takes over removal, and removes the node', async () => {
    const parent = document.createElement('div')
    const el = document.createElement('div')
    parent.appendChild(el)
    document.body.appendChild(parent)

    const tookOver = window.stx._tg.leave(el, 'card')
    expect(tookOver).toBe(true)
    expect(hasClass(el, 'card-leave-from')).toBe(true)
    expect(hasClass(el, 'card-leave-active')).toBe(true)
    // Still in the DOM during the transition.
    expect(el.parentNode).toBe(parent)
    await sleep(80)
    expect(hasClass(el, 'card-leave-to')).toBe(true)
    // The fallback timeout removes it once the transition "ends".
    await sleep(420)
    expect(el.parentNode).toBeNull()
  })

  it('tgFlip is a no-op (no crash) when nothing moved', () => {
    const a = document.createElement('div')
    document.body.appendChild(a)
    const first = window.stx._tg.snapshot([a])
    // happy-dom has no layout, so rects are zero → no move → must not throw.
    expect(() => window.stx._tg.flip([a], first, 'card')).not.toThrow()
  })
})

describe('<TransitionGroup> + Suspense builtins render correct markup (#1742)', () => {
  it('TransitionGroup wraps the slot in <tag data-stx-transition-group>', () => {
    const out = TransitionGroupBuiltin.render(
      { static: { name: 'card', tag: 'ul', class: 'space-y-2' }, serverDynamic: {} } as any,
      '<li :for="r in reviews()" :key="r.id">x</li>',
      {} as any,
    )
    expect(out).toBe('<ul data-stx-transition-group="card" class="space-y-2"><li :for="r in reviews()" :key="r.id">x</li></ul>')
  })

  it('TransitionGroup defaults name to "v" and tag to "div", and sanitises the tag', () => {
    const out = TransitionGroupBuiltin.render(
      { static: { tag: 'ul><script' }, serverDynamic: {} } as any,
      'inner',
      {} as any,
    )
    expect(out.startsWith('<ulscript ')).toBe(true) // sanitised, no tag breakout
    expect(out).toContain('data-stx-transition-group="v"')
  })

  it('Suspense builtin still renders its three regions (sanity)', () => {
    const out = SuspenseBuiltin.render({ static: { fallback: 'Loading' }, serverDynamic: {} } as any, '<p>x</p>', {} as any)
    expect(out).toContain('data-stx-suspense-fallback')
    expect(out).toContain('data-stx-suspense-content')
  })
})
