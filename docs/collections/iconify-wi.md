# Weather Icons

> Weather Icons icons for stx from Iconify

## Overview

This package provides access to 230 icons from the Weather Icons collection through the stx iconify integration.

**Collection ID:** `wi`
**Total Icons:** 230
**Author:** Erik Flowers ([Website](https://github.com/erikflowers/weather-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-wi
```

## Quick Start

### In stx Templates

```html
@js
  import { alien, aliens, barometer } from '@stacksjs/iconify-wi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    alien: renderIcon(alien, { size: 24 }),
    aliens: renderIcon(aliens, { size: 24, color: '#4a90e2' }),
    barometer: renderIcon(barometer, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.alien !!}
  {!! icons.aliens !!}
  {!! icons.barometer !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { alien, aliens, barometer } from '@stacksjs/iconify-wi'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(alien, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aliens, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(barometer, {
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

This package contains **230** icons. Here are some examples:

- `alien`
- `aliens`
- `barometer`
- `celsius`
- `cloud`

...and 220 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/wi/).

## Usage Examples

### Navigation Menu

```html
@js
  import { alien, aliens, barometer, celsius } from '@stacksjs/iconify-wi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    alien: renderIcon(alien, { size: 20, class: 'nav-icon' }),
    aliens: renderIcon(aliens, { size: 20, class: 'nav-icon' }),
    barometer: renderIcon(barometer, { size: 20, class: 'nav-icon' }),
    celsius: renderIcon(celsius, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.alien !!} Home</a>
  <a href="/about">{!! navIcons.aliens !!} About</a>
  <a href="/contact">{!! navIcons.barometer !!} Contact</a>
  <a href="/settings">{!! navIcons.celsius !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { alien } from '@stacksjs/iconify-wi'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(alien, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-wi'
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
   import { alien, aliens } from '@stacksjs/iconify-wi'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-wi'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { alien } from '@stacksjs/iconify-wi'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(alien, { size: 24 })
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
import { alien } from '@stacksjs/iconify-wi'

// Icons are typed as IconData
const myIcon: IconData = alien
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Erik Flowers ([Website](https://github.com/erikflowers/weather-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/wi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/wi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
