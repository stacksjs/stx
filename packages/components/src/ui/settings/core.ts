/**
 * What a Settings window decides, without a DOM.
 *
 * Which pane is open, where back and forward lead, which sidebar item a pane
 * belongs under, what a search finds and in what order, and where an arrow key
 * or a typed letter moves the selection. The view reads the page into the
 * shapes below and asks these functions what to do.
 */

/** A pane as the page declares it. `parent` is empty for a pane in the sidebar. */
export interface SettingsPaneInfo {
  id: string
  title: string
  keywords?: string
  parent?: string
}

/** A sidebar item. Its id is the id of the pane it opens. */
export interface SettingsItemInfo {
  id: string
  label: string
  keywords?: string
}

/** A row inside a pane. `id` is its `data-setting`, empty when it has none. */
export interface SettingsRowInfo {
  id: string
  label: string
  keywords?: string
  /** The pane the row sits in. */
  pane: string
}

/** Everything a search looks through. */
export interface SettingsSearchIndex {
  panes: readonly SettingsPaneInfo[]
  items: readonly SettingsItemInfo[]
  rows: readonly SettingsRowInfo[]
}

/** A setting a search found. */
export interface SettingsSearchHit {
  /** The row's `data-setting`, empty when it has none. */
  id: string
  label: string
  pane: string
  paneTitle: string
  /** Where the row is in the index, so the view can find the element again. */
  row: number
  rank: number
}

export interface SettingsSearchResult {
  query: string
  /** Sidebar items that match, in sidebar order. */
  panes: string[]
  /** Settings that match, best first. */
  settings: SettingsSearchHit[]
}

/** The trail of panes visited, and where in it the window is. */
export interface SettingsHistory {
  trail: readonly string[]
  cursor: number
}

/** How well a label matched. Higher is better; `NONE` is no match. */
export const SETTINGS_RANK = { NONE: 0, KEYWORD: 1, SUBSTRING: 2, WORD_PREFIX: 3, PREFIX: 4 } as const

/** How long a typed run of letters stays one word, in milliseconds. */
export const SETTINGS_TYPE_AHEAD_MS = 700

/** How long a found row stays highlighted, in milliseconds. */
export const SETTINGS_HIGHLIGHT_MS = 1600

// ---------------------------------------------------------------------------
// Panes
// ---------------------------------------------------------------------------

/** The storage name the last pane is kept under. */
export function settingsStorageName(key: string): string {
  return `stx:settings:${key}`
}

export function findSettingsPane(panes: readonly SettingsPaneInfo[], id: string | null | undefined): SettingsPaneInfo | null {
  if (!id)
    return null
  return panes.find(pane => pane.id === id) ?? null
}

/** The pane a window opens on when nothing says otherwise: the first that is not a sub-pane. */
export function firstSettingsPane(panes: readonly SettingsPaneInfo[]): string {
  const top = panes.find(pane => !pane.parent)
  return (top ?? panes[0])?.id ?? ''
}

/**
 * The first of `wanted` that is a pane, or the first pane.
 *
 * A stored id outlives the pane it named, and a prop can be mistyped. Neither
 * should open a window on nothing.
 */
export function resolveSettingsPane(panes: readonly SettingsPaneInfo[], ...wanted: Array<string | null | undefined>): string {
  for (const id of wanted) {
    if (findSettingsPane(panes, id))
      return id as string
  }
  return firstSettingsPane(panes)
}

/**
 * The sidebar item that stays selected while `id` is open: the pane itself, or
 * for a sub-pane the pane at the top of its chain of parents.
 */
export function settingsSidebarPane(panes: readonly SettingsPaneInfo[], id: string): string {
  const seen = new Set<string>()
  let current = findSettingsPane(panes, id)
  while (current && current.parent && !seen.has(current.id)) {
    seen.add(current.id)
    const parent = findSettingsPane(panes, current.parent)
    if (!parent)
      break
    current = parent
  }
  return current?.id ?? ''
}

/** The pane above a sub-pane, or empty. A parent that does not exist is no parent. */
export function settingsParentPane(panes: readonly SettingsPaneInfo[], id: string): string {
  const pane = findSettingsPane(panes, id)
  if (!pane?.parent || pane.parent === id)
    return ''
  return findSettingsPane(panes, pane.parent) ? pane.parent : ''
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function emptySettingsHistory(): SettingsHistory {
  return { trail: [], cursor: -1 }
}

export function settingsHistoryCurrent(history: SettingsHistory): string {
  return history.trail[history.cursor] ?? ''
}

/**
 * Visit a pane. Whatever lay ahead of the cursor is a future this choice
 * replaced, as a browser drops its forward stack on a new navigation. Visiting
 * the pane that is already open changes nothing.
 */
export function settingsHistoryVisit(history: SettingsHistory, id: string): SettingsHistory {
  if (!id || settingsHistoryCurrent(history) === id)
    return history
  const trail = [...history.trail.slice(0, history.cursor + 1), id]
  return { trail, cursor: trail.length - 1 }
}

export function settingsCanGoForward(history: SettingsHistory): boolean {
  return history.cursor < history.trail.length - 1
}

/**
 * Back is possible when there is a pane behind the cursor, or when the window
 * opened straight onto a sub-pane, whose parent is then where back leads.
 */
export function settingsCanGoBack(history: SettingsHistory, panes: readonly SettingsPaneInfo[] = []): boolean {
  if (history.cursor > 0)
    return true
  return history.cursor === 0 && settingsParentPane(panes, settingsHistoryCurrent(history)) !== ''
}

export function settingsHistoryBack(history: SettingsHistory, panes: readonly SettingsPaneInfo[] = []): SettingsHistory {
  if (history.cursor > 0)
    return { trail: history.trail, cursor: history.cursor - 1 }
  if (history.cursor === 0) {
    const parent = settingsParentPane(panes, settingsHistoryCurrent(history))
    // The parent goes in behind the sub-pane, so forward returns to it.
    if (parent)
      return { trail: [parent, ...history.trail], cursor: 0 }
  }
  return history
}

export function settingsHistoryForward(history: SettingsHistory): SettingsHistory {
  return settingsCanGoForward(history) ? { trail: history.trail, cursor: history.cursor + 1 } : history
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Lower case, accents folded, runs of space made one. What both sides of a match are compared as. */
export function normalizeSettingsText(text: string | null | undefined): string {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function wordStarts(text: string, needle: string): boolean {
  let from = text.indexOf(needle)
  while (from !== -1) {
    if (from === 0 || !/[\p{L}\p{N}]/u.test(text.charAt(from - 1)))
      return true
    from = text.indexOf(needle, from + 1)
  }
  return false
}

function rankOne(needle: string, label: string, keywords: string): number {
  if (label.startsWith(needle))
    return SETTINGS_RANK.PREFIX
  if (wordStarts(label, needle))
    return SETTINGS_RANK.WORD_PREFIX
  if (label.includes(needle))
    return SETTINGS_RANK.SUBSTRING
  // A keyword is matched from its start: a letter out of the middle of a word
  // nobody can see would make every search list everything.
  if (wordStarts(keywords, needle))
    return SETTINGS_RANK.KEYWORD
  return SETTINGS_RANK.NONE
}

/**
 * How well `query` matches a label and its keywords.
 *
 * The label starting with the query is best, then a word of the label starting
 * with it, then the query anywhere in the label, then the keywords. A query of
 * several words matches when every word does, and is as good as its weakest
 * word, unless the label holds the whole phrase.
 */
export function settingsMatchRank(query: string, label: string, keywords = ''): number {
  const needle = normalizeSettingsText(query)
  if (needle === '')
    return SETTINGS_RANK.NONE
  const text = normalizeSettingsText(label)
  const extra = normalizeSettingsText(keywords)

  const whole = rankOne(needle, text, extra)
  const words = needle.split(' ')
  if (whole !== SETTINGS_RANK.NONE || words.length === 1)
    return whole

  let weakest: number = SETTINGS_RANK.PREFIX
  for (const word of words) {
    const rank = rankOne(word, text, extra)
    if (rank === SETTINGS_RANK.NONE)
      return SETTINGS_RANK.NONE
    // Only the first word can be what the label starts with.
    weakest = Math.min(weakest, rank === SETTINGS_RANK.PREFIX && word !== words[0] ? SETTINGS_RANK.WORD_PREFIX : rank)
  }
  return weakest
}

/**
 * Search the sidebar and the settings inside the panes.
 *
 * A sidebar item matches on its label, its own keywords and its pane's. A
 * setting matches on its label and its keywords, and last of all on the name
 * of the pane it is in, so typing a pane's name lists what is in it under the
 * better matches. Settings come back best first, and in page order within a
 * rank.
 */
export function searchSettings(query: string, index: SettingsSearchIndex): SettingsSearchResult {
  const text = normalizeSettingsText(query)
  if (text === '')
    return { query: '', panes: [], settings: [] }

  const panes: string[] = []
  for (const item of index.items) {
    const pane = findSettingsPane(index.panes, item.id)
    const keywords = `${item.keywords ?? ''} ${pane?.keywords ?? ''} ${pane && pane.title !== item.label ? pane.title : ''}`
    if (settingsMatchRank(text, item.label, keywords) !== SETTINGS_RANK.NONE)
      panes.push(item.id)
  }

  const settings: SettingsSearchHit[] = []
  index.rows.forEach((row, position) => {
    if (!row.label)
      return
    const pane = findSettingsPane(index.panes, row.pane)
    const paneTitle = pane?.title ?? ''
    const rank = settingsMatchRank(text, row.label, `${row.keywords ?? ''} ${paneTitle}`)
    if (rank !== SETTINGS_RANK.NONE)
      settings.push({ id: row.id, label: row.label, pane: row.pane, paneTitle, row: position, rank })
  })
  settings.sort((a, b) => b.rank - a.rank || a.row - b.row)

  return { query: text, panes, settings }
}

/** What a screen reader is told after a search. */
export function settingsResultsAnnouncement(count: number): string {
  if (count <= 0)
    return 'No results'
  return count === 1 ? '1 result' : `${count} results`
}

// ---------------------------------------------------------------------------
// The keyboard in the sidebar
// ---------------------------------------------------------------------------

/**
 * Where a key moves from `index` in a list of `count`, or -1 when the key is
 * not one that moves. The ends stop, as they do in a Mac source list.
 */
export function settingsRovingIndex(key: string, index: number, count: number): number {
  if (count <= 0)
    return -1
  if (key === 'ArrowDown')
    return Math.min(count - 1, index + 1)
  if (key === 'ArrowUp')
    return index < 0 ? count - 1 : Math.max(0, index - 1)
  if (key === 'Home')
    return 0
  if (key === 'End')
    return count - 1
  return -1
}

/** The letters typed so far, and when the last one landed. */
export interface SettingsTypeAhead {
  buffer: string
  at: number
}

/** Add a typed character. A pause starts a new word. */
export function settingsTypeAheadAdd(state: SettingsTypeAhead | null, character: string, now: number, timeout = SETTINGS_TYPE_AHEAD_MS): SettingsTypeAhead {
  const fresh = !state || now - state.at > timeout
  return { buffer: (fresh ? '' : state.buffer) + normalizeSettingsText(character), at: now }
}

/**
 * The item a typed word selects, or -1.
 *
 * One letter, or the same letter again and again, walks through the items that
 * start with it, beginning after the current one. A longer word stays on the
 * current item while it still matches, and otherwise finds the next that does.
 */
export function settingsTypeAheadMatch(labels: readonly string[], buffer: string, current: number): number {
  const count = labels.length
  const typed = normalizeSettingsText(buffer)
  if (count === 0 || typed === '')
    return -1

  const repeated = typed.split('').every(letter => letter === typed.charAt(0))
  const needle = repeated ? typed.charAt(0) : typed
  const start = repeated ? current + 1 : Math.max(0, current)
  for (let offset = 0; offset < count; offset++) {
    const index = (((start + offset) % count) + count) % count
    if (normalizeSettingsText(labels[index]).startsWith(needle))
      return index
  }
  return -1
}
