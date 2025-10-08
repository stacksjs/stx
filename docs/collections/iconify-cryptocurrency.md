# Cryptocurrency Icons

> Cryptocurrency Icons icons for stx from Iconify

## Overview

This package provides access to 483 icons from the Cryptocurrency Icons collection through the stx iconify integration.

**Collection ID:** `cryptocurrency`
**Total Icons:** 483
**Author:** Christopher Downer ([Website](https://github.com/atomiclabs/cryptocurrency-icons))
**License:** CC0 1.0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cryptocurrency
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 0xbtcIcon, 1inchIcon, 2giveIcon } from '@stacksjs/iconify-cryptocurrency'

// Basic usage
const icon = 0xbtcIcon()

// With size
const sizedIcon = 0xbtcIcon({ size: 24 })

// With color
const coloredIcon = 1inchIcon({ color: 'red' })

// With multiple props
const customIcon = 2giveIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 0xbtcIcon, 1inchIcon, 2giveIcon } from '@stacksjs/iconify-cryptocurrency'

  global.icons = {
    home: 0xbtcIcon({ size: 24 }),
    user: 1inchIcon({ size: 24, color: '#4a90e2' }),
    settings: 2giveIcon({ size: 32 })
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
import { 0xbtc, 1inch, 2give } from '@stacksjs/iconify-cryptocurrency'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0xbtc, { size: 24 })
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

### Monotone Icons

Monotone icons use `currentColor` by default, allowing you to change icon color via the `color` property or CSS:

```typescript
// Via color property
const redIcon = 0xbtcIcon({ color: 'red' })
const blueIcon = 0xbtcIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 0xbtcIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 0xbtcIcon({ class: 'text-primary' })
```

```css
/* In your CSS */
.text-primary {
  color: #4a90e2;
}

.icon:hover {
  color: #357abd;
}
```

## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = 0xbtcIcon({ size: 24 })
const icon1em = 0xbtcIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 0xbtcIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 0xbtcIcon({ height: '1em' })
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
const smallIcon = 0xbtcIcon({ class: 'icon-small' })
const largeIcon = 0xbtcIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **483** icons:

- `0xbtc`
- `1inch`
- `2give`
- `aave`
- `abt`
- `act`
- `actn`
- `ada`
- `add`
- `adx`
- `ae`
- `aeon`
- `aeur`
- `agi`
- `agrs`
- `aion`
- `algo`
- `amb`
- `amp`
- `ampl`
- `ankr`
- `ant`
- `ape`
- `apex`
- `appc`
- `ardr`
- `arg`
- `ark`
- `arn`
- `arnx`
- `ary`
- `ast`
- `atlas`
- `atm`
- `atom`
- `audr`
- `aury`
- `auto`
- `avax`
- `aywa`
- `bab`
- `bal`
- `band`
- `bat`
- `bay`
- `bcbc`
- `bcc`
- `bcd`
- `bch`
- `bcio`
- `bcn`
- `bco`
- `bcpt`
- `bdl`
- `beam`
- `bela`
- `bix`
- `blcn`
- `blk`
- `block`
- `blz`
- `bnb`
- `bnt`
- `bnty`
- `booty`
- `bos`
- `bpt`
- `bq`
- `brd`
- `bsd`
- `bsv`
- `btc`
- `btcd`
- `btch`
- `btcp`
- `btcz`
- `btdx`
- `btg`
- `btm`
- `bts`
- `btt`
- `btx`
- `burst`
- `bze`
- `call`
- `cc`
- `cdn`
- `cdt`
- `cenz`
- `chain`
- `chat`
- `chips`
- `chsb`
- `chz`
- `cix`
- `clam`
- `cloak`
- `cmm`
- `cmt`
- `cnd`
- `cnx`
- `cny`
- `cob`
- `colx`
- `comp`
- `coqui`
- `cred`
- `crpt`
- `crv`
- `crw`
- `cs`
- `ctr`
- `ctxc`
- `cvc`
- `d`
- `dai`
- `dash`
- `dat`
- `data`
- `dbc`
- `dcn`
- `dcr`
- `deez`
- `dent`
- `dew`
- `dgb`
- `dgd`
- `dlt`
- `dnt`
- `dock`
- `doge`
- `dot`
- `drgn`
- `drop`
- `dta`
- `dth`
- `dtr`
- `ebst`
- `eca`
- `edg`
- `edo`
- `edoge`
- `ela`
- `elec`
- `elf`
- `elix`
- `ella`
- `emb`
- `emc`
- `emc2`
- `eng`
- `enj`
- `entrp`
- `eon`
- `eop`
- `eos`
- `eqli`
- `equa`
- `etc`
- `eth`
- `ethos`
- `etn`
- `etp`
- `eur`
- `evx`
- `exmo`
- `exp`
- `fair`
- `fct`
- `fida`
- `fil`
- `fjc`
- `fldc`
- `flo`
- `flux`
- `fsn`
- `ftc`
- `fuel`
- `fun`
- `game`
- `gas`
- `gbp`
- `gbx`
- `gbyte`
- `generic`
- `gin`
- `glxt`
- `gmr`
- `gmt`
- `gno`
- `gnt`
- `gold`
- `grc`
- `grin`
- `grs`
- `grt`
- `gsc`
- `gto`
- `gup`
- `gusd`
- `gvt`
- `gxs`
- `gzr`
- `hight`
- `hns`
- `hodl`
- `hot`
- `hpb`
- `hsr`
- `ht`
- `html`
- `huc`
- `husd`
- `hush`
- `icn`
- `icp`
- `icx`
- `ignis`
- `ilk`
- `ink`
- `ins`
- `ion`
- `iop`
- `iost`
- `iotx`
- `iq`
- `itc`
- `jnt`
- `jpy`
- `kcs`
- `kin`
- `klown`
- `kmd`
- `knc`
- `krb`
- `ksm`
- `lbc`
- `lend`
- `leo`
- `link`
- `lkk`
- `loom`
- `lpt`
- `lrc`
- `lsk`
- `ltc`
- `lun`
- `maid`
- `mana`
- `matic`
- `max`
- `mcap`
- `mco`
- `mda`
- `mds`
- `med`
- `meetone`
- `mft`
- `miota`
- `mith`
- `mkr`
- `mln`
- `mnx`
- `mnz`
- `moac`
- `mod`
- `mona`
- `msr`
- `mth`
- `mtl`
- `music`
- `mzc`
- `nano`
- `nas`
- `nav`
- `ncash`
- `ndz`
- `nebl`
- `neo`
- `neos`
- `neu`
- `nexo`
- `ngc`
- `nio`
- `nkn`
- `nlc2`
- `nlg`
- `nmc`
- `nmr`
- `npxs`
- `ntbc`
- `nuls`
- `nxs`
- `nxt`
- `oax`
- `ok`
- `omg`
- `omni`
- `one`
- `ong`
- `ont`
- `oot`
- `ost`
- `ox`
- `oxt`
- `oxy`
- `pac`
- `part`
- `pasc`
- `pasl`
- `pax`
- `paxg`
- `pay`
- `payx`
- `pink`
- `pirl`
- `pivx`
- `plr`
- `poa`
- `poe`
- `polis`
- `poly`
- `pot`
- `powr`
- `ppc`
- `ppp`
- `ppt`
- `pre`
- `prl`
- `pungo`
- `pura`
- `qash`
- `qiwi`
- `qlc`
- `qnt`
- `qrl`
- `qsp`
- `qtum`
- `r`
- `rads`
- `rap`
- `ray`
- `rcn`
- `rdd`
- `rdn`
- `ren`
- `rep`
- `repv2`
- `req`
- `rhoc`
- `ric`
- `rise`
- `rlc`
- `rpx`
- `rub`
- `rvn`
- `ryo`
- `safe`
- `safemoon`
- `sai`
- `salt`
- `san`
- `sand`
- `sbd`
- `sberbank`
- `sc`
- `ser`
- `shift`
- `sib`
- `sin`
- `skl`
- `sky`
- `slr`
- `sls`
- `smart`
- `sngls`
- `snm`
- `snt`
- `snx`
- `soc`
- `sol`
- `spacehbit`
- `spank`
- `sphtx`
- `srn`
- `stak`
- `start`
- `steem`
- `storj`
- `storm`
- `stox`
- `stq`
- `strat`
- `stx`
- `sub`
- `sumo`
- `sushi`
- `sys`
- `taas`
- `tau`
- `tbx`
- `tel`
- `ten`
- `tern`
- `tgch`
- `theta`
- `tix`
- `tkn`
- `tks`
- `tnb`
- `tnc`
- `tnt`
- `tomo`
- `tpay`
- `trig`
- `trtl`
- `trx`
- `tusd`
- `tzc`
- `ubq`
- `uma`
- `uni`
- `unity`
- `usd`
- `usdc`
- `usdt`
- `utk`
- `veri`
- `vet`
- `via`
- `vib`
- `vibe`
- `vivo`
- `vrc`
- `vrsc`
- `vtc`
- `vtho`
- `wabi`
- `wan`
- `waves`
- `wax`
- `wbtc`
- `wgr`
- `wicc`
- `wings`
- `wpr`
- `wtc`
- `x`
- `xas`
- `xbc`
- `xbp`
- `xby`
- `xcp`
- `xdn`
- `xem`
- `xin`
- `xlm`
- `xmcc`
- `xmg`
- `xmo`
- `xmr`
- `xmy`
- `xp`
- `xpa`
- `xpm`
- `xpr`
- `xrp`
- `xsg`
- `xtz`
- `xuc`
- `xvc`
- `xvg`
- `xzc`
- `yfi`
- `yoyow`
- `zcl`
- `zec`
- `zel`
- `zen`
- `zest`
- `zil`
- `zilla`
- `zrx`

## Usage Examples

### Navigation Menu

```html
@js
  import { 0xbtcIcon, 1inchIcon, 2giveIcon, AaveIcon } from '@stacksjs/iconify-cryptocurrency'

  global.navIcons = {
    home: 0xbtcIcon({ size: 20, class: 'nav-icon' }),
    about: 1inchIcon({ size: 20, class: 'nav-icon' }),
    contact: 2giveIcon({ size: 20, class: 'nav-icon' }),
    settings: AaveIcon({ size: 20, class: 'nav-icon' })
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
import { 0xbtcIcon } from '@stacksjs/iconify-cryptocurrency'

const icon = 0xbtcIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 0xbtcIcon, 1inchIcon, 2giveIcon } from '@stacksjs/iconify-cryptocurrency'

const successIcon = 0xbtcIcon({ size: 16, color: '#22c55e' })
const warningIcon = 1inchIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 2giveIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 0xbtcIcon, 1inchIcon } from '@stacksjs/iconify-cryptocurrency'
   const icon = 0xbtcIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 0xbtc, 1inch } from '@stacksjs/iconify-cryptocurrency'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(0xbtc, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 0xbtcIcon, 1inchIcon } from '@stacksjs/iconify-cryptocurrency'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-cryptocurrency'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0xbtcIcon } from '@stacksjs/iconify-cryptocurrency'
     global.icon = 0xbtcIcon({ size: 24 })
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
   const icon = 0xbtcIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0xbtc } from '@stacksjs/iconify-cryptocurrency'

// Icons are typed as IconData
const myIcon: IconData = 0xbtc
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0 1.0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: Christopher Downer ([Website](https://github.com/atomiclabs/cryptocurrency-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cryptocurrency/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cryptocurrency/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
