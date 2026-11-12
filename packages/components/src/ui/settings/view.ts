/**
 * A Settings window in the DOM.
 *
 * The shell, the sidebar items, the panes and the rows are separate
 * components that never import each other; they meet in attributes. This
 * reads those attributes off the page each time it needs them (so a pane or a
 * row added later is found), asks ./core what to do, and writes the answer
 * back: which pane is shown, which item is selected, what a search lists.
 */
import type { SettingsHistory, SettingsItemInfo, SettingsPaneInfo, SettingsRowInfo, SettingsSearchHit, SettingsTypeAhead } from './core'
import { emptySettingsHistory, findSettingsPane, resolveSettingsPane, searchSettings, SETTINGS_HIGHLIGHT_MS, settingsCanGoBack, settingsCanGoForward, settingsHistoryBack, settingsHistoryCurrent, settingsHistoryForward, settingsHistoryVisit, settingsParentPane, settingsResultsAnnouncement, settingsRovingIndex, settingsSidebarPane, settingsStorageName, settingsTypeAheadAdd, settingsTypeAheadMatch } from './core'

export interface SettingsWindowOptions {
  /** The pane to open on. A stored pane wins over it; the first pane is the fallback. */
  pane?: string
  /** Remembers the open pane in local storage under `stx:settings:<key>`. */
  storageKey?: string
  /**
   * Whether the shortcuts (find, back, forward) are heard anywhere in the
   * document, as in a window that is all Settings, or only inside the shell.
   */
  globalKeys?: boolean
}

export interface SettingsPaneDetail {
  id: string
  title: string
  /** The pane above a sub-pane, or empty. */
  parent: string
}

export interface SettingsSearchDetail {
  query: string
  /** The sidebar items left showing. */
  panes: string[]
  /** The settings listed under them, best first. */
  settings: Array<{ id: string, label: string, pane: string }>
}

export interface SettingsNavigateDetail {
  /** The pane the row opened. */
  id: string
  /** The pane the row is in. */
  from: string
  /** The row's `data-setting`, or empty. */
  setting: string
}

export interface SettingsWindowCallbacks {
  onPane?: (detail: SettingsPaneDetail) => void
  onSearch?: (detail: SettingsSearchDetail) => void
  onNavigate?: (detail: SettingsNavigateDetail) => void
}

interface InertElement extends HTMLElement {
  __stx_inert_content?: boolean
}

const ROOT = '[data-stx-settings]'
const ITEM = '[data-settings-item]'
const PANE = '[data-settings-pane]'
const ROW = '[data-settings-row]'
const RESULT = '[data-settings-result]'
/** Things inside a navigation row that take a press for themselves. */
const CONTROLS = 'button, a[href], input, select, textarea, label, [role="switch"], [role="checkbox"], [role="radio"], [role="slider"], [role="button"], [contenteditable]'

function domId(text: string): string {
  return text.replace(/[^\w-]+/g, '-')
}

export class SettingsWindowView {
  private history: SettingsHistory = emptySettingsHistory()
  private current = ''
  private query = ''
  private storageKey: string
  private typed: SettingsTypeAhead | null = null
  private hits: Array<{ hit: SettingsSearchHit, row: HTMLElement }> = []
  private highlighted: HTMLElement | null = null
  private highlightTimer: ReturnType<typeof setTimeout> | null = null
  private readonly disposers: Array<() => void> = []

  private readonly list: HTMLElement | null
  private readonly account: HTMLElement | null
  private readonly input: HTMLInputElement | null
  private readonly field: HTMLElement | null
  private readonly results: InertElement | null
  private readonly empty: HTMLElement | null
  private readonly live: InertElement | null
  private readonly backButton: HTMLButtonElement | null
  private readonly forwardButton: HTMLButtonElement | null
  private readonly title: InertElement | null
  private readonly body: HTMLElement | null

  constructor(private readonly root: HTMLElement, options: SettingsWindowOptions = {}, private readonly callbacks: SettingsWindowCallbacks = {}) {
    this.storageKey = options.storageKey || ''
    if (!root.id)
      root.id = `settings-${Math.random().toString(36).slice(2, 8)}`

    this.list = this.own('[data-settings-list]')
    this.account = this.own('[data-settings-account]')
    this.input = this.own<HTMLInputElement>('[data-settings-search-input]')
    this.field = this.own('[data-settings-search]')
    this.results = this.own('[data-settings-results]')
    this.empty = this.own('[data-settings-empty]')
    this.live = this.own('[data-settings-live]')
    this.backButton = this.own<HTMLButtonElement>('[data-settings-back]')
    this.forwardButton = this.own<HTMLButtonElement>('[data-settings-forward]')
    this.title = this.own('[data-settings-title]')
    this.body = this.own('[data-settings-body]')
    for (const filled of [this.results, this.live, this.title]) {
      if (filled)
        filled.__stx_inert_content = true
    }

    this.listen(root, 'click', event => this.onClick(event))
    this.listen(options.globalKeys ? document : root, 'keydown', event => this.onKeyDown(event as KeyboardEvent))
    if (this.input)
      this.listen(this.input, 'input', () => this.search(this.input!.value))
    if (this.body)
      this.listen(this.body, 'scroll', () => this.syncScrolled(), { passive: true })
    // A window that is not in front goes quiet. The shell cannot see AppKit's
    // key window, but it is told when the page gains and loses focus.
    this.listen(window, 'focus', () => root.setAttribute('data-stx-window-active', 'true'))
    this.listen(window, 'blur', () => root.setAttribute('data-stx-window-active', 'false'))

    this.describe()
    const panes = this.panes()
    const shown = this.paneElements().find(pane => !pane.hidden)?.getAttribute('data-settings-pane')
    this.open(resolveSettingsPane(panes, this.stored(), options.pane, shown))
    root.setAttribute('data-settings-ready', '')
  }

  /** The id of the open pane. */
  getPane(): string {
    return this.current
  }

  /** Open a pane, as a click on its sidebar item would. False when there is no such pane. */
  showPane(id: string): boolean {
    if (!findSettingsPane(this.panes(), id))
      return false
    this.open(id)
    return true
  }

  /**
   * Open the pane holding `[data-setting="id"]`, bring the row into view and
   * highlight it. False when no row has that id.
   */
  revealSetting(id: string): boolean {
    if (!id)
      return false
    const row = this.rowElements().find(element => element.getAttribute('data-setting') === id)
    const pane = row ? this.paneOf(row) : ''
    if (!row || !pane)
      return false
    this.open(pane)
    this.reveal(row)
    return true
  }

  back(): void {
    this.travel(settingsHistoryBack(this.history, this.panes()))
  }

  forward(): void {
    this.travel(settingsHistoryForward(this.history))
  }

  focusSearch(): void {
    if (!this.input)
      return
    this.input.focus()
    this.input.select()
  }

  /** Search for `query`, as typing it into the field would. */
  search(query: string): void {
    this.query = query
    if (this.input && this.input.value !== query)
      this.input.value = query
    this.applySearch(true)
  }

  destroy(): void {
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    this.clearHighlight()
    this.root.removeAttribute('data-settings-ready')
  }

  // -------------------------------------------------------------------------
  // Reading the page
  // -------------------------------------------------------------------------

  /** The first match that belongs to this shell and not to one nested in a pane. */
  private own<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return this.all<T>(selector)[0] ?? null
  }

  private all<T extends HTMLElement = HTMLElement>(selector: string, within: ParentNode = this.root): T[] {
    return Array.from(within.querySelectorAll<T>(selector)).filter(element => element.closest(ROOT) === this.root)
  }

  private listen(target: EventTarget, type: string, handler: (event: Event) => void, options?: AddEventListenerOptions): void {
    target.addEventListener(type, handler, options)
    this.disposers.push(() => target.removeEventListener(type, handler, options))
  }

  private paneElements(): HTMLElement[] {
    return this.all(PANE)
  }

  private paneElement(id: string): HTMLElement | null {
    return this.paneElements().find(pane => pane.getAttribute('data-settings-pane') === id) ?? null
  }

  private panes(): SettingsPaneInfo[] {
    return this.paneElements().map(pane => ({
      id: pane.getAttribute('data-settings-pane') || '',
      title: pane.getAttribute('data-title') || pane.getAttribute('data-settings-pane') || '',
      keywords: pane.getAttribute('data-keywords') || '',
      parent: pane.getAttribute('data-parent') || '',
    })).filter(pane => pane.id !== '')
  }

  private itemElements(): HTMLElement[] {
    return this.list ? this.all(ITEM, this.list) : []
  }

  private visibleItems(): HTMLElement[] {
    return this.itemElements().filter(item => !item.hidden && !(item as HTMLButtonElement).disabled)
  }

  private labelOf(item: HTMLElement): string {
    return (item.querySelector('.stx-settings-item-label')?.textContent || item.getAttribute('aria-label') || item.textContent || '').trim()
  }

  private items(): SettingsItemInfo[] {
    return this.itemElements().map(item => ({
      id: item.getAttribute('data-settings-item') || '',
      label: this.labelOf(item),
      keywords: item.getAttribute('data-keywords') || '',
    }))
  }

  private rowElements(): HTMLElement[] {
    return this.all(ROW).filter(row => this.paneOf(row) !== '')
  }

  private paneOf(element: Element): string {
    return element.closest(PANE)?.getAttribute('data-settings-pane') || ''
  }

  private stored(): string {
    if (!this.storageKey)
      return ''
    try {
      return localStorage.getItem(settingsStorageName(this.storageKey)) || ''
    }
    catch {
      // Storage can be switched off, and a window that forgets still opens.
      return ''
    }
  }

  private store(): void {
    if (!this.storageKey || !this.current)
      return
    try {
      localStorage.setItem(settingsStorageName(this.storageKey), this.current)
    }
    catch {}
  }

  // -------------------------------------------------------------------------
  // Panes and history
  // -------------------------------------------------------------------------

  /**
   * Give the tabs and their panels the names and the links their roles
   * promise. Run before every pane change, so anything added since is covered.
   */
  private describe(): void {
    const prefix = this.root.id
    const items = new Map<string, HTMLElement>()
    for (const item of this.itemElements()) {
      const id = item.getAttribute('data-settings-item') || ''
      if (!item.id)
        item.id = `${prefix}-item-${domId(id)}`
      item.setAttribute('role', 'tab')
      items.set(id, item)
      // A tab list owns its tabs directly: whatever wraps one for layout says
      // so, or the list reads as holding groups of nothing.
      for (let wrapper = item.parentElement; wrapper && wrapper !== this.list; wrapper = wrapper.parentElement) {
        if (!wrapper.hasAttribute('role'))
          wrapper.setAttribute('role', 'presentation')
      }
    }

    for (const pane of this.paneElements()) {
      const id = pane.getAttribute('data-settings-pane') || ''
      if (!pane.id)
        pane.id = `${prefix}-pane-${domId(id)}`
      const item = items.get(id)
      if (item) {
        item.setAttribute('aria-controls', pane.id)
        pane.setAttribute('role', 'tabpanel')
        pane.setAttribute('aria-labelledby', item.id)
        pane.removeAttribute('aria-label')
      }
      else if (this.title?.id) {
        // A sub-pane has no tab. Its name is the title the toolbar shows.
        pane.setAttribute('role', 'region')
        if (!pane.hasAttribute('aria-label'))
          pane.setAttribute('aria-label', pane.getAttribute('data-title') || id)
      }
    }
  }

  private open(id: string): void {
    if (!id)
      return
    this.history = settingsHistoryVisit(this.history, id)
    this.show()
  }

  private travel(next: SettingsHistory): void {
    if (next === this.history)
      return
    this.history = next
    this.show()
  }

  /** Draw the pane the history points at. */
  private show(): void {
    this.describe()
    const panes = this.panes()
    const id = settingsHistoryCurrent(this.history)
    const info = findSettingsPane(panes, id)
    const target = this.paneElement(id)
    if (!info || !target)
      return

    const active = document.activeElement
    const focusLeaves = active instanceof HTMLElement && this.paneElements().some(pane => pane !== target && pane.contains(active))

    for (const pane of this.paneElements()) {
      pane.hidden = pane !== target
      pane.toggleAttribute('data-active', pane === target)
    }

    const selected = settingsSidebarPane(panes, id)
    for (const item of this.itemElements()) {
      const on = item.getAttribute('data-settings-item') === selected
      item.setAttribute('aria-selected', on ? 'true' : 'false')
      item.toggleAttribute('data-active', on)
    }
    this.syncTabStops()

    if (this.title)
      this.title.textContent = info.title
    this.root.setAttribute('data-pane', id)
    this.root.toggleAttribute('data-subpane', settingsParentPane(panes, id) !== '')
    this.syncHistoryButtons(panes)

    const changed = id !== this.current
    this.current = id
    if (changed) {
      this.clearHighlight()
      // A different screen, not more of the one that was there.
      if (this.body)
        this.body.scrollTop = 0
      this.syncScrolled()
      // Focus that sat in the pane that left would otherwise fall to the page.
      if (focusLeaves) {
        if (!target.hasAttribute('tabindex'))
          target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      }
      this.store()
      this.callbacks.onPane?.({ id, title: info.title, parent: settingsParentPane(panes, id) })
    }
  }

  /** One stop in the tab order: the selected item, or the first showing when it is filtered out. */
  private syncTabStops(): void {
    const visible = this.visibleItems()
    const stop = visible.find(item => item.getAttribute('aria-selected') === 'true') ?? visible[0]
    for (const item of this.itemElements())
      item.setAttribute('tabindex', item === stop ? '0' : '-1')
  }

  private syncHistoryButtons(panes: SettingsPaneInfo[]): void {
    const set = (button: HTMLButtonElement | null, enabled: boolean, other: HTMLButtonElement | null): void => {
      if (!button)
        return
      const focused = document.activeElement === button
      button.disabled = !enabled
      // A disabled button drops the focus it had; its neighbour keeps it in the toolbar.
      if (focused && !enabled && other && !other.disabled)
        other.focus()
    }
    const back = settingsCanGoBack(this.history, panes)
    const forward = settingsCanGoForward(this.history)
    // Enable before disabling, so there is somewhere for focus to go.
    if (back) {
      set(this.backButton, true, null)
      set(this.forwardButton, forward, this.backButton)
    }
    else {
      set(this.forwardButton, forward, null)
      set(this.backButton, false, this.forwardButton)
    }
  }

  private syncScrolled(): void {
    this.root.toggleAttribute('data-scrolled', Boolean(this.body && this.body.scrollTop > 0))
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  private applySearch(report: boolean): void {
    const rows = this.rowElements()
    const index: SettingsRowInfo[] = rows.map(row => ({
      id: row.getAttribute('data-setting') || '',
      label: (row.getAttribute('data-label') || '').trim(),
      keywords: row.getAttribute('data-keywords') || '',
      pane: this.paneOf(row),
    }))
    const found = searchSettings(this.query, { panes: this.panes(), items: this.items(), rows: index })
    const searching = found.query !== ''

    this.root.toggleAttribute('data-searching', searching)
    this.field?.toggleAttribute('data-filled', this.query !== '')

    for (const item of this.itemElements())
      item.hidden = searching && !found.panes.includes(item.getAttribute('data-settings-item') || '')
    if (this.list) {
      // A group whose every item is hidden would leave its gap behind.
      for (const group of this.all('[data-settings-group]', this.list))
        group.hidden = searching && this.all(ITEM, group).every(item => item.hidden)
      this.list.hidden = searching && found.panes.length === 0
    }
    // The account is not a search result.
    if (this.account)
      this.account.hidden = searching

    this.hits = found.settings.map(hit => ({ hit, row: rows[hit.row] }))
    this.drawResults()

    const total = found.panes.length + found.settings.length
    if (this.empty)
      this.empty.hidden = !searching || total > 0
    if (this.live)
      this.live.textContent = searching ? settingsResultsAnnouncement(total) : ''
    this.syncTabStops()

    if (report) {
      this.callbacks.onSearch?.({
        query: this.query.trim(),
        panes: found.panes,
        settings: found.settings.map(hit => ({ id: hit.id, label: hit.label, pane: hit.pane })),
      })
    }
  }

  /** The settings a search found, listed under the sidebar items: the label, and the pane it is in beneath. */
  private drawResults(): void {
    const box = this.results
    if (!box)
      return
    box.replaceChildren()
    box.hidden = this.hits.length === 0
    this.hits.forEach(({ hit }, position) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'stx-settings-result'
      button.setAttribute('data-settings-result', String(position))
      button.setAttribute('tabindex', '-1')
      const label = document.createElement('span')
      label.className = 'stx-settings-result-label'
      label.textContent = hit.label
      const pane = document.createElement('span')
      pane.className = 'stx-settings-result-pane'
      pane.textContent = hit.paneTitle
      button.append(label, pane)
      box.append(button)
    })
  }

  private chooseResult(position: number): void {
    const found = this.hits[position]
    if (!found || !found.row.isConnected)
      return
    this.open(found.hit.pane)
    this.reveal(found.row)
  }

  private clearSearch(): void {
    if (this.query === '' && (!this.input || this.input.value === ''))
      return
    this.search('')
  }

  // -------------------------------------------------------------------------
  // Finding a row
  // -------------------------------------------------------------------------

  private reveal(row: HTMLElement): void {
    if (this.body) {
      const frame = this.body.getBoundingClientRect()
      const box = row.getBoundingClientRect()
      // Centred in the scroller, by its own scroll position alone: scrolling
      // the row into view would move the page around a sheet as well.
      this.body.scrollTop += (box.top - frame.top) - (frame.height - box.height) / 2
      this.syncScrolled()
    }
    this.clearHighlight()
    row.setAttribute('data-highlight', '')
    this.highlighted = row
    this.highlightTimer = setTimeout(() => this.clearHighlight(), SETTINGS_HIGHLIGHT_MS)
  }

  private clearHighlight(): void {
    if (this.highlightTimer)
      clearTimeout(this.highlightTimer)
    this.highlightTimer = null
    this.highlighted?.removeAttribute('data-highlight')
    this.highlighted = null
  }

  // -------------------------------------------------------------------------
  // Pointer and keys
  // -------------------------------------------------------------------------

  private inside(target: EventTarget | null): target is Element {
    return target instanceof Element && target.closest(ROOT) === this.root
  }

  private navigationRow(target: Element): HTMLElement | null {
    const row = target.closest<HTMLElement>('[data-navigate]')
    if (!row || row.closest(ROOT) !== this.root || row.getAttribute('aria-disabled') === 'true')
      return null
    // A switch or a button inside the row is pressed for itself.
    const control = target.closest(CONTROLS)
    if (control && control !== row && row.contains(control))
      return null
    return row
  }

  private navigate(row: HTMLElement): void {
    const id = row.getAttribute('data-navigate') || ''
    if (!findSettingsPane(this.panes(), id))
      return
    const from = this.current
    this.open(id)
    this.callbacks.onNavigate?.({ id, from, setting: row.getAttribute('data-setting') || '' })
  }

  private onClick(event: Event): void {
    const target = event.target
    if (!this.inside(target))
      return

    const item = target.closest<HTMLElement>(ITEM)
    if (item && this.list?.contains(item)) {
      this.open(item.getAttribute('data-settings-item') || '')
      return
    }
    const result = target.closest<HTMLElement>(RESULT)
    if (result) {
      this.chooseResult(Number(result.getAttribute('data-settings-result')))
      return
    }
    if (target.closest('[data-settings-back]')) {
      this.back()
      return
    }
    if (target.closest('[data-settings-forward]')) {
      this.forward()
      return
    }
    if (target.closest('[data-settings-search-clear]')) {
      this.clearSearch()
      this.input?.focus()
      return
    }
    const row = this.navigationRow(target)
    if (row)
      this.navigate(row)
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented)
      return
    const command = (event.metaKey || event.ctrlKey) && !event.altKey

    if (command && !event.shiftKey) {
      const key = event.key.toLowerCase()
      if (key === 'f' && this.input) {
        event.preventDefault()
        this.focusSearch()
        return
      }
      if (key === '[') {
        event.preventDefault()
        this.back()
        return
      }
      if (key === ']') {
        event.preventDefault()
        this.forward()
        return
      }
    }

    const target = event.target
    if (!this.inside(target))
      return

    // Escape with nothing typed is the window's to close; with a search it
    // only ends the search, and focus goes back to the list.
    if (event.key === 'Escape' && this.query !== '') {
      event.preventDefault()
      this.clearSearch()
      this.visibleItems().find(item => item.getAttribute('tabindex') === '0')?.focus()
      return
    }

    if (target === this.input) {
      this.onSearchKey(event)
      return
    }

    const result = target.closest<HTMLElement>(RESULT)
    if (result) {
      this.onResultKey(event, result)
      return
    }

    const item = target.closest<HTMLElement>(ITEM)
    if (item && this.list?.contains(item)) {
      this.onItemKey(event, item)
      return
    }

    if ((event.key === 'Enter' || event.key === ' ') && !command && !event.altKey) {
      const row = target.closest<HTMLElement>('[data-navigate]')
      // Only the row itself: a key on a control inside it belongs to the control.
      if (row && row === target && this.navigationRow(target)) {
        event.preventDefault()
        this.navigate(row)
      }
    }
  }

  private resultButtons(): HTMLElement[] {
    return this.results ? Array.from(this.results.querySelectorAll<HTMLElement>(RESULT)) : []
  }

  private onSearchKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      const first = this.visibleItems()[0] ?? this.resultButtons()[0]
      if (first) {
        event.preventDefault()
        first.focus()
      }
    }
    else if (event.key === 'Enter' && this.query.trim() !== '') {
      event.preventDefault()
      const first = this.visibleItems()[0]
      if (first)
        this.open(first.getAttribute('data-settings-item') || '')
      else
        this.chooseResult(0)
    }
  }

  private onResultKey(event: KeyboardEvent, result: HTMLElement): void {
    const buttons = this.resultButtons()
    const index = buttons.indexOf(result)
    if (event.key === 'ArrowUp' && index === 0) {
      const items = this.visibleItems()
      const last = items[items.length - 1] ?? this.input
      if (last) {
        event.preventDefault()
        last.focus()
      }
      return
    }
    const next = settingsRovingIndex(event.key, index, buttons.length)
    if (next === -1)
      return
    event.preventDefault()
    buttons[next].focus()
  }

  private onItemKey(event: KeyboardEvent, item: HTMLElement): void {
    if (event.metaKey || event.ctrlKey || event.altKey)
      return
    const items = this.visibleItems()
    const index = items.indexOf(item)

    // Past the last item a search's settings begin.
    if (event.key === 'ArrowDown' && index === items.length - 1) {
      const first = this.resultButtons()[0]
      if (first) {
        event.preventDefault()
        first.focus()
        return
      }
    }

    let next = settingsRovingIndex(event.key, index, items.length)
    if (next === -1 && event.key.length === 1 && (event.key !== ' ' || this.typed !== null)) {
      const typed = settingsTypeAheadAdd(this.typed, event.key, Date.now())
      // A space only ever continues a word; alone it presses the item.
      if (event.key === ' ' && typed.buffer.trim() === '') {
        this.typed = null
        return
      }
      this.typed = typed
      next = settingsTypeAheadMatch(items.map(entry => this.labelOf(entry)), typed.buffer, index)
      if (next === -1) {
        event.preventDefault()
        return
      }
    }
    if (next === -1)
      return

    event.preventDefault()
    // Moving selects, as it does in System Settings.
    items[next].focus()
    this.open(items[next].getAttribute('data-settings-item') || '')
  }
}
