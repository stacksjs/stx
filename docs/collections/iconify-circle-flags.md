# Circle Flags

> Circle Flags icons for stx from Iconify

## Overview

This package provides access to 729 icons from the Circle Flags collection through the stx iconify integration.

**Collection ID:** `circle-flags`
**Total Icons:** 729
**Author:** HatScripts ([Website](https://github.com/HatScripts/circle-flags))
**License:** MIT ([Details](https://github.com/HatScripts/circle-flags/blob/gh-pages/LICENSE))
**Category:** Flags / Maps
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-circle-flags
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AaIcon, AbIcon, AcIcon } from '@stacksjs/iconify-circle-flags'

// Basic usage
const icon = AaIcon()

// With size
const sizedIcon = AaIcon({ size: 24 })

// With color
const coloredIcon = AbIcon({ color: 'red' })

// With multiple props
const customIcon = AcIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AaIcon, AbIcon, AcIcon } from '@stacksjs/iconify-circle-flags'

  global.icons = {
    home: AaIcon({ size: 24 }),
    user: AbIcon({ size: 24, color: '#4a90e2' }),
    settings: AcIcon({ size: 32 })
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
import { aa, ab, ac } from '@stacksjs/iconify-circle-flags'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(aa, { size: 24 })
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
const redIcon = AaIcon({ color: 'red' })
const blueIcon = AaIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AaIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AaIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AaIcon({ size: 24 })
const icon1em = AaIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AaIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AaIcon({ height: '1em' })
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
const smallIcon = AaIcon({ class: 'icon-small' })
const largeIcon = AaIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **729** icons:

- `aa`
- `ab`
- `ac`
- `ad`
- `ae`
- `af`
- `afEmirate`
- `afar`
- `ag`
- `ai`
- `ak`
- `al`
- `am`
- `an`
- `ao`
- `aq`
- `aqTrueSouth`
- `ar`
- `as`
- `at`
- `au`
- `auAboriginal`
- `auAct`
- `auNsw`
- `auNt`
- `auQld`
- `auSa`
- `auTas`
- `auTorresStraitIslands`
- `auVic`
- `auWa`
- `av`
- `aw`
- `ax`
- `ay`
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
- `bq`
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
- `caBc`
- `caQc`
- `cc`
- `cd`
- `ce`
- `ceb`
- `cf`
- `cg`
- `ch`
- `chGr`
- `checkered`
- `chequered`
- `chm`
- `ci`
- `ck`
- `ckb`
- `cl`
- `cm`
- `cn`
- `cnHk`
- `cnXj`
- `co`
- `cp`
- `cq`
- `cr`
- `cs`
- `cu`
- `cv`
- `cw`
- `cx`
- `cy`
- `cz`
- `da`
- `de`
- `dg`
- `dj`
- `dk`
- `dm`
- `do`
- `dv`
- `dz`
- `ea`
- `earth`
- `eastAfricanFederation`
- `easterIsland`
- `ec`
- `ecW`
- `ee`
- `eg`
- `eh`
- `el`
- `en`
- `enAu`
- `enCa`
- `enGh`
- `enHk`
- `enIe`
- `enIn`
- `enKe`
- `enNg`
- `enNz`
- `enPh`
- `enSg`
- `enTz`
- `enUs`
- `enZa`
- `eo`
- `er`
- `es`
- `esAr`
- `esCe`
- `esCn`
- `esCt`
- `esGa`
- `esIb`
- `esMl`
- `esMx`
- `esPv`
- `esVariant`
- `et`
- `etAf`
- `etAm`
- `etBe`
- `etGa`
- `etHa`
- `etOr`
- `etSi`
- `etSn`
- `etSo`
- `etSw`
- `etTi`
- `eu`
- `europeanUnion`
- `ewe`
- `fa`
- `fi`
- `fil`
- `fj`
- `fk`
- `fm`
- `fo`
- `fr`
- `fr20r`
- `frBre`
- `frCp`
- `fx`
- `fy`
- `ga`
- `gb`
- `gbCon`
- `gbEng`
- `gbNir`
- `gbOrk`
- `gbSct`
- `gbWls`
- `gd`
- `ge`
- `geAb`
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
- `guarani`
- `gv`
- `gw`
- `gy`
- `ha`
- `hausa`
- `haw`
- `he`
- `hi`
- `hk`
- `hm`
- `hmn`
- `hmong`
- `hn`
- `ho`
- `hr`
- `ht`
- `hu`
- `hy`
- `ia`
- `ic`
- `id`
- `idJb`
- `idJt`
- `ie`
- `ig`
- `il`
- `ilo`
- `im`
- `in`
- `inAs`
- `inGj`
- `inKa`
- `inMn`
- `inMz`
- `inOr`
- `inTg`
- `inTn`
- `interslavic`
- `io`
- `iq`
- `iqKr`
- `ir`
- `is`
- `it`
- `it21`
- `it23`
- `it25`
- `it32`
- `it34`
- `it36`
- `it42`
- `it45`
- `it52`
- `it55`
- `it57`
- `it62`
- `it65`
- `it67`
- `it72`
- `it75`
- `it77`
- `it78`
- `it82`
- `it88`
- `ja`
- `je`
- `jm`
- `jo`
- `jollyRoger`
- `jp`
- `jv`
- `ka`
- `kanuri`
- `ke`
- `kg`
- `kh`
- `ki`
- `kikuyu`
- `kk`
- `kl`
- `klingon`
- `km`
- `kn`
- `ko`
- `kongo`
- `kp`
- `kr`
- `kri`
- `ks`
- `ku`
- `kurdistan`
- `kv`
- `kw`
- `ky`
- `kz`
- `la`
- `langAa`
- `langAb`
- `langAf`
- `langAk`
- `langAm`
- `langAn`
- `langAr`
- `langAs`
- `langAv`
- `langAy`
- `langAz`
- `langBa`
- `langBe`
- `langBg`
- `langBi`
- `langBm`
- `langBn`
- `langBo`
- `langBr`
- `langBs`
- `langCa`
- `langCe`
- `langCeb`
- `langCh`
- `langChm`
- `langCkb`
- `langCo`
- `langCs`
- `langCv`
- `langCy`
- `langDa`
- `langDe`
- `langDv`
- `langDz`
- `langEe`
- `langEl`
- `langEn`
- `langEnAu`
- `langEnCa`
- `langEnGh`
- `langEnHk`
- `langEnIe`
- `langEnIn`
- `langEnKe`
- `langEnNg`
- `langEnNz`
- `langEnPh`
- `langEnSg`
- `langEnTz`
- `langEnUs`
- `langEnZa`
- `langEo`
- `langEs`
- `langEsMx`
- `langEt`
- `langEu`
- `langFa`
- `langFi`
- `langFil`
- `langFj`
- `langFo`
- `langFr`
- `langFy`
- `langGa`
- `langGd`
- `langGl`
- `langGn`
- `langGu`
- `langGv`
- `langHa`
- `langHaw`
- `langHe`
- `langHi`
- `langHmn`
- `langHo`
- `langHr`
- `langHt`
- `langHu`
- `langHy`
- `langIa`
- `langId`
- `langIe`
- `langIg`
- `langIlo`
- `langInterslavic`
- `langIo`
- `langIs`
- `langIt`
- `langJa`
- `langJv`
- `langKa`
- `langKg`
- `langKi`
- `langKk`
- `langKl`
- `langKm`
- `langKn`
- `langKo`
- `langKr`
- `langKri`
- `langKs`
- `langKu`
- `langKv`
- `langKw`
- `langKy`
- `langLa`
- `langLb`
- `langLg`
- `langLn`
- `langLo`
- `langLt`
- `langLu`
- `langLus`
- `langLv`
- `langMg`
- `langMh`
- `langMi`
- `langMk`
- `langMl`
- `langMn`
- `langMni`
- `langMr`
- `langMrj`
- `langMs`
- `langMt`
- `langMy`
- `langNa`
- `langNb`
- `langNd`
- `langNe`
- `langNl`
- `langNn`
- `langNo`
- `langNon`
- `langNr`
- `langNy`
- `langOc`
- `langOm`
- `langOr`
- `langOs`
- `langOto`
- `langPa`
- `langPap`
- `langPl`
- `langPms`
- `langPs`
- `langPt`
- `langPtBr`
- `langQu`
- `langRm`
- `langRn`
- `langRo`
- `langRu`
- `langRw`
- `langSc`
- `langSd`
- `langSe`
- `langSg`
- `langSi`
- `langSk`
- `langSl`
- `langSm`
- `langSn`
- `langSo`
- `langSq`
- `langSr`
- `langSs`
- `langSt`
- `langSu`
- `langSv`
- `langSw`
- `langTa`
- `langTe`
- `langTg`
- `langTh`
- `langTi`
- `langTk`
- `langTl`
- `langTn`
- `langTo`
- `langTr`
- `langTranslingual`
- `langTt`
- `langTy`
- `langUdm`
- `langUg`
- `langUk`
- `langUr`
- `langUz`
- `langVi`
- `langVo`
- `langXh`
- `langXx`
- `langYi`
- `langYo`
- `langYua`
- `langZh`
- `langZu`
- `lb`
- `lc`
- `lg`
- `lgbt`
- `lgbtProgress`
- `lgbtTransgender`
- `li`
- `lk`
- `ln`
- `lo`
- `lr`
- `ls`
- `lt`
- `lu`
- `lus`
- `lv`
- `ly`
- `ma`
- `malayali`
- `manipur`
- `maori`
- `mars`
- `mc`
- `md`
- `me`
- `mf`
- `mg`
- `mh`
- `mi`
- `mizoram`
- `mk`
- `ml`
- `mm`
- `mn`
- `mni`
- `mo`
- `mp`
- `mq`
- `mqOld`
- `mr`
- `mrj`
- `ms`
- `mt`
- `mu`
- `mv`
- `mw`
- `mx`
- `my`
- `mz`
- `na`
- `nato`
- `nb`
- `nc`
- `nd`
- `ne`
- `nf`
- `ng`
- `ni`
- `nl`
- `nlFr`
- `nn`
- `no`
- `non`
- `northernCyprus`
- `np`
- `nr`
- `nu`
- `ny`
- `nz`
- `oc`
- `occitania`
- `olympics`
- `om`
- `or`
- `os`
- `oto`
- `otomi`
- `pa`
- `pap`
- `pe`
- `pf`
- `pg`
- `ph`
- `pirate`
- `pk`
- `pkJk`
- `pkSd`
- `pl`
- `pm`
- `pms`
- `pn`
- `pr`
- `ps`
- `pt`
- `pt20`
- `pt30`
- `ptBr`
- `pw`
- `py`
- `qa`
- `qu`
- `quechua`
- `re`
- `rm`
- `rn`
- `ro`
- `rs`
- `ru`
- `ruBa`
- `ruCe`
- `ruCu`
- `ruDa`
- `ruDpr`
- `ruKo`
- `ruLpr`
- `ruTa`
- `ruUd`
- `rw`
- `sa`
- `sami`
- `sb`
- `sc`
- `sd`
- `se`
- `sg`
- `sh`
- `shAc`
- `shHl`
- `shTa`
- `si`
- `sj`
- `sk`
- `sl`
- `sm`
- `sn`
- `so`
- `somaliland`
- `southOssetia`
- `sovietUnion`
- `sq`
- `sr`
- `ss`
- `st`
- `su`
- `sv`
- `sw`
- `sx`
- `sy`
- `sz`
- `ta`
- `tc`
- `td`
- `te`
- `tf`
- `tg`
- `th`
- `ti`
- `tibet`
- `tj`
- `tk`
- `tl`
- `tm`
- `tn`
- `to`
- `torresStraitIslands`
- `tr`
- `translingual`
- `transnistria`
- `tt`
- `tv`
- `tw`
- `ty`
- `tz`
- `ua`
- `udm`
- `ug`
- `uk`
- `um`
- `un`
- `unitedNations`
- `ur`
- `us`
- `usAk`
- `usAl`
- `usAr`
- `usAs`
- `usAz`
- `usBetsyRoss`
- `usCa`
- `usCo`
- `usConfederateBattle`
- `usDc`
- `usFl`
- `usGa`
- `usGu`
- `usHi`
- `usIn`
- `usMd`
- `usMo`
- `usMp`
- `usMs`
- `usNc`
- `usNm`
- `usOr`
- `usPr`
- `usRi`
- `usSc`
- `usTn`
- `usTx`
- `usUm`
- `usVi`
- `usWa`
- `usWi`
- `usWy`
- `uy`
- `uz`
- `va`
- `vc`
- `ve`
- `vg`
- `vi`
- `vn`
- `vo`
- `vu`
- `wf`
- `wiphala`
- `ws`
- `xh`
- `xk`
- `xx`
- `ye`
- `yi`
- `yo`
- `yorubaland`
- `yt`
- `yu`
- `yua`
- `za`
- `zh`
- `zm`
- `zu`
- `zw`

## Usage Examples

### Navigation Menu

```html
@js
  import { AaIcon, AbIcon, AcIcon, AdIcon } from '@stacksjs/iconify-circle-flags'

  global.navIcons = {
    home: AaIcon({ size: 20, class: 'nav-icon' }),
    about: AbIcon({ size: 20, class: 'nav-icon' }),
    contact: AcIcon({ size: 20, class: 'nav-icon' }),
    settings: AdIcon({ size: 20, class: 'nav-icon' })
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
import { AaIcon } from '@stacksjs/iconify-circle-flags'

const icon = AaIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AaIcon, AbIcon, AcIcon } from '@stacksjs/iconify-circle-flags'

const successIcon = AaIcon({ size: 16, color: '#22c55e' })
const warningIcon = AbIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AcIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AaIcon, AbIcon } from '@stacksjs/iconify-circle-flags'
   const icon = AaIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { aa, ab } from '@stacksjs/iconify-circle-flags'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(aa, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AaIcon, AbIcon } from '@stacksjs/iconify-circle-flags'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-circle-flags'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AaIcon } from '@stacksjs/iconify-circle-flags'
     global.icon = AaIcon({ size: 24 })
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
   const icon = AaIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { aa } from '@stacksjs/iconify-circle-flags'

// Icons are typed as IconData
const myIcon: IconData = aa
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/HatScripts/circle-flags/blob/gh-pages/LICENSE) for more information.

## Credits

- **Icons**: HatScripts ([Website](https://github.com/HatScripts/circle-flags))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/circle-flags/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/circle-flags/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
