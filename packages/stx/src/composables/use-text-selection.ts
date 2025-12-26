/**
 * Text Selection Composables
 *
 * Reactive utilities for tracking and manipulating text selection.
 */

export interface TextSelectionState {
  text: string
  rects: DOMRect[]
  ranges: Range[]
  isCollapsed: boolean
}

export interface TextSelectionOptions {
  /**
   * Called when selection changes
   */
  onSelect?: (state: TextSelectionState) => void
  /**
   * Called when selection is cleared
   */
  onClear?: () => void
}

export interface TextSelectionRef {
  get: () => TextSelectionState
  subscribe: (fn: (state: TextSelectionState) => void) => () => void
  getText: () => string
  clear: () => void
  selectAll: (element?: Element) => void
  getRects: () => DOMRect[]
}

/**
 * Create a reactive text selection tracker
 *
 * @example
 * ```ts
 * const selection = useTextSelection({
 *   onSelect: (state) => {
 *     console.log('Selected text:', state.text)
 *   }
 * })
 *
 * // Subscribe to selection changes
 * selection.subscribe((state) => {
 *   if (state.text) {
 *     showTooltip(state.rects[0], state.text)
 *   }
 * })
 *
 * // Get currently selected text
 * const text = selection.getText()
 *
 * // Clear selection
 * selection.clear()
 * ```
 */
export function useTextSelection(options: TextSelectionOptions = {}): TextSelectionRef {
  const { onSelect, onClear } = options
  const subscribers = new Set<(state: TextSelectionState) => void>()

  let state: TextSelectionState = {
    text: '',
    rects: [],
    ranges: [],
    isCollapsed: true,
  }

  let cleanup: (() => void) | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function getRangesFromSelection(selection: Selection | null): Range[] {
    if (!selection || selection.rangeCount === 0) {
      return []
    }

    const ranges: Range[] = []
    for (let i = 0; i < selection.rangeCount; i++) {
      ranges.push(selection.getRangeAt(i).cloneRange())
    }
    return ranges
  }

  function getRectsFromRanges(ranges: Range[]): DOMRect[] {
    const rects: DOMRect[] = []
    for (const range of ranges) {
      const rangeRects = range.getClientRects()
      for (let i = 0; i < rangeRects.length; i++) {
        rects.push(rangeRects[i])
      }
    }
    return rects
  }

  function handleSelectionChange() {
    const selection = window.getSelection()

    if (!selection) {
      return
    }

    const text = selection.toString()
    const isCollapsed = selection.isCollapsed
    const ranges = getRangesFromSelection(selection)
    const rects = getRectsFromRanges(ranges)

    const prevText = state.text
    state = { text, rects, ranges, isCollapsed }
    notify()

    if (text && text !== prevText) {
      onSelect?.(state)
    }
    else if (!text && prevText) {
      onClear?.()
    }
  }

  function startListening() {
    if (typeof document === 'undefined' || cleanup) {
      return
    }

    document.addEventListener('selectionchange', handleSelectionChange)

    cleanup = () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }

  function stopListening() {
    cleanup?.()
    cleanup = null
  }

  function getText(): string {
    return state.text
  }

  function clear() {
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }

  function selectAll(element?: Element) {
    const selection = window.getSelection()
    if (!selection)
      return

    const range = document.createRange()

    if (element) {
      range.selectNodeContents(element)
    }
    else {
      range.selectNodeContents(document.body)
    }

    selection.removeAllRanges()
    selection.addRange(range)
  }

  function getRects(): DOMRect[] {
    return state.rects
  }

  // Start listening
  if (typeof document !== 'undefined') {
    startListening()
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state)
      return () => {
        subscribers.delete(fn)
        if (subscribers.size === 0) {
          stopListening()
        }
      }
    },
    getText,
    clear,
    selectAll,
    getRects,
  }
}

/**
 * Track text selection within a specific element
 *
 * @example
 * ```ts
 * const selection = useElementTextSelection(editorRef)
 *
 * selection.subscribe((text) => {
 *   console.log('Selected in editor:', text)
 * })
 * ```
 */
export function useElementTextSelection(element: Element | null) {
  const selection = useTextSelection()
  const subscribers = new Set<(text: string) => void>()

  let elementText = ''

  selection.subscribe((state) => {
    if (!element || !state.text) {
      if (elementText) {
        elementText = ''
        subscribers.forEach(fn => fn(''))
      }
      return
    }

    // Check if selection is within the element
    const selectionObj = window.getSelection()
    if (!selectionObj || selectionObj.rangeCount === 0) {
      return
    }

    const range = selectionObj.getRangeAt(0)
    if (element.contains(range.commonAncestorContainer)) {
      elementText = state.text
      subscribers.forEach(fn => fn(state.text))
    }
    else if (elementText) {
      elementText = ''
      subscribers.forEach(fn => fn(''))
    }
  })

  return {
    get: () => elementText,
    subscribe: (fn: (text: string) => void) => {
      subscribers.add(fn)
      fn(elementText)
      return () => {
        subscribers.delete(fn)
      }
    },
    clear: selection.clear,
    selectAll: () => element && selection.selectAll(element),
  }
}

/**
 * Create a selection popup that appears when text is selected
 *
 * @example
 * ```ts
 * const popup = useSelectionPopup({
 *   onShow: (text, position) => {
 *     showPopup(position.x, position.y, text)
 *   },
 *   onHide: () => {
 *     hidePopup()
 *   }
 * })
 * ```
 */
export function useSelectionPopup(options: {
  onShow?: (text: string, position: { x: number, y: number }) => void
  onHide?: () => void
  minLength?: number
}) {
  const { onShow, onHide, minLength = 1 } = options

  let isShowing = false

  const selection = useTextSelection({
    onSelect: (state) => {
      if (state.text.length >= minLength && state.rects.length > 0) {
        // Get position from last rect (end of selection)
        const lastRect = state.rects[state.rects.length - 1]
        const position = {
          x: lastRect.left + lastRect.width / 2,
          y: lastRect.top - 10,
        }
        isShowing = true
        onShow?.(state.text, position)
      }
    },
    onClear: () => {
      if (isShowing) {
        isShowing = false
        onHide?.()
      }
    },
  })

  return {
    get: selection.get,
    subscribe: selection.subscribe,
    isShowing: () => isShowing,
  }
}

/**
 * Copy selected text to clipboard with custom formatting
 *
 * @example
 * ```ts
 * const copy = useCopySelection()
 *
 * // Copy with markdown formatting
 * copy.copyAsMarkdown()
 *
 * // Copy with custom prefix
 * copy.copyWithPrefix('> ')
 * ```
 */
export function useCopySelection() {
  const selection = useTextSelection()

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      return false
    }
  }

  async function copy(): Promise<boolean> {
    const text = selection.getText()
    if (!text)
      return false
    return copyToClipboard(text)
  }

  async function copyAsMarkdown(): Promise<boolean> {
    const text = selection.getText()
    if (!text)
      return false

    // Simple markdown quote
    const markdown = text.split('\n').map(line => `> ${line}`).join('\n')
    return copyToClipboard(markdown)
  }

  async function copyWithPrefix(prefix: string): Promise<boolean> {
    const text = selection.getText()
    if (!text)
      return false

    return copyToClipboard(prefix + text)
  }

  async function copyWithWrapper(start: string, end: string): Promise<boolean> {
    const text = selection.getText()
    if (!text)
      return false

    return copyToClipboard(start + text + end)
  }

  return {
    get: selection.get,
    subscribe: selection.subscribe,
    copy,
    copyAsMarkdown,
    copyWithPrefix,
    copyWithWrapper,
    getText: selection.getText,
    clear: selection.clear,
  }
}
