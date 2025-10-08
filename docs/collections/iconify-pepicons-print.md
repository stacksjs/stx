# Pepicons Print

> Pepicons Print icons for stx from Iconify

## Overview

This package provides access to 1286 icons from the Pepicons Print collection through the stx iconify integration.

**Collection ID:** `pepicons-print`
**Total Icons:** 1286
**Author:** CyCraft ([Website](https://github.com/CyCraft/pepicons))
**License:** CC BY 4.0 ([Details](https://github.com/CyCraft/pepicons/blob/dev/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-pepicons-print
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AirplaneIcon, AirplaneCircleIcon, AirplaneCircleFilledIcon } from '@stacksjs/iconify-pepicons-print'

// Basic usage
const icon = AirplaneIcon()

// With size
const sizedIcon = AirplaneIcon({ size: 24 })

// With color
const coloredIcon = AirplaneCircleIcon({ color: 'red' })

// With multiple props
const customIcon = AirplaneCircleFilledIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AirplaneIcon, AirplaneCircleIcon, AirplaneCircleFilledIcon } from '@stacksjs/iconify-pepicons-print'

  global.icons = {
    home: AirplaneIcon({ size: 24 }),
    user: AirplaneCircleIcon({ size: 24, color: '#4a90e2' }),
    settings: AirplaneCircleFilledIcon({ size: 32 })
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
import { airplane, airplaneCircle, airplaneCircleFilled } from '@stacksjs/iconify-pepicons-print'
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

This package contains **1286** icons:

- `airplane`
- `airplaneCircle`
- `airplaneCircleFilled`
- `airplaneCircleOff`
- `airplaneOff`
- `alarm`
- `alarmCircle`
- `alarmCircleFilled`
- `alarmCircleOff`
- `alarmOff`
- `angleDown`
- `angleDownCircle`
- `angleDownCircleFilled`
- `angleDownCircleOff`
- `angleDownOff`
- `angleLeft`
- `angleLeftCircle`
- `angleLeftCircleFilled`
- `angleLeftCircleOff`
- `angleLeftOff`
- `angleRight`
- `angleRightCircle`
- `angleRightCircleFilled`
- `angleRightCircleOff`
- `angleRightOff`
- `angleUp`
- `angleUpCircle`
- `angleUpCircleFilled`
- `angleUpCircleOff`
- `angleUpOff`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleFilled`
- `arrowDownCircleOff`
- `arrowDownLeft`
- `arrowDownLeftCircle`
- `arrowDownLeftCircleFilled`
- `arrowDownLeftCircleOff`
- `arrowDownLeftOff`
- `arrowDownOff`
- `arrowDownRight`
- `arrowDownRightCircle`
- `arrowDownRightCircleFilled`
- `arrowDownRightCircleOff`
- `arrowDownRightOff`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleFilled`
- `arrowLeftCircleOff`
- `arrowLeftOff`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleFilled`
- `arrowRightCircleOff`
- `arrowRightOff`
- `arrowSpin`
- `arrowSpinCircle`
- `arrowSpinCircleFilled`
- `arrowSpinCircleOff`
- `arrowSpinOff`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleFilled`
- `arrowUpCircleOff`
- `arrowUpLeft`
- `arrowUpLeftCircle`
- `arrowUpLeftCircleFilled`
- `arrowUpLeftCircleOff`
- `arrowUpLeftOff`
- `arrowUpOff`
- `arrowUpRight`
- `arrowUpRightCircle`
- `arrowUpRightCircleFilled`
- `arrowUpRightCircleOff`
- `arrowUpRightOff`
- `arrowsSpin`
- `arrowsSpinCircle`
- `arrowsSpinCircleFilled`
- `arrowsSpinCircleOff`
- `arrowsSpinOff`
- `bank`
- `bankCircle`
- `bankCircleFilled`
- `bankCircleOff`
- `bankOff`
- `battery`
- `batteryCircle`
- `batteryCircleFilled`
- `batteryCircleOff`
- `batteryOff`
- `bell`
- `bellCircle`
- `bellCircleFilled`
- `bellCircleOff`
- `bellOff`
- `bicycle`
- `bicycleCircle`
- `bicycleCircleFilled`
- `bicycleCircleOff`
- `bicycleOff`
- `bluetooth`
- `bluetoothCircle`
- `bluetoothCircleFilled`
- `bluetoothCircleOff`
- `bluetoothOff`
- `book`
- `bookCircle`
- `bookCircleFilled`
- `bookCircleOff`
- `bookOff`
- `bookmark`
- `bookmarkCircle`
- `bookmarkCircleFilled`
- `bookmarkCircleOff`
- `bookmarkFilled`
- `bookmarkFilledCircle`
- `bookmarkFilledCircleFilled`
- `bookmarkFilledCircleOff`
- `bookmarkFilledOff`
- `bookmarkOff`
- `briefcase`
- `briefcaseCircle`
- `briefcaseCircleFilled`
- `briefcaseCircleOff`
- `briefcaseOff`
- `building`
- `buildingCircle`
- `buildingCircleFilled`
- `buildingCircleOff`
- `buildingOff`
- `bulletinNotice`
- `bulletinNoticeCircle`
- `bulletinNoticeCircleFilled`
- `bulletinNoticeCircleOff`
- `bulletinNoticeOff`
- `calculator`
- `calculatorCircle`
- `calculatorCircleFilled`
- `calculatorCircleOff`
- `calculatorOff`
- `calendar`
- `calendarCircle`
- `calendarCircleFilled`
- `calendarCircleOff`
- `calendarOff`
- `camera`
- `cameraCircle`
- `cameraCircleFilled`
- `cameraCircleOff`
- `cameraOff`
- `can`
- `canCircle`
- `canCircleFilled`
- `canCircleOff`
- `canOff`
- `car`
- `carCircle`
- `carCircleFilled`
- `carCircleOff`
- `carOff`
- `cart`
- `cartCircle`
- `cartCircleFilled`
- `cartCircleOff`
- `cartOff`
- `cellphoneEye`
- `cellphoneEyeCircle`
- `cellphoneEyeCircleFilled`
- `cellphoneEyeCircleOff`
- `cellphoneEyeOff`
- `cellphoneLoop`
- `cellphoneLoopCircle`
- `cellphoneLoopCircleFilled`
- `cellphoneLoopCircleOff`
- `cellphoneLoopOff`
- `chain`
- `chainCircle`
- `chainCircleFilled`
- `chainCircleOff`
- `chainOff`
- `checkmark`
- `checkmarkCircle`
- `checkmarkCircleFilled`
- `checkmarkCircleOff`
- `checkmarkFilled`
- `checkmarkFilledCircle`
- `checkmarkFilledCircleFilled`
- `checkmarkFilledCircleOff`
- `checkmarkFilledOff`
- `checkmarkOff`
- `checkmarkOutlined`
- `checkmarkOutlinedCircle`
- `checkmarkOutlinedCircleFilled`
- `checkmarkOutlinedCircleOff`
- `checkmarkOutlinedOff`
- `circle`
- `circleBig`
- `circleBigCircle`
- `circleBigCircleFilled`
- `circleBigCircleOff`
- `circleBigFilled`
- `circleBigFilledCircle`
- `circleBigFilledCircleFilled`
- `circleBigFilledCircleOff`
- `circleBigFilledOff`
- `circleBigOff`
- `circleCircle`
- `circleCircleFilled`
- `circleCircleOff`
- `circleFilled`
- `circleFilledCircle`
- `circleFilledCircleFilled`
- `circleFilledCircleOff`
- `circleFilledOff`
- `circleOff`
- `clapperboard`
- `clapperboardCircle`
- `clapperboardCircleFilled`
- `clapperboardCircleOff`
- `clapperboardOff`
- `clipboard`
- `clipboardCheck`
- `clipboardCheckCircle`
- `clipboardCheckCircleFilled`
- `clipboardCheckCircleOff`
- `clipboardCheckCircled`
- `clipboardCheckCircledCircle`
- `clipboardCheckCircledCircleFilled`
- `clipboardCheckCircledCircleOff`
- `clipboardCheckCircledOff`
- `clipboardCheckOff`
- `clipboardCircle`
- `clipboardCircleFilled`
- `clipboardCircleOff`
- `clipboardOff`
- `clock`
- `clockCircle`
- `clockCircleFilled`
- `clockCircleOff`
- `clockOff`
- `cloud`
- `cloudCircle`
- `cloudCircleFilled`
- `cloudCircleOff`
- `cloudDown`
- `cloudDownCircle`
- `cloudDownCircleFilled`
- `cloudDownCircleOff`
- `cloudDownOff`
- `cloudOff`
- `cloudUp`
- `cloudUpCircle`
- `cloudUpCircleFilled`
- `cloudUpCircleOff`
- `cloudUpOff`
- `coctail`
- `coctailCircle`
- `coctailCircleFilled`
- `coctailCircleOff`
- `coctailOff`
- `code`
- `codeCircle`
- `codeCircleFilled`
- `codeCircleOff`
- `codeOff`
- `coins`
- `coinsCircle`
- `coinsCircleFilled`
- `coinsCircleOff`
- `coinsOff`
- `colorPicker`
- `colorPickerCircle`
- `colorPickerCircleFilled`
- `colorPickerCircleOff`
- `colorPickerOff`
- `comet`
- `cometCircle`
- `cometCircleFilled`
- `cometCircleOff`
- `cometOff`
- `contract`
- `contractCircle`
- `contractCircleFilled`
- `contractCircleOff`
- `contractOff`
- `controller`
- `controllerCircle`
- `controllerCircleFilled`
- `controllerCircleOff`
- `controllerOff`
- `countdown`
- `countdownCircle`
- `countdownCircleFilled`
- `countdownCircleOff`
- `countdownOff`
- `creditCard`
- `creditCardCircle`
- `creditCardCircleFilled`
- `creditCardCircleOff`
- `creditCardOff`
- `crown`
- `crownCircle`
- `crownCircleFilled`
- `crownCircleOff`
- `crownOff`
- `cup`
- `cupCircle`
- `cupCircleFilled`
- `cupCircleOff`
- `cupOff`
- `cv`
- `cvCircle`
- `cvCircleFilled`
- `cvCircleOff`
- `cvOff`
- `database`
- `databaseCircle`
- `databaseCircleFilled`
- `databaseCircleOff`
- `databaseOff`
- `division`
- `divisionCircle`
- `divisionCircleFilled`
- `divisionCircleOff`
- `divisionOff`
- `dollar`
- `dollarCircle`
- `dollarCircleFilled`
- `dollarCircleOff`
- `dollarOff`
- `dotsX`
- `dotsXCircle`
- `dotsXCircleFilled`
- `dotsXCircleOff`
- `dotsXOff`
- `dotsY`
- `dotsYCircle`
- `dotsYCircleFilled`
- `dotsYCircleOff`
- `dotsYOff`
- `downLeft`
- `downLeftCircle`
- `downLeftCircleFilled`
- `downLeftCircleOff`
- `downLeftOff`
- `downUp`
- `downUpCircle`
- `downUpCircleFilled`
- `downUpCircleOff`
- `downUpOff`
- `dress`
- `dressCircle`
- `dressCircleFilled`
- `dressCircleOff`
- `dressOff`
- `duplicate`
- `duplicateCircle`
- `duplicateCircleFilled`
- `duplicateCircleOff`
- `duplicateOff`
- `earthAmericas`
- `earthAmericasCircle`
- `earthAmericasCircleFilled`
- `earthAmericasCircleOff`
- `earthAmericasOff`
- `earthAsia`
- `earthAsiaCircle`
- `earthAsiaCircleFilled`
- `earthAsiaCircleOff`
- `earthAsiaOff`
- `earthEurope`
- `earthEuropeCircle`
- `earthEuropeCircleFilled`
- `earthEuropeCircleOff`
- `earthEuropeOff`
- `electricity`
- `electricityCircle`
- `electricityCircleFilled`
- `electricityCircleOff`
- `electricityOff`
- `enter`
- `enterCircle`
- `enterCircleFilled`
- `enterCircleOff`
- `enterOff`
- `equal`
- `equalCircle`
- `equalCircleFilled`
- `equalCircleOff`
- `equalOff`
- `euro`
- `euroCircle`
- `euroCircleFilled`
- `euroCircleOff`
- `euroOff`
- `exclamation`
- `exclamationCircle`
- `exclamationCircleFilled`
- `exclamationCircleOff`
- `exclamationOff`
- `expand`
- `expandCircle`
- `expandCircleFilled`
- `expandCircleOff`
- `expandOff`
- `eye`
- `eyeCircle`
- `eyeCircleFilled`
- `eyeCircleOff`
- `eyeClosed`
- `eyeClosedCircle`
- `eyeClosedCircleFilled`
- `eyeClosedCircleOff`
- `eyeClosedOff`
- `eyeFrame`
- `eyeFrameCircle`
- `eyeFrameCircleFilled`
- `eyeFrameCircleOff`
- `eyeFrameOff`
- `eyeOff`
- `faceFrowning`
- `faceFrowningCircle`
- `faceFrowningCircleFilled`
- `faceFrowningCircleOff`
- `faceFrowningOff`
- `faceGrinning`
- `faceGrinningCircle`
- `faceGrinningCircleFilled`
- `faceGrinningCircleOff`
- `faceGrinningOff`
- `faceSmiling`
- `faceSmilingCircle`
- `faceSmilingCircleFilled`
- `faceSmilingCircleOff`
- `faceSmilingOff`
- `fastForward`
- `fastForwardCircle`
- `fastForwardCircleFilled`
- `fastForwardCircleOff`
- `fastForwardOff`
- `file`
- `fileCircle`
- `fileCircleFilled`
- `fileCircleOff`
- `fileLoop`
- `fileLoopCircle`
- `fileLoopCircleFilled`
- `fileLoopCircleOff`
- `fileLoopOff`
- `fileOff`
- `filmFrame`
- `filmFrameCircle`
- `filmFrameCircleFilled`
- `filmFrameCircleOff`
- `filmFrameOff`
- `fire`
- `fireCircle`
- `fireCircleFilled`
- `fireCircleOff`
- `fireOff`
- `flag`
- `flagCircle`
- `flagCircleFilled`
- `flagCircleOff`
- `flagOff`
- `flagStraight`
- `flagStraightCircle`
- `flagStraightCircleFilled`
- `flagStraightCircleOff`
- `flagStraightOff`
- `floppyDisk`
- `floppyDiskCircle`
- `floppyDiskCircleFilled`
- `floppyDiskCircleOff`
- `floppyDiskOff`
- `flower`
- `flowerBud`
- `flowerBudCircle`
- `flowerBudCircleFilled`
- `flowerBudCircleOff`
- `flowerBudOff`
- `flowerCircle`
- `flowerCircleFilled`
- `flowerCircleOff`
- `flowerOff`
- `folder`
- `folderCircle`
- `folderCircleFilled`
- `folderCircleOff`
- `folderOff`
- `foldingStool`
- `foldingStoolCircle`
- `foldingStoolCircleFilled`
- `foldingStoolCircleOff`
- `foldingStoolOff`
- `gear`
- `gearCircle`
- `gearCircleFilled`
- `gearCircleOff`
- `gearOff`
- `gift`
- `giftCircle`
- `giftCircleFilled`
- `giftCircleOff`
- `giftOff`
- `grab`
- `grabHandle`
- `grabHandleCircle`
- `grabHandleCircleFilled`
- `grabHandleCircleOff`
- `grabHandleOff`
- `grid`
- `gridCircle`
- `gridCircleFilled`
- `gridCircleOff`
- `gridOff`
- `hamburger`
- `hamburgerCircle`
- `hamburgerCircleFilled`
- `hamburgerCircleOff`
- `hamburgerOff`
- `hammerClaw`
- `hammerClawCircle`
- `hammerClawCircleFilled`
- `hammerClawCircleOff`
- `hammerClawOff`
- `hammerSledge`
- `hammerSledgeCircle`
- `hammerSledgeCircleFilled`
- `hammerSledgeCircleOff`
- `hammerSledgeOff`
- `handGrab`
- `handGrabCircle`
- `handGrabCircleFilled`
- `handGrabCircleOff`
- `handGrabOff`
- `handOpen`
- `handOpenCircle`
- `handOpenCircleFilled`
- `handOpenCircleOff`
- `handOpenOff`
- `handPoint`
- `handPointCircle`
- `handPointCircleFilled`
- `handPointCircleOff`
- `handPointOff`
- `handPointOpen`
- `handPointOpenCircle`
- `handPointOpenCircleFilled`
- `handPointOpenCircleOff`
- `handPointOpenOff`
- `handsClapping`
- `handsClappingCheckmark`
- `handsClappingCheckmarkCircle`
- `handsClappingCheckmarkCircleFilled`
- `handsClappingCheckmarkCircleOff`
- `handsClappingCheckmarkOff`
- `handsClappingCircle`
- `handsClappingCircleFilled`
- `handsClappingCircleOff`
- `handsClappingOff`
- `handshake`
- `handshakeCircle`
- `handshakeCircleFilled`
- `handshakeCircleOff`
- `handshakeOff`
- `hash`
- `hashCircle`
- `hashCircleFilled`
- `hashCircleOff`
- `hashOff`
- `headphone`
- `headphoneCircle`
- `headphoneCircleFilled`
- `headphoneCircleOff`
- `headphoneOff`
- `heart`
- `heartCircle`
- `heartCircleFilled`
- `heartCircleOff`
- `heartFilled`
- `heartFilledCircle`
- `heartFilledCircleFilled`
- `heartFilledCircleOff`
- `heartFilledOff`
- `heartOff`
- `hospital`
- `hospitalCircle`
- `hospitalCircleFilled`
- `hospitalCircleOff`
- `hospitalOff`
- `hourglass`
- `hourglassCircle`
- `hourglassCircleFilled`
- `hourglassCircleOff`
- `hourglassOff`
- `house`
- `houseCircle`
- `houseCircleFilled`
- `houseCircleOff`
- `houseOff`
- `identification`
- `identificationCircle`
- `identificationCircleFilled`
- `identificationCircleOff`
- `identificationOff`
- `info`
- `infoCircle`
- `infoCircleFilled`
- `infoCircleOff`
- `infoOff`
- `internet`
- `internetCircle`
- `internetCircleFilled`
- `internetCircleOff`
- `internetOff`
- `key`
- `keyCircle`
- `keyCircleFilled`
- `keyCircleOff`
- `keyOff`
- `keyboard`
- `keyboardCircle`
- `keyboardCircleFilled`
- `keyboardCircleOff`
- `keyboardOff`
- `kniveFork`
- `kniveForkCircle`
- `kniveForkCircleFilled`
- `kniveForkCircleOff`
- `kniveForkOff`
- `label`
- `labelCircle`
- `labelCircleFilled`
- `labelCircleOff`
- `labelOff`
- `leaf`
- `leafCircle`
- `leafCircleFilled`
- `leafCircleOff`
- `leafOff`
- `leave`
- `leaveCircle`
- `leaveCircleFilled`
- `leaveCircleOff`
- `leaveOff`
- `letter`
- `letterCircle`
- `letterCircleFilled`
- `letterCircleOff`
- `letterOff`
- `letterOpen`
- `letterOpenCircle`
- `letterOpenCircleFilled`
- `letterOpenCircleOff`
- `letterOpenOff`
- `lineSlantDown`
- `lineSlantDownCircle`
- `lineSlantDownCircleFilled`
- `lineSlantDownCircleOff`
- `lineSlantDownOff`
- `lineSlantUp`
- `lineSlantUpCircle`
- `lineSlantUpCircleFilled`
- `lineSlantUpCircleOff`
- `lineSlantUpOff`
- `lineX`
- `lineXCircle`
- `lineXCircleFilled`
- `lineXCircleOff`
- `lineXOff`
- `lineY`
- `lineYCircle`
- `lineYCircleFilled`
- `lineYCircleOff`
- `lineYOff`
- `list`
- `listCircle`
- `listCircleFilled`
- `listCircleOff`
- `listOff`
- `lockClosed`
- `lockClosedCircle`
- `lockClosedCircleFilled`
- `lockClosedCircleOff`
- `lockClosedOff`
- `lockOpen`
- `lockOpenCircle`
- `lockOpenCircleFilled`
- `lockOpenCircleOff`
- `lockOpenOff`
- `loop`
- `loopCircle`
- `loopCircleFilled`
- `loopCircleOff`
- `loopMinus`
- `loopMinusCircle`
- `loopMinusCircleFilled`
- `loopMinusCircleOff`
- `loopMinusOff`
- `loopOff`
- `loopPlus`
- `loopPlusCircle`
- `loopPlusCircleFilled`
- `loopPlusCircleOff`
- `loopPlusOff`
- `magnet`
- `magnetCircle`
- `magnetCircleFilled`
- `magnetCircleOff`
- `magnetOff`
- `map`
- `mapCircle`
- `mapCircleFilled`
- `mapCircleOff`
- `mapOff`
- `megaphone`
- `megaphoneCircle`
- `megaphoneCircleFilled`
- `megaphoneCircleOff`
- `megaphoneOff`
- `menu`
- `menuCircle`
- `menuCircleFilled`
- `menuCircleOff`
- `menuOff`
- `microphone`
- `microphoneCircle`
- `microphoneCircleFilled`
- `microphoneCircleOff`
- `microphoneHandheld`
- `microphoneHandheldCircle`
- `microphoneHandheldCircleFilled`
- `microphoneHandheldCircleOff`
- `microphoneHandheldOff`
- `microphoneOff`
- `microphone2`
- `minus`
- `minusCircle`
- `minusCircleFilled`
- `minusCircleOff`
- `minusOff`
- `moneyNote`
- `moneyNoteCircle`
- `moneyNoteCircleFilled`
- `moneyNoteCircleOff`
- `moneyNoteOff`
- `monitor`
- `monitorCircle`
- `monitorCircleFilled`
- `monitorCircleOff`
- `monitorEye`
- `monitorEyeCircle`
- `monitorEyeCircleFilled`
- `monitorEyeCircleOff`
- `monitorEyeOff`
- `monitorLoop`
- `monitorLoopCircle`
- `monitorLoopCircleFilled`
- `monitorLoopCircleOff`
- `monitorLoopOff`
- `monitorOff`
- `monitor2`
- `moon`
- `moonCircle`
- `moonCircleFilled`
- `moonCircleOff`
- `moonOff`
- `motorcycle`
- `motorcycleCircle`
- `motorcycleCircleFilled`
- `motorcycleCircleOff`
- `motorcycleOff`
- `moveX`
- `moveXCircle`
- `moveXCircleFilled`
- `moveXCircleOff`
- `moveXOff`
- `moveY`
- `moveYCircle`
- `moveYCircleFilled`
- `moveYCircleOff`
- `moveYOff`
- `musicNoteDouble`
- `musicNoteDoubleCircle`
- `musicNoteDoubleCircleFilled`
- `musicNoteDoubleCircleOff`
- `musicNoteDoubleOff`
- `musicNoteSingle`
- `musicNoteSingleCircle`
- `musicNoteSingleCircleFilled`
- `musicNoteSingleCircleOff`
- `musicNoteSingleOff`
- `nextTrack`
- `nextTrackCircle`
- `nextTrackCircleFilled`
- `nextTrackCircleOff`
- `nextTrackOff`
- `noEntry`
- `noEntryCircle`
- `noEntryCircleFilled`
- `noEntryCircleOff`
- `noEntryOff`
- `nut`
- `nutCircle`
- `nutCircleFilled`
- `nutCircleOff`
- `nutOff`
- `open`
- `openCircle`
- `openCircleFilled`
- `openCircleOff`
- `openOff`
- `paintPallet`
- `paintPalletCircle`
- `paintPalletCircleFilled`
- `paintPalletCircleOff`
- `paintPalletOff`
- `paperPlane`
- `paperPlaneCircle`
- `paperPlaneCircleFilled`
- `paperPlaneCircleOff`
- `paperPlaneOff`
- `paperclip`
- `paperclipCircle`
- `paperclipCircleFilled`
- `paperclipCircleOff`
- `paperclipOff`
- `pause`
- `pauseCircle`
- `pauseCircleFilled`
- `pauseCircleOff`
- `pauseOff`
- `pen`
- `penCircle`
- `penCircleFilled`
- `penCircleOff`
- `penOff`
- `people`
- `peopleCircle`
- `peopleCircleFilled`
- `peopleCircleOff`
- `peopleOff`
- `person`
- `personCheckmark`
- `personCheckmarkCircle`
- `personCheckmarkCircleFilled`
- `personCheckmarkCircleOff`
- `personCheckmarkOff`
- `personCircle`
- `personCircleFilled`
- `personCircleOff`
- `personOff`
- `personPlus`
- `personPlusCircle`
- `personPlusCircleFilled`
- `personPlusCircleOff`
- `personPlusOff`
- `persons`
- `personsCircle`
- `personsCircleFilled`
- `personsCircleOff`
- `personsOff`
- `peso`
- `pesoCircle`
- `pesoCircleFilled`
- `pesoCircleOff`
- `pesoOff`
- `phone`
- `phoneCircle`
- `phoneCircleFilled`
- `phoneCircleOff`
- `phoneOff`
- `photo`
- `photoCamera`
- `photoCameraCircle`
- `photoCameraCircleFilled`
- `photoCameraCircleOff`
- `photoCameraOff`
- `photoCircle`
- `photoCircleFilled`
- `photoCircleOff`
- `photoOff`
- `photoStudio`
- `photoStudioCircle`
- `photoStudioCircleFilled`
- `photoStudioCircleOff`
- `photoStudioOff`
- `pill`
- `pillCircle`
- `pillCircleFilled`
- `pillCircleOff`
- `pillOff`
- `pin`
- `pinCircle`
- `pinCircleFilled`
- `pinCircleOff`
- `pinOff`
- `pinpoint`
- `pinpointCircle`
- `pinpointCircleFilled`
- `pinpointCircleOff`
- `pinpointOff`
- `planet`
- `planetCircle`
- `planetCircleFilled`
- `planetCircleOff`
- `planetOff`
- `planetRing`
- `planetRingCircle`
- `planetRingCircleFilled`
- `planetRingCircleOff`
- `planetRingOff`
- `play`
- `playCircle`
- `playCircleFilled`
- `playCircleOff`
- `playOff`
- `plus`
- `plusCircle`
- `plusCircleFilled`
- `plusCircleOff`
- `plusOff`
- `power`
- `powerCircle`
- `powerCircleFilled`
- `powerCircleOff`
- `powerOff`
- `previousTrack`
- `previousTrackCircle`
- `previousTrackCircleFilled`
- `previousTrackCircleOff`
- `previousTrackOff`
- `printer`
- `printerCircle`
- `printerCircleFilled`
- `printerCircleOff`
- `printerOff`
- `qrCode`
- `qrCodeCircle`
- `qrCodeCircleFilled`
- `qrCodeCircleOff`
- `qrCodeOff`
- `question`
- `questionCircle`
- `questionCircleFilled`
- `questionCircleOff`
- `questionOff`
- `radio`
- `radioCircle`
- `radioCircleFilled`
- `radioCircleOff`
- `radioOff`
- `raiseHand`
- `raiseHandCircle`
- `raiseHandCircleFilled`
- `raiseHandCircleOff`
- `raiseHandOff`
- `refresh`
- `reload`
- `repeat`
- `repeatCircle`
- `repeatCircleFilled`
- `repeatCircleOff`
- `repeatOff`
- `rewind`
- `rewindCircle`
- `rewindCircleFilled`
- `rewindCircleOff`
- `rewindOff`
- `rewindTime`
- `rewindTimeCircle`
- `rewindTimeCircleFilled`
- `rewindTimeCircleOff`
- `rewindTimeOff`
- `ruler`
- `rulerCircle`
- `rulerCircleFilled`
- `rulerCircleOff`
- `rulerOff`
- `scissors`
- `scissorsCircle`
- `scissorsCircleFilled`
- `scissorsCircleOff`
- `scissorsOff`
- `seedling`
- `seedlingCircle`
- `seedlingCircleFilled`
- `seedlingCircleOff`
- `seedlingOff`
- `send`
- `shareAndroid`
- `shareAndroidCircle`
- `shareAndroidCircleFilled`
- `shareAndroidCircleOff`
- `shareAndroidOff`
- `shareIos`
- `shareIosCircle`
- `shareIosCircleFilled`
- `shareIosCircleOff`
- `shareIosOff`
- `shield`
- `shieldCheck`
- `shieldCheckCircle`
- `shieldCheckCircleFilled`
- `shieldCheckCircleOff`
- `shieldCheckOff`
- `shieldCheckered`
- `shieldCheckeredCircle`
- `shieldCheckeredCircleFilled`
- `shieldCheckeredCircleOff`
- `shieldCheckeredOff`
- `shieldCircle`
- `shieldCircleFilled`
- `shieldCircleOff`
- `shieldOff`
- `shuffle`
- `shuffleCircle`
- `shuffleCircleFilled`
- `shuffleCircleOff`
- `shuffleOff`
- `sliders`
- `slidersCircle`
- `slidersCircleFilled`
- `slidersCircleOff`
- `slidersOff`
- `smartphone`
- `smartphoneCutout`
- `smartphoneCutoutCircle`
- `smartphoneCutoutCircleFilled`
- `smartphoneCutoutCircleOff`
- `smartphoneCutoutOff`
- `smartphoneHomeButton`
- `smartphoneHomeButtonCircle`
- `smartphoneHomeButtonCircleFilled`
- `smartphoneHomeButtonCircleOff`
- `smartphoneHomeButtonOff`
- `smartphoneNotch`
- `smartphoneNotchCircle`
- `smartphoneNotchCircleFilled`
- `smartphoneNotchCircleOff`
- `smartphoneNotchOff`
- `smartphone2`
- `softDrink`
- `softDrinkCircle`
- `softDrinkCircleFilled`
- `softDrinkCircleOff`
- `softDrinkOff`
- `sort`
- `speakerHigh`
- `speakerHighCircle`
- `speakerHighCircleFilled`
- `speakerHighCircleOff`
- `speakerHighOff`
- `speakerLow`
- `speakerLowCircle`
- `speakerLowCircleFilled`
- `speakerLowCircleOff`
- `speakerLowOff`
- `speakerOff`
- `square`
- `squareCircle`
- `squareCircleFilled`
- `squareCircleOff`
- `squareFilled`
- `squareFilledCircle`
- `squareFilledCircleFilled`
- `squareFilledCircleOff`
- `squareFilledOff`
- `squareOff`
- `star`
- `starCircle`
- `starCircleFilled`
- `starCircleOff`
- `starFilled`
- `starFilledCircle`
- `starFilledCircleFilled`
- `starFilledCircleOff`
- `starFilledOff`
- `starOff`
- `stars`
- `starsCircle`
- `starsCircleFilled`
- `starsCircleOff`
- `starsOff`
- `stopwatch`
- `stopwatchCircle`
- `stopwatchCircleFilled`
- `stopwatchCircleOff`
- `stopwatchOff`
- `studioBackdrop`
- `studioBackdropCircle`
- `studioBackdropCircleFilled`
- `studioBackdropCircleOff`
- `studioBackdropOff`
- `studioLightFront`
- `studioLightFrontCircle`
- `studioLightFrontCircleFilled`
- `studioLightFrontCircleOff`
- `studioLightFrontOff`
- `studioLightSide`
- `studioLightSideCircle`
- `studioLightSideCircleFilled`
- `studioLightSideCircleOff`
- `studioLightSideOff`
- `sun`
- `sunCircle`
- `sunCircleFilled`
- `sunCircleOff`
- `sunOff`
- `sword`
- `swordCircle`
- `swordCircleFilled`
- `swordCircleOff`
- `swordOff`
- `swordShield`
- `swordShieldCircle`
- `swordShieldCircleFilled`
- `swordShieldCircleOff`
- `swordShieldOff`
- `swords`
- `swordsCircle`
- `swordsCircleFilled`
- `swordsCircleOff`
- `swordsOff`
- `syringe`
- `syringeCircle`
- `syringeCircleFilled`
- `syringeCircleOff`
- `syringeOff`
- `tShirt`
- `tShirtCircle`
- `tShirtCircleFilled`
- `tShirtCircleOff`
- `tShirtOff`
- `tablet`
- `tabletCircle`
- `tabletCircleFilled`
- `tabletCircleOff`
- `tabletOff`
- `taxi`
- `taxiCircle`
- `taxiCircleFilled`
- `taxiCircleOff`
- `taxiOff`
- `television`
- `televisionCircle`
- `televisionCircleFilled`
- `televisionCircleOff`
- `televisionOff`
- `televisionPlay`
- `televisionPlayCircle`
- `televisionPlayCircleFilled`
- `televisionPlayCircleOff`
- `televisionPlayOff`
- `textBubble`
- `textBubbleCircle`
- `textBubbleCircleFilled`
- `textBubbleCircleOff`
- `textBubbleOff`
- `textBubbles`
- `textBubblesCircle`
- `textBubblesCircleFilled`
- `textBubblesCircleOff`
- `textBubblesOff`
- `thumbsDown`
- `thumbsDownCircle`
- `thumbsDownCircleFilled`
- `thumbsDownCircleOff`
- `thumbsDownOff`
- `thumbsUp`
- `thumbsUpCircle`
- `thumbsUpCircleFilled`
- `thumbsUpCircleOff`
- `thumbsUpOff`
- `ticket`
- `ticketCircle`
- `ticketCircleFilled`
- `ticketCircleOff`
- `ticketOff`
- `times`
- `timesCircle`
- `timesCircleFilled`
- `timesCircleOff`
- `timesOff`
- `tool`
- `train`
- `trainCircle`
- `trainCircleFilled`
- `trainCircleOff`
- `trainOff`
- `trash`
- `trashCircle`
- `trashCircleFilled`
- `trashCircleOff`
- `trashOff`
- `tree`
- `treeCircle`
- `treeCircleFilled`
- `treeCircleOff`
- `treeOff`
- `triangleDown`
- `triangleDownCircle`
- `triangleDownCircleFilled`
- `triangleDownCircleOff`
- `triangleDownFilled`
- `triangleDownFilledCircle`
- `triangleDownFilledCircleFilled`
- `triangleDownFilledCircleOff`
- `triangleDownFilledOff`
- `triangleDownOff`
- `triangleLeft`
- `triangleLeftCircle`
- `triangleLeftCircleFilled`
- `triangleLeftCircleOff`
- `triangleLeftFilled`
- `triangleLeftFilledCircle`
- `triangleLeftFilledCircleFilled`
- `triangleLeftFilledCircleOff`
- `triangleLeftFilledOff`
- `triangleLeftOff`
- `triangleRight`
- `triangleRightCircle`
- `triangleRightCircleFilled`
- `triangleRightCircleOff`
- `triangleRightFilled`
- `triangleRightFilledCircle`
- `triangleRightFilledCircleFilled`
- `triangleRightFilledCircleOff`
- `triangleRightFilledOff`
- `triangleRightOff`
- `triangleUp`
- `triangleUpCircle`
- `triangleUpCircleFilled`
- `triangleUpCircleOff`
- `triangleUpFilled`
- `triangleUpFilledCircle`
- `triangleUpFilledCircleFilled`
- `triangleUpFilledCircleOff`
- `triangleUpFilledOff`
- `triangleUpOff`
- `trophy`
- `trophyCircle`
- `trophyCircleFilled`
- `trophyCircleOff`
- `trophyOff`
- `truck`
- `truckCircle`
- `truckCircleFilled`
- `truckCircleOff`
- `truckOff`
- `umbrella`
- `umbrellaCircle`
- `umbrellaCircleFilled`
- `umbrellaCircleOff`
- `umbrellaOff`
- `watch`
- `watchCircle`
- `watchCircleFilled`
- `watchCircleOff`
- `watchOff`
- `waterDrop`
- `waterDropCircle`
- `waterDropCircleFilled`
- `waterDropCircleOff`
- `waterDropOff`
- `wifi`
- `wifiCircle`
- `wifiCircleFilled`
- `wifiCircleOff`
- `wifiOff`
- `wrench`
- `wrenchCircle`
- `wrenchCircleFilled`
- `wrenchCircleOff`
- `wrenchOff`
- `yen`
- `yenCircle`
- `yenCircleFilled`
- `yenCircleOff`
- `yenOff`
- `yuan`
- `yuanCircle`
- `yuanCircleFilled`
- `yuanCircleOff`
- `yuanOff`

## Usage Examples

### Navigation Menu

```html
@js
  import { AirplaneIcon, AirplaneCircleIcon, AirplaneCircleFilledIcon, AirplaneCircleOffIcon } from '@stacksjs/iconify-pepicons-print'

  global.navIcons = {
    home: AirplaneIcon({ size: 20, class: 'nav-icon' }),
    about: AirplaneCircleIcon({ size: 20, class: 'nav-icon' }),
    contact: AirplaneCircleFilledIcon({ size: 20, class: 'nav-icon' }),
    settings: AirplaneCircleOffIcon({ size: 20, class: 'nav-icon' })
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
import { AirplaneIcon } from '@stacksjs/iconify-pepicons-print'

const icon = AirplaneIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AirplaneIcon, AirplaneCircleIcon, AirplaneCircleFilledIcon } from '@stacksjs/iconify-pepicons-print'

const successIcon = AirplaneIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplaneCircleIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AirplaneCircleFilledIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AirplaneIcon, AirplaneCircleIcon } from '@stacksjs/iconify-pepicons-print'
   const icon = AirplaneIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { airplane, airplaneCircle } from '@stacksjs/iconify-pepicons-print'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(airplane, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AirplaneIcon, AirplaneCircleIcon } from '@stacksjs/iconify-pepicons-print'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-pepicons-print'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AirplaneIcon } from '@stacksjs/iconify-pepicons-print'
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
import { airplane } from '@stacksjs/iconify-pepicons-print'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/pepicons-print/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/pepicons-print/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
