/**
 * The translator from stx's rendered output to the native IR (stacksjs/stx#1983).
 *
 * The point of the change these tests cover is that the native target stops
 * having its own opinion about what a `.stx` file means. So the interesting
 * tests are not the hand-written fragments -- they are the ones at the bottom,
 * which take real components out of `@stacksjs/components`, push them through
 * the actual stx pipeline, and translate what comes out. Those are the files
 * the old parser could not read: one threw, and two returned a single Text
 * node holding raw template source, which is worse, because a wrong tree that
 * compiles is a wrong screen that ships.
 *
 * `../../src`, never the package entry: `@stacksjs/stx` resolves to
 * packages/stx/dist, a build that lags the source.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { NATIVE_EVENTS, translateHtmlToDocument, translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import type { STXNode } from '../../src/native/compiler/ir'
import type { FlatListProps, ImageProps, TextInputProps } from '../../src/native/components/primitives'

const COMPONENTS = path.join(import.meta.dir, '..', '..', '..', 'components')

describe('shared form-control semantics (#2087)', () => {
  it('preserves the control and label text instead of flattening the control away', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<label>Agree<input type="checkbox" checked value="yes"></label>')
    expect(root.type).toBe('View')
    expect(root.children[0]).toMatchObject({ type: 'Text', children: ['Agree'] })
    expect(root.children[1]).toMatchObject({ type: 'Checkbox', props: { checked: true, value: true, formValue: 'yes' } })
    expect(diagnostics).toEqual([])
  })

  it('keeps hidden values invisible and diagnoses unsupported radio controls', async () => {
    const hidden = await translateHtmlToIR('<input type="hidden" name="token" value="abc">')
    expect(hidden.root).toMatchObject({ type: 'View', style: { display: 'none' }, props: { name: 'token', value: 'abc' } })
    const radio = await translateHtmlToIR('<input type="radio" name="size" value="small">')
    expect(radio.root.type).not.toBe('TextInput')
    expect(radio.diagnostics).toContainEqual({ kind: 'unsupported-control', tag: 'input', name: 'input:radio' })
  })

  it('keeps real shared Switch and Checkbox controls in the translated tree', async () => {
    const { root } = await translateHtmlToIR(await render('<div><Switch label="Enabled" /><Checkbox label="Agree" /></div>'))
    expect(types(root)).toContain('Pressable')
    expect(types(root)).toContain('Checkbox')
  })
})

/** Render a template against the real component library, as a browser gets it. */
async function render(template: string): Promise<string> {
  return processDirectives(
    template,
    {},
    path.join(COMPONENTS, 'native-translate.stx'),
    {
      componentsDir: path.join(COMPONENTS, 'src', 'ui'),
      root: COMPONENTS,
      buildMode: 'serve',
      cache: false,
    } as any,
    new Set<string>(),
  )
}

/** Every component type in a tree, in document order. */
function types(node: STXNode, out: string[] = []): string[] {
  out.push(node.type)
  for (const child of node.children)
    if (typeof child !== 'string')
      types(child, out)
  return out
}

/** Every string of text in a tree, in document order. */
function texts(node: STXNode, out: string[] = []): string[] {
  for (const child of node.children) {
    if (typeof child === 'string')
      out.push(child)
    else texts(child, out)
  }
  return out
}

describe('native utility diagnostics', () => {
  it('reports unsupported static classes without losing supported styles', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div class="p-4 made-up-layout made-up-layout dark:made-up-dark" style="margin-top: 8px"><span>Content</span></div>')
    expect(root.style.padding).toBe(16)
    expect(root.style.marginTop).toBe(8)
    expect(texts(root)).toEqual(['Content'])
    expect(diagnostics).toEqual([
      { kind: 'unknown-class', tag: 'div', name: 'made-up-layout' },
      { kind: 'unknown-class', tag: 'div', name: 'dark:made-up-dark' },
    ])
  })

  it('does not report native styles, icons or line clamps as unknown classes', async () => {
    const { diagnostics } = await translateHtmlToIR('<div class="p-4 bg-white dark:bg-slate-950"><span class="line-clamp-2 text-sm">Content</span><Icon class="i-lucide-heart w-5 h-5" /></div>')
    expect(diagnostics).toEqual([])
  })

  it('includes classes on translated SVG elements in diagnostics', async () => {
    const { diagnostics } = await translateHtmlToIR('<svg viewBox="0 0 10 10" class="unsupported-drawing"><circle cx="5" cy="5" r="4" /></svg>')
    expect(diagnostics).toContainEqual({ kind: 'unknown-class', tag: 'svg', name: 'unsupported-drawing' })
  })
})

describe('the documented reference tree', () => {
  // The example from the issue, which the old parser compiled correctly. The
  // translator has to agree with it exactly, or this is a regression dressed
  // up as a refactor.
  const html = `<View class="flex-1 flex-col justify-center items-center p-4 bg-blue-500">
  <Text class="text-white text-lg font-bold">Wildloop</Text>
</View>`

  it('compiles to the documented IR', async () => {
    const { root } = await translateHtmlToIR(html)
    expect(root.type).toBe('View')
    expect(root.style).toEqual({
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
    expect(root.children.length).toBe(1)
    const child = root.children[0] as STXNode
    expect(child.type).toBe('Text')
    expect(child.style).toEqual({ color: '#ffffff', fontSize: 18, fontWeight: 'bold' })
    expect(child.children).toEqual(['Wildloop'])
  })

  it('reports nothing to worry about', async () => {
    const { diagnostics } = await translateHtmlToIR(html)
    expect(diagnostics).toEqual([])
  })
})

describe('what the renderers can actually draw', () => {
  it('turns a container holding only text into a Text', async () => {
    // iOS says it in as many words: "View doesn't render text directly". A div
    // with a label would otherwise keep its box and lose its label.
    const { root } = await translateHtmlToIR('<div class="p-2">Save</div>')
    expect(root.type).toBe('Text')
    expect(root.children).toEqual(['Save'])
    expect(root.style).toEqual({ padding: 8 })
  })

  it('keeps the words of inline markup inside a Text', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<p>Signed in as <strong>Ada</strong>.</p>')
    expect(root.type).toBe('Text')
    expect(root.children).toEqual(['Signed in as Ada.'])
    expect(diagnostics).toEqual([{ kind: 'flattened-text', tag: 'p' }])
  })

  it('draws a Text\'s words given as a text attribute, as a binding would', async () => {
    // `<Text :text="'Apple Health'" />` reaches here folded to a plain
    // attribute, and no renderer draws a `text` prop on a Text.
    const { root } = await translateHtmlToIR('<View><Text text="Apple Health"></Text><Text text=""></Text><Text text="Kept">Content</Text></View>')
    expect(root.children.map(child => typeof child === 'string' ? child : [child.children, child.props.text ?? null])).toEqual([
      [['Apple Health'], null],
      [[], null],
      [['Content'], 'Kept'],
    ])
  })

  it('keeps a container a container when it has element children', async () => {
    const { root } = await translateHtmlToIR('<div><span>a</span><span>b</span></div>')
    expect(types(root)).toEqual(['View', 'Text', 'Text'])
    expect(texts(root)).toEqual(['a', 'b'])
  })

  it('wraps several roots in a View rather than picking one', async () => {
    const { root } = await translateHtmlToIR('<div class="p-1"></div><div class="p-2"></div>')
    expect(root.type).toBe('View')
    expect(root.children.length).toBe(2)
  })

  it('refuses an input with no element, instead of inventing a tree', async () => {
    await expect(translateHtmlToIR('   ', { source: 'Blank.stx' })).rejects.toThrow(/No element to translate/)
  })
})

describe('events', () => {
  it('maps @click to onPress, the name the renderers read', async () => {
    // `parser.ts` produced `onClick`, which neither renderer dispatches on, so
    // every tap was a no-op on both platforms.
    const { root } = await translateHtmlToIR('<button @click="save()">Save</button>')
    expect(root.events).toEqual({ onPress: 'save()' })
  })

  it('maps ordinary stx event names to the full native control vocabulary', async () => {
    const cases = [
      ['press-in', 'onPressIn'],
      ['press-out', 'onPressOut'],
      ['layout', 'onLayout'],
      ['end-reached', 'onEndReached'],
      ['show', 'onShow'],
      ['dismiss', 'onDismiss'],
      ['request-close', 'onRequestClose'],
      ['sliding-complete', 'onSlidingComplete'],
      ['load-start', 'onLoadStart'],
      ['load', 'onLoad'],
      ['load-end', 'onLoadEnd'],
      ['error', 'onError'],
      ['end-editing', 'onEndEditing'],
      ['submit-editing', 'onSubmitEditing'],
      ['value-change', 'onValueChange'],
    ] as const

    for (const [event, native] of cases) {
      const { root, diagnostics } = await translateHtmlToIR(`<div @${event}="handle($event)"></div>`)
      expect(root.events).toEqual({ [native]: 'handle($event)' })
      expect(diagnostics).toEqual([])
    }
  })

  it('restores case-sensitive native host prop names after HTML parsing', async () => {
    const { root } = await translateHtmlToIR('<div data-native="ScrollView" testID="feed" keyboardDismissMode="on-drag" contentContainerStyle="{}"></div>')
    expect(root.props).toMatchObject({
      testID: 'feed',
      keyboardDismissMode: 'on-drag',
      contentContainerStyle: {},
    })
  })

  it.each(['nonModal dismissOnOutsideTap', 'non-modal dismiss-on-outside-tap'])('preserves native popup boolean protocol names: %s', async (attributes) => {
    const { root } = await translateHtmlToIR(`<div data-native="Modal" ${attributes}></div>`)
    expect(root.props).toMatchObject({ nonModal: true, dismissOnOutsideTap: true })
    expect(root.props.nonmodal).toBeUndefined()
    expect(root.props.dismissonoutsidetap).toBeUndefined()
    const { root: blocking } = await translateHtmlToIR('<div data-native="Modal" nonModal="false" dismissOnOutsideTap="false"></div>')
    expect(blocking.props).toMatchObject({ nonModal: false, dismissOnOutsideTap: false })
  })

  it('decodes JSON object props forwarded by native components', async () => {
    const { root } = await translateHtmlToIR('<div data-native="ScrollView" contentContainerStyle="{&quot;paddingTop&quot;:12}"></div>')

    expect(root.props.contentContainerStyle).toEqual({ paddingTop: 12 })
  })

  it('reports a handler no renderer reads instead of attaching it to nothing', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div @keydown.enter="go()">x</div>')
    expect(root.events).toEqual({})
    expect(diagnostics).toEqual([{ kind: 'unread-event', tag: 'div', name: '@keydown.enter' }])
  })

  it('retains every event supported by the bundled reference renderers', () => {
    const renderers = path.join(import.meta.dir, '..', '..', 'src', 'native', 'renderers')
    const read = new Set<string>()
    for (const file of ['ios.swift', 'android.kt']) {
      const source = readFileSync(path.join(renderers, file), 'utf8')
      for (const match of source.matchAll(/events\[["'](\w+)["']\]/g))
        read.add(match[1])
    }
    for (const event of read)
      expect(NATIVE_EVENTS.has(event)).toBe(true)
  })

  it('hears where a swipe came to rest, for a pager', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div data-native="ScrollView" horizontal pagingEnabled @momentum-scroll-end="settled($event)" @scroll-begin-drag="dragging()" @scroll-end-drag="dropped()"></div>')
    expect(root.events).toEqual({ onMomentumScrollEnd: 'settled($event)', onScrollBeginDrag: 'dragging()', onScrollEndDrag: 'dropped()' })
    expect(diagnostics).toEqual([])
  })

  it('forwards pull-to-refresh to the Craft scroll-view host', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div data-native="ScrollView" @refresh="refresh(true)" :refreshing="refreshing"></div>')
    expect(root.events).toEqual({ onRefresh: 'refresh(true)' })
    expect(root.bindings).toEqual({ refreshing: 'refreshing' })
    expect(diagnostics).toEqual([])
  })
})

describe('bindings', () => {
  it('carries a binding through verbatim for the device to evaluate', async () => {
    const { root } = await translateHtmlToIR('<div :show="isOpen()" x-text="label()">x</div>')
    expect(root.bindings).toEqual({ show: 'isOpen()', text: 'label()' })
  })

  it('reads the two spellings of one binding as one entry', async () => {
    const { root } = await translateHtmlToIR('<div x-text="label()">x</div>')
    expect(root.bindings).toEqual({ text: 'label()' })
  })

  it('leaves x-cloak out, which is a paint hint and not a binding', async () => {
    const { root } = await translateHtmlToIR('<div x-cloak class="p-1"><span>a</span></div>')
    expect(root.bindings).toBeUndefined()
  })
})

describe('what is deliberately dropped', () => {
  it('drops a script without letting its source become text', async () => {
    const { root, diagnostics } = await translateHtmlToIR(
      '<div><script>const a = "<b>not markup</b>"</script><span>real</span></div>',
    )
    expect(texts(root)).toEqual(['real'])
    expect(diagnostics).toContainEqual({ kind: 'dropped-subtree', tag: 'script' })
  })

  it('leaves no node of a dropped type in the tree', async () => {
    // The first version of this translator discarded a script's CONTENTS and
    // then attached the script element itself, so the library's trees carried
    // 52 nodes of type "script" and 89 of type "link" -- 288 phantom nodes out
    // of 784, each one a type no renderer has a case for.
    const { root } = await translateHtmlToIR(
      '<div><link rel="stylesheet" href="/a.css"><style>.a{color:red}</style><script>x()</script><span>real</span></div>',
    )
    expect(types(root)).toEqual(['View', 'Text'])
  })

  it('draws an svg, keeping its box (svg.test.ts covers the shapes)', async () => {
    // It used to keep the box and drop the geometry, so a chart or a route
    // map on a native screen was an empty rectangle.
    const { root, diagnostics } = await translateHtmlToIR(
      '<svg class="h-5 w-5"><path d="M4 12a8 8"></path></svg>',
    )
    expect(root.type).toBe('Svg')
    expect(root.style).toEqual({ height: 20, width: 20 })
    expect((root.children[0] as STXNode).type).toBe('Path')
    expect(diagnostics).not.toContainEqual({ kind: 'dropped-subtree', tag: 'svg' })
  })

  it('drops a value a numeric field cannot hold, rather than bricking the screen', async () => {
    // Not a dropped property -- a dropped screen. iOS reads these as CGFloat
    // and Swift's synthesised decoder fails the WHOLE document on a type
    // mismatch, so one `bottom: max(env(...), 12px)` in a safe-area inset
    // means nothing renders at all. TabBar had exactly that.
    const { root, diagnostics } = await translateHtmlToIR(
      '<div style="bottom:max(env(safe-area-inset-bottom, 0px), 12px);padding:8px"><span>a</span></div>',
    )
    expect(root.style).toEqual({ padding: 8 })
    expect(diagnostics).toContainEqual({ kind: 'non-numeric-style', tag: 'div', name: 'bottom' })
  })

  it('uses a child container for composed HTML buttons while preserving explicit primitives', async () => {
    const { root } = await translateHtmlToIR('<button type="submit"><span :if="shown">Save</span><svg><path d="M0 0L1 1" /></svg></button>')
    expect(root.type).toBe('Pressable')
    expect(root.props).toMatchObject({ accessibilityRole: 'button', type: 'submit' })
    expect(root.children).toHaveLength(2)
    expect(root.children[0]).toMatchObject({ type: 'Text', bindings: { if: 'shown' } })
    expect(root.children[1]).toMatchObject({ type: 'Svg' })
    expect((await translateHtmlToIR('<button role="tab"><span>Tab</span></button>')).root.props.accessibilityRole).toBe('tab')
    expect((await translateHtmlToIR('<button>Save</button>')).root.type).toBe('Button')
    expect((await translateHtmlToIR('<button data-native="Button"><span>Save</span></button>')).root.type).toBe('Button')
  })

  it('keeps a percentage, which the IR does declare for a dimension', async () => {
    const { root } = await translateHtmlToIR('<div style="width:50%;font-size:1.5rem"><span>a</span></div>')
    expect(root.style).toEqual({ width: '50%', fontSize: 24 })
  })

  it('keeps grid tracks consumed by the maintained native hosts', async () => {
    const { root, diagnostics } = await translateHtmlToIR(
      '<div style=\'{"display":"grid","gridTemplateColumns":"repeat(2, 1fr)","gridAutoRows":28}\'><span>a</span></div>',
    )
    expect(root.style).toMatchObject({
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridAutoRows: 28,
    })
    expect(diagnostics).not.toContainEqual(expect.objectContaining({ kind: 'unknown-style' }))
  })

  it('sees through a template wrapper instead of dropping the screen', async () => {
    // A native screen written as `<script>...</script><template>...</template>`
    // keeps the template element in stx's output. Dropping it as a non-view
    // took the whole screen with it -- found by the CLI's own fixtures
    // translating to nothing at all.
    const { root } = await translateHtmlToIR(
      '<template><div class="p-4"><span>Hello</span></div></template>',
    )
    expect(root.type).toBe('View')
    expect(root.style).toEqual({ padding: 16 })
    expect(texts(root)).toEqual(['Hello'])
  })

  it('moves structural template bindings onto the native row root', async () => {
    const { root } = await translateHtmlToIR(
      '<template :for="item in items" data-stx-b="7"><span :key="item.id" :text="item.label" data-stx-b="8"></span></template>',
    )

    expect(root.type).toBe('Text')
    expect(root.bindingId).toBe(8)
    expect(root.bindings).toEqual({
      for: 'item in items',
      key: 'item.id',
      text: 'item.label',
    })
  })

  it('sees through a document body too', async () => {
    const { root } = await translateHtmlToIR('<body><div class="p-1"><span>a</span></div></body>')
    expect(root.type).toBe('View')
    expect(texts(root)).toEqual(['a'])
  })

  it('reports an inline style property the IR has no field for', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div style="display:contents;cursor:pointer"><span>a</span></div>')
    expect(root.style).toEqual({ display: 'contents' })
    expect(diagnostics).toContainEqual({ kind: 'unknown-style', tag: 'div', name: 'cursor' })
  })
})

describe('shared-runtime list boundaries', () => {
  it('types list chrome slots on the shared primitive props', () => {
    const typedListSlot: FlatListProps<string> = {
      listRole: 'item',
      onRefresh: () => {},
      refreshing: false,
    }
    expect(typedListSlot.listRole).toBe('item')
    expect(typedListSlot.refreshing).toBe(false)
  })

  it('types the shared native text-input aliases', async () => {
    const typedInput: TextInputProps = {
      numberOfLines: 3,
      onChange: () => {},
      onEndEditing: () => {},
    }
    expect(typedInput.numberOfLines).toBe(3)
    const { root, diagnostics } = await translateHtmlToIR(
      '<input data-native="TextInput" numberOfLines="3" />',
    )
    expect(root.type).toBe('TextInput')
    expect(root.props.numberOfLines).toBe(3)
    expect(diagnostics).toEqual([])
  })

  it('types image alt text for native accessibility', () => {
    const image: ImageProps = { source: 'https://example.com/trail.png', alt: 'Trail map' }
    expect(image.alt).toBe('Trail map')
  })

  it('warns when legacy FlatList expansion props would otherwise be silently ignored', async () => {
    const { root, diagnostics } = await translateHtmlToIR(
      '<div data-native="FlatList" :data="rows" :renderItem="renderRow" keyExtractor="rowKey" listRole="item"><Text>Rows</Text></div>',
    )

    expect(root.type).toBe('FlatList')
    expect(root.props.listRole).toBe('item')
    expect(diagnostics).toEqual([
      { kind: 'unsupported-list-prop', tag: 'FlatList', name: 'data' },
      { kind: 'unsupported-list-prop', tag: 'FlatList', name: 'renderItem' },
      { kind: 'unsupported-list-prop', tag: 'FlatList', name: 'keyExtractor' },
    ])
  })

  it('rejects SectionList data props until the versioned list protocol exists', async () => {
    const { root, diagnostics } = await translateHtmlToIR(
      '<div data-native="SectionList" :sections="sections" :renderItem="renderRow" :renderSectionHeader="renderHeader"><Text>Rows</Text></div>',
    )

    expect(root.type).toBe('SectionList')
    expect(diagnostics).toEqual([
      { kind: 'unsupported-list-prop', tag: 'SectionList', name: 'sections' },
      { kind: 'unsupported-list-prop', tag: 'SectionList', name: 'renderItem' },
      { kind: 'unsupported-list-prop', tag: 'SectionList', name: 'renderSectionHeader' },
    ])
  })

  it('keeps ordinary keyed :for list props warning-free', async () => {
    const { diagnostics } = await translateHtmlToIR(
      '<div data-native="FlatList"><Text :for="row in rows" :key="row.id" :text="row.label" /></div>',
    )

    expect(diagnostics).toEqual([])
  })
})

/**
 * The three components the issue sampled, through the real pipeline.
 *
 * Each assertion here is something the old parser got wrong: Button threw,
 * Card and TabBar came back as one Text node wrapping raw template source.
 */
describe('real components from @stacksjs/components', () => {
  it('Button: a pressable with its label and its handler', async () => {
    const { root } = await translateHtmlToIR(
      await render('<Button variant="primary" @click="save()">Save</Button>'),
      { source: 'Button.stx' },
    )
    const all = types(root)
    expect(all).toContain('Pressable')
    expect(texts(root)).toContain('Save')

    const button = find(root, node => node.type === 'Pressable')
    expect(button).toBeTruthy()
    expect(button!.events).toEqual({ onPress: 'onClick($event)' })
    // The spinner's visibility is a binding, not a server decision.
    expect(JSON.stringify(root)).toContain('isLoading()')
  })

  it('Card: a styled container, not a Text holding @if source', async () => {
    const html = await render('<Card title="Account"><p>Body</p></Card>')
    const { root } = await translateHtmlToIR(html, { source: 'Card.stx' })
    expect(root.type).toBe('View')
    expect(texts(root)).toContain('Body')
    // The failure this replaces: a single Text child that still held `@if(...)`.
    expect(JSON.stringify(root)).not.toContain('@if(')
    expect(JSON.stringify(root)).not.toContain('{{')
  })

  it('TabBar: a tab per item, with text, not one collapsed Text node', async () => {
    const html = await render(
      '<TabBar :items="[{ label: \'Home\', to: \'/\' }, { label: \'Profile\', to: \'/me\' }]" />',
    )
    const { root } = await translateHtmlToIR(html, { source: 'TabBar.stx' })
    // A bar holding one pressable per item, each with an icon box and a label.
    expect(root.type).toBe('View')
    expect(types(root).filter(type => type === 'TouchableOpacity').length).toBe(2)
    expect(texts(root)).toContain('Home')
    expect(texts(root)).toContain('Profile')
    expect(JSON.stringify(root)).not.toContain('{{')
  })

  it('no component leaves a template comment or a directive in the IR', async () => {
    // The whole class of failure in one assertion, across a wider sample.
    const samples = [
      '<Badge>New</Badge>',
      '<Breadcrumb :items="[{ label: \'Home\', to: \'/\' }]" />',
      '<EmptyState title="Nothing here" description="Add one to begin" />',
      '<Spinner />',
      '<Switch label="Wifi" />',
      // The ones with the most template machinery in them: a reactive prop, a
      // slot, a loop over tabs, a portal.
      '<TextInput name="email" label="Email" placeholder="you@example.com" />',
      '<Dialog title="Confirm"><p>Sure?</p></Dialog>',
      '<Tabs :tabs="[{ label: \'One\' }, { label: \'Two\' }]" />',
      '<Drawer title="Menu"><p>x</p></Drawer>',
      '<CommandPalette :items="[{ label: \'Open\' }]" />',
    ]
    for (const sample of samples) {
      const { root } = await translateHtmlToIR(await render(sample), { source: sample })
      const json = JSON.stringify(root)
      expect(json).not.toContain('{{')
      expect(json).not.toContain('{{--')
      expect(json).not.toMatch(/@(if|foreach|endif|endforeach)\b/)
      // No node of a type the renderers have no case for.
      expect(json).not.toMatch(/"type":"(script|style|link|meta|head|slot)"/)
      if (sample === '<Badge>New</Badge>') {
        // A text-only badge correctly becomes one native Text leaf.
        expect(root.type).toBe('Text')
        expect(texts(root).map(text => text.trim())).toEqual(['New'])
      }
      else {
        expect((json.match(/"type":/g) ?? []).length, sample).toBeGreaterThan(1)
      }
    }
  })

  it('emits no style value the iOS renderer would reject outright', async () => {
    // The contract is read out of the renderer, so it tracks the renderer. A
    // `CGFloat?` field holding a string is a typeMismatch on the whole
    // document, which is the one failure here that costs a screen rather than
    // a property.
    const swift = readFileSync(
      path.join(import.meta.dir, '..', '..', 'src', 'native', 'renderers', 'ios.swift'),
      'utf8',
    )
    const struct = swift.slice(swift.indexOf('struct STXStyle: Codable {'))
    const numeric = new Set(
      [...struct.slice(0, struct.indexOf('\n}')).matchAll(/var (\w+): CGFloat\?/g)].map(m => m[1]),
    )
    expect(numeric.size).toBeGreaterThan(20)

    const samples = [
      '<TabBar :items="[{ label: \'Home\', to: \'/\' }]" />',
      '<Drawer title="Menu"><p>x</p></Drawer>',
      '<Dialog title="Confirm"><p>Sure?</p></Dialog>',
      '<Card title="Account"><p>Body</p></Card>',
      '<Sidebar :items="[{ label: \'Home\', to: \'/\' }]" />',
    ]
    for (const sample of samples) {
      const { root } = await translateHtmlToIR(await render(sample), { source: sample })
      for (const node of walk(root))
        for (const [key, value] of Object.entries(node.style))
          if (numeric.has(key))
            expect(typeof value, `${sample} -> ${node.type}.${key} = ${JSON.stringify(value)}`).not.toBe('string')
    }
  })

  it('wraps a translation in a document the renderers can decode', async () => {
    const { document } = await translateHtmlToDocument(await render('<Badge>New</Badge>'), {
      source: 'Badge.stx',
    })
    expect(document.version).toBe('1.0.0')
    expect(document.meta.source).toBe('Badge.stx')
    expect(document.root.type).toBeTruthy()
    expect(document.script).toEqual({ exports: {}, functions: [], code: '' })
  })
})

function find(node: STXNode, predicate: (node: STXNode) => boolean): STXNode | null {
  if (predicate(node))
    return node
  for (const child of node.children) {
    if (typeof child === 'string')
      continue
    const found = find(child, predicate)
    if (found)
      return found
  }
  return null
}

function* walk(node: STXNode): Generator<STXNode> {
  yield node
  for (const child of node.children)
    if (typeof child !== 'string')
      yield * walk(child)
}

describe('native map exploration contract', () => {
  it('preserves a native topographic provider and its attribution', async () => {
    const {root}=await translateHtmlToIR('<Map tile-overlay="{&quot;urlTemplate&quot;:&quot;https://example.org/{z}/{y}/{x}.png&quot;,&quot;attribution&quot;:&quot;Test map data&quot;}"></Map>')
    expect(root.props.tileOverlay).toEqual({urlTemplate:'https://example.org/{z}/{y}/{x}.png',attribution:'Test map data'})
  })
  it('keeps map camera, compass, scale, direction arrows and tap events in the host protocol', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<Map camera-pitch="45" camera-heading="90" initial-region="{&quot;center&quot;:{&quot;latitude&quot;:37,&quot;longitude&quot;:-119},&quot;span&quot;:{&quot;latitudeDelta&quot;:0.1,&quot;longitudeDelta&quot;:0.1}}" edge-padding="{&quot;bottom&quot;:180,&quot;top&quot;:32}" shows-compass shows-scale @click="addPoint($event)" @region-change-complete="rememberCamera($event)"><MapMarker id="direction" geometry="[37,-119]" bearing="45" /></Map>')
    expect(diagnostics).toEqual([])
    expect(root.type).toBe('Map')
    expect(root.props).toMatchObject({ cameraPitch: 45, cameraHeading: 90, showsCompass: true, showsScale: true, edgePadding: {bottom:180,top:32}, initialRegion:{center:{latitude:37,longitude:-119},span:{latitudeDelta:0.1,longitudeDelta:0.1}} })
    expect(root.events).toEqual({ onPress: 'addPoint($event)', onRegionChangeComplete: 'rememberCamera($event)' })
    expect((root.children[0] as STXNode).props.bearing).toBe(45)
  })
})
