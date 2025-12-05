# STX Story Feature - Implementation Plan

Native component showcase and testing functionality for the stx framework. Inspired by [Histoire](https://histoire.dev)'s elegant API design, this feature provides a beautiful, fast component explorer built directly into stx, allowing developers to automatically discover, document, and interactively test all `.stx` components.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
3. [Phase 2: Component Discovery & Analysis](#phase-2-component-discovery--analysis)
4. [Phase 3: Story Definition System](#phase-3-story-definition-system)
5. [Phase 4: Interactive UI](#phase-4-interactive-ui)
6. [Phase 5: CLI Integration](#phase-5-cli-integration)
7. [Phase 6: Testing Integration](#phase-6-testing-integration)
8. [Phase 7: Advanced Features](#phase-7-advanced-features)
9. [Phase 8: Documentation & Polish](#phase-8-documentation--polish)

---

## Overview

### Goals

- **Zero-config discovery**: Automatically find and showcase all `.stx` components
- **Interactive playground**: Live prop editing with instant preview
- **Visual regression testing**: Snapshot and compare component renders
- **Documentation generation**: Auto-generate component docs from source
- **Native integration**: Built into `stx` CLI, no external dependencies
- **Desktop support**: Preview components in native windows via `--native` flag
- **Headwind CSS**: Auto-generate utility CSS for component previews

### Key Commands

```bash
# Start the story dev server (both are equivalent)
stx story
stx story dev

# Start with custom port
stx story dev --port 4000

# Open in browser automatically
stx story dev --open

# Build static story site for deployment
stx story build

# Preview the built story site
stx story preview

# Open in native desktop window
stx story dev --native

```

---

## Phase 1: Core Infrastructure

### 1.1 Create Story Module Structure

- [x] Create `packages/stx/src/story/` directory
- [x] Create `packages/stx/src/story/index.ts` - Internal module
- [x] Create `packages/stx/src/story/types.ts` - Type definitions
- [x] Create `packages/stx/src/story/config.ts` - Configuration handling
- [x] Add `story` config section to `StxConfig` in `packages/stx/src/types.ts`
- [x] Export story types from main `stx` package

### 1.2 Define Core Types

```typescript
// packages/stx/src/story/types.ts
// (exported from main 'stx' package)

export interface StoryConfig {
  enabled?: boolean
  // Output
  outDir?: string  // '.stx/dist/story'

  // Story discovery
  storyMatch: string[]      // ['**/*.story.stx']
  storyIgnored: string[]    // ['**/node_modules/**']

  // Tree organization
  tree: {
    file: 'title' | 'path' | ((file: StoryFile) => string[])
    order: 'asc' | ((a: string, b: string) => number)
    groups?: TreeGroupConfig[]
  }

  // Theme customization
  theme: {
    title: string
    logo?: { square?: string; light?: string; dark?: string }
    favicon?: string
    colors?: { primary?: ColorShades; gray?: ColorShades }
    defaultColorScheme: 'light' | 'dark' | 'auto'
    hideColorSchemeSwitch?: boolean
    darkClass: string  // 'dark'
  }

  // Viewport presets
  responsivePresets: ResponsivePreset[]
  backgroundPresets: BackgroundPreset[]
  autoApplyContrastColor?: boolean

  // Setup
  setupFile?: string  // Global setup for all stories

  // Plugins
  plugins: StoryPlugin[]
}

export interface ResponsivePreset {
  label: string
  width: number
  height?: number
}

export interface BackgroundPreset {
  label: string
  color: string
  contrastColor?: string
}

export interface Story {
  id: string
  title: string
  group?: string
  variants: Variant[]
  layout?: StoryLayout
  icon?: string
  iconColor?: string
  docsOnly?: boolean
}

export interface Variant {
  id: string
  title: string
  icon?: string
  iconColor?: string
  state: Record<string, any>
  source?: string
  responsiveDisabled?: boolean
}

export type StoryLayout =
  | { type: 'single'; iframe?: boolean }
  | { type: 'grid'; width?: number | string }
```

### 1.3 Configuration Integration

- [x] Add `story` section to `defaultConfig` in `packages/stx/src/config.ts`
- [x] Add story config validation in `validateConfig()`
- [x] Story config lives inside existing `stx.config.ts`

```typescript
// stx.config.ts
import { defineConfig } from 'stx'

export default defineConfig({
  // ... existing stx config ...

  story: {
    enabled: true,
    outDir: '.stx/dist/story',

    storyMatch: ['**/*.story.stx'],
    storyIgnored: ['**/node_modules/**', '**/dist/**'],

    tree: {
      file: 'title',  // Use story title for tree path
      order: 'asc',
      groups: [
        { title: 'Components', include: file => file.path.includes('/components/') },
        { title: 'Pages', include: file => file.path.includes('/pages/') },
      ],
    },

    theme: {
      title: 'My Components',
      defaultColorScheme: 'auto',
      darkClass: 'dark',
    },

    responsivePresets: [
      { label: 'Mobile', width: 320, height: 568 },
      { label: 'Tablet', width: 768, height: 1024 },
      { label: 'Desktop', width: 1280 },
    ],

    backgroundPresets: [
      { label: 'Transparent', color: 'transparent' },
      { label: 'White', color: '#fff', contrastColor: '#333' },
      { label: 'Dark', color: '#333', contrastColor: '#fff' },
    ],

    setupFile: './src/story.setup.ts',
  },
})
```

---

## Phase 2: Component Discovery & Analysis

### 2.1 Component Scanner

- [x] Create `packages/stx/src/story/collect/scanner.ts`
- [x] Implement recursive directory scanning for `.stx` files
- [x] Filter out non-component files (layouts, pages, partials)
- [x] Support multiple component directories
- [x] Implement file watching for live updates

```typescript
// scanner.ts
export async function scanComponents(
  dirs: string[],
  options: ScanOptions
): Promise<ComponentMeta[]>

export function watchComponents(
  dirs: string[],
  onChange: (components: ComponentMeta[]) => void
): () => void  // Returns cleanup function
```

### 2.2 Component Analyzer

- [x] Create `packages/stx/src/story/collect/analyzer.ts`
- [x] Extract props from `<script>` tags (with/without export)
- [x] Parse JSDoc comments for prop documentation
- [x] Detect slot usage (`{{ slot }}`, named slots)
- [x] Identify component dependencies (other components used)
- [x] Extract component description from top-level comments
- [x] Detect directive usage (`@if`, `@foreach`, etc.) for documentation
- [x] Parse `@component` calls to build dependency graph
- [x] Extract CSS classes for Headwind integration

```typescript
// analyzer.ts
export async function analyzeComponent(
  filePath: string
): Promise<ComponentMeta>

export function extractProps(scriptContent: string): PropDefinition[]
export function extractSlots(templateContent: string): SlotDefinition[]
export function extractDescription(content: string): string
```

### 2.3 Prop Type Inference

- [x] Infer prop types from default values
- [x] Support TypeScript type annotations in script tags
- [x] Parse `@type` JSDoc annotations
- [x] Detect enum types from `@options` or union types
- [x] Support complex types (arrays, objects)

```typescript
// Type inference examples
const title = 'Hello'           // Inferred: string
const count = 0                 // Inferred: number
const isActive = false          // Inferred: boolean
const items = []                // Inferred: array

/** @type {'primary' | 'secondary' | 'danger'} */
const variant = 'primary'       // Inferred: enum with options
```

---

## Phase 3: Story Definition System

### 3.1 Story File Format

- [x] Create `packages/stx/src/story/collect/parser.ts`
- [x] Define `.story.stx` file format
- [x] Support `<Story>` and `<Variant>` components
- [x] Support `initState` for reactive controls
- [x] Support layout options (single, grid)

```html
<!-- Button.story.stx -->
<script>
import Button from './Button.stx'

// Initialize reactive state for controls
function initState() {
  return {
    label: 'Click me',
    variant: 'primary',
    disabled: false,
    size: 'medium'
  }
}

const sizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]
</script>

<Story title="Button" :layout="{ type: 'grid', width: 200 }">
  <!-- Playground variant with controls -->
  <Variant title="Playground" :init-state="initState">
    <template #default="{ state }">
      <Button
        :label="state.label"
        :variant="state.variant"
        :disabled="state.disabled"
        :size="state.size"
      />
    </template>

    <template #controls="{ state }">
      <StxText v-model="state.label" title="Label" />
      <StxSelect v-model="state.variant" title="Variant"
        :options="['primary', 'secondary', 'danger']" />
      <StxCheckbox v-model="state.disabled" title="Disabled" />
      <StxSelect v-model="state.size" title="Size" :options="sizeOptions" />
    </template>
  </Variant>

  <!-- Static variants -->
  <Variant title="Primary">
    <Button label="Primary" variant="primary" />
  </Variant>

  <Variant title="Danger" icon="warning" icon-color="#F43F5E">
    <Button label="Delete" variant="danger" />
  </Variant>
</Story>
```

### 3.2 Built-in Control Components

- [x] Create `packages/stx/src/story/controls/` directory
- [x] `StxText` - Text input control
- [x] `StxNumber` - Number input with optional min/max
- [x] `StxSlider` - Range slider control
- [x] `StxCheckbox` - Boolean toggle
- [x] `StxSelect` - Dropdown select
- [x] `StxRadio` - Radio button group
- [x] `StxTextarea` - Multi-line text
- [x] `StxJson` - JSON editor for objects
- [x] `StxColorSelect` - Color picker
- [ ] `StxButtonGroup` - Button group selector

```html
<!-- Control usage in stories -->
<template #controls="{ state }">
  <StxText v-model="state.name" title="Name" />
  <StxNumber v-model="state.count" title="Count" :min="0" :max="100" />
  <StxSlider v-model="state.opacity" title="Opacity" :min="0" :max="1" :step="0.1" />
  <StxCheckbox v-model="state.active" title="Active" />
  <StxSelect v-model="state.size" title="Size" :options="sizeOptions" />
  <StxColorSelect v-model="state.color" title="Color" />
  <StxJson v-model="state.config" title="Config" />
</template>
```

### 3.3 Auto-Generated Stories

- [x] Create `packages/stx/src/story/generator.ts`
- [x] Auto-generate story file for components without `.story.stx`
- [x] Infer controls from component props
- [x] Generate variants for enum/boolean props
- [ ] Support `autoPropsDisabled` to opt-out

```typescript
// Auto-generation for components without explicit stories
export function generateAutoStory(componentPath: string): Story
export function inferControls(props: PropDefinition[]): ControlConfig[]
```

### 3.4 Story Setup Files

- [x] Support global `story.setup.ts` file
- [x] Import global CSS/styles
- [x] Register global components
- [x] Setup global state/context

```typescript
// src/story.setup.ts
import './styles/global.css'
import { registerGlobalComponents } from './components'

export function setupStory({ app }) {
  registerGlobalComponents(app)
  // Any global setup
}
```

---

## Phase 4: Interactive UI

### 4.1 Story Server

- [x] Create `packages/stx/src/story/server.ts`
- [x] Extend existing dev-server infrastructure
- [x] Serve story UI at configured port (default: 6006)
- [x] API endpoints for story data
- [x] WebSocket for HMR (module created)
- [x] Config file watching with auto-restart

```typescript
// server.ts
export async function createStoryServer(
  ctx: StoryContext,
  options: ServerOptions
): Promise<{ server: Server; close: () => Promise<void> }>

export interface ServerOptions {
  port: number
  open?: boolean
  host?: string | boolean
}
```

### 4.2 Story UI Components

- [x] Create `packages/stx/src/story/app/` directory
- [x] Create sidebar with tree navigation (basic)
- [x] Create story canvas with iframe isolation (basic)
- [ ] Create controls panel (collapsible)
- [x] Create toolbar (viewport, background, zoom) (basic)
- [x] Create search with keyboard navigation (search module created)

```text
story/app/
├── App.stx              # Main app shell
├── Sidebar.stx          # Tree navigation
├── StoryView.stx        # Story preview container
├── Toolbar.stx          # Top toolbar
├── ControlsPanel.stx    # Right panel for controls
├── SearchModal.stx      # Cmd+K search
├── TreeItem.stx         # Recursive tree item
├── VariantList.stx      # Variant tabs/list
└── SourceCode.stx       # Code preview panel
```

### 4.3 Props Controls

- [x] Create `packages/stx/src/story/controls/index.ts`
- [x] Text input for string props
- [x] Number input with increment/decrement
- [x] Boolean toggle/checkbox
- [x] Select dropdown for enum props
- [x] Color picker for color props
- [x] JSON editor for object/array props
- [x] Date picker for date props

```typescript
// controls.ts
export function getControlForProp(prop: PropDefinition): ControlConfig

interface ControlConfig {
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'json' | 'date'
  options?: any[]
  min?: number
  max?: number
  step?: number
}
```

### 4.4 Live Preview

- [ ] Real-time component rendering on prop change
- [ ] Iframe isolation for component preview
- [ ] Responsive viewport controls (mobile, tablet, desktop, custom)
- [ ] Zoom controls
- [ ] Background color options
- [ ] Grid/ruler overlay option
- [ ] Side-by-side comparison mode (two prop states)
- [ ] Native window preview via `@stacksjs/desktop` integration
- [ ] Auto-inject Headwind CSS for utility classes

### 4.5 Code Panel

- [ ] Show component source code
- [ ] Show current story code with props
- [ ] Copy code button
- [ ] Syntax highlighting (reuse existing markdown highlighting)
- [ ] "Open in VS Code" button (integrate with vscode extension)
- [ ] Show compiled HTML output toggle

---

## Phase 5: CLI Integration

### 5.1 Story CLI Commands

- [ ] Add `story` command to CLI in `packages/stx/bin/cli.ts`
- [x] Subcommands: `dev`, `build`, `preview`
- [ ] Support all config options as CLI flags

```typescript
// CLI command structure
stx story [command] [options]

// Commands:
//   (default) - Start dev server (same as 'dev')
//   dev       - Start dev server with HMR
//   build     - Build static story site
//   preview   - Preview built site locally

// Options:
//   -p, --port <port>     Server port (default: 6006)
//   --open                Open browser automatically
//   --host <host>         Specify hostname
```

### 5.2 CLI Implementation

- [x] Create `packages/stx/src/story/commands/dev.ts`
- [x] Create `packages/stx/src/story/commands/build.ts`
- [x] Create `packages/stx/src/story/commands/preview.ts`
- [x] Config file watching with auto-restart
- [x] Pretty terminal output without deps

```typescript
// commands/dev.ts
export interface DevOptions {
  port: number
  open?: boolean
  host?: string | boolean
}

export async function devCommand(options: DevOptions) {
  const ctx = await createContext({ mode: 'dev' })
  const { server, close } = await createStoryServer(ctx, options)
  server.printUrls()

  // Watch stx.config.ts for changes
  watchConfigFile(async () => {
    console.log(pc.blue('Config changed, restarting...'))
    await close()
    await devCommand(options)
  })
}
```

### 5.3 Static Build

- [x] Create `packages/stx/src/story/commands/build.ts`
- [x] Generate static HTML/CSS/JS to `outDir`
- [x] Bundle all stories and assets
- [ ] Support hash-based routing for static hosts
- [x] Generate search index

```typescript
// build.ts
export async function buildCommand(options: BuildOptions) {
  const ctx = await createContext({ mode: 'build' })

  console.log(pc.blue('Building histoire...'))

  // Collect all stories
  await collectStories(ctx)

  // Build static assets
  await buildAssets(ctx)

  console.log(pc.green(`Built to ${ctx.config.outDir}`))
}
```

---

## Phase 6: Testing Integration

### 6.1 Visual Regression Testing

- [x] Create `packages/stx/src/story/testing.ts`
- [x] Snapshot each story render
- [x] Compare against baseline snapshots
- [ ] Generate diff images for failures
- [x] Support threshold configuration

```typescript
// testing.ts
export async function runVisualTests(
  options: TestOptions
): Promise<TestResult>

interface TestResult {
  total: number
  passed: number
  failed: number
  failures: TestFailure[]
}

interface TestFailure {
  story: string
  component: string
  diffPath: string
  difference: number  // Percentage
}
```

### 6.2 Snapshot Management

- [x] Create `packages/stx/src/story/testing.ts` (includes snapshot management)
- [x] Store snapshots in `.stx/story/snapshots/`
- [x] Update snapshots command
- [ ] Snapshot versioning
- [x] Git-friendly snapshot format (JSON)

```bash
# Update all snapshots
stx storybook test --update

# Update specific component snapshots
stx storybook test --update --component Button
```

### 6.3 Accessibility Testing

- [x] Integrate with existing a11y module (`packages/stx/src/a11y.ts`) (stub created)
- [ ] Run a11y checks on each story
- [ ] Report violations in test output
- [ ] A11y panel in storybook UI

```typescript
// a11y integration
export async function runA11yTests(
  stories: Story[]
): Promise<A11yTestResult>
```

### 6.4 Interaction Testing

- [ ] Support `@interaction` blocks in stories
- [ ] Simulate user interactions (click, type, etc.)
- [ ] Assert component state after interactions
- [ ] Integration with Bun test runner

```html
<!-- Button.stories.stx -->
@story('Click Handler')
<Button label="Click me" @click="handleClick" />
@endstory

@interaction('Click Handler')
  await click('button')
  expect(clicked).toBe(true)
@endinteraction
```

---

## Phase 7: Advanced Features

### 7.1 Addon System

- [x] Create `packages/stx/src/story/addons.ts`
- [x] Define addon API
- [x] Built-in addons: Actions, Viewport, Backgrounds, Docs
- [x] Support third-party addons
- [x] Addon panel registration

```typescript
// addons.ts
export interface StorybookAddon {
  name: string
  id: string
  panel?: AddonPanel
  decorator?: StoryDecorator
  toolbar?: ToolbarItem
}

export function registerAddon(addon: StorybookAddon): void
export function getAddons(): StorybookAddon[]
```

### 7.2 Built-in Addons

- [x] **Actions**: Log component events
- [x] **Viewport**: Responsive preview sizes
- [x] **Backgrounds**: Change preview background
- [x] **Docs**: Auto-generated documentation
- [x] **Measure**: Spacing/sizing overlay
- [x] **Outline**: Component boundaries
- [ ] **i18n**: Test components with different locales (integrate with `packages/stx/src/i18n.ts`)
- [ ] **A11y**: Real-time accessibility audit panel
- [ ] **Performance**: Render timing metrics
- [ ] **State**: Component state inspector

### 7.3 Component Composition

- [ ] Show component dependency graph
- [ ] Navigate to child components
- [ ] Inline editing of nested components
- [ ] Composition preview mode

### 7.4 Theme Support

- [ ] Light/dark mode toggle
- [ ] Custom theme configuration
- [ ] Theme preview for components
- [ ] CSS variables support
- [ ] Export theme tokens to JSON/CSS

### 7.5 Search & Navigation

- [x] Full-text search across components
- [x] Search by prop name/type
- [x] Search by tag/category
- [ ] Keyboard navigation (↑↓ arrows, Enter)
- [ ] Recent components list

### 7.6 Hot Module Reload

- [x] Integrate with existing HMR system (`packages/stx/src/hot-reload.ts`) (hmr.ts created)
- [ ] Preserve control state on reload
- [ ] Preserve selected story on reload
- [x] Fast refresh for story changes (file watching implemented)

---

## Phase 8: Documentation & Polish

### 8.1 Auto-Generated Docs

- [x] Create `packages/stx/src/story/docs-generator.ts`
- [x] Generate markdown docs from component analysis
- [x] Include prop tables
- [x] Include usage examples
- [ ] Include story previews

### 8.2 MDX-like Support

- [ ] Support `.stories.md` files
- [ ] Embed component previews in markdown
- [ ] Custom documentation pages
- [ ] Link between docs and stories

```markdown
<!-- Button.stories.md -->
# Button Component

The Button component is used for user interactions.

## Props

<PropsTable component="Button" />

## Examples

<Story name="Primary" />

## Usage

\`\`\`stx
<Button label="Click me" variant="primary" />
\`\`\`
```

### 8.3 Export Options

- [x] Export as static site (build command)
- [x] Export component catalog JSON
- [x] Export documentation (markdown, HTML)
- [x] Export design tokens
- [ ] Export as web components (integrate with `web-components.ts`)
- [ ] Figma/design tool integration export

### 8.4 Performance Optimization

- [ ] Lazy load component previews
- [ ] Virtual scrolling for large component lists
- [ ] Cache component analysis
- [ ] Incremental builds

### 8.5 Error Handling

- [ ] Graceful error display in preview
- [ ] Component error boundaries
- [ ] Clear error messages for story issues
- [ ] Recovery suggestions

### 8.6 User Documentation

- [ ] Add storybook section to main README
- [ ] Create `docs/storybook.md` guide
- [ ] Add inline help in storybook UI
- [ ] Example project with stories

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)

1. Phase 1.1-1.3: Core infrastructure and types
2. Phase 2.1-2.2: Component scanning and analysis
3. Phase 5.1: Basic CLI command

### Sprint 2: Basic UI (Week 3-4)

1. Phase 4.1: Storybook server
2. Phase 4.2: Basic UI components
3. Phase 3.1-3.2: Story parsing and generation

### Sprint 3: Interactive Features (Week 5-6)

1. Phase 4.3-4.4: Props controls and live preview
2. Phase 4.5: Code panel
3. Phase 2.3: Prop type inference

### Sprint 4: Testing & Build (Week 7-8)

1. Phase 6.1-6.2: Visual regression testing
2. Phase 5.3: Static build
3. Phase 6.3: A11y testing

### Sprint 5: Advanced Features (Week 9-10)

1. Phase 7.1-7.2: Addon system
2. Phase 7.5-7.6: Search and HMR
3. Phase 3.3: Decorators

### Sprint 6: Polish (Week 11-12)

1. Phase 8.1-8.2: Documentation generation
2. Phase 8.4-8.5: Performance and error handling
3. Phase 8.6: User documentation

---

## File Structure

```text
packages/stx/src/story/
├── index.ts              # Internal module (re-exported from stx)
├── types.ts              # Type definitions
├── config.ts             # Configuration loading/merging
├── context.ts            # Story context object
├── commands/
│   ├── dev.ts            # Dev server command
│   ├── build.ts          # Build command
│   └── preview.ts        # Preview command
├── collect/
│   ├── scanner.ts        # Story file discovery
│   ├── parser.ts         # Story file parsing
│   └── tree.ts           # Tree structure generation
├── server.ts             # Dev server setup
├── build.ts              # Static build
├── search.ts             # Search index generation
├── controls/             # Built-in control components
│   ├── StxText.stx
│   ├── StxNumber.stx
│   ├── StxCheckbox.stx
│   ├── StxSelect.stx
│   ├── StxSlider.stx
│   ├── StxRadio.stx
│   ├── StxTextarea.stx
│   ├── StxJson.stx
│   ├── StxColorSelect.stx
│   └── index.ts
└── app/                  # Story UI app
    ├── App.stx
    ├── Sidebar.stx
    ├── StoryView.stx
    ├── Toolbar.stx
    ├── ControlsPanel.stx
    ├── SearchModal.stx
    └── styles/
```

---

## Dependencies

### Internal Dependencies

- `packages/stx/src/dev-server.ts` - Server infrastructure
- `packages/stx/src/hot-reload.ts` - HMR system
- `packages/stx/src/docs.ts` - Documentation generation
- `packages/stx/src/a11y.ts` - Accessibility testing
- `packages/stx/src/components.ts` - Component rendering
- `packages/stx/src/analyzer.ts` - Code analysis
- `packages/stx/src/i18n.ts` - Internationalization for locale testing
- `packages/stx/src/web-components.ts` - Web component generation
- `packages/desktop` - Native window support
- `@stacksjs/headwind` - CSS utility generation

### No External Dependencies Required

- Use existing Bun server capabilities
- Use existing stx template rendering
- Use existing syntax highlighting
- Use existing HMR WebSocket infrastructure

---

## Success Criteria

- [ ] `stx story dev` starts server and opens browser
- [ ] All `.stx` components auto-discovered and displayed
- [ ] Props can be edited interactively with live preview
- [ ] Stories can be defined in `.story.stx` files
- [ ] Static build generates deployable site
- [ ] Visual regression tests catch UI changes
- [ ] Documentation auto-generated from components
- [ ] Performance: <100ms component switch, <1s initial load
- [ ] Zero external dependencies for core functionality
- [ ] Works with existing `examples/components/` directory out of the box
- [ ] Integrates with VS Code extension for "Open in Story" action
- [ ] Keyboard shortcuts work (h for help, o for open, q for quit)
- [ ] Component search finds by name, prop, or tag

---

## Edge Cases & Considerations

### Component Edge Cases

- [ ] Handle components with no props (still show preview)
- [ ] Handle components with complex nested props (objects, arrays)
- [ ] Handle components that require async data loading
- [ ] Handle components with circular dependencies
- [ ] Handle components using `@extends` layouts
- [ ] Handle components with `@push`/`@stack` directives
- [ ] Handle components that use `@js`/`@ts` blocks

### Story Edge Cases

- [ ] Stories with async setup/teardown
- [ ] Stories that modify global state
- [ ] Stories with timer-based animations
- [ ] Stories requiring specific viewport sizes
- [ ] Stories with external API dependencies (mock support)

### Performance Edge Cases

- [ ] Projects with 100+ components
- [ ] Components with large prop objects
- [ ] Components rendering large lists
- [ ] Rapid prop changes (debouncing)

---

## Quick Start Implementation

For MVP, implement in this order:

1. **Day 1-2**: Scanner + basic analyzer (find all `.stx` files, extract props)
2. **Day 3-4**: Basic server + sidebar UI (list components, click to select)
3. **Day 5-6**: Canvas + simple controls (render component, edit string/boolean props)
4. **Day 7**: CLI command (`stx story` starts everything)

This gives a working prototype in ~1 week that can be iterated on.
