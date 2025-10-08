# Sargam Icons

> Sargam Icons icons for stx from Iconify

## Overview

This package provides access to 1188 icons from the Sargam Icons collection through the stx iconify integration.

**Collection ID:** `si`
**Total Icons:** 1188
**Author:** Abhimanyu Rana ([Website](https://github.com/planetabhi/sargam-icons))
**License:** MIT ([Details](https://github.com/planetabhi/sargam-icons/blob/main/LICENSE.txt))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-si
```

## Quick Start

### In stx Templates

```html
@js
  import { actionsDuotone, actionsFill, actionsLine } from '@stacksjs/iconify-si'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    actionsDuotone: renderIcon(actionsDuotone, { size: 24 }),
    actionsFill: renderIcon(actionsFill, { size: 24, color: '#4a90e2' }),
    actionsLine: renderIcon(actionsLine, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.actionsDuotone !!}
  {!! icons.actionsFill !!}
  {!! icons.actionsLine !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { actionsDuotone, actionsFill, actionsLine } from '@stacksjs/iconify-si'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(actionsDuotone, { size: 24 })

// With custom color
const coloredIcon = renderIcon(actionsFill, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(actionsLine, {
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

This package contains **1188** icons. Here are some examples:

- `actionsDuotone`
- `actionsFill`
- `actionsLine`
- `addAlarmDuotone`
- `addAlarmFill`

...and 1178 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/si/).

## Usage Examples

### Navigation Menu

```html
@js
  import { actionsDuotone, actionsFill, actionsLine, addAlarmDuotone } from '@stacksjs/iconify-si'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    actionsDuotone: renderIcon(actionsDuotone, { size: 20, class: 'nav-icon' }),
    actionsFill: renderIcon(actionsFill, { size: 20, class: 'nav-icon' }),
    actionsLine: renderIcon(actionsLine, { size: 20, class: 'nav-icon' }),
    addAlarmDuotone: renderIcon(addAlarmDuotone, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.actionsDuotone !!} Home</a>
  <a href="/about">{!! navIcons.actionsFill !!} About</a>
  <a href="/contact">{!! navIcons.actionsLine !!} Contact</a>
  <a href="/settings">{!! navIcons.addAlarmDuotone !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { actionsDuotone } from '@stacksjs/iconify-si'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(actionsDuotone, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-si'
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
   import { actionsDuotone, actionsFill } from '@stacksjs/iconify-si'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-si'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { actionsDuotone } from '@stacksjs/iconify-si'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(actionsDuotone, { size: 24 })
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
import { actionsDuotone } from '@stacksjs/iconify-si'

// Icons are typed as IconData
const myIcon: IconData = actionsDuotone
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/planetabhi/sargam-icons/blob/main/LICENSE.txt) for more information.

## Credits

- **Icons**: Abhimanyu Rana ([Website](https://github.com/planetabhi/sargam-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/si/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/si/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
