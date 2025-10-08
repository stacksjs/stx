# Custom Brand Icons

> Custom Brand Icons icons for stx from Iconify

## Overview

This package provides access to 1490 icons from the Custom Brand Icons collection through the stx iconify integration.

**Collection ID:** `cbi`
**Total Icons:** 1490
**Author:** Emanuele & rchiileea ([Website](https://github.com/elax46/custom-brand-icons))
**License:** CC BY-NC-SA 4.0 ([Details](https://github.com/elax46/custom-brand-icons/blob/main/LICENSE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cbi
```

## Quick Start

### In stx Templates

```html
@js
  import { 02tv, 10Play, 17Track } from '@stacksjs/iconify-cbi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    02tv: renderIcon(02tv, { size: 24 }),
    10Play: renderIcon(10Play, { size: 24, color: '#4a90e2' }),
    17Track: renderIcon(17Track, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.02tv !!}
  {!! icons.10Play !!}
  {!! icons.17Track !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 02tv, 10Play, 17Track } from '@stacksjs/iconify-cbi'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(02tv, { size: 24 })

// With custom color
const coloredIcon = renderIcon(10Play, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(17Track, {
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

This package contains **1490** icons. Here are some examples:

- `02tv`
- `10Play`
- `17Track`
- `2WayUplighter`
- `3dFilament`

...and 1480 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/cbi/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 02tv, 10Play, 17Track, 2WayUplighter } from '@stacksjs/iconify-cbi'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    02tv: renderIcon(02tv, { size: 20, class: 'nav-icon' }),
    10Play: renderIcon(10Play, { size: 20, class: 'nav-icon' }),
    17Track: renderIcon(17Track, { size: 20, class: 'nav-icon' }),
    2WayUplighter: renderIcon(2WayUplighter, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.02tv !!} Home</a>
  <a href="/about">{!! navIcons.10Play !!} About</a>
  <a href="/contact">{!! navIcons.17Track !!} Contact</a>
  <a href="/settings">{!! navIcons.2WayUplighter !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 02tv } from '@stacksjs/iconify-cbi'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(02tv, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-cbi'
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
   import { 02tv, 10Play } from '@stacksjs/iconify-cbi'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-cbi'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 02tv } from '@stacksjs/iconify-cbi'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(02tv, { size: 24 })
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
import { 02tv } from '@stacksjs/iconify-cbi'

// Icons are typed as IconData
const myIcon: IconData = 02tv
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-NC-SA 4.0

See [license details](https://github.com/elax46/custom-brand-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Emanuele & rchiileea ([Website](https://github.com/elax46/custom-brand-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cbi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cbi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
