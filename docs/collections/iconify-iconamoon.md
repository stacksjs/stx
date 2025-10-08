# IconaMoon

> IconaMoon icons for stx from Iconify

## Overview

This package provides access to 1781 icons from the IconaMoon collection through the stx iconify integration.

**Collection ID:** `iconamoon`
**Total Icons:** 1781
**Author:** Dariush Habibpour ([Website](https://github.com/dariushhpg1/IconaMoon))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-iconamoon
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
    <3dBoldIcon size="24" color="#4a90e2" />
    <3dDuotoneIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3d, 3dBold, 3dDuotone } from '@stacksjs/iconify-iconamoon'
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
.iconamoon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dIcon class="iconamoon-icon" />
```

## Available Icons

This package contains **1781** icons:

- `3d`
- `3dBold`
- `3dDuotone`
- `3dFill`
- `3dLight`
- `3dThin`
- `apps`
- `appsBold`
- `appsFill`
- `appsLight`
- `appsThin`
- `arrowBottomLeft1`
- `arrowBottomLeft1Bold`
- `arrowBottomLeft1Fill`
- `arrowBottomLeft1Light`
- `arrowBottomLeft1Thin`
- `arrowBottomLeft2`
- `arrowBottomLeft2Bold`
- `arrowBottomLeft2Fill`
- `arrowBottomLeft2Light`
- `arrowBottomLeft2Thin`
- `arrowBottomLeft3Square`
- `arrowBottomLeft3SquareBold`
- `arrowBottomLeft3SquareDuotone`
- `arrowBottomLeft3SquareFill`
- `arrowBottomLeft3SquareLight`
- `arrowBottomLeft3SquareThin`
- `arrowBottomLeft4Square`
- `arrowBottomLeft4SquareBold`
- `arrowBottomLeft4SquareDuotone`
- `arrowBottomLeft4SquareFill`
- `arrowBottomLeft4SquareLight`
- `arrowBottomLeft4SquareThin`
- `arrowBottomLeft5Circle`
- `arrowBottomLeft5CircleBold`
- `arrowBottomLeft5CircleDuotone`
- `arrowBottomLeft5CircleFill`
- `arrowBottomLeft5CircleLight`
- `arrowBottomLeft5CircleThin`
- `arrowBottomLeft6Circle`
- `arrowBottomLeft6CircleBold`
- `arrowBottomLeft6CircleDuotone`
- `arrowBottomLeft6CircleFill`
- `arrowBottomLeft6CircleLight`
- `arrowBottomLeft6CircleThin`
- `arrowBottomRight1`
- `arrowBottomRight1Bold`
- `arrowBottomRight1Fill`
- `arrowBottomRight1Light`
- `arrowBottomRight1Thin`
- `arrowBottomRight3Square`
- `arrowBottomRight3SquareBold`
- `arrowBottomRight3SquareDuotone`
- `arrowBottomRight3SquareFill`
- `arrowBottomRight3SquareLight`
- `arrowBottomRight3SquareThin`
- `arrowBottomRight4Square`
- `arrowBottomRight4SquareBold`
- `arrowBottomRight4SquareDuotone`
- `arrowBottomRight4SquareFill`
- `arrowBottomRight4SquareLight`
- `arrowBottomRight4SquareThin`
- `arrowBottomRight5Circle`
- `arrowBottomRight5CircleBold`
- `arrowBottomRight5CircleDuotone`
- `arrowBottomRight5CircleFill`
- `arrowBottomRight5CircleLight`
- `arrowBottomRight5CircleThin`
- `arrowBottomRight6Circle`
- `arrowBottomRight6CircleBold`
- `arrowBottomRight6CircleDuotone`
- `arrowBottomRight6CircleFill`
- `arrowBottomRight6CircleLight`
- `arrowBottomRight6CircleThin`
- `arrowBottomUp4Square`
- `arrowBottomUp4SquareBold`
- `arrowBottomUp4SquareDuotone`
- `arrowBottomUp4SquareFill`
- `arrowBottomUp4SquareLight`
- `arrowBottomUp4SquareThin`
- `arrowDown1`
- `arrowDown1Bold`
- `arrowDown1Duotone`
- `arrowDown1Fill`
- `arrowDown1Light`
- `arrowDown1Thin`
- `arrowDown2`
- `arrowDown2Bold`
- `arrowDown2Duotone`
- `arrowDown2Fill`
- `arrowDown2Light`
- `arrowDown2Thin`
- `arrowDown3Square`
- `arrowDown3SquareBold`
- `arrowDown3SquareDuotone`
- `arrowDown3SquareFill`
- `arrowDown3SquareLight`
- `arrowDown3SquareThin`
- `arrowDown4Square`
- `arrowDown4SquareBold`
- `arrowDown4SquareDuotone`
- `arrowDown4SquareFill`
- `arrowDown4SquareLight`
- `arrowDown4SquareThin`
- `arrowDown5Circle`
- `arrowDown5CircleBold`
- `arrowDown5CircleDuotone`
- `arrowDown5CircleFill`
- `arrowDown5CircleLight`
- `arrowDown5CircleThin`
- `arrowDown6Circle`
- `arrowDown6CircleBold`
- `arrowDown6CircleDuotone`
- `arrowDown6CircleFill`
- `arrowDown6CircleLight`
- `arrowDown6CircleThin`
- `arrowLeft1`
- `arrowLeft1Bold`
- `arrowLeft1Duotone`
- `arrowLeft1Fill`
- `arrowLeft1Light`
- `arrowLeft1Thin`
- `arrowLeft2`
- `arrowLeft2Bold`
- `arrowLeft2Duotone`
- `arrowLeft2Fill`
- `arrowLeft2Light`
- `arrowLeft2Thin`
- `arrowLeft3Square`
- `arrowLeft3SquareBold`
- `arrowLeft3SquareDuotone`
- `arrowLeft3SquareFill`
- `arrowLeft3SquareLight`
- `arrowLeft3SquareThin`
- `arrowLeft4Square`
- `arrowLeft4SquareBold`
- `arrowLeft4SquareDuotone`
- `arrowLeft4SquareFill`
- `arrowLeft4SquareLight`
- `arrowLeft4SquareThin`
- `arrowLeft5Circle`
- `arrowLeft5CircleBold`
- `arrowLeft5CircleDuotone`
- `arrowLeft5CircleFill`
- `arrowLeft5CircleLight`
- `arrowLeft5CircleThin`
- `arrowLeft6Circle`
- `arrowLeft6CircleBold`
- `arrowLeft6CircleDuotone`
- `arrowLeft6CircleFill`
- `arrowLeft6CircleLight`
- `arrowLeft6CircleThin`
- `arrowRight1`
- `arrowRight1Bold`
- `arrowRight1Duotone`
- `arrowRight1Fill`
- `arrowRight1Light`
- `arrowRight1Thin`
- `arrowRight2`
- `arrowRight2Bold`
- `arrowRight2Duotone`
- `arrowRight2Fill`
- `arrowRight2Light`
- `arrowRight2Thin`
- `arrowRight3Square`
- `arrowRight3SquareBold`
- `arrowRight3SquareDuotone`
- `arrowRight3SquareFill`
- `arrowRight3SquareLight`
- `arrowRight3SquareThin`
- `arrowRight4Square`
- `arrowRight4SquareBold`
- `arrowRight4SquareDuotone`
- `arrowRight4SquareFill`
- `arrowRight4SquareLight`
- `arrowRight4SquareThin`
- `arrowRight5Circle`
- `arrowRight5CircleBold`
- `arrowRight5CircleDuotone`
- `arrowRight5CircleFill`
- `arrowRight5CircleLight`
- `arrowRight5CircleThin`
- `arrowRight6Circle`
- `arrowRight6CircleBold`
- `arrowRight6CircleDuotone`
- `arrowRight6CircleFill`
- `arrowRight6CircleLight`
- `arrowRight6CircleThin`
- `arrowTopLeft1`
- `arrowTopLeft1Bold`
- `arrowTopLeft1Fill`
- `arrowTopLeft1Light`
- `arrowTopLeft1Thin`
- `arrowTopLeft2`
- `arrowTopLeft2Bold`
- `arrowTopLeft2Fill`
- `arrowTopLeft2Light`
- `arrowTopLeft2Thin`
- `arrowTopLeft3Square`
- `arrowTopLeft3SquareBold`
- `arrowTopLeft3SquareDuotone`
- `arrowTopLeft3SquareFill`
- `arrowTopLeft3SquareLight`
- `arrowTopLeft3SquareThin`
- `arrowTopLeft4Square`
- `arrowTopLeft4SquareBold`
- `arrowTopLeft4SquareDuotone`
- `arrowTopLeft4SquareFill`
- `arrowTopLeft4SquareLight`
- `arrowTopLeft4SquareThin`
- `arrowTopLeft5Circle`
- `arrowTopLeft5CircleBold`
- `arrowTopLeft5CircleDuotone`
- `arrowTopLeft5CircleFill`
- `arrowTopLeft5CircleLight`
- `arrowTopLeft5CircleThin`
- `arrowTopLeft6Circle`
- `arrowTopLeft6CircleBold`
- `arrowTopLeft6CircleDuotone`
- `arrowTopLeft6CircleFill`
- `arrowTopLeft6CircleLight`
- `arrowTopLeft6CircleThin`
- `arrowTopRight1`
- `arrowTopRight1Bold`
- `arrowTopRight1Fill`
- `arrowTopRight1Light`
- `arrowTopRight1Thin`
- `arrowTopRight2`
- `arrowTopRight2Bold`
- `arrowTopRight2Fill`
- `arrowTopRight2Light`
- `arrowTopRight2Thin`
- `arrowTopRight3Square`
- `arrowTopRight3SquareBold`
- `arrowTopRight3SquareDuotone`
- `arrowTopRight3SquareFill`
- `arrowTopRight3SquareLight`
- `arrowTopRight3SquareThin`
- `arrowTopRight5Circle`
- `arrowTopRight5CircleBold`
- `arrowTopRight5CircleDuotone`
- `arrowTopRight5CircleFill`
- `arrowTopRight5CircleLight`
- `arrowTopRight5CircleThin`
- `arrowTopRight6Circle`
- `arrowTopRight6CircleBold`
- `arrowTopRight6CircleDuotone`
- `arrowTopRight6CircleFill`
- `arrowTopRight6CircleLight`
- `arrowTopRight6CircleThin`
- `arrowUp1`
- `arrowUp1Bold`
- `arrowUp1Duotone`
- `arrowUp1Fill`
- `arrowUp1Light`
- `arrowUp1Thin`
- `arrowUp2`
- `arrowUp2Bold`
- `arrowUp2Duotone`
- `arrowUp2Fill`
- `arrowUp2Light`
- `arrowUp2Thin`
- `arrowUp3Square`
- `arrowUp3SquareBold`
- `arrowUp3SquareDuotone`
- `arrowUp3SquareFill`
- `arrowUp3SquareLight`
- `arrowUp3SquareThin`
- `arrowUp4Square`
- `arrowUp4SquareBold`
- `arrowUp4SquareDuotone`
- `arrowUp4SquareFill`
- `arrowUp4SquareLight`
- `arrowUp4SquareThin`
- `arrowUp5Circle`
- `arrowUp5CircleBold`
- `arrowUp5CircleDuotone`
- `arrowUp5CircleFill`
- `arrowUp5CircleLight`
- `arrowUp5CircleThin`
- `arrowUp6Circle`
- `arrowUp6CircleBold`
- `arrowUp6CircleDuotone`
- `arrowUp6CircleFill`
- `arrowUp6CircleLight`
- `arrowUp6CircleThin`
- `attachment`
- `attachmentBold`
- `attachmentDuotone`
- `attachmentFill`
- `attachmentLight`
- `attachmentThin`
- `attentionCircle`
- `attentionCircleBold`
- `attentionCircleDuotone`
- `attentionCircleFill`
- `attentionCircleLight`
- `attentionCircleThin`
- `attentionSquare`
- `attentionSquareBold`
- `attentionSquareDuotone`
- `attentionSquareFill`
- `attentionSquareLight`
- `attentionSquareThin`
- `backspace`
- `backspaceBold`
- `backspaceDuotone`
- `backspaceFill`
- `backspaceLight`
- `backspaceThin`
- `badge`
- `badgeBold`
- `badgeDuotone`
- `badgeFill`
- `badgeLight`
- `badgeThin`
- `bluetooth`
- `bluetoothBold`
- `bluetoothDuotone`
- `bluetoothFill`
- `bluetoothLight`
- `bluetoothThin`
- `bookmark`
- `bookmarkBold`
- `bookmarkDuotone`
- `bookmarkFill`
- `bookmarkLight`
- `bookmarkOff`
- `bookmarkOffBold`
- `bookmarkOffDuotone`
- `bookmarkOffFill`
- `bookmarkOffLight`
- `bookmarkOffThin`
- `bookmarkThin`
- `box`
- `boxBold`
- `boxDuotone`
- `boxFill`
- `boxLight`
- `boxThin`
- `briefcase`
- `briefcaseBold`
- `briefcaseDuotone`
- `briefcaseFill`
- `briefcaseLight`
- `briefcaseThin`
- `calculator`
- `calculatorBold`
- `calculatorDuotone`
- `calculatorFill`
- `calculatorLight`
- `calculatorThin`
- `calendar1`
- `calendar1Bold`
- `calendar1Duotone`
- `calendar1Fill`
- `calendar1Light`
- `calendar1Thin`
- `calendar2`
- `calendar2Bold`
- `calendar2Duotone`
- `calendar2Fill`
- `calendar2Light`
- `calendar2Thin`
- `calendarAdd`
- `calendarAddBold`
- `calendarAddDuotone`
- `calendarAddFill`
- `calendarAddLight`
- `calendarAddThin`
- `calendarRemove`
- `calendarRemoveBold`
- `calendarRemoveDuotone`
- `calendarRemoveFill`
- `calendarRemoveLight`
- `calendarRemoveThin`
- `cameraImage`
- `cameraImageBold`
- `cameraImageDuotone`
- `cameraImageFill`
- `cameraImageLight`
- `cameraImageThin`
- `cameraVideo`
- `cameraVideoBold`
- `cameraVideoDuotone`
- `cameraVideoFill`
- `cameraVideoLight`
- `cameraVideoThin`
- `category`
- `categoryBold`
- `categoryDuotone`
- `categoryFill`
- `categoryLight`
- `categoryThin`
- `certificateBadge`
- `certificateBadgeBold`
- `certificateBadgeDuotone`
- `certificateBadgeFill`
- `certificateBadgeLight`
- `certificateBadgeThin`
- `check`
- `checkBold`
- `checkCircle1`
- `checkCircle1Bold`
- `checkCircle1Duotone`
- `checkCircle1Fill`
- `checkCircle1Light`
- `checkCircle1Thin`
- `checkCircle2`
- `checkCircle2Bold`
- `checkCircle2Duotone`
- `checkCircle2Fill`
- `checkCircle2Light`
- `checkCircle2Thin`
- `checkDuotone`
- `checkFill`
- `checkLight`
- `checkSquare`
- `checkSquareBold`
- `checkSquareDuotone`
- `checkSquareFill`
- `checkSquareLight`
- `checkSquareThin`
- `checkThin`
- `cheque`
- `chequeBold`
- `chequeDuotone`
- `chequeFill`
- `chequeLight`
- `chequeThin`
- `clock`
- `clockBold`
- `clockDuotone`
- `clockFill`
- `clockLight`
- `clockThin`
- `close`
- `closeBold`
- `closeCircle1`
- `closeCircle1Bold`
- `closeCircle1Duotone`
- `closeCircle1Fill`
- `closeCircle1Light`
- `closeCircle1Thin`
- `closeCircle2`
- `closeCircle2Bold`
- `closeCircle2Duotone`
- `closeCircle2Fill`
- `closeCircle2Light`
- `closeCircle2Thin`
- `closeDuotone`
- `closeFill`
- `closeLight`
- `closeSquare`
- `closeSquareBold`
- `closeSquareDuotone`
- `closeSquareFill`
- `closeSquareLight`
- `closeSquareThin`
- `closeThin`
- `cloud`
- `cloudAdd`
- `cloudAddBold`
- `cloudAddDuotone`
- `cloudAddFill`
- `cloudAddLight`
- `cloudAddThin`
- `cloudBold`
- `cloudClock`
- `cloudClockBold`
- `cloudClockDuotone`
- `cloudClockFill`
- `cloudClockLight`
- `cloudClockThin`
- `cloudDownload`
- `cloudDownloadBold`
- `cloudDownloadDuotone`
- `cloudDownloadFill`
- `cloudDownloadLight`
- `cloudDownloadThin`
- `cloudDuotone`
- `cloudError`
- `cloudErrorBold`
- `cloudErrorDuotone`
- `cloudErrorFill`
- `cloudErrorLight`
- `cloudErrorThin`
- `cloudFill`
- `cloudLight`
- `cloudNo`
- `cloudNoBold`
- `cloudNoDuotone`
- `cloudNoFill`
- `cloudNoLight`
- `cloudNoThin`
- `cloudOff`
- `cloudOffBold`
- `cloudOffDuotone`
- `cloudOffFill`
- `cloudOffLight`
- `cloudOffThin`
- `cloudRemove`
- `cloudRemoveBold`
- `cloudRemoveDuotone`
- `cloudRemoveFill`
- `cloudRemoveLight`
- `cloudRemoveThin`
- `cloudThin`
- `cloudUpload`
- `cloudUploadBold`
- `cloudUploadDuotone`
- `cloudUploadFill`
- `cloudUploadLight`
- `cloudUploadThin`
- `cloudYes`
- `cloudYesBold`
- `cloudYesDuotone`
- `cloudYesFill`
- `cloudYesLight`
- `cloudYesThin`
- `comment`
- `commentAdd`
- `commentAddBold`
- `commentAddDuotone`
- `commentAddFill`
- `commentAddLight`
- `commentAddThin`
- `commentBold`
- `commentCheck`
- `commentCheckBold`
- `commentCheckDuotone`
- `commentCheckFill`
- `commentCheckLight`
- `commentCheckThin`
- `commentClose`
- `commentCloseBold`
- `commentCloseDuotone`
- `commentCloseFill`
- `commentCloseLight`
- `commentCloseThin`
- `commentDots`
- `commentDotsBold`
- `commentDotsDuotone`
- `commentDotsFill`
- `commentDotsLight`
- `commentDotsThin`
- `commentDuotone`
- `commentFill`
- `commentLight`
- `commentRemove`
- `commentRemoveBold`
- `commentRemoveDuotone`
- `commentRemoveFill`
- `commentRemoveLight`
- `commentRemoveThin`
- `commentThin`
- `compare`
- `compareBold`
- `compareDuotone`
- `compareFill`
- `compareLight`
- `compareThin`
- `component`
- `componentBold`
- `componentDuotone`
- `componentFill`
- `componentLight`
- `componentThin`
- `confusedFace`
- `confusedFaceBold`
- `confusedFaceDuotone`
- `confusedFaceFill`
- `confusedFaceLight`
- `confusedFaceThin`
- `copy`
- `copyBold`
- `copyDuotone`
- `copyFill`
- `copyLight`
- `copyThin`
- `creditCard`
- `creditCardBold`
- `creditCardDuotone`
- `creditCardFill`
- `creditCardLight`
- `creditCardThin`
- `cursor`
- `cursorBold`
- `cursorDuotone`
- `cursorFill`
- `cursorLight`
- `cursorThin`
- `delivery`
- `deliveryBold`
- `deliveryDuotone`
- `deliveryFast`
- `deliveryFastBold`
- `deliveryFastDuotone`
- `deliveryFastFill`
- `deliveryFastLight`
- `deliveryFastThin`
- `deliveryFill`
- `deliveryFree`
- `deliveryFreeBold`
- `deliveryFreeDuotone`
- `deliveryFreeFill`
- `deliveryFreeLight`
- `deliveryFreeThin`
- `deliveryLight`
- `deliveryThin`
- `disappointedFace`
- `disappointedFaceBold`
- `disappointedFaceDuotone`
- `disappointedFaceFill`
- `disappointedFaceLight`
- `disappointedFaceThin`
- `discount`
- `discountBold`
- `discountDuotone`
- `discountFill`
- `discountLight`
- `discountThin`
- `discover`
- `discoverBold`
- `discoverDuotone`
- `discoverFill`
- `discoverLight`
- `discoverThin`
- `dislike`
- `dislikeBold`
- `dislikeDuotone`
- `dislikeFill`
- `dislikeLight`
- `dislikeThin`
- `doRedo`
- `doRedoBold`
- `doRedoDuotone`
- `doRedoFill`
- `doRedoLight`
- `doRedoThin`
- `doUndo`
- `doUndoBold`
- `doUndoDuotone`
- `doUndoFill`
- `doUndoLight`
- `doUndoThin`
- `download`
- `downloadBold`
- `downloadFill`
- `downloadLight`
- `downloadThin`
- `edit`
- `editBold`
- `editDuotone`
- `editFill`
- `editLight`
- `editThin`
- `email`
- `emailBold`
- `emailDuotone`
- `emailFill`
- `emailLight`
- `emailThin`
- `enter`
- `enterBold`
- `enterDuotone`
- `enterFill`
- `enterLight`
- `enterThin`
- `exit`
- `exitBold`
- `exitFill`
- `exitLight`
- `exitThin`
- `expressionlessFace`
- `expressionlessFaceBold`
- `expressionlessFaceDuotone`
- `expressionlessFaceFill`
- `expressionlessFaceLight`
- `expressionlessFaceThin`
- `eye`
- `eyeBold`
- `eyeDuotone`
- `eyeFill`
- `eyeLight`
- `eyeOff`
- `eyeOffBold`
- `eyeOffDuotone`
- `eyeOffFill`
- `eyeOffLight`
- `eyeOffThin`
- `eyeThin`
- `faceWithOpenMouth`
- `faceWithOpenMouthBold`
- `faceWithOpenMouthDuotone`
- `faceWithOpenMouthFill`
- `faceWithOpenMouthLight`
- `faceWithOpenMouthThin`
- `faceWithoutMouth`
- `faceWithoutMouthBold`
- `faceWithoutMouthDuotone`
- `faceWithoutMouthFill`
- `faceWithoutMouthLight`
- `faceWithoutMouthThin`
- `file`
- `fileAdd`
- `fileAddBold`
- `fileAddDuotone`
- `fileAddFill`
- `fileAddLight`
- `fileAddThin`
- `fileAudio`
- `fileAudioBold`
- `fileAudioDuotone`
- `fileAudioFill`
- `fileAudioLight`
- `fileAudioThin`
- `fileBold`
- `fileCheck`
- `fileCheckBold`
- `fileCheckDuotone`
- `fileCheckFill`
- `fileCheckLight`
- `fileCheckThin`
- `fileClose`
- `fileCloseBold`
- `fileCloseDuotone`
- `fileCloseFill`
- `fileCloseLight`
- `fileCloseThin`
- `fileDocument`
- `fileDocumentBold`
- `fileDocumentDuotone`
- `fileDocumentFill`
- `fileDocumentLight`
- `fileDocumentThin`
- `fileDuotone`
- `fileFill`
- `fileImage`
- `fileImageBold`
- `fileImageDuotone`
- `fileImageFill`
- `fileImageLight`
- `fileImageThin`
- `fileLight`
- `fileRemove`
- `fileRemoveBold`
- `fileRemoveDuotone`
- `fileRemoveFill`
- `fileRemoveLight`
- `fileRemoveThin`
- `fileThin`
- `fileVideo`
- `fileVideoBold`
- `fileVideoDuotone`
- `fileVideoFill`
- `fileVideoLight`
- `fileVideoThin`
- `flag`
- `flagBold`
- `flagDuotone`
- `flagFill`
- `flagLight`
- `flagThin`
- `folder`
- `folderAdd`
- `folderAddBold`
- `folderAddDuotone`
- `folderAddFill`
- `folderAddLight`
- `folderAddThin`
- `folderBold`
- `folderCheck`
- `folderCheckBold`
- `folderCheckDuotone`
- `folderCheckFill`
- `folderCheckLight`
- `folderCheckThin`
- `folderClose`
- `folderCloseBold`
- `folderCloseDuotone`
- `folderCloseFill`
- `folderCloseLight`
- `folderCloseThin`
- `folderDocument`
- `folderDocumentBold`
- `folderDocumentDuotone`
- `folderDocumentFill`
- `folderDocumentLight`
- `folderDocumentThin`
- `folderDuotone`
- `folderFill`
- `folderImage`
- `folderImageBold`
- `folderImageDuotone`
- `folderImageFill`
- `folderImageLight`
- `folderImageThin`
- `folderLight`
- `folderMusic`
- `folderMusicBold`
- `folderMusicDuotone`
- `folderMusicFill`
- `folderMusicLight`
- `folderMusicThin`
- `folderRemove`
- `folderRemoveBold`
- `folderRemoveDuotone`
- `folderRemoveFill`
- `folderRemoveLight`
- `folderRemoveThin`
- `folderThin`
- `folderVideo`
- `folderVideoBold`
- `folderVideoDuotone`
- `folderVideoFill`
- `folderVideoLight`
- `folderVideoThin`
- `frame`
- `frameBold`
- `frameDuotone`
- `frameFill`
- `frameLight`
- `frameThin`
- `frowningFace`
- `frowningFaceBold`
- `frowningFaceDuotone`
- `frowningFaceFill`
- `frowningFaceLight`
- `frowningFaceThin`
- `funnel`
- `funnelBold`
- `funnelDuotone`
- `funnelFill`
- `funnelLight`
- `funnelThin`
- `gift`
- `giftBold`
- `giftDuotone`
- `giftFill`
- `giftLight`
- `giftThin`
- `headphone`
- `headphoneBold`
- `headphoneDuotone`
- `headphoneFill`
- `headphoneLight`
- `headphoneThin`
- `heart`
- `heartBold`
- `heartDuotone`
- `heartFill`
- `heartLight`
- `heartOff`
- `heartOffBold`
- `heartOffDuotone`
- `heartOffFill`
- `heartOffLight`
- `heartOffThin`
- `heartThin`
- `history`
- `historyBold`
- `historyDuotone`
- `historyFill`
- `historyLight`
- `historyThin`
- `home`
- `homeBold`
- `homeDuotone`
- `homeFill`
- `homeLight`
- `homeThin`
- `informationCircle`
- `informationCircleBold`
- `informationCircleDuotone`
- `informationCircleFill`
- `informationCircleLight`
- `informationCircleThin`
- `informationSquare`
- `informationSquareBold`
- `informationSquareDuotone`
- `informationSquareFill`
- `informationSquareLight`
- `informationSquareThin`
- `invoice`
- `invoiceBold`
- `invoiceDuotone`
- `invoiceFill`
- `invoiceLight`
- `invoiceThin`
- `kissingFace`
- `kissingFaceBold`
- `kissingFaceDuotone`
- `kissingFaceFill`
- `kissingFaceLight`
- `kissingFaceThin`
- `kissingFaceWithSmilingEyes`
- `kissingFaceWithSmilingEyesBold`
- `kissingFaceWithSmilingEyesDuotone`
- `kissingFaceWithSmilingEyesFill`
- `kissingFaceWithSmilingEyesLight`
- `kissingFaceWithSmilingEyesThin`
- `lightning1`
- `lightning1Bold`
- `lightning1Duotone`
- `lightning1Fill`
- `lightning1Light`
- `lightning1Thin`
- `lightning2`
- `lightning2Bold`
- `lightning2Duotone`
- `lightning2Fill`
- `lightning2Light`
- `lightning2Thin`
- `like`
- `likeBold`
- `likeDuotone`
- `likeFill`
- `likeLight`
- `likeThin`
- `link`
- `linkBold`
- `linkDuotone`
- `linkExternal`
- `linkExternalBold`
- `linkExternalDuotone`
- `linkExternalFill`
- `linkExternalLight`
- `linkExternalThin`
- `linkFill`
- `linkLight`
- `linkThin`
- `location`
- `locationBold`
- `locationDuotone`
- `locationFill`
- `locationLight`
- `locationPin`
- `locationPinBold`
- `locationPinDuotone`
- `locationPinFill`
- `locationPinLight`
- `locationPinOff`
- `locationPinOffBold`
- `locationPinOffDuotone`
- `locationPinOffFill`
- `locationPinOffLight`
- `locationPinOffThin`
- `locationPinThin`
- `locationThin`
- `lock`
- `lockBold`
- `lockDuotone`
- `lockFill`
- `lockLight`
- `lockOff`
- `lockOffBold`
- `lockOffDuotone`
- `lockOffFill`
- `lockOffLight`
- `lockOffThin`
- `lockThin`
- `menuBurgerHorizontal`
- `menuBurgerHorizontalBold`
- `menuBurgerHorizontalDuotone`
- `menuBurgerHorizontalFill`
- `menuBurgerHorizontalLight`
- `menuBurgerHorizontalThin`
- `menuBurgerVertical`
- `menuBurgerVerticalBold`
- `menuBurgerVerticalDuotone`
- `menuBurgerVerticalFill`
- `menuBurgerVerticalLight`
- `menuBurgerVerticalThin`
- `menuKebabHorizontal`
- `menuKebabHorizontalBold`
- `menuKebabHorizontalCircle`
- `menuKebabHorizontalCircleBold`
- `menuKebabHorizontalCircleDuotone`
- `menuKebabHorizontalCircleFill`
- `menuKebabHorizontalCircleLight`
- `menuKebabHorizontalCircleThin`
- `menuKebabHorizontalFill`
- `menuKebabHorizontalLight`
- `menuKebabHorizontalSquare`
- `menuKebabHorizontalSquareBold`
- `menuKebabHorizontalSquareDuotone`
- `menuKebabHorizontalSquareFill`
- `menuKebabHorizontalSquareLight`
- `menuKebabHorizontalSquareThin`
- `menuKebabHorizontalThin`
- `menuKebabVertical`
- `menuKebabVerticalBold`
- `menuKebabVerticalCircle`
- `menuKebabVerticalCircleBold`
- `menuKebabVerticalCircleDuotone`
- `menuKebabVerticalCircleFill`
- `menuKebabVerticalCircleLight`
- `menuKebabVerticalCircleThin`
- `menuKebabVerticalFill`
- `menuKebabVerticalLight`
- `menuKebabVerticalSquare`
- `menuKebabVerticalSquareBold`
- `menuKebabVerticalSquareDuotone`
- `menuKebabVerticalSquareFill`
- `menuKebabVerticalSquareLight`
- `menuKebabVerticalSquareThin`
- `menuKebabVerticalThin`
- `microphone`
- `microphoneBold`
- `microphoneDuotone`
- `microphoneFill`
- `microphoneLight`
- `microphoneOff`
- `microphoneOffBold`
- `microphoneOffDuotone`
- `microphoneOffFill`
- `microphoneOffLight`
- `microphoneOffThin`
- `microphoneThin`
- `modeDark`
- `modeDarkBold`
- `modeDarkDuotone`
- `modeDarkFill`
- `modeDarkLight`
- `modeDarkThin`
- `modeLight`
- `modeLightBold`
- `modeLightDuotone`
- `modeLightFill`
- `modeLightLight`
- `modeLightThin`
- `mouse`
- `mouseBold`
- `mouseDuotone`
- `mouseFill`
- `mouseLight`
- `mouseThin`
- `move`
- `moveBold`
- `moveDuotone`
- `moveFill`
- `moveLight`
- `moveThin`
- `music1`
- `music1Bold`
- `music1Duotone`
- `music1Fill`
- `music1Light`
- `music1Thin`
- `music2`
- `music2Bold`
- `music2Duotone`
- `music2Fill`
- `music2Light`
- `music2Thin`
- `musicAlbum`
- `musicAlbumBold`
- `musicAlbumDuotone`
- `musicAlbumFill`
- `musicAlbumLight`
- `musicAlbumThin`
- `musicArtist`
- `musicArtistBold`
- `musicArtistDuotone`
- `musicArtistFill`
- `musicArtistLight`
- `musicArtistThin`
- `neutralFace`
- `neutralFaceBold`
- `neutralFaceDuotone`
- `neutralFaceFill`
- `neutralFaceLight`
- `neutralFaceThin`
- `news`
- `newsBold`
- `newsDuotone`
- `newsFill`
- `newsLight`
- `newsThin`
- `notification`
- `notificationBold`
- `notificationDuotone`
- `notificationFill`
- `notificationLight`
- `notificationOff`
- `notificationOffBold`
- `notificationOffDuotone`
- `notificationOffFill`
- `notificationOffLight`
- `notificationOffThin`
- `notificationThin`
- `number0`
- `number0Bold`
- `number0Circle`
- `number0CircleBold`
- `number0CircleDuotone`
- `number0CircleFill`
- `number0CircleLight`
- `number0CircleThin`
- `number0Duotone`
- `number0Fill`
- `number0Light`
- `number0Square`
- `number0SquareBold`
- `number0SquareDuotone`
- `number0SquareFill`
- `number0SquareLight`
- `number0SquareThin`
- `number0Thin`
- `number1`
- `number1Bold`
- `number1Circle`
- `number1CircleBold`
- `number1CircleDuotone`
- `number1CircleFill`
- `number1CircleLight`
- `number1CircleThin`
- `number1Fill`
- `number1Light`
- `number1Square`
- `number1SquareBold`
- `number1SquareDuotone`
- `number1SquareFill`
- `number1SquareLight`
- `number1SquareThin`
- `number1Thin`
- `number2`
- `number2Bold`
- `number2Circle`
- `number2CircleBold`
- `number2CircleDuotone`
- `number2CircleFill`
- `number2CircleLight`
- `number2CircleThin`
- `number2Duotone`
- `number2Fill`
- `number2Light`
- `number2Square`
- `number2SquareBold`
- `number2SquareDuotone`
- `number2SquareFill`
- `number2SquareLight`
- `number2SquareThin`
- `number2Thin`
- `number3`
- `number3Bold`
- `number3Circle`
- `number3CircleBold`
- `number3CircleDuotone`
- `number3CircleFill`
- `number3CircleLight`
- `number3CircleThin`
- `number3Fill`
- `number3Light`
- `number3Square`
- `number3SquareBold`
- `number3SquareDuotone`
- `number3SquareFill`
- `number3SquareLight`
- `number3SquareThin`
- `number3Thin`
- `number4`
- `number4Bold`
- `number4Circle`
- `number4CircleBold`
- `number4CircleDuotone`
- `number4CircleFill`
- `number4CircleLight`
- `number4CircleThin`
- `number4Fill`
- `number4Light`
- `number4Square`
- `number4SquareBold`
- `number4SquareDuotone`
- `number4SquareFill`
- `number4SquareLight`
- `number4SquareThin`
- `number4Thin`
- `number5`
- `number5Bold`
- `number5Circle`
- `number5CircleBold`
- `number5CircleDuotone`
- `number5CircleFill`
- `number5CircleLight`
- `number5CircleThin`
- `number5Fill`
- `number5Light`
- `number5Square`
- `number5SquareBold`
- `number5SquareDuotone`
- `number5SquareFill`
- `number5SquareLight`
- `number5SquareThin`
- `number5Thin`
- `number6`
- `number6Bold`
- `number6Circle`
- `number6CircleBold`
- `number6CircleDuotone`
- `number6CircleFill`
- `number6CircleLight`
- `number6CircleThin`
- `number6Duotone`
- `number6Fill`
- `number6Light`
- `number6Square`
- `number6SquareBold`
- `number6SquareDuotone`
- `number6SquareFill`
- `number6SquareLight`
- `number6SquareThin`
- `number6Thin`
- `number7`
- `number7Bold`
- `number7Circle`
- `number7CircleBold`
- `number7CircleDuotone`
- `number7CircleFill`
- `number7CircleLight`
- `number7CircleThin`
- `number7Fill`
- `number7Light`
- `number7Square`
- `number7SquareBold`
- `number7SquareDuotone`
- `number7SquareFill`
- `number7SquareLight`
- `number7SquareThin`
- `number7Thin`
- `number8`
- `number8Bold`
- `number8Circle`
- `number8CircleBold`
- `number8CircleDuotone`
- `number8CircleFill`
- `number8CircleLight`
- `number8CircleThin`
- `number8Duotone`
- `number8Fill`
- `number8Light`
- `number8Square`
- `number8SquareBold`
- `number8SquareDuotone`
- `number8SquareFill`
- `number8SquareLight`
- `number8SquareThin`
- `number8Thin`
- `number9`
- `number9Bold`
- `number9Circle`
- `number9CircleBold`
- `number9CircleDuotone`
- `number9CircleFill`
- `number9CircleLight`
- `number9CircleThin`
- `number9Duotone`
- `number9Fill`
- `number9Light`
- `number9Square`
- `number9SquareBold`
- `number9SquareDuotone`
- `number9SquareFill`
- `number9SquareLight`
- `number9SquareThin`
- `number9Thin`
- `options`
- `optionsBold`
- `optionsDuotone`
- `optionsFill`
- `optionsLight`
- `optionsThin`
- `pen`
- `penBold`
- `penDuotone`
- `penFill`
- `penLight`
- `penThin`
- `pensiveFace`
- `pensiveFaceBold`
- `pensiveFaceDuotone`
- `pensiveFaceFill`
- `pensiveFaceLight`
- `pensiveFaceThin`
- `phone`
- `phoneBold`
- `phoneDuotone`
- `phoneFill`
- `phoneLight`
- `phoneOff`
- `phoneOffBold`
- `phoneOffDuotone`
- `phoneOffFill`
- `phoneOffLight`
- `phoneOffThin`
- `phoneThin`
- `playCircle`
- `playCircleBold`
- `playCircleDuotone`
- `playCircleFill`
- `playCircleLight`
- `playCircleThin`
- `playerEnd`
- `playerEndBold`
- `playerEndDuotone`
- `playerEndFill`
- `playerEndLight`
- `playerEndThin`
- `playerNext`
- `playerNextBold`
- `playerNextDuotone`
- `playerNextFill`
- `playerNextLight`
- `playerNextThin`
- `playerPause`
- `playerPauseBold`
- `playerPauseDuotone`
- `playerPauseFill`
- `playerPauseLight`
- `playerPauseThin`
- `playerPlay`
- `playerPlayBold`
- `playerPlayDuotone`
- `playerPlayFill`
- `playerPlayLight`
- `playerPlayThin`
- `playerPrevious`
- `playerPreviousBold`
- `playerPreviousDuotone`
- `playerPreviousFill`
- `playerPreviousLight`
- `playerPreviousThin`
- `playerStart`
- `playerStartBold`
- `playerStartDuotone`
- `playerStartFill`
- `playerStartLight`
- `playerStartThin`
- `playerStop`
- `playerStopBold`
- `playerStopDuotone`
- `playerStopFill`
- `playerStopLight`
- `playerStopThin`
- `playlist`
- `playlistBold`
- `playlistFill`
- `playlistLight`
- `playlistRepeatList`
- `playlistRepeatListBold`
- `playlistRepeatListFill`
- `playlistRepeatListLight`
- `playlistRepeatListThin`
- `playlistRepeatSong`
- `playlistRepeatSongBold`
- `playlistRepeatSongFill`
- `playlistRepeatSongLight`
- `playlistRepeatSongThin`
- `playlistShuffle`
- `playlistShuffleBold`
- `playlistShuffleDuotone`
- `playlistShuffleFill`
- `playlistShuffleLight`
- `playlistShuffleThin`
- `playlistThin`
- `printer`
- `printerBold`
- `printerDuotone`
- `printerFill`
- `printerLight`
- `printerThin`
- `profile`
- `profileBold`
- `profileCircle`
- `profileCircleBold`
- `profileCircleDuotone`
- `profileCircleFill`
- `profileCircleLight`
- `profileCircleThin`
- `profileDuotone`
- `profileFill`
- `profileLight`
- `profileThin`
- `questionMarkCircle`
- `questionMarkCircleBold`
- `questionMarkCircleDuotone`
- `questionMarkCircleFill`
- `questionMarkCircleLight`
- `questionMarkCircleThin`
- `questionMarkSquare`
- `questionMarkSquareBold`
- `questionMarkSquareDuotone`
- `questionMarkSquareFill`
- `questionMarkSquareLight`
- `questionMarkSquareThin`
- `relievedFace`
- `relievedFaceBold`
- `relievedFaceDuotone`
- `relievedFaceFill`
- `relievedFaceLight`
- `relievedFaceThin`
- `restart`
- `restartBold`
- `restartDuotone`
- `restartFill`
- `restartLight`
- `restartThin`
- `scanner`
- `scannerBold`
- `scannerFill`
- `scannerLight`
- `scannerThin`
- `screenFull`
- `screenFullBold`
- `screenFullDuotone`
- `screenFullFill`
- `screenFullLight`
- `screenFullThin`
- `screenNormal`
- `screenNormalBold`
- `screenNormalDuotone`
- `screenNormalFill`
- `screenNormalLight`
- `screenNormalThin`
- `search`
- `searchBold`
- `searchDuotone`
- `searchFill`
- `searchLight`
- `searchThin`
- `send`
- `sendBold`
- `sendDuotone`
- `sendFill`
- `sendLight`
- `sendThin`
- `settings`
- `settingsBold`
- `settingsDuotone`
- `settingsFill`
- `settingsLight`
- `settingsThin`
- `share1`
- `share1Bold`
- `share1Duotone`
- `share1Fill`
- `share1Light`
- `share1Thin`
- `share2`
- `share2Bold`
- `share2Duotone`
- `share2Fill`
- `share2Light`
- `share2Thin`
- `shield`
- `shieldBold`
- `shieldDuotone`
- `shieldFill`
- `shieldLight`
- `shieldNo`
- `shieldNoBold`
- `shieldNoDuotone`
- `shieldNoFill`
- `shieldNoLight`
- `shieldNoThin`
- `shieldOff`
- `shieldOffBold`
- `shieldOffDuotone`
- `shieldOffFill`
- `shieldOffLight`
- `shieldOffThin`
- `shieldThin`
- `shieldYes`
- `shieldYesBold`
- `shieldYesDuotone`
- `shieldYesFill`
- `shieldYesLight`
- `shieldYesThin`
- `shoppingBag`
- `shoppingBagBold`
- `shoppingBagDuotone`
- `shoppingBagFill`
- `shoppingBagLight`
- `shoppingBagThin`
- `shoppingCard`
- `shoppingCardAdd`
- `shoppingCardAddBold`
- `shoppingCardAddDuotone`
- `shoppingCardAddFill`
- `shoppingCardAddLight`
- `shoppingCardAddThin`
- `shoppingCardBold`
- `shoppingCardDuotone`
- `shoppingCardFill`
- `shoppingCardLight`
- `shoppingCardRemove`
- `shoppingCardRemoveBold`
- `shoppingCardRemoveDuotone`
- `shoppingCardRemoveFill`
- `shoppingCardRemoveLight`
- `shoppingCardRemoveThin`
- `shoppingCardThin`
- `signDivision`
- `signDivisionBold`
- `signDivisionCircle`
- `signDivisionCircleBold`
- `signDivisionCircleDuotone`
- `signDivisionCircleFill`
- `signDivisionCircleLight`
- `signDivisionCircleThin`
- `signDivisionDuotone`
- `signDivisionFill`
- `signDivisionLight`
- `signDivisionSlash`
- `signDivisionSlashBold`
- `signDivisionSlashFill`
- `signDivisionSlashLight`
- `signDivisionSlashThin`
- `signDivisionSquare`
- `signDivisionSquareBold`
- `signDivisionSquareDuotone`
- `signDivisionSquareFill`
- `signDivisionSquareLight`
- `signDivisionSquareThin`
- `signDivisionThin`
- `signEqual`
- `signEqualBold`
- `signEqualFill`
- `signEqualLight`
- `signEqualThin`
- `signF`
- `signFBold`
- `signFFill`
- `signFLight`
- `signFThin`
- `signFactorial`
- `signFactorialBold`
- `signFactorialFill`
- `signFactorialLight`
- `signFactorialThin`
- `signLemniscate`
- `signLemniscateBold`
- `signLemniscateDuotone`
- `signLemniscateFill`
- `signLemniscateLight`
- `signLemniscateThin`
- `signMinus`
- `signMinusBold`
- `signMinusCircle`
- `signMinusCircleBold`
- `signMinusCircleDuotone`
- `signMinusCircleFill`
- `signMinusCircleLight`
- `signMinusCircleThin`
- `signMinusFill`
- `signMinusLight`
- `signMinusSquare`
- `signMinusSquareBold`
- `signMinusSquareDuotone`
- `signMinusSquareFill`
- `signMinusSquareLight`
- `signMinusSquareThin`
- `signMinusThin`
- `signPercent`
- `signPercentBold`
- `signPercentFill`
- `signPercentLight`
- `signPercentThin`
- `signPi`
- `signPiBold`
- `signPiFill`
- `signPiLight`
- `signPiThin`
- `signPlus`
- `signPlusBold`
- `signPlusCircle`
- `signPlusCircleBold`
- `signPlusCircleDuotone`
- `signPlusCircleFill`
- `signPlusCircleLight`
- `signPlusCircleThin`
- `signPlusFill`
- `signPlusLight`
- `signPlusMinus`
- `signPlusMinusBold`
- `signPlusMinusFill`
- `signPlusMinusLight`
- `signPlusMinusThin`
- `signPlusSquare`
- `signPlusSquareBold`
- `signPlusSquareDuotone`
- `signPlusSquareFill`
- `signPlusSquareLight`
- `signPlusSquareThin`
- `signPlusThin`
- `signRadical`
- `signRadicalBold`
- `signRadicalFill`
- `signRadicalLight`
- `signRadicalThin`
- `signTimes`
- `signTimesBold`
- `signTimesCircle`
- `signTimesCircleBold`
- `signTimesCircleDuotone`
- `signTimesCircleFill`
- `signTimesCircleLight`
- `signTimesCircleThin`
- `signTimesDuotone`
- `signTimesFill`
- `signTimesLight`
- `signTimesSquare`
- `signTimesSquareBold`
- `signTimesSquareDuotone`
- `signTimesSquareFill`
- `signTimesSquareLight`
- `signTimesSquareThin`
- `signTimesThin`
- `signX`
- `signXBold`
- `signXFill`
- `signXLight`
- `signXThin`
- `signY`
- `signYBold`
- `signYFill`
- `signYLight`
- `signYThin`
- `slightlySmilingFace`
- `slightlySmilingFaceBold`
- `slightlySmilingFaceDuotone`
- `slightlySmilingFaceFill`
- `slightlySmilingFaceLight`
- `slightlySmilingFaceThin`
- `smilingFace`
- `smilingFaceBold`
- `smilingFaceDuotone`
- `smilingFaceFill`
- `smilingFaceLight`
- `smilingFaceThin`
- `sortingCenter`
- `sortingCenterBold`
- `sortingCenterDuotone`
- `sortingCenterFill`
- `sortingCenterLight`
- `sortingCenterThin`
- `sortingLeft`
- `sortingLeftBold`
- `sortingLeftDuotone`
- `sortingLeftFill`
- `sortingLeftLight`
- `sortingLeftThin`
- `sortingRight`
- `sortingRightBold`
- `sortingRightDuotone`
- `sortingRightFill`
- `sortingRightLight`
- `sortingRightThin`
- `squintingFace`
- `squintingFaceBold`
- `squintingFaceDuotone`
- `squintingFaceFill`
- `squintingFaceLight`
- `squintingFaceThin`
- `star`
- `starBold`
- `starDuotone`
- `starFill`
- `starLight`
- `starOff`
- `starOffBold`
- `starOffDuotone`
- `starOffFill`
- `starOffLight`
- `starOffThin`
- `starThin`
- `store`
- `storeBold`
- `storeDuotone`
- `storeFill`
- `storeLight`
- `storeThin`
- `swap`
- `swapBold`
- `swapFill`
- `swapLight`
- `swapThin`
- `synchronize`
- `synchronizeBold`
- `synchronizeDuotone`
- `synchronizeFill`
- `synchronizeLight`
- `synchronizeThin`
- `ticket`
- `ticketBold`
- `ticketDuotone`
- `ticketFill`
- `ticketLight`
- `ticketThin`
- `trash`
- `trashBold`
- `trashDuotone`
- `trashFill`
- `trashLight`
- `trashSimple`
- `trashSimpleBold`
- `trashSimpleDuotone`
- `trashSimpleFill`
- `trashSimpleLight`
- `trashSimpleThin`
- `trashThin`
- `trendDown`
- `trendDownBold`
- `trendDownFill`
- `trendDownLight`
- `trendDownThin`
- `trendUp`
- `trendUpBold`
- `trendUpFill`
- `trendUpLight`
- `trendUpThin`
- `type`
- `typeBold`
- `typeDuotone`
- `typeFill`
- `typeLight`
- `typeThin`
- `unavailable`
- `unavailableBold`
- `unavailableDuotone`
- `unavailableFill`
- `unavailableLight`
- `unavailableThin`
- `upload`
- `uploadBold`
- `uploadFill`
- `uploadLight`
- `uploadThin`
- `upsideDownFace`
- `upsideDownFaceBold`
- `upsideDownFaceDuotone`
- `upsideDownFaceFill`
- `upsideDownFaceLight`
- `upsideDownFaceThin`
- `volumeDown`
- `volumeDownBold`
- `volumeDownDuotone`
- `volumeDownFill`
- `volumeDownLight`
- `volumeDownThin`
- `volumeOff`
- `volumeOffBold`
- `volumeOffDuotone`
- `volumeOffFill`
- `volumeOffLight`
- `volumeOffThin`
- `volumeUp`
- `volumeUpBold`
- `volumeUpDuotone`
- `volumeUpFill`
- `volumeUpLight`
- `volumeUpThin`
- `winkingFace`
- `winkingFaceBold`
- `winkingFaceDuotone`
- `winkingFaceFill`
- `winkingFaceLight`
- `winkingFaceThin`
- `zoomIn`
- `zoomInBold`
- `zoomInDuotone`
- `zoomInFill`
- `zoomInLight`
- `zoomInThin`
- `zoomOut`
- `zoomOutBold`
- `zoomOutDuotone`
- `zoomOutFill`
- `zoomOutLight`
- `zoomOutThin`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dBoldIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dDuotoneIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dFillIcon size="20" class="nav-icon" /> Settings</a>
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
    <3dBoldIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dDuotoneIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dIcon size="24" />
   <3dBoldIcon size="24" color="#4a90e2" />
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
     import { 3d } from '@stacksjs/iconify-iconamoon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3d, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3d } from '@stacksjs/iconify-iconamoon'

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

- **Icons**: Dariush Habibpour ([Website](https://github.com/dariushhpg1/IconaMoon))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/iconamoon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/iconamoon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
