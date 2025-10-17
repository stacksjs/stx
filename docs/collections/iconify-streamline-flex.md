# Flex free icons

> Flex free icons icons for stx from Iconify

## Overview

This package provides access to 1500 icons from the Flex free icons collection through the stx iconify integration.

**Collection ID:** `streamline-flex`
**Total Icons:** 1500
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-flex
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
import { 3dCoordinateAxis, 3dCoordinateAxisRemix, 3dCoordinateAxisSolid } from '@stacksjs/iconify-streamline-flex'
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
.streamlineFlex-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dCoordinateAxisIcon class="streamlineFlex-icon" />
```

## Available Icons

This package contains **1500** icons:

- `3dCoordinateAxis`
- `3dCoordinateAxisRemix`
- `3dCoordinateAxisSolid`
- `3dRotate1`
- `3dRotate1Remix`
- `3dRotate1Solid`
- `3dRotateYAxis`
- `3dRotateYAxisRemix`
- `3dRotateYAxisSolid`
- `addToPlaylist`
- `addToPlaylistRemix`
- `addToPlaylistSolid`
- `aiChipRobot`
- `aiChipRobotRemix`
- `aiChipRobotSolid`
- `aiGeneratePortraitImageSpark`
- `aiGeneratePortraitImageSparkRemix`
- `aiGeneratePortraitImageSparkSolid`
- `aiScannerRobot`
- `aiScannerRobotRemix`
- `aiScannerRobotSolid`
- `airplaneDisabled`
- `airplaneDisabledRemix`
- `airplaneDisabledSolid`
- `airportPlane`
- `airportPlaneRemix`
- `airportPlaneSolid`
- `airship`
- `airshipRemix`
- `airshipSolid`
- `alien`
- `alienRemix`
- `alienSolid`
- `alignBack1`
- `alignBack1Remix`
- `alignBack1Solid`
- `alignSelection`
- `alignSelectionRemix`
- `alignSelectionSolid`
- `alignTextTop`
- `alignTextTopRemix`
- `alignTextTopSolid`
- `alignTop1`
- `alignTop1Remix`
- `alignTop1Solid`
- `allergensFish`
- `allergensFishRemix`
- `allergensFishSolid`
- `anchor`
- `anchorRemix`
- `anchorSolid`
- `apple`
- `appleLogoRemix`
- `appleSolid`
- `applicationAdd`
- `applicationAddRemix`
- `applicationAddSolid`
- `archiveBox`
- `archiveBoxRemix`
- `archiveBoxSolid`
- `arrowCursor2`
- `arrowCursor2Remix`
- `arrowCursor2Solid`
- `arrowCursorClick2`
- `arrowCursorClick2Remix`
- `arrowCursorClick2Solid`
- `arrowCursorMove`
- `arrowCursorMoveRemix`
- `arrowCursorMoveSolid`
- `arrowExpand`
- `arrowExpandSolid`
- `arrowMove`
- `arrowMoveSolid`
- `arrowRoadmap`
- `arrowRoadmapSolid`
- `artificialIntelligenceBrainChip`
- `artificialIntelligenceBrainChipRemix`
- `artificialIntelligenceBrainChipSolid`
- `artistSong`
- `artistSongRemix`
- `artistSongSolid`
- `autoCorrectionCheck`
- `autoCorrectionCheckRemix`
- `autoCorrectionCheckSolid`
- `bag`
- `bagRemix`
- `bagSolid`
- `bagSuitcase4`
- `bagSuitcase4Remix`
- `bagSuitcase4Solid`
- `baggage`
- `baggageRemix`
- `baggageSolid`
- `ball`
- `ballRemix`
- `ballSolid`
- `balloon`
- `balloonRemix`
- `balloonSolid`
- `batteryCharging`
- `batteryChargingRemix`
- `batteryChargingSolid`
- `batteryMedium1`
- `batteryMedium1Remix`
- `batteryMedium1Solid`
- `bell`
- `bellNotification`
- `bellNotificationRemix`
- `bellNotificationSolid`
- `bellRemix`
- `bellSolid`
- `bicycleBike`
- `bicycleBikeRemix`
- `bicycleBikeSolid`
- `bill4`
- `bill4Remix`
- `bill4Solid`
- `binoculars`
- `binocularsRemix`
- `binocularsSolid`
- `blankCalendar`
- `blankCalendarRemix`
- `blankCalendarSolid`
- `block2`
- `block2Remix`
- `block2Solid`
- `bloodDonateDrop`
- `bloodDonateDropRemix`
- `bloodDonateDropSolid`
- `bluetoothDisabled`
- `bluetoothDisabledRemix`
- `bluetoothDisabledSolid`
- `bluetoothSearching`
- `bluetoothSearchingRemix`
- `bluetoothSearchingSolid`
- `bookReading`
- `bookReadingRemix`
- `bookReadingSolid`
- `bookmark`
- `bookmarkRemix`
- `bookmarkSolid`
- `bowTie`
- `bowTieRemix`
- `bowTieSolid`
- `brightness1`
- `brightness1Remix`
- `brightness1Solid`
- `brightness4`
- `brightness4Remix`
- `brightness4Solid`
- `brokenLink1`
- `brokenLink1Remix`
- `brokenLink1Solid`
- `browserBookmark`
- `browserBookmarkRemix`
- `browserBookmarkSolid`
- `browserDashboard`
- `browserDashboardRemix`
- `browserDashboardSolid`
- `browserMultipleWindow`
- `browserMultipleWindowRemix`
- `browserMultipleWindowSolid`
- `bugAntivirusShield`
- `bugAntivirusShieldRemix`
- `bugAntivirusShieldSolid`
- `building1`
- `building1Remix`
- `building1Solid`
- `buttonMoveCircle`
- `buttonMoveCircleRemix`
- `buttonMoveCircleSolid`
- `buttonPauseCircle`
- `buttonPauseCircleRemix`
- `buttonPauseCircleSolid`
- `buttonPower1`
- `buttonPower1Remix`
- `buttonPower1Solid`
- `buttonRecord1`
- `buttonRecord1Remix`
- `buttonRecord1Solid`
- `cakeSlice`
- `cakeSliceRemix`
- `cakeSliceSolid`
- `calculator1`
- `calculator1Remix`
- `calculator1Solid`
- `calendarMark`
- `calendarMarkRemix`
- `calendarMarkSolid`
- `callCenterSupportService`
- `callCenterSupportServiceRemix`
- `callCenterSupportServiceSolid`
- `camera1`
- `camera1Remix`
- `camera1Solid`
- `cameraSettingGear`
- `cameraSettingGearRemix`
- `cameraSettingGearSolid`
- `cameraTripod`
- `cameraTripodRemix`
- `cameraTripodSolid`
- `cameraVideo`
- `cameraVideoRemix`
- `cameraVideoSolid`
- `campfire`
- `campfireRemix`
- `campfireSolid`
- `campingTent`
- `campingTentRemix`
- `campingTentSolid`
- `carTaxi1`
- `carTaxi1Remix`
- `carTaxi1Solid`
- `carrot`
- `carrotRemix`
- `carrotSolid`
- `cashingCheck`
- `cashingCheckRemix`
- `cashingCheckSolid`
- `cat2`
- `cat2Remix`
- `cat2Solid`
- `cellularNetworkLte`
- `cellularNetworkLteRemix`
- `cellularNetworkLteSolid`
- `champagnePartyAlcohol`
- `champagnePartyAlcoholRemix`
- `champagnePartyAlcoholSolid`
- `charging`
- `chargingRemix`
- `chargingSolid`
- `chatBubbleSquarePhone`
- `chatBubbleSquarePhoneRemix`
- `chatBubbleSquarePhoneSolid`
- `chatBubbleTextSquare`
- `chatBubbleTextSquareRemix`
- `chatBubbleTextSquareSolid`
- `chatBubbleTypingOval`
- `chatBubbleTypingOvalRemix`
- `chatBubbleTypingOvalSolid`
- `checkSquare`
- `checkSquareRemix`
- `checkSquareSolid`
- `checkupMedicalReportClipboard`
- `checkupMedicalReportClipboardRemix`
- `checkupMedicalReportClipboardSolid`
- `chefToqueHat`
- `chefToqueHatRemix`
- `chefToqueHatSolid`
- `chessKing`
- `chessKingRemix`
- `chessKingSolid`
- `cityHall`
- `cityHallRemix`
- `cityHallSolid`
- `cleanBroomWipe`
- `cleanBroomWipeRemix`
- `cleanBroomWipeSolid`
- `cloud`
- `cloudDataTransfer`
- `cloudDataTransferRemix`
- `cloudDataTransferSolid`
- `cloudDownload`
- `cloudDownloadRemix`
- `cloudDownloadSolid`
- `cloudOff`
- `cloudOffRemix`
- `cloudOffSolid`
- `cloudRemix`
- `cloudSolid`
- `cloudWarning`
- `cloudWarningRemix`
- `cloudWarningSolid`
- `cocktail`
- `cocktailRemix`
- `cocktailSolid`
- `codeAnalysis`
- `codeAnalysisRemix`
- `codeAnalysisSolid`
- `codeMonitor1`
- `codeMonitor1Remix`
- `codeMonitor1Solid`
- `cog`
- `cogRemix`
- `cogSolid`
- `coinShare`
- `coinShareRemix`
- `coinShareSolid`
- `colorPicker`
- `colorPickerRemix`
- `colorPickerSolid`
- `colorSwatches`
- `colorSwatchesRemix`
- `colorSwatchesSolid`
- `compsitionHorizontal`
- `compsitionHorizontalRemix`
- `compsitionHorizontalSolid`
- `computerChip1`
- `computerChip1Remix`
- `computerChip1Solid`
- `contactBook`
- `contactBookRemix`
- `contactBookSolid`
- `contactPhonebook2`
- `contactPhonebook2Remix`
- `contactPhonebook2Solid`
- `controllerStick`
- `controllerStickRemix`
- `controllerStickSolid`
- `controllerWireless`
- `controllerWirelessRemix`
- `controllerWirelessSolid`
- `copy2`
- `copy2Remix`
- `copy2Solid`
- `countdownTimer`
- `countdownTimerRemix`
- `countdownTimerSolid`
- `creditCard4`
- `creditCard4Remix`
- `creditCard4Solid`
- `creditCardApproved`
- `creditCardApprovedRemix`
- `creditCardApprovedSolid`
- `creditCardDisable`
- `creditCardDisableRemix`
- `creditCardDisableSolid`
- `criticalThinking2`
- `criticalThinking2Remix`
- `criticalThinking2Solid`
- `crown`
- `crownRemix`
- `crownSolid`
- `cube`
- `cubeRemix`
- `cubeSolid`
- `cursorClick`
- `cursorClickRemix`
- `cursorClickSolid`
- `curvesLevelsGraph`
- `curvesLevelsGraphRemix`
- `curvesLevelsGraphSolid`
- `customerSupport5`
- `customerSupport5Remix`
- `customerSupport5Solid`
- `customerSupport7`
- `customerSupport7Remix`
- `customerSupport7Solid`
- `cyborg2`
- `cyborg2Solid`
- `cyborgRemix`
- `darkDislayMode`
- `darkDislayModeRemix`
- `darkDislayModeSolid`
- `dashboard3`
- `dashboard3Remix`
- `dashboard3Solid`
- `dashboardGauge1`
- `dashboardGauge1Remix`
- `dashboardGauge1Solid`
- `database`
- `databaseRemix`
- `databaseSolid`
- `decentWorkAndEconomicGrowth`
- `decentWorkAndEconomicGrowthRemix`
- `decentWorkAndEconomicGrowthSolid`
- `deepfakeTechnology1`
- `deepfakeTechnology1Remix`
- `deepfakeTechnology1Solid`
- `definitionSearchBook`
- `definitionSearchBookRemix`
- `definitionSearchBookSolid`
- `deleteTag`
- `deleteTagRemix`
- `deleteTagSolid`
- `departureTime`
- `departureTimeRemix`
- `departureTimeSolid`
- `desktopLock`
- `desktopLockRemix`
- `desktopLockSolid`
- `desktopScreensaverSleep`
- `desktopScreensaverSleepRemix`
- `desktopScreensaverSleepSolid`
- `dialPadFinger2`
- `dialPadFinger2Remix`
- `dialPadFinger2Solid`
- `diamond1`
- `diamond1Remix`
- `diamond1Solid`
- `dice5`
- `dice5Remix`
- `dice5Solid`
- `dictionaryLanguageBook`
- `dictionaryLanguageBookRemix`
- `dictionaryLanguageBookSolid`
- `disableBellNotification`
- `disableBellNotificationRemix`
- `disableBellNotificationSolid`
- `discountPercentCoupon`
- `discountPercentCouponRemix`
- `discountPercentCouponSolid`
- `discussionConverstionReply`
- `discussionConverstionReplyRemix`
- `discussionConverstionReplySolid`
- `dislikeCircle`
- `dislikeCircleRemix`
- `dislikeCircleSolid`
- `dna`
- `dnaRemix`
- `dnaSolid`
- `dog1`
- `dog1Remix`
- `dog1Solid`
- `dollarIncrease`
- `dollarIncreaseRemix`
- `dollarIncreaseSolid`
- `downloadArrow`
- `downloadArrowRemix`
- `downloadArrowSolid`
- `downloadBox1`
- `downloadBox1Remix`
- `downloadBox1Solid`
- `downloadTray`
- `downloadTrayRemix`
- `downloadTraySolid`
- `dribble`
- `dribbleLogoRemix`
- `dribbleSolid`
- `drone`
- `droneRemix`
- `droneSolid`
- `earSpeciality`
- `earSpecialityRemix`
- `earSpecialitySolid`
- `earpods`
- `earpodsRemix`
- `earpodsSolid`
- `earth1`
- `earth1Remix`
- `earth1Solid`
- `ejectSquare`
- `ejectSquareRemix`
- `ejectSquareSolid`
- `electricCord1`
- `electricCord1Remix`
- `electricCord1Solid`
- `elevator`
- `elevatorRemix`
- `elevatorSolid`
- `emptyClipboard`
- `emptyClipboardRemix`
- `emptyClipboardSolid`
- `endPointDiamond`
- `endPointDiamondRemix`
- `endPointDiamondSolid`
- `erlenmeyerFlask`
- `erlenmeyerFlaskRemix`
- `erlenmeyerFlaskSolid`
- `esports`
- `esportsRemix`
- `esportsSolid`
- `expandCropResize`
- `expandCropResizeRemix`
- `expandCropResizeSolid`
- `expandWindow1`
- `expandWindow1Solid`
- `faceScan1`
- `faceScan1Remix`
- `faceScan1Solid`
- `facebook1`
- `facebook1Solid`
- `facebookLogo1Remix`
- `fahrenheit`
- `fahrenheitRemix`
- `fahrenheitSolid`
- `featherPen`
- `featherPenRemix`
- `featherPenSolid`
- `fileBookmark`
- `fileBookmarkRemix`
- `fileBookmarkSolid`
- `fileCode1`
- `fileCode1Remix`
- `fileCode1Solid`
- `film`
- `filmRemix`
- `filmSlate`
- `filmSlateRemix`
- `filmSlateSolid`
- `filmSolid`
- `filter2`
- `filter2Remix`
- `filter2Solid`
- `fingerSnapping`
- `fingerSnappingRemix`
- `fingerSnappingSolid`
- `fingerprint1`
- `fingerprint1Remix`
- `fingerprint1Solid`
- `fireAlarm2`
- `fireAlarm2Remix`
- `fireAlarm2Solid`
- `flash3`
- `flash3Remix`
- `flash3Solid`
- `flashOff`
- `flashOffRemix`
- `flashOffSolid`
- `flashWarning`
- `flashWarningRemix`
- `flashWarningSolid`
- `flipHorizontalArrow1`
- `flipHorizontalArrow1Remix`
- `flipHorizontalArrow1Solid`
- `flipHorizontalCircle2`
- `flipHorizontalCircle2Remix`
- `flipHorizontalCircle2Solid`
- `floppyDisk`
- `floppyDiskRemix`
- `floppyDiskSolid`
- `flower`
- `flowerRemix`
- `flowerSolid`
- `focusFrame`
- `focusFrameRemix`
- `focusFrameSolid`
- `forkKnife`
- `forkKnifeRemix`
- `forkKnifeSolid`
- `fragile`
- `fragileRemix`
- `fragileSolid`
- `friedEggBreakfast`
- `friedEggBreakfastRemix`
- `friedEggBreakfastSolid`
- `fullScreenOsx`
- `fullScreenOsxRemix`
- `fullScreenOsxSolid`
- `galaxy2`
- `galaxy2Remix`
- `galaxy2Solid`
- `gallery`
- `galleryRemix`
- `gallerySolid`
- `gambling`
- `gamblingRemix`
- `gamblingSolid`
- `gasStationFuelPetroleum`
- `gasStationFuelPetroleumRemix`
- `gasStationFuelPetroleumSolid`
- `gift2`
- `gift2Remix`
- `gift2Solid`
- `giveStar`
- `giveStarRemix`
- `giveStarSolid`
- `graduationCap`
- `graduationCapRemix`
- `graduationCapSolid`
- `graphBarIncreaseSquare`
- `graphBarIncreaseSquareRemix`
- `graphBarIncreaseSquareSolid`
- `graphDot`
- `graphDotRemix`
- `graphDotSolid`
- `groupMeetingApproval`
- `groupMeetingApprovalRemix`
- `groupMeetingApprovalSolid`
- `handHeldTabletWriting`
- `handHeldTabletWritingRemix`
- `handHeldTabletWritingSolid`
- `happyFace`
- `happyFaceRemix`
- `happyFaceSolid`
- `hardDrive1`
- `hardDrive1Remix`
- `hardDrive1Solid`
- `healthCare2`
- `healthCare2Remix`
- `healthCare2Solid`
- `heart`
- `heartCross`
- `heartCrossRemix`
- `heartCrossSolid`
- `heartRate`
- `heartRateRemix`
- `heartRateSolid`
- `heartRemix`
- `heartSolid`
- `helpChat1`
- `helpChat1Remix`
- `helpChat1Solid`
- `hierarchy1`
- `hierarchy1Remix`
- `hierarchy1Solid`
- `hierarchy13`
- `hierarchy13Remix`
- `hierarchy13Solid`
- `hierarchy16`
- `hierarchy16Remix`
- `hierarchy16Solid`
- `hierarchy2`
- `hierarchy2Remix`
- `hierarchy2Solid`
- `hierarchyLine3`
- `hierarchyLine3Remix`
- `hierarchyLine3Solid`
- `highSpeedTrainFront`
- `highSpeedTrainFrontRemix`
- `highSpeedTrainFrontSolid`
- `home2`
- `home2Remix`
- `home2Solid`
- `horizontalSlider2`
- `horizontalSlider2Remix`
- `horizontalSlider2Solid`
- `horizontalToggleButton`
- `horizontalToggleButtonRemix`
- `horizontalToggleButtonSolid`
- `hospitalSign`
- `hospitalSignRemix`
- `hospitalSignSolid`
- `hourglass`
- `hourglassRemix`
- `hourglassSolid`
- `humidityNone`
- `humidityNoneRemix`
- `humidityNoneSolid`
- `iceCream2`
- `iceCream2Remix`
- `iceCream2Solid`
- `imageLocation`
- `imageLocationRemix`
- `imageLocationSolid`
- `inbox`
- `inboxFavorite`
- `inboxFavoriteRemix`
- `inboxFavoriteSolid`
- `inboxOpen`
- `inboxOpenRemix`
- `inboxOpenSolid`
- `inboxRemix`
- `inboxSolid`
- `inboxTray1`
- `inboxTray1Remix`
- `inboxTray1Solid`
- `incognitoMode`
- `incognitoModeRemix`
- `incognitoModeSolid`
- `incomingCall`
- `incomingCallRemix`
- `incomingCallSolid`
- `incorrectPassword`
- `incorrectPasswordRemix`
- `incorrectPasswordSolid`
- `increaseIndent`
- `increaseIndentRemix`
- `increaseIndentSolid`
- `informationCircle`
- `informationCircleRemix`
- `informationCircleSolid`
- `inputBox`
- `inputBoxRemix`
- `inputBoxSolid`
- `insertCenterLeft1`
- `insertCenterLeft1Remix`
- `insertCenterLeft1Solid`
- `insuranceHand1`
- `insuranceHand1Remix`
- `insuranceHand1Solid`
- `intersexSymbol`
- `intersexSymbolRemix`
- `intersexSymbolSolid`
- `investingAndBanking`
- `investingAndBankingRemix`
- `investingAndBankingSolid`
- `invisible1`
- `invisible1Remix`
- `invisible1Solid`
- `iosIpados`
- `iosIpadosRemix`
- `iosIpadosSolid`
- `iphone`
- `iphoneRemix`
- `iphoneSolid`
- `irisScan`
- `irisScanRemix`
- `irisScanSolid`
- `iron`
- `ironRemix`
- `ironSolid`
- `japaneseAlphabet`
- `japaneseAlphabetRemix`
- `japaneseAlphabetSolid`
- `justiceScale1`
- `justiceScale1Remix`
- `justiceScale1Solid`
- `keyFrame`
- `keyFrameRemix`
- `keyFrameSolid`
- `keyboard`
- `keyboardOptionSettingGear`
- `keyboardOptionSettingGearRemix`
- `keyboardOptionSettingGearSolid`
- `keyboardRemix`
- `keyboardSolid`
- `labelFolderTag`
- `labelFolderTagRemix`
- `labelFolderTagSolid`
- `landscape2`
- `landscape2Remix`
- `landscape2Solid`
- `landscapeLock`
- `landscapeLockRemix`
- `landscapeLockSolid`
- `laptop`
- `laptopRemix`
- `laptopSolid`
- `layers1`
- `layers1Remix`
- `layers1Solid`
- `layoutRightSidebar`
- `layoutRightSidebarRemix`
- `layoutRightSidebarSolid`
- `layoutWindow1`
- `layoutWindow1Remix`
- `layoutWindow1Solid`
- `leftClick`
- `leftClickRemix`
- `leftClickSolid`
- `lessThanSignCircle`
- `lessThanSignCircleRemix`
- `lessThanSignCircleSolid`
- `lightbulb`
- `lightbulbRemix`
- `lightbulbSolid`
- `like1`
- `like1Remix`
- `like1Solid`
- `lineArrowExpandRemix`
- `lineArrowExpandWindow2Remix`
- `lineArrowMergeVerticalRemix`
- `lineArrowMoveRemix`
- `lineArrowRoadmapRemix`
- `lineArrowRotateLeft2Remix`
- `lineArrowRotateRightCircleRemix`
- `linkChain`
- `linkChainRemix`
- `linkChainSolid`
- `locationCompass1`
- `locationCompass1Remix`
- `locationCompass1Solid`
- `locationCompass2`
- `locationCompass2Remix`
- `locationCompass2Solid`
- `locationHeartPin`
- `locationHeartPinRemix`
- `locationHeartPinSolid`
- `locationPin3`
- `locationPin3Remix`
- `locationPin3Solid`
- `locationPinMedicalHospital2`
- `locationPinMedicalHospital2Remix`
- `locationPinMedicalHospital2Solid`
- `locationTarget2`
- `locationTarget2Remix`
- `locationTarget2Solid`
- `lockRotation`
- `lockRotationRemix`
- `lockRotationSolid`
- `login1`
- `login1Remix`
- `login1Solid`
- `logout1`
- `logout1Remix`
- `logout1Solid`
- `magicWand1`
- `magicWand1Remix`
- `magicWand1Solid`
- `magicWand2`
- `magicWand2Remix`
- `magicWand2Solid`
- `magnifyingGlass`
- `magnifyingGlassRemix`
- `magnifyingGlassSolid`
- `mailReplyAll`
- `mailReplyAllRemix`
- `mailReplyAllSolid`
- `mailSendEmailMessageCircle`
- `mailSendEmailMessageCircleRemix`
- `mailSendEmailMessageCircleSolid`
- `mailSendEnvelope`
- `mailSendEnvelopeRemix`
- `mailSendEnvelopeSolid`
- `mapLocation`
- `mapLocationRemix`
- `mapLocationSolid`
- `maximize2`
- `maximize2Remix`
- `maximize2Solid`
- `megaphone1`
- `megaphone1Remix`
- `megaphone1Solid`
- `mergePdf`
- `mergePdfRemix`
- `mergePdfSolid`
- `mergeVertical`
- `mergeVerticalSolid`
- `microscopeObservationSciene`
- `microscopeObservationScieneRemix`
- `microscopeObservationScieneSolid`
- `missedCall`
- `missedCallRemix`
- `missedCallSolid`
- `modulePuzzle2`
- `modulePuzzle2Remix`
- `modulePuzzle2Solid`
- `monitorError`
- `monitorErrorRemix`
- `monitorErrorSolid`
- `moustache`
- `moustacheRemix`
- `moustacheSolid`
- `multipleStars`
- `multipleStarsRemix`
- `multipleStarsSolid`
- `musicEqualizer`
- `musicEqualizerRemix`
- `musicEqualizerSolid`
- `musicNoteCircle`
- `musicNoteCircleRemix`
- `musicNoteCircleSolid`
- `navigationArrowNorth`
- `navigationArrowNorthRemix`
- `navigationArrowNorthSolid`
- `network`
- `networkRemix`
- `networkSolid`
- `newBadgeHighlight`
- `newBadgeHighlightRemix`
- `newBadgeHighlightSolid`
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
- `nonCommercialDollars`
- `nonCommercialDollarsRemix`
- `nonCommercialDollarsSolid`
- `notepadText`
- `notepadTextRemix`
- `notepadTextSolid`
- `notificationAlarmSnooze`
- `notificationAlarmSnoozeRemix`
- `notificationAlarmSnoozeSolid`
- `notificationApplication1`
- `notificationApplication1Remix`
- `notificationApplication1Solid`
- `numberSign`
- `numberSignRemix`
- `numberSignSolid`
- `nurseAssistantEmergency`
- `nurseAssistantEmergencyRemix`
- `nurseAssistantEmergencySolid`
- `officeBuilding1`
- `officeBuilding1Remix`
- `officeBuilding1Solid`
- `oneFingerTap`
- `oneFingerTapRemix`
- `oneFingerTapSolid`
- `onlineMedicalServiceMonitor`
- `onlineMedicalServiceMonitorRemix`
- `onlineMedicalServiceMonitorSolid`
- `openUmbrella`
- `openUmbrellaRemix`
- `openUmbrellaSolid`
- `packageDimension`
- `packageDimensionRemix`
- `packageDimensionSolid`
- `padlockSquare1`
- `padlockSquare1Remix`
- `padlockSquare1Solid`
- `padlockSquare2`
- `padlockSquare2Remix`
- `padlockSquare2Solid`
- `pageSetting`
- `pageSettingRemix`
- `pageSettingSolid`
- `paintbrush2`
- `paintbrush2Remix`
- `paintbrush2Solid`
- `panoramicScreen`
- `panoramicScreenRemix`
- `panoramicScreenSolid`
- `paperclip1`
- `paperclip1Remix`
- `paperclip1Solid`
- `partyPopper`
- `partyPopperRemix`
- `partyPopperSolid`
- `passportGlobe`
- `passportGlobeRemix`
- `passportGlobeSolid`
- `pathfinderMinusFront2`
- `pathfinderMinusFront2Remix`
- `pathfinderMinusFront2Solid`
- `pdfReaderApplication`
- `pdfReaderApplicationRemix`
- `pdfReaderApplicationSolid`
- `pen1`
- `pen1Remix`
- `pen1Solid`
- `penTool`
- `penToolRemix`
- `penToolSolid`
- `pencilSquare`
- `pencilSquareRemix`
- `pencilSquareSolid`
- `petPaw`
- `petPawRemix`
- `petPawSolid`
- `phone`
- `phoneNotification`
- `phoneNotificationRemix`
- `phoneNotificationSolid`
- `phoneQr`
- `phoneQrRemix`
- `phoneQrSolid`
- `phoneRemix`
- `phoneRinging1`
- `phoneRinging1Remix`
- `phoneRinging1Solid`
- `phoneRotateMobile`
- `phoneRotateMobileRemix`
- `phoneRotateMobileSolid`
- `phoneShield`
- `phoneShieldRemix`
- `phoneShieldSolid`
- `phoneSolid`
- `photoCamera`
- `photoCameraRemix`
- `photoCameraSolid`
- `picturesFolderMemories`
- `picturesFolderMemoriesRemix`
- `picturesFolderMemoriesSolid`
- `pieChart`
- `pieChartRemix`
- `pieChartSolid`
- `piggyBank`
- `piggyBankRemix`
- `piggyBankSolid`
- `pin1`
- `pin1Remix`
- `pin1Solid`
- `pineTree`
- `pineTreeRemix`
- `pineTreeSolid`
- `playList4`
- `playList4Remix`
- `playList4Solid`
- `playList6`
- `playList6Remix`
- `playList6Solid`
- `polaroidFour`
- `polaroidFourRemix`
- `polaroidFourSolid`
- `politicsSpeech`
- `politicsSpeechRemix`
- `politicsSpeechSolid`
- `politicsVote2`
- `politicsVote2Remix`
- `politicsVote2Solid`
- `polygonalLassoTool`
- `polygonalLassoToolRemix`
- `polygonalLassoToolSolid`
- `portraitLock`
- `portraitLockRemix`
- `portraitLockSolid`
- `prescriptionPillsDrugsHealthcare`
- `prescriptionPillsDrugsHealthcareRemix`
- `prescriptionPillsDrugsHealthcareSolid`
- `presentation`
- `presentationRemix`
- `presentationSolid`
- `printer`
- `printerRemix`
- `printerSolid`
- `printerWireless`
- `printerWirelessRemix`
- `printerWirelessSolid`
- `productionBeltTime`
- `productionBeltTimeRemix`
- `productionBeltTimeSolid`
- `projector`
- `projectorBoard`
- `projectorBoardRemix`
- `projectorBoardSolid`
- `projectorRemix`
- `projectorSolid`
- `qrCode`
- `qrCodeRemix`
- `qrCodeSolid`
- `receipt`
- `receiptRemix`
- `receiptSolid`
- `recordPlayer`
- `recordPlayerRemix`
- `recordPlayerSolid`
- `recordingTapeBubbleCircle`
- `recordingTapeBubbleCircleRemix`
- `recordingTapeBubbleCircleSolid`
- `rectangleSplitThirds`
- `rectangleSplitThirdsRemix`
- `rectangleSplitThirdsSolid`
- `recycle1`
- `recycle1Remix`
- `recycle1Solid`
- `recycleBin`
- `recycleBin3`
- `recycleBin3Remix`
- `recycleBin3Solid`
- `recycleBinRemix`
- `recycleBinSolid`
- `recycleBinThrow1Remix`
- `recycleBinThrow2`
- `recycleBinThrow2Solid`
- `reducedInequalities`
- `reducedInequalitiesRemix`
- `reducedInequalitiesSolid`
- `repeatSingle`
- `repeatSingleRemix`
- `repeatSingleSolid`
- `returnSquare2`
- `returnSquare2Remix`
- `returnSquare2Solid`
- `rocket`
- `rocketRemix`
- `rocketSolid`
- `rotateLeft`
- `rotateLeftSolid`
- `rotateRightCircle`
- `rotateRightCircleSolid`
- `roundAnchorPoint`
- `roundAnchorPointRemix`
- `roundAnchorPointSolid`
- `routerWifiNetwork`
- `routerWifiNetworkRemix`
- `routerWifiNetworkSolid`
- `safeVault`
- `safeVaultRemix`
- `safeVaultSolid`
- `saladVegetableDiet`
- `saladVegetableDietRemix`
- `saladVegetableDietSolid`
- `satelliteDish`
- `satelliteDishRemix`
- `satelliteDishSolid`
- `scanner`
- `scannerBarCode`
- `scannerBarCodeRemix`
- `scannerBarCodeSolid`
- `scannerRemix`
- `scannerSolid`
- `school`
- `schoolBusSide`
- `schoolBusSideRemix`
- `schoolBusSideSolid`
- `schoolRemix`
- `schoolSolid`
- `scissors`
- `scissorsRemix`
- `scissorsSolid`
- `screenBroadcast`
- `screenBroadcastRemix`
- `screenBroadcastSolid`
- `screenCurve`
- `screenCurveRemix`
- `screenCurveSolid`
- `screenshot`
- `screenshotRemix`
- `screenshotSolid`
- `screwdriverWrench`
- `screwdriverWrenchRemix`
- `screwdriverWrenchSolid`
- `script2`
- `script2Remix`
- `script2Solid`
- `searchArrowIncrease`
- `searchArrowIncreaseRemix`
- `searchArrowIncreaseSolid`
- `searchCategory`
- `searchCategoryRemix`
- `searchCategorySolid`
- `searchHistoryBrowser`
- `searchHistoryBrowserRemix`
- `searchHistoryBrowserSolid`
- `securityUmbrella`
- `securityUmbrellaRemix`
- `securityUmbrellaSolid`
- `servingDomeHand`
- `servingDomeHandRemix`
- `servingDomeHandSolid`
- `shareLink`
- `shareLinkRemix`
- `shareLinkSolid`
- `shield1`
- `shield1Remix`
- `shield1Solid`
- `shield2`
- `shield2Remix`
- `shield2Solid`
- `shieldCross`
- `shieldCrossRemix`
- `shieldCrossSolid`
- `shippingBox2`
- `shippingBox2Remix`
- `shippingBox2Solid`
- `shirt`
- `shirtRemix`
- `shirtSolid`
- `shoppingBagHandBag2`
- `shoppingBagHandBag2Remix`
- `shoppingBagHandBag2Solid`
- `shoppingBasket2`
- `shoppingBasket2Remix`
- `shoppingBasket2Solid`
- `shoppingBasketAdd`
- `shoppingBasketAddRemix`
- `shoppingBasketAddSolid`
- `shoppingCart2`
- `shoppingCart2Remix`
- `shoppingCart2Solid`
- `showLayer`
- `showLayerRemix`
- `showLayerSolid`
- `shuffle`
- `shuffleLineArrowRemix`
- `shuffleSolid`
- `sigma`
- `sigmaRemix`
- `sigmaSolid`
- `signAt`
- `signAtRemix`
- `signAtSolid`
- `signage1`
- `signage1Remix`
- `signage1Solid`
- `signagePedestrianNoCrossing`
- `signagePedestrianNoCrossingRemix`
- `signagePedestrianNoCrossingSolid`
- `signalFull`
- `signalFullRemix`
- `signalFullSolid`
- `skull2`
- `skull2Remix`
- `skull2Solid`
- `smallCaps`
- `smallCapsRemix`
- `smallCapsSolid`
- `smileyBlessed`
- `smileyBlessedRemix`
- `smileyBlessedSolid`
- `smokingArea`
- `smokingAreaRemix`
- `smokingAreaSolid`
- `snooze`
- `snoozeRemix`
- `snoozeSolid`
- `sofa`
- `sofaRemix`
- `sofaSolid`
- `softDrinkCan`
- `softDrinkCanRemix`
- `softDrinkCanSolid`
- `sosHelpEmergencySign`
- `sosHelpEmergencySignRemix`
- `sosHelpEmergencySignSolid`
- `soundRecognitionSearch`
- `soundRecognitionSearchRemix`
- `soundRecognitionSearchSolid`
- `speaker1`
- `speaker1Remix`
- `speaker1Solid`
- `spiralShape`
- `spiralShapeRemix`
- `spiralShapeSolid`
- `stairs1`
- `stairs1Remix`
- `stairs1Solid`
- `starBadge`
- `starBadgeRemix`
- `starBadgeSolid`
- `starCircle`
- `starCircleRemix`
- `starCircleSolid`
- `steps2`
- `steps2Remix`
- `steps2Solid`
- `stopwatch`
- `stopwatchRemix`
- `stopwatchSolid`
- `stopwatchThreeQuarter`
- `stopwatchThreeQuarterRemix`
- `stopwatchThreeQuarterSolid`
- `store1`
- `store1Solid`
- `store2Remix`
- `storyPost`
- `storyPostRemix`
- `storyPostSolid`
- `streetRoad`
- `streetRoadRemix`
- `streetRoadSolid`
- `streetSign`
- `streetSignRemix`
- `streetSignSolid`
- `subscriptionCashflow`
- `subscriptionCashflowRemix`
- `subscriptionCashflowSolid`
- `suitcaseRolling`
- `suitcaseRollingRemix`
- `suitcaseRollingSolid`
- `sun`
- `sunRemix`
- `sunSolid`
- `surveillanceCamera`
- `surveillanceCameraRemix`
- `surveillanceCameraSolid`
- `table`
- `tableLamp2`
- `tableLamp2Remix`
- `tableLamp2Solid`
- `tableRemix`
- `tableSolid`
- `tabletCapsule`
- `tabletCapsuleRemix`
- `tabletCapsuleSolid`
- `tag`
- `tagAlt`
- `tagAltRemix`
- `tagAltSolid`
- `tagRemix`
- `tagSolid`
- `tallHat`
- `tallHatRemix`
- `tallHatSolid`
- `tapeCassetteRecord`
- `tapeCassetteRecordRemix`
- `tapeCassetteRecordSolid`
- `target`
- `targetDollar`
- `targetDollarRemix`
- `targetDollarSolid`
- `targetRemix`
- `targetSolid`
- `teaCup`
- `teaCupRemix`
- `teaCupSolid`
- `textFile`
- `textFileRemix`
- `textFileSolid`
- `textSquare`
- `textSquareRemix`
- `textSquareSolid`
- `textStyle`
- `textStyleRemix`
- `textStyleSolid`
- `texture`
- `textureRemix`
- `textureSolid`
- `theaterMask`
- `theaterMaskRemix`
- `theaterMaskSolid`
- `thermometer`
- `thermometerRemix`
- `thermometerSolid`
- `threadPostTweet`
- `threadPostTweetRemix`
- `threadPostTweetSolid`
- `threatMonitor`
- `threatMonitorRemix`
- `threatMonitorSolid`
- `threatPhone`
- `threatPhoneRemix`
- `threatPhoneSolid`
- `threatUsb`
- `threatUsbRemix`
- `threatUsbSolid`
- `tickets`
- `ticketsRemix`
- `ticketsSolid`
- `tidalWave`
- `tidalWaveRemix`
- `tidalWaveSolid`
- `tiktok`
- `tiktokLogoRemix`
- `tiktokSolid`
- `timeLapse`
- `timeLapseRemix`
- `timeLapseSolid`
- `timerZero`
- `timerZeroRemix`
- `timerZeroSolid`
- `tinder`
- `tinderLogoRemix`
- `tinderSolid`
- `toaster`
- `toasterRemix`
- `toasterSolid`
- `toiletMan`
- `toiletManRemix`
- `toiletManSolid`
- `toiletManWoman1`
- `toiletManWoman1Remix`
- `toiletManWoman1Solid`
- `toiletSignMan`
- `toiletSignManRemix`
- `toiletSignManSolid`
- `tooth`
- `toothRemix`
- `toothSolid`
- `trackSelectRightTool`
- `trackSelectRightToolRemix`
- `trackSelectRightToolSolid`
- `transferForwardingCall`
- `transferForwardingCallRemix`
- `transferForwardingCallSolid`
- `transferTruckTime`
- `transferTruckTimeRemix`
- `transferTruckTimeSolid`
- `treasureChest`
- `treasureChestRemix`
- `treasureChestSolid`
- `trendingContent`
- `trendingContentRemix`
- `trendingContentSolid`
- `triangleFlag`
- `triangleFlagRemix`
- `triangleFlagSolid`
- `trophy`
- `trophyRemix`
- `trophySolid`
- `tuneAdjustVolume`
- `tuneAdjustVolumeRemix`
- `tuneAdjustVolumeSolid`
- `typewriter`
- `typewriterRemix`
- `typewriterSolid`
- `uploadBox1`
- `uploadBox1Remix`
- `uploadBox1Solid`
- `usbPort`
- `usbPortRemix`
- `usbPortSolid`
- `userCircleSingle`
- `userCircleSingleRemix`
- `userCircleSingleSolid`
- `userCollaborateGroup`
- `userCollaborateGroupRemix`
- `userCollaborateGroupSolid`
- `userFeedbackHeart`
- `userFeedbackHeartRemix`
- `userFeedbackHeartSolid`
- `userFullBody`
- `userFullBodyRemix`
- `userFullBodySolid`
- `userIdentifierCard`
- `userIdentifierCardRemix`
- `userIdentifierCardSolid`
- `userKingCrown`
- `userKingCrownRemix`
- `userKingCrownSolid`
- `userQueenCrown`
- `userQueenCrownRemix`
- `userQueenCrownSolid`
- `userSyncOnlineInPerson`
- `userSyncOnlineInPersonRemix`
- `userSyncOnlineInPersonSolid`
- `videoCloseCaptioning`
- `videoCloseCaptioningRemix`
- `videoCloseCaptioningSolid`
- `virusAntivirus`
- `virusAntivirusRemix`
- `virusAntivirusSolid`
- `visualBlind1`
- `visualBlind1Remix`
- `visualBlind1Solid`
- `voiceActivationCheckValidate`
- `voiceActivationCheckValidateRemix`
- `voiceActivationCheckValidateSolid`
- `voiceMail`
- `voiceMailRemix`
- `voiceMailSolid`
- `voiceScan2`
- `voiceScan2Remix`
- `voiceScan2Solid`
- `volumeLevelHigh`
- `volumeLevelHighRemix`
- `volumeLevelHighSolid`
- `volumeMute`
- `volumeMuteRemix`
- `volumeMuteSolid`
- `vpnConnection`
- `vpnConnectionRemix`
- `vpnConnectionSolid`
- `walker`
- `walkerRemix`
- `walkerSolid`
- `wallet`
- `walletRemix`
- `walletSolid`
- `warehouse1`
- `warehouse1Remix`
- `warehouse1Solid`
- `warningDiamond`
- `warningDiamondRemix`
- `warningDiamondSolid`
- `warrantyBadgeHighlight`
- `warrantyBadgeHighlightRemix`
- `warrantyBadgeHighlightSolid`
- `watch2`
- `watch2Remix`
- `watch2Solid`
- `watchCircleCharging`
- `watchCircleChargingRemix`
- `watchCircleChargingSolid`
- `watchCircleHeartbeatMonitor1`
- `watchCircleHeartbeatMonitor1Remix`
- `watchCircleHeartbeatMonitor1Solid`
- `watchSquareMenu`
- `watchSquareMenuRemix`
- `watchSquareMenuSolid`
- `watchtowerCastle`
- `watchtowerCastleRemix`
- `watchtowerCastleSolid`
- `waveSignalCircle`
- `waveSignalCircleRemix`
- `waveSignalCircleSolid`
- `webcam`
- `webcamRemix`
- `webcamSolid`
- `webcamVideoOff`
- `webcamVideoOffRemix`
- `webcamVideoOffSolid`
- `wheelchair`
- `wheelchair1`
- `wheelchair1Remix`
- `wheelchair1Solid`
- `wheelchairRemix`
- `wheelchairSolid`
- `whiteBoard`
- `whiteBoardRemix`
- `whiteBoardSolid`
- `wifiAntenna`
- `wifiAntennaRemix`
- `wifiAntennaSolid`
- `wifiSecureConnection`
- `wifiSecureConnectionRemix`
- `wifiSecureConnectionSolid`
- `windmill`
- `windmillRemix`
- `windmillSolid`
- `wirelessFastCharging`
- `wirelessFastChargingRemix`
- `wirelessFastChargingSolid`
- `wordWrapAroundBoundingBox`
- `wordWrapAroundBoundingBoxRemix`
- `wordWrapAroundBoundingBoxSolid`
- `workspaceDesk`
- `workspaceDeskRemix`
- `workspaceDeskSolid`
- `wrapArcUpper`
- `wrapArcUpperRemix`
- `wrapArcUpperSolid`
- `wrenchHand`
- `wrenchHandRemix`
- `wrenchHandSolid`
- `youtube`
- `youtubeLogoRemix`
- `youtubeSolid`
- `zipFolder`
- `zipFolderRemix`
- `zipFolderSolid`
- `zoomIn`
- `zoomInRemix`
- `zoomInSolid`
- `zoomOut`
- `zoomOutGesture`
- `zoomOutGestureRemix`
- `zoomOutGestureSolid`
- `zoomOutRemix`
- `zoomOutSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dCoordinateAxisIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dCoordinateAxisRemixIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dCoordinateAxisSolidIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dRotate1Icon size="20" class="nav-icon" /> Settings</a>
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
     import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-flex'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dCoordinateAxis, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-flex'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-flex/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-flex/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
