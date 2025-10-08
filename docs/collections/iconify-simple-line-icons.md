# Simple line icons

> Simple line icons icons for stx from Iconify

## Overview

This package provides access to 194 icons from the Simple line icons collection through the stx iconify integration.

**Collection ID:** `simple-line-icons`
**Total Icons:** 194
**Author:** Sabbir Ahmed ([Website](https://github.com/thesabbir/simple-line-icons))
**License:** MIT ([Details](https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-simple-line-icons
```

## Quick Start

### In stx Templates

```html
@js
  import { actionRedo, actionUndo, anchor } from '@stacksjs/iconify-simple-line-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    actionRedo: renderIcon(actionRedo, { size: 24 }),
    actionUndo: renderIcon(actionUndo, { size: 24, color: '#4a90e2' }),
    anchor: renderIcon(anchor, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.actionRedo !!}
  {!! icons.actionUndo !!}
  {!! icons.anchor !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { actionRedo, actionUndo, anchor } from '@stacksjs/iconify-simple-line-icons'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(actionRedo, { size: 24 })

// With custom color
const coloredIcon = renderIcon(actionUndo, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(anchor, {
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

This package contains **194** icons. Here are some examples:

- `actionRedo`
- `actionUndo`
- `anchor`
- `arrowDown`
- `arrowDownCircle`

...and 184 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/simple-line-icons/).

## Usage Examples

### Navigation Menu

```html
@js
  import { actionRedo, actionUndo, anchor, arrowDown } from '@stacksjs/iconify-simple-line-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    actionRedo: renderIcon(actionRedo, { size: 20, class: 'nav-icon' }),
    actionUndo: renderIcon(actionUndo, { size: 20, class: 'nav-icon' }),
    anchor: renderIcon(anchor, { size: 20, class: 'nav-icon' }),
    arrowDown: renderIcon(arrowDown, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.actionRedo !!} Home</a>
  <a href="/about">{!! navIcons.actionUndo !!} About</a>
  <a href="/contact">{!! navIcons.anchor !!} Contact</a>
  <a href="/settings">{!! navIcons.arrowDown !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { actionRedo } from '@stacksjs/iconify-simple-line-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(actionRedo, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-simple-line-icons'
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
   import { actionRedo, actionUndo } from '@stacksjs/iconify-simple-line-icons'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-simple-line-icons'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { actionRedo } from '@stacksjs/iconify-simple-line-icons'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(actionRedo, { size: 24 })
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
import { actionRedo } from '@stacksjs/iconify-simple-line-icons'

// Icons are typed as IconData
const myIcon: IconData = actionRedo
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Sabbir Ahmed ([Website](https://github.com/thesabbir/simple-line-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/simple-line-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/simple-line-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
