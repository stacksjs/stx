---
title: "Quick Start"
description: "Build your first stx application"
---

# Quick Start

Learn the basics of stx by building a simple documentation site.

## Your First Template

Create a file called `index.stx`:

```stx
<script>
  module.exports = {
    title: "My Documentation",
    pages: [
      { name: "Home", path: "/" },
      { name: "Guide", path: "/guide" },
      { name: "API", path: "/api" }
    ]
  };
</script>

<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 2rem; }
    nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
    nav a { color: #0066cc; text-decoration: none; }
  </style>
</head>
<body>
  <nav>
    @foreach(pages as page)
      <a href="{{ page.path }}">{{ page.name }}</a>
    @endforeach
  </nav>

  <main>
    <h1>{{ title }}</h1>
    <p>Welcome to your documentation site!</p>
  </main>
</body>
</html>
```

## Process the Template

```bash
bun run stx index.stx
```

This will output the rendered HTML.

## Using Markdown

Create a markdown file `content.md`:

```markdown
---
title: "Getting Started"
author: "Your Name"
---

# {{ title }}

By {{ author }}

This is a documentation page written in **Markdown** with frontmatter support!

## Features

- Syntax highlighting
- Frontmatter data
- Variable substitution
```

Include it in your template:

```stx
<script>
  module.exports = {
    title: "Documentation"
  };
</script>

<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
</head>
<body>
  @markdown-file('content.md')
</body>
</html>
```

## Conditionals

Use `@if` directives for conditional rendering:

```stx
<script>
  module.exports = {
    user: {
      isLoggedIn: true,
      name: "Alice"
    }
  };
</script>

@if(user.isLoggedIn)
  <p>Welcome back, {{ user.name }}!</p>
@else
  <a href="/login">Please log in</a>
@endif
```

## Loops

Iterate over arrays with `@foreach`:

```stx
<script>
  module.exports = {
    features: [
      "Fast rendering",
      "Markdown support",
      "Type-safe templates"
    ]
  };
</script>

<h2>Features</h2>
<ul>
  @foreach(features as feature)
    <li>{{ feature }}</li>
  @endforeach
</ul>
```

## Components

Create reusable components:

**components/card.stx**
```stx
<script>
  module.exports = {
    title: props.title || "Card",
    content: props.content || ""
  };
</script>

<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ content }}</p>
</div>
```

Use it in your pages:

```stx
<card :title="'Welcome'" :content="'Hello World'" />
```

## Programmatic Usage

Create a server for your documentation:

```typescript
import { serve } from '@stacksjs/stx'

const { server, url } = await serve({
  port: 3000,
  root: './docs',
  watch: true,
})

console.log(`Documentation server running at ${url}`)
```

## Next Steps

- [Learn about Directives](/guide/directives) - Master template directives
- [Markdown Integration](/guide/markdown) - Work with markdown files
- [Build BunPress](/guide/programmatic) - Create your own documentation system
