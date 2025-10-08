# Font Awesome 4

> Font Awesome 4 icons for stx from Iconify

## Overview

This package provides access to 649 icons from the Font Awesome 4 collection through the stx iconify integration.

**Collection ID:** `fa`
**Total Icons:** 649
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome/tree/fa-4))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AddressBookIcon, AddressBookOIcon } from '@stacksjs/iconify-fa'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AddressBookIcon({ color: 'red' })

// With multiple props
const customIcon = AddressBookOIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AddressBookIcon, AddressBookOIcon } from '@stacksjs/iconify-fa'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AddressBookIcon({ size: 24, color: '#4a90e2' }),
    settings: AddressBookOIcon({ size: 32 })
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
import { 500px, addressBook, addressBookO } from '@stacksjs/iconify-fa'
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

This package contains **649** icons:

- `500px`
- `addressBook`
- `addressBookO`
- `addressCard`
- `addressCardO`
- `adjust`
- `adn`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `amazon`
- `ambulance`
- `americanSignLanguageInterpreting`
- `anchor`
- `android`
- `angellist`
- `angleDoubleLeft`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleUp`
- `apple`
- `archive`
- `areaChart`
- `arrowCircleLeft`
- `arrowCircleOLeft`
- `arrowCircleOUp`
- `arrowCircleUp`
- `arrowLeft`
- `arrowUp`
- `arrows`
- `arrowsAlt`
- `arrowsH`
- `arrowsV`
- `assistiveListeningSystems`
- `asterisk`
- `at`
- `audioDescription`
- `automobile`
- `backward`
- `balanceScale`
- `ban`
- `bandcamp`
- `bank`
- `barChart`
- `barcode`
- `bars`
- `bath`
- `battery`
- `battery0`
- `battery1`
- `battery2`
- `battery3`
- `bed`
- `beer`
- `behance`
- `behanceSquare`
- `bell`
- `bellO`
- `bellSlash`
- `bellSlashO`
- `bicycle`
- `binoculars`
- `birthdayCake`
- `bitbucket`
- `bitbucketSquare`
- `bitcoin`
- `blackTie`
- `blind`
- `bluetooth`
- `bluetoothB`
- `bold`
- `bolt`
- `bomb`
- `book`
- `bookmark`
- `bookmarkO`
- `braille`
- `briefcase`
- `bug`
- `building`
- `buildingO`
- `bullhorn`
- `bullseye`
- `bus`
- `buysellads`
- `cab`
- `calculator`
- `calendar`
- `calendarCheckO`
- `calendarMinusO`
- `calendarO`
- `calendarPlusO`
- `calendarTimesO`
- `camera`
- `cameraRetro`
- `caretDown`
- `caretLeft`
- `caretSquareOLeft`
- `caretSquareOUp`
- `caretUp`
- `cartArrowDown`
- `cartPlus`
- `cc`
- `ccAmex`
- `ccDinersClub`
- `ccDiscover`
- `ccJcb`
- `ccMastercard`
- `ccPaypal`
- `ccStripe`
- `ccVisa`
- `certificate`
- `chain`
- `chainBroken`
- `check`
- `checkCircle`
- `checkCircleO`
- `checkSquare`
- `checkSquareO`
- `chevronCircleLeft`
- `chevronCircleUp`
- `chevronDown`
- `chevronLeft`
- `chevronUp`
- `child`
- `chrome`
- `circle`
- `circleO`
- `circleONotch`
- `circleThin`
- `clipboard`
- `clockO`
- `clone`
- `close`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `cny`
- `code`
- `codeFork`
- `codepen`
- `codiepie`
- `coffee`
- `cog`
- `cogs`
- `columns`
- `comment`
- `commentO`
- `commenting`
- `commentingO`
- `comments`
- `commentsO`
- `compass`
- `compress`
- `connectdevelop`
- `contao`
- `copy`
- `copyright`
- `creativeCommons`
- `creditCard`
- `creditCardAlt`
- `crop`
- `crosshairs`
- `css3`
- `cube`
- `cubes`
- `cut`
- `cutlery`
- `dashboard`
- `dashcube`
- `database`
- `deaf`
- `dedent`
- `delicious`
- `desktop`
- `deviantart`
- `diamond`
- `digg`
- `dollar`
- `dotCircleO`
- `download`
- `dribbble`
- `driversLicense`
- `driversLicenseO`
- `dropbox`
- `drupal`
- `edge`
- `edit`
- `eercast`
- `eject`
- `ellipsisH`
- `ellipsisV`
- `empire`
- `envelope`
- `envelopeO`
- `envelopeOpen`
- `envelopeOpenO`
- `envelopeSquare`
- `envira`
- `eraser`
- `etsy`
- `eur`
- `exchange`
- `exclamation`
- `exclamationCircle`
- `exclamationTriangle`
- `expand`
- `expeditedssl`
- `externalLink`
- `externalLinkSquare`
- `eye`
- `eyeSlash`
- `eyedropper`
- `fa`
- `facebook`
- `facebookOfficial`
- `facebookSquare`
- `fastBackward`
- `fax`
- `feed`
- `female`
- `fighterJet`
- `file`
- `fileArchiveO`
- `fileAudioO`
- `fileCodeO`
- `fileExcelO`
- `fileImageO`
- `fileMovieO`
- `fileO`
- `filePdfO`
- `filePowerpointO`
- `fileText`
- `fileTextO`
- `fileWordO`
- `film`
- `filter`
- `fire`
- `fireExtinguisher`
- `firefox`
- `firstOrder`
- `flag`
- `flagCheckered`
- `flagO`
- `flask`
- `flickr`
- `floppyO`
- `folder`
- `folderO`
- `folderOpen`
- `folderOpenO`
- `font`
- `fonticons`
- `fortAwesome`
- `forumbee`
- `foursquare`
- `freeCodeCamp`
- `frownO`
- `futbolO`
- `gamepad`
- `gavel`
- `gbp`
- `genderless`
- `getPocket`
- `gg`
- `ggCircle`
- `gift`
- `git`
- `gitSquare`
- `github`
- `githubAlt`
- `githubSquare`
- `gitlab`
- `gittip`
- `glass`
- `glide`
- `glideG`
- `globe`
- `google`
- `googlePlus`
- `googlePlusCircle`
- `googlePlusSquare`
- `googleWallet`
- `graduationCap`
- `grav`
- `group`
- `hSquare`
- `hackerNews`
- `handGrabO`
- `handLizardO`
- `handOLeft`
- `handOUp`
- `handPaperO`
- `handPeaceO`
- `handPointerO`
- `handScissorsO`
- `handSpockO`
- `handshakeO`
- `hashtag`
- `hddO`
- `header`
- `headphones`
- `heart`
- `heartO`
- `heartbeat`
- `history`
- `home`
- `hospitalO`
- `hourglass`
- `hourglass1`
- `hourglass2`
- `hourglass3`
- `hourglassO`
- `houzz`
- `html5`
- `iCursor`
- `idBadge`
- `ils`
- `image`
- `imdb`
- `inbox`
- `indent`
- `industry`
- `info`
- `infoCircle`
- `inr`
- `instagram`
- `internetExplorer`
- `intersex`
- `ioxhost`
- `italic`
- `joomla`
- `jsfiddle`
- `key`
- `keyboardO`
- `krw`
- `language`
- `laptop`
- `lastfm`
- `lastfmSquare`
- `leaf`
- `leanpub`
- `lemonO`
- `levelUp`
- `lifeBouy`
- `lightbulbO`
- `lineChart`
- `linkedin`
- `linkedinSquare`
- `linode`
- `linux`
- `list`
- `listAlt`
- `listOl`
- `listUl`
- `locationArrow`
- `lock`
- `longArrowLeft`
- `longArrowUp`
- `lowVision`
- `magic`
- `magnet`
- `mailForward`
- `mailReply`
- `mailReplyAll`
- `male`
- `map`
- `mapMarker`
- `mapO`
- `mapPin`
- `mapSigns`
- `mars`
- `marsDouble`
- `marsStroke`
- `marsStrokeH`
- `marsStrokeV`
- `maxcdn`
- `meanpath`
- `medium`
- `medkit`
- `meetup`
- `mehO`
- `mercury`
- `microchip`
- `microphone`
- `microphoneSlash`
- `minus`
- `minusCircle`
- `minusSquare`
- `minusSquareO`
- `mixcloud`
- `mobile`
- `modx`
- `money`
- `moonO`
- `motorcycle`
- `mousePointer`
- `music`
- `neuter`
- `newspaperO`
- `objectGroup`
- `objectUngroup`
- `odnoklassniki`
- `odnoklassnikiSquare`
- `opencart`
- `openid`
- `opera`
- `optinMonster`
- `pagelines`
- `paintBrush`
- `paperPlane`
- `paperPlaneO`
- `paperclip`
- `paragraph`
- `pause`
- `pauseCircle`
- `pauseCircleO`
- `paw`
- `paypal`
- `pencil`
- `pencilSquare`
- `percent`
- `phone`
- `phoneSquare`
- `pieChart`
- `piedPiper`
- `piedPiperAlt`
- `piedPiperPp`
- `pinterest`
- `pinterestP`
- `pinterestSquare`
- `plane`
- `play`
- `playCircle`
- `playCircleO`
- `plug`
- `plus`
- `plusCircle`
- `plusSquare`
- `plusSquareO`
- `podcast`
- `powerOff`
- `print`
- `productHunt`
- `puzzlePiece`
- `qq`
- `qrcode`
- `question`
- `questionCircle`
- `questionCircleO`
- `quora`
- `quoteLeft`
- `quoteRight`
- `ra`
- `random`
- `ravelry`
- `recycle`
- `reddit`
- `redditAlien`
- `redditSquare`
- `refresh`
- `registered`
- `renren`
- `repeat`
- `retweet`
- `road`
- `rocket`
- `rotateLeft`
- `rouble`
- `rssSquare`
- `safari`
- `scribd`
- `search`
- `searchMinus`
- `searchPlus`
- `sellsy`
- `server`
- `shareAlt`
- `shareAltSquare`
- `shareSquare`
- `shareSquareO`
- `shield`
- `ship`
- `shirtsinbulk`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shower`
- `signIn`
- `signLanguage`
- `signOut`
- `signal`
- `simplybuilt`
- `sitemap`
- `skyatlas`
- `skype`
- `slack`
- `sliders`
- `slideshare`
- `smileO`
- `snapchat`
- `snapchatGhost`
- `snapchatSquare`
- `snowflakeO`
- `sort`
- `sortAlphaAsc`
- `sortAlphaDesc`
- `sortAmountAsc`
- `sortAmountDesc`
- `sortAsc`
- `sortNumericAsc`
- `sortNumericDesc`
- `soundcloud`
- `spaceShuttle`
- `spinner`
- `spoon`
- `spotify`
- `square`
- `squareO`
- `stackExchange`
- `stackOverflow`
- `star`
- `starHalf`
- `starHalfEmpty`
- `starO`
- `steam`
- `steamSquare`
- `stepBackward`
- `stethoscope`
- `stickyNote`
- `stickyNoteO`
- `stop`
- `stopCircle`
- `stopCircleO`
- `streetView`
- `strikethrough`
- `stumbleupon`
- `stumbleuponCircle`
- `subscript`
- `subway`
- `suitcase`
- `sunO`
- `superpowers`
- `superscript`
- `table`
- `tablet`
- `tag`
- `tags`
- `tasks`
- `telegram`
- `television`
- `tencentWeibo`
- `terminal`
- `textHeight`
- `textWidth`
- `th`
- `thLarge`
- `thList`
- `themeisle`
- `thermometer`
- `thermometer0`
- `thermometer1`
- `thermometer2`
- `thermometer3`
- `thumbTack`
- `thumbsDown`
- `thumbsOUp`
- `thumbsUp`
- `ticket`
- `timesCircle`
- `timesCircleO`
- `timesRectangle`
- `timesRectangleO`
- `tint`
- `toggleOff`
- `toggleOn`
- `trademark`
- `train`
- `transgenderAlt`
- `trash`
- `trashO`
- `tree`
- `trello`
- `tripadvisor`
- `trophy`
- `truck`
- `try`
- `tty`
- `tumblr`
- `tumblrSquare`
- `twitch`
- `twitter`
- `twitterSquare`
- `umbrella`
- `underline`
- `universalAccess`
- `unlock`
- `unlockAlt`
- `upload`
- `usb`
- `user`
- `userCircle`
- `userCircleO`
- `userMd`
- `userO`
- `userPlus`
- `userSecret`
- `userTimes`
- `venus`
- `venusDouble`
- `venusMars`
- `viacoin`
- `viadeo`
- `viadeoSquare`
- `videoCamera`
- `vimeo`
- `vimeoSquare`
- `vine`
- `vk`
- `volumeControlPhone`
- `volumeDown`
- `volumeOff`
- `volumeUp`
- `wechat`
- `weibo`
- `whatsapp`
- `wheelchair`
- `wheelchairAlt`
- `wifi`
- `wikipediaW`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `windows`
- `wordpress`
- `wpbeginner`
- `wpexplorer`
- `wpforms`
- `wrench`
- `xing`
- `xingSquare`
- `yCombinator`
- `yahoo`
- `yelp`
- `yoast`
- `youtube`
- `youtubePlay`
- `youtubeSquare`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AddressBookIcon, AddressBookOIcon, AddressCardIcon } from '@stacksjs/iconify-fa'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    contact: AddressBookOIcon({ size: 20, class: 'nav-icon' }),
    settings: AddressCardIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-fa'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AddressBookIcon, AddressBookOIcon } from '@stacksjs/iconify-fa'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddressBookIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddressBookOIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AddressBookIcon } from '@stacksjs/iconify-fa'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, addressBook } from '@stacksjs/iconify-fa'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AddressBookIcon } from '@stacksjs/iconify-fa'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fa'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-fa'
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
import { 500px } from '@stacksjs/iconify-fa'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome/tree/fa-4))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
