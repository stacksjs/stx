# Flagpack

> Flagpack icons for stx from Iconify

## Overview

This package provides access to 256 icons from the Flagpack collection through the stx iconify integration.

**Collection ID:** `flagpack`
**Total Icons:** 256
**Author:** Yummygum ([Website](https://github.com/Yummygum/flagpack-core))
**License:** MIT ([Details](https://github.com/Yummygum/flagpack-core/blob/main/LICENSE))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flagpack
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdIcon, AeIcon, AfIcon } from '@stacksjs/iconify-flagpack'

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
  import { AdIcon, AeIcon, AfIcon } from '@stacksjs/iconify-flagpack'

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
import { ad, ae, af } from '@stacksjs/iconify-flagpack'
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

This package contains **256** icons:

- `ad`
- `ae`
- `af`
- `ag`
- `ai`
- `al`
- `am`
- `ao`
- `aq`
- `ar`
- `as`
- `at`
- `au`
- `aw`
- `ax`
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
- `bl`
- `bm`
- `bn`
- `bo`
- `bqBo`
- `bqSa`
- `bqSe`
- `br`
- `bs`
- `bt`
- `bv`
- `bw`
- `by`
- `bz`
- `ca`
- `cc`
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
- `cw`
- `cx`
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
- `eh`
- `er`
- `es`
- `et`
- `fi`
- `fj`
- `fk`
- `fm`
- `fo`
- `fr`
- `ga`
- `gb`
- `gbEng`
- `gbNir`
- `gbSct`
- `gbUkm`
- `gbWls`
- `gd`
- `ge`
- `gf`
- `gg`
- `gh`
- `gi`
- `gl`
- `gm`
- `gn`
- `gp`
- `gq`
- `gr`
- `gs`
- `gt`
- `gu`
- `gw`
- `gy`
- `hk`
- `hm`
- `hn`
- `hr`
- `ht`
- `hu`
- `id`
- `ie`
- `il`
- `im`
- `in`
- `io`
- `iq`
- `ir`
- `is`
- `it`
- `je`
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
- `ky`
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
- `mf`
- `mg`
- `mh`
- `mk`
- `ml`
- `mm`
- `mn`
- `mo`
- `mp`
- `mq`
- `mr`
- `ms`
- `mt`
- `mu`
- `mv`
- `mw`
- `mx`
- `my`
- `mz`
- `na`
- `nc`
- `ne`
- `nf`
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
- `pf`
- `pg`
- `ph`
- `pk`
- `pl`
- `pm`
- `pn`
- `pr`
- `ps`
- `pt`
- `pw`
- `py`
- `qa`
- `re`
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
- `sh`
- `si`
- `sj`
- `sk`
- `sl`
- `sm`
- `sn`
- `so`
- `sr`
- `ss`
- `st`
- `sv`
- `sx`
- `sy`
- `sz`
- `tc`
- `td`
- `tf`
- `tg`
- `th`
- `tj`
- `tk`
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
- `um`
- `us`
- `uy`
- `uz`
- `va`
- `vc`
- `ve`
- `vg`
- `vi`
- `vn`
- `vu`
- `wf`
- `ws`
- `ye`
- `yt`
- `za`
- `zm`
- `zw`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdIcon, AeIcon, AfIcon, AgIcon } from '@stacksjs/iconify-flagpack'

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
import { AdIcon } from '@stacksjs/iconify-flagpack'

const icon = AdIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdIcon, AeIcon, AfIcon } from '@stacksjs/iconify-flagpack'

const successIcon = AdIcon({ size: 16, color: '#22c55e' })
const warningIcon = AeIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AfIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdIcon, AeIcon } from '@stacksjs/iconify-flagpack'
   const icon = AdIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { ad, ae } from '@stacksjs/iconify-flagpack'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(ad, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdIcon, AeIcon } from '@stacksjs/iconify-flagpack'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-flagpack'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdIcon } from '@stacksjs/iconify-flagpack'
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
import { ad } from '@stacksjs/iconify-flagpack'

// Icons are typed as IconData
const myIcon: IconData = ad
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/Yummygum/flagpack-core/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Yummygum ([Website](https://github.com/Yummygum/flagpack-core))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flagpack/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flagpack/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
