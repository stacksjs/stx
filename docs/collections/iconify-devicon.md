# Devicon

> Devicon icons for stx from Iconify

## Overview

This package provides access to 962 icons from the Devicon collection through the stx iconify integration.

**Collection ID:** `devicon`
**Total Icons:** 962
**Author:** konpa ([Website](https://github.com/devicons/devicon/tree/master))
**License:** MIT ([Details](https://github.com/devicons/devicon/blob/master/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-devicon
```

## Quick Start

### In stx Templates

```html
@js
  import { aarch64, adonisjs, adonisjsWordmark } from '@stacksjs/iconify-devicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aarch64: renderIcon(aarch64, { size: 24 }),
    adonisjs: renderIcon(adonisjs, { size: 24, color: '#4a90e2' }),
    adonisjsWordmark: renderIcon(adonisjsWordmark, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aarch64 !!}
  {!! icons.adonisjs !!}
  {!! icons.adonisjsWordmark !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aarch64, adonisjs, adonisjsWordmark } from '@stacksjs/iconify-devicon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aarch64, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adonisjs, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adonisjsWordmark, {
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

This package contains **962** icons. Here are some examples:

- `aarch64`
- `adonisjs`
- `adonisjsWordmark`
- `aerospike`
- `aerospikeWordmark`

...and 952 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/devicon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aarch64, adonisjs, adonisjsWordmark, aerospike } from '@stacksjs/iconify-devicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aarch64: renderIcon(aarch64, { size: 20, class: 'nav-icon' }),
    adonisjs: renderIcon(adonisjs, { size: 20, class: 'nav-icon' }),
    adonisjsWordmark: renderIcon(adonisjsWordmark, { size: 20, class: 'nav-icon' }),
    aerospike: renderIcon(aerospike, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aarch64 !!} Home</a>
  <a href="/about">{!! navIcons.adonisjs !!} About</a>
  <a href="/contact">{!! navIcons.adonisjsWordmark !!} Contact</a>
  <a href="/settings">{!! navIcons.aerospike !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aarch64 } from '@stacksjs/iconify-devicon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aarch64, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-devicon'
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
   import { aarch64, adonisjs } from '@stacksjs/iconify-devicon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-devicon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aarch64 } from '@stacksjs/iconify-devicon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aarch64, { size: 24 })
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
import { aarch64 } from '@stacksjs/iconify-devicon'

// Icons are typed as IconData
const myIcon: IconData = aarch64
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/devicons/devicon/blob/master/LICENSE) for more information.

## Credits

- **Icons**: konpa ([Website](https://github.com/devicons/devicon/tree/master))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/devicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/devicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
