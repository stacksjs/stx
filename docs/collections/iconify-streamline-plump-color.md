# Plump color icons

> Plump color icons icons for stx from Iconify

## Overview

This package provides access to 1000 icons from the Plump color icons collection through the stx iconify integration.

**Collection ID:** `streamline-plump-color`
**Total Icons:** 1000
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-plump-color
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dCoordinateAxisIcon, 3dCoordinateAxisFlatIcon, AddBellNotificationIcon } from '@stacksjs/iconify-streamline-plump-color'

// Basic usage
const icon = 3dCoordinateAxisIcon()

// With size
const sizedIcon = 3dCoordinateAxisIcon({ size: 24 })

// With color
const coloredIcon = 3dCoordinateAxisFlatIcon({ color: 'red' })

// With multiple props
const customIcon = AddBellNotificationIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dCoordinateAxisIcon, 3dCoordinateAxisFlatIcon, AddBellNotificationIcon } from '@stacksjs/iconify-streamline-plump-color'

  global.icons = {
    home: 3dCoordinateAxisIcon({ size: 24 }),
    user: 3dCoordinateAxisFlatIcon({ size: 24, color: '#4a90e2' }),
    settings: AddBellNotificationIcon({ size: 32 })
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
import { 3dCoordinateAxis, 3dCoordinateAxisFlat, addBellNotification } from '@stacksjs/iconify-streamline-plump-color'
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

```typescript
// Via color property
const redIcon = 3dCoordinateAxisIcon({ color: 'red' })
const blueIcon = 3dCoordinateAxisIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3dCoordinateAxisIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3dCoordinateAxisIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = 3dCoordinateAxisIcon({ size: 24 })
const icon1em = 3dCoordinateAxisIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 3dCoordinateAxisIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3dCoordinateAxisIcon({ height: '1em' })
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
const smallIcon = 3dCoordinateAxisIcon({ class: 'icon-small' })
const largeIcon = 3dCoordinateAxisIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1000** icons:

- `3dCoordinateAxis`
- `3dCoordinateAxisFlat`
- `addBellNotification`
- `addBellNotificationFlat`
- `addLayer2`
- `addLayer2Flat`
- `aiEditRobot`
- `aiEditRobotFlat`
- `aiGeneratePortraitImageSpark`
- `aiGeneratePortraitImageSparkFlat`
- `aiGenerateVariationSpark`
- `aiGenerateVariationSparkFlat`
- `aiGenerateVoiceRobot2`
- `aiGenerateVoiceRobot2Flat`
- `aiScienceRobot`
- `aiScienceRobotFlat`
- `aiTechnologySpark`
- `aiTechnologySparkFlat`
- `airplaneDisabled`
- `airplaneDisabledFlat`
- `airplaneEnabled`
- `airplaneEnabledFlat`
- `airportSecurity`
- `airportSecurityFlat`
- `alien`
- `alienFlat`
- `alignObjectLeft`
- `alignObjectLeftFlat`
- `alignRight`
- `alignRightFlat`
- `alignSelection`
- `alignSelectionFlat`
- `ampersand`
- `ampersandFlat`
- `announcementMegaphone`
- `announcementMegaphoneFlat`
- `applicationAdd`
- `applicationAddFlat`
- `archiveBox`
- `archiveBoxFlat`
- `arrowCursor1`
- `arrowCursor1Flat`
- `arrowCursorMove`
- `arrowCursorMoveFlat`
- `arrowCurvyBothDirection2`
- `arrowCurvyBothDirection2Flat`
- `arrowDiagonal2`
- `arrowDiagonal2Flat`
- `arrowExpand`
- `arrowExpandFlat`
- `arrowRightCircle1`
- `arrowRightCircle1Flat`
- `arrowRightCircle2`
- `arrowRightCircle2Flat`
- `arrowRoadmap`
- `arrowRoadmapFlat`
- `arrowTransferHorizontalSquare`
- `arrowTransferHorizontalSquareFlat`
- `arrowTurnDownLarge`
- `arrowTurnDownLargeFlat`
- `arrowUp4`
- `arrowUp4Flat`
- `ascendingAlphabeticalOrder`
- `ascendingAlphabeticalOrderFlat`
- `atom`
- `atomFlat`
- `attribution`
- `attributionFlat`
- `autoFlash`
- `autoFlashFlat`
- `bag`
- `bagFlat`
- `bagSuitcase4`
- `bagSuitcase4Flat`
- `ball`
- `ballFlat`
- `balloon`
- `balloonFlat`
- `batteryCharging`
- `batteryChargingFlat`
- `batteryLow3`
- `batteryLow3Flat`
- `beach`
- `beachFlat`
- `beerPitch`
- `beerPitchFlat`
- `bell`
- `bellFlat`
- `bicycleBike`
- `bicycleBikeFlat`
- `binoculars`
- `binocularsFlat`
- `bitcoinCircle1`
- `bitcoinCircle1Flat`
- `block1`
- `block1Flat`
- `bluetooth`
- `bluetoothFlat`
- `bomb`
- `bombFlat`
- `book1`
- `book1Flat`
- `bookmark`
- `bookmarkFlat`
- `borderFrame`
- `borderFrameFlat`
- `bowlChopStick`
- `bowlChopStickFlat`
- `boxWaterproof`
- `boxWaterproofFlat`
- `brailleBlind`
- `brailleBlindFlat`
- `brokenLink2`
- `brokenLink2Flat`
- `browserCode1`
- `browserCode1Flat`
- `browserWebsite1`
- `browserWebsite1Flat`
- `bug`
- `bugFlat`
- `bugVirusBrowser`
- `bugVirusBrowserFlat`
- `buildingOffice`
- `buildingOfficeFlat`
- `burger`
- `burgerFlat`
- `bus`
- `busFlat`
- `businessProgressBar2`
- `businessProgressBar2Flat`
- `buttonPlayCircle`
- `buttonPlayCircleFlat`
- `buttonPower1`
- `buttonPower1Flat`
- `cableSplit`
- `cableSplitFlat`
- `cakeSlice`
- `cakeSliceFlat`
- `calculator1`
- `calculator1Flat`
- `calendarAdd`
- `calendarAddFlat`
- `calendarCheck`
- `calendarCheckFlat`
- `calendarHeart`
- `calendarHeartFlat`
- `calendarMark`
- `calendarMarkFlat`
- `callCenterSupportService`
- `callCenterSupportServiceFlat`
- `callHangUp`
- `callHangUpFlat`
- `camera1`
- `camera1Flat`
- `cameraVideo`
- `cameraVideoFlat`
- `candle`
- `candleFlat`
- `caoDai`
- `caoDaiFlat`
- `cardGameDiamond`
- `cardGameDiamondFlat`
- `changeBackgroundTransparent`
- `changeBackgroundTransparentFlat`
- `charging`
- `chargingFlat`
- `chatBubbleOvalNotification`
- `chatBubbleOvalNotificationFlat`
- `chatBubbleOvalSmiley1`
- `chatBubbleOvalSmiley1Flat`
- `chatBubbleSquareWarning`
- `chatBubbleSquareWarningFlat`
- `chatBubbleTextSquare`
- `chatBubbleTextSquareFlat`
- `chatTwoBubblesOval`
- `chatTwoBubblesOvalFlat`
- `checkThick`
- `checkThickFlat`
- `cheese`
- `cheeseFlat`
- `chefToqueHat`
- `chefToqueHatFlat`
- `cherries`
- `cherriesFlat`
- `chessPawn`
- `chessPawnFlat`
- `circleAndSquareShape`
- `circleAndSquareShapeFlat`
- `circleClock`
- `circleClockFlat`
- `classLesson`
- `classLessonFlat`
- `cleanBroomWipe`
- `cleanBroomWipeFlat`
- `cleaningRoomWoman`
- `cleaningRoomWomanFlat`
- `cloudDataTransfer`
- `cloudDataTransferFlat`
- `cloudOff`
- `cloudOffFlat`
- `codeMonitor2`
- `codeMonitor2Flat`
- `coffeeBean`
- `coffeeBeanFlat`
- `coffeeMug`
- `coffeeMugFlat`
- `cog`
- `cogAutomation`
- `cogAutomationFlat`
- `cogFlat`
- `colorPicker`
- `colorPickerFlat`
- `command`
- `commandFlat`
- `compassNavigator`
- `compassNavigatorFlat`
- `compressPdf`
- `compressPdfFlat`
- `computerPcDesktop`
- `computerPcDesktopFlat`
- `contactPhonebook`
- `contactPhonebookFlat`
- `contentStatistic`
- `contentStatisticFlat`
- `controller1`
- `controller1Flat`
- `convertPdf1`
- `convertPdf1Flat`
- `creativeCommons`
- `creativeCommonsFlat`
- `creditCard5`
- `creditCard5Flat`
- `cropSelection`
- `cropSelectionFlat`
- `customerSupport3`
- `customerSupport3Flat`
- `customerSupport7`
- `customerSupport7Flat`
- `cut`
- `cutFlat`
- `cyborg2`
- `cyborg2Flat`
- `darkDislayMode`
- `darkDislayModeFlat`
- `dashboard1`
- `dashboard1Flat`
- `dashboardGauge2`
- `dashboardGauge2Flat`
- `database`
- `databaseFlat`
- `databaseServer3`
- `databaseServer3Flat`
- `deepfakeTechnology1`
- `deepfakeTechnology1Flat`
- `deleteBookmark`
- `deleteBookmarkFlat`
- `deleteKeyboard`
- `deleteKeyboardFlat`
- `deleteRow`
- `deleteRowFlat`
- `description`
- `descriptionFlat`
- `desktopLock`
- `desktopLockFlat`
- `deviceDatabaseEncryption1`
- `deviceDatabaseEncryption1Flat`
- `dialPadFinger2`
- `dialPadFinger2Flat`
- `diamond1`
- `diamond1Flat`
- `dicesEntertainmentGamingDices`
- `dicesEntertainmentGamingDicesFlat`
- `disableAlarm`
- `disableAlarmFlat`
- `disableHeart`
- `disableHeartFlat`
- `disableProtection`
- `disableProtectionFlat`
- `discountPercentCutout`
- `discountPercentCutoutFlat`
- `divisionCircle`
- `divisionCircleFlat`
- `dna`
- `dnaFlat`
- `documentCertificate`
- `documentCertificateFlat`
- `dog1`
- `dog1Flat`
- `dollarCoin`
- `dollarCoinFlat`
- `door`
- `doorFlat`
- `downloadBox2`
- `downloadBox2Flat`
- `dropDownMenu`
- `dropDownMenuFlat`
- `dropbox`
- `dropboxFlat`
- `drumStick`
- `drumStickFlat`
- `dumbell`
- `dumbellFlat`
- `earSpeciality`
- `earSpecialityFlat`
- `earpods`
- `earpodsFlat`
- `earth1`
- `earth1Flat`
- `electricChargingStation`
- `electricChargingStationFlat`
- `electricCord1`
- `electricCord1Flat`
- `emailAttachmentDocument`
- `emailAttachmentDocumentFlat`
- `emptyClipboard`
- `emptyClipboardFlat`
- `endPointBranches`
- `endPointBranchesFlat`
- `endPointDiamond`
- `endPointDiamondFlat`
- `eraser`
- `eraserFlat`
- `erlenmeyerFlask`
- `erlenmeyerFlaskFlat`
- `escalatorUp`
- `escalatorUpFlat`
- `exitFullScreen`
- `exitFullScreenFlat`
- `expandHorizontal2`
- `expandHorizontal2Flat`
- `eyeOptic`
- `eyeOpticFlat`
- `facebook1`
- `facebook1Flat`
- `factoryPlant`
- `factoryPlantFlat`
- `fahrenheit`
- `fahrenheitFlat`
- `featherPen`
- `featherPenFlat`
- `fileCheckAlternate`
- `fileCheckAlternateFlat`
- `fileFolder`
- `fileFolderFlat`
- `fileReport`
- `fileReportFlat`
- `fileSearch`
- `fileSearchFlat`
- `fillAndSign`
- `fillAndSignFlat`
- `filmSlate`
- `filmSlateFlat`
- `filter1`
- `filter1Flat`
- `fingerprint2`
- `fingerprint2Flat`
- `fireEvacuation`
- `fireEvacuationFlat`
- `firefighterTruck`
- `firefighterTruckFlat`
- `fish`
- `fishFlat`
- `fitHeight`
- `fitHeightFlat`
- `fitToWidthSquare`
- `fitToWidthSquareFlat`
- `flash1`
- `flash1Flat`
- `flashlight`
- `flashlightFlat`
- `flipHorizontalCircle1`
- `flipHorizontalCircle1Flat`
- `floppyDisk`
- `floppyDiskFlat`
- `focusPoints`
- `focusPointsFlat`
- `foodTruckEventFair`
- `foodTruckEventFairFlat`
- `forkKnife`
- `forkKnifeFlat`
- `forkPlate`
- `forkPlateFlat`
- `fragile`
- `fragileFlat`
- `friedEggBreakfast`
- `friedEggBreakfastFlat`
- `galaxy2`
- `galaxy2Flat`
- `gallery2`
- `gallery2Flat`
- `gameboy`
- `gameboyFlat`
- `gift`
- `giftFlat`
- `giveGift`
- `giveGiftFlat`
- `globalLearning`
- `globalLearningFlat`
- `globalWarming2`
- `globalWarming2Flat`
- `gold`
- `goldFlat`
- `governmentBuilding1`
- `governmentBuilding1Flat`
- `graduationCap`
- `graduationCapFlat`
- `graphArrowUserIncrease`
- `graphArrowUserIncreaseFlat`
- `graphBarIncrease`
- `graphBarIncreaseFlat`
- `graphDot`
- `graphDotFlat`
- `graphicTemplateWebsiteUi`
- `graphicTemplateWebsiteUiFlat`
- `halfStar2`
- `halfStar2Flat`
- `handHeld`
- `handHeldFlat`
- `hardDrive2`
- `hardDrive2Flat`
- `heartRatePulseGraph`
- `heartRatePulseGraphFlat`
- `heater`
- `heaterFlat`
- `helpChat1`
- `helpChat1Flat`
- `hierarchy1`
- `hierarchy1Flat`
- `hierarchy15`
- `hierarchy15Flat`
- `highSpeedTrainSide`
- `highSpeedTrainSideFlat`
- `home1`
- `home1Flat`
- `horizonalScroll`
- `horizonalScrollFlat`
- `horizontalMenuCircle`
- `horizontalMenuCircleFlat`
- `horizontalSliderSquare`
- `horizontalSliderSquareFlat`
- `hospitalSignSquare`
- `hospitalSignSquareFlat`
- `hotAirBalloon`
- `hotAirBalloonFlat`
- `hotSpring`
- `hotSpringFlat`
- `hotelBed5`
- `hotelBed5Flat`
- `hotelFiveStar`
- `hotelFiveStarFlat`
- `hourglass`
- `hourglassFlat`
- `htmlFive`
- `htmlFiveFlat`
- `iceCream2`
- `iceCream2Flat`
- `imageSaturation`
- `imageSaturationFlat`
- `inboxContent`
- `inboxContentFlat`
- `inboxPost`
- `inboxPostFlat`
- `incognitoMode`
- `incognitoModeFlat`
- `industryInnovationAndInfrastructure`
- `industryInnovationAndInfrastructureFlat`
- `informationCircle`
- `informationCircleFlat`
- `informationDesk`
- `informationDeskFlat`
- `inputBox`
- `inputBoxFlat`
- `insertColumn`
- `insertColumnFlat`
- `insertSide`
- `insertSideFlat`
- `insuranceHand`
- `insuranceHandFlat`
- `intellectual`
- `intellectualFlat`
- `intersexSymbol`
- `intersexSymbolFlat`
- `invisible1`
- `invisible1Flat`
- `invisible2`
- `invisible2Flat`
- `iosIpados`
- `iosIpadosFlat`
- `ipadTabletScreen`
- `ipadTabletScreenFlat`
- `irisScan`
- `irisScanFlat`
- `justiceScale2`
- `justiceScale2Flat`
- `keyboard`
- `keyboardFlat`
- `keyholeLockCircle`
- `keyholeLockCircleFlat`
- `ladder`
- `ladderFlat`
- `landing`
- `landingFlat`
- `landscapeView`
- `landscapeViewFlat`
- `laptop`
- `laptopFlat`
- `layerMask`
- `layerMaskFlat`
- `layers1`
- `layers1Flat`
- `layoutRightSidebar`
- `layoutRightSidebarFlat`
- `layoutWindow4`
- `layoutWindow4Flat`
- `leafProtect`
- `leafProtectFlat`
- `lens`
- `lensFlat`
- `lift`
- `liftFlat`
- `lightbulb`
- `lightbulbFlat`
- `lightningCloud`
- `lightningCloudFlat`
- `like1`
- `like1Flat`
- `linkChain`
- `linkChainFlat`
- `lipstick`
- `lipstickFlat`
- `loadingCircle`
- `loadingCircleFlat`
- `loadingHorizontal2`
- `loadingHorizontal2Flat`
- `locationHeartPin`
- `locationHeartPinFlat`
- `locationPin`
- `locationPin3`
- `locationPin3Flat`
- `locationPinDisabled`
- `locationPinDisabledFlat`
- `locationPinFlat`
- `lockCommentSecurity`
- `lockCommentSecurityFlat`
- `log`
- `logFlat`
- `login1`
- `login1Flat`
- `lostAndFound`
- `lostAndFoundFlat`
- `magicWand1`
- `magicWand1Flat`
- `magnet`
- `magnetFlat`
- `mailNotification`
- `mailNotificationFlat`
- `mailOutgoing`
- `mailOutgoingFlat`
- `mailSearch`
- `mailSearchFlat`
- `mailSend`
- `mailSendEmailMessage`
- `mailSendEmailMessageFlat`
- `mailSendFlat`
- `mailSendReplyAll`
- `mailSendReplyAllFlat`
- `mailSetting`
- `mailSettingFlat`
- `mall`
- `mallFlat`
- `manArmRaises2Alternate`
- `manArmRaises2AlternateFlat`
- `mapFold`
- `mapFoldFlat`
- `mapLocationStarPin`
- `mapLocationStarPinFlat`
- `maximize1`
- `maximize1Flat`
- `medicalBag`
- `medicalBagFlat`
- `megaphoneRefresh`
- `megaphoneRefreshFlat`
- `memesCommentReply`
- `memesCommentReplyFlat`
- `microscopeObservationSciene`
- `microscopeObservationScieneFlat`
- `module`
- `moduleFlat`
- `moneyCashBill1`
- `moneyCashBill1Flat`
- `moonStars`
- `moonStarsFlat`
- `mouseWireless`
- `mouseWireless1`
- `mouseWireless1Flat`
- `mouseWirelessFlat`
- `moustache`
- `moustacheFlat`
- `multipleFile1`
- `multipleFile1Flat`
- `multipleStars`
- `multipleStarsFlat`
- `musicNote2`
- `musicNote2Flat`
- `musicNoteTrebbleClef`
- `musicNoteTrebbleClefFlat`
- `navigationArrowOff`
- `navigationArrowOffFlat`
- `newFolder`
- `newFolderFlat`
- `newsPaper`
- `newsPaperFlat`
- `nintendoXboxController1`
- `nintendoXboxController1Flat`
- `noPhotoTakingZone`
- `noPhotoTakingZoneFlat`
- `noPoverty`
- `noPovertyFlat`
- `noSmakingArea`
- `noSmakingAreaFlat`
- `noTouchSign`
- `noTouchSignFlat`
- `notepadText`
- `notepadTextFlat`
- `notificationAlarmSnooze`
- `notificationAlarmSnoozeFlat`
- `notificationAlert`
- `notificationAlertFlat`
- `octagramShape`
- `octagramShapeFlat`
- `officeWorker`
- `officeWorkerFlat`
- `okHand`
- `okHandFlat`
- `oneFingerTap`
- `oneFingerTapFlat`
- `oneHandedHoldingTabletHandheld`
- `oneHandedHoldingTabletHandheldFlat`
- `openUmbrella`
- `openUmbrellaFlat`
- `pacman`
- `pacmanFlat`
- `padlockKey`
- `padlockKeyFlat`
- `padlockSquare2`
- `padlockSquare2Flat`
- `pageSetting`
- `pageSettingFlat`
- `paintBucket`
- `paintBucketFlat`
- `paintPalette`
- `paintPaletteFlat`
- `paintbrush2`
- `paintbrush2Flat`
- `paintingBoard`
- `paintingBoardFlat`
- `panoramicScreen`
- `panoramicScreenFlat`
- `parachuteDrop`
- `parachuteDropFlat`
- `park`
- `parkFlat`
- `passwordLock`
- `passwordLockFlat`
- `pathfinderOutline`
- `pathfinderOutlineFlat`
- `paymentRecieve7`
- `paymentRecieve7Flat`
- `pen1`
- `pen1Flat`
- `penTool`
- `penToolFlat`
- `pencilCircle`
- `pencilCircleFlat`
- `pencilSquare`
- `pencilSquareFlat`
- `petPaw`
- `petPawFlat`
- `pharmacy`
- `pharmacyFlat`
- `phone`
- `phoneFlat`
- `phoneVibrate`
- `phoneVibrateFlat`
- `piggyBank`
- `piggyBankFlat`
- `pin2`
- `pin2Flat`
- `pinwheel`
- `pinwheelFlat`
- `playList1`
- `playList1Flat`
- `playListFolder`
- `playListFolderFlat`
- `polaroid`
- `polaroidFlat`
- `politicsVote2`
- `politicsVote2Flat`
- `poolLadder`
- `poolLadderFlat`
- `porkMeat`
- `porkMeatFlat`
- `pottedFlower`
- `pottedFlowerFlat`
- `poundCircle`
- `poundCircleFlat`
- `presentation`
- `presentationFlat`
- `printer`
- `printerFlat`
- `productionBelt`
- `productionBeltFlat`
- `projectorScreen`
- `projectorScreenFlat`
- `pyramidShape`
- `pyramidShapeFlat`
- `quotation2`
- `quotation2Flat`
- `radioactive1`
- `radioactive1Flat`
- `receiptCross`
- `receiptCrossFlat`
- `recordingTape1`
- `recordingTape1Flat`
- `rectangleFlag`
- `rectangleFlagFlat`
- `recycle1`
- `recycle1Flat`
- `recycleBin`
- `recycleBin2`
- `recycleBin2Flat`
- `recycleBin3`
- `recycleBin3Flat`
- `recycleBinFlat`
- `reducedInequalities`
- `reducedInequalitiesFlat`
- `refrigerator`
- `refrigeratorFlat`
- `replyToMessageTyping`
- `replyToMessageTypingFlat`
- `resetClock`
- `resetClockFlat`
- `return3`
- `return3Flat`
- `ringingBellNotification`
- `ringingBellNotificationFlat`
- `rotateLeft`
- `rotateLeftFlat`
- `roundAnchorPoint`
- `roundAnchorPointFlat`
- `rssSquare`
- `rssSquareFlat`
- `ruler`
- `rulerFlat`
- `sadFace`
- `sadFaceFlat`
- `safari`
- `safariFlat`
- `safeVault`
- `safeVaultFlat`
- `sailShip`
- `sailShipFlat`
- `scissors`
- `scissorsFlat`
- `screen1`
- `screen1Flat`
- `screwdriver`
- `screwdriverFlat`
- `script2`
- `script2Flat`
- `sdCard`
- `sdCardFlat`
- `searchVisual`
- `searchVisualFlat`
- `selectAll`
- `selectAllFlat`
- `selectCircleArea1`
- `selectCircleArea1Flat`
- `shareLink`
- `shareLinkFlat`
- `shareLock`
- `shareLockFlat`
- `shield1`
- `shield1Flat`
- `shipmentUpload`
- `shipmentUploadFlat`
- `shippingBox1`
- `shippingBox1Flat`
- `shoppingBasket1`
- `shoppingBasket1Flat`
- `shoppingCartAdd`
- `shoppingCartAddFlat`
- `shuffle`
- `shuffleFlat`
- `signAt`
- `signAtFlat`
- `signalFull`
- `signalFullFlat`
- `sizing`
- `sizingFlat`
- `skull2`
- `skull2Flat`
- `slack`
- `slackFlat`
- `smileyDrool`
- `smileyDroolFlat`
- `smileyIndiferent`
- `smileyIndiferentFlat`
- `smileyLaughing1`
- `smileyLaughing1Flat`
- `smileySparks`
- `smileySparksFlat`
- `smokingArea`
- `smokingAreaFlat`
- `sofa`
- `sofaFlat`
- `speaker2`
- `speaker2Flat`
- `spiralShape`
- `spiralShapeFlat`
- `spotify`
- `spotifyFlat`
- `stamp`
- `stampFlat`
- `starCircle`
- `starCircleFlat`
- `starMedal`
- `starMedalFlat`
- `steps1`
- `steps1Flat`
- `stock`
- `stockFlat`
- `stool`
- `stoolFlat`
- `stopwatchHalf`
- `stopwatchHalfFlat`
- `store2`
- `store2Flat`
- `strawberry`
- `strawberryFlat`
- `streetSign`
- `streetSignFlat`
- `stroller`
- `strollerFlat`
- `suitcaseRolling`
- `suitcaseRollingFlat`
- `sun`
- `sunFlat`
- `sunset`
- `sunsetFlat`
- `synchronize`
- `synchronizeFlat`
- `table`
- `tableFlat`
- `tabletCapsule`
- `tabletCapsuleFlat`
- `tagAlt`
- `tagAltFlat`
- `target3`
- `target3Flat`
- `taskListEdit`
- `taskListEditFlat`
- `telescope`
- `telescopeFlat`
- `testTube`
- `testTubeFlat`
- `textBox1`
- `textBox1Flat`
- `textImageCenterLarge`
- `textImageCenterLargeFlat`
- `textShadow`
- `textShadowFlat`
- `theaterMask`
- `theaterMaskFlat`
- `thermometer`
- `thermometerFlat`
- `threatPhone`
- `threatPhoneFlat`
- `ticket1`
- `ticket1Flat`
- `tiktok`
- `tiktokFlat`
- `toast`
- `toastFlat`
- `toiletMan`
- `toiletManFlat`
- `toiletSignMan`
- `toiletSignManFlat`
- `toiletWomen`
- `toiletWomenFlat`
- `toolBox`
- `toolBoxFlat`
- `topOrderReport`
- `topOrderReportFlat`
- `trafficLight`
- `trafficLightFlat`
- `transparent`
- `transparentFlat`
- `treasureChest`
- `treasureChestFlat`
- `tree1`
- `tree1Flat`
- `trendingContent`
- `trendingContentFlat`
- `tuneAdjustVolume`
- `tuneAdjustVolumeFlat`
- `uploadBox1`
- `uploadBox1Flat`
- `usbPort`
- `usbPortFlat`
- `userFaceIdMask`
- `userFaceIdMaskFlat`
- `userFaceMale`
- `userFaceMaleFlat`
- `userFeedbackHeart`
- `userFeedbackHeartFlat`
- `userMultipleAccounts`
- `userMultipleAccountsFlat`
- `userPin`
- `userPinFlat`
- `userPodcast`
- `userPodcastFlat`
- `userProtectionCheck`
- `userProtectionCheckFlat`
- `userSingleNeutralMale`
- `userSingleNeutralMaleFlat`
- `userStickerSquare`
- `userStickerSquareFlat`
- `userSwitchAccount`
- `userSwitchAccountFlat`
- `videoCloseCaptioning`
- `videoCloseCaptioningFlat`
- `videoSubtitles`
- `videoSubtitlesFlat`
- `virtualReality`
- `virtualRealityFlat`
- `virusAntivirus`
- `virusAntivirusFlat`
- `visualBlind`
- `visualBlindFlat`
- `voiceActivation1`
- `voiceActivation1Flat`
- `voiceMail`
- `voiceMailFlat`
- `voiceScan1`
- `voiceScan1Flat`
- `voiceTypingWordConvert`
- `voiceTypingWordConvertFlat`
- `volumeLevelHigh`
- `volumeLevelHighFlat`
- `vpnConnection`
- `vpnConnectionFlat`
- `wallet`
- `walletFlat`
- `warehouse1`
- `warehouse1Flat`
- `warningDiamond`
- `warningDiamondFlat`
- `warpSqueeze`
- `warpSqueezeFlat`
- `watch1`
- `watch1Flat`
- `watchCircleMenu`
- `watchCircleMenuFlat`
- `waterMelon`
- `waterMelonFlat`
- `waveSignalSquare`
- `waveSignalSquareFlat`
- `wavingHand`
- `wavingHandFlat`
- `web`
- `webFlat`
- `webcamOff`
- `webcamOffFlat`
- `webcamVideo`
- `webcamVideoFlat`
- `wheat`
- `wheatFlat`
- `wheelchair2`
- `wheelchair2Flat`
- `widget`
- `widgetFlat`
- `wifi`
- `wifiFlat`
- `wine`
- `wineFlat`
- `workspaceDesk`
- `workspaceDeskFlat`
- `world`
- `worldFlat`
- `wrapArch`
- `wrapArchFlat`
- `wrenchCircle`
- `wrenchCircleFlat`
- `yinYangSymbol`
- `yinYangSymbolFlat`
- `zoomIn`
- `zoomInFlat`
- `zoomInGesture`
- `zoomInGestureFlat`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dCoordinateAxisIcon, 3dCoordinateAxisFlatIcon, AddBellNotificationIcon, AddBellNotificationFlatIcon } from '@stacksjs/iconify-streamline-plump-color'

  global.navIcons = {
    home: 3dCoordinateAxisIcon({ size: 20, class: 'nav-icon' }),
    about: 3dCoordinateAxisFlatIcon({ size: 20, class: 'nav-icon' }),
    contact: AddBellNotificationIcon({ size: 20, class: 'nav-icon' }),
    settings: AddBellNotificationFlatIcon({ size: 20, class: 'nav-icon' })
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
import { 3dCoordinateAxisIcon } from '@stacksjs/iconify-streamline-plump-color'

const icon = 3dCoordinateAxisIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dCoordinateAxisIcon, 3dCoordinateAxisFlatIcon, AddBellNotificationIcon } from '@stacksjs/iconify-streamline-plump-color'

const successIcon = 3dCoordinateAxisIcon({ size: 16, color: '#22c55e' })
const warningIcon = 3dCoordinateAxisFlatIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddBellNotificationIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dCoordinateAxisIcon, 3dCoordinateAxisFlatIcon } from '@stacksjs/iconify-streamline-plump-color'
   const icon = 3dCoordinateAxisIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3dCoordinateAxis, 3dCoordinateAxisFlat } from '@stacksjs/iconify-streamline-plump-color'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3dCoordinateAxis, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dCoordinateAxisIcon, 3dCoordinateAxisFlatIcon } from '@stacksjs/iconify-streamline-plump-color'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-plump-color'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dCoordinateAxisIcon } from '@stacksjs/iconify-streamline-plump-color'
     global.icon = 3dCoordinateAxisIcon({ size: 24 })
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
   const icon = 3dCoordinateAxisIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dCoordinateAxis } from '@stacksjs/iconify-streamline-plump-color'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-plump-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-plump-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
