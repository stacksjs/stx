/**
 * Mutation Observer Composables
 *
 * Reactive utilities for observing DOM mutations.
 */

export interface MutationObserverState {
  isSupported: boolean
  isObserving: boolean
  mutations: MutationRecord[]
}

export interface MutationObserverOptions {
  /**
   * Watch for attribute changes
   * @default true
   */
  attributes?: boolean
  /**
   * List of attribute names to monitor
   */
  attributeFilter?: string[]
  /**
   * Record old attribute values
   * @default false
   */
  attributeOldValue?: boolean
  /**
   * Watch for text content changes
   * @default true
   */
  characterData?: boolean
  /**
   * Record old character data
   * @default false
   */
  characterDataOldValue?: boolean
  /**
   * Watch for child node changes
   * @default true
   */
  childList?: boolean
  /**
   * Watch descendants too
   * @default true
   */
  subtree?: boolean
  /**
   * Callback when mutations occur
   */
  onMutate?: (mutations: MutationRecord[]) => void
}

export interface MutationObserverRef {
  get: () => MutationObserverState
  subscribe: (fn: (state: MutationObserverState) => void) => () => void
  observe: (target: Element | null) => void
  disconnect: () => void
  takeRecords: () => MutationRecord[]
  isSupported: () => boolean
}

/**
 * Check if MutationObserver is supported
 */
export function isMutationObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'MutationObserver' in window
}

/**
 * Create a reactive mutation observer
 *
 * @example
 * ```ts
 * const observer = useMutationObserver({
 *   attributes: true,
 *   childList: true,
 *   onMutate: (mutations) => {
 *     mutations.forEach(m => console.log('Mutation:', m.type))
 *   }
 * })
 *
 * // Start observing an element
 * observer.observe(document.getElementById('my-element'))
 *
 * // Subscribe to state changes
 * observer.subscribe((state) => {
 *   console.log('Latest mutations:', state.mutations)
 * })
 *
 * // Stop observing
 * observer.disconnect()
 * ```
 */
export function useMutationObserver(
  options: MutationObserverOptions = {},
): MutationObserverRef {
  const supported = isMutationObserverSupported()
  const subscribers = new Set<(state: MutationObserverState) => void>()

  const {
    attributes = true,
    attributeFilter,
    attributeOldValue = false,
    characterData = true,
    characterDataOldValue = false,
    childList = true,
    subtree = true,
    onMutate,
  } = options

  let state: MutationObserverState = {
    isSupported: supported,
    isObserving: false,
    mutations: [],
  }

  let observer: MutationObserver | null = null
  let currentTarget: Element | null = null

  function notify() {
    subscribers.forEach(fn => fn(state))
  }

  function handleMutations(mutations: MutationRecord[]) {
    state = { ...state, mutations }
    notify()
    onMutate?.(mutations)
  }

  function observe(target: Element | null) {
    if (!supported || !target)
      return

    // Disconnect any existing observation
    disconnect()

    observer = new MutationObserver(handleMutations)

    const observerOptions: MutationObserverInit = {
      attributes,
      attributeOldValue,
      characterData,
      characterDataOldValue,
      childList,
      subtree,
    }

    if (attributeFilter) {
      observerOptions.attributeFilter = attributeFilter
    }

    observer.observe(target, observerOptions)
    currentTarget = target
    state = { ...state, isObserving: true }
    notify()
  }

  function disconnect() {
    if (observer) {
      observer.disconnect()
      observer = null
      currentTarget = null
      state = { ...state, isObserving: false, mutations: [] }
      notify()
    }
  }

  function takeRecords(): MutationRecord[] {
    if (observer) {
      return observer.takeRecords()
    }
    return []
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(state)
      return () => {
        subscribers.delete(fn)
        if (subscribers.size === 0) {
          disconnect()
        }
      }
    },
    observe,
    disconnect,
    takeRecords,
    isSupported: () => supported,
  }
}

/**
 * Watch for attribute changes on an element
 *
 * @example
 * ```ts
 * useAttributeObserver(
 *   document.getElementById('my-element'),
 *   ['class', 'data-state'],
 *   (attr, oldValue, newValue) => {
 *     console.log(`${attr} changed from ${oldValue} to ${newValue}`)
 *   }
 * )
 * ```
 */
export function useAttributeObserver(
  target: Element | null,
  attributeNames: string[],
  callback: (attributeName: string, oldValue: string | null, newValue: string | null) => void,
): () => void {
  if (!target || !isMutationObserverSupported()) {
    return () => {}
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName) {
        const newValue = (mutation.target as Element).getAttribute(mutation.attributeName)
        callback(mutation.attributeName, mutation.oldValue, newValue)
      }
    }
  })

  observer.observe(target, {
    attributes: true,
    attributeFilter: attributeNames,
    attributeOldValue: true,
  })

  return () => observer.disconnect()
}

/**
 * Watch for child node changes
 *
 * @example
 * ```ts
 * useChildListObserver(
 *   document.getElementById('container'),
 *   (added, removed) => {
 *     console.log('Added:', added.length, 'Removed:', removed.length)
 *   }
 * )
 * ```
 */
export function useChildListObserver(
  target: Element | null,
  callback: (added: Node[], removed: Node[]) => void,
  options: { subtree?: boolean } = {},
): () => void {
  if (!target || !isMutationObserverSupported()) {
    return () => {}
  }

  const observer = new MutationObserver((mutations) => {
    const added: Node[] = []
    const removed: Node[] = []

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        added.push(...Array.from(mutation.addedNodes))
        removed.push(...Array.from(mutation.removedNodes))
      }
    }

    if (added.length > 0 || removed.length > 0) {
      callback(added, removed)
    }
  })

  observer.observe(target, {
    childList: true,
    subtree: options.subtree ?? false,
  })

  return () => observer.disconnect()
}

/**
 * Watch for text content changes
 *
 * @example
 * ```ts
 * useTextObserver(
 *   document.getElementById('editable'),
 *   (oldText, newText) => {
 *     console.log(`Text changed from "${oldText}" to "${newText}"`)
 *   }
 * )
 * ```
 */
export function useTextObserver(
  target: Element | null,
  callback: (oldText: string | null, newText: string) => void,
): () => void {
  if (!target || !isMutationObserverSupported()) {
    return () => {}
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        callback(mutation.oldValue, (mutation.target as Text).textContent || '')
      }
    }
  })

  observer.observe(target, {
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
  })

  return () => observer.disconnect()
}
