import { describe, expect, it } from 'bun:test'
import { parse } from '../src/parser'

describe('markdown parser', () => {
  it('should parse headings', () => {
    const md = '# Heading 1\n## Heading 2\n### Heading 3'
    const html = parse(md)

    expect(html).toContain('<h1')
    expect(html).toContain('Heading 1')
    expect(html).toContain('<h2')
    expect(html).toContain('Heading 2')
    expect(html).toContain('<h3')
    expect(html).toContain('Heading 3')
  })

  it('should parse paragraphs', () => {
    const md = 'This is a paragraph.\n\nThis is another paragraph.'
    const html = parse(md)

    expect(html).toContain('<p>')
    expect(html).toContain('This is a paragraph.')
    expect(html).toContain('This is another paragraph.')
  })

  it('should parse bold text', () => {
    const md = 'This is **bold** text'
    const html = parse(md)

    expect(html).toContain('<strong>bold</strong>')
  })

  it('should parse italic text', () => {
    const md = 'This is *italic* text'
    const html = parse(md)

    expect(html).toContain('<em>italic</em>')
  })

  it('should parse inline code', () => {
    const md = 'This is `code` inline'
    const html = parse(md)

    expect(html).toContain('<code>code</code>')
  })

  it('should parse code blocks', () => {
    const md = '```javascript\nconst x = 5;\n```'
    const html = parse(md)

    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('language-javascript')
    expect(html).toContain('const x = 5;')
  })

  it('should parse links', () => {
    const md = '[Google](https://google.com)'
    const html = parse(md)

    expect(html).toContain('<a href="https://google.com">')
    expect(html).toContain('Google')
    expect(html).toContain('</a>')
  })

  it('should parse images', () => {
    const md = '![Alt text](image.png)'
    const html = parse(md)

    expect(html).toContain('<img')
    expect(html).toContain('src="image.png"')
    expect(html).toContain('alt="Alt text"')
  })

  it('should parse unordered lists', () => {
    const md = '- Item 1\n- Item 2\n- Item 3'
    const html = parse(md)

    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
    expect(html).toContain('Item 1')
    expect(html).toContain('Item 2')
    expect(html).toContain('Item 3')
  })

  it('should parse ordered lists', () => {
    const md = '1. First\n2. Second\n3. Third'
    const html = parse(md)

    expect(html).toContain('<ol>')
    expect(html).toContain('<li>')
    expect(html).toContain('First')
    expect(html).toContain('Second')
  })

  it('should parse blockquotes', () => {
    const md = '> This is a quote'
    const html = parse(md)

    expect(html).toContain('<blockquote>')
    expect(html).toContain('This is a quote')
  })

  it('should parse horizontal rules', () => {
    const md = '---'
    const html = parse(md)

    expect(html).toContain('<hr>')
  })

  it('should parse tables with GFM', () => {
    const md = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`

    const html = parse(md, { gfm: true })

    expect(html).toContain('<table>')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
    expect(html).toContain('Header 1')
    expect(html).toContain('Cell 1')
  })

  it('should parse strikethrough with GFM', () => {
    const md = '~~deleted text~~'
    const html = parse(md, { gfm: true })

    expect(html).toContain('<del>deleted text</del>')
  })

  it('should parse task lists', () => {
    const md = '- [x] Completed task\n- [ ] Incomplete task'
    const html = parse(md)

    expect(html).toContain('checkbox')
    expect(html).toContain('checked')
  })

  it('should generate header IDs', () => {
    const md = '# Hello World'
    const html = parse(md, { headerIds: true })

    expect(html).toContain('id="hello-world"')
  })

  it('should escape HTML entities', () => {
    const md = 'Text with <script> and & characters'
    const html = parse(md)

    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
  })
})
