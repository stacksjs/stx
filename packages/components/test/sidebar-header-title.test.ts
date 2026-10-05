/**
 * Where an Arc sidebar's title sits.
 *
 * Arc and Dia name the current space on the same line as the window controls:
 * traffic lights, then the name. The header put the title on a row of its own
 * below them, which read as a heading over the list rather than as a label on
 * the window -- and spent a line of panel height saying so.
 *
 * Rendered rather than reimplemented. This file used to carry its own copy of
 * the `titleInChrome` predicate and assert against that, which is a test of
 * the copy: the component later gained a `reserveWindowControls` term -- the
 * `native` case below -- and every assertion here went on passing while
 * describing a header that no longer existed.
 */
import { describe, expect, it } from 'bun:test'
import { DRAG_ROW, elementsWithText, parse, renderSidebar } from './utils/render-sidebar'

/** Where the rendered header put `Personal`: the chrome row, or a row of its own. */
async function titleRow(attrs: string): Promise<'chrome' | 'own-row' | 'absent'> {
  const doc = parse(await renderSidebar(`<body><SidebarHeader title="Personal" ${attrs} /></body>`))
  const [title] = elementsWithText(doc, 'Personal')
  if (!title) return 'absent'
  return title.closest(DRAG_ROW) ? 'chrome' : 'own-row'
}

describe('an arc header names the window on the control row', () => {
  it('puts the title beside replicas it draws itself', async () => {
    expect(await titleRow('theme="arc" windowControls="draw"')).toBe('chrome')
  })

  it('puts the title beside the controls the platform drew', async () => {
    // The term the reimplemented predicate was missing. Under `native` the
    // header draws no lights of its own -- it reserves the room the real ones
    // occupy -- and the title still belongs on that row, beside them.
    expect(await titleRow('theme="arc" windowControls="native"')).toBe('chrome')
  })

  it('keeps the second row when there is a logo to sit in it', async () => {
    // A 20px logo does not fit the chrome row next to 13px traffic lights, so
    // its presence keeps the two-row shape rather than cramping both.
    expect(await titleRow('theme="arc" windowControls="draw" logo="/logo.png"')).toBe('own-row')
  })

  it('keeps the second row when there are no controls to sit beside', async () => {
    // An app that only borrows the look has a bare strip and no lights, so
    // there is no chrome row for the title to join.
    expect(await titleRow('theme="arc" windowControls="none"')).toBe('own-row')
  })

  it('still honours the deprecated boolean', async () => {
    expect(await titleRow('theme="arc" showWindowControls="true"')).toBe('chrome')
    expect(await titleRow('theme="arc" showWindowControls="false"')).toBe('own-row')
  })

  it('renders the title exactly once, whichever row it lands on', async () => {
    // Both branches reference `title`; without the negated guard on the second
    // row a titled header would print its name twice.
    for (const attrs of ['windowControls="draw"', 'windowControls="native"', 'windowControls="none"', 'windowControls="draw" logo="/logo.png"']) {
      const doc = parse(await renderSidebar(`<body><SidebarHeader theme="arc" title="Personal" ${attrs} /></body>`))
      expect(elementsWithText(doc, 'Personal'), attrs).toHaveLength(1)
    }
  })

  it('keeps the header actions reachable once the title moves up', async () => {
    // The actions used to live only on the second row, which a title in the
    // chrome row stops rendering -- moving the title without them would have
    // stranded every header action behind a row that is no longer there.
    const doc = parse(await renderSidebar(
      `<body><SidebarHeader theme="arc" title="Personal" windowControls="draw" :actions="[{ id: 'new', icon: 'i-f7-plus', label: 'New tab' }]" /></body>`,
    ))
    const action = doc.querySelector('[data-sidebar-action="new"]')

    expect(action).not.toBeNull()
    expect(action!.closest(DRAG_ROW)).not.toBeNull()
  })
})

describe('the macOS header keeps its corner for the controls', () => {
  /*
   * `title` is documented as legacy, non-macos content, and the macOS strip
   * renders the lights OR the brand, never both -- a real source list has no
   * name in it, because the window's own titlebar carries that. Pinned because
   * the consequence is easy to walk into: on the default theme, with the
   * default controls, a `title` renders nothing at all.
   */
  it('drops a title that would sit where the controls go', async () => {
    expect(await titleRow('theme="macos"')).toBe('absent')
  })

  it('shows the brand once the controls are gone', async () => {
    expect(await titleRow('theme="macos" windowControls="none"')).toBe('chrome')
  })

  it('renders the logo in the same strip', async () => {
    const doc = parse(await renderSidebar(
      `<body><SidebarHeader theme="macos" windowControls="none" title="Personal" logo="/logo.svg" /></body>`,
    ))

    expect(doc.querySelector('img[src="/logo.svg"]')).not.toBeNull()
  })
})
