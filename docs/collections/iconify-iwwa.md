# Innowatio Font

> Innowatio Font icons for stx from Iconify

## Overview

This package provides access to 105 icons from the Innowatio Font collection through the stx iconify integration.

**Collection ID:** `iwwa`
**Total Icons:** 105
**Author:** Innowatio ([Website](https://github.com/innowatio/iwwa-icons))
**License:** Apache 2.0 ([Details](https://www.apache.org/licenses/LICENSE-2.0))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-iwwa
```

## Quick Start

### In stx Templates

```html
@js
  import { add, add15m, add1d } from '@stacksjs/iconify-iwwa'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add: renderIcon(add, { size: 24 }),
    add15m: renderIcon(add15m, { size: 24, color: '#4a90e2' }),
    add1d: renderIcon(add1d, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add !!}
  {!! icons.add15m !!}
  {!! icons.add1d !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add, add15m, add1d } from '@stacksjs/iconify-iwwa'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add, { size: 24 })

// With custom color
const coloredIcon = renderIcon(add15m, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(add1d, {
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

This package contains **105** icons. Here are some examples:

- `add`
- `add15m`
- `add1d`
- `add1m`
- `add1w`

...and 95 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/iwwa/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add, add15m, add1d, add1m } from '@stacksjs/iconify-iwwa'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    add15m: renderIcon(add15m, { size: 20, class: 'nav-icon' }),
    add1d: renderIcon(add1d, { size: 20, class: 'nav-icon' }),
    add1m: renderIcon(add1m, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add !!} Home</a>
  <a href="/about">{!! navIcons.add15m !!} About</a>
  <a href="/contact">{!! navIcons.add1d !!} Contact</a>
  <a href="/settings">{!! navIcons.add1m !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add } from '@stacksjs/iconify-iwwa'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-iwwa'
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
   import { add, add15m } from '@stacksjs/iconify-iwwa'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-iwwa'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add } from '@stacksjs/iconify-iwwa'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(add, { size: 24 })
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
import { add } from '@stacksjs/iconify-iwwa'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://www.apache.org/licenses/LICENSE-2.0) for more information.

## Credits

- **Icons**: Innowatio ([Website](https://github.com/innowatio/iwwa-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/iwwa/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/iwwa/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
