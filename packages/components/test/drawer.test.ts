/**
 * The Drawer's modal behaviour.
 *
 * A drawer is a dialog, and the parts that make it one are the parts that are
 * easy to leave out: holding the page still behind it, moving focus into it,
 * letting Escape close it from anywhere, and saying what it is to a screen
 * reader. Each of those was missing, and each fails in a way that looks like
 * nothing at all on a desktop with a mouse.
 *
 * Asserted against the component source rather than a rendered DOM: these are
 * structural guarantees about what the component wires up, and the .stx
 * compiler is covered by its own tests. What matters here is that the wiring
 * does not quietly disappear in a refactor.
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(__dirname, '../src/ui/drawer/Drawer.stx'), 'utf8')

describe('Drawer', () => {
  test('holds the page still while it is open', () => {
    // Without this a drag inside the drawer scrolls the page behind it, and on
    // a phone the drawer appears frozen while the page moves under your thumb.
    expect(source).toContain('lockScroll')
    expect(source).toContain("document.body.style.overflow = 'hidden'")
  })

  test('replaces the scrollbar width so the page does not jump', () => {
    expect(source).toContain('window.innerWidth - document.documentElement.clientWidth')
    expect(source).toContain('paddingRight')
  })

  test('unlocks the page again when it closes', () => {
    // The failure here is the worst kind: the drawer is gone and the page can
    // no longer scroll, with nothing on screen to explain it.
    expect(source).toContain('unlockScroll')
  })

  test('unlocks even if it is destroyed while open', () => {
    // Removed mid-open, there is no drawer left to undo the lock.
    expect(source).toContain('onDestroy(')
  })

  test('closes on Escape from anywhere, not just from inside', () => {
    // Opening does not move focus on its own, so a handler bound to the panel
    // never sees the first Escape.
    expect(source).toContain("document.addEventListener('keydown'")
    expect(source).toContain('onDocumentKey')
  })

  test('stops listening for Escape once closed', () => {
    expect(source).toContain("document.removeEventListener('keydown'")
  })

  test('moves focus into the panel and gives it back', () => {
    // A drawer that leaves focus behind cannot be reached by keyboard at all.
    expect(source).toContain('captureFocus')
    expect(source).toContain('releaseFocus')
    expect(source).toContain('document.activeElement')
  })

  test('prefers an explicitly autofocused control', () => {
    expect(source).toContain('[autofocus]')
  })

  test('announces itself as a modal dialog', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
  })

  test('is focusable itself, for a panel with nothing focusable in it', () => {
    expect(source).toContain('tabindex="-1"')
  })

  test('hides the backdrop from screen readers', () => {
    // It is decoration with a click handler; there is nothing in it to read.
    expect(source).toMatch(/aria-hidden="true"/)
  })

  test('still exposes open, close and isOpen to a parent', () => {
    // The control: the API other code drives it with must survive all of the
    // above.
    expect(source).toContain('defineExpose({')
    expect(source).toContain('isOpen,')
  })
})

/**
 * The focus retry, executed rather than read.
 *
 * The string assertions above say `captureFocus` is wired up. They passed
 * while focus never actually moved: the effect runs before `:show` reveals the
 * panel, and `focus()` on a `display: none` element is a silent no-op, so the
 * one attempt was always made a frame too early. Nothing throws and the drawer
 * looks correct - it is simply unreachable by keyboard.
 *
 * So this runs the shipped `focusFirst` against a DOM that refuses focus until
 * the panel is shown, which is the browser's actual behaviour and the one
 * thing a source-text check cannot notice.
 */
function loadFocusFirst(environment: Record<string, any>) {
  const start = source.indexOf('function soon(')
  const end = source.indexOf('function captureFocus(')

  if (start < 0 || end < 0)
    throw new Error('soon/focusFirst are no longer in Drawer.stx under those names')

  const names = Object.keys(environment)
  const make = new Function(...names, `${source.slice(start, end)}; return focusFirst`)

  return make(...names.map(name => environment[name]))
}

/* A panel that only accepts focus once it is shown, like a real one. */
function stubDom(options: { shown: boolean, focusable?: boolean }) {
  const active = { current: 'body' as string }
  const shown = { value: options.shown }

  const target = {
    tagName: 'BUTTON',
    focus() {
      if (shown.value)
        active.current = 'target'
    },
  }

  const panel = {
    tagName: 'DIV',
    querySelector: (selector: string) => (options.focusable === false || selector.includes('autofocus') ? null : target),
    focus() {
      if (shown.value)
        active.current = 'panel'
    },
  }

  return {
    active,
    shown,
    target,
    panel,
    document: {
      querySelector: () => panel,
      get activeElement() {
        return active.current === 'target' ? target : active.current === 'panel' ? panel : 'body'
      },
    },
  }
}

describe('Drawer focus retry', () => {
  test('keeps trying until the panel is actually shown', () => {
    // The bug this covers: a single attempt, made while the panel was still
    // display:none, so focus stayed on the body and the drawer could not be
    // reached by keyboard.
    const dom = stubDom({ shown: false })
    let frames = 0

    const focusFirst = loadFocusFirst({
      isOpen: () => true,
      drawerInstanceId: 'stx-drawer-test',
      document: dom.document,
      requestAnimationFrame: (callback: () => void) => {
        frames++
        // `:show` reveals the panel a few frames after the effect runs.
        if (frames === 3)
          dom.shown.value = true

        callback()
      },
    })

    focusFirst(10)

    expect(dom.document.activeElement).toBe(dom.target)
    expect(frames).toBe(3)
  })

  test('gives up rather than spinning when nothing can take focus', () => {
    const dom = stubDom({ shown: false })
    let frames = 0

    const focusFirst = loadFocusFirst({
      isOpen: () => true,
      drawerInstanceId: 'stx-drawer-test',
      document: dom.document,
      requestAnimationFrame: (callback: () => void) => { frames++; callback() },
    })

    focusFirst(10)

    // Bounded: a drawer whose panel never accepts focus must not retry forever.
    expect(frames).toBe(10)
  })

  test('stops if the drawer closed while it was still trying', () => {
    const dom = stubDom({ shown: false })
    let open = true
    let frames = 0

    const focusFirst = loadFocusFirst({
      isOpen: () => open,
      drawerInstanceId: 'stx-drawer-test',
      document: dom.document,
      requestAnimationFrame: (callback: () => void) => { frames++; open = false; callback() },
    })

    focusFirst(10)

    // Otherwise a drawer opened and shut inside those frames yanks focus back
    // out of whatever the reader moved on to.
    expect(frames).toBe(1)
  })
})

/**
 * Theming.
 *
 * The panel painted itself white and gave an app no say in it, so a drawer in
 * an app with its own palette was the one element on screen belonging to no
 * theme. `className` was not the answer: it lands on the transparent
 * positioned wrapper, not on the scrolling container that carries the colour.
 */
describe('Drawer theming', () => {
  test('lets the app paint the panel', () => {
    expect(source).toContain('panelClass')
    expect(source).toContain('panelStyle')
  })

  test('still paints itself when the app says nothing', () => {
    // An app that passes no palette must not get a transparent panel with the
    // page showing through its own text.
    expect(source).toContain("panelClass || 'bg-white dark:bg-blue-gray-800'")
  })

  test('lets the app tone the backdrop', () => {
    expect(source).toContain('backdropClass')
    expect(source).toContain("$props.backdropClass || 'bg-gray-500/75 dark:bg-gray-900/75'")
  })

  test('takes a width without the app knowing where width lives', () => {
    // The width is on the wrapper, not the panel; an app should not have to
    // learn that to make a cart wider than a notification tray.
    expect(source).toContain('$props.size')
    expect(source).toContain("'max-w-md'")
  })

  test('keeps className landing on the wrapper it always did', () => {
    // Changing where an existing prop applies would silently restyle every
    // drawer already shipped.
    expect(source).toContain('export const panelClasses = `pointer-events-auto relative ${sizeClasses[position]} ${className}`')
  })
})

/**
 * Two drawers on one page.
 *
 * The panel was found with a document-wide query, which returns the first
 * drawer in the document and not the one that just opened. A page with a cart
 * drawer and an item drawer therefore focused the wrong panel - a hidden one -
 * so the retry spent its ten frames failing and focus never moved.
 */
describe('Drawer instance scoping', () => {
  test('each drawer looks up its own panel', () => {
    expect(source).toContain('drawerInstanceId')
    expect(source).toContain('[data-stx-drawer-panel="${drawerInstanceId}"]')
  })

  test('the id it queries for is the id it renders', () => {
    // The two halves are written in different places; a rename in one is
    // invisible until a drawer stops taking focus.
    expect(source).toContain('data-stx-drawer-panel="{{ drawerInstanceId }}"')
  })

  test('the id differs per instance', () => {
    // $uid is the framework's per-instance id: allocated from a per-render
    // sequence, so two drawers on one page get two ids, and the SAME two on
    // every render of that page. It replaced a Math.random() literal, which
    // gave per-instance uniqueness but made the page render different bytes
    // every time and so uncacheable (stacksjs/stx#1945). The uniqueness and
    // stability properties themselves are pinned in the framework, in
    // packages/stx/test/render-determinism.test.ts.
    expect(source).toContain('drawerInstanceId = $uid')
  })

  test('finds nothing rather than the wrong panel', () => {
    // The point of the id: a query scoped to another drawer's id must miss,
    // where the old document-wide one would have returned that drawer.
    const dom = stubDom({ shown: true })
    let asked = ''

    const focusFirst = loadFocusFirst({
      isOpen: () => true,
      drawerInstanceId: 'drawer-two',
      document: {
        querySelector: (selector: string) => {
          asked = selector
          // Only drawer-one exists in this document.
          return selector.includes('drawer-one') ? dom.panel : null
        },
        get activeElement() { return 'body' },
      },
      requestAnimationFrame: (callback: () => void) => callback(),
    })

    focusFirst(10)

    expect(asked).toContain('drawer-two')
    expect(dom.active.current).toBe('body')
  })
})

/**
 * A drawer opened while the page is not painting.
 *
 * `requestAnimationFrame` does not fire at all in a background tab or a parked
 * window, so a retry built only on frames never runs: the drawer opens without
 * focus and still has none when the reader comes back, because the single
 * pending callback fires after everything else has moved on. A timer races the
 * frame so the retry survives a compositor that is asleep.
 */
describe('Drawer focus without frames', () => {
  test('still focuses when requestAnimationFrame never fires', () => {
    const dom = stubDom({ shown: true })
    const timers: Array<() => void> = []

    const focusFirst = loadFocusFirst({
      isOpen: () => true,
      drawerInstanceId: 'stx-drawer-test',
      document: dom.document,
      requestAnimationFrame: () => {},
      setTimeout: (callback: () => void) => { timers.push(callback); return 1 },
    })

    // Hidden on the first pass, revealed before the timer runs the retry.
    dom.shown.value = false
    focusFirst(10)
    dom.shown.value = true
    while (timers.length) timers.shift()!()

    expect(dom.document.activeElement).toBe(dom.target)
  })

  test('the frame and the timer do not both retry', () => {
    // Racing two schedulers must not double the work each round; ten attempts
    // would otherwise become a thousand.
    const dom = stubDom({ shown: false })
    const frames: Array<() => void> = []
    const timers: Array<() => void> = []
    let attempts = 0

    const focusFirst = loadFocusFirst({
      isOpen: () => true,
      drawerInstanceId: 'stx-drawer-test',
      document: {
        querySelector: () => { attempts++; return dom.panel },
        get activeElement() { return 'body' },
      },
      requestAnimationFrame: (callback: () => void) => { frames.push(callback); return 1 },
      setTimeout: (callback: () => void) => { timers.push(callback); return 1 },
    })

    focusFirst(2)

    // Run both schedulers, frame first, then the timer that raced it.
    while (frames.length || timers.length) {
      while (frames.length) frames.shift()!()
      while (timers.length) timers.shift()!()
    }

    // Three attempts total: the initial call plus two retries.
    expect(attempts).toBe(3)
  })
})
