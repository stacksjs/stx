/**
 * A style tag NAMED inside a component's script is not a style element.
 *
 * The component's stylesheet was located with a plain regex over the raw
 * source, which still contains `<script server>`. So a style tag written in a
 * comment - or in a string - was read as the start of the stylesheet, and
 * everything from there to the real closing tag became "the style block":
 * the rest of the comment, the rest of the server script, and the whole
 * template. That span was preserved verbatim and re-emitted, so the page got
 * the component rendered correctly AND its own source printed after it as
 * visible text, including the raw closing script tag and a second
 * uninterpolated copy of the template.
 *
 * Silent, and disproportionate to its cause: the trigger is a comment, so
 * nothing about the edit that breaks it looks like it touches rendering. It was
 * found by writing a comment that explained how style blocks work
 * (stacksjs/stx#2005, while documenting #1982).
 *
 * Same shape as CLAUDE.md note 24 on `.replace('</body>', …)`: a tag-shaped
 * substring inside script content treated as an element.
 */

import { describe, expect, it } from 'bun:test'
import { renderTemplate } from '../src/render'

async function renderWithComponent(component: string, page: string): Promise<string> {
  const dir = `${import.meta.dir}/.tmp-style-${crypto.randomUUID()}`
  await Bun.write(`${dir}/components/Widget.stx`, component)
  await Bun.write(`${dir}/page.stx`, page)

  try {
    return await renderTemplate(`${dir}/page.stx`, { context: {} } as any)
  }
  finally {
    await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
  }
}

/*
 * The tag is assembled rather than written, so this file can be read and
 * edited without tripping the very bug it pins.
 */
const STYLE_OPEN = `<${'style'}>`

const WIDGET = `<script server>
// A component ${STYLE_OPEN} block is extracted before expressions run.
export const label = 'hello'
</script>

<p>{{ label }}</p>

<style>
p { color: red; }
</style>
`

describe('a style tag named in a component script is not the stylesheet', () => {
  it('does not leak the component source into the page', async () => {
    const html = await renderWithComponent(WIDGET, '<Widget />')

    // The tells, each of which was in the rendered page: the server script's
    // own declaration, its closing tag as text, and the comment's tail.
    expect(html).not.toContain('export const label')
    expect(html).not.toContain('&lt;/script&gt;')
    expect(html).not.toContain('block is extracted before expressions run')
  })

  it('still renders the template once, interpolated', async () => {
    const html = await renderWithComponent(WIDGET, '<Widget />')

    expect(html).toContain('<p>hello</p>')
    // The leaked copy was a second, uninterpolated <p>.
    expect(html.match(/<p>/g)?.length).toBe(1)
    expect(html).not.toContain('{{ label }}')
  })

  it('still extracts and preserves the real stylesheet', async () => {
    const html = await renderWithComponent(WIDGET, '<Widget />')

    expect(html).toContain('p { color: red; }')
  })

  /*
   * The same thing through the other door: a tag in a string rather than a
   * comment, which is what a component that emits markup from its script does.
   */
  it('is not fooled by a style tag in a script string either', async () => {
    const widget = `<script server>
export const marker = '${STYLE_OPEN}x</style>'
export const label = 'world'
</script>

<p>{{ label }}</p>

<style>
p { color: blue; }
</style>
`
    const html = await renderWithComponent(widget, '<Widget />')

    expect(html).toContain('<p>world</p>')
    expect(html).toContain('p { color: blue; }')
    expect(html).not.toContain('export const label')
  })
})
