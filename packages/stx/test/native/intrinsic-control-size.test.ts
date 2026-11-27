/**
 * A control the platform draws at its own size takes no frame from CSS.
 *
 * HQ's web stylesheet sized its switch's box (`.set-switch { width: 3.1875rem;
 * height: 1.9375rem }`). The compiler copies class-only rules onto native
 * elements, so the native Switch got a 51 by 31 frame; UISwitch draws at about
 * 63 points on iOS 26 from the frame's leading edge, and ran past its row.
 */
import { describe, expect, it } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { withoutIntrinsicFrame } from '../../src/native/compiler/ir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const RULE = '<style>.set-switch { width: 3.1875rem; height: 1.9375rem; min-width: 3rem; border-radius: 9999px; margin-left: 8px; background-color: #0a84ff }</style>'

describe('withoutIntrinsicFrame', () => {
  it('drops the frame of a Switch or a spinner, and only the height of a Slider', () => {
    const style = { width: 51, height: 31, minWidth: 48, maxHeight: 40, aspectRatio: 1, marginLeft: 8, borderRadius: 9999 }
    expect(withoutIntrinsicFrame('Switch', style)).toEqual({ marginLeft: 8, borderRadius: 9999 })
    expect(withoutIntrinsicFrame('ActivityIndicator', style)).toEqual({ marginLeft: 8, borderRadius: 9999 })
    expect(withoutIntrinsicFrame('Slider', style)).toEqual({ width: 51, minWidth: 48, aspectRatio: 1, marginLeft: 8, borderRadius: 9999 })
  })

  it('leaves every other node, and a style with nothing to drop, as the same object', () => {
    const style = { width: 51, height: 31 }
    expect(withoutIntrinsicFrame('View', style)).toBe(style)
    const plain = { marginLeft: 8 }
    expect(withoutIntrinsicFrame('Switch', plain)).toBe(plain)
  })
})

describe('a Switch sized by a web stylesheet rule', () => {
  it.each([
    ['<div data-native="Switch" class="set-switch"></div>'],
    ['<switch class="set-switch"></switch>'],
  ])('compiles without the frame: %s', async (markup) => {
    const { root } = await translateHtmlToIR(`${RULE}${markup}`)
    const node = root.type === 'Switch' ? root : (root.children as any[]).find(child => child?.type === 'Switch')
    expect(node.type).toBe('Switch')
    expect(node.style).not.toHaveProperty('width')
    expect(node.style).not.toHaveProperty('height')
    expect(node.style).not.toHaveProperty('minWidth')
    expect(node.style).toMatchObject({ marginLeft: 8 })
  })

  it.each([false, true])('reaches the host without the frame, while a View with the class keeps it (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(`${RULE}<div><div data-native="Switch" class="set-switch" testID="switch"></div><div class="set-switch" testID="box"></div></div>`, { minify })
    const phone = mountNativeScreen(code, 'Screen')
    await phone.settle()
    const toggle = phone.byTestID('switch')!
    expect(toggle.type).toBe('Switch')
    expect(toggle.style.width).toBeUndefined()
    expect(toggle.style.height).toBeUndefined()
    expect(toggle.style.marginLeft).toBe(8)
    const box = phone.byTestID('box')!
    expect(box.style).toMatchObject({ width: 51, height: 31 })
    phone.unmount()
  }, 30_000)
})
