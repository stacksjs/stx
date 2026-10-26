/**
 * Two layouts the web expresses with classes and a phone with node types.
 *
 * Inside a button only phrasing content is valid, so a list row's title over
 * its subtitle is a `<span class="flex flex-col">`, which the translator used
 * to flatten into one Text reading "TitleSubtitle". And a row of chips wider
 * than the screen scrolls sideways on the web through `overflow-x-auto`,
 * which a native View ignores and clips.
 */
import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

describe('a span styled as a box', () => {
  it('keeps a flex column of labels as a column', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<button type="button"><span class="flex flex-col"><span>Ridge loop</span><span>4.2 mi</span></span><span>Run</span></button>')
    expect(diagnostics).toEqual([])
    const column = root.children[0] as any
    expect(column.type).toBe('View')
    expect(column.style.flexDirection).toBe('column')
    expect(column.children.map((child: any) => child.children[0])).toEqual(['Ridge loop', '4.2 mi'])
  })

  it('still reads inline emphasis as one label', async () => {
    const { root } = await translateHtmlToIR('<p>Held by <b>Marta</b> for 3 days</p>')
    expect(root.type).toBe('Text')
    expect(root.children).toEqual(['Held by Marta for 3 days'])
  })
})

describe('a box that scrolls', () => {
  it('is a horizontal ScrollView when it scrolls sideways', async () => {
    const { root, diagnostics } = await translateHtmlToIR('<div class="flex gap-2 overflow-x-auto"><button type="button">All</button><button type="button">Kudos</button></div>')
    expect(diagnostics).toEqual([])
    expect(root.type).toBe('ScrollView')
    expect(root.props).toMatchObject({ horizontal: true, showsHorizontalScrollIndicator: false })
  })

  it('is a vertical ScrollView when it scrolls down', async () => {
    const { root } = await translateHtmlToIR('<div class="max-h-64 overflow-y-auto"><p>One</p><p>Two</p></div>')
    expect(root.type).toBe('ScrollView')
    expect(root.props.horizontal).toBeUndefined()
  })
})

describe('a scrolling viewport inside shared layout wrappers', () => {
  it('carries the flexible viewport through unsized wrappers beside headers', async () => {
    const { root } = await translateHtmlToIR('<div><header>Connections</header><div><div class="flex-1"><div data-native="ScrollView" class="flex-1"><p>Choose a bottle</p></div></div></div><aside></aside></div>')
    const wrapper = root.children[1] as any
    expect(root.style.flex).toBe(1)
    expect(wrapper.style).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0 })
    expect((root.children[0] as any).style.flex).toBeUndefined()
    expect((root.children[2] as any).style.flex).toBeUndefined()
  })

  it('respects authored sizing and flex opt-outs', async () => {
    for (const classes of ['h-64', 'max-h-64', 'flex-none']) {
      const { root } = await translateHtmlToIR(`<div><div class="${classes}"><div data-native="ScrollView" class="flex-1"><p>Rows</p></div></div></div>`)
      expect(root.style.flex).toBeUndefined()
    }
  })

  it('keeps scroll content and horizontal strips intrinsically sized', async () => {
    const { root } = await translateHtmlToIR('<div data-native="ScrollView" class="flex-1"><div><div data-native="ScrollView" class="flex-1"><p>Nested content</p></div></div></div>')
    expect((root.children[0] as any).style.flex).toBeUndefined()
    const { root: horizontal } = await translateHtmlToIR('<div><div data-native="ScrollView" horizontal class="flex-1"><p>Tabs</p></div></div>')
    expect(horizontal.style.flex).toBeUndefined()
  })
})

it('retains inferred viewport sizing through reactive classes and appearance updates', async () => {
  const { code } = await compileNativeScreen(`<script client>
const classes = state('bg-white dark:bg-black')
</script><div><header>Connections</header><div testID="wrapper" :class="classes"><div data-native="ScrollView" class="flex-1"><p>Rows</p></div></div></div>`, { name: 'ScrollingForm' })
  const phone = mountNativeScreen(code, 'ScrollingForm')
  try {
    await phone.settle()
    expect(phone.byTestID('wrapper')?.style.flexGrow).toBe(1)
    phone.appearance('dark')
    await phone.settle()
    expect(phone.byTestID('wrapper')?.style).toMatchObject({ flexGrow: 1, flexBasis: 0, backgroundColor: '#000000' })
  }
  finally { phone.unmount() }
})
