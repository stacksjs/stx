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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<500pxIcon size="24" />
<500pxIcon size="1em" />

<!-- Using width and height -->
<500pxIcon width="24" height="32" />

<!-- With color -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<500pxIcon size="24" class="icon-primary" />

<!-- With all properties -->
<500pxIcon
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
    <500pxIcon size="24" />
    <AcrobatReaderIcon size="24" color="#4a90e2" />
    <AdjustIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<500pxIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<500pxIcon size="24" class="text-primary" />
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
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<500pxIcon size="24" />
<500pxIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fontisto-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="fontisto-icon" />
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
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AcrobatReaderIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdjustIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdobeIcon size="20" class="nav-icon" /> Settings</a>
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
<500pxIcon
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
    <500pxIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AcrobatReaderIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdjustIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <AcrobatReaderIcon size="24" color="#4a90e2" />
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
   <500pxIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <500pxIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <500pxIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-fontisto'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
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
