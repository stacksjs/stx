# Stash Icons

> Stash Icons icons for stx from Iconify

## Overview

This package provides access to 982 icons from the Stash Icons collection through the stx iconify integration.

**Collection ID:** `stash`
**Total Icons:** 982
**Author:** Pingback LLC ([Website](https://github.com/stash-ui/icons))
**License:** MIT ([Details](https://github.com/stash-ui/icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-stash
```

## Quick Start

### In stx Templates

```html
@js
  import { airplane, airplaneDuotone, airplaneLight } from '@stacksjs/iconify-stash'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    airplane: renderIcon(airplane, { size: 24 }),
    airplaneDuotone: renderIcon(airplaneDuotone, { size: 24, color: '#4a90e2' }),
    airplaneLight: renderIcon(airplaneLight, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.airplane !!}
  {!! icons.airplaneDuotone !!}
  {!! icons.airplaneLight !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { airplane, airplaneDuotone, airplaneLight } from '@stacksjs/iconify-stash'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(airplane, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplaneDuotone, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(airplaneLight, {
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

This package contains **982** icons. Here are some examples:

- `airplane`
- `airplaneDuotone`
- `airplaneLight`
- `airplaneSolid`
- `angleDown`

...and 972 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/stash/).

## Usage Examples

### Navigation Menu

```html
@js
  import { airplane, airplaneDuotone, airplaneLight, airplaneSolid } from '@stacksjs/iconify-stash'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    airplane: renderIcon(airplane, { size: 20, class: 'nav-icon' }),
    airplaneDuotone: renderIcon(airplaneDuotone, { size: 20, class: 'nav-icon' }),
    airplaneLight: renderIcon(airplaneLight, { size: 20, class: 'nav-icon' }),
    airplaneSolid: renderIcon(airplaneSolid, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.airplane !!} Home</a>
  <a href="/about">{!! navIcons.airplaneDuotone !!} About</a>
  <a href="/contact">{!! navIcons.airplaneLight !!} Contact</a>
  <a href="/settings">{!! navIcons.airplaneSolid !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { airplane } from '@stacksjs/iconify-stash'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(airplane, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-stash'
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
   import { airplane, airplaneDuotone } from '@stacksjs/iconify-stash'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-stash'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-stash'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(airplane, { size: 24 })
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
import { airplane } from '@stacksjs/iconify-stash'

// Icons are typed as IconData
const myIcon: IconData = airplane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/stash-ui/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Pingback LLC ([Website](https://github.com/stash-ui/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/stash/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/stash/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
