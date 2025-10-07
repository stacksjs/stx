# Introduction to STX

STX is a modern UI engine that combines the elegance of Laravel Blade with the power of Bun. Built for performance and developer experience, STX delivers exceptional speed while maintaining familiar, intuitive syntax.

## What is STX?

STX is a high-performance UI engine that allows you to:

- Write templates with clean, Blade-inspired syntax
- Use TypeScript directly in your templates with full type safety
- Create reusable components with props and slots
- Leverage streaming rendering for optimal performance
- Build type-safe applications with comprehensive IDE support

## Why STX?

### ⚡ Blazing Fast Performance

STX packages consistently outperform industry-standard alternatives:

**Markdown Parser:**
- **2.89x faster** than markdown-it on small documents
- **1.96x faster** than markdown-it on medium documents
- **1.45x faster** than markdown-it on large documents

**HTML Sanitizer:**
- **1.7-72.4x faster** than competitors on safe HTML
- **1.95-145.6x faster** on XSS attack vectors
- **1.88-37.2x faster** on large documents

[View detailed benchmarks](/features/benchmarks)

### 💪 First-Class TypeScript Support

Type safety without compromise:
- Full type checking in templates
- Type-safe props and events
- IDE autocompletion everywhere
- Catch errors at build time, not runtime

### 🧩 Powerful Component System

Build reusable UI with confidence:
- Props validation with TypeScript
- Slots and named slots
- Component lifecycle hooks
- Scoped styles

### 🎯 Developer Experience

Built with DX in mind:
- Familiar Blade-like syntax
- Hot module replacement
- VSCode extension with IntelliSense
- DevTools for debugging
- Comprehensive error messages

## Quick Example

Here's what a simple STX component looks like:

```stx
@ts
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}
@endts

@component('Button', {
  props: {
    variant: 'primary',
    size: 'md',
    disabled: false
  }
})
  <button
    class="btn btn-{{ variant }} btn-{{ size }}"
    :disabled="disabled"
  >
    <slot></slot>
  </button>

  <style>
    .btn {
      @apply rounded font-medium transition-colors;
    }
    .btn-primary {
      @apply bg-blue-500 hover:bg-blue-600 text-white;
    }
    .btn-secondary {
      @apply bg-gray-500 hover:bg-gray-600 text-white;
    }
  </style>
@endcomponent
```

## Powerful Directives

STX provides intuitive directives for common patterns:

```stx
@if(user.isAdmin)
  <admin-panel />
@elseif(user.isModerator)
  <moderator-panel />
@else
  <user-panel />
@endif

@foreach(items as item)
  <list-item :data="item" :key="item.id" />
@endforeach

@auth
  <user-menu :user="currentUser" />
@endauth
```

## Core Features

### Template Compilation

STX compiles templates to highly optimized JavaScript:

```typescript
// Your template
@foreach(items as item)
  <div>{{ item.name }}</div>
@endforeach

// Compiles to optimized code
function render(context) {
  let html = ''
  for (const item of context.items) {
    html += `<div>${escape(item.name)}</div>`
  }
  return html
}
```

### Type-Safe Props

Define and validate props with TypeScript:

```stx
@ts
interface UserCardProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  showEmail?: boolean
}
@endts

@component('UserCard', {
  props: {
    user: { required: true },
    showEmail: false
  }
})
  <div class="card">
    <img src="{{ user.avatar ?? '/default.jpg' }}" alt="{{ user.name }}">
    <h3>{{ user.name }}</h3>
    @if(showEmail)
      <p>{{ user.email }}</p>
    @endif
  </div>
@endcomponent
```

### Scoped Styling

Keep styles isolated to components:

```stx
<style scoped>
  .card {
    @apply border rounded-lg p-4;
  }

  .card:hover {
    @apply shadow-lg;
  }
</style>
```

## Architecture Highlights

STX achieves exceptional performance through:

- **Flat token stream**: Avoids nested object allocations for better cache locality
- **Position-based parsing**: Minimizes string allocations
- **Optimized escaping**: Fast-path for strings without special characters
- **Direct inline matching**: Efficient template expression parsing
- **Bun-native optimizations**: Takes full advantage of Bun's runtime

## Getting Started

Ready to build with STX?

1. **[Installation](/guide/install)** - Set up STX in minutes
2. **[Quick Start](/guide/usage)** - Learn the basics
3. **[Components](/guide/components)** - Build reusable UI
4. **[Examples](/examples)** - See STX in action

## Community & Support

Join the STX community:

- [Discord Server](https://discord.gg/stacksjs) - Get help and share ideas
- [GitHub](https://github.com/stacksjs/stx) - Report issues and contribute
- [Twitter](https://twitter.com/stacksjs) - Stay updated
- [Best Practices](/guide/best-practices) - Learn from the community

## Open Source

STX is MIT licensed and built by contributors from around the world. We welcome contributions of all kinds.

**Sponsors:**
- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Next Steps

- Explore [Performance benchmarks](/features/benchmarks)
- Learn about [Type Safety](/guide/typescript)
- Understand [Security features](/guide/security)
- Check out the [API Reference](/api/reference)
