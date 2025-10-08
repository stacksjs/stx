# Pico-icon

> Pico-icon icons for stx from Iconify

## Overview

This package provides access to 824 icons from the Pico-icon collection through the stx iconify integration.

**Collection ID:** `picon`
**Total Icons:** 824
**Author:** Picon Contributors ([Website](https://github.com/yne/picon))
**License:** Open Font License ([Details](https://github.com/yne/picon/blob/master/OFL.txt))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-picon
```

## Quick Start

### In stx Templates

```html
@js
  import { 2g, 3g, 4chan } from '@stacksjs/iconify-picon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    2g: renderIcon(2g, { size: 24 }),
    3g: renderIcon(3g, { size: 24, color: '#4a90e2' }),
    4chan: renderIcon(4chan, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.2g !!}
  {!! icons.3g !!}
  {!! icons.4chan !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 2g, 3g, 4chan } from '@stacksjs/iconify-picon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(2g, { size: 24 })

// With custom color
const coloredIcon = renderIcon(3g, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(4chan, {
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

This package contains **824** icons. Here are some examples:

- `2g`
- `3g`
- `4chan`
- `4g`
- `4k`

...and 814 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/picon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 2g, 3g, 4chan, 4g } from '@stacksjs/iconify-picon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    2g: renderIcon(2g, { size: 20, class: 'nav-icon' }),
    3g: renderIcon(3g, { size: 20, class: 'nav-icon' }),
    4chan: renderIcon(4chan, { size: 20, class: 'nav-icon' }),
    4g: renderIcon(4g, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.2g !!} Home</a>
  <a href="/about">{!! navIcons.3g !!} About</a>
  <a href="/contact">{!! navIcons.4chan !!} Contact</a>
  <a href="/settings">{!! navIcons.4g !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 2g } from '@stacksjs/iconify-picon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(2g, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-picon'
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
   import { 2g, 3g } from '@stacksjs/iconify-picon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-picon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2g } from '@stacksjs/iconify-picon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(2g, { size: 24 })
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
import { 2g } from '@stacksjs/iconify-picon'

// Icons are typed as IconData
const myIcon: IconData = 2g
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://github.com/yne/picon/blob/master/OFL.txt) for more information.

## Credits

- **Icons**: Picon Contributors ([Website](https://github.com/yne/picon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/picon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/picon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
