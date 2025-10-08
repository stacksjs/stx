# Firefox OS Emoji

> Firefox OS Emoji icons for stx from Iconify

## Overview

This package provides access to 1034 icons from the Firefox OS Emoji collection through the stx iconify integration.

**Collection ID:** `fxemoji`
**Total Icons:** 1034
**Author:** Mozilla ([Website](https://github.com/mozilla/fxemoji))
**License:** Apache 2.0 ([Details](https://mozilla.github.io/fxemoji/LICENSE.md))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-fxemoji
```

## Quick Start

### In stx Templates

```html
@js
  import { 2hearts, acorn, admissiontickets } from '@stacksjs/iconify-fxemoji'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    2hearts: renderIcon(2hearts, { size: 24 }),
    acorn: renderIcon(acorn, { size: 24, color: '#4a90e2' }),
    admissiontickets: renderIcon(admissiontickets, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.2hearts !!}
  {!! icons.acorn !!}
  {!! icons.admissiontickets !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 2hearts, acorn, admissiontickets } from '@stacksjs/iconify-fxemoji'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(2hearts, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acorn, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(admissiontickets, {
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

This package contains **1034** icons. Here are some examples:

- `2hearts`
- `acorn`
- `admissiontickets`
- `aerialtramway`
- `airplane`

...and 1024 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fxemoji/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 2hearts, acorn, admissiontickets, aerialtramway } from '@stacksjs/iconify-fxemoji'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    2hearts: renderIcon(2hearts, { size: 20, class: 'nav-icon' }),
    acorn: renderIcon(acorn, { size: 20, class: 'nav-icon' }),
    admissiontickets: renderIcon(admissiontickets, { size: 20, class: 'nav-icon' }),
    aerialtramway: renderIcon(aerialtramway, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.2hearts !!} Home</a>
  <a href="/about">{!! navIcons.acorn !!} About</a>
  <a href="/contact">{!! navIcons.admissiontickets !!} Contact</a>
  <a href="/settings">{!! navIcons.aerialtramway !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 2hearts } from '@stacksjs/iconify-fxemoji'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(2hearts, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fxemoji'
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
   import { 2hearts, acorn } from '@stacksjs/iconify-fxemoji'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fxemoji'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2hearts } from '@stacksjs/iconify-fxemoji'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(2hearts, { size: 24 })
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
import { 2hearts } from '@stacksjs/iconify-fxemoji'

// Icons are typed as IconData
const myIcon: IconData = 2hearts
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://mozilla.github.io/fxemoji/LICENSE.md) for more information.

## Credits

- **Icons**: Mozilla ([Website](https://github.com/mozilla/fxemoji))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fxemoji/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fxemoji/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
