# Flag Icons

> Flag Icons icons for stx from Iconify

## Overview

This package provides access to 542 icons from the Flag Icons collection through the stx iconify integration.

**Collection ID:** `flag`
**Total Icons:** 542
**Author:** Panayiotis Lipiridis ([Website](https://github.com/lipis/flag-icons))
**License:** MIT ([Details](https://github.com/lipis/flag-icons/blob/main/LICENSE))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flag
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Ad1x1Icon, Ad4x3Icon, Ae1x1Icon } from '@stacksjs/iconify-flag'

// Basic usage
const icon = Ad1x1Icon()

// With size
const sizedIcon = Ad1x1Icon({ size: 24 })

// With color
const coloredIcon = Ad4x3Icon({ color: 'red' })

// With multiple props
const customIcon = Ae1x1Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Ad1x1Icon, Ad4x3Icon, Ae1x1Icon } from '@stacksjs/iconify-flag'

  global.icons = {
    home: Ad1x1Icon({ size: 24 }),
    user: Ad4x3Icon({ size: 24, color: '#4a90e2' }),
    settings: Ae1x1Icon({ size: 32 })
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
import { ad1x1, ad4x3, ae1x1 } from '@stacksjs/iconify-flag'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(ad1x1, { size: 24 })
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
const redIcon = Ad1x1Icon({ color: 'red' })
const blueIcon = Ad1x1Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Ad1x1Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Ad1x1Icon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = Ad1x1Icon({ size: 24 })
const icon1em = Ad1x1Icon({ size: '1em' })

// Set individual dimensions
const customIcon = Ad1x1Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Ad1x1Icon({ height: '1em' })
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
const smallIcon = Ad1x1Icon({ class: 'icon-small' })
const largeIcon = Ad1x1Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **542** icons:

- `ad1x1`
- `ad4x3`
- `ae1x1`
- `ae4x3`
- `af1x1`
- `af4x3`
- `ag1x1`
- `ag4x3`
- `ai1x1`
- `ai4x3`
- `al1x1`
- `al4x3`
- `am1x1`
- `am4x3`
- `ao1x1`
- `ao4x3`
- `aq1x1`
- `aq4x3`
- `ar1x1`
- `ar4x3`
- `arab1x1`
- `arab4x3`
- `as1x1`
- `as4x3`
- `asean1x1`
- `asean4x3`
- `at1x1`
- `at4x3`
- `au1x1`
- `au4x3`
- `aw1x1`
- `aw4x3`
- `ax1x1`
- `ax4x3`
- `az1x1`
- `az4x3`
- `ba1x1`
- `ba4x3`
- `bb1x1`
- `bb4x3`
- `bd1x1`
- `bd4x3`
- `be1x1`
- `be4x3`
- `bf1x1`
- `bf4x3`
- `bg1x1`
- `bg4x3`
- `bh1x1`
- `bh4x3`
- `bi1x1`
- `bi4x3`
- `bj1x1`
- `bj4x3`
- `bl1x1`
- `bl4x3`
- `bm1x1`
- `bm4x3`
- `bn1x1`
- `bn4x3`
- `bo1x1`
- `bo4x3`
- `bq1x1`
- `bq4x3`
- `br1x1`
- `br4x3`
- `bs1x1`
- `bs4x3`
- `bt1x1`
- `bt4x3`
- `bv1x1`
- `bv4x3`
- `bw1x1`
- `bw4x3`
- `by1x1`
- `by4x3`
- `bz1x1`
- `bz4x3`
- `ca1x1`
- `ca4x3`
- `cc1x1`
- `cc4x3`
- `cd1x1`
- `cd4x3`
- `cefta1x1`
- `cefta4x3`
- `cf1x1`
- `cf4x3`
- `cg1x1`
- `cg4x3`
- `ch1x1`
- `ch4x3`
- `ci1x1`
- `ci4x3`
- `ck1x1`
- `ck4x3`
- `cl1x1`
- `cl4x3`
- `cm1x1`
- `cm4x3`
- `cn1x1`
- `cn4x3`
- `co1x1`
- `co4x3`
- `cp1x1`
- `cp4x3`
- `cr1x1`
- `cr4x3`
- `cu1x1`
- `cu4x3`
- `cv1x1`
- `cv4x3`
- `cw1x1`
- `cw4x3`
- `cx1x1`
- `cx4x3`
- `cy1x1`
- `cy4x3`
- `cz1x1`
- `cz4x3`
- `de1x1`
- `de4x3`
- `dg1x1`
- `dg4x3`
- `dj1x1`
- `dj4x3`
- `dk1x1`
- `dk4x3`
- `dm1x1`
- `dm4x3`
- `do1x1`
- `do4x3`
- `dz1x1`
- `dz4x3`
- `eac1x1`
- `eac4x3`
- `ec1x1`
- `ec4x3`
- `ee1x1`
- `ee4x3`
- `eg1x1`
- `eg4x3`
- `eh1x1`
- `eh4x3`
- `er1x1`
- `er4x3`
- `es1x1`
- `es4x3`
- `esCt1x1`
- `esCt4x3`
- `esGa1x1`
- `esGa4x3`
- `esPv1x1`
- `esPv4x3`
- `et1x1`
- `et4x3`
- `eu1x1`
- `eu4x3`
- `fi1x1`
- `fi4x3`
- `fj1x1`
- `fj4x3`
- `fk1x1`
- `fk4x3`
- `fm1x1`
- `fm4x3`
- `fo1x1`
- `fo4x3`
- `fr1x1`
- `fr4x3`
- `ga1x1`
- `ga4x3`
- `gb1x1`
- `gb4x3`
- `gbEng1x1`
- `gbEng4x3`
- `gbNir1x1`
- `gbNir4x3`
- `gbSct1x1`
- `gbSct4x3`
- `gbWls1x1`
- `gbWls4x3`
- `gd1x1`
- `gd4x3`
- `ge1x1`
- `ge4x3`
- `gf1x1`
- `gf4x3`
- `gg1x1`
- `gg4x3`
- `gh1x1`
- `gh4x3`
- `gi1x1`
- `gi4x3`
- `gl1x1`
- `gl4x3`
- `gm1x1`
- `gm4x3`
- `gn1x1`
- `gn4x3`
- `gp1x1`
- `gp4x3`
- `gq1x1`
- `gq4x3`
- `gr1x1`
- `gr4x3`
- `gs1x1`
- `gs4x3`
- `gt1x1`
- `gt4x3`
- `gu1x1`
- `gu4x3`
- `gw1x1`
- `gw4x3`
- `gy1x1`
- `gy4x3`
- `hk1x1`
- `hk4x3`
- `hm1x1`
- `hm4x3`
- `hn1x1`
- `hn4x3`
- `hr1x1`
- `hr4x3`
- `ht1x1`
- `ht4x3`
- `hu1x1`
- `hu4x3`
- `ic1x1`
- `ic4x3`
- `id1x1`
- `id4x3`
- `ie1x1`
- `ie4x3`
- `il1x1`
- `il4x3`
- `im1x1`
- `im4x3`
- `in1x1`
- `in4x3`
- `io1x1`
- `io4x3`
- `iq1x1`
- `iq4x3`
- `ir1x1`
- `ir4x3`
- `is1x1`
- `is4x3`
- `it1x1`
- `it4x3`
- `je1x1`
- `je4x3`
- `jm1x1`
- `jm4x3`
- `jo1x1`
- `jo4x3`
- `jp1x1`
- `jp4x3`
- `ke1x1`
- `ke4x3`
- `kg1x1`
- `kg4x3`
- `kh1x1`
- `kh4x3`
- `ki1x1`
- `ki4x3`
- `km1x1`
- `km4x3`
- `kn1x1`
- `kn4x3`
- `kp1x1`
- `kp4x3`
- `kr1x1`
- `kr4x3`
- `kw1x1`
- `kw4x3`
- `ky1x1`
- `ky4x3`
- `kz1x1`
- `kz4x3`
- `la1x1`
- `la4x3`
- `lb1x1`
- `lb4x3`
- `lc1x1`
- `lc4x3`
- `li1x1`
- `li4x3`
- `lk1x1`
- `lk4x3`
- `lr1x1`
- `lr4x3`
- `ls1x1`
- `ls4x3`
- `lt1x1`
- `lt4x3`
- `lu1x1`
- `lu4x3`
- `lv1x1`
- `lv4x3`
- `ly1x1`
- `ly4x3`
- `ma1x1`
- `ma4x3`
- `mc1x1`
- `mc4x3`
- `md1x1`
- `md4x3`
- `me1x1`
- `me4x3`
- `mf1x1`
- `mf4x3`
- `mg1x1`
- `mg4x3`
- `mh1x1`
- `mh4x3`
- `mk1x1`
- `mk4x3`
- `ml1x1`
- `ml4x3`
- `mm1x1`
- `mm4x3`
- `mn1x1`
- `mn4x3`
- `mo1x1`
- `mo4x3`
- `mp1x1`
- `mp4x3`
- `mq1x1`
- `mq4x3`
- `mr1x1`
- `mr4x3`
- `ms1x1`
- `ms4x3`
- `mt1x1`
- `mt4x3`
- `mu1x1`
- `mu4x3`
- `mv1x1`
- `mv4x3`
- `mw1x1`
- `mw4x3`
- `mx1x1`
- `mx4x3`
- `my1x1`
- `my4x3`
- `mz1x1`
- `mz4x3`
- `na1x1`
- `na4x3`
- `nc1x1`
- `nc4x3`
- `ne1x1`
- `ne4x3`
- `nf1x1`
- `nf4x3`
- `ng1x1`
- `ng4x3`
- `ni1x1`
- `ni4x3`
- `nl1x1`
- `nl4x3`
- `no1x1`
- `no4x3`
- `np1x1`
- `np4x3`
- `nr1x1`
- `nr4x3`
- `nu1x1`
- `nu4x3`
- `nz1x1`
- `nz4x3`
- `om1x1`
- `om4x3`
- `pa1x1`
- `pa4x3`
- `pc1x1`
- `pc4x3`
- `pe1x1`
- `pe4x3`
- `pf1x1`
- `pf4x3`
- `pg1x1`
- `pg4x3`
- `ph1x1`
- `ph4x3`
- `pk1x1`
- `pk4x3`
- `pl1x1`
- `pl4x3`
- `pm1x1`
- `pm4x3`
- `pn1x1`
- `pn4x3`
- `pr1x1`
- `pr4x3`
- `ps1x1`
- `ps4x3`
- `pt1x1`
- `pt4x3`
- `pw1x1`
- `pw4x3`
- `py1x1`
- `py4x3`
- `qa1x1`
- `qa4x3`
- `re1x1`
- `re4x3`
- `ro1x1`
- `ro4x3`
- `rs1x1`
- `rs4x3`
- `ru1x1`
- `ru4x3`
- `rw1x1`
- `rw4x3`
- `sa1x1`
- `sa4x3`
- `sb1x1`
- `sb4x3`
- `sc1x1`
- `sc4x3`
- `sd1x1`
- `sd4x3`
- `se1x1`
- `se4x3`
- `sg1x1`
- `sg4x3`
- `sh1x1`
- `sh4x3`
- `shAc1x1`
- `shAc4x3`
- `shHl1x1`
- `shHl4x3`
- `shTa1x1`
- `shTa4x3`
- `si1x1`
- `si4x3`
- `sj1x1`
- `sj4x3`
- `sk1x1`
- `sk4x3`
- `sl1x1`
- `sl4x3`
- `sm1x1`
- `sm4x3`
- `sn1x1`
- `sn4x3`
- `so1x1`
- `so4x3`
- `sr1x1`
- `sr4x3`
- `ss1x1`
- `ss4x3`
- `st1x1`
- `st4x3`
- `sv1x1`
- `sv4x3`
- `sx1x1`
- `sx4x3`
- `sy1x1`
- `sy4x3`
- `sz1x1`
- `sz4x3`
- `tc1x1`
- `tc4x3`
- `td1x1`
- `td4x3`
- `tf1x1`
- `tf4x3`
- `tg1x1`
- `tg4x3`
- `th1x1`
- `th4x3`
- `tj1x1`
- `tj4x3`
- `tk1x1`
- `tk4x3`
- `tl1x1`
- `tl4x3`
- `tm1x1`
- `tm4x3`
- `tn1x1`
- `tn4x3`
- `to1x1`
- `to4x3`
- `tr1x1`
- `tr4x3`
- `tt1x1`
- `tt4x3`
- `tv1x1`
- `tv4x3`
- `tw1x1`
- `tw4x3`
- `tz1x1`
- `tz4x3`
- `ua1x1`
- `ua4x3`
- `ug1x1`
- `ug4x3`
- `um1x1`
- `um4x3`
- `un1x1`
- `un4x3`
- `us1x1`
- `us4x3`
- `uy1x1`
- `uy4x3`
- `uz1x1`
- `uz4x3`
- `va1x1`
- `va4x3`
- `vc1x1`
- `vc4x3`
- `ve1x1`
- `ve4x3`
- `vg1x1`
- `vg4x3`
- `vi1x1`
- `vi4x3`
- `vn1x1`
- `vn4x3`
- `vu1x1`
- `vu4x3`
- `wf1x1`
- `wf4x3`
- `ws1x1`
- `ws4x3`
- `xk1x1`
- `xk4x3`
- `xx1x1`
- `xx4x3`
- `ye1x1`
- `ye4x3`
- `yt1x1`
- `yt4x3`
- `za1x1`
- `za4x3`
- `zm1x1`
- `zm4x3`
- `zw1x1`
- `zw4x3`

## Usage Examples

### Navigation Menu

```html
@js
  import { Ad1x1Icon, Ad4x3Icon, Ae1x1Icon, Ae4x3Icon } from '@stacksjs/iconify-flag'

  global.navIcons = {
    home: Ad1x1Icon({ size: 20, class: 'nav-icon' }),
    about: Ad4x3Icon({ size: 20, class: 'nav-icon' }),
    contact: Ae1x1Icon({ size: 20, class: 'nav-icon' }),
    settings: Ae4x3Icon({ size: 20, class: 'nav-icon' })
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
import { Ad1x1Icon } from '@stacksjs/iconify-flag'

const icon = Ad1x1Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Ad1x1Icon, Ad4x3Icon, Ae1x1Icon } from '@stacksjs/iconify-flag'

const successIcon = Ad1x1Icon({ size: 16, color: '#22c55e' })
const warningIcon = Ad4x3Icon({ size: 16, color: '#f59e0b' })
const errorIcon = Ae1x1Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Ad1x1Icon, Ad4x3Icon } from '@stacksjs/iconify-flag'
   const icon = Ad1x1Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { ad1x1, ad4x3 } from '@stacksjs/iconify-flag'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(ad1x1, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Ad1x1Icon, Ad4x3Icon } from '@stacksjs/iconify-flag'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-flag'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Ad1x1Icon } from '@stacksjs/iconify-flag'
     global.icon = Ad1x1Icon({ size: 24 })
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
   const icon = Ad1x1Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { ad1x1 } from '@stacksjs/iconify-flag'

// Icons are typed as IconData
const myIcon: IconData = ad1x1
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/lipis/flag-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Panayiotis Lipiridis ([Website](https://github.com/lipis/flag-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flag/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flag/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
