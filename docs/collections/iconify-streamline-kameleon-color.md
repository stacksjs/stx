# Kameleon color icons

> Kameleon color icons icons for stx from Iconify

## Overview

This package provides access to 400 icons from the Kameleon color icons collection through the stx iconify integration.

**Collection ID:** `streamline-kameleon-color`
**Total Icons:** 400
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-kameleon-color
```

## Quick Start

### In stx Templates

```html
@js
  import { aidKit, aidKitDuo, airconditioner } from '@stacksjs/iconify-streamline-kameleon-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aidKit: renderIcon(aidKit, { size: 24 }),
    aidKitDuo: renderIcon(aidKitDuo, { size: 24, color: '#4a90e2' }),
    airconditioner: renderIcon(airconditioner, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aidKit !!}
  {!! icons.aidKitDuo !!}
  {!! icons.airconditioner !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aidKit, aidKitDuo, airconditioner } from '@stacksjs/iconify-streamline-kameleon-color'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aidKit, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aidKitDuo, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(airconditioner, {
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

This package contains **400** icons. Here are some examples:

- `aidKit`
- `aidKitDuo`
- `airconditioner`
- `airconditionerDuo`
- `airdropBox`

...and 390 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-kameleon-color/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aidKit, aidKitDuo, airconditioner, airconditionerDuo } from '@stacksjs/iconify-streamline-kameleon-color'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aidKit: renderIcon(aidKit, { size: 20, class: 'nav-icon' }),
    aidKitDuo: renderIcon(aidKitDuo, { size: 20, class: 'nav-icon' }),
    airconditioner: renderIcon(airconditioner, { size: 20, class: 'nav-icon' }),
    airconditionerDuo: renderIcon(airconditionerDuo, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aidKit !!} Home</a>
  <a href="/about">{!! navIcons.aidKitDuo !!} About</a>
  <a href="/contact">{!! navIcons.airconditioner !!} Contact</a>
  <a href="/settings">{!! navIcons.airconditionerDuo !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aidKit } from '@stacksjs/iconify-streamline-kameleon-color'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aidKit, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-kameleon-color'
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
   import { aidKit, aidKitDuo } from '@stacksjs/iconify-streamline-kameleon-color'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-kameleon-color'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aidKit } from '@stacksjs/iconify-streamline-kameleon-color'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aidKit, { size: 24 })
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
import { aidKit } from '@stacksjs/iconify-streamline-kameleon-color'

// Icons are typed as IconData
const myIcon: IconData = aidKit
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-kameleon-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-kameleon-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
