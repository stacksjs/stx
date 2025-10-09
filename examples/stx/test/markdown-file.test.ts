import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// Setup test directories
const TEST_DIR = import.meta.dir
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures', 'markdown')
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

describe('Markdown File Execution (@markdown-file directive)', () => {
  // Set up test environment
  beforeAll(async () => {
    await fs.promises.mkdir(FIXTURES_DIR, { recursive: true })
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Create test markdown file with frontmatter
    await Bun.write(path.join(FIXTURES_DIR, 'basic.md'), `---
title: "Basic Markdown Test"
author: "stx Team"
date: 2025-10-08
---

# Basic Markdown Content

This is a **bold** statement and this is *italic*.

## Code Block

\`\`\`javascript
function hello() {
  return "Hello from Markdown!";
}
\`\`\`

> This is a blockquote.

- List item 1
- List item 2
- List item 3
`)

    // Create markdown file with variables
    await Bun.write(path.join(FIXTURES_DIR, 'with-variables.md'), `---
title: "Variable Test"
defaultName: "World"
---

# Hello {{ userName }}!

Welcome to {{ siteName }}.

Your role is: {{ userRole }}
`)

    // Create markdown file with syntax highlighting
    await Bun.write(path.join(FIXTURES_DIR, 'code-highlight.md'), `---
title: "Code Highlighting Test"
---

# Code Syntax Examples

TypeScript example:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

JavaScript example:

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);
\`\`\`

HTML example:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Example</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
\`\`\`
`)

    // Create markdown file with complex content
    await Bun.write(path.join(FIXTURES_DIR, 'complex.md'), `---
title: "Complex Markdown"
category: "Tutorial"
tags: ["stx", "markdown", "testing"]
---

# Complex Markdown Document

## Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Tables  | ✓       | Full  |
| Lists   | ✓       | Full  |
| Code    | ✓       | Highlighted |

## Links and Images

[Visit stx](https://github.com/stacksjs/stx)

![Example](https://via.placeholder.com/150)

## Nested Content

1. First item
   - Nested bullet
   - Another nested
2. Second item
   \`\`\`js
   const nested = true;
   \`\`\`
3. Third item

## Inline Code

Use the \`@markdown-file\` directive to include markdown files.
`)

    // Create stx template that uses @markdown-file
    await Bun.write(path.join(TEMPLATE_DIR, 'markdown-include.stx'), `<!DOCTYPE html>
<html>
<head>
  <title>Markdown File Test</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    code {
      background: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>Testing @markdown-file Directive</h1>

  <section id="basic-markdown">
    @markdown-file('${FIXTURES_DIR}/basic.md')
  </section>
</body>
</html>
`)

    // Create stx template with variables
    await Bun.write(path.join(TEMPLATE_DIR, 'markdown-with-vars.stx'), `<!DOCTYPE html>
<html>
<head>
  <title>Markdown Variables Test</title>
  <script>
    module.exports = {
      userName: "Alice",
      siteName: "stx Demo",
      userRole: "Developer"
    };
  </script>
</head>
<body>
  @markdown-file('${FIXTURES_DIR}/with-variables.md')
</body>
</html>
`)

    // Create stx template with additional context
    await Bun.write(path.join(TEMPLATE_DIR, 'markdown-context.stx'), `<!DOCTYPE html>
<html>
<head>
  <title>Markdown Context Test</title>
</head>
<body>
  @markdown-file('${FIXTURES_DIR}/with-variables.md', {userName: "Bob", siteName: "Test Site", userRole: "Admin"})
</body>
</html>
`)
  })

  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(FIXTURES_DIR, { recursive: true, force: true })
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
      await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should include and render basic markdown file', async () => {
    const template = path.join(TEMPLATE_DIR, 'markdown-include.stx')

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    expect(htmlOutput).toBeDefined()

    const content = await Bun.file(htmlOutput!.path).text()

    // Verify markdown was rendered to HTML
    expect(content).toContain('Basic Markdown Content')
    expect(content).toContain('<strong>bold</strong>')
    expect(content).toContain('<em>italic</em>')
    expect(content).toContain('Code Block')
    expect(content).toContain('<blockquote>')
    expect(content).toContain('<li>List item 1</li>')
    expect(content).toContain('<li>List item 2</li>')
    expect(content).toContain('<li>List item 3</li>')
  })

  test('should process markdown with code syntax highlighting', async () => {
    const template = path.join(TEMPLATE_DIR, 'code-highlight.stx')

    await Bun.write(template, `<!DOCTYPE html>
<html>
<head><title>Code Test</title></head>
<body>
  @markdown-file('${FIXTURES_DIR}/code-highlight.md')
</body>
</html>
`)

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify code blocks are present
    expect(content).toContain('TypeScript example')
    expect(content).toContain('JavaScript example')
    expect(content).toContain('HTML example')

    // Verify code content is included (code is highlighted with Shiki, so check for keywords)
    expect(content).toContain('User')
    expect(content).toContain('greetUser')
    expect(content).toContain('numbers')
  })

  test('should substitute variables from context in markdown', async () => {
    const template = path.join(TEMPLATE_DIR, 'markdown-with-vars.stx')

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify variables were substituted
    expect(content).toContain('Hello Alice!')
    expect(content).toContain('Welcome to stx Demo.')
    expect(content).toContain('Your role is: Developer')

    // Verify template syntax was replaced
    expect(content).not.toContain('{{ userName }}')
    expect(content).not.toContain('{{ siteName }}')
    expect(content).not.toContain('{{ userRole }}')
  })

  test('should use additional context passed to @markdown-file', async () => {
    const template = path.join(TEMPLATE_DIR, 'markdown-context.stx')

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify additional context was used
    expect(content).toContain('Hello Bob!')
    expect(content).toContain('Welcome to Test Site.')
    expect(content).toContain('Your role is: Admin')
  })

  test('should handle complex markdown with tables, links, and nested content', async () => {
    const template = path.join(TEMPLATE_DIR, 'complex.stx')

    await Bun.write(template, `<!DOCTYPE html>
<html>
<head><title>Complex Test</title></head>
<body>
  @markdown-file('${FIXTURES_DIR}/complex.md')
</body>
</html>
`)

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify table rendering
    expect(content).toContain('<table>')
    expect(content).toContain('<th>Feature</th>')
    expect(content).toContain('<th>Support</th>')
    expect(content).toContain('<td>Tables</td>')

    // Verify links
    expect(content).toContain('<a href="https://github.com/stacksjs/stx">')
    expect(content).toContain('Visit stx')

    // Verify images
    expect(content).toContain('<img')
    expect(content).toContain('src="https://via.placeholder.com/150"')

    // Verify nested lists
    expect(content).toContain('<ol>')
    expect(content).toContain('First item')
    expect(content).toContain('Nested bullet')

    // Verify inline code
    expect(content).toContain('<code>@markdown-file</code>')
  })

  test('should handle relative paths in @markdown-file directive', async () => {
    // Create a subdirectory for this test
    const subDir = path.join(TEMPLATE_DIR, 'subdir')
    await fs.promises.mkdir(subDir, { recursive: true })

    const template = path.join(subDir, 'relative.stx')
    const relativeMd = path.join(subDir, 'local.md')

    await Bun.write(relativeMd, `---
title: "Relative Path Test"
---

# Content from Relative Path

This markdown file was included using a relative path.
`)

    await Bun.write(template, `<!DOCTYPE html>
<html>
<head><title>Relative Path Test</title></head>
<body>
  @markdown-file('./local.md')
</body>
</html>
`)

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    expect(content).toContain('Content from Relative Path')
    expect(content).toContain('This markdown file was included using a relative path.')
  })

  test('should handle markdown file with frontmatter data accessible in context', async () => {
    const template = path.join(TEMPLATE_DIR, 'frontmatter.stx')
    const mdFile = path.join(FIXTURES_DIR, 'frontmatter-test.md')

    await Bun.write(mdFile, `---
title: "Frontmatter Title"
author: "John Doe"
publishDate: "2025-10-08"
tags: ["markdown", "stx", "frontmatter"]
---

# {{ title }}

Written by {{ author }} on {{ publishDate }}
`)

    await Bun.write(template, `<!DOCTYPE html>
<html>
<head><title>Frontmatter Test</title></head>
<body>
  @markdown-file('${mdFile}')
</body>
</html>
`)

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Frontmatter data should be accessible as variables
    expect(content).toContain('Frontmatter Title')
    expect(content).toContain('Written by John Doe on 2025-10-08')
  })

  test('should handle error when markdown file does not exist', async () => {
    const template = path.join(TEMPLATE_DIR, 'missing-file.stx')

    await Bun.write(template, `<!DOCTYPE html>
<html>
<head><title>Missing File Test</title></head>
<body>
  @markdown-file('${FIXTURES_DIR}/nonexistent.md')
</body>
</html>
`)

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Should contain error message
    expect(content).toContain('Error')
  })

  test('should handle multiple markdown file inclusions in same template', async () => {
    const template = path.join(TEMPLATE_DIR, 'multiple.stx')

    await Bun.write(template, `<!DOCTYPE html>
<html>
<head><title>Multiple Includes</title></head>
<body>
  <section id="first">
    @markdown-file('${FIXTURES_DIR}/basic.md')
  </section>

  <section id="second">
    @markdown-file('${FIXTURES_DIR}/complex.md')
  </section>

  <section id="third">
    @markdown-file('${FIXTURES_DIR}/code-highlight.md')
  </section>
</body>
</html>
`)

    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify all three markdown files were included
    expect(content).toContain('Basic Markdown Content')
    expect(content).toContain('Complex Markdown Document')
    expect(content).toContain('Code Syntax Examples')

    // Verify sections are present
    expect(content).toContain('id="first"')
    expect(content).toContain('id="second"')
    expect(content).toContain('id="third"')
  })
})
