# Iconoir

> Iconoir icons for stx from Iconify

## Overview

This package provides access to 1682 icons from the Iconoir collection through the stx iconify integration.

**Collection ID:** `iconoir`
**Total Icons:** 1682
**Author:** Luca Burgio ([Website](https://github.com/iconoir-icons/iconoir))
**License:** MIT ([Details](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-iconoir
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility, accessibilitySign, accessibilityTech } from '@stacksjs/iconify-iconoir'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility: renderIcon(accessibility, { size: 24 }),
    accessibilitySign: renderIcon(accessibilitySign, { size: 24, color: '#4a90e2' }),
    accessibilityTech: renderIcon(accessibilityTech, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility !!}
  {!! icons.accessibilitySign !!}
  {!! icons.accessibilityTech !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility, accessibilitySign, accessibilityTech } from '@stacksjs/iconify-iconoir'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibilitySign, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accessibilityTech, {
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

This package contains **1682** icons. Here are some examples:

- `accessibility`
- `accessibilitySign`
- `accessibilityTech`
- `activity`
- `adobeAfterEffects`

...and 1672 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/iconoir/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility, accessibilitySign, accessibilityTech, activity } from '@stacksjs/iconify-iconoir'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    accessibilitySign: renderIcon(accessibilitySign, { size: 20, class: 'nav-icon' }),
    accessibilityTech: renderIcon(accessibilityTech, { size: 20, class: 'nav-icon' }),
    activity: renderIcon(activity, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility !!} Home</a>
  <a href="/about">{!! navIcons.accessibilitySign !!} About</a>
  <a href="/contact">{!! navIcons.accessibilityTech !!} Contact</a>
  <a href="/settings">{!! navIcons.activity !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility } from '@stacksjs/iconify-iconoir'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-iconoir'
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
   import { accessibility, accessibilitySign } from '@stacksjs/iconify-iconoir'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-iconoir'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-iconoir'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility, { size: 24 })
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
import { accessibility } from '@stacksjs/iconify-iconoir'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Luca Burgio ([Website](https://github.com/iconoir-icons/iconoir))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/iconoir/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/iconoir/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
