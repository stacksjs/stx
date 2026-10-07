/**
 * What a screen reader is told by a Badge and by a Tooltip.
 *
 * Both were wrong in opposite directions: the Badge announced everything, and
 * the Tooltip announced nothing.
 *
 * ## Badge
 *
 * Every badge carried `role="status"`, which is an ARIA live region: a screen
 * reader watches it and reads out any change to its contents. A badge is
 * usually a styled label -- a tag, a count, a status pill in a table cell --
 * and a page of them becomes a page of live regions. One estate has 126 badges
 * on a single view, so one re-render could queue 126 announcements, and the
 * interruption is the point of a live region: it speaks over whatever the user
 * is reading. It is now opt-in.
 *
 * ## Tooltip
 *
 * `role="tooltip"` names what an element IS; it does not attach it to
 * anything. With no `aria-describedby` on the trigger, a screen reader never
 * reached the element and the role announced nothing -- which made the
 * component a DOWNGRADE from the native `title=` it replaces, since that at
 * least is announced.
 */
import { describe, expect, it } from 'bun:test'
import { markup, render } from './utils/render-component'
import { parse } from './utils/render-component'

describe('Badge announces only when asked to', () => {
  it('is not a live region by default', async () => {
    const html = markup(await render('<Badge>New</Badge>'))
    expect(html).not.toContain('role="status"')
    expect(html).not.toContain('aria-live')
  })

  it('is a polite live region on request', async () => {
    const html = markup(await render('<Badge live>7</Badge>'))
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
  })

  it('can interrupt when the caller says so', async () => {
    const html = markup(await render('<Badge live="assertive">7</Badge>'))
    expect(html).toContain('aria-live="assertive"')
  })

  it('reads live="false" as off', async () => {
    // The $bool rule: a prop written as an attribute arrives as a string, and
    // "false" is truthy. Turning a badge INTO a live region when asked for the
    // opposite is the exact failure #2006 was about.
    const html = markup(await render('<Badge live="false">7</Badge>'))
    expect(html).not.toContain('aria-live')
  })

  it('still renders its content and variant', async () => {
    const html = markup(await render('<Badge variant="danger">3</Badge>'))
    expect(html).toContain('3')
    expect(html).toContain('bg-danger-soft')
  })
})

describe('Tooltip is reachable from what it describes', () => {
  it('points the trigger at the tooltip, and the id resolves', async () => {
    const document = parse(await render('<Tooltip content="Deletes everything">hover</Tooltip>'))

    const trigger = document.querySelector('[aria-describedby]')
    expect(trigger).not.toBeNull()

    const id = trigger!.getAttribute('aria-describedby')!
    const panel = document.getElementById(id)
    expect(panel).not.toBeNull()
    expect(panel!.getAttribute('role')).toBe('tooltip')
    expect(panel!.textContent).toContain('Deletes everything')
  })

  it('gives two tooltips on one page different ids', async () => {
    // A shared id would point every trigger at the first tooltip.
    const document = parse(await render(`
      <Tooltip content="First">a</Tooltip>
      <Tooltip content="Second">b</Tooltip>
    `))
    const ids = [...document.querySelectorAll('[aria-describedby]')]
      .map(el => el.getAttribute('aria-describedby'))

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('wraps a sentence instead of running off the viewport', async () => {
    // whitespace-nowrap grew a long tooltip past the screen edge rather than
    // wrapping it, so the end of it was unreachable on a phone.
    const html = markup(await render('<Tooltip content="Deletes the project and everything in it">x</Tooltip>'))
    expect(html).toContain('max-w-xs')
    expect(html).not.toContain('whitespace-nowrap')
  })

  it('keeps one line when the caller knows the text is short', async () => {
    const html = markup(await render('<Tooltip content="Save" nowrap>x</Tooltip>'))
    expect(html).toContain('whitespace-nowrap')
    expect(html).not.toContain('max-w-xs')
  })

  it('still shows on focus, not only on hover', async () => {
    const html = markup(await render('<Tooltip content="Help">x</Tooltip>'))
    expect(html).toContain('@focusin')
    expect(html).toContain('@focusout')
  })
})

/**
 * WCAG 2.1 SC 1.4.13, the other half of stacksjs/stx#2045.
 *
 * Content shown on hover or focus has to be dismissable without moving the
 * pointer or the focus, and has to stay visible while the pointer is over it.
 * The tooltip failed both: there was no Escape handling at all, and
 * `pointer-events-none` locked the pointer out, so moving toward the tooltip
 * to read it dismissed it -- worst for exactly the long tooltips that are
 * hardest to read quickly.
 */
describe('Tooltip can be dismissed and can be hovered', () => {
  it('lets the pointer into the tooltip', async () => {
    const html = markup(await render('<Tooltip content="Long explanation here">x</Tooltip>'))
    expect(html).not.toContain('pointer-events-none')
  })

  it('keeps itself open while the pointer is over it', async () => {
    // Without these the pointer entering the panel counts as leaving the
    // trigger, so the tooltip closes as you reach for it.
    const document = parse(await render('<Tooltip content="Long explanation">x</Tooltip>'))
    const panel = document.querySelector('[role="tooltip"]')!
    expect(panel.getAttribute('@mouseenter')).toBe('showTooltip()')
    expect(panel.getAttribute('@mouseleave')).toBe('hideTooltip()')
  })

  it('listens for Escape globally, not just on the trigger', async () => {
    // The tooltip can be open from a HOVER while focus is elsewhere entirely,
    // and 1.4.13 says dismissal must not require moving pointer or focus --
    // so a handler bound to the trigger would not satisfy it.
    const html = await render('<Tooltip content="Help">x</Tooltip>')
    expect(html).toContain('useEventListener')
    expect(html).toContain('Escape')
  })

  it('only dismisses the tooltip that is showing', async () => {
    const html = await render('<Tooltip content="Help">x</Tooltip>')
    expect(html).toContain('isVisible()')
  })
})
