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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdIcon height="1em" />
<AdIcon width="1em" height="1em" />
<AdIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdIcon size="24" />
<AdIcon size="1em" />

<!-- Using width and height -->
<AdIcon width="24" height="32" />

<!-- With color -->
<AdIcon size="24" color="red" />
<AdIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdIcon
  size="32"
  color="#4a90e2"
  class="my-icon"
  style="opacity: 0.8;"
/>
```

### In stx Templates

```html
<!DOCTYPE html>
<html>
<head>
  <title>Icon Demo</title>
  <style>
    .icon-grid {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="icon-grid">
    <AdIcon size="24" />
    <AeIcon size="24" color="#4a90e2" />
    <AfIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AdIcon size="24" color="red" />
<AdIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdIcon size="24" class="text-primary" />
```



## Size

Unlike other components, SVG + CSS components do not set icon size by default. This has advantages and disadvantages.

**Disadvantages:**
- You need to set size yourself.

**Advantages:**
- You have full control over icon size.

You can change icon size by:
- Setting `width` and `height` properties
- Using CSS

### Properties

All icon components support `width` and `height` properties.

Value is a string or number.

You do not need to set both properties. If you set one property, the other property will automatically be calculated from the icon's width/height ratio.

**Examples:**

```html
<AdIcon height="1em" />
<AdIcon width="1em" height="1em" />
<AdIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdIcon size="24" />
<AdIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.flagpack-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdIcon class="flagpack-icon" />
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
<nav>
  <a href="/"><AdIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AeIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AfIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AgIcon size="20" class="nav-icon" /> Settings</a>
</nav>

<style>
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-icon {
    color: currentColor;
  }
</style>
```

### Custom Styling

```html
<AdIcon
  size="24"
  class="icon icon-primary"
  style="opacity: 0.8; transition: opacity 0.2s;"
/>

<style>
  .icon-primary {
    color: #4a90e2;
  }
  .icon-primary:hover {
    opacity: 1;
  }
</style>
```

### Status Indicators

```html
<div class="status-grid">
  <div class="status-item">
    <AdIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AeIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AfIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdIcon size="24" />
   <AeIcon size="24" color="#4a90e2" />
   ```

2. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```html
   <AdIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { ad } from '@stacksjs/iconify-flagpack'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(ad, { size: 24 })
   @endjs

   {!! customIcon !!}
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
