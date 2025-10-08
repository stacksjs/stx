# OpenSearch UI

> OpenSearch UI icons for stx from Iconify

## Overview

This package provides access to 444 icons from the OpenSearch UI collection through the stx iconify integration.

**Collection ID:** `oui`
**Total Icons:** 444
**Author:** OpenSearch Contributors ([Website](https://github.com/opensearch-project/oui))
**License:** Apache 2.0 ([Details](https://github.com/opensearch-project/oui/blob/main/LICENSE.txt))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-oui
```

## Quick Start

### In stx Templates

```html
@js
  import { accessibility, addBookmark, aggregate } from '@stacksjs/iconify-oui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    accessibility: renderIcon(accessibility, { size: 24 }),
    addBookmark: renderIcon(addBookmark, { size: 24, color: '#4a90e2' }),
    aggregate: renderIcon(aggregate, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.accessibility !!}
  {!! icons.addBookmark !!}
  {!! icons.aggregate !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { accessibility, addBookmark, aggregate } from '@stacksjs/iconify-oui'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(accessibility, { size: 24 })

// With custom color
const coloredIcon = renderIcon(addBookmark, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(aggregate, {
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

This package contains **444** icons. Here are some examples:

- `accessibility`
- `addBookmark`
- `aggregate`
- `alert`
- `analyzeEvent`

...and 434 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/oui/).

## Usage Examples

### Navigation Menu

```html
@js
  import { accessibility, addBookmark, aggregate, alert } from '@stacksjs/iconify-oui'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    addBookmark: renderIcon(addBookmark, { size: 20, class: 'nav-icon' }),
    aggregate: renderIcon(aggregate, { size: 20, class: 'nav-icon' }),
    alert: renderIcon(alert, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.accessibility !!} Home</a>
  <a href="/about">{!! navIcons.addBookmark !!} About</a>
  <a href="/contact">{!! navIcons.aggregate !!} Contact</a>
  <a href="/settings">{!! navIcons.alert !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { accessibility } from '@stacksjs/iconify-oui'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(accessibility, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-oui'
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
   import { accessibility, addBookmark } from '@stacksjs/iconify-oui'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-oui'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-oui'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(accessibility, { size: 24 })
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
import { accessibility } from '@stacksjs/iconify-oui'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/opensearch-project/oui/blob/main/LICENSE.txt) for more information.

## Credits

- **Icons**: OpenSearch Contributors ([Website](https://github.com/opensearch-project/oui))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/oui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/oui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
