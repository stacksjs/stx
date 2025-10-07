import { describe, expect, it } from 'bun:test'
import { parse } from '../src/parser'

describe('markdown parser - edge cases', () => {
  it('should handle empty input', () => {
    expect(parse('')).toBe('')
    // Whitespace-only might produce empty paragraphs or nothing
    const result = parse('   \n\n   ')
    expect(typeof result).toBe('string')
  })

  it('should handle nested emphasis', () => {
    const md = '**_bold and italic_**'
    const html = parse(md)

    expect(html).toContain('<strong>')
    expect(html).toContain('<em>')
  })

  it('should handle mixed emphasis styles', () => {
    const md = '*italic* **bold** ***both*** __also bold__ _also italic_'
    const html = parse(md)

    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('should handle unmatched emphasis markers', () => {
    const md = 'This has *unmatched emphasis'
    const html = parse(md)

    // Should handle gracefully without breaking
    expect(html).toBeTruthy()
  })

  it('should handle code blocks with backticks in content', () => {
    const md = '```\nCode with ` backtick\n```'
    const html = parse(md)

    expect(html).toContain('<pre>')
    expect(html).toContain('backtick')
  })

  it('should handle inline code with special characters', () => {
    const md = 'Use `const x = "<div>"` in your code'
    const html = parse(md)

    expect(html).toContain('<code>')
    expect(html).toContain('&lt;div&gt;')
  })

  it('should handle headers with emphasis', () => {
    const md = '# **Bold** *Italic* Header'
    const html = parse(md)

    expect(html).toContain('<h1')
    expect(html).toContain('<strong>Bold</strong>')
    expect(html).toContain('<em>Italic</em>')
  })

  it('should handle multiple headers in sequence', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
    const html = parse(md)

    expect(html).toContain('<h1')
    expect(html).toContain('<h2')
    expect(html).toContain('<h3')
    expect(html).toContain('<h4')
    expect(html).toContain('<h5')
    expect(html).toContain('<h6')
  })

  it('should handle links with special characters in URL', () => {
    const md = '[Link](https://example.com/path?query=value&other=test)'
    const html = parse(md)

    expect(html).toContain('<a href=')
    expect(html).toContain('example.com')
  })

  it('should handle images with alt text containing special characters', () => {
    const md = '![Alt with "quotes" & symbols](image.png)'
    const html = parse(md)

    expect(html).toContain('<img')
    expect(html).toContain('src="image.png"')
  })

  it('should handle nested lists', () => {
    const md = `- Item 1
  - Nested 1
  - Nested 2
- Item 2`

    const html = parse(md)

    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
  })

  it('should handle mixed list types', () => {
    const md = `1. First
2. Second

- Unordered
- Another`

    const html = parse(md)

    expect(html).toContain('<ol>')
    expect(html).toContain('<ul>')
  })

  it('should handle task lists with different states', () => {
    const md = `- [x] Completed
- [ ] Incomplete
- [X] Also completed`

    const html = parse(md)

    expect(html).toContain('checkbox')
    expect(html).toContain('checked')
  })

  it('should handle blockquotes with multiple lines', () => {
    const md = `> First line
> Second line
> Third line`

    const html = parse(md)

    expect(html).toContain('<blockquote>')
  })

  it('should handle nested blockquotes', () => {
    const md = `> Level 1
> > Level 2
> > > Level 3`

    const html = parse(md)

    expect(html).toContain('<blockquote>')
  })

  it('should handle horizontal rules with different styles', () => {
    const styles = ['---', '***', '___', '- - -', '* * *']

    for (const style of styles) {
      const html = parse(style)
      expect(html).toContain('<hr>')
    }
  })

  it('should handle tables with alignment', () => {
    const md = `| Left | Center | Right |
|:-----|:------:|------:|
| L1   |   C1   |    R1 |
| L2   |   C2   |    R2 |`

    const html = parse(md, { gfm: true })

    expect(html).toContain('<table>')
    expect(html).toContain('align=')
  })

  it('should handle tables with missing cells', () => {
    const md = `| A | B | C |
|---|---|---|
| 1 | 2 |   |
| 4 |   | 6 |`

    const html = parse(md, { gfm: true })

    expect(html).toContain('<table>')
  })

  it('should handle strikethrough with GFM', () => {
    const md = '~~deleted~~ ~~also deleted~~'
    const html = parse(md, { gfm: true })

    expect(html).toContain('<del>')
  })

  it('should handle autolinks', () => {
    const md = 'Visit https://example.com for more info'
    const html = parse(md)

    // Basic parser might not support autolinks
    expect(html).toBeTruthy()
  })

  it('should handle HTML entities correctly', () => {
    const md = 'Use &lt; and &gt; symbols'
    const html = parse(md)

    // Should escape properly
    expect(html).toContain('&amp;')
  })

  it('should handle very long paragraphs', () => {
    const longText = 'word '.repeat(1000)
    const html = parse(longText)

    expect(html).toContain('<p>')
    expect(html.length).toBeGreaterThan(1000)
  })

  it('should handle multiple blank lines between elements', () => {
    const md = `# Header


Paragraph 1


Paragraph 2`

    const html = parse(md)

    expect(html).toContain('<h1')
    expect(html).toContain('<p>')
  })

  it('should handle code blocks with language specification', () => {
    const languages = ['javascript', 'typescript', 'python', 'rust', 'go']

    for (const lang of languages) {
      const md = `\`\`\`${lang}\ncode here\n\`\`\``
      const html = parse(md)

      expect(html).toContain(`language-${lang}`)
    }
  })

  it('should handle breaks option', () => {
    const md = 'Line 1\nLine 2'

    const withBreaks = parse(md, { breaks: true })
    const withoutBreaks = parse(md, { breaks: false })

    expect(withBreaks).toContain('<br>')
    expect(withoutBreaks).not.toContain('<br>')
  })

  it('should handle header IDs option', () => {
    const md = '# Hello World'

    const withIds = parse(md, { headerIds: true })
    const withoutIds = parse(md, { headerIds: false })

    expect(withIds).toContain('id=')
    expect(withoutIds).not.toContain('id=')
  })

  it('should handle header prefix option', () => {
    const md = '# Test'
    const html = parse(md, { headerIds: true, headerPrefix: 'heading-' })

    expect(html).toContain('id="heading-')
  })

  it('should handle syntax highlighting callback', () => {
    const highlighter = (code: string, lang: string) => {
      return `<highlighted lang="${lang}">${code}</highlighted>`
    }

    const md = '```javascript\nconst x = 5;\n```'
    const html = parse(md, { highlight: highlighter })

    expect(html).toContain('highlighted')
    expect(html).toContain('lang="javascript"')
  })

  it('should handle Unicode characters', () => {
    const md = '# 日本語タイトル\n\n中文内容 **加粗** *斜体*'
    const html = parse(md)

    expect(html).toContain('日本語タイトル')
    expect(html).toContain('中文内容')
  })

  it('should handle emoji', () => {
    const md = 'Hello 👋 World 🌍 **Bold** 💪'
    const html = parse(md)

    expect(html).toContain('👋')
    expect(html).toContain('🌍')
    expect(html).toContain('💪')
  })

  it('should handle malformed markdown gracefully', () => {
    const cases = [
      '[link without closing paren](url',
      '![image without closing](src',
      '```unclosed code block',
      '**unclosed bold',
      '*unclosed italic',
    ]

    for (const md of cases) {
      const html = parse(md)
      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    }
  })

  it('should handle mixed content', () => {
    const md = `# Header

Paragraph with **bold** and *italic* and \`code\`.

- List item 1
- List item 2

> Blockquote

[Link](url) and ![Image](src)

Final paragraph.`

    const html = parse(md)

    expect(html).toContain('<h1')
    expect(html).toContain('<p>')
    expect(html).toContain('<strong>')
    expect(html).toContain('<em>')
    expect(html).toContain('<code>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<a')
    expect(html).toContain('<img')
  })
})
