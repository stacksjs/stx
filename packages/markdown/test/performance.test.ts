import { describe, expect, it } from 'bun:test'
import { parseFrontmatter, parseMarkdown, parseMarkdownWithFrontmatter } from '../src'
import { parse as parseYaml, stringify as stringifyYaml } from '../src/yaml'

describe('markdown package - performance', () => {
  it('should parse large YAML efficiently', () => {
    const data: any = {}
    for (let i = 0; i < 1000; i++) {
      data[`key${i}`] = `value${i}`
    }

    const yaml = stringifyYaml(data)
    const start = performance.now()
    const result = parseYaml(yaml)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100) // Should complete in less than 100ms
    expect(Object.keys(result).length).toBe(1000)
  })

  it('should parse large arrays efficiently', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `  - item${i}`)
    const yaml = `items:\n${items.join('\n')}`

    const start = performance.now()
    const result = parseYaml(yaml)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
    expect(result.items).toHaveLength(1000)
  })

  it('should parse deeply nested YAML efficiently', () => {
    let yaml = 'level0:\n'
    for (let i = 1; i < 20; i++) {
      yaml += `${`  `.repeat(i)}level${i}:\n`
    }
    yaml += `${`  `.repeat(20)}value: deep`

    const start = performance.now()
    const result = parseYaml(yaml)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
    expect(result).toBeTruthy()
  })

  it('should parse large markdown document efficiently', () => {
    const sections = Array.from({ length: 100 }, (_, i) => `
## Section ${i}

This is paragraph ${i} with some **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const x = ${i};
console.log(x);
\`\`\`

> This is a blockquote for section ${i}

`).join('\n')

    const start = performance.now()
    const result = parseMarkdown(sections)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(300) // Should complete in less than 300ms
    expect(result).toContain('<h2')
    expect(result.length).toBeGreaterThan(1000)
  })

  it('should handle repeated parsing efficiently', () => {
    const md = '# Header\n\nParagraph with **bold** and *italic* text.\n\n- Item 1\n- Item 2'

    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      parseMarkdown(md)
    }
    const duration = performance.now() - start

    expect(duration).toBeLessThan(500) // 1000 parses in less than 500ms
  })

  it('should parse frontmatter efficiently', () => {
    const frontmatter = Array.from({ length: 100 }, (_, i) => `field${i}: value${i}`).join('\n')
    const content = `---\n${frontmatter}\n---\n\n# Content`

    const start = performance.now()
    const result = parseFrontmatter(content)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
    expect(Object.keys(result.data).length).toBe(100)
  })

  it('should parse markdown with frontmatter efficiently', () => {
    const content = `---
title: Performance Test
author: Test Author
tags:
  - performance
  - test
  - benchmark
---

# ${Array.from({ length: 50 }, (_, i) => `Section ${i}`).join('\n\n## ')}

`

    const start = performance.now()
    const result = parseMarkdownWithFrontmatter(content)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result.data.title).toBe('Performance Test')
  })

  it('should handle large code blocks efficiently', () => {
    const code = Array.from({ length: 1000 }, (_, i) => `const var${i} = ${i};`).join('\n')
    const md = `\`\`\`javascript\n${code}\n\`\`\``

    const start = performance.now()
    const result = parseMarkdown(md)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
    expect(result).toContain('<pre>')
  })

  it('should handle large tables efficiently', () => {
    const headers = Array.from({ length: 20 }, (_, i) => `Col${i}`).join(' | ')
    const separator = Array.from({ length: 20 }, () => '---').join('|')
    const rows = Array.from({ length: 100 }, (_, i) =>
      Array.from({ length: 20 }, (__, j) => `${i}-${j}`).join(' | '))

    const md = `| ${headers} |\n|${separator}|\n${rows.map(r => `| ${r} |`).join('\n')}`

    const start = performance.now()
    const result = parseMarkdown(md, { gfm: true })
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result).toContain('<table>')
  })

  it('should handle many inline elements efficiently', () => {
    const md = Array.from({ length: 100 }, (_, i) =>
      `**Bold ${i}** *Italic ${i}* \`Code ${i}\` [Link ${i}](url${i})`).join(' ')

    const start = performance.now()
    const result = parseMarkdown(md)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
  })

  it('should handle mixed content stress test', () => {
    const md = `
# Main Title

${Array.from({ length: 50 }, (_, i) => `
## Section ${i}

Paragraph with **bold**, *italic*, and \`code\`.

- List item 1
- List item 2
- List item 3

> Blockquote for section ${i}

| Col1 | Col2 | Col3 |
|------|------|------|
| A${i} | B${i} | C${i} |

\`\`\`javascript
console.log(${i});
\`\`\`
`).join('\n')}
`

    const start = performance.now()
    const result = parseMarkdown(md, { gfm: true })
    const duration = performance.now() - start

    // Complex document should still be fast
    expect(duration).toBeLessThan(500)
    expect(result).toContain('<h1')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should stringify large YAML efficiently', () => {
    const obj: any = {}
    for (let i = 0; i < 500; i++) {
      obj[`key${i}`] = {
        name: `Name ${i}`,
        value: i,
        active: i % 2 === 0,
      }
    }

    const start = performance.now()
    const yaml = stringifyYaml(obj)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(yaml.length).toBeGreaterThan(0)
  })

  it('should handle memory efficiently with large documents', () => {
    const initialMemory = process.memoryUsage().heapUsed

    // Parse multiple large documents
    for (let i = 0; i < 10; i++) {
      const md = Array.from({ length: 100 }, (_, j) => `
## Section ${i}-${j}
Content with **bold** and *italic*.
\`\`\`javascript
const x = ${j};
\`\`\`
`).join('\n')

      parseMarkdown(md)
    }

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
  })

  it('should be faster than sequential processing', () => {
    const documents = Array.from({ length: 100 }, (_, i) => `# Document ${i}\n\nContent ${i}`)

    const start = performance.now()
    documents.forEach(doc => parseMarkdown(doc))
    const duration = performance.now() - start

    // Should process 100 simple documents quickly
    expect(duration).toBeLessThan(200)
  })

  it('should handle Unicode efficiently', () => {
    const md = Array.from({ length: 100 }, (_, i) => `
## 标题 ${i}

内容 **加粗** *斜体* 🎉

- 列表 1
- 列表 2
`).join('\n')

    const start = performance.now()
    const result = parseMarkdown(md)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).toContain('标题')
  })
})
