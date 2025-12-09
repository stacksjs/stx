import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import plugin from '../src/index'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-markdown')
const OUTPUT_DIR = path.join(TEMP_DIR, 'dist')

describe('BUN-PLUGIN: Markdown File Processing', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should load and process basic markdown files', async () => {
    const testFile = path.join(TEMP_DIR, 'basic.md')
    await Bun.write(testFile, `# Hello World

This is a basic markdown file.

## Features

- Easy to write
- Converts to HTML
- Supports frontmatter
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    expect(result.outputs).toHaveLength(1)
  })

  test('should process markdown with frontmatter', async () => {
    const testFile = path.join(TEMP_DIR, 'frontmatter.md')
    await Bun.write(testFile, `---
title: "Test Page"
description: "A test page with frontmatter"
author: "Test Author"
date: "2023-01-01"
tags: ["test", "markdown"]
---

# {{ title }}

Written by: {{ author }}

{{ description }}

## Tags

{{ tags.join(', ') }}
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    // Check if the module exports both content and data
    expect(content).toMatch(/var content = /)
    expect(content).toMatch(/var data = /)
    expect(content).toMatch(/content/)
    expect(content).toMatch(/data/)
  })

  test('should handle markdown with code blocks', async () => {
    const testFile = path.join(TEMP_DIR, 'code.md')
    await Bun.write(testFile, `# Code Examples

Here's some JavaScript:

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

And some TypeScript:

\`\`\`typescript
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'John',
  age: 30
};
\`\`\`
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    expect(content).toContain('Code Examples')
    expect(content).toContain('hello') // function name will be highlighted
    expect(content).toContain('User') // interface name will be highlighted
  })

  test('should process markdown content and create ESM exports', async () => {
    const testFile = path.join(TEMP_DIR, 'export.md')
    await Bun.write(testFile, `---
layout: "blog"
published: true
---

# Blog Post

This is a blog post content.
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    // Should export content as HTML string
    expect(content).toMatch(/var content = .*<h1.*>Blog Post.*<\/h1>/)

    // Should export frontmatter data
    expect(content).toMatch(/var data = .*layout: "blog".*published: true/)

    // Should have default export
    expect(content).toContain('content')
  })

  test('should handle markdown files without frontmatter', async () => {
    const testFile = path.join(TEMP_DIR, 'no-frontmatter.md')
    await Bun.write(testFile, `# Simple Markdown

Just plain markdown content without any frontmatter.

## List

1. Item one
2. Item two
3. Item three
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    // Should still export content and empty data
    expect(content).toMatch(/var content = /)
    expect(content).toMatch(/var data = \{\}/)
  })

  test('should handle malformed markdown gracefully', async () => {
    const testFile = path.join(TEMP_DIR, 'malformed.md')
    await Bun.write(testFile, `---
title: "Malformed"
# This is invalid YAML frontmatter
invalid: yaml: content
---

# Malformed Markdown

This markdown has invalid frontmatter.
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    // Should gracefully handle malformed frontmatter by processing markdown content
    expect(content).toMatch(/var content = /)
    // Malformed frontmatter may be parsed partially or result in empty object
    expect(content).toMatch(/var data = /)
    expect(content).toContain('Malformed Markdown')
  })

  test('should preserve markdown formatting in HTML', async () => {
    const testFile = path.join(TEMP_DIR, 'formatting.md')
    await Bun.write(testFile, `# Main Title

## Subtitle

This is **bold text** and this is *italic text*.

Here's a [link](https://example.com) and some \`inline code\`.

> This is a blockquote
> with multiple lines.

- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item 1
2. Ordered list item 2
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    // Check for proper HTML conversion (headings may have id attributes)
    expect(content).toMatch(/<h1[^>]*>Main Title<\/h1>/)
    expect(content).toMatch(/<h2[^>]*>Subtitle<\/h2>/)
    expect(content).toContain('<strong>bold text</strong>')
    expect(content).toContain('<em>italic text</em>')
    expect(content).toContain('<a href="https://example.com">link</a>')
    expect(content).toContain('<code>inline code</code>')
    expect(content).toContain('<blockquote>')
    expect(content).toContain('<ul>')
    expect(content).toContain('<ol>')
  })

  test('should handle empty markdown files', async () => {
    const testFile = path.join(TEMP_DIR, 'empty.md')
    await Bun.write(testFile, '')

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    expect(content).toMatch(/var content = ""/)
    expect(content).toMatch(/var data = \{\}/)
  })

  test('should handle markdown with complex frontmatter data types', async () => {
    const testFile = path.join(TEMP_DIR, 'complex-frontmatter.md')
    await Bun.write(testFile, `---
title: "Complex Data"
tags: 
  - javascript
  - typescript
  - markdown
author:
  name: "John Doe"
  email: "john@example.com"
meta:
  published: true
  rating: 4.5
  views: 1250
---

# {{ title }}

Author: {{ author.name }} ({{ author.email }})

Tags: {{ tags.join(', ') }}

Rating: {{ meta.rating }}/5
Views: {{ meta.views }}
`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const output = result.outputs[0]
    const content = await Bun.file(output.path).text()

    // Check that frontmatter data is processed (structure may vary based on parser)
    expect(content).toContain('var data = ')
    expect(content).toContain('title:')
    // Nested structures may be flattened or preserved depending on the YAML parser
    expect(content).toContain('John Doe')
    expect(content).toContain('rating')
  })
})
