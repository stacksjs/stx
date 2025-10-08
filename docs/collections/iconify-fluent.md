# Fluent UI System Icons

> Fluent UI System Icons icons for stx from Iconify

## Overview

This package provides access to 18908 icons from the Fluent UI System Icons collection through the stx iconify integration.

**Collection ID:** `fluent`
**Total Icons:** 18908
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-system-icons))
**License:** MIT ([Details](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent
```

## Quick Start

### In stx Templates

```html
@js
  import { accessTime20Filled, accessTime20Regular, accessTime24Filled } from '@stacksjs/iconify-fluent'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessTime20Filled: renderIcon(accessTime20Filled, { size: 24 }),
    accessTime20Regular: renderIcon(accessTime20Regular, { size: 24, color: '#4a90e2' }),
    accessTime24Filled: renderIcon(accessTime24Filled, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessTime20Filled !!}
  {!! icons.accessTime20Regular !!}
  {!! icons.accessTime24Filled !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessTime20Filled, accessTime20Regular, accessTime24Filled } from '@stacksjs/iconify-fluent'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessTime20Filled, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessTime20Regular, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accessTime24Filled, {
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

This package contains **18908** icons. Here are some examples:

- `accessTime20Filled`
- `accessTime20Regular`
- `accessTime24Filled`
- `accessTime24Regular`
- `accessibility16Filled`

...and 18898 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fluent/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessTime20Filled, accessTime20Regular, accessTime24Filled, accessTime24Regular } from '@stacksjs/iconify-fluent'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessTime20Filled: renderIcon(accessTime20Filled, { size: 20, class: 'nav-icon' }),
    accessTime20Regular: renderIcon(accessTime20Regular, { size: 20, class: 'nav-icon' }),
    accessTime24Filled: renderIcon(accessTime24Filled, { size: 20, class: 'nav-icon' }),
    accessTime24Regular: renderIcon(accessTime24Regular, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessTime20Filled !!} Home</a>
  <a href="/about">{!! navIcons.accessTime20Regular !!} About</a>
  <a href="/contact">{!! navIcons.accessTime24Filled !!} Contact</a>
  <a href="/settings">{!! navIcons.accessTime24Regular !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessTime20Filled } from '@stacksjs/iconify-fluent'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessTime20Filled, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fluent'
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
   import { accessTime20Filled, accessTime20Regular } from '@stacksjs/iconify-fluent'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fluent'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessTime20Filled } from '@stacksjs/iconify-fluent'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessTime20Filled, { size: 24 })
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
import { accessTime20Filled } from '@stacksjs/iconify-fluent'

// Icons are typed as IconData
const myIcon: IconData = accessTime20Filled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui-system-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
