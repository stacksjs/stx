/**
 * The grouped vocabulary (`@stacksjs/stx/native/ui`) compiles on a phone with
 * nothing dropped, and follows an app's role answers.
 */
import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { createStyleVariables } from '../../src/native/compiler/style-variables'
import { nativeUi } from '../../src/native/ui'

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
