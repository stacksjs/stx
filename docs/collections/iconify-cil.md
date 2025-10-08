# CoreUI Free

> CoreUI Free icons for stx from Iconify

## Overview

This package provides access to 562 icons from the CoreUI Free collection through the stx iconify integration.

**Collection ID:** `cil`
**Total Icons:** 562
**Author:** creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cil
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dIcon height="1em" />
<3dIcon width="1em" height="1em" />
<3dIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dIcon size="24" />
<3dIcon size="1em" />

<!-- Using width and height -->
<3dIcon width="24" height="32" />

<!-- With color -->
<3dIcon size="24" color="red" />
<3dIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dIcon
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
    <3dIcon size="24" />
    <4kIcon size="24" color="#4a90e2" />
    <AccountLogoutIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3d, 4k, accountLogout } from '@stacksjs/iconify-cil'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3d, { size: 24 })
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
<3dIcon size="24" color="red" />
<3dIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dIcon size="24" class="text-primary" />
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
<3dIcon height="1em" />
<3dIcon width="1em" height="1em" />
<3dIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dIcon size="24" />
<3dIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.cil-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dIcon class="cil-icon" />
```

## Available Icons

This package contains **562** icons:

- `3d`
- `4k`
- `accountLogout`
- `actionRedo`
- `actionUndo`
- `addressBook`
- `airplaneMode`
- `airplaneModeOff`
- `airplay`
- `alarm`
- `album`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `americanFootball`
- `animal`
- `aperture`
- `apple`
- `applications`
- `applicationsSettings`
- `apps`
- `appsSettings`
- `arrowBottom`
- `arrowCircleBottom`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleTop`
- `arrowLeft`
- `arrowRight`
- `arrowThickBottom`
- `arrowThickFromBottom`
- `arrowThickFromLeft`
- `arrowThickFromRight`
- `arrowThickFromTop`
- `arrowThickLeft`
- `arrowThickRight`
- `arrowThickToBottom`
- `arrowThickToLeft`
- `arrowThickToRight`
- `arrowThickToTop`
- `arrowThickTop`
- `arrowTop`
- `assistiveListeningSystem`
- `asterisk`
- `asteriskCircle`
- `at`
- `audio`
- `audioDescription`
- `audioSpectrum`
- `avTimer`
- `baby`
- `babyCarriage`
- `backspace`
- `badge`
- `balanceScale`
- `ban`
- `bank`
- `barChart`
- `barcode`
- `baseball`
- `basket`
- `basketball`
- `bath`
- `bathroom`
- `battery0`
- `battery3`
- `battery5`
- `batteryAlert`
- `batteryEmpty`
- `batteryFull`
- `batterySlash`
- `beachAccess`
- `beaker`
- `bed`
- `bell`
- `bellExclamation`
- `bike`
- `birthdayCake`
- `blind`
- `bluetooth`
- `blur`
- `blurCircular`
- `blurLinear`
- `boatAlt`
- `bold`
- `bolt`
- `boltCircle`
- `book`
- `bookmark`
- `borderAll`
- `borderBottom`
- `borderClear`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderOuter`
- `borderRight`
- `borderStyle`
- `borderTop`
- `borderVertical`
- `bowling`
- `braille`
- `briefcase`
- `brightness`
- `britishPound`
- `browser`
- `brush`
- `brushAlt`
- `bug`
- `building`
- `bullhorn`
- `burger`
- `burn`
- `busAlt`
- `calculator`
- `calendar`
- `calendarCheck`
- `camera`
- `cameraControl`
- `cameraRoll`
- `carAlt`
- `caretBottom`
- `caretLeft`
- `caretRight`
- `caretTop`
- `cart`
- `cash`
- `casino`
- `cast`
- `cat`
- `cc`
- `centerFocus`
- `chart`
- `chartLine`
- `chartPie`
- `chatBubble`
- `check`
- `checkAlt`
- `checkCircle`
- `chevronBottom`
- `chevronCircleDownAlt`
- `chevronCircleLeftAlt`
- `chevronCircleRightAlt`
- `chevronCircleUpAlt`
- `chevronDoubleDown`
- `chevronDoubleLeft`
- `chevronDoubleRight`
- `chevronDoubleUp`
- `chevronDoubleUpAlt`
- `chevronLeft`
- `chevronRight`
- `chevronTop`
- `child`
- `childFriendly`
- `circle`
- `clearAll`
- `clipboard`
- `clock`
- `clone`
- `closedCaptioning`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `cloudy`
- `code`
- `coffee`
- `cog`
- `colorBorder`
- `colorFill`
- `colorPalette`
- `columns`
- `command`
- `commentBubble`
- `commentSquare`
- `compass`
- `compress`
- `contact`
- `contrast`
- `control`
- `copy`
- `couch`
- `creditCard`
- `crop`
- `cropRotate`
- `cursor`
- `cursorMove`
- `cut`
- `dataTransferDown`
- `dataTransferUp`
- `deaf`
- `delete`
- `description`
- `devices`
- `dialpad`
- `diamond`
- `dinner`
- `disabled`
- `dog`
- `dollar`
- `door`
- `doubleQuoteSansLeft`
- `doubleQuoteSansRight`
- `drink`
- `drinkAlcohol`
- `drop`
- `drop1`
- `eco`
- `education`
- `elevator`
- `envelopeClosed`
- `envelopeLetter`
- `envelopeOpen`
- `equalizer`
- `ethernet`
- `euro`
- `excerpt`
- `exitToApp`
- `expandDown`
- `expandLeft`
- `expandRight`
- `expandUp`
- `exposure`
- `externalLink`
- `eyedropper`
- `face`
- `faceDead`
- `factory`
- `factorySlash`
- `fastfood`
- `fax`
- `featuredPlaylist`
- `file`
- `filter`
- `filterFrames`
- `filterPhoto`
- `filterSquare`
- `filterX`
- `findInPage`
- `fingerprint`
- `fire`
- `flagAlt`
- `flightTakeoff`
- `flip`
- `flipToBack`
- `flipToFront`
- `flower`
- `folder`
- `folderOpen`
- `font`
- `football`
- `fork`
- `fridge`
- `frown`
- `fullscreen`
- `fullscreenExit`
- `functions`
- `functionsAlt`
- `gamepad`
- `garage`
- `gauge`
- `gem`
- `gif`
- `gift`
- `globeAlt`
- `golf`
- `golfAlt`
- `gradient`
- `grain`
- `graph`
- `grid`
- `gridSlash`
- `group`
- `hamburgerMenu`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `happy`
- `hd`
- `hdr`
- `header`
- `headphones`
- `healing`
- `heart`
- `highlighter`
- `highligt`
- `history`
- `home`
- `hospital`
- `hotTub`
- `house`
- `https`
- `image`
- `imageBroken`
- `imagePlus`
- `image1`
- `inbox`
- `indentDecrease`
- `indentIncrease`
- `industry`
- `industrySlash`
- `infinity`
- `info`
- `input`
- `inputHdmi`
- `inputPower`
- `institution`
- `italic`
- `justifyCenter`
- `justifyLeft`
- `justifyRight`
- `keyboard`
- `lan`
- `language`
- `laptop`
- `layers`
- `leaf`
- `lemon`
- `levelDown`
- `levelUp`
- `library`
- `libraryAdd`
- `libraryBuilding`
- `lifeRing`
- `lightbulb`
- `lineSpacing`
- `lineStyle`
- `lineWeight`
- `link`
- `linkAlt`
- `linkBroken`
- `list`
- `listFilter`
- `listHighPriority`
- `listLowPriority`
- `listNumbered`
- `listNumberedRtl`
- `listRich`
- `locationPin`
- `lockLocked`
- `lockUnlocked`
- `locomotive`
- `loop`
- `loop1`
- `loopCircular`
- `lowVision`
- `magnifyingGlass`
- `map`
- `mediaEject`
- `mediaPause`
- `mediaPlay`
- `mediaRecord`
- `mediaSkipBackward`
- `mediaSkipForward`
- `mediaStepBackward`
- `mediaStepForward`
- `mediaStop`
- `medicalCross`
- `meh`
- `memory`
- `menu`
- `mic`
- `microphone`
- `minus`
- `mobile`
- `mobileLandscape`
- `money`
- `monitor`
- `moodBad`
- `moodGood`
- `moodVeryBad`
- `moodVeryGood`
- `moon`
- `mouse`
- `mouthSlash`
- `move`
- `movie`
- `mug`
- `mugTea`
- `musicNote`
- `newspaper`
- `noteAdd`
- `notes`
- `objectGroup`
- `objectUngroup`
- `opacity`
- `opentype`
- `options`
- `optionsHorizontal`
- `paint`
- `paintBucket`
- `paperPlane`
- `paperclip`
- `paragraph`
- `paw`
- `pen`
- `penAlt`
- `penNib`
- `pencil`
- `people`
- `phone`
- `pin`
- `pizza`
- `plant`
- `playlistAdd`
- `plus`
- `pool`
- `powerStandby`
- `pregnant`
- `print`
- `pushchair`
- `puzzle`
- `qrCode`
- `rain`
- `rectangle`
- `recycle`
- `reload`
- `remove`
- `reportSlash`
- `resizeBoth`
- `resizeHeight`
- `resizeWidth`
- `restaurant`
- `room`
- `router`
- `rowing`
- `rss`
- `ruble`
- `running`
- `sad`
- `satelite`
- `save`
- `school`
- `screenDesktop`
- `screenSmartphone`
- `scrubber`
- `search`
- `send`
- `settings`
- `share`
- `shareAll`
- `shareAlt`
- `shareBoxed`
- `shieldAlt`
- `shortText`
- `shower`
- `signLanguage`
- `signalCellular0`
- `signalCellular3`
- `signalCellular4`
- `sim`
- `sitemap`
- `smile`
- `smilePlus`
- `smoke`
- `smokeFree`
- `smokeSlash`
- `smokingRoom`
- `snowflake`
- `soccer`
- `sofa`
- `sortAlphaDown`
- `sortAlphaUp`
- `sortAscending`
- `sortDescending`
- `sortNumericDown`
- `sortNumericUp`
- `spa`
- `spaceBar`
- `speak`
- `speaker`
- `speech`
- `speedometer`
- `spreadsheet`
- `square`
- `star`
- `starHalf`
- `storage`
- `stream`
- `strikethrough`
- `sun`
- `swapHorizontal`
- `swapVertical`
- `swimming`
- `sync`
- `tablet`
- `tag`
- `tags`
- `task`
- `taxi`
- `tennis`
- `tennisBall`
- `terminal`
- `terrain`
- `text`
- `textShapes`
- `textSize`
- `textSquare`
- `textStrike`
- `thumbDown`
- `thumbUp`
- `toggleOff`
- `toggleOn`
- `toilet`
- `touchApp`
- `transfer`
- `translate`
- `trash`
- `triangle`
- `truck`
- `tv`
- `underline`
- `usb`
- `user`
- `userFemale`
- `userFollow`
- `userPlus`
- `userUnfollow`
- `userX`
- `vector`
- `verticalAlignBottom`
- `verticalAlignBottom1`
- `verticalAlignCenter`
- `verticalAlignCenter1`
- `verticalAlignTop`
- `verticalAlignTop1`
- `video`
- `videogame`
- `viewColumn`
- `viewModule`
- `viewQuilt`
- `viewStream`
- `voice`
- `voiceOverRecord`
- `volumeHigh`
- `volumeLow`
- `volumeOff`
- `walk`
- `wallet`
- `wallpaper`
- `warning`
- `watch`
- `wc`
- `weightlifitng`
- `wheelchair`
- `wifiSignal0`
- `wifiSignal1`
- `wifiSignal2`
- `wifiSignal3`
- `wifiSignal4`
- `wifiSignalOff`
- `window`
- `windowMaximize`
- `windowMinimize`
- `windowRestore`
- `wrapText`
- `x`
- `xCircle`
- `yen`
- `zoom`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><4kIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccountLogoutIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ActionRedoIcon size="20" class="nav-icon" /> Settings</a>
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
<3dIcon
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
    <3dIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <4kIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccountLogoutIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dIcon size="24" />
   <4kIcon size="24" color="#4a90e2" />
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
   <3dIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3d } from '@stacksjs/iconify-cil'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3d, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3d } from '@stacksjs/iconify-cil'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cil/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cil/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
