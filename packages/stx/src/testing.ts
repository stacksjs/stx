/**
 * STX Testing Utilities
 *
 * Provides utilities for testing STX components and templates.
 *
 * @module testing
 *
 * @example
 * ```typescript
 * import { mount, render, fireEvent } from 'stx/testing'
 *
 * describe('MyComponent', () => {
 *   it('renders correctly', async () => {
 *     const wrapper = await mount('<MyComponent title="Hello" />')
 *     expect(wrapper.text()).toContain('Hello')
 *   })
 *
 *   it('handles click events', async () => {
 *     const wrapper = await mount('<Button @click="onClick">Click me</Button>')
 *     await fireEvent.click(wrapper.find('button'))
 *     expect(wrapper.emitted('click')).toHaveLength(1)
 *   })
 * })
 * ```
 */

import type { StxOptions } from './types'
import { processDirectives } from './process'

// =============================================================================
// Types
// =============================================================================

/** Mount options */
export interface MountOptions {
  /** Props to pass to the component */
  props?: Record<string, unknown>
  /** Slots content */
  slots?: Record<string, string>
  /** Global context/variables */
  context?: Record<string, unknown>
  /** STX options */
  stxOptions?: Partial<StxOptions>
  /** Whether to attach to document */
  attachTo?: HTMLElement | string
  /** Mock functions/modules */
  mocks?: Record<string, unknown>
  /** Stub components */
  stubs?: Record<string, string | boolean>
  /** Global plugins */
  plugins?: unknown[]
}

/** Render result */
export interface RenderResult {
  /** Rendered HTML string */
  html: string
  /** Parsed document */
  document: Document
  /** Container element */
  container: HTMLElement
  /** Context used during rendering */
  context: Record<string, unknown>
  /** Dependencies tracked */
  dependencies: Set<string>
}

/** Wrapper for mounted component */
export interface ComponentWrapper {
  /** Get the root element */
  element: HTMLElement
  /** Get rendered HTML */
  html(): string
  /** Get text content */
  text(): string
  /** Find element by selector */
  find<T extends HTMLElement = HTMLElement>(selector: string): ElementWrapper<T> | null
  /** Find all elements by selector */
  findAll<T extends HTMLElement = HTMLElement>(selector: string): ElementWrapper<T>[]
  /** Find component by name */
  findComponent(name: string): ComponentWrapper | null
  /** Find all components by name */
  findAllComponents(name: string): ComponentWrapper[]
  /** Check if element exists */
  exists(): boolean
  /** Check if element is visible */
  isVisible(): boolean
  /** Get attributes */
  attributes(): Record<string, string>
  /** Get specific attribute */
  attributes(name: string): string | null
  /** Get classes */
  classes(): string[]
  /** Check if has class */
  classes(name: string): boolean
  /** Get props */
  props(): Record<string, unknown>
  /** Get specific prop */
  props<T = unknown>(name: string): T | undefined
  /** Get emitted events */
  emitted(): Record<string, unknown[][]>
  /** Get specific emitted event */
  emitted(event: string): unknown[][] | undefined
  /** Set props and re-render */
  setProps(props: Record<string, unknown>): Promise<void>
  /** Set data/state */
  setData(data: Record<string, unknown>): Promise<void>
  /** Trigger an event */
  trigger(event: string, payload?: unknown): Promise<void>
  /** Get value (for inputs) */
  getValue(): string | boolean | string[]
  /** Set value (for inputs) */
  setValue(value: string | boolean): Promise<void>
  /** Unmount the component */
  unmount(): void
  /** Wait for updates */
  vm: {
    $nextTick(): Promise<void>
  }
}

/** Wrapper for DOM elements */
export interface ElementWrapper<T extends HTMLElement = HTMLElement> {
  /** The underlying element */
  element: T
  /** Get HTML */
  html(): string
  /** Get text */
  text(): string
  /** Find child element */
  find<E extends HTMLElement = HTMLElement>(selector: string): ElementWrapper<E> | null
  /** Find all children */
  findAll<E extends HTMLElement = HTMLElement>(selector: string): ElementWrapper<E>[]
  /** Check if exists */
  exists(): boolean
  /** Check if visible */
  isVisible(): boolean
  /** Get attributes */
  attributes(): Record<string, string>
  attributes(name: string): string | null
  /** Get classes */
  classes(): string[]
  classes(name: string): boolean
  /** Trigger event */
  trigger(event: string, payload?: unknown): Promise<void>
  /** Get value */
  getValue(): string | boolean | string[]
  /** Set value */
  setValue(value: string | boolean): Promise<void>
}

/** Fire event options */
export interface FireEventOptions {
  /** Event bubbles */
  bubbles?: boolean
  /** Event is cancelable */
  cancelable?: boolean
  /** Custom event detail */
  detail?: unknown
}

// =============================================================================
// Render Function
// =============================================================================

/**
 * Render an STX template to HTML.
 *
 * @example
 * ```typescript
 * const { html, container } = await render('<h1>{{ title }}</h1>', {
 *   context: { title: 'Hello World' }
 * })
 * expect(html).toContain('Hello World')
 * ```
 */
export async function render(
  template: string,
  options: MountOptions = {},
): Promise<RenderResult> {
  const context: Record<string, unknown> = {
    ...options.context,
    props: options.props || {},
  }

  // Add mocks to context
  if (options.mocks) {
    Object.assign(context, options.mocks)
  }

  // Process slots
  if (options.slots) {
    context.__slots__ = options.slots
  }

  const dependencies = new Set<string>()

  const stxOptions: StxOptions = {
    debug: false,
    ...options.stxOptions,
  } as StxOptions

  // Process the template
  const html = await processDirectives(
    template,
    context,
    'test.stx',
    stxOptions,
    dependencies,
  )

  // Create DOM
  const parser = new DOMParser()
  const document = parser.parseFromString(html, 'text/html')
  const container = document.body

  return {
    html,
    document,
    container,
    context,
    dependencies,
  }
}

// =============================================================================
// Mount Function
// =============================================================================

/**
 * Mount an STX component for testing.
 *
 * @example
 * ```typescript
 * const wrapper = await mount('<Button @click="handleClick">Click me</Button>', {
 *   props: { disabled: false },
 *   context: { handleClick: vi.fn() }
 * })
 *
 * await wrapper.find('button')?.trigger('click')
 * expect(wrapper.emitted('click')).toBeDefined()
 * ```
 */
export async function mount(
  template: string,
  options: MountOptions = {},
): Promise<ComponentWrapper> {
  const emittedEvents: Record<string, unknown[][]> = {}
  let currentProps = { ...options.props }
  let currentData: Record<string, unknown> = {}

  // Create event capture function
  const captureEvent = (event: string, payload: unknown) => {
    if (!emittedEvents[event]) {
      emittedEvents[event] = []
    }
    emittedEvents[event].push([payload])
  }

  // Enhanced context with event capture
  const context: Record<string, unknown> = {
    ...options.context,
    props: currentProps,
    $emit: captureEvent,
  }

  const dependencies = new Set<string>()

  const stxOptions: StxOptions = {
    debug: false,
    ...options.stxOptions,
  } as StxOptions

  // Process template
  let html = await processDirectives(
    template,
    context,
    'test.stx',
    stxOptions,
    dependencies,
  )

  // Create container
  let container: HTMLElement

  if (options.attachTo) {
    container = typeof options.attachTo === 'string'
      ? document.querySelector(options.attachTo) || document.createElement('div')
      : options.attachTo
  } else {
    container = document.createElement('div')
    container.id = `stx-test-${Date.now()}`
  }

  container.innerHTML = html

  // Helper to re-render
  const rerender = async () => {
    context.props = currentProps
    Object.assign(context, currentData)

    html = await processDirectives(
      template,
      context,
      'test.stx',
      stxOptions,
      dependencies,
    )
    container.innerHTML = html
  }

  // Create element wrapper
  const createElementWrapper = <T extends HTMLElement>(el: T): ElementWrapper<T> => ({
    element: el,
    html: () => el.innerHTML,
    text: () => el.textContent || '',
    find: <E extends HTMLElement>(selector: string) => {
      const found = el.querySelector<E>(selector)
      return found ? createElementWrapper(found) : null
    },
    findAll: <E extends HTMLElement>(selector: string) => {
      return Array.from(el.querySelectorAll<E>(selector)).map(createElementWrapper)
    },
    exists: () => document.body.contains(el),
    isVisible: () => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
    },
    attributes: ((name?: string) => {
      if (name) {
        return el.getAttribute(name)
      }
      const attrs: Record<string, string> = {}
      for (const attr of el.attributes) {
        attrs[attr.name] = attr.value
      }
      return attrs
    }) as ElementWrapper<T>['attributes'],
    classes: ((name?: string) => {
      if (name) {
        return el.classList.contains(name)
      }
      return Array.from(el.classList)
    }) as ElementWrapper<T>['classes'],
    trigger: async (event: string, payload?: unknown) => {
      const evt = new CustomEvent(event, {
        bubbles: true,
        cancelable: true,
        detail: payload,
      })
      el.dispatchEvent(evt)
      captureEvent(event, payload)
      await nextTick()
    },
    getValue: () => {
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') return el.checked
        if (el.type === 'radio') return el.checked
        return el.value
      }
      if (el instanceof HTMLSelectElement) {
        if (el.multiple) {
          return Array.from(el.selectedOptions).map(o => o.value)
        }
        return el.value
      }
      if (el instanceof HTMLTextAreaElement) {
        return el.value
      }
      return ''
    },
    setValue: async (value: string | boolean) => {
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = value as boolean
        } else {
          el.value = value as string
        }
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      } else if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        el.value = value as string
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
      await nextTick()
    },
  })

  // Create component wrapper
  const wrapper: ComponentWrapper = {
    element: container.firstElementChild as HTMLElement || container,

    html: () => container.innerHTML,

    text: () => container.textContent || '',

    find: <T extends HTMLElement>(selector: string) => {
      const el = container.querySelector<T>(selector)
      return el ? createElementWrapper(el) : null
    },

    findAll: <T extends HTMLElement>(selector: string) => {
      return Array.from(container.querySelectorAll<T>(selector)).map(createElementWrapper)
    },

    findComponent: (name: string) => {
      const el = container.querySelector(`[data-component="${name}"], ${name.toLowerCase()}, ${toKebabCase(name)}`)
      if (el) {
        // Return a simplified wrapper for the component
        return wrapper // For now, return the main wrapper
      }
      return null
    },

    findAllComponents: (name: string) => {
      const els = container.querySelectorAll(`[data-component="${name}"], ${name.toLowerCase()}, ${toKebabCase(name)}`)
      return Array.from(els).map(() => wrapper) // Simplified
    },

    exists: () => container.children.length > 0,

    isVisible: () => {
      const el = container.firstElementChild as HTMLElement
      if (!el) return false
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    },

    attributes: ((name?: string) => {
      const el = container.firstElementChild
      if (!el) return name ? null : {}
      if (name) {
        return el.getAttribute(name)
      }
      const attrs: Record<string, string> = {}
      for (const attr of el.attributes) {
        attrs[attr.name] = attr.value
      }
      return attrs
    }) as ComponentWrapper['attributes'],

    classes: ((name?: string) => {
      const el = container.firstElementChild
      if (!el) return name ? false : []
      if (name) {
        return el.classList.contains(name)
      }
      return Array.from(el.classList)
    }) as ComponentWrapper['classes'],

    props: ((name?: string) => {
      if (name) {
        return currentProps[name]
      }
      return { ...currentProps }
    }) as ComponentWrapper['props'],

    emitted: ((event?: string) => {
      if (event) {
        return emittedEvents[event]
      }
      return { ...emittedEvents }
    }) as ComponentWrapper['emitted'],

    setProps: async (props: Record<string, unknown>) => {
      currentProps = { ...currentProps, ...props }
      await rerender()
    },

    setData: async (data: Record<string, unknown>) => {
      currentData = { ...currentData, ...data }
      await rerender()
    },

    trigger: async (event: string, payload?: unknown) => {
      const el = container.firstElementChild as HTMLElement
      if (el) {
        const evt = new CustomEvent(event, {
          bubbles: true,
          cancelable: true,
          detail: payload,
        })
        el.dispatchEvent(evt)
        captureEvent(event, payload)
      }
      await nextTick()
    },

    getValue: () => {
      const el = container.querySelector('input, select, textarea')
      if (el) {
        return createElementWrapper(el as HTMLElement).getValue()
      }
      return ''
    },

    setValue: async (value: string | boolean) => {
      const el = container.querySelector('input, select, textarea')
      if (el) {
        await createElementWrapper(el as HTMLElement).setValue(value)
      }
    },

    unmount: () => {
      container.innerHTML = ''
      if (container.parentElement) {
        container.parentElement.removeChild(container)
      }
    },

    vm: {
      $nextTick: nextTick,
    },
  }

  return wrapper
}

// =============================================================================
// Fire Event Utilities
// =============================================================================

/**
 * Fire events on elements.
 */
export const fireEvent = {
  /**
   * Fire a click event.
   */
  async click(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    options?: MouseEventInit,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ...options,
    })
    el.dispatchEvent(event)
    await nextTick()
  },

  /**
   * Fire a double click event.
   */
  async dblClick(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    options?: MouseEventInit,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    const event = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      ...options,
    })
    el.dispatchEvent(event)
    await nextTick()
  },

  /**
   * Fire an input event.
   */
  async input(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    value: string,
  ): Promise<void> {
    const el = getElement(target) as HTMLInputElement | HTMLTextAreaElement | null
    if (!el) return

    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
  },

  /**
   * Fire a change event.
   */
  async change(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    value?: string,
  ): Promise<void> {
    const el = getElement(target) as HTMLInputElement | HTMLSelectElement | null
    if (!el) return

    if (value !== undefined) {
      el.value = value
    }
    el.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
  },

  /**
   * Fire a submit event.
   */
  async submit(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    const event = new Event('submit', { bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    await nextTick()
  },

  /**
   * Fire a focus event.
   */
  async focus(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    el.focus()
    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    await nextTick()
  },

  /**
   * Fire a blur event.
   */
  async blur(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    el.blur()
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    await nextTick()
  },

  /**
   * Fire a keydown event.
   */
  async keyDown(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    key: string,
    options?: KeyboardEventInit,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
      ...options,
    })
    el.dispatchEvent(event)
    await nextTick()
  },

  /**
   * Fire a keyup event.
   */
  async keyUp(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    key: string,
    options?: KeyboardEventInit,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    const event = new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
      key,
      ...options,
    })
    el.dispatchEvent(event)
    await nextTick()
  },

  /**
   * Fire a custom event.
   */
  async custom(
    target: HTMLElement | ElementWrapper | ComponentWrapper | null,
    eventName: string,
    options?: FireEventOptions,
  ): Promise<void> {
    const el = getElement(target)
    if (!el) return

    const event = new CustomEvent(eventName, {
      bubbles: options?.bubbles ?? true,
      cancelable: options?.cancelable ?? true,
      detail: options?.detail,
    })
    el.dispatchEvent(event)
    await nextTick()
  },
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Create custom matchers for testing.
 */
export const matchers = {
  /**
   * Check if wrapper contains text.
   */
  toContainText(wrapper: ComponentWrapper | ElementWrapper, text: string): boolean {
    return wrapper.text().includes(text)
  },

  /**
   * Check if wrapper has class.
   */
  toHaveClass(wrapper: ComponentWrapper | ElementWrapper, className: string): boolean {
    return wrapper.classes(className) as boolean
  },

  /**
   * Check if wrapper has attribute.
   */
  toHaveAttribute(
    wrapper: ComponentWrapper | ElementWrapper,
    name: string,
    value?: string,
  ): boolean {
    const attr = wrapper.attributes(name) as string | null
    if (value !== undefined) {
      return attr === value
    }
    return attr !== null
  },

  /**
   * Check if wrapper is visible.
   */
  toBeVisible(wrapper: ComponentWrapper | ElementWrapper): boolean {
    return wrapper.isVisible()
  },

  /**
   * Check if wrapper exists.
   */
  toExist(wrapper: ComponentWrapper | ElementWrapper | null): boolean {
    return wrapper !== null && wrapper.exists()
  },

  /**
   * Check if event was emitted.
   */
  toHaveEmitted(wrapper: ComponentWrapper, event: string, times?: number): boolean {
    const emitted = wrapper.emitted(event)
    if (!emitted) return false
    if (times !== undefined) {
      return emitted.length === times
    }
    return emitted.length > 0
  },

  /**
   * Check if event was emitted with payload.
   */
  toHaveEmittedWith(wrapper: ComponentWrapper, event: string, payload: unknown): boolean {
    const emitted = wrapper.emitted(event)
    if (!emitted) return false
    return emitted.some((args) => JSON.stringify(args[0]) === JSON.stringify(payload))
  },
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Wait for the next tick.
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(resolve, 0)
    }
  })
}

/**
 * Wait for a condition to be true.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options
  const start = Date.now()

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return
    }
    await new Promise((r) => setTimeout(r, interval))
  }

  throw new Error(`waitFor timed out after ${timeout}ms`)
}

/**
 * Wait for element to appear.
 */
export async function waitForElement(
  wrapper: ComponentWrapper,
  selector: string,
  options: { timeout?: number } = {},
): Promise<ElementWrapper | null> {
  const { timeout = 1000 } = options

  await waitFor(() => wrapper.find(selector) !== null, { timeout })
  return wrapper.find(selector)
}

/**
 * Flush all pending promises.
 */
export async function flushPromises(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0))
  await nextTick()
}

/**
 * Create a mock function.
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>(): MockFn<T> {
  const calls: unknown[][] = []
  const results: unknown[] = []
  let implementation: T | undefined

  const fn = ((...args: unknown[]) => {
    calls.push(args)
    if (implementation) {
      const result = implementation(...args)
      results.push(result)
      return result
    }
    return undefined
  }) as MockFn<T>

  fn.mock = {
    calls,
    results,
  }

  fn.mockImplementation = (impl: T) => {
    implementation = impl
    return fn
  }

  fn.mockReturnValue = (value: unknown) => {
    implementation = (() => value) as T
    return fn
  }

  fn.mockClear = () => {
    calls.length = 0
    results.length = 0
    return fn
  }

  fn.mockReset = () => {
    calls.length = 0
    results.length = 0
    implementation = undefined
    return fn
  }

  return fn
}

/** Mock function type */
export interface MockFn<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined
  mock: {
    calls: unknown[][]
    results: unknown[]
  }
  mockImplementation(impl: T): MockFn<T>
  mockReturnValue(value: unknown): MockFn<T>
  mockClear(): MockFn<T>
  mockReset(): MockFn<T>
}

/** Mock store interface */
export interface MockStore<T extends Record<string, unknown>> {
  /** Get current state */
  getState(): T
  /** Update state */
  setState(partial: Partial<T>): void
  /** Reset to initial state */
  reset(): void
  /** Get state change history */
  getHistory(): T[]
  /** Subscribe to state changes */
  subscribe(listener: (state: T) => void): () => void
}

/**
 * Create a mock store for testing.
 *
 * @example
 * ```ts
 * const store = createMockStore({ count: 0, user: null })
 *
 * store.setState({ count: 5 })
 * expect(store.getState().count).toBe(5)
 *
 * // Check history
 * expect(store.getHistory()).toEqual([
 *   { count: 0, user: null },
 *   { count: 5, user: null }
 * ])
 *
 * // Reset
 * store.reset()
 * expect(store.getState().count).toBe(0)
 * ```
 */
export function createMockStore<T extends Record<string, unknown>>(initialState: T): MockStore<T> {
  const initial = { ...initialState }
  let state = { ...initialState }
  const history: T[] = [{ ...state }]
  const listeners = new Set<(state: T) => void>()

  const notify = () => {
    for (const listener of listeners) {
      listener({ ...state })
    }
  }

  return {
    getState(): T {
      return { ...state }
    },

    setState(partial: Partial<T>): void {
      state = { ...state, ...partial }
      history.push({ ...state })
      notify()
    },

    reset(): void {
      state = { ...initial }
      history.length = 0
      history.push({ ...state })
      notify()
    },

    getHistory(): T[] {
      return history.map(s => ({ ...s }))
    },

    subscribe(listener: (state: T) => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getElement(
  target: HTMLElement | ElementWrapper | ComponentWrapper | null,
): HTMLElement | null {
  if (!target) return null
  if (target instanceof HTMLElement) return target
  return target.element
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// =============================================================================
// Test Setup Helpers
// =============================================================================

/**
 * Create a test context with common setup.
 */
export function createTestContext(options: {
  props?: Record<string, unknown>
  context?: Record<string, unknown>
  mocks?: Record<string, unknown>
} = {}): {
  props: Record<string, unknown>
  context: Record<string, unknown>
  mocks: Record<string, MockFn>
} {
  return {
    props: options.props || {},
    context: options.context || {},
    mocks: Object.entries(options.mocks || {}).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'function' ? createMockFn() : value as MockFn
      return acc
    }, {} as Record<string, MockFn>),
  }
}

/**
 * Clean up after tests.
 */
export function cleanup(): void {
  // Remove all test containers
  document.querySelectorAll('[id^="stx-test-"]').forEach((el) => el.remove())
}
