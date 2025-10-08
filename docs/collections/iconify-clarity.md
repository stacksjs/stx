# Clarity

> Clarity icons for stx from Iconify

## Overview

This package provides access to 1105 icons from the Clarity collection through the stx iconify integration.

**Collection ID:** `clarity`
**Total Icons:** 1105
**Author:** VMware ([Website](https://github.com/vmware/clarity))
**License:** MIT ([Details](https://github.com/vmware/clarity-assets/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-clarity
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Accessibility1LineIcon, Accessibility1SolidIcon, Accessibility2LineIcon } from '@stacksjs/iconify-clarity'

// Basic usage
const icon = Accessibility1LineIcon()

// With size
const sizedIcon = Accessibility1LineIcon({ size: 24 })

// With color
const coloredIcon = Accessibility1SolidIcon({ color: 'red' })

// With multiple props
const customIcon = Accessibility2LineIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Accessibility1LineIcon, Accessibility1SolidIcon, Accessibility2LineIcon } from '@stacksjs/iconify-clarity'

  global.icons = {
    home: Accessibility1LineIcon({ size: 24 }),
    user: Accessibility1SolidIcon({ size: 24, color: '#4a90e2' }),
    settings: Accessibility2LineIcon({ size: 32 })
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
import { accessibility1Line, accessibility1Solid, accessibility2Line } from '@stacksjs/iconify-clarity'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility1Line, { size: 24 })
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
const redIcon = Accessibility1LineIcon({ color: 'red' })
const blueIcon = Accessibility1LineIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Accessibility1LineIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Accessibility1LineIcon({ class: 'text-primary' })
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
const icon24 = Accessibility1LineIcon({ size: 24 })
const icon1em = Accessibility1LineIcon({ size: '1em' })

// Set individual dimensions
const customIcon = Accessibility1LineIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Accessibility1LineIcon({ height: '1em' })
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
const smallIcon = Accessibility1LineIcon({ class: 'icon-small' })
const largeIcon = Accessibility1LineIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1105** icons:

- `accessibility1Line`
- `accessibility1Solid`
- `accessibility2Line`
- `accessibility2Solid`
- `addLine`
- `addTextLine`
- `administratorLine`
- `administratorSolid`
- `airplaneLine`
- `airplaneSolid`
- `alarmClockLine`
- `alarmClockOutlineAlerted`
- `alarmClockOutlineBadged`
- `alarmClockSolid`
- `alarmClockSolidAlerted`
- `alarmClockSolidBadged`
- `alarmOffLine`
- `alarmOffSolid`
- `alertLine`
- `alertSolid`
- `alignBottomLine`
- `alignCenterLine`
- `alignLeftLine`
- `alignLeftTextLine`
- `alignMiddleLine`
- `alignRightLine`
- `alignRightTextLine`
- `alignTopLine`
- `analyticsLine`
- `analyticsOutlineAlerted`
- `analyticsOutlineBadged`
- `analyticsSolid`
- `analyticsSolidAlerted`
- `analyticsSolidBadged`
- `angleDoubleLine`
- `angleLine`
- `animationLine`
- `animationSolid`
- `applicationLine`
- `applicationSolid`
- `applicationsLine`
- `applicationsOutlineAlerted`
- `applicationsOutlineBadged`
- `applicationsSolid`
- `applicationsSolidAlerted`
- `applicationsSolidBadged`
- `archiveLine`
- `archiveSolid`
- `arrowLine`
- `assignUserLine`
- `assignUserSolid`
- `asteriskLine`
- `asteriskSolid`
- `atomLine`
- `atomSolid`
- `attachmentLine`
- `autoLine`
- `autoSolid`
- `avatarLine`
- `avatarOutlineAlerted`
- `avatarOutlineBadged`
- `avatarSolid`
- `avatarSolidAlerted`
- `avatarSolidBadged`
- `axisChartLine`
- `axisChartOutlineAlerted`
- `axisChartOutlineBadged`
- `axisChartSolid`
- `axisChartSolidAlerted`
- `axisChartSolidBadged`
- `backupLine`
- `backupOutlineAlerted`
- `backupOutlineBadged`
- `backupRestoreLine`
- `backupRestoreOutlineAlerted`
- `backupRestoreOutlineBadged`
- `backupRestoreSolid`
- `backupRestoreSolidAlerted`
- `backupRestoreSolidBadged`
- `backupSolid`
- `backupSolidAlerted`
- `backupSolidBadged`
- `balanceLine`
- `banLine`
- `bankLine`
- `bankOutlineAlerted`
- `bankOutlineBadged`
- `bankSolid`
- `bankSolidAlerted`
- `bankSolidBadged`
- `barChartLine`
- `barChartOutlineAlerted`
- `barChartOutlineBadged`
- `barChartSolid`
- `barChartSolidAlerted`
- `barChartSolidBadged`
- `barCodeLine`
- `barsLine`
- `batteryLine`
- `batteryOutlineAlerted`
- `batteryOutlineBadged`
- `batterySolid`
- `batterySolidAlerted`
- `batterySolidBadged`
- `bellCurveLine`
- `bellLine`
- `bellOutlineBadged`
- `bellSolid`
- `bellSolidBadged`
- `betaLine`
- `betaSolid`
- `bicycleLine`
- `bicycleSolid`
- `bitcoinLine`
- `bitcoinSolid`
- `blockLine`
- `blockOutlineAlerted`
- `blockOutlineBadged`
- `blockQuoteLine`
- `blockSolid`
- `blockSolidAlerted`
- `blockSolidBadged`
- `blocksGroupLine`
- `blocksGroupOutlineAlerted`
- `blocksGroupOutlineBadged`
- `blocksGroupSolid`
- `blocksGroupSolidAlerted`
- `blocksGroupSolidBadged`
- `bluetoothLine`
- `bluetoothOffLine`
- `bluetoothOffSolid`
- `bluetoothSolid`
- `boatLine`
- `boatSolid`
- `boldLine`
- `boltLine`
- `boltSolid`
- `bookLine`
- `bookSolid`
- `bookmarkLine`
- `bookmarkSolid`
- `boxPlotLine`
- `boxPlotOutlineAlerted`
- `boxPlotOutlineBadged`
- `boxPlotSolid`
- `boxPlotSolidAlerted`
- `boxPlotSolidBadged`
- `briefcaseLine`
- `briefcaseSolid`
- `bubbleChartLine`
- `bubbleChartOutlineAlerted`
- `bubbleChartOutlineBadged`
- `bubbleChartSolid`
- `bubbleChartSolidAlerted`
- `bubbleChartSolidBadged`
- `bubbleExclamationLine`
- `bubbleExclamationSolid`
- `bugLine`
- `bugSolid`
- `buildingLine`
- `buildingOutlineAlerted`
- `buildingOutlineBadged`
- `buildingSolid`
- `buildingSolidAlerted`
- `buildingSolidBadged`
- `bulletListLine`
- `bullseyeLine`
- `bullseyeSolid`
- `bundleLine`
- `bundleSolid`
- `calculatorLine`
- `calculatorSolid`
- `calendarLine`
- `calendarOutlineAlerted`
- `calendarOutlineBadged`
- `calendarSolid`
- `calendarSolidAlerted`
- `calendarSolidBadged`
- `cameraLine`
- `cameraSolid`
- `campervanLine`
- `campervanSolid`
- `cancelLine`
- `capacitorLine`
- `carLine`
- `carSolid`
- `caravanLine`
- `caravanSolid`
- `caretLine`
- `cdDvdLine`
- `cdDvdSolid`
- `centerTextLine`
- `certificateLine`
- `certificateOutlineAlerted`
- `certificateOutlineBadged`
- `certificateSolid`
- `certificateSolidAlerted`
- `certificateSolidBadged`
- `chatBubbleLine`
- `chatBubbleOutlineBadged`
- `chatBubbleSolid`
- `chatBubbleSolidBadged`
- `checkCircleLine`
- `checkCircleSolid`
- `checkLine`
- `checkboxListLine`
- `childArrowLine`
- `ciCdLine`
- `circleArrowLine`
- `circleArrowSolid`
- `circleLine`
- `circleSolid`
- `clipboardLine`
- `clipboardOutlineBadged`
- `clipboardSolid`
- `clipboardSolidBadged`
- `clockLine`
- `clockOutlineAlerted`
- `clockOutlineBadged`
- `clockSolid`
- `clockSolidAlerted`
- `clockSolidBadged`
- `cloneLine`
- `cloneSolid`
- `closeLine`
- `cloudChartLine`
- `cloudChartOutlineAlerted`
- `cloudChartOutlineBadged`
- `cloudChartSolid`
- `cloudChartSolidAlerted`
- `cloudChartSolidBadged`
- `cloudLine`
- `cloudNetworkLine`
- `cloudOutlineAlerted`
- `cloudOutlineBadged`
- `cloudScaleLine`
- `cloudSolid`
- `cloudSolidAlerted`
- `cloudSolidBadged`
- `cloudTrafficLine`
- `clusterLine`
- `clusterOutlineAlerted`
- `clusterOutlineBadged`
- `clusterSolid`
- `clusterSolidAlerted`
- `clusterSolidBadged`
- `codeLine`
- `codeOutlineAlerted`
- `codeOutlineBadged`
- `cogLine`
- `cogOutlineAlerted`
- `cogOutlineBadged`
- `cogSolid`
- `cogSolidAlerted`
- `cogSolidBadged`
- `coinBagLine`
- `coinBagSolid`
- `collapseCardLine`
- `collapseCardSolid`
- `collapseLine`
- `colorPaletteLine`
- `colorPaletteSolid`
- `colorPickerLine`
- `colorPickerSolid`
- `commandLine`
- `commandOutlineAlerted`
- `commandOutlineBadged`
- `commandSolid`
- `commandSolidAlerted`
- `commandSolidBadged`
- `compassLine`
- `compassSolid`
- `computerLine`
- `computerOutlineAlerted`
- `computerOutlineBadged`
- `computerSolid`
- `computerSolidAlerted`
- `computerSolidBadged`
- `connectLine`
- `connectSolid`
- `containerLine`
- `containerSolid`
- `containerVolumeLine`
- `containerVolumeSolid`
- `contractLine`
- `contractSolid`
- `controlLunLine`
- `controlLunOutlineAlerted`
- `controlLunOutlineBadged`
- `controlLunSolid`
- `controlLunSolidAlerted`
- `controlLunSolidBadged`
- `copyLine`
- `copySolid`
- `copyToClipboardLine`
- `cpuLine`
- `cpuOutlineAlerted`
- `cpuOutlineBadged`
- `cpuSolid`
- `cpuSolidAlerted`
- `cpuSolidBadged`
- `creditCardLine`
- `creditCardSolid`
- `crosshairsLine`
- `crownLine`
- `crownSolid`
- `cursorArrowLine`
- `cursorArrowSolid`
- `cursorHandClickLine`
- `cursorHandGrabLine`
- `cursorHandLine`
- `cursorHandOpenLine`
- `cursorHandSolid`
- `cursorMoveLine`
- `curveChartLine`
- `curveChartOutlineAlerted`
- `curveChartOutlineBadged`
- `curveChartSolid`
- `curveChartSolidAlerted`
- `curveChartSolidBadged`
- `dashboardLine`
- `dashboardOutlineBadged`
- `dashboardSolid`
- `dashboardSolidBadged`
- `dataClusterLine`
- `dataClusterOutlineAlerted`
- `dataClusterOutlineBadged`
- `dataClusterSolid`
- `dataClusterSolidAlerted`
- `dataClusterSolidBadged`
- `dateLine`
- `dateOutlineAlerted`
- `dateOutlineBadged`
- `dateSolid`
- `dateSolidAlerted`
- `dateSolidBadged`
- `deployLine`
- `deploySolid`
- `designLine`
- `designSolid`
- `detailsLine`
- `detailsSolid`
- `devicesLine`
- `devicesSolid`
- `digitalSignatureLine`
- `directoryLine`
- `directoryOutlineAlerted`
- `directoryOutlineBadged`
- `directorySolid`
- `directorySolidAlerted`
- `directorySolidBadged`
- `disconnectLine`
- `disconnectSolid`
- `disconnectedLine`
- `disconnectedSolid`
- `displayLine`
- `displayOutlineAlerted`
- `displayOutlineBadged`
- `displaySolid`
- `displaySolidAlerted`
- `displaySolidBadged`
- `dnaLine`
- `dnaSolid`
- `documentLine`
- `documentOutlineAlerted`
- `documentOutlineBadged`
- `documentSolid`
- `documentSolidAlerted`
- `documentSolidBadged`
- `dollarBillLine`
- `dollarBillSolid`
- `dollarLine`
- `dollarSolid`
- `dotCircleLine`
- `downloadCloudLine`
- `downloadCloudOutlineAlerted`
- `downloadCloudOutlineBadged`
- `downloadLine`
- `downloadOutlineAlerted`
- `downloadOutlineBadged`
- `dragHandleCornerLine`
- `dragHandleLine`
- `eCheckLine`
- `eCheckSolid`
- `editLine`
- `editSolid`
- `ellipsisHorizontalLine`
- `ellipsisHorizontalOutlineBadged`
- `ellipsisVerticalLine`
- `ellipsisVerticalOutlineBadged`
- `emailLine`
- `emailOutlineAlerted`
- `emailOutlineBadged`
- `emailSolid`
- `emailSolidAlerted`
- `emailSolidBadged`
- `employeeGroupLine`
- `employeeGroupSolid`
- `employeeLine`
- `employeeSolid`
- `envelopeLine`
- `envelopeOutlineAlerted`
- `envelopeOutlineBadged`
- `envelopeSolid`
- `envelopeSolidAlerted`
- `envelopeSolidBadged`
- `eraserLine`
- `eraserSolid`
- `errorLine`
- `errorSolid`
- `errorStandardLine`
- `errorStandardSolid`
- `euroLine`
- `euroSolid`
- `eventLine`
- `eventOutlineAlerted`
- `eventOutlineBadged`
- `eventSolid`
- `eventSolidAlerted`
- `eventSolidBadged`
- `exclamationCircleLine`
- `exclamationCircleSolid`
- `exclamationTriangleLine`
- `exclamationTriangleSolid`
- `expandCardLine`
- `expandCardSolid`
- `exportLine`
- `exportOutlineAlerted`
- `exportOutlineBadged`
- `exportSolid`
- `exportSolidAlerted`
- `exportSolidBadged`
- `eyeHideLine`
- `eyeHideSolid`
- `eyeLine`
- `eyeShowLine`
- `eyeShowSolid`
- `eyeSolid`
- `factoryLine`
- `factorySolid`
- `fastForwardLine`
- `fastForwardSolid`
- `favoriteLine`
- `favoriteSolid`
- `ferryLine`
- `ferrySolid`
- `fileGroupLine`
- `fileGroupSolid`
- `fileLine`
- `fileOutlineAlerted`
- `fileOutlineBadged`
- `fileSettingsLine`
- `fileSettingsOutlineAlerted`
- `fileSettingsOutlineBadged`
- `fileSettingsSolid`
- `fileSettingsSolidAlerted`
- `fileSettingsSolidBadged`
- `fileShare2Line`
- `fileShare2Solid`
- `fileShareLine`
- `fileShareSolid`
- `fileSolid`
- `fileSolidAlerted`
- `fileSolidBadged`
- `fileZipLine`
- `fileZipSolid`
- `filmStripLine`
- `filmStripSolid`
- `filter2Line`
- `filterGridCircleLine`
- `filterGridCircleSolid`
- `filterGridLine`
- `filterGridSolid`
- `filterLine`
- `filterOffLine`
- `filterOffSolid`
- `filterSolid`
- `firewallLine`
- `firewallOutlineAlerted`
- `firewallOutlineBadged`
- `firewallSolid`
- `firewallSolidAlerted`
- `firewallSolidBadged`
- `firstAidKitLine`
- `firstAidKitSolid`
- `fishLine`
- `flagLine`
- `flagSolid`
- `flameLine`
- `flameSolid`
- `flaskLine`
- `flaskSolid`
- `floppyLine`
- `floppyOutlineAlerted`
- `floppyOutlineBadged`
- `floppySolid`
- `floppySolidAlerted`
- `floppySolidBadged`
- `flowChartLine`
- `flowChartSolid`
- `folderLine`
- `folderOpenLine`
- `folderOpenOutlineAlerted`
- `folderOpenOutlineBadged`
- `folderOpenSolid`
- `folderOpenSolidAlerted`
- `folderOpenSolidBadged`
- `folderOutlineAlerted`
- `folderOutlineBadged`
- `folderSolid`
- `folderSolidAlerted`
- `folderSolidBadged`
- `fontSizeLine`
- `forkingLine`
- `formLine`
- `fuelLine`
- `gavelLine`
- `gavelSolid`
- `gridChartLine`
- `gridChartOutlineAlerted`
- `gridChartOutlineBadged`
- `gridChartSolid`
- `gridChartSolidAlerted`
- `gridChartSolidBadged`
- `gridViewLine`
- `gridViewSolid`
- `groupLine`
- `groupOutlineAlerted`
- `groupOutlineBadged`
- `groupSolid`
- `groupSolidAlerted`
- `groupSolidBadged`
- `halfStarLine`
- `halfStarSolid`
- `happyFaceLine`
- `happyFaceSolid`
- `hardDiskLine`
- `hardDiskOutlineAlerted`
- `hardDiskOutlineBadged`
- `hardDiskSolid`
- `hardDiskSolidAlerted`
- `hardDiskSolidBadged`
- `hardDriveDisksLine`
- `hardDriveDisksSolid`
- `hardDriveLine`
- `hardDriveSolid`
- `hashtagLine`
- `hashtagSolid`
- `headphonesLine`
- `headphonesSolid`
- `heartBrokenLine`
- `heartBrokenSolid`
- `heartLine`
- `heartSolid`
- `heatMapLine`
- `heatMapOutlineAlerted`
- `heatMapOutlineBadged`
- `heatMapSolid`
- `heatMapSolidAlerted`
- `heatMapSolidBadged`
- `helixLine`
- `helixSolid`
- `helpInfoLine`
- `helpInfoSolid`
- `helpLine`
- `helpOutlineBadged`
- `helpSolid`
- `helpSolidBadged`
- `highlighterLine`
- `historyLine`
- `homeLine`
- `homeSolid`
- `hostGroupLine`
- `hostGroupSolid`
- `hostLine`
- `hostOutlineAlerted`
- `hostOutlineBadged`
- `hostSolid`
- `hostSolidAlerted`
- `hostSolidBadged`
- `hourglassLine`
- `hourglassOutlineAlerted`
- `hourglassOutlineBadged`
- `hourglassSolid`
- `hourglassSolidAlerted`
- `hourglassSolidBadged`
- `houseLine`
- `houseSolid`
- `idBadgeLine`
- `idBadgeOutlineAlerted`
- `idBadgeOutlineBadged`
- `idBadgeSolid`
- `idBadgeSolidAlerted`
- `idBadgeSolidBadged`
- `imageGalleryLine`
- `imageGallerySolid`
- `imageLine`
- `imageOutlineBadged`
- `imageSolid`
- `imageSolidBadged`
- `importLine`
- `importOutlineAlerted`
- `importOutlineBadged`
- `importSolid`
- `importSolidAlerted`
- `importSolidBadged`
- `inboxLine`
- `inboxOutlineBadged`
- `indentLine`
- `inductorLine`
- `infoCircleLine`
- `infoCircleSolid`
- `infoLine`
- `infoSolid`
- `infoStandardLine`
- `infoStandardSolid`
- `installLine`
- `installOutlineAlerted`
- `installOutlineBadged`
- `internetOfThingsLine`
- `internetOfThingsSolid`
- `italicLine`
- `justifyTextLine`
- `keyLine`
- `keyOutlineAlerted`
- `keyOutlineBadged`
- `keySolid`
- `keySolidAlerted`
- `keySolidBadged`
- `keyboardLine`
- `keyboardSolid`
- `landscapeLine`
- `landscapeSolid`
- `languageLine`
- `languageSolid`
- `launchpadLine`
- `launchpadSolid`
- `layersLine`
- `layersSolid`
- `libraryLine`
- `librarySolid`
- `licenseLine`
- `licenseOutlineAlerted`
- `licenseOutlineBadged`
- `licenseSolid`
- `licenseSolidAlerted`
- `licenseSolidBadged`
- `lightbulbLine`
- `lightbulbOutlineBadged`
- `lightbulbSolid`
- `lightbulbSolidBadged`
- `lightningLine`
- `lightningSolid`
- `lineChartLine`
- `lineChartOutlineAlerted`
- `lineChartOutlineBadged`
- `lineChartSolid`
- `lineChartSolidAlerted`
- `lineChartSolidBadged`
- `linkLine`
- `listLine`
- `listOutlineBadged`
- `listSolid`
- `listSolidBadged`
- `lockLine`
- `lockSolid`
- `loginLine`
- `loginSolid`
- `logoutLine`
- `logoutSolid`
- `mapLine`
- `mapMarkerLine`
- `mapMarkerOutlineBadged`
- `mapMarkerSolid`
- `mapMarkerSolidBadged`
- `mapOutlineAlerted`
- `mapOutlineBadged`
- `mapSolid`
- `mapSolidAlerted`
- `mapSolidBadged`
- `mediaChangerLine`
- `mediaChangerOutlineAlerted`
- `mediaChangerOutlineBadged`
- `mediaChangerSolid`
- `mediaChangerSolidAlerted`
- `mediaChangerSolidBadged`
- `memoryLine`
- `memoryOutlineAlerted`
- `memoryOutlineBadged`
- `memorySolid`
- `memorySolidAlerted`
- `memorySolidBadged`
- `menuLine`
- `microphoneLine`
- `microphoneMuteLine`
- `microphoneMuteSolid`
- `microphoneSolid`
- `minusCircleLine`
- `minusCircleSolid`
- `minusLine`
- `mobileLine`
- `mobilePhoneLine`
- `mobilePhoneSolid`
- `mobileSolid`
- `moonLine`
- `moonSolid`
- `mouseLine`
- `mouseSolid`
- `musicNoteLine`
- `musicNoteSolid`
- `namespaceLine`
- `namespaceOutlineAlerted`
- `namespaceOutlineBadged`
- `networkGlobeLine`
- `networkGlobeOutlineAlerted`
- `networkGlobeOutlineBadged`
- `networkGlobeSolid`
- `networkGlobeSolidAlerted`
- `networkGlobeSolidBadged`
- `networkSettingsLine`
- `networkSettingsSolid`
- `networkSwitchLine`
- `networkSwitchOutlineAlerted`
- `networkSwitchOutlineBadged`
- `networkSwitchSolid`
- `networkSwitchSolidAlerted`
- `networkSwitchSolidBadged`
- `neutralFaceLine`
- `neutralFaceSolid`
- `newLine`
- `newSolid`
- `noAccessLine`
- `noAccessSolid`
- `noWifiLine`
- `noWifiSolid`
- `nodeGroupLine`
- `nodeLine`
- `nodesLine`
- `noteEditLine`
- `noteEditSolid`
- `noteLine`
- `noteSolid`
- `notificationLine`
- `notificationOutlineBadged`
- `notificationSolid`
- `notificationSolidBadged`
- `numberListLine`
- `nvmeLine`
- `objectsLine`
- `objectsSolid`
- `onHolidayLine`
- `onHolidaySolid`
- `organizationLine`
- `organizationSolid`
- `outdentLine`
- `paintRollerLine`
- `paintRollerSolid`
- `paperclipLine`
- `pasteLine`
- `pasteSolid`
- `pauseLine`
- `pauseSolid`
- `pencilLine`
- `pencilSolid`
- `pesoLine`
- `pesoSolid`
- `phoneHandsetLine`
- `phoneHandsetSolid`
- `pictureLine`
- `pictureOutlineBadged`
- `pictureSolid`
- `pictureSolidBadged`
- `pieChartLine`
- `pieChartOutlineAlerted`
- `pieChartOutlineBadged`
- `pieChartSolid`
- `pieChartSolidAlerted`
- `pieChartSolidBadged`
- `piggyBankLine`
- `piggyBankSolid`
- `pinLine`
- `pinSolid`
- `pinboardLine`
- `pinboardSolid`
- `pinnedLine`
- `pinnedSolid`
- `planeLine`
- `planeSolid`
- `playLine`
- `playSolid`
- `pluginLine`
- `pluginOutlineAlerted`
- `pluginOutlineBadged`
- `pluginSolid`
- `pluginSolidAlerted`
- `pluginSolidBadged`
- `plusCircleLine`
- `plusCircleSolid`
- `plusLine`
- `podLine`
- `popOutLine`
- `portraitLine`
- `portraitSolid`
- `poundLine`
- `poundSolid`
- `powerLine`
- `powerOutlineAlerted`
- `powerOutlineBadged`
- `powerSolid`
- `powerSolidAlerted`
- `powerSolidBadged`
- `printerLine`
- `printerOutlineAlerted`
- `printerOutlineBadged`
- `printerSolid`
- `printerSolidAlerted`
- `printerSolidBadged`
- `processOnVmLine`
- `qrCodeLine`
- `rackServerLine`
- `rackServerOutlineAlerted`
- `rackServerOutlineBadged`
- `rackServerSolid`
- `rackServerSolidAlerted`
- `rackServerSolidBadged`
- `radarLine`
- `radarSolid`
- `receiverLine`
- `receiverSolid`
- `recycleLine`
- `recycleSolid`
- `redoLine`
- `refreshLine`
- `removeLine`
- `removeSolid`
- `repeatLine`
- `replayAllLine`
- `replayOneLine`
- `resistorLine`
- `resizeDownLine`
- `resizeLine`
- `resizeUpLine`
- `resourcePoolLine`
- `resourcePoolOutlineAlerted`
- `resourcePoolOutlineBadged`
- `resourcePoolSolid`
- `resourcePoolSolidAlerted`
- `resourcePoolSolidBadged`
- `rewindLine`
- `rewindSolid`
- `routerLine`
- `routerOutlineAlerted`
- `routerOutlineBadged`
- `routerSolid`
- `routerSolidAlerted`
- `routerSolidBadged`
- `rubleLine`
- `rubleSolid`
- `rulerPencilLine`
- `rulerPencilSolid`
- `rupeeLine`
- `rupeeSolid`
- `sadFaceLine`
- `sadFaceSolid`
- `savingsLine`
- `savingsSolid`
- `scatterPlotLine`
- `scatterPlotOutlineAlerted`
- `scatterPlotOutlineBadged`
- `scatterPlotSolid`
- `scatterPlotSolidAlerted`
- `scatterPlotSolidBadged`
- `scissorsLine`
- `scissorsSolid`
- `scrollLine`
- `scrollOutlineAlerted`
- `scrollOutlineBadged`
- `scrollSolid`
- `scrollSolidAlerted`
- `scrollSolidBadged`
- `searchLine`
- `serverLine`
- `serverOutlineAlerted`
- `serverOutlineBadged`
- `serverSolid`
- `serverSolidAlerted`
- `serverSolidBadged`
- `settingsLine`
- `settingsOutlineAlerted`
- `settingsOutlineBadged`
- `settingsSolid`
- `settingsSolidAlerted`
- `settingsSolidBadged`
- `shareLine`
- `shareSolid`
- `shieldCheckLine`
- `shieldCheckSolid`
- `shieldLine`
- `shieldOutlineAlerted`
- `shieldOutlineBadged`
- `shieldSolid`
- `shieldSolidAlerted`
- `shieldSolidBadged`
- `shieldXLine`
- `shieldXSolid`
- `shoppingBagLine`
- `shoppingBagSolid`
- `shoppingCartLine`
- `shoppingCartOutlineAlerted`
- `shoppingCartOutlineBadged`
- `shoppingCartSolid`
- `shoppingCartSolidAlerted`
- `shoppingCartSolidBadged`
- `shrinkLine`
- `shuffleLine`
- `signInLine`
- `signInSolid`
- `signOutLine`
- `signOutSolid`
- `sliderLine`
- `sliderSolid`
- `snowflakeLine`
- `sortByLine`
- `squidLine`
- `ssdLine`
- `ssdSolid`
- `starLine`
- `starSolid`
- `stepForward2Line`
- `stepForwardLine`
- `stepForwardSolid`
- `stopLine`
- `stopSolid`
- `storageAdapterLine`
- `storageLine`
- `storageOutlineAlerted`
- `storageOutlineBadged`
- `storageSolid`
- `storageSolidAlerted`
- `storageSolidBadged`
- `storeLine`
- `storeSolid`
- `strikethroughLine`
- `subscriptLine`
- `successLine`
- `successStandardLine`
- `successStandardSolid`
- `sunLine`
- `sunSolid`
- `superscriptLine`
- `switchLine`
- `syncLine`
- `tableLine`
- `tabletLine`
- `tabletSolid`
- `tagLine`
- `tagOutlineAlerted`
- `tagOutlineBadged`
- `tagSolid`
- `tagSolidAlerted`
- `tagSolidBadged`
- `tagsLine`
- `tagsOutlineAlerted`
- `tagsOutlineBadged`
- `tagsSolid`
- `tagsSolidAlerted`
- `tagsSolidBadged`
- `talkBubblesLine`
- `talkBubblesOutlineBadged`
- `talkBubblesSolid`
- `talkBubblesSolidBadged`
- `tapeDriveLine`
- `tapeDriveOutlineAlerted`
- `tapeDriveOutlineBadged`
- `tapeDriveSolid`
- `tapeDriveSolidAlerted`
- `tapeDriveSolidBadged`
- `targetLine`
- `targetSolid`
- `tasksLine`
- `tasksOutlineAlerted`
- `tasksOutlineBadged`
- `tasksSolid`
- `tasksSolidAlerted`
- `tasksSolidBadged`
- `terminalLine`
- `terminalOutlineAlerted`
- `terminalOutlineBadged`
- `terminalSolid`
- `terminalSolidAlerted`
- `terminalSolidBadged`
- `textColorLine`
- `textLine`
- `thermometerLine`
- `thinClientLine`
- `thinClientSolid`
- `thumbsDownLine`
- `thumbsDownSolid`
- `thumbsUpLine`
- `thumbsUpSolid`
- `tickChartLine`
- `tickChartOutlineAlerted`
- `tickChartOutlineBadged`
- `tickChartSolid`
- `tickChartSolidAlerted`
- `tickChartSolidBadged`
- `timelineLine`
- `timesCircleLine`
- `timesCircleSolid`
- `timesLine`
- `toolsLine`
- `toolsSolid`
- `trailerLine`
- `trailerSolid`
- `trashLine`
- `trashSolid`
- `treeLine`
- `treeSolid`
- `treeViewLine`
- `treeViewSolid`
- `truckLine`
- `truckSolid`
- `twoWayArrowsLine`
- `unarchiveLine`
- `unarchiveSolid`
- `underlineLine`
- `undoLine`
- `uninstallLine`
- `uninstallOutlineAlerted`
- `uninstallOutlineBadged`
- `unknownStatusLine`
- `unlinkLine`
- `unlockLine`
- `unlockSolid`
- `updateLine`
- `uploadCloudLine`
- `uploadCloudOutlineAlerted`
- `uploadCloudOutlineBadged`
- `uploadLine`
- `uploadOutlineAlerted`
- `uploadOutlineBadged`
- `usbLine`
- `usbSolid`
- `userLine`
- `userOutlineAlerted`
- `userOutlineBadged`
- `userSolid`
- `userSolidAlerted`
- `userSolidBadged`
- `usersLine`
- `usersOutlineAlerted`
- `usersOutlineBadged`
- `usersSolid`
- `usersSolidAlerted`
- `usersSolidBadged`
- `videoCameraLine`
- `videoCameraSolid`
- `videoGalleryLine`
- `videoGallerySolid`
- `viewCardsLine`
- `viewColumnsLine`
- `viewListLine`
- `vmBugInverseLine`
- `vmBugLine`
- `vmLine`
- `vmOutlineAlerted`
- `vmOutlineBadged`
- `vmSolid`
- `vmSolidAlerted`
- `vmSolidBadged`
- `vmwAppLine`
- `vmwAppOutlineAlerted`
- `vmwAppOutlineBadged`
- `volumeDownLine`
- `volumeDownSolid`
- `volumeLine`
- `volumeMuteLine`
- `volumeMuteSolid`
- `volumeUpLine`
- `volumeUpSolid`
- `walletLine`
- `walletSolid`
- `wandLine`
- `warningLine`
- `warningSolid`
- `warningStandardLine`
- `warningStandardSolid`
- `wifiLine`
- `wifiSolid`
- `windowCloseLine`
- `windowMaxLine`
- `windowMinLine`
- `windowRestoreLine`
- `wonLine`
- `wonSolid`
- `worldLine`
- `worldOutlineBadged`
- `worldSolid`
- `worldSolidBadged`
- `wrenchLine`
- `wrenchSolid`
- `yenLine`
- `yenSolid`
- `zoomInLine`
- `zoomOutLine`

## Usage Examples

### Navigation Menu

```html
@js
  import { Accessibility1LineIcon, Accessibility1SolidIcon, Accessibility2LineIcon, Accessibility2SolidIcon } from '@stacksjs/iconify-clarity'

  global.navIcons = {
    home: Accessibility1LineIcon({ size: 20, class: 'nav-icon' }),
    about: Accessibility1SolidIcon({ size: 20, class: 'nav-icon' }),
    contact: Accessibility2LineIcon({ size: 20, class: 'nav-icon' }),
    settings: Accessibility2SolidIcon({ size: 20, class: 'nav-icon' })
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
import { Accessibility1LineIcon } from '@stacksjs/iconify-clarity'

const icon = Accessibility1LineIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Accessibility1LineIcon, Accessibility1SolidIcon, Accessibility2LineIcon } from '@stacksjs/iconify-clarity'

const successIcon = Accessibility1LineIcon({ size: 16, color: '#22c55e' })
const warningIcon = Accessibility1SolidIcon({ size: 16, color: '#f59e0b' })
const errorIcon = Accessibility2LineIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Accessibility1LineIcon, Accessibility1SolidIcon } from '@stacksjs/iconify-clarity'
   const icon = Accessibility1LineIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility1Line, accessibility1Solid } from '@stacksjs/iconify-clarity'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility1Line, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Accessibility1LineIcon, Accessibility1SolidIcon } from '@stacksjs/iconify-clarity'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-clarity'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Accessibility1LineIcon } from '@stacksjs/iconify-clarity'
     global.icon = Accessibility1LineIcon({ size: 24 })
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
   const icon = Accessibility1LineIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility1Line } from '@stacksjs/iconify-clarity'

// Icons are typed as IconData
const myIcon: IconData = accessibility1Line
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/vmware/clarity-assets/blob/master/LICENSE) for more information.

## Credits

- **Icons**: VMware ([Website](https://github.com/vmware/clarity))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/clarity/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/clarity/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
