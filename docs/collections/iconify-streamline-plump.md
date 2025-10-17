# Plump free icons

> Plump free icons icons for stx from Iconify

## Overview

This package provides access to 1499 icons from the Plump free icons collection through the stx iconify integration.

**Collection ID:** `streamline-plump`
**Total Icons:** 1499
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-plump
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dCoordinateAxisIcon height="1em" />
<3dCoordinateAxisIcon width="1em" height="1em" />
<3dCoordinateAxisIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dCoordinateAxisIcon size="24" />
<3dCoordinateAxisIcon size="1em" />

<!-- Using width and height -->
<3dCoordinateAxisIcon width="24" height="32" />

<!-- With color -->
<3dCoordinateAxisIcon size="24" color="red" />
<3dCoordinateAxisIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dCoordinateAxisIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dCoordinateAxisIcon
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
    <3dCoordinateAxisIcon size="24" />
    <3dCoordinateAxisRemixIcon size="24" color="#4a90e2" />
    <3dCoordinateAxisSolidIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dCoordinateAxis, 3dCoordinateAxisRemix, 3dCoordinateAxisSolid } from '@stacksjs/iconify-streamline-plump'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dCoordinateAxis, { size: 24 })
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
<3dCoordinateAxisIcon size="24" color="red" />
<3dCoordinateAxisIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dCoordinateAxisIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dCoordinateAxisIcon size="24" class="text-primary" />
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
<3dCoordinateAxisIcon height="1em" />
<3dCoordinateAxisIcon width="1em" height="1em" />
<3dCoordinateAxisIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dCoordinateAxisIcon size="24" />
<3dCoordinateAxisIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlinePlump-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dCoordinateAxisIcon class="streamlinePlump-icon" />
```

## Available Icons

This package contains **1499** icons:

- `3dCoordinateAxis`
- `3dCoordinateAxisRemix`
- `3dCoordinateAxisSolid`
- `addBellNotification`
- `addBellNotificationRemix`
- `addBellNotificationSolid`
- `addLayer2`
- `addLayer2Remix`
- `addLayer2Solid`
- `aiEditRobot`
- `aiEditRobotRemix`
- `aiEditRobotSolid`
- `aiGeneratePortraitImageSpark`
- `aiGeneratePortraitImageSparkRemix`
- `aiGeneratePortraitImageSparkSolid`
- `aiGenerateVariationSpark`
- `aiGenerateVariationSparkRemix`
- `aiGenerateVariationSparkSolid`
- `aiGenerateVoiceRobot2`
- `aiGenerateVoiceRobot2Remix`
- `aiGenerateVoiceRobot2Solid`
- `aiScienceRobot`
- `aiScienceRobotRemix`
- `aiScienceRobotSolid`
- `aiTechnologySpark`
- `aiTechnologySparkRemix`
- `aiTechnologySparkSolid`
- `airplaneDisabled`
- `airplaneDisabledRemix`
- `airplaneDisabledSolid`
- `airplaneEnabled`
- `airplaneEnabledRemix`
- `airplaneEnabledSolid`
- `airportSecurity`
- `airportSecurityRemix`
- `airportSecuritySolid`
- `alien`
- `alienRemix`
- `alienSolid`
- `alignObjectLeft`
- `alignObjectLeftRemix`
- `alignObjectLeftSolid`
- `alignRight`
- `alignRight1Remix`
- `alignRightSolid`
- `alignSelection`
- `alignSelectionRemix`
- `alignSelectionSolid`
- `allergensFishRemix`
- `allergensGlutenRemix`
- `ampersand`
- `ampersandRemix`
- `ampersandSolid`
- `announcementMegaphone`
- `announcementMegaphoneRemix`
- `announcementMegaphoneSolid`
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
- `arrowCurvyBothDirection2`
- `arrowCurvyBothDirection2Solid`
- `arrowDiagonal2`
- `arrowDiagonal2Solid`
- `arrowExpand`
- `arrowExpandSolid`
- `arrowRightCircle1`
- `arrowRightCircle1Solid`
- `arrowRightCircle2`
- `arrowRightCircle2Solid`
- `arrowRoadmap`
- `arrowRoadmapSolid`
- `arrowTransferHorizontalSquare`
- `arrowTransferHorizontalSquareSolid`
- `arrowTurnDownLarge`
- `arrowTurnDownLargeSolid`
- `arrowUp4`
- `arrowUp4Solid`
- `ascendingAlphabeticalOrder`
- `ascendingAlphabeticalOrderRemix`
- `ascendingAlphabeticalOrderSolid`
- `atom`
- `atomRemix`
- `atomSolid`
- `attribution`
- `attributionRemix`
- `attributionSolid`
- `autoFlash`
- `autoFlashRemix`
- `autoFlashSolid`
- `bag`
- `bagRemix`
- `bagSolid`
- `bagSuitcase4`
- `bagSuitcase4Remix`
- `bagSuitcase4Solid`
- `ball`
- `ballRemix`
- `ballSolid`
- `balloon`
- `balloonRemix`
- `balloonSolid`
- `batteryCharging`
- `batteryChargingRemix`
- `batteryChargingSolid`
- `batteryLow1Remix`
- `batteryLow3`
- `batteryLow3Solid`
- `beach`
- `beachRemix`
- `beachSolid`
- `beerPitch`
- `beerPitchRemix`
- `beerPitchSolid`
- `bell`
- `bellRemix`
- `bellSolid`
- `bicycleBike`
- `bicycleBikeRemix`
- `bicycleBikeSolid`
- `bill1Remix`
- `binoculars`
- `binocularsRemix`
- `binocularsSolid`
- `bitcoinCircle1`
- `bitcoinCircle1Remix`
- `bitcoinCircle1Solid`
- `block1`
- `block1Remix`
- `block1Solid`
- `bluetooth`
- `bluetoothRemix`
- `bluetoothSolid`
- `bomb`
- `bombRemix`
- `bombSolid`
- `book1`
- `book1Remix`
- `book1Solid`
- `bookmark`
- `bookmark1Remix`
- `bookmarkSolid`
- `borderFrame`
- `borderFrameRemix`
- `borderFrameSolid`
- `bowlChopStick`
- `bowlChopStickRemix`
- `bowlChopStickSolid`
- `boxWaterproof`
- `boxWaterproofRemix`
- `boxWaterproofSolid`
- `brailleBlind`
- `brailleBlindRemix`
- `brailleBlindSolid`
- `brokenLink2`
- `brokenLink2Remix`
- `brokenLink2Solid`
- `browserCode1`
- `browserCode1Remix`
- `browserCode1Solid`
- `browserWebsite1`
- `browserWebsite1Remix`
- `browserWebsite1Solid`
- `bug`
- `bugRemix`
- `bugSolid`
- `bugVirusBrowser`
- `bugVirusBrowserRemix`
- `bugVirusBrowserSolid`
- `buildingOffice`
- `buildingOfficeRemix`
- `buildingOfficeSolid`
- `burger`
- `burgerRemix`
- `burgerSolid`
- `bus`
- `busRemix`
- `busSolid`
- `businessProgressBar2`
- `businessProgressBar2Remix`
- `businessProgressBar2Solid`
- `buttonPlayCircle`
- `buttonPlayCircleRemix`
- `buttonPlayCircleSolid`
- `buttonPower1`
- `buttonPower1Remix`
- `buttonPower1Solid`
- `cableSplit`
- `cableSplitRemix`
- `cableSplitSolid`
- `cakeSlice`
- `cakeSliceRemix`
- `cakeSliceSolid`
- `calculator1`
- `calculator1Remix`
- `calculator1Solid`
- `calendarAdd`
- `calendarAddRemix`
- `calendarAddSolid`
- `calendarCheck`
- `calendarCheckRemix`
- `calendarCheckSolid`
- `calendarHeart`
- `calendarHeartRemix`
- `calendarHeartSolid`
- `calendarMark`
- `calendarMarkRemix`
- `calendarMarkSolid`
- `calendarNoteRemix`
- `callCenterSupportService`
- `callCenterSupportServiceRemix`
- `callCenterSupportServiceSolid`
- `callHangUp`
- `callHangUpRemix`
- `callHangUpSolid`
- `camera1`
- `camera1Remix`
- `camera1Solid`
- `cameraVideo`
- `cameraVideoRemix`
- `cameraVideoSolid`
- `candle`
- `candleRemix`
- `candleSolid`
- `caoDai`
- `caoDaiRemix`
- `caoDaiSolid`
- `cardGameDiamond`
- `cardGameDiamondRemix`
- `cardGameDiamondSolid`
- `changeBackgroundTransparent`
- `changeBackgroundTransparentRemix`
- `changeBackgroundTransparentSolid`
- `charging`
- `chargingRemix`
- `chargingSolid`
- `chatBubbleOvalNotification`
- `chatBubbleOvalNotificationRemix`
- `chatBubbleOvalNotificationSolid`
- `chatBubbleOvalSmiley1`
- `chatBubbleOvalSmiley1Remix`
- `chatBubbleOvalSmiley1Solid`
- `chatBubbleSquareLockRemix`
- `chatBubbleSquareQuestionRemix`
- `chatBubbleSquareWarning`
- `chatBubbleSquareWarningRemix`
- `chatBubbleSquareWarningSolid`
- `chatBubbleTextSquare`
- `chatBubbleTextSquareRemix`
- `chatBubbleTextSquareSolid`
- `chatTwoBubblesOval`
- `chatTwoBubblesOvalRemix`
- `chatTwoBubblesOvalSolid`
- `checkThick`
- `checkThickRemix`
- `checkThickSolid`
- `cheese`
- `cheeseRemix`
- `cheeseSolid`
- `chefToqueHat`
- `chefToqueHatRemix`
- `chefToqueHatSolid`
- `cherries`
- `cherriesRemix`
- `cherriesSolid`
- `chessPawn`
- `chessPawnRemix`
- `chessPawnSolid`
- `circleAndSquareShape`
- `circleAndSquareShapeRemix`
- `circleAndSquareShapeSolid`
- `circleClock`
- `circleClockRemix`
- `circleClockSolid`
- `classLesson`
- `classLessonRemix`
- `classLessonSolid`
- `cleanBroomWipe`
- `cleanBroomWipeRemix`
- `cleanBroomWipeSolid`
- `cleaningRoomWoman`
- `cleaningRoomWomanRemix`
- `cleaningRoomWomanSolid`
- `cloudDataTransfer`
- `cloudDataTransferRemix`
- `cloudDataTransferSolid`
- `cloudOff`
- `cloudOffRemix`
- `cloudOffSolid`
- `codeMonitor2`
- `codeMonitor2Remix`
- `codeMonitor2Solid`
- `coffeeBean`
- `coffeeBeanRemix`
- `coffeeBeanSolid`
- `coffeeMug`
- `coffeeMugRemix`
- `coffeeMugSolid`
- `cog`
- `cog1Remix`
- `cogAutomation`
- `cogAutomationRemix`
- `cogAutomationSolid`
- `cogSolid`
- `colorPicker`
- `colorPickerRemix`
- `colorPickerSolid`
- `command`
- `commandRemix`
- `commandSolid`
- `compassNavigator`
- `compassNavigatorRemix`
- `compassNavigatorSolid`
- `compressPdf`
- `compressPdfRemix`
- `compressPdfSolid`
- `computerPcDesktop`
- `computerPcDesktopRemix`
- `computerPcDesktopSolid`
- `contactPhonebook`
- `contactPhonebookRemix`
- `contactPhonebookSolid`
- `contentStatistic`
- `contentStatisticRemix`
- `contentStatisticSolid`
- `controller1`
- `controller1Remix`
- `controller1Solid`
- `convertPdf1`
- `convertPdf1Remix`
- `convertPdf1Solid`
- `creativeCommons`
- `creativeCommonsRemix`
- `creativeCommonsSolid`
- `creditCard5`
- `creditCard5Remix`
- `creditCard5Solid`
- `cropSelection`
- `cropSelectionRemix`
- `cropSelectionSolid`
- `customerSupport3`
- `customerSupport3Remix`
- `customerSupport3Solid`
- `customerSupport7`
- `customerSupport7Remix`
- `customerSupport7Solid`
- `cut`
- `cutRemix`
- `cutSolid`
- `cyborg2`
- `cyborg2Remix`
- `cyborg2Solid`
- `darkDislayMode`
- `darkDislayModeRemix`
- `darkDislayModeSolid`
- `dashboard1`
- `dashboard1Remix`
- `dashboard1Solid`
- `dashboardGauge2`
- `dashboardGauge2Solid`
- `dashboardGaugeMedium2Remix`
- `database`
- `databaseRemix`
- `databaseServer3`
- `databaseServer3Remix`
- `databaseServer3Solid`
- `databaseSolid`
- `deepfakeTechnology1`
- `deepfakeTechnology1Remix`
- `deepfakeTechnology1Solid`
- `deleteBookmark`
- `deleteBookmarkRemix`
- `deleteBookmarkSolid`
- `deleteKeyboard`
- `deleteKeyboardRemix`
- `deleteKeyboardSolid`
- `deleteRow`
- `deleteRowRemix`
- `deleteRowSolid`
- `description`
- `descriptionRemix`
- `descriptionSolid`
- `desktopLock`
- `desktopLockRemix`
- `desktopLockSolid`
- `deviceDatabaseEncryption1`
- `deviceDatabaseEncryption1Remix`
- `deviceDatabaseEncryption1Solid`
- `diagonalTriangleArrow2Remix`
- `dialPadFinger2`
- `dialPadFinger2Remix`
- `dialPadFinger2Solid`
- `diamond1`
- `diamond1Solid`
- `diamond2Remix`
- `dicesEntertainmentGamingDices`
- `dicesEntertainmentGamingDicesRemix`
- `dicesEntertainmentGamingDicesSolid`
- `disableAlarm`
- `disableAlarmRemix`
- `disableAlarmSolid`
- `disableHeart`
- `disableHeartRemix`
- `disableHeartSolid`
- `disableProtection`
- `disableProtectionRemix`
- `disableProtectionSolid`
- `discountPercentCutout`
- `discountPercentCutoutRemix`
- `discountPercentCutoutSolid`
- `divisionCircle`
- `divisionCircleRemix`
- `divisionCircleSolid`
- `dna`
- `dnaRemix`
- `dnaSolid`
- `documentCertificate`
- `documentCertificateRemix`
- `documentCertificateSolid`
- `dog1`
- `dog1Remix`
- `dog1Solid`
- `dollarCoin`
- `dollarCoinRemix`
- `dollarCoinSolid`
- `door`
- `doorRemix`
- `doorSolid`
- `downloadBox2`
- `downloadBox2Remix`
- `downloadBox2Solid`
- `dropDownMenu`
- `dropDownMenuRemix`
- `dropDownMenuSolid`
- `dropbox`
- `dropboxLogoRemix`
- `dropboxSolid`
- `drumStick`
- `drumStickRemix`
- `drumStickSolid`
- `dumbell`
- `dumbellRemix`
- `dumbellSolid`
- `earSpeciality`
- `earSpecialityRemix`
- `earSpecialitySolid`
- `earpods`
- `earpodsRemix`
- `earpodsSolid`
- `earth1`
- `earth1Solid`
- `earth2Remix`
- `electricChargingStation`
- `electricChargingStationRemix`
- `electricChargingStationSolid`
- `electricCord1`
- `electricCord1Remix`
- `electricCord1Solid`
- `emailAttachmentDocument`
- `emailAttachmentDocumentRemix`
- `emailAttachmentDocumentSolid`
- `emptyClipboard`
- `emptyClipboardRemix`
- `emptyClipboardSolid`
- `endPointBranches`
- `endPointBranchesRemix`
- `endPointBranchesSolid`
- `endPointDiamond`
- `endPointDiamondRemix`
- `endPointDiamondSolid`
- `eraser`
- `eraserRemix`
- `eraserSolid`
- `erlenmeyerFlask`
- `erlenmeyerFlaskRemix`
- `erlenmeyerFlaskSolid`
- `escalatorUp`
- `escalatorUpRemix`
- `escalatorUpSolid`
- `exitFullScreen`
- `exitFullScreenRemix`
- `exitFullScreenSolid`
- `expandHorizontal2`
- `expandHorizontal2Solid`
- `eyeOptic`
- `eyeOpticRemix`
- `eyeOpticSolid`
- `facebook1`
- `facebook1Solid`
- `facebookLogo1Remix`
- `factoryPlant`
- `factoryPlantRemix`
- `factoryPlantSolid`
- `fahrenheit`
- `fahrenheitRemix`
- `fahrenheitSolid`
- `featherPen`
- `featherPenRemix`
- `featherPenSolid`
- `fileCheckAlternate`
- `fileCheckAlternateRemix`
- `fileCheckAlternateSolid`
- `fileFolder`
- `fileFolderRemix`
- `fileFolderSolid`
- `fileReport`
- `fileReportRemix`
- `fileReportSolid`
- `fileSearch`
- `fileSearchRemix`
- `fileSearchSolid`
- `fillAndSign`
- `fillAndSignRemix`
- `fillAndSignSolid`
- `filmSlate`
- `filmSlateRemix`
- `filmSlateSolid`
- `filter1`
- `filter1Remix`
- `filter1Solid`
- `fingerprint2`
- `fingerprint2Remix`
- `fingerprint2Solid`
- `fireEvacuation`
- `fireEvacuationRemix`
- `fireEvacuationSolid`
- `firefighterTruck`
- `firefighterTruckRemix`
- `firefighterTruckSolid`
- `fish`
- `fishSolid`
- `fitHeight`
- `fitHeightRemix`
- `fitHeightSolid`
- `fitToWidthSquare`
- `fitToWidthSquareSolid`
- `fitWidthRemix`
- `flash1`
- `flash1Remix`
- `flash1Solid`
- `flashlight`
- `flashlightRemix`
- `flashlightSolid`
- `flipHorizontalCircle1`
- `flipHorizontalCircle1Remix`
- `flipHorizontalCircle1Solid`
- `floppyDisk`
- `floppyDiskRemix`
- `floppyDiskSolid`
- `focusPoints`
- `focusPointsRemix`
- `focusPointsSolid`
- `foodTruckEventFair`
- `foodTruckEventFairRemix`
- `foodTruckEventFairSolid`
- `forkKnife`
- `forkKnifeRemix`
- `forkKnifeSolid`
- `forkPlate`
- `forkPlateRemix`
- `forkPlateSolid`
- `fragile`
- `fragileRemix`
- `fragileSolid`
- `friedEggBreakfast`
- `friedEggBreakfastRemix`
- `friedEggBreakfastSolid`
- `galaxy2`
- `galaxy2Remix`
- `galaxy2Solid`
- `gallery2`
- `gallery2Remix`
- `gallery2Solid`
- `gameboy`
- `gameboyRemix`
- `gameboySolid`
- `gift`
- `giftRemix`
- `giftSolid`
- `giveGift`
- `giveGiftRemix`
- `giveGiftSolid`
- `globalLearning`
- `globalLearningRemix`
- `globalLearningSolid`
- `globalWarming2`
- `globalWarming2Remix`
- `globalWarming2Solid`
- `gold`
- `goldRemix`
- `goldSolid`
- `governmentBuilding1`
- `governmentBuilding1Remix`
- `governmentBuilding1Solid`
- `graduationCap`
- `graduationCapRemix`
- `graduationCapSolid`
- `graphArrowUserIncrease`
- `graphArrowUserIncreaseRemix`
- `graphArrowUserIncreaseSolid`
- `graphBarIncrease`
- `graphBarIncreaseRemix`
- `graphBarIncreaseSolid`
- `graphDot`
- `graphDotRemix`
- `graphDotSolid`
- `graphicTemplateWebsiteUi`
- `graphicTemplateWebsiteUiRemix`
- `graphicTemplateWebsiteUiSolid`
- `halfStar2`
- `halfStar2Remix`
- `halfStar2Solid`
- `handHeld`
- `handHeldRemix`
- `handHeldSolid`
- `hardDrive2`
- `hardDrive2Remix`
- `hardDrive2Solid`
- `heartRatePulseGraph`
- `heartRatePulseGraphRemix`
- `heartRatePulseGraphSolid`
- `heater`
- `heaterRemix`
- `heaterSolid`
- `helpChat1`
- `helpChat1Solid`
- `hierarchy1`
- `hierarchy1Remix`
- `hierarchy1Solid`
- `hierarchy15`
- `hierarchy15Remix`
- `hierarchy15Solid`
- `highSpeedTrainSide`
- `highSpeedTrainSideRemix`
- `highSpeedTrainSideSolid`
- `home1`
- `home1Remix`
- `home1Solid`
- `horizonalScroll`
- `horizonalScrollSolid`
- `horizontalMenuCircle`
- `horizontalMenuCircleRemix`
- `horizontalMenuCircleSolid`
- `horizontalSliderSquare`
- `horizontalSliderSquareRemix`
- `horizontalSliderSquareSolid`
- `hospitalSignSquare`
- `hospitalSignSquareRemix`
- `hospitalSignSquareSolid`
- `hotAirBalloon`
- `hotAirBalloonRemix`
- `hotAirBalloonSolid`
- `hotSpring`
- `hotSpringSolid`
- `hotelBed5`
- `hotelBed5Remix`
- `hotelBed5Solid`
- `hotelFiveStar`
- `hotelFiveStarRemix`
- `hotelFiveStarSolid`
- `hourglass`
- `hourglassRemix`
- `hourglassSolid`
- `htmlFive`
- `htmlFiveRemix`
- `htmlFiveSolid`
- `iceCream2`
- `iceCream2Remix`
- `iceCream2Solid`
- `imageSaturation`
- `imageSaturationSolid`
- `imageSaturationVerticalRemix`
- `inboxContent`
- `inboxContentRemix`
- `inboxContentSolid`
- `inboxPost`
- `inboxPostRemix`
- `inboxPostSolid`
- `incognitoMode`
- `incognitoModeRemix`
- `incognitoModeSolid`
- `industryInnovationAndInfrastructure`
- `industryInnovationAndInfrastructureRemix`
- `industryInnovationAndInfrastructureSolid`
- `informationCircle`
- `informationCircleRemix`
- `informationCircleSolid`
- `informationDesk`
- `informationDeskRemix`
- `informationDeskSolid`
- `inputBox`
- `inputBoxRemix`
- `inputBoxSolid`
- `insertColumn`
- `insertColumnRemix`
- `insertColumnSolid`
- `insertSide`
- `insertSideRemix`
- `insertSideSolid`
- `insuranceHand`
- `insuranceHandRemix`
- `insuranceHandSolid`
- `intellectual`
- `intellectualRemix`
- `intellectualSolid`
- `intersexSymbol`
- `intersexSymbolRemix`
- `intersexSymbolSolid`
- `invisible1`
- `invisible1Remix`
- `invisible1Solid`
- `invisible2`
- `invisible2Remix`
- `invisible2Solid`
- `iosIpados`
- `iosIpadosRemix`
- `iosIpadosSolid`
- `ipadTabletScreen`
- `ipadTabletScreenRemix`
- `ipadTabletScreenSolid`
- `irisScan`
- `irisScanRemix`
- `irisScanSolid`
- `justiceScale2`
- `justiceScale2Remix`
- `justiceScale2Solid`
- `keyboard`
- `keyboardRemix`
- `keyboardSolid`
- `keyholeLockCircle`
- `keyholeLockCircleRemix`
- `keyholeLockCircleSolid`
- `ladder`
- `ladderRemix`
- `ladderSolid`
- `landing`
- `landingRemix`
- `landingSolid`
- `landscapeView`
- `landscapeViewRemix`
- `landscapeViewSolid`
- `laptop`
- `laptopRemix`
- `laptopSolid`
- `layerMask`
- `layerMaskRemix`
- `layerMaskSolid`
- `layers1`
- `layers1Remix`
- `layers1Solid`
- `layoutRightSidebar`
- `layoutRightSidebarRemix`
- `layoutRightSidebarSolid`
- `layoutWindow4`
- `layoutWindow4Remix`
- `layoutWindow4Solid`
- `leafProtect`
- `leafProtectRemix`
- `leafProtectSolid`
- `lens`
- `lensRemix`
- `lensSolid`
- `lift`
- `liftRemix`
- `liftSolid`
- `lightbulb`
- `lightbulbRemix`
- `lightbulbSolid`
- `lightningCloud`
- `lightningCloudRemix`
- `lightningCloudSolid`
- `like1`
- `like1Remix`
- `like1Solid`
- `lineArrowExpandHorizontalRemix`
- `lineArrowRightCircle2Remix`
- `lineArrowTransferHorizontalSquare1Remix`
- `linkChain`
- `linkChainRemix`
- `linkChainSolid`
- `lipstick`
- `lipstickRemix`
- `lipstickSolid`
- `loadingCircle`
- `loadingCircleRemix`
- `loadingCircleSolid`
- `loadingHorizontal2`
- `loadingHorizontal2Remix`
- `loadingHorizontal2Solid`
- `locationHeartPin`
- `locationHeartPinRemix`
- `locationHeartPinSolid`
- `locationPin`
- `locationPin3`
- `locationPin3Remix`
- `locationPin3Solid`
- `locationPinDisabled`
- `locationPinDisabledRemix`
- `locationPinDisabledSolid`
- `locationPinRemix`
- `locationPinSolid`
- `lockCommentSecurity`
- `lockCommentSecuritySolid`
- `log`
- `logRemix`
- `logSolid`
- `login1`
- `login1Remix`
- `login1Solid`
- `lostAndFound`
- `lostAndFoundRemix`
- `lostAndFoundSolid`
- `magicWand1`
- `magicWand1Remix`
- `magicWand1Solid`
- `magnet`
- `magnetRemix`
- `magnetSolid`
- `mailNotification`
- `mailNotificationRemix`
- `mailNotificationSolid`
- `mailOutgoing`
- `mailOutgoingRemix`
- `mailOutgoingSolid`
- `mailSearch`
- `mailSearchRemix`
- `mailSearchSolid`
- `mailSend`
- `mailSendEmailMessage`
- `mailSendEmailMessageRemix`
- `mailSendEmailMessageSolid`
- `mailSendRemix`
- `mailSendReplyAll`
- `mailSendReplyAllRemix`
- `mailSendReplyAllSolid`
- `mailSendSolid`
- `mailSetting`
- `mailSettingGearRemix`
- `mailSettingSolid`
- `mall`
- `mallRemix`
- `mallSolid`
- `manArmRaises2Alternate`
- `manArmRaises2AlternateRemix`
- `manArmRaises2AlternateSolid`
- `mapFold`
- `mapFoldRemix`
- `mapFoldSolid`
- `mapLocationStarPin`
- `mapLocationStarPinRemix`
- `mapLocationStarPinSolid`
- `maximize1`
- `maximize1Remix`
- `maximize1Solid`
- `medicalBag`
- `medicalBagRemix`
- `medicalBagSolid`
- `megaphoneRefresh`
- `megaphoneRefreshRemix`
- `megaphoneRefreshSolid`
- `memesCommentReply`
- `memesCommentReplyRemix`
- `memesCommentReplySolid`
- `microscopeObservationSciene`
- `microscopeObservationScieneRemix`
- `microscopeObservationScieneSolid`
- `module`
- `moduleRemix`
- `moduleSolid`
- `moneyCashBill1`
- `moneyCashBill1Solid`
- `moonStars`
- `moonStarsRemix`
- `moonStarsSolid`
- `mouseWireless`
- `mouseWireless1`
- `mouseWireless1Remix`
- `mouseWireless1Solid`
- `mouseWirelessRemix`
- `mouseWirelessSolid`
- `moustache`
- `moustacheRemix`
- `moustacheSolid`
- `multipleFile1`
- `multipleFile1Remix`
- `multipleFile1Solid`
- `multipleStars`
- `multipleStarsRemix`
- `multipleStarsSolid`
- `musicNote2`
- `musicNote2Remix`
- `musicNote2Solid`
- `musicNoteTrebbleClef`
- `musicNoteTrebbleClefRemix`
- `musicNoteTrebbleClefSolid`
- `navigationArrowOff`
- `navigationArrowOffRemix`
- `navigationArrowOffSolid`
- `newFolder`
- `newFolderRemix`
- `newFolderSolid`
- `newsPaper`
- `newsPaperRemix`
- `newsPaperSolid`
- `nintendoXboxController1`
- `nintendoXboxController1Remix`
- `nintendoXboxController1Solid`
- `noPhotoTakingZone`
- `noPhotoTakingZoneRemix`
- `noPhotoTakingZoneSolid`
- `noPoverty`
- `noPovertyRemix`
- `noPovertySolid`
- `noSmakingArea`
- `noSmakingAreaRemix`
- `noSmakingAreaSolid`
- `noTouchSign`
- `noTouchSignRemix`
- `noTouchSignSolid`
- `notepadText`
- `notepadTextSolid`
- `notificationAlarmSnooze`
- `notificationAlarmSnoozeRemix`
- `notificationAlarmSnoozeSolid`
- `notificationAlert`
- `notificationAlertRemix`
- `notificationAlertSolid`
- `octagramShape`
- `octagramShapeRemix`
- `octagramShapeSolid`
- `officeWorker`
- `officeWorkerRemix`
- `officeWorkerSolid`
- `okHand`
- `okHandRemix`
- `okHandSolid`
- `oneFingerTap`
- `oneFingerTapRemix`
- `oneFingerTapSolid`
- `oneHandedHoldingTabletHandheld`
- `oneHandedHoldingTabletHandheldRemix`
- `oneHandedHoldingTabletHandheldSolid`
- `openUmbrella`
- `openUmbrellaRemix`
- `openUmbrellaSolid`
- `pacman`
- `pacmanRemix`
- `pacmanSolid`
- `padlockKey`
- `padlockKeyRemix`
- `padlockKeySolid`
- `padlockSquare2`
- `padlockSquare2Remix`
- `padlockSquare2Solid`
- `pageSetting`
- `pageSettingRemix`
- `pageSettingSolid`
- `paintBucket`
- `paintBucketRemix`
- `paintBucketSolid`
- `paintPalette`
- `paintPaletteRemix`
- `paintPaletteSolid`
- `paintbrush2`
- `paintbrush2Remix`
- `paintbrush2Solid`
- `paintingBoard`
- `paintingBoardRemix`
- `paintingBoardSolid`
- `panoramicScreen`
- `panoramicScreenRemix`
- `panoramicScreenSolid`
- `parachuteDrop`
- `parachuteDropRemix`
- `parachuteDropSolid`
- `park`
- `parkRemix`
- `parkSolid`
- `passwordLock`
- `passwordLockRemix`
- `passwordLockSolid`
- `pathfinderOutline`
- `pathfinderOutlineSolid`
- `pathfinderSquareDivideRemix`
- `paymentRecieve7`
- `paymentRecieve7Remix`
- `paymentRecieve7Solid`
- `pen1`
- `pen1Remix`
- `pen1Solid`
- `penTool`
- `penToolRemix`
- `penToolSolid`
- `pencilCircle`
- `pencilCircleRemix`
- `pencilCircleSolid`
- `pencilSquare`
- `pencilSquareRemix`
- `pencilSquareSolid`
- `petPaw`
- `petPawRemix`
- `petPawSolid`
- `pharmacy`
- `pharmacyRemix`
- `pharmacySolid`
- `phone`
- `phoneRemix`
- `phoneSolid`
- `phoneVibrate`
- `phoneVibrateRemix`
- `phoneVibrateSolid`
- `piggyBank`
- `piggyBankRemix`
- `piggyBankSolid`
- `pin2`
- `pin2Remix`
- `pin2Solid`
- `pinwheel`
- `pinwheelRemix`
- `pinwheelSolid`
- `playList1`
- `playList1Remix`
- `playList1Solid`
- `playListFolder`
- `playListFolderRemix`
- `playListFolderSolid`
- `polaroid`
- `polaroidRemix`
- `polaroidSolid`
- `politicsVote2`
- `politicsVote2Remix`
- `politicsVote2Solid`
- `poolLadder`
- `poolLadderRemix`
- `poolLadderSolid`
- `porkMeat`
- `porkMeatRemix`
- `porkMeatSolid`
- `pottedFlower`
- `pottedFlowerRemix`
- `pottedFlowerSolid`
- `poundCircle`
- `poundCircleRemix`
- `poundCircleSolid`
- `presentation`
- `presentationRemix`
- `presentationSolid`
- `printer`
- `printerRemix`
- `printerSolid`
- `productionBelt`
- `productionBeltRemix`
- `productionBeltSolid`
- `projectorScreen`
- `projectorScreenRemix`
- `projectorScreenSolid`
- `pyramidShape`
- `pyramidShapeRemix`
- `pyramidShapeSolid`
- `quotation2`
- `quotation2Remix`
- `quotation2Solid`
- `radioactive1`
- `radioactive1Remix`
- `radioactive1Solid`
- `receiptCross`
- `receiptCrossRemix`
- `receiptCrossSolid`
- `recordingTape1`
- `recordingTape1Remix`
- `recordingTape1Solid`
- `rectangleFlag`
- `rectangleFlagRemix`
- `rectangleFlagSolid`
- `recycle1`
- `recycle1Remix`
- `recycle1Solid`
- `recycleBin`
- `recycleBin2`
- `recycleBin2Remix`
- `recycleBin2Solid`
- `recycleBin3`
- `recycleBin3Remix`
- `recycleBin3Solid`
- `recycleBinRemix`
- `recycleBinSolid`
- `reducedInequalities`
- `reducedInequalitiesRemix`
- `reducedInequalitiesSolid`
- `refrigerator`
- `refrigeratorRemix`
- `refrigeratorSolid`
- `replyToMessageTyping`
- `replyToMessageTypingRemix`
- `replyToMessageTypingSolid`
- `resetClock`
- `resetClockRemix`
- `resetClockSolid`
- `return3`
- `return3Remix`
- `return3Solid`
- `ringingBellNotification`
- `ringingBellNotificationRemix`
- `ringingBellNotificationSolid`
- `rotateLeft`
- `rotateLeft1Remix`
- `rotateLeftSolid`
- `roundAnchorPoint`
- `roundAnchorPointRemix`
- `roundAnchorPointSolid`
- `rssSquare`
- `rssSquareRemix`
- `rssSquareSolid`
- `ruler`
- `rulerRemix`
- `rulerSolid`
- `sadFace`
- `sadFaceRemix`
- `sadFaceSolid`
- `safari`
- `safariLogoRemix`
- `safariSolid`
- `safeVault`
- `safeVaultRemix`
- `safeVaultSolid`
- `sailShip`
- `sailShipRemix`
- `sailShipSolid`
- `scissors`
- `scissorsRemix`
- `scissorsSolid`
- `screen1`
- `screen1Remix`
- `screen1Solid`
- `screwdriver`
- `screwdriverRemix`
- `screwdriverSolid`
- `script2`
- `script2Remix`
- `script2Solid`
- `sdCard`
- `sdCardRemix`
- `sdCardSolid`
- `searchVisual`
- `searchVisualRemix`
- `searchVisualSolid`
- `selectAll`
- `selectAllRemix`
- `selectAllSolid`
- `selectCircleArea1`
- `selectCircleArea1Remix`
- `selectCircleArea1Solid`
- `shareLink`
- `shareLinkRemix`
- `shareLinkSolid`
- `shareLock`
- `shareLockRemix`
- `shareLockSolid`
- `shield1`
- `shield1Remix`
- `shield1Solid`
- `shipmentUpload`
- `shipmentUploadRemix`
- `shipmentUploadSolid`
- `shippingBox1`
- `shippingBox1Remix`
- `shippingBox1Solid`
- `shoppingBasket1`
- `shoppingBasket1Remix`
- `shoppingBasket1Solid`
- `shoppingCartAdd`
- `shoppingCartAddRemix`
- `shoppingCartAddSolid`
- `shuffle`
- `shuffleRemix`
- `shuffleSolid`
- `signAt`
- `signAtRemix`
- `signAtSolid`
- `signalFull`
- `signalFullRemix`
- `signalFullSolid`
- `sizing`
- `sizingRemix`
- `sizingSolid`
- `skull2`
- `skull2Remix`
- `skull2Solid`
- `slack`
- `slackLogoRemix`
- `slackSolid`
- `smileyDrool`
- `smileyDroolRemix`
- `smileyDroolSolid`
- `smileyIndiferent`
- `smileyIndiferentRemix`
- `smileyIndiferentSolid`
- `smileyLaughing1`
- `smileyLaughing1Remix`
- `smileyLaughing1Solid`
- `smileySparks`
- `smileySparksRemix`
- `smileySparksSolid`
- `smokingArea`
- `smokingAreaRemix`
- `smokingAreaSolid`
- `sofa`
- `sofaRemix`
- `sofaSolid`
- `speaker2`
- `speaker2Remix`
- `speaker2Solid`
- `spiralShape`
- `spiralShapeRemix`
- `spiralShapeSolid`
- `spotify`
- `spotifyLogoRemix`
- `spotifySolid`
- `stamp`
- `stampRemix`
- `stampSolid`
- `starCircle`
- `starCircleRemix`
- `starCircleSolid`
- `starMedal`
- `starMedal1Remix`
- `starMedalSolid`
- `steps1`
- `steps1Remix`
- `steps1Solid`
- `stock`
- `stockRemix`
- `stockSolid`
- `stool`
- `stoolRemix`
- `stoolSolid`
- `stopwatchHalf`
- `stopwatchHalfRemix`
- `stopwatchHalfSolid`
- `store1Remix`
- `store2`
- `store2Solid`
- `strawberry`
- `strawberryRemix`
- `strawberrySolid`
- `streetSign`
- `streetSignRemix`
- `streetSignSolid`
- `stroller`
- `strollerRemix`
- `strollerSolid`
- `suitcaseRolling`
- `suitcaseRollingRemix`
- `suitcaseRollingSolid`
- `sun`
- `sunRemix`
- `sunSolid`
- `sunset`
- `sunsetRemix`
- `sunsetSolid`
- `synchronize`
- `synchronizeSolid`
- `table`
- `tableRemix`
- `tableSolid`
- `tabletCapsule`
- `tabletCapsuleRemix`
- `tabletCapsuleSolid`
- `tagAlt`
- `tagAltRemix`
- `tagAltSolid`
- `taillessLineArrowHorizonalScrollRemix`
- `taillessLineArrowRightCircleRemix`
- `taillessLineArrowUp2Remix`
- `target3`
- `target3Remix`
- `target3Solid`
- `taskListEdit`
- `taskListEditRemix`
- `taskListEditSolid`
- `telescope`
- `telescopeRemix`
- `telescopeSolid`
- `testTube`
- `testTubeRemix`
- `testTubeSolid`
- `textBox1`
- `textBox1Remix`
- `textBox1Solid`
- `textImageCenterLarge`
- `textImageCenterLargeRemix`
- `textImageCenterLargeSolid`
- `textShadow`
- `textShadowRemix`
- `textShadowSolid`
- `theaterMask`
- `theaterMaskRemix`
- `theaterMaskSolid`
- `thermometer`
- `thermometerRemix`
- `thermometerSolid`
- `threatPhone`
- `threatPhoneRemix`
- `threatPhoneSolid`
- `ticket1`
- `ticket1Remix`
- `ticket1Solid`
- `tiktok`
- `tiktokLogoRemix`
- `tiktokSolid`
- `toast`
- `toastRemix`
- `toastSolid`
- `toiletMan`
- `toiletManRemix`
- `toiletManSolid`
- `toiletSignMan`
- `toiletSignManRemix`
- `toiletSignManSolid`
- `toiletWomen`
- `toiletWomenRemix`
- `toiletWomenSolid`
- `toolBox`
- `toolBoxRemix`
- `toolBoxSolid`
- `topOrderReport`
- `topOrderReportRemix`
- `topOrderReportSolid`
- `trafficLight`
- `trafficLightRemix`
- `trafficLightSolid`
- `transparent`
- `transparentRemix`
- `transparentSolid`
- `travelPlacesHotSpringRemix`
- `treasureChest`
- `treasureChestRemix`
- `treasureChestSolid`
- `tree1`
- `tree1Remix`
- `tree1Solid`
- `trendingContent`
- `trendingContentRemix`
- `trendingContentSolid`
- `triangleArrowCurvyBothDirection2Remix`
- `triangleArrowExpandRemix`
- `triangleArrowRoadmapRemix`
- `triangleArrowSynchronize2Remix`
- `triangleArrowTurnDownLeftLargeRemix`
- `tuneAdjustVolume`
- `tuneAdjustVolumeRemix`
- `tuneAdjustVolumeSolid`
- `uploadBox1`
- `uploadBox1Solid`
- `usbPort`
- `usbPortRemix`
- `usbPortSolid`
- `userFaceIdMask`
- `userFaceIdMaskRemix`
- `userFaceIdMaskSolid`
- `userFaceMale`
- `userFaceMaleRemix`
- `userFaceMaleSolid`
- `userFeedbackHeart`
- `userFeedbackHeartRemix`
- `userFeedbackHeartSolid`
- `userMultipleAccounts`
- `userMultipleAccountsRemix`
- `userMultipleAccountsSolid`
- `userPin`
- `userPinRemix`
- `userPinSolid`
- `userPodcast`
- `userPodcastRemix`
- `userPodcastSolid`
- `userProtection1Remix`
- `userProtectionCheck`
- `userProtectionCheckSolid`
- `userSingleNeutralMale`
- `userSingleNeutralMaleRemix`
- `userSingleNeutralMaleSolid`
- `userStickerSquare`
- `userStickerSquareRemix`
- `userStickerSquareSolid`
- `userSwitchAccount`
- `userSwitchAccountRemix`
- `userSwitchAccountSolid`
- `videoCloseCaptioning`
- `videoCloseCaptioningRemix`
- `videoCloseCaptioningSolid`
- `videoSubtitles`
- `videoSubtitlesRemix`
- `videoSubtitlesSolid`
- `virtualReality`
- `virtualRealityRemix`
- `virtualRealitySolid`
- `virusAntivirus`
- `virusAntivirusRemix`
- `virusAntivirusSolid`
- `visualBlind`
- `visualBlindRemix`
- `visualBlindSolid`
- `voiceActivation1`
- `voiceActivation1Remix`
- `voiceActivation1Solid`
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
- `vpnConnection`
- `vpnConnectionRemix`
- `vpnConnectionSolid`
- `wallet`
- `walletRemix`
- `walletSolid`
- `warehouse1`
- `warehouse1Remix`
- `warehouse1Solid`
- `warningDiamond`
- `warningDiamondRemix`
- `warningDiamondSolid`
- `warpSqueeze`
- `warpSqueezeRemix`
- `warpSqueezeSolid`
- `watch1`
- `watch1Remix`
- `watch1Solid`
- `watchCircleMenu`
- `watchCircleMenuRemix`
- `watchCircleMenuSolid`
- `waterMelon`
- `waterMelonRemix`
- `waterMelonSolid`
- `waveSignalSquare`
- `waveSignalSquareRemix`
- `waveSignalSquareSolid`
- `wavingHand`
- `wavingHandRemix`
- `wavingHandSolid`
- `web`
- `webRemix`
- `webSolid`
- `webcamOff`
- `webcamOffRemix`
- `webcamOffSolid`
- `webcamVideo`
- `webcamVideoRemix`
- `webcamVideoSolid`
- `wheat`
- `wheatSolid`
- `wheelchair2`
- `wheelchair2Remix`
- `wheelchair2Solid`
- `widget`
- `widgetRemix`
- `widgetSolid`
- `wifi`
- `wifiSignalFullRemix`
- `wifiSolid`
- `wine`
- `wineRemix`
- `wineSolid`
- `workspaceDesk`
- `workspaceDeskRemix`
- `workspaceDeskSolid`
- `world`
- `worldRemix`
- `worldSolid`
- `wrapArch`
- `wrapArchRemix`
- `wrapArchSolid`
- `wrenchCircle`
- `wrenchCircleRemix`
- `wrenchCircleSolid`
- `yinYangSymbol`
- `yinYangSymbolRemix`
- `yinYangSymbolSolid`
- `zoomIn`
- `zoomInGesture`
- `zoomInGestureRemix`
- `zoomInGestureSolid`
- `zoomInRemix`
- `zoomInSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dCoordinateAxisIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dCoordinateAxisRemixIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dCoordinateAxisSolidIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddBellNotificationIcon size="20" class="nav-icon" /> Settings</a>
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
<3dCoordinateAxisIcon
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
    <3dCoordinateAxisIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dCoordinateAxisRemixIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dCoordinateAxisSolidIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dCoordinateAxisIcon size="24" />
   <3dCoordinateAxisRemixIcon size="24" color="#4a90e2" />
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
   <3dCoordinateAxisIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dCoordinateAxisIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dCoordinateAxisIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-plump'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dCoordinateAxis, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-plump'

// Icons are typed as IconData
const myIcon: IconData = 3dCoordinateAxis
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-plump/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-plump/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
