# Devicon Plain

> Devicon Plain icons for stx from Iconify

## Overview

This package provides access to 729 icons from the Devicon Plain collection through the stx iconify integration.

**Collection ID:** `devicon-plain`
**Total Icons:** 729
**Author:** konpa ([Website](https://github.com/devicons/devicon/tree/master))
**License:** MIT ([Details](https://github.com/devicons/devicon/blob/master/LICENSE))
**Category:** Programming
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-devicon-plain
```

## Quick Start

### In stx Templates

```html
@js
  import { aarch64, aframe, aftereffects } from '@stacksjs/iconify-devicon-plain'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    aarch64: renderIcon(aarch64, { size: 24 }),
    aframe: renderIcon(aframe, { size: 24, color: '#4a90e2' }),
    aftereffects: renderIcon(aftereffects, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.aarch64 !!}
  {!! icons.aframe !!}
  {!! icons.aftereffects !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { aarch64, aframe, aftereffects } from '@stacksjs/iconify-devicon-plain'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(aarch64, { size: 24 })

// With custom color
const coloredIcon = renderIcon(aframe, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(aftereffects, {
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

This package contains **729** icons. Here are some examples:

- `aarch64`
- `aframe`
- `aftereffects`
- `akka`
- `akkaWordmark`

...and 719 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/devicon-plain/).

## Usage Examples

### Navigation Menu

```html
@js
  import { aarch64, aframe, aftereffects, akka } from '@stacksjs/iconify-devicon-plain'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    aarch64: renderIcon(aarch64, { size: 20, class: 'nav-icon' }),
    aframe: renderIcon(aframe, { size: 20, class: 'nav-icon' }),
    aftereffects: renderIcon(aftereffects, { size: 20, class: 'nav-icon' }),
    akka: renderIcon(akka, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.aarch64 !!} Home</a>
  <a href="/about">{!! navIcons.aframe !!} About</a>
  <a href="/contact">{!! navIcons.aftereffects !!} Contact</a>
  <a href="/settings">{!! navIcons.akka !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { aarch64 } from '@stacksjs/iconify-devicon-plain'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(aarch64, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-devicon-plain'
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
   import { aarch64, aframe } from '@stacksjs/iconify-devicon-plain'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-devicon-plain'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { aarch64 } from '@stacksjs/iconify-devicon-plain'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(aarch64, { size: 24 })
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
import { aarch64 } from '@stacksjs/iconify-devicon-plain'

// Icons are typed as IconData
const myIcon: IconData = aarch64
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/devicons/devicon/blob/master/LICENSE) for more information.

## Credits

- **Icons**: konpa ([Website](https://github.com/devicons/devicon/tree/master))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/devicon-plain/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/devicon-plain/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
