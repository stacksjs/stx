# Using Markdown Files in STX

STX now supports Markdown files with frontmatter! This document explains how to use this feature.

## Frontmatter Support

Markdown files can include YAML frontmatter at the top of the file, enclosed in triple dashes:

```markdown
---
title: My Document
author: Jane Doe
date: 2023-05-15
tags: [markdown, stx, documentation]
draft: false
---

# My Document

This is the content of my document.
```

## Ways to Use Markdown in STX

There are two primary ways to use Markdown in your STX templates:

### 1. Direct Imports

You can import `.md` files directly in your JavaScript/TypeScript code:

```javascript
import content, { data } from './my-document.md'

console.log(data.title) // "My Document"
console.log(data.tags) // ["markdown", "stx", "documentation"]

// content will be the rendered HTML of the markdown
```

### 2. Using the @markdown-file Directive

You can include Markdown files directly in your STX templates using the `@markdown-file` directive:

```html
<div class="article">
  <h1>{{ title }}</h1>
  @markdown-file('path/to/my-document.md')
</div>
```

You can also pass additional context to the Markdown file:

```html
<div class="article">
  @markdown-file('path/to/my-document.md', { highlightColor: 'blue' })
</div>
```

## Accessing Frontmatter Data

When using the `@markdown-file` directive, frontmatter data becomes available in the template context. You can reference it using expression syntax:

```html
<div class="article">
  <h1>{{ title }}</h1>
  <p>By {{ author }} on {{ date }}</p>

  @markdown-file('path/to/my-document.md')

  <div class="tags">
    @foreach(tags as tag)
      <span class="tag">{{ tag }}</span>
    @endforeach
  </div>
</div>
```

## Variable Interpolation

You can use variables from your STX context within your Markdown content. These will be replaced when the Markdown is rendered:

```markdown
---
title: Welcome to {{ siteName }}
---

# Welcome to {{ siteName }}

This is a site about {{ topic }}.
```

## Best Practices

1. Use Markdown for content-heavy pages where rich formatting is needed
2. Keep presentation logic in your STX templates
3. Use frontmatter for metadata about the content
4. Consider organizing Markdown files in a `content` directory

## TypeScript Support

STX includes TypeScript type definitions for Markdown files. Your IDE will provide autocompletion and type checking when importing Markdown files:

```typescript
import content, { data } from './my-document.md'

// data is typed according to the frontmatter
console.log(data.title) // TypeScript knows this is a string
console.log(data.draft) // TypeScript knows this is a boolean
```