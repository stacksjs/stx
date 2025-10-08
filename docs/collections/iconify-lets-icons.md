# Lets Icons

> Lets Icons icons for stx from Iconify

## Overview

This package provides access to 1544 icons from the Lets Icons collection through the stx iconify integration.

**Collection ID:** `lets-icons`
**Total Icons:** 1544
**Author:** Leonid Tsvetkov ([Website](https://www.figma.com/community/file/886554014393250663))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lets-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { 10, 10Light, 3dBox } from '@stacksjs/iconify-lets-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    10: renderIcon(10, { size: 24 }),
    10Light: renderIcon(10Light, { size: 24, color: '#4a90e2' }),
    3dBox: renderIcon(3dBox, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.10 !!}
  {!! icons.10Light !!}
  {!! icons.3dBox !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 10, 10Light, 3dBox } from '@stacksjs/iconify-lets-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(10, { size: 24 })

// With custom color
const coloredIcon = renderIcon(10Light, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3dBox, {
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

This package contains **1544** icons. Here are some examples:

- `10`
- `10Light`
- `3dBox`
- `3dBoxDuotone`
- `3dBoxFill`

...and 1534 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/lets-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 10, 10Light, 3dBox, 3dBoxDuotone } from '@stacksjs/iconify-lets-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    10: renderIcon(10, { size: 20, class: 'nav-icon' }),
    10Light: renderIcon(10Light, { size: 20, class: 'nav-icon' }),
    3dBox: renderIcon(3dBox, { size: 20, class: 'nav-icon' }),
    3dBoxDuotone: renderIcon(3dBoxDuotone, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.10 !!} Home</a>
  <a href="/about">{!! navIcons.10Light !!} About</a>
  <a href="/contact">{!! navIcons.3dBox !!} Contact</a>
  <a href="/settings">{!! navIcons.3dBoxDuotone !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 10 } from '@stacksjs/iconify-lets-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(10, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-lets-icons'
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
   import { 10, 10Light } from '@stacksjs/iconify-lets-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-lets-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 10 } from '@stacksjs/iconify-lets-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(10, { size: 24 })
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
import { 10 } from '@stacksjs/iconify-lets-icons'

// Icons are typed as IconData
const myIcon: IconData = 10
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Leonid Tsvetkov ([Website](https://www.figma.com/community/file/886554014393250663))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lets-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lets-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
