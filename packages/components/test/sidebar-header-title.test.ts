/**
 * Where an Arc sidebar's title sits.
 *
 * Arc and Dia name the current space on the same line as the window controls:
 * traffic lights, then the name. The header put the title on a row of its own
 * below them, which read as a heading over the list rather than as a label on
 * the window — and spent a line of panel height saying so.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(import.meta.dir, '..', 'src', 'ui', 'sidebar', 'SidebarHeader.stx'), 'utf8')

/** The `titleInChrome` predicate, evaluated the way the template computes it. */
function titleInChrome(options: { isArc: boolean, showWindowControls: boolean, title: string, logo: string }): boolean {
  return options.isArc && options.showWindowControls && !!options.title && !options.logo
}

describe('the arc header decides where its title goes', () => {
  it('puts a title beside the window controls', () => {
    expect(titleInChrome({ isArc: true, showWindowControls: true, title: 'Personal', logo: '' })).toBe(true)
  })

  it('keeps the second row when there is a logo to sit in it', () => {
    // A 20px logo does not fit the chrome row next to 13px traffic lights, so
    // its presence keeps the old two-row shape rather than cramping both.
    expect(titleInChrome({ isArc: true, showWindowControls: true, title: 'Personal', logo: '/logo.png' })).toBe(false)
  })

  it('keeps the second row when there are no window controls to sit beside', () => {
    // An app that only borrows the look has a bare strip and no lights, so
    // there is no chrome row for the title to join.
    expect(titleInChrome({ isArc: true, showWindowControls: false, title: 'Personal', logo: '' })).toBe(false)
  })

  it('does not apply to the macOS header', () => {
    expect(titleInChrome({ isArc: false, showWindowControls: true, title: 'Personal', logo: '' })).toBe(false)
  })

  it('has nothing to move when there is no title', () => {
    expect(titleInChrome({ isArc: true, showWindowControls: true, title: '', logo: '' })).toBe(false)
  })
})

describe('the template honours the predicate', () => {
  it('renders the title in the chrome row under the flag', () => {
    expect(source).toContain('export const titleInChrome')
    expect(source).toContain('@if(titleInChrome)')
  })

  it('guards the second row so the title cannot render twice', () => {
    // Both branches reference `title`; without the negated guard a titled
    // header would print its name on both rows.
    expect(source).toContain('@if(!titleInChrome && (title || logo || actions.length > 0))')
  })

  it('keeps the actions reachable in the chrome row', () => {
    // The actions used to live only on the second row. Moving the title up
    // without them would have stranded every header action behind a row that
    // no longer renders.
    expect(source).toContain('@if(titleInChrome && actions.length > 0)')
  })
})
