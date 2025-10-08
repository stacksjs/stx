# Lsicon

> Lsicon icons for stx from Iconify

## Overview

This package provides access to 716 icons from the Lsicon collection through the stx iconify integration.

**Collection ID:** `lsicon`
**Total Icons:** 716
**Author:** Wis Design ([Website](https://www.lsicon.com/))
**License:** MIT ([Details](https://github.com/wisdesignsystem/lsicon/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lsicon
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddChatFilledIcon height="1em" />
<AddChatFilledIcon width="1em" height="1em" />
<AddChatFilledIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddChatFilledIcon size="24" />
<AddChatFilledIcon size="1em" />

<!-- Using width and height -->
<AddChatFilledIcon width="24" height="32" />

<!-- With color -->
<AddChatFilledIcon size="24" color="red" />
<AddChatFilledIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddChatFilledIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddChatFilledIcon
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
    <AddChatFilledIcon size="24" />
    <AddChatOutlineIcon size="24" color="#4a90e2" />
    <AddChatTwoFilledIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addChatFilled, addChatOutline, addChatTwoFilled } from '@stacksjs/iconify-lsicon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addChatFilled, { size: 24 })
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
<AddChatFilledIcon size="24" color="red" />
<AddChatFilledIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddChatFilledIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddChatFilledIcon size="24" class="text-primary" />
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
<AddChatFilledIcon height="1em" />
<AddChatFilledIcon width="1em" height="1em" />
<AddChatFilledIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddChatFilledIcon size="24" />
<AddChatFilledIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.lsicon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddChatFilledIcon class="lsicon-icon" />
```

## Available Icons

This package contains **716** icons:

- `addChatFilled`
- `addChatOutline`
- `addChatTwoFilled`
- `addChatTwoOutline`
- `addOneFilled`
- `addOneOutline`
- `adjustHightFilled`
- `adjustHightOutline`
- `adjustWidthFilled`
- `adjustWidthOutline`
- `alignTxtBothFilled`
- `alignTxtBothOutline`
- `alignTxtCenterFilled`
- `alignTxtCenterOutline`
- `alignTxtLeftFilled`
- `alignTxtLeftOutline`
- `alignTxtRightFilled`
- `alignTxtRightOutline`
- `amountDollarFilled`
- `amountDollarOutline`
- `amountDownFilled`
- `amountDownOutline`
- `amountDownTwoFilled`
- `amountDownTwoOutline`
- `amountUpFilled`
- `amountUpOutline`
- `amountUpTwoFilled`
- `amountUpTwoOutline`
- `amountYuanFilled`
- `amountYuanOutline`
- `annularFilled`
- `annularOutline`
- `anticlockwise90Filled`
- `anticlockwise90Outline`
- `appsFilled`
- `appsOutline`
- `areaChartFilled`
- `areaChartOutline`
- `arrowDownFilled`
- `arrowDownOutline`
- `arrowLeftFilled`
- `arrowLeftOutline`
- `arrowRightFilled`
- `arrowRightOutline`
- `arrowUpFilled`
- `arrowUpOutline`
- `attachmentsFilled`
- `attachmentsOutline`
- `backSquareFilled`
- `backSquareOutline`
- `badgeNewFilled`
- `badgeNewOutline`
- `badgePromotionFilled`
- `badgePromotionOutline`
- `barCodeFilled`
- `barCodeOutline`
- `barFilled`
- `barOutline`
- `basketFilled`
- `basketOutline`
- `batchAddFilled`
- `batchAddOutline`
- `batchCheckFilled`
- `batchCheckOutline`
- `bbqFilled`
- `bbqOutline`
- `bedFilled`
- `bedOutline`
- `bottomAlignFilled`
- `bottomAlignOutline`
- `buildingFilled`
- `buildingOutline`
- `calculatorFilled`
- `calculatorOutline`
- `calendarFilled`
- `calendarOutline`
- `cameraFilled`
- `cameraOutline`
- `centerHorizontallyFilled`
- `centerHorizontallyOutline`
- `checkCorrectFilled`
- `checkCorrectOutline`
- `checkDisabledFilled`
- `checkDisabledOutline`
- `checkFilled`
- `checkOutline`
- `checkStandFilled`
- `checkStandOutline`
- `checkboxFilled`
- `checkboxOutline`
- `chefFilled`
- `chefOutline`
- `chipsFilled`
- `chipsOutline`
- `circleAddFilled`
- `circleAddOutline`
- `circleCloseFilled`
- `circleCloseOutline`
- `circleHelpFilled`
- `circleHelpOutline`
- `circleInformationFilled`
- `circleInformationOutline`
- `circleMoreFilled`
- `circleMoreOutline`
- `circleStarFilled`
- `circleStarOutline`
- `circleSucceedFilled`
- `circleSucceedOutline`
- `circleWarningFilled`
- `circleWarningOutline`
- `clearFilled`
- `clearOutline`
- `clockwise90Filled`
- `clockwise90Outline`
- `closeSmallFilled`
- `closeSmallOutline`
- `clothesFilled`
- `clothesOutline`
- `cloudyFilled`
- `cloudyOutline`
- `columnFilled`
- `columnLineFilled`
- `columnLineOutline`
- `columnOutline`
- `commentsFilled`
- `commentsOutline`
- `compilingFilled`
- `compilingOutline`
- `computerAcrossFilled`
- `computerAcrossOutline`
- `computerExclamationFilled`
- `computerExclamationOutline`
- `computerFilled`
- `computerOutline`
- `constituteFilled`
- `constituteOutline`
- `consumeFilled`
- `consumeOutline`
- `contractAcrossFilled`
- `contractAcrossOutline`
- `contractExclamationFilled`
- `contractExclamationOutline`
- `contractFilled`
- `contractOutline`
- `controlFilled`
- `controlOutline`
- `copyOneFilled`
- `copyOneOutline`
- `copyTwoFilled`
- `copyTwoOutline`
- `couponFilled`
- `couponOutline`
- `coverageFilled`
- `coverageOutline`
- `dataFilled`
- `dataOutline`
- `dataScreenFilled`
- `dataScreenOutline`
- `databaseFilled`
- `databaseOutline`
- `dealFilled`
- `dealOutline`
- `decimalFilled`
- `decimalOutline`
- `decorateFilled`
- `decorateOutline`
- `deleteFilled`
- `deleteOutline`
- `densityLFilled`
- `densityLOutline`
- `densityMFilled`
- `densityMOutline`
- `densitySFilled`
- `densitySOutline`
- `disableFilled`
- `disableOutline`
- `distributionFilled`
- `distributionOutline`
- `doubleArrowDownFilled`
- `doubleArrowDownOutline`
- `doubleArrowLeftFilled`
- `doubleArrowLeftOutline`
- `doubleArrowRightFilled`
- `doubleArrowRightOutline`
- `doubleArrowUpFilled`
- `doubleArrowUpOutline`
- `downFilled`
- `downOutline`
- `downloadFilled`
- `downloadOutline`
- `dragFilled`
- `dragOutline`
- `earthFilled`
- `earthOutline`
- `editFilled`
- `editOutline`
- `educationFilled`
- `educationOutline`
- `emailSendFilled`
- `emailSendOutline`
- `equipmentFilled`
- `equipmentOutline`
- `exclamationFilled`
- `exclamationOutline`
- `exportFilled`
- `exportOutline`
- `fileAviFilled`
- `fileAviOutline`
- `fileCdrFilled`
- `fileCdrOutline`
- `fileCsvFilled`
- `fileCsvOutline`
- `fileDocFilled`
- `fileDocOutline`
- `fileExportFilled`
- `fileExportOutline`
- `fileImportFilled`
- `fileImportOutline`
- `fileJpgFilled`
- `fileJpgOutline`
- `fileMovFilled`
- `fileMovOutline`
- `fileMovieFilled`
- `fileMovieOutline`
- `fileMp3Filled`
- `fileMp3Outline`
- `fileMp4Filled`
- `fileMp4Outline`
- `filePdfFilled`
- `filePdfOutline`
- `filePngFilled`
- `filePngOutline`
- `filePptFilled`
- `filePptOutline`
- `fileRarFilled`
- `fileRarOutline`
- `fileTxtFilled`
- `fileTxtOutline`
- `fileXlsFilled`
- `fileXlsOutline`
- `fileZipFilled`
- `fileZipOutline`
- `filterFilled`
- `filterOutline`
- `findFilled`
- `findOutline`
- `fireFilled`
- `fireOutline`
- `fitScreenFilled`
- `fitScreenOutline`
- `flagFilled`
- `flagOutline`
- `folderFilesFilled`
- `folderFilesOutline`
- `folderFilled`
- `folderOutline`
- `formatPainterFilled`
- `formatPainterOutline`
- `frontSquareFilled`
- `frontSquareOutline`
- `gatherFilled`
- `gatherOutline`
- `giftFilled`
- `giftOutline`
- `goodsFilled`
- `goodsOutline`
- `goodsSearchFilled`
- `goodsSearchOutline`
- `gotoFilled`
- `gotoOutline`
- `handShakeFilled`
- `handShakeOutline`
- `hazeFilled`
- `hazeOutline`
- `heavyRainFilled`
- `heavyRainOutline`
- `heavySnowFilled`
- `heavySnowOutline`
- `hightLessenFilled`
- `hightLessenOutline`
- `homeFilled`
- `homeOutline`
- `hospitalFilled`
- `hospitalOutline`
- `houseFilled`
- `houseOutline`
- `incubatorFilled`
- `incubatorOutline`
- `infuseOneFilled`
- `infuseOneOutline`
- `infuseTwoFilled`
- `infuseTwoOutline`
- `integralDistributeFilled`
- `integralDistributeOutline`
- `integralFilled`
- `integralOutline`
- `inventoryFilled`
- `inventoryOutline`
- `keyboardFilled`
- `keyboardOutline`
- `labelFilled`
- `labelOutline`
- `leafFilled`
- `leafOutline`
- `leftAlignFilled`
- `leftAlignOutline`
- `leftFilled`
- `leftOutline`
- `leftSquareFilled`
- `leftSquareOutline`
- `lightRainFilled`
- `lightRainOutline`
- `lightSnowFilled`
- `lightSnowOutline`
- `lightningFilled`
- `lightningOutline`
- `lineChartFilled`
- `lineChartOutline`
- `linecapButtFilled`
- `linecapButtOutline`
- `linecapRoundFilled`
- `linecapRoundOutline`
- `linecapSquareFilled`
- `linecapSquareOutline`
- `linejoinBevelFilled`
- `linejoinBevelOutline`
- `linejoinMiterFilled`
- `linejoinMiterOutline`
- `linejoinRoundFilled`
- `linejoinRoundOutline`
- `linkFilled`
- `linkOutline`
- `listFilled`
- `listOutline`
- `locationFilled`
- `locationOutline`
- `lockFilled`
- `lockOutline`
- `managementFilled`
- `managementOutline`
- `managementStockoutFilled`
- `managementStockoutOutline`
- `mapFilled`
- `mapLocationFilled`
- `mapLocationOutline`
- `mapOutline`
- `marketingFilled`
- `marketingOutline`
- `marketplaceFilled`
- `marketplaceOutline`
- `measureFilled`
- `measureOutline`
- `menuEndwaysFilled`
- `menuEndwaysOutline`
- `menuThwartwiseFilled`
- `menuThwartwiseOutline`
- `menu2Filled`
- `menu2Outline`
- `microphoneFilled`
- `microphoneOutline`
- `minusFilled`
- `minusOutline`
- `mobileFilled`
- `mobileOutline`
- `monitoringFilled`
- `monitoringOutline`
- `moreFilled`
- `moreOutline`
- `motorcycleFilled`
- `motorcycleOutline`
- `moveDownFilled`
- `moveDownOutline`
- `moveFilled`
- `moveOutline`
- `moveUpFilled`
- `moveUpOutline`
- `musicFilled`
- `musicOutline`
- `numberFilled`
- `numberOutline`
- `oclockFilled`
- `oclockOutline`
- `offlineGatewayFilled`
- `offlineGatewayOutline`
- `oneToOneFilled`
- `oneToOneOutline`
- `onlineGatewayFilled`
- `onlineGatewayOutline`
- `openNewFilled`
- `openNewOutline`
- `operationFilled`
- `operationOutline`
- `orderAbnormalFilled`
- `orderAbnormalOutline`
- `orderCloseFilled`
- `orderCloseOutline`
- `orderDoneFilled`
- `orderDoneOutline`
- `orderEditFilled`
- `orderEditOutline`
- `orderFilled`
- `orderIntegralFilled`
- `orderIntegralOutline`
- `orderOutline`
- `outOfWarehouseFilled`
- `outOfWarehouseOutline`
- `overtimeFilled`
- `overtimeOutline`
- `packingBoxFilled`
- `packingBoxOutline`
- `padFilled`
- `padOutline`
- `parkFilled`
- `parkOutline`
- `pasteFilled`
- `pasteOutline`
- `pathFilled`
- `pathOutline`
- `percentFilled`
- `percentOutline`
- `phoneFilled`
- `phoneOutline`
- `pickingFilled`
- `pickingGuidanceFilled`
- `pickingGuidanceOutline`
- `pickingOutline`
- `pickingPathFilled`
- `pickingPathOutline`
- `pictureFilled`
- `pictureOffFilled`
- `pictureOffOutline`
- `pictureOutline`
- `pieOneFilled`
- `pieOneOutline`
- `pieTwoFilled`
- `pieTwoOutline`
- `pinFilled`
- `pinOutline`
- `pinPreFilled`
- `pinPreOutline`
- `placeOrderFilled`
- `placeOrderOutline`
- `playFilled`
- `playOutline`
- `pointerFilled`
- `pointerOutline`
- `powerFilled`
- `powerOutline`
- `printFilled`
- `printOutline`
- `processModeFilled`
- `processModeOutline`
- `purseFilled`
- `purseOutline`
- `pushMgtFilled`
- `pushMgtOutline`
- `puzzleFilled`
- `puzzleOutline`
- `qrCodeFilled`
- `qrCodeOutline`
- `questionFilled`
- `questionOutline`
- `radarChartFilled`
- `radarChartOutline`
- `radioSelectedFilled`
- `radioSelectedOutline`
- `radioUnselectedFilled`
- `radioUnselectedOutline`
- `railFilled`
- `railOutline`
- `receiptFilled`
- `receiptOutline`
- `refreshDoingFilled`
- `refreshDoingOutline`
- `refreshDoneFilled`
- `refreshDoneOutline`
- `refreshFilled`
- `refreshOutline`
- `remindCloseFilled`
- `remindCloseOutline`
- `remindFilled`
- `remindOutline`
- `replenishmentFilled`
- `replenishmentOutline`
- `reportFilled`
- `reportOutline`
- `riceFilled`
- `riceOutline`
- `rightAlignFilled`
- `rightAlignOutline`
- `rightFilled`
- `rightOutline`
- `rightSquareFilled`
- `rightSquareOutline`
- `rollbackFilled`
- `rollbackOutline`
- `rotationLeftFilled`
- `rotationLeftOutline`
- `rotationRightFilled`
- `rotationRightOutline`
- `rowHeightLFilled`
- `rowHeightLOutline`
- `rowHeightMFilled`
- `rowHeightMOutline`
- `rowHeightSFilled`
- `rowHeightSOutline`
- `salesReturnFilled`
- `salesReturnOutline`
- `sandFilled`
- `sandGlassFilled`
- `sandGlassOutline`
- `sandOutline`
- `saveAsFilled`
- `saveAsOutline`
- `saveFilled`
- `saveOutline`
- `scaleFilled`
- `scaleOutline`
- `scanFilled`
- `scanOutline`
- `scatterDiagramFilled`
- `scatterDiagramOutline`
- `screenFullFilled`
- `screenFullOutline`
- `screenOffFilled`
- `screenOffOutline`
- `searchFilled`
- `searchOutline`
- `sendFilled`
- `sendOutline`
- `serviceFilled`
- `serviceOutline`
- `settingFilled`
- `settingOutline`
- `settingSearchFilled`
- `settingSearchOutline`
- `shareFilled`
- `shareOutline`
- `shelfDownFilled`
- `shelfDownOutline`
- `shelfFilled`
- `shelfOutline`
- `shelfUpFilled`
- `shelfUpOutline`
- `shellWindowMaximizeFilled`
- `shellWindowMaximizeOutline`
- `shellWindowMinimizeFilled`
- `shellWindowMinimizeOutline`
- `shieldFilled`
- `shieldOutline`
- `shoppingBagFilled`
- `shoppingBagOutline`
- `shoppingCartFilled`
- `shoppingCartOutline`
- `sortAToZFilled`
- `sortAToZOutline`
- `sortFilled`
- `sortFilterFilled`
- `sortFilterOutline`
- `sortOutline`
- `sortZToAFilled`
- `sortZToAOutline`
- `soupFilled`
- `soupOutline`
- `stampFilled`
- `stampOutline`
- `starFilled`
- `starOutline`
- `stopFilled`
- `stopOutline`
- `storeFilled`
- `storeOutline`
- `submitFilled`
- `submitOutline`
- `sunnyFilled`
- `sunnyOutline`
- `surfaceFrontFilled`
- `surfaceFrontOutline`
- `surfaceLeftFilled`
- `surfaceLeftOutline`
- `surfaceRightFilled`
- `surfaceRightOutline`
- `surfaceTopFilled`
- `surfaceTopOutline`
- `suspendFilled`
- `suspendOutline`
- `swerveFilled`
- `swerveOutline`
- `switchFilled`
- `switchOutline`
- `tableFilled`
- `tableOutline`
- `textFilled`
- `textOutline`
- `thermoDynamicFilled`
- `thermoDynamicOutline`
- `thumbDownFilled`
- `thumbDownOutline`
- `thumbUpFilled`
- `thumbUpOutline`
- `timeOneFilled`
- `timeOneOutline`
- `timeTwoFilled`
- `timeTwoOutline`
- `timingShelfDownFilled`
- `timingShelfDownOutline`
- `toBottomFilled`
- `toBottomOutline`
- `toTopFilled`
- `toTopOutline`
- `toggleFilled`
- `toggleOutline`
- `toggleWarehouseXFilled`
- `toggleWarehouseXOutline`
- `toggleWarehouseYFilled`
- `toggleWarehouseYOutline`
- `topAlignFilled`
- `topAlignOutline`
- `topFilled`
- `topOutline`
- `translateFilled`
- `translateOutline`
- `treeFilled`
- `treeOutline`
- `triangleDownFilled`
- `triangleDownOutline`
- `triangleLeftFilled`
- `triangleLeftOutline`
- `triangleRightFilled`
- `triangleRightOutline`
- `triangleUpFilled`
- `triangleUpOutline`
- `triangleWarningFilled`
- `triangleWarningOutline`
- `undoFilled`
- `undoOutline`
- `unlinkFilled`
- `unlinkOutline`
- `unlockFilled`
- `unlockOutline`
- `upFilled`
- `upOutline`
- `uploadingFilled`
- `uploadingOutline`
- `urgencyFilled`
- `urgencyOutline`
- `userAllFilled`
- `userAllOutline`
- `userBlackFilled`
- `userBlackOutline`
- `userCrowdFilled`
- `userCrowdOutline`
- `userFilled`
- `userLeaveFilled`
- `userLeaveOutline`
- `userLikeFilled`
- `userLikeOutline`
- `userNewFilled`
- `userNewOutline`
- `userOutline`
- `userPortrayalFilled`
- `userPortrayalOutline`
- `userSilenceFilled`
- `userSilenceOutline`
- `userWhiteFilled`
- `userWhiteOutline`
- `verticalCenterFilled`
- `verticalCenterOutline`
- `verticalSplitFilled`
- `verticalSplitOutline`
- `viewFilled`
- `viewOffFilled`
- `viewOffOutline`
- `viewOutline`
- `vipConsumeFilled`
- `vipConsumeOutline`
- `vipFilled`
- `vipOutline`
- `volumeDownFilled`
- `volumeDownOutline`
- `volumeFilled`
- `volumeMuteFilled`
- `volumeMuteOutline`
- `volumeOutline`
- `volumeUpFilled`
- `volumeUpOutline`
- `warehouseFilled`
- `warehouseIntoFilled`
- `warehouseIntoOutline`
- `warehouseOutline`
- `warehousePreFilled`
- `warehousePreOutline`
- `wifiAbnormalFilled`
- `wifiAbnormalOutline`
- `wifiCloseFilled`
- `wifiCloseOutline`
- `wifiFilled`
- `wifiOutline`
- `wordCloudFilled`
- `wordCloudOutline`
- `workOrderAbnormalFilled`
- `workOrderAbnormalOutline`
- `workOrderAppointmentFilled`
- `workOrderAppointmentOutline`
- `workOrderCheckFilled`
- `workOrderCheckOutline`
- `workOrderFilled`
- `workOrderInfoFilled`
- `workOrderInfoOutline`
- `workOrderOutline`
- `workingOddFilled`
- `workingOddOutline`
- `zoomInFilled`
- `zoomInOutline`
- `zoomOutFilled`
- `zoomOutOutline`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddChatFilledIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddChatOutlineIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddChatTwoFilledIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddChatTwoOutlineIcon size="20" class="nav-icon" /> Settings</a>
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
<AddChatFilledIcon
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
    <AddChatFilledIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddChatOutlineIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddChatTwoFilledIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddChatFilledIcon size="24" />
   <AddChatOutlineIcon size="24" color="#4a90e2" />
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
   <AddChatFilledIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddChatFilledIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddChatFilledIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addChatFilled } from '@stacksjs/iconify-lsicon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addChatFilled, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addChatFilled } from '@stacksjs/iconify-lsicon'

// Icons are typed as IconData
const myIcon: IconData = addChatFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/wisdesignsystem/lsicon/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Wis Design ([Website](https://www.lsicon.com/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lsicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lsicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
