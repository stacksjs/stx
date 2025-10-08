# Mage Icons

> Mage Icons icons for stx from Iconify

## Overview

This package provides access to 1042 icons from the Mage Icons collection through the stx iconify integration.

**Collection ID:** `mage`
**Total Icons:** 1042
**Author:** MageIcons ([Website](https://github.com/Mage-Icons/mage-icons))
**License:** Apache 2.0 ([Details](https://github.com/Mage-Icons/mage-icons/blob/main/License.txt))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-mage
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdobeIcon height="1em" />
<AdobeIcon width="1em" height="1em" />
<AdobeIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdobeIcon size="24" />
<AdobeIcon size="1em" />

<!-- Using width and height -->
<AdobeIcon width="24" height="32" />

<!-- With color -->
<AdobeIcon size="24" color="red" />
<AdobeIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdobeIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdobeIcon
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
    <AdobeIcon size="24" />
    <AeroplaneIcon size="24" color="#4a90e2" />
    <AeroplaneFillIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { adobe, aeroplane, aeroplaneFill } from '@stacksjs/iconify-mage'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adobe, { size: 24 })
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
<AdobeIcon size="24" color="red" />
<AdobeIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdobeIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdobeIcon size="24" class="text-primary" />
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
<AdobeIcon height="1em" />
<AdobeIcon width="1em" height="1em" />
<AdobeIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdobeIcon size="24" />
<AdobeIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.mage-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdobeIcon class="mage-icon" />
```

## Available Icons

This package contains **1042** icons:

- `adobe`
- `aeroplane`
- `aeroplaneFill`
- `afterEffects`
- `alarmClock`
- `alarmClockFill`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `amazon`
- `apple`
- `archive`
- `archiveDrawer`
- `archiveDrawerFill`
- `archiveFill`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleFill`
- `arrowDownLeft`
- `arrowDownLeftCircle`
- `arrowDownLeftCircleFill`
- `arrowDownLeftSquare`
- `arrowDownLeftSquareFill`
- `arrowDownRight`
- `arrowDownRightCircle`
- `arrowDownRightCircleFill`
- `arrowDownRightSquare`
- `arrowDownRightSquareFill`
- `arrowDownSquare`
- `arrowDownSquareFill`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleFill`
- `arrowLeftSquare`
- `arrowLeftSquareFill`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleFill`
- `arrowRightSquare`
- `arrowRightSquareFill`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpCircleFill`
- `arrowUpLeft`
- `arrowUpLeftCircle`
- `arrowUpLeftCircleFill`
- `arrowUpLeftSquare`
- `arrowUpLeftSquareFill`
- `arrowUpRight`
- `arrowUpRightCircle`
- `arrowUpRightCircleFill`
- `arrowUpRightSquare`
- `arrowUpRightSquareFill`
- `arrowUpSquare`
- `arrowUpSquareFill`
- `arrowlist`
- `arrowsAllDirection`
- `arrowsAllDirection2`
- `attachment`
- `bagA`
- `bagAFill`
- `bagB`
- `bagBFill`
- `barCodeScan`
- `basket`
- `basketFill`
- `batteryCharging`
- `batteryChargingFill`
- `batteryDead`
- `batteryDeadFill`
- `batteryEmpty`
- `batteryEmptyFill`
- `batteryFull`
- `batteryFullFill`
- `batteryHalf`
- `batteryHalfFill`
- `batteryLow`
- `batteryLowFill`
- `behance`
- `bellNotificationSquare`
- `bellNotificationSquareFill`
- `bolt`
- `boltFill`
- `book`
- `bookFill`
- `bookText`
- `bookTextFill`
- `bookmark`
- `bookmarkCheck`
- `bookmarkCheckFill`
- `bookmarkCross`
- `bookmarkCrossFill`
- `bookmarkDownload`
- `bookmarkDownloadFill`
- `bookmarkFill`
- `bookmarkMinus`
- `bookmarkMinusFill`
- `bookmarkPlus`
- `bookmarkPlusFill`
- `bookmarkQuestionMark`
- `bookmarkQuestionMarkFill`
- `bookmarkUpload`
- `bookmarkUploadFill`
- `box`
- `box3d`
- `box3dCheck`
- `box3dCheckFill`
- `box3dCross`
- `box3dCrossFill`
- `box3dDownload`
- `box3dDownloadFill`
- `box3dFill`
- `box3dMinus`
- `box3dMinusFill`
- `box3dNotification`
- `box3dNotificationFill`
- `box3dPlus`
- `box3dPlusFill`
- `box3dQuestionMark`
- `box3dQuestionMarkFill`
- `box3dScan`
- `box3dScanFill`
- `box3dUpload`
- `box3dUploadFill`
- `boxCheck`
- `boxCheckFill`
- `boxCross`
- `boxCrossFill`
- `boxFill`
- `boxMinus`
- `boxMinusFill`
- `boxPlus`
- `boxPlusFill`
- `boxQuestionMark`
- `boxQuestionMarkFill`
- `boxUpload`
- `boxUploadFill`
- `briefcase`
- `briefcaseFill`
- `broadcast`
- `broadcastFill`
- `buildingA`
- `buildingAFill`
- `buildingB`
- `buildingBFill`
- `buildingTree`
- `buildingTreeFill`
- `calculator`
- `calculatorFill`
- `calendar`
- `calendar2`
- `calendar2Fill`
- `calendar3`
- `calendar3Fill`
- `calendarCheck`
- `calendarCheckFill`
- `calendarCross`
- `calendarCrossFill`
- `calendarDownload`
- `calendarDownloadFill`
- `calendarFill`
- `calendarMinus`
- `calendarMinusFill`
- `calendarPlus`
- `calendarPlusFill`
- `calendarQuestionMark`
- `calendarQuestionMarkFill`
- `calendarUpload`
- `calendarUploadFill`
- `camera`
- `camera2`
- `camera2Fill`
- `cameraFill`
- `cancel`
- `cancelFill`
- `caretDown`
- `caretDownFill`
- `caretLeft`
- `caretLeftFill`
- `caretRight`
- `caretRightFill`
- `caretUp`
- `caretUpFill`
- `chart`
- `chart15`
- `chart15Fill`
- `chart25`
- `chart25Fill`
- `chart50`
- `chart50Fill`
- `chartB`
- `chartBFill`
- `chartDown`
- `chartDownB`
- `chartDownBFill`
- `chartDownFill`
- `chartFill`
- `chartUp`
- `chartUpB`
- `chartUpBFill`
- `chartUpFill`
- `chartVertical`
- `chartVerticalFill`
- `check`
- `checkCircle`
- `checkCircleFill`
- `checkSquare`
- `checkSquareFill`
- `checklist`
- `checklistNote`
- `checklistNoteFill`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleFill`
- `chevronDownSquare`
- `chevronDownSquareFill`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftCircleFill`
- `chevronLeftSquare`
- `chevronLeftSquareFill`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightCircleFill`
- `chevronRightSquare`
- `chevronRightSquareFill`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpCircleFill`
- `chevronUpSquare`
- `chevronUpSquareFill`
- `chip`
- `chipFill`
- `clipboard`
- `clipboard2`
- `clipboard2Fill`
- `clipboard3`
- `clipboardFill`
- `clock`
- `clockFill`
- `coinA`
- `coinAFill`
- `coinB`
- `coinBFill`
- `colorPicker`
- `colorPickerFill`
- `colorSwatch`
- `colorSwatchFill`
- `compactDisk`
- `compactDiskFill`
- `compass`
- `compassFill`
- `contactBook`
- `contactBookFill`
- `copy`
- `copyFill`
- `creditCard`
- `creditCardFill`
- `crownA`
- `crownAFill`
- `crownB`
- `crownBFill`
- `cupHot`
- `cupHotFill`
- `dashMenu`
- `dashboard`
- `dashboard2`
- `dashboard2Fill`
- `dashboard3`
- `dashboard3Fill`
- `dashboard4`
- `dashboard4Fill`
- `dashboardBar`
- `dashboardBarFill`
- `dashboardBarNotification`
- `dashboardChart`
- `dashboardChartArrow`
- `dashboardChartArrowFill`
- `dashboardChartFill`
- `dashboardChartNotification`
- `dashboardChartStar`
- `dashboardCheck`
- `dashboardCheckFill`
- `dashboardCircleBar`
- `dashboardCircleBarFill`
- `dashboardCircleChart`
- `dashboardCircleChartFill`
- `dashboardCross`
- `dashboardCrossFill`
- `dashboardFill`
- `dashboardMinus`
- `dashboardMinusFill`
- `dashboardPlus`
- `dashboardPlusFill`
- `database`
- `database2`
- `database2Fill`
- `databaseFill`
- `deliveryTruck`
- `deliveryTruckFill`
- `dialerKeypad`
- `dialerKeypadFill`
- `directionRight`
- `directionRight2`
- `directionRight2Fill`
- `directionRightFill`
- `directionUp`
- `directionUp2`
- `directionUp2Fill`
- `directionUpFill`
- `directionUpRight`
- `directionUpRight2`
- `directionUpRight2Fill`
- `directionUpRightFill`
- `discord`
- `divide`
- `divideCircle`
- `divideCircleFill`
- `divideSquare`
- `divideSquareFill`
- `dollar`
- `dollarFill`
- `dots`
- `dotsCircle`
- `dotsCircleFill`
- `dotsHorizontal`
- `dotsHorizontalCircle`
- `dotsHorizontalCircleFill`
- `dotsHorizontalSquare`
- `dotsHorizontalSquareFill`
- `dotsMenu`
- `dotsSquare`
- `dotsSquareFill`
- `doubleArrowCircle`
- `doubleArrowCircleFill`
- `doubleArrowDown`
- `doubleArrowLeft`
- `doubleArrowRight`
- `doubleArrowUp`
- `doubleCircle`
- `doubleCircleFill`
- `doubleDiamond`
- `doubleDiamondFill`
- `doubleSquare`
- `doubleSquareFill`
- `download`
- `dribbble`
- `earth`
- `earthFill`
- `edit`
- `editFill`
- `editPen`
- `editPenFill`
- `electricity`
- `electricityDanger`
- `electricityDangerFill`
- `electricityFill`
- `email`
- `emailFill`
- `emailNotification`
- `emailOpened`
- `emailOpenedFill`
- `exchangeA`
- `exchangeB`
- `exclamationCircle`
- `exclamationCircleFill`
- `exclamationHexagon`
- `exclamationHexagonFill`
- `exclamationSquare`
- `exclamationSquareFill`
- `exclamationTriangle`
- `exclamationTriangleFill`
- `externalLink`
- `eye`
- `eyeClosed`
- `eyeFill`
- `eyeOff`
- `eyeOffFill`
- `facebook`
- `facebookCircle`
- `facebookSquare`
- `fastForward`
- `fastForwardBack`
- `fastForwardBackFill`
- `fastForwardFill`
- `female`
- `figma`
- `file`
- `file2`
- `file2Fill`
- `file3`
- `fileCheck`
- `fileCheckFill`
- `fileCross`
- `fileCrossFill`
- `fileDownload`
- `fileDownloadFill`
- `fileFill`
- `fileMinus`
- `fileMinusFill`
- `filePlus`
- `filePlusFill`
- `fileQuestionMark`
- `fileQuestionMarkFill`
- `fileRecords`
- `fileRecordsFill`
- `fileUpload`
- `fileUploadFill`
- `filter`
- `filter2`
- `filter2Fill`
- `filterFill`
- `filterSquare`
- `filterSquareFill`
- `fingerprint`
- `fingerprintMinimal`
- `fireA`
- `fireAFill`
- `fireB`
- `fireBFill`
- `firstAidKit`
- `firstAidKitFill`
- `flag`
- `flagFill`
- `focus`
- `focusFill`
- `folder`
- `folder2`
- `folder2Fill`
- `folderCheck`
- `folderCheckFill`
- `folderCross`
- `folderCrossFill`
- `folderFill`
- `folderMinus`
- `folderMinusFill`
- `folderOpen`
- `folderOpenFill`
- `folderPlus`
- `folderPlusFill`
- `gameboy`
- `gameboyFill`
- `gemA`
- `gemAFill`
- `gemB`
- `gemBFill`
- `gemC`
- `gemCFill`
- `gemStone`
- `gemStoneFill`
- `gif`
- `gifFill`
- `gift`
- `giftFill`
- `github`
- `globe`
- `globeFill`
- `goals`
- `goalsFill`
- `google`
- `handicapped`
- `handicappedFill`
- `hash`
- `headphoneMute`
- `headphoneMuteFill`
- `healthCircle`
- `healthCircleFill`
- `healthSquare`
- `healthSquareFill`
- `heaphone`
- `heaphoneFill`
- `heart`
- `heartFill`
- `heartHealth`
- `heartHealthFill`
- `heartSquare`
- `heartSquareFill`
- `home`
- `home2`
- `home2Fill`
- `home3`
- `home3Fill`
- `home4`
- `home4Fill`
- `homeCheck`
- `homeCheckFill`
- `homeCross`
- `homeCrossFill`
- `homeFill`
- `homeHeart`
- `homeHeartFill`
- `homePlus`
- `homePlusFill`
- `homeSecurityLock`
- `homeSecurityLockFill`
- `hospitalCircle`
- `hospitalCircleFill`
- `hospitalPlus`
- `hospitalPlusFill`
- `hospitalShield`
- `hospitalShieldFill`
- `hospitalSquare`
- `hospitalSquareFill`
- `hourGlass`
- `hourGlassFill`
- `idCard`
- `idCardFill`
- `illustrator`
- `image`
- `imageCheck`
- `imageCross`
- `imageDownload`
- `imageFill`
- `imageMinus`
- `imagePlus`
- `imageQuestionMark`
- `imageUpload`
- `inbox`
- `inboxCheck`
- `inboxCheckFill`
- `inboxCross`
- `inboxCrossFill`
- `inboxDownload`
- `inboxDownloadFill`
- `inboxFill`
- `inboxMinus`
- `inboxMinusFill`
- `inboxNotification`
- `inboxNotificationFill`
- `inboxPlus`
- `inboxPlusFill`
- `inboxQuestionMark`
- `inboxQuestionMarkFill`
- `inboxStar`
- `inboxStarFill`
- `inboxUpload`
- `inboxUploadFill`
- `informationCircle`
- `informationCircleFill`
- `informationSquare`
- `informationSquareFill`
- `instagramCircle`
- `instagramSquare`
- `key`
- `keyFill`
- `keyboard`
- `keyboardFill`
- `lArrowDownLeft`
- `lArrowDownRight`
- `lArrowLeftDown`
- `lArrowLeftUp`
- `lArrowRightDown`
- `lArrowRightUp`
- `lArrowUpLeft`
- `lArrowUpRight`
- `laptop`
- `laptopFill`
- `layoutCenter`
- `layoutCenterFill`
- `layoutDown`
- `layoutDownFill`
- `layoutGrid`
- `layoutGridFill`
- `layoutLeft`
- `layoutLeftFill`
- `layoutRight`
- `layoutRightFill`
- `layoutUp`
- `layoutUpFill`
- `layoutUpLeft`
- `layoutUpLeftFill`
- `layoutUpRight`
- `layoutUpRightFill`
- `lens`
- `lensFill`
- `lightBulb`
- `lightBulbElectricity`
- `lightBulbElectricityFill`
- `lightBulbFill`
- `lightBulbOff`
- `lightBulbOffFill`
- `line`
- `link`
- `linkedin`
- `location`
- `locationFill`
- `locationPin`
- `lock`
- `lockFill`
- `lockSquare`
- `lockSquareFill`
- `login`
- `logout`
- `magnetDown`
- `magnetDownFill`
- `magnetLeft`
- `magnetLeftFill`
- `magnetRight`
- `magnetRightFill`
- `magnetUp`
- `magnetUpFill`
- `male`
- `mapMarker`
- `mapMarkerFill`
- `maximize`
- `mediaReelH`
- `mediaReelHFill`
- `mediaReelV`
- `mediaReelVFill`
- `medium`
- `megaphoneA`
- `megaphoneAFill`
- `megaphoneB`
- `megaphoneBFill`
- `memoryCard`
- `memoryCardFill`
- `message`
- `messageCheck`
- `messageCheckFill`
- `messageCheckRound`
- `messageCheckRoundFill`
- `messageConversation`
- `messageConversationFill`
- `messageDots`
- `messageDotsCheck`
- `messageDotsCross`
- `messageDotsDownload`
- `messageDotsFill`
- `messageDotsMinus`
- `messageDotsPlus`
- `messageDotsQuestionMark`
- `messageDotsRound`
- `messageDotsRoundCheck`
- `messageDotsRoundCross`
- `messageDotsRoundDownload`
- `messageDotsRoundFill`
- `messageDotsRoundMinus`
- `messageDotsRoundPlus`
- `messageDotsRoundQuestionMark`
- `messageDotsRoundUpload`
- `messageDotsUpload`
- `messageFill`
- `messageInfoRound`
- `messageInfoRoundFill`
- `messageInformation`
- `messageInformationFill`
- `messageMinus`
- `messageMinusFill`
- `messageMinusRound`
- `messageMinusRoundFill`
- `messagePlus`
- `messagePlusFill`
- `messagePlusRound`
- `messagePlusRoundFill`
- `messageQuestionMark`
- `messageQuestionMarkFill`
- `messageQuestionMarkRound`
- `messageQuestionMarkRoundFill`
- `messageRound`
- `messageRoundFill`
- `messageRoundSquare`
- `messageRoundSquareFill`
- `messageSquare`
- `messageSquareFill`
- `messenger`
- `meta`
- `microphone`
- `microphoneFill`
- `microphoneMute`
- `microphoneMuteFill`
- `microsoftWindows`
- `minimize`
- `minus`
- `minusCircle`
- `minusCircleFill`
- `minusSquare`
- `minusSquareFill`
- `mobilePhone`
- `mobilePhoneFill`
- `moneyExchange`
- `moon`
- `moonFill`
- `mouse`
- `mouse2`
- `mouse2Fill`
- `mouseFill`
- `mousePointer`
- `mousePointerFill`
- `multiply`
- `multiplyCircle`
- `multiplyCircleFill`
- `multiplySquare`
- `multiplySquareFill`
- `music`
- `musicAlternate`
- `musicAlternateFill`
- `musicCircle`
- `musicCircleFill`
- `musicFill`
- `musicSquare`
- `musicSquareFill`
- `netflix`
- `next`
- `nextFill`
- `note`
- `noteFill`
- `noteText`
- `noteTextFill`
- `noteWithText`
- `noteWithTextFill`
- `notificationBell`
- `notificationBellCheck`
- `notificationBellCheckFill`
- `notificationBellCross`
- `notificationBellCrossFill`
- `notificationBellDownload`
- `notificationBellDownloadFill`
- `notificationBellFill`
- `notificationBellMinus`
- `notificationBellMinusFill`
- `notificationBellMuted`
- `notificationBellMutedFill`
- `notificationBellPending`
- `notificationBellPendingFill`
- `notificationBellPlus`
- `notificationBellPlusFill`
- `notificationBellQuestionMark`
- `notificationBellQuestionMarkFill`
- `notificationBellSnooze`
- `notificationBellSnooze2`
- `notificationBellSnooze2Fill`
- `notificationBellUpload`
- `notificationBellUploadFill`
- `notion`
- `packageBox`
- `packageBoxFill`
- `pause`
- `pauseFill`
- `pauseSquare`
- `pauseSquareFill`
- `paypal`
- `pen`
- `penFill`
- `phone`
- `phoneCall`
- `phoneCallFill`
- `phoneCancel`
- `phoneCancelFill`
- `phoneCross`
- `phoneCrossFill`
- `phoneFill`
- `phoneIncoming`
- `phoneIncomingFill`
- `phoneMinus`
- `phoneMinusFill`
- `phoneMissedCall`
- `phoneMissedCallFill`
- `phoneOutgoing`
- `phoneOutgoingFill`
- `phonePlus`
- `phonePlusFill`
- `phoneRingingLoud`
- `phoneRingingLoudFill`
- `photoshop`
- `pin`
- `pinFill`
- `pinterest`
- `play`
- `playCircle`
- `playCircleFill`
- `playFill`
- `playSquare`
- `playSquareFill`
- `playlist`
- `playlistAdd`
- `playlistAlternate`
- `playlistAlternateFill`
- `playlistFill`
- `playstore`
- `plus`
- `plusCircle`
- `plusCircleFill`
- `plusSquare`
- `plusSquareFill`
- `premierPro`
- `preview`
- `previewCircle`
- `previewCircleFill`
- `previewFill`
- `previous`
- `previousFill`
- `printer`
- `printerFill`
- `qrCode`
- `qrCodeFill`
- `questionMarkCircle`
- `questionMarkCircleFill`
- `questionMarkSquare`
- `questionMarkSquareFill`
- `reddit`
- `refresh`
- `refreshReverse`
- `reload`
- `reloadReverse`
- `ribbon`
- `ribbonFill`
- `robot`
- `robotAppreciate`
- `robotAppreciateFill`
- `robotDead`
- `robotDeadFill`
- `robotFill`
- `robotHappy`
- `robotHappyFill`
- `robotSad`
- `robotSadFill`
- `robotScreen`
- `robotScreenFill`
- `robotUwu`
- `robotUwuFill`
- `robotWink`
- `robotWinkFill`
- `rocket`
- `rocketFill`
- `roundSticker`
- `roundStickerFill`
- `saveFloppy`
- `saveFloppyFill`
- `scaleDown`
- `scaleUp`
- `scan`
- `scanUser`
- `scanUserFill`
- `screencast`
- `screencastFill`
- `search`
- `searchFill`
- `searchSquare`
- `searchSquareFill`
- `securityShield`
- `securityShieldFill`
- `selectBox`
- `server`
- `server2`
- `server2Fill`
- `serverFill`
- `settings`
- `settingsFill`
- `share`
- `shareFill`
- `shieldCheck`
- `shieldCheckFill`
- `shieldCross`
- `shieldCrossFill`
- `shieldPlus`
- `shieldPlusFill`
- `shieldQuestionMark`
- `shieldQuestionMarkFill`
- `shiledMinus`
- `shiledMinusFill`
- `shop`
- `shopFill`
- `shoppingBag`
- `shoppingBagFill`
- `shoppingCart`
- `shoppingCartFill`
- `shutDown`
- `shutDownFill`
- `simCard`
- `simCardFill`
- `slack`
- `snapchat`
- `soundWaves`
- `spotify`
- `stack`
- `stackFill`
- `star`
- `starCircle`
- `starCircleFill`
- `starFill`
- `starMoving`
- `starMovingFill`
- `starSquare`
- `starSquareFill`
- `starsA`
- `starsAFill`
- `starsB`
- `starsBFill`
- `starsC`
- `starsCFill`
- `steam`
- `stop`
- `stopCircle`
- `stopCircleFill`
- `stopFill`
- `stopSquare`
- `stopSquareFill`
- `stripe`
- `sun`
- `sunFill`
- `swimRingFill`
- `tablet`
- `tabletFill`
- `tag`
- `tag2`
- `tag2Fill`
- `tagCheck`
- `tagCheckFill`
- `tagCross`
- `tagCrossFill`
- `tagFill`
- `tagMinus`
- `tagMinusFill`
- `tagPlus`
- `tagPlusFill`
- `tagQuestionMark`
- `tagQuestionMarkFill`
- `telegram`
- `television`
- `televisionCheck`
- `televisionCheckFill`
- `televisionCross`
- `televisionCrossFill`
- `televisionDownload`
- `televisionDownloadFill`
- `televisionFill`
- `televisionMinus`
- `televisionMinusFill`
- `televisionPlus`
- `televisionPlusFill`
- `televisionQuestionMark`
- `televisionQuestionMarkFill`
- `televisionUpload`
- `televisionUploadFill`
- `threads`
- `threadsSquare`
- `threeDBoxSquare`
- `threeDBoxSquareFill`
- `thumbsDown`
- `thumbsDownFill`
- `thumbsUp`
- `thumbsUpFill`
- `tiktok`
- `tiktokCircle`
- `trash`
- `trash2`
- `trash2Fill`
- `trash3`
- `trash3Fill`
- `trashFill`
- `trashSquare`
- `trashSquareFill`
- `trophy`
- `trophyCircle`
- `trophyCircleFill`
- `trophyDown`
- `trophyDownFill`
- `trophyFill`
- `trophyStar`
- `trophyStarFill`
- `trophyUp`
- `trophyUpFill`
- `tube`
- `tubeFill`
- `twitter`
- `twtich`
- `unlocked`
- `unlockedFill`
- `upload`
- `user`
- `userCheck`
- `userCheckFill`
- `userCircle`
- `userCircleFill`
- `userCross`
- `userCrossFill`
- `userFill`
- `userMinus`
- `userMinusFill`
- `userPlus`
- `userPlusFill`
- `userQuestionMark`
- `userQuestionMarkFill`
- `userSquare`
- `userSquareFill`
- `users`
- `usersFill`
- `verifiedCheck`
- `verifiedCheckFill`
- `video`
- `videoCheck`
- `videoCheckFill`
- `videoCross`
- `videoCrossFill`
- `videoDownload`
- `videoDownloadFill`
- `videoFill`
- `videoMinus`
- `videoMinusFill`
- `videoPlayer`
- `videoPlayerFill`
- `videoPlus`
- `videoPlusFill`
- `videoQuestionMark`
- `videoQuestionMarkFill`
- `videoUpload`
- `videoUploadFill`
- `visa`
- `visaSquare`
- `voicemail`
- `voicemailFill`
- `volumeDown`
- `volumeDownFill`
- `volumeMute`
- `volumeMuteFill`
- `volumeUp`
- `volumeUpFill`
- `volumeZero`
- `volumeZeroFill`
- `waterDrop`
- `waterDropFill`
- `waterGlass`
- `waterGlassFill`
- `weChat`
- `whatsapp`
- `whatsappFilled`
- `wifi`
- `wrench`
- `wrenchFill`
- `x`
- `xSquare`
- `youtube`
- `zap`
- `zapCircle`
- `zapCircleFill`
- `zapFill`
- `zapSquare`
- `zapSquareFill`
- `zoomIn`
- `zoomInFill`
- `zoomOut`
- `zoomOutFill`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AdobeIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AeroplaneIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AeroplaneFillIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AfterEffectsIcon size="20" class="nav-icon" /> Settings</a>
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
<AdobeIcon
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
    <AdobeIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AeroplaneIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AeroplaneFillIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdobeIcon size="24" />
   <AeroplaneIcon size="24" color="#4a90e2" />
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
   <AdobeIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdobeIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdobeIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adobe } from '@stacksjs/iconify-mage'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adobe, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adobe } from '@stacksjs/iconify-mage'

// Icons are typed as IconData
const myIcon: IconData = adobe
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Apache 2.0

See [license details](https://github.com/Mage-Icons/mage-icons/blob/main/License.txt) for more information.

## Credits

- **Icons**: MageIcons ([Website](https://github.com/Mage-Icons/mage-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/mage/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/mage/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
