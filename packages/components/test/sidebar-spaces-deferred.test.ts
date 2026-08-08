/**
 * Deferred spaces (stacksjs/stx — Arc sidebar render cost).
 *
 * `<Sidebar>` server-renders every space's rows even though the Arc design
 * shows one at a time, so the cost is linear in the number of spaces. Measured
 * on a real host: 51ms for one space and 175ms for fourteen, about 9.5ms and
 * 12KB per additional space, with the rows themselves nearly free — it is the
 * per-panel chrome. A control surface with fourteen projects pays for fourteen
 * panels on every page load to show one.
 *
 * A deferred space keeps its panel and its title and drops the rest.
 */
import { describe, expect, it } from 'bun:test'
import { normalizeSpace, normalizeSpaces } from '../src/ui/sidebar/spaces'

describe('deferred spaces', () => {
  it('defaults to rendering everything', () => {
    // The flag has to be opt-in: every existing caller expects full panels.
    expect(normalizeSpace({ id: 'a' }).deferred).toBe(false)
  })

  it('carries the flag through normalisation', () => {
    // normalizeSpace rebuilds the object field by field, so anything it does
    // not name is silently dropped before the component ever sees it.
    expect(normalizeSpace({ id: 'a', deferred: true }).deferred).toBe(true)
  })

  it('only treats an explicit true as deferred', () => {
    // A host mapping its own data can easily produce undefined or null here,
    // and blanking a space's rows because of a falsy value would be a bad way
    // to find that out.
    for (const value of [undefined, null, 0, '', 'false']) {
      expect(normalizeSpace({ id: 'a', deferred: value as never }).deferred).toBe(false)
    }
  })

  it('is per space, not per sidebar', () => {
    // The whole point: the active space renders in full while its neighbours
    // do not.
    const spaces = normalizeSpaces([
      { id: 'active', sections: [{ id: 's', items: [{ id: 'i', label: 'row' }] }] },
      { id: 'far', deferred: true, sections: [{ id: 's', items: [{ id: 'i', label: 'row' }] }] },
    ])

    expect(spaces.map(s => s.deferred)).toEqual([false, true])
  })

  it('keeps a deferred space addressable', () => {
    // It still has to appear in the switcher and hold its slot in the track,
    // so identity and palette must survive deferral.
    const space = normalizeSpace({ id: 'far', label: 'Far', icon: 'i-x', tint: 'blue', deferred: true })

    expect(space.id).toBe('far')
    expect(space.label).toBe('Far')
    expect(space.icon).toBe('i-x')
    expect(space.style).toContain('--stx-space')
  })

  it('still carries the rows it was given', () => {
    // Deferral is a rendering decision, not a data one. The controller and any
    // host filling the panel later still need to know what belongs in it.
    const space = normalizeSpace({
      id: 'far',
      deferred: true,
      sections: [{ id: 's', items: [{ id: 'i', label: 'row' }] }],
    })

    expect(space.sections).toHaveLength(1)
  })
})
