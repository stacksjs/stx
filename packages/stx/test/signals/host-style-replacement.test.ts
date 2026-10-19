import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'
import { setupStxTestDom } from '../../src/testing'
import { shimAttributes } from '../../test-utils/dom-runtime-shim'

declare const window: any
declare const document: any

describe.each([false, true])('browser style replacement (minify=%s)', (minify) => {
  it('clears removed bound properties, restores inline styles, and preserves :show', async () => {
    setupStxTestDom()
    new Function(minify ? generateSignalsRuntime() : generateSignalsRuntimeDev())()
    const styles = window.stx.state({ paddingLeft: '7px', paddingBottom: '5px' })
    const shown = window.stx.state(true)
    window.__stx_setup_style_replacement = () => ({ styles, shown })
    document.body.innerHTML = '<main data-stx="__stx_setup_style_replacement"><div id="field" style="padding-left:9px!important;width:18px;display:flex" x-style="styles" :show="shown"></div></main>'
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    const settle = () => new Promise(resolve => setTimeout(resolve, 30))
    await settle()
    const node = document.getElementById('field')
    expect(node.style.paddingLeft).toBe('7px')
    expect(node.style.paddingBottom).toBe('5px')
    expect(node.style.width).toBe('18px')
    styles.set({})
    await settle()
    expect(node.style.paddingLeft).toBe('9px')
    expect(node.style.getPropertyPriority('padding-left')).toBe('important')
    expect(node.style.getPropertyValue('padding-bottom')).toBe('')
    shown.set(false)
    styles.set({ display: 'grid', paddingLeft: '8px' })
    await settle()
    expect(node.style.display).toBe('none')
    styles.set(null)
    await settle()
    expect(node.style.display).toBe('none')
    shown.set(true)
    await settle()
    expect(node.style.display).toBe('flex')
    expect(node.style.paddingLeft).toBe('9px')
    styles.set('padding-left:4px!important; --tone: red')
    await settle()
    expect(node.style.paddingLeft).toBe('4px')
    expect(node.style.getPropertyPriority('padding-left')).toBe('important')
    expect(node.style.getPropertyValue('--tone')).toBe('red')
    styles.set({})
    await settle()
    expect(node.style.paddingLeft).toBe('9px')
    expect(node.style.getPropertyValue('--tone')).toBe('')
    expect(node.style.width).toBe('18px')
  })
})
