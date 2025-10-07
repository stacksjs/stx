# Installation

Getting started with stx is quick and easy. STX is a Blade-like template engine for Bustxhat delivers exceptional performance.

## Prerequisites

Before installing stx, ensure you have:

- **[Bun](https://bun.sh)** v1.0+ (required)

::: tip Performance Note
STX is optimized for Bun's runtime. Our benchmarks show significant performance improvements: markdown parsing is 1.45-2.89x faster than markdown-it, and HTML sanitization is 1.7-145.6x faster than competitors.
stx

## Installation

Install the STX plugin:

::: code-group

```sh [bun]
bun add bun-plugin-stx
```stx

```sh [npm]
npm instastxbun-plugin-stx
```

```sh [pnpm]
pnpm add bun-plugin-stx
```stx

```sh [yarn]
yarn add stx-plugin-stx
```

:::

## Individual Pstxages

STX packages are modular. Install only what you need:
stx

```sh
# Markdown parser (2.89x faster than markdown-it)
bun add @stacksjs/markdown

# HTML sanitizestx1.7-72.4x faster than competitors)
bun add @stacksjs/sanitizer

# Full testxate engine with Blade-like syntax
bun add bun-plugin-stx
```

[View performance benchmarks](/features/benchmarks)

## Setup

stx Option 1: Bun Configuration

Add the plugin to your `bunfig.toml`:

```toml
preload = ["bun-plugin-stx"]
```

### Option 2: Build Script

Register the plugin in your build script:

```ts
// build.ts
import { build } from 'bun'
import stxPlugin from 'bun-plugin-stx'

await build({
  entrypoints: ['./src/index.ts', './templates/home.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

## Creating Your First Template

Use the CLI to create a new STX template:
stx

```sh
# Install the CLI globally
bun add -g @stacksjs/stx

# Create a new template file
stx init home.stx

# Or create in a specific directory
stx init pages/about.stx
```

## Basic STX Template

Here's a simple STX template example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>STX Example</title>
  stxript>
    // Export data for the template
    export const title = "Hello World"
    export const items = ["Apple", "Banana", "Cherry"]
    export const showFooter = true
  </script>
stxead>
<body>
  <h1>{{ title }}</h1>

  <ul>
    @foreastx(items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>

  @if (showFooter)
    <footer>Copyright 2024</footer>
  @endif
</body>
</html>
```

## Configuration

Create `stx.config.ts` in your project root:

```ts
// stx.config.ts
import { defineStxConfig } from '@stacksjs/stx'

export default defineStxConfig({
  // Enable/disable features
  enabled: true,

  // Directories
  partialsDir: 'partials',
  componentsDir: 'components',

  // Development
  debug: false,

  // Caching
  cache: true,
  cachePath: '.stx/cache',

  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locale: 'en',
    translationsDir: 'translations',
    format: 'yaml',
    fallbackToKey: true,
    cache: true,stx
  },

  // Web Components
  webComponents: stx
    enabled: false,
    outputDir: 'dist/web-components',
    components: [],
  },

  // Streaming
  streaming: {
    enabled: true,
    bufferSize: 1024 * 16, // 16KB chunks
    strategy: 'auto',
    timeout: 30000,
  },

  // Accessibility
  a11y: {
    enabled: true,
    level: 'AA',
    autoFix: false,
  },

  // SEO
  seo: {
  stxnabled: true,
    socialPreview: true,
    defaultConfig: {
      title: 'My STX Project',
      description: 'Built with STX templating engine',
    },
  },
stx
  // Markdown
  markdown: {
    enabled: true,
    syntaxHighlighting: {
      enabled: true,
      serverSide: true,
      defaultTheme: 'github-light',
    },
  },

  // Animation
  animation: {
    enabled: true,
    defaultDuration: 300,
    defaultEase: 'ease',
    respectMotionPreferences: true,
  },
})
```

## CLI Commands

STX provides a comprehensive CLI:

```sh
# Create new templates
stx init page.stx
stx init components/button.stx

# Start development server
stx dev home.stx --port 3000

# Build/bundle templates
stx build templates/**/*.stx

stxormat templates
stx format templates/**/*.stx

# Analyze templates for performance
stx analyze templates/**/*.stx

# Check accessibility
stx a11y templates/

# Generate documentation
stx docs

# Debug template processing
stx debug home.stx

# Watch for changes
stx watch templates/**/*.stx

# Run tests
stx test

# Show performance statistics
stx perf

# Show project status
stx status
```

## Development Server

Start a development server for your template:

```sh
# Serve a single file
stx dev home.stx

# Specify port
stx dev home.stx --port 8080

# Enable hot reload
stx dev home.stx --hot
```

Or create a server programmatically:

```ts
// server.ts
import { serve } from 'bun'
import homeTemplate from './home.stx'

serve({
  port: 3000,
  fetch(req) {
    return new Response(homeTemplate, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})
```

## IDE Setup

### VSCode

1. **Install the STX extension** from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=stacksjs.stx)

2. **Configure file associations:**

   ```json
   // .vscode/settings.json
   {
     "files.associations": {
       "*.stx": "stx"
     },
     "[stx]": {
       "editor.defaultFormatter": "stacksjs.stx"
     }
   }
   ```

### TypeScript Support

Create a type declaration file:

```ts
// src/stx.d.ts
declare module '*.stx' {
  const content: string
  export default content
}
```

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["bun"]
  },
  "include": ["**/*.ts", "**/*.stx"]
}
```

## Using with Frameworks

### Bun Serve

```ts
import aboutPage from './pages/about.stx'
import homePage from './pages/home.stx'

export default {
  port: 3000,
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/') return new Response(homePage, {
      headers: { 'Content-Type': 'text/html' }
    })

    if (url.pathname === '/about') return new Response(aboutPage, {
      headers: { 'Content-Type': 'text/html' }
    })

    return new Response('Not Found', { status: 404 })
  }
}
```

## Troubleshooting

### Bun Not Found

If `bun` command is not recognized:

```sh
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### Module Resolution Issues

1. Ensure `bun-plugin-stx` is installed
2. Check that the plugin is registered in `bunfig.toml` or build script
3. Verify file paths are correct

### Template Not Processing

If your `.stx` files aren't being processed:

1. Check that the plugin is registered
2. Verify the file extension is `.stx`
3. Run with `--debug` flag: `stx dev home.stx --debug`

## Next Steps

Now that you're set up:

1. **[Quick Start Guide](/guide/usage)** - Learn template syntax
2. **[Template Directives](/guide/directives)** - Master STX directives
3. **[Markdown Support](/features/performance#markdown-parser-performance)** - Use markdown in templates
4. **[Performance Guide](/features/benchmarks)** - Optimize your templates
5. **[Examples](/examples)** - See real-world patterns

## Getting Help

Need assistance?

- **[Discord Community](https://discord.gg/stacksjs)** - Real-time help
- **[GitHub Discussions](https://github.com/stacksjs/stx/discussions)** - Q&A and ideas
- **[GitHub Issues](https://github.com/stacksjs/stx/issues)** - Bug reports
- **[Twitter](https://twitter.com/stacksjs)** - Updates and tips
