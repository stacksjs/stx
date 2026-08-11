/**
 * A `role="presentation"` table is layout, and layout tables have no headers.
 *
 * `role="presentation"` and its ARIA synonym `role="none"` strip an element's
 * implicit semantics from the accessibility tree. On a table that is precisely
 * the declaration that it carries layout rather than data — so reporting
 * "Table missing header cells (th)" against one asks the author to reintroduce
 * the semantics the role exists to remove (stacksjs/stx#1916).
 *
 * Not a corner case: every HTML email is nested layout tables, because mail
 * clients strip `<style>` and have no reliable box model, and `role="presentation"`
 * is the standard pattern there. One email template accounted for every
 * remaining finding in an otherwise-clean app, and not one was fixable — the
 * correct markup was what triggered them.
 *
 * That is the cost being avoided. `stx a11y` is advisory for most of its life,
 * and an advisory checker carrying a permanent finding nobody can close is one
 * people learn to ignore — the same failure as a gate that invents errors.
 *
 * Pinned in BOTH directions, as the report asked: the role suppresses the
 * finding, and an otherwise-identical table without it still produces one.
 * And against BOTH implementations — `checkA11y` runs the regex path when no DOM
 * is present and the DOM path when one is, and two implementations of one rule
 * go wrong by disagreeing.
 */

import { describe, expect, it } from 'bun:test'
import { checkA11y, checkA11yWithRegex, isPresentationalRole } from '../../src/a11y'

const PRESENTATION = `<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
  <tr><td>Layout cell</td></tr>
</table>`

const NONE = `<table role="none"><tr><td>Layout cell</td></tr></table>`

const DATA = `<table cellpadding="0" cellspacing="0" style="width: 100%;">
  <tr><td>Data cell</td></tr>
</table>`

const tableFindings = (violations: Array<{ type: string }>): string[] =>
  violations.filter(v => v.type.startsWith('table-')).map(v => v.type)

describe('the regex checker', () => {
  it('says nothing about a role="presentation" table', () => {
    expect(tableFindings(checkA11yWithRegex(PRESENTATION, 'mail.stx'))).toEqual([])
  })

  it('treats role="none" the same, since ARIA says they are synonyms', () => {
    expect(tableFindings(checkA11yWithRegex(NONE, 'mail.stx'))).toEqual([])
  })

  it('still reports the identical table without the role', () => {
    // The other direction. A data table with no headers is a real problem and
    // the rule is right to exist — it just has to take the author's word for
    // which kind of table this is.
    expect(checkA11yWithRegex(DATA, 'report.stx').map(v => v.type)).toContain('table-missing-headers')
  })
})

describe('the DOM checker', () => {
  it('agrees about a presentational table', async () => {
    expect(tableFindings(await checkA11y(PRESENTATION, 'mail.stx'))).toEqual([])
  })

  it('agrees about role="none"', async () => {
    expect(tableFindings(await checkA11y(NONE, 'mail.stx'))).toEqual([])
  })

  it('agrees that a data table without headers is still a finding', async () => {
    expect((await checkA11y(DATA, 'report.stx')).map(v => v.type)).toContain('table-missing-headers')
  })

  it('does not ask a layout table for a caption either', async () => {
    // The caption rule sits beside the header rule and had the same blind spot.
    // A table with no semantics needs no caption to describe them.
    expect(tableFindings(await checkA11y(PRESENTATION, 'mail.stx'))).not.toContain('table-missing-caption')
  })
})

describe('isPresentationalRole', () => {
  it('accepts both spellings and rejects everything else', () => {
    expect(isPresentationalRole('presentation')).toBe(true)
    expect(isPresentationalRole('none')).toBe(true)
    expect(isPresentationalRole('PRESENTATION')).toBe(true)
    expect(isPresentationalRole('table')).toBe(false)
    expect(isPresentationalRole('grid')).toBe(false)
    expect(isPresentationalRole('')).toBe(false)
    expect(isPresentationalRole(null)).toBe(false)
  })

  it('reads the first token of a fallback list, which is the one that applies', () => {
    // `role` takes a space-separated list and the first recognised token wins.
    expect(isPresentationalRole('presentation table')).toBe(true)
    expect(isPresentationalRole('table presentation')).toBe(false)
  })
})
