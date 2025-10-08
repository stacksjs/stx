# Academicons

> Academicons icons for stx from Iconify

## Overview

This package provides access to 158 icons from the Academicons collection through the stx iconify integration.

**Collection ID:** `academicons`
**Total Icons:** 158
**Author:** James Walsh ([Website](https://github.com/jpswalsh/academicons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-academicons
```

## Quick Start

### In stx Templates

```html
@js
  import { academia, academiaSquare, acclaim } from '@stacksjs/iconify-academicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    academia: renderIcon(academia, { size: 24 }),
    academiaSquare: renderIcon(academiaSquare, { size: 24, color: '#4a90e2' }),
    acclaim: renderIcon(acclaim, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.academia !!}
  {!! icons.academiaSquare !!}
  {!! icons.acclaim !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { academia, academiaSquare, acclaim } from '@stacksjs/iconify-academicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(academia, { size: 24 })

// With custom color
const coloredIcon = renderIcon(academiaSquare, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(acclaim, {
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

This package contains **158** icons. Here are some examples:

- `academia`
- `academiaSquare`
- `acclaim`
- `acclaimSquare`
- `acm`

...and 148 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/academicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { academia, academiaSquare, acclaim, acclaimSquare } from '@stacksjs/iconify-academicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    academia: renderIcon(academia, { size: 20, class: 'nav-icon' }),
    academiaSquare: renderIcon(academiaSquare, { size: 20, class: 'nav-icon' }),
    acclaim: renderIcon(acclaim, { size: 20, class: 'nav-icon' }),
    acclaimSquare: renderIcon(acclaimSquare, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.academia !!} Home</a>
  <a href="/about">{!! navIcons.academiaSquare !!} About</a>
  <a href="/contact">{!! navIcons.acclaim !!} Contact</a>
  <a href="/settings">{!! navIcons.acclaimSquare !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { academia } from '@stacksjs/iconify-academicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(academia, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-academicons'
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
   import { academia, academiaSquare } from '@stacksjs/iconify-academicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-academicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { academia } from '@stacksjs/iconify-academicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(academia, { size: 24 })
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
import { academia } from '@stacksjs/iconify-academicons'

// Icons are typed as IconData
const myIcon: IconData = academia
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: James Walsh ([Website](https://github.com/jpswalsh/academicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/academicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/academicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
