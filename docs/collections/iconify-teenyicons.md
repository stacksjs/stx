# Teenyicons

> Teenyicons icons for stx from Iconify

## Overview

This package provides access to 1200 icons from the Teenyicons collection through the stx iconify integration.

**Collection ID:** `teenyicons`
**Total Icons:** 1200
**Author:** smhmd ([Website](https://github.com/teenyicons/teenyicons))
**License:** MIT ([Details](https://github.com/teenyicons/teenyicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-teenyicons
```

## Quick Start

### In stx Templates

```html
@js
  import { 360Outline, 360Solid, abTestingOutline } from '@stacksjs/iconify-teenyicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    360Outline: renderIcon(360Outline, { size: 24 }),
    360Solid: renderIcon(360Solid, { size: 24, color: '#4a90e2' }),
    abTestingOutline: renderIcon(abTestingOutline, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.360Outline !!}
  {!! icons.360Solid !!}
  {!! icons.abTestingOutline !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 360Outline, 360Solid, abTestingOutline } from '@stacksjs/iconify-teenyicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(360Outline, { size: 24 })

// With custom color
const coloredIcon = renderIcon(360Solid, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(abTestingOutline, {
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

This package contains **1200** icons. Here are some examples:

- `360Outline`
- `360Solid`
- `abTestingOutline`
- `abTestingSolid`
- `addOutline`

...and 1190 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/teenyicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 360Outline, 360Solid, abTestingOutline, abTestingSolid } from '@stacksjs/iconify-teenyicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    360Outline: renderIcon(360Outline, { size: 20, class: 'nav-icon' }),
    360Solid: renderIcon(360Solid, { size: 20, class: 'nav-icon' }),
    abTestingOutline: renderIcon(abTestingOutline, { size: 20, class: 'nav-icon' }),
    abTestingSolid: renderIcon(abTestingSolid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.360Outline !!} Home</a>
  <a href="/about">{!! navIcons.360Solid !!} About</a>
  <a href="/contact">{!! navIcons.abTestingOutline !!} Contact</a>
  <a href="/settings">{!! navIcons.abTestingSolid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 360Outline } from '@stacksjs/iconify-teenyicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(360Outline, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-teenyicons'
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
   import { 360Outline, 360Solid } from '@stacksjs/iconify-teenyicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-teenyicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 360Outline } from '@stacksjs/iconify-teenyicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(360Outline, { size: 24 })
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
import { 360Outline } from '@stacksjs/iconify-teenyicons'

// Icons are typed as IconData
const myIcon: IconData = 360Outline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/teenyicons/teenyicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: smhmd ([Website](https://github.com/teenyicons/teenyicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/teenyicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/teenyicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
