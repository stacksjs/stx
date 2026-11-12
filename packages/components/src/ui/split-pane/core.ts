/**
 * The arithmetic of a split layout. No DOM.
 *
 * A layout is a list of fractions, one per pane, that add up to one. Fractions
 * rather than pixels, so a window that changes size keeps its proportions and
 * a saved layout means the same thing on another screen. Pixels come in only
 * where a person does: a drag is so many pixels, and a pane must not get
 * narrower than so many.
 */

export type SplitDirection = 'horizontal' | 'vertical'

/** The pixel limits of one pane. `max` is `Infinity` when there is none. */
export interface PaneLimit {
  min: number
  max: number
}

// Written out: the formatter splits a negative exponent (1e-9) into a subtraction.
const EPSILON = 0.000000001

/** Equal shares for `count` panes. */
export function equalSizes(count: number): number[] {
  return Array.from({ length: count }, () => 1 / count)
}

/**
 * Fractions that add up to one, from any list of positive numbers.
 *
 * `[30, 70]`, `[0.3, 0.7]` and `[3, 7]` are the same layout. A list of the
 * wrong length, or one holding anything that is not a positive finite number,
 * is not a layout, and the panes are shared equally instead.
 */
export function normalizeSizes(sizes: readonly number[] | null | undefined, count: number): number[] {
  if (count <= 0)
    return []
  if (!sizes || sizes.length !== count || sizes.some(size => typeof size !== 'number' || !Number.isFinite(size) || size <= 0))
    return equalSizes(count)

  const total = sizes.reduce((sum, size) => sum + size, 0)
  return sizes.map(size => size / total)
}

/**
 * Read sizes as they arrive from an attribute, a prop or storage: an array, a
 * JSON array, or `30,70`. Null when there is nothing usable.
 */
export function parseSizes(value: unknown): number[] | null {
  let list: unknown = value
  if (typeof value === 'string') {
    const text = value.trim()
    if (text === '')
      return null
    if (text.charAt(0) === '[') {
      try {
        list = JSON.parse(text)
      }
      catch {
        return null
      }
    }
    else {
      list = text.split(/[\s,]+/).map(part => Number.parseFloat(part))
    }
  }

  if (!Array.isArray(list) || list.length === 0)
    return null
  const numbers = list.map(entry => (typeof entry === 'string' ? Number.parseFloat(entry) : entry))
  return numbers.every(entry => typeof entry === 'number' && Number.isFinite(entry) && entry > 0) ? numbers as number[] : null
}

/** A pixel length from `120`, `'120'` or `'120px'`. The fallback for anything else. */
export function parseLength(value: unknown, fallback: number): number {
  if (typeof value === 'number')
    return Number.isFinite(value) && value >= 0 ? value : fallback
  if (typeof value !== 'string' || value.trim() === '')
    return fallback
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * Bring a layout inside its limits for a container `total` pixels long.
 *
 * A pane under its minimum is raised to it and the difference is taken from
 * the panes that have room, in proportion to the room they have. When the
 * minimums do not fit at all the container is simply too small, and the panes
 * share it in proportion to their minimums, which is the least wrong answer.
 */
export function fitSizes(sizes: readonly number[], total: number, limits: readonly PaneLimit[]): number[] {
  const count = sizes.length
  if (count === 0 || total <= 0)
    return [...sizes]

  const minimums = limits.map(limit => Math.max(0, limit.min))
  const minimumTotal = minimums.reduce((sum, min) => sum + min, 0)
  if (minimumTotal >= total)
    return minimumTotal === 0 ? [...sizes] : minimums.map(min => min / minimumTotal)

  const pixels = sizes.map(size => size * total)

  // Raise what is too small, lower what is too large, then hand the difference
  // to the panes that can take it. Each pass pins at least one pane, so the
  // number of panes bounds the number of passes.
  for (let pass = 0; pass <= count; pass++) {
    let surplus = 0
    for (let index = 0; index < count; index++) {
      const clamped = Math.min(Math.max(pixels[index], minimums[index]), limits[index].max)
      surplus += pixels[index] - clamped
      pixels[index] = clamped
    }
    if (Math.abs(surplus) < EPSILON)
      break

    const room = pixels.map((size, index) => (surplus > 0 ? limits[index].max - size : size - minimums[index]))
    const roomTotal = room.reduce((sum, value) => sum + (Number.isFinite(value) ? value : total), 0)
    if (roomTotal < EPSILON)
      break
    for (let index = 0; index < count; index++) {
      const share = (Number.isFinite(room[index]) ? room[index] : total) / roomTotal
      pixels[index] += surplus * share
    }
  }

  const sum = pixels.reduce((a, b) => a + b, 0)
  return pixels.map(size => size / sum)
}

/**
 * Move the divider after pane `index` by `delta` pixels.
 *
 * A positive delta grows the pane before the divider. The pane next to the
 * divider on the other side shrinks first; once it is at its minimum the one
 * beyond it gives, and so on, which is what dragging a divider through a
 * narrow pane should do. The pane that grows stops at its maximum.
 */
export function resizeAt(sizes: readonly number[], index: number, delta: number, total: number, limits: readonly PaneLimit[]): number[] {
  const count = sizes.length
  if (index < 0 || index >= count - 1 || total <= 0 || delta === 0)
    return [...sizes]

  const pixels = sizes.map(size => size * total)
  const forward = delta > 0
  const grower = forward ? index : index + 1
  const step = forward ? 1 : -1

  let wanted = Math.min(Math.abs(delta), limits[grower].max - pixels[grower])
  if (wanted <= 0)
    return [...sizes]

  let taken = 0
  for (let pane = forward ? index + 1 : index; pane >= 0 && pane < count && wanted > EPSILON; pane += step) {
    const give = Math.min(wanted, Math.max(0, pixels[pane] - Math.max(0, limits[pane].min)))
    pixels[pane] -= give
    taken += give
    wanted -= give
  }
  pixels[grower] += taken

  return pixels.map(size => size / total)
}

/** How far the divider after pane `index` can move each way, in pixels. */
export function dividerRange(sizes: readonly number[], index: number, total: number, limits: readonly PaneLimit[]): { back: number, forward: number } {
  const pixels = sizes.map(size => size * total)
  const room = (from: number, to: number): number => {
    let sum = 0
    for (let pane = from; pane <= to; pane++)
      sum += Math.max(0, pixels[pane] - Math.max(0, limits[pane].min))
    return sum
  }

  return {
    back: Math.min(room(0, index), limits[index + 1].max - pixels[index + 1]),
    forward: Math.min(room(index + 1, sizes.length - 1), limits[index].max - pixels[index]),
  }
}

/** What a separator reports to assistive technology: the pane before it, in percent. */
export function separatorValue(sizes: readonly number[], index: number, total: number, limits: readonly PaneLimit[]): { now: number, min: number, max: number } {
  const range = dividerRange(sizes, index, total, limits)
  const now = sizes[index] * 100
  const span = total > 0 ? 100 / total : 0
  return {
    now: Math.round(now),
    min: Math.round(now - range.back * span),
    max: Math.round(now + range.forward * span),
  }
}

/** The storage name a layout is kept under. */
export function storageName(key: string): string {
  return `stx:split-pane:${key}`
}

/** Sizes as they are stored: rounded, so the text is short and stable. */
export function serializeSizes(sizes: readonly number[]): string {
  return JSON.stringify(sizes.map(size => Math.round(size * 1e4) / 1e4))
}
