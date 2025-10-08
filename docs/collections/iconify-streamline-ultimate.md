# Ultimate free icons

> Ultimate free icons icons for stx from Iconify

## Overview

This package provides access to 1999 icons from the Ultimate free icons collection through the stx iconify integration.

**Collection ID:** `streamline-ultimate`
**Total Icons:** 1999
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-ultimate
```

## Quick Start

### In stx Templates

```html
@js
  import { a11yAccessibilityDisability, a11yAccessibilityDisabilityBold, abTestingMonitors } from '@stacksjs/iconify-streamline-ultimate'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    a11yAccessibilityDisability: renderIcon(a11yAccessibilityDisability, { size: 24 }),
    a11yAccessibilityDisabilityBold: renderIcon(a11yAccessibilityDisabilityBold, { size: 24, color: '#4a90e2' }),
    abTestingMonitors: renderIcon(abTestingMonitors, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.a11yAccessibilityDisability !!}
  {!! icons.a11yAccessibilityDisabilityBold !!}
  {!! icons.abTestingMonitors !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { a11yAccessibilityDisability, a11yAccessibilityDisabilityBold, abTestingMonitors } from '@stacksjs/iconify-streamline-ultimate'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(a11yAccessibilityDisability, { size: 24 })

// With custom color
const coloredIcon = renderIcon(a11yAccessibilityDisabilityBold, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(abTestingMonitors, {
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

This package contains **1999** icons. Here are some examples:

- `a11yAccessibilityDisability`
- `a11yAccessibilityDisabilityBold`
- `abTestingMonitors`
- `abTestingMonitorsBold`
- `accountingBillStack1`

...and 1989 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-ultimate/).

## Usage Examples

### Navigation Menu

```html
@js
  import { a11yAccessibilityDisability, a11yAccessibilityDisabilityBold, abTestingMonitors, abTestingMonitorsBold } from '@stacksjs/iconify-streamline-ultimate'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    a11yAccessibilityDisability: renderIcon(a11yAccessibilityDisability, { size: 20, class: 'nav-icon' }),
    a11yAccessibilityDisabilityBold: renderIcon(a11yAccessibilityDisabilityBold, { size: 20, class: 'nav-icon' }),
    abTestingMonitors: renderIcon(abTestingMonitors, { size: 20, class: 'nav-icon' }),
    abTestingMonitorsBold: renderIcon(abTestingMonitorsBold, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.a11yAccessibilityDisability !!} Home</a>
  <a href="/about">{!! navIcons.a11yAccessibilityDisabilityBold !!} About</a>
  <a href="/contact">{!! navIcons.abTestingMonitors !!} Contact</a>
  <a href="/settings">{!! navIcons.abTestingMonitorsBold !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { a11yAccessibilityDisability } from '@stacksjs/iconify-streamline-ultimate'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(a11yAccessibilityDisability, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-ultimate'
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
   import { a11yAccessibilityDisability, a11yAccessibilityDisabilityBold } from '@stacksjs/iconify-streamline-ultimate'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-ultimate'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { a11yAccessibilityDisability } from '@stacksjs/iconify-streamline-ultimate'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(a11yAccessibilityDisability, { size: 24 })
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
import { a11yAccessibilityDisability } from '@stacksjs/iconify-streamline-ultimate'

// Icons are typed as IconData
const myIcon: IconData = a11yAccessibilityDisability
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-ultimate/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-ultimate/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
