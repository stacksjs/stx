---
title: Getting Started with stx Markdown
author: stx Team
date: 2023-09-15
description: Learn how to use Markdown files with frontmatter in stx
tags: [markdown, stx, frontmatter, tutorial]
featured: true
---

# Getting Started with stx Markdown

stx now includes first-class support for Markdown files with frontmatter. This powerful feature allows you to:

- Separate content from presentation
- Use Markdown for content-heavy pages
- Store metadata in frontmatter
- Import Markdown directly or use with directives

## How It Works

When you use a Markdown file in stx, the system:

1. Parses the frontmatter using `gray-matter`
2. Converts the Markdown content to HTML using `marked`
3. Makes both the HTML content and frontmatter data available to your templates

## Code Example

Here's an example of how you might use a Markdown file in your stx template:

```html
<div class="article">
  <header>
    <h1>{{ title }}</h1>
    <p class="meta">By {{ author }} on {{ date }}</p>
  </header>

  <div class="content">
    @markdown-file('content/my-article.md')
  </div>

  <footer>
    <div class="tags">
      @foreach(tags as tag)
        <span class="tag">{{ tag }}</span>
      @endforeach
    </div>
  </footer>
</div>
```

## Dynamic Content

Your Markdown content can include expressions that will be evaluated when rendered:

```
This article is part of the {{ seriesName }} series.
```

This allows for dynamic content while maintaining the simplicity of Markdown authoring.
