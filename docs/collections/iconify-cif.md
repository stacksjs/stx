# CoreUI Flags

> CoreUI Flags icons for stx from Iconify

## Overview

This package provides access to 199 icons from the CoreUI Flags collection through the stx iconify integration.

**Collection ID:** `cif`
**Total Icons:** 199
**Author:** creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
**License:** CC0 1.0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-cif
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdIcon, AeIcon, AfIcon } from '@stacksjs/iconify-cif'

// Basic usage
const icon = AdIcon()

// With size
const sizedIcon = AdIcon({ size: 24 })

// With color
const coloredIcon = AeIcon({ color: 'red' })

// With multiple props
const customIcon = AfIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdIcon, AeIcon, AfIcon } from '@stacksjs/iconify-cif'

  global.icons = {
    home: AdIcon({ size: 24 }),
    user: AeIcon({ size: 24, color: '#4a90e2' }),
    settings: AfIcon({ size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.home !!}
  {!! icons.user !!}
  {!! icons.settings !!}
</div>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { ad, ae, af } from '@stacksjs/iconify-cif'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(ad, { size: 24 })
```

## Icon Properties

All icon component functions and `renderIcon` accept the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (sets both width and height) |
| `width` | `string \| number` | - | Icon width (overrides size) |
| `height` | `string \| number` | - | Icon height (overrides size) |
| `color` | `string` | `'currentColor'` | Icon color (CSS color or hex) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Inline styles |

## Color

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```typescript
// Via color property
const redIcon = AdIcon({ color: 'red' })
const blueIcon = AdIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AdIcon({ size: 24 })
const icon1em = AdIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdIcon({ height: '1em' })
```

### CSS Sizing

You can also control icon size via CSS:

```css
.icon-small {
  width: 1em;
  height: 1em;
}

.icon-large {
  width: 2em;
  height: 2em;
}
```

```typescript
const smallIcon = AdIcon({ class: 'icon-small' })
const largeIcon = AdIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **199** icons:

- `ad`
- `ae`
- `af`
- `ag`
- `al`
- `am`
- `ao`
- `ar`
- `at`
- `au`
- `az`
- `ba`
- `bb`
- `bd`
- `be`
- `bf`
- `bg`
- `bh`
- `bi`
- `bj`
- `bn`
- `bo`
- `br`
- `bs`
- `bt`
- `bw`
- `by`
- `bz`
- `ca`
- `cd`
- `cf`
- `cg`
- `ch`
- `ci`
- `ck`
- `cl`
- `cm`
- `cn`
- `co`
- `cr`
- `cu`
- `cv`
- `cy`
- `cz`
- `de`
- `dj`
- `dk`
- `dm`
- `do`
- `dz`
- `ec`
- `ee`
- `eg`
- `er`
- `es`
- `et`
- `fi`
- `fj`
- `fm`
- `fr`
- `ga`
- `gb`
- `gd`
- `ge`
- `gh`
- `gm`
- `gn`
- `gq`
- `gr`
- `gt`
- `gw`
- `gy`
- `hk`
- `hn`
- `hr`
- `ht`
- `hu`
- `id`
- `ie`
- `il`
- `in`
- `iq`
- `ir`
- `is`
- `it`
- `jm`
- `jo`
- `jp`
- `ke`
- `kg`
- `kh`
- `ki`
- `km`
- `kn`
- `kp`
- `kr`
- `kw`
- `kz`
- `la`
- `lb`
- `lc`
- `li`
- `lk`
- `lr`
- `ls`
- `lt`
- `lu`
- `lv`
- `ly`
- `ma`
- `mc`
- `md`
- `me`
- `mg`
- `mh`
- `mk`
- `ml`
- `mm`
- `mn`
- `mr`
- `mt`
- `mu`
- `mv`
- `mw`
- `mx`
- `my`
- `mz`
- `na`
- `ne`
- `ng`
- `ni`
- `nl`
- `no`
- `np`
- `nr`
- `nu`
- `nz`
- `om`
- `pa`
- `pe`
- `pg`
- `ph`
- `pk`
- `pl`
- `pt`
- `pw`
- `py`
- `qa`
- `ro`
- `rs`
- `ru`
- `rw`
- `sa`
- `sb`
- `sc`
- `sd`
- `se`
- `sg`
- `si`
- `sk`
- `sl`
- `sm`
- `sn`
- `so`
- `sr`
- `ss`
- `st`
- `sv`
- `sy`
- `sz`
- `td`
- `tg`
- `th`
- `tj`
- `tl`
- `tm`
- `tn`
- `to`
- `tr`
- `tt`
- `tv`
- `tw`
- `tz`
- `ua`
- `ug`
- `us`
- `uy`
- `uz`
- `va`
- `vc`
- `ve`
- `vg`
- `vn`
- `ws`
- `xk`
- `ye`
- `za`
- `zm`
- `zw`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdIcon, AeIcon, AfIcon, AgIcon } from '@stacksjs/iconify-cif'

  global.navIcons = {
    home: AdIcon({ size: 20, class: 'nav-icon' }),
    about: AeIcon({ size: 20, class: 'nav-icon' }),
    contact: AfIcon({ size: 20, class: 'nav-icon' }),
    settings: AgIcon({ size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.home !!} Home</a>
  <a href="/about">{!! navIcons.about !!} About</a>
  <a href="/contact">{!! navIcons.contact !!} Contact</a>
  <a href="/settings">{!! navIcons.settings !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { AdIcon } from '@stacksjs/iconify-cif'

const icon = AdIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdIcon, AeIcon, AfIcon } from '@stacksjs/iconify-cif'

const successIcon = AdIcon({ size: 16, color: '#22c55e' })
const warningIcon = AeIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AfIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdIcon, AeIcon } from '@stacksjs/iconify-cif'
   const icon = AdIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { ad, ae } from '@stacksjs/iconify-cif'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(ad, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdIcon, AeIcon } from '@stacksjs/iconify-cif'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-cif'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdIcon } from '@stacksjs/iconify-cif'
     global.icon = AdIcon({ size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   {!! icon !!}
   ```

4. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```typescript
   const icon = AdIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { ad } from '@stacksjs/iconify-cif'

// Icons are typed as IconData
const myIcon: IconData = ad
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0 1.0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cif/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cif/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
