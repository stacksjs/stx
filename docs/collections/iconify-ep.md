# Element Plus

> Element Plus icons for stx from Iconify

## Overview

This package provides access to 293 icons from the Element Plus collection through the stx iconify integration.

**Collection ID:** `ep`
**Total Icons:** 293
**Author:** Element Plus ([Website](https://github.com/element-plus/element-plus-icons))
**License:** MIT ([Details](https://github.com/element-plus/element-plus-icons/blob/main/packages/svg/package.json))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ep
```

## Quick Start

### In stx Templates

```html
@js
  import { addLocation, aim, alarmClock } from '@stacksjs/iconify-ep'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addLocation: renderIcon(addLocation, { size: 24 }),
    aim: renderIcon(aim, { size: 24, color: '#4a90e2' }),
    alarmClock: renderIcon(alarmClock, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addLocation !!}
  {!! icons.aim !!}
  {!! icons.alarmClock !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addLocation, aim, alarmClock } from '@stacksjs/iconify-ep'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addLocation, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aim, {
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

This package contains **293** icons. Here are some examples:

- `addLocation`
- `aim`
- `alarmClock`
- `apple`
- `arrowDown`

...and 283 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ep/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addLocation, aim, alarmClock, apple } from '@stacksjs/iconify-ep'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addLocation: renderIcon(addLocation, { size: 20, class: 'nav-icon' }),
    aim: renderIcon(aim, { size: 20, class: 'nav-icon' }),
    alarmClock: renderIcon(alarmClock, { size: 20, class: 'nav-icon' }),
    apple: renderIcon(apple, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addLocation !!} Home</a>
  <a href="/about">{!! navIcons.aim !!} About</a>
  <a href="/contact">{!! navIcons.alarmClock !!} Contact</a>
  <a href="/settings">{!! navIcons.apple !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addLocation } from '@stacksjs/iconify-ep'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addLocation, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ep'
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
   import { addLocation, aim } from '@stacksjs/iconify-ep'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ep'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addLocation } from '@stacksjs/iconify-ep'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addLocation, { size: 24 })
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
import { addLocation } from '@stacksjs/iconify-ep'

// Icons are typed as IconData
const myIcon: IconData = addLocation
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/element-plus/element-plus-icons/blob/main/packages/svg/package.json) for more information.

## Credits

- **Icons**: Element Plus ([Website](https://github.com/element-plus/element-plus-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ep/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ep/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
