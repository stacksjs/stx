import type { SettingsPaneInfo, SettingsSearchIndex } from '../../src/ui/settings/core'
import { describe, expect, it } from 'bun:test'
import {
  emptySettingsHistory,
  findSettingsPane,
  firstSettingsPane,
  normalizeSettingsText,
  resolveSettingsPane,
  searchSettings,
  SETTINGS_RANK,
  settingsCanGoBack,
  settingsCanGoForward,
  settingsHistoryBack,
  settingsHistoryCurrent,
  settingsHistoryForward,
  settingsHistoryVisit,
  settingsMatchRank,
  settingsParentPane,
  settingsResultsAnnouncement,
  settingsRovingIndex,
  settingsSidebarPane,
  settingsStorageName,
  settingsTypeAheadAdd,
  settingsTypeAheadMatch,
} from '../../src/ui/settings/core'

const PANES: SettingsPaneInfo[] = [
  { id: 'general', title: 'General', keywords: 'preferences setup' },
  { id: 'about', title: 'About', parent: 'general' },
  { id: 'licence', title: 'Licence', parent: 'about' },
  { id: 'appearance', title: 'Appearance', keywords: 'dark light theme' },
  { id: 'network', title: 'Network' },
]

const visit = (...ids: string[]) => ids.reduce(settingsHistoryVisit, emptySettingsHistory())

describe('the pane registry', () => {
  it('finds a pane by its id', () => {
    expect(findSettingsPane(PANES, 'about')?.title).toBe('About')
    expect(findSettingsPane(PANES, 'nowhere')).toBeNull()
    expect(findSettingsPane(PANES, '')).toBeNull()
    expect(findSettingsPane(PANES, null)).toBeNull()
  })

  it('opens on the first pane that is not a sub-pane', () => {
    expect(firstSettingsPane(PANES)).toBe('general')
    expect(firstSettingsPane([{ id: 'sub', title: 'Sub', parent: 'top' }, { id: 'top', title: 'Top' }])).toBe('top')
    expect(firstSettingsPane([{ id: 'only', title: 'Only', parent: 'gone' }])).toBe('only')
    expect(firstSettingsPane([])).toBe('')
  })

  it('takes the first wanted pane that exists', () => {
    expect(resolveSettingsPane(PANES, 'appearance', 'network')).toBe('appearance')
    expect(resolveSettingsPane(PANES, '', 'network')).toBe('network')
    expect(resolveSettingsPane(PANES, null, undefined, 'about')).toBe('about')
  })

  it('falls back to the first pane when a stored id no longer exists', () => {
    expect(resolveSettingsPane(PANES, 'removed-last-year')).toBe('general')
    expect(resolveSettingsPane(PANES, 'removed-last-year', 'network')).toBe('network')
    expect(resolveSettingsPane(PANES)).toBe('general')
    expect(resolveSettingsPane([], 'general')).toBe('')
  })

  it('keeps a sub-pane under the sidebar item at the top of its parents', () => {
    expect(settingsSidebarPane(PANES, 'general')).toBe('general')
    expect(settingsSidebarPane(PANES, 'about')).toBe('general')
    expect(settingsSidebarPane(PANES, 'licence')).toBe('general')
    expect(settingsSidebarPane(PANES, 'nowhere')).toBe('')
  })

  it('does not follow parents round in a circle, or to a pane that is not there', () => {
    const loop: SettingsPaneInfo[] = [{ id: 'a', title: 'A', parent: 'b' }, { id: 'b', title: 'B', parent: 'a' }]
    expect(['a', 'b']).toContain(settingsSidebarPane(loop, 'a'))
    expect(settingsSidebarPane([{ id: 'orphan', title: 'Orphan', parent: 'gone' }], 'orphan')).toBe('orphan')
  })

  it('names the pane above a sub-pane', () => {
    expect(settingsParentPane(PANES, 'licence')).toBe('about')
    expect(settingsParentPane(PANES, 'general')).toBe('')
    expect(settingsParentPane([{ id: 'orphan', title: 'Orphan', parent: 'gone' }], 'orphan')).toBe('')
    expect(settingsParentPane([{ id: 'self', title: 'Self', parent: 'self' }], 'self')).toBe('')
  })

  it('keeps the last pane under a name of its own', () => {
    expect(settingsStorageName('my-app')).toBe('stx:settings:my-app')
  })
})

describe('the history trail', () => {
  it('starts with nothing behind and nothing ahead', () => {
    const history = emptySettingsHistory()

    expect(settingsHistoryCurrent(history)).toBe('')
    expect(settingsCanGoBack(history, PANES)).toBe(false)
    expect(settingsCanGoForward(history)).toBe(false)
    expect(settingsHistoryBack(history, PANES)).toBe(history)
    expect(settingsHistoryForward(history)).toBe(history)
  })

  it('records each pane visited', () => {
    const history = visit('general', 'appearance', 'network')

    expect(history.trail).toEqual(['general', 'appearance', 'network'])
    expect(settingsHistoryCurrent(history)).toBe('network')
    expect(settingsCanGoBack(history)).toBe(true)
    expect(settingsCanGoForward(history)).toBe(false)
  })

  it('does not record the open pane twice, or an empty id', () => {
    const history = visit('general', 'general')

    expect(history.trail).toEqual(['general'])
    expect(settingsHistoryVisit(history, 'general')).toBe(history)
    expect(settingsHistoryVisit(history, '')).toBe(history)
  })

  it('goes back and forward along the trail without changing it', () => {
    const history = visit('general', 'appearance', 'network')
    const back = settingsHistoryBack(history)
    const twice = settingsHistoryBack(back)

    expect(settingsHistoryCurrent(back)).toBe('appearance')
    expect(settingsHistoryCurrent(twice)).toBe('general')
    expect(settingsCanGoBack(twice)).toBe(false)
    expect(settingsHistoryBack(twice)).toBe(twice)
    expect(settingsCanGoForward(twice)).toBe(true)
    expect(settingsHistoryCurrent(settingsHistoryForward(twice))).toBe('appearance')
    expect(twice.trail).toEqual(['general', 'appearance', 'network'])
    expect(history.cursor).toBe(2)
  })

  it('drops the forward stack on a new choice', () => {
    const back = settingsHistoryBack(settingsHistoryBack(visit('general', 'appearance', 'network')))
    const next = settingsHistoryVisit(back, 'about')

    expect(next.trail).toEqual(['general', 'about'])
    expect(settingsCanGoForward(next)).toBe(false)
    expect(settingsHistoryCurrent(next)).toBe('about')
  })

  it('can return to a pane it left, as a new step', () => {
    expect(visit('general', 'appearance', 'general').trail).toEqual(['general', 'appearance', 'general'])
  })

  it('leads back to the parent when the window opened straight onto a sub-pane', () => {
    const history = visit('about')

    expect(settingsCanGoBack(history)).toBe(false)
    expect(settingsCanGoBack(history, PANES)).toBe(true)

    const back = settingsHistoryBack(history, PANES)
    expect(back.trail).toEqual(['general', 'about'])
    expect(settingsHistoryCurrent(back)).toBe('general')
    expect(settingsCanGoBack(back, PANES)).toBe(false)
    expect(settingsHistoryCurrent(settingsHistoryForward(back))).toBe('about')
  })

  it('climbs one parent at a time', () => {
    const up = settingsHistoryBack(visit('licence'), PANES)
    const top = settingsHistoryBack(up, PANES)

    expect(settingsHistoryCurrent(up)).toBe('about')
    expect(settingsHistoryCurrent(top)).toBe('general')
    expect(top.trail).toEqual(['general', 'about', 'licence'])
  })
})

describe('matching a query', () => {
  it('compares without case, accents or stray space', () => {
    expect(normalizeSettingsText('  Wi-Fi   Réseau ')).toBe('wi-fi reseau')
    expect(normalizeSettingsText(null)).toBe('')
  })

  it('ranks a label that starts with the query first', () => {
    expect(settingsMatchRank('dis', 'Displays')).toBe(SETTINGS_RANK.PREFIX)
    expect(settingsMatchRank('DIS', 'displays')).toBe(SETTINGS_RANK.PREFIX)
  })

  it('then a word of the label that starts with it', () => {
    expect(settingsMatchRank('dock', 'Desktop & Dock')).toBe(SETTINGS_RANK.WORD_PREFIX)
    expect(settingsMatchRank('fi', 'Wi-Fi')).toBe(SETTINGS_RANK.WORD_PREFIX)
    expect(settingsMatchRank('time', 'Screen Time')).toBe(SETTINGS_RANK.WORD_PREFIX)
  })

  it('then the query anywhere in the label', () => {
    expect(settingsMatchRank('play', 'Displays')).toBe(SETTINGS_RANK.SUBSTRING)
    expect(settingsMatchRank('ock', 'Desktop & Dock')).toBe(SETTINGS_RANK.SUBSTRING)
  })

  it('then the keywords', () => {
    expect(settingsMatchRank('dark', 'Appearance', 'dark light theme')).toBe(SETTINGS_RANK.KEYWORD)
    expect(settingsMatchRank('the', 'Appearance', 'dark light theme')).toBe(SETTINGS_RANK.KEYWORD)
  })

  it('matches a keyword from its start only', () => {
    expect(settingsMatchRank('hem', 'Appearance', 'dark light theme')).toBe(SETTINGS_RANK.NONE)
  })

  it('prefers the label to the keywords when both match', () => {
    expect(settingsMatchRank('sound', 'Sound', 'sound volume')).toBe(SETTINGS_RANK.PREFIX)
  })

  it('finds nothing in an empty query or an unrelated one', () => {
    expect(settingsMatchRank('', 'Displays')).toBe(SETTINGS_RANK.NONE)
    expect(settingsMatchRank('   ', 'Displays')).toBe(SETTINGS_RANK.NONE)
    expect(settingsMatchRank('printer', 'Displays', 'screen monitor')).toBe(SETTINGS_RANK.NONE)
  })

  it('needs every word of a longer query, and is as good as the weakest', () => {
    expect(settingsMatchRank('screen time', 'Screen Time')).toBe(SETTINGS_RANK.PREFIX)
    expect(settingsMatchRank('wi fi', 'Wi-Fi')).toBe(SETTINGS_RANK.WORD_PREFIX)
    expect(settingsMatchRank('time screen', 'Screen Time')).toBe(SETTINGS_RANK.WORD_PREFIX)
    expect(settingsMatchRank('screen dark', 'Screen Time', 'dark')).toBe(SETTINGS_RANK.KEYWORD)
    expect(settingsMatchRank('screen printer', 'Screen Time')).toBe(SETTINGS_RANK.NONE)
  })

  it('folds accents on both sides', () => {
    expect(settingsMatchRank('reseau', 'Réseau')).toBe(SETTINGS_RANK.PREFIX)
    expect(settingsMatchRank('Réseau', 'reseau')).toBe(SETTINGS_RANK.PREFIX)
  })
})

describe('searching the window', () => {
  const index: SettingsSearchIndex = {
    panes: [
      { id: 'general', title: 'General', keywords: 'preferences' },
      { id: 'appearance', title: 'Appearance', keywords: 'dark light theme' },
      { id: 'sound', title: 'Sound' },
      { id: 'displays', title: 'Displays' },
      { id: 'night', title: 'Night Shift', parent: 'displays' },
    ],
    items: [
      { id: 'general', label: 'General' },
      { id: 'appearance', label: 'Appearance' },
      { id: 'sound', label: 'Sound', keywords: 'volume speaker' },
      { id: 'displays', label: 'Displays' },
    ],
    rows: [
      { id: 'startup-sound', label: 'Play sound on startup', pane: 'sound' },
      { id: 'sidebar-size', label: 'Sidebar icon size', pane: 'appearance' },
      { id: 'accent', label: 'Color', keywords: 'accent tint', pane: 'appearance' },
      { id: 'alert', label: 'Alert volume', keywords: 'beep', pane: 'sound' },
      { id: '', label: 'Sound effects', pane: 'sound' },
      { id: 'schedule', label: 'Schedule', keywords: 'sunset sunrise', pane: 'night' },
      { id: 'unlabelled', label: '', keywords: 'sound', pane: 'sound' },
    ],
  }

  it('finds nothing for an empty query', () => {
    expect(searchSettings('   ', index)).toEqual({ query: '', panes: [], settings: [] })
  })

  it('filters the sidebar by label, in sidebar order', () => {
    expect(searchSettings('s', index).panes).toEqual(['sound', 'displays'])
    expect(searchSettings('a', index).panes).toEqual(['general', 'appearance', 'displays'])
  })

  it('finds a sidebar item by its own keywords and its pane\'s', () => {
    expect(searchSettings('volume', index).panes).toEqual(['sound'])
    expect(searchSettings('theme', index).panes).toEqual(['appearance'])
    expect(searchSettings('preferences', index).panes).toEqual(['general'])
  })

  it('lists matching settings best first: prefix, word, substring, keywords', () => {
    const found = searchSettings('so', index).settings

    expect(found.map(hit => hit.label)).toEqual(['Sound effects', 'Play sound on startup', 'Alert volume'])
    expect(found.map(hit => hit.rank)).toEqual([SETTINGS_RANK.PREFIX, SETTINGS_RANK.WORD_PREFIX, SETTINGS_RANK.KEYWORD])
  })

  it('keeps page order within a rank', () => {
    expect(searchSettings('s', index).settings.filter(hit => hit.rank === SETTINGS_RANK.PREFIX).map(hit => hit.label)).toEqual(['Sidebar icon size', 'Sound effects', 'Schedule'])
  })

  it('says which pane a setting is in, and where it is in the index', () => {
    const [hit] = searchSettings('sidebar', index).settings

    expect(hit).toEqual({ id: 'sidebar-size', label: 'Sidebar icon size', pane: 'appearance', paneTitle: 'Appearance', row: 1, rank: SETTINGS_RANK.PREFIX })
  })

  it('finds a setting by its keywords', () => {
    expect(searchSettings('tint', index).settings.map(hit => hit.id)).toEqual(['accent'])
    expect(searchSettings('sunset', index).settings.map(hit => hit.pane)).toEqual(['night'])
  })

  it('lists what a pane holds under its name, after better matches', () => {
    expect(searchSettings('appearance', index).settings.map(hit => hit.id)).toEqual(['sidebar-size', 'accent'])
    expect(searchSettings('appearance', index).panes).toEqual(['appearance'])
  })

  it('leaves out a row with no label', () => {
    expect(searchSettings('sound', index).settings.some(hit => hit.id === 'unlabelled')).toBe(false)
  })

  it('reports the query as it was compared', () => {
    expect(searchSettings('  SoUnD ', index).query).toBe('sound')
  })

  it('finds nothing where there is nothing', () => {
    expect(searchSettings('zzz', index)).toEqual({ query: 'zzz', panes: [], settings: [] })
  })
})

describe('what a screen reader is told', () => {
  it('counts the results', () => {
    expect(settingsResultsAnnouncement(0)).toBe('No results')
    expect(settingsResultsAnnouncement(1)).toBe('1 result')
    expect(settingsResultsAnnouncement(3)).toBe('3 results')
  })
})

describe('the keyboard in the sidebar', () => {
  it('moves down and up one item, and stops at the ends', () => {
    expect(settingsRovingIndex('ArrowDown', 0, 4)).toBe(1)
    expect(settingsRovingIndex('ArrowDown', 3, 4)).toBe(3)
    expect(settingsRovingIndex('ArrowUp', 2, 4)).toBe(1)
    expect(settingsRovingIndex('ArrowUp', 0, 4)).toBe(0)
  })

  it('jumps to the ends with Home and End', () => {
    expect(settingsRovingIndex('Home', 2, 4)).toBe(0)
    expect(settingsRovingIndex('End', 1, 4)).toBe(3)
  })

  it('enters the list from outside it', () => {
    expect(settingsRovingIndex('ArrowDown', -1, 4)).toBe(0)
    expect(settingsRovingIndex('ArrowUp', -1, 4)).toBe(3)
  })

  it('leaves every other key alone', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' ', 'a', 'PageDown'])
      expect(settingsRovingIndex(key, 1, 4)).toBe(-1)
    expect(settingsRovingIndex('ArrowDown', 0, 0)).toBe(-1)
  })

  const LABELS = ['Wi-Fi', 'Bluetooth', 'Network', 'Notifications', 'Sound', 'Screen Time', 'Siri']

  it('gathers letters typed close together into a word', () => {
    const first = settingsTypeAheadAdd(null, 'S', 1000)
    const second = settingsTypeAheadAdd(first, 'c', 1300)

    expect(first).toEqual({ buffer: 's', at: 1000 })
    expect(second).toEqual({ buffer: 'sc', at: 1300 })
  })

  it('starts a new word after a pause', () => {
    const first = settingsTypeAheadAdd(null, 's', 1000)

    expect(settingsTypeAheadAdd(first, 'n', 1701).buffer).toBe('n')
    expect(settingsTypeAheadAdd(first, 'n', 1700).buffer).toBe('sn')
    expect(settingsTypeAheadAdd(first, 'n', 1100, 50).buffer).toBe('n')
  })

  it('selects the next item starting with a typed letter, after the current one', () => {
    expect(settingsTypeAheadMatch(LABELS, 'n', 0)).toBe(2)
    expect(settingsTypeAheadMatch(LABELS, 'n', 2)).toBe(3)
    expect(settingsTypeAheadMatch(LABELS, 'n', 3)).toBe(2)
    expect(settingsTypeAheadMatch(LABELS, 'b', -1)).toBe(1)
  })

  it('walks through the matches when the same letter is typed again', () => {
    expect(settingsTypeAheadMatch(LABELS, 's', 0)).toBe(4)
    expect(settingsTypeAheadMatch(LABELS, 'ss', 4)).toBe(5)
    expect(settingsTypeAheadMatch(LABELS, 'sss', 5)).toBe(6)
    expect(settingsTypeAheadMatch(LABELS, 'ssss', 6)).toBe(4)
  })

  it('stays on the current item while a longer word still matches it', () => {
    expect(settingsTypeAheadMatch(LABELS, 'so', 4)).toBe(4)
    expect(settingsTypeAheadMatch(LABELS, 'sc', 4)).toBe(5)
    expect(settingsTypeAheadMatch(LABELS, 'si', 4)).toBe(6)
    expect(settingsTypeAheadMatch(LABELS, 'net', 6)).toBe(2)
  })

  it('finds nothing for a word no item starts with', () => {
    expect(settingsTypeAheadMatch(LABELS, 'x', 0)).toBe(-1)
    expect(settingsTypeAheadMatch(LABELS, '', 0)).toBe(-1)
    expect(settingsTypeAheadMatch([], 's', 0)).toBe(-1)
  })
})
