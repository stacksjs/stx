import { describe, expect, it } from 'bun:test'
import { compileClassStyles, compileHeadwindToStyle } from '../../src/native/compiler/headwind-to-style'

describe('shared design-token defaults on native (#2090)', () => {
  it('preserves the default shape, padding and typography of a shared control', () => {
    const result = compileClassStyles('rounded-control px-control-x py-control-y text-control')
    expect(result.unknown).toEqual([])
    expect(result.style).toEqual({ borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, lineHeight: 24 })
  })

  it('supports table density roles and the same role on individual spacing edges', () => {
    expect(compileHeadwindToStyle('px-cell-x py-cell-y text-cell')).toEqual({ paddingHorizontal: 24, paddingVertical: 16, fontSize: 14, lineHeight: 20 })
    expect(compileHeadwindToStyle('px-cell-x py-cell-head-y text-cell-head')).toEqual({ paddingHorizontal: 24, paddingVertical: 12, fontSize: 12, lineHeight: 16 })
    expect(compileHeadwindToStyle('pl-control-x pr-control-x mt-control-y -mb-cell-y gap-control-y')).toEqual({ paddingLeft: 16, paddingRight: 16, marginTop: 8, marginBottom: -16, gap: 8 })
  })

  it('uses shape roles for every directional corner without substituting a default radius', () => {
    const result = compileClassStyles('rounded-t-control rounded-br-panel rounded-bl-pill')
    expect(result.unknown).toEqual([])
    expect(result.style).toEqual({ borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomRightRadius: 8, borderBottomLeftRadius: 9999 })
    expect(compileHeadwindToStyle('rounded-panel')).toEqual({ borderRadius: 8 })
    expect(compileHeadwindToStyle('rounded-t-none rounded-br-[3px]')).toEqual({ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 3 })
  })

  it('preserves class ordering and dark overrides while reporting unsupported roles', () => {
    const result = compileClassStyles('rounded-control px-control-x text-control dark:rounded-panel dark:text-cell-head')
    expect(result.unknown).toEqual([])
    expect(result.style).toMatchObject({ borderRadius: 6, paddingHorizontal: 16, fontSize: 16, lineHeight: 24 })
    expect(result.dark).toEqual({ borderRadius: 8, fontSize: 12, lineHeight: 16 })
    expect(compileHeadwindToStyle('text-control leading-8')).toMatchObject({ fontSize: 16, lineHeight: 32 })
    expect(compileClassStyles('rounded-t-missing px-missing text-missing').unknown).toEqual(['rounded-t-missing', 'px-missing', 'text-missing'])
  })

  it('reads computed color, density and shape overrides without changing literal utilities', () => {
    const variables = new Map([
      ['--stx-field', 'rgb(12, 34, 56)'], ['--stx-fg', '#abcdef'],
      ['--stx-radius-control', '1rem'], ['--stx-control-px', '6px'],
      ['--stx-control-py', '0'], ['--stx-control-text', '14px'], ['--stx-control-leading', '20px'],
    ])
    const result = compileClassStyles('bg-field text-fg rounded-t-control px-control-x py-control-y text-control -mt-control-x', variables)
    expect(result.unknown).toEqual([])
    expect(result.style).toEqual({ backgroundColor: 'rgb(12, 34, 56)', color: '#abcdef', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 6, paddingVertical: 0, fontSize: 14, lineHeight: 20, marginTop: -6 })
    expect(result.dark).toBeUndefined()
    expect(compileClassStyles('bg-field/50 rounded-control rounded-sm px-control-x px-4 text-control leading-8 dark:bg-white', new Map([['--stx-field', '#123456']])).style)
      .toMatchObject({ backgroundColor: '#12345680', borderRadius: 2, paddingHorizontal: 16, lineHeight: 32 })
    expect(compileClassStyles('bg-field dark:bg-white', variables).dark).toEqual({ backgroundColor: '#ffffff' })
  })

  it('reports unusable defined overrides and restores defaults for invalid variables', () => {
    const result = compileClassStyles('rounded-control px-control-x text-control dark:rounded-control bg-field', new Map([
      ['--stx-radius-control', 'calc(1rem + 2px)'], ['--stx-control-px', '50%'],
      ['--stx-control-text', '-2px'], ['--stx-field', 'var(--missing)'],
    ]))
    expect(result.style).toEqual({})
    expect(result.unknown).toEqual(['bg-field', 'rounded-control', 'px-control-x', 'text-control', 'dark:rounded-control'])
    expect(compileClassStyles('rounded-control bg-field', new Map([['--stx-radius-control', undefined], ['--stx-field', undefined]])).style)
      .toMatchObject({ borderRadius: 6, backgroundColor: '#ffffff' })
  })
})
