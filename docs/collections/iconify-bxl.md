# BoxIcons Logo

> BoxIcons Logo icons for stx from Iconify

## Overview

This package provides access to 155 icons from the BoxIcons Logo collection through the stx iconify integration.

**Collection ID:** `bxl`
**Total Icons:** 155
**Author:** Atisa ([Website](https://github.com/atisawd/boxicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bxl
```

## Quick Start

### In stx Templates

```html
@js
  import { 500px, 99designs, adobe } from '@stacksjs/iconify-bxl'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    500px: renderIcon(500px, { size: 24 }),
    99designs: renderIcon(99designs, { size: 24, color: '#4a90e2' }),
    adobe: renderIcon(adobe, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.500px !!}
  {!! icons.99designs !!}
  {!! icons.adobe !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 500px, 99designs, adobe } from '@stacksjs/iconify-bxl'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(500px, { size: 24 })

// With custom color
const coloredIcon = renderIcon(99designs, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adobe, {
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

This package contains **155** icons. Here are some examples:

- `500px`
- `99designs`
- `adobe`
- `airbnb`
- `algolia`

...and 145 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/bxl/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 500px, 99designs, adobe, airbnb } from '@stacksjs/iconify-bxl'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    500px: renderIcon(500px, { size: 20, class: 'nav-icon' }),
    99designs: renderIcon(99designs, { size: 20, class: 'nav-icon' }),
    adobe: renderIcon(adobe, { size: 20, class: 'nav-icon' }),
    airbnb: renderIcon(airbnb, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.500px !!} Home</a>
  <a href="/about">{!! navIcons.99designs !!} About</a>
  <a href="/contact">{!! navIcons.adobe !!} Contact</a>
  <a href="/settings">{!! navIcons.airbnb !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 500px } from '@stacksjs/iconify-bxl'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(500px, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-bxl'
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
   import { 500px, 99designs } from '@stacksjs/iconify-bxl'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-bxl'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-bxl'
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
import { 500px } from '@stacksjs/iconify-bxl'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Atisa ([Website](https://github.com/atisawd/boxicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bxl/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bxl/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
