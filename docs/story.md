# STX Story

STX Story is a native component explorer and testing tool for STX components. It provides automatic component discovery, interactive prop editing, visual regression testing, and documentation generation.

## Quick Start

```bash
# Start the story development server
stx story

# Or explicitly
stx story dev

# Build static site
stx story build

# Preview built site
stx story preview

# Run visual regression tests
stx story test
```

## Configuration

Add story configuration to your `stx.config.ts`:

```typescript
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  story: {
    // Enable/disable the story feature
    enabled: true,

    // Output directory for built site
    outDir: '.stx/dist/story',

    // Glob patterns to match story files
    storyMatch: ['**/*.story.stx'],

    // Patterns to ignore
    storyIgnored: ['**/node_modules/**'],

    // Server port
    port: 6006,

    // Theme configuration
    theme: {
      title: 'My Components',
      defaultColorScheme: 'auto',
    },

    // Responsive viewport presets
    responsivePresets: [
      { label: 'Mobile', width: 375, height: 667 },
      { label: 'Tablet', width: 768, height: 1024 },
      { label: 'Desktop', width: 1280, height: 800 },
    ],

    // Background presets
    backgroundPresets: [
      { label: 'Light', color: '#ffffff' },
      { label: 'Dark', color: '#1a1a1a' },
      { label: 'Gray', color: '#f5f5f5' },
    ],
  },
})
```

## Writing Stories

Create a `.story.stx` file next to your component:

```html
<!-- Button.story.stx -->
<script>
import Button from './Button.stx'

function initState() {
  return {
    label: 'Click me',
    variant: 'primary',
    disabled: false,
  }
}

const variantOptions = ['primary', 'secondary', 'danger']
</script>

<Story title="Button">
  <!-- Playground variant with controls -->
  <Variant title="Playground" :init-state="initState">
    <template #default="{ state }">
      <Button
        :label="state.label"
        :variant="state.variant"
        :disabled="state.disabled"
      />
    </template>

    <template #controls="{ state }">
      <StxText v-model="state.label" title="Label" />
      <StxSelect v-model="state.variant" title="Variant" :options="variantOptions" />
      <StxCheckbox v-model="state.disabled" title="Disabled" />
    </template>
  </Variant>

  <!-- Static variants -->
  <Variant title="Primary">
    <Button label="Primary" variant="primary" />
  </Variant>

  <Variant title="Secondary">
    <Button label="Secondary" variant="secondary" />
  </Variant>

  <Variant title="Disabled">
    <Button label="Disabled" disabled />
  </Variant>
</Story>
```

## Built-in Controls

STX Story includes several built-in control components:

| Control | Description |
|---------|-------------|
| `StxText` | Text input |
| `StxNumber` | Number input with min/max |
| `StxSlider` | Range slider |
| `StxCheckbox` | Boolean toggle |
| `StxSelect` | Dropdown select |
| `StxRadio` | Radio button group |
| `StxTextarea` | Multi-line text |
| `StxJson` | JSON editor |
| `StxColorSelect` | Color picker |
| `StxButtonGroup` | Button group selector |

## Auto-Generated Stories

Components without explicit `.story.stx` files will have stories auto-generated based on their props. You can disable this globally or per-story:

```typescript
// stx.config.ts
export default defineConfig({
  story: {
    autoPropsDisabled: true, // Disable globally
  },
})
```

Or per-story:

```html
<Story title="Button" auto-props-disabled>
  <!-- Custom controls only -->
</Story>
```

## Visual Regression Testing

Run visual regression tests to catch UI changes:

```bash
# Run tests
stx story test

# Update snapshots
stx story test --update

# Filter by component
stx story test --filter Button
```

Snapshots are stored in `.stx/story/snapshots/`.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `h` | Show help |
| `o` | Open in browser |
| `r` | Restart server |
| `c` | Clear console |
| `q` | Quit |

## Addons

STX Story includes several built-in addons:

- **Actions**: Log component events
- **Viewport**: Responsive preview sizes
- **Backgrounds**: Change preview background
- **Docs**: Auto-generated documentation
- **Measure**: Spacing/sizing overlay
- **Outline**: Component boundaries
- **i18n**: Test with different locales
- **A11y**: Accessibility audit panel
- **Performance**: Render timing metrics
- **State**: Component state inspector

## API Reference

### CLI Commands

```bash
stx story [command] [options]

Commands:
  dev       Start development server (default)
  build     Build static site
  preview   Preview built site
  test      Run visual regression tests

Options:
  -p, --port <port>   Server port
  -o, --open          Open browser automatically
  --host <host>       Host to bind to
```

### Programmatic API

```typescript
import {
  createContext,
  createStoryServer,
  scanStoryFiles,
  analyzeComponent,
  buildTree,
  runVisualTests,
} from '@stacksjs/stx/story'

// Create context
const ctx = await createContext({ mode: 'dev' })

// Scan for story files
const files = await scanStoryFiles(ctx)

// Analyze a component
const component = await analyzeComponent(filePath)

// Build navigation tree
const tree = buildTree(ctx.config, files)

// Start server
const server = await createStoryServer(ctx, { port: 6006 })

// Run tests
const results = await runVisualTests(ctx)
```

## Setup File

Create a `story.setup.ts` file for global configuration:

```typescript
// src/story.setup.ts
import './styles/global.css'

export function setupStory({ storyContext, registerComponent, addCSS }) {
  // Register global components
  registerComponent('Icon', IconComponent)

  // Add global CSS
  addCSS(`
    :root {
      --primary: #3b82f6;
    }
  `)
}
```

Configure in `stx.config.ts`:

```typescript
export default defineConfig({
  story: {
    setupFile: './src/story.setup.ts',
  },
})
```

## Interaction Testing

Define interaction tests in your stories:

```html
@interaction('Click Handler')
  await click('button')
  expect('button').toHaveClass('active')
@endinteraction
```

## Theme Customization

Customize the story UI theme:

```typescript
export default defineConfig({
  story: {
    theme: {
      title: 'My Design System',
      logo: '/logo.svg',
      defaultColorScheme: 'dark',
      colors: {
        primary: '#3b82f6',
        background: '#1a1a1a',
      },
    },
  },
})
```

## Export Options

Export your component documentation:

```typescript
import { generateDocs, exportDesignTokens } from '@stacksjs/stx/story'

// Generate markdown docs
await generateDocs(ctx, components, { outDir: './docs' })

// Export design tokens
const tokens = exportDesignTokens(components)
```
