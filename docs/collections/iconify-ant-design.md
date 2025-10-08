# Ant Design Icons

> Ant Design Icons icons for stx from Iconify

## Overview

This package provides access to 830 icons from the Ant Design Icons collection through the stx iconify integration.

**Collection ID:** `ant-design`
**Total Icons:** 830
**Author:** HeskeyBaozi ([Website](https://github.com/ant-design/ant-design-icons))
**License:** MIT ([Details](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ant-design
```

## Quick Start

### In stx Templates

```html
@js
  import { accountBookFilled, accountBookOutlined, accountBookTwotone } from '@stacksjs/iconify-ant-design'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accountBookFilled: renderIcon(accountBookFilled, { size: 24 }),
    accountBookOutlined: renderIcon(accountBookOutlined, { size: 24, color: '#4a90e2' }),
    accountBookTwotone: renderIcon(accountBookTwotone, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accountBookFilled !!}
  {!! icons.accountBookOutlined !!}
  {!! icons.accountBookTwotone !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accountBookFilled, accountBookOutlined, accountBookTwotone } from '@stacksjs/iconify-ant-design'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accountBookFilled, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accountBookOutlined, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(accountBookTwotone, {
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

This package contains **830** icons. Here are some examples:

- `accountBookFilled`
- `accountBookOutlined`
- `accountBookTwotone`
- `aimOutlined`
- `alertFilled`

...and 820 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/ant-design/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accountBookFilled, accountBookOutlined, accountBookTwotone, aimOutlined } from '@stacksjs/iconify-ant-design'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accountBookFilled: renderIcon(accountBookFilled, { size: 20, class: 'nav-icon' }),
    accountBookOutlined: renderIcon(accountBookOutlined, { size: 20, class: 'nav-icon' }),
    accountBookTwotone: renderIcon(accountBookTwotone, { size: 20, class: 'nav-icon' }),
    aimOutlined: renderIcon(aimOutlined, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accountBookFilled !!} Home</a>
  <a href="/about">{!! navIcons.accountBookOutlined !!} About</a>
  <a href="/contact">{!! navIcons.accountBookTwotone !!} Contact</a>
  <a href="/settings">{!! navIcons.aimOutlined !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accountBookFilled } from '@stacksjs/iconify-ant-design'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accountBookFilled, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-ant-design'
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
   import { accountBookFilled, accountBookOutlined } from '@stacksjs/iconify-ant-design'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-ant-design'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accountBookFilled } from '@stacksjs/iconify-ant-design'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accountBookFilled, { size: 24 })
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
import { accountBookFilled } from '@stacksjs/iconify-ant-design'

// Icons are typed as IconData
const myIcon: IconData = accountBookFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: HeskeyBaozi ([Website](https://github.com/ant-design/ant-design-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ant-design/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ant-design/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
