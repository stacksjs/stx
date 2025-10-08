# BoxIcons Solid

> BoxIcons Solid icons for stx from Iconify

## Overview

This package provides access to 665 icons from the BoxIcons Solid collection through the stx iconify integration.

**Collection ID:** `bxs`
**Total Icons:** 665
**Author:** Atisa ([Website](https://github.com/atisawd/boxicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bxs
```

## Quick Start

### In stx Templates

```html
@js
  import { addToQueue, adjust, adjustAlt } from '@stacksjs/iconify-bxs'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addToQueue: renderIcon(addToQueue, { size: 24 }),
    adjust: renderIcon(adjust, { size: 24, color: '#4a90e2' }),
    adjustAlt: renderIcon(adjustAlt, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addToQueue !!}
  {!! icons.adjust !!}
  {!! icons.adjustAlt !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addToQueue, adjust, adjustAlt } from '@stacksjs/iconify-bxs'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addToQueue, { size: 24 })

// With custom color
const coloredIcon = renderIcon(adjust, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(adjustAlt, {
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

This package contains **665** icons. Here are some examples:

- `addToQueue`
- `adjust`
- `adjustAlt`
- `alarm`
- `alarmAdd`

...and 655 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/bxs/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addToQueue, adjust, adjustAlt, alarm } from '@stacksjs/iconify-bxs'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addToQueue: renderIcon(addToQueue, { size: 20, class: 'nav-icon' }),
    adjust: renderIcon(adjust, { size: 20, class: 'nav-icon' }),
    adjustAlt: renderIcon(adjustAlt, { size: 20, class: 'nav-icon' }),
    alarm: renderIcon(alarm, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addToQueue !!} Home</a>
  <a href="/about">{!! navIcons.adjust !!} About</a>
  <a href="/contact">{!! navIcons.adjustAlt !!} Contact</a>
  <a href="/settings">{!! navIcons.alarm !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addToQueue } from '@stacksjs/iconify-bxs'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addToQueue, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-bxs'
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
   import { addToQueue, adjust } from '@stacksjs/iconify-bxs'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-bxs'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addToQueue } from '@stacksjs/iconify-bxs'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addToQueue, { size: 24 })
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
import { addToQueue } from '@stacksjs/iconify-bxs'

// Icons are typed as IconData
const myIcon: IconData = addToQueue
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Atisa ([Website](https://github.com/atisawd/boxicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bxs/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bxs/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
