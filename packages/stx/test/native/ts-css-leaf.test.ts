/**
 * Native leaf styles resolved by ts-css (stacksjs/ts-css#38).
 *
 * The native compiler kept its own copy of the utility table, and measured
 * against ts-css on the same classes it dropped the line-height a `text-*`
 * utility sets, resolved `leading-*` and `tracking-*` against a fixed 16pt,
 * and carried the Tailwind v3 palette where the web has v4. The leaf asks
 * ts-css instead, and takes a utility only when it can map every declaration.
 */
import { describe, expect, it } from 'bun:test'
import { CSSGenerator, defaultConfig } from '@stacksjs/ts-css/engine'
import { applyLeafEntry, compileClassStyles, compileHeadwindToStyle, leafFromEntries, withNativeLeaf } from '../../src/native/compiler/utilities-to-style'
import { leafEntryFromDeclarations, nativeStyleFromDeclarations, tsCssLeaf } from '../../src/native/compiler/ts-css-leaf'

const leaf = tsCssLeaf(new CSSGenerator(defaultConfig as never))

describe('ts-css leaf', () => {
  describe('the divergences it closes', () => {
    /** v4 recalibrated chroma; neutrals barely moved. Matches the web exactly. */
    it('should give v4 colours, as the web renders them', () => {
      expect(leaf('text-red-500', 16)).toEqual({ color: '#fb2c36' })
      expect(leaf('bg-blue-500', 16)).toEqual({ backgroundColor: '#2b7fff' })
      expect(leaf('border-slate-500', 16)).toEqual({ borderColor: '#62748e' })
    })

    it('should keep opacity as an 8-digit hex', () => {
      expect(leaf('bg-red-500/40', 16)).toEqual({ backgroundColor: '#fb2c3666' })
    })

    it('should give a text size the line-height it sets', () => {
      expect(leaf('text-sm', 16)).toEqual({ fontSize: 14, lineHeight: 20 })
      expect(leaf('text-lg', 16)).toEqual({ fontSize: 18, lineHeight: 28 })
    })

    /** Native used a fixed 16 and got 20 for `text-sm leading-tight`. */
    it('should resolve a unitless leading against the real font size', () => {
      expect(leaf('leading-tight', 14)).toEqual({ lineHeight: 17.5 })
      expect(leaf('leading-tight', 16)).toEqual({ lineHeight: 20 })
    })

    /** Native used a fixed 16 and got 0.4 at every size. */
    it('should resolve em tracking against the real font size', () => {
      expect(leaf('tracking-wide', 14)!.letterSpacing).toBeCloseTo(0.35)
      expect(leaf('tracking-wide', 16)!.letterSpacing).toBeCloseTo(0.4)
    })

    /** v4 renamed the radius scale: `rounded-sm` is 0.25rem on the web. */
    it('should follow v4\'s radius scale', () => {
      expect(leaf('rounded-sm', 16)).toEqual({ borderRadius: 4 })
    })
  })

  describe('what it leaves alone', () => {
    it('should keep the native shape for spacing', () => {
      expect(leaf('p-4', 16)).toEqual({ padding: 16 })
      expect(leaf('px-3', 16)).toEqual({ paddingHorizontal: 12 })
      expect(leaf('py-2', 16)).toEqual({ paddingVertical: 8 })
      expect(leaf('pt-1', 16)).toEqual({ paddingTop: 4 })
      expect(leaf('gap-x-2', 16)).toEqual({ columnGap: 8 })
    })

    it('should keep the native spelling of weights', () => {
      expect(leaf('font-bold', 16)).toEqual({ fontWeight: 'bold' })
      expect(leaf('font-normal', 16)).toEqual({ fontWeight: '400' })
      expect(leaf('font-medium', 16)).toEqual({ fontWeight: '500' })
    })

    it('should map keywords to their native values', () => {
      expect(leaf('text-start', 16)).toEqual({ textAlign: 'left' })
      expect(leaf('uppercase', 16)).toEqual({ textTransform: 'uppercase' })
      expect(leaf('line-through', 16)).toEqual({ textDecorationLine: 'line-through' })
      expect(leaf('bg-transparent', 16)).toEqual({ backgroundColor: 'transparent' })
      expect(leaf('opacity-50', 16)).toEqual({ opacity: 0.5 })
    })
  })

  /**
   * Taken only when every declaration maps. Anything else -- the engine's
   * internal shadow variables, a gradient, an `auto` margin native writes as
   * `alignSelf` -- is undefined, so the caller keeps its own handling.
   */
  describe('what it defers', () => {
    it('should defer what it cannot map completely', () => {
      for (const utility of ['mx-auto', 'shadow-md', 'bg-gradient-to-r', 'translate-x-2', 'w-4', 'flex-1'])
        expect(leaf(utility, 16)).toBeUndefined()
    })

    it('should defer what ts-css does not know, and what sets nothing', () => {
      expect(leaf('not-a-utility', 16)).toBeUndefined()
      expect(leaf('group', 16)).toBeUndefined()
    })

    it('should defer a value it cannot reduce', () => {
      expect(nativeStyleFromDeclarations({ padding: 'calc(1rem + 2px)' }, 16)).toBeUndefined()
      expect(nativeStyleFromDeclarations({ color: 'currentColor' }, 16)).toBeUndefined()
      expect(nativeStyleFromDeclarations({ 'font-weight': 'bolder' }, 16)).toBeUndefined()
    })
  })
})

/**
 * The font size is only known once the whole list is, and a dynamic list is
 * only assembled on the device, so a font-relative value travels as a multiple
 * and the device multiplies. Build and device share `applyLeafEntry`.
 */
describe('leaf entries', () => {
  it('should keep a unitless line-height and an em tracking as multiples', () => {
    expect(leafEntryFromDeclarations({ 'line-height': '1.25' })).toEqual({ style: {}, em: { lineHeight: 1.25 } })
    expect(leafEntryFromDeclarations({ 'letter-spacing': '0.025em' })).toEqual({ style: {}, em: { letterSpacing: 0.025 } })
  })

  it('should resolve them against a size the utility sets itself', () => {
    expect(leafEntryFromDeclarations({ 'font-size': '0.875rem', 'line-height': '1.5' })).toEqual({ style: { fontSize: 14, lineHeight: 21 } })
  })

  it('should keep absolute metrics absolute', () => {
    expect(leafEntryFromDeclarations({ 'line-height': '1.5rem' })).toEqual({ style: { lineHeight: 24 } })
  })

  /** An em font-size is relative to the parent, which is not known here. */
  it('should defer an em font size and em spacing', () => {
    expect(leafEntryFromDeclarations({ 'font-size': '1.2em' })).toBeUndefined()
    expect(leafEntryFromDeclarations({ padding: '1em' })).toBeUndefined()
  })

  it('should apply an entry at whatever size it lands at', () => {
    const entry = { style: { color: '#000000' }, em: { lineHeight: 1.25 } }
    expect(applyLeafEntry(entry, 14)).toEqual({ color: '#000000', lineHeight: 17.5 })
    expect(applyLeafEntry(entry, 20)).toEqual({ color: '#000000', lineHeight: 25 })
  })

  it('should look entries up through leafFromEntries', () => {
    const table = { 'leading-tight': { style: {}, em: { lineHeight: 1.25 } } }
    const fromTable = leafFromEntries(utility => table[utility as keyof typeof table])
    expect(fromTable('leading-tight', 14)).toEqual({ lineHeight: 17.5 })
    expect(fromTable('not-in-the-table', 14)).toBeUndefined()
  })
})

describe('the leaf in the native compiler', () => {
  /** `text-sm leading-tight`: the list's own size, not a fixed 16. */
  it('should resolve leading against the list\'s font size', async () => {
    await withNativeLeaf(leaf, async () => {
      expect(compileHeadwindToStyle('text-sm leading-tight')).toEqual({ fontSize: 14, lineHeight: 17.5 })
      expect(compileHeadwindToStyle('text-red-500 p-4')).toEqual({ color: '#fb2c36', padding: 16 })
    })
  })

  it('should leave what the leaf defers to the native parsers', async () => {
    await withNativeLeaf(leaf, async () => {
      expect(compileHeadwindToStyle('mx-auto')).toEqual({ alignSelf: 'center' })
    })
  })

  /** Unset, nothing changes: the device and every existing test see the parsers. */
  it('should change nothing with no leaf set', () => {
    expect(compileHeadwindToStyle('text-red-500')).toEqual({ color: '#ef4444' })
  })

  /** A list compiled under one leaf must not be served under another. */
  it('should not reuse a list compiled without the leaf', async () => {
    const without = compileClassStyles('bg-blue-500')
    expect(without.style).toEqual({ backgroundColor: '#3b82f6' })
    await withNativeLeaf(leaf, async () => {
      expect(compileClassStyles('bg-blue-500').style).toEqual({ backgroundColor: '#2b7fff' })
    })
    expect(compileClassStyles('bg-blue-500').style).toEqual({ backgroundColor: '#3b82f6' })
  })
})
