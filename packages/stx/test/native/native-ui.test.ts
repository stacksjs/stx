/**
 * The grouped vocabulary (`@stacksjs/stx/native/ui`) compiles on a phone with
 * nothing dropped, and follows an app's role answers.
 */
import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { createStyleVariables } from '../../src/native/compiler/style-variables'
import { nativeTextStyle, nativeUi } from '../../src/native/ui'

describe('nativeUi', () => {
  it('has no class a native host cannot draw', () => {
    const unknown = Object.entries(nativeUi).flatMap(([name, classes]) =>
      compileClassStyles(classes).unknown.map(cls => `${name}: ${cls}`))
    expect(unknown).toEqual([])
  })

  it('takes its colours from the roles, in both appearances', () => {
    const stock = compileClassStyles(nativeUi.group)
    expect(stock.style.backgroundColor).toBe('#ffffff')
    expect(stock.dark?.backgroundColor).toBeTruthy()
    const themed = compileClassStyles(nativeUi.group, createStyleVariables([['--stx-panel', '#fafaf9']]).computed())
    expect(themed.style.backgroundColor).toBe('#fafaf9')
  })
})

describe('nativeTextStyle', () => {
  const signature = { fontFamily: 'Allura-Regular', fontSize: 48, lineHeight: 60, letterSpacing: -0.5, fontWeight: '400', color: '#ffffff' } as const

  it('retains native point metrics and does not mutate the source', () => {
    expect(nativeTextStyle(signature, 'native')).toEqual(signature)
    expect(signature.fontSize).toBe(48)
    expect(signature.lineHeight).toBe(60)
  })

  it('turns native typography lengths into CSS lengths without scaling line height', () => {
    const style = nativeTextStyle(signature, 'web')
    expect(style).toEqual({ ...signature, fontSize: '48px', lineHeight: '60px', letterSpacing: '-0.5px' })
    const name = document.createElement('p')
    Object.assign(name.style, style)
    expect(name.style.fontSize).toBe('48px')
    expect(name.style.lineHeight).toBe('60px')
    expect(name.style.fontFamily).toBe('Allura-Regular')
    expect(name.style.fontWeight).toBe('400')
  })

  it('preserves absent metrics and zero spacing', () => {
    expect(nativeTextStyle({ color: '#000000' }, 'web')).toEqual({ color: '#000000' })
    expect(nativeTextStyle({ letterSpacing: 0 }, 'web')).toEqual({ letterSpacing: '0px' })
    const optional: { fontSize?: number } = {}
    const fontSize: string | undefined = nativeTextStyle(optional, 'web').fontSize
    expect(fontSize).toBeUndefined()
  })
})
