# Flat UI Icons

> Flat UI Icons icons for stx from Iconify

## Overview

This package provides access to 100 icons from the Flat UI Icons collection through the stx iconify integration.

**Collection ID:** `flat-ui`
**Total Icons:** 100
**Author:** Designmodo, Inc. ([Website](https://github.com/designmodo/Flat-UI))
**License:** MIT ([Details](https://github.com/designmodo/Flat-UI/blob/master/LICENSE))

**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flat-ui
```

## Quick Start

### In stx Templates

```html
@js
  import { android, android1, appStore } from '@stacksjs/iconify-flat-ui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    android: renderIcon(android, { size: 24 }),
    android1: renderIcon(android1, { size: 24, color: '#4a90e2' }),
    appStore: renderIcon(appStore, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.android !!}
  {!! icons.android1 !!}
  {!! icons.appStore !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { android, android1, appStore } from '@stacksjs/iconify-flat-ui'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(android, { size: 24 })

// With custom color
const coloredIcon = renderIcon(android1, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(appStore, {
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

This package contains **100** icons. Here are some examples:

- `android`
- `android1`
- `appStore`
- `arrow`
- `art`

...and 90 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/flat-ui/).

## Usage Examples

### Navigation Menu

```html
@js
  import { android, android1, appStore, arrow } from '@stacksjs/iconify-flat-ui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    android: renderIcon(android, { size: 20, class: 'nav-icon' }),
    android1: renderIcon(android1, { size: 20, class: 'nav-icon' }),
    appStore: renderIcon(appStore, { size: 20, class: 'nav-icon' }),
    arrow: renderIcon(arrow, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.android !!} Home</a>
  <a href="/about">{!! navIcons.android1 !!} About</a>
  <a href="/contact">{!! navIcons.appStore !!} Contact</a>
  <a href="/settings">{!! navIcons.arrow !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { android } from '@stacksjs/iconify-flat-ui'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(android, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-flat-ui'
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
   import { android, android1 } from '@stacksjs/iconify-flat-ui'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-flat-ui'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { android } from '@stacksjs/iconify-flat-ui'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(android, { size: 24 })
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
import { android } from '@stacksjs/iconify-flat-ui'

// Icons are typed as IconData
const myIcon: IconData = android
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/designmodo/Flat-UI/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Designmodo, Inc. ([Website](https://github.com/designmodo/Flat-UI))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flat-ui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flat-ui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
