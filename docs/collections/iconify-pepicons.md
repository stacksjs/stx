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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AirplaneIcon height="1em" />
<AirplaneIcon width="1em" height="1em" />
<AirplaneIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AirplaneIcon size="24" />
<AirplaneIcon size="1em" />

<!-- Using width and height -->
<AirplaneIcon width="24" height="32" />

<!-- With color -->
<AirplaneIcon size="24" color="red" />
<AirplaneIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AirplaneIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AirplaneIcon
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
    <AirplaneIcon size="24" />
    <AirplanePrintIcon size="24" color="#4a90e2" />
    <AlarmIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AirplaneIcon size="24" color="red" />
<AirplaneIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AirplaneIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AirplaneIcon size="24" class="text-primary" />
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
<AirplaneIcon height="1em" />
<AirplaneIcon width="1em" height="1em" />
<AirplaneIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AirplaneIcon size="24" />
<AirplaneIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.pepicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirplaneIcon class="pepicons-icon" />
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
<nav>
  <a href="/"><AirplaneIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplanePrintIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlarmPrintIcon size="20" class="nav-icon" /> Settings</a>
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
<AirplaneIcon
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
    <AirplaneIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AirplanePrintIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirplaneIcon size="24" />
   <AirplanePrintIcon size="24" color="#4a90e2" />
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
   <AirplaneIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AirplaneIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AirplaneIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-pepicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(airplane, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
