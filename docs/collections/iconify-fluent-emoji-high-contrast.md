# Fluent Emoji High Contrast

> Fluent Emoji High Contrast icons for stx from Iconify

## Overview

This package provides access to 1594 icons from the Fluent Emoji High Contrast collection through the stx iconify integration.

**Collection ID:** `fluent-emoji-high-contrast`
**Total Icons:** 1594
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-emoji))
**License:** MIT ([Details](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE))
**Category:** Emoji
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent-emoji-high-contrast
```

## Quick Start

### In stx Templates

```html
@js
  import { 1stPlaceMedal, 2ndPlaceMedal, 3rdPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    1stPlaceMedal: renderIcon(1stPlaceMedal, { size: 24 }),
    2ndPlaceMedal: renderIcon(2ndPlaceMedal, { size: 24, color: '#4a90e2' }),
    3rdPlaceMedal: renderIcon(3rdPlaceMedal, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.1stPlaceMedal !!}
  {!! icons.2ndPlaceMedal !!}
  {!! icons.3rdPlaceMedal !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 1stPlaceMedal, 2ndPlaceMedal, 3rdPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(1stPlaceMedal, { size: 24 })

// With custom color
const coloredIcon = renderIcon(2ndPlaceMedal, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(3rdPlaceMedal, {
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

This package contains **1594** icons. Here are some examples:

- `1stPlaceMedal`
- `2ndPlaceMedal`
- `3rdPlaceMedal`
- `aButtonBloodType`
- `abButtonBloodType`

...and 1584 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fluent-emoji-high-contrast/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 1stPlaceMedal, 2ndPlaceMedal, 3rdPlaceMedal, aButtonBloodType } from '@stacksjs/iconify-fluent-emoji-high-contrast'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    1stPlaceMedal: renderIcon(1stPlaceMedal, { size: 20, class: 'nav-icon' }),
    2ndPlaceMedal: renderIcon(2ndPlaceMedal, { size: 20, class: 'nav-icon' }),
    3rdPlaceMedal: renderIcon(3rdPlaceMedal, { size: 20, class: 'nav-icon' }),
    aButtonBloodType: renderIcon(aButtonBloodType, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.1stPlaceMedal !!} Home</a>
  <a href="/about">{!! navIcons.2ndPlaceMedal !!} About</a>
  <a href="/contact">{!! navIcons.3rdPlaceMedal !!} Contact</a>
  <a href="/settings">{!! navIcons.aButtonBloodType !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 1stPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(1stPlaceMedal, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fluent-emoji-high-contrast'
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
   import { 1stPlaceMedal, 2ndPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fluent-emoji-high-contrast'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 1stPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(1stPlaceMedal, { size: 24 })
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
import { 1stPlaceMedal } from '@stacksjs/iconify-fluent-emoji-high-contrast'

// Icons are typed as IconData
const myIcon: IconData = 1stPlaceMedal
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-emoji))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent-emoji-high-contrast/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent-emoji-high-contrast/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
