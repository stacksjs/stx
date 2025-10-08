# PrestaShop Icons

> PrestaShop Icons icons for stx from Iconify

## Overview

This package provides access to 479 icons from the PrestaShop Icons collection through the stx iconify integration.

**Collection ID:** `ps`
**Total Icons:** 479
**Author:** PrestaShop ([Website](https://github.com/PrestaShop/prestashop-icon-font))
**License:** CC BY-NC 4.0 ([Details](https://creativecommons.org/licenses/by-nc/4.0/))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ps
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3080Icon, 40105Icon, 50120Icon } from '@stacksjs/iconify-ps'

// Basic usage
const icon = 3080Icon()

// With size
const sizedIcon = 3080Icon({ size: 24 })

// With color
const coloredIcon = 40105Icon({ color: 'red' })

// With multiple props
const customIcon = 50120Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3080Icon, 40105Icon, 50120Icon } from '@stacksjs/iconify-ps'

  global.icons = {
    home: 3080Icon({ size: 24 }),
    user: 40105Icon({ size: 24, color: '#4a90e2' }),
    settings: 50120Icon({ size: 32 })
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
import { 3080, 40105, 50120 } from '@stacksjs/iconify-ps'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3080, { size: 24 })
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
const redIcon = 3080Icon({ color: 'red' })
const blueIcon = 3080Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3080Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3080Icon({ class: 'text-primary' })
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
const icon24 = 3080Icon({ size: 24 })
const icon1em = 3080Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 3080Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3080Icon({ height: '1em' })
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
const smallIcon = 3080Icon({ class: 'icon-small' })
const largeIcon = 3080Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **479** icons:

- `3080`
- `40105`
- `50120`
- `60140`
- `70160`
- `95200`
- `aim`
- `aimAlt`
- `airplane`
- `alignCentered`
- `alignJustified`
- `alignLeft`
- `alignRight`
- `amazon`
- `ambulance`
- `anchor`
- `anySolvent`
- `anySolventWithoutTetrachlorethylene`
- `appStore`
- `apple`
- `apps`
- `archive`
- `arrowBox`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arto`
- `asterisk`
- `attachment`
- `aws`
- `backpack`
- `baidu`
- `bankSafe`
- `barCode`
- `barrel`
- `basecamp`
- `battery`
- `batteryCharge`
- `bebo`
- `beer`
- `behance`
- `bell`
- `bike`
- `bing`
- `birthday`
- `blaster`
- `blip`
- `blogger`
- `bnter`
- `board`
- `boiledEgg`
- `boiledEggFinger`
- `bonnet`
- `book`
- `bookTag`
- `branch`
- `brightkite`
- `brokenLink`
- `browser`
- `bubble`
- `bug`
- `building`
- `bullLeft`
- `bullRight`
- `burger`
- `busLondon`
- `calendar`
- `calendarGrid`
- `camera`
- `car`
- `cart`
- `cartSupermarket`
- `chat`
- `chatAlt`
- `check`
- `checkBox`
- `checkBoxEmpty`
- `checked`
- `cinch`
- `clock`
- `clothesWater`
- `cloud`
- `cloudapp`
- `clubsCard`
- `cocktail`
- `code`
- `coffee`
- `coffeeHot`
- `coin`
- `coins`
- `compass`
- `contact`
- `contrast`
- `cookie`
- `copy`
- `coroflot`
- `couple`
- `cpu`
- `creativeCommons`
- `creditCard`
- `crop`
- `crown`
- `cutlery`
- `daftPunk`
- `dailybooth`
- `dashboard`
- `dataBoard`
- `delete`
- `delicious`
- `designbump`
- `designfloat`
- `designmoo`
- `deviantart`
- `diamondsCard`
- `digg`
- `diggAlt`
- `diigo`
- `disabled`
- `doNotBleach`
- `doNotDry`
- `doNotIron`
- `doNotWash`
- `doNotWring`
- `dollarBill`
- `dollars`
- `doubleArrow`
- `down`
- `downArrowCircle`
- `download`
- `downloadFromCloud`
- `dribbble`
- `dripDry`
- `drop`
- `dropbox`
- `drupal`
- `dry`
- `dryFlat`
- `dryInTheShade`
- `dryNormalHightHeat`
- `dryNormalLowHeat`
- `dryNormalNoHeat`
- `dzone`
- `ebay`
- `egg`
- `eject`
- `ember`
- `enlarge`
- `etsy`
- `euroBill`
- `evernote`
- `extinguisher`
- `eye`
- `facebook`
- `facebookAlt`
- `facebookPlaces`
- `facto`
- `feedburner`
- `file`
- `film`
- `filter`
- `fire`
- `fish`
- `flag`
- `flagCorner`
- `flagScout`
- `flickr`
- `folder`
- `folkd`
- `forbidden`
- `formspring`
- `forrst`
- `forward`
- `foursquare`
- `friedEgg`
- `friendfeed`
- `friendster`
- `fuck`
- `fullScreen`
- `gamepad`
- `gdgt`
- `gift`
- `girl`
- `girl2`
- `girlAngel`
- `girlAngry`
- `girlBigSmile`
- `girlConfused`
- `girlCry`
- `girlFlushed`
- `girlOMouth`
- `girlOpenMouth`
- `girlSad`
- `girlSadHunappy`
- `girlSleep`
- `girlSmile`
- `girlUser`
- `github`
- `githubAlt`
- `globe`
- `goodreads`
- `google`
- `googleBuzz`
- `googleTalk`
- `gowalla`
- `gowallaAlt`
- `grooveshark`
- `gun`
- `guy`
- `guyAngel`
- `guyAngry`
- `guyBigSmile`
- `guyConfused`
- `guyCry`
- `guyFlushed`
- `guyHappy`
- `guyOMouth`
- `guyOpenMouth`
- `guySad`
- `guySleep`
- `guySmile`
- `guyUser`
- `guyWrong`
- `hackerNews`
- `hand`
- `handPointerLeft`
- `handPointerRight`
- `handPointerTop`
- `handWash`
- `hangToDry`
- `hardDrive`
- `headphones`
- `headset`
- `heartsCard`
- `heat`
- `helm`
- `hi5`
- `home`
- `hotdog`
- `hourglass`
- `hungry`
- `hypeMachine`
- `hyves`
- `icq`
- `identi`
- `image`
- `important`
- `instapaper`
- `ipad`
- `iphone`
- `ipod`
- `ironAnyTemp`
- `itunes`
- `iwatch`
- `justice`
- `keyboard`
- `kik`
- `krop`
- `lab`
- `label`
- `labelHogwarts`
- `laptop`
- `last`
- `leaf`
- `left`
- `leftArrowCircle`
- `lego`
- `lightning`
- `link`
- `linkedin`
- `linkedinAlt`
- `liquor`
- `livejournal`
- `lovedsgn`
- `mac`
- `machineWash`
- `machineWashGentleOrDelicate`
- `machineWashPermanentPress`
- `magnifyingGlass`
- `mail`
- `mailBack`
- `mailBill`
- `mailStamp`
- `mailbox`
- `man`
- `maximumTemp110230`
- `maximumTemp150300`
- `maximumTemp200390`
- `mayoHotdog`
- `meetup`
- `megaphone`
- `metacafe`
- `mic`
- `micOff`
- `milkshake`
- `ming`
- `minus`
- `minusBox`
- `minusCircle`
- `minusCircle1`
- `misterWong`
- `mixx`
- `mixxAlt`
- `mobileme`
- `moon`
- `mouse`
- `msnMessenger`
- `music`
- `musicScore`
- `myspace`
- `myspaceAlt`
- `newsvine`
- `next`
- `noEye`
- `nonChlorineBleachIfNeeded`
- `official`
- `openPadlock`
- `openid`
- `organisation`
- `orkut`
- `padlock`
- `pandora`
- `pant`
- `paperTablet`
- `path`
- `paypal`
- `pc`
- `pdiddy`
- `pen`
- `penknife`
- `peopleTeam`
- `petroleumSolventSteam`
- `phone`
- `photobucket`
- `piano`
- `picasa`
- `picassa`
- `piggyBank`
- `piggyBankCoins`
- `pin`
- `pinMap`
- `pinboard`
- `ping`
- `pingchat`
- `pizza`
- `plane`
- `play`
- `playstation`
- `plixi`
- `plurk`
- `plus`
- `plusBox`
- `plusCircle`
- `podcast`
- `posterous`
- `power`
- `preston`
- `previous`
- `printer`
- `prisonSchoolBus`
- `promo`
- `pull`
- `puzzle`
- `qik`
- `quik`
- `quora`
- `quote`
- `radio`
- `radioEmpty`
- `ram`
- `random`
- `rdio`
- `readernaut`
- `reddit`
- `resize`
- `retweet`
- `retweet1`
- `rewind`
- `right`
- `rightArrowCircle`
- `road`
- `robo`
- `rowSetting`
- `rss`
- `rssIcon`
- `safe`
- `saleTag`
- `save`
- `scissors`
- `scribd`
- `sharethis`
- `shield`
- `shoe`
- `shoppingCart`
- `sign`
- `simplenote`
- `skype`
- `slashdot`
- `slideshare`
- `smugmug`
- `sound`
- `soundDown`
- `soundLevelOne`
- `soundLevelTwo`
- `soundPlus`
- `soundcloud`
- `spadesCard`
- `spotify`
- `squarespace`
- `squidoo`
- `sreenshot`
- `stats`
- `steam`
- `stethoscope`
- `store`
- `stumbleupon`
- `suitcase`
- `sun`
- `switch`
- `tacos`
- `tag`
- `target`
- `technorati`
- `threewords`
- `ticket`
- `token`
- `triangle`
- `tribe`
- `tripit`
- `trophy`
- `truck`
- `truck1`
- `tumbleDry`
- `tumblr`
- `twitter`
- `twitterAlt`
- `ufo`
- `up`
- `upArrowCircle`
- `upload`
- `uploadToCloud`
- `user`
- `vcard`
- `viddler`
- `videoCamera`
- `vimeo`
- `virb`
- `w3`
- `wallet`
- `wand`
- `warning`
- `watch`
- `waterTemperature30`
- `waterTemperature40`
- `waterTemperature50`
- `waterTemperature60`
- `waterTemperature70`
- `waterTemperature95`
- `whatsapp`
- `wikipedia`
- `windows`
- `wists`
- `woman`
- `wordpress`
- `wordpressAlt`
- `workCase`
- `world`
- `xing`
- `yahoo`
- `yahooBuzz`
- `yahooMessenger`
- `yelp`
- `youtube`
- `youtubeAlt`
- `zerply`
- `zoomIn`
- `zoomOut`
- `zootool`
- `zynga`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3080Icon, 40105Icon, 50120Icon, 60140Icon } from '@stacksjs/iconify-ps'

  global.navIcons = {
    home: 3080Icon({ size: 20, class: 'nav-icon' }),
    about: 40105Icon({ size: 20, class: 'nav-icon' }),
    contact: 50120Icon({ size: 20, class: 'nav-icon' }),
    settings: 60140Icon({ size: 20, class: 'nav-icon' })
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
import { 3080Icon } from '@stacksjs/iconify-ps'

const icon = 3080Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3080Icon, 40105Icon, 50120Icon } from '@stacksjs/iconify-ps'

const successIcon = 3080Icon({ size: 16, color: '#22c55e' })
const warningIcon = 40105Icon({ size: 16, color: '#f59e0b' })
const errorIcon = 50120Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3080Icon, 40105Icon } from '@stacksjs/iconify-ps'
   const icon = 3080Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3080, 40105 } from '@stacksjs/iconify-ps'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3080, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3080Icon, 40105Icon } from '@stacksjs/iconify-ps'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ps'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3080Icon } from '@stacksjs/iconify-ps'
     global.icon = 3080Icon({ size: 24 })
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
   const icon = 3080Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3080 } from '@stacksjs/iconify-ps'

// Icons are typed as IconData
const myIcon: IconData = 3080
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-NC 4.0

See [license details](https://creativecommons.org/licenses/by-nc/4.0/) for more information.

## Credits

- **Icons**: PrestaShop ([Website](https://github.com/PrestaShop/prestashop-icon-font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ps/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ps/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
