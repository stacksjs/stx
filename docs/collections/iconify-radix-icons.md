# Radix Icons

> Radix Icons icons for stx from Iconify

## Overview

This package provides access to 342 icons from the Radix Icons collection through the stx iconify integration.

**Collection ID:** `radix-icons`
**Total Icons:** 342
**Author:** WorkOS ([Website](https://github.com/radix-ui/icons))
**License:** MIT ([Details](https://github.com/radix-ui/icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-radix-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility, activityLog, alignBaseline } from '@stacksjs/iconify-radix-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility: renderIcon(accessibility, { size: 24 }),
    activityLog: renderIcon(activityLog, { size: 24, color: '#4a90e2' }),
    alignBaseline: renderIcon(alignBaseline, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility !!}
  {!! icons.activityLog !!}
  {!! icons.alignBaseline !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility, activityLog, alignBaseline } from '@stacksjs/iconify-radix-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility, { size: 24 })

// With custom color
const coloredIcon = renderIcon(activityLog, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignBaseline, {
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

This package contains **342** icons. Here are some examples:

- `accessibility`
- `activityLog`
- `alignBaseline`
- `alignBottom`
- `alignCenter`

...and 332 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/radix-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility, activityLog, alignBaseline, alignBottom } from '@stacksjs/iconify-radix-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    activityLog: renderIcon(activityLog, { size: 20, class: 'nav-icon' }),
    alignBaseline: renderIcon(alignBaseline, { size: 20, class: 'nav-icon' }),
    alignBottom: renderIcon(alignBottom, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility !!} Home</a>
  <a href="/about">{!! navIcons.activityLog !!} About</a>
  <a href="/contact">{!! navIcons.alignBaseline !!} Contact</a>
  <a href="/settings">{!! navIcons.alignBottom !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility } from '@stacksjs/iconify-radix-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-radix-icons'
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
   import { accessibility, activityLog } from '@stacksjs/iconify-radix-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-radix-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-radix-icons'
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
import { accessibility } from '@stacksjs/iconify-radix-icons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/radix-ui/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: WorkOS ([Website](https://github.com/radix-ui/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/radix-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/radix-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
