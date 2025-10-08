# WeUI Icon

> WeUI Icon icons for stx from Iconify

## Overview

This package provides access to 162 icons from the WeUI Icon collection through the stx iconify integration.

**Collection ID:** `weui`
**Total Icons:** 162
**Author:** WeUI ([Website](https://github.com/weui/weui-icon))
**License:** MIT
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-weui
```

## Quick Start

### In stx Templates

```html
@js
  import { addFilled, addFriendsFilled, addFriendsOutlined } from '@stacksjs/iconify-weui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    addFilled: renderIcon(addFilled, { size: 24 }),
    addFriendsFilled: renderIcon(addFriendsFilled, { size: 24, color: '#4a90e2' }),
    addFriendsOutlined: renderIcon(addFriendsOutlined, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.addFilled !!}
  {!! icons.addFriendsFilled !!}
  {!! icons.addFriendsOutlined !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { addFilled, addFriendsFilled, addFriendsOutlined } from '@stacksjs/iconify-weui'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(addFilled, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addFriendsFilled, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(addFriendsOutlined, {
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

This package contains **162** icons. Here are some examples:

- `addFilled`
- `addFriendsFilled`
- `addFriendsOutlined`
- `addOutlined`
- `add2Filled`

...and 152 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/weui/).

## Usage Examples

### Navigation Menu

```html
@js
  import { addFilled, addFriendsFilled, addFriendsOutlined, addOutlined } from '@stacksjs/iconify-weui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    addFilled: renderIcon(addFilled, { size: 20, class: 'nav-icon' }),
    addFriendsFilled: renderIcon(addFriendsFilled, { size: 20, class: 'nav-icon' }),
    addFriendsOutlined: renderIcon(addFriendsOutlined, { size: 20, class: 'nav-icon' }),
    addOutlined: renderIcon(addOutlined, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.addFilled !!} Home</a>
  <a href="/about">{!! navIcons.addFriendsFilled !!} About</a>
  <a href="/contact">{!! navIcons.addFriendsOutlined !!} Contact</a>
  <a href="/settings">{!! navIcons.addOutlined !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { addFilled } from '@stacksjs/iconify-weui'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(addFilled, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-weui'
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
   import { addFilled, addFriendsFilled } from '@stacksjs/iconify-weui'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-weui'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { addFilled } from '@stacksjs/iconify-weui'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(addFilled, { size: 24 })
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
import { addFilled } from '@stacksjs/iconify-weui'

// Icons are typed as IconData
const myIcon: IconData = addFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: WeUI ([Website](https://github.com/weui/weui-icon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/weui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/weui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
