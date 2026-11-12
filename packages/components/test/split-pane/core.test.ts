import { describe, expect, it } from 'bun:test'
import { dividerRange, equalSizes, fitSizes, normalizeSizes, parseLength, parseSizes, resizeAt, separatorValue, serializeSizes, storageName } from '../../src/ui/split-pane/core'

const free = (count: number, min = 0) => Array.from({ length: count }, () => ({ min, max: Number.POSITIVE_INFINITY }))
const sum = (sizes: number[]) => sizes.reduce((a, b) => a + b, 0)
const px = (sizes: number[], total: number) => sizes.map(size => Math.round(size * total))

describe('reading a layout', () => {
  it('treats sizes as shares', () => {
    expect(normalizeSizes([30, 70], 2)).toEqual([0.3, 0.7])
    expect(normalizeSizes([1, 2, 1], 3)).toEqual([0.25, 0.5, 0.25])
  })

  it('shares the space equally when the sizes are not a layout', () => {
    expect(normalizeSizes(null, 2)).toEqual([0.5, 0.5])
    expect(normalizeSizes([1, 2, 3], 2)).toEqual([0.5, 0.5])
    expect(normalizeSizes([1, -1], 2)).toEqual([0.5, 0.5])
    expect(normalizeSizes([1, Number.NaN], 2)).toEqual([0.5, 0.5])
    expect(equalSizes(4)).toEqual([0.25, 0.25, 0.25, 0.25])
    expect(normalizeSizes([1], 0)).toEqual([])
  })

  it('parses an array, a JSON array and a comma list', () => {
    expect(parseSizes([30, 70])).toEqual([30, 70])
    expect(parseSizes('[30, 70]')).toEqual([30, 70])
    expect(parseSizes('30,70')).toEqual([30, 70])
    expect(parseSizes('30 70')).toEqual([30, 70])
    expect(parseSizes(['1', '2'])).toEqual([1, 2])
  })

  it('refuses what is not sizes', () => {
    for (const value of ['', '   ', '[', '[1, "x"]', 'a,b', [], [0, 1], {}, null, undefined, 12])
      expect(parseSizes(value)).toBeNull()
  })

  it('reads a pixel length', () => {
    expect(parseLength(120, 48)).toBe(120)
    expect(parseLength('120', 48)).toBe(120)
    expect(parseLength('120px', 48)).toBe(120)
    expect(parseLength('', 48)).toBe(48)
    expect(parseLength(null, 48)).toBe(48)
    expect(parseLength('wide', 48)).toBe(48)
    expect(parseLength(-5, 48)).toBe(48)
  })
})

describe('moving a divider', () => {
  it('grows one neighbour by what the other gives up', () => {
    const next = resizeAt([0.5, 0.5], 0, 100, 1000, free(2))

    expect(px(next, 1000)).toEqual([600, 400])
    expect(sum(next)).toBeCloseTo(1)
  })

  it('stops at the minimum of the pane that shrinks', () => {
    expect(px(resizeAt([0.5, 0.5], 0, 900, 1000, free(2, 200)), 1000)).toEqual([800, 200])
    expect(px(resizeAt([0.5, 0.5], 0, -900, 1000, free(2, 200)), 1000)).toEqual([200, 800])
  })

  it('pushes through a pane at its minimum into the one beyond it', () => {
    // 300 | 200 | 500, minimum 200: dragging the first divider right by 250
    // cannot shrink the middle pane, so the last one gives instead.
    const next = resizeAt([0.3, 0.2, 0.5], 0, 250, 1000, free(3, 200))

    expect(px(next, 1000)).toEqual([550, 200, 250])
  })

  it('pushes the other way too', () => {
    const next = resizeAt([0.5, 0.2, 0.3], 1, -250, 1000, free(3, 200))

    expect(px(next, 1000)).toEqual([250, 200, 550])
  })

  it('stops at the maximum of the pane that grows', () => {
    const limits = [{ min: 0, max: 600 }, { min: 0, max: Number.POSITIVE_INFINITY }]

    expect(px(resizeAt([0.5, 0.5], 0, 400, 1000, limits), 1000)).toEqual([600, 400])
  })

  it('leaves the layout alone for a divider that is not there', () => {
    expect(resizeAt([0.5, 0.5], 1, 100, 1000, free(2))).toEqual([0.5, 0.5])
    expect(resizeAt([0.5, 0.5], -1, 100, 1000, free(2))).toEqual([0.5, 0.5])
    expect(resizeAt([0.5, 0.5], 0, 0, 1000, free(2))).toEqual([0.5, 0.5])
    expect(resizeAt([0.5, 0.5], 0, 100, 0, free(2))).toEqual([0.5, 0.5])
  })

  it('reports how far a divider can go', () => {
    expect(dividerRange([0.3, 0.2, 0.5], 0, 1000, free(3, 200))).toEqual({ back: 100, forward: 300 })
    expect(separatorValue([0.3, 0.7], 0, 1000, free(2, 200))).toEqual({ now: 30, min: 20, max: 80 })
  })
})

describe('fitting a layout to its container', () => {
  it('leaves a layout that already fits', () => {
    expect(px(fitSizes([0.3, 0.7], 1000, free(2, 100)), 1000)).toEqual([300, 700])
  })

  it('raises a pane to its minimum and takes it from the others', () => {
    const next = fitSizes([0.05, 0.95], 1000, free(2, 200))

    expect(px(next, 1000)).toEqual([200, 800])
    expect(sum(next)).toBeCloseTo(1)
  })

  it('lowers a pane to its maximum and gives it to the others', () => {
    const limits = [{ min: 0, max: 300 }, { min: 0, max: Number.POSITIVE_INFINITY }]

    expect(px(fitSizes([0.6, 0.4], 1000, limits), 1000)).toEqual([300, 700])
  })

  it('shares a container too small for the minimums in proportion to them', () => {
    const limits = [{ min: 300, max: Number.POSITIVE_INFINITY }, { min: 100, max: Number.POSITIVE_INFINITY }]

    expect(fitSizes([0.5, 0.5], 200, limits)).toEqual([0.75, 0.25])
  })

  it('does nothing to a container with no length yet', () => {
    expect(fitSizes([0.3, 0.7], 0, free(2, 200))).toEqual([0.3, 0.7])
  })
})

describe('keeping a layout', () => {
  it('stores short, stable text under a namespaced key', () => {
    expect(storageName('main')).toBe('stx:split-pane:main')
    expect(serializeSizes([1 / 3, 2 / 3])).toBe('[0.3333,0.6667]')
    expect(normalizeSizes(parseSizes(serializeSizes([0.25, 0.75])), 2)).toEqual([0.25, 0.75])
  })
})
