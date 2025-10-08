# Sargam Icons

> Sargam Icons icons for stx from Iconify

## Overview

This package provides access to 1188 icons from the Sargam Icons collection through the stx iconify integration.

**Collection ID:** `si`
**Total Icons:** 1188
**Author:** Abhimanyu Rana ([Website](https://github.com/planetabhi/sargam-icons))
**License:** MIT ([Details](https://github.com/planetabhi/sargam-icons/blob/main/LICENSE.txt))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-si
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActionsDuotoneIcon, ActionsFillIcon, ActionsLineIcon } from '@stacksjs/iconify-si'

// Basic usage
const icon = ActionsDuotoneIcon()

// With size
const sizedIcon = ActionsDuotoneIcon({ size: 24 })

// With color
const coloredIcon = ActionsFillIcon({ color: 'red' })

// With multiple props
const customIcon = ActionsLineIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActionsDuotoneIcon, ActionsFillIcon, ActionsLineIcon } from '@stacksjs/iconify-si'

  global.icons = {
    home: ActionsDuotoneIcon({ size: 24 }),
    user: ActionsFillIcon({ size: 24, color: '#4a90e2' }),
    settings: ActionsLineIcon({ size: 32 })
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
import { actionsDuotone, actionsFill, actionsLine } from '@stacksjs/iconify-si'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(actionsDuotone, { size: 24 })
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
const redIcon = ActionsDuotoneIcon({ color: 'red' })
const blueIcon = ActionsDuotoneIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ActionsDuotoneIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ActionsDuotoneIcon({ class: 'text-primary' })
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
const icon24 = ActionsDuotoneIcon({ size: 24 })
const icon1em = ActionsDuotoneIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ActionsDuotoneIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ActionsDuotoneIcon({ height: '1em' })
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
const smallIcon = ActionsDuotoneIcon({ class: 'icon-small' })
const largeIcon = ActionsDuotoneIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1188** icons:

- `actionsDuotone`
- `actionsFill`
- `actionsLine`
- `addAlarmDuotone`
- `addAlarmFill`
- `addAlarmLine`
- `addCircleDuotone`
- `addCircleFill`
- `addCircleLine`
- `addDuotone`
- `addFill`
- `addLine`
- `addSquareDuotone`
- `addSquareFill`
- `addSquareLine`
- `addToLibraryDuotone`
- `addToLibraryFill`
- `addToLibraryLine`
- `addToPlaylistDuotone`
- `addToPlaylistFill`
- `addToPlaylistLine`
- `aiAlt1Duotone`
- `aiAlt1Fill`
- `aiAlt1Line`
- `aiArchiveDuotone`
- `aiArchiveFill`
- `aiArchiveLine`
- `aiBriefcaseDuotone`
- `aiBriefcaseFill`
- `aiBriefcaseLine`
- `aiChatDuotone`
- `aiChatFill`
- `aiChatLine`
- `aiChecklistDuotone`
- `aiChecklistFill`
- `aiChecklistLine`
- `aiDuotone`
- `aiEditAlt1Duotone`
- `aiEditAlt1Fill`
- `aiEditAlt1Line`
- `aiEditAlt2Duotone`
- `aiEditAlt2Fill`
- `aiEditAlt2Line`
- `aiEditDuotone`
- `aiEditFill`
- `aiEditLine`
- `aiFill`
- `aiInventoryDuotone`
- `aiInventoryFill`
- `aiInventoryLine`
- `aiLine`
- `aiLockDuotone`
- `aiLockFill`
- `aiLockLine`
- `aiMonitorDuotone`
- `aiMonitorFill`
- `aiMonitorLine`
- `aiNote1Duotone`
- `aiNote1Fill`
- `aiNote1Line`
- `aiNoteAlt11Duotone`
- `aiNoteAlt11Fill`
- `aiNoteAlt11Line`
- `aiNoteAlt1Duotone`
- `aiNoteAlt1Fill`
- `aiNoteAlt1Line`
- `aiNoteDuotone`
- `aiNoteFill`
- `aiNoteLine`
- `aiPhoneAlt1Duotone`
- `aiPhoneAlt1Fill`
- `aiPhoneAlt1Line`
- `aiPhoneDuotone`
- `aiPhoneFill`
- `aiPhoneLine`
- `aiScanDuotone`
- `aiScanFill`
- `aiScanLine`
- `aiSearchDuotone`
- `aiSearchFill`
- `aiSearchLine`
- `aiShieldDuotone`
- `aiShieldFill`
- `aiShieldLine`
- `aiSmartphoneDuotone`
- `aiSmartphoneFill`
- `aiSmartphoneLine`
- `aiSortAlt1Duotone`
- `aiSortAlt1Fill`
- `aiSortAlt1Line`
- `aiSortDuotone`
- `aiSortFill`
- `aiSortLine`
- `aiSummarizeAltDuotone`
- `aiSummarizeAltFill`
- `aiSummarizeAltLine`
- `aiSummarizeDuotone`
- `aiSummarizeFill`
- `aiSummarizeLine`
- `aiUnlockDuotone`
- `aiUnlockFill`
- `aiUnlockLine`
- `airplaneAltDuotone`
- `airplaneAltFill`
- `airplaneAltLine`
- `airplaneDuotone`
- `airplaneFill`
- `airplaneLine`
- `albumDuotone`
- `albumFill`
- `albumLine`
- `alertDuotone`
- `alertFill`
- `alertLine`
- `alignBottomDetailedDuotone`
- `alignBottomDetailedFill`
- `alignBottomDetailedLine`
- `alignBottomSimpleDuotone`
- `alignBottomSimpleFill`
- `alignBottomSimpleLine`
- `alignCenterDuotone`
- `alignCenterFill`
- `alignCenterLine`
- `alignHorizCenterDetailedDuotone`
- `alignHorizCenterDetailedFill`
- `alignHorizCenterDetailedLine`
- `alignHorizCenterSimpleDuotone`
- `alignHorizCenterSimpleFill`
- `alignHorizCenterSimpleLine`
- `alignJustifyDuotone`
- `alignJustifyFill`
- `alignJustifyLine`
- `alignLeftDetailedDuotone`
- `alignLeftDetailedFill`
- `alignLeftDetailedLine`
- `alignLeftDuotone`
- `alignLeftFill`
- `alignLeftLine`
- `alignLeftSimpleDuotone`
- `alignLeftSimpleFill`
- `alignLeftSimpleLine`
- `alignRightDetailedDuotone`
- `alignRightDetailedFill`
- `alignRightDetailedLine`
- `alignRightDuotone`
- `alignRightFill`
- `alignRightLine`
- `alignRightSimpleDuotone`
- `alignRightSimpleFill`
- `alignRightSimpleLine`
- `alignTopDetailedDuotone`
- `alignTopDetailedFill`
- `alignTopDetailedLine`
- `alignTopSimpleDuotone`
- `alignTopSimpleFill`
- `alignTopSimpleLine`
- `alignVertCenterDetailedDuotone`
- `alignVertCenterDetailedFill`
- `alignVertCenterDetailedLine`
- `alignVertCenterSimpleDuotone`
- `alignVertCenterSimpleFill`
- `alignVertCenterSimpleLine`
- `appleDuotone`
- `appleFill`
- `appleLine`
- `archiveAltDuotone`
- `archiveAltFill`
- `archiveAltLine`
- `archiveDuotone`
- `archiveFill`
- `archiveLine`
- `arrowDownwardCircleDuotone`
- `arrowDownwardCircleFill`
- `arrowDownwardCircleLine`
- `arrowDownwardDuotone`
- `arrowDownwardFill`
- `arrowDownwardLine`
- `arrowDownwardSquareDuotone`
- `arrowDownwardSquareFill`
- `arrowDownwardSquareLine`
- `arrowLeftCircleDuotone`
- `arrowLeftCircleFill`
- `arrowLeftCircleLine`
- `arrowLeftDuotone`
- `arrowLeftFill`
- `arrowLeftLine`
- `arrowLeftSquareDuotone`
- `arrowLeftSquareFill`
- `arrowLeftSquareLine`
- `arrowRightCircleDuotone`
- `arrowRightCircleFill`
- `arrowRightCircleLine`
- `arrowRightDuotone`
- `arrowRightFill`
- `arrowRightLine`
- `arrowRightSquareDuotone`
- `arrowRightSquareFill`
- `arrowRightSquareLine`
- `arrowUpwardCircleDuotone`
- `arrowUpwardCircleFill`
- `arrowUpwardCircleLine`
- `arrowUpwardDuotone`
- `arrowUpwardFill`
- `arrowUpwardLine`
- `arrowUpwardSquareDuotone`
- `arrowUpwardSquareFill`
- `arrowUpwardSquareLine`
- `articleDuotone`
- `articleFill`
- `articleLine`
- `assignmentDuotone`
- `assignmentFill`
- `assignmentLine`
- `attachmentDuotone`
- `attachmentFill`
- `attachmentLine`
- `ballotDuotone`
- `ballotFill`
- `ballotLine`
- `barcodeDuotone`
- `barcodeFill`
- `barcodeLine`
- `barcodeScanAltDuotone`
- `barcodeScanAltFill`
- `barcodeScanAltLine`
- `barcodeScanDuotone`
- `barcodeScanFill`
- `barcodeScanLine`
- `binDuotone`
- `binFill`
- `binLine`
- `bluetoothDuotone`
- `bluetoothFill`
- `bluetoothLine`
- `boldDuotone`
- `boldFill`
- `boldLine`
- `bookmarkDuotone`
- `bookmarkFill`
- `bookmarkLine`
- `briefcaseDetailedDuotone`
- `briefcaseDetailedFill`
- `briefcaseDetailedLine`
- `briefcaseDuotone`
- `briefcaseFill`
- `briefcaseLine`
- `briefcaseMedicalDuotone`
- `briefcaseMedicalFill`
- `briefcaseMedicalLine`
- `briefcasesDuotone`
- `briefcasesFill`
- `briefcasesLine`
- `buildingAlt1Duotone`
- `buildingAlt1Fill`
- `buildingAlt1Line`
- `buildingAlt2Duotone`
- `buildingAlt2Fill`
- `buildingAlt2Line`
- `buildingAlt3Duotone`
- `buildingAlt3Fill`
- `buildingAlt3Line`
- `buildingDuotone`
- `buildingFill`
- `buildingLine`
- `busDuotone`
- `busFill`
- `busLine`
- `cancelPhotoDuotone`
- `cancelPhotoFill`
- `cancelPhotoLine`
- `cancelPresentationDuotone`
- `cancelPresentationFill`
- `cancelPresentationLine`
- `castleAlt1Duotone`
- `castleAlt1Fill`
- `castleAlt1Line`
- `castleDuotone`
- `castleFill`
- `castleLine`
- `chatDuotone`
- `chatFill`
- `chatLine`
- `chatTextDuotone`
- `chatTextFill`
- `chatTextLine`
- `checkAltDuotone`
- `checkAltFill`
- `checkAltLine`
- `checkCircleDuotone`
- `checkCircleFill`
- `checkCircleLine`
- `checkDuotone`
- `checkFill`
- `checkLine`
- `checkSquareDuotone`
- `checkSquareFill`
- `checkSquareLine`
- `checklistAltDuotone`
- `checklistAltFill`
- `checklistAltLine`
- `checklistDuotone`
- `checklistFill`
- `checklistLine`
- `chevronLeftAltDuotone`
- `chevronLeftAltFill`
- `chevronLeftAltLine`
- `chevronLeftCircleDuotone`
- `chevronLeftCircleFill`
- `chevronLeftCircleLine`
- `chevronLeftDuotone`
- `chevronLeftFill`
- `chevronLeftLine`
- `chevronLeftSquareDuotone`
- `chevronLeftSquareFill`
- `chevronLeftSquareLine`
- `chevronRightAltDuotone`
- `chevronRightAltFill`
- `chevronRightAltLine`
- `chevronRightCircleDuotone`
- `chevronRightCircleFill`
- `chevronRightCircleLine`
- `chevronRightDuotone`
- `chevronRightFill`
- `chevronRightLine`
- `chevronRightSquareDuotone`
- `chevronRightSquareFill`
- `chevronRightSquareLine`
- `cityDuotone`
- `cityFill`
- `cityLine`
- `clearAllDuotone`
- `clearAllFill`
- `clearAllLine`
- `clearDayDuotone`
- `clearDayFill`
- `clearDayLine`
- `clipboardAltDuotone`
- `clipboardAltFill`
- `clipboardAltLine`
- `clipboardCheckAltDuotone`
- `clipboardCheckAltFill`
- `clipboardCheckAltLine`
- `clipboardCheckDuotone`
- `clipboardCheckFill`
- `clipboardCheckLine`
- `clipboardDuotone`
- `clipboardFill`
- `clipboardFilledAltDuotone`
- `clipboardFilledAltFill`
- `clipboardFilledAltLine`
- `clipboardFilledDuotone`
- `clipboardFilledFill`
- `clipboardFilledLine`
- `clipboardLine`
- `clockAltDuotone`
- `clockAltFill`
- `clockAltLine`
- `clockDuotone`
- `clockFill`
- `clockLine`
- `closeCircleDuotone`
- `closeCircleFill`
- `closeCircleLine`
- `closeDuotone`
- `closeFill`
- `closeLine`
- `closeSquareDuotone`
- `closeSquareFill`
- `closeSquareLine`
- `cloudDuotone`
- `cloudFill`
- `cloudLine`
- `codeDuotone`
- `codeFill`
- `codeLine`
- `codeMutedDuotone`
- `codeMutedFill`
- `codeMutedLine`
- `columnsDuotone`
- `columnsFill`
- `columnsLine`
- `copyAltDuotone`
- `copyAltFill`
- `copyAltLine`
- `copyDuotone`
- `copyFill`
- `copyLine`
- `copyrightAltDuotone`
- `copyrightAltFill`
- `copyrightAltLine`
- `copyrightDuotone`
- `copyrightFill`
- `copyrightLine`
- `creditCardDetailedAltDuotone`
- `creditCardDetailedAltFill`
- `creditCardDetailedAltLine`
- `creditCardDetailedDuotone`
- `creditCardDetailedFill`
- `creditCardDetailedLine`
- `creditCardDuotone`
- `creditCardFill`
- `creditCardLine`
- `crosshairDetailedDuotone`
- `crosshairDetailedFill`
- `crosshairDetailedLine`
- `crosshairSimpleDuotone`
- `crosshairSimpleFill`
- `crosshairSimpleLine`
- `dangerousDuotone`
- `dangerousFill`
- `dangerousLine`
- `dashboardCustomizeDuotone`
- `dashboardCustomizeFill`
- `dashboardCustomizeLine`
- `dashboardDuotone`
- `dashboardFill`
- `dashboardHorzDuotone`
- `dashboardHorzFill`
- `dashboardHorzLine`
- `dashboardLine`
- `dashboardVertDuotone`
- `dashboardVertFill`
- `dashboardVertLine`
- `deleteAlarmDuotone`
- `deleteAlarmFill`
- `deleteAlarmLine`
- `diamondsFourDuotone`
- `diamondsFourFill`
- `diamondsFourLine`
- `directionAltDuotone`
- `directionAltFill`
- `directionAltLine`
- `directionDuotone`
- `directionFill`
- `directionLine`
- `dollarAlt1Duotone`
- `dollarAlt1Fill`
- `dollarAlt1Line`
- `dollarAlt2Duotone`
- `dollarAlt2Fill`
- `dollarAlt2Line`
- `dollarDuotone`
- `dollarFill`
- `dollarLine`
- `doubleArrowRightDuotone`
- `doubleArrowRightFill`
- `doubleArrowRightLine`
- `downLeftDuotone`
- `downLeftFill`
- `downLeftLine`
- `downRightDuotone`
- `downRightFill`
- `downRightLine`
- `downTwoHeadedDuotone`
- `downTwoHeadedFill`
- `downTwoHeadedLine`
- `downloadOfflineDuotone`
- `downloadOfflineFill`
- `downloadOfflineLine`
- `dragHandleDuotone`
- `dragHandleFill`
- `dragHandleLine`
- `dragIndicatorAltDuotone`
- `dragIndicatorAltFill`
- `dragIndicatorAltLine`
- `dragIndicatorDuotone`
- `dragIndicatorFill`
- `dragIndicatorLine`
- `editDetailedAltDuotone`
- `editDetailedAltFill`
- `editDetailedAltLine`
- `editDetailedDuotone`
- `editDetailedFill`
- `editDetailedLine`
- `editSimpleDuotone`
- `editSimpleFill`
- `editSimpleLine`
- `ejectDuotone`
- `ejectFill`
- `ejectLine`
- `emojiAltDuotone`
- `emojiAltFill`
- `emojiAltLine`
- `emojiDuotone`
- `emojiFill`
- `emojiLine`
- `equalizerDuotone`
- `equalizerFill`
- `equalizerLine`
- `errorDuotone`
- `errorFill`
- `errorLine`
- `expandLessAltDuotone`
- `expandLessAltFill`
- `expandLessAltLine`
- `expandLessCircleDuotone`
- `expandLessCircleFill`
- `expandLessCircleLine`
- `expandLessDuotone`
- `expandLessFill`
- `expandLessLine`
- `expandLessSquareDuotone`
- `expandLessSquareFill`
- `expandLessSquareLine`
- `expandMoreAltDuotone`
- `expandMoreAltFill`
- `expandMoreAltLine`
- `expandMoreCircleDuotone`
- `expandMoreCircleFill`
- `expandMoreCircleLine`
- `expandMoreDuotone`
- `expandMoreFill`
- `expandMoreLine`
- `expandMoreSquareDuotone`
- `expandMoreSquareFill`
- `expandMoreSquareLine`
- `factCheckDuotone`
- `factCheckFill`
- `factCheckLine`
- `featuredPlaylistDuotone`
- `featuredPlaylistFill`
- `featuredPlaylistLine`
- `fileDownloadDuotone`
- `fileDownloadFill`
- `fileDownloadLine`
- `fileUploadDuotone`
- `fileUploadFill`
- `fileUploadLine`
- `filterListAltDuotone`
- `filterListAltFill`
- `filterListAltLine`
- `filterListDuotone`
- `filterListFill`
- `filterListLine`
- `filterNoneDuotone`
- `filterNoneFill`
- `filterNoneLine`
- `flagAlt1Duotone`
- `flagAlt1Fill`
- `flagAlt1Line`
- `flagAlt2Duotone`
- `flagAlt2Fill`
- `flagAlt2Line`
- `flagAlt3Duotone`
- `flagAlt3Fill`
- `flagAlt3Line`
- `flagAlt4Duotone`
- `flagAlt4Fill`
- `flagAlt4Line`
- `flagDuotone`
- `flagFill`
- `flagLine`
- `flareDuotone`
- `flareFill`
- `flareLine`
- `flowLineDuotone`
- `flowLineFill`
- `flowLineLine`
- `flowParallelDuotone`
- `flowParallelFill`
- `flowParallelLine`
- `globeDetailedDuotone`
- `globeDetailedFill`
- `globeDetailedLine`
- `gridDuotone`
- `gridFill`
- `gridLine`
- `gridOnDuotone`
- `gridOnFill`
- `gridOnLine`
- `gridViewDuotone`
- `gridViewFill`
- `gridViewLine`
- `hammerAltDuotone`
- `hammerAltFill`
- `hammerAltLine`
- `hammerDuotone`
- `hammerFill`
- `hammerLine`
- `heartAltDuotone`
- `heartAltFill`
- `heartAltLine`
- `heartDuotone`
- `heartFill`
- `heartLine`
- `helpDuotone`
- `helpFill`
- `helpLine`
- `homeDetailedDuotone`
- `homeDetailedFill`
- `homeDetailedLine`
- `homeDuotone`
- `homeFill`
- `homeLine`
- `hospitalAlt1Duotone`
- `hospitalAlt1Fill`
- `hospitalAlt1Line`
- `hospitalDuotone`
- `hospitalFill`
- `hospitalLine`
- `hourglassDuotone`
- `hourglassFill`
- `hourglassLine`
- `infoDuotone`
- `infoFill`
- `infoLine`
- `inputDuotone`
- `inputFill`
- `inputLine`
- `insightsDuotone`
- `insightsFill`
- `insightsLine`
- `inventoryDuotone`
- `inventoryFill`
- `inventoryLine`
- `italicDuotone`
- `italicFill`
- `italicLine`
- `jsonAlt1Duotone`
- `jsonAlt1Fill`
- `jsonAlt1Line`
- `jsonAlt2Duotone`
- `jsonAlt2Fill`
- `jsonAlt2Line`
- `jsonAlt3Duotone`
- `jsonAlt3Fill`
- `jsonAlt3Line`
- `jsonAlt4Duotone`
- `jsonAlt4Fill`
- `jsonAlt4Line`
- `jsonAlt5Duotone`
- `jsonAlt5Fill`
- `jsonAlt5Line`
- `jsonDuotone`
- `jsonFill`
- `jsonLine`
- `keypadDuotone`
- `keypadFill`
- `keypadLine`
- `lampDuotone`
- `lampFill`
- `lampLine`
- `leftDownDuotone`
- `leftDownFill`
- `leftDownLine`
- `leftRightDuotone`
- `leftRightFill`
- `leftRightLine`
- `leftTwoHeadedDuotone`
- `leftTwoHeadedFill`
- `leftTwoHeadedLine`
- `leftUpDuotone`
- `leftUpFill`
- `leftUpLine`
- `libraryBooksDuotone`
- `libraryBooksFill`
- `libraryBooksLine`
- `lightModeDuotone`
- `lightModeFill`
- `lightModeLine`
- `lightningDuotone`
- `lightningFill`
- `lightningLine`
- `lockAltDuotone`
- `lockAltFill`
- `lockAltLine`
- `lockDuotone`
- `lockFill`
- `lockLine`
- `lockMutedDuotone`
- `lockMutedFill`
- `lockMutedLine`
- `mailDuotone`
- `mailFill`
- `mailLine`
- `mapDuotone`
- `mapFill`
- `mapLine`
- `memoryDuotone`
- `memoryFill`
- `memoryLine`
- `micDetailedDuotone`
- `micDetailedFill`
- `micDetailedLine`
- `micDuotone`
- `micFill`
- `micLine`
- `moneyDuotone`
- `moneyFill`
- `moneyLine`
- `monitorCheckDuotone`
- `monitorCheckFill`
- `monitorCheckLine`
- `monitorCloseDuotone`
- `monitorCloseFill`
- `monitorCloseLine`
- `monitorDownDuotone`
- `monitorDownFill`
- `monitorDownLine`
- `monitorDuotone`
- `monitorFill`
- `monitorLine`
- `monitorPauseDuotone`
- `monitorPauseFill`
- `monitorPauseLine`
- `monitorPlayDuotone`
- `monitorPlayFill`
- `monitorPlayLine`
- `monitorStopDuotone`
- `monitorStopFill`
- `monitorStopLine`
- `monitorUpDuotone`
- `monitorUpFill`
- `monitorUpLine`
- `moonDuotone`
- `moonFill`
- `moonLine`
- `moreHorizCircleDuotone`
- `moreHorizCircleFill`
- `moreHorizCircleLine`
- `moreHorizDuotone`
- `moreHorizFill`
- `moreHorizLine`
- `moreHorizSquareDuotone`
- `moreHorizSquareFill`
- `moreHorizSquareLine`
- `moreMutedHorizCircleDuotone`
- `moreMutedHorizCircleFill`
- `moreMutedHorizCircleLine`
- `moreMutedHorizDuotone`
- `moreMutedHorizFill`
- `moreMutedHorizLine`
- `moreMutedHorizSquareDuotone`
- `moreMutedHorizSquareFill`
- `moreMutedHorizSquareLine`
- `moreMutedVertCircleDuotone`
- `moreMutedVertCircleFill`
- `moreMutedVertCircleLine`
- `moreMutedVertDuotone`
- `moreMutedVertFill`
- `moreMutedVertLine`
- `moreMutedVertSquareDuotone`
- `moreMutedVertSquareFill`
- `moreMutedVertSquareLine`
- `moreSquareHorizDuotone`
- `moreSquareHorizFill`
- `moreSquareHorizLine`
- `moreSquareVertDuotone`
- `moreSquareVertFill`
- `moreSquareVertLine`
- `moreVertCircleDuotone`
- `moreVertCircleFill`
- `moreVertCircleLine`
- `moreVertDuotone`
- `moreVertFill`
- `moreVertLine`
- `moreVertSquareDuotone`
- `moreVertSquareFill`
- `moreVertSquareLine`
- `moveDuotone`
- `moveFill`
- `moveLine`
- `movieDuotone`
- `movieFill`
- `movieLine`
- `northEastCircleDuotone`
- `northEastCircleFill`
- `northEastCircleLine`
- `northEastDuotone`
- `northEastEscapeAltDuotone`
- `northEastEscapeAltFill`
- `northEastEscapeAltLine`
- `northEastEscapeDuotone`
- `northEastEscapeFill`
- `northEastEscapeLine`
- `northEastFill`
- `northEastLine`
- `northEastSquareDuotone`
- `northEastSquareFill`
- `northEastSquareLine`
- `northWestCircleDuotone`
- `northWestCircleFill`
- `northWestCircleLine`
- `northWestDuotone`
- `northWestEscapeAltDuotone`
- `northWestEscapeAltFill`
- `northWestEscapeAltLine`
- `northWestEscapeDuotone`
- `northWestEscapeFill`
- `northWestEscapeLine`
- `northWestFill`
- `northWestLine`
- `northWestSquareDuotone`
- `northWestSquareFill`
- `northWestSquareLine`
- `northeastSouthwestDuotone`
- `northeastSouthwestFill`
- `northeastSouthwestLine`
- `northwestSoutheastDuotone`
- `northwestSoutheastFill`
- `northwestSoutheastLine`
- `notificationsAltDuotone`
- `notificationsAltFill`
- `notificationsAltLine`
- `notificationsDuotone`
- `notificationsFill`
- `notificationsLine`
- `notificationsThickDuotone`
- `notificationsThickFill`
- `notificationsThickLine`
- `octagonCheckDuotone`
- `octagonCheckFill`
- `octagonCheckLine`
- `octagonDuotone`
- `octagonFill`
- `octagonLine`
- `pauseDuotone`
- `pauseFill`
- `pauseLine`
- `pausePresentationDuotone`
- `pausePresentationFill`
- `pausePresentationLine`
- `phoneAddCallDuotone`
- `phoneAddCallFill`
- `phoneAddCallLine`
- `phoneCallbackDuotone`
- `phoneCallbackFill`
- `phoneCallbackLine`
- `phoneDuotone`
- `phoneEnabledDuotone`
- `phoneEnabledFill`
- `phoneEnabledLine`
- `phoneFill`
- `phoneForwardedDuotone`
- `phoneForwardedFill`
- `phoneForwardedLine`
- `phoneLine`
- `phoneLockedDuotone`
- `phoneLockedFill`
- `phoneLockedLine`
- `phonePausedDuotone`
- `phonePausedFill`
- `phonePausedLine`
- `pinAlt1Duotone`
- `pinAlt1Fill`
- `pinAlt1Line`
- `pinAlt2Duotone`
- `pinAlt2Fill`
- `pinAlt2Line`
- `pinDuotone`
- `pinFill`
- `pinLine`
- `playDuotone`
- `playFill`
- `playForwardDuotone`
- `playForwardFill`
- `playForwardLine`
- `playLine`
- `playNextDuotone`
- `playNextFill`
- `playNextLine`
- `playPreviousDuotone`
- `playPreviousFill`
- `playPreviousLine`
- `playRewindDuotone`
- `playRewindFill`
- `playRewindLine`
- `projectsAltDuotone`
- `projectsAltFill`
- `projectsAltLine`
- `projectsDuotone`
- `projectsFill`
- `projectsLine`
- `pullRequestDuotone`
- `pullRequestFill`
- `pullRequestLine`
- `quoteDuotone`
- `quoteFill`
- `quoteLine`
- `recordDuotone`
- `recordFill`
- `recordLine`
- `removeAlarmDuotone`
- `removeAlarmFill`
- `removeAlarmLine`
- `removeCircleDuotone`
- `removeCircleFill`
- `removeCircleLine`
- `removeDuotone`
- `removeFill`
- `removeFromLibraryDuotone`
- `removeFromLibraryFill`
- `removeFromLibraryLine`
- `removeLine`
- `removeSquareDuotone`
- `removeSquareFill`
- `removeSquareLine`
- `reorderAltDuotone`
- `reorderAltFill`
- `reorderAltLine`
- `reorderDuotone`
- `reorderFill`
- `reorderLine`
- `rightTwoHeadedDuotone`
- `rightTwoHeadedFill`
- `rightTwoHeadedLine`
- `rocketDuotone`
- `rocketFill`
- `rocketLine`
- `rupeeDuotone`
- `rupeeFill`
- `rupeeLine`
- `searchAltDuotone`
- `searchAltFill`
- `searchAltLine`
- `searchDuotone`
- `searchFill`
- `searchLine`
- `segmentDuotone`
- `segmentFill`
- `segmentLine`
- `settingsAltDuotone`
- `settingsAltFill`
- `settingsAltLine`
- `settingsApplicationsDuotone`
- `settingsApplicationsFill`
- `settingsApplicationsLine`
- `settingsCuteDuotone`
- `settingsCuteFill`
- `settingsCuteLine`
- `settingsDuotone`
- `settingsFill`
- `settingsLine`
- `settingsThickDuotone`
- `settingsThickFill`
- `settingsThickLine`
- `shieldAlertDuotone`
- `shieldAlertFill`
- `shieldAlertLine`
- `shieldBadDuotone`
- `shieldBadFill`
- `shieldBadLine`
- `shieldDuotone`
- `shieldFill`
- `shieldHealthSafetyDuotone`
- `shieldHealthSafetyFill`
- `shieldHealthSafetyLine`
- `shieldLine`
- `shieldPoliceDuotone`
- `shieldPoliceFill`
- `shieldPoliceLine`
- `shieldSecurityDuotone`
- `shieldSecurityFill`
- `shieldSecurityLine`
- `shieldTipDuotone`
- `shieldTipFill`
- `shieldTipLine`
- `shieldVerifiedDuotone`
- `shieldVerifiedFill`
- `shieldVerifiedLine`
- `signInAltDuotone`
- `signInAltFill`
- `signInAltLine`
- `signInDuotone`
- `signInFill`
- `signInLine`
- `signOutAltDuotone`
- `signOutAltFill`
- `signOutAltLine`
- `signOutDuotone`
- `signOutFill`
- `signOutLine`
- `smartPhoneDuotone`
- `smartPhoneFill`
- `smartPhoneLine`
- `sortAltDuotone`
- `sortAltFill`
- `sortAltLine`
- `sortDuotone`
- `sortFill`
- `sortLine`
- `southEastCircleDuotone`
- `southEastCircleFill`
- `southEastCircleLine`
- `southEastDuotone`
- `southEastEscapeAltDuotone`
- `southEastEscapeAltFill`
- `southEastEscapeAltLine`
- `southEastEscapeDuotone`
- `southEastEscapeFill`
- `southEastEscapeLine`
- `southEastFill`
- `southEastLine`
- `southEastSquareDuotone`
- `southEastSquareFill`
- `southEastSquareLine`
- `southWestCircleDuotone`
- `southWestCircleFill`
- `southWestCircleLine`
- `southWestDuotone`
- `southWestEscapeAltDuotone`
- `southWestEscapeAltFill`
- `southWestEscapeAltLine`
- `southWestEscapeDuotone`
- `southWestEscapeFill`
- `southWestEscapeLine`
- `southWestFill`
- `southWestLine`
- `southWestSquareDuotone`
- `southWestSquareFill`
- `southWestSquareLine`
- `spinnerDuotone`
- `spinnerFill`
- `spinnerLine`
- `squareDuotone`
- `squareFill`
- `squareLine`
- `starAltDuotone`
- `starAltFill`
- `starAltLine`
- `starDuotone`
- `starFill`
- `starLine`
- `stopCircleDuotone`
- `stopCircleFill`
- `stopCircleLine`
- `stopDuotone`
- `stopFill`
- `stopLine`
- `strikethroughDuotone`
- `strikethroughFill`
- `strikethroughLine`
- `sunDuotone`
- `sunFill`
- `sunLine`
- `sunSetDuotone`
- `sunSetFill`
- `sunSetLine`
- `sunnySnowingDuotone`
- `sunnySnowingFill`
- `sunnySnowingLine`
- `swapHorizDuotone`
- `swapHorizFill`
- `swapHorizLine`
- `swapVertDuotone`
- `swapVertFill`
- `swapVertLine`
- `tableColumnsDuotone`
- `tableColumnsFill`
- `tableColumnsLine`
- `tableDuotone`
- `tableFill`
- `tableLine`
- `tableRowsDuotone`
- `tableRowsFill`
- `tableRowsLine`
- `targetDuotone`
- `targetFill`
- `targetLine`
- `terminalAltDuotone`
- `terminalAltFill`
- `terminalAltLine`
- `terminalDuotone`
- `terminalFill`
- `terminalLine`
- `textDuotone`
- `textFill`
- `textLine`
- `thumbDownAlt1Duotone`
- `thumbDownAlt1Fill`
- `thumbDownAlt1Line`
- `thumbDownAlt2Duotone`
- `thumbDownAlt2Fill`
- `thumbDownAlt2Line`
- `thumbDownDuotone`
- `thumbDownFill`
- `thumbDownLine`
- `thumbUpAlt1Duotone`
- `thumbUpAlt1Fill`
- `thumbUpAlt1Line`
- `thumbUpAlt2Duotone`
- `thumbUpAlt2Fill`
- `thumbUpAlt2Line`
- `thumbUpDuotone`
- `thumbUpFill`
- `thumbUpLine`
- `toggleOffDuotone`
- `toggleOffFill`
- `toggleOffLine`
- `toggleOnDuotone`
- `toggleOnFill`
- `toggleOnLine`
- `trafficConeDuotone`
- `trafficConeFill`
- `trafficConeLine`
- `trainDuotone`
- `trainFill`
- `trainLine`
- `twitterDuotone`
- `twitterFill`
- `twitterLine`
- `underlineDuotone`
- `underlineFill`
- `underlineLine`
- `unfoldMoreDuotone`
- `unfoldMoreFill`
- `unfoldMoreLine`
- `unlockAltDuotone`
- `unlockAltFill`
- `unlockAltLine`
- `unlockDuotone`
- `unlockFill`
- `unlockLine`
- `unlockMutedDuotone`
- `unlockMutedFill`
- `unlockMutedLine`
- `upDownDuotone`
- `upDownFill`
- `upDownLine`
- `upTwoHeadedDuotone`
- `upTwoHeadedFill`
- `upTwoHeadedLine`
- `userAlt2Duotone`
- `userAlt2Fill`
- `userAlt2Line`
- `userAlt3Duotone`
- `userAlt3Fill`
- `userAlt3Line`
- `userAlt4Duotone`
- `userAlt4Fill`
- `userAlt4Line`
- `userAlt5Duotone`
- `userAlt5Fill`
- `userAlt5Line`
- `userAltDuotone`
- `userAltFill`
- `userAltLine`
- `userDuotone`
- `userFill`
- `userLine`
- `verifiedDuotone`
- `verifiedFill`
- `verifiedLine`
- `videoDuotone`
- `videoFill`
- `videoLine`
- `viewCompactDuotone`
- `viewCompactFill`
- `viewCompactLine`
- `viewStreamDuotone`
- `viewStreamFill`
- `viewStreamLine`
- `walletAltDuotone`
- `walletAltFill`
- `walletAltLine`
- `walletDetailedDuotone`
- `walletDetailedFill`
- `walletDetailedLine`
- `walletDuotone`
- `walletFill`
- `walletLine`
- `warningDuotone`
- `warningFill`
- `warningLine`
- `webcamDuotone`
- `webcamFill`
- `webcamLine`
- `widgetAlt1Duotone`
- `widgetAlt1Fill`
- `widgetAlt1Line`
- `widgetDuotone`
- `widgetFill`
- `widgetLine`
- `windowDuotone`
- `windowFill`
- `windowLine`
- `wrenchDuotone`
- `wrenchFill`
- `wrenchLine`
- `youtubeDuotone`
- `youtubeFill`
- `youtubeLine`
- `zoomInDuotone`
- `zoomInFill`
- `zoomInLine`
- `zoomOutDuotone`
- `zoomOutFill`
- `zoomOutLine`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActionsDuotoneIcon, ActionsFillIcon, ActionsLineIcon, AddAlarmDuotoneIcon } from '@stacksjs/iconify-si'

  global.navIcons = {
    home: ActionsDuotoneIcon({ size: 20, class: 'nav-icon' }),
    about: ActionsFillIcon({ size: 20, class: 'nav-icon' }),
    contact: ActionsLineIcon({ size: 20, class: 'nav-icon' }),
    settings: AddAlarmDuotoneIcon({ size: 20, class: 'nav-icon' })
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
import { ActionsDuotoneIcon } from '@stacksjs/iconify-si'

const icon = ActionsDuotoneIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActionsDuotoneIcon, ActionsFillIcon, ActionsLineIcon } from '@stacksjs/iconify-si'

const successIcon = ActionsDuotoneIcon({ size: 16, color: '#22c55e' })
const warningIcon = ActionsFillIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActionsLineIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActionsDuotoneIcon, ActionsFillIcon } from '@stacksjs/iconify-si'
   const icon = ActionsDuotoneIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { actionsDuotone, actionsFill } from '@stacksjs/iconify-si'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(actionsDuotone, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActionsDuotoneIcon, ActionsFillIcon } from '@stacksjs/iconify-si'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-si'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActionsDuotoneIcon } from '@stacksjs/iconify-si'
     global.icon = ActionsDuotoneIcon({ size: 24 })
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
   const icon = ActionsDuotoneIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { actionsDuotone } from '@stacksjs/iconify-si'

// Icons are typed as IconData
const myIcon: IconData = actionsDuotone
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/planetabhi/sargam-icons/blob/main/LICENSE.txt) for more information.

## Credits

- **Icons**: Abhimanyu Rana ([Website](https://github.com/planetabhi/sargam-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/si/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/si/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
