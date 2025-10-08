# NRK Core Icons

> NRK Core Icons icons for stx from Iconify

## Overview

This package provides access to 241 icons from the NRK Core Icons collection through the stx iconify integration.

**Collection ID:** `nrk`
**Total Icons:** 241
**Author:** Norsk rikskringkasting ([Website](https://github.com/nrkno/core-icons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nrk
```

## Quick Start

### In stx Templates

```html
@js
  import { 360, 404, alarmClock } from '@stacksjs/iconify-nrk'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    360: renderIcon(360, { size: 24 }),
    404: renderIcon(404, { size: 24, color: '#4a90e2' }),
    alarmClock: renderIcon(alarmClock, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.360 !!}
  {!! icons.404 !!}
  {!! icons.alarmClock !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 360, 404, alarmClock } from '@stacksjs/iconify-nrk'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(360, { size: 24 })

// With custom color
const coloredIcon = renderIcon(404, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alarmClock, {
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

This package contains **241** icons. Here are some examples:

- `360`
- `404`
- `alarmClock`
- `arrangeList`
- `arrowDown`

...and 231 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/nrk/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 360, 404, alarmClock, arrangeList } from '@stacksjs/iconify-nrk'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    360: renderIcon(360, { size: 20, class: 'nav-icon' }),
    404: renderIcon(404, { size: 20, class: 'nav-icon' }),
    alarmClock: renderIcon(alarmClock, { size: 20, class: 'nav-icon' }),
    arrangeList: renderIcon(arrangeList, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.360 !!} Home</a>
  <a href="/about">{!! navIcons.404 !!} About</a>
  <a href="/contact">{!! navIcons.alarmClock !!} Contact</a>
  <a href="/settings">{!! navIcons.arrangeList !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 360 } from '@stacksjs/iconify-nrk'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(360, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-nrk'
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
   import { 360, 404 } from '@stacksjs/iconify-nrk'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-nrk'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 360 } from '@stacksjs/iconify-nrk'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(360, { size: 24 })
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
import { 360 } from '@stacksjs/iconify-nrk'

// Icons are typed as IconData
const myIcon: IconData = 360
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Norsk rikskringkasting ([Website](https://github.com/nrkno/core-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nrk/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nrk/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
