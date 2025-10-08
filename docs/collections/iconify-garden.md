# Garden SVG Icons

> Garden SVG Icons icons for stx from Iconify

## Overview

This package provides access to 1003 icons from the Garden SVG Icons collection through the stx iconify integration.

**Collection ID:** `garden`
**Total Icons:** 1003
**Author:** Zendesk ([Website](https://github.com/zendeskgarden/svg-icons))
**License:** Apache 2.0 ([Details](https://github.com/zendeskgarden/svg-icons/blob/main/LICENSE.md))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-garden
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 123Fill12Icon, 123Fill16Icon, 123Stroke12Icon } from '@stacksjs/iconify-garden'

// Basic usage
const icon = 123Fill12Icon()

// With size
const sizedIcon = 123Fill12Icon({ size: 24 })

// With color
const coloredIcon = 123Fill16Icon({ color: 'red' })

// With multiple props
const customIcon = 123Stroke12Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 123Fill12Icon, 123Fill16Icon, 123Stroke12Icon } from '@stacksjs/iconify-garden'

  global.icons = {
    home: 123Fill12Icon({ size: 24 }),
    user: 123Fill16Icon({ size: 24, color: '#4a90e2' }),
    settings: 123Stroke12Icon({ size: 32 })
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
import { 123Fill12, 123Fill16, 123Stroke12 } from '@stacksjs/iconify-garden'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(123Fill12, { size: 24 })
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
const redIcon = 123Fill12Icon({ color: 'red' })
const blueIcon = 123Fill12Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 123Fill12Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 123Fill12Icon({ class: 'text-primary' })
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
const icon24 = 123Fill12Icon({ size: 24 })
const icon1em = 123Fill12Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 123Fill12Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 123Fill12Icon({ height: '1em' })
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
const smallIcon = 123Fill12Icon({ class: 'icon-small' })
const largeIcon = 123Fill12Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **1003** icons:

- `123Fill12`
- `123Fill16`
- `123Stroke12`
- `123Stroke16`
- `adjustFill12`
- `adjustFill16`
- `adjustStroke12`
- `adjustStroke16`
- `alertErrorFill12`
- `alertErrorFill16`
- `alertErrorStroke12`
- `alertErrorStroke16`
- `alertWarningFill12`
- `alertWarningFill16`
- `alertWarningStroke12`
- `alertWarningStroke16`
- `alignCenterFill12`
- `alignCenterFill16`
- `alignCenterStroke12`
- `alignCenterStroke16`
- `alignJustifyFill12`
- `alignJustifyFill16`
- `alignJustifyStroke12`
- `alignJustifyStroke16`
- `alignLeftFill12`
- `alignLeftFill16`
- `alignLeftStroke12`
- `alignLeftStroke16`
- `alignRightFill12`
- `alignRightFill16`
- `alignRightStroke12`
- `alignRightStroke16`
- `altTextFill12`
- `altTextFill16`
- `altTextStroke12`
- `altTextStroke16`
- `answerBot26`
- `app26`
- `arrangeContent26`
- `arrowLeftFill12`
- `arrowLeftFill16`
- `arrowLeftSmFill12`
- `arrowLeftSmFill16`
- `arrowLeftSmStroke12`
- `arrowLeftSmStroke16`
- `arrowLeftStroke12`
- `arrowLeftStroke16`
- `arrowLeftUpFill12`
- `arrowLeftUpFill16`
- `arrowLeftUpStroke12`
- `arrowLeftUpStroke16`
- `arrowRetweetFill12`
- `arrowRetweetFill16`
- `arrowRetweetStroke12`
- `arrowRetweetStroke16`
- `arrowReverseFill12`
- `arrowReverseFill16`
- `arrowReverseStroke12`
- `arrowReverseStroke16`
- `arrowRightLeft26`
- `arrowTrendingFill12`
- `arrowTrendingFill16`
- `arrowTrendingStroke12`
- `arrowTrendingStroke16`
- `asteriskFill12`
- `asteriskFill16`
- `asteriskStroke12`
- `asteriskStroke16`
- `atFill12`
- `atFill16`
- `atStroke12`
- `atStroke16`
- `barChart26`
- `barChartFill12`
- `barChartFill16`
- `barChartStroke12`
- `barChartStroke16`
- `basketballFill12`
- `basketballFill16`
- `basketballStroke12`
- `basketballStroke16`
- `boldFill12`
- `boldFill16`
- `boldStroke12`
- `boldStroke16`
- `book26`
- `bookClosedFill12`
- `bookClosedFill16`
- `bookClosedStroke12`
- `bookClosedStroke16`
- `bookOpenFill12`
- `bookOpenFill16`
- `bookOpenStroke12`
- `bookOpenStroke16`
- `bookmarkFill12`
- `bookmarkFill16`
- `bookmarkStroke12`
- `bookmarkStroke16`
- `botGeneric26`
- `botSparkleFill12`
- `botSparkleFill16`
- `botSparkleStroke12`
- `botSparkleStroke16`
- `box3dFill12`
- `box3dFill16`
- `box3dStroke12`
- `box3dStroke16`
- `building26`
- `buildingFill12`
- `buildingFill16`
- `buildingStroke12`
- `buildingStroke16`
- `calendarFill12`
- `calendarFill16`
- `calendarStroke12`
- `calendarStroke16`
- `callIn26`
- `cameraFill12`
- `cameraFill16`
- `cameraStroke12`
- `cameraStroke16`
- `carFill12`
- `carFill16`
- `carStroke12`
- `carStroke16`
- `centerFill12`
- `centerFill16`
- `centerStroke12`
- `centerStroke16`
- `chat26`
- `checkBadgeFill12`
- `checkBadgeFill16`
- `checkBadgeStroke12`
- `checkBadgeStroke16`
- `checkBoxDoubleFill12`
- `checkBoxDoubleFill16`
- `checkBoxDoubleStroke12`
- `checkBoxDoubleStroke16`
- `checkBoxFill12`
- `checkBoxFill16`
- `checkBoxStroke12`
- `checkBoxStroke16`
- `checkCircleFill12`
- `checkCircleFill16`
- `checkCircleStroke12`
- `checkCircleStroke16`
- `checkDoubleFill12`
- `checkDoubleFill16`
- `checkDoubleStroke12`
- `checkDoubleStroke16`
- `checkLgFill12`
- `checkLgFill16`
- `checkLgStroke12`
- `checkLgStroke16`
- `checkSmFill12`
- `checkSmFill16`
- `checkSmStroke12`
- `checkSmStroke16`
- `checkbox26`
- `chevronBoxFill12`
- `chevronBoxFill16`
- `chevronBoxStroke12`
- `chevronBoxStroke16`
- `chevronDoubleDownFill12`
- `chevronDoubleDownFill16`
- `chevronDoubleDownStroke12`
- `chevronDoubleDownStroke16`
- `chevronDoubleLeftFill12`
- `chevronDoubleLeftFill16`
- `chevronDoubleLeftStroke12`
- `chevronDoubleLeftStroke16`
- `chevronDoubleRightFill12`
- `chevronDoubleRightFill16`
- `chevronDoubleRightStroke12`
- `chevronDoubleRightStroke16`
- `chevronDoubleUpFill12`
- `chevronDoubleUpFill16`
- `chevronDoubleUpStroke12`
- `chevronDoubleUpStroke16`
- `chevronDownFill12`
- `chevronDownFill16`
- `chevronDownStroke12`
- `chevronDownStroke16`
- `chevronLeftFill12`
- `chevronLeftFill16`
- `chevronLeftStroke12`
- `chevronLeftStroke16`
- `chevronRightFill12`
- `chevronRightFill16`
- `chevronRightStroke12`
- `chevronRightStroke16`
- `chevronUpFill12`
- `chevronUpFill16`
- `chevronUpStroke12`
- `chevronUpStroke16`
- `circleFill12`
- `circleFill16`
- `circleFullFill12`
- `circleFullFill16`
- `circleFullStroke12`
- `circleFullStroke16`
- `circleLineFill12`
- `circleLineFill16`
- `circleLineStroke12`
- `circleLineStroke16`
- `circleSmFill12`
- `circleSmFill16`
- `circleSmStroke12`
- `circleSmStroke16`
- `circleStroke12`
- `circleStroke16`
- `clipboard26`
- `clipboardBlankFill12`
- `clipboardBlankFill16`
- `clipboardBlankStroke12`
- `clipboardBlankStroke16`
- `clipboardCheckFill12`
- `clipboardCheckFill16`
- `clipboardCheckStroke12`
- `clipboardCheckStroke16`
- `clipboardListFill12`
- `clipboardListFill16`
- `clipboardListStroke12`
- `clipboardListStroke16`
- `clock26`
- `clockCycleFill12`
- `clockCycleFill16`
- `clockCycleStroke12`
- `clockCycleStroke16`
- `clockFill12`
- `clockFill16`
- `clockInFill12`
- `clockInFill16`
- `clockInStroke12`
- `clockInStroke16`
- `clockOutFill12`
- `clockOutFill16`
- `clockOutStroke12`
- `clockOutStroke16`
- `clockStroke12`
- `clockStroke16`
- `cloudUpload26`
- `copyFill12`
- `copyFill16`
- `copyStroke12`
- `copyStroke16`
- `creditCard26`
- `creditCardFill12`
- `creditCardFill16`
- `creditCardStroke12`
- `creditCardStroke16`
- `cssFill12`
- `cssFill16`
- `cssStroke12`
- `cssStroke16`
- `cursorArrowFill12`
- `cursorArrowFill16`
- `cursorArrowStroke12`
- `cursorArrowStroke16`
- `customerListsFill26`
- `customize26`
- `cutleryFill12`
- `cutleryFill16`
- `cutleryStroke12`
- `cutleryStroke16`
- `dashFill12`
- `dashFill16`
- `dashStroke12`
- `dashStroke16`
- `dashboard26`
- `databaseFill12`
- `databaseFill16`
- `databaseStroke12`
- `databaseStroke16`
- `decimalFill12`
- `decimalFill16`
- `decimalStroke12`
- `decimalStroke16`
- `directionLtrFill12`
- `directionLtrFill16`
- `directionLtrStroke12`
- `directionLtrStroke16`
- `directionRtlFill12`
- `directionRtlFill16`
- `directionRtlStroke12`
- `directionRtlStroke16`
- `documentSearchFill12`
- `documentSearchFill16`
- `documentSearchStroke12`
- `documentSearchStroke16`
- `downloadFill12`
- `downloadFill16`
- `downloadStroke12`
- `downloadStroke16`
- `duplicateFill12`
- `duplicateFill16`
- `duplicateStroke12`
- `duplicateStroke16`
- `editRedoFill12`
- `editRedoFill16`
- `editRedoStroke12`
- `editRedoStroke16`
- `editUndoFill12`
- `editUndoFill16`
- `editUndoStroke12`
- `editUndoStroke16`
- `ellipsis26`
- `emailFill12`
- `emailFill16`
- `emailFill26`
- `emailStroke12`
- `emailStroke16`
- `eraserFill12`
- `eraserFill16`
- `eraserStroke12`
- `eraserStroke16`
- `exitFill12`
- `exitFill16`
- `exitStroke12`
- `exitStroke16`
- `eyeFill12`
- `eyeFill16`
- `eyeHideFill12`
- `eyeHideFill16`
- `eyeHideStroke12`
- `eyeHideStroke16`
- `eyeStroke12`
- `eyeStroke16`
- `faceNeutralFill12`
- `faceNeutralFill16`
- `faceNeutralStroke12`
- `faceNeutralStroke16`
- `faceSadFill12`
- `faceSadFill16`
- `faceSadStroke12`
- `faceSadStroke16`
- `faceVeryHappyFill12`
- `faceVeryHappyFill16`
- `faceVeryHappyStroke12`
- `faceVeryHappyStroke16`
- `faceVerySadFill12`
- `faceVerySadFill16`
- `faceVerySadStroke12`
- `faceVerySadStroke16`
- `facebookFill12`
- `facebookFill16`
- `facebookStroke12`
- `facebookStroke16`
- `file26`
- `fileDocument26`
- `fileDocumentFill12`
- `fileDocumentFill16`
- `fileDocumentStroke12`
- `fileDocumentStroke16`
- `fileError26`
- `fileErrorFill12`
- `fileErrorFill16`
- `fileErrorStroke12`
- `fileErrorStroke16`
- `fileGenericFill12`
- `fileGenericFill16`
- `fileGenericStroke12`
- `fileGenericStroke16`
- `fileImage26`
- `fileImageFill12`
- `fileImageFill16`
- `fileImageStroke12`
- `fileImageStroke16`
- `filePdf26`
- `filePdfFill12`
- `filePdfFill16`
- `filePdfStroke12`
- `filePdfStroke16`
- `filePresentation26`
- `filePresentationFill12`
- `filePresentationFill16`
- `filePresentationStroke12`
- `filePresentationStroke16`
- `fileSpreadsheet26`
- `fileSpreadsheetFill12`
- `fileSpreadsheetFill16`
- `fileSpreadsheetStroke12`
- `fileSpreadsheetStroke16`
- `fileZip26`
- `fileZipFill12`
- `fileZipFill16`
- `fileZipStroke12`
- `fileZipStroke16`
- `filterFill12`
- `filterFill16`
- `filterStroke12`
- `filterStroke16`
- `flagFill12`
- `flagFill16`
- `flagStroke12`
- `flagStroke16`
- `folderClosedFill12`
- `folderClosedFill16`
- `folderClosedStroke12`
- `folderClosedStroke16`
- `folderOpenFill12`
- `folderOpenFill16`
- `folderOpenStroke12`
- `folderOpenStroke16`
- `fullWidthFill12`
- `fullWidthFill16`
- `fullWidthStroke12`
- `fullWidthStroke16`
- `garden26`
- `gearFill12`
- `gearFill16`
- `gearStroke12`
- `gearStroke16`
- `githubFill12`
- `githubFill16`
- `githubStroke12`
- `githubStroke16`
- `globeFill12`
- `globeFill16`
- `globeStroke12`
- `globeStroke16`
- `grid2x2Fill12`
- `grid2x2Fill16`
- `grid2x2Stroke12`
- `grid2x2Stroke16`
- `grid3x3Fill12`
- `grid3x3Fill16`
- `grid3x3Stroke12`
- `grid3x3Stroke16`
- `gridAdd26`
- `grip12`
- `grip16`
- `groupFill26`
- `growthChartFill12`
- `growthChartFill16`
- `growthChartStroke12`
- `growthChartStroke16`
- `headingFill12`
- `headingFill16`
- `headingStroke12`
- `headingStroke16`
- `headset26`
- `headsetFill12`
- `headsetFill16`
- `headsetStroke12`
- `headsetStroke16`
- `heartFill12`
- `heartFill16`
- `heartStroke12`
- `heartStroke16`
- `helpCenter26`
- `historyFill12`
- `historyFill16`
- `historyStroke12`
- `historyStroke16`
- `homeFill12`
- `homeFill16`
- `homeFill26`
- `homeStroke12`
- `homeStroke16`
- `hook26`
- `horizontalRuleFill12`
- `horizontalRuleFill16`
- `horizontalRuleStroke12`
- `horizontalRuleStroke16`
- `imageFill12`
- `imageFill16`
- `imageStroke12`
- `imageStroke16`
- `inboxFill12`
- `inboxFill16`
- `inboxStroke12`
- `inboxStroke16`
- `indentDecreaseFill12`
- `indentDecreaseFill16`
- `indentDecreaseStroke12`
- `indentDecreaseStroke16`
- `indentIncreaseFill12`
- `indentIncreaseFill16`
- `indentIncreaseStroke12`
- `indentIncreaseStroke16`
- `infoFill12`
- `infoFill16`
- `infoStroke12`
- `infoStroke16`
- `interlockingRingsFill12`
- `interlockingRingsFill16`
- `interlockingRingsStroke12`
- `interlockingRingsStroke16`
- `italicFill12`
- `italicFill16`
- `italicStroke12`
- `italicStroke16`
- `knowledgeBase26`
- `leafFill12`
- `leafFill16`
- `leafStroke12`
- `leafStroke16`
- `lifesaverFill12`
- `lifesaverFill16`
- `lifesaverStroke12`
- `lifesaverStroke16`
- `lightbulbFill12`
- `lightbulbFill16`
- `lightbulbStroke12`
- `lightbulbStroke16`
- `lightningBoltFill12`
- `lightningBoltFill16`
- `lightningBoltStroke12`
- `lightningBoltStroke16`
- `lineChart26`
- `lineGraphFill12`
- `lineGraphFill16`
- `lineGraphStroke12`
- `lineGraphStroke16`
- `lineSocialFill12`
- `lineSocialFill16`
- `lineSocialStroke12`
- `lineSocialStroke16`
- `linkFill12`
- `linkFill16`
- `linkRemoveFill12`
- `linkRemoveFill16`
- `linkRemoveStroke12`
- `linkRemoveStroke16`
- `linkStroke12`
- `linkStroke16`
- `linkedinFill12`
- `linkedinFill16`
- `linkedinStroke12`
- `linkedinStroke16`
- `listBulletFill12`
- `listBulletFill16`
- `listBulletStroke12`
- `listBulletStroke16`
- `listNumberFill12`
- `listNumberFill16`
- `listNumberRtlFill12`
- `listNumberRtlFill16`
- `listNumberRtlStroke12`
- `listNumberRtlStroke16`
- `listNumberStroke12`
- `listNumberStroke16`
- `locationFill12`
- `locationFill16`
- `locationStroke12`
- `locationStroke16`
- `lockLockedFill12`
- `lockLockedFill16`
- `lockLockedStroke12`
- `lockLockedStroke16`
- `lockUnlockedFill12`
- `lockUnlockedFill16`
- `lockUnlockedStroke12`
- `lockUnlockedStroke16`
- `macro26`
- `markupFill12`
- `markupFill16`
- `markupStroke12`
- `markupStroke16`
- `maximizeFill12`
- `maximizeFill16`
- `maximizeStroke12`
- `maximizeStroke16`
- `megaphoneFill12`
- `megaphoneFill16`
- `megaphoneStroke12`
- `megaphoneStroke16`
- `menuFill12`
- `menuFill16`
- `menuStroke12`
- `menuStroke16`
- `messengerFill12`
- `messengerFill16`
- `messengerStroke12`
- `messengerStroke16`
- `microphoneOffFill12`
- `microphoneOffFill16`
- `microphoneOffStroke12`
- `microphoneOffStroke16`
- `microphoneOnFill12`
- `microphoneOnFill16`
- `microphoneOnStroke12`
- `microphoneOnStroke16`
- `minimizeFill12`
- `minimizeFill16`
- `minimizeStroke12`
- `minimizeStroke16`
- `mobilePhoneFill12`
- `mobilePhoneFill16`
- `mobilePhoneStroke12`
- `mobilePhoneStroke16`
- `moderation26`
- `monitor26`
- `monitorFill12`
- `monitorFill16`
- `monitorStroke12`
- `monitorStroke16`
- `moonFill12`
- `moonFill16`
- `moonStroke12`
- `moonStroke16`
- `multilineFill12`
- `multilineFill16`
- `multilineStroke12`
- `multilineStroke16`
- `newWindowFill12`
- `newWindowFill16`
- `newWindowStroke12`
- `newWindowStroke16`
- `notesFill12`
- `notesFill16`
- `notesStroke12`
- `notesStroke16`
- `notificationFill12`
- `notificationFill16`
- `notificationStroke12`
- `notificationStroke16`
- `numberFill12`
- `numberFill16`
- `numberStroke12`
- `numberStroke16`
- `organization26`
- `originalSizeFill12`
- `originalSizeFill16`
- `originalSizeStroke12`
- `originalSizeStroke16`
- `overflowFill12`
- `overflowFill16`
- `overflowStroke12`
- `overflowStroke16`
- `overflowVerticalFill12`
- `overflowVerticalFill16`
- `overflowVerticalStroke12`
- `overflowVerticalStroke16`
- `paletteFill12`
- `paletteFill16`
- `paletteStroke12`
- `paletteStroke16`
- `panelsFill12`
- `panelsFill16`
- `panelsStroke12`
- `panelsStroke16`
- `paperclip12`
- `paperclip16`
- `parenthesesFill12`
- `parenthesesFill16`
- `parenthesesStroke12`
- `parenthesesStroke16`
- `pauseFill12`
- `pauseFill16`
- `pauseStroke12`
- `pauseStroke16`
- `pencilFill12`
- `pencilFill16`
- `pencilStroke12`
- `pencilStroke16`
- `person26`
- `phoneCallEndFill12`
- `phoneCallEndFill16`
- `phoneCallEndStroke12`
- `phoneCallEndStroke16`
- `phoneCallInFill12`
- `phoneCallInFill16`
- `phoneCallInStroke12`
- `phoneCallInStroke16`
- `phoneCallOutFill12`
- `phoneCallOutFill16`
- `phoneCallOutStroke12`
- `phoneCallOutStroke16`
- `phoneCallPauseFill12`
- `phoneCallPauseFill16`
- `phoneCallPauseStroke12`
- `phoneCallPauseStroke16`
- `phoneCallSpeakerFill12`
- `phoneCallSpeakerFill16`
- `phoneCallSpeakerStroke12`
- `phoneCallSpeakerStroke16`
- `phoneCallTransferFill12`
- `phoneCallTransferFill16`
- `phoneCallTransferOnlyFill12`
- `phoneCallTransferOnlyFill16`
- `phoneCallTransferOnlyStroke12`
- `phoneCallTransferOnlyStroke16`
- `phoneCallTransferStroke12`
- `phoneCallTransferStroke16`
- `phoneFill12`
- `phoneFill16`
- `phoneStroke12`
- `phoneStroke16`
- `pinFill12`
- `pinFill16`
- `pinRemoveFill12`
- `pinRemoveFill16`
- `pinRemoveStroke12`
- `pinRemoveStroke16`
- `pinStroke12`
- `pinStroke16`
- `platform26`
- `play26`
- `playCircleFill12`
- `playCircleFill16`
- `playCircleStroke12`
- `playCircleStroke16`
- `playFill12`
- `playFill16`
- `playStroke12`
- `playStroke16`
- `plugFill12`
- `plugFill16`
- `plugStroke12`
- `plugStroke16`
- `plusCircleFill12`
- `plusCircleFill16`
- `plusCircleStroke12`
- `plusCircleStroke16`
- `plusFill12`
- `plusFill16`
- `plusStroke12`
- `plusStroke16`
- `puzzlePieceFill12`
- `puzzlePieceFill16`
- `puzzlePieceStroke12`
- `puzzlePieceStroke16`
- `questionMarkFill12`
- `questionMarkFill16`
- `questionMarkStroke12`
- `questionMarkStroke16`
- `quoteFill12`
- `quoteFill16`
- `quoteStroke12`
- `quoteStroke16`
- `rearrangeFill12`
- `rearrangeFill16`
- `rearrangeStroke12`
- `rearrangeStroke16`
- `recordFill12`
- `recordFill16`
- `recordStroke12`
- `recordStroke16`
- `relationshapeChat26`
- `relationshapeConnect26`
- `relationshapeExplore26`
- `relationshapeGather26`
- `relationshapeGuide26`
- `relationshapeMessage26`
- `relationshapeSell26`
- `relationshapeSupport26`
- `relationshapeTalk26`
- `reloadFill12`
- `reloadFill16`
- `reloadStroke12`
- `reloadStroke16`
- `sandboxFill12`
- `sandboxFill16`
- `sandboxStroke12`
- `sandboxStroke16`
- `search26`
- `searchFill12`
- `searchFill16`
- `searchStroke12`
- `searchStroke16`
- `security26`
- `settingsFill26`
- `shapes26`
- `shapesFill12`
- `shapesFill16`
- `shapesStroke12`
- `shapesStroke16`
- `shareFill12`
- `shareFill16`
- `shareStroke12`
- `shareStroke16`
- `shieldFill12`
- `shieldFill16`
- `shieldStroke12`
- `shieldStroke16`
- `shoppingCartFill12`
- `shoppingCartFill16`
- `shoppingCartStroke12`
- `shoppingCartStroke16`
- `signpostFill12`
- `signpostFill16`
- `signpostStroke12`
- `signpostStroke16`
- `slackFill12`
- `slackFill16`
- `slackStroke12`
- `slackStroke16`
- `smileSlightFill12`
- `smileSlightFill16`
- `smileSlightStroke12`
- `smileSlightStroke16`
- `smileyFill12`
- `smileyFill16`
- `smileyStroke12`
- `smileyStroke16`
- `sortFill12`
- `sortFill16`
- `sortStroke12`
- `sortStroke16`
- `sparkleFill12`
- `sparkleFill16`
- `sparkleStroke12`
- `sparkleStroke16`
- `speechBubbleConversationFill12`
- `speechBubbleConversationFill16`
- `speechBubbleConversationStroke12`
- `speechBubbleConversationStroke16`
- `speechBubbleLightningBoltFill12`
- `speechBubbleLightningBoltFill16`
- `speechBubbleLightningBoltStroke12`
- `speechBubbleLightningBoltStroke16`
- `speechBubblePlainFill12`
- `speechBubblePlainFill16`
- `speechBubblePlainStroke12`
- `speechBubblePlainStroke16`
- `speechBubbleTypingFill12`
- `speechBubbleTypingFill16`
- `speechBubbleTypingStroke12`
- `speechBubbleTypingStroke16`
- `stampFill12`
- `stampFill16`
- `stampStroke12`
- `stampStroke16`
- `starFill12`
- `starFill16`
- `starStroke12`
- `starStroke16`
- `sunFill12`
- `sunFill16`
- `sunStroke12`
- `sunStroke16`
- `sunshine26`
- `tableFill12`
- `tableFill16`
- `tableStroke12`
- `tableStroke16`
- `tagFill12`
- `tagFill16`
- `tagStroke12`
- `tagStroke16`
- `terminalCliFill12`
- `terminalCliFill16`
- `terminalCliStroke12`
- `terminalCliStroke16`
- `terminalWindowFill12`
- `terminalWindowFill16`
- `terminalWindowStroke12`
- `terminalWindowStroke16`
- `textColorFill12`
- `textColorFill16`
- `textColorStroke12`
- `textColorStroke16`
- `textFill12`
- `textFill16`
- `textStroke12`
- `textStroke16`
- `thumbsDownFill12`
- `thumbsDownFill16`
- `thumbsDownStroke12`
- `thumbsDownStroke16`
- `thumbsUpFill12`
- `thumbsUpFill16`
- `thumbsUpStroke12`
- `thumbsUpStroke16`
- `translationCreatedFill12`
- `translationCreatedFill16`
- `translationCreatedStroke12`
- `translationCreatedStroke16`
- `translationDeletedFill12`
- `translationDeletedFill16`
- `translationDeletedStroke12`
- `translationDeletedStroke16`
- `translationExistsFill12`
- `translationExistsFill16`
- `translationExistsStroke12`
- `translationExistsStroke16`
- `translationOutdatedFill12`
- `translationOutdatedFill16`
- `translationOutdatedStroke12`
- `translationOutdatedStroke16`
- `translationUpdatedFill12`
- `translationUpdatedFill16`
- `translationUpdatedStroke12`
- `translationUpdatedStroke16`
- `trashFill12`
- `trashFill16`
- `trashStroke12`
- `trashStroke16`
- `trayBarChart26`
- `trayBook26`
- `trayBotSparkle26`
- `trayCalendar26`
- `trayClipboard26`
- `trayGear26`
- `trayGrowthChart26`
- `trayHeadset26`
- `trayPhone26`
- `traySpeechBubble26`
- `trayUserGroup26`
- `twitterFill12`
- `twitterFill16`
- `twitterStroke12`
- `twitterStroke16`
- `underlineFill12`
- `underlineFill16`
- `underlineStroke12`
- `underlineStroke16`
- `uploadFill12`
- `uploadFill16`
- `uploadStroke12`
- `uploadStroke16`
- `userCircleFill12`
- `userCircleFill16`
- `userCircleStroke12`
- `userCircleStroke16`
- `userFollowFill12`
- `userFollowFill16`
- `userFollowStroke12`
- `userFollowStroke16`
- `userGroupFill12`
- `userGroupFill16`
- `userGroupStroke12`
- `userGroupStroke16`
- `userListFill12`
- `userListFill16`
- `userListStroke12`
- `userListStroke16`
- `userLock26`
- `userSoloFill12`
- `userSoloFill16`
- `userSoloStroke12`
- `userSoloStroke16`
- `userUnfollowFill12`
- `userUnfollowFill16`
- `userUnfollowStroke12`
- `userUnfollowStroke16`
- `viewsFill26`
- `voicemailFill12`
- `voicemailFill16`
- `voicemailStroke12`
- `voicemailStroke16`
- `volumeMutedFill12`
- `volumeMutedFill16`
- `volumeMutedStroke12`
- `volumeMutedStroke16`
- `volumeUnmutedFill12`
- `volumeUnmutedFill16`
- `volumeUnmutedStroke12`
- `volumeUnmutedStroke16`
- `wechatFill12`
- `wechatFill16`
- `wechatStroke12`
- `wechatStroke16`
- `whatsappFill12`
- `whatsappFill16`
- `whatsappStroke12`
- `whatsappStroke16`
- `widget26`
- `wordmarkBoldSuite26`
- `wordmarkBoldSupport26`
- `wordmarkCapitalSuite26`
- `wordmarkCapitalThe26`
- `wordmarkCapitalZendesk26`
- `wordmarkChat26`
- `wordmarkConnect26`
- `wordmarkExplore26`
- `wordmarkGarden26`
- `wordmarkGather26`
- `wordmarkGuide26`
- `wordmarkHelpCenter26`
- `wordmarkInbox26`
- `wordmarkMessage26`
- `wordmarkMessaging26`
- `wordmarkReach26`
- `wordmarkSell26`
- `wordmarkSunshine26`
- `wordmarkSupport26`
- `wordmarkTalk26`
- `wordmarkZendesk26`
- `workflow26`
- `wrapLeftFill12`
- `wrapLeftFill16`
- `wrapLeftStroke12`
- `wrapLeftStroke16`
- `wrapRightFill12`
- `wrapRightFill16`
- `wrapRightStroke12`
- `wrapRightStroke16`
- `xCircleFill12`
- `xCircleFill16`
- `xCircleStroke12`
- `xCircleStroke16`
- `xFill12`
- `xFill16`
- `xStroke12`
- `xStroke16`
- `zendesk26`
- `zendeskFill12`
- `zendeskFill16`
- `zendeskStroke12`
- `zendeskStroke16`

## Usage Examples

### Navigation Menu

```html
@js
  import { 123Fill12Icon, 123Fill16Icon, 123Stroke12Icon, 123Stroke16Icon } from '@stacksjs/iconify-garden'

  global.navIcons = {
    home: 123Fill12Icon({ size: 20, class: 'nav-icon' }),
    about: 123Fill16Icon({ size: 20, class: 'nav-icon' }),
    contact: 123Stroke12Icon({ size: 20, class: 'nav-icon' }),
    settings: 123Stroke16Icon({ size: 20, class: 'nav-icon' })
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
import { 123Fill12Icon } from '@stacksjs/iconify-garden'

const icon = 123Fill12Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 123Fill12Icon, 123Fill16Icon, 123Stroke12Icon } from '@stacksjs/iconify-garden'

const successIcon = 123Fill12Icon({ size: 16, color: '#22c55e' })
const warningIcon = 123Fill16Icon({ size: 16, color: '#f59e0b' })
const errorIcon = 123Stroke12Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 123Fill12Icon, 123Fill16Icon } from '@stacksjs/iconify-garden'
   const icon = 123Fill12Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 123Fill12, 123Fill16 } from '@stacksjs/iconify-garden'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(123Fill12, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 123Fill12Icon, 123Fill16Icon } from '@stacksjs/iconify-garden'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-garden'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 123Fill12Icon } from '@stacksjs/iconify-garden'
     global.icon = 123Fill12Icon({ size: 24 })
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
   const icon = 123Fill12Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 123Fill12 } from '@stacksjs/iconify-garden'

// Icons are typed as IconData
const myIcon: IconData = 123Fill12
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/zendeskgarden/svg-icons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Zendesk ([Website](https://github.com/zendeskgarden/svg-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/garden/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/garden/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
