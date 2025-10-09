# API Documentation

Complete API reference for stx templating engine and its packages.

## Core APIs

### Template Processing
- **[Template Syntax](/api/template-syntax)** - Directives, expressions, and template syntax
- **[Component API](/api/component)** - Creating and using components
- **[Components](/api/components)** - Built-in components reference

### Data & State
- **[State Management](/api/state)** - Application state handling
- **[Helpers](/api/helpers)** - Helper functions and utilities
- **[Utilities](/api/utilities)** - Additional utility functions

### Styling & UI
- **[Styling API](/api/styling)** - Styling components and templates
- **[TypeScript Integration](/api/typescript)** - Using TypeScript with stx

### Development
- **[CLI Commands](/api/cli)** - Command line interface reference
- **[Configuration](/api/config)** - Configuration options
- **[Testing](/api/testing)** - Testing utilities and functions

## Package APIs

### Content Processing
- **[Markdown](/api/markdown)** - Markdown file processing and `@markdown-file` directive
  - YAML frontmatter support
  - Variable substitution
  - Server-side syntax highlighting with Shiki
  - Programmatic API (`readMarkdownFile`, `processMarkdownFileDirectives`)

### Performance & Optimization
- **[Caching](/api/caching)** - Template caching system
  - Memory and disk caching
  - Cache invalidation
  - Dependency tracking
  - Performance optimization

### Error Handling & Debugging
- **[Error Handling](/api/error-handling)** - Error types and recovery
  - Custom error types (`StxError`, `StxSyntaxError`, `StxRuntimeError`, etc.)
  - Error context and debugging
  - Error recovery strategies
  - Production error handling

### Internationalization
- **[i18n](/api/i18n)** - Internationalization and localization
  - `@translate` directive
  - Multiple file formats (JSON, YAML, JS)
  - Parameter substitution
  - Dynamic locale switching

## Advanced APIs

### Routing & Plugins
- **[Core API](/api/core)** - Core functionality and features
- **[Plugins](/api/plugins)** - Plugin system and API
- **[Router](/api/router)** - Routing capabilities

## Quick Reference

### Import Examples

```typescript
// Serve API (for documentation systems)
import { serve, createMiddleware, createRoute } from '@stacksjs/stx'

// Markdown processing
import { readMarkdownFile } from '@stacksjs/stx'

// Caching
import { checkCache, cacheTemplate } from '@stacksjs/stx'

// Error handling
import { StxError, StxSyntaxError } from '@stacksjs/stx'

// i18n
import { loadTranslation, getTranslation } from '@stacksjs/stx'

// Template processing
import { processDirectives } from '@stacksjs/stx'
```

### Bun Plugin

```typescript
import stxPlugin from 'bun-plugin-stx'

await Bun.build({
  entrypoints: ['./src/index.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

## See Also

- [Getting Started Guide](/guide/intro)
- [Programmatic Usage](/guide/programmatic-usage)
- [Examples](/examples)
- [Best Practices](/guide/best-practices)
