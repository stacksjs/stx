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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<Accessibility1LineIcon height="1em" />
<Accessibility1LineIcon width="1em" height="1em" />
<Accessibility1LineIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<Accessibility1LineIcon size="24" />
<Accessibility1LineIcon size="1em" />

<!-- Using width and height -->
<Accessibility1LineIcon width="24" height="32" />

<!-- With color -->
<Accessibility1LineIcon size="24" color="red" />
<Accessibility1LineIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<Accessibility1LineIcon size="24" class="icon-primary" />

<!-- With all properties -->
<Accessibility1LineIcon
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
    <Accessibility1LineIcon size="24" />
    <Accessibility1SolidIcon size="24" color="#4a90e2" />
    <Accessibility2LineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<Accessibility1LineIcon size="24" color="red" />
<Accessibility1LineIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<Accessibility1LineIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<Accessibility1LineIcon size="24" class="text-primary" />
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
<Accessibility1LineIcon height="1em" />
<Accessibility1LineIcon width="1em" height="1em" />
<Accessibility1LineIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<Accessibility1LineIcon size="24" />
<Accessibility1LineIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.clarity-icon {
  width: 1em;
  height: 1em;
}
```

```html
<Accessibility1LineIcon class="clarity-icon" />
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
<nav>
  <a href="/"><Accessibility1LineIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Accessibility1SolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><Accessibility2LineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><Accessibility2SolidIcon size="20" class="nav-icon" /> Settings</a>
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
<Accessibility1LineIcon
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
    <Accessibility1LineIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Accessibility1SolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <Accessibility2LineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <Accessibility1LineIcon size="24" />
   <Accessibility1SolidIcon size="24" color="#4a90e2" />
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
   <Accessibility1LineIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <Accessibility1LineIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <Accessibility1LineIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility1Line } from '@stacksjs/iconify-clarity'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility1Line, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
