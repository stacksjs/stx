# Lsicon

> Lsicon icons for stx from Iconify

## Overview

This package provides access to 716 icons from the Lsicon collection through the stx iconify integration.

**Collection ID:** `lsicon`
**Total Icons:** 716
**Author:** Wis Design ([Website](https://www.lsicon.com/))
**License:** MIT ([Details](https://github.com/wisdesignsystem/lsicon/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lsicon
```

## Quick Start

### In stx Templates

```html
@js
  import { addChatFilled, addChatOutline, addChatTwoFilled } from '@stacksjs/iconify-lsicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addChatFilled: renderIcon(addChatFilled, { size: 24 }),
    addChatOutline: renderIcon(addChatOutline, { size: 24, color: '#4a90e2' }),
    addChatTwoFilled: renderIcon(addChatTwoFilled, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addChatFilled !!}
  {!! icons.addChatOutline !!}
  {!! icons.addChatTwoFilled !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addChatFilled, addChatOutline, addChatTwoFilled } from '@stacksjs/iconify-lsicon'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addChatFilled, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addChatOutline, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addChatTwoFilled, {
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

This package contains **716** icons. Here are some examples:

- `addChatFilled`
- `addChatOutline`
- `addChatTwoFilled`
- `addChatTwoOutline`
- `addOneFilled`

...and 706 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/lsicon/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addChatFilled, addChatOutline, addChatTwoFilled, addChatTwoOutline } from '@stacksjs/iconify-lsicon'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addChatFilled: renderIcon(addChatFilled, { size: 20, class: 'nav-icon' }),
    addChatOutline: renderIcon(addChatOutline, { size: 20, class: 'nav-icon' }),
    addChatTwoFilled: renderIcon(addChatTwoFilled, { size: 20, class: 'nav-icon' }),
    addChatTwoOutline: renderIcon(addChatTwoOutline, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addChatFilled !!} Home</a>
  <a href="/about">{!! navIcons.addChatOutline !!} About</a>
  <a href="/contact">{!! navIcons.addChatTwoFilled !!} Contact</a>
  <a href="/settings">{!! navIcons.addChatTwoOutline !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addChatFilled } from '@stacksjs/iconify-lsicon'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addChatFilled, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-lsicon'
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
   import { addChatFilled, addChatOutline } from '@stacksjs/iconify-lsicon'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-lsicon'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addChatFilled } from '@stacksjs/iconify-lsicon'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addChatFilled, { size: 24 })
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
import { addChatFilled } from '@stacksjs/iconify-lsicon'

// Icons are typed as IconData
const myIcon: IconData = addChatFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/wisdesignsystem/lsicon/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Wis Design ([Website](https://www.lsicon.com/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lsicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lsicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
