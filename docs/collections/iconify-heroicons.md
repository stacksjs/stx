# HeroIcons

> HeroIcons icons for stx from Iconify

## Overview

This package provides access to 1288 icons from the HeroIcons collection through the stx iconify integration.

**Collection ID:** `heroicons`
**Total Icons:** 1288
**Author:** Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
**License:** MIT ([Details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-heroicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AcademicCapIcon, AcademicCap16SolidIcon, AcademicCap20SolidIcon } from '@stacksjs/iconify-heroicons'

// Basic usage
const icon = AcademicCapIcon()

// With size
const sizedIcon = AcademicCapIcon({ size: 24 })

// With color
const coloredIcon = AcademicCap16SolidIcon({ color: 'red' })

// With multiple props
const customIcon = AcademicCap20SolidIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AcademicCapIcon, AcademicCap16SolidIcon, AcademicCap20SolidIcon } from '@stacksjs/iconify-heroicons'

  global.icons = {
    home: AcademicCapIcon({ size: 24 }),
    user: AcademicCap16SolidIcon({ size: 24, color: '#4a90e2' }),
    settings: AcademicCap20SolidIcon({ size: 32 })
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
import { academicCap, academicCap16Solid, academicCap20Solid } from '@stacksjs/iconify-heroicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(academicCap, { size: 24 })
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

```typescript
// Via color property
const redIcon = AcademicCapIcon({ color: 'red' })
const blueIcon = AcademicCapIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AcademicCapIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AcademicCapIcon({ class: 'text-primary' })
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

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AcademicCapIcon({ size: 24 })
const icon1em = AcademicCapIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AcademicCapIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AcademicCapIcon({ height: '1em' })
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
const smallIcon = AcademicCapIcon({ class: 'icon-small' })
const largeIcon = AcademicCapIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1288** icons:

- `academicCap`
- `academicCap16Solid`
- `academicCap20Solid`
- `academicCapSolid`
- `adjustmentsHorizontal`
- `adjustmentsHorizontal16Solid`
- `adjustmentsHorizontal20Solid`
- `adjustmentsHorizontalSolid`
- `adjustmentsVertical`
- `adjustmentsVertical16Solid`
- `adjustmentsVertical20Solid`
- `adjustmentsVerticalSolid`
- `archiveBox`
- `archiveBox16Solid`
- `archiveBox20Solid`
- `archiveBoxArrowDown`
- `archiveBoxArrowDown16Solid`
- `archiveBoxArrowDown20Solid`
- `archiveBoxArrowDownSolid`
- `archiveBoxSolid`
- `archiveBoxXMark`
- `archiveBoxXMark16Solid`
- `archiveBoxXMark20Solid`
- `archiveBoxXMarkSolid`
- `arrowDown`
- `arrowDown16Solid`
- `arrowDown20Solid`
- `arrowDownCircle`
- `arrowDownCircle16Solid`
- `arrowDownCircle20Solid`
- `arrowDownCircleSolid`
- `arrowDownLeft`
- `arrowDownLeft16Solid`
- `arrowDownLeft20Solid`
- `arrowDownLeftSolid`
- `arrowDownOnSquare`
- `arrowDownOnSquare16Solid`
- `arrowDownOnSquare20Solid`
- `arrowDownOnSquareSolid`
- `arrowDownOnSquareStack`
- `arrowDownOnSquareStack16Solid`
- `arrowDownOnSquareStack20Solid`
- `arrowDownOnSquareStackSolid`
- `arrowDownRight`
- `arrowDownRight16Solid`
- `arrowDownRight20Solid`
- `arrowDownRightSolid`
- `arrowDownSolid`
- `arrowDownTray`
- `arrowDownTray16Solid`
- `arrowDownTray20Solid`
- `arrowDownTraySolid`
- `arrowLeft`
- `arrowLeft16Solid`
- `arrowLeft20Solid`
- `arrowLeftCircle`
- `arrowLeftCircle16Solid`
- `arrowLeftCircle20Solid`
- `arrowLeftCircleSolid`
- `arrowLeftEndOnRectangle`
- `arrowLeftEndOnRectangle16Solid`
- `arrowLeftEndOnRectangle20Solid`
- `arrowLeftEndOnRectangleSolid`
- `arrowLeftOnRectangle`
- `arrowLeftOnRectangle20Solid`
- `arrowLeftOnRectangleSolid`
- `arrowLeftSolid`
- `arrowLeftStartOnRectangle`
- `arrowLeftStartOnRectangle16Solid`
- `arrowLeftStartOnRectangle20Solid`
- `arrowLeftStartOnRectangleSolid`
- `arrowLongDown`
- `arrowLongDown16Solid`
- `arrowLongDown20Solid`
- `arrowLongDownSolid`
- `arrowLongLeft`
- `arrowLongLeft16Solid`
- `arrowLongLeft20Solid`
- `arrowLongLeftSolid`
- `arrowLongRight`
- `arrowLongRight16Solid`
- `arrowLongRight20Solid`
- `arrowLongRightSolid`
- `arrowLongUp`
- `arrowLongUp16Solid`
- `arrowLongUp20Solid`
- `arrowLongUpSolid`
- `arrowPath`
- `arrowPath16Solid`
- `arrowPath20Solid`
- `arrowPathRoundedSquare`
- `arrowPathRoundedSquare16Solid`
- `arrowPathRoundedSquare20Solid`
- `arrowPathRoundedSquareSolid`
- `arrowPathSolid`
- `arrowRight`
- `arrowRight16Solid`
- `arrowRight20Solid`
- `arrowRightCircle`
- `arrowRightCircle16Solid`
- `arrowRightCircle20Solid`
- `arrowRightCircleSolid`
- `arrowRightEndOnRectangle`
- `arrowRightEndOnRectangle16Solid`
- `arrowRightEndOnRectangle20Solid`
- `arrowRightEndOnRectangleSolid`
- `arrowRightOnRectangle`
- `arrowRightOnRectangle20Solid`
- `arrowRightOnRectangleSolid`
- `arrowRightSolid`
- `arrowRightStartOnRectangle`
- `arrowRightStartOnRectangle16Solid`
- `arrowRightStartOnRectangle20Solid`
- `arrowRightStartOnRectangleSolid`
- `arrowSmallDown`
- `arrowSmallDown20Solid`
- `arrowSmallDownSolid`
- `arrowSmallLeft`
- `arrowSmallLeft20Solid`
- `arrowSmallLeftSolid`
- `arrowSmallRight`
- `arrowSmallRight20Solid`
- `arrowSmallRightSolid`
- `arrowSmallUp`
- `arrowSmallUp20Solid`
- `arrowSmallUpSolid`
- `arrowTopRightOnSquare`
- `arrowTopRightOnSquare16Solid`
- `arrowTopRightOnSquare20Solid`
- `arrowTopRightOnSquareSolid`
- `arrowTrendingDown`
- `arrowTrendingDown16Solid`
- `arrowTrendingDown20Solid`
- `arrowTrendingDownSolid`
- `arrowTrendingUp`
- `arrowTrendingUp16Solid`
- `arrowTrendingUp20Solid`
- `arrowTrendingUpSolid`
- `arrowTurnDownLeft`
- `arrowTurnDownLeft16Solid`
- `arrowTurnDownLeft20Solid`
- `arrowTurnDownLeftSolid`
- `arrowTurnDownRight`
- `arrowTurnDownRight16Solid`
- `arrowTurnDownRight20Solid`
- `arrowTurnDownRightSolid`
- `arrowTurnLeftDown`
- `arrowTurnLeftDown16Solid`
- `arrowTurnLeftDown20Solid`
- `arrowTurnLeftDownSolid`
- `arrowTurnLeftUp`
- `arrowTurnLeftUp16Solid`
- `arrowTurnLeftUp20Solid`
- `arrowTurnLeftUpSolid`
- `arrowTurnRightDown`
- `arrowTurnRightDown16Solid`
- `arrowTurnRightDown20Solid`
- `arrowTurnRightDownSolid`
- `arrowTurnRightUp`
- `arrowTurnRightUp16Solid`
- `arrowTurnRightUp20Solid`
- `arrowTurnRightUpSolid`
- `arrowTurnUpLeft`
- `arrowTurnUpLeft16Solid`
- `arrowTurnUpLeft20Solid`
- `arrowTurnUpLeftSolid`
- `arrowTurnUpRight`
- `arrowTurnUpRight16Solid`
- `arrowTurnUpRight20Solid`
- `arrowTurnUpRightSolid`
- `arrowUp`
- `arrowUp16Solid`
- `arrowUp20Solid`
- `arrowUpCircle`
- `arrowUpCircle16Solid`
- `arrowUpCircle20Solid`
- `arrowUpCircleSolid`
- `arrowUpLeft`
- `arrowUpLeft16Solid`
- `arrowUpLeft20Solid`
- `arrowUpLeftSolid`
- `arrowUpOnSquare`
- `arrowUpOnSquare16Solid`
- `arrowUpOnSquare20Solid`
- `arrowUpOnSquareSolid`
- `arrowUpOnSquareStack`
- `arrowUpOnSquareStack16Solid`
- `arrowUpOnSquareStack20Solid`
- `arrowUpOnSquareStackSolid`
- `arrowUpRight`
- `arrowUpRight16Solid`
- `arrowUpRight20Solid`
- `arrowUpRightSolid`
- `arrowUpSolid`
- `arrowUpTray`
- `arrowUpTray16Solid`
- `arrowUpTray20Solid`
- `arrowUpTraySolid`
- `arrowUturnDown`
- `arrowUturnDown16Solid`
- `arrowUturnDown20Solid`
- `arrowUturnDownSolid`
- `arrowUturnLeft`
- `arrowUturnLeft16Solid`
- `arrowUturnLeft20Solid`
- `arrowUturnLeftSolid`
- `arrowUturnRight`
- `arrowUturnRight16Solid`
- `arrowUturnRight20Solid`
- `arrowUturnRightSolid`
- `arrowUturnUp`
- `arrowUturnUp16Solid`
- `arrowUturnUp20Solid`
- `arrowUturnUpSolid`
- `arrowsPointingIn`
- `arrowsPointingIn16Solid`
- `arrowsPointingIn20Solid`
- `arrowsPointingInSolid`
- `arrowsPointingOut`
- `arrowsPointingOut16Solid`
- `arrowsPointingOut20Solid`
- `arrowsPointingOutSolid`
- `arrowsRightLeft`
- `arrowsRightLeft16Solid`
- `arrowsRightLeft20Solid`
- `arrowsRightLeftSolid`
- `arrowsUpDown`
- `arrowsUpDown16Solid`
- `arrowsUpDown20Solid`
- `arrowsUpDownSolid`
- `atSymbol`
- `atSymbol16Solid`
- `atSymbol20Solid`
- `atSymbolSolid`
- `backspace`
- `backspace16Solid`
- `backspace20Solid`
- `backspaceSolid`
- `backward`
- `backward16Solid`
- `backward20Solid`
- `backwardSolid`
- `banknotes`
- `banknotes16Solid`
- `banknotes20Solid`
- `banknotesSolid`
- `bars2`
- `bars216Solid`
- `bars220Solid`
- `bars2Solid`
- `bars3`
- `bars316Solid`
- `bars320Solid`
- `bars3BottomLeft`
- `bars3BottomLeft16Solid`
- `bars3BottomLeft20Solid`
- `bars3BottomLeftSolid`
- `bars3BottomRight`
- `bars3BottomRight16Solid`
- `bars3BottomRight20Solid`
- `bars3BottomRightSolid`
- `bars3CenterLeft`
- `bars3CenterLeft16Solid`
- `bars3CenterLeft20Solid`
- `bars3CenterLeftSolid`
- `bars3Solid`
- `bars4`
- `bars416Solid`
- `bars420Solid`
- `bars4Solid`
- `barsArrowDown`
- `barsArrowDown16Solid`
- `barsArrowDown20Solid`
- `barsArrowDownSolid`
- `barsArrowUp`
- `barsArrowUp16Solid`
- `barsArrowUp20Solid`
- `barsArrowUpSolid`
- `battery0`
- `battery016Solid`
- `battery020Solid`
- `battery0Solid`
- `battery100`
- `battery10016Solid`
- `battery10020Solid`
- `battery100Solid`
- `battery50`
- `battery5016Solid`
- `battery5020Solid`
- `battery50Solid`
- `beaker`
- `beaker16Solid`
- `beaker20Solid`
- `beakerSolid`
- `bell`
- `bell16Solid`
- `bell20Solid`
- `bellAlert`
- `bellAlert16Solid`
- `bellAlert20Solid`
- `bellAlertSolid`
- `bellSlash`
- `bellSlash16Solid`
- `bellSlash20Solid`
- `bellSlashSolid`
- `bellSnooze`
- `bellSnooze16Solid`
- `bellSnooze20Solid`
- `bellSnoozeSolid`
- `bellSolid`
- `bold`
- `bold16Solid`
- `bold20Solid`
- `boldSolid`
- `bolt`
- `bolt16Solid`
- `bolt20Solid`
- `boltSlash`
- `boltSlash16Solid`
- `boltSlash20Solid`
- `boltSlashSolid`
- `boltSolid`
- `bookOpen`
- `bookOpen16Solid`
- `bookOpen20Solid`
- `bookOpenSolid`
- `bookmark`
- `bookmark16Solid`
- `bookmark20Solid`
- `bookmarkSlash`
- `bookmarkSlash16Solid`
- `bookmarkSlash20Solid`
- `bookmarkSlashSolid`
- `bookmarkSolid`
- `bookmarkSquare`
- `bookmarkSquare16Solid`
- `bookmarkSquare20Solid`
- `bookmarkSquareSolid`
- `briefcase`
- `briefcase16Solid`
- `briefcase20Solid`
- `briefcaseSolid`
- `bugAnt`
- `bugAnt16Solid`
- `bugAnt20Solid`
- `bugAntSolid`
- `buildingLibrary`
- `buildingLibrary16Solid`
- `buildingLibrary20Solid`
- `buildingLibrarySolid`
- `buildingOffice`
- `buildingOffice16Solid`
- `buildingOffice2`
- `buildingOffice216Solid`
- `buildingOffice220Solid`
- `buildingOffice2Solid`
- `buildingOffice20Solid`
- `buildingOfficeSolid`
- `buildingStorefront`
- `buildingStorefront16Solid`
- `buildingStorefront20Solid`
- `buildingStorefrontSolid`
- `cake`
- `cake16Solid`
- `cake20Solid`
- `cakeSolid`
- `calculator`
- `calculator16Solid`
- `calculator20Solid`
- `calculatorSolid`
- `calendar`
- `calendar16Solid`
- `calendar20Solid`
- `calendarDateRange`
- `calendarDateRange16Solid`
- `calendarDateRange20Solid`
- `calendarDateRangeSolid`
- `calendarDays`
- `calendarDays16Solid`
- `calendarDays20Solid`
- `calendarDaysSolid`
- `calendarSolid`
- `camera`
- `camera16Solid`
- `camera20Solid`
- `cameraSolid`
- `chartBar`
- `chartBar16Solid`
- `chartBar20Solid`
- `chartBarSolid`
- `chartBarSquare`
- `chartBarSquare16Solid`
- `chartBarSquare20Solid`
- `chartBarSquareSolid`
- `chartPie`
- `chartPie16Solid`
- `chartPie20Solid`
- `chartPieSolid`
- `chatBubbleBottomCenter`
- `chatBubbleBottomCenter16Solid`
- `chatBubbleBottomCenter20Solid`
- `chatBubbleBottomCenterSolid`
- `chatBubbleBottomCenterText`
- `chatBubbleBottomCenterText16Solid`
- `chatBubbleBottomCenterText20Solid`
- `chatBubbleBottomCenterTextSolid`
- `chatBubbleLeft`
- `chatBubbleLeft16Solid`
- `chatBubbleLeft20Solid`
- `chatBubbleLeftEllipsis`
- `chatBubbleLeftEllipsis16Solid`
- `chatBubbleLeftEllipsis20Solid`
- `chatBubbleLeftEllipsisSolid`
- `chatBubbleLeftRight`
- `chatBubbleLeftRight16Solid`
- `chatBubbleLeftRight20Solid`
- `chatBubbleLeftRightSolid`
- `chatBubbleLeftSolid`
- `chatBubbleOvalLeft`
- `chatBubbleOvalLeft16Solid`
- `chatBubbleOvalLeft20Solid`
- `chatBubbleOvalLeftEllipsis`
- `chatBubbleOvalLeftEllipsis16Solid`
- `chatBubbleOvalLeftEllipsis20Solid`
- `chatBubbleOvalLeftEllipsisSolid`
- `chatBubbleOvalLeftSolid`
- `check`
- `check16Solid`
- `check20Solid`
- `checkBadge`
- `checkBadge16Solid`
- `checkBadge20Solid`
- `checkBadgeSolid`
- `checkCircle`
- `checkCircle16Solid`
- `checkCircle20Solid`
- `checkCircleSolid`
- `checkSolid`
- `chevronDoubleDown`
- `chevronDoubleDown16Solid`
- `chevronDoubleDown20Solid`
- `chevronDoubleDownSolid`
- `chevronDoubleLeft`
- `chevronDoubleLeft16Solid`
- `chevronDoubleLeft20Solid`
- `chevronDoubleLeftSolid`
- `chevronDoubleRight`
- `chevronDoubleRight16Solid`
- `chevronDoubleRight20Solid`
- `chevronDoubleRightSolid`
- `chevronDoubleUp`
- `chevronDoubleUp16Solid`
- `chevronDoubleUp20Solid`
- `chevronDoubleUpSolid`
- `chevronDown`
- `chevronDown16Solid`
- `chevronDown20Solid`
- `chevronDownSolid`
- `chevronLeft`
- `chevronLeft16Solid`
- `chevronLeft20Solid`
- `chevronLeftSolid`
- `chevronRight`
- `chevronRight16Solid`
- `chevronRight20Solid`
- `chevronRightSolid`
- `chevronUp`
- `chevronUp16Solid`
- `chevronUp20Solid`
- `chevronUpDown`
- `chevronUpDown16Solid`
- `chevronUpDown20Solid`
- `chevronUpDownSolid`
- `chevronUpSolid`
- `circleStack`
- `circleStack16Solid`
- `circleStack20Solid`
- `circleStackSolid`
- `clipboard`
- `clipboard16Solid`
- `clipboard20Solid`
- `clipboardDocument`
- `clipboardDocument16Solid`
- `clipboardDocument20Solid`
- `clipboardDocumentCheck`
- `clipboardDocumentCheck16Solid`
- `clipboardDocumentCheck20Solid`
- `clipboardDocumentCheckSolid`
- `clipboardDocumentList`
- `clipboardDocumentList16Solid`
- `clipboardDocumentList20Solid`
- `clipboardDocumentListSolid`
- `clipboardDocumentSolid`
- `clipboardSolid`
- `clock`
- `clock16Solid`
- `clock20Solid`
- `clockSolid`
- `cloud`
- `cloud16Solid`
- `cloud20Solid`
- `cloudArrowDown`
- `cloudArrowDown16Solid`
- `cloudArrowDown20Solid`
- `cloudArrowDownSolid`
- `cloudArrowUp`
- `cloudArrowUp16Solid`
- `cloudArrowUp20Solid`
- `cloudArrowUpSolid`
- `cloudSolid`
- `codeBracket`
- `codeBracket16Solid`
- `codeBracket20Solid`
- `codeBracketSolid`
- `codeBracketSquare`
- `codeBracketSquare16Solid`
- `codeBracketSquare20Solid`
- `codeBracketSquareSolid`
- `cog`
- `cog16Solid`
- `cog20Solid`
- `cog6Tooth`
- `cog6Tooth16Solid`
- `cog6Tooth20Solid`
- `cog6ToothSolid`
- `cog8Tooth`
- `cog8Tooth16Solid`
- `cog8Tooth20Solid`
- `cog8ToothSolid`
- `cogSolid`
- `commandLine`
- `commandLine16Solid`
- `commandLine20Solid`
- `commandLineSolid`
- `computerDesktop`
- `computerDesktop16Solid`
- `computerDesktop20Solid`
- `computerDesktopSolid`
- `cpuChip`
- `cpuChip16Solid`
- `cpuChip20Solid`
- `cpuChipSolid`
- `creditCard`
- `creditCard16Solid`
- `creditCard20Solid`
- `creditCardSolid`
- `cube`
- `cube16Solid`
- `cube20Solid`
- `cubeSolid`
- `cubeTransparent`
- `cubeTransparent16Solid`
- `cubeTransparent20Solid`
- `cubeTransparentSolid`
- `currencyBangladeshi`
- `currencyBangladeshi16Solid`
- `currencyBangladeshi20Solid`
- `currencyBangladeshiSolid`
- `currencyDollar`
- `currencyDollar16Solid`
- `currencyDollar20Solid`
- `currencyDollarSolid`
- `currencyEuro`
- `currencyEuro16Solid`
- `currencyEuro20Solid`
- `currencyEuroSolid`
- `currencyPound`
- `currencyPound16Solid`
- `currencyPound20Solid`
- `currencyPoundSolid`
- `currencyRupee`
- `currencyRupee16Solid`
- `currencyRupee20Solid`
- `currencyRupeeSolid`
- `currencyYen`
- `currencyYen16Solid`
- `currencyYen20Solid`
- `currencyYenSolid`
- `cursorArrowRays`
- `cursorArrowRays16Solid`
- `cursorArrowRays20Solid`
- `cursorArrowRaysSolid`
- `cursorArrowRipple`
- `cursorArrowRipple16Solid`
- `cursorArrowRipple20Solid`
- `cursorArrowRippleSolid`
- `devicePhoneMobile`
- `devicePhoneMobile16Solid`
- `devicePhoneMobile20Solid`
- `devicePhoneMobileSolid`
- `deviceTablet`
- `deviceTablet16Solid`
- `deviceTablet20Solid`
- `deviceTabletSolid`
- `divide`
- `divide16Solid`
- `divide20Solid`
- `divideSolid`
- `document`
- `document16Solid`
- `document20Solid`
- `documentArrowDown`
- `documentArrowDown16Solid`
- `documentArrowDown20Solid`
- `documentArrowDownSolid`
- `documentArrowUp`
- `documentArrowUp16Solid`
- `documentArrowUp20Solid`
- `documentArrowUpSolid`
- `documentChartBar`
- `documentChartBar16Solid`
- `documentChartBar20Solid`
- `documentChartBarSolid`
- `documentCheck`
- `documentCheck16Solid`
- `documentCheck20Solid`
- `documentCheckSolid`
- `documentCurrencyBangladeshi`
- `documentCurrencyBangladeshi16Solid`
- `documentCurrencyBangladeshi20Solid`
- `documentCurrencyBangladeshiSolid`
- `documentCurrencyDollar`
- `documentCurrencyDollar16Solid`
- `documentCurrencyDollar20Solid`
- `documentCurrencyDollarSolid`
- `documentCurrencyEuro`
- `documentCurrencyEuro16Solid`
- `documentCurrencyEuro20Solid`
- `documentCurrencyEuroSolid`
- `documentCurrencyPound`
- `documentCurrencyPound16Solid`
- `documentCurrencyPound20Solid`
- `documentCurrencyPoundSolid`
- `documentCurrencyRupee`
- `documentCurrencyRupee16Solid`
- `documentCurrencyRupee20Solid`
- `documentCurrencyRupeeSolid`
- `documentCurrencyYen`
- `documentCurrencyYen16Solid`
- `documentCurrencyYen20Solid`
- `documentCurrencyYenSolid`
- `documentDuplicate`
- `documentDuplicate16Solid`
- `documentDuplicate20Solid`
- `documentDuplicateSolid`
- `documentMagnifyingGlass`
- `documentMagnifyingGlass16Solid`
- `documentMagnifyingGlass20Solid`
- `documentMagnifyingGlassSolid`
- `documentMinus`
- `documentMinus16Solid`
- `documentMinus20Solid`
- `documentMinusSolid`
- `documentPlus`
- `documentPlus16Solid`
- `documentPlus20Solid`
- `documentPlusSolid`
- `documentSolid`
- `documentText`
- `documentText16Solid`
- `documentText20Solid`
- `documentTextSolid`
- `ellipsisHorizontal`
- `ellipsisHorizontal16Solid`
- `ellipsisHorizontal20Solid`
- `ellipsisHorizontalCircle`
- `ellipsisHorizontalCircle16Solid`
- `ellipsisHorizontalCircle20Solid`
- `ellipsisHorizontalCircleSolid`
- `ellipsisHorizontalSolid`
- `ellipsisVertical`
- `ellipsisVertical16Solid`
- `ellipsisVertical20Solid`
- `ellipsisVerticalSolid`
- `envelope`
- `envelope16Solid`
- `envelope20Solid`
- `envelopeOpen`
- `envelopeOpen16Solid`
- `envelopeOpen20Solid`
- `envelopeOpenSolid`
- `envelopeSolid`
- `equals`
- `equals16Solid`
- `equals20Solid`
- `equalsSolid`
- `exclamationCircle`
- `exclamationCircle16Solid`
- `exclamationCircle20Solid`
- `exclamationCircleSolid`
- `exclamationTriangle`
- `exclamationTriangle16Solid`
- `exclamationTriangle20Solid`
- `exclamationTriangleSolid`
- `eye`
- `eye16Solid`
- `eye20Solid`
- `eyeDropper`
- `eyeDropper16Solid`
- `eyeDropper20Solid`
- `eyeDropperSolid`
- `eyeSlash`
- `eyeSlash16Solid`
- `eyeSlash20Solid`
- `eyeSlashSolid`
- `eyeSolid`
- `faceFrown`
- `faceFrown16Solid`
- `faceFrown20Solid`
- `faceFrownSolid`
- `faceSmile`
- `faceSmile16Solid`
- `faceSmile20Solid`
- `faceSmileSolid`
- `film`
- `film16Solid`
- `film20Solid`
- `filmSolid`
- `fingerPrint`
- `fingerPrint16Solid`
- `fingerPrint20Solid`
- `fingerPrintSolid`
- `fire`
- `fire16Solid`
- `fire20Solid`
- `fireSolid`
- `flag`
- `flag16Solid`
- `flag20Solid`
- `flagSolid`
- `folder`
- `folder16Solid`
- `folder20Solid`
- `folderArrowDown`
- `folderArrowDown16Solid`
- `folderArrowDown20Solid`
- `folderArrowDownSolid`
- `folderMinus`
- `folderMinus16Solid`
- `folderMinus20Solid`
- `folderMinusSolid`
- `folderOpen`
- `folderOpen16Solid`
- `folderOpen20Solid`
- `folderOpenSolid`
- `folderPlus`
- `folderPlus16Solid`
- `folderPlus20Solid`
- `folderPlusSolid`
- `folderSolid`
- `forward`
- `forward16Solid`
- `forward20Solid`
- `forwardSolid`
- `funnel`
- `funnel16Solid`
- `funnel20Solid`
- `funnelSolid`
- `gif`
- `gif16Solid`
- `gif20Solid`
- `gifSolid`
- `gift`
- `gift16Solid`
- `gift20Solid`
- `giftSolid`
- `giftTop`
- `giftTop16Solid`
- `giftTop20Solid`
- `giftTopSolid`
- `globeAlt`
- `globeAlt16Solid`
- `globeAlt20Solid`
- `globeAltSolid`
- `globeAmericas`
- `globeAmericas16Solid`
- `globeAmericas20Solid`
- `globeAmericasSolid`
- `globeAsiaAustralia`
- `globeAsiaAustralia16Solid`
- `globeAsiaAustralia20Solid`
- `globeAsiaAustraliaSolid`
- `globeEuropeAfrica`
- `globeEuropeAfrica16Solid`
- `globeEuropeAfrica20Solid`
- `globeEuropeAfricaSolid`
- `h1`
- `h116Solid`
- `h120Solid`
- `h1Solid`
- `h2`
- `h216Solid`
- `h220Solid`
- `h2Solid`
- `h3`
- `h316Solid`
- `h320Solid`
- `h3Solid`
- `handRaised`
- `handRaised16Solid`
- `handRaised20Solid`
- `handRaisedSolid`
- `handThumbDown`
- `handThumbDown16Solid`
- `handThumbDown20Solid`
- `handThumbDownSolid`
- `handThumbUp`
- `handThumbUp16Solid`
- `handThumbUp20Solid`
- `handThumbUpSolid`
- `hashtag`
- `hashtag16Solid`
- `hashtag20Solid`
- `hashtagSolid`
- `heart`
- `heart16Solid`
- `heart20Solid`
- `heartSolid`
- `home`
- `home16Solid`
- `home20Solid`
- `homeModern`
- `homeModern16Solid`
- `homeModern20Solid`
- `homeModernSolid`
- `homeSolid`
- `identification`
- `identification16Solid`
- `identification20Solid`
- `identificationSolid`
- `inbox`
- `inbox16Solid`
- `inbox20Solid`
- `inboxArrowDown`
- `inboxArrowDown16Solid`
- `inboxArrowDown20Solid`
- `inboxArrowDownSolid`
- `inboxSolid`
- `inboxStack`
- `inboxStack16Solid`
- `inboxStack20Solid`
- `inboxStackSolid`
- `informationCircle`
- `informationCircle16Solid`
- `informationCircle20Solid`
- `informationCircleSolid`
- `italic`
- `italic16Solid`
- `italic20Solid`
- `italicSolid`
- `key`
- `key16Solid`
- `key20Solid`
- `keySolid`
- `language`
- `language16Solid`
- `language20Solid`
- `languageSolid`
- `lifebuoy`
- `lifebuoy16Solid`
- `lifebuoy20Solid`
- `lifebuoySolid`
- `lightBulb`
- `lightBulb16Solid`
- `lightBulb20Solid`
- `lightBulbSolid`
- `link`
- `link16Solid`
- `link20Solid`
- `linkSlash`
- `linkSlash16Solid`
- `linkSlash20Solid`
- `linkSlashSolid`
- `linkSolid`
- `listBullet`
- `listBullet16Solid`
- `listBullet20Solid`
- `listBulletSolid`
- `lockClosed`
- `lockClosed16Solid`
- `lockClosed20Solid`
- `lockClosedSolid`
- `lockOpen`
- `lockOpen16Solid`
- `lockOpen20Solid`
- `lockOpenSolid`
- `magnifyingGlass`
- `magnifyingGlass16Solid`
- `magnifyingGlass20Solid`
- `magnifyingGlassCircle`
- `magnifyingGlassCircle16Solid`
- `magnifyingGlassCircle20Solid`
- `magnifyingGlassCircleSolid`
- `magnifyingGlassMinus`
- `magnifyingGlassMinus16Solid`
- `magnifyingGlassMinus20Solid`
- `magnifyingGlassMinusSolid`
- `magnifyingGlassPlus`
- `magnifyingGlassPlus16Solid`
- `magnifyingGlassPlus20Solid`
- `magnifyingGlassPlusSolid`
- `magnifyingGlassSolid`
- `map`
- `map16Solid`
- `map20Solid`
- `mapPin`
- `mapPin16Solid`
- `mapPin20Solid`
- `mapPinSolid`
- `mapSolid`
- `megaphone`
- `megaphone16Solid`
- `megaphone20Solid`
- `megaphoneSolid`
- `microphone`
- `microphone16Solid`
- `microphone20Solid`
- `microphoneSolid`
- `minus`
- `minus16Solid`
- `minus20Solid`
- `minusCircle`
- `minusCircle16Solid`
- `minusCircle20Solid`
- `minusCircleSolid`
- `minusSmall`
- `minusSmall20Solid`
- `minusSmallSolid`
- `minusSolid`
- `moon`
- `moon16Solid`
- `moon20Solid`
- `moonSolid`
- `musicalNote`
- `musicalNote16Solid`
- `musicalNote20Solid`
- `musicalNoteSolid`
- `newspaper`
- `newspaper16Solid`
- `newspaper20Solid`
- `newspaperSolid`
- `noSymbol`
- `noSymbol16Solid`
- `noSymbol20Solid`
- `noSymbolSolid`
- `numberedList`
- `numberedList16Solid`
- `numberedList20Solid`
- `numberedListSolid`
- `paintBrush`
- `paintBrush16Solid`
- `paintBrush20Solid`
- `paintBrushSolid`
- `paperAirplane`
- `paperAirplane16Solid`
- `paperAirplane20Solid`
- `paperAirplaneSolid`
- `paperClip`
- `paperClip16Solid`
- `paperClip20Solid`
- `paperClipSolid`
- `pause`
- `pause16Solid`
- `pause20Solid`
- `pauseCircle`
- `pauseCircle16Solid`
- `pauseCircle20Solid`
- `pauseCircleSolid`
- `pauseSolid`
- `pencil`
- `pencil16Solid`
- `pencil20Solid`
- `pencilSolid`
- `pencilSquare`
- `pencilSquare16Solid`
- `pencilSquare20Solid`
- `pencilSquareSolid`
- `percentBadge`
- `percentBadge16Solid`
- `percentBadge20Solid`
- `percentBadgeSolid`
- `phone`
- `phone16Solid`
- `phone20Solid`
- `phoneArrowDownLeft`
- `phoneArrowDownLeft16Solid`
- `phoneArrowDownLeft20Solid`
- `phoneArrowDownLeftSolid`
- `phoneArrowUpRight`
- `phoneArrowUpRight16Solid`
- `phoneArrowUpRight20Solid`
- `phoneArrowUpRightSolid`
- `phoneSolid`
- `phoneXMark`
- `phoneXMark16Solid`
- `phoneXMark20Solid`
- `phoneXMarkSolid`
- `photo`
- `photo16Solid`
- `photo20Solid`
- `photoSolid`
- `play`
- `play16Solid`
- `play20Solid`
- `playCircle`
- `playCircle16Solid`
- `playCircle20Solid`
- `playCircleSolid`
- `playPause`
- `playPause16Solid`
- `playPause20Solid`
- `playPauseSolid`
- `playSolid`
- `plus`
- `plus16Solid`
- `plus20Solid`
- `plusCircle`
- `plusCircle16Solid`
- `plusCircle20Solid`
- `plusCircleSolid`
- `plusSmall`
- `plusSmall20Solid`
- `plusSmallSolid`
- `plusSolid`
- `power`
- `power16Solid`
- `power20Solid`
- `powerSolid`
- `presentationChartBar`
- `presentationChartBar16Solid`
- `presentationChartBar20Solid`
- `presentationChartBarSolid`
- `presentationChartLine`
- `presentationChartLine16Solid`
- `presentationChartLine20Solid`
- `presentationChartLineSolid`
- `printer`
- `printer16Solid`
- `printer20Solid`
- `printerSolid`
- `puzzlePiece`
- `puzzlePiece16Solid`
- `puzzlePiece20Solid`
- `puzzlePieceSolid`
- `qrCode`
- `qrCode16Solid`
- `qrCode20Solid`
- `qrCodeSolid`
- `questionMarkCircle`
- `questionMarkCircle16Solid`
- `questionMarkCircle20Solid`
- `questionMarkCircleSolid`
- `queueList`
- `queueList16Solid`
- `queueList20Solid`
- `queueListSolid`
- `radio`
- `radio16Solid`
- `radio20Solid`
- `radioSolid`
- `receiptPercent`
- `receiptPercent16Solid`
- `receiptPercent20Solid`
- `receiptPercentSolid`
- `receiptRefund`
- `receiptRefund16Solid`
- `receiptRefund20Solid`
- `receiptRefundSolid`
- `rectangleGroup`
- `rectangleGroup16Solid`
- `rectangleGroup20Solid`
- `rectangleGroupSolid`
- `rectangleStack`
- `rectangleStack16Solid`
- `rectangleStack20Solid`
- `rectangleStackSolid`
- `rocketLaunch`
- `rocketLaunch16Solid`
- `rocketLaunch20Solid`
- `rocketLaunchSolid`
- `rss`
- `rss16Solid`
- `rss20Solid`
- `rssSolid`
- `scale`
- `scale16Solid`
- `scale20Solid`
- `scaleSolid`
- `scissors`
- `scissors16Solid`
- `scissors20Solid`
- `scissorsSolid`
- `server`
- `server16Solid`
- `server20Solid`
- `serverSolid`
- `serverStack`
- `serverStack16Solid`
- `serverStack20Solid`
- `serverStackSolid`
- `share`
- `share16Solid`
- `share20Solid`
- `shareSolid`
- `shieldCheck`
- `shieldCheck16Solid`
- `shieldCheck20Solid`
- `shieldCheckSolid`
- `shieldExclamation`
- `shieldExclamation16Solid`
- `shieldExclamation20Solid`
- `shieldExclamationSolid`
- `shoppingBag`
- `shoppingBag16Solid`
- `shoppingBag20Solid`
- `shoppingBagSolid`
- `shoppingCart`
- `shoppingCart16Solid`
- `shoppingCart20Solid`
- `shoppingCartSolid`
- `signal`
- `signal16Solid`
- `signal20Solid`
- `signalSlash`
- `signalSlash16Solid`
- `signalSlash20Solid`
- `signalSlashSolid`
- `signalSolid`
- `slash`
- `slash16Solid`
- `slash20Solid`
- `slashSolid`
- `sparkles`
- `sparkles16Solid`
- `sparkles20Solid`
- `sparklesSolid`
- `speakerWave`
- `speakerWave16Solid`
- `speakerWave20Solid`
- `speakerWaveSolid`
- `speakerXMark`
- `speakerXMark16Solid`
- `speakerXMark20Solid`
- `speakerXMarkSolid`
- `square2Stack`
- `square2Stack16Solid`
- `square2Stack20Solid`
- `square2StackSolid`
- `square3Stack3d`
- `square3Stack3d16Solid`
- `square3Stack3d20Solid`
- `square3Stack3dSolid`
- `squares2x2`
- `squares2x216Solid`
- `squares2x220Solid`
- `squares2x2Solid`
- `squaresPlus`
- `squaresPlus16Solid`
- `squaresPlus20Solid`
- `squaresPlusSolid`
- `star`
- `star16Solid`
- `star20Solid`
- `starSolid`
- `stop`
- `stop16Solid`
- `stop20Solid`
- `stopCircle`
- `stopCircle16Solid`
- `stopCircle20Solid`
- `stopCircleSolid`
- `stopSolid`
- `strikethrough`
- `strikethrough16Solid`
- `strikethrough20Solid`
- `strikethroughSolid`
- `sun`
- `sun16Solid`
- `sun20Solid`
- `sunSolid`
- `swatch`
- `swatch16Solid`
- `swatch20Solid`
- `swatchSolid`
- `tableCells`
- `tableCells16Solid`
- `tableCells20Solid`
- `tableCellsSolid`
- `tag`
- `tag16Solid`
- `tag20Solid`
- `tagSolid`
- `ticket`
- `ticket16Solid`
- `ticket20Solid`
- `ticketSolid`
- `trash`
- `trash16Solid`
- `trash20Solid`
- `trashSolid`
- `trophy`
- `trophy16Solid`
- `trophy20Solid`
- `trophySolid`
- `truck`
- `truck16Solid`
- `truck20Solid`
- `truckSolid`
- `tv`
- `tv16Solid`
- `tv20Solid`
- `tvSolid`
- `underline`
- `underline16Solid`
- `underline20Solid`
- `underlineSolid`
- `user`
- `user16Solid`
- `user20Solid`
- `userCircle`
- `userCircle16Solid`
- `userCircle20Solid`
- `userCircleSolid`
- `userGroup`
- `userGroup16Solid`
- `userGroup20Solid`
- `userGroupSolid`
- `userMinus`
- `userMinus16Solid`
- `userMinus20Solid`
- `userMinusSolid`
- `userPlus`
- `userPlus16Solid`
- `userPlus20Solid`
- `userPlusSolid`
- `userSolid`
- `users`
- `users16Solid`
- `users20Solid`
- `usersSolid`
- `variable`
- `variable16Solid`
- `variable20Solid`
- `variableSolid`
- `videoCamera`
- `videoCamera16Solid`
- `videoCamera20Solid`
- `videoCameraSlash`
- `videoCameraSlash16Solid`
- `videoCameraSlash20Solid`
- `videoCameraSlashSolid`
- `videoCameraSolid`
- `viewColumns`
- `viewColumns16Solid`
- `viewColumns20Solid`
- `viewColumnsSolid`
- `viewfinderCircle`
- `viewfinderCircle16Solid`
- `viewfinderCircle20Solid`
- `viewfinderCircleSolid`
- `wallet`
- `wallet16Solid`
- `wallet20Solid`
- `walletSolid`
- `wifi`
- `wifi16Solid`
- `wifi20Solid`
- `wifiSolid`
- `window`
- `window16Solid`
- `window20Solid`
- `windowSolid`
- `wrench`
- `wrench16Solid`
- `wrench20Solid`
- `wrenchScrewdriver`
- `wrenchScrewdriver16Solid`
- `wrenchScrewdriver20Solid`
- `wrenchScrewdriverSolid`
- `wrenchSolid`
- `xCircle`
- `xCircle16Solid`
- `xCircle20Solid`
- `xCircleSolid`
- `xMark`
- `xMark16Solid`
- `xMark20Solid`
- `xMarkSolid`

## Usage Examples

### Navigation Menu

```html
@js
  import { AcademicCapIcon, AcademicCap16SolidIcon, AcademicCap20SolidIcon, AcademicCapSolidIcon } from '@stacksjs/iconify-heroicons'

  global.navIcons = {
    home: AcademicCapIcon({ size: 20, class: 'nav-icon' }),
    about: AcademicCap16SolidIcon({ size: 20, class: 'nav-icon' }),
    contact: AcademicCap20SolidIcon({ size: 20, class: 'nav-icon' }),
    settings: AcademicCapSolidIcon({ size: 20, class: 'nav-icon' })
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
import { AcademicCapIcon } from '@stacksjs/iconify-heroicons'

const icon = AcademicCapIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AcademicCapIcon, AcademicCap16SolidIcon, AcademicCap20SolidIcon } from '@stacksjs/iconify-heroicons'

const successIcon = AcademicCapIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcademicCap16SolidIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AcademicCap20SolidIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AcademicCapIcon, AcademicCap16SolidIcon } from '@stacksjs/iconify-heroicons'
   const icon = AcademicCapIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { academicCap, academicCap16Solid } from '@stacksjs/iconify-heroicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(academicCap, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AcademicCapIcon, AcademicCap16SolidIcon } from '@stacksjs/iconify-heroicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-heroicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AcademicCapIcon } from '@stacksjs/iconify-heroicons'
     global.icon = AcademicCapIcon({ size: 24 })
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
   const icon = AcademicCapIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { academicCap } from '@stacksjs/iconify-heroicons'

// Icons are typed as IconData
const myIcon: IconData = academicCap
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/heroicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/heroicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
