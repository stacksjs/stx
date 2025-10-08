# Marketeq

> Marketeq icons for stx from Iconify

## Overview

This package provides access to 590 icons from the Marketeq collection through the stx iconify integration.

**Collection ID:** `marketeq`
**Total Icons:** 590
**Author:** Marketeq
**License:** MIT
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-marketeq
```

## Quick Start

### In stx Templates

```html
@js
  import { 1stPlace, 2k, 2ndPlace } from '@stacksjs/iconify-marketeq'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    1stPlace: renderIcon(1stPlace, { size: 24 }),
    2k: renderIcon(2k, { size: 24, color: '#4a90e2' }),
    2ndPlace: renderIcon(2ndPlace, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.1stPlace !!}
  {!! icons.2k !!}
  {!! icons.2ndPlace !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 1stPlace, 2k, 2ndPlace } from '@stacksjs/iconify-marketeq'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(1stPlace, { size: 24 })

// With custom color
const coloredIcon = renderIcon(2k, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(2ndPlace, {
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

This package contains **590** icons. Here are some examples:

- `1stPlace`
- `2k`
- `2ndPlace`
- `3rdPlace`
- `4k2`

...and 580 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/marketeq/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 1stPlace, 2k, 2ndPlace, 3rdPlace } from '@stacksjs/iconify-marketeq'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    1stPlace: renderIcon(1stPlace, { size: 20, class: 'nav-icon' }),
    2k: renderIcon(2k, { size: 20, class: 'nav-icon' }),
    2ndPlace: renderIcon(2ndPlace, { size: 20, class: 'nav-icon' }),
    3rdPlace: renderIcon(3rdPlace, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.1stPlace !!} Home</a>
  <a href="/about">{!! navIcons.2k !!} About</a>
  <a href="/contact">{!! navIcons.2ndPlace !!} Contact</a>
  <a href="/settings">{!! navIcons.3rdPlace !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 1stPlace } from '@stacksjs/iconify-marketeq'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(1stPlace, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-marketeq'
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
   import { 1stPlace, 2k } from '@stacksjs/iconify-marketeq'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-marketeq'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 1stPlace } from '@stacksjs/iconify-marketeq'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(1stPlace, { size: 24 })
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
import { 1stPlace } from '@stacksjs/iconify-marketeq'

// Icons are typed as IconData
const myIcon: IconData = 1stPlace
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Marketeq
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/marketeq/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/marketeq/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
