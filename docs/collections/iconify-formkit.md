# FormKit Icons

> FormKit Icons icons for stx from Iconify

## Overview

This package provides access to 144 icons from the FormKit Icons collection through the stx iconify integration.

**Collection ID:** `formkit`
**Total Icons:** 144
**Author:** FormKit, Inc ([Website](https://github.com/formkit/formkit/tree/master/packages/icons))
**License:** MIT ([Details](https://github.com/formkit/formkit/blob/master/packages/icons/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-formkit
```

## Quick Start

### In stx Templates

```html
@js
  import { add, amex, android } from '@stacksjs/iconify-formkit'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    add: renderIcon(add, { size: 24 }),
    amex: renderIcon(amex, { size: 24, color: '#4a90e2' }),
    android: renderIcon(android, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.add !!}
  {!! icons.amex !!}
  {!! icons.android !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { add, amex, android } from '@stacksjs/iconify-formkit'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(add, { size: 24 })

// With custom color
const coloredIcon = renderIcon(amex, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(android, {
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

This package contains **144** icons. Here are some examples:

- `add`
- `amex`
- `android`
- `apple`
- `arrowdown`

...and 134 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/formkit/).

## Usage Examples

### Navigation Menu

```html
@js
  import { add, amex, android, apple } from '@stacksjs/iconify-formkit'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    add: renderIcon(add, { size: 20, class: 'nav-icon' }),
    amex: renderIcon(amex, { size: 20, class: 'nav-icon' }),
    android: renderIcon(android, { size: 20, class: 'nav-icon' }),
    apple: renderIcon(apple, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.add !!} Home</a>
  <a href="/about">{!! navIcons.amex !!} About</a>
  <a href="/contact">{!! navIcons.android !!} Contact</a>
  <a href="/settings">{!! navIcons.apple !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { add } from '@stacksjs/iconify-formkit'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(add, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-formkit'
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
   import { add, amex } from '@stacksjs/iconify-formkit'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-formkit'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { add } from '@stacksjs/iconify-formkit'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(add, { size: 24 })
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
import { add } from '@stacksjs/iconify-formkit'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/formkit/formkit/blob/master/packages/icons/LICENSE) for more information.

## Credits

- **Icons**: FormKit, Inc ([Website](https://github.com/formkit/formkit/tree/master/packages/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/formkit/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/formkit/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
