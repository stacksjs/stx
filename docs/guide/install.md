# Installation

Getting started with STX is quick and easy. Built on Bun for exceptional performance, STX can be installed using any package manager.

## Prerequisites

Before installing STX, ensure you have:

- **[Bun](https://bun.sh)** v1.0+ (recommended for best performance)
- **Node.js** v18.0+ (if using npm/pnpm/yarn)

::: tip Performance Note
STX is optimized for Bun and delivers the best performance when run on Bun's runtime. Our benchmarks show 2-145x performance improvements over alternatives.
:::

## Quick Start

Choose your preferred package manager:

::: code-group

```sh [bun (recommended)]
# Create a new STX project
bunx create-stx my-project

# Or add STX to an existing project
bun add @stacksjs/stx
```

```sh [npm]
# Create a new STX project
npx create-stx my-project

# Or add STX to an existing project
npm install @stacksjs/stx
```

```sh [pnpm]
# Create a new STX project
pnpm create stx my-project

# Or add STX to an existing project
pnpm add @stacksjs/stx
```

```sh [yarn]
# Create a new STX project
yarn create stx my-project

# Or add STX to an existing project
yarn add @stacksjs/stx
```

:::

## Individual Packages

STX is modular. Install only what you need:

```sh
# Markdown parser (2.89x faster than markdown-it)
bun add @stacksjs/markdown

# HTML sanitizer (1.7-72.4x faster than competitors)
bun add @stacksjs/sanitizer

# Full UI engine
bun add @stacksjs/stx
```

[View performance benchmarks](/features/benchmarks)

## Project Structure

After creating a new project, you'll have:

```bash
my-project/
├── components/          # Reusable UI components
│   └── Button.stx
├── pages/              # Page templates
│   └── index.stx
├── public/             # Static assets
│   └── favicon.ico
├── stx.config.ts       # STX configuration
├── tsconfig.json       # TypeScript config
├── package.json
└── README.md
```

## Verify Installation

Test your installation:

```sh
# Navigate to your project
cd my-project

# Run the development server
bun run dev
```

You should see:

```
✓ STX development server running
➜ Local:   http://localhost:3000
➜ Ready in 45ms
```

::: tip
STX's fast startup time is powered by Bun. Traditional frameworks can take 2-5 seconds to start.
:::

## Configuration

Configure STX via `stx.config.ts`:

```ts
// stx.config.ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  // Project root directory
  root: '.',

  // Build output directory
  outDir: 'dist',

  // Component directories
  components: ['./components'],

  // Enable performance features
  features: {
    typescript: true,      // Full TypeScript support
    streaming: true,       // Streaming SSR
    components: true,      // Component system
    hotReload: true,       // HMR in development
  },

  // Performance optimizations
  performance: {
    minify: true,          // Minify output
    treeshake: true,       // Remove unused code
    compress: true,        // Compress assets
  },

  // Plugin configurations
  plugins: [
    // Add your plugins here
  ],
})
```

## IDE Setup

### VSCode (Recommended)

1. **Install the STX extension:**

   - Open VSCode
   - Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux)
   - Search for "STX"
   - Click Install

   Or install from [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=stacksjs.stx)

2. **Configure file associations:**

   ```json
   // .vscode/settings.json
   {
     "files.associations": {
       "*.stx": "stx"
     },
     "editor.formatOnSave": true,
     "[stx]": {
       "editor.defaultFormatter": "stacksjs.stx"
     }
   }
   ```

### Other IDEs

For JetBrains IDEs (WebStorm, IntelliJ IDEA):
- STX files are recognized as HTML with template syntax
- TypeScript support works out of the box

## Development Tools

### 1. VSCode Extension Features

- **Syntax Highlighting**: Full STX syntax support
- **IntelliSense**: Autocomplete for components, directives, and props
- **Type Checking**: Real-time TypeScript validation
- **Error Detection**: Catch issues before running
- **Component Preview**: See component output inline
- **Snippets**: Quick templates for common patterns

### 2. DevTools

Install the browser DevTools extension:

```sh
bun add -D @stacksjs/devtools
```

Then enable in your config:

```ts
// stx.config.ts
export default defineConfig({
  plugins: [
    devtools({
      enabled: process.env.NODE_ENV === 'development'
    })
  ]
})
```

Features:
- Component tree inspector
- Props and state viewer
- Performance profiler
- Network request monitor

### 3. CLI Commands

STX provides a powerful CLI:

```sh
# Create new components
bun stx create component Button
bun stx create page dashboard

# Build for production
bun stx build

# Start development server
bun stx dev

# Type check
bun stx check

# Run tests
bun stx test

# Analyze bundle
bun stx analyze
```

## TypeScript Setup

STX includes first-class TypeScript support:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "types": ["@stacksjs/stx/types"]
  },
  "include": ["**/*.ts", "**/*.stx"],
  "exclude": ["node_modules", "dist"]
}
```

## Testing Setup

Set up testing with Bun's built-in test runner:

```ts
// component.test.ts
import { describe, expect, test } from 'bun:test'
import { render } from '@stacksjs/stx'
import Button from './Button.stx'

describe('Button', () => {
  test('renders with text', () => {
    const html = render(Button, { text: 'Click me' })
    expect(html).toContain('Click me')
  })

  test('applies variant class', () => {
    const html = render(Button, { variant: 'primary' })
    expect(html).toContain('btn-primary')
  })
})
```

Run tests:

```sh
bun test
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

If imports aren't resolving:

1. Check `tsconfig.json` has correct `moduleResolution`
2. Ensure `@stacksjs/stx` is in dependencies
3. Restart your IDE/editor

### Performance Issues

If experiencing slow builds:

1. Disable unused features in `stx.config.ts`
2. Check for large dependencies
3. Use `bun run build --analyze` to identify bottlenecks

## Next Steps

Now that you're set up:

1. **[Quick Start Guide](/guide/usage)** - Build your first component
2. **[Component System](/guide/components)** - Learn about components
3. **[TypeScript Support](/guide/typescript)** - Master type safety
4. **[Performance Guide](/features/performance)** - Optimize your app
5. **[Examples](/examples)** - See real-world patterns

## Getting Help

Need assistance?

- **[Discord Community](https://discord.gg/stacksjs)** - Real-time help
- **[GitHub Discussions](https://github.com/stacksjs/stx/discussions)** - Q&A and ideas
- **[GitHub Issues](https://github.com/stacksjs/stx/issues)** - Bug reports
- **[Twitter](https://twitter.com/stacksjs)** - Updates and tips
