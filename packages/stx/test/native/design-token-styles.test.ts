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
})
