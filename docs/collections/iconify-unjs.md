# UnJS Logos

> UnJS Logos icons for stx from Iconify

## Overview

This package provides access to 63 icons from the UnJS Logos collection through the stx iconify integration.

**Collection ID:** `unjs`
**Total Icons:** 63
**Author:** UnJS ([Website](https://github.com/unjs))
**License:** Apache 2.0
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-unjs
```

## Quick Start

### In stx Templates

```html
@js
  import { automd, bundleRunner, c12 } from '@stacksjs/iconify-unjs'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    automd: renderIcon(automd, { size: 24 }),
    bundleRunner: renderIcon(bundleRunner, { size: 24, color: '#4a90e2' }),
    c12: renderIcon(c12, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.automd !!}
  {!! icons.bundleRunner !!}
  {!! icons.c12 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { automd, bundleRunner, c12 } from '@stacksjs/iconify-unjs'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(automd, { size: 24 })

// With custom color
const coloredIcon = renderIcon(bundleRunner, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(c12, {
  size: 24,
  rotate: 90,
  hFlip: true
})
```

## Icon Options

The `renderIcon` function accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (both width and height) |
| `width` | `string \| number` | - | Icon width |
| `height` | `string \| number` | - | Icon height |
| `color` | `string` | `'currentColor'` | Icon color (hex or CSS color) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Additional inline styles |

## Available Icons

This package contains **63** icons. Here are some examples:

- `automd`
- `bundleRunner`
- `c12`
- `changelogen`
- `citty`

...and 53 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/unjs/).

## Usage Examples

### Navigation Menu

```html
@js
  import { automd, bundleRunner, c12, changelogen } from '@stacksjs/iconify-unjs'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    automd: renderIcon(automd, { size: 20, class: 'nav-icon' }),
    bundleRunner: renderIcon(bundleRunner, { size: 20, class: 'nav-icon' }),
    c12: renderIcon(c12, { size: 20, class: 'nav-icon' }),
    changelogen: renderIcon(changelogen, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.automd !!} Home</a>
  <a href="/about">{!! navIcons.bundleRunner !!} About</a>
  <a href="/contact">{!! navIcons.c12 !!} Contact</a>
  <a href="/settings">{!! navIcons.changelogen !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { automd } from '@stacksjs/iconify-unjs'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(automd, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-unjs'
import { renderIcon } from '@stacksjs/iconify-core'

function getIcon(name: string) {
  const iconData = icons[name]
  if (!iconData) return null

  return renderIcon(iconData, { size: 24 })
}
```

## Best Practices

1. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good
   import { automd, bundleRunner } from '@stacksjs/iconify-unjs'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-unjs'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { automd } from '@stacksjs/iconify-unjs'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(automd, { size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   ```

3. **Use CSS for Theming**: Apply consistent styling through CSS classes
   ```css
   .icon {
     color: currentColor;
     opacity: 0.8;
     transition: opacity 0.2s;
   }

   .icon:hover {
     opacity: 1;
   }
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { automd } from '@stacksjs/iconify-unjs'

// Icons are typed as IconData
const myIcon: IconData = automd
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0



## Credits

- **Icons**: UnJS ([Website](https://github.com/unjs))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/unjs/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/unjs/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
