# Vaadin Icons

> Vaadin Icons icons for stx from Iconify

## Overview

This package provides access to 636 icons from the Vaadin Icons collection through the stx iconify integration.

**Collection ID:** `vaadin`
**Total Icons:** 636
**Author:** Vaadin ([Website](https://github.com/vaadin/web-components))
**License:** Apache 2.0
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-vaadin
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbacusIcon, AbsolutePositionIcon, AcademyCapIcon } from '@stacksjs/iconify-vaadin'

// Basic usage
const icon = AbacusIcon()

// With size
const sizedIcon = AbacusIcon({ size: 24 })

// With color
const coloredIcon = AbsolutePositionIcon({ color: 'red' })

// With multiple props
const customIcon = AcademyCapIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbacusIcon, AbsolutePositionIcon, AcademyCapIcon } from '@stacksjs/iconify-vaadin'

  global.icons = {
    home: AbacusIcon({ size: 24 }),
    user: AbsolutePositionIcon({ size: 24, color: '#4a90e2' }),
    settings: AcademyCapIcon({ size: 32 })
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
import { abacus, absolutePosition, academyCap } from '@stacksjs/iconify-vaadin'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abacus, { size: 24 })
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
const redIcon = AbacusIcon({ color: 'red' })
const blueIcon = AbacusIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbacusIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbacusIcon({ class: 'text-primary' })
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
const icon24 = AbacusIcon({ size: 24 })
const icon1em = AbacusIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbacusIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbacusIcon({ height: '1em' })
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
const smallIcon = AbacusIcon({ class: 'icon-small' })
const largeIcon = AbacusIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **636** icons:

- `abacus`
- `absolutePosition`
- `academyCap`
- `accessibility`
- `accordionMenu`
- `addDock`
- `adjust`
- `adobeFlash`
- `airplane`
- `alarm`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `alt`
- `altA`
- `ambulance`
- `anchor`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleUp`
- `archive`
- `archives`
- `areaSelect`
- `arrowBackward`
- `arrowCircleDown`
- `arrowCircleDownO`
- `arrowCircleLeft`
- `arrowCircleLeftO`
- `arrowCircleRight`
- `arrowCircleRightO`
- `arrowCircleUp`
- `arrowCircleUpO`
- `arrowDown`
- `arrowForward`
- `arrowLeft`
- `arrowLongDown`
- `arrowLongLeft`
- `arrowRight`
- `arrowUp`
- `arrows`
- `arrowsCross`
- `arrowsLongH`
- `arrowsLongRight`
- `arrowsLongUp`
- `arrowsLongV`
- `asterisk`
- `at`
- `automation`
- `backspace`
- `backspaceA`
- `backwards`
- `ban`
- `barChart`
- `barChartH`
- `barChartV`
- `barcode`
- `bed`
- `bell`
- `bellO`
- `bellSlash`
- `bellSlashO`
- `boat`
- `bold`
- `bolt`
- `bomb`
- `book`
- `bookDollar`
- `bookPercent`
- `bookmark`
- `bookmarkO`
- `briefcase`
- `browser`
- `bug`
- `bugO`
- `building`
- `buildingO`
- `bullets`
- `bullseye`
- `buss`
- `button`
- `calc`
- `calcBook`
- `calendar`
- `calendarBriefcase`
- `calendarClock`
- `calendarEnvelope`
- `calendarO`
- `calendarUser`
- `camera`
- `car`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretSquareDownO`
- `caretSquareLeftO`
- `caretSquareRightO`
- `caretSquareUpO`
- `caretUp`
- `cart`
- `cartO`
- `cash`
- `chart`
- `chart3d`
- `chartGrid`
- `chartLine`
- `chartTimeline`
- `chat`
- `check`
- `checkCircle`
- `checkCircleO`
- `checkSquare`
- `checkSquareO`
- `chevronCircleDown`
- `chevronCircleDownO`
- `chevronCircleLeft`
- `chevronCircleLeftO`
- `chevronCircleRight`
- `chevronCircleRightO`
- `chevronCircleUp`
- `chevronCircleUpO`
- `chevronDown`
- `chevronDownSmall`
- `chevronLeft`
- `chevronLeftSmall`
- `chevronRight`
- `chevronRightSmall`
- `chevronUp`
- `chevronUpSmall`
- `child`
- `circle`
- `circleThin`
- `clipboard`
- `clipboardCheck`
- `clipboardCross`
- `clipboardHeart`
- `clipboardPulse`
- `clipboardText`
- `clipboardUser`
- `clock`
- `close`
- `closeBig`
- `closeCircle`
- `closeCircleO`
- `closeSmall`
- `cloud`
- `cloudDownload`
- `cloudDownloadO`
- `cloudO`
- `cloudUpload`
- `cloudUploadO`
- `cluster`
- `code`
- `coffee`
- `cog`
- `cogO`
- `cogs`
- `coinPiles`
- `coins`
- `combobox`
- `comment`
- `commentEllipsis`
- `commentEllipsisO`
- `commentO`
- `comments`
- `commentsO`
- `compile`
- `compress`
- `compressSquare`
- `connect`
- `connectO`
- `controller`
- `copy`
- `copyO`
- `copyright`
- `cornerLowerLeft`
- `cornerLowerRight`
- `cornerUpperLeft`
- `cornerUpperRight`
- `creditCard`
- `crop`
- `crossCutlery`
- `crosshairs`
- `css`
- `ctrl`
- `ctrlA`
- `cube`
- `cubes`
- `curlyBrackets`
- `cursor`
- `cursorO`
- `cutlery`
- `dashboard`
- `database`
- `dateInput`
- `deindent`
- `del`
- `delA`
- `dentalChair`
- `desktop`
- `diamond`
- `diamondO`
- `diploma`
- `diplomaScroll`
- `disc`
- `doctor`
- `doctorBriefcase`
- `dollar`
- `dotCircle`
- `download`
- `downloadAlt`
- `drop`
- `edit`
- `eject`
- `elastic`
- `ellipsisCircle`
- `ellipsisCircleO`
- `ellipsisDotsH`
- `ellipsisDotsV`
- `ellipsisH`
- `ellipsisV`
- `enter`
- `enterArrow`
- `envelope`
- `envelopeO`
- `envelopeOpen`
- `envelopeOpenO`
- `envelopes`
- `envelopesO`
- `eraser`
- `esc`
- `escA`
- `euro`
- `exchange`
- `exclamation`
- `exclamationCircle`
- `exclamationCircleO`
- `exit`
- `exitO`
- `expand`
- `expandFull`
- `expandSquare`
- `externalBrowser`
- `externalLink`
- `eye`
- `eyeSlash`
- `eyedropper`
- `facebook`
- `facebookSquare`
- `factory`
- `family`
- `fastBackward`
- `fastForward`
- `female`
- `file`
- `fileAdd`
- `fileCode`
- `fileFont`
- `fileMovie`
- `fileO`
- `filePicture`
- `filePresentation`
- `fileProcess`
- `fileRefresh`
- `fileRemove`
- `fileSearch`
- `fileSound`
- `fileStart`
- `fileTable`
- `fileText`
- `fileTextO`
- `fileTree`
- `fileTreeSmall`
- `fileTreeSub`
- `fileZip`
- `fill`
- `film`
- `filter`
- `fire`
- `flag`
- `flagCheckered`
- `flagO`
- `flash`
- `flask`
- `flightLanding`
- `flightTakeoff`
- `flipH`
- `flipV`
- `folder`
- `folderAdd`
- `folderO`
- `folderOpen`
- `folderOpenO`
- `folderRemove`
- `folderSearch`
- `font`
- `form`
- `forward`
- `frownO`
- `funcion`
- `funnel`
- `gamepad`
- `gavel`
- `gift`
- `glass`
- `glasses`
- `globe`
- `globeWire`
- `golf`
- `googlePlus`
- `googlePlusSquare`
- `grab`
- `grid`
- `gridBevel`
- `gridBig`
- `gridBigO`
- `gridH`
- `gridSmall`
- `gridSmallO`
- `gridV`
- `group`
- `hammer`
- `hand`
- `handleCorner`
- `handsUp`
- `handshake`
- `harddrive`
- `harddriveO`
- `hash`
- `header`
- `headphones`
- `headset`
- `healthCard`
- `heart`
- `heartO`
- `home`
- `homeO`
- `hospital`
- `hourglass`
- `hourglassEmpty`
- `hourglassEnd`
- `hourglassStart`
- `inbox`
- `indent`
- `info`
- `infoCircle`
- `infoCircleO`
- `input`
- `insert`
- `institution`
- `invoice`
- `italic`
- `key`
- `keyO`
- `keyboard`
- `keyboardO`
- `laptop`
- `layout`
- `levelDown`
- `levelDownBold`
- `levelLeft`
- `levelLeftBold`
- `levelRight`
- `levelRightBold`
- `levelUp`
- `levelUpBold`
- `lifebuoy`
- `lightbulb`
- `lineBarChart`
- `lineChart`
- `lineH`
- `lineV`
- `lines`
- `linesList`
- `link`
- `list`
- `listOl`
- `listSelect`
- `listUl`
- `locationArrow`
- `locationArrowCircle`
- `locationArrowCircleO`
- `lock`
- `magic`
- `magnet`
- `mailbox`
- `male`
- `mapMarker`
- `margin`
- `marginBottom`
- `marginLeft`
- `marginRight`
- `marginTop`
- `medal`
- `megafone`
- `mehO`
- `menu`
- `microphone`
- `minus`
- `minusCircle`
- `minusCircleO`
- `minusSquareO`
- `mobile`
- `mobileBrowser`
- `mobileRetro`
- `modal`
- `modalList`
- `money`
- `moneyDeposit`
- `moneyExchange`
- `moneyWithdraw`
- `moon`
- `moonO`
- `morning`
- `movie`
- `music`
- `mute`
- `nativeButton`
- `newspaper`
- `notebook`
- `nurse`
- `office`
- `openBook`
- `option`
- `optionA`
- `options`
- `orientation`
- `out`
- `outbox`
- `package`
- `padding`
- `paddingBottom`
- `paddingLeft`
- `paddingRight`
- `paddingTop`
- `paintRoll`
- `paintbrush`
- `palete`
- `panel`
- `paperclip`
- `paperplane`
- `paperplaneO`
- `paragraph`
- `password`
- `paste`
- `pause`
- `pencil`
- `phone`
- `phoneLandline`
- `picture`
- `pieBarChart`
- `pieChart`
- `piggyBank`
- `piggyBankCoin`
- `pill`
- `pills`
- `pin`
- `pinPost`
- `play`
- `playCircle`
- `playCircleO`
- `plug`
- `plus`
- `plusCircle`
- `plusCircleO`
- `plusMinus`
- `plusSquareO`
- `pointer`
- `powerOff`
- `presentation`
- `print`
- `progressbar`
- `puzzlePiece`
- `pyramidChart`
- `qrcode`
- `question`
- `questionCircle`
- `questionCircleO`
- `quoteLeft`
- `quoteRight`
- `random`
- `raster`
- `rasterLowerLeft`
- `records`
- `recycle`
- `refresh`
- `reply`
- `replyAll`
- `resizeH`
- `resizeV`
- `retweet`
- `rhombus`
- `road`
- `roadBranch`
- `roadBranches`
- `roadSplit`
- `rocket`
- `rotateLeft`
- `rotateRight`
- `rss`
- `rssSquare`
- `safe`
- `safeLock`
- `scale`
- `scaleUnbalance`
- `scatterChart`
- `scissors`
- `screwdriver`
- `search`
- `searchMinus`
- `searchPlus`
- `select`
- `server`
- `share`
- `shareSquare`
- `shield`
- `shift`
- `shiftArrow`
- `shop`
- `signIn`
- `signInAlt`
- `signOut`
- `signOutAlt`
- `signal`
- `sitemap`
- `slider`
- `sliders`
- `smileyO`
- `sort`
- `soundDisable`
- `sparkLine`
- `specialist`
- `spinner`
- `spinnerArc`
- `spinnerThird`
- `splineAreaChart`
- `splineChart`
- `split`
- `splitH`
- `splitV`
- `spoon`
- `squareShadow`
- `star`
- `starHalfLeft`
- `starHalfLeftO`
- `starHalfRight`
- `starHalfRightO`
- `starO`
- `startCog`
- `stepBackward`
- `stepForward`
- `stethoscope`
- `stock`
- `stop`
- `stopCog`
- `stopwatch`
- `storage`
- `strikethrough`
- `subscript`
- `suitcase`
- `sunDown`
- `sunO`
- `sunRise`
- `superscript`
- `sword`
- `tab`
- `tabA`
- `table`
- `tablet`
- `tabs`
- `tag`
- `tags`
- `tasks`
- `taxi`
- `teeth`
- `terminal`
- `textHeight`
- `textInput`
- `textLabel`
- `textWidth`
- `thinSquare`
- `thumbsDown`
- `thumbsDownO`
- `thumbsUp`
- `thumbsUpO`
- `ticket`
- `timeBackward`
- `timeForward`
- `timer`
- `toolbox`
- `tools`
- `tooth`
- `touch`
- `train`
- `trash`
- `treeTable`
- `trendindDown`
- `trendingUp`
- `trophy`
- `truck`
- `twinColSelect`
- `twitter`
- `twitterSquare`
- `umbrella`
- `underline`
- `unlink`
- `unlock`
- `upload`
- `uploadAlt`
- `user`
- `userCard`
- `userCheck`
- `userClock`
- `userHeart`
- `userStar`
- `users`
- `vaadinH`
- `vaadinV`
- `viewport`
- `vimeo`
- `vimeoSquare`
- `volume`
- `volumeDown`
- `volumeOff`
- `volumeUp`
- `wallet`
- `warning`
- `workplace`
- `wrench`
- `youtube`
- `youtubeSquare`

## Usage Examples

### Navigation Menu

```html
@js
  import { AbacusIcon, AbsolutePositionIcon, AcademyCapIcon, AccessibilityIcon } from '@stacksjs/iconify-vaadin'

  global.navIcons = {
    home: AbacusIcon({ size: 20, class: 'nav-icon' }),
    about: AbsolutePositionIcon({ size: 20, class: 'nav-icon' }),
    contact: AcademyCapIcon({ size: 20, class: 'nav-icon' }),
    settings: AccessibilityIcon({ size: 20, class: 'nav-icon' })
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
import { AbacusIcon } from '@stacksjs/iconify-vaadin'

const icon = AbacusIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbacusIcon, AbsolutePositionIcon, AcademyCapIcon } from '@stacksjs/iconify-vaadin'

const successIcon = AbacusIcon({ size: 16, color: '#22c55e' })
const warningIcon = AbsolutePositionIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AcademyCapIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbacusIcon, AbsolutePositionIcon } from '@stacksjs/iconify-vaadin'
   const icon = AbacusIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abacus, absolutePosition } from '@stacksjs/iconify-vaadin'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abacus, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbacusIcon, AbsolutePositionIcon } from '@stacksjs/iconify-vaadin'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-vaadin'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbacusIcon } from '@stacksjs/iconify-vaadin'
     global.icon = AbacusIcon({ size: 24 })
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
   const icon = AbacusIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abacus } from '@stacksjs/iconify-vaadin'

// Icons are typed as IconData
const myIcon: IconData = abacus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0



## Credits

- **Icons**: Vaadin ([Website](https://github.com/vaadin/web-components))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/vaadin/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/vaadin/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
