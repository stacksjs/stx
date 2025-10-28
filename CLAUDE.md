# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**stx** is a fast, modern UI/templating framework that combines Laravel Blade-like syntax with Bun's performance. It's a monorepo containing multiple packages that work together to provide server-side rendering, component-based architecture, and a rich development experience.

## Core Architecture

### Monorepo Structure

This is a Bun workspace monorepo with packages in `packages/`:

- **`packages/stx`** - Core framework with template processing engine
- **`packages/bun-plugin`** - Bun plugin for `.stx` file processing
- **`packages/markdown`** - Markdown parsing with frontmatter support
- **`packages/sanitizer`** - HTML/XSS sanitization
- **`packages/iconify-core`** - Iconify integration core
- **`packages/iconify-generator`** - Icon package generation CLI
- **`packages/vscode`** - VS Code extension for `.stx` syntax
- **`packages/devtools`** - Development tooling
- **`packages/benchmarks`** - Performance benchmarks

### Template Processing Pipeline

The core template processing happens in `packages/stx/src/process.ts` via `processDirectives()`:

1. **Pre-processing**: Comments removal, escaped directives
2. **Directive Processing**: Sequential processing of directives in specific order:
   - Stack directives (`@push`, `@prepend`)
   - JavaScript/TypeScript execution (`@js`, `@ts`)
   - Includes and layouts (`@include`, `@extends`, `@section`)
   - Custom directives
   - Components (`@component`)
   - Conditionals (`@if`, `@switch`, `@auth`, `@env`)
   - Loops (`@foreach`, `@for`)
   - Expressions (`{{ }}`, `{!! !!}`)
   - i18n (`@translate`)
   - Forms (`@csrf`, `@method`, `@error`)
   - SEO directives (`@meta`, `@seo`)
3. **Post-processing**: Middleware, stack replacements, web component injection

Each directive type is handled by a dedicated module in `packages/stx/src/`.

### Plugin System

The Bun plugin (`packages/bun-plugin/src/index.ts`) registers loaders for:
- `.stx` files - Processed as templates and exported as JavaScript modules
- `.md` files - Parsed with frontmatter and exported with `content` and `data` exports

## Development Commands

### Building

```bash
# Build all packages
bun run build

# Build individual packages
cd packages/bun-plugin && bun run build
cd packages/stx && bun run build
```

The build process:
1. Builds CSS assets (`packages/stx/scripts/build-css.ts`)
2. Compiles TypeScript using custom build scripts (`build.ts` in each package)
3. Creates compiled CLI binaries for multiple platforms

### Testing

```bash
# Run all tests
bun test

# Run tests for a specific package
cd packages/stx && bun test

# Run specific test file
bun test packages/stx/test/directives/conditionals.test.ts

# Run tests with coverage
cd packages/stx && bun test --coverage

# Run tests in watch mode
cd packages/stx && bun test --watch
```

Tests use Bun's built-in test runner with Happy DOM preloaded (configured in `bunfig.toml`). Test files follow the pattern `*.test.ts` and are located in each package's `test/` directory.

### Linting

```bash
# Lint all code
bun run lint

# Auto-fix linting issues
bun run lint:fix
```

Uses `@stacksjs/eslint-config` for consistent code style.

### Development Server

```bash
# Serve .stx files for development
bun packages/bun-plugin/dist/serve.js pages/ --port 8888

# Or using the CLI
stx-serve pages/ --port 3000
```

## Key Concepts

### Context and Variables

Templates execute in an isolated context. Variables are extracted from:
1. `<script>` tags with `module.exports` or `export` statements
2. Parent component/layout context
3. Props passed to components

See `packages/stx/src/utils.ts` `extractVariables()` for implementation.

### Directive Registration

Custom directives are registered in `packages/stx/src/config.ts` as part of `defaultConfig.customDirectives`. Each directive needs:
- `name` - without the `@` prefix
- `handler` - function that processes the directive
- `hasEndTag` - whether it uses an end tag (e.g., `@directive...@enddirective`)
- `description` - for documentation

### Caching

Template caching is managed in `packages/stx/src/caching.ts`:
- Cache location: `.stx/cache` (configurable via `cachePath`)
- Cache invalidation based on file modification times and dependencies
- Disabled in development mode by default

### Component System

Components in `components/` are resolved via `packages/stx/src/components.ts`:
- Components are `.stx` files
- Can receive props and slots
- Support scoped context
- Resolved recursively to prevent circular dependencies

### Web Components

Web components are built from `.stx` templates (see `packages/stx/src/web-components.ts`):
- Configured in `stx.config.ts` under `webComponents`
- Generate custom element classes
- Support Shadow DOM, observed attributes, and lifecycle callbacks

## Configuration

Configuration is loaded from `stx.config.ts` or `.config/stx.config.ts` using `bunfig`.

Default config is in `packages/stx/src/config.ts`.

Important config options:
- `partialsDir` - Directory for partial templates
- `componentsDir` - Directory for components
- `cache` - Enable/disable template caching
- `debug` - Enable detailed error logging
- `customDirectives` - Register custom directives
- `middleware` - Pre/post-processing middleware
- `i18n` - Internationalization settings
- `webComponents` - Web component generation config

## TypeScript Paths

TypeScript path mappings are configured in `tsconfig.json`:

```typescript
"paths": {
  "stx": ["./packages/stx/src/index.ts"],
  "@stacksjs/stx": ["./packages/stx/src/index.ts"],
  "bun-plugin-stx": ["./packages/bun-plugin/src/index.ts"],
  // ... other packages
}
```

Use these imports consistently across the codebase.

## Release Process

```bash
# Generate changelog
bun run changelog

# Bump version and release (prompts for version)
bun run release
```

The release script:
1. Generates `CHANGELOG.md` using `logsmith`
2. Prompts for version bump using `bumpx`
3. Updates versions recursively across workspace packages
4. Compiles binaries for all platforms
5. Creates zip archives of binaries

## Working with Icons

Icons use Iconify with 200K+ icons:

```bash
# List available icon collections
bun stx iconify list

# Generate icon package
bun stx iconify generate <collection-name>
```

Icon components are generated in `packages/collections/` and used as `<IconName size="24" />` in templates.

## Error Handling

The framework has robust error handling (`packages/stx/src/error-handling.ts`):
- `StxRuntimeError` - Enhanced errors with file path, line/column info
- `errorLogger` - Structured error logging
- `errorRecovery` - Fallback content generation in production
- `devHelpers` - Development-friendly error messages

When debugging, enable `debug: true` in config for detailed stack traces.

## Performance Monitoring

Performance tracking is available via `packages/stx/src/performance-utils.ts`:
- `performanceMonitor.timeAsync()` - Measure async operations
- Metrics tracked: template processing, directive execution, file I/O
- Enable with performance config options

## CLI Commands

The stx CLI (`packages/stx/bin/cli.ts`) provides:

```bash
# Initialize new project
stx init

# Generate documentation
stx docs [--format html|markdown|json] [--output dir]

# Icon management
stx iconify list
stx iconify generate <collection>

# Serve templates
stx serve <directory> [--port 3000]
```

## Important Implementation Notes

1. **Directive Processing Order Matters**: Directives are processed sequentially. The order in `process.ts` ensures that includes/layouts are resolved before conditionals, which are resolved before expressions.

2. **Context Isolation**: Each template execution gets an isolated VM context to prevent variable leakage and security issues. See `packages/stx/src/safe-evaluator.ts`.

3. **Dependency Tracking**: The build plugin tracks all template dependencies (includes, components, layouts) for proper cache invalidation.

4. **Async Processing**: Most directive handlers support async operations, allowing for file I/O, API calls, etc.

5. **Middleware Timing**: Middleware can run `before` or `after` directive processing. Set the `timing` field appropriately.

6. **Component Resolution**: Components are resolved relative to `componentsDir` first, then fall back to current directory. Paths without extensions automatically append `.stx`.
