# Pixelarticons

> Pixelarticons icons for stx from Iconify

## Overview

This package provides access to 486 icons from the Pixelarticons collection through the stx iconify integration.

**Collection ID:** `pixelarticons`
**Total Icons:** 486
**Author:** Gerrit Halfmann ([Website](https://github.com/halfmage/pixelarticons))
**License:** MIT ([Details](https://github.com/halfmage/pixelarticons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pixelarticons
```

## Quick Start

### In stx Templates

```html
@js
  import { 4g, 4k, 4kBox } from '@stacksjs/iconify-pixelarticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    4g: renderIcon(4g, { size: 24 }),
    4k: renderIcon(4k, { size: 24, color: '#4a90e2' }),
    4kBox: renderIcon(4kBox, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.4g !!}
  {!! icons.4k !!}
  {!! icons.4kBox !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 4g, 4k, 4kBox } from '@stacksjs/iconify-pixelarticons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(4g, { size: 24 })

// With custom color
const coloredIcon = renderIcon(4k, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(4kBox, {
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

This package contains **486** icons. Here are some examples:

- `4g`
- `4k`
- `4kBox`
- `5g`
- `abTesting`

...and 476 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/pixelarticons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 4g, 4k, 4kBox, 5g } from '@stacksjs/iconify-pixelarticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    4g: renderIcon(4g, { size: 20, class: 'nav-icon' }),
    4k: renderIcon(4k, { size: 20, class: 'nav-icon' }),
    4kBox: renderIcon(4kBox, { size: 20, class: 'nav-icon' }),
    5g: renderIcon(5g, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.4g !!} Home</a>
  <a href="/about">{!! navIcons.4k !!} About</a>
  <a href="/contact">{!! navIcons.4kBox !!} Contact</a>
  <a href="/settings">{!! navIcons.5g !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 4g } from '@stacksjs/iconify-pixelarticons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(4g, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-pixelarticons'
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
   import { 4g, 4k } from '@stacksjs/iconify-pixelarticons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-pixelarticons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 4g } from '@stacksjs/iconify-pixelarticons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(4g, { size: 24 })
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
import { 4g } from '@stacksjs/iconify-pixelarticons'

// Icons are typed as IconData
const myIcon: IconData = 4g
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/halfmage/pixelarticons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Gerrit Halfmann ([Website](https://github.com/halfmage/pixelarticons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pixelarticons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pixelarticons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
