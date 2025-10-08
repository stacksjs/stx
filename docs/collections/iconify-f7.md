# Framework7 Icons

> Framework7 Icons icons for stx from Iconify

## Overview

This package provides access to 1253 icons from the Framework7 Icons collection through the stx iconify integration.

**Collection ID:** `f7`
**Total Icons:** 1253
**Author:** Vladimir Kharlampidi ([Website](https://github.com/framework7io/framework7-icons))
**License:** MIT ([Details](https://github.com/framework7io/framework7-icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-f7
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AirplaneIcon height="1em" />
<AirplaneIcon width="1em" height="1em" />
<AirplaneIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AirplaneIcon size="24" />
<AirplaneIcon size="1em" />

<!-- Using width and height -->
<AirplaneIcon width="24" height="32" />

<!-- With color -->
<AirplaneIcon size="24" color="red" />
<AirplaneIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AirplaneIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AirplaneIcon
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
    <AirplaneIcon size="24" />
    <AlarmIcon size="24" color="#4a90e2" />
    <AlarmFillIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { airplane, alarm, alarmFill } from '@stacksjs/iconify-f7'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(airplane, { size: 24 })
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
<AirplaneIcon size="24" color="red" />
<AirplaneIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AirplaneIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AirplaneIcon size="24" class="text-primary" />
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
<AirplaneIcon height="1em" />
<AirplaneIcon width="1em" height="1em" />
<AirplaneIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AirplaneIcon size="24" />
<AirplaneIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.f7-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirplaneIcon class="f7-icon" />
```

## Available Icons

This package contains **1253** icons:

- `airplane`
- `alarm`
- `alarmFill`
- `alt`
- `ant`
- `antCircle`
- `antCircleFill`
- `antFill`
- `antennaRadiowavesLeftRight`
- `app`
- `appBadge`
- `appBadgeFill`
- `appFill`
- `archivebox`
- `archiveboxFill`
- `arrow2Circlepath`
- `arrow2CirclepathCircle`
- `arrow2CirclepathCircleFill`
- `arrow2Squarepath`
- `arrow3Trianglepath`
- `arrowBranch`
- `arrowClockwise`
- `arrowClockwiseCircle`
- `arrowClockwiseCircleFill`
- `arrowCounterclockwise`
- `arrowCounterclockwiseCircle`
- `arrowCounterclockwiseCircleFill`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownCircleFill`
- `arrowDownDoc`
- `arrowDownDocFill`
- `arrowDownLeft`
- `arrowDownLeftCircle`
- `arrowDownLeftCircleFill`
- `arrowDownLeftSquare`
- `arrowDownLeftSquareFill`
- `arrowDownRight`
- `arrowDownRightArrowUpLeft`
- `arrowDownRightCircle`
- `arrowDownRightCircleFill`
- `arrowDownRightSquare`
- `arrowDownRightSquareFill`
- `arrowDownSquare`
- `arrowDownSquareFill`
- `arrowDownToLine`
- `arrowDownToLineAlt`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftCircleFill`
- `arrowLeftRight`
- `arrowLeftRightCircle`
- `arrowLeftRightCircleFill`
- `arrowLeftRightSquare`
- `arrowLeftRightSquareFill`
- `arrowLeftSquare`
- `arrowLeftSquareFill`
- `arrowLeftToLine`
- `arrowLeftToLineAlt`
- `arrowMerge`
- `arrowRight`
- `arrowRightArrowLeft`
- `arrowRightArrowLeftCircle`
- `arrowRightArrowLeftCircleFill`
- `arrowRightArrowLeftSquare`
- `arrowRightArrowLeftSquareFill`
- `arrowRightCircle`
- `arrowRightCircleFill`
- `arrowRightSquare`
- `arrowRightSquareFill`
- `arrowRightToLine`
- `arrowRightToLineAlt`
- `arrowSwap`
- `arrowTurnDownLeft`
- `arrowTurnDownRight`
- `arrowTurnLeftDown`
- `arrowTurnLeftUp`
- `arrowTurnRightDown`
- `arrowTurnRightUp`
- `arrowTurnUpLeft`
- `arrowTurnUpRight`
- `arrowUp`
- `arrowUpArrowDown`
- `arrowUpArrowDownCircle`
- `arrowUpArrowDownCircleFill`
- `arrowUpArrowDownSquare`
- `arrowUpArrowDownSquareFill`
- `arrowUpBin`
- `arrowUpBinFill`
- `arrowUpCircle`
- `arrowUpCircleFill`
- `arrowUpDoc`
- `arrowUpDocFill`
- `arrowUpDown`
- `arrowUpDownCircle`
- `arrowUpDownCircleFill`
- `arrowUpDownSquare`
- `arrowUpDownSquareFill`
- `arrowUpLeft`
- `arrowUpLeftArrowDownRight`
- `arrowUpLeftCircle`
- `arrowUpLeftCircleFill`
- `arrowUpLeftSquare`
- `arrowUpLeftSquareFill`
- `arrowUpRight`
- `arrowUpRightCircle`
- `arrowUpRightCircleFill`
- `arrowUpRightDiamond`
- `arrowUpRightDiamondFill`
- `arrowUpRightSquare`
- `arrowUpRightSquareFill`
- `arrowUpSquare`
- `arrowUpSquareFill`
- `arrowUpToLine`
- `arrowUpToLineAlt`
- `arrowUturnDown`
- `arrowUturnDownCircle`
- `arrowUturnDownCircleFill`
- `arrowUturnDownSquare`
- `arrowUturnDownSquareFill`
- `arrowUturnLeft`
- `arrowUturnLeftCircle`
- `arrowUturnLeftCircleFill`
- `arrowUturnLeftSquare`
- `arrowUturnLeftSquareFill`
- `arrowUturnRight`
- `arrowUturnRightCircle`
- `arrowUturnRightCircleFill`
- `arrowUturnRightSquare`
- `arrowUturnRightSquareFill`
- `arrowUturnUp`
- `arrowUturnUpCircle`
- `arrowUturnUpCircleFill`
- `arrowUturnUpSquare`
- `arrowUturnUpSquareFill`
- `arrowshapeTurnUpLeft`
- `arrowshapeTurnUpLeft2`
- `arrowshapeTurnUpLeft2Fill`
- `arrowshapeTurnUpLeftCircle`
- `arrowshapeTurnUpLeftCircleFill`
- `arrowshapeTurnUpLeftFill`
- `arrowshapeTurnUpRight`
- `arrowshapeTurnUpRightCircle`
- `arrowshapeTurnUpRightCircleFill`
- `arrowshapeTurnUpRightFill`
- `arrowtriangleDown`
- `arrowtriangleDownCircle`
- `arrowtriangleDownCircleFill`
- `arrowtriangleDownFill`
- `arrowtriangleDownSquare`
- `arrowtriangleDownSquareFill`
- `arrowtriangleLeft`
- `arrowtriangleLeftCircle`
- `arrowtriangleLeftCircleFill`
- `arrowtriangleLeftFill`
- `arrowtriangleLeftSquare`
- `arrowtriangleLeftSquareFill`
- `arrowtriangleRight`
- `arrowtriangleRightCircle`
- `arrowtriangleRightCircleFill`
- `arrowtriangleRightFill`
- `arrowtriangleRightSquare`
- `arrowtriangleRightSquareFill`
- `arrowtriangleUp`
- `arrowtriangleUpCircle`
- `arrowtriangleUpCircleFill`
- `arrowtriangleUpFill`
- `arrowtriangleUpSquare`
- `arrowtriangleUpSquareFill`
- `asteriskCircle`
- `asteriskCircleFill`
- `at`
- `atAlt`
- `atBadgeMinus`
- `atBadgePlus`
- `atCircle`
- `atCircleFill`
- `backward`
- `backwardEnd`
- `backwardEndAlt`
- `backwardEndAltFill`
- `backwardEndFill`
- `backwardFill`
- `badgePlusRadiowavesRight`
- `bag`
- `bagBadgeMinus`
- `bagBadgePlus`
- `bagFill`
- `bagFillBadgeMinus`
- `bagFillBadgePlus`
- `bandage`
- `bandageFill`
- `barcode`
- `barcodeViewfinder`
- `bars`
- `battery0`
- `battery100`
- `battery25`
- `bedDouble`
- `bedDoubleFill`
- `bell`
- `bellCircle`
- `bellCircleFill`
- `bellFill`
- `bellSlash`
- `bellSlashFill`
- `binXmark`
- `binXmarkFill`
- `bitcoin`
- `bitcoinCircle`
- `bitcoinCircleFill`
- `bold`
- `boldItalicUnderline`
- `boldUnderline`
- `bolt`
- `boltBadgeA`
- `boltBadgeAFill`
- `boltCircle`
- `boltCircleFill`
- `boltFill`
- `boltHorizontal`
- `boltHorizontalCircle`
- `boltHorizontalCircleFill`
- `boltHorizontalFill`
- `boltSlash`
- `boltSlashFill`
- `book`
- `bookCircle`
- `bookCircleFill`
- `bookFill`
- `bookmark`
- `bookmarkFill`
- `briefcase`
- `briefcaseFill`
- `bubbleLeft`
- `bubbleLeftBubbleRight`
- `bubbleLeftBubbleRightFill`
- `bubbleLeftFill`
- `bubbleMiddleBottom`
- `bubbleMiddleBottomFill`
- `bubbleMiddleTop`
- `bubbleMiddleTopFill`
- `bubbleRight`
- `bubbleRightFill`
- `building`
- `building2`
- `building2CropCircle`
- `building2CropCircleFill`
- `building2Fill`
- `buildingColumns`
- `buildingColumnsFill`
- `buildingFill`
- `burn`
- `burst`
- `burstFill`
- `calendar`
- `calendarBadgeMinus`
- `calendarBadgePlus`
- `calendarCircle`
- `calendarCircleFill`
- `calendarToday`
- `camera`
- `cameraCircle`
- `cameraCircleFill`
- `cameraFill`
- `cameraFilters`
- `cameraOnRectangle`
- `cameraOnRectangleFill`
- `cameraRotate`
- `cameraRotateFill`
- `cameraViewfinder`
- `capslock`
- `capslockFill`
- `capsule`
- `capsuleFill`
- `captionsBubble`
- `captionsBubbleFill`
- `carFill`
- `cart`
- `cartBadgeMinus`
- `cartBadgePlus`
- `cartFill`
- `cartFillBadgeMinus`
- `cartFillBadgePlus`
- `cat`
- `chartBar`
- `chartBarAltFill`
- `chartBarCircle`
- `chartBarCircleFill`
- `chartBarFill`
- `chartBarSquare`
- `chartBarSquareFill`
- `chartPie`
- `chartPieFill`
- `chatBubble`
- `chatBubble2`
- `chatBubble2Fill`
- `chatBubbleFill`
- `chatBubbleText`
- `chatBubbleTextFill`
- `checkmark`
- `checkmark2`
- `checkmarkAlt`
- `checkmarkAltCircle`
- `checkmarkAltCircleFill`
- `checkmarkCircle`
- `checkmarkCircleFill`
- `checkmarkRectangle`
- `checkmarkRectangleFill`
- `checkmarkSeal`
- `checkmarkSealFill`
- `checkmarkShield`
- `checkmarkShieldFill`
- `checkmarkSquare`
- `checkmarkSquareFill`
- `chevronCompactDown`
- `chevronCompactLeft`
- `chevronCompactRight`
- `chevronCompactUp`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownCircleFill`
- `chevronDownSquare`
- `chevronDownSquareFill`
- `chevronLeft`
- `chevronLeft2`
- `chevronLeftCircle`
- `chevronLeftCircleFill`
- `chevronLeftSlashChevronRight`
- `chevronLeftSquare`
- `chevronLeftSquareFill`
- `chevronRight`
- `chevronRight2`
- `chevronRightCircle`
- `chevronRightCircleFill`
- `chevronRightSquare`
- `chevronRightSquareFill`
- `chevronUp`
- `chevronUpChevronDown`
- `chevronUpCircle`
- `chevronUpCircleFill`
- `chevronUpSquare`
- `chevronUpSquareFill`
- `circle`
- `circleBottomthirdSplit`
- `circleFill`
- `circleGrid3x3`
- `circleGrid3x3Fill`
- `circleGridHex`
- `circleGridHexFill`
- `circleLefthalfFill`
- `circleRighthalfFill`
- `clear`
- `clearFill`
- `clock`
- `clockFill`
- `cloud`
- `cloudBolt`
- `cloudBoltFill`
- `cloudBoltRain`
- `cloudBoltRainFill`
- `cloudDownload`
- `cloudDownloadFill`
- `cloudDrizzle`
- `cloudDrizzleFill`
- `cloudFill`
- `cloudFog`
- `cloudFogFill`
- `cloudHail`
- `cloudHailFill`
- `cloudHeavyrain`
- `cloudHeavyrainFill`
- `cloudMoon`
- `cloudMoonBolt`
- `cloudMoonBoltFill`
- `cloudMoonFill`
- `cloudMoonRain`
- `cloudMoonRainFill`
- `cloudRain`
- `cloudRainFill`
- `cloudSleet`
- `cloudSleetFill`
- `cloudSnow`
- `cloudSnowFill`
- `cloudSun`
- `cloudSunBolt`
- `cloudSunBoltFill`
- `cloudSunFill`
- `cloudSunRain`
- `cloudSunRainFill`
- `cloudUpload`
- `cloudUploadFill`
- `command`
- `compass`
- `compassFill`
- `control`
- `creditcard`
- `creditcardFill`
- `crop`
- `cropRotate`
- `cube`
- `cubeBox`
- `cubeBoxFill`
- `cubeFill`
- `cursorRays`
- `decreaseIndent`
- `decreaseQuotelevel`
- `deleteLeft`
- `deleteLeftFill`
- `deleteRight`
- `deleteRightFill`
- `desktopcomputer`
- `deviceDesktop`
- `deviceLaptop`
- `devicePhoneLandscape`
- `devicePhonePortrait`
- `deviceTabletLandscape`
- `deviceTabletPortrait`
- `dial`
- `dialFill`
- `divide`
- `divideCircle`
- `divideCircleFill`
- `divideSquare`
- `divideSquareFill`
- `doc`
- `docAppend`
- `docChart`
- `docChartFill`
- `docCheckmark`
- `docCheckmarkFill`
- `docCircle`
- `docCircleFill`
- `docFill`
- `docOnClipboard`
- `docOnClipboardFill`
- `docOnDoc`
- `docOnDocFill`
- `docPerson`
- `docPersonFill`
- `docPlaintext`
- `docRichtext`
- `docText`
- `docTextFill`
- `docTextSearch`
- `docTextViewfinder`
- `dog`
- `dotRadiowavesLeftRight`
- `dotRadiowavesRight`
- `dotSquare`
- `dotSquareFill`
- `downloadCircle`
- `downloadCircleFill`
- `drop`
- `dropFill`
- `dropTriangle`
- `dropTriangleFill`
- `ear`
- `eject`
- `ejectFill`
- `ellipsesBubble`
- `ellipsesBubbleFill`
- `ellipsis`
- `ellipsisCircle`
- `ellipsisCircleFill`
- `ellipsisVertical`
- `ellipsisVerticalCircle`
- `ellipsisVerticalCircleFill`
- `envelope`
- `envelopeBadge`
- `envelopeBadgeFill`
- `envelopeCircle`
- `envelopeCircleFill`
- `envelopeFill`
- `envelopeOpen`
- `envelopeOpenFill`
- `equal`
- `equalCircle`
- `equalCircleFill`
- `equalSquare`
- `equalSquareFill`
- `escape`
- `exclamationmark`
- `exclamationmarkBubble`
- `exclamationmarkBubbleFill`
- `exclamationmarkCircle`
- `exclamationmarkCircleFill`
- `exclamationmarkOctagon`
- `exclamationmarkOctagonFill`
- `exclamationmarkShield`
- `exclamationmarkShieldFill`
- `exclamationmarkSquare`
- `exclamationmarkSquareFill`
- `exclamationmarkTriangle`
- `exclamationmarkTriangleFill`
- `expand`
- `eye`
- `eyeFill`
- `eyeSlash`
- `eyeSlashFill`
- `eyedropper`
- `eyedropperFull`
- `eyedropperHalffull`
- `eyeglasses`
- `fCursive`
- `fCursiveCircle`
- `fCursiveCircleFill`
- `faceSmiling`
- `faceSmilingFill`
- `facemask`
- `facemaskFill`
- `film`
- `filmFill`
- `flag`
- `flagCircle`
- `flagCircleFill`
- `flagFill`
- `flagSlash`
- `flagSlashFill`
- `flame`
- `flameFill`
- `floppyDisk`
- `flowchart`
- `flowchartFill`
- `folder`
- `folderBadgeMinus`
- `folderBadgePersonCrop`
- `folderBadgePlus`
- `folderCircle`
- `folderCircleFill`
- `folderFill`
- `folderFillBadgeMinus`
- `folderFillBadgePersonCrop`
- `folderFillBadgePlus`
- `forward`
- `forwardEnd`
- `forwardEndAlt`
- `forwardEndAltFill`
- `forwardEndFill`
- `forwardFill`
- `function`
- `funnel`
- `funnelFill`
- `fx`
- `gamecontroller`
- `gamecontrollerAltFill`
- `gamecontrollerFill`
- `gauge`
- `gaugeBadgeMinus`
- `gaugeBadgePlus`
- `gear`
- `gearAlt`
- `gearAltFill`
- `gift`
- `giftAlt`
- `giftAltFill`
- `giftFill`
- `giftcard`
- `giftcardFill`
- `globe`
- `gobackward`
- `gobackward10`
- `gobackward15`
- `gobackward30`
- `gobackward45`
- `gobackward60`
- `gobackward75`
- `gobackward90`
- `gobackwardMinus`
- `goforward`
- `goforward10`
- `goforward15`
- `goforward30`
- `goforward45`
- `goforward60`
- `goforward75`
- `goforward90`
- `goforwardPlus`
- `graphCircle`
- `graphCircleFill`
- `graphSquare`
- `graphSquareFill`
- `greaterthan`
- `greaterthanCircle`
- `greaterthanCircleFill`
- `greaterthanSquare`
- `greaterthanSquareFill`
- `grid`
- `gridCircle`
- `gridCircleFill`
- `guitars`
- `hammer`
- `hammerFill`
- `handDraw`
- `handDrawFill`
- `handPointLeft`
- `handPointLeftFill`
- `handPointRight`
- `handPointRightFill`
- `handRaised`
- `handRaisedFill`
- `handRaisedSlash`
- `handRaisedSlashFill`
- `handThumbsdown`
- `handThumbsdownFill`
- `handThumbsup`
- `handThumbsupFill`
- `hare`
- `hareFill`
- `headphones`
- `heart`
- `heartCircle`
- `heartCircleFill`
- `heartFill`
- `heartSlash`
- `heartSlashCircle`
- `heartSlashCircleFill`
- `heartSlashFill`
- `helm`
- `hexagon`
- `hexagonFill`
- `hifispeaker`
- `hifispeakerFill`
- `hourglass`
- `hourglassBottomhalfFill`
- `hourglassTophalfFill`
- `house`
- `houseAlt`
- `houseAltFill`
- `houseFill`
- `hurricane`
- `increaseIndent`
- `increaseQuotelevel`
- `infinite`
- `info`
- `infoCircle`
- `infoCircleFill`
- `italic`
- `keyboard`
- `keyboardChevronCompactDown`
- `largecircleFillCircle`
- `lasso`
- `layers`
- `layersAlt`
- `layersAltFill`
- `layersFill`
- `leafArrowCirclepath`
- `lessthan`
- `lessthanCircle`
- `lessthanCircleFill`
- `lessthanSquare`
- `lessthanSquareFill`
- `lightMax`
- `lightMin`
- `lightbulb`
- `lightbulbFill`
- `lightbulbSlash`
- `lightbulbSlashFill`
- `lineHorizontal3`
- `lineHorizontal3Decrease`
- `lineHorizontal3DecreaseCircle`
- `lineHorizontal3DecreaseCircleFill`
- `link`
- `linkCircle`
- `linkCircleFill`
- `listBullet`
- `listBulletBelowRectangle`
- `listBulletIndent`
- `listDash`
- `listNumber`
- `listNumberRtl`
- `location`
- `locationCircle`
- `locationCircleFill`
- `locationFill`
- `locationNorth`
- `locationNorthFill`
- `locationNorthLine`
- `locationNorthLineFill`
- `locationSlash`
- `locationSlashFill`
- `lock`
- `lockCircle`
- `lockCircleFill`
- `lockFill`
- `lockOpen`
- `lockOpenFill`
- `lockRotation`
- `lockRotationOpen`
- `lockShield`
- `lockShieldFill`
- `lockSlash`
- `lockSlashFill`
- `logoAndroid`
- `logoAndroidText`
- `logoApple`
- `logoFacebook`
- `logoGithub`
- `logoGoogle`
- `logoGoogleText`
- `logoGoogleplus`
- `logoInstagram`
- `logoIos`
- `logoLinkedin`
- `logoMacos`
- `logoMicrosoft`
- `logoRss`
- `logoStackoverflow`
- `logoTwitter`
- `logoWindows`
- `macwindow`
- `map`
- `mapFill`
- `mapPin`
- `mapPinEllipse`
- `mapPinSlash`
- `memories`
- `memoriesBadgeMinus`
- `memoriesBadgePlus`
- `menu`
- `metronome`
- `mic`
- `micCircle`
- `micCircleFill`
- `micFill`
- `micSlash`
- `micSlashFill`
- `minus`
- `minusCircle`
- `minusCircleFill`
- `minusRectangle`
- `minusRectangleFill`
- `minusSlashPlus`
- `minusSquare`
- `minusSquareFill`
- `moneyDollar`
- `moneyDollarCircle`
- `moneyDollarCircleFill`
- `moneyEuro`
- `moneyEuroCircle`
- `moneyEuroCircleFill`
- `moneyPound`
- `moneyPoundCircle`
- `moneyPoundCircleFill`
- `moneyRubl`
- `moneyRublCircle`
- `moneyRublCircleFill`
- `moneyYen`
- `moneyYenCircle`
- `moneyYenCircleFill`
- `moon`
- `moonCircle`
- `moonCircleFill`
- `moonFill`
- `moonStars`
- `moonStarsFill`
- `moonZzz`
- `moonZzzFill`
- `move`
- `multiply`
- `multiplyCircle`
- `multiplyCircleFill`
- `multiplySquare`
- `multiplySquareFill`
- `musicAlbums`
- `musicAlbumsFill`
- `musicHouse`
- `musicHouseFill`
- `musicMic`
- `musicNote`
- `musicNote2`
- `musicNoteList`
- `nosign`
- `number`
- `numberCircle`
- `numberCircleFill`
- `numberSquare`
- `numberSquareFill`
- `option`
- `paintbrush`
- `paintbrushFill`
- `pano`
- `panoFill`
- `paperclip`
- `paperplane`
- `paperplaneFill`
- `paragraph`
- `pause`
- `pauseCircle`
- `pauseCircleFill`
- `pauseFill`
- `pauseRectangle`
- `pauseRectangleFill`
- `paw`
- `pencil`
- `pencilCircle`
- `pencilCircleFill`
- `pencilEllipsisRectangle`
- `pencilOutline`
- `pencilSlash`
- `percent`
- `person`
- `person2`
- `person2Alt`
- `person2Fill`
- `person2SquareStack`
- `person2SquareStackFill`
- `person3`
- `person3Fill`
- `personAlt`
- `personAltCircle`
- `personAltCircleFill`
- `personBadgeMinus`
- `personBadgeMinusFill`
- `personBadgePlus`
- `personBadgePlusFill`
- `personCircle`
- `personCircleFill`
- `personCropCircle`
- `personCropCircleBadgeCheckmark`
- `personCropCircleBadgeExclam`
- `personCropCircleBadgeMinus`
- `personCropCircleBadgePlus`
- `personCropCircleBadgeXmark`
- `personCropCircleFill`
- `personCropCircleFillBadgeCheckmark`
- `personCropCircleFillBadgeExclam`
- `personCropCircleFillBadgeMinus`
- `personCropCircleFillBadgePlus`
- `personCropCircleFillBadgeXmark`
- `personCropRectangle`
- `personCropRectangleFill`
- `personCropSquare`
- `personCropSquareFill`
- `personFill`
- `personalhotspot`
- `perspective`
- `phone`
- `phoneArrowDownLeft`
- `phoneArrowRight`
- `phoneArrowUpRight`
- `phoneBadgePlus`
- `phoneCircle`
- `phoneCircleFill`
- `phoneDown`
- `phoneDownCircle`
- `phoneDownCircleFill`
- `phoneDownFill`
- `phoneFill`
- `phoneFillArrowDownLeft`
- `phoneFillArrowRight`
- `phoneFillArrowUpRight`
- `phoneFillBadgePlus`
- `photo`
- `photoFill`
- `photoFillOnRectangleFill`
- `photoOnRectangle`
- `piano`
- `pin`
- `pinFill`
- `pinSlash`
- `pinSlashFill`
- `placemark`
- `placemarkFill`
- `play`
- `playCircle`
- `playCircleFill`
- `playFill`
- `playRectangle`
- `playRectangleFill`
- `playpause`
- `playpauseFill`
- `plus`
- `plusApp`
- `plusAppFill`
- `plusBubble`
- `plusBubbleFill`
- `plusCircle`
- `plusCircleFill`
- `plusRectangle`
- `plusRectangleFill`
- `plusRectangleFillOnRectangleFill`
- `plusRectangleOnRectangle`
- `plusSlashMinus`
- `plusSquare`
- `plusSquareFill`
- `plusSquareFillOnSquareFill`
- `plusSquareOnSquare`
- `plusminus`
- `plusminusCircle`
- `plusminusCircleFill`
- `poultryLeg`
- `power`
- `printer`
- `printerFill`
- `projective`
- `purchased`
- `purchasedCircle`
- `purchasedCircleFill`
- `qrcode`
- `qrcodeViewfinder`
- `question`
- `questionCircle`
- `questionCircleFill`
- `questionDiamond`
- `questionDiamondFill`
- `questionSquare`
- `questionSquareFill`
- `quoteBubble`
- `quoteBubbleFill`
- `radiowavesLeft`
- `radiowavesRight`
- `rays`
- `recordingtape`
- `rectangle`
- `rectangle3Offgrid`
- `rectangle3OffgridFill`
- `rectangleArrowUpRightArrowDownLeft`
- `rectangleArrowUpRightArrowDownLeftSlash`
- `rectangleBadgeCheckmark`
- `rectangleBadgeXmark`
- `rectangleCompressVertical`
- `rectangleDock`
- `rectangleExpandVertical`
- `rectangleFill`
- `rectangleFillBadgeCheckmark`
- `rectangleFillBadgeXmark`
- `rectangleFillOnRectangleAngledFill`
- `rectangleFillOnRectangleFill`
- `rectangleGrid1x2`
- `rectangleGrid1x2Fill`
- `rectangleGrid2x2`
- `rectangleGrid2x2Fill`
- `rectangleGrid3x2`
- `rectangleGrid3x2Fill`
- `rectangleOnRectangle`
- `rectangleOnRectangleAngled`
- `rectanglePaperclip`
- `rectangleSplit3x1`
- `rectangleSplit3x1Fill`
- `rectangleSplit3x3`
- `rectangleSplit3x3Fill`
- `rectangleStack`
- `rectangleStackBadgeMinus`
- `rectangleStackBadgePersonCrop`
- `rectangleStackBadgePlus`
- `rectangleStackFill`
- `rectangleStackFillBadgeMinus`
- `rectangleStackFillBadgePersonCrop`
- `rectangleStackFillBadgePlus`
- `rectangleStackPersonCrop`
- `rectangleStackPersonCropFill`
- `repeat`
- `repeat1`
- `resize`
- `resizeH`
- `resizeV`
- `return`
- `rhombus`
- `rhombusFill`
- `rocket`
- `rocketFill`
- `rosette`
- `rotateLeft`
- `rotateLeftFill`
- `rotateRight`
- `rotateRightFill`
- `scissors`
- `scissorsAlt`
- `scope`
- `scribble`
- `search`
- `searchCircle`
- `searchCircleFill`
- `selectionPinInOut`
- `shield`
- `shieldFill`
- `shieldLefthalfFill`
- `shieldSlash`
- `shieldSlashFill`
- `shift`
- `shiftFill`
- `shippingbox`
- `shippingboxFill`
- `shuffle`
- `sidebarLeft`
- `sidebarRight`
- `signature`
- `skew`
- `slashCircle`
- `slashCircleFill`
- `sliderHorizontal3`
- `sliderHorizontalBelowRectangle`
- `slowmo`
- `smallcircleCircle`
- `smallcircleCircleFill`
- `smallcircleFillCircle`
- `smallcircleFillCircleFill`
- `smiley`
- `smileyFill`
- `smoke`
- `smokeFill`
- `snow`
- `sortDown`
- `sortDownCircle`
- `sortDownCircleFill`
- `sortUp`
- `sortUpCircle`
- `sortUpCircleFill`
- `sparkles`
- `speaker`
- `speaker1`
- `speaker1Fill`
- `speaker2`
- `speaker2Fill`
- `speaker3`
- `speaker3Fill`
- `speakerFill`
- `speakerSlash`
- `speakerSlashFill`
- `speakerSlashFillRtl`
- `speakerSlashRtl`
- `speakerZzz`
- `speakerZzzFill`
- `speakerZzzFillRtl`
- `speakerZzzRtl`
- `speedometer`
- `sportscourt`
- `sportscourtFill`
- `square`
- `squareArrowDown`
- `squareArrowDownFill`
- `squareArrowDownOnSquare`
- `squareArrowDownOnSquareFill`
- `squareArrowLeft`
- `squareArrowLeftFill`
- `squareArrowRight`
- `squareArrowRightFill`
- `squareArrowUp`
- `squareArrowUpFill`
- `squareArrowUpOnSquare`
- `squareArrowUpOnSquareFill`
- `squareFavorites`
- `squareFavoritesAlt`
- `squareFavoritesAltFill`
- `squareFavoritesFill`
- `squareFill`
- `squareFillLineVerticalSquare`
- `squareFillLineVerticalSquareFill`
- `squareFillOnCircleFill`
- `squareFillOnSquareFill`
- `squareGrid2x2`
- `squareGrid2x2Fill`
- `squareGrid3x2`
- `squareGrid3x2Fill`
- `squareGrid4x3Fill`
- `squareLefthalfFill`
- `squareLineVerticalSquare`
- `squareLineVerticalSquareFill`
- `squareList`
- `squareListFill`
- `squareOnCircle`
- `squareOnSquare`
- `squarePencil`
- `squarePencilFill`
- `squareRighthalfFill`
- `squareSplit1x2`
- `squareSplit1x2Fill`
- `squareSplit2x1`
- `squareSplit2x1Fill`
- `squareSplit2x2`
- `squareSplit2x2Fill`
- `squareStack`
- `squareStack3dDownDottedline`
- `squareStack3dDownRight`
- `squareStack3dDownRightFill`
- `squareStack3dUp`
- `squareStack3dUpFill`
- `squareStack3dUpSlash`
- `squareStack3dUpSlashFill`
- `squareStackFill`
- `squaresBelowRectangle`
- `star`
- `starCircle`
- `starCircleFill`
- `starFill`
- `starLefthalfFill`
- `starSlash`
- `starSlashFill`
- `staroflife`
- `staroflifeFill`
- `status`
- `sticker`
- `stop`
- `stopCircle`
- `stopCircleFill`
- `stopFill`
- `stopwatch`
- `stopwatchFill`
- `strikethrough`
- `suitClub`
- `suitClubFill`
- `suitDiamond`
- `suitDiamondFill`
- `suitHeart`
- `suitHeartFill`
- `suitSpade`
- `suitSpadeFill`
- `sum`
- `sunDust`
- `sunDustFill`
- `sunHaze`
- `sunHazeFill`
- `sunMax`
- `sunMaxFill`
- `sunMin`
- `sunMinFill`
- `sunrise`
- `sunriseFill`
- `sunset`
- `sunsetFill`
- `tBubble`
- `tBubbleFill`
- `table`
- `tableBadgeMore`
- `tableBadgeMoreFill`
- `tableFill`
- `tag`
- `tagCircle`
- `tagCircleFill`
- `tagFill`
- `textAligncenter`
- `textAlignleft`
- `textAlignright`
- `textAppend`
- `textBadgeCheckmark`
- `textBadgeMinus`
- `textBadgePlus`
- `textBadgeStar`
- `textBadgeXmark`
- `textBubble`
- `textBubbleFill`
- `textCursor`
- `textInsert`
- `textJustify`
- `textJustifyleft`
- `textJustifyright`
- `textQuote`
- `textbox`
- `textformat`
- `textformat123`
- `textformatAbc`
- `textformatAbcDottedunderline`
- `textformatAlt`
- `textformatSize`
- `textformatSubscript`
- `textformatSuperscript`
- `thermometer`
- `thermometerSnowflake`
- `thermometerSun`
- `ticket`
- `ticketFill`
- `tickets`
- `ticketsFill`
- `timelapse`
- `timer`
- `timerFill`
- `today`
- `todayFill`
- `tornado`
- `tortoise`
- `tortoiseFill`
- `tramFill`
- `trash`
- `trashCircle`
- `trashCircleFill`
- `trashFill`
- `trashSlash`
- `trashSlashFill`
- `tray`
- `tray2`
- `tray2Fill`
- `trayArrowDown`
- `trayArrowDownFill`
- `trayArrowUp`
- `trayArrowUpFill`
- `trayFill`
- `trayFull`
- `trayFullFill`
- `tree`
- `triangle`
- `triangleFill`
- `triangleLefthalfFill`
- `triangleRighthalfFill`
- `tropicalstorm`
- `tuningfork`
- `tv`
- `tvCircle`
- `tvCircleFill`
- `tvFill`
- `tvMusicNote`
- `tvMusicNoteFill`
- `uiwindowSplit2x1`
- `umbrella`
- `umbrellaFill`
- `underline`
- `uploadCircle`
- `uploadCircleFill`
- `videocam`
- `videocamCircle`
- `videocamCircleFill`
- `videocamFill`
- `view2d`
- `view3d`
- `viewfinder`
- `viewfinderCircle`
- `viewfinderCircleFill`
- `wallet`
- `walletFill`
- `wandRays`
- `wandRaysInverse`
- `wandStars`
- `wandStarsInverse`
- `waveform`
- `waveformCircle`
- `waveformCircleFill`
- `waveformPath`
- `waveformPathBadgeMinus`
- `waveformPathBadgePlus`
- `waveformPathEcg`
- `wifi`
- `wifiExclamationmark`
- `wifiSlash`
- `wind`
- `windSnow`
- `wrench`
- `wrenchFill`
- `xmark`
- `xmarkCircle`
- `xmarkCircleFill`
- `xmarkOctagon`
- `xmarkOctagonFill`
- `xmarkRectangle`
- `xmarkRectangleFill`
- `xmarkSeal`
- `xmarkSealFill`
- `xmarkShield`
- `xmarkShieldFill`
- `xmarkSquare`
- `xmarkSquareFill`
- `zoomIn`
- `zoomOut`
- `zzz`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AirplaneIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlarmIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmFillIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AltIcon size="20" class="nav-icon" /> Settings</a>
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
<AirplaneIcon
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
    <AirplaneIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlarmIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmFillIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirplaneIcon size="24" />
   <AlarmIcon size="24" color="#4a90e2" />
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
   <AirplaneIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AirplaneIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AirplaneIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { airplane } from '@stacksjs/iconify-f7'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(airplane, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { airplane } from '@stacksjs/iconify-f7'

// Icons are typed as IconData
const myIcon: IconData = airplane
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/framework7io/framework7-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Vladimir Kharlampidi ([Website](https://github.com/framework7io/framework7-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/f7/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/f7/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
