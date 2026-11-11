/** The completion list as state: what is shown, what is selected, what accepting does. */
import { describe, expect, test } from 'bun:test'
import { CompletionList, matchScore, rankCompletions, wordStart } from '../../src/ui/code-editor/core'

const ITEMS = [
  { label: 'getUser' },
  { label: 'getUserByEmail' },
  { label: 'get' },
  { label: 'forget' },
  { label: 'User', kind: 'class' },
  { label: 'where', insert: 'where()' },
]

const labels = (query: string): string[] => rankCompletions(ITEMS, query).map(entry => entry.item.label)

describe('matching', () => {
  test('every character has to be there, in order', () => {
    expect(matchScore('gu', 'getUser')).not.toBeNull()
    expect(matchScore('ug', 'getUser')).toBeNull()
    expect(matchScore('getx', 'getUser')).toBeNull()
  })

  test('case does not matter for whether, only for how well', () => {
    expect(matchScore('GETUSER', 'getUser')).not.toBeNull()
    expect(matchScore('getUser', 'getUser')!.score).toBeGreaterThan(matchScore('getuser', 'getUser')!.score)
  })

  test('reports which characters matched, for emphasis', () => {
    expect(matchScore('gU', 'getUser')!.matches).toEqual([0, 3])
  })

  test('an empty query matches everything, in the order given', () => {
    expect(labels('')).toEqual(ITEMS.map(item => item.label))
  })
})

describe('ranking', () => {
  test('a prefix beats the same letters further in', () => {
    expect(labels('get').slice(0, 3)).toEqual(['get', 'getUser', 'getUserByEmail'])
    expect(labels('get')).toContain('forget')
    expect(labels('get').indexOf('forget')).toBe(3)
  })

  test('the start of a word inside a name beats the middle of one', () => {
    const ranked = rankCompletions([{ label: 'cluster' }, { label: 'getUser' }], 'us').map(entry => entry.item.label)

    expect(ranked).toEqual(['getUser', 'cluster'])
  })

  test('what does not match is gone', () => {
    expect(labels('wh')).toEqual(['where'])
    expect(labels('zzz')).toEqual([])
  })

  test('a boost settles a tie, and can lift a weaker match', () => {
    const ranked = rankCompletions([{ label: 'alpha' }, { label: 'alpine', boost: 100 }], 'al')

    expect(ranked[0]!.item.label).toBe('alpine')
  })

  test('filterText is matched in place of the label', () => {
    const ranked = rankCompletions([{ label: '→ result', filterText: 'result' }], 'res')

    expect(ranked).toHaveLength(1)
    expect(ranked[0]!.matches).toEqual([])
  })
})

describe('the word being completed', () => {
  test('starts after the last character that cannot be in a name', () => {
    expect(wordStart('User.where', 10)).toBe(5)
    expect(wordStart('const $el', 9)).toBe(6)
    expect(wordStart('a.', 2)).toBe(2)
    expect(wordStart('naïve', 5)).toBe(0)
  })
})

describe('the list', () => {
  test('opens on the best match', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, 'get')

    expect(list.isOpen).toBe(true)
    expect(list.selected!.label).toBe('get')
    expect(list.visible).toHaveLength(4)
  })

  test('arrow keys move the selection and wrap', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, 'get')
    list.move(1)
    expect(list.selected!.label).toBe('getUser')
    list.move(-2)
    expect(list.selected!.label).toBe('forget')
    list.move(1)
    expect(list.selected!.label).toBe('get')
  })

  test('typing narrows it without asking again', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, 'g')
    list.filter('getU')

    expect(list.visible.map(entry => entry.item.label)).toEqual(['getUser', 'getUserByEmail'])
  })

  test('a selection the reader made survives narrowing while it still matches', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, 'get')
    list.move(2)
    expect(list.selected!.label).toBe('getUserByEmail')
    list.filter('getU')

    expect(list.selected!.label).toBe('getUserByEmail')
  })

  test('closes itself when nothing matches', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, 'get')
    list.filter('getz')

    expect(list.isOpen).toBe(false)
    expect(list.accept(4)).toBeNull()
  })

  test('opening with nothing to show is not open', () => {
    const list = new CompletionList()
    list.open([], 0, '')

    expect(list.isOpen).toBe(false)
  })

  test('accepting replaces the typed part of the word', () => {
    const list = new CompletionList()
    // `User.getU|` with the word starting at offset 5.
    list.open(ITEMS, 5, 'getU')

    expect(list.accept(9)).toEqual({ change: { from: 5, to: 9, insert: 'getUser' }, item: ITEMS[0]! })
  })

  test('accepting inserts what the item says to insert', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, 'wh')

    expect(list.accept(2)!.change.insert).toBe('where()')
  })

  test('closing forgets the items', () => {
    const list = new CompletionList()
    list.open(ITEMS, 0, '')
    list.close()

    expect(list.visible).toEqual([])
    expect(list.selected).toBeUndefined()
  })
})
