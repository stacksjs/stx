/**
 * The slider's arithmetic: which values a step allows, where a value sits on
 * the track, where the tick marks go, and what a key moves to.
 */
import { describe, expect, it } from 'bun:test'
import { SLIDER_MAX_TICKS, sliderDecimals, sliderFraction, sliderKeyValue, sliderRange, sliderSnap, sliderTicks, sliderValueAt } from '../../src/ui/slider/core'

describe('a range', () => {
  it('defaults to 0 to 100 in steps of 1', () => {
    expect(sliderRange()).toEqual({ min: 0, max: 100, step: 1 })
  })

  it('reads text, and puts bounds given the wrong way round in order', () => {
    expect(sliderRange('2', '10', '0.5')).toEqual({ min: 2, max: 10, step: 0.5 })
    expect(sliderRange(10, 2, 1)).toEqual({ min: 2, max: 10, step: 1 })
  })

  it('treats a step of zero or less, or one that is not a number, as no step', () => {
    expect(sliderRange(0, 1, 0).step).toBe(0)
    expect(sliderRange(0, 1, -2).step).toBe(0)
    expect(sliderRange(0, 1, 'any').step).toBe(1)
  })
})

describe('snapping', () => {
  const range = sliderRange(0, 10, 2)

  it('keeps a value inside the range', () => {
    expect(sliderSnap(-5, range)).toBe(0)
    expect(sliderSnap(50, range)).toBe(10)
  })

  it('rounds to the nearest step counted from the minimum', () => {
    expect(sliderSnap(2.9, range)).toBe(2)
    expect(sliderSnap(3, range)).toBe(4)
    expect(sliderSnap(4, sliderRange(1, 10, 3))).toBe(4)
    expect(sliderSnap(5.4, sliderRange(1, 10, 3))).toBe(4)
    expect(sliderSnap(5.6, sliderRange(1, 10, 3))).toBe(7)
  })

  it('cannot reach a maximum that is not on a step', () => {
    expect(sliderSnap(10, sliderRange(0, 10, 4))).toBe(8)
    expect(sliderSnap(9.9, sliderRange(0, 10, 4))).toBe(8)
  })

  it('does not leak binary fractions into a decimal step', () => {
    expect(sliderSnap(0.3, sliderRange(0, 1, 0.1))).toBe(0.3)
    expect(sliderSnap(0.7000001, sliderRange(0, 1, 0.1))).toBe(0.7)
    expect(sliderSnap(1, sliderRange(0, 1, 0.1))).toBe(1)
    expect(sliderSnap(0.26, sliderRange(0.05, 1, 0.05))).toBe(0.25)
  })

  it('leaves a value alone when there is no step', () => {
    expect(sliderSnap(0.123456, sliderRange(0, 1, 0))).toBe(0.123456)
  })

  it('takes text, and the minimum for anything that is not a number', () => {
    expect(sliderSnap('6', range)).toBe(6)
    expect(sliderSnap('nonsense', range)).toBe(0)
    expect(sliderSnap(undefined, sliderRange(3, 9, 1))).toBe(3)
  })

  it('counts decimal places, in exponent form too', () => {
    expect(sliderDecimals(1)).toBe(0)
    expect(sliderDecimals(0.25)).toBe(2)
    expect(sliderDecimals(0.0000001)).toBe(7)
    expect(sliderDecimals(Number.NaN)).toBe(0)
  })
})

describe('a place on the track', () => {
  it('is 0 at the minimum and 1 at the maximum', () => {
    const range = sliderRange(10, 30, 1)

    expect(sliderFraction(10, range)).toBe(0)
    expect(sliderFraction(20, range)).toBe(0.5)
    expect(sliderFraction(30, range)).toBe(1)
    expect(sliderFraction(99, range)).toBe(1)
    expect(sliderFraction(-99, range)).toBe(0)
  })

  it('is 0 for a range with no length', () => {
    expect(sliderFraction(5, sliderRange(5, 5, 1))).toBe(0)
  })

  it('turns back into a value, on a step', () => {
    const range = sliderRange(0, 2, 1)

    expect(sliderValueAt(0, range)).toBe(0)
    expect(sliderValueAt(0.4, range)).toBe(1)
    expect(sliderValueAt(0.8, range)).toBe(2)
    expect(sliderValueAt(7, range)).toBe(2)
    expect(sliderValueAt(Number.NaN, range)).toBe(0)
  })
})

describe('tick marks', () => {
  it('spreads a count of marks evenly, ends included', () => {
    expect(sliderTicks(3, sliderRange(0, 100, 1))).toEqual([0, 0.5, 1])
    expect(sliderTicks('5', sliderRange(0, 1, 0))).toEqual([0, 0.25, 0.5, 0.75, 1])
  })

  it('puts one on each step when asked for true', () => {
    expect(sliderTicks(true, sliderRange(0, 2, 1))).toEqual([0, 0.5, 1])
    expect(sliderTicks('true', sliderRange(0, 10, 5))).toEqual([0, 0.5, 1])
    expect(sliderTicks(true, sliderRange(0, 1, 0.1))).toHaveLength(11)
  })

  it('does not put a mark past a maximum that is off the steps', () => {
    expect(sliderTicks(true, sliderRange(0, 10, 4))).toEqual([0, 0.4, 0.8])
  })

  it('draws none when there is nothing to mark', () => {
    const range = sliderRange(0, 100, 1)

    expect(sliderTicks(false, range)).toEqual([])
    expect(sliderTicks(undefined, range)).toEqual([])
    expect(sliderTicks(0, range)).toEqual([])
    expect(sliderTicks(1, range)).toEqual([])
    expect(sliderTicks(true, sliderRange(0, 1, 0))).toEqual([])
    expect(sliderTicks(3, sliderRange(4, 4, 1))).toEqual([])
  })

  it('draws none rather than more than can be told apart', () => {
    expect(sliderTicks(true, sliderRange(0, 1000, 1))).toEqual([])
    expect(sliderTicks(SLIDER_MAX_TICKS + 1, sliderRange(0, 1, 0))).toEqual([])
    expect(sliderTicks(SLIDER_MAX_TICKS, sliderRange(0, 1, 0))).toHaveLength(SLIDER_MAX_TICKS)
  })
})

describe('keys', () => {
  const range = sliderRange(0, 100, 5)

  it('moves a step with the arrows', () => {
    expect(sliderKeyValue('ArrowRight', 50, range)).toBe(55)
    expect(sliderKeyValue('ArrowUp', 50, range)).toBe(55)
    expect(sliderKeyValue('ArrowLeft', 50, range)).toBe(45)
    expect(sliderKeyValue('ArrowDown', 50, range)).toBe(45)
  })

  it('moves ten steps with Page Up and Page Down, and to the ends with Home and End', () => {
    expect(sliderKeyValue('PageUp', 20, range)).toBe(70)
    expect(sliderKeyValue('PageDown', 20, range)).toBe(0)
    expect(sliderKeyValue('Home', 20, range)).toBe(0)
    expect(sliderKeyValue('End', 20, range)).toBe(100)
  })

  it('stops at the ends', () => {
    expect(sliderKeyValue('ArrowRight', 100, range)).toBe(100)
    expect(sliderKeyValue('ArrowLeft', 0, range)).toBe(0)
  })

  it('moves a hundredth of the range when there is no step', () => {
    expect(sliderKeyValue('ArrowRight', 1, sliderRange(0, 2, 0))).toBeCloseTo(1.02)
  })

  it('leaves every other key alone', () => {
    expect(sliderKeyValue('a', 50, range)).toBeNull()
    expect(sliderKeyValue('Tab', 50, range)).toBeNull()
  })
})
