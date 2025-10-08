# Catppuccin Icons

> Catppuccin Icons icons for stx from Iconify

## Overview

This package provides access to 659 icons from the Catppuccin Icons collection through the stx iconify integration.

**Collection ID:** `catppuccin`
**Total Icons:** 659
**Author:** Catppuccin ([Website](https://github.com/catppuccin/vscode-icons))
**License:** MIT ([Details](https://github.com/catppuccin/vscode-icons/blob/main/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-catppuccin
```

## Quick Start

### In stx Templates

```html
@js
  import { 3d, adobeAe, adobeAi } from '@stacksjs/iconify-catppuccin'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    3d: renderIcon(3d, { size: 24 }),
    adobeAe: renderIcon(adobeAe, { size: 24, color: '#4a90e2' }),
    adobeAi: renderIcon(adobeAi, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.3d !!}
  {!! icons.adobeAe !!}
  {!! icons.adobeAi !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 3d, adobeAe, adobeAi } from '@stacksjs/iconify-catppuccin'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(3d, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adobeAe, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adobeAi, {
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

This package contains **659** icons. Here are some examples:

- `3d`
- `adobeAe`
- `adobeAi`
- `adobeId`
- `adobePs`

...and 649 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/catppuccin/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 3d, adobeAe, adobeAi, adobeId } from '@stacksjs/iconify-catppuccin'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    3d: renderIcon(3d, { size: 20, class: 'nav-icon' }),
    adobeAe: renderIcon(adobeAe, { size: 20, class: 'nav-icon' }),
    adobeAi: renderIcon(adobeAi, { size: 20, class: 'nav-icon' }),
    adobeId: renderIcon(adobeId, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.3d !!} Home</a>
  <a href="/about">{!! navIcons.adobeAe !!} About</a>
  <a href="/contact">{!! navIcons.adobeAi !!} Contact</a>
  <a href="/settings">{!! navIcons.adobeId !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 3d } from '@stacksjs/iconify-catppuccin'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(3d, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-catppuccin'
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
   import { 3d, adobeAe } from '@stacksjs/iconify-catppuccin'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-catppuccin'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3d } from '@stacksjs/iconify-catppuccin'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(3d, { size: 24 })
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
import { 3d } from '@stacksjs/iconify-catppuccin'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/catppuccin/vscode-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Catppuccin ([Website](https://github.com/catppuccin/vscode-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/catppuccin/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/catppuccin/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
