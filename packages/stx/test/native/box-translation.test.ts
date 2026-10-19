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
