/**
 * A list that fills its space owns the scrolling: a vertical ScrollView
 * around it compiles as a View.
 *
 * HQ's store page extends a layout whose `<main class="overflow-y-auto
 * flex-1">` is a vertical ScrollView, and the page is a `<List>`. The list
 * asked for the height of a viewport with no height, and on iOS the body was
 * blank, with "NaN passed to CoreGraphics" in the log. Every other scrolling
 * main stays a ScrollView.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import type { STXNode } from '../../src/native/compiler/ir'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

const ui = join(import.meta.dir, '../../../components/src/ui')

function find(node: STXNode, type: string): STXNode | undefined {
  if (node.type === type) return node
  for (const child of node.children) {
    const found = typeof child === 'string' ? undefined : find(child, type)
    if (found) return found
  }
  return undefined
}

afterEach(() => unmountAllNativeScreens())

describe('a vertical ScrollView around a list that fills it', () => {
  it('is a View with its flex, through the wrappers a page and its layout add', async () => {
    const { root, diagnostics } = await translateHtmlToIR(`<div><header>Store</header>
<main class="overflow-y-auto flex-1"><div><div class="flex-1 w-full"><div class="flex-1">
  <div data-native="FlatList" class="flex-1"><div key="a"><p>Rappid</p></div></div>
</div></div></div></main></div>`)
    expect(find(root, 'ScrollView')).toBeUndefined()
    const main = root.children[1] as STXNode
    expect(main.type).toBe('View')
    expect(main.style.flex).toBe(1)
    // The unsized wrapper between them still gets the viewport's flex.
    expect((main.children[0] as STXNode).style.flex).toBe(1)
    expect(diagnostics).toContainEqual({ kind: 'list-owns-scrolling', tag: 'ScrollView', name: 'FlatList' })
  })

  it('is a View for a SectionList, and with no flex of its own it takes the list\'s', async () => {
    const { root } = await translateHtmlToIR('<div><main class="overflow-y-auto"><div data-native="SectionList" class="flex-1"></div></main></div>')
    const main = root.children[0] as STXNode
    expect(main.type).toBe('View')
    expect(main.style.flex).toBe(1)
  })
})

describe('a ScrollView the list does not fill', () => {
  it.each([
    ['content with no list', '<main class="overflow-y-auto flex-1"><p>About</p></main>'],
    ['a list with no flex', '<main class="overflow-y-auto flex-1"><div data-native="FlatList"></div></main>'],
    ['a list in a box with its own height', '<main class="overflow-y-auto flex-1"><div class="h-64"><div data-native="FlatList" class="flex-1"></div></div></main>'],
    ['a sideways list', '<main class="overflow-y-auto flex-1"><div data-native="FlatList" class="flex-1 overflow-x-auto"></div></main>'],
    ['a list under a nested sideways scroller', '<main class="overflow-y-auto flex-1"><div class="overflow-x-auto"><div data-native="FlatList" class="flex-1"></div></div></main>'],
  ])('stays a ScrollView: %s', async (_, html) => {
    const { root, diagnostics } = await translateHtmlToIR(html)
    expect(root.type).toBe('ScrollView')
    expect(diagnostics.some(d => d.kind === 'list-owns-scrolling')).toBe(false)
  })

  it('leaves a horizontal ScrollView sideways', async () => {
    const { root } = await translateHtmlToIR('<main class="overflow-x-auto flex-1"><div data-native="FlatList" class="flex-1"></div></main>')
    expect(root).toMatchObject({ type: 'ScrollView', props: { horizontal: true } })
  })
})

describe('the shared <List> under a scrolling main, mounted', () => {
  it.each(['ios', 'android'] as const)('has no ScrollView above it on %s, and its rows draw', async (platform) => {
    const source = `@import('List', '${ui}/list/List.stx')
<div class="flex flex-1 flex-col" testID="screen">
  <header><p>Store</p></header>
  <main class="overflow-y-auto flex-1" testID="main">
    <div class="flex-1 w-full">
      <List className="flex-1" testID="collection"><div key="a"><p>Rappid</p></div></List>
    </div>
  </main>
</div>`
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const list = phone.byTestID('collection')!
    expect(list.type).toBe('FlatList')
    const nodes = [...phone.nodes.values()]
    const types: string[] = []
    for (let node = list; node;) {
      const parent = nodes.find(other => other.children.some(child => typeof child !== 'string' && child.id === node.id))
      if (!parent) break
      types.push(parent.type)
      expect(Number(parent.style.flex) > 0 || parent.style.height !== undefined).toBe(true)
      node = parent
    }
    expect(types).not.toContain('ScrollView')
    expect(phone.byTestID('main')!.type).toBe('View')
    expect(phone.texts()).toContain('Rappid')
  })
})
