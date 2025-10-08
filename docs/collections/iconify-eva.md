# Eva Icons

> Eva Icons icons for stx from Iconify

## Overview

This package provides access to 490 icons from the Eva Icons collection through the stx iconify integration.

**Collection ID:** `eva`
**Total Icons:** 490
**Author:** Akveo ([Website](https://github.com/akveo/eva-icons/))
**License:** MIT ([Details](https://github.com/akveo/eva-icons/blob/master/LICENSE.txt))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-eva
```

## Quick Start

### In stx Templates

```html
@js
  import { activityFill, activityOutline, alertCircleFill } from '@stacksjs/iconify-eva'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    activityFill: renderIcon(activityFill, { size: 24 }),
    activityOutline: renderIcon(activityOutline, { size: 24, color: '#4a90e2' }),
    alertCircleFill: renderIcon(alertCircleFill, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.activityFill !!}
  {!! icons.activityOutline !!}
  {!! icons.alertCircleFill !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { activityFill, activityOutline, alertCircleFill } from '@stacksjs/iconify-eva'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(activityFill, { size: 24 })

// With custom color
const coloredIcon = renderIcon(activityOutline, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alertCircleFill, {
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

This package contains **490** icons. Here are some examples:

- `activityFill`
- `activityOutline`
- `alertCircleFill`
- `alertCircleOutline`
- `alertTriangleFill`

...and 480 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/eva/).

## Usage Examples

### Navigation Menu

```html
@js
  import { activityFill, activityOutline, alertCircleFill, alertCircleOutline } from '@stacksjs/iconify-eva'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    activityFill: renderIcon(activityFill, { size: 20, class: 'nav-icon' }),
    activityOutline: renderIcon(activityOutline, { size: 20, class: 'nav-icon' }),
    alertCircleFill: renderIcon(alertCircleFill, { size: 20, class: 'nav-icon' }),
    alertCircleOutline: renderIcon(alertCircleOutline, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.activityFill !!} Home</a>
  <a href="/about">{!! navIcons.activityOutline !!} About</a>
  <a href="/contact">{!! navIcons.alertCircleFill !!} Contact</a>
  <a href="/settings">{!! navIcons.alertCircleOutline !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { activityFill } from '@stacksjs/iconify-eva'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(activityFill, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-eva'
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
   import { activityFill, activityOutline } from '@stacksjs/iconify-eva'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-eva'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { activityFill } from '@stacksjs/iconify-eva'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(activityFill, { size: 24 })
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
import { activityFill } from '@stacksjs/iconify-eva'

// Icons are typed as IconData
const myIcon: IconData = activityFill
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/akveo/eva-icons/blob/master/LICENSE.txt) for more information.

## Credits

- **Icons**: Akveo ([Website](https://github.com/akveo/eva-icons/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/eva/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/eva/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
