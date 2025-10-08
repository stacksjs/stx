# Entypo+ Social

> Entypo+ Social icons for stx from Iconify

## Overview

This package provides access to 76 icons from the Entypo+ Social collection through the stx iconify integration.

**Collection ID:** `entypo-social`
**Total Icons:** 76
**Author:** Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-entypo-social
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, 500pxWithCircle, basecamp } from '@stacksjs/iconify-entypo-social'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    500pxWithCircle: renderIcon(500pxWithCircle, { size: 24, color: '#4a90e2' }),
    basecamp: renderIcon(basecamp, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.500pxWithCircle !!}
  {!! icons.basecamp !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, 500pxWithCircle, basecamp } from '@stacksjs/iconify-entypo-social'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(500pxWithCircle, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(basecamp, {
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

This package contains **76** icons. Here are some examples:

- `500px`
- `500pxWithCircle`
- `basecamp`
- `behance`
- `creativeCloud`

...and 66 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/entypo-social/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, 500pxWithCircle, basecamp, behance } from '@stacksjs/iconify-entypo-social'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    500pxWithCircle: renderIcon(500pxWithCircle, { size: 20, class: 'nav-icon' }),
    basecamp: renderIcon(basecamp, { size: 20, class: 'nav-icon' }),
    behance: renderIcon(behance, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.500pxWithCircle !!} About</a>
  <a href="/contact">{!! navIcons.basecamp !!} Contact</a>
  <a href="/settings">{!! navIcons.behance !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-entypo-social'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-entypo-social'
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
   import { 500px, 500pxWithCircle } from '@stacksjs/iconify-entypo-social'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-entypo-social'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-entypo-social'
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
import { 500px } from '@stacksjs/iconify-entypo-social'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/entypo-social/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/entypo-social/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
