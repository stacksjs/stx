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

const COMPONENTS = path.join(import.meta.dir, '..', '..', '..', 'components')

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

  it('restores case-sensitive native host prop names after HTML parsing', async () => {
    const { root } = await translateHtmlToIR('<div data-native="ScrollView" testID="feed" keyboardDismissMode="on-drag" contentContainerStyle="{}"></div>')
    expect(root.props).toMatchObject({
      testID: 'feed',
      keyboardDismissMode: 'on-drag',
      contentContainerStyle: {},
    })
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

  it('names exactly the events at least one renderer dispatches on', () => {
    const renderers = path.join(import.meta.dir, '..', '..', 'src', 'native', 'renderers')
    const read = new Set<string>()
    for (const file of ['ios.swift', 'android.kt']) {
      const source = readFileSync(path.join(renderers, file), 'utf8')
      for (const match of source.matchAll(/events\[["'](\w+)["']\]/g))
        read.add(match[1])
    }
    expect([...NATIVE_EVENTS].sort()).toEqual([...read].sort())
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

  it('keeps an icon box and drops its geometry', async () => {
    const { root, diagnostics } = await translateHtmlToIR(
      '<svg class="h-5 w-5"><path d="M4 12a8 8"></path></svg>',
    )
    expect(root.type).toBe('View')
    expect(root.style).toEqual({ height: 20, width: 20 })
    expect(root.children).toEqual([])
    expect(diagnostics).toContainEqual({ kind: 'dropped-subtree', tag: 'svg' })
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

  it('keeps a percentage, which the IR does declare for a dimension', async () => {
    const { root } = await translateHtmlToIR('<div style="width:50%;font-size:1.5rem"><span>a</span></div>')
    expect(root.style).toEqual({ width: '50%', fontSize: 24 })
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
    expect(all).toContain('Button')
    expect(texts(root)).toContain('Save')

    const button = find(root, node => node.type === 'Button')
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
      expect((json.match(/"type":/g) ?? []).length).toBeGreaterThan(1)
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
