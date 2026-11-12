/**
 * A split layout in the DOM.
 *
 * The panes are whatever elements the host put inside the root. This puts a
 * separator between each pair, sizes the panes with flex-grow (so the browser
 * keeps the proportions when the container changes size, with no script), and
 * turns a drag or a key on a separator into a new layout.
 */
import type { PaneLimit, SplitDirection } from './core'
import { dividerRange, fitSizes, normalizeSizes, parseLength, parseSizes, resizeAt, separatorValue, serializeSizes, storageName } from './core'

export interface SplitPaneOptions {
  direction?: SplitDirection
  /** The starting layout, one number per pane. Any positive numbers; they are shares. */
  sizes?: number[] | null
  /** The least a pane can be, in pixels, unless the pane says otherwise. */
  minSize?: number
  /** A name to keep the layout under in local storage. Empty for none. */
  storageKey?: string
  /** Pixels an arrow key moves a separator. Shift moves five times as far. */
  step?: number
  /** The accessible name of a separator. */
  label?: string
}

export interface SplitResizeDetail {
  /** The layout, as fractions that add up to one. */
  sizes: number[]
  /** The same in pixels. */
  pixels: number[]
  /** The separator that moved, or -1 when the layout was set from outside. */
  index: number
  source: 'pointer' | 'keyboard' | 'reset' | 'api'
}

export interface SplitPaneCallbacks {
  onResize?: (detail: SplitResizeDetail) => void
  onResizeEnd?: (detail: SplitResizeDetail) => void
}

const SEPARATOR = 'data-split-separator'

export class SplitPaneView {
  private direction: SplitDirection
  private panes: HTMLElement[] = []
  private separators: HTMLElement[] = []
  private sizes: number[] = []
  private initial: number[] = []
  private limits: PaneLimit[] = []
  private minSize: number
  private step: number
  private label: string
  private storageKey: string
  private observer: ResizeObserver | null = null
  private drag: { index: number, start: number, sizes: number[], pointer: number } | null = null
  private readonly disposers: Array<() => void> = []

  constructor(private readonly root: HTMLElement, options: SplitPaneOptions = {}, private readonly callbacks: SplitPaneCallbacks = {}) {
    this.direction = options.direction === 'vertical' ? 'vertical' : 'horizontal'
    this.minSize = options.minSize ?? 48
    this.step = options.step ?? 16
    this.label = options.label || 'Resize panes'
    this.storageKey = options.storageKey || ''

    this.collect()
    this.initial = this.startingSizes(options.sizes)
    this.sizes = normalizeSizes(this.stored() ?? this.initial, this.panes.length)
    this.build()
    this.apply(false)

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.apply(false))
      this.observer.observe(this.root)
    }
    this.root.setAttribute('data-split-ready', '')
  }

  /** The layout, as fractions that add up to one. */
  getSizes(): number[] {
    return [...this.sizes]
  }

  /** Set the layout. Sizes are shares: `[1, 2]` is a third and two thirds. */
  setSizes(sizes: readonly number[] | null | undefined): void {
    if (!sizes || sizes.length !== this.panes.length)
      return
    this.sizes = normalizeSizes(sizes, this.panes.length)
    this.apply(true)
    this.report(-1, 'api', true)
  }

  /** Back to the layout it started with, forgetting a stored one. */
  reset(index = -1): void {
    this.sizes = [...this.initial]
    this.apply(true)
    this.report(index, 'reset', true)
  }

  setDirection(direction: SplitDirection): void {
    const next = direction === 'vertical' ? 'vertical' : 'horizontal'
    if (next === this.direction)
      return
    this.direction = next
    this.root.setAttribute('data-direction', next)
    for (const separator of this.separators)
      separator.setAttribute('aria-orientation', next === 'horizontal' ? 'vertical' : 'horizontal')
    this.apply(false)
  }

  destroy(): void {
    this.observer?.disconnect()
    for (const dispose of this.disposers) dispose()
    for (const separator of this.separators) separator.remove()
    for (const pane of this.panes) {
      pane.style.removeProperty('flex')
      pane.removeAttribute('data-split-pane')
    }
    this.root.removeAttribute('data-split-ready')
  }

  /** The length of the container along the split, without the separators. */
  private available(): number {
    const box = this.root.getBoundingClientRect()
    const length = this.direction === 'horizontal' ? box.width : box.height
    let taken = 0
    for (const separator of this.separators) {
      const size = separator.getBoundingClientRect()
      taken += this.direction === 'horizontal' ? size.width : size.height
    }
    return Math.max(0, length - taken)
  }

  private collect(): void {
    this.panes = Array.from(this.root.children).filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute(SEPARATOR))
    this.limits = this.panes.map(pane => ({
      min: parseLength(pane.getAttribute('data-min-size'), this.minSize),
      max: parseLength(pane.getAttribute('data-max-size'), Number.POSITIVE_INFINITY),
    }))
  }

  /** A pane can name its own share with `data-size`; the rest come from the prop. */
  private startingSizes(sizes: number[] | null | undefined): number[] {
    const own = this.panes.map(pane => Number.parseFloat(pane.getAttribute('data-size') || ''))
    const fromPanes = own.every(size => Number.isFinite(size) && size > 0) ? own : null
    return normalizeSizes(sizes && sizes.length === this.panes.length ? sizes : fromPanes, this.panes.length)
  }

  private stored(): number[] | null {
    if (!this.storageKey)
      return null
    try {
      const sizes = parseSizes(localStorage.getItem(storageName(this.storageKey)))
      return sizes && sizes.length === this.panes.length ? sizes : null
    }
    catch {
      // Storage can be switched off, and a layout that is not kept still works.
      return null
    }
  }

  private store(): void {
    if (!this.storageKey)
      return
    try {
      localStorage.setItem(storageName(this.storageKey), serializeSizes(this.sizes))
    }
    catch {}
  }

  private build(): void {
    const prefix = this.root.id || `split-${Math.random().toString(36).slice(2, 8)}`
    this.panes.forEach((pane, index) => {
      pane.setAttribute('data-split-pane', '')
      if (!pane.id)
        pane.id = `${prefix}-pane-${index}`
      if (index === this.panes.length - 1)
        return

      const separator = document.createElement('div')
      separator.setAttribute(SEPARATOR, '')
      separator.setAttribute('role', 'separator')
      separator.setAttribute('tabindex', '0')
      separator.setAttribute('aria-orientation', this.direction === 'horizontal' ? 'vertical' : 'horizontal')
      separator.setAttribute('aria-controls', pane.id)
      separator.setAttribute('aria-label', this.panes.length > 2 ? `${this.label} ${index + 1} and ${index + 2}` : this.label)
      separator.className = 'stx-split-separator'
      pane.after(separator)
      this.separators.push(separator)

      const listen = <K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void): void => {
        separator.addEventListener(type, handler)
        this.disposers.push(() => separator.removeEventListener(type, handler))
      }
      listen('pointerdown', event => this.onPointerDown(event, index))
      listen('pointermove', event => this.onPointerMove(event))
      listen('pointerup', event => this.onPointerEnd(event))
      listen('pointercancel', event => this.onPointerEnd(event))
      listen('dblclick', () => this.reset(index))
      listen('keydown', event => this.onKeyDown(event, index))
    })
  }

  /** Write the layout to the panes. `fit` brings it inside the limits first. */
  private apply(persist: boolean): void {
    const total = this.available()
    if (total > 0)
      this.sizes = fitSizes(this.sizes, total, this.limits)

    this.panes.forEach((pane, index) => {
      // The share as the grow factor, from a basis of nothing: the browser then
      // divides whatever length there is in these proportions by itself.
      pane.style.flex = `${(this.sizes[index] * 1000).toFixed(3)} 1 0px`
    })
    this.separators.forEach((separator, index) => {
      const value = separatorValue(this.sizes, index, total, this.limits)
      separator.setAttribute('aria-valuenow', String(value.now))
      separator.setAttribute('aria-valuemin', String(value.min))
      separator.setAttribute('aria-valuemax', String(value.max))
    })
    if (persist)
      this.store()
  }

  private report(index: number, source: SplitResizeDetail['source'], end: boolean): void {
    const total = this.available()
    const detail: SplitResizeDetail = { sizes: [...this.sizes], pixels: this.sizes.map(size => Math.round(size * total)), index, source }
    this.callbacks.onResize?.(detail)
    if (end)
      this.callbacks.onResizeEnd?.(detail)
  }

  private position(event: PointerEvent): number {
    return this.direction === 'horizontal' ? event.clientX : event.clientY
  }

  private onPointerDown(event: PointerEvent, index: number): void {
    if (event.button !== 0)
      return
    event.preventDefault()
    const separator = this.separators[index]
    // Captured, so the drag keeps going over an iframe or outside the window.
    try {
      separator.setPointerCapture(event.pointerId)
    }
    catch {}
    this.drag = { index, start: this.position(event), sizes: [...this.sizes], pointer: event.pointerId }
    this.root.setAttribute('data-dragging', '')
    separator.setAttribute('data-active', '')
  }

  private onPointerMove(event: PointerEvent): void {
    const drag = this.drag
    if (!drag || event.pointerId !== drag.pointer)
      return
    // Always from where the drag began, so a pointer that overshoots a limit
    // and comes back picks the divider up where it left it.
    this.sizes = resizeAt(drag.sizes, drag.index, this.position(event) - drag.start, this.available(), this.limits)
    this.apply(false)
    this.report(drag.index, 'pointer', false)
  }

  private onPointerEnd(event: PointerEvent): void {
    const drag = this.drag
    if (!drag || event.pointerId !== drag.pointer)
      return
    this.drag = null
    this.root.removeAttribute('data-dragging')
    this.separators[drag.index].removeAttribute('data-active')
    try {
      this.separators[drag.index].releasePointerCapture(event.pointerId)
    }
    catch {}
    this.store()
    this.report(drag.index, 'pointer', true)
  }

  private onKeyDown(event: KeyboardEvent, index: number): void {
    const horizontal = this.direction === 'horizontal'
    const total = this.available()
    const stride = this.step * (event.shiftKey ? 5 : 1)
    let delta = 0

    if (event.key === (horizontal ? 'ArrowLeft' : 'ArrowUp'))
      delta = -stride
    else if (event.key === (horizontal ? 'ArrowRight' : 'ArrowDown'))
      delta = stride
    else if (event.key === 'Home')
      delta = -dividerRange(this.sizes, index, total, this.limits).back
    else if (event.key === 'End')
      delta = dividerRange(this.sizes, index, total, this.limits).forward
    else if (event.key === 'Enter') {
      event.preventDefault()
      this.reset(index)
      return
    }
    else {
      return
    }

    event.preventDefault()
    this.sizes = resizeAt(this.sizes, index, delta, total, this.limits)
    this.apply(true)
    this.report(index, 'keyboard', true)
  }
}
