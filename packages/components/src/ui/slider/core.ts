/**
 * The arithmetic of a slider: where a value sits on the track, which values
 * a step allows, and where the tick marks go. No DOM.
 */

export interface SliderRange {
  min: number
  max: number
  /** The distance between two values the slider can hold. Zero or less means any value. */
  step: number
}

/** The most tick marks worth drawing. Past this they are a smear, not marks. */
export const SLIDER_MAX_TICKS = 101

function finite(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(number) ? number : fallback
}

/** A usable range from whatever was passed: numbers, text, the bounds the wrong way round. */
export function sliderRange(min?: unknown, max?: unknown, step?: unknown): SliderRange {
  const low = finite(min, 0)
  const high = finite(max, 100)
  const size = finite(step, 1)
  return {
    min: Math.min(low, high),
    max: Math.max(low, high),
    step: size > 0 ? size : 0,
  }
}

/** How many decimal places a number is written with: 0.25 has two. */
export function sliderDecimals(value: number): number {
  if (!Number.isFinite(value))
    return 0
  const text = String(value).toLowerCase()
  const exponent = text.indexOf('e-')
  if (exponent !== -1)
    return Number.parseInt(text.slice(exponent + 2), 10) + Math.max(0, text.slice(0, exponent).split('.')[1]?.length ?? 0)
  return text.split('.')[1]?.length ?? 0
}

/**
 * The value the slider holds for a value it was given: inside the range and
 * on a step counted from the minimum. A maximum that is not on a step cannot
 * be reached, as with the browser's own range input.
 */
export function sliderSnap(value: unknown, range: SliderRange): number {
  const { min, max, step } = range
  const wanted = Math.min(max, Math.max(min, finite(value, min)))
  if (step <= 0)
    return wanted

  let steps = Math.round((wanted - min) / step)
  // Half a step short of the count is rounding noise, not a step too far.
  const limit = Math.floor((max - min) / step + 0.0000001)
  if (steps > limit)
    steps = limit
  const places = Math.max(sliderDecimals(step), sliderDecimals(min))
  return Number((min + steps * step).toFixed(Math.min(places, 20)))
}

/** Where a value sits on the track, from 0 at the minimum to 1 at the maximum. */
export function sliderFraction(value: unknown, range: SliderRange): number {
  const span = range.max - range.min
  if (span <= 0)
    return 0
  const held = Math.min(range.max, Math.max(range.min, finite(value, range.min)))
  return (held - range.min) / span
}

/** The value at a place on the track, snapped. */
export function sliderValueAt(fraction: number, range: SliderRange): number {
  const place = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0))
  return sliderSnap(range.min + place * (range.max - range.min), range)
}

/**
 * Where the tick marks go, as fractions of the track. A number is that many
 * marks spread evenly, ends included; `true` is one for each step. Nothing
 * for fewer than two marks, or for more than can be told apart.
 */
export function sliderTicks(ticks: unknown, range: SliderRange): number[] {
  const span = range.max - range.min
  if (span <= 0 || ticks === false || ticks == null || ticks === '' || ticks === 'false')
    return []

  if (ticks === true || ticks === 'true') {
    if (range.step <= 0)
      return []
    const count = Math.floor(span / range.step + 0.0000001) + 1
    if (count < 2 || count > SLIDER_MAX_TICKS)
      return []
    return Array.from({ length: count }, (_, index) => Math.min(1, (index * range.step) / span))
  }

  const count = Math.floor(finite(ticks, 0))
  if (count < 2 || count > SLIDER_MAX_TICKS)
    return []
  return Array.from({ length: count }, (_, index) => index / (count - 1))
}

/** The value a key moves to, or null for a key the slider does not own. */
export function sliderKeyValue(key: string, value: number, range: SliderRange, page = 10): number | null {
  const step = range.step > 0 ? range.step : (range.max - range.min) / 100
  if (key === 'ArrowRight' || key === 'ArrowUp')
    return sliderSnap(value + step, range)
  if (key === 'ArrowLeft' || key === 'ArrowDown')
    return sliderSnap(value - step, range)
  if (key === 'PageUp')
    return sliderSnap(value + step * page, range)
  if (key === 'PageDown')
    return sliderSnap(value - step * page, range)
  if (key === 'Home')
    return sliderSnap(range.min, range)
  if (key === 'End')
    return sliderSnap(range.max, range)
  return null
}
