# Map Icons

> Map Icons icons for stx from Iconify

## Overview

This package provides access to 167 icons from the Map Icons collection through the stx iconify integration.

**Collection ID:** `map`
**Total Icons:** 167
**Author:** Scott de Jonge ([Website](https://github.com/scottdejonge/map-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Flags / Maps
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-map
```

## Quick Start

### In stx Templates

```html
@js
  import { abseiling, accounting, airport } from '@stacksjs/iconify-map'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abseiling: renderIcon(abseiling, { size: 24 }),
    accounting: renderIcon(accounting, { size: 24, color: '#4a90e2' }),
    airport: renderIcon(airport, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abseiling !!}
  {!! icons.accounting !!}
  {!! icons.airport !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abseiling, accounting, airport } from '@stacksjs/iconify-map'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abseiling, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accounting, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(airport, {
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

This package contains **167** icons. Here are some examples:

- `abseiling`
- `accounting`
- `airport`
- `amusementPark`
- `aquarium`

...and 157 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/map/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abseiling, accounting, airport, amusementPark } from '@stacksjs/iconify-map'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abseiling: renderIcon(abseiling, { size: 20, class: 'nav-icon' }),
    accounting: renderIcon(accounting, { size: 20, class: 'nav-icon' }),
    airport: renderIcon(airport, { size: 20, class: 'nav-icon' }),
    amusementPark: renderIcon(amusementPark, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abseiling !!} Home</a>
  <a href="/about">{!! navIcons.accounting !!} About</a>
  <a href="/contact">{!! navIcons.airport !!} Contact</a>
  <a href="/settings">{!! navIcons.amusementPark !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abseiling } from '@stacksjs/iconify-map'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abseiling, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-map'
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
   import { abseiling, accounting } from '@stacksjs/iconify-map'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-map'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abseiling } from '@stacksjs/iconify-map'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abseiling, { size: 24 })
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
import { abseiling } from '@stacksjs/iconify-map'

// Icons are typed as IconData
const myIcon: IconData = abseiling
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Scott de Jonge ([Website](https://github.com/scottdejonge/map-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/map/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/map/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
