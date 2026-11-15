/**
 * A Settings window on a native host.
 *
 * `./view` is the window in a DOM. A native host (Craft's AppKit host) has no
 * DOM: its screen is a tree of views behind stx's host adapter
 * (`window.stx._host`), which answers the same few questions a DOM does: what
 * is under a node, what attributes it carries, show it, hide it, hear a press
 * on it. This is the window written against that adapter.
 *
 * The pieces meet the way they do on the web. A sidebar item is a node
 * carrying `data-settings-item`, a pane `data-settings-pane`, a row
 * `data-settings-row`; this reads them off the tree each time it needs them
 * (so a row a `:for` added later is found), asks `./core` what to do, and
 * writes the answer back: which pane is shown, which item is selected
 * (`aria-selected`, which the item's classes draw), what a search leaves.
 *
 * What it cannot draw itself (the pane's name, whether back leads anywhere,
 * the settings a search found) it reports through `onState`, and the shell's
 * template draws from signals.
 */
import type { SettingsHistory, SettingsItemInfo, SettingsPaneInfo, SettingsRowInfo, SettingsSearchHit } from './core'
import type { SettingsNavigateDetail, SettingsPaneDetail, SettingsSearchDetail } from './view'
import { emptySettingsHistory, findSettingsPane, resolveSettingsPane, searchSettings, SETTINGS_HIGHLIGHT_MS, settingsCanGoBack, settingsCanGoForward, settingsHistoryBack, settingsHistoryCurrent, settingsHistoryForward, settingsHistoryVisit, settingsParentPane, settingsSidebarPane, settingsStorageName } from './core'

/** The part of stx's host adapter (`window.stx._host`) the window uses. */
export interface SettingsTreeHost<N = unknown> {
  parent: (node: N) => N | null
  descendants: (node: N) => N[]
  getAttribute: (node: N, name: string) => string | null
  setAttribute: (node: N, name: string, value: unknown) => void
  removeAttribute: (node: N, name: string) => void
  setStyle: (node: N, value: unknown) => void
  listen: (node: N, event: string, handler: (payload?: unknown) => void) => (() => void)
  observeChildren: (node: N, callback: () => void) => (() => void)
}

/** Where the open pane is remembered. On a native host, the app's storage. */
export interface SettingsTreeStorage {
  get: (name: string) => string | null
  set: (name: string, value: string) => void
}

export interface SettingsTreeOptions {
  /** The pane to open on. A stored pane wins over it; the first pane is the fallback. */
  pane?: string
  /** Remembers the open pane under `stx:settings:<key>`. */
  storageKey?: string
  storage?: SettingsTreeStorage
  /** The fill a found row wears for a moment, or nothing to leave it undrawn. */
  wash?: () => string
}

/** What the shell draws from signals. */
export interface SettingsTreeState {
  pane: string
  title: string
  canGoBack: boolean
  canGoForward: boolean
  query: string
  searching: boolean
  /** The settings a search found, best first. */
  results: Array<{ position: number, label: string, pane: string }>
  /** A search that found nothing at all. */
  empty: boolean
}

export interface SettingsTreeCallbacks {
  onPane?: (detail: SettingsPaneDetail) => void
  onSearch?: (detail: SettingsSearchDetail) => void
  onNavigate?: (detail: SettingsNavigateDetail) => void
  onState?: (state: SettingsTreeState) => void
}

const ROOT = 'data-stx-settings'
const ITEM = 'data-settings-item'
const PANE = 'data-settings-pane'
const ROW = 'data-settings-row'

export class SettingsWindowTree<N = unknown> {
  private history: SettingsHistory = emptySettingsHistory()
  private current = ''
  private query = ''
  private hits: Array<{ hit: SettingsSearchHit, row: N }> = []
  private highlighted: N | null = null
  private highlightTimer: ReturnType<typeof setTimeout> | null = null
  private readonly pressed = new Map<N, () => void>()
  private readonly visible = new Map<N, boolean>()
  private readonly disposers: Array<() => void> = []
  private destroyed = false

  constructor(
    private readonly tree: SettingsTreeHost<N>,
    private readonly root: N,
    private readonly options: SettingsTreeOptions = {},
    private readonly callbacks: SettingsTreeCallbacks = {},
  ) {
    this.hear()
    // A row or an item a `:for` or an `:if` adds later is heard too.
    this.disposers.push(tree.observeChildren(root, () => {
      if (this.destroyed)
        return
      this.hear()
      this.show(false)
      this.applySearch(false)
    }))

    const panes = this.panes()
    const shown = this.paneNodes().find(pane => this.tree.getAttribute(pane, 'data-active') != null)
    this.history = settingsHistoryVisit(this.history, resolveSettingsPane(panes, this.stored(), options.pane, shown ? this.attribute(shown, PANE) : ''))
    this.show(true)
    // The gaps between the sidebar's groups, which only the window can place.
    this.applySearch(false)
  }

  /** The id of the open pane. */
  getPane(): string {
    return this.current
  }

  /** Open a pane, as a press on its sidebar item would. False when there is no such pane. */
  showPane(id: string): boolean {
    if (!findSettingsPane(this.panes(), id))
      return false
    this.open(id)
    return true
  }

  /**
   * Open the pane holding the row whose `data-setting` is `id` and highlight
   * the row. False when no row has that id. The web view also scrolls the row
   * into view; a native host offers no way to scroll to a view, so a row far
   * down a long pane is highlighted where it is.
   */
  revealSetting(id: string): boolean {
    if (!id)
      return false
    const row = this.rowNodes().find(node => this.attribute(node, 'data-setting') === id)
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

  /** Search for `query`, as typing it into the field would. */
  search(query: string): void {
    this.query = String(query ?? '')
    this.applySearch(true)
  }

  /** Open the setting a search found, by its place in `state.results`. */
  chooseResult(position: number): void {
    const found = this.hits[position]
    if (!found || this.tree.parent(found.row) === null)
      return
    this.open(found.hit.pane)
    this.reveal(found.row)
  }

  destroy(): void {
    this.destroyed = true
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    for (const stop of this.pressed.values()) stop()
    this.pressed.clear()
    this.visible.clear()
    this.clearHighlight()
  }

  // -------------------------------------------------------------------------
  // Reading the tree
  // -------------------------------------------------------------------------

  private attribute(node: N, name: string): string {
    return this.tree.getAttribute(node, name) ?? ''
  }

  /**
   * Show or hide a node by the `hidden` class, as `classList.toggle` would.
   * What the server left hidden (every pane but the open one, so a window
   * never draws them all for a frame) is hidden by that class, and a class
   * is not something the host's own show and hide can lift. The adapter
   * answers `class` with what the template wrote, not what was set since, so
   * what each node was last told is kept here.
   */
  private toggle(node: N, shown: boolean): void {
    const authored = this.attribute(node, 'class').split(/\s+/).filter(Boolean)
    const was = this.visible.has(node) ? this.visible.get(node)! : !authored.includes('hidden')
    this.visible.set(node, shown)
    if (was === shown)
      return
    const classes = authored.filter(name => name !== 'hidden')
    this.tree.setAttribute(node, 'class', (shown ? classes : [...classes, 'hidden']).join(' '))
  }

  private has(node: N, name: string): boolean {
    return this.tree.getAttribute(node, name) != null
  }

  /** The nearest node at or above `node` carrying `name`, or null. */
  private closest(node: N | null, name: string): N | null {
    for (let current = node; current; current = this.tree.parent(current)) {
      if (this.has(current, name))
        return current
    }
    return null
  }

  /** Every node carrying `name` that belongs to this window and not to one nested in a pane. */
  private all(name: string, within: N = this.root): N[] {
    return this.tree.descendants(within).filter(node => this.has(node, name) && this.closest(this.tree.parent(node), ROOT) === this.root)
  }

  private paneNodes(): N[] {
    return this.all(PANE)
  }

  private panes(): SettingsPaneInfo[] {
    return this.paneNodes().map((pane) => {
      const id = this.attribute(pane, PANE)
      return { id, title: this.attribute(pane, 'data-title') || id, keywords: this.attribute(pane, 'data-keywords'), parent: this.attribute(pane, 'data-parent') }
    })
  }

  private itemNodes(): N[] {
    return this.all(ITEM)
  }

  private items(): SettingsItemInfo[] {
    return this.itemNodes().map(item => ({
      id: this.attribute(item, ITEM),
      label: this.attribute(item, 'data-label').trim(),
      keywords: this.attribute(item, 'data-keywords'),
    }))
  }

  private rowNodes(): N[] {
    return this.all(ROW).filter(row => this.paneOf(row) !== '')
  }

  private paneOf(node: N): string {
    const pane = this.closest(node, PANE)
    return pane ? this.attribute(pane, PANE) : ''
  }

  private stored(): string {
    if (!this.options.storageKey || !this.options.storage)
      return ''
    try {
      return this.options.storage.get(settingsStorageName(this.options.storageKey)) || ''
    }
    catch {
      // Storage can be missing, and a window that forgets still opens.
      return ''
    }
  }

  private store(): void {
    if (!this.options.storageKey || !this.options.storage || !this.current)
      return
    try {
      this.options.storage.set(settingsStorageName(this.options.storageKey), this.current)
    }
    catch {}
  }

  // -------------------------------------------------------------------------
  // Presses
  // -------------------------------------------------------------------------

  /** Hear a press on every sidebar item and navigation row, once each. */
  private hear(): void {
    const live = new Set<N>()
    for (const item of this.itemNodes()) {
      live.add(item)
      if (!this.pressed.has(item))
        this.pressed.set(item, this.tree.listen(item, 'click', () => this.open(this.attribute(item, ITEM))))
    }
    for (const row of this.rowNodes()) {
      if (!this.has(row, 'data-navigate'))
        continue
      live.add(row)
      if (!this.pressed.has(row))
        this.pressed.set(row, this.tree.listen(row, 'click', () => this.navigate(row)))
    }
    for (const [node, stop] of this.pressed) {
      if (live.has(node))
        continue
      stop()
      this.pressed.delete(node)
    }
  }

  private navigate(row: N): void {
    if (this.attribute(row, 'aria-disabled') === 'true')
      return
    const id = this.attribute(row, 'data-navigate')
    if (!findSettingsPane(this.panes(), id))
      return
    const from = this.current
    this.open(id)
    this.callbacks.onNavigate?.({ id, from, setting: this.attribute(row, 'data-setting') })
  }

  // -------------------------------------------------------------------------
  // Panes and history
  // -------------------------------------------------------------------------

  private open(id: string): void {
    if (!id)
      return
    this.history = settingsHistoryVisit(this.history, id)
    this.show(true)
  }

  private travel(next: SettingsHistory): void {
    if (next === this.history)
      return
    this.history = next
    this.show(true)
  }

  /** Draw the pane the history points at. */
  private show(report: boolean): void {
    const panes = this.panes()
    const id = settingsHistoryCurrent(this.history)
    const info = findSettingsPane(panes, id)
    if (!info)
      return

    for (const pane of this.paneNodes()) {
      this.toggle(pane, this.attribute(pane, PANE) === id)
    }

    // A sub-pane keeps the item of the pane it was reached from selected.
    const selected = settingsSidebarPane(panes, id)
    for (const item of this.itemNodes()) {
      const on = this.attribute(item, ITEM) === selected
      // The item's label, tile and badge read the same state for their colours.
      for (const node of [item, ...this.tree.descendants(item)])
        this.tree.setAttribute(node, 'aria-selected', on ? 'true' : 'false')
    }

    const changed = this.current !== id
    this.current = id
    this.report()
    if (changed) {
      this.store()
      if (report)
        this.callbacks.onPane?.({ id, title: info.title, parent: settingsParentPane(panes, id) })
    }
  }

  private report(): void {
    const panes = this.panes()
    const info = findSettingsPane(panes, this.current)
    const searching = this.query.trim() !== ''
    this.callbacks.onState?.({
      pane: this.current,
      title: info?.title ?? '',
      canGoBack: settingsCanGoBack(this.history, panes),
      canGoForward: settingsCanGoForward(this.history),
      query: this.query,
      searching,
      results: this.hits.map(({ hit }, position) => ({ position, label: hit.label, pane: hit.paneTitle })),
      empty: searching && this.shownItems === 0 && this.hits.length === 0,
    })
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  private shownItems = 0

  private applySearch(report: boolean): void {
    const rows = this.rowNodes()
    const index: SettingsRowInfo[] = rows.map(row => ({
      id: this.attribute(row, 'data-setting'),
      label: this.attribute(row, 'data-label').trim(),
      keywords: this.attribute(row, 'data-keywords'),
      pane: this.paneOf(row),
    }))
    const found = searchSettings(this.query, { panes: this.panes(), items: this.items(), rows: index })
    const searching = found.query !== ''

    const shown = new Set<N>()
    for (const item of this.itemNodes()) {
      const on = !searching || found.panes.includes(this.attribute(item, ITEM))
      if (on)
        shown.add(item)
      this.toggle(item, on)
    }
    this.shownItems = searching ? found.panes.length : shown.size

    // A group whose every item is hidden would leave its gap behind, and the
    // gap sits above every group but the first one showing.
    let first = true
    for (const group of this.all('data-settings-group')) {
      const on = this.all(ITEM, group).some(item => shown.has(item))
      this.toggle(group, on)
      for (const gap of this.all('data-settings-group-gap', group))
        this.toggle(gap, on && !first)
      if (on)
        first = false
    }
    // The account is not a search result.
    for (const account of this.all('data-settings-account'))
      this.toggle(account, !searching)

    this.hits = found.settings.map(hit => ({ hit, row: rows[hit.row]! }))
    this.report()

    if (report) {
      this.callbacks.onSearch?.({
        query: this.query.trim(),
        panes: found.panes,
        settings: found.settings.map(hit => ({ id: hit.id, label: hit.label, pane: hit.pane })),
      })
    }
  }

  // -------------------------------------------------------------------------
  // Finding a row
  // -------------------------------------------------------------------------

  private reveal(row: N): void {
    this.clearHighlight()
    this.tree.setAttribute(row, 'data-highlight', '')
    const wash = this.options.wash?.()
    if (wash)
      this.tree.setStyle(row, { backgroundColor: wash })
    this.highlighted = row
    this.highlightTimer = setTimeout(() => this.clearHighlight(), SETTINGS_HIGHLIGHT_MS)
  }

  private clearHighlight(): void {
    if (this.highlightTimer)
      clearTimeout(this.highlightTimer)
    this.highlightTimer = null
    if (this.highlighted) {
      this.tree.removeAttribute(this.highlighted, 'data-highlight')
      this.tree.setStyle(this.highlighted, { backgroundColor: 'transparent' })
    }
    this.highlighted = null
  }
}
