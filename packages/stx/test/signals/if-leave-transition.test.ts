/**
 * A transition on a single-element :if (`data-stx-if-transition="name"`).
 *
 * Hiding an :if used to take its element off the page in the same tick, so a
 * dialog or panel could animate in but never out. The element is a toggle,
 * kept and put back on the next show, and its bindings stay live while it is
 * hidden, so it cannot simply stay on the page while it animates: whatever it
 * shows would change under the animation (a dialog's text going blank as the
 * state that closed it is cleared). What leaves is a still copy of it as it
 * last looked, with the transition's leave classes, and it goes when the
 * transition ends. The element itself is put away as before.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function bootRuntime(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

function mount(markup: string) {
  const root = document.createElement('section')
  root.setAttribute('data-stx-scope', 'leaving')
  root.innerHTML = markup
  document.body.append(root)
  const open = window.stx.state(true)
  const label = window.stx.state('Delete this user?')
  window.stx._scopes = { leaving: { open, label } }
  window.__stxDomReadyHandler()
  return { root, open, label }
}

describe('a leave transition on a single-element :if', () => {
  beforeEach(() => {
    bootRuntime()
    document.body.innerHTML = ''
  })

  it('leaves a still copy, as it last looked, that animates out and then goes', async () => {
    const { root, open, label } = mount('<div :if="open()" id="panel" data-stx-if-transition="fade"><p>{{ label() }}</p></div>')
    await sleep(0)
    const panel = root.querySelector('#panel')!
    expect(panel.textContent).toContain('Delete this user?')

    // Closing clears the state the panel was showing, in the same turn.
    window.stx.batch(() => {
      open.set(false)
      label.set('')
    })

    expect(panel.isConnected).toBe(false)
    const leaving = root.querySelector('[data-stx-if-transition]') as HTMLElement
    expect(leaving).not.toBeNull()
    expect(leaving).not.toBe(panel)
    expect(leaving.textContent).toContain('Delete this user?')
    expect(leaving.classList.contains('fade-leave-active')).toBe(true)
    expect(leaving.hasAttribute('inert')).toBe(true)
    expect(leaving.getAttribute('aria-hidden')).toBe('true')
    // A copy does not claim the element's id.
    expect(leaving.hasAttribute('id')).toBe(false)

    await sleep(80)
    expect(leaving.classList.contains('fade-leave-to')).toBe(true)
    await sleep(420)
    expect(leaving.isConnected).toBe(false)
    expect(root.querySelector('[data-stx-if-transition]')).toBeNull()
  })

  it('showing it again while the copy is leaving puts the element back and drops the copy at once', async () => {
    const { root, open, label } = mount('<div :if="open()" id="panel" data-stx-if-transition="fade"><p>{{ label() }}</p></div>')
    await sleep(0)
    const panel = root.querySelector('#panel')!

    open.set(false)
    expect(root.querySelectorAll('[data-stx-if-transition]').length).toBe(1)

    label.set('Delete this team?')
    open.set(true)
    expect(panel.isConnected).toBe(true)
    expect(root.querySelectorAll('[data-stx-if-transition]').length).toBe(1)
    expect(root.querySelector('[data-stx-if-transition]')).toBe(panel)
    expect(panel.textContent).toContain('Delete this team?')

    await sleep(500)
    expect(panel.isConnected).toBe(true)
  })

  it('without a transition the element still leaves at once, with nothing left behind', async () => {
    const { root, open } = mount('<div :if="open()" id="panel"><p>{{ label() }}</p></div>')
    await sleep(0)
    open.set(false)
    expect(root.querySelector('#panel')).toBeNull()
    expect(root.querySelector('div')).toBeNull()
  })
})
