# Flex color icons

> Flex color icons icons for stx from Iconify

## Overview

This package provides access to 1000 icons from the Flex color icons collection through the stx iconify integration.

**Collection ID:** `streamline-flex-color`
**Total Icons:** 1000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-flex-color
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
    <3dCoordinateAxisFlatIcon size="24" color="#4a90e2" />
    <3dRotate1Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dCoordinateAxis, 3dCoordinateAxisFlat, 3dRotate1 } from '@stacksjs/iconify-streamline-flex-color'
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<3dCoordinateAxisIcon size="24" color="red" />
<3dCoordinateAxisIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dCoordinateAxisIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dCoordinateAxisIcon size="24" class="text-primary" />
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
.streamlineFlexColor-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dCoordinateAxisIcon class="streamlineFlexColor-icon" />
```

## Available Icons

This package contains **1000** icons:

- `3dCoordinateAxis`
- `3dCoordinateAxisFlat`
- `3dRotate1`
- `3dRotate1Flat`
- `3dRotateYAxis`
- `3dRotateYAxisFlat`
- `addToPlaylist`
- `addToPlaylistFlat`
- `aiChipRobot`
- `aiChipRobotFlat`
- `aiGeneratePortraitImageSpark`
- `aiGeneratePortraitImageSparkFlat`
- `aiScannerRobot`
- `aiScannerRobotFlat`
- `airplaneDisabled`
- `airplaneDisabledFlat`
- `airportPlane`
- `airportPlaneFlat`
- `airship`
- `airshipFlat`
- `alien`
- `alienFlat`
- `alignBack1`
- `alignBack1Flat`
- `alignSelection`
- `alignSelectionFlat`
- `alignTextTop`
- `alignTextTopFlat`
- `alignTop1`
- `alignTop1Flat`
- `allergensFish`
- `allergensFishFlat`
- `anchor`
- `anchorFlat`
- `apple`
- `appleFlat`
- `applicationAdd`
- `applicationAddFlat`
- `archiveBox`
- `archiveBoxFlat`
- `arrowCursor2`
- `arrowCursor2Flat`
- `arrowCursorClick2`
- `arrowCursorClick2Flat`
- `arrowCursorMove`
- `arrowCursorMoveFlat`
- `arrowExpand`
- `arrowExpandFlat`
- `arrowMove`
- `arrowMoveFlat`
- `arrowRoadmap`
- `arrowRoadmapFlat`
- `artificialIntelligenceBrainChip`
- `artificialIntelligenceBrainChipFlat`
- `artistSong`
- `artistSongFlat`
- `autoCorrectionCheck`
- `autoCorrectionCheckFlat`
- `bag`
- `bagFlat`
- `bagSuitcase4`
- `bagSuitcase4Flat`
- `baggage`
- `baggageFlat`
- `ball`
- `ballFlat`
- `balloon`
- `balloonFlat`
- `batteryCharging`
- `batteryChargingFlat`
- `batteryMedium1`
- `batteryMedium1Flat`
- `bell`
- `bellFlat`
- `bellNotification`
- `bellNotificationFlat`
- `bicycleBike`
- `bicycleBikeFlat`
- `bill4`
- `bill4Flat`
- `binoculars`
- `binocularsFlat`
- `blankCalendar`
- `blankCalendarFlat`
- `block2`
- `block2Flat`
- `bloodDonateDrop`
- `bloodDonateDropFlat`
- `bluetoothDisabled`
- `bluetoothDisabledFlat`
- `bluetoothSearching`
- `bluetoothSearchingFlat`
- `bookReading`
- `bookReadingFlat`
- `bookmark`
- `bookmarkFlat`
- `bowTie`
- `bowTieFlat`
- `brightness1`
- `brightness1Flat`
- `brightness4`
- `brightness4Flat`
- `brokenLink1`
- `brokenLink1Flat`
- `browserBookmark`
- `browserBookmarkFlat`
- `browserDashboard`
- `browserDashboardFlat`
- `browserMultipleWindow`
- `browserMultipleWindowFlat`
- `bugAntivirusShield`
- `bugAntivirusShieldFlat`
- `building1`
- `building1Flat`
- `buttonMoveCircle`
- `buttonMoveCircleFlat`
- `buttonPauseCircle`
- `buttonPauseCircleFlat`
- `buttonPower1`
- `buttonPower1Flat`
- `buttonRecord1`
- `buttonRecord1Flat`
- `cakeSlice`
- `cakeSliceFlat`
- `calculator1`
- `calculator1Flat`
- `calendarMark`
- `calendarMarkFlat`
- `callCenterSupportService`
- `callCenterSupportServiceFlat`
- `camera1`
- `camera1Flat`
- `cameraSettingGear`
- `cameraSettingGearFlat`
- `cameraTripod`
- `cameraTripodFlat`
- `cameraVideo`
- `cameraVideoFlat`
- `campfire`
- `campfireFlat`
- `campingTent`
- `campingTentFlat`
- `carTaxi1`
- `carTaxi1Flat`
- `carrot`
- `carrotFlat`
- `cashingCheck`
- `cashingCheckFlat`
- `cat2`
- `cat2Flat`
- `cellularNetworkLte`
- `cellularNetworkLteFlat`
- `champagnePartyAlcohol`
- `champagnePartyAlcoholFlat`
- `charging`
- `chargingFlat`
- `chatBubbleSquarePhone`
- `chatBubbleSquarePhoneFlat`
- `chatBubbleTextSquare`
- `chatBubbleTextSquareFlat`
- `chatBubbleTypingOval`
- `chatBubbleTypingOvalFlat`
- `checkSquare`
- `checkSquareFlat`
- `checkupMedicalReportClipboard`
- `checkupMedicalReportClipboardFlat`
- `chefToqueHat`
- `chefToqueHatFlat`
- `chessKing`
- `chessKingFlat`
- `cityHall`
- `cityHallFlat`
- `cleanBroomWipe`
- `cleanBroomWipeFlat`
- `cloud`
- `cloudDataTransfer`
- `cloudDataTransferFlat`
- `cloudDownload`
- `cloudDownloadFlat`
- `cloudFlat`
- `cloudOff`
- `cloudOffFlat`
- `cloudWarning`
- `cloudWarningFlat`
- `cocktail`
- `cocktailFlat`
- `codeAnalysis`
- `codeAnalysisFlat`
- `codeMonitor1`
- `codeMonitor1Flat`
- `cog`
- `cogFlat`
- `coinShare`
- `coinShareFlat`
- `colorPicker`
- `colorPickerFlat`
- `colorSwatches`
- `colorSwatchesFlat`
- `compsitionHorizontal`
- `compsitionHorizontalFlat`
- `computerChip1`
- `computerChip1Flat`
- `contactBook`
- `contactBookFlat`
- `contactPhonebook2`
- `contactPhonebook2Flat`
- `controllerStick`
- `controllerStickFlat`
- `controllerWireless`
- `controllerWirelessFlat`
- `copy2`
- `copy2Flat`
- `countdownTimer`
- `countdownTimerFlat`
- `creditCard4`
- `creditCard4Flat`
- `creditCardApproved`
- `creditCardApprovedFlat`
- `creditCardDisable`
- `creditCardDisableFlat`
- `criticalThinking2`
- `criticalThinking2Flat`
- `crown`
- `crownFlat`
- `cube`
- `cubeFlat`
- `cursorClick`
- `cursorClickFlat`
- `curvesLevelsGraph`
- `curvesLevelsGraphFlat`
- `customerSupport5`
- `customerSupport5Flat`
- `customerSupport7`
- `customerSupport7Flat`
- `cyborg2`
- `cyborg2Flat`
- `darkDislayMode`
- `darkDislayModeFlat`
- `dashboard3`
- `dashboard3Flat`
- `dashboardGauge1`
- `dashboardGauge1Flat`
- `database`
- `databaseFlat`
- `decentWorkAndEconomicGrowth`
- `decentWorkAndEconomicGrowthFlat`
- `deepfakeTechnology1`
- `deepfakeTechnology1Flat`
- `definitionSearchBook`
- `definitionSearchBookFlat`
- `deleteTag`
- `deleteTagFlat`
- `departureTime`
- `departureTimeFlat`
- `desktopLock`
- `desktopLockFlat`
- `desktopScreensaverSleep`
- `desktopScreensaverSleepFlat`
- `dialPadFinger2`
- `dialPadFinger2Flat`
- `diamond1`
- `diamond1Flat`
- `dice5`
- `dice5Flat`
- `dictionaryLanguageBook`
- `dictionaryLanguageBookFlat`
- `disableBellNotification`
- `disableBellNotificationFlat`
- `discountPercentCoupon`
- `discountPercentCouponFlat`
- `discussionConverstionReply`
- `discussionConverstionReplyFlat`
- `dislikeCircle`
- `dislikeCircleFlat`
- `dna`
- `dnaFlat`
- `dog1`
- `dog1Flat`
- `dollarIncrease`
- `dollarIncreaseFlat`
- `downloadArrow`
- `downloadArrowFlat`
- `downloadBox1`
- `downloadBox1Flat`
- `downloadTray`
- `downloadTrayFlat`
- `dribble`
- `dribbleFlat`
- `drone`
- `droneFlat`
- `earSpeciality`
- `earSpecialityFlat`
- `earpods`
- `earpodsFlat`
- `earth1`
- `earth1Flat`
- `ejectSquare`
- `ejectSquareFlat`
- `electricCord1`
- `electricCord1Flat`
- `elevator`
- `elevatorFlat`
- `emptyClipboard`
- `emptyClipboardFlat`
- `endPointDiamond`
- `endPointDiamondFlat`
- `erlenmeyerFlask`
- `erlenmeyerFlaskFlat`
- `esports`
- `esportsFlat`
- `expandCropResize`
- `expandCropResizeFlat`
- `expandWindow1`
- `expandWindow1Flat`
- `faceScan1`
- `faceScan1Flat`
- `facebook1`
- `facebook1Flat`
- `fahrenheit`
- `fahrenheitFlat`
- `featherPen`
- `featherPenFlat`
- `fileBookmark`
- `fileBookmarkFlat`
- `fileCode1`
- `fileCode1Flat`
- `film`
- `filmFlat`
- `filmSlate`
- `filmSlateFlat`
- `filter2`
- `filter2Flat`
- `fingerSnapping`
- `fingerSnappingFlat`
- `fingerprint1`
- `fingerprint1Flat`
- `fireAlarm2`
- `fireAlarm2Flat`
- `flash3`
- `flash3Flat`
- `flashOff`
- `flashOffFlat`
- `flashWarning`
- `flashWarningFlat`
- `flipHorizontalArrow1`
- `flipHorizontalArrow1Flat`
- `flipHorizontalCircle2`
- `flipHorizontalCircle2Flat`
- `floppyDisk`
- `floppyDiskFlat`
- `flower`
- `flowerFlat`
- `focusFrame`
- `focusFrameFlat`
- `forkKnife`
- `forkKnifeFlat`
- `fragile`
- `fragileFlat`
- `friedEggBreakfast`
- `friedEggBreakfastFlat`
- `fullScreenOsx`
- `fullScreenOsxFlat`
- `galaxy2`
- `galaxy2Flat`
- `gallery`
- `galleryFlat`
- `gambling`
- `gamblingFlat`
- `gasStationFuelPetroleum`
- `gasStationFuelPetroleumFlat`
- `gift2`
- `gift2Flat`
- `giveStar`
- `giveStarFlat`
- `graduationCap`
- `graduationCapFlat`
- `graphBarIncreaseSquare`
- `graphBarIncreaseSquareFlat`
- `graphDot`
- `graphDotFlat`
- `groupMeetingApproval`
- `groupMeetingApprovalFlat`
- `handHeldTabletWriting`
- `handHeldTabletWritingFlat`
- `happyFace`
- `happyFaceFlat`
- `hardDrive1`
- `hardDrive1Flat`
- `healthCare2`
- `healthCare2Flat`
- `heart`
- `heartCross`
- `heartCrossFlat`
- `heartFlat`
- `heartRate`
- `heartRateFlat`
- `helpChat1`
- `helpChat1Flat`
- `hierarchy1`
- `hierarchy1Flat`
- `hierarchy13`
- `hierarchy13Flat`
- `hierarchy16`
- `hierarchy16Flat`
- `hierarchy2`
- `hierarchy2Flat`
- `hierarchyLine3`
- `hierarchyLine3Flat`
- `highSpeedTrainFront`
- `highSpeedTrainFrontFlat`
- `home2`
- `home2Flat`
- `horizontalSlider2`
- `horizontalSlider2Flat`
- `horizontalToggleButton`
- `horizontalToggleButtonFlat`
- `hospitalSign`
- `hospitalSignFlat`
- `hourglass`
- `hourglassFlat`
- `humidityNone`
- `humidityNoneFlat`
- `iceCream2`
- `iceCream2Flat`
- `imageLocation`
- `imageLocationFlat`
- `inbox`
- `inboxFavorite`
- `inboxFavoriteFlat`
- `inboxFlat`
- `inboxOpen`
- `inboxOpenFlat`
- `inboxTray1`
- `inboxTray1Flat`
- `incognitoMode`
- `incognitoModeFlat`
- `incomingCall`
- `incomingCallFlat`
- `incorrectPassword`
- `incorrectPasswordFlat`
- `increaseIndent`
- `increaseIndentFlat`
- `informationCircle`
- `informationCircleFlat`
- `inputBox`
- `inputBoxFlat`
- `insertCenterLeft1`
- `insertCenterLeft1Flat`
- `insuranceHand1`
- `insuranceHand1Flat`
- `intersexSymbol`
- `intersexSymbolFlat`
- `investingAndBanking`
- `investingAndBankingFlat`
- `invisible1`
- `invisible1Flat`
- `iosIpados`
- `iosIpadosFlat`
- `iphone`
- `iphoneFlat`
- `irisScan`
- `irisScanFlat`
- `iron`
- `ironFlat`
- `japaneseAlphabet`
- `japaneseAlphabetFlat`
- `justiceScale1`
- `justiceScale1Flat`
- `keyFrame`
- `keyFrameFlat`
- `keyboard`
- `keyboardFlat`
- `keyboardOptionSettingGear`
- `keyboardOptionSettingGearFlat`
- `labelFolderTag`
- `labelFolderTagFlat`
- `landscape2`
- `landscape2Flat`
- `landscapeLock`
- `landscapeLockFlat`
- `laptop`
- `laptopFlat`
- `layers1`
- `layers1Flat`
- `layoutRightSidebar`
- `layoutRightSidebarFlat`
- `layoutWindow1`
- `layoutWindow1Flat`
- `leftClick`
- `leftClickFlat`
- `lessThanSignCircle`
- `lessThanSignCircleFlat`
- `lightbulb`
- `lightbulbFlat`
- `like1`
- `like1Flat`
- `linkChain`
- `linkChainFlat`
- `locationCompass1`
- `locationCompass1Flat`
- `locationCompass2`
- `locationCompass2Flat`
- `locationHeartPin`
- `locationHeartPinFlat`
- `locationPin3`
- `locationPin3Flat`
- `locationPinMedicalHospital2`
- `locationPinMedicalHospital2Flat`
- `locationTarget2`
- `locationTarget2Flat`
- `lockRotation`
- `lockRotationFlat`
- `login1`
- `login1Flat`
- `logout1`
- `logout1Flat`
- `magicWand1`
- `magicWand1Flat`
- `magicWand2`
- `magicWand2Flat`
- `magnifyingGlass`
- `magnifyingGlassFlat`
- `mailReplyAll`
- `mailReplyAllFlat`
- `mailSendEmailMessageCircle`
- `mailSendEmailMessageCircleFlat`
- `mailSendEnvelope`
- `mailSendEnvelopeFlat`
- `mapLocation`
- `mapLocationFlat`
- `maximize2`
- `maximize2Flat`
- `megaphone1`
- `megaphone1Flat`
- `mergePdf`
- `mergePdfFlat`
- `mergeVertical`
- `mergeVerticalFlat`
- `microscopeObservationSciene`
- `microscopeObservationScieneFlat`
- `missedCall`
- `missedCallFlat`
- `modulePuzzle2`
- `modulePuzzle2Flat`
- `monitorError`
- `monitorErrorFlat`
- `moustache`
- `moustacheFlat`
- `multipleStars`
- `multipleStarsFlat`
- `musicEqualizer`
- `musicEqualizerFlat`
- `musicNoteCircle`
- `musicNoteCircleFlat`
- `navigationArrowNorth`
- `navigationArrowNorthFlat`
- `network`
- `networkFlat`
- `newBadgeHighlight`
- `newBadgeHighlightFlat`
- `newFile`
- `newFileFlat`
- `newFolder`
- `newFolderFlat`
- `newStickyNote`
- `newStickyNoteFlat`
- `newsPaper`
- `newsPaperFlat`
- `nonCommercialDollars`
- `nonCommercialDollarsFlat`
- `notepadText`
- `notepadTextFlat`
- `notificationAlarmSnooze`
- `notificationAlarmSnoozeFlat`
- `notificationApplication1`
- `notificationApplication1Flat`
- `numberSign`
- `numberSignFlat`
- `nurseAssistantEmergency`
- `nurseAssistantEmergencyFlat`
- `officeBuilding1`
- `officeBuilding1Flat`
- `oneFingerTap`
- `oneFingerTapFlat`
- `onlineMedicalServiceMonitor`
- `onlineMedicalServiceMonitorFlat`
- `openUmbrella`
- `openUmbrellaFlat`
- `packageDimension`
- `packageDimensionFlat`
- `padlockSquare1`
- `padlockSquare1Flat`
- `padlockSquare2`
- `padlockSquare2Flat`
- `pageSetting`
- `pageSettingFlat`
- `paintbrush2`
- `paintbrush2Flat`
- `panoramicScreen`
- `panoramicScreenFlat`
- `paperclip1`
- `paperclip1Flat`
- `partyPopper`
- `partyPopperFlat`
- `passportGlobe`
- `passportGlobeFlat`
- `pathfinderMinusFront2`
- `pathfinderMinusFront2Flat`
- `pdfReaderApplication`
- `pdfReaderApplicationFlat`
- `pen1`
- `pen1Flat`
- `penTool`
- `penToolFlat`
- `pencilSquare`
- `pencilSquareFlat`
- `petPaw`
- `petPawFlat`
- `phone`
- `phoneFlat`
- `phoneNotification`
- `phoneNotificationFlat`
- `phoneQr`
- `phoneQrFlat`
- `phoneRinging1`
- `phoneRinging1Flat`
- `phoneRotateMobile`
- `phoneRotateMobileFlat`
- `phoneShield`
- `phoneShieldFlat`
- `photoCamera`
- `photoCameraFlat`
- `picturesFolderMemories`
- `picturesFolderMemoriesFlat`
- `pieChart`
- `pieChartFlat`
- `piggyBank`
- `piggyBankFlat`
- `pin1`
- `pin1Flat`
- `pineTree`
- `pineTreeFlat`
- `playList4`
- `playList4Flat`
- `playList6`
- `playList6Flat`
- `polaroidFour`
- `polaroidFourFlat`
- `politicsSpeech`
- `politicsSpeechFlat`
- `politicsVote2`
- `politicsVote2Flat`
- `polygonalLassoTool`
- `polygonalLassoToolFlat`
- `portraitLock`
- `portraitLockFlat`
- `prescriptionPillsDrugsHealthcare`
- `prescriptionPillsDrugsHealthcareFlat`
- `presentation`
- `presentationFlat`
- `printer`
- `printerFlat`
- `printerWireless`
- `printerWirelessFlat`
- `productionBeltTime`
- `productionBeltTimeFlat`
- `projector`
- `projectorBoard`
- `projectorBoardFlat`
- `projectorFlat`
- `qrCode`
- `qrCodeFlat`
- `receipt`
- `receiptFlat`
- `recordPlayer`
- `recordPlayerFlat`
- `recordingTapeBubbleCircle`
- `recordingTapeBubbleCircleFlat`
- `rectangleSplitThirds`
- `rectangleSplitThirdsFlat`
- `recycle1`
- `recycle1Flat`
- `recycleBin`
- `recycleBin3`
- `recycleBin3Flat`
- `recycleBinFlat`
- `recycleBinThrow2`
- `recycleBinThrow2Flat`
- `reducedInequalities`
- `reducedInequalitiesFlat`
- `repeatSingle`
- `repeatSingleFlat`
- `returnSquare2`
- `returnSquare2Flat`
- `rocket`
- `rocketFlat`
- `rotateLeft`
- `rotateLeftFlat`
- `rotateRightCircle`
- `rotateRightCircleFlat`
- `roundAnchorPoint`
- `roundAnchorPointFlat`
- `routerWifiNetwork`
- `routerWifiNetworkFlat`
- `safeVault`
- `safeVaultFlat`
- `saladVegetableDiet`
- `saladVegetableDietFlat`
- `satelliteDish`
- `satelliteDishFlat`
- `scanner`
- `scannerBarCode`
- `scannerBarCodeFlat`
- `scannerFlat`
- `school`
- `schoolBusSide`
- `schoolBusSideFlat`
- `schoolFlat`
- `scissors`
- `scissorsFlat`
- `screenBroadcast`
- `screenBroadcastFlat`
- `screenCurve`
- `screenCurveFlat`
- `screenshot`
- `screenshotFlat`
- `screwdriverWrench`
- `screwdriverWrenchFlat`
- `script2`
- `script2Flat`
- `searchArrowIncrease`
- `searchArrowIncreaseFlat`
- `searchCategory`
- `searchCategoryFlat`
- `searchHistoryBrowser`
- `searchHistoryBrowserFlat`
- `securityUmbrella`
- `securityUmbrellaFlat`
- `servingDomeHand`
- `servingDomeHandFlat`
- `shareLink`
- `shareLinkFlat`
- `shield1`
- `shield1Flat`
- `shield2`
- `shield2Flat`
- `shieldCross`
- `shieldCrossFlat`
- `shippingBox2`
- `shippingBox2Flat`
- `shirt`
- `shirtFlat`
- `shoppingBagHandBag2`
- `shoppingBagHandBag2Flat`
- `shoppingBasket2`
- `shoppingBasket2Flat`
- `shoppingBasketAdd`
- `shoppingBasketAddFlat`
- `shoppingCart2`
- `shoppingCart2Flat`
- `showLayer`
- `showLayerFlat`
- `shuffle`
- `shuffleFlat`
- `sigma`
- `sigmaFlat`
- `signAt`
- `signAtFlat`
- `signage1`
- `signage1Flat`
- `signagePedestrianNoCrossing`
- `signagePedestrianNoCrossingFlat`
- `signalFull`
- `signalFullFlat`
- `skull2`
- `skull2Flat`
- `smallCaps`
- `smallCapsFlat`
- `smileyBlessed`
- `smileyBlessedFlat`
- `smokingArea`
- `smokingAreaFlat`
- `snooze`
- `snoozeFlat`
- `sofa`
- `sofaFlat`
- `softDrinkCan`
- `softDrinkCanFlat`
- `sosHelpEmergencySign`
- `sosHelpEmergencySignFlat`
- `soundRecognitionSearch`
- `soundRecognitionSearchFlat`
- `speaker1`
- `speaker1Flat`
- `spiralShape`
- `spiralShapeFlat`
- `stairs1`
- `stairs1Flat`
- `starBadge`
- `starBadgeFlat`
- `starCircle`
- `starCircleFlat`
- `steps2`
- `steps2Flat`
- `stopwatch`
- `stopwatchFlat`
- `stopwatchThreeQuarter`
- `stopwatchThreeQuarterFlat`
- `store1`
- `store1Flat`
- `storyPost`
- `storyPostFlat`
- `streetRoad`
- `streetRoadFlat`
- `streetSign`
- `streetSignFlat`
- `subscriptionCashflow`
- `subscriptionCashflowFlat`
- `suitcaseRolling`
- `suitcaseRollingFlat`
- `sun`
- `sunFlat`
- `surveillanceCamera`
- `surveillanceCameraFlat`
- `table`
- `tableFlat`
- `tableLamp2`
- `tableLamp2Flat`
- `tabletCapsule`
- `tabletCapsuleFlat`
- `tag`
- `tagAlt`
- `tagAltFlat`
- `tagFlat`
- `tallHat`
- `tallHatFlat`
- `tapeCassetteRecord`
- `tapeCassetteRecordFlat`
- `target`
- `targetDollar`
- `targetDollarFlat`
- `targetFlat`
- `teaCup`
- `teaCupFlat`
- `textFile`
- `textFileFlat`
- `textSquare`
- `textSquareFlat`
- `textStyle`
- `textStyleFlat`
- `texture`
- `textureFlat`
- `theaterMask`
- `theaterMaskFlat`
- `thermometer`
- `thermometerFlat`
- `threadPostTweet`
- `threadPostTweetFlat`
- `threatMonitor`
- `threatMonitorFlat`
- `threatPhone`
- `threatPhoneFlat`
- `threatUsb`
- `threatUsbFlat`
- `tickets`
- `ticketsFlat`
- `tidalWave`
- `tidalWaveFlat`
- `tiktok`
- `tiktokFlat`
- `timeLapse`
- `timeLapseFlat`
- `timerZero`
- `timerZeroFlat`
- `tinder`
- `tinderFlat`
- `toaster`
- `toasterFlat`
- `toiletMan`
- `toiletManFlat`
- `toiletManWoman1`
- `toiletManWoman1Flat`
- `toiletSignMan`
- `toiletSignManFlat`
- `tooth`
- `toothFlat`
- `trackSelectRightTool`
- `trackSelectRightToolFlat`
- `transferForwardingCall`
- `transferForwardingCallFlat`
- `transferTruckTime`
- `transferTruckTimeFlat`
- `treasureChest`
- `treasureChestFlat`
- `trendingContent`
- `trendingContentFlat`
- `triangleFlag`
- `triangleFlagFlat`
- `trophy`
- `trophyFlat`
- `tuneAdjustVolume`
- `tuneAdjustVolumeFlat`
- `typewriter`
- `typewriterFlat`
- `uploadBox1`
- `uploadBox1Flat`
- `usbPort`
- `usbPortFlat`
- `userCircleSingle`
- `userCircleSingleFlat`
- `userCollaborateGroup`
- `userCollaborateGroupFlat`
- `userFeedbackHeart`
- `userFeedbackHeartFlat`
- `userFullBody`
- `userFullBodyFlat`
- `userIdentifierCard`
- `userIdentifierCardFlat`
- `userKingCrown`
- `userKingCrownFlat`
- `userQueenCrown`
- `userQueenCrownFlat`
- `userSyncOnlineInPerson`
- `userSyncOnlineInPersonFlat`
- `videoCloseCaptioning`
- `videoCloseCaptioningFlat`
- `virusAntivirus`
- `virusAntivirusFlat`
- `visualBlind1`
- `visualBlind1Flat`
- `voiceActivationCheckValidate`
- `voiceActivationCheckValidateFlat`
- `voiceMail`
- `voiceMailFlat`
- `voiceScan2`
- `voiceScan2Flat`
- `volumeLevelHigh`
- `volumeLevelHighFlat`
- `volumeMute`
- `volumeMuteFlat`
- `vpnConnection`
- `vpnConnectionFlat`
- `walker`
- `walkerFlat`
- `wallet`
- `walletFlat`
- `warehouse1`
- `warehouse1Flat`
- `warningDiamond`
- `warningDiamondFlat`
- `warrantyBadgeHighlight`
- `warrantyBadgeHighlightFlat`
- `watch2`
- `watch2Flat`
- `watchCircleCharging`
- `watchCircleChargingFlat`
- `watchCircleHeartbeatMonitor1`
- `watchCircleHeartbeatMonitor1Flat`
- `watchSquareMenu`
- `watchSquareMenuFlat`
- `watchtowerCastle`
- `watchtowerCastleFlat`
- `waveSignalCircle`
- `waveSignalCircleFlat`
- `webcam`
- `webcamFlat`
- `webcamVideoOff`
- `webcamVideoOffFlat`
- `wheelchair`
- `wheelchair1`
- `wheelchair1Flat`
- `wheelchairFlat`
- `whiteBoard`
- `whiteBoardFlat`
- `wifiAntenna`
- `wifiAntennaFlat`
- `wifiSecureConnection`
- `wifiSecureConnectionFlat`
- `windmill`
- `windmillFlat`
- `wirelessFastCharging`
- `wirelessFastChargingFlat`
- `wordWrapAroundBoundingBox`
- `wordWrapAroundBoundingBoxFlat`
- `workspaceDesk`
- `workspaceDeskFlat`
- `wrapArcUpper`
- `wrapArcUpperFlat`
- `wrenchHand`
- `wrenchHandFlat`
- `youtube`
- `youtubeFlat`
- `zipFolder`
- `zipFolderFlat`
- `zoomIn`
- `zoomInFlat`
- `zoomOut`
- `zoomOutFlat`
- `zoomOutGesture`
- `zoomOutGestureFlat`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dCoordinateAxisIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dCoordinateAxisFlatIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dRotate1Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dRotate1FlatIcon size="20" class="nav-icon" /> Settings</a>
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
    <3dCoordinateAxisFlatIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dRotate1Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dCoordinateAxisIcon size="24" />
   <3dCoordinateAxisFlatIcon size="24" color="#4a90e2" />
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
     import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-flex-color'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dCoordinateAxis, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-flex-color'

// Icons are typed as IconData
const myIcon: IconData = 3dCoordinateAxis
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-flex-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-flex-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
