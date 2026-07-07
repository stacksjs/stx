/**
 * Regression test for SVG attribute casing in generic :attr bindings.
 *
 * Context: SVG attributes are case-sensitive, but the HTML parser
 * lowercases prefixed attribute names — `:viewBox="expr"` reaches the
 * runtime as `:viewbox` because the spec's "adjust SVG attributes" step
 * only applies to unprefixed names. The runtime then derived
 * attrName = 'viewbox' and called setAttribute('viewbox', …), which on an
 * SVG element creates a dead duplicate attribute while the real `viewBox`
 * never updates (observed as pan/zoom silently not working on bound
 * `<svg :viewBox>` in oddsbeacon's /markets page).
 *
 * Fix: the runtime carries the HTML-spec SVG case-adjustment table and
 * restores canonical casing before setAttribute when the element is in
 * the SVG namespace.
 */

import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals runtime — SVG attribute case adjustment', () => {
  const runtime = generateSignalsRuntimeDev()

  it('ships the SVG case-adjustment table', () => {
    expect(runtime).toContain('var SVG_ATTR_CASE')
    // Spot-check entries across the table, including the motivating one.
    expect(runtime).toContain("viewbox:'viewBox'")
    expect(runtime).toContain("preserveaspectratio:'preserveAspectRatio'")
    expect(runtime).toContain("gradienttransform:'gradientTransform'")
    expect(runtime).toContain("patternunits:'patternUnits'")
    expect(runtime).toContain("stddeviation:'stdDeviation'")
  })

  it('restores casing only for elements in the SVG namespace', () => {
    expect(runtime).toContain("var SVG_NS = 'http://www.w3.org/2000/svg'")
    expect(runtime).toContain('el.namespaceURI === SVG_NS && SVG_ATTR_CASE[attrName]')
  })

  it('adjusts attrName before the binding effect runs setAttribute', () => {
    const bindIdx = runtime.indexOf('el.namespaceURI === SVG_NS && SVG_ATTR_CASE[attrName]')
    expect(bindIdx).toBeGreaterThan(-1)
    // The adjustment happens between attrName derivation and the effect(...)
    // that applies setAttribute(attrName, v).
    const after = runtime.slice(bindIdx, bindIdx + 600)
    expect(after).toContain('effect(')
    expect(after).toContain('el.setAttribute(attrName, v)')
  })

  it('the adjustment table maps every lowercased key to a camelCase value', () => {
    const tableMatch = runtime.match(/var SVG_ATTR_CASE = \{([^}]*)\}/)
    expect(tableMatch).not.toBeNull()
    const entries = tableMatch![1].split(',').map(e => e.trim()).filter(Boolean)
    expect(entries.length).toBeGreaterThanOrEqual(50)
    for (const entry of entries) {
      const [key, value] = entry.split(':').map(s => s.trim().replace(/'/g, ''))
      expect(key).toBe(key.toLowerCase())
      expect(value.toLowerCase()).toBe(key)
      expect(value).not.toBe(key) // every entry exists to restore lost casing
    }
  })
})
