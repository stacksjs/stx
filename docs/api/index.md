# API Documentation

Complete API reference for stx templating engine and its packages.

## Core APIs

### Template Processing
- **[Template Syntax](/api/template-syntax)** - Directives, expressions, and template syntax
- **[Component API](/api/component)** - Creating and using components
- **[Components](/api/components)** - Built-in components reference
- **[Template Type Checker](/api/type-checker)** - TypeScript-style type inference for templates

### Data & State
- **[State Management](/api/state)** - Application state handling
- **[Reactivity](/api/reactivity)** - Vue-style reactivity (ref, reactive, computed, watch)
- **[Helpers](/api/helpers)** - Helper functions and utilities
- **[Utilities](/api/utilities)** - Additional utility functions

### Styling & UI
- **[Styling API](/api/styling)** - Styling components and templates
- **[TypeScript Integration](/api/typescript)** - Using TypeScript with stx

### Development
- **[CLI Commands](/api/cli)** - Command line interface reference
- **[Configuration](/api/config)** - Configuration options
- **[Testing](/api/testing)** - Testing utilities and functions
- **[Visual Testing](/api/visual-testing)** - Snapshot and visual regression testing
- **[Component HMR](/api/component-hmr)** - Hot Module Replacement with state preservation

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

## Build & Deployment

### Static Site Generation
- **[SSG](/api/ssg)** - Static Site Generation with ISR
  - Build-time page generation
  - Incremental Static Regeneration (ISR)
  - Dynamic routes with `getStaticPaths()`
  - Sitemap and RSS generation
  - Build caching and parallel generation

### Production Build
- **[Production Build](/api/production-build)** - Optimized production builds
  - Code splitting and tree shaking
  - CSS extraction and minification
  - Asset fingerprinting
  - Gzip/Brotli compression
  - Bundle analysis

### Client-Side
- **[Hydration](/api/hydration)** - Client-side hydration runtime
  - Full page hydration with state restoration
  - Selective hydration strategies (eager, lazy, idle, visible)
  - Event handler binding
  - SPA router integration
- **[Partial Hydration](/api/partial-hydration)** - Islands architecture
  - `@client:load`, `@client:idle`, `@client:visible`
  - `@client:media`, `@client:hover`, `@client:event`

## Advanced APIs

### Routing & Plugins
- **[Core API](/api/core)** - Core functionality and features
- **[Plugins](/api/plugins)** - Plugin system and API
- **[Router](/api/router)** - File-based routing
- **[SPA Router](/api/spa-router)** - Client-side SPA navigation

### CLI & Scaffolding
- **[Scaffolding](/api/scaffolding)** - Project and file generators
  - `createProject()` - Full project scaffolding
  - `addComponent()`, `addPage()`, `addStore()`, `addLayout()`
  - Multiple templates (default, minimal, full, blog, dashboard, landing)

## Quick Reference

### Import Examples

```typescript
// Static Site Generation
import { generateStaticSite, defineStaticPaths, createISRHandler } from '@stacksjs/stx'

// Visual Testing
import { snapshot, createStoryTester, generateReport } from '@stacksjs/stx'

// Hydration
import { hydrate, getHydrationRuntime, generateHydrationScript } from '@stacksjs/stx'

// Component HMR
import { getHMRHandler, generateHMRClientScript } from '@stacksjs/stx'

// Reactivity
import { ref, reactive, computed, watch, onMounted } from '@stacksjs/stx'

// Production Build
import { ProductionBuild } from '@stacksjs/stx'

// Scaffolding
import { createProject, addComponent, addPage } from '@stacksjs/stx'

// Template Type Checking
import { checkTemplate, createTypeChecker, formatTypeErrors } from '@stacksjs/stx'

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
