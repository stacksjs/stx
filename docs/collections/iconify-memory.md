# Memory Icons

> Memory Icons icons for stx from Iconify

## Overview

This package provides access to 651 icons from the Memory Icons collection through the stx iconify integration.

**Collection ID:** `memory`
**Total Icons:** 651
**Author:** Pictogrammers ([Website](https://github.com/Pictogrammers/Memory))
**License:** Apache 2.0 ([Details](https://github.com/Pictogrammers/Memory/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-memory
```

## Quick Start

### In stx Templates

```html
@js
  import { account, accountBox, alert } from '@stacksjs/iconify-memory'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    account: renderIcon(account, { size: 24 }),
    accountBox: renderIcon(accountBox, { size: 24, color: '#4a90e2' }),
    alert: renderIcon(alert, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.account !!}
  {!! icons.accountBox !!}
  {!! icons.alert !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { account, accountBox, alert } from '@stacksjs/iconify-memory'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(account, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accountBox, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alert, {
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

This package contains **651** icons. Here are some examples:

- `account`
- `accountBox`
- `alert`
- `alertBox`
- `alertBoxFill`

...and 641 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/memory/).

## Usage Examples

### Navigation Menu

```html
@js
  import { account, accountBox, alert, alertBox } from '@stacksjs/iconify-memory'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    account: renderIcon(account, { size: 20, class: 'nav-icon' }),
    accountBox: renderIcon(accountBox, { size: 20, class: 'nav-icon' }),
    alert: renderIcon(alert, { size: 20, class: 'nav-icon' }),
    alertBox: renderIcon(alertBox, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.account !!} Home</a>
  <a href="/about">{!! navIcons.accountBox !!} About</a>
  <a href="/contact">{!! navIcons.alert !!} Contact</a>
  <a href="/settings">{!! navIcons.alertBox !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { account } from '@stacksjs/iconify-memory'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(account, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-memory'
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
   import { account, accountBox } from '@stacksjs/iconify-memory'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-memory'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { account } from '@stacksjs/iconify-memory'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(account, { size: 24 })
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
import { account } from '@stacksjs/iconify-memory'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Pictogrammers/Memory/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Pictogrammers ([Website](https://github.com/Pictogrammers/Memory))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/memory/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/memory/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
