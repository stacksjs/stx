# Sharp free icons

> Sharp free icons icons for stx from Iconify

## Overview

This package provides access to 1500 icons from the Sharp free icons collection through the stx iconify integration.

**Collection ID:** `streamline-sharp`
**Total Icons:** 1500
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-sharp
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dMoveIcon height="1em" />
<3dMoveIcon width="1em" height="1em" />
<3dMoveIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dMoveIcon size="24" />
<3dMoveIcon size="1em" />

<!-- Using width and height -->
<3dMoveIcon width="24" height="32" />

<!-- With color -->
<3dMoveIcon size="24" color="red" />
<3dMoveIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dMoveIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dMoveIcon
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
    <3dMoveIcon size="24" />
    <3dMoveRemixIcon size="24" color="#4a90e2" />
    <3dMoveSolidIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dMove, 3dMoveRemix, 3dMoveSolid } from '@stacksjs/iconify-streamline-sharp'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dMove, { size: 24 })
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
<3dMoveIcon size="24" color="red" />
<3dMoveIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dMoveIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dMoveIcon size="24" class="text-primary" />
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
<3dMoveIcon height="1em" />
<3dMoveIcon width="1em" height="1em" />
<3dMoveIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dMoveIcon size="24" />
<3dMoveIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineSharp-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dMoveIcon class="streamlineSharp-icon" />
```

## Available Icons

This package contains **1500** icons:

- `3dMove`
- `3dMoveRemix`
- `3dMoveSolid`
- `3dRotateXAxisRemix`
- `3dRotateYAxis`
- `3dRotateYAxisSolid`
- `3dScale`
- `3dScaleRemix`
- `3dScaleSolid`
- `addPdf`
- `addPdfRemix`
- `addPdfSolid`
- `aiEditRobot`
- `aiEditRobotRemix`
- `aiEditRobotSolid`
- `aiFolderRobot`
- `aiFolderRobotRemix`
- `aiFolderRobotSolid`
- `aiGamingRobot`
- `aiGamingRobotRemix`
- `aiGamingRobotSolid`
- `aiGenerateVoiceSpark2`
- `aiGenerateVoiceSpark2Remix`
- `aiGenerateVoiceSpark2Solid`
- `aiScienceSpark`
- `aiScienceSparkRemix`
- `aiScienceSparkSolid`
- `aiUpscaleSpark`
- `aiUpscaleSparkRemix`
- `aiUpscaleSparkSolid`
- `aiVehicleRobot1`
- `aiVehicleRobot1Remix`
- `aiVehicleRobot1Solid`
- `airplaneDisabled`
- `airplaneDisabledRemix`
- `airplaneDisabledSolid`
- `alien`
- `alienRemix`
- `alienSolid`
- `alignBack2`
- `alignBack2Remix`
- `alignBack2Solid`
- `alignLeft1`
- `alignLeft1Remix`
- `alignLeft1Solid`
- `alignObjectBottom`
- `alignObjectBottomRemix`
- `alignObjectBottomSolid`
- `alignTextCenter`
- `alignTextCenterRemix`
- `alignTextCenterSolid`
- `allergensFish`
- `allergensFishRemix`
- `allergensFishSolid`
- `allergensPeanut`
- `allergensPeanutRemix`
- `allergensPeanutSolid`
- `apple`
- `appleRemix`
- `appleSolid`
- `applicationAdd`
- `applicationAddRemix`
- `applicationAddSolid`
- `archiveBox`
- `archiveBoxRemix`
- `archiveBoxSolid`
- `arrowCursor1`
- `arrowCursor1Remix`
- `arrowCursor1Solid`
- `arrowCursorMove`
- `arrowCursorMoveRemix`
- `arrowCursorMoveSolid`
- `arrowDiagonal2`
- `arrowDiagonal2Solid`
- `arrowExpand`
- `arrowExpandSolid`
- `arrowReloadHorizontal2`
- `arrowReloadHorizontal2Solid`
- `arrowTransferHorizontalLarge1`
- `arrowTransferHorizontalLarge1Solid`
- `arrowTriangleLoop`
- `arrowTriangleLoopSolid`
- `arrowTurnDownLarge`
- `arrowTurnDownLargeSolid`
- `arrowUpDashedSquare`
- `arrowUpDashedSquareSolid`
- `arrowUpLarge2`
- `arrowUpLarge2Solid`
- `artificialIntelligenceBrainChip`
- `artificialIntelligenceBrainChipRemix`
- `artificialIntelligenceBrainChipSolid`
- `asteriskSquare`
- `asteriskSquareRemix`
- `asteriskSquareSolid`
- `attribution`
- `attributionRemix`
- `attributionSolid`
- `bagDollar`
- `bagDollarRemix`
- `bagDollarSolid`
- `bagSuitcaseAddPlus`
- `bagSuitcaseAddPlusRemix`
- `bagSuitcaseAddPlusSolid`
- `baggage`
- `baggageRemix`
- `baggageSolid`
- `ball`
- `ballRemix`
- `ballSolid`
- `batteryEmpty2`
- `batteryEmpty2Remix`
- `batteryEmpty2Solid`
- `batteryMedium3`
- `batteryMedium3Remix`
- `batteryMedium3Solid`
- `bellNotification`
- `bellNotificationRemix`
- `bellNotificationSolid`
- `bellSetTimer`
- `bellSetTimerRemix`
- `bellSetTimerSolid`
- `bill4`
- `bill4Remix`
- `bill4Solid`
- `billDollar1`
- `billDollar1Remix`
- `billDollar1Solid`
- `bloodBagDonation`
- `bloodBagDonationRemix`
- `bloodBagDonationSolid`
- `bluetooth`
- `bluetoothRemix`
- `bluetoothSolid`
- `board`
- `boardRemix`
- `boardSolid`
- `borderBottom`
- `borderBottomRemix`
- `borderBottomSolid`
- `boxWaterproof`
- `boxWaterproofRemix`
- `boxWaterproofSolid`
- `brightness1`
- `brightness1Remix`
- `brightness1Solid`
- `browserBuild`
- `browserBuildRemix`
- `browserBuildSolid`
- `browserCode2`
- `browserCode2Remix`
- `browserCode2Solid`
- `browserError`
- `browserError404`
- `browserError404Remix`
- `browserError404Solid`
- `browserErrorRemix`
- `browserErrorSolid`
- `browserKey`
- `browserKeyRemix`
- `browserKeySolid`
- `bug`
- `bugRemix`
- `bugSolid`
- `bugVirusBrowser`
- `bugVirusBrowserRemix`
- `bugVirusBrowserSolid`
- `bulletList`
- `bulletListRemix`
- `bulletListSolid`
- `businessIdeaMoney`
- `businessIdeaMoneyRemix`
- `businessIdeaMoneySolid`
- `buttonFastForward2`
- `buttonFastForward2Remix`
- `buttonFastForward2Solid`
- `buttonPowerCircle1`
- `buttonPowerCircle1Remix`
- `buttonPowerCircle1Solid`
- `buttonsAll`
- `buttonsAllRemix`
- `buttonsAllSolid`
- `cake`
- `cakeRemix`
- `cakeSolid`
- `calendarAdd`
- `calendarAddRemix`
- `calendarAddSolid`
- `calendarMark`
- `calendarMarkRemix`
- `calendarMarkSolid`
- `calendarWarning`
- `calendarWarningRemix`
- `calendarWarningSolid`
- `cameraDisabledRemix`
- `cameraFlip1`
- `cameraFlip1Solid`
- `cameraFlip2Remix`
- `cameraSettingPin`
- `cameraSettingPinRemix`
- `cameraSettingPinSolid`
- `cameraVideo`
- `cameraVideoRemix`
- `cameraVideoSolid`
- `candle`
- `candleRemix`
- `candleSolid`
- `car2`
- `car2Remix`
- `car2Solid`
- `cardGameDiamond`
- `cardGameDiamondRemix`
- `cardGameDiamondSolid`
- `cashierMachine2`
- `cashierMachine2Remix`
- `cashierMachine2Solid`
- `cellularNetwork5g`
- `cellularNetwork5gRemix`
- `cellularNetwork5gSolid`
- `chair2`
- `chair2Remix`
- `chair2Solid`
- `chatBubbleCrackSquare`
- `chatBubbleCrackSquareRemix`
- `chatBubbleCrackSquareSolid`
- `chatBubbleDisableOval`
- `chatBubbleDisableOvalRemix`
- `chatBubbleDisableOvalSolid`
- `chatBubbleSquareBlock`
- `chatBubbleSquareBlockRemix`
- `chatBubbleSquareBlockSolid`
- `chatBubbleSquareWrite`
- `chatBubbleSquareWriteRemix`
- `chatBubbleSquareWriteSolid`
- `chatBubbleTypingOval`
- `chatBubbleTypingOvalRemix`
- `chatBubbleTypingOvalSolid`
- `chatTwoBubblesOval`
- `chatTwoBubblesOvalRemix`
- `chatTwoBubblesOvalSolid`
- `check`
- `checkRemix`
- `checkSolid`
- `chefToqueHat`
- `chefToqueHatRemix`
- `chefToqueHatSolid`
- `chessKnight`
- `chessKnightRemix`
- `chessKnightSolid`
- `chickenGrilledStream`
- `chickenGrilledStreamRemix`
- `chickenGrilledStreamSolid`
- `circusTent`
- `circusTentRemix`
- `circusTentSolid`
- `cleanBroomWipe`
- `cleanBroomWipeRemix`
- `cleanBroomWipeSolid`
- `cleaningRoomManRemix`
- `cleaningRoomWoman`
- `cleaningRoomWomanSolid`
- `closedUmbrella`
- `closedUmbrellaRemix`
- `closedUmbrellaSolid`
- `cloudDataTransfer`
- `cloudDataTransferRemix`
- `cloudDataTransferSolid`
- `cloudOff`
- `cloudOffRemix`
- `cloudOffSolid`
- `cloudWifi`
- `cloudWifiRemix`
- `cloudWifiSolid`
- `cog`
- `cogRemix`
- `cogSolid`
- `colorSwatches`
- `colorSwatchesRemix`
- `colorSwatchesSolid`
- `computerChip1`
- `computerChip1Remix`
- `computerChip1Solid`
- `consellation`
- `consellationRemix`
- `consellationSolid`
- `contactBook`
- `contactBookRemix`
- `contactBookSolid`
- `controllerWireless`
- `controllerWirelessRemix`
- `controllerWirelessSolid`
- `copyLink`
- `copyLinkRemix`
- `copyLinkSolid`
- `creditCard2`
- `creditCard2Remix`
- `creditCard2Solid`
- `creditCardDisable`
- `creditCardDisableRemix`
- `creditCardDisableSolid`
- `criticalThinking2`
- `criticalThinking2Remix`
- `criticalThinking2Solid`
- `crutch`
- `crutchRemix`
- `crutchSolid`
- `cupcake`
- `cupcakeRemix`
- `cupcakeSolid`
- `cursorClick`
- `cursorClickRemix`
- `cursorClickSolid`
- `curvesLevelsGraph`
- `curvesLevelsGraphRemix`
- `curvesLevelsGraphSolid`
- `customFeedsLikeFavorite`
- `customFeedsLikeFavoriteRemix`
- `customFeedsLikeFavoriteSolid`
- `customerSupport1`
- `customerSupport1Remix`
- `customerSupport1Solid`
- `customerSupportSetting`
- `customerSupportSettingRemix`
- `customerSupportSettingSolid`
- `cut`
- `cutRemix`
- `cutSolid`
- `cutter`
- `cutterRemix`
- `cutterSolid`
- `cyborg`
- `cyborgRemix`
- `cyborgSolid`
- `darkDislayModeRemix`
- `darkDisplayMode`
- `darkDisplayModeSolid`
- `dashboard1`
- `dashboard1Remix`
- `dashboard1Solid`
- `dashboardCircle`
- `dashboardCircleRemix`
- `dashboardCircleSolid`
- `dashboardGauge2`
- `dashboardGauge2Remix`
- `dashboardGauge2Solid`
- `database`
- `databaseRemix`
- `databaseServer2`
- `databaseServer2Remix`
- `databaseServer2Solid`
- `databaseSolid`
- `decentWorkAndEconomicGrowth`
- `decentWorkAndEconomicGrowthRemix`
- `decentWorkAndEconomicGrowthSolid`
- `deepfakeTechnology2`
- `deepfakeTechnology2Remix`
- `deepfakeTechnology2Solid`
- `definitionSearchBook`
- `definitionSearchBookRemix`
- `definitionSearchBookSolid`
- `delete2`
- `delete2Remix`
- `delete2Solid`
- `deleteBookmark`
- `deleteBookmarkRemix`
- `deleteBookmarkSolid`
- `deletePdf`
- `deletePdfRemix`
- `deletePdfSolid`
- `deleteTag`
- `deleteTagRemix`
- `deleteTagSolid`
- `desktopChat`
- `desktopChatRemix`
- `desktopChatSolid`
- `desktopScreensaverSleep`
- `desktopScreensaverSleepRemix`
- `desktopScreensaverSleepSolid`
- `deviceDatabaseEncryption1`
- `deviceDatabaseEncryption1Remix`
- `deviceDatabaseEncryption1Solid`
- `diagonalLineArrow2Remix`
- `diagonalScroll1`
- `diagonalScroll1Solid`
- `dialPadFinger2`
- `dialPadFinger2Remix`
- `dialPadFinger2Solid`
- `discountPercentFire`
- `discountPercentFireRemix`
- `discountPercentFireSolid`
- `divisionCircle`
- `divisionCircleRemix`
- `divisionCircleSolid`
- `dna`
- `dnaRemix`
- `dnaSolid`
- `dollarIncrease`
- `dollarIncreaseRemix`
- `dollarIncreaseSolid`
- `doubleBookmark`
- `doubleBookmarkRemix`
- `doubleBookmarkSolid`
- `doubleHeart`
- `doubleHeartRemix`
- `doubleHeartSolid`
- `downloadBox1`
- `downloadBox1Remix`
- `downloadBox1Solid`
- `downloadSquare`
- `downloadSquareRemix`
- `downloadSquareSolid`
- `downloadStack`
- `downloadStackRemix`
- `downloadStackSolid`
- `drawingCompass`
- `drawingCompassRemix`
- `drawingCompassSolid`
- `drone`
- `droneRemix`
- `droneSolid`
- `dropDownMenu`
- `dropDownMenuRemix`
- `dropDownMenuSolid`
- `drumStick`
- `drumStickRemix`
- `drumStickSolid`
- `earth2`
- `earth2Remix`
- `earth2Solid`
- `ecoHouse`
- `ecoHouseRemix`
- `ecoHouseSolid`
- `editPdf`
- `editPdfRemix`
- `editPdfSolid`
- `ejectSquare`
- `ejectSquareRemix`
- `ejectSquareSolid`
- `electricCord3`
- `electricCord3Remix`
- `electricCord3Solid`
- `elipseFrame`
- `elipseFrameRemix`
- `elipseFrameSolid`
- `emailAttachmentImage`
- `emailAttachmentImageRemix`
- `emailAttachmentImageSolid`
- `emergencyCall`
- `emergencyCallRemix`
- `emergencyCallSolid`
- `emptyClipboard`
- `emptyClipboardRemix`
- `emptyClipboardSolid`
- `emptyRecycleBin1`
- `emptyRecycleBin1Remix`
- `emptyRecycleBin1Solid`
- `endPointArrow`
- `endPointArrowSolid`
- `facebook1`
- `facebook1Solid`
- `facebookLogo1Remix`
- `featherPen`
- `featherPenRemix`
- `featherPenSolid`
- `fileBookmark`
- `fileBookmarkRemix`
- `fileBookmarkSolid`
- `filter2`
- `filter2Remix`
- `filter2Solid`
- `fingerprint2`
- `fingerprint2Remix`
- `fingerprint2Solid`
- `fireAlarm1`
- `fireAlarm1Remix`
- `fireAlarm1Solid`
- `fireWall`
- `fireWallRemix`
- `fireWallSolid`
- `flashTimer`
- `flashTimerRemix`
- `flashTimerSolid`
- `flashlight`
- `flashlightRemix`
- `flashlightSolid`
- `flipVerticalArrow2`
- `flipVerticalArrow2Remix`
- `flipVerticalArrow2Solid`
- `flipVerticalSquare1`
- `flipVerticalSquare1Remix`
- `flipVerticalSquare1Solid`
- `floppyDisk`
- `floppyDiskRemix`
- `floppyDiskSolid`
- `fluMask`
- `fluMaskRemix`
- `fluMaskSolid`
- `folderBlock`
- `folderBlockRemix`
- `folderBlockSolid`
- `following`
- `followingRemix`
- `followingSolid`
- `forkPlate`
- `forkPlateRemix`
- `forkPlateSolid`
- `fortuneTellingSphere`
- `fortuneTellingSphereRemix`
- `fortuneTellingSphereSolid`
- `forwardEmail`
- `forwardEmailRemix`
- `forwardEmailSolid`
- `fragile`
- `fragileRemix`
- `fragileSolid`
- `gameboy`
- `gameboyRemix`
- `gameboySolid`
- `gasStationFuelPetroleum`
- `gasStationFuelPetroleumRemix`
- `gasStationFuelPetroleumSolid`
- `genderLesbian2`
- `genderLesbian2Remix`
- `genderLesbian2Solid`
- `gift2`
- `gift2Remix`
- `gift2Solid`
- `giveGift`
- `giveGiftRemix`
- `giveGiftSolid`
- `glasses`
- `glassesRemix`
- `glassesSolid`
- `globalLearning`
- `globalLearningRemix`
- `globalLearningSolid`
- `gold`
- `goldRemix`
- `goldSolid`
- `googleDrive`
- `googleDriveLogoRemix`
- `googleDriveSolid`
- `graduationCap`
- `graduationCapRemix`
- `graduationCapSolid`
- `graphArrowUserIncrease`
- `graphArrowUserIncreaseRemix`
- `graphArrowUserIncreaseSolid`
- `graphDot`
- `graphDotRemix`
- `graphDotSolid`
- `graphicTemplateWebsiteUi`
- `graphicTemplateWebsiteUiRemix`
- `graphicTemplateWebsiteUiSolid`
- `handHeldTabletDrawing`
- `handHeldTabletDrawingRemix`
- `handHeldTabletDrawingSolid`
- `handWashing`
- `handWashingRemix`
- `handWashingSolid`
- `hanger`
- `hangerRemix`
- `hangerSolid`
- `happyFace`
- `happyFaceRemix`
- `happyFaceSolid`
- `healthCare2`
- `healthCare2Remix`
- `healthCare2Solid`
- `hearingDeaf1`
- `hearingDeaf1Remix`
- `hearingDeaf1Solid`
- `heartRateClipboard`
- `heartRateClipboardRemix`
- `heartRateClipboardSolid`
- `helpChat2`
- `helpChat2Remix`
- `helpChat2Solid`
- `hideLayer`
- `hideLayerRemix`
- `hideLayerSolid`
- `hierarchy16`
- `hierarchy16Remix`
- `hierarchy16Solid`
- `hierarchy2`
- `hierarchy2Remix`
- `hierarchy2Solid`
- `hierarchy8`
- `hierarchy8Remix`
- `hierarchy8Solid`
- `hierarchyLine1`
- `hierarchyLine1Remix`
- `hierarchyLine1Solid`
- `home1`
- `home1Remix`
- `home1Solid`
- `horizontalMenuSquare`
- `horizontalMenuSquareRemix`
- `horizontalMenuSquareSolid`
- `horizontalSlider2`
- `horizontalSlider2Remix`
- `horizontalSlider2Solid`
- `horizontalToggleButton`
- `horizontalToggleButtonRemix`
- `horizontalToggleButtonSolid`
- `hotAirBalloon`
- `hotAirBalloonRemix`
- `hotAirBalloonSolid`
- `hotSpring`
- `hotSpringRemix`
- `hotSpringSolid`
- `hotelBed2`
- `hotelBed2Remix`
- `hotelBed2Solid`
- `hotelThreeStar`
- `hotelThreeStarRemix`
- `hotelThreeStarSolid`
- `hourglass`
- `hourglassRemix`
- `hourglassSolid`
- `hydroEnergyRemix`
- `iceCream1`
- `iceCream1Remix`
- `iceCream1Solid`
- `imageHighlights`
- `imageHighlightsRemix`
- `imageHighlightsSolid`
- `inbox`
- `inboxFavorite`
- `inboxFavoriteRemix`
- `inboxFavoriteSolid`
- `inboxPost`
- `inboxPostRemix`
- `inboxPostSolid`
- `inboxRemix`
- `inboxSolid`
- `incognitoMode`
- `incognitoModeRemix`
- `incognitoModeSolid`
- `informationCircle`
- `informationCircleRemix`
- `informationCircleSolid`
- `inputBox`
- `inputBoxRemix`
- `inputBoxSolid`
- `insertCloudLink`
- `insertCloudLinkRemix`
- `insertCloudLinkSolid`
- `insertRow`
- `insertRowRemix`
- `insertRowSolid`
- `insertTopLeft`
- `insertTopLeftRemix`
- `insertTopLeftSolid`
- `insuranceHands`
- `insuranceHandsRemix`
- `insuranceHandsSolid`
- `investingAndBanking`
- `investingAndBankingRemix`
- `investingAndBankingSolid`
- `invisible2`
- `invisible2Remix`
- `invisible2Solid`
- `irisScan`
- `irisScanRemix`
- `irisScanSolid`
- `justiceScale2`
- `justiceScale2Remix`
- `justiceScale2Solid`
- `keyboard`
- `keyboardRemix`
- `keyboardSolid`
- `labelFolderTag`
- `labelFolderTagRemix`
- `labelFolderTagSolid`
- `landing`
- `landingRemix`
- `landingSolid`
- `landscape2`
- `landscape2Remix`
- `landscape2Solid`
- `laptopCamera`
- `laptopCameraRemix`
- `laptopCameraSolid`
- `laptopProjectScreen`
- `laptopProjectScreenRemix`
- `laptopProjectScreenSolid`
- `lassoTool`
- `lassoToolRemix`
- `lassoToolSolid`
- `layers1`
- `layers1Remix`
- `layers1Solid`
- `layoutRightSidebar`
- `layoutRightSidebarRemix`
- `layoutRightSidebarSolid`
- `layoutWindow2`
- `layoutWindow2Remix`
- `layoutWindow2Solid`
- `layoutWindow25`
- `layoutWindow25Remix`
- `layoutWindow25Solid`
- `leaf`
- `leafRemix`
- `leafSolid`
- `lens`
- `lensRemix`
- `lensSolid`
- `lift`
- `liftRemix`
- `liftSolid`
- `lightDarkMode`
- `lightDarkModeRemix`
- `lightDarkModeSolid`
- `like1`
- `like1Remix`
- `like1Solid`
- `lineArrowExpandRemix`
- `lineArrowMoveUp1Remix`
- `lineArrowReloadHorizontal2Remix`
- `lineArrowRight1Remix`
- `lineArrowSynchronizeDisableRemix`
- `lineArrowTransferHorizontal1Remix`
- `lineArrowTriangleLoopRemix`
- `lineArrowTurnDownLeftRemix`
- `lineArrowUpDashedSquareRemix`
- `linkChain`
- `linkChainRemix`
- `linkChainSolid`
- `linkShare2`
- `linkShare2Remix`
- `linkShare2Solid`
- `locationCompass2`
- `locationCompass2Remix`
- `locationCompass2Solid`
- `locationOffice`
- `locationOfficeRemix`
- `locationOfficeSolid`
- `locationPin3`
- `locationPin3Remix`
- `locationPin3Solid`
- `locationPinMoneyAtm1Remix`
- `locationPinStore`
- `locationPinStoreSolid`
- `login2`
- `login2Remix`
- `login2Solid`
- `logout2`
- `logout2Remix`
- `logout2Solid`
- `loop1`
- `loop1Remix`
- `loop1Solid`
- `magicWand2`
- `magicWand2Remix`
- `magicWand2Solid`
- `magnifyingGlass`
- `magnifyingGlassRemix`
- `magnifyingGlassSolid`
- `mailLoading`
- `mailLoadingRemix`
- `mailLoadingSolid`
- `mailSendEmailMessage`
- `mailSendEmailMessageRemix`
- `mailSendEmailMessageSolid`
- `mailSendEnvelope`
- `mailSendEnvelopeRemix`
- `mailSendEnvelopeSolid`
- `mapSearch`
- `mapSearchRemix`
- `mapSearchSolid`
- `medicalFolder`
- `medicalFolderRemix`
- `medicalFolderSolid`
- `medicalRibbon1`
- `medicalRibbon1Remix`
- `medicalRibbon1Solid`
- `medicalSearchDiagnosis`
- `medicalSearchDiagnosisRemix`
- `medicalSearchDiagnosisSolid`
- `megaphone2`
- `megaphone2Remix`
- `megaphone2Solid`
- `memesCommentReply`
- `memesCommentReplyRemix`
- `memesCommentReplySolid`
- `microscopeObservationSciene`
- `microscopeObservationScieneRemix`
- `microscopeObservationScieneSolid`
- `middleClick`
- `middleClickRemix`
- `middleClickSolid`
- `milk`
- `milkRemix`
- `milkSolid`
- `mineCart2`
- `mineCart2Remix`
- `mineCart2Solid`
- `mirrorHorizontally`
- `mirrorHorizontallyRemix`
- `mirrorHorizontallySolid`
- `missedCall`
- `missedCallRemix`
- `missedCallSolid`
- `module`
- `modulePuzzle2`
- `modulePuzzle2Remix`
- `modulePuzzle2Solid`
- `moduleRemix`
- `moduleSolid`
- `moonCloud`
- `moonCloudRemix`
- `moonCloudSolid`
- `moustache`
- `moustacheRemix`
- `moustacheSolid`
- `moveFile`
- `moveFileRemix`
- `moveFileSolid`
- `musicNote1`
- `musicNote1Remix`
- `musicNote1Solid`
- `musicNoteTrebbleClef`
- `musicNoteTrebbleClefRemix`
- `musicNoteTrebbleClefSolid`
- `necktie`
- `necktieRemix`
- `necktieSolid`
- `newFile`
- `newFileRemix`
- `newFileSolid`
- `newFolder`
- `newFolderRemix`
- `newFolderSolid`
- `newStickyNote`
- `newStickyNoteRemix`
- `newStickyNoteSolid`
- `newsPaper`
- `newsPaperRemix`
- `newsPaperSolid`
- `noPetsAllowedRemix`
- `noPhotoTakingZone`
- `noPhotoTakingZoneSolid`
- `noWordWrap`
- `noWordWrapRemix`
- `noWordWrapSolid`
- `nonCommercialDollars`
- `nonCommercialDollarsRemix`
- `nonCommercialDollarsSolid`
- `noseSmell`
- `noseSmellRemix`
- `noseSmellSolid`
- `notebook`
- `notebookRemix`
- `notebookSolid`
- `notificationAlarm2`
- `notificationAlarm2Remix`
- `notificationAlarm2Solid`
- `notificationAlarmSnooze`
- `notificationAlarmSnoozeRemix`
- `notificationAlarmSnoozeSolid`
- `octagramShape`
- `octagramShapeRemix`
- `octagramShapeSolid`
- `officeBuilding2`
- `officeBuilding2Remix`
- `officeBuilding2Solid`
- `officeWorker`
- `officeWorkerRemix`
- `officeWorkerSolid`
- `oneFingerShortTap`
- `oneFingerShortTapRemix`
- `oneFingerShortTapSolid`
- `oneHandedHoldingTabletHandheld`
- `oneHandedHoldingTabletHandheldRemix`
- `oneHandedHoldingTabletHandheldSolid`
- `padlockShield`
- `padlockShieldRemix`
- `padlockShieldSolid`
- `padlockSquare1`
- `padlockSquare1Remix`
- `padlockSquare1Solid`
- `padlockSquare2`
- `padlockSquare2Remix`
- `padlockSquare2Solid`
- `pageBreak`
- `pageBreakRemix`
- `pageBreakSolid`
- `pageSetting`
- `pageSettingRemix`
- `pageSettingSolid`
- `panoramicScreen`
- `panoramicScreenRemix`
- `panoramicScreenSolid`
- `paperclip1Remix`
- `paperclip2`
- `paperclip2Solid`
- `paragraphArticle`
- `paragraphArticleRemix`
- `paragraphArticleSolid`
- `paragraphRightToLeft`
- `paragraphRightToLeftRemix`
- `paragraphRightToLeftSolid`
- `partyPopper`
- `partyPopperRemix`
- `partyPopperSolid`
- `passportGlobe`
- `passportGlobeRemix`
- `passportGlobeSolid`
- `passwordBlock`
- `passwordBlockRemix`
- `passwordBlockSolid`
- `pathfinderOutline`
- `pathfinderOutlineRemix`
- `pathfinderOutlineSolid`
- `peaceSymbol`
- `peaceSymbolRemix`
- `peaceSymbolSolid`
- `pen1`
- `pen1Remix`
- `pen1Solid`
- `penDraw`
- `penDrawRemix`
- `penDrawSolid`
- `penTool`
- `penToolRemix`
- `penToolSolid`
- `penTypes`
- `penTypesRemix`
- `penTypesSolid`
- `pentagon`
- `pentagonRemix`
- `pentagonSolid`
- `petFriendlyHotel`
- `petFriendlyHotelRemix`
- `petFriendlyHotelSolid`
- `petriDishLabEquipment`
- `petriDishLabEquipmentRemix`
- `petriDishLabEquipmentSolid`
- `petsAllowed`
- `petsAllowedSolid`
- `phoneCircleOff`
- `phoneCircleOffRemix`
- `phoneCircleOffSolid`
- `phoneMessage`
- `phoneMessageRemix`
- `phoneMessageSolid`
- `phonePen2`
- `phonePen2Remix`
- `phonePen2Solid`
- `phonePersonalHotspot`
- `phonePersonalHotspotRemix`
- `phonePersonalHotspotSolid`
- `phoneRinging1`
- `phoneRinging1Remix`
- `phoneRinging1Solid`
- `phoneSetting`
- `phoneSettingBoltNutRemix`
- `phoneSettingSolid`
- `phoneVibrate`
- `phoneVibrateRemix`
- `phoneVibrateSolid`
- `picturesFolderMemories`
- `picturesFolderMemoriesRemix`
- `picturesFolderMemoriesSolid`
- `pieChart`
- `pieChartRemix`
- `pieChartSolid`
- `pin1`
- `pin1Remix`
- `pin1Solid`
- `pinwheel`
- `pinwheelRemix`
- `pinwheelSolid`
- `planeFlightBoard`
- `planeFlightBoardRemix`
- `planeFlightBoardSolid`
- `playList1`
- `playList1Remix`
- `playList1Solid`
- `playList8`
- `playList8Remix`
- `playList8Solid`
- `polaroid`
- `polaroidRemix`
- `polaroidSolid`
- `politicsVote2`
- `politicsVote2Remix`
- `politicsVote2Solid`
- `prescriptionPillsDrugsHealthcare`
- `prescriptionPillsDrugsHealthcareRemix`
- `prescriptionPillsDrugsHealthcareSolid`
- `presentation`
- `presentationRemix`
- `presentationSolid`
- `projectorScreen`
- `projectorScreenRemix`
- `projectorScreenSolid`
- `pyramidShape`
- `pyramidShapeRemix`
- `pyramidShapeSolid`
- `qrCode`
- `qrCodeSolid`
- `rabbit`
- `rabbitRemix`
- `rabbitSolid`
- `radio`
- `radioRemix`
- `radioSolid`
- `radioactive1`
- `radioactive1Remix`
- `radioactive1Solid`
- `rateStretchTool`
- `rateStretchToolRemix`
- `rateStretchToolSolid`
- `receiptAdd`
- `receiptAddRemix`
- `receiptAddSolid`
- `recordPlayer`
- `recordPlayerRemix`
- `recordPlayerSolid`
- `recordingTape2`
- `recordingTape2Remix`
- `recordingTape2Solid`
- `recycle1`
- `recycle1Remix`
- `recycle1Solid`
- `recycleBin2`
- `recycleBin2Remix`
- `recycleBin2Solid`
- `refrigerator`
- `refrigeratorRemix`
- `refrigeratorSolid`
- `removeAlertClock`
- `removeAlertClockRemix`
- `removeAlertClockSolid`
- `removeFavoriteHighlight`
- `removeFavoriteHighlightRemix`
- `removeFavoriteHighlightSolid`
- `repeatSingle`
- `repeatSingleRemix`
- `repeatSingleSolid`
- `resetClock`
- `resetClockRemix`
- `resetClockSolid`
- `ribbon`
- `ribbonRemix`
- `ribbonSolid`
- `ring`
- `ringRemix`
- `ringSolid`
- `rockAndRollHand`
- `rockAndRollHandRemix`
- `rockAndRollHandSolid`
- `roller`
- `rollerPaintbrush`
- `rollerPaintbrushRemix`
- `rollerPaintbrushSolid`
- `rollerRemix`
- `rollerSolid`
- `rotateRight`
- `rotateRightRemix`
- `rotateRightSolid`
- `roundAnchorPoint`
- `roundAnchorPointRemix`
- `roundAnchorPointSolid`
- `routerWifiNetwork`
- `routerWifiNetworkRemix`
- `routerWifiNetworkSolid`
- `rssSymbol`
- `rssSymbolRemix`
- `rssSymbolSolid`
- `ruler`
- `rulerRemix`
- `rulerSolid`
- `safari`
- `safariLogoRemix`
- `safariSolid`
- `safeVault`
- `safeVaultRemix`
- `safeVaultSolid`
- `satelliteDish`
- `satelliteDishRemix`
- `satelliteDishSolid`
- `scanner`
- `scanner1Remix`
- `scannerRemix`
- `scannerSolid`
- `schoolBusSide`
- `schoolBusSideRemix`
- `schoolBusSideSolid`
- `screenTv`
- `screenTvRemix`
- `screenTvSolid`
- `screwdriverWrench`
- `screwdriverWrenchRemix`
- `screwdriverWrenchSolid`
- `script1`
- `script1Remix`
- `script1Solid`
- `searchBar`
- `searchBarRemix`
- `searchBarSolid`
- `searchHistoryBrowser`
- `searchHistoryBrowserRemix`
- `searchHistoryBrowserSolid`
- `selectAll`
- `selectAllRemix`
- `selectAllSolid`
- `selectCircleArea1Remix`
- `selectCircleArea2`
- `selectCircleArea2Solid`
- `shareCode`
- `shareCodeRemix`
- `shareCodeSolid`
- `shareLink`
- `shareLinkRemix`
- `shareLinkSolid`
- `shareTime`
- `shareTimeRemix`
- `shareTimeSolid`
- `sharingData`
- `sharingDataRemix`
- `sharingDataSolid`
- `shield2`
- `shield2Remix`
- `shield2Solid`
- `shinto`
- `shintoRemix`
- `shintoSolid`
- `ship`
- `shipRemix`
- `shipSolid`
- `shipmentCheck`
- `shipmentCheckRemix`
- `shipmentCheckSolid`
- `shippingBox1`
- `shippingBox1Remix`
- `shippingBox1Solid`
- `shirt`
- `shirtRemix`
- `shirtSolid`
- `shoppingBagHandBag2Remix`
- `shoppingBagHandBagPriceTag`
- `shoppingBagHandBagPriceTagSolid`
- `shoppingBasket2`
- `shoppingBasket2Remix`
- `shoppingBasket2Solid`
- `shoppingBasketRemove`
- `shoppingBasketRemoveRemix`
- `shoppingBasketRemoveSolid`
- `shoppingCartAdd`
- `shoppingCartAddRemix`
- `shoppingCartAddSolid`
- `shovelRake`
- `shovelRakeRemix`
- `shovelRakeSolid`
- `shredder`
- `shredderRemix`
- `shredderSolid`
- `shrinkWindowOsx`
- `shrinkWindowOsxRemix`
- `shrinkWindowOsxSolid`
- `signHashtag`
- `signHashtagRemix`
- `signHashtagSolid`
- `signage3`
- `signage3Remix`
- `signage3Solid`
- `signalFull`
- `signalFullRemix`
- `signalFullSolid`
- `signature`
- `signatureRemix`
- `signatureSolid`
- `sizing`
- `sizingRemix`
- `sizingSolid`
- `skull2`
- `skull2Remix`
- `skull2Solid`
- `skype`
- `skypeLogoRemix`
- `skypeSolid`
- `slideShowPlay`
- `slideShowPlayRemix`
- `slideShowPlaySolid`
- `smartKey`
- `smartKeyRemix`
- `smartKeySolid`
- `smileyShocked`
- `smileyShockedRemix`
- `smileyShockedSolid`
- `snooze`
- `snoozeClock`
- `snoozeClockRemix`
- `snoozeClockSolid`
- `snoozeRemix`
- `snoozeSolid`
- `snowFlake`
- `snowFlakeRemix`
- `snowFlakeSolid`
- `songRecommendation`
- `songRecommendationRemix`
- `songRecommendationSolid`
- `soundRecognitionSearch`
- `soundRecognitionSearchRemix`
- `soundRecognitionSearchSolid`
- `spa`
- `spaRemix`
- `spaSolid`
- `speaker1`
- `speaker1Remix`
- `speaker1Solid`
- `sphereShape`
- `sphereShapeRemix`
- `sphereShapeSolid`
- `spiralShape`
- `spiralShapeRemix`
- `spiralShapeSolid`
- `stamp`
- `stampRemix`
- `stampSolid`
- `star2`
- `star2Remix`
- `star2Solid`
- `starBadge`
- `starBadgeRemix`
- `starBadgeSolid`
- `starCircle`
- `starCircleRemix`
- `starCircleSolid`
- `startup`
- `startupRemix`
- `startupSolid`
- `stepsNumber`
- `stepsNumberRemix`
- `stepsNumberSolid`
- `stock`
- `stockRemix`
- `stockSolid`
- `stopwatch`
- `stopwatchRemix`
- `stopwatchSolid`
- `store2`
- `store2Remix`
- `store2Solid`
- `storeFactory`
- `storeFactoryRemix`
- `storeFactorySolid`
- `storyPost`
- `storyPostRemix`
- `storyPostSolid`
- `strategyTasks`
- `strategyTasksRemix`
- `strategyTasksSolid`
- `streetSign`
- `streetSignRemix`
- `streetSignSolid`
- `summit`
- `summitRemix`
- `summitSolid`
- `sun`
- `sunRemix`
- `sunSolid`
- `surveillanceCamera`
- `surveillanceCameraRemix`
- `surveillanceCameraSolid`
- `swordAttack`
- `swordAttackRemix`
- `swordAttackSolid`
- `symmetryMirror1`
- `symmetryMirror1Remix`
- `symmetryMirror1Solid`
- `synchronizeDisable`
- `synchronizeDisableSolid`
- `syringe`
- `syringeRemix`
- `syringeSolid`
- `tableLamp2`
- `tableLamp2Remix`
- `tableLamp2Solid`
- `tagFreeCircle`
- `tagFreeCircleRemix`
- `tagFreeCircleSolid`
- `taillessLineArrowDiagonalScroll1Remix`
- `target3`
- `target3Remix`
- `target3Solid`
- `teaCup`
- `teaCupRemix`
- `teaCupSolid`
- `testTube`
- `testTubeRemix`
- `testTubeSolid`
- `textBar`
- `textBarRemix`
- `textBarSolid`
- `textFlowRows`
- `textFlowRowsRemix`
- `textFlowRowsSolid`
- `textStyle`
- `textStyleRemix`
- `textStyleSolid`
- `textTracking`
- `textTrackingRemix`
- `textTrackingSolid`
- `theaterMask`
- `theaterMaskRemix`
- `theaterMaskSolid`
- `thermometerPositive`
- `thermometerPositiveRemix`
- `thermometerPositiveSolid`
- `threatUsb`
- `threatUsbRemix`
- `threatUsbSolid`
- `ticketStar`
- `ticketStarRemix`
- `ticketStarSolid`
- `timeLapse`
- `timeLapseRemix`
- `timeLapseSolid`
- `timerZero`
- `timerZeroRemix`
- `timerZeroSolid`
- `toiletPaper`
- `toiletPaperRemix`
- `toiletPaperSolid`
- `toolBox`
- `toolBoxRemix`
- `toolBoxSolid`
- `tooth`
- `toothRemix`
- `toothSolid`
- `trafficLight`
- `trafficLightRemix`
- `trafficLightSolid`
- `transferCart`
- `transferCartRemix`
- `transferCartSolid`
- `transferTruckTime`
- `transferTruckTimeRemix`
- `transferTruckTimeSolid`
- `translateText`
- `translateTextRemix`
- `translateTextSolid`
- `transparent`
- `transparentRemix`
- `transparentSolid`
- `tree3`
- `tree3Remix`
- `tree3Solid`
- `triangleFlag`
- `triangleFlagRemix`
- `triangleFlagSolid`
- `trophy`
- `trophyRemix`
- `trophySolid`
- `tuneAdjustVolume`
- `tuneAdjustVolumeRemix`
- `tuneAdjustVolumeSolid`
- `twoFingerTap`
- `twoFingerTapRemix`
- `twoFingerTapSolid`
- `typeArea`
- `typeAreaRemix`
- `typeAreaSolid`
- `typewriter`
- `typewriterRemix`
- `typewriterSolid`
- `uploadComputer`
- `uploadComputerRemix`
- `uploadComputerSolid`
- `uploadSquare`
- `uploadSquareRemix`
- `uploadSquareSolid`
- `userAddPlus`
- `userAddPlusRemix`
- `userAddPlusSolid`
- `userArrowsAccountSwitch`
- `userArrowsAccountSwitchRemix`
- `userArrowsAccountSwitchSolid`
- `userCollaborateGroup`
- `userCollaborateGroupRemix`
- `userCollaborateGroupSolid`
- `userFeedbackHeart`
- `userFeedbackHeartRemix`
- `userFeedbackHeartSolid`
- `userHeadFocus`
- `userHeadFocusRemix`
- `userHeadFocusSolid`
- `userIdentifierCard`
- `userIdentifierCardRemix`
- `userIdentifierCardSolid`
- `userMultipleCircle`
- `userMultipleCircleRemix`
- `userMultipleCircleSolid`
- `userProtection1`
- `userProtection1Remix`
- `userProtection1Solid`
- `userSingleNeutralFemale`
- `userSingleNeutralFemaleRemix`
- `userSingleNeutralFemaleSolid`
- `userSingleNeutralMale`
- `userSingleNeutralMaleRemix`
- `userSingleNeutralMaleSolid`
- `userStickerSquare`
- `userStickerSquareRemix`
- `userStickerSquareSolid`
- `userWorkLaptopWifi`
- `userWorkLaptopWifiRemix`
- `userWorkLaptopWifiSolid`
- `verticalSlider2`
- `verticalSlider2Remix`
- `verticalSlider2Solid`
- `videoSubtitles`
- `videoSubtitlesRemix`
- `videoSubtitlesSolid`
- `viewDocumentFiles`
- `viewDocumentFilesRemix`
- `viewDocumentFilesSolid`
- `virtualReality`
- `virtualRealityRemix`
- `virtualRealitySolid`
- `virusAntivirus`
- `virusAntivirusRemix`
- `virusAntivirusSolid`
- `visible`
- `visibleRemix`
- `visibleSolid`
- `voiceMail`
- `voiceMailRemix`
- `voiceMailSolid`
- `voiceScan1`
- `voiceScan1Remix`
- `voiceScan1Solid`
- `voiceTypingWordConvert`
- `voiceTypingWordConvertRemix`
- `voiceTypingWordConvertSolid`
- `volumeLevelHigh`
- `volumeLevelHighRemix`
- `volumeLevelHighSolid`
- `volumeSleep`
- `volumeSleepRemix`
- `volumeSleepSolid`
- `walletPurse`
- `walletPurseRemix`
- `walletPurseSolid`
- `warehouse1`
- `warehouse1Remix`
- `warehouse1Solid`
- `warningShield`
- `warningShieldRemix`
- `warningShieldSolid`
- `warpArchRemix`
- `warpFish`
- `warpFishRemix`
- `warpFishSolid`
- `watchCircleBluetooth`
- `watchCircleBluetoothRemix`
- `watchCircleBluetoothSolid`
- `watchCircleDisable`
- `watchCircleDisableRemix`
- `watchCircleDisableSolid`
- `watchSquareDisable`
- `watchSquareDisableRemix`
- `watchSquareDisableSolid`
- `watchSquareTime`
- `watchSquareTimeRemix`
- `watchSquareTimeSolid`
- `waterDrop`
- `waterDrop1`
- `waterDrop1Solid`
- `waterDropRemix`
- `waterDropSolid`
- `waveSignal`
- `waveSignalRemix`
- `waveSignalSolid`
- `wavingHand`
- `wavingHandRemix`
- `wavingHandSolid`
- `webcamVideo`
- `webcamVideoRemix`
- `webcamVideoSolid`
- `wine`
- `wineRemix`
- `wineSolid`
- `workspaceDesk`
- `workspaceDeskRemix`
- `workspaceDeskSolid`
- `wrapArch`
- `wrapArchSolid`
- `wrench`
- `wrenchRemix`
- `wrenchSolid`
- `zipFile`
- `zipFileRemix`
- `zipFileSolid`
- `zoomDocument`
- `zoomDocumentRemix`
- `zoomDocumentSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dMoveIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dMoveRemixIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dMoveSolidIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dRotateXAxisRemixIcon size="20" class="nav-icon" /> Settings</a>
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
<3dMoveIcon
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
    <3dMoveIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dMoveRemixIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dMoveSolidIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dMoveIcon size="24" />
   <3dMoveRemixIcon size="24" color="#4a90e2" />
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
   <3dMoveIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dMoveIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dMoveIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dMove } from '@stacksjs/iconify-streamline-sharp'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dMove, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dMove } from '@stacksjs/iconify-streamline-sharp'

// Icons are typed as IconData
const myIcon: IconData = 3dMove
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-sharp/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-sharp/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
