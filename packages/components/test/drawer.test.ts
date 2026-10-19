/**
 * The Drawer's modal behaviour.
 *
 * A drawer is a dialog, and the parts that make it one are the parts that are
 * easy to leave out: holding the page still behind it, moving focus into it,
 * letting Escape close it from anywhere, trapping Tab, and saying what it is to
 * a screen reader.
 *
 * The behaviour itself lives in the runtime's overlay stack, shared with
 * Dialog, stxConfirm and an app's own overlays, and is executed in
 * packages/stx/test/signals/overlay-stack.test.ts (one Escape for the topmost,
 * the lock held to the last close, the Tab trap, focus in and back, the focus
 * retry with and without animation frames). What is asserted here is that the
 * drawer joins that stack and leaves it on every way out, which a refactor
 * could quietly drop.
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(__dirname, '../src/ui/drawer/Drawer.stx'), 'utf8')

describe('Drawer', () => {
  test('goes on the shared overlay stack when it opens, with its own panel', () => {
    expect(source).toContain('window.stx.overlays.open(drawerInstanceId, {')
    expect(source).toContain('panel: panelEl,')
  })

  test('comes off it when it closes, and when it is destroyed open', () => {
    // Removed mid-open, there is no drawer left to undo the lock.
    expect(source.match(/window\.stx\.overlays\.close\(drawerInstanceId\)/g)?.length).toBe(2)
    expect(source).toContain('onDestroy(')
  })

  test('keeps no lock, listener or focus handling of its own', () => {
    // Its own copies are what let one Escape close a drawer and the dialog over
    // it together, and the first of two to close unlock the page.
    expect(source).not.toContain("document.addEventListener('keydown'")
    expect(source).not.toContain("document.body.style.overflow = 'hidden'")
    expect(source).not.toContain('@keydown=')
  })

  test('closes on Escape and on the backdrop unless told not to', () => {
    expect(source).toContain('closeOnEscape = $bool($props.closeOnEscape, true)')
    expect(source).toContain('onEscape: closeOnEscape ? close : null')
    expect(source).toContain('closeOnBackdrop = $bool($props.closeOnBackdrop, true)')
    expect(source).toMatch(/if \(closeOnBackdrop && window\.stx\.overlays\.isTop\(drawerInstanceId\)\) close\(\)/)
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
    expect(source).toContain('defineExpose({')
    expect(source).toContain('isOpen,')
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
    /*
     * The role, not the shades it used to name. The intent is unchanged - a
     * drawer with no panelClass still paints itself rather than showing the
     * page through its own text - and `bg-panel` is `var(--stx-panel, #fff)`
     * with a gray-800 dark value, so it is the same colour and now the app's
     * to move (stacksjs/stx#1993).
     */
    expect(source).toContain("panelClass || 'bg-panel'")
  })

  test('lets the app tone the backdrop', () => {
    expect(source).toContain('backdropClass')
    expect(source).toContain("$props.backdropClass || 'bg-neutral-500/75 dark:bg-neutral-900/75'")
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
    //
    // Matched by shape rather than verbatim: this used to pin the whole line
    // including `${sizeClasses[position]}`, so guarding that lookup against an
    // unknown position (#2001) failed a test about where className lands.
    const panelClasses = source.match(/export const panelClasses = `([^`]*)`/)

    expect(panelClasses?.[1]).toContain('pointer-events-auto relative')
    expect(panelClasses?.[1]).toContain('${className}')
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
  test('each drawer resolves its own panel ref without a document selector', () => {
    expect(source).toContain('drawerInstanceId')
    expect(source).toContain("const panelRef = useRef('panelRef')")
    expect(source).toContain('return panelRef.value')
    expect(source).toContain('x-ref="panelRef"')
    expect(source).not.toContain('document.querySelector')
  })

  test('the id it queries for is the id it renders', () => {
    // The two halves are written in different places; a rename in one is
    // invisible until a drawer stops taking focus.
    expect(source).toContain('data-stx-drawer-panel="{{ drawerInstanceId }}"')
  })

  test('the id differs per instance', () => {
    // $uid is the framework's per-instance id (stacksjs/stx#1945); it is also
    // the drawer's id on the overlay stack, so two drawers are two entries.
    expect(source).toContain('drawerInstanceId = $uid')
  })
})
