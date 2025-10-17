---
title: "Introduction"
---

# Introduction to stx

stx is a modern templating engine designed for Bun that combines the best features of Laravel Blade with the power of JavaScript/TypeScript.

## Why stx?

Traditional templating engines often lack the flexibility needed for modern web development. stx bridges this gap by providing:

### Familiar Syntax

If you've used Laravel Blade, you'll feel right at home:

```stx
@if(user.isLoggedIn)
  <p>Welcome back, {{ user.name }}!</p>
@else
  <a href="/login">Please log in</a>
@endif
```

### Full JavaScript Support

Execute any JavaScript code in your templates:

```stx
<script>
  module.exports = {
    now: new Date(),
    users: await fetchUsers(),
    formatDate: (date) => date.toLocaleDateString()
  };
</script>

<p>Current time: {{ formatDate(now) }}</p>
```

### Markdown Integration

Include markdown files with frontmatter support:

```stx
@markdown-file('docs/readme.md')
```

## How it Works

1. **Parse** - stx reads your `.stx` files
2. **Extract** - Script sections are executed to extract data
3. **Process** - Directives and expressions are processed
4. **Render** - Final HTML is generated

## Next Steps

- [Install stx](/guide/install)
- [Quick Start Tutorial](/guide/quickstart)
- [Learn about Directives](/api/directives)
