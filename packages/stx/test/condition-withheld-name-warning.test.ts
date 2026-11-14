import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { safeEvaluateCondition } from '../src/safe-evaluator'

describe('a condition that reads a withheld double-underscore name', () => {
  let warn: ReturnType<typeof spyOn>
  beforeEach(() => { warn = spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { warn.mockRestore() })

  const said = (): string[] => warn.mock.calls.map(call => String(call[0]))

  it('still fails closed, and says which name and what to do instead', () => {
    const context = { __rows: [{ n: 'a' }] }
    expect(safeEvaluateCondition('__rows.length > 0 /* one */', context)).toBe(false)
    expect(safeEvaluateCondition('!(__rows.length) /* one */', context)).toBe(false)

    const messages = said().filter(message => message.includes('/* one */'))
    expect(messages).toHaveLength(2)
    expect(messages[0]).toContain('`__rows`')
    expect(messages[0]).toContain('withheld from @if, @elseif and @unless')
    expect(messages[0]).toContain('const hasRows = __rows.length > 0')
  })

  it('says it once per condition, not once per render', () => {
    const context = { __flag: true }
    for (let render = 0; render < 5; render++)
      safeEvaluateCondition('__flag /* two */', context)
    expect(said().filter(message => message.includes('/* two */'))).toHaveLength(1)
  })

  it('stays quiet about a name nobody declared and about ordinary names', () => {
    expect(safeEvaluateCondition('__absent /* three */', {})).toBe(false)
    expect(safeEvaluateCondition('rows.length > 0 /* three */', { rows: [1] })).toBe(true)
    expect(said().filter(message => message.includes('/* three */'))).toEqual([])
  })
})
