# Gitlab SVGs

> Gitlab SVGs icons for stx from Iconify

## Overview

This package provides access to 414 icons from the Gitlab SVGs collection through the stx iconify integration.

**Collection ID:** `pajamas`
**Total Icons:** 414
**Author:** GitLab B.V. ([Website](https://gitlab.com/gitlab-org/gitlab-svgs/-/tree/main))
**License:** MIT ([Details](https://gitlab.com/gitlab-org/gitlab-svgs/-/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pajamas
```

## Quick Start

### In stx Templates

```html
@js
  import { abuse, accessibility, account } from '@stacksjs/iconify-pajamas'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.icons = {
    abuse: renderIcon(abuse, { size: 24 }),
    accessibility: renderIcon(accessibility, { size: 24, color: '#4a90e2' }),
    account: renderIcon(account, { size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.abuse !!}
  {!! icons.accessibility !!}
  {!! icons.account !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { abuse, accessibility, account } from '@stacksjs/iconify-pajamas'
import { renderIcon } from '@stacksjs/iconify-core'

// Basic usage
const svg = renderIcon(abuse, { size: 24 })

// With custom color
const coloredIcon = renderIcon(accessibility, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(account, {
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

This package contains **414** icons. Here are some examples:

- `abuse`
- `accessibility`
- `account`
- `admin`
- `agentAi`

...and 404 more.

To see all available icons, explore the package source or check the [Iconify website](https://icon-sets.iconify.design/pajamas/).

## Usage Examples

### Navigation Menu

```html
@js
  import { abuse, accessibility, account, admin } from '@stacksjs/iconify-pajamas'
  import { renderIcon } from '@stacksjs/iconify-core'

  global.navIcons = {
    abuse: renderIcon(abuse, { size: 20, class: 'nav-icon' }),
    accessibility: renderIcon(accessibility, { size: 20, class: 'nav-icon' }),
    account: renderIcon(account, { size: 20, class: 'nav-icon' }),
    admin: renderIcon(admin, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.abuse !!} Home</a>
  <a href="/about">{!! navIcons.accessibility !!} About</a>
  <a href="/contact">{!! navIcons.account !!} Contact</a>
  <a href="/settings">{!! navIcons.admin !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { abuse } from '@stacksjs/iconify-pajamas'
import { renderIcon } from '@stacksjs/iconify-core'

const icon = renderIcon(abuse, {
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Dynamic Icons

```typescript
import * as icons from '@stacksjs/iconify-pajamas'
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
   import { abuse, accessibility } from '@stacksjs/iconify-pajamas'

   // Avoid (imports everything)
   import * as icons from '@stacksjs/iconify-pajamas'
   ```

2. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { abuse } from '@stacksjs/iconify-pajamas'
     import { renderIcon } from '@stacksjs/iconify-core'

     global.icon = renderIcon(abuse, { size: 24 })
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
import { abuse } from '@stacksjs/iconify-pajamas'

// Icons are typed as IconData
const myIcon: IconData = abuse
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://gitlab.com/gitlab-org/gitlab-svgs/-/blob/main/LICENSE) for more information.

## Credits

- **Icons**: GitLab B.V. ([Website](https://gitlab.com/gitlab-org/gitlab-svgs/-/tree/main))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pajamas/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pajamas/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
