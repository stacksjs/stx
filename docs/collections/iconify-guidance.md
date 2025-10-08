# Guidance

> Guidance icons for stx from Iconify

## Overview

This package provides access to 360 icons from the Guidance collection through the stx iconify integration.

**Collection ID:** `guidance`
**Total Icons:** 360
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-guidance
```

## Quick Start

### In stx Templates

```html
@js
  import { 24Hours, accesibleRestroom, accessForHearingLoss } from '@stacksjs/iconify-guidance'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    24Hours: renderIcon(24Hours, { size: 24 }),
    accesibleRestroom: renderIcon(accesibleRestroom, { size: 24, color: '#4a90e2' }),
    accessForHearingLoss: renderIcon(accessForHearingLoss, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.24Hours !!}
  {!! icons.accesibleRestroom !!}
  {!! icons.accessForHearingLoss !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 24Hours, accesibleRestroom, accessForHearingLoss } from '@stacksjs/iconify-guidance'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(24Hours, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accesibleRestroom, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accessForHearingLoss, {
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

This package contains **360** icons. Here are some examples:

- `24Hours`
- `accesibleRestroom`
- `accessForHearingLoss`
- `accessToLowVision`
- `accessibleExit`

...and 350 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/guidance/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 24Hours, accesibleRestroom, accessForHearingLoss, accessToLowVision } from '@stacksjs/iconify-guidance'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    24Hours: renderIcon(24Hours, { size: 20, class: 'nav-icon' }),
    accesibleRestroom: renderIcon(accesibleRestroom, { size: 20, class: 'nav-icon' }),
    accessForHearingLoss: renderIcon(accessForHearingLoss, { size: 20, class: 'nav-icon' }),
    accessToLowVision: renderIcon(accessToLowVision, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.24Hours !!} Home</a>
  <a href="/about">{!! navIcons.accesibleRestroom !!} About</a>
  <a href="/contact">{!! navIcons.accessForHearingLoss !!} Contact</a>
  <a href="/settings">{!! navIcons.accessToLowVision !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 24Hours } from '@stacksjs/iconify-guidance'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(24Hours, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-guidance'
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
   import { 24Hours, accesibleRestroom } from '@stacksjs/iconify-guidance'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-guidance'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 24Hours } from '@stacksjs/iconify-guidance'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(24Hours, { size: 24 })
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
import { 24Hours } from '@stacksjs/iconify-guidance'

// Icons are typed as IconData
const myIcon: IconData = 24Hours
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/guidance/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/guidance/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
