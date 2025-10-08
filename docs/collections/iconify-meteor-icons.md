# Meteor Icons

> Meteor Icons icons for stx from Iconify

## Overview

This package provides access to 321 icons from the Meteor Icons collection through the stx iconify integration.

**Collection ID:** `meteor-icons`
**Total Icons:** 321
**Author:** zkreations ([Website](https://github.com/zkreations/icons))
**License:** MIT ([Details](https://github.com/zkreations/icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-meteor-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { adobe, airplay, alarmClock } from '@stacksjs/iconify-meteor-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    adobe: renderIcon(adobe, { size: 24 }),
    airplay: renderIcon(airplay, { size: 24, color: '#4a90e2' }),
    alarmClock: renderIcon(alarmClock, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.adobe !!}
  {!! icons.airplay !!}
  {!! icons.alarmClock !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { adobe, airplay, alarmClock } from '@stacksjs/iconify-meteor-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(adobe, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplay, {
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

This package contains **321** icons. Here are some examples:

- `adobe`
- `airplay`
- `alarmClock`
- `alarmExclamation`
- `alarmMinus`

...and 311 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/meteor-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { adobe, airplay, alarmClock, alarmExclamation } from '@stacksjs/iconify-meteor-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    adobe: renderIcon(adobe, { size: 20, class: 'nav-icon' }),
    airplay: renderIcon(airplay, { size: 20, class: 'nav-icon' }),
    alarmClock: renderIcon(alarmClock, { size: 20, class: 'nav-icon' }),
    alarmExclamation: renderIcon(alarmExclamation, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.adobe !!} Home</a>
  <a href="/about">{!! navIcons.airplay !!} About</a>
  <a href="/contact">{!! navIcons.alarmClock !!} Contact</a>
  <a href="/settings">{!! navIcons.alarmExclamation !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { adobe } from '@stacksjs/iconify-meteor-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(adobe, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-meteor-icons'
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
   import { adobe, airplay } from '@stacksjs/iconify-meteor-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-meteor-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { adobe } from '@stacksjs/iconify-meteor-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(adobe, { size: 24 })
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
import { adobe } from '@stacksjs/iconify-meteor-icons'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/zkreations/icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: zkreations ([Website](https://github.com/zkreations/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/meteor-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/meteor-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
