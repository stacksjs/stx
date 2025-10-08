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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dIcon, 4kIcon, AccountLogoutIcon } from '@stacksjs/iconify-cil'

// Basic usage
const icon = 3dIcon()

// With size
const sizedIcon = 3dIcon({ size: 24 })

// With color
const coloredIcon = 4kIcon({ color: 'red' })

// With multiple props
const customIcon = AccountLogoutIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dIcon, 4kIcon, AccountLogoutIcon } from '@stacksjs/iconify-cil'

  global.icons = {
    home: 3dIcon({ size: 24 }),
    user: 4kIcon({ size: 24, color: '#4a90e2' }),
    settings: AccountLogoutIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = 3dIcon({ color: 'red' })
const blueIcon = 3dIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3dIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3dIcon({ class: 'text-primary' })
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
const icon24 = 3dIcon({ size: 24 })
const icon1em = 3dIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 3dIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3dIcon({ height: '1em' })
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
const smallIcon = 3dIcon({ class: 'icon-small' })
const largeIcon = 3dIcon({ class: 'icon-large' })
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
@js
  import { 3dIcon, 4kIcon, AccountLogoutIcon, ActionRedoIcon } from '@stacksjs/iconify-cil'

  global.navIcons = {
    home: 3dIcon({ size: 20, class: 'nav-icon' }),
    about: 4kIcon({ size: 20, class: 'nav-icon' }),
    contact: AccountLogoutIcon({ size: 20, class: 'nav-icon' }),
    settings: ActionRedoIcon({ size: 20, class: 'nav-icon' })
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
import { 3dIcon } from '@stacksjs/iconify-cil'

const icon = 3dIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dIcon, 4kIcon, AccountLogoutIcon } from '@stacksjs/iconify-cil'

const successIcon = 3dIcon({ size: 16, color: '#22c55e' })
const warningIcon = 4kIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccountLogoutIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dIcon, 4kIcon } from '@stacksjs/iconify-cil'
   const icon = 3dIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3d, 4k } from '@stacksjs/iconify-cil'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3d, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dIcon, 4kIcon } from '@stacksjs/iconify-cil'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-cil'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dIcon } from '@stacksjs/iconify-cil'
     global.icon = 3dIcon({ size: 24 })
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
   const icon = 3dIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
