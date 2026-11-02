import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { createStyleVariables } from '../../src/native/compiler/style-variables'

// A screen compiles each node's class list more than once, and many nodes share
// one. The compiled styles are remembered, so these pin down what the cache may
// treat as the same request and what it must not.
describe('remembered class styles', () => {
  it('answers the same class list, variables and flags with the same result', () => {
    const variables = new Map([['--stx-field', '#123456']])
    const first = compileClassStyles('flex-row gap-2 bg-field rounded-control', variables, { focusWithin: true })
    expect(compileClassStyles('flex-row gap-2 bg-field rounded-control', variables, { focusWithin: true })).toBe(first)
    expect(first.style).toMatchObject({ flexDirection: 'row', gap: 8, backgroundColor: '#123456', borderRadius: 6 })
  })

  it('compiles again for other variables, rules, flags or classes', () => {
    const classes = 'bg-field px-control-x hover:bg-white'
    const blue = compileClassStyles(classes, new Map([['--stx-field', '#0000ff']]))
    const red = compileClassStyles(classes, new Map([['--stx-field', '#ff0000']]))
    expect(blue.style.backgroundColor).toBe('#0000ff')
    expect(red.style.backgroundColor).toBe('#ff0000')
    expect(compileClassStyles(classes, undefined, { pointer: true }).pointer?.hover?.style.backgroundColor).toBe('#ffffff')
    expect(compileClassStyles(classes).pointer).toBeUndefined()
    const rules = { 'bg-field': { light: 'background-color: #00ff00' } }
    expect(compileClassStyles('bg-field', undefined, { rules }).style.backgroundColor).toBe('#00ff00')
    expect(compileClassStyles('bg-field', undefined, { appearance: 'dark' })).not.toBe(compileClassStyles('bg-field', undefined, { appearance: 'light' }))
  })

  it('hands a scope that declares no variables its parent\'s map, so a subtree shares one cache', () => {
    const parent = createStyleVariables([['--stx-field', '#123456']]).computed()
    expect(createStyleVariables([], parent).computed()).toBe(parent)
    expect(createStyleVariables([['not-a-variable', 'x']], parent).computed()).toBe(parent)
    expect(createStyleVariables([]).computed()).toBe(createStyleVariables([]).computed())
    const child = createStyleVariables([['--stx-fg', '#abcdef']], parent).computed()
    expect(child).not.toBe(parent)
    expect([...child]).toEqual([['--stx-field', '#123456'], ['--stx-fg', '#abcdef']])
    expect(parent.has('--stx-fg')).toBe(false)
  })
})
