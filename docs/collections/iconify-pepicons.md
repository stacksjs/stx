# Pepicons

> Pepicons icons for stx from Iconify

## Overview

This package provides access to 428 icons from the Pepicons collection through the stx iconify integration.

**Collection ID:** `pepicons`
**Total Icons:** 428
**Author:** CyCraft ([Website](https://github.com/CyCraft/pepicons))
**License:** CC BY 4.0 ([Details](https://github.com/CyCraft/pepicons/blob/dev/LICENSE))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pepicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AirplaneIcon, AirplanePrintIcon, AlarmIcon } from '@stacksjs/iconify-pepicons'

// Basic usage
const icon = AirplaneIcon()

// With size
const sizedIcon = AirplaneIcon({ size: 24 })

// With color
const coloredIcon = AirplanePrintIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AirplaneIcon, AirplanePrintIcon, AlarmIcon } from '@stacksjs/iconify-pepicons'

  global.icons = {
    home: AirplaneIcon({ size: 24 }),
    user: AirplanePrintIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmIcon({ size: 32 })
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
import { airplane, airplanePrint, alarm } from '@stacksjs/iconify-pepicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(airplane, { size: 24 })
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
const redIcon = AirplaneIcon({ color: 'red' })
const blueIcon = AirplaneIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AirplaneIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AirplaneIcon({ class: 'text-primary' })
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
const icon24 = AirplaneIcon({ size: 24 })
const icon1em = AirplaneIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AirplaneIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AirplaneIcon({ height: '1em' })
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
const smallIcon = AirplaneIcon({ class: 'icon-small' })
const largeIcon = AirplaneIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **428** icons:

- `airplane`
- `airplanePrint`
- `alarm`
- `alarmPrint`
- `angleDown`
- `angleDownPrint`
- `angleLeft`
- `angleLeftPrint`
- `angleRight`
- `angleRightPrint`
- `angleUp`
- `angleUpPrint`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownLeftPrint`
- `arrowDownPrint`
- `arrowDownRight`
- `arrowDownRightPrint`
- `arrowLeft`
- `arrowLeftPrint`
- `arrowRight`
- `arrowRightPrint`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpLeftPrint`
- `arrowUpPrint`
- `arrowUpRight`
- `arrowUpRightPrint`
- `bank`
- `bankPrint`
- `battery`
- `batteryPrint`
- `bell`
- `bellOff`
- `bellOffPrint`
- `bellPrint`
- `bicycle`
- `bicyclePrint`
- `bluetooth`
- `bluetoothPrint`
- `book`
- `bookPrint`
- `bookmark`
- `bookmarkFilled`
- `bookmarkPrint`
- `briefcase`
- `briefcasePrint`
- `building`
- `buildingPrint`
- `calculator`
- `calculatorPrint`
- `calendar`
- `calendarPrint`
- `camera`
- `cameraPrint`
- `can`
- `canPrint`
- `car`
- `carPrint`
- `cart`
- `cartPrint`
- `cellphoneEye`
- `cellphoneEyePrint`
- `cellphoneLoop`
- `cellphoneLoopPrint`
- `chain`
- `chainPrint`
- `checkmark`
- `checkmarkPrint`
- `circle`
- `circleFilled`
- `circlePrint`
- `clapperboard`
- `clapperboardPrint`
- `clipboard`
- `clipboardCheck`
- `clipboardCheckCircle`
- `clipboardCheckCirclePrint`
- `clipboardCheckPrint`
- `clipboardPrint`
- `clock`
- `clockPrint`
- `cloud`
- `cloudDown`
- `cloudDownFilled`
- `cloudDownPrint`
- `cloudFilled`
- `cloudPrint`
- `cloudUp`
- `cloudUpFilled`
- `cloudUpPrint`
- `coctail`
- `coctailPrint`
- `code`
- `codePrint`
- `colorPicker`
- `colorPickerPrint`
- `contract`
- `contractPrint`
- `controller`
- `controllerPrint`
- `countdown`
- `countdownPrint`
- `creditCard`
- `creditCardPrint`
- `crown`
- `crownPrint`
- `cup`
- `cupPrint`
- `cv`
- `cvPrint`
- `division`
- `divisionPrint`
- `dotsX`
- `dotsXPrint`
- `dotsY`
- `dotsYPrint`
- `dress`
- `dressPrint`
- `duplicate`
- `duplicatePrint`
- `electricity`
- `electricityPrint`
- `enter`
- `enterPrint`
- `exclamation`
- `exclamationCircle`
- `exclamationCirclePrint`
- `exclamationFilled`
- `exclamationPrint`
- `expand`
- `expandPrint`
- `eye`
- `eyeClosed`
- `eyeClosedPrint`
- `eyeFrame`
- `eyeFramePrint`
- `eyeOff`
- `eyeOffPrint`
- `eyePrint`
- `fastForward`
- `fastForwardPrint`
- `file`
- `fileLoop`
- `fileLoopPrint`
- `filePrint`
- `filmFrame`
- `filmFramePrint`
- `fire`
- `firePrint`
- `flag`
- `flagPrint`
- `flagStraight`
- `flagStraightPrint`
- `flower`
- `flowerBud`
- `flowerBudPrint`
- `flowerPrint`
- `folder`
- `folderPrint`
- `foldingStool`
- `foldingStoolPrint`
- `gear`
- `gearFilled`
- `gearPrint`
- `gift`
- `giftPrint`
- `grab`
- `grabPrint`
- `grid`
- `gridPrint`
- `hamburger`
- `hamburgerPrint`
- `handGrab`
- `handGrabPrint`
- `handOpen`
- `handOpenPrint`
- `handPoint`
- `handPointOpen`
- `handPointOpenPrint`
- `handPointPrint`
- `handshake`
- `handshakePrint`
- `hash`
- `hashPrint`
- `headphone`
- `headphonePrint`
- `heart`
- `heartPrint`
- `hourglass`
- `hourglassPrint`
- `house`
- `housePrint`
- `identification`
- `identificationPrint`
- `info`
- `infoCircle`
- `infoCirclePrint`
- `infoFilled`
- `infoPrint`
- `internet`
- `internetPrint`
- `key`
- `keyPrint`
- `kniveFork`
- `kniveForkPrint`
- `label`
- `labelPrint`
- `leave`
- `leavePrint`
- `letter`
- `letterOpen`
- `letterOpenPrint`
- `letterPrint`
- `list`
- `listPrint`
- `lockClosed`
- `lockClosedPrint`
- `lockOpen`
- `lockOpenPrint`
- `loop`
- `loopMinus`
- `loopMinusPrint`
- `loopPlus`
- `loopPlusPrint`
- `loopPrint`
- `magnet`
- `magnetPrint`
- `map`
- `mapPrint`
- `megaphone`
- `megaphonePrint`
- `menu`
- `menuPrint`
- `microphone`
- `microphonePrint`
- `microphone2`
- `microphone2Print`
- `minus`
- `minusPrint`
- `monitor`
- `monitorEye`
- `monitorEyePrint`
- `monitorLoop`
- `monitorLoopPrint`
- `monitorPrint`
- `monitor2`
- `monitor2Print`
- `moon`
- `moonFilled`
- `moonPrint`
- `motorcycle`
- `motorcyclePrint`
- `moveX`
- `moveXPrint`
- `moveY`
- `moveYPrint`
- `musicNoteDouble`
- `musicNoteDoublePrint`
- `musicNoteSingle`
- `musicNoteSinglePrint`
- `nextTrack`
- `nextTrackPrint`
- `noEntry`
- `noEntryPrint`
- `open`
- `openPrint`
- `paintPallet`
- `paintPalletPrint`
- `pause`
- `pausePrint`
- `pen`
- `penPrint`
- `people`
- `peoplePrint`
- `person`
- `personCheckmark`
- `personCheckmarkPrint`
- `personFilled`
- `personPlus`
- `personPlusPrint`
- `personPrint`
- `persons`
- `personsPrint`
- `phone`
- `phonePrint`
- `photo`
- `photoCamera`
- `photoCameraPrint`
- `photoPrint`
- `photoStudio`
- `photoStudioPrint`
- `pill`
- `pillPrint`
- `pin`
- `pinPrint`
- `pinpoint`
- `pinpointFilled`
- `pinpointOff`
- `pinpointOffFilled`
- `pinpointOffPrint`
- `pinpointPrint`
- `play`
- `playPrint`
- `plus`
- `plusPrint`
- `power`
- `powerPrint`
- `previousTrack`
- `previousTrackPrint`
- `printer`
- `printerPrint`
- `qrCode`
- `qrCodePrint`
- `question`
- `questionCircle`
- `questionCirclePrint`
- `questionFilled`
- `questionPrint`
- `radio`
- `radioPrint`
- `refresh`
- `refreshPrint`
- `reload`
- `reloadPrint`
- `repeat`
- `repeatPrint`
- `rewind`
- `rewindPrint`
- `rewindTime`
- `rewindTimePrint`
- `scissors`
- `scissorsPrint`
- `send`
- `sendPrint`
- `shareAndroid`
- `shareAndroidPrint`
- `shareIos`
- `shareIosPrint`
- `shuffle`
- `shufflePrint`
- `sliders`
- `slidersPrint`
- `smartphone`
- `smartphoneCutout`
- `smartphoneCutoutPrint`
- `smartphoneNotch`
- `smartphoneNotchPrint`
- `smartphonePrint`
- `smartphone2`
- `smartphone2Print`
- `softDrink`
- `softDrinkPrint`
- `sort`
- `sortPrint`
- `speakerHigh`
- `speakerHighPrint`
- `speakerLow`
- `speakerLowPrint`
- `speakerOff`
- `speakerOffPrint`
- `square`
- `squareFilled`
- `squarePrint`
- `star`
- `starFilled`
- `starPrint`
- `stars`
- `starsPrint`
- `stopwatch`
- `stopwatchPrint`
- `studioBackdrop`
- `studioBackdropPrint`
- `studioLightFront`
- `studioLightFrontPrint`
- `studioLightSide`
- `studioLightSidePrint`
- `sun`
- `sunFilled`
- `sunPrint`
- `syringe`
- `syringePrint`
- `tShirt`
- `tShirtPrint`
- `taxi`
- `taxiPrint`
- `television`
- `televisionPrint`
- `textBubble`
- `textBubblePrint`
- `textBubbles`
- `textBubblesPrint`
- `thumbsDown`
- `thumbsDownPrint`
- `thumbsUp`
- `thumbsUpPrint`
- `times`
- `timesPrint`
- `tool`
- `toolPrint`
- `train`
- `trainPrint`
- `trash`
- `trashPrint`
- `triangleDown`
- `triangleDownFilled`
- `triangleDownPrint`
- `triangleLeft`
- `triangleLeftFilled`
- `triangleLeftPrint`
- `triangleRight`
- `triangleRightFilled`
- `triangleRightPrint`
- `triangleUp`
- `triangleUpFilled`
- `triangleUpPrint`
- `trophy`
- `trophyPrint`
- `truck`
- `truckPrint`
- `umbrella`
- `umbrellaPrint`
- `watch`
- `watchPrint`
- `waterDrop`
- `waterDropPrint`
- `wifi`
- `wifiPrint`

## Usage Examples

### Navigation Menu

```html
@js
  import { AirplaneIcon, AirplanePrintIcon, AlarmIcon, AlarmPrintIcon } from '@stacksjs/iconify-pepicons'

  global.navIcons = {
    home: AirplaneIcon({ size: 20, class: 'nav-icon' }),
    about: AirplanePrintIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmIcon({ size: 20, class: 'nav-icon' }),
    settings: AlarmPrintIcon({ size: 20, class: 'nav-icon' })
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
import { AirplaneIcon } from '@stacksjs/iconify-pepicons'

const icon = AirplaneIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AirplaneIcon, AirplanePrintIcon, AlarmIcon } from '@stacksjs/iconify-pepicons'

const successIcon = AirplaneIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplanePrintIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AirplaneIcon, AirplanePrintIcon } from '@stacksjs/iconify-pepicons'
   const icon = AirplaneIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { airplane, airplanePrint } from '@stacksjs/iconify-pepicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(airplane, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AirplaneIcon, AirplanePrintIcon } from '@stacksjs/iconify-pepicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-pepicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AirplaneIcon } from '@stacksjs/iconify-pepicons'
     global.icon = AirplaneIcon({ size: 24 })
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
   const icon = AirplaneIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { airplane } from '@stacksjs/iconify-pepicons'

// Icons are typed as IconData
const myIcon: IconData = airplane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://github.com/CyCraft/pepicons/blob/dev/LICENSE) for more information.

## Credits

- **Icons**: CyCraft ([Website](https://github.com/CyCraft/pepicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pepicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pepicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
