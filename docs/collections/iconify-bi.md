# Bootstrap Icons

> Bootstrap Icons icons for stx from Iconify

## Overview

This package provides access to 2084 icons from the Bootstrap Icons collection through the stx iconify integration.

**Collection ID:** `bi`
**Total Icons:** 2084
**Author:** The Bootstrap Authors ([Website](https://github.com/twbs/icons))
**License:** MIT ([Details](https://github.com/twbs/icons/blob/main/LICENSE.md))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bi
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<123Icon height="1em" />
<123Icon width="1em" height="1em" />
<123Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<123Icon size="24" />
<123Icon size="1em" />

<!-- Using width and height -->
<123Icon width="24" height="32" />

<!-- With color -->
<123Icon size="24" color="red" />
<123Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<123Icon size="24" class="icon-primary" />

<!-- With all properties -->
<123Icon
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
    <123Icon size="24" />
    <0CircleIcon size="24" color="#4a90e2" />
    <0CircleFillIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 123, 0Circle, 0CircleFill } from '@stacksjs/iconify-bi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(123, { size: 24 })
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
<123Icon size="24" color="red" />
<123Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<123Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<123Icon size="24" class="text-primary" />
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
<123Icon height="1em" />
<123Icon width="1em" height="1em" />
<123Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<123Icon size="24" />
<123Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.bi-icon {
  width: 1em;
  height: 1em;
}
```

```html
<123Icon class="bi-icon" />
```

## Available Icons

This package contains **2084** icons:

- `123`
- `0Circle`
- `0CircleFill`
- `0Square`
- `0SquareFill`
- `1Circle`
- `1CircleFill`
- `1Square`
- `1SquareFill`
- `2Circle`
- `2CircleFill`
- `2Square`
- `2SquareFill`
- `3Circle`
- `3CircleFill`
- `3Square`
- `3SquareFill`
- `4Circle`
- `4CircleFill`
- `4Square`
- `4SquareFill`
- `5Circle`
- `5CircleFill`
- `5Square`
- `5SquareFill`
- `6Circle`
- `6CircleFill`
- `6Square`
- `6SquareFill`
- `7Circle`
- `7CircleFill`
- `7Square`
- `7SquareFill`
- `8Circle`
- `8CircleFill`
- `8Square`
- `8SquareFill`
- `9Circle`
- `9CircleFill`
- `9Square`
- `9SquareFill`
- `activity`
- `airplane`
- `airplaneEngines`
- `airplaneEnginesFill`
- `airplaneFill`
- `alarm`
- `alarmFill`
- `alexa`
- `alignBottom`
- `alignCenter`
- `alignEnd`
- `alignMiddle`
- `alignStart`
- `alignTop`
- `alipay`
- `alphabet`
- `alphabetUppercase`
- `alt`
- `amazon`
- `amd`
- `android`
- `android2`
- `anthropic`
- `app`
- `appIndicator`
- `apple`
- `appleMusic`
- `archive`
- `archiveFill`
- `arrow90degDown`
- `arrow90degLeft`
- `arrow90degRight`
- `arrow90degUp`
- `arrowBarDown`
- `arrowBarLeft`
- `arrowBarRight`
- `arrowBarUp`
- `arrowClockwise`
- `arrowCounterclockwise`
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
- `arrowDownShort`
- `arrowDownSquare`
- `arrowDownSquareFill`
- `arrowDownUp`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleFill`
- `arrowLeftRight`
- `arrowLeftShort`
- `arrowLeftSquare`
- `arrowLeftSquareFill`
- `arrowRepeat`
- `arrowReturnLeft`
- `arrowReturnRight`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightCircleFill`
- `arrowRightShort`
- `arrowRightSquare`
- `arrowRightSquareFill`
- `arrowThroughHeart`
- `arrowThroughHeartFill`
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
- `arrowUpShort`
- `arrowUpSquare`
- `arrowUpSquareFill`
- `arrows`
- `arrowsAngleContract`
- `arrowsAngleExpand`
- `arrowsCollapse`
- `arrowsCollapseVertical`
- `arrowsExpand`
- `arrowsExpandVertical`
- `arrowsFullscreen`
- `arrowsMove`
- `arrowsVertical`
- `aspectRatio`
- `aspectRatioFill`
- `asterisk`
- `at`
- `award`
- `awardFill`
- `back`
- `backpack`
- `backpackFill`
- `backpack2`
- `backpack2Fill`
- `backpack3`
- `backpack3Fill`
- `backpack4`
- `backpack4Fill`
- `backspace`
- `backspaceFill`
- `backspaceReverse`
- `backspaceReverseFill`
- `badge3d`
- `badge3dFill`
- `badge4k`
- `badge4kFill`
- `badge8k`
- `badge8kFill`
- `badgeAd`
- `badgeAdFill`
- `badgeAr`
- `badgeArFill`
- `badgeCc`
- `badgeCcFill`
- `badgeHd`
- `badgeHdFill`
- `badgeSd`
- `badgeSdFill`
- `badgeTm`
- `badgeTmFill`
- `badgeVo`
- `badgeVoFill`
- `badgeVr`
- `badgeVrFill`
- `badgeWc`
- `badgeWcFill`
- `bag`
- `bagCheck`
- `bagCheckFill`
- `bagDash`
- `bagDashFill`
- `bagFill`
- `bagHeart`
- `bagHeartFill`
- `bagPlus`
- `bagPlusFill`
- `bagX`
- `bagXFill`
- `balloon`
- `balloonFill`
- `balloonHeart`
- `balloonHeartFill`
- `ban`
- `banFill`
- `bandaid`
- `bandaidFill`
- `bank`
- `bank2`
- `barChart`
- `barChartFill`
- `barChartLine`
- `barChartLineFill`
- `barChartSteps`
- `basket`
- `basketFill`
- `basket2`
- `basket2Fill`
- `basket3`
- `basket3Fill`
- `battery`
- `batteryCharging`
- `batteryFull`
- `batteryHalf`
- `batteryLow`
- `beaker`
- `beakerFill`
- `behance`
- `bell`
- `bellFill`
- `bellSlash`
- `bellSlashFill`
- `bezier`
- `bezier2`
- `bicycle`
- `bing`
- `binoculars`
- `binocularsFill`
- `blockquoteLeft`
- `blockquoteRight`
- `bluesky`
- `bluetooth`
- `bodyText`
- `book`
- `bookFill`
- `bookHalf`
- `bookmark`
- `bookmarkCheck`
- `bookmarkCheckFill`
- `bookmarkDash`
- `bookmarkDashFill`
- `bookmarkFill`
- `bookmarkHeart`
- `bookmarkHeartFill`
- `bookmarkPlus`
- `bookmarkPlusFill`
- `bookmarkStar`
- `bookmarkStarFill`
- `bookmarkX`
- `bookmarkXFill`
- `bookmarks`
- `bookmarksFill`
- `bookshelf`
- `boombox`
- `boomboxFill`
- `bootstrap`
- `bootstrapFill`
- `bootstrapReboot`
- `border`
- `borderAll`
- `borderBottom`
- `borderCenter`
- `borderInner`
- `borderLeft`
- `borderMiddle`
- `borderOuter`
- `borderRight`
- `borderStyle`
- `borderTop`
- `borderWidth`
- `boundingBox`
- `boundingBoxCircles`
- `box`
- `boxArrowDown`
- `boxArrowDownLeft`
- `boxArrowDownRight`
- `boxArrowInDown`
- `boxArrowInDownLeft`
- `boxArrowInDownRight`
- `boxArrowInLeft`
- `boxArrowInRight`
- `boxArrowInUp`
- `boxArrowInUpLeft`
- `boxArrowInUpRight`
- `boxArrowLeft`
- `boxArrowRight`
- `boxArrowUp`
- `boxArrowUpLeft`
- `boxArrowUpRight`
- `boxFill`
- `boxSeam`
- `boxSeamFill`
- `box2`
- `box2Fill`
- `box2Heart`
- `box2HeartFill`
- `boxes`
- `braces`
- `bracesAsterisk`
- `bricks`
- `briefcase`
- `briefcaseFill`
- `brightnessAltHigh`
- `brightnessAltHighFill`
- `brightnessAltLow`
- `brightnessAltLowFill`
- `brightnessHigh`
- `brightnessHighFill`
- `brightnessLow`
- `brightnessLowFill`
- `brilliance`
- `broadcast`
- `broadcastPin`
- `browserChrome`
- `browserEdge`
- `browserFirefox`
- `browserSafari`
- `brush`
- `brushFill`
- `bucket`
- `bucketFill`
- `bug`
- `bugFill`
- `building`
- `buildingAdd`
- `buildingCheck`
- `buildingDash`
- `buildingDown`
- `buildingExclamation`
- `buildingFill`
- `buildingFillAdd`
- `buildingFillCheck`
- `buildingFillDash`
- `buildingFillDown`
- `buildingFillExclamation`
- `buildingFillGear`
- `buildingFillLock`
- `buildingFillSlash`
- `buildingFillUp`
- `buildingFillX`
- `buildingGear`
- `buildingLock`
- `buildingSlash`
- `buildingUp`
- `buildingX`
- `buildings`
- `buildingsFill`
- `bullseye`
- `busFront`
- `busFrontFill`
- `cCircle`
- `cCircleFill`
- `cSquare`
- `cSquareFill`
- `cake`
- `cakeFill`
- `cake2`
- `cake2Fill`
- `calculator`
- `calculatorFill`
- `calendar`
- `calendarCheck`
- `calendarCheckFill`
- `calendarDate`
- `calendarDateFill`
- `calendarDay`
- `calendarDayFill`
- `calendarEvent`
- `calendarEventFill`
- `calendarFill`
- `calendarHeart`
- `calendarHeartFill`
- `calendarMinus`
- `calendarMinusFill`
- `calendarMonth`
- `calendarMonthFill`
- `calendarPlus`
- `calendarPlusFill`
- `calendarRange`
- `calendarRangeFill`
- `calendarWeek`
- `calendarWeekFill`
- `calendarX`
- `calendarXFill`
- `calendar2`
- `calendar2Check`
- `calendar2CheckFill`
- `calendar2Date`
- `calendar2DateFill`
- `calendar2Day`
- `calendar2DayFill`
- `calendar2Event`
- `calendar2EventFill`
- `calendar2Fill`
- `calendar2Heart`
- `calendar2HeartFill`
- `calendar2Minus`
- `calendar2MinusFill`
- `calendar2Month`
- `calendar2MonthFill`
- `calendar2Plus`
- `calendar2PlusFill`
- `calendar2Range`
- `calendar2RangeFill`
- `calendar2Week`
- `calendar2WeekFill`
- `calendar2X`
- `calendar2XFill`
- `calendar3`
- `calendar3Event`
- `calendar3EventFill`
- `calendar3Fill`
- `calendar3Range`
- `calendar3RangeFill`
- `calendar3Week`
- `calendar3WeekFill`
- `calendar4`
- `calendar4Event`
- `calendar4Range`
- `calendar4Week`
- `camera`
- `cameraFill`
- `cameraReels`
- `cameraReelsFill`
- `cameraVideo`
- `cameraVideoFill`
- `cameraVideoOff`
- `cameraVideoOffFill`
- `camera2`
- `capslock`
- `capslockFill`
- `capsule`
- `capsulePill`
- `carFront`
- `carFrontFill`
- `cardChecklist`
- `cardHeading`
- `cardImage`
- `cardList`
- `cardText`
- `caretDown`
- `caretDownFill`
- `caretDownSquare`
- `caretDownSquareFill`
- `caretLeft`
- `caretLeftFill`
- `caretLeftSquare`
- `caretLeftSquareFill`
- `caretRight`
- `caretRightFill`
- `caretRightSquare`
- `caretRightSquareFill`
- `caretUp`
- `caretUpFill`
- `caretUpSquare`
- `caretUpSquareFill`
- `cart`
- `cartCheck`
- `cartCheckFill`
- `cartDash`
- `cartDashFill`
- `cartFill`
- `cartPlus`
- `cartPlusFill`
- `cartX`
- `cartXFill`
- `cart2`
- `cart3`
- `cart4`
- `cash`
- `cashCoin`
- `cashStack`
- `cassette`
- `cassetteFill`
- `cast`
- `ccCircle`
- `ccCircleFill`
- `ccSquare`
- `ccSquareFill`
- `chat`
- `chatDots`
- `chatDotsFill`
- `chatFill`
- `chatHeart`
- `chatHeartFill`
- `chatLeft`
- `chatLeftDots`
- `chatLeftDotsFill`
- `chatLeftFill`
- `chatLeftHeart`
- `chatLeftHeartFill`
- `chatLeftQuote`
- `chatLeftQuoteFill`
- `chatLeftText`
- `chatLeftTextFill`
- `chatQuote`
- `chatQuoteFill`
- `chatRight`
- `chatRightDots`
- `chatRightDotsFill`
- `chatRightFill`
- `chatRightHeart`
- `chatRightHeartFill`
- `chatRightQuote`
- `chatRightQuoteFill`
- `chatRightText`
- `chatRightTextFill`
- `chatSquare`
- `chatSquareDots`
- `chatSquareDotsFill`
- `chatSquareFill`
- `chatSquareHeart`
- `chatSquareHeartFill`
- `chatSquareQuote`
- `chatSquareQuoteFill`
- `chatSquareText`
- `chatSquareTextFill`
- `chatText`
- `chatTextFill`
- `check`
- `checkAll`
- `checkCircle`
- `checkCircleFill`
- `checkLg`
- `checkSquare`
- `checkSquareFill`
- `check2`
- `check2All`
- `check2Circle`
- `check2Square`
- `chevronBarContract`
- `chevronBarDown`
- `chevronBarExpand`
- `chevronBarLeft`
- `chevronBarRight`
- `chevronBarUp`
- `chevronCompactDown`
- `chevronCompactLeft`
- `chevronCompactRight`
- `chevronCompactUp`
- `chevronContract`
- `chevronDoubleDown`
- `chevronDoubleLeft`
- `chevronDoubleRight`
- `chevronDoubleUp`
- `chevronDown`
- `chevronExpand`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `circle`
- `circleFill`
- `circleHalf`
- `circleSquare`
- `claude`
- `clipboard`
- `clipboardCheck`
- `clipboardCheckFill`
- `clipboardData`
- `clipboardDataFill`
- `clipboardFill`
- `clipboardHeart`
- `clipboardHeartFill`
- `clipboardMinus`
- `clipboardMinusFill`
- `clipboardPlus`
- `clipboardPlusFill`
- `clipboardPulse`
- `clipboardX`
- `clipboardXFill`
- `clipboard2`
- `clipboard2Check`
- `clipboard2CheckFill`
- `clipboard2Data`
- `clipboard2DataFill`
- `clipboard2Fill`
- `clipboard2Heart`
- `clipboard2HeartFill`
- `clipboard2Minus`
- `clipboard2MinusFill`
- `clipboard2Plus`
- `clipboard2PlusFill`
- `clipboard2Pulse`
- `clipboard2PulseFill`
- `clipboard2X`
- `clipboard2XFill`
- `clock`
- `clockFill`
- `clockHistory`
- `cloud`
- `cloudArrowDown`
- `cloudArrowDownFill`
- `cloudArrowUp`
- `cloudArrowUpFill`
- `cloudCheck`
- `cloudCheckFill`
- `cloudDownload`
- `cloudDownloadFill`
- `cloudDrizzle`
- `cloudDrizzleFill`
- `cloudFill`
- `cloudFog`
- `cloudFogFill`
- `cloudFog2`
- `cloudFog2Fill`
- `cloudHail`
- `cloudHailFill`
- `cloudHaze`
- `cloudHazeFill`
- `cloudHaze2`
- `cloudHaze2Fill`
- `cloudLightning`
- `cloudLightningFill`
- `cloudLightningRain`
- `cloudLightningRainFill`
- `cloudMinus`
- `cloudMinusFill`
- `cloudMoon`
- `cloudMoonFill`
- `cloudPlus`
- `cloudPlusFill`
- `cloudRain`
- `cloudRainFill`
- `cloudRainHeavy`
- `cloudRainHeavyFill`
- `cloudSlash`
- `cloudSlashFill`
- `cloudSleet`
- `cloudSleetFill`
- `cloudSnow`
- `cloudSnowFill`
- `cloudSun`
- `cloudSunFill`
- `cloudUpload`
- `cloudUploadFill`
- `clouds`
- `cloudsFill`
- `cloudy`
- `cloudyFill`
- `code`
- `codeSlash`
- `codeSquare`
- `coin`
- `collection`
- `collectionFill`
- `collectionPlay`
- `collectionPlayFill`
- `columns`
- `columnsGap`
- `command`
- `compass`
- `compassFill`
- `cone`
- `coneStriped`
- `controller`
- `cookie`
- `copy`
- `cpu`
- `cpuFill`
- `creditCard`
- `creditCard2Back`
- `creditCard2BackFill`
- `creditCard2Front`
- `creditCard2FrontFill`
- `creditCardFill`
- `crop`
- `crosshair`
- `crosshair2`
- `css`
- `cup`
- `cupFill`
- `cupHot`
- `cupHotFill`
- `cupStraw`
- `currencyBitcoin`
- `currencyDollar`
- `currencyEuro`
- `currencyExchange`
- `currencyPound`
- `currencyRupee`
- `currencyYen`
- `cursor`
- `cursorFill`
- `cursorText`
- `dash`
- `dashCircle`
- `dashCircleDotted`
- `dashCircleFill`
- `dashLg`
- `dashSquare`
- `dashSquareDotted`
- `dashSquareFill`
- `database`
- `databaseAdd`
- `databaseCheck`
- `databaseDash`
- `databaseDown`
- `databaseExclamation`
- `databaseFill`
- `databaseFillAdd`
- `databaseFillCheck`
- `databaseFillDash`
- `databaseFillDown`
- `databaseFillExclamation`
- `databaseFillGear`
- `databaseFillLock`
- `databaseFillSlash`
- `databaseFillUp`
- `databaseFillX`
- `databaseGear`
- `databaseLock`
- `databaseSlash`
- `databaseUp`
- `databaseX`
- `deviceHdd`
- `deviceHddFill`
- `deviceSsd`
- `deviceSsdFill`
- `diagram2`
- `diagram2Fill`
- `diagram3`
- `diagram3Fill`
- `diamond`
- `diamondFill`
- `diamondHalf`
- `dice1`
- `dice1Fill`
- `dice2`
- `dice2Fill`
- `dice3`
- `dice3Fill`
- `dice4`
- `dice4Fill`
- `dice5`
- `dice5Fill`
- `dice6`
- `dice6Fill`
- `disc`
- `discFill`
- `discord`
- `display`
- `displayFill`
- `displayport`
- `displayportFill`
- `distributeHorizontal`
- `distributeVertical`
- `doorClosed`
- `doorClosedFill`
- `doorOpen`
- `doorOpenFill`
- `dot`
- `download`
- `dpad`
- `dpadFill`
- `dribbble`
- `dropbox`
- `droplet`
- `dropletFill`
- `dropletHalf`
- `duffle`
- `duffleFill`
- `ear`
- `earFill`
- `earbuds`
- `easel`
- `easelFill`
- `easel2`
- `easel2Fill`
- `easel3`
- `easel3Fill`
- `egg`
- `eggFill`
- `eggFried`
- `eject`
- `ejectFill`
- `emojiAngry`
- `emojiAngryFill`
- `emojiAstonished`
- `emojiAstonishedFill`
- `emojiDizzy`
- `emojiDizzyFill`
- `emojiExpressionless`
- `emojiExpressionlessFill`
- `emojiFrown`
- `emojiFrownFill`
- `emojiGrimace`
- `emojiGrimaceFill`
- `emojiGrin`
- `emojiGrinFill`
- `emojiHeartEyes`
- `emojiHeartEyesFill`
- `emojiKiss`
- `emojiKissFill`
- `emojiLaughing`
- `emojiLaughingFill`
- `emojiNeutral`
- `emojiNeutralFill`
- `emojiSmile`
- `emojiSmileFill`
- `emojiSmileUpsideDown`
- `emojiSmileUpsideDownFill`
- `emojiSunglasses`
- `emojiSunglassesFill`
- `emojiSurprise`
- `emojiSurpriseFill`
- `emojiTear`
- `emojiTearFill`
- `emojiWink`
- `emojiWinkFill`
- `envelope`
- `envelopeArrowDown`
- `envelopeArrowDownFill`
- `envelopeArrowUp`
- `envelopeArrowUpFill`
- `envelopeAt`
- `envelopeAtFill`
- `envelopeCheck`
- `envelopeCheckFill`
- `envelopeDash`
- `envelopeDashFill`
- `envelopeExclamation`
- `envelopeExclamationFill`
- `envelopeFill`
- `envelopeHeart`
- `envelopeHeartFill`
- `envelopeOpen`
- `envelopeOpenFill`
- `envelopeOpenHeart`
- `envelopeOpenHeartFill`
- `envelopePaper`
- `envelopePaperFill`
- `envelopePaperHeart`
- `envelopePaperHeartFill`
- `envelopePlus`
- `envelopePlusFill`
- `envelopeSlash`
- `envelopeSlashFill`
- `envelopeX`
- `envelopeXFill`
- `eraser`
- `eraserFill`
- `escape`
- `ethernet`
- `evFront`
- `evFrontFill`
- `evStation`
- `evStationFill`
- `exclamation`
- `exclamationCircle`
- `exclamationCircleFill`
- `exclamationDiamond`
- `exclamationDiamondFill`
- `exclamationLg`
- `exclamationOctagon`
- `exclamationOctagonFill`
- `exclamationSquare`
- `exclamationSquareFill`
- `exclamationTriangle`
- `exclamationTriangleFill`
- `exclude`
- `explicit`
- `explicitFill`
- `exposure`
- `eye`
- `eyeFill`
- `eyeSlash`
- `eyeSlashFill`
- `eyedropper`
- `eyeglasses`
- `facebook`
- `fan`
- `fastForward`
- `fastForwardBtn`
- `fastForwardBtnFill`
- `fastForwardCircle`
- `fastForwardCircleFill`
- `fastForwardFill`
- `feather`
- `feather2`
- `file`
- `fileArrowDown`
- `fileArrowDownFill`
- `fileArrowUp`
- `fileArrowUpFill`
- `fileBarGraph`
- `fileBarGraphFill`
- `fileBinary`
- `fileBinaryFill`
- `fileBreak`
- `fileBreakFill`
- `fileCheck`
- `fileCheckFill`
- `fileCode`
- `fileCodeFill`
- `fileDiff`
- `fileDiffFill`
- `fileEarmark`
- `fileEarmarkArrowDown`
- `fileEarmarkArrowDownFill`
- `fileEarmarkArrowUp`
- `fileEarmarkArrowUpFill`
- `fileEarmarkBarGraph`
- `fileEarmarkBarGraphFill`
- `fileEarmarkBinary`
- `fileEarmarkBinaryFill`
- `fileEarmarkBreak`
- `fileEarmarkBreakFill`
- `fileEarmarkCheck`
- `fileEarmarkCheckFill`
- `fileEarmarkCode`
- `fileEarmarkCodeFill`
- `fileEarmarkDiff`
- `fileEarmarkDiffFill`
- `fileEarmarkEasel`
- `fileEarmarkEaselFill`
- `fileEarmarkExcel`
- `fileEarmarkExcelFill`
- `fileEarmarkFill`
- `fileEarmarkFont`
- `fileEarmarkFontFill`
- `fileEarmarkImage`
- `fileEarmarkImageFill`
- `fileEarmarkLock`
- `fileEarmarkLockFill`
- `fileEarmarkLock2`
- `fileEarmarkLock2Fill`
- `fileEarmarkMedical`
- `fileEarmarkMedicalFill`
- `fileEarmarkMinus`
- `fileEarmarkMinusFill`
- `fileEarmarkMusic`
- `fileEarmarkMusicFill`
- `fileEarmarkPdf`
- `fileEarmarkPdfFill`
- `fileEarmarkPerson`
- `fileEarmarkPersonFill`
- `fileEarmarkPlay`
- `fileEarmarkPlayFill`
- `fileEarmarkPlus`
- `fileEarmarkPlusFill`
- `fileEarmarkPost`
- `fileEarmarkPostFill`
- `fileEarmarkPpt`
- `fileEarmarkPptFill`
- `fileEarmarkRichtext`
- `fileEarmarkRichtextFill`
- `fileEarmarkRuled`
- `fileEarmarkRuledFill`
- `fileEarmarkSlides`
- `fileEarmarkSlidesFill`
- `fileEarmarkSpreadsheet`
- `fileEarmarkSpreadsheetFill`
- `fileEarmarkText`
- `fileEarmarkTextFill`
- `fileEarmarkWord`
- `fileEarmarkWordFill`
- `fileEarmarkX`
- `fileEarmarkXFill`
- `fileEarmarkZip`
- `fileEarmarkZipFill`
- `fileEasel`
- `fileEaselFill`
- `fileExcel`
- `fileExcelFill`
- `fileFill`
- `fileFont`
- `fileFontFill`
- `fileImage`
- `fileImageFill`
- `fileLock`
- `fileLockFill`
- `fileLock2`
- `fileLock2Fill`
- `fileMedical`
- `fileMedicalFill`
- `fileMinus`
- `fileMinusFill`
- `fileMusic`
- `fileMusicFill`
- `filePdf`
- `filePdfFill`
- `filePerson`
- `filePersonFill`
- `filePlay`
- `filePlayFill`
- `filePlus`
- `filePlusFill`
- `filePost`
- `filePostFill`
- `filePpt`
- `filePptFill`
- `fileRichtext`
- `fileRichtextFill`
- `fileRuled`
- `fileRuledFill`
- `fileSlides`
- `fileSlidesFill`
- `fileSpreadsheet`
- `fileSpreadsheetFill`
- `fileText`
- `fileTextFill`
- `fileWord`
- `fileWordFill`
- `fileX`
- `fileXFill`
- `fileZip`
- `fileZipFill`
- `files`
- `filesAlt`
- `filetypeAac`
- `filetypeAi`
- `filetypeBmp`
- `filetypeCs`
- `filetypeCss`
- `filetypeCsv`
- `filetypeDoc`
- `filetypeDocx`
- `filetypeExe`
- `filetypeGif`
- `filetypeHeic`
- `filetypeHtml`
- `filetypeJava`
- `filetypeJpg`
- `filetypeJs`
- `filetypeJson`
- `filetypeJsx`
- `filetypeKey`
- `filetypeM4p`
- `filetypeMd`
- `filetypeMdx`
- `filetypeMov`
- `filetypeMp3`
- `filetypeMp4`
- `filetypeOtf`
- `filetypePdf`
- `filetypePhp`
- `filetypePng`
- `filetypePpt`
- `filetypePptx`
- `filetypePsd`
- `filetypePy`
- `filetypeRaw`
- `filetypeRb`
- `filetypeSass`
- `filetypeScss`
- `filetypeSh`
- `filetypeSql`
- `filetypeSvg`
- `filetypeTiff`
- `filetypeTsx`
- `filetypeTtf`
- `filetypeTxt`
- `filetypeWav`
- `filetypeWoff`
- `filetypeXls`
- `filetypeXlsx`
- `filetypeXml`
- `filetypeYml`
- `film`
- `filter`
- `filterCircle`
- `filterCircleFill`
- `filterLeft`
- `filterRight`
- `filterSquare`
- `filterSquareFill`
- `fingerprint`
- `fire`
- `flag`
- `flagFill`
- `flask`
- `flaskFill`
- `flaskFlorence`
- `flaskFlorenceFill`
- `floppy`
- `floppyFill`
- `floppy2`
- `floppy2Fill`
- `flower1`
- `flower2`
- `flower3`
- `folder`
- `folderCheck`
- `folderFill`
- `folderMinus`
- `folderPlus`
- `folderSymlink`
- `folderSymlinkFill`
- `folderX`
- `folder2`
- `folder2Open`
- `fonts`
- `forkKnife`
- `forward`
- `forwardFill`
- `front`
- `fuelPump`
- `fuelPumpDiesel`
- `fuelPumpDieselFill`
- `fuelPumpFill`
- `fullscreen`
- `fullscreenExit`
- `funnel`
- `funnelFill`
- `gear`
- `gearFill`
- `gearWide`
- `gearWideConnected`
- `gem`
- `genderAmbiguous`
- `genderFemale`
- `genderMale`
- `genderNeuter`
- `genderTrans`
- `geo`
- `geoAlt`
- `geoAltFill`
- `geoFill`
- `gift`
- `giftFill`
- `git`
- `github`
- `gitlab`
- `globe`
- `globeAmericas`
- `globeAmericasFill`
- `globeAsiaAustralia`
- `globeAsiaAustraliaFill`
- `globeCentralSouthAsia`
- `globeCentralSouthAsiaFill`
- `globeEuropeAfrica`
- `globeEuropeAfricaFill`
- `globe2`
- `google`
- `googlePlay`
- `gpuCard`
- `graphDown`
- `graphDownArrow`
- `graphUp`
- `graphUpArrow`
- `grid`
- `grid1x2`
- `grid1x2Fill`
- `grid3x2`
- `grid3x2Gap`
- `grid3x2GapFill`
- `grid3x3`
- `grid3x3Gap`
- `grid3x3GapFill`
- `gridFill`
- `gripHorizontal`
- `gripVertical`
- `hCircle`
- `hCircleFill`
- `hSquare`
- `hSquareFill`
- `hammer`
- `handIndex`
- `handIndexFill`
- `handIndexThumb`
- `handIndexThumbFill`
- `handThumbsDown`
- `handThumbsDownFill`
- `handThumbsUp`
- `handThumbsUpFill`
- `handbag`
- `handbagFill`
- `hash`
- `hdd`
- `hddFill`
- `hddNetwork`
- `hddNetworkFill`
- `hddRack`
- `hddRackFill`
- `hddStack`
- `hddStackFill`
- `hdmi`
- `hdmiFill`
- `headphones`
- `headset`
- `headsetVr`
- `heart`
- `heartArrow`
- `heartFill`
- `heartHalf`
- `heartPulse`
- `heartPulseFill`
- `heartbreak`
- `heartbreakFill`
- `hearts`
- `heptagon`
- `heptagonFill`
- `heptagonHalf`
- `hexagon`
- `hexagonFill`
- `hexagonHalf`
- `highlighter`
- `highlights`
- `hospital`
- `hospitalFill`
- `hourglass`
- `hourglassBottom`
- `hourglassSplit`
- `hourglassTop`
- `house`
- `houseAdd`
- `houseAddFill`
- `houseCheck`
- `houseCheckFill`
- `houseDash`
- `houseDashFill`
- `houseDoor`
- `houseDoorFill`
- `houseDown`
- `houseDownFill`
- `houseExclamation`
- `houseExclamationFill`
- `houseFill`
- `houseGear`
- `houseGearFill`
- `houseHeart`
- `houseHeartFill`
- `houseLock`
- `houseLockFill`
- `houseSlash`
- `houseSlashFill`
- `houseUp`
- `houseUpFill`
- `houseX`
- `houseXFill`
- `houses`
- `housesFill`
- `hr`
- `hurricane`
- `hypnotize`
- `image`
- `imageAlt`
- `imageFill`
- `images`
- `inbox`
- `inboxFill`
- `inboxes`
- `inboxesFill`
- `incognito`
- `indent`
- `infinity`
- `info`
- `infoCircle`
- `infoCircleFill`
- `infoLg`
- `infoSquare`
- `infoSquareFill`
- `inputCursor`
- `inputCursorText`
- `instagram`
- `intersect`
- `javascript`
- `journal`
- `journalAlbum`
- `journalArrowDown`
- `journalArrowUp`
- `journalBookmark`
- `journalBookmarkFill`
- `journalCheck`
- `journalCode`
- `journalMedical`
- `journalMinus`
- `journalPlus`
- `journalRichtext`
- `journalText`
- `journalX`
- `journals`
- `joystick`
- `justify`
- `justifyLeft`
- `justifyRight`
- `kanban`
- `kanbanFill`
- `key`
- `keyFill`
- `keyboard`
- `keyboardFill`
- `ladder`
- `lamp`
- `lampFill`
- `laptop`
- `laptopFill`
- `layerBackward`
- `layerForward`
- `layers`
- `layersFill`
- `layersHalf`
- `layoutSidebar`
- `layoutSidebarInset`
- `layoutSidebarInsetReverse`
- `layoutSidebarReverse`
- `layoutSplit`
- `layoutTextSidebar`
- `layoutTextSidebarReverse`
- `layoutTextWindow`
- `layoutTextWindowReverse`
- `layoutThreeColumns`
- `layoutWtf`
- `leaf`
- `leafFill`
- `lifePreserver`
- `lightbulb`
- `lightbulbFill`
- `lightbulbOff`
- `lightbulbOffFill`
- `lightning`
- `lightningCharge`
- `lightningChargeFill`
- `lightningFill`
- `line`
- `link`
- `link45deg`
- `linkedin`
- `list`
- `listCheck`
- `listColumns`
- `listColumnsReverse`
- `listNested`
- `listOl`
- `listStars`
- `listTask`
- `listUl`
- `lock`
- `lockFill`
- `luggage`
- `luggageFill`
- `lungs`
- `lungsFill`
- `magic`
- `magnet`
- `magnetFill`
- `mailbox`
- `mailboxFlag`
- `mailbox2`
- `mailbox2Flag`
- `map`
- `mapFill`
- `markdown`
- `markdownFill`
- `markerTip`
- `mask`
- `mastodon`
- `measuringCup`
- `measuringCupFill`
- `medium`
- `megaphone`
- `megaphoneFill`
- `memory`
- `menuApp`
- `menuAppFill`
- `menuButton`
- `menuButtonFill`
- `menuButtonWide`
- `menuButtonWideFill`
- `menuDown`
- `menuUp`
- `messenger`
- `meta`
- `mic`
- `micFill`
- `micMute`
- `micMuteFill`
- `microsoft`
- `microsoftTeams`
- `minecart`
- `minecartLoaded`
- `modem`
- `modemFill`
- `moisture`
- `moon`
- `moonFill`
- `moonStars`
- `moonStarsFill`
- `mortarboard`
- `mortarboardFill`
- `motherboard`
- `motherboardFill`
- `mouse`
- `mouseFill`
- `mouse2`
- `mouse2Fill`
- `mouse3`
- `mouse3Fill`
- `musicNote`
- `musicNoteBeamed`
- `musicNoteList`
- `musicPlayer`
- `musicPlayerFill`
- `newspaper`
- `nintendoSwitch`
- `nodeMinus`
- `nodeMinusFill`
- `nodePlus`
- `nodePlusFill`
- `noiseReduction`
- `nut`
- `nutFill`
- `nvidia`
- `nvme`
- `nvmeFill`
- `octagon`
- `octagonFill`
- `octagonHalf`
- `openai`
- `opencollective`
- `opticalAudio`
- `opticalAudioFill`
- `option`
- `outlet`
- `pCircle`
- `pCircleFill`
- `pSquare`
- `pSquareFill`
- `paintBucket`
- `palette`
- `paletteFill`
- `palette2`
- `paperclip`
- `paragraph`
- `pass`
- `passFill`
- `passport`
- `passportFill`
- `patchCheck`
- `patchCheckFill`
- `patchCheckFll`
- `patchExclamation`
- `patchExclamationFill`
- `patchExclamationFll`
- `patchMinus`
- `patchMinusFill`
- `patchMinusFll`
- `patchPlus`
- `patchPlusFill`
- `patchPlusFll`
- `patchQuestion`
- `patchQuestionFill`
- `patchQuestionFll`
- `pause`
- `pauseBtn`
- `pauseBtnFill`
- `pauseCircle`
- `pauseCircleFill`
- `pauseFill`
- `paypal`
- `pc`
- `pcDisplay`
- `pcDisplayHorizontal`
- `pcHorizontal`
- `pciCard`
- `pciCardNetwork`
- `pciCardSound`
- `peace`
- `peaceFill`
- `pen`
- `penFill`
- `pencil`
- `pencilFill`
- `pencilSquare`
- `pentagon`
- `pentagonFill`
- `pentagonHalf`
- `people`
- `peopleFill`
- `percent`
- `perplexity`
- `person`
- `personAdd`
- `personArmsUp`
- `personBadge`
- `personBadgeFill`
- `personBoundingBox`
- `personCheck`
- `personCheckFill`
- `personCircle`
- `personDash`
- `personDashFill`
- `personDown`
- `personExclamation`
- `personFill`
- `personFillAdd`
- `personFillCheck`
- `personFillDash`
- `personFillDown`
- `personFillExclamation`
- `personFillGear`
- `personFillLock`
- `personFillSlash`
- `personFillUp`
- `personFillX`
- `personGear`
- `personHeart`
- `personHearts`
- `personLinesFill`
- `personLock`
- `personPlus`
- `personPlusFill`
- `personRaisedHand`
- `personRolodex`
- `personSlash`
- `personSquare`
- `personStanding`
- `personStandingDress`
- `personUp`
- `personVcard`
- `personVcardFill`
- `personVideo`
- `personVideo2`
- `personVideo3`
- `personWalking`
- `personWheelchair`
- `personWorkspace`
- `personX`
- `personXFill`
- `phone`
- `phoneFill`
- `phoneFlip`
- `phoneLandscape`
- `phoneLandscapeFill`
- `phoneVibrate`
- `phoneVibrateFill`
- `pieChart`
- `pieChartFill`
- `piggyBank`
- `piggyBankFill`
- `pin`
- `pinAngle`
- `pinAngleFill`
- `pinFill`
- `pinMap`
- `pinMapFill`
- `pinterest`
- `pip`
- `pipFill`
- `play`
- `playBtn`
- `playBtnFill`
- `playCircle`
- `playCircleFill`
- `playFill`
- `playstation`
- `plug`
- `plugFill`
- `plugin`
- `plus`
- `plusCircle`
- `plusCircleDotted`
- `plusCircleFill`
- `plusLg`
- `plusSlashMinus`
- `plusSquare`
- `plusSquareDotted`
- `plusSquareFill`
- `postage`
- `postageFill`
- `postageHeart`
- `postageHeartFill`
- `postcard`
- `postcardFill`
- `postcardHeart`
- `postcardHeartFill`
- `power`
- `prescription`
- `prescription2`
- `printer`
- `printerFill`
- `projector`
- `projectorFill`
- `puzzle`
- `puzzleFill`
- `qrCode`
- `qrCodeScan`
- `question`
- `questionCircle`
- `questionCircleFill`
- `questionDiamond`
- `questionDiamondFill`
- `questionLg`
- `questionOctagon`
- `questionOctagonFill`
- `questionSquare`
- `questionSquareFill`
- `quora`
- `quote`
- `rCircle`
- `rCircleFill`
- `rSquare`
- `rSquareFill`
- `radar`
- `radioactive`
- `rainbow`
- `receipt`
- `receiptCutoff`
- `reception0`
- `reception1`
- `reception2`
- `reception3`
- `reception4`
- `record`
- `recordBtn`
- `recordBtnFill`
- `recordCircle`
- `recordCircleFill`
- `recordFill`
- `record2`
- `record2Fill`
- `recycle`
- `reddit`
- `regex`
- `repeat`
- `repeat1`
- `reply`
- `replyAll`
- `replyAllFill`
- `replyFill`
- `rewind`
- `rewindBtn`
- `rewindBtnFill`
- `rewindCircle`
- `rewindCircleFill`
- `rewindFill`
- `robot`
- `rocket`
- `rocketFill`
- `rocketTakeoff`
- `rocketTakeoffFill`
- `router`
- `routerFill`
- `rss`
- `rssFill`
- `rulers`
- `safe`
- `safeFill`
- `safe2`
- `safe2Fill`
- `save`
- `saveFill`
- `save2`
- `save2Fill`
- `scissors`
- `scooter`
- `screwdriver`
- `sdCard`
- `sdCardFill`
- `search`
- `searchHeart`
- `searchHeartFill`
- `segmentedNav`
- `send`
- `sendArrowDown`
- `sendArrowDownFill`
- `sendArrowUp`
- `sendArrowUpFill`
- `sendCheck`
- `sendCheckFill`
- `sendDash`
- `sendDashFill`
- `sendExclamation`
- `sendExclamationFill`
- `sendFill`
- `sendPlus`
- `sendPlusFill`
- `sendSlash`
- `sendSlashFill`
- `sendX`
- `sendXFill`
- `server`
- `shadows`
- `share`
- `shareFill`
- `shield`
- `shieldCheck`
- `shieldExclamation`
- `shieldFill`
- `shieldFillCheck`
- `shieldFillExclamation`
- `shieldFillMinus`
- `shieldFillPlus`
- `shieldFillX`
- `shieldLock`
- `shieldLockFill`
- `shieldMinus`
- `shieldPlus`
- `shieldShaded`
- `shieldSlash`
- `shieldSlashFill`
- `shieldX`
- `shift`
- `shiftFill`
- `shop`
- `shopWindow`
- `shuffle`
- `signDeadEnd`
- `signDeadEndFill`
- `signDoNotEnter`
- `signDoNotEnterFill`
- `signIntersection`
- `signIntersectionFill`
- `signIntersectionSide`
- `signIntersectionSideFill`
- `signIntersectionT`
- `signIntersectionTFill`
- `signIntersectionY`
- `signIntersectionYFill`
- `signMergeLeft`
- `signMergeLeftFill`
- `signMergeRight`
- `signMergeRightFill`
- `signNoLeftTurn`
- `signNoLeftTurnFill`
- `signNoParking`
- `signNoParkingFill`
- `signNoRightTurn`
- `signNoRightTurnFill`
- `signRailroad`
- `signRailroadFill`
- `signStop`
- `signStopFill`
- `signStopLights`
- `signStopLightsFill`
- `signTurnLeft`
- `signTurnLeftFill`
- `signTurnRight`
- `signTurnRightFill`
- `signTurnSlightLeft`
- `signTurnSlightLeftFill`
- `signTurnSlightRight`
- `signTurnSlightRightFill`
- `signYield`
- `signYieldFill`
- `signal`
- `signpost`
- `signpost2`
- `signpost2Fill`
- `signpostFill`
- `signpostSplit`
- `signpostSplitFill`
- `sim`
- `simFill`
- `simSlash`
- `simSlashFill`
- `sinaWeibo`
- `skipBackward`
- `skipBackwardBtn`
- `skipBackwardBtnFill`
- `skipBackwardCircle`
- `skipBackwardCircleFill`
- `skipBackwardFill`
- `skipEnd`
- `skipEndBtn`
- `skipEndBtnFill`
- `skipEndCircle`
- `skipEndCircleFill`
- `skipEndFill`
- `skipForward`
- `skipForwardBtn`
- `skipForwardBtnFill`
- `skipForwardCircle`
- `skipForwardCircleFill`
- `skipForwardFill`
- `skipStart`
- `skipStartBtn`
- `skipStartBtnFill`
- `skipStartCircle`
- `skipStartCircleFill`
- `skipStartFill`
- `skype`
- `slack`
- `slash`
- `slashCircle`
- `slashCircleFill`
- `slashLg`
- `slashSquare`
- `slashSquareFill`
- `sliders`
- `sliders2`
- `sliders2Vertical`
- `smartwatch`
- `snapchat`
- `snow`
- `snow2`
- `snow3`
- `sortAlphaDown`
- `sortAlphaDownAlt`
- `sortAlphaUp`
- `sortAlphaUpAlt`
- `sortDown`
- `sortDownAlt`
- `sortNumericDown`
- `sortNumericDownAlt`
- `sortNumericUp`
- `sortNumericUpAlt`
- `sortUp`
- `sortUpAlt`
- `soundwave`
- `sourceforge`
- `speaker`
- `speakerFill`
- `speedometer`
- `speedometer2`
- `spellcheck`
- `spotify`
- `square`
- `squareFill`
- `squareHalf`
- `stack`
- `stackOverflow`
- `star`
- `starFill`
- `starHalf`
- `stars`
- `steam`
- `stickies`
- `stickiesFill`
- `sticky`
- `stickyFill`
- `stop`
- `stopBtn`
- `stopBtnFill`
- `stopCircle`
- `stopCircleFill`
- `stopFill`
- `stoplights`
- `stoplightsFill`
- `stopwatch`
- `stopwatchFill`
- `strava`
- `stripe`
- `subscript`
- `substack`
- `subtract`
- `suitClub`
- `suitClubFill`
- `suitDiamond`
- `suitDiamondFill`
- `suitHeart`
- `suitHeartFill`
- `suitSpade`
- `suitSpadeFill`
- `suitcase`
- `suitcaseFill`
- `suitcaseLg`
- `suitcaseLgFill`
- `suitcase2`
- `suitcase2Fill`
- `sun`
- `sunFill`
- `sunglasses`
- `sunrise`
- `sunriseFill`
- `sunset`
- `sunsetFill`
- `superscript`
- `symmetryHorizontal`
- `symmetryVertical`
- `table`
- `tablet`
- `tabletFill`
- `tabletLandscape`
- `tabletLandscapeFill`
- `tag`
- `tagFill`
- `tags`
- `tagsFill`
- `taxiFront`
- `taxiFrontFill`
- `telegram`
- `telephone`
- `telephoneFill`
- `telephoneForward`
- `telephoneForwardFill`
- `telephoneInbound`
- `telephoneInboundFill`
- `telephoneMinus`
- `telephoneMinusFill`
- `telephoneOutbound`
- `telephoneOutboundFill`
- `telephonePlus`
- `telephonePlusFill`
- `telephoneX`
- `telephoneXFill`
- `tencentQq`
- `terminal`
- `terminalDash`
- `terminalFill`
- `terminalPlus`
- `terminalSplit`
- `terminalX`
- `textCenter`
- `textIndentLeft`
- `textIndentRight`
- `textLeft`
- `textParagraph`
- `textRight`
- `textWrap`
- `textarea`
- `textareaResize`
- `textareaT`
- `thermometer`
- `thermometerHalf`
- `thermometerHigh`
- `thermometerLow`
- `thermometerSnow`
- `thermometerSun`
- `threads`
- `threadsFill`
- `threeDots`
- `threeDotsVertical`
- `thunderbolt`
- `thunderboltFill`
- `ticket`
- `ticketDetailed`
- `ticketDetailedFill`
- `ticketFill`
- `ticketPerforated`
- `ticketPerforatedFill`
- `tiktok`
- `toggleOff`
- `toggleOn`
- `toggle2Off`
- `toggle2On`
- `toggles`
- `toggles2`
- `tools`
- `tornado`
- `trainFreightFront`
- `trainFreightFrontFill`
- `trainFront`
- `trainFrontFill`
- `trainLightrailFront`
- `trainLightrailFrontFill`
- `translate`
- `transparency`
- `trash`
- `trashFill`
- `trash2`
- `trash2Fill`
- `trash3`
- `trash3Fill`
- `tree`
- `treeFill`
- `trello`
- `triangle`
- `triangleFill`
- `triangleHalf`
- `trophy`
- `trophyFill`
- `tropicalStorm`
- `truck`
- `truckFlatbed`
- `truckFront`
- `truckFrontFill`
- `tsunami`
- `tux`
- `tv`
- `tvFill`
- `twitch`
- `twitter`
- `twitterX`
- `type`
- `typeBold`
- `typeH1`
- `typeH2`
- `typeH3`
- `typeH4`
- `typeH5`
- `typeH6`
- `typeItalic`
- `typeStrikethrough`
- `typeUnderline`
- `typescript`
- `ubuntu`
- `uiChecks`
- `uiChecksGrid`
- `uiRadios`
- `uiRadiosGrid`
- `umbrella`
- `umbrellaFill`
- `unindent`
- `union`
- `unity`
- `universalAccess`
- `universalAccessCircle`
- `unlock`
- `unlockFill`
- `unlock2`
- `unlock2Fill`
- `upc`
- `upcScan`
- `upload`
- `usb`
- `usbC`
- `usbCFill`
- `usbDrive`
- `usbDriveFill`
- `usbFill`
- `usbMicro`
- `usbMicroFill`
- `usbMini`
- `usbMiniFill`
- `usbPlug`
- `usbPlugFill`
- `usbSymbol`
- `valentine`
- `valentine2`
- `vectorPen`
- `viewList`
- `viewStacked`
- `vignette`
- `vimeo`
- `vinyl`
- `vinylFill`
- `virus`
- `virus2`
- `voicemail`
- `volumeDown`
- `volumeDownFill`
- `volumeMute`
- `volumeMuteFill`
- `volumeOff`
- `volumeOffFill`
- `volumeUp`
- `volumeUpFill`
- `vr`
- `wallet`
- `walletFill`
- `wallet2`
- `watch`
- `water`
- `webcam`
- `webcamFill`
- `wechat`
- `whatsapp`
- `wifi`
- `wifi1`
- `wifi2`
- `wifiOff`
- `wikipedia`
- `wind`
- `window`
- `windowDash`
- `windowDesktop`
- `windowDock`
- `windowFullscreen`
- `windowPlus`
- `windowSidebar`
- `windowSplit`
- `windowStack`
- `windowX`
- `windows`
- `wordpress`
- `wrench`
- `wrenchAdjustable`
- `wrenchAdjustableCircle`
- `wrenchAdjustableCircleFill`
- `wrenchAdjustableCricle`
- `x`
- `xCircle`
- `xCircleFill`
- `xDiamond`
- `xDiamondFill`
- `xLg`
- `xOctagon`
- `xOctagonFill`
- `xSquare`
- `xSquareFill`
- `xbox`
- `yelp`
- `yinYang`
- `youtube`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><123Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><0CircleIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><0CircleFillIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><0SquareIcon size="20" class="nav-icon" /> Settings</a>
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
<123Icon
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
    <123Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <0CircleIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <0CircleFillIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <123Icon size="24" />
   <0CircleIcon size="24" color="#4a90e2" />
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
   <123Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <123Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <123Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 123 } from '@stacksjs/iconify-bi'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(123, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 123 } from '@stacksjs/iconify-bi'

// Icons are typed as IconData
const myIcon: IconData = 123
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/twbs/icons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: The Bootstrap Authors ([Website](https://github.com/twbs/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
