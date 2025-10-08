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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3080Icon height="1em" />
<3080Icon width="1em" height="1em" />
<3080Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3080Icon size="24" />
<3080Icon size="1em" />

<!-- Using width and height -->
<3080Icon width="24" height="32" />

<!-- With color -->
<3080Icon size="24" color="red" />
<3080Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3080Icon size="24" class="icon-primary" />

<!-- With all properties -->
<3080Icon
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
    <3080Icon size="24" />
    <40105Icon size="24" color="#4a90e2" />
    <50120Icon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<3080Icon size="24" color="red" />
<3080Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3080Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<3080Icon size="24" class="text-primary" />
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
<3080Icon height="1em" />
<3080Icon width="1em" height="1em" />
<3080Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3080Icon size="24" />
<3080Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.ps-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3080Icon class="ps-icon" />
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
<nav>
  <a href="/"><3080Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><40105Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><50120Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><60140Icon size="20" class="nav-icon" /> Settings</a>
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
<3080Icon
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
    <3080Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <40105Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <50120Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3080Icon size="24" />
   <40105Icon size="24" color="#4a90e2" />
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
   <3080Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3080Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3080Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3080 } from '@stacksjs/iconify-ps'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3080, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
