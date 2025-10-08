# Pico-icon

> Pico-icon icons for stx from Iconify

## Overview

This package provides access to 824 icons from the Pico-icon collection through the stx iconify integration.

**Collection ID:** `picon`
**Total Icons:** 824
**Author:** Picon Contributors ([Website](https://github.com/yne/picon))
**License:** Open Font License ([Details](https://github.com/yne/picon/blob/master/OFL.txt))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-picon
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 2gIcon, 3gIcon, 4chanIcon } from '@stacksjs/iconify-picon'

// Basic usage
const icon = 2gIcon()

// With size
const sizedIcon = 2gIcon({ size: 24 })

// With color
const coloredIcon = 3gIcon({ color: 'red' })

// With multiple props
const customIcon = 4chanIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 2gIcon, 3gIcon, 4chanIcon } from '@stacksjs/iconify-picon'

  global.icons = {
    home: 2gIcon({ size: 24 }),
    user: 3gIcon({ size: 24, color: '#4a90e2' }),
    settings: 4chanIcon({ size: 32 })
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
import { 2g, 3g, 4chan } from '@stacksjs/iconify-picon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(2g, { size: 24 })
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
const redIcon = 2gIcon({ color: 'red' })
const blueIcon = 2gIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 2gIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 2gIcon({ class: 'text-primary' })
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
const icon24 = 2gIcon({ size: 24 })
const icon1em = 2gIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 2gIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 2gIcon({ height: '1em' })
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
const smallIcon = 2gIcon({ class: 'icon-small' })
const largeIcon = 2gIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **824** icons:

- `2g`
- `3g`
- `4chan`
- `4g`
- `4k`
- `5g`
- `8k`
- `abacus`
- `acorn`
- `ad`
- `add`
- `address`
- `aflat`
- `africa`
- `airbag`
- `airconditioner`
- `aircraft`
- `airhorn`
- `airplay`
- `airport`
- `alarm`
- `album`
- `albums`
- `alert`
- `alien`
- `aliexpress`
- `alipay`
- `amazon`
- `ambulance`
- `america`
- `americanfootball`
- `ammo`
- `amp`
- `ampersand`
- `anaglyph`
- `anchor`
- `and`
- `android`
- `angle`
- `angry`
- `angular`
- `antenna`
- `anvil`
- `apart`
- `app`
- `apple`
- `application`
- `archery`
- `archive`
- `archlinux`
- `armchair`
- `asc`
- `asia`
- `at`
- `atm`
- `atom`
- `attachment`
- `australia`
- `awd`
- `axe`
- `baby`
- `babyroom`
- `back`
- `backlight`
- `backpack`
- `badge`
- `badminton`
- `baguette`
- `balance`
- `ball`
- `ballot`
- `bandaid`
- `bank`
- `barcode`
- `barrel`
- `bars`
- `basket`
- `bat`
- `bath`
- `bathroom`
- `battery`
- `battery0`
- `battery1`
- `battery2`
- `battery3`
- `battery4`
- `battery5`
- `battleaxe`
- `beach`
- `bean`
- `bed`
- `bedbunk`
- `bee`
- `beer`
- `bell`
- `belt`
- `bike`
- `bill`
- `binocular`
- `bird`
- `birthday`
- `bitcoin`
- `blame`
- `bluetooth`
- `board`
- `boat`
- `bold`
- `bolt`
- `bone`
- `book`
- `bookmark`
- `boomerang`
- `boot`
- `bottle`
- `bowling`
- `boxer`
- `boxes`
- `boy`
- `bra`
- `branch`
- `break`
- `bridge`
- `briefcase`
- `brightness`
- `broadcast`
- `broom`
- `brush`
- `bucket`
- `bug`
- `bull`
- `bulldozer`
- `burger`
- `burn`
- `bus`
- `business`
- `bust`
- `butterfly`
- `cablecar`
- `cactus`
- `cake`
- `calc`
- `calendar`
- `call`
- `camcorder`
- `camera`
- `cameraroll`
- `camping`
- `campingcar`
- `candle`
- `candy`
- `car`
- `carousel`
- `carrot`
- `cart`
- `cashier`
- `cassette`
- `cast`
- `cat`
- `cctv`
- `celcius`
- `center`
- `certified`
- `chain`
- `chalk`
- `champagne`
- `charge`
- `charger`
- `charging`
- `chart`
- `chat`
- `chatbot`
- `check`
- `checked`
- `checklist`
- `checkout`
- `cheese`
- `chef`
- `chess`
- `chick`
- `chili`
- `chip`
- `chrome`
- `church`
- `circle`
- `cli`
- `climb`
- `clipboard`
- `clock`
- `cloud`
- `clover`
- `cocktail`
- `code`
- `coffee`
- `cog`
- `collumn`
- `colon`
- `colors`
- `comma`
- `commit`
- `compass`
- `cone`
- `config`
- `connected`
- `construction`
- `container`
- `contrast`
- `cookie`
- `couch`
- `coupon`
- `cow`
- `cowboy`
- `cpp`
- `cpu`
- `crate`
- `credit`
- `croissant`
- `crop`
- `crossed`
- `crown`
- `crystalball`
- `cs`
- `css`
- `cube`
- `curling`
- `cursor`
- `curve`
- `cut`
- `dashed`
- `database`
- `debian`
- `desc`
- `descent`
- `desktop`
- `devices`
- `dice`
- `dice1`
- `dice2`
- `dice3`
- `dice4`
- `dice5`
- `dice6`
- `diff`
- `digging`
- `direction`
- `disc`
- `disconnected`
- `docker`
- `dog`
- `dollar`
- `dolly`
- `door`
- `dot`
- `down`
- `downdouble`
- `download`
- `downmost`
- `downright`
- `downward`
- `dress`
- `drink`
- `drive`
- `droplet`
- `drums`
- `dry`
- `duck`
- `east`
- `eatin`
- `eject`
- `elbow`
- `electricbass`
- `electricguitar`
- `elevator`
- `ellipsis`
- `engine`
- `enlarge`
- `enter`
- `envelope`
- `equals`
- `eraser`
- `escalator`
- `ethereum`
- `europe`
- `even`
- `exit`
- `external`
- `eye`
- `facebook`
- `factory`
- `false`
- `fan`
- `fandom`
- `fareneight`
- `fastforward`
- `fastrewind`
- `faucet`
- `feather`
- `featherpen`
- `feeder`
- `female`
- `fence`
- `file`
- `files`
- `filler`
- `film`
- `filter`
- `fingerprint`
- `firefox`
- `fish`
- `fist`
- `fitness`
- `fix`
- `flag`
- `flame`
- `flask`
- `flight`
- `flood`
- `floppy`
- `flush`
- `folder`
- `folder2`
- `folders`
- `football`
- `forbidden`
- `forest`
- `fort`
- `forum`
- `forward`
- `fox`
- `fragile`
- `fridge`
- `frosty`
- `fuel`
- `fullscreen`
- `function`
- `gamepad`
- `gamesave`
- `gas`
- `gdrive`
- `genie`
- `gentleman`
- `geometric`
- `ghost`
- `gif`
- `girl`
- `git`
- `github`
- `gitlab`
- `glass`
- `golf`
- `golfer`
- `gondola`
- `google`
- `gps`
- `graph`
- `grocery`
- `group`
- `gsm0`
- `gsm1`
- `gsm2`
- `gsm3`
- `gsm4`
- `gui`
- `guitar`
- `gun`
- `gyrophare`
- `hammer`
- `handbag`
- `handle`
- `handle2`
- `happy`
- `hash`
- `haskell`
- `hd`
- `head`
- `header`
- `headphone`
- `headset`
- `heart`
- `heartbroken`
- `heavier`
- `height`
- `helicopter`
- `hibernate`
- `hierarchy`
- `highlight`
- `highlighter`
- `hiking`
- `hockey`
- `horn`
- `horse`
- `hospital`
- `hotel`
- `hourglass0`
- `hourglass1`
- `hourglass2`
- `hourglass3`
- `hourglass4`
- `hourglass5`
- `hourglass6`
- `hourglass7`
- `hourglass8`
- `house`
- `html`
- `icecream`
- `icicles`
- `inbox`
- `incognito`
- `indent`
- `infinity`
- `info`
- `instagram`
- `ipphone`
- `italic`
- `jackhammer`
- `java`
- `jean`
- `jerrican`
- `jewelry`
- `join`
- `js`
- `json`
- `jujutsu`
- `jump`
- `justify`
- `kaaba`
- `kart`
- `key`
- `keyboard`
- `kitten`
- `kotlin`
- `lab`
- `label`
- `ladder`
- `lady`
- `lamp`
- `landing`
- `landscape`
- `latex`
- `laudry`
- `leaf`
- `left`
- `leftdouble`
- `leftmost`
- `leftward`
- `lego`
- `letter`
- `lifter`
- `ligature`
- `lightbulb`
- `lighter`
- `linkedin`
- `linux`
- `list`
- `list2`
- `localisation`
- `lock`
- `log`
- `login`
- `logout`
- `loop`
- `louder`
- `ltr`
- `lua`
- `luggage`
- `magic`
- `magnet`
- `magnifier`
- `mail`
- `maki`
- `male`
- `man`
- `map`
- `markdown`
- `marker`
- `matrix`
- `medical`
- `medication`
- `meditation`
- `medium`
- `megaphone`
- `menu`
- `merge`
- `message`
- `messenger`
- `metronome`
- `microphone`
- `microscope`
- `microwave`
- `milk`
- `monitor`
- `moon`
- `mouse`
- `move`
- `movie`
- `mr`
- `msoffice`
- `muaythai`
- `muffin`
- `mug`
- `mushroom`
- `music`
- `mute`
- `na`
- `nas`
- `navigation`
- `netflix`
- `network`
- `newspaper`
- `next`
- `nfc`
- `ninja`
- `noentry`
- `north`
- `not`
- `notes`
- `nswitch`
- `numbered`
- `oak`
- `octopus`
- `off`
- `office`
- `oil`
- `oillamp`
- `ok`
- `on`
- `options`
- `or`
- `outbox`
- `oven`
- `package`
- `pagebreak`
- `paintbrush`
- `palette`
- `panorama`
- `panty`
- `pause`
- `pawn`
- `paycheck`
- `paypal`
- `pc`
- `pen`
- `perl`
- `phone`
- `php`
- `pi`
- `piano`
- `picker`
- `picture`
- `pictures`
- `pie`
- `pig`
- `piggy`
- `pill`
- `pills`
- `pin`
- `pine`
- `piston`
- `pizza`
- `play`
- `playlist`
- `playstation`
- `playstore`
- `plugin`
- `plunger`
- `plus`
- `plus1`
- `podium`
- `pokeball`
- `post`
- `power`
- `pray`
- `presentation`
- `pressure`
- `previous`
- `printer`
- `profile`
- `proposal`
- `protect`
- `psp`
- `puppy`
- `pyramid`
- `python`
- `qrcode`
- `quadcopter`
- `question`
- `quiet`
- `rabbit`
- `radio`
- `radioactif`
- `rain`
- `rainbow`
- `ram`
- `rat`
- `razor`
- `read`
- `receive`
- `recycle`
- `reddit`
- `redhat`
- `refresh`
- `reload`
- `repeat`
- `repeat1`
- `revert`
- `revolver`
- `rewind`
- `rfid`
- `rice`
- `right`
- `rightdouble`
- `rightmost`
- `rightward`
- `rise`
- `rj`
- `road`
- `roadwork`
- `robot`
- `rocket`
- `roll`
- `roller`
- `rollerblade`
- `rostrum`
- `router`
- `rss`
- `rtl`
- `ruby`
- `rugby`
- `run`
- `sad`
- `safe`
- `satellite`
- `saw`
- `sax`
- `scale`
- `scan`
- `scanner`
- `scooter`
- `screen`
- `screw`
- `script`
- `sd`
- `sdcard`
- `seat`
- `seatbelt`
- `selectbox`
- `semicolon`
- `send`
- `server`
- `serving`
- `sewing`
- `shake`
- `shark`
- `shaver`
- `shield`
- `ship`
- `shoe`
- `shop`
- `shopping`
- `shovel`
- `shower`
- `shrimp`
- `shrine`
- `shrink`
- `shuffle`
- `shutter`
- `sidelist`
- `sidenav`
- `silverware`
- `sim`
- `sink`
- `size`
- `skate`
- `ski`
- `skull`
- `slash`
- `smartwatch`
- `smooking`
- `snooker`
- `snowboard`
- `sofa`
- `soup`
- `south`
- `speaker`
- `spellcheck`
- `sphere`
- `spinner`
- `spinner2`
- `split`
- `spray`
- `stack`
- `stacked`
- `stackoverflow`
- `stamp`
- `star`
- `steadycam`
- `steam`
- `stop`
- `straighten`
- `stroller`
- `student`
- `stylo`
- `sublimtext`
- `subtitle`
- `sun`
- `sunglasses`
- `sunrise`
- `sunset`
- `swift`
- `swim`
- `switch`
- `sword`
- `tab`
- `tabletennis`
- `taekwondo`
- `tag`
- `takeoff`
- `takeout`
- `taxi`
- `tea`
- `tel`
- `telescope`
- `temperature`
- `tennis`
- `test`
- `tetris`
- `thermometer`
- `throw`
- `thumbdown`
- `thumbup`
- `thunderbolt`
- `thundercloud`
- `ticket`
- `tie`
- `tile`
- `timer`
- `times`
- `tm`
- `toast`
- `todo`
- `toilet`
- `toolbox`
- `torch`
- `tornado`
- `touch`
- `traffic`
- `train`
- `tram`
- `translate`
- `transport`
- `trash`
- `tree`
- `trolley`
- `trophy`
- `truck`
- `true`
- `tshirt`
- `tty`
- `tube`
- `tuning`
- `turtle`
- `tv`
- `twitch`
- `twitter`
- `ufo`
- `umbrella`
- `underground`
- `underline`
- `unicorn`
- `unindent`
- `unlock`
- `up`
- `update`
- `updouble`
- `updown`
- `upload`
- `upmost`
- `upright`
- `upward`
- `usb`
- `vest`
- `vi`
- `viking`
- `virus`
- `vk`
- `volley`
- `volume`
- `vote`
- `vr`
- `vscode`
- `vue`
- `walk`
- `wall`
- `wallet`
- `warning`
- `wasp`
- `water`
- `wave`
- `weight`
- `west`
- `whale`
- `whatsapp`
- `wheelchair`
- `whistle`
- `width`
- `wifi0`
- `wifi1`
- `wifi2`
- `wifi3`
- `wifi4`
- `wikipedia`
- `wind`
- `window`
- `windowed`
- `windows`
- `windsocket`
- `woman`
- `workstation`
- `wrench`
- `xbox`
- `xor`
- `yahoo`
- `yinyang`
- `youtube`
- `zip`

## Usage Examples

### Navigation Menu

```html
@js
  import { 2gIcon, 3gIcon, 4chanIcon, 4gIcon } from '@stacksjs/iconify-picon'

  global.navIcons = {
    home: 2gIcon({ size: 20, class: 'nav-icon' }),
    about: 3gIcon({ size: 20, class: 'nav-icon' }),
    contact: 4chanIcon({ size: 20, class: 'nav-icon' }),
    settings: 4gIcon({ size: 20, class: 'nav-icon' })
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
import { 2gIcon } from '@stacksjs/iconify-picon'

const icon = 2gIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 2gIcon, 3gIcon, 4chanIcon } from '@stacksjs/iconify-picon'

const successIcon = 2gIcon({ size: 16, color: '#22c55e' })
const warningIcon = 3gIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 4chanIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 2gIcon, 3gIcon } from '@stacksjs/iconify-picon'
   const icon = 2gIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 2g, 3g } from '@stacksjs/iconify-picon'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(2g, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 2gIcon, 3gIcon } from '@stacksjs/iconify-picon'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-picon'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 2gIcon } from '@stacksjs/iconify-picon'
     global.icon = 2gIcon({ size: 24 })
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
   const icon = 2gIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 2g } from '@stacksjs/iconify-picon'

// Icons are typed as IconData
const myIcon: IconData = 2g
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://github.com/yne/picon/blob/master/OFL.txt) for more information.

## Credits

- **Icons**: Picon Contributors ([Website](https://github.com/yne/picon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/picon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/picon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
