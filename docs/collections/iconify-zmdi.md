# Material Design Iconic Font

> Material Design Iconic Font icons for stx from Iconify

## Overview

This package provides access to 777 icons from the Material Design Iconic Font collection through the stx iconify integration.

**Collection ID:** `zmdi`
**Total Icons:** 777
**Author:** MDI Community ([Website](https://github.com/zavoloklom/material-design-iconic-font))
**License:** Open Font License

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-zmdi
```

## Quick Start

### In stx Templates

```html
@js
  import { 3dRotation, 500px, 8tracks } from '@stacksjs/iconify-zmdi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3dRotation: renderIcon(3dRotation, { size: 24 }),
    500px: renderIcon(500px, { size: 24, color: '#4a90e2' }),
    8tracks: renderIcon(8tracks, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3dRotation !!}
  {!! icons.500px !!}
  {!! icons.8tracks !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3dRotation, 500px, 8tracks } from '@stacksjs/iconify-zmdi'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3dRotation, { size: 24 })

// With custom color
const coloredIcon = renderIcon(500px, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(8tracks, {
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

This package contains **777** icons. Here are some examples:

- `3dRotation`
- `500px`
- `8tracks`
- `account`
- `accountAdd`

...and 767 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/zmdi/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dRotation, 500px, 8tracks, account } from '@stacksjs/iconify-zmdi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3dRotation: renderIcon(3dRotation, { size: 20, class: 'nav-icon' }),
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    8tracks: renderIcon(8tracks, { size: 20, class: 'nav-icon' }),
    account: renderIcon(account, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3dRotation !!} Home</a>
  <a href="/about">{!! navIcons.500px !!} About</a>
  <a href="/contact">{!! navIcons.8tracks !!} Contact</a>
  <a href="/settings">{!! navIcons.account !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3dRotation } from '@stacksjs/iconify-zmdi'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3dRotation, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-zmdi'
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
   import { 3dRotation, 500px } from '@stacksjs/iconify-zmdi'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-zmdi'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dRotation } from '@stacksjs/iconify-zmdi'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3dRotation, { size: 24 })
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
import { 3dRotation } from '@stacksjs/iconify-zmdi'

// Icons are typed as IconData
const myIcon: IconData = 3dRotation
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License



## Credits

- **Icons**: MDI Community ([Website](https://github.com/zavoloklom/material-design-iconic-font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/zmdi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/zmdi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
