# Lets Icons

> Lets Icons icons for stx from Iconify

## Overview

This package provides access to 1544 icons from the Lets Icons collection through the stx iconify integration.

**Collection ID:** `lets-icons`
**Total Icons:** 1544
**Author:** Leonid Tsvetkov ([Website](https://www.figma.com/community/file/886554014393250663))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lets-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<10Icon height="1em" />
<10Icon width="1em" height="1em" />
<10Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<10Icon size="24" />
<10Icon size="1em" />

<!-- Using width and height -->
<10Icon width="24" height="32" />

<!-- With color -->
<10Icon size="24" color="red" />
<10Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<10Icon size="24" class="icon-primary" />

<!-- With all properties -->
<10Icon
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
    <10Icon size="24" />
    <10LightIcon size="24" color="#4a90e2" />
    <3dBoxIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 10, 10Light, 3dBox } from '@stacksjs/iconify-lets-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(10, { size: 24 })
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
<10Icon size="24" color="red" />
<10Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<10Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<10Icon size="24" class="text-primary" />
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
<10Icon height="1em" />
<10Icon width="1em" height="1em" />
<10Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<10Icon size="24" />
<10Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.letsIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<10Icon class="letsIcons-icon" />
```

## Available Icons

This package contains **1544** icons:

- `10`
- `10Light`
- `3dBox`
- `3dBoxDuotone`
- `3dBoxFill`
- `3dBoxLight`
- `add`
- `addDuotone`
- `addDuotoneLine`
- `addLight`
- `addRing`
- `addRingDuotone`
- `addRingDuotoneLine`
- `addRingFill`
- `addRingLight`
- `addRound`
- `addRoundDuotone`
- `addRoundDuotoneLine`
- `addRoundFill`
- `addRoundLight`
- `addSquare`
- `addSquareDuotone`
- `addSquareDuotoneLine`
- `addSquareFill`
- `addSquareLight`
- `alarm`
- `alarmDuotone`
- `alarmFill`
- `alarmLight`
- `alarmclock`
- `alarmclockDuotone`
- `alarmclockDuotoneLine`
- `alarmclockFill`
- `alarmclockLight`
- `angry`
- `angryLight`
- `arhive`
- `arhiveAltAdd`
- `arhiveAltAddLight`
- `arhiveAltAddList`
- `arhiveAltAddListLight`
- `arhiveAltBigDuotone`
- `arhiveAltBigDuotoneLine`
- `arhiveAltBigLight`
- `arhiveAltExport`
- `arhiveAltExportLight`
- `arhiveAltFill`
- `arhiveAltSmall`
- `arhiveAltSmallAdd`
- `arhiveAltSmallAddLight`
- `arhiveAltSmallDuotone`
- `arhiveAltSmallDuotoneLine`
- `arhiveAltSmallLight`
- `arhiveAltSmallLock`
- `arhiveAltSmallLockLight`
- `arhiveAltSmallSecureLight`
- `arhiveDuotone`
- `arhiveDuotoneLine`
- `arhiveExport`
- `arhiveExportLight`
- `arhiveFill`
- `arhiveFillDuotone`
- `arhiveImport`
- `arhiveImportLight`
- `arhiveLight`
- `arhiveLoad`
- `arhiveLoadDuotone`
- `arhiveLoadDuotoneLine`
- `arhiveLoadFill`
- `arhiveLoadLight`
- `arhivePlane`
- `arhivePlaneLight`
- `arhivesAlt`
- `arhivesAltLight`
- `arhivesGroupDocks`
- `arhivesGroupDocksLight`
- `array`
- `arrayLight`
- `arrowAltLdown`
- `arrowAltLdownAlt`
- `arrowAltLeft`
- `arrowAltLeftAlt`
- `arrowAltLright`
- `arrowAltLrightAlt`
- `arrowAltLtop`
- `arrowAltLtopAlt`
- `arrowDown`
- `arrowDownLight`
- `arrowDownLong`
- `arrowDownLongLight`
- `arrowDropDown`
- `arrowDropDownBig`
- `arrowDropLeft`
- `arrowDropRight`
- `arrowDropUp`
- `arrowLeft`
- `arrowLeftLight`
- `arrowLeftLong`
- `arrowLeftLongLight`
- `arrowLeftStop`
- `arrowLeftStopLight`
- `arrowRight`
- `arrowRightLight`
- `arrowRightLong`
- `arrowRightLongLight`
- `arrowRightStop`
- `arrowRightStopLight`
- `arrowTop`
- `arrowTopLight`
- `arrowTopLong`
- `arrowTopLongLight`
- `atom`
- `atomAlt`
- `atomAltLight`
- `atomLight`
- `back`
- `backLight`
- `bag`
- `bagAlt`
- `bagAltDuotone`
- `bagAltDuotoneLine`
- `bagAltFill`
- `bagAltLight`
- `bagDuotone`
- `bagDuotoneLine`
- `bagFill`
- `bagLight`
- `basket`
- `basketAlt`
- `basketAlt2`
- `basketAlt2DuotoneLine`
- `basketAlt2Light`
- `basketAlt3`
- `basketAlt3Light`
- `basketAltDuotone`
- `basketAltDuotoneLine`
- `basketAltLight`
- `basketDuotone`
- `basketDuotoneLine`
- `basketFill`
- `basketLight`
- `batteryFull`
- `batteryFullDuotone`
- `batteryFullDuotoneLine`
- `batteryFullFill`
- `batteryFullLight`
- `batteryLow`
- `batteryLowDuotone`
- `batteryLowDuotoneLine`
- `batteryLowFill`
- `batteryLowLight`
- `bed`
- `bedLight`
- `bell`
- `bellDuotoneLine`
- `bellFill`
- `bellLight`
- `bellPin`
- `bellPinDuotoneLine`
- `bellPinFill`
- `bellPinLight`
- `blank`
- `blankAlt`
- `blankAltDuotone`
- `blankAltDuotoneLine`
- `blankAltFill`
- `blankAltLight`
- `blankDuotone`
- `blankDuotoneLine`
- `blankFill`
- `blankLight`
- `blood`
- `bloodAdd`
- `bloodAddLight`
- `bloodLight`
- `bloodMinus`
- `bloodMinusLight`
- `book`
- `bookCheck`
- `bookCheckDuotone`
- `bookCheckDuotoneLine`
- `bookCheckFill`
- `bookCheckLight`
- `bookDuotone`
- `bookDuotoneLine`
- `bookFill`
- `bookLight`
- `bookOpen`
- `bookOpenAlt`
- `bookOpenAltDuotone`
- `bookOpenAltDuotoneLight`
- `bookOpenAltFill`
- `bookOpenAltLight`
- `bookOpenDuotone`
- `bookOpenDuotoneLine`
- `bookOpenFill`
- `bookOpenLight`
- `bookmark`
- `bookmarkDuotone`
- `bookmarkFill`
- `bookmarkLight`
- `box`
- `boxAlt`
- `boxAltDuotone`
- `boxAltFill`
- `boxAltFillDuotone`
- `boxAltLight`
- `boxDuotone`
- `boxFill`
- `boxFillDuotone`
- `boxLight`
- `boxOpen`
- `boxOpenDuotone`
- `boxOpenFill`
- `boxOpenFillDuotone`
- `boxOpenLight`
- `boxRefreshAltRight`
- `boxRefreshAltRightLight`
- `boxRefreshRight`
- `boxRefreshRightLight`
- `boxes`
- `boxesLight`
- `brokenHeart`
- `brokenHeartDuotone`
- `brokenHeartFill`
- `brokenHeartLight`
- `bubble`
- `bubbleLight`
- `bug`
- `bugDuotone`
- `bugFill`
- `bugLight`
- `cake`
- `calendar`
- `calendarAdd`
- `calendarAddDuotone`
- `calendarAddDuotoneLine`
- `calendarAddFill`
- `calendarAddLight`
- `calendarDuotone`
- `calendarDuotoneLine`
- `calendarFill`
- `calendarLight`
- `calories`
- `caloriesLight`
- `camera`
- `cameraDuotone`
- `cameraDuotoneLine`
- `cameraFill`
- `cameraLight`
- `cancel`
- `cancelDuotone`
- `cancelDuotoneLine`
- `cancelFill`
- `cancelLight`
- `candlestick`
- `candlestickDuotoneLine`
- `candlestickLight`
- `carbs`
- `carbsLight`
- `chart`
- `chartAlt`
- `chartAltDuotone`
- `chartAltDuotoneLine`
- `chartAltFill`
- `chartAltLight`
- `chartDuotone`
- `chartDuotoneLine`
- `chartFill`
- `chartLight`
- `chartPin`
- `chartPinLight`
- `chat`
- `chatAlt`
- `chatAlt2`
- `chatAlt2Duotone`
- `chatAlt2DuotoneLine`
- `chatAlt2Fill`
- `chatAlt2Light`
- `chatAlt3`
- `chatAlt3Duotone`
- `chatAlt3DuotoneLine`
- `chatAlt3Fill`
- `chatAlt3Light`
- `chatAltAdd`
- `chatAltAddDuotone`
- `chatAltAddDuotoneLine`
- `chatAltAddFill`
- `chatAltAddLight`
- `chatAltDuotone`
- `chatAltDuotoneLine`
- `chatAltFill`
- `chatAltLight`
- `chatDuotone`
- `chatDuotoneLine`
- `chatFill`
- `chatLight`
- `chatPlus`
- `chatPlusDuotone`
- `chatPlusDuotoneLine`
- `chatPlusFill`
- `chatPlusLight`
- `chatSearch`
- `chatSearchDuotone`
- `chatSearchDuotoneLight`
- `chatSearchFill`
- `chatSearchLight`
- `checkFill`
- `checkRing`
- `checkRingDuotone`
- `checkRingDuotoneLine`
- `checkRingLight`
- `checkRingRound`
- `checkRingRoundDuotone`
- `checkRingRoundDuotoneLine`
- `checkRingRoundLight`
- `checkRoundFill`
- `chemistry`
- `chemistryLight`
- `chield`
- `chieldAlt`
- `chieldAltDuotone`
- `chieldAltDuotoneLine`
- `chieldAltFill`
- `chieldAltLight`
- `chieldCheck`
- `chieldCheckDuotone`
- `chieldCheckDuotoneLine`
- `chieldCheckFill`
- `chieldCheckLight`
- `chieldDuotone`
- `chieldDuotoneLine`
- `chieldFill`
- `chieldLight`
- `circleLeft`
- `circleLeftLight`
- `circleRight`
- `circleRightAlt`
- `circleRightAltLight`
- `circleRightLight`
- `clock`
- `clockDuotone`
- `clockDuotoneLine`
- `clockFill`
- `clockLight`
- `closeRing`
- `closeRingDuotone`
- `closeRingDuotoneLine`
- `closeRingFill`
- `closeRingLight`
- `closeRound`
- `closeRoundDuotone`
- `closeRoundDuotoneLine`
- `closeRoundFill`
- `closeRoundLight`
- `closeSquare`
- `closeSquareDuotone`
- `closeSquareDuotoneLine`
- `closeSquareFill`
- `closeSquareLight`
- `cloud`
- `cloudAlt`
- `cloudAltDuotone`
- `cloudAltFill`
- `cloudAltLight`
- `cloudDuotone`
- `cloudFill`
- `cloudLight`
- `code`
- `codeLight`
- `collapse`
- `collapseLight`
- `colorMode`
- `colorModeLight`
- `colorPicker`
- `columUp`
- `columUpFill`
- `columUpLight`
- `comment`
- `commentDuotone`
- `commentDuotoneLine`
- `commentFill`
- `commentLight`
- `compasMini`
- `compasMiniDuotone`
- `compasMiniDuotoneLine`
- `compasMiniFill`
- `compasMiniLight`
- `compass`
- `compassAlt`
- `compassAltFill`
- `compassAltLight`
- `compassDuotone`
- `compassDuotoneLine`
- `compassFill`
- `compassLight`
- `compassNorth`
- `compassNorthDuotone`
- `compassNorthFill`
- `compassNorthLight`
- `copy`
- `copyAlt`
- `copyAltLight`
- `copyLight`
- `covert`
- `covertLight`
- `cpu`
- `cpuLight`
- `creditCard`
- `creditCardDuotone`
- `creditCardDuotoneLine`
- `creditCardFill`
- `creditCardLight`
- `critical`
- `criticalDuotone`
- `criticalDuotoneLine`
- `criticalFill`
- `criticalLight`
- `darhboard`
- `darhboardAlt`
- `dataBank`
- `database`
- `databaseDuotone`
- `databaseFill`
- `databaseLight`
- `dateFill`
- `dateRange`
- `dateRangeDuotone`
- `dateRangeDuotoneLine`
- `dateRangeFill`
- `dateRangeLight`
- `dateToday`
- `dateTodayDuotone`
- `dateTodayDuotoneLine`
- `dateTodayLight`
- `delAlt`
- `delAltDuotone`
- `delAltDuotoneLine`
- `delAltFill`
- `delAltLight`
- `dell`
- `dellDuotone`
- `dellDuotoneLine`
- `dellFill`
- `dellLight`
- `desk`
- `deskAlt`
- `deskAltDuotone`
- `deskAltDuotoneLine`
- `deskAltFill`
- `deskAltLight`
- `deskDuotone`
- `deskDuotoneLine`
- `deskFill`
- `deskLight`
- `desktop`
- `desktopLight`
- `dimond`
- `dimondAlt`
- `dimondAltDuotone`
- `dimondAltFill`
- `dimondAltLight`
- `dimondDuotone`
- `dimondFill`
- `dimondLight`
- `direction`
- `directionAlt`
- `directionAlt2`
- `directionAlt2Duotone`
- `directionAlt2DuotoneLine`
- `directionAlt2Fill`
- `directionAlt2Light`
- `directionAlt3`
- `directionAlt3Duotone`
- `directionAlt3DuotoneLine`
- `directionAlt3Fill`
- `directionAlt3Light`
- `directionAltDuotone`
- `directionAltDuotoneLine`
- `directionAltFill`
- `directionAltLight`
- `directionDuotone`
- `directionDuotoneLine`
- `directionFill`
- `directionLight`
- `dna`
- `dnaLight`
- `done`
- `doneAllAltRound`
- `doneAllAltRoundLight`
- `doneAllRound`
- `doneAllRoundDuotone`
- `doneAllRoundDuotoneLine`
- `doneAllRoundLight`
- `doneDuotone`
- `doneDuotoneLine`
- `doneFill`
- `doneLight`
- `doneRingRound`
- `doneRingRoundDuotone`
- `doneRingRoundDuotoneLine`
- `doneRingRoundFill`
- `doneRingRoundLight`
- `doneRound`
- `doneRoundDuotone`
- `doneRoundDuotoneLine`
- `doneRoundFill`
- `doneRoundLight`
- `doughnutChart`
- `doughnutChartLight`
- `down`
- `downLight`
- `download`
- `downloadCircle`
- `downloadCircleDuotone`
- `downloadCircleDuotoneLine`
- `downloadCircleFill`
- `downloadCircleLight`
- `downloadDuotone`
- `downloadDuotoneLine`
- `downloadFill`
- `downloadLight`
- `drink`
- `drinkLight`
- `eMail`
- `eMailLight`
- `edit`
- `editAlt`
- `editDuotone`
- `editDuotoneLine`
- `editFill`
- `editLight`
- `expandDown`
- `expandDownDouble`
- `expandDownDoubleLight`
- `expandDownLight`
- `expandDownStop`
- `expandDownStopLight`
- `expandLeft`
- `expandLeftDouble`
- `expandLeftDoubleLight`
- `expandLeftLight`
- `expandLeftStop`
- `expandLeftStopLight`
- `expandRight`
- `expandRightDouble`
- `expandRightDoubleLight`
- `expandRightLight`
- `expandRightStop`
- `expandRightStopLight`
- `expandTopStop`
- `expandTopStopLight`
- `expandUp`
- `expandUpDouble`
- `expandUpDoubleLight`
- `expandUpLight`
- `export`
- `exportDuotone`
- `exportDuotoneLine`
- `exportFill`
- `exportLight`
- `external`
- `eye`
- `eyeDuotone`
- `eyeFill`
- `eyeLight`
- `fat`
- `fatLight`
- `favorite`
- `favoriteDuotone`
- `favoriteFill`
- `favoriteLight`
- `favorites`
- `favoritesDuotone`
- `favoritesDuotoneLine`
- `favoritesFill`
- `favoritesLight`
- `file`
- `fileDock`
- `fileDockAdd`
- `fileDockAddFill`
- `fileDockDuotone`
- `fileDockDuotoneLine`
- `fileDockFill`
- `fileDockLight`
- `fileDockSearchFill`
- `fileDockSearchLight`
- `fileDuotone`
- `fileDuotoneLine`
- `fileFill`
- `fileLight`
- `filter`
- `filterAlt`
- `filterAltDuotone`
- `filterAltDuotoneLine`
- `filterAltFill`
- `filterAltLight`
- `filterBig`
- `filterBigAlt`
- `fire`
- `fireAltDuotone`
- `fireAltLight`
- `fireDuotoneFill`
- `fireDuotoneLine`
- `fireFill`
- `fireLight`
- `flag`
- `flagAlt`
- `flagAltDuotone`
- `flagAltFill`
- `flagAltLight`
- `flagDuotone`
- `flagFill`
- `flagFinish`
- `flagFinishAlt`
- `flagFinishAltLight`
- `flagFinishDuotone`
- `flagFinishFill`
- `flagFinishLight`
- `flagLight`
- `flash`
- `flashLight`
- `flask`
- `flaskAlt`
- `flaskAltLight`
- `flaskLight`
- `fluid`
- `fluidLight`
- `folder`
- `folderAdd`
- `folderAddDuotoneFill`
- `folderAddDuotoneLine`
- `folderAddFill`
- `folderAddLight`
- `folderAlt`
- `folderAltDuotone`
- `folderAltDuotoneFill`
- `folderAltFill`
- `folderAltLight`
- `folderCheck`
- `folderCheckDuotone`
- `folderCheckDuotoneLine`
- `folderCheckFill`
- `folderCheckLight`
- `folderCopy`
- `folderCopyDuotone`
- `folderCopyDuotoneLine`
- `folderCopyFill`
- `folderCopyLight`
- `folderDel`
- `folderDelDuotoneFill`
- `folderDelDuotoneLine`
- `folderDelFill`
- `folderDelLight`
- `folderDublicate`
- `folderDublicateDuotone`
- `folderDublicateDuotoneLine`
- `folderDublicateFill`
- `folderDublicateLight`
- `folderDuotoneFill`
- `folderDuotoneLine`
- `folderFile`
- `folderFileAlt`
- `folderFileAltDuotoneFill`
- `folderFileAltDuotoneLine`
- `folderFileAltFill`
- `folderFileAltLight`
- `folderFileDuotoneFill`
- `folderFileDuotoneLine`
- `folderFileFill`
- `folderFileLight`
- `folderFill`
- `folderLight`
- `folderLineDuotone`
- `folderLineDuotoneLine`
- `folderLineFill`
- `folderLineLight`
- `folderOpen`
- `folderOpenAlt`
- `folderOpenAltLight`
- `folderOpenLight`
- `folderSearch`
- `folderSearchDuotone`
- `folderSearchDuotoneLine`
- `folderSearchFill`
- `folderSearchLight`
- `folderSend`
- `folderSendDuotone`
- `folderSendDuotoneLine`
- `folderSendFill`
- `folderSendLight`
- `folderUp`
- `folderUpDuotone`
- `folderUpDuotoneLine`
- `folderUpLight`
- `foldersGroup`
- `foldersGroupLight`
- `foldersLight`
- `foldersLine`
- `foldersLineDuotone`
- `foldersLineDuotoneLine`
- `foldersLineLight`
- `form`
- `formDuotone`
- `formDuotoneLine`
- `formFill`
- `formLight`
- `frame`
- `frameLight`
- `full`
- `fullAlt`
- `fullAltLight`
- `fullLight`
- `fullScreenCorner`
- `fullScreenCornerLight`
- `gamepad`
- `gamepadLight`
- `gift`
- `giftAlt`
- `giftAltLight`
- `giftFill`
- `giftLight`
- `giftLightDuotone`
- `giftLightDuotoneLine`
- `glasses`
- `glassesLight`
- `globe`
- `globeLight`
- `gpsFixed`
- `gpsFixedDuotone`
- `gpsFixedDuotoneLine`
- `gpsFixedFill`
- `gpsFixedLight`
- `group`
- `groupAdd`
- `groupAddFill`
- `groupAddLight`
- `groupFill`
- `groupLight`
- `groupScan`
- `groupScanFill`
- `groupShare`
- `groupShareLight`
- `happy`
- `happyLight`
- `headphonesFill`
- `headphonesFillDuotone`
- `headphonesFillLight`
- `hhourglassMoveLight`
- `hideEye`
- `hideEyeDuotone`
- `hideEyeDuotoneLine`
- `hideEyeFill`
- `hideEyeLight`
- `home`
- `homeDuotone`
- `homeDuotoneLine`
- `homeFill`
- `homeLight`
- `horizontalDownLeftMain`
- `horizontalDownLeftMainLight`
- `horizontalDownRightMain`
- `horizontalDownRightMainLight`
- `horizontalSwitch`
- `horizontalSwitchLight`
- `horizontalTopLeftMain`
- `horizontalTopLeftMainLight`
- `horizontalTopRightMain`
- `horizontalTopRightMainLight`
- `hourglassLight`
- `humidity`
- `humidityLight`
- `iceCream`
- `iceCream1`
- `img`
- `imgAlt`
- `imgAltLight`
- `imgBox`
- `imgBoxDuotone`
- `imgBoxDuotoneLine`
- `imgBoxFill`
- `imgBoxLight`
- `imgDuotone`
- `imgDuotoneLine`
- `imgFill`
- `imgLight`
- `imgLoadBox`
- `imgLoadBoxDuotone`
- `imgLoadBoxDuotoneLine`
- `imgLoadBoxFill`
- `imgLoadBoxLight`
- `imgOutBox`
- `imgOutBoxDuotone`
- `imgOutBoxDuotoneLine`
- `imgOutBoxFill`
- `imgOutBoxLight`
- `imgRol`
- `imgRolDuotone`
- `imgRolDuotoneLine`
- `imgRolFill`
- `imgRolLight`
- `import`
- `importDuotone`
- `importDuotoneLine`
- `importFill`
- `importLight`
- `in`
- `inLight`
- `info`
- `infoAlt`
- `infoAltDuotone`
- `infoAltDuotoneLine`
- `infoAltFill`
- `infoAltLight`
- `infoDuotone`
- `infoDuotoneLine`
- `infoFill`
- `infoLight`
- `insta`
- `instaDuotone`
- `instaDuotoneLine`
- `instaFill`
- `instaLight`
- `ito`
- `itoDuotone`
- `itoFill`
- `itoLight`
- `json`
- `jsonLight`
- `jumpTime`
- `jumpTimeDuotone`
- `jumpTimeDuotoneLine`
- `jumpTimeFill`
- `key`
- `keyAlt`
- `keyAltDuotone`
- `keyAltDuotoneLine`
- `keyAltFill`
- `keyAltLight`
- `keyDuotone`
- `keyDuotoneLine`
- `keyFill`
- `keyLight`
- `knife`
- `knifeLight`
- `lable`
- `lableDuotone`
- `lableFill`
- `lableLight`
- `lamp`
- `lampDuotoneLine`
- `lampFill`
- `lampLight`
- `layers`
- `layersDuotone`
- `layersFill`
- `layersLight`
- `lightning`
- `lightningAlt`
- `lightningAltDuotone`
- `lightningAltDuotoneLine`
- `lightningAltFill`
- `lightningAltLight`
- `lightningDuotone`
- `lightningDuotoneLine`
- `lightningFill`
- `lightningLight`
- `lightningRing`
- `lightningRingDuotone`
- `lightningRingDuotoneLine`
- `lightningRingLight`
- `line`
- `lineAlt`
- `lineDuotone`
- `lineFill`
- `lineIn`
- `lineInAlt`
- `lineInAltLight`
- `lineInLight`
- `lineLight`
- `lineOut`
- `lineOutAlt`
- `lineOutAltLight`
- `lineOutLight`
- `lineUp`
- `lineUpLight`
- `link`
- `linkAlt`
- `linkAltLight`
- `linkLight`
- `loadCircle`
- `loadCircleDuotone`
- `loadCircleDuotoneLine`
- `loadCircleFill`
- `loadCircleLight`
- `loadList`
- `loadListAlt`
- `loadListAltFill`
- `loadListFill`
- `loadListLight`
- `lock`
- `lockAlt`
- `lockAltDuotone`
- `lockAltDuotoneLine`
- `lockAltFill`
- `lockAltLight`
- `lockDuotone`
- `lockDuotoneLine`
- `lockFill`
- `lockLight`
- `lol`
- `lolLight`
- `map`
- `mapDuotone`
- `mapDuotoneLine`
- `mapFill`
- `mapLight`
- `mask`
- `maskLight`
- `materials`
- `materialsLight`
- `meatballsMenu`
- `menu`
- `message`
- `messageAlt`
- `messageAltDuotone`
- `messageAltDuotoneLine`
- `messageAltFill`
- `messageAltLight`
- `messageDuotone`
- `messageDuotoneLine`
- `messageFill`
- `messageLight`
- `messageOpen`
- `messageOpenDuotone`
- `messageOpenDuotoneLine`
- `messageOpenFill`
- `messageOpenLight`
- `mic`
- `micAlt`
- `micAltDuotone`
- `micAltFill`
- `micAltLight`
- `micDuotone`
- `micFill`
- `micLight`
- `mobile`
- `mobileLight`
- `molecule`
- `moleculeLight`
- `money`
- `moneyDuotone`
- `moneyDuotoneLine`
- `moneyFill`
- `moneyLight`
- `moon`
- `moonAlt`
- `moonAltDuotone`
- `moonAltFill`
- `moonAltLight`
- `moonDuotone`
- `moonFill`
- `moonLight`
- `mortarboard`
- `mortarboardAlt`
- `mortarboardAlt2`
- `mortarboardAlt2Light`
- `mortarboardAltLight`
- `mortarboardFill`
- `mortarboardLight`
- `mouse`
- `mouseLight`
- `move`
- `moveAlt`
- `moveAltAlt`
- `moveLight`
- `music`
- `musicDuotone`
- `musicFill`
- `musicLight`
- `navigate`
- `navigateDuotone`
- `navigateDuotoneLine`
- `navigateFill`
- `navigateLight`
- `nesting`
- `nestingDuotone`
- `nestingFill`
- `nestingLight`
- `news`
- `newsDuotone`
- `newsDuotoneLine`
- `newsFill`
- `newsLight`
- `nfc`
- `nfcDuotone`
- `nfcDuotoneLine`
- `nfcFill`
- `nfcLight`
- `notebook`
- `notebookDuotone`
- `notebookDuotoneLine`
- `notebookFill`
- `notebookLight`
- `off`
- `offLight`
- `oil`
- `oilLight`
- `on`
- `onButton`
- `onButtonDuotone`
- `onButtonDuotoneLine`
- `onButtonFill`
- `onButtonLight`
- `onLight`
- `orange`
- `order`
- `orderDuotone`
- `orderDuotoneLine`
- `orderFill`
- `orderLight`
- `out`
- `outLight`
- `package`
- `packageBox`
- `packageBoxAlt`
- `packageBoxClose`
- `packageCar`
- `packageFavourite`
- `packageFavouriteAlt`
- `packageSearch`
- `paper`
- `paperAlt`
- `paperAltLight`
- `paperDuotone`
- `paperDuotoneLine`
- `paperFill`
- `paperLight`
- `passLight`
- `pen`
- `penLight`
- `percent`
- `percentLight`
- `phone`
- `phoneDuotone`
- `phoneDuotoneLine`
- `phoneFill`
- `phoneLight`
- `pieChart`
- `pieChartFill`
- `pieChartLight`
- `pil`
- `pilLight`
- `pils`
- `pilsLight`
- `pin`
- `pinAlt`
- `pinAltDuotone`
- `pinAltDuotoneLine`
- `pinAltFill`
- `pinAltLight`
- `pinDuotone`
- `pinDuotoneLine`
- `pinFill`
- `pinLight`
- `pined`
- `pinedDuotone`
- `pinedFill`
- `pinedLight`
- `pipe`
- `pipeDuotone`
- `pipeDuotoneLine`
- `pipeFill`
- `pipeLight`
- `pipette`
- `pipetteLight`
- `pizza`
- `play`
- `playDuotone`
- `playFill`
- `playLight`
- `pointers`
- `pointersDuotone`
- `pointersDuotoneLine`
- `pointersFill`
- `pointersLight`
- `pressure`
- `pressureLight`
- `print`
- `printDuotone`
- `printDuotoneLine`
- `printFill`
- `printLight`
- `progress`
- `progressDuotone`
- `progressDuotoneLine`
- `progressLight`
- `protein`
- `proteinLight`
- `pyramidChart`
- `pyramidChartLight`
- `question`
- `questionDuotone`
- `questionDuotoneLine`
- `questionFill`
- `questionLight`
- `rain`
- `rainDuotone`
- `rainFill`
- `rainLight`
- `reduce`
- `reduceLight`
- `refresh`
- `refresh2`
- `refresh2Light`
- `refreshLight`
- `refundBack`
- `refundBackLight`
- `refundDown`
- `refundDownLight`
- `refundForward`
- `refundForwardLight`
- `refundTop`
- `refundTopLight`
- `regroup`
- `regroupLight`
- `remote`
- `remoteLight`
- `remove`
- `removeDuotone`
- `removeDuotoneLine`
- `removeFill`
- `removeLight`
- `rename`
- `renameLight`
- `resizeDownRight`
- `resizeDownRightLight`
- `return`
- `returnLight`
- `ring`
- `ringDuotoneLine`
- `ringFill`
- `ringLight`
- `road`
- `roadAlt`
- `roadAltDuotone`
- `roadAltDuotoneLine`
- `roadAltFill`
- `roadAltLight`
- `roadDuotone`
- `roadFill`
- `roadFinish`
- `roadFinishDuotone`
- `roadFinishDuotoneLine`
- `roadFinishFill`
- `roadFinishLight`
- `roadLight`
- `rodaDuotoneLine`
- `rofl`
- `roflLight`
- `roll`
- `rollAlt`
- `rollAltLightLight`
- `rollLightLight`
- `root`
- `rootLightLight`
- `sad`
- `sadAlt`
- `sadAlt2`
- `sadAlt2Light`
- `sadAltLight`
- `sadLight`
- `save`
- `saveDuotone`
- `saveFill`
- `saveLight`
- `scan`
- `scanAlt`
- `scanAlt2`
- `scanAlt2Light`
- `scanAltLight`
- `scanLight`
- `search`
- `searchAlt`
- `searchAltDuotone`
- `searchAltDuotoneLine`
- `searchAltFill`
- `searchAltLight`
- `searchDuotone`
- `searchDuotoneLine`
- `searchFill`
- `searchLight`
- `send`
- `sendDuotone`
- `sendDuotoneLine`
- `sendFill`
- `sendHor`
- `sendHorDuotone`
- `sendHorDuotoneLine`
- `sendHorFill`
- `sendHorLight`
- `sendLight`
- `sertificate`
- `sertificateLight`
- `server`
- `serverDuotone`
- `serverFill`
- `serverLight`
- `settingAltFill`
- `settingAltLine`
- `settingAltLineDuotone`
- `settingAltLineDuotoneLine`
- `settingAltLineLight`
- `settingFill`
- `settingLine`
- `settingLineDuotone`
- `settingLineDuotoneLine`
- `settingLineLight`
- `settingVert`
- `shop`
- `shopDuotone`
- `shopDuotoneLine`
- `shopLight`
- `signIn`
- `signInCircle`
- `signInCircleDuotone`
- `signInCircleDuotoneLine`
- `signInCircleLight`
- `signInSqure`
- `signInSqureDuotone`
- `signInSqureDuotoneLine`
- `signInSqureFill`
- `signInSqureLight`
- `signOut`
- `signOutCircle`
- `signOutCircleDuotone`
- `signOutCircleDuotoneLine`
- `signOutCircleLight`
- `signOutSqure`
- `signOutSqureDuotone`
- `signOutSqureDuotoneLine`
- `signOutSqureFill`
- `signOutSqureLight`
- `sizeDown`
- `sizeRightUp`
- `sort`
- `sortAlfa`
- `sortAlfaLight`
- `sortArrow`
- `sortArrowLight`
- `sortDown`
- `sortDownLight`
- `sortList`
- `sortListAlt`
- `sortListAltLight`
- `sortListLight`
- `sortRandom`
- `sortRandomLight`
- `sortUp`
- `sortUpAlt`
- `sortUpLight`
- `sound`
- `soundDuotone`
- `soundFill`
- `soundLight`
- `soundMax`
- `soundMaxDuotone`
- `soundMaxFill`
- `soundMaxLight`
- `soundMin`
- `soundMinDuotone`
- `soundMinFill`
- `soundMinLight`
- `soundMute`
- `soundMuteDuotone`
- `soundMuteFill`
- `soundMuteLight`
- `speed`
- `speedAlt`
- `speedAltDuotone`
- `speedAltDuotoneLine`
- `speedAltLight`
- `speedDuotoneLine`
- `speedFill`
- `speedFillDuotone`
- `speedLight`
- `stackframe`
- `stackframeDuotone`
- `stackframeFill`
- `stackframeLight`
- `star`
- `starDuotone`
- `starFill`
- `starLight`
- `stat`
- `status`
- `statusList`
- `stethoscope`
- `stethoscopeLight`
- `stop`
- `stopAndPlay`
- `stopAndPlayDuotone`
- `stopAndPlayFill`
- `stopAndPlayLight`
- `stopDuotone`
- `stopFill`
- `stopLight`
- `storm`
- `stormDuotone`
- `stormFill`
- `stormLight`
- `structure`
- `structureLight`
- `subttasks`
- `subttasksAlt`
- `subttasksAltDuotone`
- `subttasksAltFill`
- `subttasksAltLight`
- `subttasksDuotone`
- `subttasksFill`
- `subttasksLight`
- `suitcase`
- `suitcaseLight`
- `sun`
- `sunDuotone`
- `sunFill`
- `sunLight`
- `sunlight`
- `sunlightDuotone`
- `sunlightFill`
- `sunlightLight`
- `table`
- `tableLight`
- `tableSettings`
- `tableSettingsLight`
- `tablet`
- `tabletLight`
- `target`
- `targetDuotone`
- `targetDuotoneLine`
- `targetFill`
- `targetLight`
- `temperature`
- `temperatureDuotone`
- `temperatureFill`
- `temperatureLight`
- `terminal`
- `terminalLight`
- `text`
- `thumbDown`
- `thumbUp`
- `ticket`
- `ticketAlt`
- `ticketAltDuotone`
- `ticketAltDuotoneLine`
- `ticketAltFill`
- `ticketAltLight`
- `ticketDuotone`
- `ticketDuotoneLine`
- `ticketFill`
- `ticketLight`
- `ticketUse`
- `ticketUseDuotone`
- `ticketUseDuotoneLine`
- `ticketUseFill`
- `ticketUseLight`
- `tie`
- `tieLight`
- `time`
- `timeAtack`
- `timeAtackDuotone`
- `timeAtackDuotoneLine`
- `timeAtackFill`
- `timeAtackLight`
- `timeDelLight`
- `timeDuotone`
- `timeDuotoneLine`
- `timeFill`
- `timeLight`
- `timeProgress`
- `timeProgressDuotone`
- `timeProgressDuotoneLine`
- `timeProgressFill`
- `timeProgressLight`
- `timeSleepLight`
- `tooth`
- `toothLight`
- `transferDown`
- `transferDownLight`
- `transferLeft`
- `transferLeftLight`
- `transferLongDown`
- `transferLongDownLight`
- `transferLongLeft`
- `transferLongLeftLight`
- `transferLongRight`
- `transferLongRightLight`
- `transferLongTop`
- `transferLongTopLight`
- `transferRight`
- `transferRightLight`
- `transferTop`
- `transferTopLight`
- `transger`
- `transgerLight`
- `trash`
- `trashDuotone`
- `trashDuotoneLine`
- `trashLight`
- `tree`
- `treeDuotone`
- `treeDuotoneLine`
- `treeFill`
- `trophy`
- `trophyLight`
- `tumer`
- `tumerDuotone`
- `tumerDuotoneLine`
- `tumerFill`
- `tumerLight`
- `turbineLight`
- `unlock`
- `unlockDuotone`
- `unlockDuotoneLine`
- `unlockFill`
- `unlockLight`
- `up`
- `upLight`
- `upload`
- `uploadDuotone`
- `uploadDuotoneLine`
- `uploadFill`
- `uploadLight`
- `user`
- `userAdd`
- `userAddAlt`
- `userAddAltDuotone`
- `userAddAltDuotoneLine`
- `userAddAltFill`
- `userAddAltLight`
- `userAddDuotone`
- `userAddDuotoneLine`
- `userAddLight`
- `userAlt`
- `userAltDuotone`
- `userAltDuotoneLine`
- `userAltFill`
- `userAltLight`
- `userBox`
- `userBoxDuotone`
- `userBoxDuotoneLine`
- `userBoxFill`
- `userBoxLight`
- `userCicrle`
- `userCicrleDuotone`
- `userCicrleDuotoneLine`
- `userCicrleLight`
- `userCircle`
- `userDuotone`
- `userDuotoneLine`
- `userFill`
- `userFillAdd`
- `userLight`
- `userScan`
- `userScanDuotone`
- `userScanDuotoneLine`
- `userScanFill`
- `userScanLight`
- `verticalSwitch`
- `verticalSwitchAlt`
- `verticalSwitchAltLight`
- `verticalSwitchLight`
- `verticalSwitchLong`
- `verticalSwitchLongLight`
- `video`
- `videoDuotone`
- `videoFile`
- `videoFileDuotone`
- `videoFileDuotoneLine`
- `videoFileFill`
- `videoFileLight`
- `videoFill`
- `videoLight`
- `view`
- `viewAlt`
- `viewAltDuotone`
- `viewAltDuotoneLine`
- `viewAltFill`
- `viewAltLight`
- `viewDuotone`
- `viewDuotoneLine`
- `viewFill`
- `viewHide`
- `viewHideDuotone`
- `viewHideDuotoneLine`
- `viewHideFill`
- `viewHideLight`
- `viewHorizont`
- `viewHorizontDuotone`
- `viewHorizontDuotoneLine`
- `viewHorizontFill`
- `viewLight`
- `wallet`
- `walletAlt`
- `walletAltDuotone`
- `walletAltDuotoneLine`
- `walletAltFill`
- `walletAltLight`
- `walletDuotone`
- `walletDuotoneLine`
- `walletFill`
- `walletLight`
- `watch`
- `watchAlt`
- `watchAltLight`
- `watchLight`
- `water`
- `waterLight`
- `waterfall`
- `waterfallLight`
- `widget`
- `widgetAdd`
- `widgetAddLight`
- `widgetAlt`
- `widgetAltLight`
- `widgetLight`
- `winter`
- `winterDuotone`
- `winterFill`
- `winterLight`
- `world`
- `world2`
- `world2Light`
- `worldAlt`
- `worldAltDuotone`
- `worldAltDuotoneLine`
- `worldAltFill`
- `worldAltLight`
- `worldDuotone`
- `worldDuotoneLine`
- `worldFill`
- `worldLight`
- `wow`
- `wowLight`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><10Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><10LightIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dBoxIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dBoxDuotoneIcon size="20" class="nav-icon" /> Settings</a>
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
<10Icon
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
    <10Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <10LightIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dBoxIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <10Icon size="24" />
   <10LightIcon size="24" color="#4a90e2" />
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
   <10Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <10Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <10Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 10 } from '@stacksjs/iconify-lets-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(10, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 10 } from '@stacksjs/iconify-lets-icons'

// Icons are typed as IconData
const myIcon: IconData = 10
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Leonid Tsvetkov ([Website](https://www.figma.com/community/file/886554014393250663))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lets-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lets-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
