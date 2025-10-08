# Fontisto

> Fontisto icons for stx from Iconify

## Overview

This package provides access to 615 icons from the Fontisto collection through the stx iconify integration.

**Collection ID:** `fontisto`
**Total Icons:** 615
**Author:** Kenan Gündoğan ([Website](https://github.com/kenangundogan/fontisto))
**License:** MIT ([Details](https://github.com/kenangundogan/fontisto/blob/master/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fontisto
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AcrobatReaderIcon, AdjustIcon } from '@stacksjs/iconify-fontisto'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AcrobatReaderIcon({ color: 'red' })

// With multiple props
const customIcon = AdjustIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AcrobatReaderIcon, AdjustIcon } from '@stacksjs/iconify-fontisto'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AcrobatReaderIcon({ size: 24, color: '#4a90e2' }),
    settings: AdjustIcon({ size: 32 })
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
import { 500px, acrobatReader, adjust } from '@stacksjs/iconify-fontisto'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(500px, { size: 24 })
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
const redIcon = 500pxIcon({ color: 'red' })
const blueIcon = 500pxIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 500pxIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 500pxIcon({ class: 'text-primary' })
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
const icon24 = 500pxIcon({ size: 24 })
const icon1em = 500pxIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 500pxIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 500pxIcon({ height: '1em' })
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
const smallIcon = 500pxIcon({ class: 'icon-small' })
const largeIcon = 500pxIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **615** icons:

- `500px`
- `acrobatReader`
- `adjust`
- `adobe`
- `aids`
- `airplay`
- `algolia`
- `amazon`
- `ambulance`
- `americanExpress`
- `americanSignLanguageInterpreting`
- `ampproject`
- `anchor`
- `android`
- `angelist`
- `angleDobuleDown`
- `angleDobuleLeft`
- `angleDobuleRight`
- `angleDobuleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `angularjs`
- `appStore`
- `apple`
- `appleMusic`
- `applePay`
- `archive`
- `areaChart`
- `arrowDown`
- `arrowDownL`
- `arrowExpand`
- `arrowH`
- `arrowLeft`
- `arrowLeftL`
- `arrowMove`
- `arrowResize`
- `arrowReturnLeft`
- `arrowReturnRight`
- `arrowRight`
- `arrowRightL`
- `arrowSwap`
- `arrowUp`
- `arrowUpL`
- `arrowV`
- `asterisk`
- `at`
- `atlassian`
- `atom`
- `audioDescription`
- `automobile`
- `aws`
- `babel`
- `backward`
- `baidu`
- `ban`
- `bandage`
- `barChart`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `batteryQuarter`
- `batteryThreeQuarters`
- `beachSlipper`
- `bedPatient`
- `behance`
- `bell`
- `bellAlt`
- `bicycle`
- `bing`
- `bitbucket`
- `bitcoin`
- `blind`
- `blogger`
- `blood`
- `bloodDrop`
- `bloodTest`
- `bluetoothB`
- `bold`
- `bookmark`
- `bookmarkAlt`
- `bower`
- `braille`
- `brokenLink`
- `bug`
- `bus`
- `busTicket`
- `calculator`
- `calendar`
- `camera`
- `car`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `centerAlign`
- `check`
- `checkboxActive`
- `checkboxPassive`
- `chrome`
- `circleONotch`
- `clock`
- `close`
- `closeA`
- `cloudDown`
- `cloudRefresh`
- `cloudUp`
- `cloudflare`
- `cloudy`
- `cloudyGusts`
- `cocktail`
- `cocoapods`
- `code`
- `codepen`
- `coffeescript`
- `columns`
- `comment`
- `commenting`
- `comments`
- `compass`
- `compassAlt`
- `composer`
- `confused`
- `copy`
- `cpanel`
- `creditCard`
- `crop`
- `crosshairs`
- `css3`
- `cursor`
- `curve`
- `dailymotion`
- `database`
- `date`
- `dayCloudy`
- `dayHaze`
- `dayLightning`
- `dayRain`
- `daySnow`
- `daySunny`
- `deaf`
- `delicious`
- `deskpro`
- `desktop`
- `deviantart`
- `digg`
- `dinnersClub`
- `directionSign`
- `discord`
- `discourse`
- `discover`
- `dislike`
- `disqus`
- `dizzy`
- `dna`
- `doNotDisturb`
- `docker`
- `doctor`
- `dollar`
- `download`
- `dribbble`
- `dropbox`
- `drugPack`
- `earth`
- `edge`
- `eject`
- `electronjs`
- `ellipse`
- `email`
- `ember`
- `envato`
- `equalizer`
- `eraser`
- `euro`
- `export`
- `expressionless`
- `eye`
- `facebook`
- `famale`
- `favorite`
- `fi`
- `file`
- `file1`
- `film`
- `filter`
- `fire`
- `firefox`
- `firstAidAlt`
- `flag`
- `flash`
- `flickr`
- `flipboard`
- `flotationRing`
- `fog`
- `folder`
- `font`
- `fontisto`
- `forward`
- `foursquare`
- `frowning`
- `gbp`
- `genderless`
- `gg`
- `git`
- `github`
- `gitlab`
- `google`
- `googleDrive`
- `googlePlay`
- `googlePlus`
- `googleWallet`
- `graphql`
- `grunt`
- `gulp`
- `hackerNews`
- `hangout`
- `hashtag`
- `headphone`
- `heart`
- `heartAlt`
- `heartEyes`
- `heartbeat`
- `heartbeatAlt`
- `helicopter`
- `helicopterAmbulance`
- `hexo`
- `hipchat`
- `history`
- `holidayVillage`
- `home`
- `horizon`
- `horizonAlt`
- `hospital`
- `hotAirBalloon`
- `hotel`
- `hotelAlt`
- `hourglass`
- `hourglassEnd`
- `hourglassHalf`
- `hourglassStart`
- `houzz`
- `html5`
- `icq`
- `ifQuestionCircle`
- `ils`
- `imdb`
- `import`
- `indent`
- `info`
- `injectionSyringe`
- `inr`
- `instagram`
- `internetExplorer`
- `intersex`
- `invision`
- `island`
- `italic`
- `iyzigo`
- `java`
- `jcb`
- `jekyll`
- `jenkins`
- `jira`
- `joomla`
- `jquery`
- `jsfiddle`
- `json`
- `justify`
- `key`
- `keyboard`
- `kickstarter`
- `krw`
- `laboratory`
- `language`
- `laptop`
- `laravel`
- `laughing`
- `leftAlign`
- `less`
- `lightbulb`
- `lightning`
- `lightnings`
- `like`
- `line`
- `lineChart`
- `link`
- `linkedin`
- `linux`
- `list1`
- `list2`
- `livestream`
- `locked`
- `lowVision`
- `mad`
- `magento`
- `magnet`
- `male`
- `map`
- `mapMarker`
- `mapMarkerAlt`
- `mars`
- `marsDouble`
- `marsStroke`
- `marsStrokeH`
- `marsStrokeV`
- `mastercard`
- `maxcdn`
- `medium`
- `meetup`
- `mercury`
- `messenger`
- `meteor`
- `metro`
- `mic`
- `microsoft`
- `minusA`
- `mobile`
- `mobileAlt`
- `moneySymbol`
- `mongodb`
- `moreV`
- `moreVA`
- `motorcycle`
- `moveH`
- `moveHA`
- `musicNote`
- `mysql`
- `navIcon`
- `navIconA`
- `navIconGrid`
- `navIconGridA`
- `navIconList`
- `navIconListA`
- `navigate`
- `nervous`
- `netflix`
- `neuter`
- `neutral`
- `nginx`
- `nightAltCloudy`
- `nightAltLightning`
- `nightAltRain`
- `nightAltSnow`
- `nightClear`
- `nodejs`
- `npm`
- `nurse`
- `nursingHome`
- `odnoklassniki`
- `onedrive`
- `onenote`
- `openMouth`
- `opencart`
- `opera`
- `oracle`
- `origin`
- `outdent`
- `paperPlane`
- `paperclip`
- `paragraph`
- `paralysisDisability`
- `parasol`
- `passport`
- `passportAlt`
- `paste`
- `pause`
- `paw`
- `paypal`
- `paypalP`
- `payu`
- `periscope`
- `person`
- `persons`
- `phone`
- `photograph`
- `php`
- `picture`
- `pieChart1`
- `pieChart2`
- `pills`
- `pinboard`
- `pingdom`
- `pinterest`
- `plane`
- `planeTicket`
- `play`
- `playList`
- `playerSettings`
- `playstation`
- `plusA`
- `podcast`
- `power`
- `prescription`
- `preview`
- `print`
- `productHunt`
- `propeller1`
- `propeller2`
- `propeller3`
- `propeller4`
- `pulse`
- `python`
- `qrcode`
- `question`
- `quora`
- `quoteALeft`
- `quoteARight`
- `quoteLeft`
- `quoteRight`
- `radioBtnActive`
- `radioBtnPassive`
- `rage`
- `rails`
- `rain`
- `rainbow`
- `rains`
- `random`
- `raspberryPi`
- `react`
- `record`
- `rectangle`
- `recycle`
- `reddit`
- `redis`
- `redo`
- `redux`
- `reply`
- `rightAlign`
- `rocket`
- `room`
- `rouble`
- `rss`
- `ruby`
- `safari`
- `saitBoat`
- `sass`
- `saucelabs`
- `save`
- `save1`
- `scissors`
- `scorp`
- `search`
- `sentry`
- `share`
- `shareA`
- `shazam`
- `shield`
- `ship`
- `shopify`
- `shoppingBag`
- `shoppingBag1`
- `shoppingBarcode`
- `shoppingBasket`
- `shoppingBasketAdd`
- `shoppingBasketRemove`
- `shoppingPackage`
- `shoppingPosMachine`
- `shoppingSale`
- `shoppingStore`
- `sinaWeibo`
- `sitemap`
- `skyatlas`
- `skype`
- `slack`
- `slides`
- `slightlySmile`
- `smiley`
- `smiling`
- `snapchat`
- `snorkel`
- `snow`
- `snowflake`
- `snowflake1`
- `snowflake2`
- `snowflake3`
- `snowflake4`
- `snowflake5`
- `snowflake6`
- `snowflake7`
- `snowflake8`
- `snows`
- `soundcloud`
- `sourcetree`
- `spinner`
- `spinnerCog`
- `spinnerFidget`
- `spinnerRefresh`
- `spinnerRotateForward`
- `spotify`
- `stackOverflow`
- `star`
- `starHalf`
- `steam`
- `stepBackwrad`
- `stepForward`
- `stethoscope`
- `stop`
- `stopwatch`
- `strikethrough`
- `stuckOutTongue`
- `stumbleupon`
- `stylus`
- `sublimeText`
- `subscript`
- `subway`
- `suitcase`
- `suitcaseAlt`
- `sun`
- `sunglasses`
- `sunglassesAlt`
- `superscript`
- `surgicalKnife`
- `surprised`
- `svn`
- `swarm`
- `swift`
- `swimsuit`
- `table1`
- `table2`
- `tablet`
- `tabletAlt`
- `tablets`
- `taxi`
- `ted`
- `telegram`
- `tent`
- `tesla`
- `testBottle`
- `testTube`
- `testTubeAlt`
- `textHeight`
- `textWidth`
- `thermometer`
- `thermometerAlt`
- `ticket`
- `ticketAlt`
- `tinder`
- `tl`
- `toggleOff`
- `toggleOn`
- `tongue`
- `train`
- `trainTicket`
- `transgender`
- `transgenderAlt`
- `trash`
- `travis`
- `treehouse`
- `trello`
- `tripadvisor`
- `troy`
- `truck`
- `tty`
- `tumblr`
- `tv`
- `twitch`
- `twitter`
- `twoo`
- `uber`
- `ubuntu`
- `udacity`
- `umbrella`
- `underline`
- `undo`
- `unity`
- `universalAcces`
- `unlocked`
- `unrealEngine`
- `upload`
- `usb`
- `userSecret`
- `venus`
- `venusDouble`
- `venusMars`
- `viber`
- `vimeo`
- `vine`
- `visa`
- `visualStudio`
- `vk`
- `volumeDown`
- `volumeMute`
- `volumeOff`
- `volumeUp`
- `vuejs`
- `wallet`
- `webpack`
- `webstorm`
- `wetransfer`
- `whatsapp`
- `wheelchair`
- `wifi`
- `wifiLogo`
- `wikipedia`
- `wind`
- `windows`
- `wink`
- `wix`
- `wordpress`
- `world`
- `worldO`
- `xbox`
- `yacht`
- `yahoo`
- `yandex`
- `yandexInternational`
- `yarn`
- `yelp`
- `yen`
- `youtubePlay`
- `zipperMouth`
- `zoom`
- `zoomMinus`
- `zoomPlus`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AcrobatReaderIcon, AdjustIcon, AdobeIcon } from '@stacksjs/iconify-fontisto'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AcrobatReaderIcon({ size: 20, class: 'nav-icon' }),
    contact: AdjustIcon({ size: 20, class: 'nav-icon' }),
    settings: AdobeIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-fontisto'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AcrobatReaderIcon, AdjustIcon } from '@stacksjs/iconify-fontisto'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcrobatReaderIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdjustIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AcrobatReaderIcon } from '@stacksjs/iconify-fontisto'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, acrobatReader } from '@stacksjs/iconify-fontisto'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AcrobatReaderIcon } from '@stacksjs/iconify-fontisto'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fontisto'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-fontisto'
     global.icon = 500pxIcon({ size: 24 })
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
   const icon = 500pxIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-fontisto'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/kenangundogan/fontisto/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Kenan Gündoğan ([Website](https://github.com/kenangundogan/fontisto))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fontisto/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fontisto/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
