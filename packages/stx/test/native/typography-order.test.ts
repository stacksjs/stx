import { describe, expect, it } from 'bun:test'
import { compileHeadwindToStyle } from '../../src/native/compiler/headwind-to-style'

describe('native typography class order', () => {
  it.each([
    ['leading-tight', 'text-[28px]', { fontSize: 28, lineHeight: 35 }],
    ['leading-[1.5]', 'text-2xl', { fontSize: 24, lineHeight: 36 }],
    ['leading-[1.2em]', 'text-[30px]', { fontSize: 30, lineHeight: 36 }],
    ['tracking-[-0.02em]', 'text-[20px]', { fontSize: 20, letterSpacing: -0.4 }],
    ['leading-[40px]', 'text-[28px]', { fontSize: 28, lineHeight: 40 }],
    ['leading-5', 'text-[28px]', { fontSize: 28, lineHeight: 20 }],
  ] as const)('resolves %s against %s regardless of their order', (typography, font, expected) => {
    expect(compileHeadwindToStyle(`${typography} ${font}`)).toEqual(expected)
    expect(compileHeadwindToStyle(`${font} ${typography}`)).toEqual(expected)
  })

  it('uses the final font size while preserving last-wins typography overrides', () => {
    expect(compileHeadwindToStyle('text-sm leading-tight text-[28px]')).toEqual({ fontSize: 28, lineHeight: 35 })
    expect(compileHeadwindToStyle('leading-tight text-[28px] leading-[42px]')).toEqual({ fontSize: 28, lineHeight: 42 })
    expect(compileHeadwindToStyle('tracking-[0.1em] text-[20px] tracking-[2px]')).toEqual({ fontSize: 20, letterSpacing: 2 })
  })
})
