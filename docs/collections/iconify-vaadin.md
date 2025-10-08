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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbacusIcon height="1em" />
<AbacusIcon width="1em" height="1em" />
<AbacusIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbacusIcon size="24" />
<AbacusIcon size="1em" />

<!-- Using width and height -->
<AbacusIcon width="24" height="32" />

<!-- With color -->
<AbacusIcon size="24" color="red" />
<AbacusIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbacusIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbacusIcon
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
    <AbacusIcon size="24" />
    <AbsolutePositionIcon size="24" color="#4a90e2" />
    <AcademyCapIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AbacusIcon size="24" color="red" />
<AbacusIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbacusIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbacusIcon size="24" class="text-primary" />
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
<AbacusIcon height="1em" />
<AbacusIcon width="1em" height="1em" />
<AbacusIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbacusIcon size="24" />
<AbacusIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.vaadin-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbacusIcon class="vaadin-icon" />
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
<nav>
  <a href="/"><AbacusIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AbsolutePositionIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AcademyCapIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccessibilityIcon size="20" class="nav-icon" /> Settings</a>
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
<AbacusIcon
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
    <AbacusIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AbsolutePositionIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AcademyCapIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbacusIcon size="24" />
   <AbsolutePositionIcon size="24" color="#4a90e2" />
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
   <AbacusIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbacusIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbacusIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abacus } from '@stacksjs/iconify-vaadin'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abacus, { size: 24 })
   @endjs

   {!! customIcon !!}
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
