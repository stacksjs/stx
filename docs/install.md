# Installation

Getting started with STX is easy. You can install it using your preferred package manager.

## Prerequisites

- [Bun](https://bun.sh) version 1.0 or higher
- Node.js 18.0.0 or higher (for npm/yarn/pnpm users)

## Installation Methods

Choose your package manager:

::: code-group

```sh [bun]
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

## Project Setup

After installation, you'll have a new project with the following structure:

```bash
my-project/
├── components/        # Reusable UI components
├── pages/            # Page templates
├── public/           # Static assets
├── stx.config.ts     # STX configuration
├── package.json
└── README.md
```

## Configuration

STX can be configured using `stx.config.ts`:

```ts
// stx.config.ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  // Project root directory
  root: '.',
  
  // Build output directory
  outDir: 'dist',
  
  // Enable/disable features
  features: {
    typescript: true,
    streaming: true,
    components: true,
  },
  
  // Plugin configurations
  plugins: [
    // Add your plugins here
  ],
})
```

## IDE Setup

For the best development experience, we recommend:

1. Install the STX VSCode extension:
   - Search for "STX" in VSCode extensions
   - Or install from [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=stacksjs.stx)

2. Enable TypeScript support:
   ```json
   {
     "files.associations": {
       "*.stx": "stx"
     }
   }
   ```

## Development Tools

STX comes with several development tools:

1. **VSCode Extension**
   - Syntax highlighting
   - IntelliSense
   - Type checking
   - Component previews

2. **DevTools**
   ```bash
   # Install DevTools
   bun add -d @stacksjs/devtools
   
   # Start development server with DevTools
   bun run dev
   ```

3. **CLI**
   ```bash
   # Create a new component
   bun stx create component Button
   
   # Build for production
   bun stx build
   
   # Start development server
   bun stx dev
   ```

## Next Steps

- Read the [Introduction](/intro) to learn about STX's core concepts
- Check out the [Basic Usage](/usage) guide
- Explore [Examples](/examples) to see STX in action
- Join our [Community](/community) for support and discussions
