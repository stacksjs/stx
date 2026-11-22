/**
 * Display P3 colours, for a host that draws them (stacksjs/ts-css#38).
 *
 * Tailwind v4's palette is defined in oklch, and 82 of its 242 colours lie
 * outside sRGB: the browser on a P3 display draws them wider than any hex can
 * say. Craft draws `color(display-p3 r g b [/ a])` on hosts that report the
 * `displayP3Colors` capability, and draws anything it does not know as
 * near-black (older iOS) or not at all (Android).
 *
 * So a screen always ships sRGB hex, which every host draws, and its leaf
 * records the P3 value of each colour the hex clamps (`LeafEntry.p3`). Only on
 * the way out to a host that reports P3 are those swapped in. A path that
 * misses the swap shows the sRGB colour, never a broken one.
 */
import type { LeafEntry } from '../compiler/headwind-to-style'
import { COLOR_KEYS } from '../compiler/headwind-to-style'

const KEYS: ReadonlySet<string> = new Set(COLOR_KEYS)

/** The device's own tables, which Craft does not read: sent as they are. */
const PASSED: ReadonlySet<string> = new Set(['_classTable', '_classLeaf'])

/**
 * The hex-to-P3 swaps a screen's leaf recorded, or undefined when there are none.
 *
 * Two colours can clamp to the same hex. Swapping that hex would turn one into
 * the other, so it is left sRGB: the drawing is then exactly what every other
 * host shows.
 */
export function wideColorMap(leaf: Record<string, LeafEntry> | undefined): Map<string, string> | undefined {
  if (!leaf) return undefined
  const map = new Map<string, string>()
  const ambiguous = new Set<string>()
  for (const entry of Object.values(leaf)) {
    for (const [hex, p3] of Object.entries(entry.p3 ?? {})) {
      const key = hex.toLowerCase()
      if (ambiguous.has(key)) continue
      const seen = map.get(key)
      if (seen === undefined) {
        map.set(key, p3)
      }
      else if (seen !== p3) {
        map.delete(key)
        ambiguous.add(key)
      }
    }
  }
  return map.size > 0 ? map : undefined
}

/**
 * `payload` with every colour property the map knows swapped for its P3 value.
 * Copy on write: what holds no swapped colour is the same object, and nothing
 * the caller holds is changed.
 */
export function withWideColors<T>(payload: T, map: ReadonlyMap<string, string>): T {
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      let copy: unknown[] | undefined
      node.forEach((child, index) => {
        const next = visit(child)
        if (next !== child) (copy ??= [...node])[index] = next
      })
      return copy ?? node
    }
    if (node === null || typeof node !== 'object') return node
    let copy: Record<string, unknown> | undefined
    for (const [key, child] of Object.entries(node)) {
      if (PASSED.has(key)) continue
      const next = KEYS.has(key) && typeof child === 'string' ? map.get(child.trim().toLowerCase()) ?? child : visit(child)
      if (next !== child) (copy ??= { ...(node as Record<string, unknown>) })[key] = next
    }
    return copy ?? node
  }
  return visit(payload) as T
}
