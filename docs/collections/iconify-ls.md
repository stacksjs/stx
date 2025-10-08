# Ligature Symbols

> Ligature Symbols icons for stx from Iconify

## Overview

This package provides access to 348 icons from the Ligature Symbols collection through the stx iconify integration.

**Collection ID:** `ls`
**Total Icons:** 348
**Author:** Kazuyuki Motoyama ([Website](https://github.com/kudakurage/LigatureSymbols))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ls
```

## Quick Start

### In stx Templates

```html
@js
  import { 0, 1, 2 } from '@stacksjs/iconify-ls'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    0: renderIcon(0, { size: 24 }),
    1: renderIcon(1, { size: 24, color: '#4a90e2' }),
    2: renderIcon(2, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.0 !!}
  {!! icons.1 !!}
  {!! icons.2 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 0, 1, 2 } from '@stacksjs/iconify-ls'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(0, { size: 24 })

// With custom color
const coloredIcon = renderIcon(1, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(2, {
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

This package contains **348** icons. Here are some examples:

- `0`
- `1`
- `2`
- `3`
- `4`

...and 338 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ls/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 0, 1, 2, 3 } from '@stacksjs/iconify-ls'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    0: renderIcon(0, { size: 20, class: 'nav-icon' }),
    1: renderIcon(1, { size: 20, class: 'nav-icon' }),
    2: renderIcon(2, { size: 20, class: 'nav-icon' }),
    3: renderIcon(3, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.0 !!} Home</a>
  <a href="/about">{!! navIcons.1 !!} About</a>
  <a href="/contact">{!! navIcons.2 !!} Contact</a>
  <a href="/settings">{!! navIcons.3 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 0 } from '@stacksjs/iconify-ls'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(0, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ls'
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
   import { 0, 1 } from '@stacksjs/iconify-ls'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ls'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0 } from '@stacksjs/iconify-ls'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(0, { size: 24 })
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
import { 0 } from '@stacksjs/iconify-ls'

// Icons are typed as IconData
const myIcon: IconData = 0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Kazuyuki Motoyama ([Website](https://github.com/kudakurage/LigatureSymbols))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ls/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ls/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
