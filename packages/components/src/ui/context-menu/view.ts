/**
 * A context menu in the DOM.
 *
 * One layer holds every open menu: the one that was asked for and any
 * submenus opened from it. Where the browser has a top layer (the popover
 * API) the layer goes there, so a menu is never clipped by an overflow or
 * mispositioned by a transformed ancestor. Focus is real focus, on the item,
 * which is what a screen reader follows; it goes back to where it came from
 * when the menu closes.
 */
import type { MenuBox, MenuItem, MenuPoint, ResolvedItem } from './core'
import { ariaShortcut, firstIndex, formatShortcut, hasSubmenu, isActionable, lastIndex, placeAtBox, placeAtPoint, placeSubmenu, resolveItems, stepIndex, typeAheadIndex } from './core'

export type MenuItemsSource = MenuItem[] | ((target: Element | null) => MenuItem[] | null | undefined)

export interface ContextMenuOptions {
  items?: MenuItemsSource | null
  /** The accessible name of the menu. */
  label?: string
  /** Off: a right click gets the browser's own menu. */
  disabled?: boolean
  /** Written as Mac shortcuts (`⌘C`) or not (`Ctrl+C`). Left out, the platform decides. */
  apple?: boolean
}

export interface MenuSelectDetail {
  item: MenuItem
  id: string
  /** Indexes from the top menu down to the item, counting the separators that are drawn. */
  path: number[]
  /** The element the menu was opened on. */
  target: Element | null
}

export interface MenuOpenDetail {
  x: number
  y: number
  target: Element | null
  keyboard: boolean
}

export type MenuCloseReason = 'select' | 'escape' | 'outside' | 'blur' | 'tab' | 'api'

export interface ContextMenuCallbacks {
  onSelect?: (detail: MenuSelectDetail) => void
  onOpen?: (detail: MenuOpenDetail) => void
  onClose?: (detail: { reason: MenuCloseReason }) => void
}

interface OpenMenu {
  element: HTMLElement
  items: ResolvedItem[]
  /** The item in the menu above that this one opened from. */
  opener: HTMLElement | null
}

const SUBMENU_DELAY = 160
const TYPE_AHEAD_RESET = 600

function detectApple(): boolean {
  const platform = typeof navigator === 'undefined' ? '' : (navigator.platform || navigator.userAgent || '')
  return /mac|iphone|ipad/i.test(platform)
}

let menuCounter = 0

export class ContextMenuView {
  private items: MenuItemsSource | null
  private label: string
  private disabled: boolean
  private readonly apple: boolean
  private readonly layer: HTMLElement
  private readonly uid = `stx-menu-${++menuCounter}`
  private stack: OpenMenu[] = []
  private target: Element | null = null
  private returnFocus: HTMLElement | null = null
  private hoverTimer: ReturnType<typeof setTimeout> | null = null
  private typed = ''
  private typedAt = 0
  private readonly disposers: Array<() => void> = []

  constructor(private readonly root: HTMLElement, options: ContextMenuOptions = {}, private readonly callbacks: ContextMenuCallbacks = {}) {
    this.items = options.items ?? null
    this.label = options.label || 'Context menu'
    this.disabled = Boolean(options.disabled)
    this.apple = options.apple ?? detectApple()

    this.layer = document.createElement('div')
    this.layer.className = 'stx-menu-layer'
    this.layer.setAttribute('data-menu-layer', '')
    // What the view writes here is the host's data, and never a template.
    ;(this.layer as HTMLElement & { __stx_inert_content?: boolean }).__stx_inert_content = true
    if ('popover' in HTMLElement.prototype)
      this.layer.setAttribute('popover', 'manual')
    else
      this.layer.hidden = true
    this.root.appendChild(this.layer)

    this.listen(this.root, 'contextmenu', event => this.onContextMenu(event as MouseEvent))
    this.listen(this.root, 'keydown', event => this.onHostKeyDown(event as KeyboardEvent))
    this.listen(this.layer, 'keydown', event => this.onMenuKeyDown(event as KeyboardEvent))
    this.listen(this.layer, 'click', event => this.onMenuClick(event as MouseEvent))
    this.listen(this.layer, 'pointermove', event => this.onMenuPointerMove(event as PointerEvent))
    this.listen(this.layer, 'contextmenu', event => event.preventDefault())
    this.root.setAttribute('data-menu-ready', '')
  }

  get isOpen(): boolean {
    return this.stack.length > 0
  }

  setItems(items: MenuItemsSource | null | undefined): void {
    this.items = items ?? null
  }

  setDisabled(disabled: boolean): void {
    this.disabled = disabled
    if (disabled)
      this.close('api')
  }

  setLabel(label: string): void {
    this.label = label || 'Context menu'
  }

  /**
   * Open the menu at a point in the viewport, or anchored to an element.
   * `items` replaces the menu's own for this opening. False when there was
   * nothing to show.
   */
  open(at: MenuPoint | Element, items?: MenuItem[] | null, options: { keyboard?: boolean, target?: Element | null } = {}): boolean {
    this.close('api', false)

    const anchor = at instanceof Element ? at : null
    const target = options.target ?? anchor ?? null
    const source = items ?? (typeof this.items === 'function' ? this.items(target) : this.items)
    const resolved = resolveItems(source)
    if (resolved.length === 0)
      return false

    this.target = target
    const active = document.activeElement
    this.returnFocus = active instanceof HTMLElement && active !== document.body ? active : null

    this.showLayer()
    const menu = this.buildMenu(resolved, null)
    const size = menu.element.getBoundingClientRect()
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const place = anchor
      ? placeAtBox(boxOf(anchor), size, viewport)
      : placeAtPoint(at as MenuPoint, size, viewport)
    this.position(menu.element, place)

    this.listenWhileOpen()
    // By keyboard the first item is where the next arrow key would be anyway.
    // By pointer nothing is chosen until the pointer or a key says so.
    if (options.keyboard || anchor)
      this.focusItem(menu, firstIndex(menu.items))
    else
      menu.element.focus({ preventScroll: true })

    this.callbacks.onOpen?.({ x: place.x, y: place.y, target, keyboard: Boolean(options.keyboard) })
    return true
  }

  close(reason: MenuCloseReason = 'api', restoreFocus = true): void {
    if (!this.isOpen)
      return
    this.clearHover()
    for (const menu of this.stack) menu.element.remove()
    this.stack = []
    this.hideLayer()
    this.stopListeningWhileOpen()

    const back = this.returnFocus
    this.returnFocus = null
    this.target = null
    // A click somewhere else has already put focus where the person wants it.
    if (restoreFocus && reason !== 'outside' && reason !== 'blur' && back && back.isConnected)
      back.focus({ preventScroll: true })
    this.callbacks.onClose?.({ reason })
  }

  destroy(): void {
    this.close('api', false)
    for (const dispose of this.disposers) dispose()
    this.layer.remove()
    this.root.removeAttribute('data-menu-ready')
  }

  private listen(target: EventTarget, type: string, handler: (event: Event) => void, options?: AddEventListenerOptions): () => void {
    target.addEventListener(type, handler, options)
    const dispose = (): void => target.removeEventListener(type, handler, options)
    this.disposers.push(dispose)
    return dispose
  }

  private whileOpen: Array<() => void> = []

  private listenWhileOpen(): void {
    const add = (target: EventTarget, type: string, handler: (event: Event) => void, options?: AddEventListenerOptions): void => {
      target.addEventListener(type, handler, options)
      this.whileOpen.push(() => target.removeEventListener(type, handler, options))
    }
    const outside = (event: Event): void => {
      if (!(event.target instanceof Node) || !this.layer.contains(event.target))
        this.close('outside')
    }
    // In the capture phase, so a page that stops the event still closes the menu.
    add(document, 'pointerdown', outside, { capture: true })
    add(document, 'scroll', outside, { capture: true, passive: true })
    add(window, 'resize', () => this.close('blur'))
    add(window, 'blur', () => this.close('blur'))
  }

  private stopListeningWhileOpen(): void {
    for (const dispose of this.whileOpen) dispose()
    this.whileOpen = []
  }

  private showLayer(): void {
    if (this.layer.hasAttribute('popover')) {
      try {
        this.layer.showPopover()
      }
      catch {}
    }
    else {
      this.layer.hidden = false
    }
  }

  private hideLayer(): void {
    if (this.layer.hasAttribute('popover')) {
      try {
        this.layer.hidePopover()
      }
      catch {}
    }
    else {
      this.layer.hidden = true
    }
  }

  private position(element: HTMLElement, at: MenuPoint): void {
    element.style.left = `${Math.round(at.x)}px`
    element.style.top = `${Math.round(at.y)}px`
  }

  private buildMenu(items: ResolvedItem[], opener: HTMLElement | null): OpenMenu {
    const element = document.createElement('div')
    element.className = 'stx-menu'
    element.setAttribute('role', 'menu')
    element.setAttribute('tabindex', '-1')
    element.setAttribute('data-menu-depth', String(this.stack.length))
    if (opener)
      element.setAttribute('aria-labelledby', opener.id)
    else
      element.setAttribute('aria-label', this.label)

    items.forEach((item, index) => {
      if (item.separator) {
        const line = document.createElement('div')
        line.className = 'stx-menu-separator'
        line.setAttribute('role', 'separator')
        element.appendChild(line)
        return
      }

      const row = document.createElement('div')
      row.className = 'stx-menu-item'
      row.id = `${this.uid}-${item.path.join('-')}`
      row.setAttribute('role', typeof item.checked === 'boolean' ? 'menuitemcheckbox' : 'menuitem')
      row.setAttribute('tabindex', '-1')
      row.setAttribute('data-menu-index', String(index))
      row.setAttribute('data-menu-id', item.id)
      if (typeof item.checked === 'boolean')
        row.setAttribute('aria-checked', String(item.checked))
      if (item.disabled)
        row.setAttribute('aria-disabled', 'true')
      if (item.danger)
        row.setAttribute('data-danger', '')

      const check = document.createElement('span')
      check.className = 'stx-menu-check'
      check.setAttribute('aria-hidden', 'true')
      check.textContent = item.checked === true ? '✓' : ''
      row.appendChild(check)

      const label = document.createElement('span')
      label.className = 'stx-menu-label'
      label.textContent = item.label || ''
      row.appendChild(label)

      if (hasSubmenu(item)) {
        row.setAttribute('aria-haspopup', 'menu')
        row.setAttribute('aria-expanded', 'false')
        const arrow = document.createElement('span')
        arrow.className = 'stx-menu-arrow'
        arrow.setAttribute('aria-hidden', 'true')
        arrow.textContent = '›'
        row.appendChild(arrow)
      }
      else if (item.shortcut) {
        row.setAttribute('aria-keyshortcuts', ariaShortcut(item.shortcut, this.apple))
        const shortcut = document.createElement('span')
        shortcut.className = 'stx-menu-shortcut'
        // The attribute above says it to a screen reader in words; the symbols would be read as noise.
        shortcut.setAttribute('aria-hidden', 'true')
        shortcut.textContent = formatShortcut(item.shortcut, this.apple)
        row.appendChild(shortcut)
      }
      element.appendChild(row)
    })

    this.layer.appendChild(element)
    const menu: OpenMenu = { element, items, opener }
    this.stack.push(menu)
    return menu
  }

  private menuOf(node: EventTarget | null): OpenMenu | null {
    if (!(node instanceof Element))
      return null
    const element = node.closest('.stx-menu')
    return this.stack.find(menu => menu.element === element) ?? null
  }

  private rowAt(menu: OpenMenu, index: number): HTMLElement | null {
    return index < 0 ? null : menu.element.querySelector<HTMLElement>(`:scope > [data-menu-index="${index}"]`)
  }

  private activeIndex(menu: OpenMenu): number {
    const active = document.activeElement
    if (!(active instanceof HTMLElement) || active.parentElement !== menu.element)
      return -1
    const index = Number(active.getAttribute('data-menu-index'))
    return Number.isInteger(index) ? index : -1
  }

  private focusItem(menu: OpenMenu, index: number): void {
    const row = this.rowAt(menu, index)
    if (row)
      row.focus({ preventScroll: false })
    else
      menu.element.focus({ preventScroll: true })
  }

  /** Close every menu below `menu` in the stack. */
  private closeBelow(menu: OpenMenu): void {
    const depth = this.stack.indexOf(menu)
    for (const closing of this.stack.splice(depth + 1)) {
      closing.opener?.setAttribute('aria-expanded', 'false')
      closing.element.remove()
    }
  }

  private openSubmenu(menu: OpenMenu, index: number, focusFirst: boolean): void {
    const item = menu.items[index]
    const row = this.rowAt(menu, index)
    if (!row || !hasSubmenu(item) || item.disabled)
      return

    const below = this.stack[this.stack.indexOf(menu) + 1]
    if (below && below.opener === row) {
      if (focusFirst)
        this.focusItem(below, firstIndex(below.items))
      return
    }

    this.closeBelow(menu)
    row.setAttribute('aria-expanded', 'true')
    const submenu = this.buildMenu(item.children!, row)
    const place = placeSubmenu(boxOf(row), submenu.element.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight })
    submenu.element.setAttribute('data-side', place.side)
    this.position(submenu.element, place)
    if (focusFirst)
      this.focusItem(submenu, firstIndex(submenu.items))
  }

  private choose(menu: OpenMenu, index: number): void {
    const item = menu.items[index]
    if (!isActionable(item))
      return
    if (hasSubmenu(item)) {
      this.openSubmenu(menu, index, true)
      return
    }

    const { children: _children, path, id, ...plain } = item
    const detail: MenuSelectDetail = { item: { ...plain, id }, id, path: [...path], target: this.target }
    this.close('select')
    this.callbacks.onSelect?.(detail)
  }

  private clearHover(): void {
    if (this.hoverTimer)
      clearTimeout(this.hoverTimer)
    this.hoverTimer = null
  }

  private onContextMenu(event: MouseEvent): void {
    if (this.disabled || this.layer.contains(event.target as Node))
      return
    const target = event.target instanceof Element ? event.target : null
    // A menu opened with the keyboard arrives as a contextmenu event too, at
    // the element's position rather than the pointer's.
    const keyboard = event.button !== 2 && event.detail === 0 && event.clientX === 0 && event.clientY === 0
    const opened = keyboard && target
      ? this.open(target, null, { keyboard: true, target })
      : this.open({ x: event.clientX, y: event.clientY }, null, { target })
    if (opened)
      event.preventDefault()
  }

  /** Shift+F10 and the menu key, for an engine that does not turn them into a contextmenu event. */
  private onHostKeyDown(event: KeyboardEvent): void {
    if (this.disabled || this.isOpen || this.layer.contains(event.target as Node))
      return
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey))
      return
    const target = event.target instanceof Element ? event.target : null
    if (target && this.open(target, null, { keyboard: true, target }))
      event.preventDefault()
  }

  private onMenuClick(event: MouseEvent): void {
    const menu = this.menuOf(event.target)
    const row = event.target instanceof Element ? event.target.closest<HTMLElement>('.stx-menu-item') : null
    if (!menu || !row)
      return
    this.choose(menu, Number(row.getAttribute('data-menu-index')))
  }

  private onMenuPointerMove(event: PointerEvent): void {
    const menu = this.menuOf(event.target)
    const row = event.target instanceof Element ? event.target.closest<HTMLElement>('.stx-menu-item') : null
    if (!menu || !row || document.activeElement === row)
      return

    const index = Number(row.getAttribute('data-menu-index'))
    row.focus({ preventScroll: true })
    this.clearHover()
    // A pause before a submenu opens or closes, so crossing a row on the way
    // to somewhere else does not flash menus open and shut.
    this.hoverTimer = setTimeout(() => {
      if (document.activeElement !== row)
        return
      if (hasSubmenu(menu.items[index]))
        this.openSubmenu(menu, index, false)
      else
        this.closeBelow(menu)
    }, SUBMENU_DELAY)
  }

  private onMenuKeyDown(event: KeyboardEvent): void {
    const menu = this.menuOf(event.target) ?? this.stack[this.stack.length - 1]
    if (!menu)
      return
    const index = this.activeIndex(menu)
    const depth = this.stack.indexOf(menu)
    let handled = true

    switch (event.key) {
      case 'ArrowDown':
      this.focusItem(menu, stepIndex(menu.items, index, 1))
      break
      case 'ArrowUp':
      this.focusItem(menu, stepIndex(menu.items, index, -1))
      break
      case 'Home':
      case 'PageUp':
      this.focusItem(menu, firstIndex(menu.items))
      break
      case 'End':
      case 'PageDown':
      this.focusItem(menu, lastIndex(menu.items))
      break
      case 'ArrowRight':
      if (hasSubmenu(menu.items[index]))
        this.openSubmenu(menu, index, true)
      break
      case 'ArrowLeft':
      if (depth > 0)
        this.closeSubmenu(menu)
      break
      case 'Escape':
      if (depth > 0)
        this.closeSubmenu(menu)
      else
        this.close('escape')
      break
      case 'Enter':
      case ' ':
      if (index >= 0)
        this.choose(menu, index)
      break
      case 'Tab':
      // Tab leaves a menu. Focus goes back to where it was, and the browser
      // moves on from there.
      this.close('tab')
      handled = false
      break
      default:
      handled = this.typeAhead(menu, index, event)
    }

    if (handled) {
      event.preventDefault()
      // A dialog under the menu must not also answer this Escape.
      event.stopPropagation()
    }
  }

  private closeSubmenu(menu: OpenMenu): void {
    const opener = menu.opener
    const parent = this.stack[this.stack.indexOf(menu) - 1]
    if (parent)
      this.closeBelow(parent)
    opener?.focus({ preventScroll: true })
  }

  private typeAhead(menu: OpenMenu, index: number, event: KeyboardEvent): boolean {
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey)
      return false
    const now = Date.now()
    this.typed = now - this.typedAt > TYPE_AHEAD_RESET ? event.key : this.typed + event.key
    this.typedAt = now

    const found = typeAheadIndex(menu.items, index, this.typed)
    if (found >= 0)
      this.focusItem(menu, found)
    return true
  }
}

function boxOf(element: Element): MenuBox {
  const rect = element.getBoundingClientRect()
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
}
