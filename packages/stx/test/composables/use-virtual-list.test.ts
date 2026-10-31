import { describe, expect, it } from 'bun:test'
import { state } from '../../src/signals-api'
import { useVirtualList } from '../../src/composables/use-virtual-list'

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i, title: `Row ${i}` }))

describe('useVirtualList', () => {
  it('draws the viewport plus overscan, not the whole list', () => {
    const v = useVirtualList(state(rows(5000)), { itemHeight: 40, height: 400, overscan: 3 })
    const list = v.list()
    // 400 / 40 = 10 rows visible, 3 more below; none above at the top.
    expect(list[0]!.index).toBe(0)
    expect(list.length).toBe(14)
    expect(v.totalHeight()).toBe(200_000)
  })

  it('moves the window with the scroll position', () => {
    const v = useVirtualList(state(rows(5000)), { itemHeight: 40, height: 400, overscan: 2 })
    v.onScroll({ target: { scrollTop: 4000, clientHeight: 400 } })
    const indexes = v.list().map(r => r.index)
    expect(indexes[0]).toBe(98)
    expect(indexes.at(-1)).toBe(112)
    expect(v.offsetTop()).toBe(98 * 40)
    expect(v.list()[0]!.data.title).toBe('Row 98')
  })

  it('keeps the same list while a scroll stays inside the same rows', () => {
    const v = useVirtualList(state(rows(1000)), { itemHeight: 40, height: 400, overscan: 5 })
    v.onScroll({ target: { scrollTop: 400 } })
    const before = v.list()
    v.onScroll({ target: { scrollTop: 410 } })
    expect(v.list()).toBe(before)
  })

  it('measures the viewport from the scroller when no height is given', () => {
    const v = useVirtualList(state(rows(1000)), { itemHeight: 50, overscan: 0 })
    v.onScroll({ target: { scrollTop: 0, clientHeight: 500 } })
    expect(v.list().length).toBe(11)
    expect(v.containerStyle()).toContain('height:500px')
  })

  it('follows the source when it changes', () => {
    const source = state(rows(100))
    const v = useVirtualList(source, { itemHeight: 10, height: 100, overscan: 0 })
    expect(v.totalHeight()).toBe(1000)
    source.set(rows(3))
    expect(v.totalHeight()).toBe(30)
    expect(v.list().map(r => r.index)).toEqual([0, 1, 2])
    source.set([])
    expect(v.list()).toEqual([])
  })

  it('handles a different height per row', () => {
    const v = useVirtualList(state(rows(100)), { itemHeight: i => (i % 2 === 0 ? 20 : 40), height: 90, overscan: 0 })
    expect(v.totalHeight()).toBe(50 * 20 + 50 * 40)
    v.onScroll({ target: { scrollTop: 60 } })
    // rows 0..1 take 60px, so the window starts at row 2.
    expect(v.start()).toBe(2)
  })

  it('scrolls to a row', () => {
    const v = useVirtualList(state(rows(1000)), { itemHeight: 30, height: 300, overscan: 0 })
    const scroller = { scrollTop: 0 }
    v.scrollTo(50, scroller)
    expect(scroller.scrollTop).toBe(1500)
    expect(v.list()[0]!.index).toBe(50)
  })

  it('accepts a plain array or a getter', () => {
    expect(useVirtualList(rows(20), { itemHeight: 10, height: 50, overscan: 0 }).list().length).toBe(6)
    const items = rows(20)
    expect(useVirtualList(() => items, { itemHeight: 10, height: 50, overscan: 0 }).list().length).toBe(6)
  })
})
