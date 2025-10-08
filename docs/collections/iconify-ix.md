# Siemens Industrial Experience Icons

> Siemens Industrial Experience Icons icons for stx from Iconify

## Overview

This package provides access to 1418 icons from the Siemens Industrial Experience Icons collection through the stx iconify integration.

**Collection ID:** `ix`
**Total Icons:** 1418
**Author:** Siemens AG ([Website](https://github.com/siemens/ix-icons))
**License:** MIT ([Details](https://github.com/siemens/ix-icons/blob/main/LICENSE.md))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ix
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AboutIcon height="1em" />
<AboutIcon width="1em" height="1em" />
<AboutIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AboutIcon size="24" />
<AboutIcon size="1em" />

<!-- Using width and height -->
<AboutIcon width="24" height="32" />

<!-- With color -->
<AboutIcon size="24" color="red" />
<AboutIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AboutIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AboutIcon
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
    <AboutIcon size="24" />
    <AboutFilledIcon size="24" color="#4a90e2" />
    <AddIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { about, aboutFilled, add } from '@stacksjs/iconify-ix'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(about, { size: 24 })
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
<AboutIcon size="24" color="red" />
<AboutIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AboutIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AboutIcon size="24" class="text-primary" />
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
<AboutIcon height="1em" />
<AboutIcon width="1em" height="1em" />
<AboutIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AboutIcon size="24" />
<AboutIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.ix-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AboutIcon class="ix-icon" />
```

## Available Icons

This package contains **1418** icons:

- `about`
- `aboutFilled`
- `add`
- `addApplication`
- `addCircle`
- `addCircleFilled`
- `addCircleSmall`
- `addCircleSmallFilled`
- `addDocumentNote`
- `addEye`
- `addEyeFilled`
- `addFilter`
- `addFilterFilled`
- `addSelection`
- `addShieldHalf`
- `addTask`
- `addTaskList`
- `addUser`
- `addUserFilled`
- `agent`
- `agentFilled`
- `ai`
- `alarm`
- `alarmBell`
- `alarmBellCancelled`
- `alarmBellCancelledFilled`
- `alarmBellFilled`
- `alarmClock`
- `alarmClockCancelled`
- `alarmClockFilled`
- `alarmClockSuccess`
- `alarmFilled`
- `alignCenterHorizontally`
- `alignCenterVertically`
- `alignObjectDimensions`
- `alignObjectHeight`
- `alignObjectWidth`
- `alignObjects`
- `alignObjectsBottom`
- `alignObjectsCentered`
- `alignObjectsHorizontally`
- `alignObjectsLeft`
- `alignObjectsRight`
- `alignObjectsTop`
- `alignObjectsVertically`
- `analysis`
- `analysisFilled`
- `analyze`
- `anomaly`
- `anomalyFound`
- `anomalyNone`
- `appDocument`
- `appDocumentFilled`
- `appMenu`
- `appUpdate`
- `applicationScreen`
- `applicationScreenAlarmClasses`
- `applicationScreenGlobe`
- `applicationScreenPlay`
- `applicationScreens`
- `applications`
- `apps`
- `archiveDocument`
- `archiveDocumentFilled`
- `areachart`
- `arrowDiagonalBottomLeft`
- `arrowDiagonalBottomRight`
- `arrowDiagonalTopLeft`
- `arrowDiagonalTopRight`
- `arrowDown`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowRightDown`
- `arrowUp`
- `arrowUpLeft`
- `aspects`
- `aspectsFilled`
- `assetIndoor`
- `assetNetwork`
- `assetNetworkFilled`
- `assetOutdoor`
- `asterisk`
- `attach`
- `attachmentUpload`
- `audioDescription1`
- `audioDescription2`
- `auditReport`
- `average`
- `axesSynchronous`
- `axisPositioning`
- `axisRotation`
- `backup`
- `backupFilled`
- `barCode`
- `barchart`
- `barchartHorizontal`
- `batteryCharge`
- `batteryCheck`
- `batteryEmpty`
- `batteryEmptyQuestion`
- `batteryExclamation`
- `batteryFull`
- `batteryFullCheck`
- `batteryHalf`
- `batteryLow`
- `batteryQuarter`
- `batterySlash`
- `batteryThreeQuarter`
- `batteryUprightCharge`
- `batteryUprightCheck`
- `batteryUprightEmpty`
- `batteryUprightExclamation`
- `batteryUprightFull`
- `batteryUprightFullCheck`
- `batteryUprightHalf`
- `batteryUprightLow`
- `batteryUprightQuarter`
- `batteryUprightQuestion`
- `batteryUprightSlash`
- `batteryUprightThreeQuarter`
- `batteryUprightXmark`
- `batteryXmark`
- `bezierCurve`
- `bilibiliLogo`
- `binoculars`
- `binocularsFilled`
- `blazor`
- `book`
- `bookmark`
- `bookmarkFilled`
- `boundarySignals`
- `boxClosed`
- `boxIpc`
- `boxIpcFail`
- `boxIpcQuestion`
- `boxIpcSuccess`
- `boxOpen`
- `boxPlot`
- `boxPlotFilled`
- `bringForward`
- `bringToFront`
- `brush`
- `bug`
- `bugFilled`
- `bugRuntime`
- `bugRuntimeFilled`
- `buildingBlock`
- `buildingBlockFilled`
- `building1`
- `building1Filled`
- `building2`
- `building2Filled`
- `bulb`
- `bulbFilled`
- `calculator`
- `calendar`
- `calendarDay`
- `calendarDayFilled`
- `calendarFilled`
- `calendarSettings`
- `calendarWeek`
- `calendarWeekFilled`
- `cam`
- `camDisk`
- `camDisk10k`
- `camDisk600Seg`
- `camDisk6kSeg`
- `camTrack`
- `cancel`
- `cancelled`
- `capacity`
- `capacityCheck`
- `capacityCheckFilled`
- `capacityFilled`
- `capacityLocked`
- `capacityLockedFilled`
- `capacityPen`
- `capacityPenFilled`
- `capture`
- `car`
- `carFilled`
- `cardLayout`
- `cardLayoutFilled`
- `certificate`
- `certificateError`
- `certificateErrorFilled`
- `certificateExclamation`
- `certificateExclamationFilled`
- `certificateSuccess`
- `certificateSuccessFilled`
- `chainAlternative`
- `chainParallel`
- `chainStep`
- `chartCursor`
- `chartCurveLinear`
- `chartCurveSpline`
- `chartCurveStepped`
- `chartDiagram`
- `chartDiagramAdd`
- `chartDiagrams`
- `chartDurationCurve`
- `chartErrorBar`
- `chartLabels`
- `chartLabelsFilled`
- `chartTypes`
- `chartTypesFilled`
- `chartValueHorizontal`
- `chartValueVertical`
- `check`
- `checkIn`
- `checkOut`
- `checkbox`
- `checkboxComponentChecked`
- `checkboxComponentMixed`
- `checkboxComponentUnchecked`
- `checkboxEmpty`
- `checkboxEmptyFilled`
- `checkboxFilled`
- `checkboxMixed`
- `checkboxMixedFilled`
- `checkboxes`
- `checkboxesEmpty`
- `checkboxesEmptyFilled`
- `checkboxesFilled`
- `chevronDown`
- `chevronDownBar`
- `chevronDownBarSmall`
- `chevronDownSmall`
- `chevronLeft`
- `chevronLeftBar`
- `chevronLeftBarSmall`
- `chevronLeftSmall`
- `chevronRight`
- `chevronRightBar`
- `chevronRightBarSmall`
- `chevronRightSmall`
- `chevronUp`
- `chevronUpBar`
- `chevronUpBarSmall`
- `chevronUpSmall`
- `circle`
- `circleDot`
- `circleDotFilled`
- `circleFilled`
- `circlePause`
- `circlePauseFilled`
- `circlePlay`
- `circlePlayFilled`
- `circleStop`
- `circleStopFilled`
- `clear`
- `clearFilter`
- `clearFilterFilled`
- `clientInterface`
- `clipboard`
- `clipboardFilled`
- `clock`
- `clockFilled`
- `clockPerson`
- `close`
- `closeSmall`
- `cloud`
- `cloudCancelled`
- `cloudCancelledFilled`
- `cloudDownload`
- `cloudDownloadAdd`
- `cloudDownloadAddFilled`
- `cloudDownloadFilled`
- `cloudDownloadList`
- `cloudDownloadListFilled`
- `cloudFail`
- `cloudFailFilled`
- `cloudFilled`
- `cloudNew`
- `cloudNewFilled`
- `cloudRain`
- `cloudRainFilled`
- `cloudSnow`
- `cloudSnowFilled`
- `cloudSuccess`
- `cloudSuccessFilled`
- `cloudThunder`
- `cloudThunderFilled`
- `cloudUpload`
- `cloudUploadFilled`
- `code`
- `codeDocumentCheck`
- `codeFunction`
- `codeScript`
- `coffee`
- `coffeeEmpty`
- `coffeeEmptyFilled`
- `coffeeFilled`
- `cogwheel`
- `cogwheelFilled`
- `coin`
- `coinFilled`
- `coinStack`
- `coinStackFilled`
- `coins`
- `coinsFilled`
- `collapseAll`
- `combine`
- `commentAlt`
- `commentAltFilled`
- `communication`
- `communicationFilled`
- `compactDisc`
- `compactDiscFilled`
- `compare`
- `compoundBlock`
- `configuration`
- `configurationSafety`
- `configure`
- `configureFilled`
- `connected`
- `connectedCircle`
- `connectedCircleFilled`
- `connectionBulb`
- `connectionFail`
- `connectionLocal`
- `connectionSignal`
- `connectionSuccess`
- `connections`
- `connectionsSettings`
- `connectivity`
- `connector`
- `connectorChart`
- `connectorChartFilled`
- `connectorFilled`
- `connectorHex`
- `connectorHexFilled`
- `connectorRect`
- `connectorRectFilled`
- `connectorRhomb`
- `connectorRhombFilled`
- `consistencyCheck`
- `contactDetails`
- `contactDetailsFilled`
- `contextMenu`
- `controlButton`
- `controlCheckbox`
- `controlIoField`
- `controlLabel`
- `controlListBox`
- `controlRadiobutton`
- `controlSelect`
- `controlSlider`
- `controlSpinner`
- `controlSwitch`
- `controlTextButton`
- `controlTextbox`
- `controlTouchArea`
- `controlValueBar`
- `controlledDevice`
- `controllerDevice`
- `controllerDeviceSafety`
- `conversation`
- `conversationFilled`
- `copy`
- `copyFilled`
- `cornerArrowUpLeft`
- `couch`
- `couchFilled`
- `counter`
- `createPlant`
- `createPlantFilled`
- `crosshairs`
- `crosshairsFilled`
- `customer`
- `customerFilled`
- `cut`
- `cutFilled`
- `cycle`
- `cycleAlt`
- `dashboard`
- `dashboardFilled`
- `dashboardPen`
- `dashboardPenFilled`
- `dataEgress`
- `dataIngress`
- `dataIngressEgress`
- `dataManagement`
- `dataManagementFilled`
- `dataTypeBoolean`
- `dataTypeDouble`
- `dataTypeEnum`
- `dataTypeInteger`
- `dataTypeString`
- `dataTypeStringList`
- `database`
- `databaseArrowLeft`
- `databaseFilled`
- `databaseSafety`
- `details`
- `deviceDriver`
- `deviceFan`
- `deviceManager`
- `devicePlay`
- `devicePlayFilled`
- `deviceViewFlat`
- `deviceViewHierarchical`
- `diagramModule`
- `diagramModuleLibrary`
- `diagramModuleNew`
- `diamond`
- `disconnected`
- `disconnectedCircle`
- `disconnectedCircleFilled`
- `disk`
- `diskFilled`
- `diskPen`
- `distributeObjectsHorizontally`
- `distributeObjectsVertically`
- `distribution`
- `docDocument`
- `document`
- `documentBulk`
- `documentCode`
- `documentCodeFilled`
- `documentFail`
- `documentFilled`
- `documentInfo`
- `documentLink`
- `documentManagement`
- `documentMapping`
- `documentMappingFilled`
- `documentPlusMinus`
- `documentPlusMinusFilled`
- `documentProgram`
- `documentProgramFilled`
- `documentReference`
- `documentSettings`
- `documentSuccess`
- `doubleCheck`
- `doubleChevronDown`
- `doubleChevronLeft`
- `doubleChevronRight`
- `doubleChevronUp`
- `doublet`
- `doubletFilled`
- `doughnutchart`
- `doughnutchartFilled`
- `download`
- `downloadAdd`
- `downloadDelta`
- `downloadFull`
- `downloadList`
- `downtime`
- `dragAndDrop`
- `dragGripper`
- `drawCircle`
- `drawCircleArc`
- `drawCircleSegment`
- `drawEllipseSegment`
- `drawerDocuments`
- `drawingDocument`
- `drawingDocumentFilled`
- `drive`
- `driveSafety`
- `drop`
- `dropZone`
- `duplicate`
- `duplicateDocument`
- `duplicateFilled`
- `eMail`
- `eMailFilled`
- `earth`
- `earthFilled`
- `editDocument`
- `editDocumentFilled`
- `editPlant`
- `editPlantFilled`
- `editorGrid`
- `editorGridDots`
- `editorGridLines`
- `editorGridMagnet`
- `editorGridNone`
- `editorGuideLinesMagnet`
- `editorGuides`
- `editorResources`
- `electricalEnergy`
- `electricalEnergyFilled`
- `element`
- `elementFilled`
- `ellipse`
- `ellipseArc`
- `ellipseFilled`
- `emailDocument`
- `emailDocumentFilled`
- `emergencyStop`
- `emergencyStopFilled`
- `emoteHappy`
- `emoteHappyFilled`
- `emoteNeutral`
- `emoteNeutralFilled`
- `emoteSad`
- `emoteSadFilled`
- `error`
- `errorFilled`
- `errorMultiple`
- `errorMultipleFilled`
- `exclamationMark`
- `expandAll`
- `explore`
- `exploreFilled`
- `export`
- `exportCheck`
- `exportFailed`
- `exportProgress`
- `extension`
- `externalEncoder`
- `eye`
- `eyeCancelled`
- `eyeCancelledFilled`
- `eyeDropper`
- `eyeFilled`
- `eyeFocus`
- `eyeMagnifyingGlass`
- `facebookLogo`
- `faceplateContainer`
- `factoryReset`
- `factoryResetFilled`
- `fastForward`
- `fastForwardFilled`
- `feedback`
- `feedbackFilled`
- `filter`
- `filterFilled`
- `filterUpdate`
- `firmware`
- `fitToScreen`
- `flag`
- `flagAlt`
- `flagAltFilled`
- `flagFilled`
- `flare`
- `flashing`
- `flowPhysically`
- `folder`
- `folderApplicationScreen`
- `folderCollapseAll`
- `folderDown`
- `folderDownFilled`
- `folderExpandAll`
- `folderFilled`
- `folderNew`
- `folderNewFilled`
- `folderNewOutline`
- `folderOpen`
- `folderOpenFilled`
- `folderOpenOutline`
- `folderTag`
- `folderUp`
- `folderUpFilled`
- `frames`
- `framesFilled`
- `fullScreen`
- `fullScreenExit`
- `functionBlock`
- `functionBlockLibrary`
- `functionBlockNew`
- `functionBlockSafety`
- `functionDiagram`
- `functionDiagramNew`
- `ganttchart`
- `gauge`
- `gaugeFilled`
- `gaugechart`
- `genericDevice`
- `genericDeviceAlarm`
- `genericDeviceBrackets`
- `genericDeviceCancelled`
- `genericDeviceConnected`
- `genericDeviceDashed`
- `genericDeviceDisconnected`
- `genericDeviceError`
- `genericDeviceFlare`
- `genericDeviceForcedMode`
- `genericDeviceIncompatible`
- `genericDeviceIoUnavailable`
- `genericDeviceLock`
- `genericDeviceMaintenance`
- `genericDevicePause`
- `genericDevicePlay`
- `genericDevicePowerSaving`
- `genericDevicePublished`
- `genericDeviceQuestion`
- `genericDeviceRefresh`
- `genericDeviceReset`
- `genericDeviceRestart`
- `genericDeviceRocket`
- `genericDeviceSafety`
- `genericDeviceShield`
- `genericDeviceShutdown`
- `genericDeviceSlash`
- `genericDeviceSoftwareAlarm`
- `genericDeviceStandby`
- `genericDeviceStop`
- `genericDeviceStopUserprogram`
- `genericDeviceSuccess`
- `genericDeviceSynchronized`
- `genericDeviceTraffic`
- `githubLogo`
- `glassesPlay`
- `globalPlant`
- `globalPlantFilled`
- `globe`
- `globeFilled`
- `globeTag`
- `goto`
- `graph`
- `graphFilled`
- `gridPen`
- `group`
- `groupObjects`
- `hand`
- `handFilled`
- `handshake`
- `hardDiskDrive`
- `hardReset`
- `hardwareCabinet`
- `hatMan`
- `hatManFilled`
- `heading`
- `health`
- `healthFilled`
- `heart`
- `heartFilled`
- `heatMapChart`
- `heatMapChartFilled`
- `height`
- `helmetSafety`
- `helmetSafetyFilled`
- `hexagonVerticalBars`
- `hexagonVerticalBarsDatabase`
- `hexagonVerticalBarsDatabaseFilled`
- `hexagonVerticalBarsFilled`
- `hierarchy`
- `highlight`
- `highlightFilled`
- `history`
- `historyList`
- `home`
- `homeFilled`
- `hourglass`
- `hourglassEmpty`
- `hourglassEnd`
- `hourglassFilled`
- `hourglassStart`
- `id`
- `idFilled`
- `image`
- `imageFilled`
- `import`
- `importCheck`
- `importFailed`
- `importProgress`
- `incompatible`
- `indicator`
- `indicatorFilled`
- `info`
- `infoFeed`
- `infoFilled`
- `infoMultiple`
- `infoMultipleFilled`
- `ingestion`
- `ingestionReport`
- `inkPen`
- `inkPenAdd`
- `inkPenFilled`
- `inquiry`
- `inquiryFilled`
- `inquiryMail`
- `instagramLogo`
- `interpreter`
- `interpreterFilled`
- `ipcs`
- `itemDetails`
- `itemDetailsFilled`
- `javaScript`
- `javaScriptConnection`
- `jigsaw`
- `jigsawDetails`
- `jigsawDetailsFilled`
- `jigsawFilled`
- `join`
- `jsonDocument`
- `jsonDocumentFilled`
- `key`
- `keyboard`
- `keyboardDockedBottom`
- `keyboardFloating`
- `keyboardFramed`
- `kinematics`
- `kpi`
- `kpiFilled`
- `label`
- `labelFilled`
- `landingPageLogo`
- `language`
- `languageFilled`
- `layers`
- `layersFilled`
- `leadingAxisProxy`
- `leaf`
- `legal`
- `legalCircle`
- `legalCircleFilled`
- `library`
- `libraryNew`
- `license`
- `lightDark`
- `limitsCancelled`
- `limitsCheck`
- `lineCapFlat`
- `lineCapRound`
- `lineCapSquare`
- `lineDash`
- `lineDashDot`
- `lineDashDotDot`
- `lineDiagonal`
- `lineDot`
- `lineSolid`
- `linechart`
- `link`
- `linkBreak`
- `linkDiagonal`
- `linkedinLogo`
- `list`
- `listAdd`
- `listGraphics`
- `listGraphicsText`
- `listPercentage`
- `listRemove`
- `listSorted`
- `listSortedAlt`
- `listText`
- `liveFeed`
- `liveSchedule`
- `location`
- `locationFilled`
- `lock`
- `lockCheck`
- `lockFilled`
- `lockKey`
- `lockKeyFilled`
- `log`
- `logIn`
- `logOut`
- `logicDiagram`
- `longer`
- `lowerLimit`
- `machineA`
- `machineAFilled`
- `machineB`
- `machineBFilled`
- `machineC`
- `machineCFilled`
- `magnet`
- `magnetCancelled`
- `mail`
- `mailAlarmAnalog`
- `mailAlarmClasses`
- `mailAlarmDiscrete`
- `mailFilled`
- `maintenance`
- `maintenanceDocuments`
- `maintenanceFilled`
- `maintenanceInfo`
- `maintenanceInfoFilled`
- `maintenanceOctagon`
- `maintenanceOctagonFilled`
- `maintenanceRhomb`
- `maintenanceRhombFilled`
- `maintenanceSquare`
- `maintenanceSquareFilled`
- `maintenanceTriangle`
- `maintenanceTriangleFilled`
- `maintenanceWarning`
- `maintenanceWarningFilled`
- `mandatory`
- `mandatoryDone`
- `map`
- `mapAlt1`
- `mapAlt1Filled`
- `mapAlt2`
- `mapAlt2Filled`
- `mapAlt3`
- `mapAlt3Filled`
- `mastodonLogo`
- `maximize`
- `measuringInput`
- `mediaPlayer`
- `microphone`
- `microphoneFilled`
- `minimize`
- `minus`
- `missingSymbol`
- `mix`
- `mobilePhone`
- `mobilePhoneFilled`
- `monitor`
- `monitorFilled`
- `monitorTrend`
- `monitoring`
- `monitoringAdd`
- `monitorings`
- `moon`
- `moonFilled`
- `moreMenu`
- `mouseClick`
- `mouseClickFilled`
- `mouseSelect`
- `mouseSelectFilled`
- `move`
- `moveHorizontally`
- `moveLayerDown`
- `moveLayerUp`
- `moveVertically`
- `movie`
- `movieFilled`
- `mp4Document`
- `mqtt`
- `mqttFilled`
- `musicNote`
- `namurCheckFunction`
- `namurCheckFunctionFilled`
- `namurDiagnosticsPassive`
- `namurDiagnosticsPassiveFilled`
- `namurFailure`
- `namurFailureFilled`
- `namurMaintenanceRequired`
- `namurMaintenanceRequiredFilled`
- `namurOk`
- `namurOkFilled`
- `namurOutOfSpec`
- `namurOutOfSpecFilled`
- `navigation`
- `navigationFilled`
- `navigationLeft`
- `navigationLeftHide`
- `navigationRight`
- `navigationRightHide`
- `networkDevice`
- `networkDeviceFilled`
- `networkDevicePlay`
- `networkDevicePlayFilled`
- `networkWired`
- `networkWiredWireless`
- `newIndicator`
- `newIndicatorFilled`
- `noFilter`
- `noFilterFilled`
- `noImage`
- `note`
- `noteFilled`
- `notebook`
- `notebookFilled`
- `notification`
- `notificationFilled`
- `notifications`
- `notificationsFilled`
- `objects`
- `objectsTree`
- `ontology`
- `ontologyFilled`
- `openExternal`
- `openFile`
- `openFileFilled`
- `operatePlant`
- `operatePlantFilled`
- `operatingSystem`
- `optimize`
- `outputCam`
- `pAndISymbols`
- `pIDiagram`
- `package`
- `packageFilled`
- `pan`
- `panelIpc`
- `panelIpcFail`
- `panelIpcQuestion`
- `panelIpcSuccess`
- `parameter`
- `paste`
- `pasteFilled`
- `pause`
- `pcTower`
- `pcTowerFilled`
- `pcTowerSettings`
- `pcTowerSettingsFilled`
- `pdfDocument`
- `pdfDocumentFilled`
- `pen`
- `penCancelled`
- `penCancelledFilled`
- `penFilled`
- `phone`
- `phoneFilled`
- `photoCamera`
- `photoCameraAdd`
- `photoCameraCancelled`
- `photoCameraCancelledFilled`
- `photoCameraFilled`
- `photoCameras`
- `piechart`
- `piechartFilled`
- `pin`
- `pinCancelled`
- `pinCancelledFilled`
- `pinFilled`
- `plant`
- `plantDetails`
- `plantDetailsFilled`
- `plantFilled`
- `plantHandbook`
- `plantHandbookFilled`
- `plantSearch`
- `plantSearchFilled`
- `plantSecurity`
- `plantSecurityFilled`
- `plantSettings`
- `plantSettingsFilled`
- `plantUser`
- `plantUserFilled`
- `plants`
- `plantsFilled`
- `play`
- `playFilled`
- `playPause`
- `playPauseFilled`
- `playStepwise`
- `playStepwiseFilled`
- `plc`
- `plcDevice`
- `plcDeviceTag`
- `plcDeviceUserDataType`
- `plcTag`
- `plcUserDataType`
- `plus`
- `plusMinusTimesDivide`
- `pointUp`
- `pointUpFilled`
- `polarPlot`
- `polarchart`
- `polarchartFilled`
- `polygon`
- `polygonFilled`
- `polygonLine`
- `powerSupply`
- `pptDocument`
- `print`
- `printFilled`
- `prioHigh`
- `prioLow`
- `prioMiddle`
- `processControl`
- `product`
- `productCatalog`
- `productManagement`
- `profisafeLogo`
- `project`
- `projectArrowDiagonalTopRight`
- `projectArrowLeft`
- `projectArrowRight`
- `projectClose`
- `projectConfiguration`
- `projectDuplicate`
- `projectHistory`
- `projectNew`
- `projectScenarios`
- `projectServer`
- `projectServerFilled`
- `projectSettings`
- `projectSimulation`
- `projects`
- `projectsClose`
- `protocol`
- `publish`
- `publishDocument`
- `qrCode`
- `qualityReport`
- `question`
- `questionFilled`
- `questionMark`
- `quote`
- `rackIpc`
- `rackIpcFail`
- `rackIpcQuestion`
- `rackIpcSuccess`
- `radarchart`
- `radioWaves`
- `radioWavesOff`
- `radioWavesWarning`
- `random`
- `randomFilled`
- `reboot`
- `record`
- `recordFilled`
- `rectangle`
- `rectangleFilled`
- `redditLogo`
- `redo`
- `reference`
- `referencePointBottomLeft`
- `referencePointBottomRight`
- `referencePointCentered`
- `referencePointTopLeft`
- `referencePointTopRight`
- `refresh`
- `refreshArrowDown`
- `refreshCancelled`
- `refreshExclamation`
- `refreshSettings`
- `reload`
- `remoteAccess`
- `removeApplication`
- `removeCircle`
- `removeCircleFilled`
- `removeEye`
- `removeEyeFilled`
- `rename`
- `reorder`
- `replace`
- `reportBarchart`
- `reportGeneral`
- `reportLinechart`
- `reportText`
- `reset`
- `restart`
- `restore`
- `restoreBackup`
- `restoreBackupFilled`
- `restoreBackupPc`
- `rewind`
- `rewindFilled`
- `rhomb`
- `rhombFilled`
- `road`
- `roadFilled`
- `roboticArm`
- `roboticGripper`
- `rocket`
- `rocketCircle`
- `rocketCircleFilled`
- `rocketFilled`
- `roles`
- `rolesFilled`
- `rotate`
- `rotate180`
- `rotate90Left`
- `rotate90Right`
- `route`
- `routeTarget`
- `rulerDiagonal`
- `rulerHorizontal`
- `rulerVertical`
- `rules`
- `rulesFilled`
- `runtimePlay`
- `runtimeSettings`
- `runtimeStop`
- `safetySettings`
- `sankeychart`
- `saveAll`
- `scale`
- `scatterplot`
- `scheduler`
- `schedulerFilled`
- `screen`
- `screenDuplicate`
- `screenDuplicateFilled`
- `screenFilled`
- `screenPcTower`
- `screenPcTowerFilled`
- `screenPcTowerSettings`
- `screenPcTowerSettingsFilled`
- `screenSettings`
- `screenSettingsFilled`
- `screens`
- `screensFilled`
- `screenshot`
- `screenshotFilled`
- `script`
- `scriptAdd`
- `scripts`
- `sdCard`
- `sdCardFilled`
- `sdCardMicro`
- `sdCardMicroFilled`
- `search`
- `selectAlt`
- `selectAltFilled`
- `sendBackward`
- `sendRight`
- `sendRightFilled`
- `sendToBack`
- `sendTopRight`
- `sendTopRightFilled`
- `sensor`
- `separatorLine`
- `serverInterface`
- `shapes`
- `shapesFilled`
- `share`
- `shareAlt`
- `shareAltFilled`
- `shareFilled`
- `shield`
- `shieldBroken`
- `shieldBrokenFilled`
- `shieldCheck`
- `shieldCheckFilled`
- `shieldFilled`
- `shieldHalf`
- `shift`
- `shiftFilled`
- `shoppingCart`
- `shoppingCartFilled`
- `shorter`
- `shout`
- `shoutFilled`
- `shutdown`
- `signLanguage`
- `signalStrength0`
- `signalStrength1`
- `signalStrength2`
- `signalStrength3`
- `signalStrength4`
- `signalStrength5`
- `signalStrength6`
- `signalStrength7`
- `signalStrength8`
- `simitComponent`
- `simitMacro`
- `simitMacroComponentEditor`
- `simulationTable`
- `singleCheck`
- `skip`
- `skipBack`
- `skipBackFilled`
- `skipFilled`
- `sms`
- `snowflake`
- `solidStateDrive`
- `sort`
- `sortAlt`
- `sortAscending`
- `sortDescending`
- `soundLoud`
- `soundLoudFilled`
- `soundMute`
- `soundMuteFilled`
- `soundOff`
- `soundOffFilled`
- `soundQuiet`
- `soundQuietFilled`
- `spatial`
- `spiderchart`
- `spiderchartFilled`
- `split`
- `splitHorizontally`
- `splitVertically`
- `stackedBarchart`
- `stamp`
- `stampFilled`
- `standby`
- `star`
- `starAdd`
- `starAddFilled`
- `starCancelled`
- `starCancelledFilled`
- `starFilled`
- `starHalfFilled`
- `starList`
- `starListFilled`
- `startDataAnalysis`
- `steering`
- `steeringUser`
- `steeringUserFilled`
- `stethoscope`
- `stop`
- `stopFilled`
- `stopwatch`
- `stopwatchFilled`
- `storage`
- `storageFilled`
- `subtitle`
- `subtitleFilled`
- `success`
- `successFilled`
- `successMultiple`
- `successMultipleFilled`
- `sun`
- `sunCloud`
- `sunCloudFilled`
- `sunFilled`
- `sunrise`
- `sunriseFilled`
- `sunset`
- `sunsetFilled`
- `support`
- `surveillance`
- `surveillanceCancelled`
- `surveillanceCancelledFilled`
- `surveillanceFilled`
- `svgDocument`
- `swapLeftRight`
- `switchSlider`
- `swordSwing`
- `table`
- `tableAddColumnRight`
- `tableAddRowBelow`
- `tableColumns`
- `tableInsertColumnLeft`
- `tableInsertColumnRight`
- `tableInsertRowAbove`
- `tableInsertRowBelow`
- `tableRows`
- `tableSettings`
- `tableTag`
- `tag`
- `tagArrowLeft`
- `tagArrowLeftFilled`
- `tagArrowRight`
- `tagArrowRightFilled`
- `tagCircleArrowDown`
- `tagCircleArrowDownFilled`
- `tagConnection`
- `tagConnectionFilled`
- `tagConnectionView`
- `tagEye`
- `tagEyeFilled`
- `tagFilled`
- `tagLogging`
- `tagLoggingFilled`
- `tagPlus`
- `tagPlusFilled`
- `tagSafety`
- `tagSafetyFilled`
- `tasksAll`
- `tasksDone`
- `tasksOpen`
- `telegramLogo`
- `text`
- `textAlginmentCenter`
- `textAlginmentJustified`
- `textAlginmentLeft`
- `textAlginmentRight`
- `textBold`
- `textCircleRectangle`
- `textCircleRectangleFilled`
- `textDocument`
- `textItalic`
- `textStrikeThrough`
- `textUnderline`
- `thermometer`
- `thermometerFilled`
- `threadsLogo`
- `thresholdCancelled`
- `thresholdOff`
- `thresholdOn`
- `thumbDown`
- `thumbDownFilled`
- `thumbUp`
- `thumbUpFilled`
- `ticket`
- `ticketFilled`
- `tiktokLogo`
- `tiles`
- `tilesFilled`
- `timeZone`
- `timeZoneFilled`
- `toBePublished`
- `toSearch`
- `topic`
- `topicFilled`
- `touch`
- `touchFilled`
- `traceEye`
- `trafficLeftRight`
- `train`
- `trainFilled`
- `trashcan`
- `trashcanFilled`
- `tree`
- `treeTwoLevel`
- `trend`
- `trendCompanion`
- `trendDownward`
- `trendDownwardCircle`
- `trendDownwardFilled`
- `trendFlatCurve`
- `trendSideways`
- `trendSidewaysCircle`
- `trendSidewaysFilled`
- `trendUpward`
- `trendUpwardCircle`
- `trendUpwardFilled`
- `triangle`
- `triangleFilled`
- `trophy`
- `trophyFilled`
- `truck`
- `truckFilled`
- `tulip`
- `tulipFilled`
- `txtDocument`
- `txtDocumentFilled`
- `undo`
- `ungroup`
- `ungroupObjects`
- `unlock`
- `unlockFilled`
- `unlockPlant`
- `unlockPlantFilled`
- `updateApplication`
- `upload`
- `uploadDocumentNote`
- `uploadFail`
- `uploadSuccess`
- `upperLimit`
- `usbDrive`
- `user`
- `userCheck`
- `userCheckFilled`
- `userDataTypes`
- `userFail`
- `userFailFilled`
- `userFilled`
- `userGroup`
- `userKey`
- `userLock`
- `userLockFilled`
- `userManagement`
- `userManagementFilled`
- `userManagementSettings`
- `userManagementSettingsFilled`
- `userManual`
- `userManualFilled`
- `userPen`
- `userProfile`
- `userProfileFilled`
- `userReading`
- `userReadingFilled`
- `userReadingReading`
- `userSettings`
- `userSettingsFilled`
- `userSuccess`
- `userSuccessFilled`
- `validate`
- `variable`
- `vdiFolder`
- `versionHistory`
- `videoCamera`
- `videoCameraFilled`
- `videoCameraRecord`
- `videoCameraRecordFilled`
- `videoFile`
- `videoFileFilled`
- `vivaEngageLogo`
- `voltage`
- `voltageFilled`
- `warning`
- `warningFilled`
- `warningHexagon`
- `warningHexagonFilled`
- `warningMultiple`
- `warningMultipleFilled`
- `warningOctagon`
- `warningOctagonFilled`
- `warningRhomb`
- `warningRhombFilled`
- `warningRhombMultiple`
- `warningRhombMultipleFilled`
- `warningSquare`
- `warningSquareFilled`
- `watchTable`
- `waterBathing`
- `waterFish`
- `waterPlant`
- `waterSunbathing`
- `waveform`
- `webBrowserScreen`
- `webcam`
- `webcamCancelled`
- `webcamCancelledFilled`
- `webcamFilled`
- `wechatLogo`
- `weiboLogo`
- `width`
- `wlanOff`
- `wlanStrength0`
- `wlanStrength1`
- `wlanStrength1Lock`
- `wlanStrength2`
- `wlanStrength2Lock`
- `wlanStrength3`
- `wlanStrength3Lock`
- `wlanWarning`
- `workCase`
- `workCaseFilled`
- `workspace`
- `workspaces`
- `xAxisSettings`
- `xLogo`
- `xlsDocument`
- `xlsDocumentFilled`
- `xmlDocument`
- `yAxisSettings`
- `youtube`
- `youtubeFilled`
- `zone`
- `zoomIn`
- `zoomOut`
- `zoomSelection`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AboutIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AboutFilledIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddApplicationIcon size="20" class="nav-icon" /> Settings</a>
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
<AboutIcon
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
    <AboutIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AboutFilledIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AboutIcon size="24" />
   <AboutFilledIcon size="24" color="#4a90e2" />
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
   <AboutIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AboutIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AboutIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { about } from '@stacksjs/iconify-ix'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(about, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { about } from '@stacksjs/iconify-ix'

// Icons are typed as IconData
const myIcon: IconData = about
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/siemens/ix-icons/blob/main/LICENSE.md) for more information.

## Credits

- **Icons**: Siemens AG ([Website](https://github.com/siemens/ix-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ix/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ix/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
