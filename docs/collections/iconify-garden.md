# Garden SVG Icons

> Garden SVG Icons icons for stx from Iconify

## Overview

This package provides access to 1003 icons from the Garden SVG Icons collection through the stx iconify integration.

**Collection ID:** `garden`
**Total Icons:** 1003
**Author:** Zendesk ([Website](https://github.com/zendeskgarden/svg-icons))
**License:** Apache 2.0 ([Details](https://github.com/zendeskgarden/svg-icons/blob/main/LICENSE.md))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-garden
```

## Quick Start

### In stx Templates

```html
@js
  import { 123Fill12, 123Fill16, 123Stroke12 } from '@stacksjs/iconify-garden'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    123Fill12: renderIcon(123Fill12, { size: 24 }),
    123Fill16: renderIcon(123Fill16, { size: 24, color: '#4a90e2' }),
    123Stroke12: renderIcon(123Stroke12, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.123Fill12 !!}
  {!! icons.123Fill16 !!}
  {!! icons.123Stroke12 !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 123Fill12, 123Fill16, 123Stroke12 } from '@stacksjs/iconify-garden'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(123Fill12, { size: 24 })

// With custom color
const coloredIcon = renderIcon(123Fill16, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(123Stroke12, {
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

This package contains **1003** icons. Here are some examples:

- `123Fill12`
- `123Fill16`
- `123Stroke12`
- `123Stroke16`
- `adjustFill12`

...and 993 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/garden/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 123Fill12, 123Fill16, 123Stroke12, 123Stroke16 } from '@stacksjs/iconify-garden'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    123Fill12: renderIcon(123Fill12, { size: 20, class: 'nav-icon' }),
    123Fill16: renderIcon(123Fill16, { size: 20, class: 'nav-icon' }),
    123Stroke12: renderIcon(123Stroke12, { size: 20, class: 'nav-icon' }),
    123Stroke16: renderIcon(123Stroke16, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.123Fill12 !!} Home</a>
  <a href="/about">{!! navIcons.123Fill16 !!} About</a>
  <a href="/contact">{!! navIcons.123Stroke12 !!} Contact</a>
  <a href="/settings">{!! navIcons.123Stroke16 !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 123Fill12 } from '@stacksjs/iconify-garden'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(123Fill12, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-garden'
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
   import { 123Fill12, 123Fill16 } from '@stacksjs/iconify-garden'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-garden'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 123Fill12 } from '@stacksjs/iconify-garden'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(123Fill12, { size: 24 })
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
import { 123Fill12 } from '@stacksjs/iconify-garden'

// Icons are typed as IconData
const myIcon: IconData = 123Fill12
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/zendeskgarden/svg-icons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Zendesk ([Website](https://github.com/zendeskgarden/svg-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/garden/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/garden/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
