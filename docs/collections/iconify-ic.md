# Google Material Icons

> Google Material Icons icons for stx from Iconify

## Overview

This package provides access to 10956 icons from the Google Material Icons collection through the stx iconify integration.

**Collection ID:** `ic`
**Total Icons:** 10956
**Author:** Material Design Authors ([Website](https://github.com/material-icons/material-icons))
**License:** Apache 2.0 ([Details](https://github.com/material-icons/material-icons/blob/master/LICENSE))
**Category:** Material
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ic
```

## Quick Start

### In stx Templates

```html
@js
  import { baseline10k, baseline10mp, baseline11mp } from '@stacksjs/iconify-ic'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    baseline10k: renderIcon(baseline10k, { size: 24 }),
    baseline10mp: renderIcon(baseline10mp, { size: 24, color: '#4a90e2' }),
    baseline11mp: renderIcon(baseline11mp, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.baseline10k !!}
  {!! icons.baseline10mp !!}
  {!! icons.baseline11mp !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { baseline10k, baseline10mp, baseline11mp } from '@stacksjs/iconify-ic'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(baseline10k, { size: 24 })

// With custom color
const coloredIcon = renderIcon(baseline10mp, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(baseline11mp, {
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

This package contains **10956** icons. Here are some examples:

- `baseline10k`
- `baseline10mp`
- `baseline11mp`
- `baseline123`
- `baseline12mp`

...and 10946 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ic/).

## Usage Examples

### Navigation Menu

```html
@js
  import { baseline10k, baseline10mp, baseline11mp, baseline123 } from '@stacksjs/iconify-ic'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    baseline10k: renderIcon(baseline10k, { size: 20, class: 'nav-icon' }),
    baseline10mp: renderIcon(baseline10mp, { size: 20, class: 'nav-icon' }),
    baseline11mp: renderIcon(baseline11mp, { size: 20, class: 'nav-icon' }),
    baseline123: renderIcon(baseline123, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.baseline10k !!} Home</a>
  <a href="/about">{!! navIcons.baseline10mp !!} About</a>
  <a href="/contact">{!! navIcons.baseline11mp !!} Contact</a>
  <a href="/settings">{!! navIcons.baseline123 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { baseline10k } from '@stacksjs/iconify-ic'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(baseline10k, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ic'
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
   import { baseline10k, baseline10mp } from '@stacksjs/iconify-ic'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ic'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { baseline10k } from '@stacksjs/iconify-ic'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(baseline10k, { size: 24 })
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
import { baseline10k } from '@stacksjs/iconify-ic'

// Icons are typed as IconData
const myIcon: IconData = baseline10k
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/material-icons/material-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Material Design Authors ([Website](https://github.com/material-icons/material-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ic/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ic/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
