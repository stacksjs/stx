# Brandico

> Brandico icons for stx from Iconify

## Overview

This package provides access to 45 icons from the Brandico collection through the stx iconify integration.

**Collection ID:** `brandico`
**Total Icons:** 45
**Author:** Fontello ([Website](https://github.com/fontello/brandico.font))
**License:** CC BY SA ([Details](https://creativecommons.org/licenses/by-sa/3.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-brandico
```

## Quick Start

### In stx Templates

```html
@js
  import { amex, bandcamp, blogger } from '@stacksjs/iconify-brandico'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    amex: renderIcon(amex, { size: 24 }),
    bandcamp: renderIcon(bandcamp, { size: 24, color: '#4a90e2' }),
    blogger: renderIcon(blogger, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.amex !!}
  {!! icons.bandcamp !!}
  {!! icons.blogger !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { amex, bandcamp, blogger } from '@stacksjs/iconify-brandico'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(amex, { size: 24 })

// With custom color
const coloredIcon = renderIcon(bandcamp, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(blogger, {
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

This package contains **45** icons. Here are some examples:

- `amex`
- `bandcamp`
- `blogger`
- `bloggerRect`
- `box`

...and 35 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/brandico/).

## Usage Examples

### Navigation Menu

```html
@js
  import { amex, bandcamp, blogger, bloggerRect } from '@stacksjs/iconify-brandico'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    amex: renderIcon(amex, { size: 20, class: 'nav-icon' }),
    bandcamp: renderIcon(bandcamp, { size: 20, class: 'nav-icon' }),
    blogger: renderIcon(blogger, { size: 20, class: 'nav-icon' }),
    bloggerRect: renderIcon(bloggerRect, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.amex !!} Home</a>
  <a href="/about">{!! navIcons.bandcamp !!} About</a>
  <a href="/contact">{!! navIcons.blogger !!} Contact</a>
  <a href="/settings">{!! navIcons.bloggerRect !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { amex } from '@stacksjs/iconify-brandico'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(amex, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-brandico'
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
   import { amex, bandcamp } from '@stacksjs/iconify-brandico'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-brandico'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { amex } from '@stacksjs/iconify-brandico'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(amex, { size: 24 })
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
import { amex } from '@stacksjs/iconify-brandico'

// Icons are typed as IconData
const myIcon: IconData = amex
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY SA

See [license details](https://creativecommons.org/licenses/by-sa/3.0/) for more information.

## Credits

- **Icons**: Fontello ([Website](https://github.com/fontello/brandico.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/brandico/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/brandico/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
