/**
 * One overlay stack for everything that takes over the page (stacksjs/stx#2057).
 *
 * stxAlert/stxConfirm, the runtime modal and drawer, and @stacksjs/components'
 * Dialog and Drawer each kept their own Escape listener, scroll lock and focus
 * trap. One open over another meant a single Escape closed both, two traps
 * fought over Tab, and the first to close unlocked the page beneath the one
 * still open. #1998 fixed that for the confirm dialogs among themselves; these
 * hold it for all of them together, through `window.stx.overlays`.
 *
 * Driven against the real generated runtime.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

function bootRuntime(): void {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
}

const settle = (ms = 0) => new Promise(r => setTimeout(r, ms))

function key(name: string, opts: Record<string, unknown> = {}): any {
  const event = new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...opts })
  document.dispatchEvent(event)
  return event
}

/** A panel in the page's own markup, the way a component renders one. */
function panel(id: string, buttons = 2): any {
  const el = document.createElement('div')
  el.id = id
  el.tabIndex = -1
  for (let i = 0; i < buttons; i++) {
    const b = document.createElement('button')
    b.textContent = `${id}-${i}`
    el.appendChild(b)
  }
  document.querySelector('main').appendChild(el)
  return el
}

let closed: string[] = []
const overlays = () => window.stx.overlays

function open(id: string, el: any, extra: Record<string, unknown> = {}): void {
  overlays().open(id, { panel: el, onEscape: () => { closed.push(id); overlays().close(id) }, ...extra })
}

/*
 * Every test boots a fresh runtime onto the same document, and a runtime whose
 * stack still holds an overlay keeps its document listener. Left open, a test's
 * overlay would answer the next test's Escape first.
 */
afterEach(() => {
  for (const id of overlays().list().reverse())
    overlays().close(id)
})

beforeEach(() => {
  bootRuntime()
  document.body.innerHTML = '<main><button id="trigger">open</button></main>'
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  closed = []
})

describe('the overlay stack', () => {
  it('answers one Escape with the topmost overlay only', () => {
    open('outer', panel('outer'))
    open('inner', panel('inner'))

    key('Escape')
    expect(closed).toEqual(['inner'])
    expect(overlays().list()).toEqual(['outer'])

    key('Escape')
    expect(closed).toEqual(['inner', 'outer'])
    expect(overlays().list()).toEqual([])
  })

  it('keeps the page locked until the last overlay closes, and restores what the app had', () => {
    document.body.style.overflow = 'clip'
    open('outer', panel('outer'))
    open('inner', panel('inner'))
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')

    overlays().close('inner')
    expect(document.body.style.overflow).toBe('hidden')

    overlays().close('outer')
    expect(document.body.style.overflow).toBe('clip')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('traps Tab in the topmost overlay alone', () => {
    const outer = panel('outer')
    const inner = panel('inner')
    open('outer', outer)
    open('inner', inner)

    const [first, last] = Array.from(inner.querySelectorAll('button')) as any[]
    last.focus()
    const forward = key('Tab')
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    first.focus()
    key('Tab', { shiftKey: true })
    expect(document.activeElement).toBe(last)

    // Focus somewhere behind it is pulled back into the top overlay, not the
    // one underneath.
    outer.querySelector('button').focus()
    key('Tab')
    expect(document.activeElement).toBe(first)
  })

  it('moves focus in on open and gives it back to the opener on close', () => {
    const trigger = document.getElementById('trigger')
    trigger.focus()
    const el = panel('one')
    open('one', el)
    expect(document.activeElement).toBe(el.querySelector('button'))

    overlays().close('one')
    expect(document.activeElement).toBe(trigger)
  })

  it('leaves focus alone when an overlay underneath is closed', () => {
    const outer = panel('outer')
    const inner = panel('inner')
    open('outer', outer)
    open('inner', inner)
    const held = inner.querySelector('button')
    held.focus()

    overlays().close('outer')
    expect(document.activeElement).toBe(held)
    expect(overlays().isTop('inner')).toBe(true)
  })

  it('leaves an Escape that something inside already handled', () => {
    open('one', panel('one'))
    const inner = document.querySelector('#one button')
    inner.addEventListener('keydown', (e: any) => { if (e.key === 'Escape') e.preventDefault() })
    inner.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    expect(closed).toEqual([])
    expect(overlays().list()).toEqual(['one'])
  })

  it('ignores Escape for an overlay that must be answered', () => {
    overlays().open('must', { panel: panel('must') })
    key('Escape')
    expect(overlays().list()).toEqual(['must'])
  })

  it('opening an open overlay again only updates it', () => {
    const el = panel('one')
    open('one', el)
    open('one', el)
    expect(overlays().list()).toEqual(['one'])
  })

  it('stops listening once nothing is open', () => {
    let added = 0
    let removed = 0
    const add = document.addEventListener.bind(document)
    const remove = document.removeEventListener.bind(document)
    document.addEventListener = (t: string, ...rest: any[]) => { if (t === 'keydown') added++; return add(t, ...rest) }
    document.removeEventListener = (t: string, ...rest: any[]) => { if (t === 'keydown') removed++; return remove(t, ...rest) }
    try {
      open('a', panel('a'))
      open('b', panel('b'))
      overlays().close('b')
      overlays().close('a')
      expect([added, removed]).toEqual([1, 1])
    }
    finally {
      document.addEventListener = add
      document.removeEventListener = remove
    }
  })
})

describe('a confirm over an overlay in the page', () => {
  it('answers Escape itself and leaves the overlay underneath open and locked', async () => {
    open('page-dialog', panel('page-dialog'))
    const answer = window.stxConfirm('Discard changes?')
    await settle()
    expect(overlays().list().length).toBe(2)

    key('Escape')
    expect(await answer).toBe(false)
    expect(closed).toEqual([])
    expect(overlays().list()).toEqual(['page-dialog'])
    expect(document.body.style.overflow).toBe('hidden')

    key('Escape')
    expect(closed).toEqual(['page-dialog'])
    expect(document.body.style.overflow).toBe('')
  })

  it('does not make an in-page overlay inert, only a dialog appended to the body', async () => {
    const el = panel('page-dialog')
    open('page-dialog', el)
    expect(!!document.querySelector('main').inert).toBe(false)

    const answer = window.stxAlert('Saved')
    await settle()
    // The confirm is a child of <body>, so the page behind it, overlay and all,
    // goes inert while it is on top...
    expect(document.querySelector('main').inert).toBe(true)
    key('Escape')
    await answer
    // ...and is usable again once it has gone.
    expect(!!document.querySelector('main').inert).toBe(false)
  })
})

describe('the runtime modal', () => {
  it('closes only the topmost of two with one Escape', () => {
    document.body.insertAdjacentHTML('beforeend', '<div data-stx-modal="a" style="display:none"><button>a</button></div><div data-stx-modal="b" style="display:none"><button>b</button></div>')
    window.stx.modal.open('a')
    window.stx.modal.open('b')
    key('Escape')
    expect(document.querySelector('[data-stx-modal="b"]').hasAttribute('data-stx-modal-open')).toBe(false)
    expect(document.querySelector('[data-stx-modal="a"]').hasAttribute('data-stx-modal-open')).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    key('Escape')
    expect(document.body.style.overflow).toBe('')
  })
})

/**
 * Focus is retried, because `focus()` on an element that is not displayed yet
 * is a silent no-op: an overlay opened by an effect runs a frame before `:show`
 * reveals it, and a single attempt left focus on the body every time. Moved
 * here from Drawer and Dialog, which each had their own copy.
 */
describe('moving focus in', () => {
  /** A panel whose button only accepts focus once `shown` is set. */
  function refusing(id: string): { el: any, button: any, show: () => void, tries: () => number } {
    const el = panel(id, 1)
    const button = el.querySelector('button')
    let shown = false
    let tries = 0
    const real = button.focus.bind(button)
    button.focus = () => { tries++; if (shown) real() }
    el.focus = () => {}
    return { el, button, show: () => { shown = true }, tries: () => tries }
  }

  function withSchedulers(frame: (cb: () => void) => void, timer: (cb: () => void) => void, run: () => void): void {
    const raf = globalThis.requestAnimationFrame
    const st = globalThis.setTimeout
    globalThis.requestAnimationFrame = ((cb: () => void) => { frame(cb); return 1 }) as any
    globalThis.setTimeout = ((cb: () => void) => { timer(cb); return 1 }) as any
    try { run() }
    finally {
      globalThis.requestAnimationFrame = raf
      globalThis.setTimeout = st
    }
  }

  it('keeps trying until the panel is actually shown', () => {
    const p = refusing('late')
    let frames = 0
    withSchedulers((cb) => { frames++; if (frames === 3) p.show(); cb() }, () => {}, () => {
      open('late', p.el)
    })
    expect(document.activeElement).toBe(p.button)
    expect(frames).toBe(3)
  })

  it('gives up rather than spinning when nothing can take focus', () => {
    const p = refusing('never')
    let frames = 0
    withSchedulers((cb) => { frames++; cb() }, () => {}, () => {
      open('never', p.el)
    })
    expect(frames).toBe(10)
  })

  it('stops if the overlay closed while it was still trying', () => {
    const p = refusing('brief')
    let frames = 0
    withSchedulers((cb) => { frames++; overlays().close('brief'); cb() }, () => {}, () => {
      open('brief', p.el)
    })
    expect(frames).toBe(1)
  })

  it('still focuses when animation frames never fire', () => {
    const p = refusing('background')
    const timers: Array<() => void> = []
    withSchedulers(() => {}, cb => timers.push(cb), () => {
      open('background', p.el)
      p.show()
      while (timers.length) timers.shift()!()
    })
    expect(document.activeElement).toBe(p.button)
  })

  it('does not retry twice when the frame and the timer both arrive', () => {
    const p = refusing('raced')
    const frames: Array<() => void> = []
    const timers: Array<() => void> = []
    withSchedulers(cb => frames.push(cb), cb => timers.push(cb), () => {
      overlays().open('raced', { panel: p.el, initialFocus: p.button })
      while (frames.length || timers.length) {
        while (frames.length) frames.shift()!()
        while (timers.length) timers.shift()!()
      }
    })
    // The first attempt plus ten retries, not twice that.
    expect(p.tries()).toBe(11)
  })
})

/**
 * A popup is a non-modal layer: it takes Escape while it is on top, and
 * nothing else. Each menu, listbox and popover used to listen for Escape on
 * the document itself, so inside a dialog whichever listener had been added
 * first won, and an Escape meant for the menu could close the dialog.
 */
describe('a popup on the stack', () => {
  function popup(id: string): void {
    overlays().open(id, { modal: false, panel: panel(id, 1), onEscape: () => { closed.push(id); overlays().close(id) } })
  }

  it('takes Escape before the dialog it sits in, and the dialog the next one', () => {
    open('dialog', panel('dialog'))
    popup('menu')

    key('Escape')
    expect(closed).toEqual(['menu'])
    expect(overlays().list()).toEqual(['dialog'])

    key('Escape')
    expect(closed).toEqual(['menu', 'dialog'])
  })

  it('does not lock the page or move focus on its own', () => {
    const trigger = document.getElementById('trigger')
    trigger.focus()
    popup('menu')
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)

    key('Escape')
    expect(document.activeElement).toBe(trigger)
  })

  it('leaves Tab trapped in the dialog beneath it', () => {
    const dialog = panel('dialog')
    open('dialog', dialog)
    popup('menu')

    const [first, last] = Array.from(dialog.querySelectorAll('button')) as any[]
    last.focus()
    key('Tab')
    expect(document.activeElement).toBe(first)
    expect(document.body.style.overflow).toBe('hidden')
  })
})
