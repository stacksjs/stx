# Streamline Emojis

> Streamline Emojis icons for stx from Iconify

## Overview

This package provides access to 787 icons from the Streamline Emojis collection through the stx iconify integration.

**Collection ID:** `streamline-emojis`
**Total Icons:** 787
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Emoji
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-emojis
```

## Quick Start

### In stx Templates

```html
@js
  import { 2, airplane, alien } from '@stacksjs/iconify-streamline-emojis'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    2: renderIcon(2, { size: 24 }),
    airplane: renderIcon(airplane, { size: 24, color: '#4a90e2' }),
    alien: renderIcon(alien, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.2 !!}
  {!! icons.airplane !!}
  {!! icons.alien !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { 2, airplane, alien } from '@stacksjs/iconify-streamline-emojis'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(2, { size: 24 })

// With custom color
const coloredIcon = renderIcon(airplane, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(alien, {
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

This package contains **787** icons. Here are some examples:

- `2`
- `airplane`
- `alien`
- `amazedFace`
- `ambulance`

...and 777 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/streamline-emojis/).

## Usage Examples

### Navigation Menu

```html
@js
  import { 2, airplane, alien, amazedFace } from '@stacksjs/iconify-streamline-emojis'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    2: renderIcon(2, { size: 20, class: 'nav-icon' }),
    airplane: renderIcon(airplane, { size: 20, class: 'nav-icon' }),
    alien: renderIcon(alien, { size: 20, class: 'nav-icon' }),
    amazedFace: renderIcon(amazedFace, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.2 !!} Home</a>
  <a href="/about">{!! navIcons.airplane !!} About</a>
  <a href="/contact">{!! navIcons.alien !!} Contact</a>
  <a href="/settings">{!! navIcons.amazedFace !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { 2 } from '@stacksjs/iconify-streamline-emojis'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(2, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-streamline-emojis'
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
   import { 2, airplane } from '@stacksjs/iconify-streamline-emojis'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-streamline-emojis'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2 } from '@stacksjs/iconify-streamline-emojis'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(2, { size: 24 })
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
import { 2 } from '@stacksjs/iconify-streamline-emojis'

// Icons are typed as IconData
const myIcon: IconData = 2
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-emojis/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-emojis/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
