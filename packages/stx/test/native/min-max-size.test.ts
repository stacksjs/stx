/**
 * Size bounds on native screens: `min-h-[44px]` keeps a row at Apple's tap
 * height, `max-w-md` keeps a column readable on an iPad. The native compiler
 * knew only `min-w-0`, so every other bound was dropped as an unknown class.
 */
import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'

describe('min and max size classes', () => {
  it('compile arbitrary and scale values on both axes', () => {
    const { style, unknown } = compileClassStyles('min-h-[44px] max-h-96 min-w-10 max-w-[2rem]')
    expect(unknown).toEqual([])
    expect(style).toMatchObject({ minHeight: 44, maxHeight: 384, minWidth: 40, maxWidth: 32 })
  })

  it('read the named widths and full', () => {
    expect(compileClassStyles('max-w-md min-h-full').style).toMatchObject({ maxWidth: 448, minHeight: '100%' })
  })

  it('keep an arbitrary percentage a percentage of the parent', () => {
    // A chat bubble's `max-w-[78%]` read as 78 points, so "See you Thursday"
    // wrapped as "See / you / Thurs / day" in a bubble 78 points wide.
    const { style, unknown } = compileClassStyles('px-3.5 py-2 max-w-[78%] rounded-[18px]')
    expect(unknown).toEqual([])
    expect(style).toMatchObject({ maxWidth: '78%', paddingHorizontal: 14 })
    expect(compileClassStyles('w-[37.5%] h-[50%] min-w-[10%] size-[25%]').style)
      .toMatchObject({ width: '25%', height: '25%', minWidth: '10%' })
    expect(compileClassStyles('w-[37.5%] h-[50%]').style).toMatchObject({ width: '37.5%', height: '50%' })
  })

  it('never turn a percentage into points where a host takes only points', () => {
    const { style, unknown } = compileClassStyles('p-[5%] mt-[10%] gap-[2%]')
    expect(unknown).toEqual(['p-[5%]', 'mt-[10%]', 'gap-[2%]'])
    expect(style).not.toHaveProperty('padding')
    expect(style).not.toHaveProperty('marginTop')
    expect(style).not.toHaveProperty('gap')
  })

  it('let none lift a bound an earlier class set', () => {
    expect(compileClassStyles('max-w-sm max-w-none').style).not.toHaveProperty('maxWidth')
  })

  it('leave a value they cannot read unknown', () => {
    expect(compileClassStyles('min-h-[calc(100%-2rem)]').unknown).toEqual(['min-h-[calc(100%-2rem)]'])
  })

  it('apply in dark mode like any other class', () => {
    expect(compileClassStyles('dark:min-h-[50px]').dark).toEqual({ minHeight: 50 })
  })
})
