# Arcticons

> Arcticons icons for stx from Iconify

## Overview

This package provides access to 13535 icons from the Arcticons collection through the stx iconify integration.

**Collection ID:** `arcticons`
**Total Icons:** 13535
**Author:** Donnnno ([Website](https://github.com/Arcticons-Team/Arcticons))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-arcticons
```

## Quick Start

### In stx Templates

```html
@js
  import { 85, 90, 99 } from '@stacksjs/iconify-arcticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    85: renderIcon(85, { size: 24 }),
    90: renderIcon(90, { size: 24, color: '#4a90e2' }),
    99: renderIcon(99, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.85 !!}
  {!! icons.90 !!}
  {!! icons.99 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 85, 90, 99 } from '@stacksjs/iconify-arcticons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(85, { size: 24 })

// With custom color
const coloredIcon = renderIcon(90, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(99, {
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

This package contains **13535** icons. Here are some examples:

- `85`
- `90`
- `99`
- `100`
- `112`

...and 13525 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/arcticons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 85, 90, 99, 100 } from '@stacksjs/iconify-arcticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    85: renderIcon(85, { size: 20, class: 'nav-icon' }),
    90: renderIcon(90, { size: 20, class: 'nav-icon' }),
    99: renderIcon(99, { size: 20, class: 'nav-icon' }),
    100: renderIcon(100, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.85 !!} Home</a>
  <a href="/about">{!! navIcons.90 !!} About</a>
  <a href="/contact">{!! navIcons.99 !!} Contact</a>
  <a href="/settings">{!! navIcons.100 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 85 } from '@stacksjs/iconify-arcticons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(85, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-arcticons'
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
   import { 85, 90 } from '@stacksjs/iconify-arcticons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-arcticons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 85 } from '@stacksjs/iconify-arcticons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(85, { size: 24 })
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
import { 85 } from '@stacksjs/iconify-arcticons'

// Icons are typed as IconData
const myIcon: IconData = 85
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Donnnno ([Website](https://github.com/Arcticons-Team/Arcticons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/arcticons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/arcticons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
