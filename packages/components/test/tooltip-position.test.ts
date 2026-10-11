import { describe, expect, test } from 'bun:test'
import { tooltipPosition } from '../src/utils/tooltip-position'

const phone = { width: 390, height: 844 }
const panel = { width: 256, height: 175 }
describe('Tooltip viewport placement', () => {
  test('keeps a long explanation near the left edge inside a phone', () => {
    const point = tooltipPosition({ left: 37, right: 65, top: 460, bottom: 488 }, panel, phone, 'bottom')
    expect(point.left).toBe(8)
    expect(point.left + panel.width).toBeLessThanOrEqual(phone.width - 8)
    expect(point.arrowX).toBe(43)
  })
  test('keeps explanations near the right edge readable', () => {
    const point = tooltipPosition({ left: 354, right: 382, top: 100, bottom: 128 }, panel, phone, 'bottom')
    expect(point.left).toBe(126)
    expect(point.left + panel.width).toBe(phone.width - 8)
    expect(point.arrowX).toBe(242)
  })
  test('flips below a trigger at the top of the screen', () => {
    expect(tooltipPosition({ left: 100, right: 128, top: 10, bottom: 38 }, panel, phone, 'top').side).toBe('bottom')
  })
  test('flips above a trigger near the bottom of the screen', () => {
    const point = tooltipPosition({ left: 100, right: 128, top: 800, bottom: 828 }, panel, phone, 'bottom')
    expect(point.side).toBe('top')
    expect(point.top + panel.height).toBeLessThan(800)
  })
  test('flips side placements and clamps when neither side fits', () => {
    expect(tooltipPosition({ left: 10, right: 38, top: 300, bottom: 328 }, panel, phone, 'left').side).toBe('right')
    expect(tooltipPosition({ left: 350, right: 378, top: 300, bottom: 328 }, panel, phone, 'right').side).toBe('left')
    const point = tooltipPosition({ left: 180, right: 208, top: 300, bottom: 328 }, panel, phone, 'left')
    expect(point.left).toBe(8)
  })
})
