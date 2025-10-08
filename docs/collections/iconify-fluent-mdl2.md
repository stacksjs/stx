# Fluent UI MDL2

> Fluent UI MDL2 icons for stx from Iconify

## Overview

This package provides access to 1735 icons from the Fluent UI MDL2 collection through the stx iconify integration.

**Collection ID:** `fluent-mdl2`
**Total Icons:** 1735
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui/tree/master/packages/react-icons-mdl2))
**License:** MIT ([Details](https://github.com/microsoft/fluentui/blob/master/packages/react-icons-mdl2/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent-mdl2
```

## Quick Start

### In stx Templates

```html
@js
  import { accept, acceptMedium, accessLogo } from '@stacksjs/iconify-fluent-mdl2'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accept: renderIcon(accept, { size: 24 }),
    acceptMedium: renderIcon(acceptMedium, { size: 24, color: '#4a90e2' }),
    accessLogo: renderIcon(accessLogo, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accept !!}
  {!! icons.acceptMedium !!}
  {!! icons.accessLogo !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accept, acceptMedium, accessLogo } from '@stacksjs/iconify-fluent-mdl2'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accept, { size: 24 })

// With custom color
const coloredIcon = renderIcon(acceptMedium, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accessLogo, {
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

This package contains **1735** icons. Here are some examples:

- `accept`
- `acceptMedium`
- `accessLogo`
- `accessibiltyChecker`
- `accountActivity`

...and 1725 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/fluent-mdl2/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accept, acceptMedium, accessLogo, accessibiltyChecker } from '@stacksjs/iconify-fluent-mdl2'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accept: renderIcon(accept, { size: 20, class: 'nav-icon' }),
    acceptMedium: renderIcon(acceptMedium, { size: 20, class: 'nav-icon' }),
    accessLogo: renderIcon(accessLogo, { size: 20, class: 'nav-icon' }),
    accessibiltyChecker: renderIcon(accessibiltyChecker, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accept !!} Home</a>
  <a href="/about">{!! navIcons.acceptMedium !!} About</a>
  <a href="/contact">{!! navIcons.accessLogo !!} Contact</a>
  <a href="/settings">{!! navIcons.accessibiltyChecker !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accept } from '@stacksjs/iconify-fluent-mdl2'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accept, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-fluent-mdl2'
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
   import { accept, acceptMedium } from '@stacksjs/iconify-fluent-mdl2'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-fluent-mdl2'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accept } from '@stacksjs/iconify-fluent-mdl2'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accept, { size: 24 })
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
import { accept } from '@stacksjs/iconify-fluent-mdl2'

// Icons are typed as IconData
const myIcon: IconData = accept
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui/blob/master/packages/react-icons-mdl2/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui/tree/master/packages/react-icons-mdl2))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent-mdl2/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent-mdl2/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
