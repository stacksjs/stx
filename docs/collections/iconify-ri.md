# Remix Icon

> Remix Icon icons for stx from Iconify

## Overview

This package provides access to 3058 icons from the Remix Icon collection through the stx iconify integration.

**Collection ID:** `ri`
**Total Icons:** 3058
**Author:** Remix Design ([Website](https://github.com/Remix-Design/RemixIcon))
**License:** Apache 2.0 ([Details](https://github.com/Remix-Design/RemixIcon/blob/master/License))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ri
```

## Quick Start

### In stx Templates

```html
@js
  import { 24HoursFill, 24HoursLine, 4kFill } from '@stacksjs/iconify-ri'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    24HoursFill: renderIcon(24HoursFill, { size: 24 }),
    24HoursLine: renderIcon(24HoursLine, { size: 24, color: '#4a90e2' }),
    4kFill: renderIcon(4kFill, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.24HoursFill !!}
  {!! icons.24HoursLine !!}
  {!! icons.4kFill !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 24HoursFill, 24HoursLine, 4kFill } from '@stacksjs/iconify-ri'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(24HoursFill, { size: 24 })

// With custom color
const coloredIcon = renderIcon(24HoursLine, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(4kFill, {
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

This package contains **3058** icons. Here are some examples:

- `24HoursFill`
- `24HoursLine`
- `4kFill`
- `4kLine`
- `aB`

...and 3048 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ri/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 24HoursFill, 24HoursLine, 4kFill, 4kLine } from '@stacksjs/iconify-ri'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    24HoursFill: renderIcon(24HoursFill, { size: 20, class: 'nav-icon' }),
    24HoursLine: renderIcon(24HoursLine, { size: 20, class: 'nav-icon' }),
    4kFill: renderIcon(4kFill, { size: 20, class: 'nav-icon' }),
    4kLine: renderIcon(4kLine, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.24HoursFill !!} Home</a>
  <a href="/about">{!! navIcons.24HoursLine !!} About</a>
  <a href="/contact">{!! navIcons.4kFill !!} Contact</a>
  <a href="/settings">{!! navIcons.4kLine !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 24HoursFill } from '@stacksjs/iconify-ri'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(24HoursFill, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ri'
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
   import { 24HoursFill, 24HoursLine } from '@stacksjs/iconify-ri'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ri'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 24HoursFill } from '@stacksjs/iconify-ri'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(24HoursFill, { size: 24 })
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
import { 24HoursFill } from '@stacksjs/iconify-ri'

// Icons are typed as IconData
const myIcon: IconData = 24HoursFill
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Remix-Design/RemixIcon/blob/master/License) for more information.

## Credits

- **Icons**: Remix Design ([Website](https://github.com/Remix-Design/RemixIcon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ri/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ri/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
