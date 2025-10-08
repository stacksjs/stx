# Famicons

> Famicons icons for stx from Iconify

## Overview

This package provides access to 1342 icons from the Famicons collection through the stx iconify integration.

**Collection ID:** `famicons`
**Total Icons:** 1342
**Author:** Family ([Website](https://github.com/familyjs/famicons))
**License:** MIT ([Details](https://github.com/familyjs/famicons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-famicons
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility, accessibilityOutline, accessibilitySharp } from '@stacksjs/iconify-famicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility: renderIcon(accessibility, { size: 24 }),
    accessibilityOutline: renderIcon(accessibilityOutline, { size: 24, color: '#4a90e2' }),
    accessibilitySharp: renderIcon(accessibilitySharp, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility !!}
  {!! icons.accessibilityOutline !!}
  {!! icons.accessibilitySharp !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility, accessibilityOutline, accessibilitySharp } from '@stacksjs/iconify-famicons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibilityOutline, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accessibilitySharp, {
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

This package contains **1342** icons. Here are some examples:

- `accessibility`
- `accessibilityOutline`
- `accessibilitySharp`
- `add`
- `addCircle`

...and 1332 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/famicons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility, accessibilityOutline, accessibilitySharp, add } from '@stacksjs/iconify-famicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    accessibilityOutline: renderIcon(accessibilityOutline, { size: 20, class: 'nav-icon' }),
    accessibilitySharp: renderIcon(accessibilitySharp, { size: 20, class: 'nav-icon' }),
    add: renderIcon(add, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility !!} Home</a>
  <a href="/about">{!! navIcons.accessibilityOutline !!} About</a>
  <a href="/contact">{!! navIcons.accessibilitySharp !!} Contact</a>
  <a href="/settings">{!! navIcons.add !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility } from '@stacksjs/iconify-famicons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-famicons'
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
   import { accessibility, accessibilityOutline } from '@stacksjs/iconify-famicons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-famicons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-famicons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility, { size: 24 })
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
import { accessibility } from '@stacksjs/iconify-famicons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/familyjs/famicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Family ([Website](https://github.com/familyjs/famicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/famicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/famicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
