/**
 * Virtual Scrolling Module
 *
 * Provides efficient rendering of large lists using windowing/virtualization.
 * Only renders items that are visible in the viewport, dramatically improving
 * performance for lists with thousands of items.
 *
 * @example
 * ```html
 * @virtualList(items, { itemHeight: 50, containerHeight: 400 })
 *   <div class="item">{{ item.name }}</div>
 * @endvirtualList
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface VirtualListOptions {
  /** Height of each item in pixels */
  itemHeight: number
  /** Height of the container in pixels */
  containerHeight: number
  /** Number of items to render outside the visible area (buffer) */
  overscan?: number
  /** Unique key property for items */
  keyProperty?: string
  /** Enable dynamic item heights */
  dynamicHeight?: boolean
  /** Estimated item height for dynamic heights */
  estimatedItemHeight?: number
  /** Scroll behavior: 'auto' | 'smooth' */
  scrollBehavior?: 'auto' | 'smooth'
  /** Direction: 'vertical' | 'horizontal' */
  direction?: 'vertical' | 'horizontal'
  /** CSS class for the container */
  containerClass?: string
  /** CSS class for the viewport */
  viewportClass?: string
  /** CSS class for each item wrapper */
  itemClass?: string
}

export interface VirtualListState {
  /** Start index of visible items */
  startIndex: number
  /** End index of visible items */
  endIndex: number
  /** Current scroll position */
  scrollTop: number
  /** Total height of all items */
  totalHeight: number
  /** Visible items */
  visibleItems: unknown[]
  /** Item heights cache for dynamic heights */
  itemHeights: Map<number, number>
}

export interface VirtualScrollInstance {
  /** Scroll to a specific index */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void
  /** Scroll to a specific offset */
  scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void
  /** Get current scroll state */
  getState: () => VirtualListState
  /** Force recalculation of visible items */
  refresh: () => void
  /** Update items */
  setItems: (items: unknown[]) => void
  /** Destroy the instance */
  destroy: () => void
}

// ============================================================================
// Virtual List Implementation
// ============================================================================

/**
 * Creates a virtual scroll instance for a list of items
 */
export function createVirtualList<T>(
  items: T[],
  options: VirtualListOptions
): VirtualScrollInstance {
  const {
    itemHeight,
    containerHeight,
    overscan = 3,
    keyProperty = 'id',
    dynamicHeight = false,
    estimatedItemHeight = itemHeight,
    direction = 'vertical',
  } = options

  let currentItems = [...items]
  let scrollTop = 0
  const itemHeights = new Map<number, number>()

  // Calculate visible range
  function calculateVisibleRange(): { startIndex: number; endIndex: number } {
    if (dynamicHeight) {
      return calculateDynamicVisibleRange()
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const endIndex = Math.min(
      currentItems.length - 1,
      startIndex + visibleCount + overscan * 2
    )

    return { startIndex, endIndex }
  }

  // Calculate visible range for dynamic heights
  function calculateDynamicVisibleRange(): { startIndex: number; endIndex: number } {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = currentItems.length - 1

    // Find start index
    for (let i = 0; i < currentItems.length; i++) {
      const height = itemHeights.get(i) || estimatedItemHeight
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Find end index
    accumulatedHeight = 0
    for (let i = 0; i < currentItems.length; i++) {
      const height = itemHeights.get(i) || estimatedItemHeight
      accumulatedHeight += height
      if (accumulatedHeight > scrollTop + containerHeight) {
        endIndex = Math.min(currentItems.length - 1, i + overscan)
        break
      }
    }

    return { startIndex, endIndex }
  }

  // Calculate total height
  function calculateTotalHeight(): number {
    if (dynamicHeight) {
      let total = 0
      for (let i = 0; i < currentItems.length; i++) {
        total += itemHeights.get(i) || estimatedItemHeight
      }
      return total
    }
    return currentItems.length * itemHeight
  }

  // Calculate offset for an item
  function getItemOffset(index: number): number {
    if (dynamicHeight) {
      let offset = 0
      for (let i = 0; i < index; i++) {
        offset += itemHeights.get(i) || estimatedItemHeight
      }
      return offset
    }
    return index * itemHeight
  }

  // Get current state
  function getState(): VirtualListState {
    const { startIndex, endIndex } = calculateVisibleRange()
    return {
      startIndex,
      endIndex,
      scrollTop,
      totalHeight: calculateTotalHeight(),
      visibleItems: currentItems.slice(startIndex, endIndex + 1),
      itemHeights: new Map(itemHeights),
    }
  }

  // Scroll to specific index
  function scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    const offset = getItemOffset(index)
    scrollToOffset(offset, behavior)
  }

  // Scroll to specific offset
  function scrollToOffset(offset: number, _behavior: ScrollBehavior = 'auto'): void {
    scrollTop = Math.max(0, Math.min(offset, calculateTotalHeight() - containerHeight))
  }

  // Refresh visible items
  function refresh(): void {
    // Recalculate everything
    calculateVisibleRange()
  }

  // Update items
  function setItems(newItems: T[]): void {
    currentItems = [...newItems]
    itemHeights.clear()
    refresh()
  }

  // Destroy instance
  function destroy(): void {
    currentItems = []
    itemHeights.clear()
  }

  return {
    scrollToIndex,
    scrollToOffset,
    getState,
    refresh,
    setItems,
    destroy,
  }
}

// ============================================================================
// Directive Processing
// ============================================================================

/**
 * Process @virtualList directives in templates
 */
export function processVirtualListDirectives(
  template: string,
  context: Record<string, unknown> = {},
  _filePath?: string
): string {
  // Match @virtualList(items, options) ... @endvirtualList
  const virtualListRegex =
    /@virtualList\s*\(\s*([^,]+)\s*(?:,\s*(\{[^}]*\}))?\s*\)\s*([\s\S]*?)@endvirtualList/gi

  return template.replace(virtualListRegex, (_, itemsExpr, optionsExpr, content) => {
    const itemsName = itemsExpr.trim()
    const items = context[itemsName] as unknown[] | undefined

    if (!items || !Array.isArray(items)) {
      return `<!-- virtualList: items "${itemsName}" not found or not an array -->`
    }

    // Parse options
    let options: VirtualListOptions = {
      itemHeight: 50,
      containerHeight: 400,
      overscan: 3,
    }

    if (optionsExpr) {
      try {
        // Simple JSON-like parsing
        const optionsStr = optionsExpr.trim()
        const parsed = Function(`return ${optionsStr}`)()
        options = { ...options, ...parsed }
      }
      catch {
        // Use defaults if parsing fails
      }
    }

    // Generate unique ID for this virtual list
    const listId = `vlist-${Math.random().toString(36).substring(2, 9)}`

    // Calculate initial visible range
    const visibleCount = Math.ceil(options.containerHeight / options.itemHeight)
    const overscan = options.overscan || 3
    const startIndex = 0
    const endIndex = Math.min(items.length - 1, visibleCount + overscan)

    // Generate visible items HTML
    let visibleItemsHtml = ''
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const item = items[i]
      const itemContent = content
        .replace(/\{\{\s*item\s*\}\}/g, typeof item === 'object' ? JSON.stringify(item) : String(item))
        .replace(/\{\{\s*item\.(\w+)\s*\}\}/g, (_: string, prop: string) => {
          if (typeof item === 'object' && item !== null) {
            return String((item as Record<string, unknown>)[prop] ?? '')
          }
          return ''
        })
        .replace(/\{\{\s*index\s*\}\}/g, String(i))

      visibleItemsHtml += `
        <div class="virtual-item ${options.itemClass || ''}"
             style="position: absolute; top: ${i * options.itemHeight}px; height: ${options.itemHeight}px; width: 100%;"
             data-index="${i}">
          ${itemContent}
        </div>`
    }

    // Calculate total height
    const totalHeight = items.length * options.itemHeight

    // Generate the virtual list container
    return `
      <div id="${listId}"
           class="virtual-list-container ${options.containerClass || ''}"
           style="position: relative; height: ${options.containerHeight}px; overflow-y: auto;"
           data-item-height="${options.itemHeight}"
           data-total-items="${items.length}"
           data-overscan="${overscan}">
        <div class="virtual-list-viewport ${options.viewportClass || ''}"
             style="position: relative; height: ${totalHeight}px; width: 100%;">
          ${visibleItemsHtml}
        </div>
      </div>
      <script data-virtual-list="${listId}">
        (function() {
          const container = document.getElementById('${listId}');
          if (!container) return;

          const viewport = container.querySelector('.virtual-list-viewport');
          const itemHeight = ${options.itemHeight};
          const totalItems = ${items.length};
          const overscan = ${overscan};
          const containerHeight = ${options.containerHeight};
          const items = ${JSON.stringify(items)};
          const template = ${JSON.stringify(content.trim())};

          let lastStartIndex = 0;

          function renderItems(scrollTop) {
            const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);

            if (startIndex === lastStartIndex) return;
            lastStartIndex = startIndex;

            // Clear and re-render
            viewport.innerHTML = '';

            for (let i = startIndex; i <= endIndex; i++) {
              const item = items[i];
              const div = document.createElement('div');
              div.className = 'virtual-item ${options.itemClass || ''}';
              div.style.cssText = 'position: absolute; top: ' + (i * itemHeight) + 'px; height: ' + itemHeight + 'px; width: 100%;';
              div.dataset.index = i;

              let html = template
                .replace(/\\{\\{\\s*item\\s*\\}\\}/g, typeof item === 'object' ? JSON.stringify(item) : String(item))
                .replace(/\\{\\{\\s*item\\.(\\w+)\\s*\\}\\}/g, (_, prop) => {
                  return typeof item === 'object' && item !== null ? String(item[prop] ?? '') : '';
                })
                .replace(/\\{\\{\\s*index\\s*\\}\\}/g, String(i));

              div.innerHTML = html;
              viewport.appendChild(div);
            }
          }

          container.addEventListener('scroll', function() {
            requestAnimationFrame(() => renderItems(container.scrollTop));
          });

          // Expose API
          container.__virtualList = {
            scrollToIndex: function(index) {
              container.scrollTop = index * itemHeight;
            },
            refresh: function() {
              renderItems(container.scrollTop);
            }
          };
        })();
      </script>
    `
  })
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate CSS for virtual list styling
 */
export function generateVirtualListCSS(): string {
  return `
    .virtual-list-container {
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .virtual-list-container::-webkit-scrollbar {
      width: 8px;
    }

    .virtual-list-container::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    .virtual-list-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }

    .virtual-list-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.5);
    }

    .virtual-list-viewport {
      position: relative;
      width: 100%;
    }

    .virtual-item {
      position: absolute;
      left: 0;
      right: 0;
      box-sizing: border-box;
    }

    /* Loading placeholder for items */
    .virtual-item-placeholder {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: virtual-shimmer 1.5s infinite;
    }

    @keyframes virtual-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `
}

// ============================================================================
// Hooks for Reactivity
// ============================================================================

/**
 * Hook to create a reactive virtual list
 */
export function useVirtualList<T>(
  items: () => T[],
  options: VirtualListOptions
): {
  visibleItems: () => T[]
  totalHeight: () => number
  containerProps: () => Record<string, unknown>
  itemProps: (index: number) => Record<string, unknown>
  scrollToIndex: (index: number) => void
} {
  let instance: VirtualScrollInstance | null = null

  const getOrCreateInstance = () => {
    if (!instance) {
      instance = createVirtualList(items(), options)
    }
    return instance
  }

  return {
    visibleItems: () => {
      const state = getOrCreateInstance().getState()
      return state.visibleItems as T[]
    },

    totalHeight: () => {
      return getOrCreateInstance().getState().totalHeight
    },

    containerProps: () => ({
      style: {
        height: `${options.containerHeight}px`,
        overflow: 'auto',
        position: 'relative',
      },
      onScroll: (e: Event) => {
        const target = e.target as HTMLElement
        if (instance) {
          instance.scrollToOffset(target.scrollTop)
        }
      },
    }),

    itemProps: (index: number) => ({
      style: {
        position: 'absolute',
        top: `${index * options.itemHeight}px`,
        height: `${options.itemHeight}px`,
        width: '100%',
      },
      'data-index': index,
    }),

    scrollToIndex: (index: number) => {
      getOrCreateInstance().scrollToIndex(index)
    },
  }
}

// ============================================================================
// Infinite Scroll Support
// ============================================================================

export interface InfiniteScrollOptions extends VirtualListOptions {
  /** Threshold in pixels before end to trigger load more */
  threshold?: number
  /** Callback when more items should be loaded */
  onLoadMore?: () => Promise<void>
  /** Whether more items are available */
  hasMore?: boolean
  /** Loading state */
  isLoading?: boolean
}

/**
 * Process @infiniteList directives for infinite scrolling
 */
export function processInfiniteListDirectives(
  template: string,
  context: Record<string, unknown> = {},
  _filePath?: string
): string {
  const infiniteListRegex =
    /@infiniteList\s*\(\s*([^,]+)\s*(?:,\s*(\{[^}]*\}))?\s*\)\s*([\s\S]*?)@loading\s*([\s\S]*?)@endinfiniteList/gi

  return template.replace(infiniteListRegex, (_, itemsExpr, optionsExpr, content, loadingContent) => {
    const itemsName = itemsExpr.trim()
    const items = context[itemsName] as unknown[] | undefined

    if (!items || !Array.isArray(items)) {
      return `<!-- infiniteList: items "${itemsName}" not found or not an array -->`
    }

    // Parse options
    let options: InfiniteScrollOptions = {
      itemHeight: 50,
      containerHeight: 400,
      overscan: 3,
      threshold: 100,
      hasMore: true,
    }

    if (optionsExpr) {
      try {
        const parsed = Function(`return ${optionsExpr.trim()}`)()
        options = { ...options, ...parsed }
      }
      catch {
        // Use defaults
      }
    }

    const listId = `ilist-${Math.random().toString(36).substring(2, 9)}`

    // First, render as virtual list
    let virtualListHtml = processVirtualListDirectives(
      `@virtualList(${itemsName}, ${JSON.stringify({
        itemHeight: options.itemHeight,
        containerHeight: options.containerHeight,
        overscan: options.overscan,
        containerClass: options.containerClass,
      })})${content}@endvirtualList`,
      context
    )

    // Add infinite scroll behavior
    virtualListHtml = virtualListHtml.replace(
      '</script>',
      `
          // Infinite scroll detection
          container.addEventListener('scroll', function() {
            const scrollBottom = container.scrollTop + container.clientHeight;
            const threshold = ${options.threshold};
            const totalHeight = viewport.offsetHeight;

            if (scrollBottom >= totalHeight - threshold) {
              container.dispatchEvent(new CustomEvent('loadmore', { bubbles: true }));
            }
          });
        </script>`
    )

    // Add loading indicator
    return `
      <div id="${listId}" class="infinite-list-wrapper">
        ${virtualListHtml}
        <div class="infinite-list-loading" style="display: none;">
          ${loadingContent}
        </div>
      </div>
    `
  })
}

// ============================================================================
// Grid Virtualization
// ============================================================================

export interface VirtualGridOptions {
  /** Number of columns */
  columns: number
  /** Row height in pixels */
  rowHeight: number
  /** Container height in pixels */
  containerHeight: number
  /** Gap between items */
  gap?: number
  /** Overscan rows */
  overscan?: number
}

/**
 * Process @virtualGrid directives for grid virtualization
 */
export function processVirtualGridDirectives(
  template: string,
  context: Record<string, unknown> = {},
  _filePath?: string
): string {
  const virtualGridRegex =
    /@virtualGrid\s*\(\s*([^,]+)\s*(?:,\s*(\{[^}]*\}))?\s*\)\s*([\s\S]*?)@endvirtualGrid/gi

  return template.replace(virtualGridRegex, (_, itemsExpr, optionsExpr, content) => {
    const itemsName = itemsExpr.trim()
    const items = context[itemsName] as unknown[] | undefined

    if (!items || !Array.isArray(items)) {
      return `<!-- virtualGrid: items "${itemsName}" not found or not an array -->`
    }

    let options: VirtualGridOptions = {
      columns: 3,
      rowHeight: 100,
      containerHeight: 400,
      gap: 10,
      overscan: 2,
    }

    if (optionsExpr) {
      try {
        const parsed = Function(`return ${optionsExpr.trim()}`)()
        options = { ...options, ...parsed }
      }
      catch {
        // Use defaults
      }
    }

    const gridId = `vgrid-${Math.random().toString(36).substring(2, 9)}`
    const totalRows = Math.ceil(items.length / options.columns)
    const totalHeight = totalRows * (options.rowHeight + (options.gap || 0))

    // Calculate visible rows
    const visibleRowCount = Math.ceil(options.containerHeight / (options.rowHeight + (options.gap || 0)))
    const overscan = options.overscan || 2
    const startRow = 0
    const endRow = Math.min(totalRows - 1, visibleRowCount + overscan)

    // Generate visible items
    let visibleItemsHtml = ''
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < options.columns; col++) {
        const index = row * options.columns + col
        if (index >= items.length) break

        const item = items[index]
        const left = col * (100 / options.columns)
        const top = row * (options.rowHeight + (options.gap || 0))

        const itemContent = content
          .replace(/\{\{\s*item\s*\}\}/g, typeof item === 'object' ? JSON.stringify(item) : String(item))
          .replace(/\{\{\s*item\.(\w+)\s*\}\}/g, (_: string, prop: string) => {
            if (typeof item === 'object' && item !== null) {
              return String((item as Record<string, unknown>)[prop] ?? '')
            }
            return ''
          })
          .replace(/\{\{\s*index\s*\}\}/g, String(index))

        visibleItemsHtml += `
          <div class="virtual-grid-item"
               style="position: absolute; top: ${top}px; left: ${left}%; width: calc(${100 / options.columns}% - ${options.gap || 0}px); height: ${options.rowHeight}px;"
               data-index="${index}">
            ${itemContent}
          </div>`
      }
    }

    return `
      <div id="${gridId}"
           class="virtual-grid-container"
           style="position: relative; height: ${options.containerHeight}px; overflow-y: auto;">
        <div class="virtual-grid-viewport"
             style="position: relative; height: ${totalHeight}px; width: 100%;">
          ${visibleItemsHtml}
        </div>
      </div>
      <script data-virtual-grid="${gridId}">
        (function() {
          const container = document.getElementById('${gridId}');
          if (!container) return;

          const viewport = container.querySelector('.virtual-grid-viewport');
          const columns = ${options.columns};
          const rowHeight = ${options.rowHeight};
          const gap = ${options.gap || 0};
          const totalItems = ${items.length};
          const overscan = ${overscan};
          const containerHeight = ${options.containerHeight};
          const items = ${JSON.stringify(items)};
          const template = ${JSON.stringify(content.trim())};

          let lastStartRow = 0;

          function renderItems(scrollTop) {
            const startRow = Math.max(0, Math.floor(scrollTop / (rowHeight + gap)) - overscan);
            const visibleRowCount = Math.ceil(containerHeight / (rowHeight + gap));
            const endRow = Math.min(Math.ceil(totalItems / columns) - 1, startRow + visibleRowCount + overscan * 2);

            if (startRow === lastStartRow) return;
            lastStartRow = startRow;

            viewport.innerHTML = '';

            for (let row = startRow; row <= endRow; row++) {
              for (let col = 0; col < columns; col++) {
                const index = row * columns + col;
                if (index >= totalItems) break;

                const item = items[index];
                const div = document.createElement('div');
                div.className = 'virtual-grid-item';
                div.style.cssText = 'position: absolute; top: ' + (row * (rowHeight + gap)) + 'px; left: ' + (col * (100 / columns)) + '%; width: calc(' + (100 / columns) + '% - ' + gap + 'px); height: ' + rowHeight + 'px;';
                div.dataset.index = index;

                let html = template
                  .replace(/\\{\\{\\s*item\\s*\\}\\}/g, typeof item === 'object' ? JSON.stringify(item) : String(item))
                  .replace(/\\{\\{\\s*item\\.(\\w+)\\s*\\}\\}/g, (_, prop) => {
                    return typeof item === 'object' && item !== null ? String(item[prop] ?? '') : '';
                  })
                  .replace(/\\{\\{\\s*index\\s*\\}\\}/g, String(index));

                div.innerHTML = html;
                viewport.appendChild(div);
              }
            }
          }

          container.addEventListener('scroll', function() {
            requestAnimationFrame(() => renderItems(container.scrollTop));
          });
        })();
      </script>
    `
  })
}

// ============================================================================
// Exports
// ============================================================================

export default {
  createVirtualList,
  processVirtualListDirectives,
  processInfiniteListDirectives,
  processVirtualGridDirectives,
  generateVirtualListCSS,
  useVirtualList,
}
