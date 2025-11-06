# STX Framework Packages

The STX framework is a comprehensive monorepo containing 11 core packages plus 218 icon collection packages. This guide provides an overview of all available packages and their purposes.

## Core Packages

### @stacksjs/stx

**The core UI/templating framework** with Laravel Blade-like syntax powered by Bun.

```bash
bun add @stacksjs/stx
```

**Features**:
- 30+ template directives (`@foreach`, `@if`, `@include`, `@component`, etc.)
- Template processing pipeline with caching
- Hot reload development server
- Streaming SSR support
- SEO directives and structured data
- Form handling with CSRF protection
- Animation and transition directives
- Accessibility (a11y) features
- Islands architecture support
- CLI commands (init, docs, serve, iconify)

**Main Exports**:
- Template processing: `processDirectives()`
- Configuration: `defaultConfig`, `defineConfig()`
- Components: `renderComponent()`, `resolveComponent()`
- Utilities: `extractVariables()`, `safeEvaluate()`
- Error handling: `StxRuntimeError`, `errorLogger`
- Performance: `performanceMonitor`

**Learn More**: [Template Syntax](/api/template-syntax) | [Directives](/guide/directives) | [Configuration](/api/config)

---

### bun-plugin-stx

**Bun plugin** for processing `.stx` and `.md` files.

```bash
bun add bun-plugin-stx
```

**Features**:
- `.stx` file loader with template processing
- `.md` file loader with frontmatter support
- Cache integration
- Web component building
- Dependency tracking
- Development server with hot reload

**Usage**:
```typescript
// bunfig.toml or bun.config.ts
import { stxPlugin } from 'bun-plugin-stx'

export default {
  plugins: [stxPlugin()]
}
```

**Learn More**: [Plugin Documentation](/api/plugins)

---

### @stacksjs/markdown

**Fast markdown parser** with frontmatter support - **1.45-2.89x faster** than markdown-it.

```bash
bun add @stacksjs/markdown
```

**Features**:
- GitHub Flavored Markdown (GFM)
- YAML/TOML/JSON frontmatter parsing
- Syntax highlighting with Shiki
- Native Bun YAML parser (1.5-2.7x faster than js-yaml)
- Position-based parsing optimization

**Main Exports**:
```typescript
import {
  parseMarkdown,
  parseMarkdownSync,
  parseFrontmatter,
  parseMarkdownWithFrontmatter,
  stringifyFrontmatter,
  parseYaml,
  stringifyYaml
} from '@stacksjs/markdown'
```

**Performance**: 2.89x faster (small), 1.96x faster (medium), 1.45x faster (large)

**Learn More**: [Markdown API](/api/markdown) | [Benchmarks](/guide/benchmarks#markdown-parsing-performance)

---

### @stacksjs/sanitizer

**HTML sanitizer** with XSS protection - **77.93x faster** than DOMPurify.

```bash
bun add @stacksjs/sanitizer
```

**Features**:
- XSS protection
- 4 security presets (strict, basic, markdown, relaxed)
- Configurable allowed tags and attributes
- URL scheme validation
- DOMPurify-compatible API

**Main Exports**:
```typescript
import {
  sanitize,
  sanitizeWithInfo,
  isSafe,
  escape,
  stripTags,
  strict,
  basic,
  markdown,
  relaxed,
  getPreset
} from '@stacksjs/sanitizer'
```

**Performance**: 77.93x faster than DOMPurify, 1.70-1.99x faster than xss/sanitize-html

**Learn More**: [Sanitizer API](/api/sanitizer) | [Benchmarks](/guide/benchmarks#html-sanitization-performance)

---

### @stacksjs/desktop

**Native desktop application framework** ready for ts-zyte/craft integration.

```bash
cd packages/desktop
bun install
```

**Features**:
- Window management (create, control native windows)
- System tray and menubar applications
- Modals and alerts
- 35 UI components (3 implemented, 32 placeholders)
- Hot reload support
- 100% test coverage (132 tests, 96.77% coverage)
- Webview-agnostic architecture

**Main Exports**:
```typescript
import {
  createWindow,
  createWindowWithHTML,
  openDevWindow,
  createSystemTray,
  createMenubar,
  showModal,
  showAlert,
  showToast,
  createButton,
  createCheckbox,
  createTextInput,
  isWebviewAvailable,
  AVAILABLE_COMPONENTS
} from '@stacksjs/desktop'
```

**Use with STX**: `stx dev examples/homepage.stx --native`

**Learn More**: [Desktop Guide](/guide/desktop)

---

### @stacksjs/iconify-core

**Core utilities** for Iconify SVG icons in STX.

```bash
bun add @stacksjs/iconify-core
```

**Features**:
- SVG generation from icon data
- Size, color, rotation, flip transformations
- currentColor support
- CSS generation
- Zero runtime dependencies

**Main Exports**:
```typescript
import {
  renderIcon,
  generateIconCSS,
  type IconProps,
  type IconData
} from '@stacksjs/iconify-core'
```

**Learn More**: [Iconify](/iconify)

---

### @stacksjs/iconify-generator

**CLI tool** to generate icon packages from Iconify collections (200K+ icons).

```bash
bun add @stacksjs/iconify-generator
```

**Features**:
- Fetches from Iconify API or @iconify/json
- Generates TypeScript data files
- Generates .stx component files
- Creates complete npm packages
- 218 collections with 200,000+ icons

**CLI Usage**:
```bash
# List available collections
stx iconify list

# Generate icon package
stx iconify generate lucide
```

**Main Exports**:
```typescript
import {
  fetchCollections,
  fetchCollectionIcons,
  generatePackage,
  generateIconComponent,
  generateIconData
} from '@stacksjs/iconify-generator'
```

**Learn More**: [Iconify](/iconify)

---

### @stacksjs/devtools

**Development tools UI** for STX templating engine.

```bash
cd packages/devtools
bun install
```

**Features**:
- Template inspection
- Performance monitoring
- Configuration viewer
- Route-based navigation
- Hot reload support
- Built entirely with STX

**Components**:
- `TemplateDetails` - Template detail view
- `PerformanceChart` - Performance visualization
- Views: Dashboard, Templates, Performance, Config

**Learn More**: [DevTools source](https://github.com/stacksjs/stx/tree/main/packages/devtools)

---

### @stacksjs/benchmarks

**Performance benchmarks** comparing STX packages against competitors.

```bash
cd packages/benchmarks
bun run bench:all
```

**Benchmarks**:
- Template engines: EJS, Pug, Handlebars, Nunjucks, LiquidJS
- Markdown: markdown-it, marked, showdown, remark
- Sanitizer: DOMPurify, sanitize-html, xss
- Frontmatter: gray-matter
- YAML: js-yaml
- Framework: js-framework-benchmark

**Tools**: Mitata v1.0.34 (templating), TinyBench v5.0.1 (parsing/sanitization)

**Learn More**: [Benchmark Results](/guide/benchmarks)

---

### vscode-stacks

**VS Code extension** providing STX language support.

**Features**:
- Syntax highlighting for `.stx` files
- IntelliSense (completion, hover, go-to-definition)
- Diagnostics (errors/warnings)
- Code actions and refactoring
- Class sorting (Tailwind/UnoCSS)
- Color previews
- TypeScript support in templates
- 100+ configuration options

**Install**: Search for "stx" or "stacks" in VS Code Extensions

**Learn More**: [VS Code Extension](/guide/tools/vscode)

---

### @stacksjs/collections

**218 icon collection packages** generated from Iconify.

Each collection is a standalone package:

```bash
bun add @stacksjs/iconify-lucide    # 1,661 icons
bun add @stacksjs/iconify-mdi       # 7,638 icons
bun add @stacksjs/iconify-heroicons # 1,288 icons
```

**Popular Collections**:
- `iconify-lucide` - Modern icon set (1,661 icons)
- `iconify-mdi` - Material Design Icons (7,638 icons)
- `iconify-tabler` - Clean, minimal icons (6,011 icons)
- `iconify-heroicons` - Heroicons by Tailwind (1,288 icons)
- `iconify-fluent` - Microsoft Fluent (18,908 icons)
- `iconify-material-symbols` - Material Symbols (15,613 icons)
- And 212 more...

**Usage**:
```typescript
import { HeartIcon } from '@stacksjs/iconify-lucide'

// Use as component
<HeartIcon size="24" color="red" />
```

**Learn More**: [Iconify](/iconify)

---

## Package Dependencies

```
@stacksjs/stx (core)
├── @stacksjs/desktop
├── @stacksjs/markdown
├── @stacksjs/sanitizer
└── bun-plugin-stx

bun-plugin-stx
└── @stacksjs/stx

@stacksjs/iconify-generator
└── @stacksjs/iconify-core

@stacksjs/iconify-{collection}
└── @stacksjs/iconify-core

@stacksjs/devtools
└── bun-plugin-stx

@stacksjs/benchmarks
├── @stacksjs/markdown
└── @stacksjs/sanitizer
```

---

## Installation Guide

### Full Framework

Install the complete STX framework:

```bash
bun create stacks-app my-app
cd my-app
bun install
```

### Core Package Only

Install just the core templating engine:

```bash
bun add @stacksjs/stx
```

### Individual Packages

Install specific packages as needed:

```bash
# Markdown parsing
bun add @stacksjs/markdown

# HTML sanitization
bun add @stacksjs/sanitizer

# Icon collection
bun add @stacksjs/iconify-lucide

# Desktop framework (monorepo only)
cd packages/desktop && bun install
```

---

## Package Statistics

- **Total Packages**: 11 core + 218 icon collections = **229 packages**
- **Core Framework**: 40+ module files, 30+ directives
- **Desktop Components**: 35 components (3 implemented, 32 placeholders)
- **Icon Collections**: 218 collections with **200,000+ icons**
- **Test Coverage**: Desktop at 96.77% line coverage
- **CLI Commands**: 3 binaries (`stx`, `stx-serve`, `stx-iconify`)
- **VS Code Extension**: 100+ configuration options

---

## Performance Highlights

### Framework Performance
- **44.1% faster than VanillaJS** in js-framework-benchmark
- 0.57ms geometric mean (VanillaJS: 1.02ms)
- Winner in 8 of 9 operations

### Template Engine
- Pug: 92ns (fastest for simple templates)
- Handlebars: 3.85µs (fastest for complex templates)
- **STX: 26.83µs simple, 167.41µs complex** (feature-rich)

### Markdown Parsing
- **2.89x faster** than markdown-it (small documents)
- **1.96x faster** (medium documents)
- **1.45x faster** (large documents)

### HTML Sanitization
- **77.93x faster** than DOMPurify
- **1.70-1.99x faster** than xss/sanitize-html
- Fastest in all categories

### YAML Parsing
- **1.5-2.7x faster** than js-yaml
- Native Bun implementation

See [Benchmark Results](/guide/benchmarks) for complete performance analysis.

---

## Choosing Packages

### For Web Applications

**Full Stack**:
```bash
@stacksjs/stx           # Core templating
@stacksjs/markdown      # Content parsing
@stacksjs/sanitizer     # Security
@stacksjs/iconify-*     # Icons
bun-plugin-stx          # Build integration
```

**Minimal**:
```bash
@stacksjs/stx           # Just the core
```

### For Desktop Applications

```bash
@stacksjs/stx           # Templating
@stacksjs/desktop       # Native windows
@stacksjs/iconify-*     # UI icons
```

### For Static Sites

```bash
@stacksjs/markdown      # Markdown → HTML
@stacksjs/sanitizer     # Content security
bun-plugin-stx          # Build tool
```

### For Content Processing

```bash
@stacksjs/markdown      # Markdown parsing
@stacksjs/sanitizer     # HTML cleaning
```

---

## Contributing

Each package has its own development setup:

```bash
# Core framework
cd packages/stx
bun test

# Desktop framework
cd packages/desktop
bun test --coverage

# Benchmarks
cd packages/benchmarks
bun run bench:all

# Icon generator
cd packages/iconify-generator
bun run dev
```

See [Contributing Guide](/community/contributing) for more details.

---

## Next Steps

- Start with the [Getting Started Guide](/guide/intro)
- Review [Template Directives](/guide/directives)
- Explore [Benchmark Results](/guide/benchmarks)
- Check out [API Reference](/api/reference)
- Try [Desktop Applications](/guide/desktop)
- Browse [Iconify](/iconify)
