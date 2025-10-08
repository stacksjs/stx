# Nimbus

> Nimbus icons for stx from Iconify

## Overview

This package provides access to 140 icons from the Nimbus collection through the stx iconify integration.

**Collection ID:** `nimbus`
**Total Icons:** 140
**Author:** Linkedstore S.A. ([Website](https://github.com/cyberalien/nimbus-icons))
**License:** MIT ([Details](https://github.com/cyberalien/nimbus-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nimbus
```

## Quick Start

### In stx Templates

```html
@js
  import { accordion, alignCenter, alignLeft } from '@stacksjs/iconify-nimbus'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accordion: renderIcon(accordion, { size: 24 }),
    alignCenter: renderIcon(alignCenter, { size: 24, color: '#4a90e2' }),
    alignLeft: renderIcon(alignLeft, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accordion !!}
  {!! icons.alignCenter !!}
  {!! icons.alignLeft !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accordion, alignCenter, alignLeft } from '@stacksjs/iconify-nimbus'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accordion, { size: 24 })

// With custom color
const coloredIcon = renderIcon(alignCenter, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alignLeft, {
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

This package contains **140** icons. Here are some examples:

- `accordion`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `apps`

...and 130 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/nimbus/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accordion, alignCenter, alignLeft, alignRight } from '@stacksjs/iconify-nimbus'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accordion: renderIcon(accordion, { size: 20, class: 'nav-icon' }),
    alignCenter: renderIcon(alignCenter, { size: 20, class: 'nav-icon' }),
    alignLeft: renderIcon(alignLeft, { size: 20, class: 'nav-icon' }),
    alignRight: renderIcon(alignRight, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accordion !!} Home</a>
  <a href="/about">{!! navIcons.alignCenter !!} About</a>
  <a href="/contact">{!! navIcons.alignLeft !!} Contact</a>
  <a href="/settings">{!! navIcons.alignRight !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accordion } from '@stacksjs/iconify-nimbus'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accordion, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-nimbus'
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
   import { accordion, alignCenter } from '@stacksjs/iconify-nimbus'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-nimbus'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accordion } from '@stacksjs/iconify-nimbus'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accordion, { size: 24 })
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
import { accordion } from '@stacksjs/iconify-nimbus'

// Icons are typed as IconData
const myIcon: IconData = accordion
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/cyberalien/nimbus-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Linkedstore S.A. ([Website](https://github.com/cyberalien/nimbus-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nimbus/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nimbus/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
