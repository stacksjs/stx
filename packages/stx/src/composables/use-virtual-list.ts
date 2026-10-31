/**
 * useVirtualList - draw only the rows of a long list that can be seen.
 *
 * A list of thousands of rows costs the same to draw whether or not anyone is
 * looking at it. This keeps the rows in the viewport (plus a few either side)
 * and a pair of spacer heights, so the scroll bar and the scroll position
 * behave as if every row were there.
 *
 * ```html
 * <script client>
 *   const todos = state([...])                      // thousands of rows
 *   const virtual = useVirtualList(todos, { itemHeight: 44, height: 480 })
 * </script>
 *
 * <div class="scroller" :style="virtual.containerStyle()" @scroll="virtual.onScroll($event)">
 *   <div :style="virtual.wrapperStyle()">
 *     <div :for="row in virtual.list()" :key="row.index" style="height: 44px">{{ row.data.title }}</div>
 *   </div>
 * </div>
 * ```
 *
 * Rows have one height (`itemHeight`), or one per index when it is a function.
 * The viewport height is `height` when given, and otherwise read from the
 * scroller on its first scroll event (or from `measure(element)`), so a
 * scroller sized by CSS works without a number in the script.
 *
 * `list()` holds `{ index, data }` entries; keying on `index` keeps the same
 * row elements while they scroll through the window. The list is rebuilt only
 * when the first or last visible index changes, so a scroll that stays inside
 * the same rows costs nothing.
 *
 * Delivery: demand-bundled into `<script client>` blocks like `useForm`
 * (framework-composables.ts takes this file whole and strips the import below,
 * since `state` and `derived` are runtime globals by then), so keep it free of
 * other imports.
 */
import type { Signal } from '../signals-api'
import { derived, state } from '../signals-api'

export interface VirtualRow<T> {
  /** Position in the source list. */
  index: number
  /** The source item. */
  data: T
}

export interface UseVirtualListOptions {
  /** One height for every row, or the height of the row at an index. */
  itemHeight: number | ((index: number) => number)
  /** Rows drawn beyond each edge of the viewport. Default 5. */
  overscan?: number
  /** Viewport height in pixels. Measured from the scroller when omitted. */
  height?: number
}

export interface UseVirtualList<T> {
  /** The rows to draw. */
  list: () => VirtualRow<T>[]
  /** Index of the first drawn row. */
  start: () => number
  /** Index after the last drawn row. */
  end: () => number
  /** Height of every row together. */
  totalHeight: () => number
  /** Height of the rows above the window. */
  offsetTop: () => number
  /** Bind to the scroller's scroll event. */
  onScroll: (event: { target?: unknown } | null | undefined) => void
  /** Read the viewport height from a scroller element. */
  measure: (element: { clientHeight?: number, scrollTop?: number } | null | undefined) => void
  /** Style for the scroller: a bounded, scrollable box. */
  containerStyle: () => string
  /** Style for the element holding the rows: the full height, rows offset into place. */
  wrapperStyle: () => string
  /** Scroll so the row at `index` is at the top. */
  scrollTo: (index: number, scroller?: { scrollTop: number } | null) => void
  /** The scroll position the composable last read. */
  scrollTop: () => number
}

export function useVirtualList<T>(
  source: Signal<T[]> | (() => T[]) | T[],
  options: UseVirtualListOptions,
): UseVirtualList<T> {
  const overscan = Math.max(0, options.overscan ?? 5)
  const scrollTop = state(0)
  const viewport = state(options.height && options.height > 0 ? options.height : 0)
  const items = (): T[] => {
    const value = typeof source === 'function' ? (source as () => T[])() : source
    return Array.isArray(value) ? value : []
  }
  const fixed = typeof options.itemHeight === 'number' ? Math.max(1, options.itemHeight) : 0
  const heightAt = (index: number): number => (fixed > 0 ? fixed : Math.max(1, (options.itemHeight as (i: number) => number)(index)))

  // Prefix sums for per-row heights, rebuilt when the list changes length.
  let prefix: number[] = [0]
  let prefixFor = -1
  const offsetOf = (index: number, count: number): number => {
    if (fixed > 0) return index * fixed
    if (prefixFor !== count) {
      prefix = [0]
      for (let i = 0; i < count; i++) prefix.push(prefix[i]! + heightAt(i))
      prefixFor = count
    }
    return prefix[Math.min(Math.max(index, 0), count)]!
  }
  const indexAt = (position: number, count: number): number => {
    if (count === 0) return 0
    if (fixed > 0) return Math.min(count - 1, Math.max(0, Math.floor(position / fixed)))
    offsetOf(0, count)
    let low = 0
    let high = count - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (prefix[mid]! <= position) low = mid
      else high = mid - 1
    }
    return low
  }

  const total = derived(() => offsetOf(items().length, items().length))
  // The window is a pair of numbers, so a scroll inside the same rows changes
  // neither and nothing downstream runs again.
  const start = derived(() => {
    const count = items().length
    return Math.max(0, indexAt(scrollTop(), count) - overscan)
  }, { equals: (a: number, b: number) => a === b })
  const end = derived(() => {
    const count = items().length
    if (count === 0) return 0
    const height = viewport() > 0 ? viewport() : 600
    return Math.min(count, indexAt(scrollTop() + height, count) + 1 + overscan)
  }, { equals: (a: number, b: number) => a === b })
  const list = derived(() => {
    const all = items()
    const rows: VirtualRow<T>[] = []
    for (let index = start(); index < end(); index++) rows.push({ index, data: all[index] as T })
    return rows
  })
  const offsetTop = derived(() => offsetOf(start(), items().length))

  const measure: UseVirtualList<T>['measure'] = (element) => {
    if (!element) return
    if (!options.height && typeof element.clientHeight === 'number' && element.clientHeight > 0) viewport.set(element.clientHeight)
    if (typeof element.scrollTop === 'number') scrollTop.set(Math.max(0, element.scrollTop))
  }

  return {
    list,
    start,
    end,
    totalHeight: total,
    offsetTop,
    onScroll: (event) => {
      const target = event && (event.target as { clientHeight?: number, scrollTop?: number } | null | undefined)
      measure(target)
    },
    measure,
    containerStyle: () => `overflow-y:auto;position:relative;${viewport() > 0 ? `height:${viewport()}px;` : ''}`,
    wrapperStyle: () => `height:${total()}px;padding-top:${offsetTop()}px;box-sizing:border-box;`,
    scrollTo: (index, scroller) => {
      const position = offsetOf(Math.min(Math.max(0, index), Math.max(0, items().length - 1)), items().length)
      if (scroller) scroller.scrollTop = position
      scrollTop.set(position)
    },
    scrollTop: () => scrollTop(),
  }
}
