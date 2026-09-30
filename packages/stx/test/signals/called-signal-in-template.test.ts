/**
 * `:show="flag()"` and `:show="flag"` are the same binding.
 *
 * CLAUDE.md used to call the called form a silent-failure mode: the auto-unwrap
 * proxy returns the VALUE for a signal, so `flag()` was said to be `false()` --
 * a TypeError that the directive binders swallow, leaving the element hidden
 * with no warning. That is not what the runtime does.
 * `createExpressionAutoUnwrapProxy` reads the expression text and preserves the
 * signal for any name the expression calls (`expressionCallsSignal`), so both
 * spellings evaluate and both stay reactive.
 *
 * It matters because the claim invited a rewrite: ~13 call sites across
 * @stacksjs/components use the called form, including Dialog, Drawer,
 * Notification, Avatar and CommandPalette. Had anyone "fixed" them on the
 * strength of that paragraph, they would have churned working markup in the
 * library's most-used components. This file is why the paragraph can now say
 * both forms work.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

let booted = 0
async function boot(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `called_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

const hidden = (selector: string): boolean => document.querySelector(selector)?.style?.display === 'none'
const text = (selector: string): string => document.querySelector(selector)?.textContent ?? ''

describe('a called signal in a template expression', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('binds :show the same way the bare name does, and keeps updating', async () => {
    const bare = window.stx.state(true)
    const called = window.stx.state(true)
    await boot(
      '<p data-bare :show="bare">b</p><p data-called :show="called()">c</p>',
      { bare, called },
    )
    expect([hidden('[data-bare]'), hidden('[data-called]')]).toEqual([false, false])

    bare.set(false)
    called.set(false)
    await settle()
    expect([hidden('[data-bare]'), hidden('[data-called]')]).toEqual([true, true])

    // Back again: the called form is not a one-shot read.
    bare.set(true)
    called.set(true)
    await settle()
    expect([hidden('[data-bare]'), hidden('[data-called]')]).toEqual([false, false])
  })

  it('handles a negated call, which the old note flagged specifically', async () => {
    const off = window.stx.state(false)
    await boot('<p data-neg :show="!off()">n</p>', { off })
    expect(hidden('[data-neg]')).toBe(false)

    off.set(true)
    await settle()
    expect(hidden('[data-neg]')).toBe(true)
  })

  it('adds and removes with :if', async () => {
    const present = window.stx.state(true)
    await boot('<p data-if :if="present()">i</p>', { present })
    expect(document.querySelector('[data-if]')).not.toBeNull()

    present.set(false)
    await settle()
    expect(document.querySelector('[data-if]')).toBeNull()
  })

  it('reads a called signal in text, in a ternary, and through a derived', async () => {
    const label = window.stx.state('hello')
    const count = window.stx.state(2)
    const doubled = window.stx.derived(() => count() * 2)
    await boot(
      '<p data-t :text="label()"></p>'
      + '<p data-d :text="doubled()"></p>'
      + '<p data-x :class="label() === \'hello\' ? \'yes\' : \'no\'"></p>',
      { label, count, doubled },
    )
    expect(text('[data-t]')).toBe('hello')
    expect(text('[data-d]')).toBe('4')
    expect(document.querySelector('[data-x]').getAttribute('class')).toBe('yes')

    label.set('bye')
    count.set(5)
    await settle()
    expect(text('[data-t]')).toBe('bye')
    expect(text('[data-d]')).toBe('10')
    expect(document.querySelector('[data-x]').getAttribute('class')).toBe('no')
  })

  it('reaches a signal held on an object and on a store', async () => {
    const group = { flag: window.stx.state('nested') }
    window.stx.defineStore('calledSignalProbe', () => ({ count: window.stx.state(7) }))
    const store = window.stx.useStore('calledSignalProbe')
    await boot('<p data-n :text="group.flag()"></p><p data-s :text="store.count()"></p>', { group, store })
    expect(text('[data-n]')).toBe('nested')
    expect(text('[data-s]')).toBe('7')
  })
})
