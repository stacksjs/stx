/**
 * Touch and wheel directives listen passively unless they must not.
 *
 * Every `@event` was bound with `passive: modifiers.includes('passive')`, so
 * `@touchstart="swipeStart"` on a sticky week strip was an explicitly
 * non-passive listener. A browser cannot start scrolling a gesture that begins
 * on such an element until the main thread has run the handler and said it did
 * not call preventDefault(); on a phone that is a hitch at the start of every
 * scroll from there, and a long one whenever the thread is busy.
 *
 * Scroll-blocking events are now passive by default (as Svelte 5 does).
 * `.prevent` needs preventDefault() and so stays non-passive, and `.nonpassive`
 * is the opt-out for a handler that calls it itself.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { extractAndProcessEvents, generateRuntimeScript, listensPassively, SCROLL_BLOCKING_EVENTS } from '../../src/events'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('listensPassively', () => {
  it('makes the scroll-blocking events passive by default', () => {
    for (const event of SCROLL_BLOCKING_EVENTS)
      expect(listensPassively(event, {})).toBe(true)
    expect(listensPassively('TouchMove', {})).toBe(true)
  })

  it('leaves every other event as it was', () => {
    expect(listensPassively('click', {})).toBe(false)
    expect(listensPassively('touchend', {})).toBe(false)
    expect(listensPassively('scroll', {})).toBe(false)
    expect(listensPassively('click', { passive: true })).toBe(true)
  })

  it('keeps a listener that must call preventDefault() non-passive', () => {
    expect(listensPassively('touchmove', { prevent: true })).toBe(false)
    expect(listensPassively('wheel', { nonpassive: true })).toBe(false)
  })
})

describe('compiled event bindings', () => {
  const optionsFor = (attribute: string): string => {
    const { bindings } = extractAndProcessEvents(`<div ${attribute}="go()"></div>`)
    expect(bindings).toHaveLength(1)
    return generateRuntimeScript(bindings)
  }

  it('binds @touchstart and @wheel passively', () => {
    expect(optionsFor('@touchstart')).toContain('passive: true')
    expect(optionsFor('@wheel')).toContain('passive: true')
  })

  it('binds @touchmove.prevent, @touchmove.nonpassive and @click without it', () => {
    expect(optionsFor('@touchmove.prevent')).not.toContain('passive: true')
    expect(optionsFor('@touchmove.nonpassive')).not.toContain('passive: true')
    expect(optionsFor('@click')).not.toContain('passive: true')
  })
})

describe('runtime event directives', () => {
  let seq = 0
  const recorded: Array<{ type: string, options: AddEventListenerOptions | undefined }> = []

  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  /** Mount one element with `attribute`, recording the options its listener is added with. */
  async function listenerOptions(attribute: string): Promise<AddEventListenerOptions | undefined> {
    const setupName = `__stx_setup_passive_${++seq}`
    let calls = 0
    window[setupName] = () => ({ go: () => { calls++ } })

    document.body.innerHTML = `<main data-stx="${setupName}"><div id="target"></div></main>`
    const target = document.querySelector('#target')
    target.setAttribute(attribute, 'go()')
    const add = target.addEventListener.bind(target)
    recorded.length = 0
    target.addEventListener = (type: string, listener: EventListener, options?: AddEventListenerOptions) => {
      recorded.push({ type, options })
      return add(type, listener, options)
    }
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await flushEffects()

    const type = attribute.slice(1).split('.')[0]
    const binding = recorded.find(entry => entry.type === type)
    expect(binding).toBeDefined()
    // The handler is still wired, passive or not.
    target.dispatchEvent(new window.Event(type))
    expect(calls).toBe(1)
    return binding!.options
  }

  it('adds @touchstart, @touchmove and @wheel passively', async () => {
    expect((await listenerOptions('@touchstart'))?.passive).toBe(true)
    expect((await listenerOptions('@touchmove'))?.passive).toBe(true)
    expect((await listenerOptions('@wheel'))?.passive).toBe(true)
  })

  it('adds @touchmove.prevent and @touchstart.nonpassive as blocking listeners', async () => {
    expect((await listenerOptions('@touchmove.prevent'))?.passive).toBe(false)
    expect((await listenerOptions('@touchstart.nonpassive'))?.passive).toBe(false)
  })

  it('leaves @click non-passive', async () => {
    expect((await listenerOptions('@click'))?.passive).toBe(false)
  })
})
