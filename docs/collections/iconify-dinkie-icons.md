# Dinkie Icons

> Dinkie Icons icons for stx from Iconify

## Overview

This package provides access to 1198 icons from the Dinkie Icons collection through the stx iconify integration.

**Collection ID:** `dinkie-icons`
**Total Icons:** 1198
**Author:** atelierAnchor ([Website](https://github.com/atelier-anchor/dinkie-icons))
**License:** MIT ([Details](https://github.com/atelier-anchor/dinkie-icons/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-dinkie-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { abacus, acceptCircle, acceptCircleFilled } from '@stacksjs/iconify-dinkie-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abacus: renderIcon(abacus, { size: 24 }),
    acceptCircle: renderIcon(acceptCircle, { size: 24, color: '#4a90e2' }),
    acceptCircleFilled: renderIcon(acceptCircleFilled, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abacus !!}
  {!! icons.acceptCircle !!}
  {!! icons.acceptCircleFilled !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abacus, acceptCircle, acceptCircleFilled } from '@stacksjs/iconify-dinkie-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abacus, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acceptCircle, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(acceptCircleFilled, {
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

This package contains **1198** icons. Here are some examples:

- `abacus`
- `acceptCircle`
- `acceptCircleFilled`
- `accordion`
- `addressBook`

...and 1188 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/dinkie-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abacus, acceptCircle, acceptCircleFilled, accordion } from '@stacksjs/iconify-dinkie-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abacus: renderIcon(abacus, { size: 20, class: 'nav-icon' }),
    acceptCircle: renderIcon(acceptCircle, { size: 20, class: 'nav-icon' }),
    acceptCircleFilled: renderIcon(acceptCircleFilled, { size: 20, class: 'nav-icon' }),
    accordion: renderIcon(accordion, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abacus !!} Home</a>
  <a href="/about">{!! navIcons.acceptCircle !!} About</a>
  <a href="/contact">{!! navIcons.acceptCircleFilled !!} Contact</a>
  <a href="/settings">{!! navIcons.accordion !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abacus } from '@stacksjs/iconify-dinkie-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abacus, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-dinkie-icons'
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
   import { abacus, acceptCircle } from '@stacksjs/iconify-dinkie-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-dinkie-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abacus } from '@stacksjs/iconify-dinkie-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abacus, { size: 24 })
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
import { abacus } from '@stacksjs/iconify-dinkie-icons'

// Icons are typed as IconData
const myIcon: IconData = abacus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/atelier-anchor/dinkie-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: atelierAnchor ([Website](https://github.com/atelier-anchor/dinkie-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/dinkie-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/dinkie-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
