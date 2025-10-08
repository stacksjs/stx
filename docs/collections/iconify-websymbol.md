# Web Symbols Liga

> Web Symbols Liga icons for stx from Iconify

## Overview

This package provides access to 85 icons from the Web Symbols Liga collection through the stx iconify integration.

**Collection ID:** `websymbol`
**Total Icons:** 85
**Author:** Just Be Nice studio
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-websymbol
```

## Quick Start

### In stx Templates

```html
@js
  import { archive, arrowsCw, attach } from '@stacksjs/iconify-websymbol'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    archive: renderIcon(archive, { size: 24 }),
    arrowsCw: renderIcon(arrowsCw, { size: 24, color: '#4a90e2' }),
    attach: renderIcon(attach, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.archive !!}
  {!! icons.arrowsCw !!}
  {!! icons.attach !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { archive, arrowsCw, attach } from '@stacksjs/iconify-websymbol'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(archive, { size: 24 })

// With custom color
const coloredIcon = renderIcon(arrowsCw, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(attach, {
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

This package contains **85** icons. Here are some examples:

- `archive`
- `arrowsCw`
- `attach`
- `attention`
- `block`

...and 75 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/websymbol/).

## Usage Examples

### Navigation Menu

```html
@js
  import { archive, arrowsCw, attach, attention } from '@stacksjs/iconify-websymbol'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    archive: renderIcon(archive, { size: 20, class: 'nav-icon' }),
    arrowsCw: renderIcon(arrowsCw, { size: 20, class: 'nav-icon' }),
    attach: renderIcon(attach, { size: 20, class: 'nav-icon' }),
    attention: renderIcon(attention, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.archive !!} Home</a>
  <a href="/about">{!! navIcons.arrowsCw !!} About</a>
  <a href="/contact">{!! navIcons.attach !!} Contact</a>
  <a href="/settings">{!! navIcons.attention !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { archive } from '@stacksjs/iconify-websymbol'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(archive, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-websymbol'
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
   import { archive, arrowsCw } from '@stacksjs/iconify-websymbol'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-websymbol'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { archive } from '@stacksjs/iconify-websymbol'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(archive, { size: 24 })
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
import { archive } from '@stacksjs/iconify-websymbol'

// Icons are typed as IconData
const myIcon: IconData = archive
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Just Be Nice studio
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/websymbol/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/websymbol/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
