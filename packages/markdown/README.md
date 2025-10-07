# @stacksjs/markdown

High-performance markdown parser and sanitizer built for Bun.

## Features

- GitHub Flavored Markdown (GFM) support
- Tables, task lists, strikethrough
- Header ID generation
- Syntax highlighting support
- HTML sanitization
- Frontmatter parsing (YAML, TOML, JSON)

## Installation

```bash
bun add @stacksjs/markdown
```

## Usage

### Basic Markdown Parsing

```typescript
import { parseMarkdown } from '@stacksjs/markdown'

const html = parseMarkdown('# Hello **world**')
// <h1 id="hello-world">Hello <strong>world</strong></h1>
```

### With Options

```typescript
const html = parseMarkdown(markdown, {
  gfm: true,              // GitHub Flavored Markdown (default: true)
  breaks: false,          // Convert \n to <br> (default: false)
  headerIds: true,        // Generate header IDs (default: true)
  headerPrefix: '',       // Prefix for header IDs (default: '')
  sanitize: false,        // Sanitize HTML output (default: false)
  highlight: (code, lang) => {
    // Custom syntax highlighting
    return highlightedCode
  }
})
```

### HTML Sanitization

```typescript
import { sanitizeHtml } from '@stacksjs/markdown'

const clean = sanitizeHtml(userInput, {
  allowedTags: ['p', 'strong', 'em', 'a', 'code'],
  allowedAttributes: {
    a: ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto']
})
```

### Frontmatter Parsing

```typescript
import { parseFrontmatter } from '@stacksjs/markdown'

const content = `---
title: My Post
date: 2024-01-01
---

# Content here`

const { data, content: markdown } = parseFrontmatter(content)
console.log(data.title) // 'My Post'
```

## Performance

Benchmark results against popular markdown parsers:

| Document Size | @stacksjs/markdown | markdown-it | marked | showdown |
|--------------|-------------------|-------------|---------|----------|
| Small (< 1KB) | 324B ops/sec | 112B ops/sec | 26B ops/sec | 14B ops/sec |
| Medium (~3KB) | 34.7B ops/sec | 17.7B ops/sec | 2.8B ops/sec | 2.8B ops/sec |
| Large (~50KB) | 1.81B ops/sec | 1.25B ops/sec | 16M ops/sec | 135M ops/sec |

**Performance vs markdown-it:**
- Small documents: 2.89x faster
- Medium documents: 1.96x faster
- Large documents: 1.45x faster

The parser uses a flat token stream architecture with position-based parsing for optimal performance.

## Architecture

The markdown parser is built with several key optimizations:

- **Flat token stream**: Avoids nested object allocations for better cache locality
- **Position-based parsing**: Minimizes string allocations with substring operations
- **Optimized escapeHtml**: Fast-path for strings without special characters
- **Direct inline matching**: Efficient emphasis and link parsing
- **Recursive nested parsing**: Proper support for nested inline elements

## API

### `parseMarkdown(markdown: string, options?: MarkdownOptions): string`

Parse markdown to HTML.

### `sanitizeHtml(html: string, options?: SanitizeOptions): string`

Sanitize HTML to prevent XSS attacks.

### `parseFrontmatter(content: string): { data: any, content: string }`

Extract and parse frontmatter from markdown content. Supports YAML, TOML, and JSON formats.

## License

MIT
