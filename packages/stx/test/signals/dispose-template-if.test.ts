/**
 * A hidden `<template :if>` branch disposes the effects that bound it
 * (stacksjs/stx#1954, Reproduction 2).
 *
 * `bindIf` handles a `<template>` by cloning `el.content` on every show and
 * running `processTemplateNodes` over the clones, with no `trackEffects`
 * around it. Hide removes the clones and clears `currentNodes`, but never
 * disposes their effects. The clones are never reused, so every hide/show
 * cycle leaves one more set of bindings subscribed to the signals they read.
 * They keep re-running on each later change, including while the branch is
 * hidden and nothing is rendered.
 *
 * The DOM stays correct throughout, so the leak is only visible as work. That
 * is what these tests measure: how many times the branch binding evaluates on
 * ONE write to a signal it reads, compared with how many branch elements are
 * actually in the DOM.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const CYCLES = 10

let seq = 0

const settle = () => new Promise(resolve => setTimeout(resolve, 30))
const rendered = () => document.querySelectorAll('#host .probe').length

/** Mount a `<template :if>` whose branch carries a counting binding. */
async function mountBranch() {
  const shown = window.stx.state(true)
  const tick = window.stx.state(0)
  const counter = { evaluations: 0 }

  // The branch binding. It reads tick, so every tick write re-runs each live
  // copy of it exactly once.
  const probe = () => {
    counter.evaluations++
    return tick() >= 0 ? 'branch' : ''
  }

  const setupName = `__stx_setup_dispose_template_if_${++seq}`
  window[setupName] = () => ({ shown, tick, probe })

  document.body.innerHTML = `
    <main data-stx="${setupName}">
      <div id="host">
        <template :if="shown()">
          <span class="probe" x-class="probe()">branch</span>
        </template>
      </div>
    </main>
  `
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()

  /** Write tick once and return how many binding evaluations it caused. */
  async function evaluationsForOneUpdate() {
    const before = counter.evaluations
    tick.set(tick() + 1)
    await settle()
    return counter.evaluations - before
  }

  async function hide() {
    shown.set(false)
    await settle()
  }

  async function show() {
    shown.set(true)
    await settle()
  }

  return { evaluationsForOneUpdate, hide, show }
}

describe('<template :if> disposes hidden branch effects (#1954)', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it(`runs one binding per rendered branch after ${CYCLES} hide/show cycles`, async () => {
    const branch = await mountBranch()

    // Harness check before any toggling: the branch is rendered, its binding
    // is live, and one update runs it exactly once. A harness that failed to
    // bind would read 0 here and fail, rather than pass the leak check below.
    expect(rendered()).toBe(1)
    expect(document.querySelector('#host .probe').classList.contains('branch')).toBe(true)
    expect(await branch.evaluationsForOneUpdate()).toBe(1)

    for (let i = 0; i < CYCLES; i++) {
      await branch.hide()
      expect(rendered()).toBe(0)
      await branch.show()
      expect(rendered()).toBe(1)
    }

    // The DOM holds one branch, so one update must run one binding. Every
    // removed clone's binding that is still subscribed adds one more.
    expect(rendered()).toBe(1)
    expect(await branch.evaluationsForOneUpdate()).toBe(rendered())
  })

  it(`runs no bindings while hidden after ${CYCLES} hide/show cycles`, async () => {
    const branch = await mountBranch()

    expect(rendered()).toBe(1)
    expect(await branch.evaluationsForOneUpdate()).toBe(1)

    for (let i = 0; i < CYCLES; i++) {
      await branch.hide()
      await branch.show()
    }
    await branch.hide()

    // Nothing is rendered, so nothing should re-run on an update.
    expect(rendered()).toBe(0)
    expect(await branch.evaluationsForOneUpdate()).toBe(rendered())
  })
})
