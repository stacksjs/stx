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
  const start = source.indexOf('function focusFirst(')
  const end = source.indexOf('function captureFocus(')

  if (start < 0 || end < 0)
    throw new Error('focusFirst is no longer in Drawer.stx under that name')

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
