import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { CSSGenerator, defaultConfig } from '@stacksjs/ts-css/engine'
import { compileClassStyles, impliedLeadingApplies, setNativeLeaf } from '../../src/native/compiler/utilities-to-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { tsCssLeaf } from '../../src/native/compiler/ts-css-leaf'
import { createNativeHost } from '../../src/native/runtime/native-host'

// `text-sm` sets a 20px line box on the web and native now takes it from
// ts-css. That box belongs to the 14px it came with. It reached a field whose
// size a later class replaced (`text-sm max-md:text-[17px]`: 17pt in a 20pt
// line), and every field and button, which draw one centred line and must grow
// with the reader's text size rather than hold a fixed line box.
beforeAll(() => setNativeLeaf(tsCssLeaf(new CSSGenerator(defaultConfig))))
afterAll(() => setNativeLeaf(undefined))

async function styled(html: string, viewportWidth = 390) {
  const { root } = await translateHtmlToIR(html)
  const operations: NativeMutationOperation[] = []
  const host = createNativeHost({ send: batch => operations.push(...batch), schedule: () => {}, viewportWidth })
  const node = host.adopt({ __stxId: 'node' }, root.type, null, root)
  host.snapshot(node)
  host.flush()
  const created = operations.find(operation => (operation as any).node?.id === 'node' || (operation as any).id === 'node') as any
  return { type: root.type, style: (created?.node?.style ?? created?.patch?.style ?? {}) as Record<string, unknown>, snapshot: host.snapshot(node) as any }
}

describe('a line-height a text size implies', () => {
  it('stays with a label at the size that brought it', () => {
    const compiled = compileClassStyles('text-sm')
    expect(compiled.style).toEqual({ fontSize: 14, lineHeight: 20 })
    expect(compiled.impliedLeading).toEqual([[14, 20]])
  })

  it('goes when a later size in the same list brings none', () => {
    expect(compileClassStyles('text-sm text-[17px]').style).toEqual({ fontSize: 17 })
    expect(compileClassStyles('text-[17px] text-sm').style).toEqual({ fontSize: 14, lineHeight: 20 })
  })

  it('never displaces a leading the author wrote', () => {
    const explicit = compileClassStyles('text-sm leading-6 text-[17px]')
    expect(explicit.style).toEqual({ fontSize: 17, lineHeight: 24 })
    expect(explicit.impliedLeading).toBeUndefined()
    // The same number as the implied one, but asked for: it holds everywhere.
    expect(compileClassStyles('text-sm leading-[20px]').impliedLeading).toBeUndefined()
    expect(impliedLeadingApplies(undefined, { fontSize: 17, lineHeight: 20 }, true)).toBe(true)
  })

  it('holds only for its own size, and never on a single-line control', () => {
    expect(impliedLeadingApplies([[14, 20]], { fontSize: 14, lineHeight: 20 }, false)).toBe(true)
    expect(impliedLeadingApplies([[14, 20]], { fontSize: 17, lineHeight: 20 }, false)).toBe(false)
    expect(impliedLeadingApplies([[14, 20]], { fontSize: 14, lineHeight: 20 }, true)).toBe(false)
    // Each width layer's own pair: the wide layer's 28 belongs to its 18.
    expect(impliedLeadingApplies([[14, 20], [18, 28]], { fontSize: 18, lineHeight: 28 }, false)).toBe(true)
  })

  it('reaches a label, and leaves a field and a button free to grow', async () => {
    const label = await styled('<span class="text-sm">Email</span>')
    expect(label.snapshot.style).toMatchObject({ fontSize: 14, lineHeight: 20 })
    const field = await styled('<input class="text-sm" type="email">')
    expect(field.type).toBe('TextInput')
    expect(field.snapshot.style.fontSize).toBe(14)
    expect(field.snapshot.style.lineHeight).toBeUndefined()
    const button = await styled('<button class="text-base" type="submit">Sign in</button>')
    expect(button.snapshot.style.fontSize).toBe(16)
    expect(button.snapshot.style.lineHeight).toBeUndefined()
  })

  it('goes from a label whose size a width layer replaced', async () => {
    const narrow = await styled('<span class="text-sm max-md:text-[17px]">Email</span>', 390)
    expect(narrow.snapshot.style.fontSize).toBe(17)
    expect(narrow.snapshot.style.lineHeight).toBeUndefined()
    const wide = await styled('<span class="text-sm max-md:text-[17px]">Email</span>', 1024)
    expect(wide.snapshot.style).toMatchObject({ fontSize: 14, lineHeight: 20 })
  })
})
