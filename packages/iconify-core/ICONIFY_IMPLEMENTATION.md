# Iconify Integration Implementation

## Overview

Successfully implemented lightweight Iconify SVG CSS support for stx with the following features:

✅ **200+ Icon Collections** - Access to all Iconify collections (275k+ icons)
✅ **On-Demand Generation** - Generate icon packages as needed
✅ **Tree-Shakeable** - Import only the icons you use
✅ **Lightweight** - Pure SVG with zero runtime dependencies
✅ **TypeScript Support** - Full type safety
✅ **Customizable** - Size, color, rotation, flip transformations

## Architecture

### Packages Created

1. **@stx/iconify-core** (`packages/iconify-core/`)
   - Core rendering utilities
   - Icon data types and interfaces
   - SVG generation functions

2. **@stx/iconify-generator** (`packages/iconify-generator/`)
   - CLI tool for generating icon packages
   - Fetches data from Iconify API
   - Generates TypeScript icon components
   - Creates complete packages with build scripts

3. **@stx/iconify-{collection}** (generated on demand)
   - Individual icon collection packages
   - Example: `@stx/iconify-lucide`
   - Each icon is a separate TypeScript module
   - Fully tree-shakeable

## CLI Commands

### List available collections
```bash
stx iconify list
```

### Generate a complete collection
```bash
stx iconify generate lucide
```

### Generate specific icons
```bash
stx iconify generate lucide --icons home,settings,user
```

### Custom output directory
```bash
stx iconify generate mdi --output ./my-packages
```

## Usage Examples

### In stx Templates

```html
@js
  import { home, settings, user } from '@stx/iconify-lucide'
  import { renderIcon } from '@stx/iconify-core'

  global.homeIcon = renderIcon(home, { size: 24 })
  global.settingsIcon = renderIcon(settings, { size: 24, color: '#4a90e2' })
@endjs

<nav>
  <a href="/">{!! homeIcon !!} Home</a>
  <a href="/settings">{!! settingsIcon !!} Settings</a>
</nav>
```

### In TypeScript/JavaScript

```typescript
import { home, settings } from '@stx/iconify-lucide'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 32,
  color: '#ff0000',
  rotate: 90
})
```

## Files Created

### Core Files
- `packages/iconify-core/src/index.ts` - Core utilities
- `packages/iconify-core/package.json`
- `packages/iconify-core/build.ts`
- `packages/iconify-core/README.md`

### Generator Files
- `packages/iconify-generator/src/index.ts` - Generator logic
- `packages/iconify-generator/src/cli.ts` - CLI interface
- `packages/iconify-generator/package.json`
- `packages/iconify-generator/build.ts`
- `packages/iconify-generator/README.md`

### CLI Integration
- `packages/stx/bin/cli.ts` - Added iconify command

### Documentation
- `docs/iconify.md` - Complete usage guide
- `examples/iconify/demo.stx` - Live example

### Example Package (Lucide)
- `packages/iconify-lucide/` - Generated test package with 3 icons

## Features Implemented

### Icon Rendering Options
- ✅ Size (width/height)
- ✅ Color customization
- ✅ Horizontal/vertical flip
- ✅ Rotation (0, 90, 180, 270 degrees)
- ✅ Custom CSS classes
- ✅ Inline styles

### Generator Features
- ✅ Fetch from Iconify API
- ✅ Generate full collections
- ✅ Generate specific icons only
- ✅ Custom output directories
- ✅ Automatic TypeScript generation
- ✅ Package.json generation
- ✅ Build script generation
- ✅ README generation

### CLI Features
- ✅ List all available collections
- ✅ Generate icon packages
- ✅ Select specific icons
- ✅ Custom output directory

## Testing

Successfully tested with Lucide icons:
```bash
# Generated package
stx iconify generate lucide --icons home,settings,user

# Built package
cd packages/iconify-lucide
bun run build

# Result: Working icon components with full TypeScript support
```

## Next Steps (Optional Enhancements)

1. **Workspace Integration**: Add iconify packages to workspace config
2. **Auto-generation**: Add pre-commit hooks to auto-generate commonly used icon sets
3. **Caching**: Add local caching of Iconify API responses
4. **CSS Generation**: Generate CSS sprite sheets as an alternative to inline SVG
5. **Web Component Wrapper**: Create web component versions of icons
6. **Icon Search**: Add CLI command to search icons by keyword
7. **Batch Generation**: Support generating multiple collections at once

## Documentation

- Main guide: `docs/iconify.md`
- Core package: `packages/iconify-core/README.md`
- Generator package: `packages/iconify-generator/README.md`
- Example demo: `examples/iconify/demo.stx`

## Popular Collections Available

- lucide (1,636 icons)
- mdi (7,447 icons)
- tabler (5,963 icons)
- solar (7,401 icons)
- mingcute (3,098 icons)
- ri (3,058 icons)
- carbon (2,365 icons)
- ...and 200+ more!

Run `stx iconify list` to see all available collections.
