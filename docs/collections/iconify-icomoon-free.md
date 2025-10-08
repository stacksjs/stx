# IcoMoon Free

> IcoMoon Free icons for stx from Iconify

## Overview

This package provides access to 491 icons from the IcoMoon Free collection through the stx iconify integration.

**Collection ID:** `icomoon-free`
**Total Icons:** 491
**Author:** Keyamoon ([Website](https://github.com/Keyamoon/IcoMoon-Free))
**License:** GPL ([Details](https://www.gnu.org/licenses/gpl.html))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icomoon-free
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, accessibility, addressBook } from '@stacksjs/iconify-icomoon-free'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    accessibility: renderIcon(accessibility, { size: 24, color: '#4a90e2' }),
    addressBook: renderIcon(addressBook, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.accessibility !!}
  {!! icons.addressBook !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, accessibility, addressBook } from '@stacksjs/iconify-icomoon-free'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibility, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addressBook, {
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

This package contains **491** icons. Here are some examples:

- `500px`
- `accessibility`
- `addressBook`
- `aidKit`
- `airplane`

...and 481 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/icomoon-free/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, accessibility, addressBook, aidKit } from '@stacksjs/iconify-icomoon-free'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    addressBook: renderIcon(addressBook, { size: 20, class: 'nav-icon' }),
    aidKit: renderIcon(aidKit, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.accessibility !!} About</a>
  <a href="/contact">{!! navIcons.addressBook !!} Contact</a>
  <a href="/settings">{!! navIcons.aidKit !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-icomoon-free'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-icomoon-free'
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
   import { 500px, accessibility } from '@stacksjs/iconify-icomoon-free'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-icomoon-free'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-icomoon-free'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(500px, { size: 24 })
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
import { 500px } from '@stacksjs/iconify-icomoon-free'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL

See [license details](https://www.gnu.org/licenses/gpl.html) for more information.

## Credits

- **Icons**: Keyamoon ([Website](https://github.com/Keyamoon/IcoMoon-Free))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icomoon-free/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icomoon-free/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
