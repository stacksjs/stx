# Raphael

> Raphael icons for stx from Iconify

## Overview

This package provides access to 266 icons from the Raphael collection through the stx iconify integration.

**Collection ID:** `raphael`
**Total Icons:** 266
**Author:** Dmitry Baranovskiy ([Website](https://github.com/dmitrybaranovskiy/raphael))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-raphael
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, acw, alarm } from '@stacksjs/iconify-raphael'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    acw: renderIcon(acw, { size: 24, color: '#4a90e2' }),
    alarm: renderIcon(alarm, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.acw !!}
  {!! icons.alarm !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, acw, alarm } from '@stacksjs/iconify-raphael'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acw, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alarm, {
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

This package contains **266** icons. Here are some examples:

- `500px`
- `acw`
- `alarm`
- `android`
- `anonymous`

...and 256 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/raphael/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, acw, alarm, android } from '@stacksjs/iconify-raphael'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    acw: renderIcon(acw, { size: 20, class: 'nav-icon' }),
    alarm: renderIcon(alarm, { size: 20, class: 'nav-icon' }),
    android: renderIcon(android, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.acw !!} About</a>
  <a href="/contact">{!! navIcons.alarm !!} Contact</a>
  <a href="/settings">{!! navIcons.android !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-raphael'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-raphael'
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
   import { 500px, acw } from '@stacksjs/iconify-raphael'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-raphael'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-raphael'
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
import { 500px } from '@stacksjs/iconify-raphael'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Dmitry Baranovskiy ([Website](https://github.com/dmitrybaranovskiy/raphael))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/raphael/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/raphael/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
