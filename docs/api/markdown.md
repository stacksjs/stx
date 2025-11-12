# Markdown API Reference

This document covers the `@stacksjs/ts-markdown` package - a fast, Bun-native markdown parser with frontmatter support.

## Overview

`@stacksjs/ts-markdown` is a high-performance markdown parser built specifically for Bun, providing:

- **Fast Markdown Parsing**: 1.45-2.89x faster than markdown-it
- **Frontmatter Support**: YAML, TOML, and JSON frontmatter parsing
- **GitHub Flavored Markdown (GFM)**: Tables, task lists, strikethrough, and more
- **Syntax Highlighting**: Server-side code highlighting with Shiki
- **Native YAML**: Bun's native YAML parser (1.5-2.7x faster than js-yaml)
- **Template Integration**: Built-in `@markdown-file` directive for STX templates

### Performance Highlights

- **2.89x faster** than markdown-it on small documents (< 1KB)
- **1.96x faster** on medium documents (~3KB)
- **1.45x faster** on large documents (~50KB)
- Position-based parsing with flat token stream architecture

See [Benchmark Results](/guide/benchmarks#markdown-parsing-performance) for detailed performance comparisons.

---

## Installation

```bash
bun add @stacksjs/ts-markdown
```

Or use it directly in STX templates (already included in `@stacksjs/stx`).

---

## Markdown Parsing

### parseMarkdown()

Parse markdown to HTML.

```typescript
import { parseMarkdown } from '@stacksjs/ts-markdown'

const html = parseMarkdown('# Hello World\n\nThis is **bold** text.')
// Output: <h1 id="hello-world">Hello World</h1>\n<p>This is <strong>bold</strong> text.</p>

// With options
const html = parseMarkdown(markdown, {
  gfm: true,              // GitHub Flavored Markdown (default: true)
  breaks: false,          // Convert \n to <br> (default: false)
  headerIds: true,        // Generate header IDs (default: true)
  sanitize: false,        // Sanitize HTML (default: false)
  highlight: true,        // Enable syntax highlighting (default: false)
  highlightTheme: 'github-dark' // Shiki theme (default: 'github-dark')
})
```

### parseMarkdownSync()

Synchronous markdown parsing (for non-async contexts).

```typescript
import { parseMarkdownSync } from '@stacksjs/ts-markdown'

const html = parseMarkdownSync('# Sync Parsing\n\nThis is synchronous.')
```

---

## Frontmatter Parsing

### parseFrontmatter()

Extract and parse frontmatter from markdown.

```typescript
import { parseFrontmatter } from '@stacksjs/ts-markdown'

const markdown = `---
title: My Post
author: John Doe
tags: [typescript, bun]
---
# Content here
`

const { data, content } = parseFrontmatter(markdown)

console.log(data)
// { title: 'My Post', author: 'John Doe', tags: ['typescript', 'bun'] }

console.log(content)
// # Content here
```

### Supported Formats

**YAML (default)**:

```yaml
---
title: My Post
date: 2025-01-01
---
```

**TOML**:

```toml
+++
title = "My Post"
date = 2025-01-01
+++
```

**JSON**:

```json
;;;
{
  "title": "My Post",
  "date": "2025-01-01"
}
;;;
```

### parseMarkdownWithFrontmatter()

Parse both frontmatter and markdown content in one call.

```typescript
import { parseMarkdownWithFrontmatter } from '@stacksjs/ts-markdown'

const { data, content, html } = parseMarkdownWithFrontmatter(markdown)

console.log(data)    // Parsed frontmatter
console.log(content) // Raw markdown content
console.log(html)    // Rendered HTML
```

### stringifyFrontmatter()

Convert data back to frontmatter format.

```typescript
import { stringifyFrontmatter } from '@stacksjs/ts-markdown'

const frontmatter = stringifyFrontmatter({
  title: 'My Post',
  tags: ['typescript', 'bun']
})

console.log(frontmatter)
// ---
// title: My Post
// tags:
//   - typescript
//   - bun
// ---
```

---

## YAML Utilities

### parseYaml()

Parse YAML using Bun's native parser (1.5-2.7x faster than js-yaml).

```typescript
import { parseYaml } from '@stacksjs/ts-markdown'

const data = parseYaml(`
name: John Doe
age: 30
tags:
  - developer
  - bun
`)

console.log(data)
// { name: 'John Doe', age: 30, tags: ['developer', 'bun'] }
```

### stringifyYaml()

Convert data to YAML format.

```typescript
import { stringifyYaml } from '@stacksjs/ts-markdown'

const yaml = stringifyYaml({
  name: 'John Doe',
  age: 30,
  tags: ['developer', 'bun']
})

console.log(yaml)
// name: John Doe
// age: 30
// tags:
//   - developer
//   - bun
```

---

## STX Template Integration

stx provides powerful markdown processing features for templates:

- Include markdown files with the `@markdown-file` directive
- Parse YAML frontmatter from markdown files
- Apply server-side syntax highlighting with Shiki
- Substitute template variables in markdown content
- Cache markdown files for optimal performance

## @markdown-file Directive

The `@markdown-file` directive allows you to include and render markdown files within stx templates.

### Basic Usage

```stx
<!DOCTYPE html>
<html>
<body>
  @markdown-file('content.md')
</body>
</html>
```

### With Relative Paths

```stx
<!-- Relative to the current template -->
@markdown-file('./docs/intro.md')

<!-- Relative to a parent directory -->
@markdown-file('../shared/content.md')
```

### With Absolute Paths

```stx
@markdown-file('/path/to/markdown/file.md')
```

## Frontmatter Support

Markdown files can include YAML frontmatter that will be parsed and made available as template variables.

### Markdown File with Frontmatter

```markdown
---
title: "Getting Started with stx"
author: "stx Team"
date: 2025-10-08
tags: ["tutorial", "guide"]
---

# {{ title }}

Written by **{{ author }}** on {{ date }}

This is a comprehensive guide to getting started with stx templating.
```

### Using Frontmatter Data

The frontmatter data is automatically extracted and available for variable substitution:

```stx
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <meta name="author" content="{{ author }}">
</head>
<body>
  @markdown-file('guide.md')
</body>
</html>
```

## Variable Substitution

You can pass context variables to markdown files that will be substituted using `{{ variable }}` syntax.

### From Template Context

```stx
<script>
  module.exports = {
    userName: "Alice",
    siteName: "My Website",
    version: "1.0.0"
  };
</script>
<body>
  @markdown-file('welcome.md')
</body>
```

**welcome.md:**

```markdown
# Welcome to {{ siteName }}!

Hello {{ userName }}, you're using version {{ version }}.
```

### With Additional Context

Pass additional context directly to the directive:

```stx
@markdown-file('template.md', {
  userName: "Bob",
  role: "Admin",
  lastLogin: "2025-10-08"
})
```

**template.md:**

```markdown
---
title: "User Profile"
---

# {{ title }}

User: {{ userName }}
Role: {{ role }}
Last Login: {{ lastLogin }}
```

## Syntax Highlighting

stx uses [Shiki](https://shiki.matsu.io/) for server-side syntax highlighting of code blocks.

### Supported Languages

```markdown
# Code Examples

TypeScript:
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}
\`\`\`

JavaScript:
\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);
\`\`\`

HTML:
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
```

### Configuring Syntax Highlighting

```typescript
// stx.config.ts
export default {
  markdown: {
    syntaxHighlighting: {
      enabled: true,
      serverSide: true,
      defaultTheme: 'github-dark', // or 'github-light', 'nord', 'dracula', 'monokai'
      highlightUnknownLanguages: true
    }
  }
}
```

## Programmatic API

### readMarkdownFile()

Read and parse a markdown file with frontmatter.

```typescript
import { readMarkdownFile } from '@stacksjs/stx/assets'

const { content, data } = await readMarkdownFile(
  '/path/to/file.md',
  {
    cache: true,
    markdown: {
      syntaxHighlighting: {
        enabled: true,
        serverSide: true,
        defaultTheme: 'github-dark',
        highlightUnknownLanguages: true
      }
    }
  }
)

console.log(content) // Rendered HTML
console.log(data)    // Frontmatter data object
```

**Parameters:**

- `filePath` (string): Path to the markdown file
- `options` (StxOptions): Configuration options

**Returns:**

```typescript
{
  content: string,        // Rendered HTML content
  data: Record<string, any> // Frontmatter data
}
```

### processMarkdownFileDirectives()

Process all `@markdown-file` directives in a template.

```typescript
import { processMarkdownFileDirectives } from '@stacksjs/stx/assets'

const template = `
  <div>
    @markdown-file('content.md')
  </div>
`

const result = await processMarkdownFileDirectives(
  template,
  { userName: 'Alice' },
  '/path/to/template.stx',
  { cache: true }
)

console.log(result) // Template with markdown files included
```

**Parameters:**

- `template` (string): Template content
- `context` (Record<string, any>): Template context variables
- `filePath` (string): Path to the template file
- `options` (StxOptions): Configuration options

**Returns:** `Promise<string>` - Processed template with markdown files included

## Caching

stx includes a built-in caching system for markdown files to improve performance.

### Enabling Cache

```typescript
const { content, data } = await readMarkdownFile(
  'content.md',
  { cache: true }
)
```

### Cache Behavior

- Files are cached based on their modification time
- Cache is automatically invalidated when the file is modified
- Cache stores both content and frontmatter data
- Cache is stored in memory for the lifetime of the application

### Cache Management

```typescript
import { markdownCache } from '@stacksjs/stx/assets'

// Check if file is cached
const isCached = markdownCache.has('/path/to/file.md')

// Clear specific cache entry
markdownCache.delete('/path/to/file.md')

// Clear all cache
markdownCache.clear()

// Get cache size
const size = markdownCache.size
```

## Advanced Features

### Multiple Markdown Files

Include multiple markdown files in a single template:

```stx
<!DOCTYPE html>
<html>
<body>
  <header>
    @markdown-file('header.md')
  </header>

  <main>
    <section id="intro">
      @markdown-file('intro.md')
    </section>

    <section id="content">
      @markdown-file('main-content.md')
    </section>

    <section id="examples">
      @markdown-file('examples.md')
    </section>
  </main>

  <footer>
    @markdown-file('footer.md')
  </footer>
</body>
</html>
```

### Markdown with Components

Combine markdown with stx components:

```stx
<div class="documentation">
  @markdown-file('docs.md')

  <div class="interactive-demo">
    <my-demo-component />
  </div>

  @markdown-file('api-reference.md')
</div>
```

### Dynamic Markdown Paths

Use variables for dynamic markdown file paths:

```stx
<script>
  module.exports = {
    docFile: 'getting-started.md',
    locale: 'en'
  };
</script>
<body>
  @markdown-file(`docs/${locale}/${docFile}`)
</body>
```

## Markdown Features

stx supports GitHub Flavored Markdown (GFM) with the following features:

### Tables

```markdown
| Feature | Support | Notes |
|---------|---------|-------|
| Tables  | Yes     | Full  |
| Lists   | Yes     | Full  |
| Code    | Yes     | Highlighted |
```

### Task Lists

```markdown
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task
```

### Strikethrough

```markdown
~~This text is struck through~~
```

### Autolinks

```markdown
https://github.com/stacksjs/stx
```

### Footnotes

```markdown
Here's a sentence with a footnote[^1].

[^1]: This is the footnote.
```

## Error Handling

### Missing Files

When a markdown file doesn't exist:

```stx
@markdown-file('nonexistent.md')
<!-- Renders: [Error: Markdown file not found: nonexistent.md] -->
```

### Invalid Frontmatter

When frontmatter is malformed:

```markdown
---
title: "Valid"
invalid yaml here
---

Content
```

The file will still be processed, but frontmatter parsing will fail gracefully.

### Debug Mode

Enable debug mode to see detailed error messages:

```typescript
// stx.config.ts
export default {
  debug: true,
  markdown: {
    syntaxHighlighting: {
      enabled: true,
      serverSide: true
    }
  }
}
```

## Performance Tips

1. **Enable Caching**: Always enable caching in production for better performance
2. **Use Server-Side Highlighting**: Offload syntax highlighting to the server
3. **Optimize Images**: Use optimized images in markdown files
4. **Minimize Frontmatter**: Keep frontmatter data minimal and focused
5. **Cache at Edge**: Consider caching rendered output at the CDN edge

## Examples

### Blog Post Template

```stx
<!DOCTYPE html>
<html>
<head>
  <script>
    module.exports = {
      postSlug: 'my-first-post'
    };
  </script>
</head>
<body>
  <article class="blog-post">
    @markdown-file(`posts/${postSlug}.md`)
  </article>

  <aside>
    @markdown-file('sidebar.md')
  </aside>
</body>
</html>
```

**posts/my-first-post.md:**

```markdown
---
title: "My First Post"
date: "2025-10-08"
author: "John Doe"
tags: ["introduction", "blog"]
---

# {{ title }}

Published on {{ date }} by {{ author }}

This is my first blog post using stx!
```

### Documentation Site

```stx
<!DOCTYPE html>
<html>
<head>
  <title>Documentation</title>
  <script>
    module.exports = {
      section: 'getting-started',
      version: '1.0'
    };
  </script>
</head>
<body>
  <nav>
    @markdown-file('docs/navigation.md')
  </nav>

  <main>
    @markdown-file(`docs/${version}/${section}.md`, {
      version: version,
      lastUpdated: new Date().toLocaleDateString()
    })
  </main>
</body>
</html>
```

## See Also

- [Directives](/features/directives) - Overview of all stx directives
- [Template Syntax](/api/template-syntax) - stx template syntax reference
- [Configuration](/guide/config) - stx configuration options
- [Performance](/features/performance) - Performance optimization guide
