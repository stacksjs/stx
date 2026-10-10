/**
 * Golden tests for the compiler (stacksjs/stx#1986).
 *
 * `packages/stx/src/native` (once `packages/stx-native`) is ~8,600 lines across TypeScript, Kotlin and Swift.
 * The compiler is the most valuable part of it and was the least protected:
 * the three test files that existed cover the CLI and the bridge protocol, so
 * `compileHeadwindToStyle`, the parser's IR, and the two renderers' component
 * coverage had nothing on them at all.
 *
 * These are golden tests on purpose. The IR is a JSON tree and the style
 * compiler is a pure string-to-object function, which is the shape where a
 * refactor breaks things silently -- a wrong number or a dropped property
 * looks exactly like a right one until something renders it, and nothing in
 * this repo renders it, because that happens on a device.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mapToNativeComponent } from '../../src/native/compiler/component-mapping'
import { compileHeadwindToStyle } from '../../src/native/compiler/headwind-to-style'
import { parseSTXToNode } from '../../src/native/compiler/parser'

describe('compileHeadwindToStyle, by class family', () => {
  /** Each family's spelling and the exact object it must produce. */
  const CASES: Array<[string, string, Record<string, unknown>]> = [
    ['spacing: all sides', 'p-4', { padding: 16 }],
    ['spacing: horizontal', 'px-2', { paddingHorizontal: 8 }],
    ['spacing: vertical', 'py-3', { paddingVertical: 12 }],
    ['spacing: margin', 'm-1', { margin: 4 }],
    ['spacing: one edge', 'mt-2', { marginTop: 8 }],
    ['flex: grow, shrink, basis 0', 'flex-1', { flex: 1, flexGrow: 1, flexShrink: 1, flexBasis: 0 }],
    ['flex: row', 'flex-row', { flexDirection: 'row' }],
    ['flex: column', 'flex-col', { flexDirection: 'column' }],
    ['flex: justify', 'justify-between', { justifyContent: 'space-between' }],
    ['flex: align', 'items-end', { alignItems: 'flex-end' }],
    ['colour: background', 'bg-blue-500', { backgroundColor: '#3b82f6' }],
    ['colour: light shade', 'bg-red-100', { backgroundColor: '#fee2e2' }],
    ['colour: text', 'text-white', { color: '#ffffff' }],
    ['typography: size', 'text-lg', { fontSize: 18 }],
    ['typography: smaller', 'text-sm', { fontSize: 14 }],
    ['typography: weight keyword', 'font-bold', { fontWeight: 'bold' }],
    ['typography: weight number', 'font-medium', { fontWeight: '500' }],
    ['radius', 'rounded-lg', { borderRadius: 8 }],
    ['radius: pill', 'rounded-full', { borderRadius: 9999 }],
    ['sizing: percentage', 'w-full', { width: '100%' }],
    ['sizing: scale', 'h-10', { height: 40 }],
    ['opacity', 'opacity-50', { opacity: 0.5 }],
    ['position', 'absolute', { position: 'absolute' }],
    ['display', 'hidden', { display: 'none' }],
  ]

  for (const [family, classes, expected] of CASES) {
    it(`${family} — ${classes}`, () => {
      expect(compileHeadwindToStyle(classes)).toEqual(expected)
    })
  }

  it('merges several families into one object', () => {
    expect(compileHeadwindToStyle('flex-1 flex-col p-4 bg-blue-500')).toEqual({
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      flexDirection: 'column',
      padding: 16,
      backgroundColor: '#3b82f6',
    })
  })

  it('ignores a class it does not know rather than throwing', () => {
    // An app's own utility class reaching the compiler must not take the
    // build down, and must not invent a property either.
    expect(compileHeadwindToStyle('not-a-headwind-class')).toEqual({})
  })

  it('takes the last value when a family is repeated', () => {
    expect(compileHeadwindToStyle('p-1 p-4')).toEqual({ padding: 16 })
  })
})

/**
 * Arbitrary values, which is where this compiler was quietly wrong.
 *
 * Found by translating the real component library rather than by reading the
 * file: TabBar's `text-[11px]` came out as `color: "11px"` -- an invalid color
 * that also lost the font size it asked for -- and `h-[calc(100%-2rem)]`
 * parsed to NaN and was assigned anyway, so the IR carried `"height": null`.
 */
describe('compileHeadwindToStyle, arbitrary values', () => {
  it('reads an arbitrary length after text- as a size, not a color', () => {
    expect(compileHeadwindToStyle('text-[11px]')).toEqual({ fontSize: 11 })
    expect(compileHeadwindToStyle('text-[1.5rem]')).toEqual({ fontSize: 24 })
  })

  it('still reads an arbitrary color after text- as a color', () => {
    expect(compileHeadwindToStyle('text-[#ff0000]')).toEqual({ color: '#ff0000' })
  })

  it('does not take a length for a color anywhere else either', () => {
    expect(compileHeadwindToStyle('bg-[12px]')).toEqual({})
    expect(compileHeadwindToStyle('bg-[#112233]')).toEqual({ backgroundColor: '#112233' })
  })

  it('drops a value it cannot read instead of emitting NaN', () => {
    // NaN serialises to null, which decodes as nil and renders as nothing --
    // indistinguishable from a property that was never set.
    expect(compileHeadwindToStyle('h-[calc(100%-2rem)]')).toEqual({})
    expect(compileHeadwindToStyle('p-[calc(1rem+2px)]')).toEqual({})
  })

  it('keeps the arbitrary lengths it does understand', () => {
    expect(compileHeadwindToStyle('w-[68px]')).toEqual({ width: 68 })
    expect(compileHeadwindToStyle('p-[7px]')).toEqual({ padding: 7 })
  })
})

describe('parseSTXToNode produces the documented IR', () => {
  it('compiles the reference tree exactly', () => {
    const node = parseSTXToNode(
      '<View class="flex-1 flex-col justify-center items-center p-4 bg-blue-500">'
      + '<Text class="text-white text-lg font-bold">Wildloop</Text>'
      + '</View>',
    )

    expect(node.type).toBe('View')
    expect(node.style).toEqual({
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#3b82f6',
    })

    expect(node.children).toHaveLength(1)
    const child = node.children[0] as any
    expect(child.type).toBe('Text')
    expect(child.style).toEqual({ color: '#ffffff', fontSize: 18, fontWeight: 'bold' })
    expect(child.children).toEqual(['Wildloop'])
  })

  it('keeps the original class string for debugging', () => {
    const node = parseSTXToNode('<View class="p-4"><Text>x</Text></View>')
    expect((node as any)._classes).toBe('p-4')
  })

  it('records where a node came from', () => {
    // The source map is what turns a wrong style into a findable line.
    const node = parseSTXToNode('<View class="p-4"><Text>x</Text></View>')
    expect((node as any)._source).toMatchObject({ line: 1, column: 1 })
  })

  it('nests to arbitrary depth', () => {
    const node = parseSTXToNode('<View><View><View><Text>deep</Text></View></View></View>')
    const depth = (n: any): number =>
      typeof n === 'string' ? 0 : 1 + Math.max(0, ...n.children.map(depth))
    expect(depth(node)).toBe(4)
  })

  it('gives a node with no classes an empty style rather than undefined', () => {
    const node = parseSTXToNode('<View><Text>x</Text></View>')
    expect(node.style).toEqual({})
  })
})

describe('mapToNativeComponent', () => {
  const MAPPINGS: Array<[string, string]> = [
    ['div', 'View'],
    ['span', 'Text'],
    ['p', 'Text'],
    ['h1', 'Text'],
    ['img', 'Image'],
    ['input', 'TextInput'],
    ['textarea', 'TextInput'],
    ['a', 'TouchableOpacity'],
    ['header', 'SafeAreaView'],
    ['select', 'Picker'],
    ['spinner', 'ActivityIndicator'],
  ]

  for (const [tag, native] of MAPPINGS) {
    it(`${tag} becomes ${native}`, () => {
      expect(mapToNativeComponent(tag)).toBe(native)
    })
  }

  it('is case insensitive', () => {
    expect(mapToNativeComponent('DIV')).toBe('View')
  })

  it('passes an unknown tag through unchanged', () => {
    // A custom component name must survive to the renderer, not become View.
    expect(mapToNativeComponent('WildloopCard')).toBe('WildloopCard')
  })

  /**
   * Measured against the library the native target exists to render.
   *
   * Every HTML tag written across the 101 components in `@stacksjs/components`
   * either maps to a native type or is named below. An unknown tag does not
   * fail: `mapToNativeComponent` passes it through, the renderer's switch has
   * no case for it, and the subtree is dropped on the device -- so the only
   * place this can be caught is here, before anything renders.
   */
  const NOT_NATIVE = [
    // Expanded away by the stx pipeline before the translator sees them.
    'component', 'slot',
    // Drawing primitives. An icon's box survives as a View; its glyph does not.
    'svg', 'path', 'circle',
    // Media and embedding, with no IR counterpart yet.
    'audio', 'video', 'canvas', 'source',
    // A line break, which has no element form natively.
    'br',
  ]

  it('maps every tag the component library writes, or names it as unmapped', () => {
    const ui = path.join(import.meta.dir, '..', '..', '..', 'components', 'src', 'ui')
    const files = [...new Bun.Glob('**/*.stx').scanSync(ui)]
    expect(files.length).toBeGreaterThan(90)

    const tags = new Set<string>()
    for (const file of files) {
      const source = readFileSync(path.join(ui, file), 'utf8')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '')
      for (const match of source.matchAll(/<([a-z][\w-]*)/g))
        tags.add(match[1])
    }

    const unmapped = [...tags].filter(tag => mapToNativeComponent(tag) === tag).sort()
    expect(unmapped).toEqual([...NOT_NATIVE].sort())
  })
})

/**
 * The two renderers must not drift apart unnoticed.
 *
 * They already have. Reading the dispatch out of each file:
 *
 *   iOS     View Text Button TextInput Image ScrollView TouchableOpacity
 *           Switch ActivityIndicator SafeAreaView
 *   Android ...the same ten, PLUS FlatList, Modal, Slider
 *
 * So a template using `<list>`, `<modal>` or `<slider>` renders on Android and
 * silently does not on iOS -- the kind of difference that only shows up on a
 * device, which is why it went unnoticed. The gap is named here rather than
 * asserted away, so it has to shrink deliberately: adding a renderer makes
 * this test fail until the name comes off the list.
 */
describe('renderer coverage', () => {
  const RENDERERS = path.join(import.meta.dir, '..', '..', 'src', 'native', 'renderers')

  function iosTypes(): Set<string> {
    const source = readFileSync(path.join(RENDERERS, 'ios.swift'), 'utf8')
    // Only the component switch: a capitalised case label.
    return new Set([...source.matchAll(/case "([A-Z][A-Za-z]*)":/g)].map(m => m[1]))
  }

  function androidTypes(): Set<string> {
    const source = readFileSync(path.join(RENDERERS, 'android.kt'), 'utf8')
    return new Set([...source.matchAll(/"([A-Z][A-Za-z]*)" ->/g)].map(m => m[1]))
  }

  /** Implemented on Android and not yet on iOS. This list must only shrink. */
  const IOS_NOT_YET = ['FlatList', 'Modal', 'Slider']

  /** Emitted by the mapper and rendered by neither. This list must only shrink. */
  const RENDERED_BY_NEITHER = ['Picker']

  it('iOS implements everything Android does, except the known gap', () => {
    const missing = [...androidTypes()].filter(t => !iosTypes().has(t)).sort()
    expect(missing).toEqual([...IOS_NOT_YET].sort())
  })

  it('Android implements everything iOS does', () => {
    const missing = [...iosTypes()].filter(t => !androidTypes().has(t)).sort()
    expect(missing).toEqual([])
  })

  it('every component the mapper can emit has a renderer somewhere', () => {
    const tags = [
      'view', 'text', 'button', 'image', 'img', 'input', 'textarea', 'scroll',
      'scrollview', 'list', 'flatlist', 'modal', 'switch', 'slider', 'picker',
      'select', 'loading', 'spinner', 'div', 'span', 'p', 'h1', 'h2', 'h3',
      'a', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside',
      'form', 'label',
    ]
    const emitted = new Set(tags.map(mapToNativeComponent))
    const ios = iosTypes()
    const android = androidTypes()

    const orphaned = [...emitted].filter(t => !ios.has(t) && !android.has(t)).sort()

    // `<select>` and `<picker>` both compile to Picker, which neither platform
    // renders — so that markup produces a node nothing can draw.
    expect(orphaned).toEqual([...RENDERED_BY_NEITHER].sort())
  })

  it('both renderers handle the types the reference tree needs', () => {
    for (const type of ['View', 'Text']) {
      expect(iosTypes().has(type)).toBe(true)
      expect(androidTypes().has(type)).toBe(true)
    }
  })
})

/**
 * The style vocabulary the compiler emits, against what each renderer reads
 * (stacksjs/stx#1987, #1992).
 *
 * This is the half of renderer drift that cannot announce itself. A component
 * type with no branch at least falls through a `switch`. A STYLE property the
 * compiler emits and a renderer does not read is simply absent: Swift's
 * `Codable` ignores unknown keys, so `lineHeight` or `letterSpacing` decodes
 * into nothing, no error anywhere, and the view is laid out as though the
 * class had never been written.
 *
 * Measured: the IR declares 80 style properties, `android.kt` refers to 68 of
 * them, and `ios.swift` declares 52. So iOS silently drops 28, which is a
 * third of the vocabulary -- on top of the three component types it is missing.
 *
 * Named here rather than asserted away, so the lists can only shrink.
 */
describe('style vocabulary coverage', () => {
  const ROOT = path.join(import.meta.dir, '..', '..', 'src', 'native')

  /** Every property name the IR's STXStyle declares. */
  function irStyleKeys(): string[] {
    const source = readFileSync(path.join(ROOT, 'compiler', 'ir.ts'), 'utf8')
    const block = source.slice(
      source.indexOf('export interface STXStyle'),
      source.indexOf('export type STXEventType'),
    )
    return [...new Set([...block.matchAll(/^ {2}(\w+)\??:/gm)].map(m => m[1]))]
  }

  /** Every property `ios.swift`'s mirror of that struct declares. */
  function swiftStyleKeys(): Set<string> {
    const source = readFileSync(path.join(ROOT, 'renderers', 'ios.swift'), 'utf8')
    const block = source.slice(source.indexOf('struct STXStyle: Codable {'))
    return new Set(
      [...block.slice(0, block.indexOf('\n}')).matchAll(/var (\w+):/g)].map(m => m[1]),
    )
  }

  /**
   * Emitted by the compiler and absent from the iOS mirror, so dropped in
   * silence. This list must only shrink.
   */
  const IOS_DROPS = [
    'alignContent', 'aspectRatio', 'backgroundImage', 'borderBottomColor',
    'borderBottomWidth', 'borderLeftColor', 'borderLeftWidth', 'borderRightColor',
    'borderRightWidth', 'borderStyle', 'borderTopColor', 'borderTopWidth',
    'columnGap', 'elevation', 'flexBasis', 'fontFamily', 'letterSpacing',
    'lineHeight', 'overflow', 'resizeMode', 'rowGap', 'shadowOffset',
    'textDecorationColor', 'textDecorationLine', 'textTransform', 'tintColor',
    'transform', 'zIndex',
    // Craft's native host lays out `display: grid` with `gridColumns`; this
    // older renderer has no grid (added with grid-cols-N, 2026-10).
    'gridColumns',
  ]

  it('iOS drops exactly the properties on the known list, and no more', () => {
    const swift = swiftStyleKeys()
    const dropped = irStyleKeys().filter(key => !swift.has(key)).sort()
    expect(dropped).toEqual([...IOS_DROPS].sort())
  })

  it('declares nothing on iOS that the compiler never emits', () => {
    // The other direction: a field here that the IR cannot produce is dead
    // weight, and more likely a rename that only happened on one side.
    const ir = new Set(irStyleKeys())
    const orphaned = [...swiftStyleKeys()].filter(key => !ir.has(key)).sort()
    expect(orphaned).toEqual([])
  })

  it('covers the properties the reference tree actually uses', () => {
    // Whatever else is missing, the documented example has to survive the trip.
    const swift = swiftStyleKeys()
    for (const key of ['flex', 'flexDirection', 'justifyContent', 'alignItems', 'padding', 'backgroundColor', 'color', 'fontSize', 'fontWeight'])
      expect(swift.has(key)).toBe(true)
  })
})
