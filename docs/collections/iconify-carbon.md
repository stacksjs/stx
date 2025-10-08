# Carbon

> Carbon icons for stx from Iconify

## Overview

This package provides access to 2508 icons from the Carbon collection through the stx iconify integration.

**Collection ID:** `carbon`
**Total Icons:** 2508
**Author:** IBM ([Website](https://github.com/carbon-design-system/carbon/tree/main/packages/icons))
**License:** Apache 2.0
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-carbon
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dCursorIcon height="1em" />
<3dCursorIcon width="1em" height="1em" />
<3dCursorIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dCursorIcon size="24" />
<3dCursorIcon size="1em" />

<!-- Using width and height -->
<3dCursorIcon width="24" height="32" />

<!-- With color -->
<3dCursorIcon size="24" color="red" />
<3dCursorIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dCursorIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dCursorIcon
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
    <3dCursorIcon size="24" />
    <3dCursorAltIcon size="24" color="#4a90e2" />
    <3dCurveAutoColonIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dCursor, 3dCursorAlt, 3dCurveAutoColon } from '@stacksjs/iconify-carbon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dCursor, { size: 24 })
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
<3dCursorIcon size="24" color="red" />
<3dCursorIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dCursorIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dCursorIcon size="24" class="text-primary" />
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
<3dCursorIcon height="1em" />
<3dCursorIcon width="1em" height="1em" />
<3dCursorIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dCursorIcon size="24" />
<3dCursorIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.carbon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dCursorIcon class="carbon-icon" />
```

## Available Icons

This package contains **2508** icons:

- `3dCursor`
- `3dCursorAlt`
- `3dCurveAutoColon`
- `3dCurveAutoVessels`
- `3dCurveManual`
- `3dIca`
- `3dMprToggle`
- `3dPrintMesh`
- `3dSoftware`
- `3rdPartyConnected`
- `4k`
- `4kFilled`
- `acceptActionUsage`
- `accessibility`
- `accessibilityAlt`
- `accessibilityColor`
- `accessibilityColorFilled`
- `account`
- `accumulationIce`
- `accumulationPrecipitation`
- `accumulationRain`
- `accumulationSnow`
- `actionDefinition`
- `actionUsage`
- `activity`
- `add`
- `addAlt`
- `addChildNode`
- `addComment`
- `addFilled`
- `addLarge`
- `addParentNode`
- `aggregatorCountRows`
- `aggregatorRecalculation`
- `agricultureAnalytics`
- `ai`
- `aiBusinessImpactAssessment`
- `aiFinancialSustainabilityCheck`
- `aiGenerate`
- `aiGovernanceLifecycle`
- `aiGovernanceTracked`
- `aiGovernanceUntracked`
- `aiLabel`
- `aiLaunch`
- `aiRecommend`
- `aiResults`
- `aiResultsHigh`
- `aiResultsLow`
- `aiResultsMedium`
- `aiResultsUrgent`
- `aiResultsVeryHigh`
- `aiStatus`
- `aiStatusComplete`
- `aiStatusFailed`
- `aiStatusInProgress`
- `aiStatusQueued`
- `aiStatusRejected`
- `airlineDigitalGate`
- `airlineManageGates`
- `airlinePassengerCare`
- `airlineRapidBoard`
- `airplay`
- `airplayFilled`
- `airport01`
- `airport02`
- `airportLocation`
- `alarm`
- `alarmAdd`
- `alarmSubtract`
- `alignBoxBottomCenter`
- `alignBoxBottomLeft`
- `alignBoxBottomRight`
- `alignBoxMiddleCenter`
- `alignBoxMiddleLeft`
- `alignBoxMiddleRight`
- `alignBoxTopCenter`
- `alignBoxTopLeft`
- `alignBoxTopRight`
- `alignHorizontalCenter`
- `alignHorizontalLeft`
- `alignHorizontalRight`
- `alignVerticalBottom`
- `alignVerticalCenter`
- `alignVerticalTop`
- `analytics`
- `analyticsCustom`
- `analyticsReference`
- `anchor`
- `angle`
- `annotationVisibility`
- `aperture`
- `api`
- `api1`
- `apiKey`
- `app`
- `appConnectivity`
- `apple`
- `appleDash`
- `application`
- `applicationMobile`
- `applicationVirtual`
- `applicationWeb`
- `apps`
- `archive`
- `area`
- `areaCustom`
- `arithmeticMean`
- `arithmeticMedian`
- `arrange`
- `arrangeHorizontal`
- `arrangeVertical`
- `array`
- `arrayBooleans`
- `arrayDates`
- `arrayNumbers`
- `arrayObjects`
- `arrayStrings`
- `arrival`
- `arrowAnnotation`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowLeft`
- `arrowRight`
- `arrowShiftDown`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpRight`
- `arrowsHorizontal`
- `arrowsVertical`
- `asleep`
- `asleepFilled`
- `assembly`
- `assemblyCluster`
- `assemblyReference`
- `asset`
- `assetConfirm`
- `assetDigitalTwin`
- `assetMovement`
- `assetView`
- `assignmentActionUsage`
- `asterisk`
- `async`
- `at`
- `attachment`
- `attributeDefinition`
- `attributeUsage`
- `audioConsole`
- `augmentedReality`
- `autoScroll`
- `automatic`
- `autoscaling`
- `avro`
- `awake`
- `badge`
- `baggageClaim`
- `bar`
- `barcode`
- `bareMetalServer`
- `bareMetalServer01`
- `bareMetalServer02`
- `barrier`
- `baseDocumentSet`
- `basketball`
- `bastionHost`
- `bat`
- `batchJob`
- `batchJobStep`
- `batteryCharging`
- `batteryEmpty`
- `batteryError`
- `batteryFull`
- `batteryHalf`
- `batteryLow`
- `batteryQuarter`
- `batteryWarning`
- `bee`
- `beeBat`
- `beta`
- `bicycle`
- `binding01`
- `binding02`
- `binoculars`
- `blandAltmanPlot`
- `blochSphere`
- `blockStorage`
- `blockStorageAlt`
- `blockchain`
- `blog`
- `bluetooth`
- `bluetoothOff`
- `book`
- `bookmark`
- `bookmarkAdd`
- `bookmarkFilled`
- `boolean`
- `boot`
- `bootVolume`
- `bootVolumeAlt`
- `borderBottom`
- `borderFull`
- `borderLeft`
- `borderNone`
- `borderRight`
- `borderTop`
- `bot`
- `bottles01`
- `bottles01Dash`
- `bottles02`
- `bottles02Dash`
- `bottlesContainer`
- `bottomPanelClose`
- `bottomPanelCloseFilled`
- `bottomPanelOpen`
- `bottomPanelOpenFilled`
- `box`
- `boxExtraLarge`
- `boxLarge`
- `boxMedium`
- `boxPlot`
- `boxSmall`
- `branch`
- `breakingChange`
- `brightnessContrast`
- `bringForward`
- `bringToFront`
- `brushFreehand`
- `brushPolygon`
- `buildImage`
- `buildRun`
- `buildTool`
- `building`
- `buildingInsights1`
- `buildingInsights2`
- `buildingInsights3`
- `bullhorn`
- `buoy`
- `bus`
- `businessMetrics`
- `businessProcesses`
- `buttonCentered`
- `buttonFlushLeft`
- `cabinCare`
- `cabinCareAlert`
- `cabinCareAlt`
- `cad`
- `cafe`
- `calculation`
- `calculationAlt`
- `calculator`
- `calculatorCheck`
- `calendar`
- `calendarAdd`
- `calendarAddAlt`
- `calendarHeatMap`
- `calendarSettings`
- `calendarTools`
- `calibrate`
- `calls`
- `callsAll`
- `callsIncoming`
- `camera`
- `cameraAction`
- `campsite`
- `car`
- `carFront`
- `carbon`
- `carbonAccounting`
- `carbonForAem`
- `carbonForIbmDotcom`
- `carbonForIbmProduct`
- `carbonForMobile`
- `carbonForSalesforce`
- `carbonUiBuilder`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretSort`
- `caretSortDown`
- `caretSortUp`
- `caretUp`
- `carouselHorizontal`
- `carouselVertical`
- `catalog`
- `catalogPublish`
- `categories`
- `category`
- `categoryAdd`
- `categoryAnd`
- `categoryNew`
- `categoryNewEach`
- `ccx`
- `cdArchive`
- `cdCreateArchive`
- `cdCreateExchange`
- `cda`
- `cellTower`
- `centerCircle`
- `centerSquare`
- `centerToFit`
- `certificate`
- `certificateCheck`
- `changeCatalog`
- `channels`
- `characterDecimal`
- `characterFraction`
- `characterInteger`
- `characterLowerCase`
- `characterNegativeNumber`
- `characterPatterns`
- `characterSentenceCase`
- `characterUpperCase`
- `characterWholeNumber`
- `chargingStation`
- `chargingStationFilled`
- `chart3d`
- `chartArea`
- `chartAreaSmooth`
- `chartAreaStepper`
- `chartAverage`
- `chartBar`
- `chartBarFloating`
- `chartBarOverlay`
- `chartBarStacked`
- `chartBarTarget`
- `chartBubble`
- `chartBubblePacked`
- `chartBullet`
- `chartCandlestick`
- `chartClusterBar`
- `chartColumn`
- `chartColumnFloating`
- `chartColumnTarget`
- `chartCombo`
- `chartComboStacked`
- `chartCustom`
- `chartDualYAxis`
- `chartErrorBar`
- `chartErrorBarAlt`
- `chartEvaluation`
- `chartHighLow`
- `chartHistogram`
- `chartLine`
- `chartLineData`
- `chartLineSmooth`
- `chartLogisticRegression`
- `chartMarimekko`
- `chartMaximum`
- `chartMedian`
- `chartMinimum`
- `chartMultiLine`
- `chartMultitype`
- `chartNetwork`
- `chartParallel`
- `chartPie`
- `chartPlanningWaterfall`
- `chartPoint`
- `chartPopulation`
- `chartRadar`
- `chartRadial`
- `chartRelationship`
- `chartRing`
- `chartRiver`
- `chartRose`
- `chartScatter`
- `chartSpiral`
- `chartStacked`
- `chartStepper`
- `chartSunburst`
- `chartTSne`
- `chartTreemap`
- `chartVennDiagram`
- `chartViolinPlot`
- `chartWaterfall`
- `chartWinLoss`
- `chat`
- `chatBot`
- `chatLaunch`
- `chatOff`
- `chatOperational`
- `checkbox`
- `checkboxChecked`
- `checkboxCheckedFilled`
- `checkboxIndeterminate`
- `checkboxIndeterminateFilled`
- `checkboxUndeterminateFilled`
- `checkmark`
- `checkmarkFilled`
- `checkmarkFilledError`
- `checkmarkFilledWarning`
- `checkmarkOutline`
- `checkmarkOutlineError`
- `checkmarkOutlineWarning`
- `chemistry`
- `chemistryReference`
- `chevronDown`
- `chevronDownOutline`
- `chevronLeft`
- `chevronMini`
- `chevronRight`
- `chevronSort`
- `chevronSortDown`
- `chevronSortUp`
- `chevronUp`
- `chevronUpOutline`
- `childNode`
- `chip`
- `choices`
- `chooseItem`
- `choroplethMap`
- `cicsCmas`
- `cicsDb2Connection`
- `cicsExplorer`
- `cicsProgram`
- `cicsRegion`
- `cicsRegionAlt`
- `cicsRegionRouting`
- `cicsRegionTarget`
- `cicsSit`
- `cicsSitOverrides`
- `cicsSystemGroup`
- `cicsTransactionServerZos`
- `cicsWuiRegion`
- `cicsplex`
- `circleDash`
- `circleFilled`
- `circleMeasurement`
- `circleOutline`
- `circlePacking`
- `circleSolid`
- `circuitComposer`
- `classification`
- `classifierLanguage`
- `clean`
- `close`
- `closeFilled`
- `closeLarge`
- `closeOutline`
- `closedCaption`
- `closedCaptionAlt`
- `closedCaptionFilled`
- `cloud`
- `cloudAlerting`
- `cloudApp`
- `cloudAuditing`
- `cloudCeiling`
- `cloudDataOps`
- `cloudDownload`
- `cloudFoundry1`
- `cloudFoundry2`
- `cloudLogging`
- `cloudMonitoring`
- `cloudOffline`
- `cloudRegistry`
- `cloudSatellite`
- `cloudSatelliteConfig`
- `cloudSatelliteLink`
- `cloudSatelliteServices`
- `cloudServiceManagement`
- `cloudServices`
- `cloudUpload`
- `cloudy`
- `cobbAngle`
- `code`
- `codeBlock`
- `codeHide`
- `codeReference`
- `codeSigningService`
- `cognitive`
- `collaborate`
- `collapseAll`
- `collapseCategories`
- `colorPalette`
- `colorSwitch`
- `column`
- `columnDelete`
- `columnDependency`
- `columnInsert`
- `comments`
- `commit`
- `communicationUnified`
- `compare`
- `compass`
- `composerEdit`
- `concept`
- `conditionPoint`
- `conditionWaitPoint`
- `connect`
- `connectRecursive`
- `connectReference`
- `connectSource`
- `connectTarget`
- `connectionFlowUsage`
- `connectionReceive`
- `connectionSend`
- `connectionSignal`
- `connectionSignalOff`
- `connectionTwoWay`
- `connectionUsage`
- `constraint`
- `construction`
- `containerEngine`
- `containerImage`
- `containerImagePull`
- `containerImagePush`
- `containerImagePushPull`
- `containerRegistry`
- `containerRuntime`
- `containerRuntimeMonitor`
- `containerServices`
- `containerSoftware`
- `contentDeliveryNetwork`
- `contentView`
- `continue`
- `continueFilled`
- `continuousDeployment`
- `continuousIntegration`
- `contourDraw`
- `contourEdit`
- `contourFinding`
- `contrast`
- `convertToCloud`
- `cookie`
- `copy`
- `copyFile`
- `copyLink`
- `corn`
- `corner`
- `coronavirus`
- `cost`
- `costTotal`
- `cough`
- `course`
- `covariate`
- `createLink`
- `credentials`
- `crop`
- `cropGrowth`
- `cropHealth`
- `crossReference`
- `crossTab`
- `crossroads`
- `crowdReport`
- `crowdReportFilled`
- `csv`
- `cu1`
- `cu3`
- `cube`
- `cubeView`
- `currency`
- `currencyBaht`
- `currencyDollar`
- `currencyEuro`
- `currencyLira`
- `currencyPound`
- `currencyRuble`
- `currencyRupee`
- `currencyShekel`
- `currencyWon`
- `currencyYen`
- `cursor1`
- `cursor2`
- `customer`
- `customerService`
- `cut`
- `cutInHalf`
- `cutOut`
- `cy`
- `cyclist`
- `cz`
- `dashboard`
- `dashboardReference`
- `data1`
- `data2`
- `dataAccessor`
- `dataAnalytics`
- `dataBackup`
- `dataBase`
- `dataBaseAlt`
- `dataBin`
- `dataBlob`
- `dataCategorical`
- `dataCenter`
- `dataCheck`
- `dataClass`
- `dataCollection`
- `dataConnected`
- `dataDefinition`
- `dataDiode`
- `dataEnrichment`
- `dataEnrichmentAdd`
- `dataError`
- `dataFormat`
- `dataPlayer`
- `dataQualityDefinition`
- `dataReference`
- `dataRefinery`
- `dataRefineryReference`
- `dataRegular`
- `dataSet`
- `dataShare`
- `dataStructured`
- `dataTable`
- `dataTableReference`
- `dataUnreal`
- `dataUnstructured`
- `dataView`
- `dataViewAlt`
- `dataVis1`
- `dataVis2`
- `dataVis3`
- `dataVis4`
- `dataVolume`
- `dataVolumeAlt`
- `databaseDatastax`
- `databaseElastic`
- `databaseEnterpriseDb2`
- `databaseEnterprisedb`
- `databaseEtcd`
- `databaseMessaging`
- `databaseMongodb`
- `databasePostgresql`
- `databaseRabbit`
- `databaseRedis`
- `datastore`
- `db2BufferPool`
- `db2DataSharingGroup`
- `db2Database`
- `debug`
- `decisionNode`
- `decisionTree`
- `delete`
- `delivery`
- `deliveryAdd`
- `deliveryParcel`
- `deliverySettings`
- `deliveryTruck`
- `demo`
- `denominate`
- `departure`
- `dependency`
- `deploy`
- `deployRules`
- `deploymentCanary`
- `deploymentPattern`
- `deploymentPolicy`
- `deploymentUnitData`
- `deploymentUnitExecution`
- `deploymentUnitInstallation`
- `deploymentUnitPresentation`
- `deploymentUnitTechnicalData`
- `deploymentUnitTechnicalExecution`
- `deploymentUnitTechnicalInstallation`
- `deploymentUnitTechnicalPresentation`
- `deskAdjustable`
- `development`
- `devices`
- `devicesApps`
- `dewPoint`
- `dewPointFilled`
- `diagram`
- `diagramReference`
- `diamondOutline`
- `diamondSolid`
- `dicom6000`
- `dicomOverlay`
- `directLink`
- `directionBearRight01`
- `directionBearRight01Filled`
- `directionBearRight02`
- `directionBearRight02Filled`
- `directionCurve`
- `directionCurveFilled`
- `directionFork`
- `directionForkFilled`
- `directionLoopLeft`
- `directionLoopLeftFilled`
- `directionLoopRight`
- `directionLoopRightFilled`
- `directionMerge`
- `directionMergeFilled`
- `directionRight01`
- `directionRight01Filled`
- `directionRight02`
- `directionRight02Filled`
- `directionRotaryFirstRight`
- `directionRotaryFirstRightFilled`
- `directionRotaryRight`
- `directionRotaryRightFilled`
- `directionRotaryStraight`
- `directionRotaryStraightFilled`
- `directionSharpTurn`
- `directionSharpTurnFilled`
- `directionStraight`
- `directionStraightFilled`
- `directionStraightRight`
- `directionStraightRightFilled`
- `directionUTurn`
- `directionUTurnFilled`
- `directoryDomain`
- `distributeHorizontalCenter`
- `distributeHorizontalLeft`
- `distributeHorizontalRight`
- `distributeVerticalBottom`
- `distributeVerticalCenter`
- `distributeVerticalTop`
- `dna`
- `dnsServices`
- `doc`
- `document`
- `documentAdd`
- `documentAttachment`
- `documentAudio`
- `documentBlank`
- `documentComment`
- `documentConfiguration`
- `documentDownload`
- `documentEpdf`
- `documentExport`
- `documentHorizontal`
- `documentImport`
- `documentMultiple01`
- `documentMultiple02`
- `documentPdf`
- `documentPreliminary`
- `documentProcessor`
- `documentProtected`
- `documentRequirements`
- `documentSecurity`
- `documentSentiment`
- `documentSet`
- `documentSigned`
- `documentSketch`
- `documentSubject`
- `documentSubtract`
- `documentTasks`
- `documentUnknown`
- `documentUnprotected`
- `documentVertical`
- `documentVideo`
- `documentView`
- `documentWordProcessor`
- `documentWordProcessorReference`
- `documentation`
- `dogWalker`
- `dotMark`
- `doubleAxisChartBar`
- `doubleAxisChartColumn`
- `doubleInteger`
- `downToBottom`
- `download`
- `downloadStudy`
- `downstream`
- `dragHorizontal`
- `dragVertical`
- `draggable`
- `draw`
- `drillBack`
- `drillDown`
- `drillThrough`
- `drink01`
- `drink02`
- `driverAnalysis`
- `drone`
- `droneDelivery`
- `droneFront`
- `droneVideo`
- `dropPhoto`
- `dropPhotoFilled`
- `drought`
- `dvr`
- `earth`
- `earthAmericas`
- `earthAmericasFilled`
- `earthEuropeAfrica`
- `earthEuropeAfricaFilled`
- `earthFilled`
- `earthSoutheastAsia`
- `earthSoutheastAsiaFilled`
- `earthquake`
- `edgeCluster`
- `edgeDevice`
- `edgeEnhancement`
- `edgeEnhancement01`
- `edgeEnhancement02`
- `edgeEnhancement03`
- `edgeNode`
- `edgeNodeAlt`
- `edgeService`
- `edit`
- `editFilter`
- `editOff`
- `edtLoop`
- `education`
- `elementPicker`
- `email`
- `emailNew`
- `emissionsManagement`
- `encryption`
- `energyRenewable`
- `enterprise`
- `enumerationDefinition`
- `enumerationUsage`
- `equalApproximately`
- `equalizer`
- `erase`
- `erase3d`
- `error`
- `errorFilled`
- `errorOutline`
- `event`
- `eventChange`
- `eventIncident`
- `eventSchedule`
- `eventWarning`
- `events`
- `eventsAlt`
- `examMode`
- `executableProgram`
- `exit`
- `expandAll`
- `expandCategories`
- `explore`
- `export`
- `eyedropper`
- `faceActivated`
- `faceActivatedAdd`
- `faceActivatedFilled`
- `faceAdd`
- `faceCool`
- `faceDissatisfied`
- `faceDissatisfiedFilled`
- `faceDizzy`
- `faceDizzyFilled`
- `faceMask`
- `faceNeutral`
- `faceNeutralFilled`
- `facePending`
- `facePendingFilled`
- `faceSatisfied`
- `faceSatisfiedFilled`
- `faceWink`
- `faceWinkFilled`
- `factor`
- `fade`
- `favorite`
- `favoriteFilled`
- `favoriteHalf`
- `featureMembership`
- `featureMembershipFilled`
- `featurePicker`
- `featureTyping`
- `fetchUpload`
- `fetchUploadCloud`
- `fileStorage`
- `filter`
- `filterEdit`
- `filterRemove`
- `filterReset`
- `finance`
- `financialAssets`
- `fingerprintRecognition`
- `fire`
- `firewall`
- `firewallClassic`
- `fish`
- `fishMultiple`
- `fitToHeight`
- `fitToScreen`
- `fitToWidth`
- `flag`
- `flagFilled`
- `flaggingTaxi`
- `flash`
- `flashFilled`
- `flashOff`
- `flashOffFilled`
- `flightInternational`
- `flightRoster`
- `flightSchedule`
- `floatingIp`
- `flood`
- `floodWarning`
- `floorplan`
- `flow`
- `flowConnection`
- `flowData`
- `flowLogsVpc`
- `flowModeler`
- `flowModelerReference`
- `flowStream`
- `flowStreamReference`
- `fog`
- `folder`
- `folderAdd`
- `folderDetails`
- `folderDetailsReference`
- `folderMoveTo`
- `folderOff`
- `folderOpen`
- `folderParent`
- `folderShared`
- `folders`
- `followUpWorkOrder`
- `forLoop`
- `forecastHail`
- `forecastHail30`
- `forecastLightning`
- `forecastLightning30`
- `fork`
- `forkNode`
- `forum`
- `forward10`
- `forward30`
- `forward5`
- `foundationModel`
- `fragile`
- `fragments`
- `friendship`
- `fruitBowl`
- `function`
- `function2`
- `functionMath`
- `funnelSequence`
- `funnelSort`
- `fusionBlender`
- `gameConsole`
- `gameWireless`
- `gamification`
- `gasStation`
- `gasStationFilled`
- `gateway`
- `gatewayApi`
- `gatewayMail`
- `gatewayPublic`
- `gatewaySecurity`
- `gatewayUserAccess`
- `gatewayVpn`
- `gears`
- `gem`
- `gemReference`
- `genderFemale`
- `genderMale`
- `generatePdf`
- `gif`
- `gift`
- `globalLoanAndTrial`
- `globe`
- `gradient`
- `graphicalDataFlow`
- `grid`
- `group`
- `groupAccess`
- `groupAccount`
- `groupObjects`
- `groupObjectsNew`
- `groupObjectsSave`
- `groupPresentation`
- `groupResource`
- `groupSecurity`
- `growth`
- `gui`
- `guiManagement`
- `h`
- `hail`
- `hangingProtocol`
- `harbor`
- `hardwareSecurityModule`
- `hashtag`
- `haze`
- `hazeNight`
- `hd`
- `hdFilled`
- `hdr`
- `heading`
- `headphones`
- `headset`
- `healthCross`
- `hearing`
- `heatMap`
- `heatMap02`
- `heatMap03`
- `heatMapStocks`
- `helicopter`
- `help`
- `helpDesk`
- `helpFilled`
- `hexagonOutline`
- `hexagonSolid`
- `hexagonVerticalOutline`
- `hexagonVerticalSolid`
- `hintonPlot`
- `hl7Attributes`
- `holeFilling`
- `holeFillingCursor`
- `home`
- `horizontalView`
- `hospital`
- `hospitalBed`
- `hotel`
- `hourglass`
- `html`
- `htmlReference`
- `http`
- `humidity`
- `humidityAlt`
- `hurricane`
- `hybridNetworking`
- `hybridNetworkingAlt`
- `ibmAiOnZ`
- `ibmAiopsInsights`
- `ibmApiConnect`
- `ibmAppConnectEnterprise`
- `ibmApplicationAndDiscoveryDeliveryIntelligence`
- `ibmAspera`
- `ibmBluepay`
- `ibmCloud`
- `ibmCloudAppId`
- `ibmCloudBackupAndRecovery`
- `ibmCloudBackupServiceVpc`
- `ibmCloudBareMetalServer`
- `ibmCloudBareMetalServersVpc`
- `ibmCloudCitrixDaas`
- `ibmCloudCodeEngine`
- `ibmCloudContinuousDelivery`
- `ibmCloudDatabases`
- `ibmCloudDedicatedHost`
- `ibmCloudDirectLink1Connect`
- `ibmCloudDirectLink1Dedicated`
- `ibmCloudDirectLink1DedicatedHosting`
- `ibmCloudDirectLink1Exchange`
- `ibmCloudDirectLink2Connect`
- `ibmCloudDirectLink2Dedicated`
- `ibmCloudDirectLink2DedicatedHosting`
- `ibmCloudEssentialSecurityAndObservabilityServices`
- `ibmCloudEventNotification`
- `ibmCloudEventStreams`
- `ibmCloudForEducation`
- `ibmCloudGateKeeper`
- `ibmCloudHpc`
- `ibmCloudHsm`
- `ibmCloudHyperProtectCryptoServices`
- `ibmCloudHyperProtectDbaas`
- `ibmCloudHyperProtectVs`
- `ibmCloudInternetServices`
- `ibmCloudIpsecVpn`
- `ibmCloudKeyProtect`
- `ibmCloudKubernetesService`
- `ibmCloudLogging`
- `ibmCloudMassDataMigration`
- `ibmCloudObservability`
- `ibmCloudPakApplications`
- `ibmCloudPakBusinessAutomation`
- `ibmCloudPakData`
- `ibmCloudPakIntegration`
- `ibmCloudPakMantaAutomatedDataLineage`
- `ibmCloudPakMulticloudMgmt`
- `ibmCloudPakNetezza`
- `ibmCloudPakNetworkAutomation`
- `ibmCloudPakSecurity`
- `ibmCloudPakSystem`
- `ibmCloudPakWatsonAiops`
- `ibmCloudPal`
- `ibmCloudPrivilegedAccessGateway`
- `ibmCloudProjects`
- `ibmCloudResiliency`
- `ibmCloudSecretsManager`
- `ibmCloudSecurity`
- `ibmCloudSecurityComplianceCenter`
- `ibmCloudSecurityComplianceCenterWorkloadProtection`
- `ibmCloudSecurityGroups`
- `ibmCloudSubnets`
- `ibmCloudSysdigSecure`
- `ibmCloudTransitGateway`
- `ibmCloudVirtualServerClassic`
- `ibmCloudVirtualServerVpc`
- `ibmCloudVpc`
- `ibmCloudVpcBlockStorageSnapshots`
- `ibmCloudVpcClientVpn`
- `ibmCloudVpcEndpoints`
- `ibmCloudVpcFileStorage`
- `ibmCloudVpcImages`
- `ibmCloudant`
- `ibmConsultingAdvantageAgent`
- `ibmConsultingAdvantageApplication`
- `ibmConsultingAdvantageAssistant`
- `ibmContentServices`
- `ibmDataPower`
- `ibmDataProductExchange`
- `ibmDataReplication`
- `ibmDataband`
- `ibmDatastage`
- `ibmDb2`
- `ibmDb2Alt`
- `ibmDb2Warehouse`
- `ibmDeployableArchitecture`
- `ibmDevopsControl`
- `ibmDynamicRouteServer`
- `ibmEloAutomotiveCompliance`
- `ibmEloEngineeringInsights`
- `ibmEloMethodComposer`
- `ibmEloPublishing`
- `ibmEngineeringLifecycleMgmt`
- `ibmEngineeringRequirementsDoorsNext`
- `ibmEngineeringSystemsDesignRhapsody`
- `ibmEngineeringSystemsDesignRhapsodyModelManager`
- `ibmEngineeringSystemsDesignRhapsodySn1`
- `ibmEngineeringSystemsDesignRhapsodySn2`
- `ibmEngineeringTestMgmt`
- `ibmEngineeringWorkflowMgmt`
- `ibmEventAutomation`
- `ibmEventEndpointMgmt`
- `ibmEventProcessing`
- `ibmEventStreams`
- `ibmGcm`
- `ibmGlobalStorageArchitecture`
- `ibmGranite`
- `ibmIbv`
- `ibmInstana`
- `ibmJrs`
- `ibmKnowledgeCatalog`
- `ibmKnowledgeCatalogPremium`
- `ibmKnowledgeCatalogStandard`
- `ibmLaunchpadS4`
- `ibmLpa`
- `ibmLqe`
- `ibmMachineLearningForZos`
- `ibmMatch360`
- `ibmMaximoApplicationSuite`
- `ibmMq`
- `ibmOpenEnterpriseLanguages`
- `ibmOpenshiftContainerPlatformOnVpcForRegulatedIndustries`
- `ibmPlanningAnalytics`
- `ibmPowerVs`
- `ibmPowerVsPrivateCloud`
- `ibmPowerWithVpc`
- `ibmPrivatePathServices`
- `ibmProcessMining`
- `ibmQuantumSafeAdvisor`
- `ibmQuantumSafeExplorer`
- `ibmQuantumSafeRemediator`
- `ibmSaasConsole`
- `ibmSapOnPower`
- `ibmSecureInfrastructureOnVpcForRegulatedIndustries`
- `ibmSecurity`
- `ibmSecurityServices`
- `ibmSoftwareWatsonxDataAnalyzeAndProcess`
- `ibmSoftwareWatsonxDataStructuredEnrichment`
- `ibmSoftwareWatsonxDataStructuredImport`
- `ibmSoftwareWatsonxDataUnstructuredEnrichment`
- `ibmSoftwareWatsonxDataUnstructuredImport`
- `ibmSoftwareWatsonxDocumentLibrary`
- `ibmStreamsets`
- `ibmTelehealth`
- `ibmTenet`
- `ibmTestAcceleratorForZ`
- `ibmToolchain`
- `ibmTurbonomic`
- `ibmUnstructuredDataProcessor`
- `ibmVpnForVpc`
- `ibmVsiOnVpcForRegulatedIndustries`
- `ibmWatsonAssistant`
- `ibmWatsonDiscovery`
- `ibmWatsonKnowledgeCatalog`
- `ibmWatsonKnowledgeStudio`
- `ibmWatsonLanguageTranslator`
- `ibmWatsonMachineLearning`
- `ibmWatsonNaturalLanguageClassifier`
- `ibmWatsonNaturalLanguageUnderstanding`
- `ibmWatsonOpenscale`
- `ibmWatsonOrders`
- `ibmWatsonQuery`
- `ibmWatsonSpeechToText`
- `ibmWatsonStudio`
- `ibmWatsonTextToSpeech`
- `ibmWatsonToneAnalyzer`
- `ibmWatsonxAssistant`
- `ibmWatsonxCodeAssistant`
- `ibmWatsonxCodeAssistantForEnterpriseJavaApplications`
- `ibmWatsonxCodeAssistantForZ`
- `ibmWatsonxCodeAssistantForZRefactor`
- `ibmWatsonxCodeAssistantForZValidationAssistant`
- `ibmWatsonxOrchestrate`
- `ibmWaziDeploy`
- `ibmZCloudModStack`
- `ibmZCloudProvisioning`
- `ibmZEnvironmentsDevSecOps`
- `ibmZOpenEditor`
- `ibmZOs`
- `ibmZOsAiControlInterface`
- `ibmZOsContainers`
- `ibmZOsPackageManager`
- `ibmZProcessorCapacityReference`
- `ica2d`
- `iceAccretion`
- `iceVision`
- `id`
- `idManagement`
- `idea`
- `identification`
- `ifAction`
- `image`
- `imageCopy`
- `imageMedical`
- `imageReference`
- `imageSearch`
- `imageSearchAlt`
- `imageService`
- `imageStoreLocal`
- `importExport`
- `important`
- `improveRelevance`
- `inProgress`
- `inProgressError`
- `inProgressWarning`
- `incidentReporter`
- `incomplete`
- `incompleteCancel`
- `incompleteError`
- `incompleteWarning`
- `increaseLevel`
- `industry`
- `infinitySymbol`
- `information`
- `informationDisabled`
- `informationFilled`
- `informationSquare`
- `informationSquareFilled`
- `infrastructureClassic`
- `insert`
- `insertPage`
- `insertSyntax`
- `inspection`
- `instanceBx`
- `instanceClassic`
- `instanceCx`
- `instanceMx`
- `instanceVirtual`
- `integration`
- `intentRequestActive`
- `intentRequestCreate`
- `intentRequestHeal`
- `intentRequestInactive`
- `intentRequestScaleIn`
- `intentRequestScaleOut`
- `intentRequestUninstall`
- `intentRequestUpgrade`
- `interactions`
- `interactiveSegmentationCursor`
- `interfaceDefinition`
- `interfaceDefinitionAlt`
- `interfaceUsage`
- `interfaceUsage1`
- `interfaceUsageAlt`
- `intersect`
- `intrusionPrevention`
- `inventoryManagement`
- `iotConnect`
- `iotPlatform`
- `ip`
- `iso`
- `isoFilled`
- `isoOutline`
- `itemDefinition`
- `itemUsage`
- `jobDaemon`
- `jobRun`
- `joinFull`
- `joinInner`
- `joinInnerAlt`
- `joinLeft`
- `joinLeftOuter`
- `joinNode`
- `joinOuter`
- `joinRight`
- `joinRightOuter`
- `jpg`
- `jsError`
- `json`
- `jsonReference`
- `jumpLink`
- `keepDry`
- `key`
- `keyboard`
- `keyboardOff`
- `kioskDevice`
- `kubelet`
- `kubernetes`
- `kubernetesControlPlaneNode`
- `kubernetesIpAddress`
- `kubernetesOperator`
- `kubernetesPod`
- `kubernetesWorkerNode`
- `label`
- `language`
- `laptop`
- `lasso`
- `lassoPolygon`
- `launch`
- `launchStudy1`
- `launchStudy2`
- `launchStudy3`
- `layers`
- `layersExternal`
- `legend`
- `letterAa`
- `letterBb`
- `letterCc`
- `letterDd`
- `letterEe`
- `letterFf`
- `letterGg`
- `letterHh`
- `letterIi`
- `letterJj`
- `letterKk`
- `letterLl`
- `letterMm`
- `letterNn`
- `letterOo`
- `letterPp`
- `letterQq`
- `letterRr`
- `letterSs`
- `letterTt`
- `letterUu`
- `letterVv`
- `letterWw`
- `letterXx`
- `letterYy`
- `letterZz`
- `license`
- `licenseDraft`
- `licenseGlobal`
- `licenseMaintenance`
- `licenseMaintenanceDraft`
- `licenseThirdParty`
- `licenseThirdPartyDraft`
- `lifesaver`
- `light`
- `lightFilled`
- `lightning`
- `link`
- `linux`
- `linuxAlt`
- `linuxNamespace`
- `list`
- `listBoxes`
- `listBulleted`
- `listChecked`
- `listCheckedMirror`
- `listDropdown`
- `listNumbered`
- `listNumberedMirror`
- `loadBalancerApplication`
- `loadBalancerClassic`
- `loadBalancerGlobal`
- `loadBalancerListener`
- `loadBalancerLocal`
- `loadBalancerNetwork`
- `loadBalancerPool`
- `loadBalancerVpc`
- `location`
- `locationCompany`
- `locationCompanyFilled`
- `locationCurrent`
- `locationFilled`
- `locationHazard`
- `locationHazardFilled`
- `locationHeart`
- `locationHeartFilled`
- `locationInfo`
- `locationInfoFilled`
- `locationPerson`
- `locationPersonFilled`
- `locationSave`
- `locationStar`
- `locationStarFilled`
- `locked`
- `lockedAndBlocked`
- `logicalPartition`
- `login`
- `logoAngular`
- `logoAnsibleCommunity`
- `logoDelicious`
- `logoDigg`
- `logoDiscord`
- `logoFacebook`
- `logoFigma`
- `logoFlickr`
- `logoGit`
- `logoGithub`
- `logoGitlab`
- `logoGlassdoor`
- `logoGoogle`
- `logoInstagram`
- `logoInvision`
- `logoJupyter`
- `logoKeybase`
- `logoKubernetes`
- `logoLinkedin`
- `logoLivestream`
- `logoMastodon`
- `logoMedium`
- `logoNpm`
- `logoOpenshift`
- `logoPinterest`
- `logoPython`
- `logoQuora`
- `logoRScript`
- `logoReact`
- `logoRedHatAiInstructlabOnIbmCloud`
- `logoRedHatAnsible`
- `logoSketch`
- `logoSkype`
- `logoSlack`
- `logoSnapchat`
- `logoStumbleupon`
- `logoSvelte`
- `logoTumblr`
- `logoTwitter`
- `logoVmware`
- `logoVmwareAlt`
- `logoVue`
- `logoWechat`
- `logoX`
- `logoXing`
- `logoYelp`
- `logoYoutube`
- `logout`
- `loop`
- `loopAlt`
- `mac`
- `macCommand`
- `macOption`
- `macShift`
- `machineLearning`
- `machineLearningModel`
- `magicWand`
- `magicWandFilled`
- `magnify`
- `mailAll`
- `mailReply`
- `mammogram`
- `mammogramStacked`
- `manageProtection`
- `managedSolutions`
- `map`
- `mapBoundary`
- `mapBoundaryVegetation`
- `mapCenter`
- `mapIdentify`
- `marginal`
- `marineWarning`
- `mathCurve`
- `matrix`
- `maximize`
- `mediaCast`
- `mediaLibrary`
- `mediaLibraryFilled`
- `medication`
- `medicationAlert`
- `medicationReminder`
- `menu`
- `merge`
- `mergeNode`
- `messageQueue`
- `meter`
- `meterAlt`
- `microphone`
- `microphoneFilled`
- `microphoneOff`
- `microphoneOffFilled`
- `microscope`
- `microservices1`
- `microservices2`
- `migrate`
- `migrateAlt`
- `milestone`
- `militaryCamp`
- `minimize`
- `misuse`
- `misuseAlt`
- `misuseOutline`
- `mixedRainHail`
- `mlModelReference`
- `mobile`
- `mobileAdd`
- `mobileAudio`
- `mobileCheck`
- `mobileCrash`
- `mobileDownload`
- `mobileEvent`
- `mobileLandscape`
- `mobileRequest`
- `mobileSession`
- `mobileView`
- `mobileViewOrientation`
- `mobilityServices`
- `model`
- `modelAlt`
- `modelBuilder`
- `modelBuilderReference`
- `modelFoundation`
- `modelReference`
- `modelTuned`
- `modifiedNewest`
- `modifiedOldest`
- `money`
- `monster`
- `monument`
- `moon`
- `moonrise`
- `moonset`
- `mostlyCloudy`
- `mostlyCloudyNight`
- `mountain`
- `mov`
- `move`
- `movement`
- `mp3`
- `mp4`
- `mpeg`
- `mpg2`
- `multiuserDevice`
- `music`
- `musicAdd`
- `musicRemove`
- `mysql`
- `nameSpace`
- `navaidCivil`
- `navaidDme`
- `navaidHelipad`
- `navaidMilitary`
- `navaidMilitaryCivil`
- `navaidNdb`
- `navaidNdbDme`
- `navaidPrivate`
- `navaidSeaplane`
- `navaidTacan`
- `navaidVhfor`
- `navaidVor`
- `navaidVordme`
- `navaidVortac`
- `need`
- `network1`
- `network2`
- `network3`
- `network3Reference`
- `network4`
- `network4Reference`
- `networkAdminControl`
- `networkEnterprise`
- `networkInterface`
- `networkOverlay`
- `networkPublic`
- `networkTimeProtocol`
- `newTab`
- `nextFilled`
- `nextOutline`
- `noImage`
- `noTicket`
- `nominal`
- `nominate`
- `nonCertified`
- `noodleBowl`
- `notAvailable`
- `notSent`
- `notSentFilled`
- `notebook`
- `notebookReference`
- `notification`
- `notificationCounter`
- `notificationFilled`
- `notificationNew`
- `notificationOff`
- `notificationOffFilled`
- `notificationsPaused`
- `nullSign`
- `number0`
- `number1`
- `number2`
- `number3`
- `number4`
- `number5`
- `number6`
- `number7`
- `number8`
- `number9`
- `numberSmall0`
- `numberSmall1`
- `numberSmall2`
- `numberSmall3`
- `numberSmall4`
- `numberSmall5`
- `numberSmall6`
- `numberSmall7`
- `numberSmall8`
- `numberSmall9`
- `object`
- `objectStorage`
- `objectStorageAlt`
- `observedHail`
- `observedLightning`
- `omega`
- `opacity`
- `openPanelBottom`
- `openPanelFilledBottom`
- `openPanelFilledLeft`
- `openPanelFilledRight`
- `openPanelFilledTop`
- `openPanelLeft`
- `openPanelRight`
- `openPanelTop`
- `operation`
- `operationGauge`
- `operationIf`
- `operationsField`
- `operationsRecord`
- `orderDetails`
- `ordinal`
- `outage`
- `outlookSevere`
- `overflowMenuHorizontal`
- `overflowMenuVertical`
- `overlay`
- `package`
- `packageNode`
- `packageTextAnalysis`
- `pageBreak`
- `pageFirst`
- `pageLast`
- `pageNumber`
- `pageScroll`
- `paintBrush`
- `paintBrushAlt`
- `palmTree`
- `panHorizontal`
- `panVertical`
- `panelExpansion`
- `paragraph`
- `parameter`
- `parentChild`
- `parentNode`
- `partDefinition`
- `partUsage`
- `partitionAuto`
- `partitionCollection`
- `partitionRepartition`
- `partitionSame`
- `partitionSpecific`
- `partlyCloudy`
- `partlyCloudyNight`
- `partnership`
- `passengerDrinks`
- `passengerPlus`
- `password`
- `paste`
- `pause`
- `pauseFilled`
- `pauseFuture`
- `pauseOutline`
- `pauseOutlineFilled`
- `pausePast`
- `pcnENode`
- `pcnMilitary`
- `pcnPNode`
- `pcnZNode`
- `pdf`
- `pdfReference`
- `pedestrian`
- `pedestrianChild`
- `pedestrianFamily`
- `pen`
- `penFountain`
- `pending`
- `pendingFilled`
- `pentagonDownOutline`
- `pentagonDownSolid`
- `pentagonLeftOutline`
- `pentagonLeftSolid`
- `pentagonOutline`
- `pentagonRightOutline`
- `pentagonRightSolid`
- `pentagonSolid`
- `percentage`
- `percentageFilled`
- `performAction`
- `person`
- `personFavorite`
- `pest`
- `petImageB`
- `petImageO`
- `phone`
- `phoneApplication`
- `phoneBlock`
- `phoneBlockFilled`
- `phoneFilled`
- `phoneIncoming`
- `phoneIncomingFilled`
- `phoneIp`
- `phoneOff`
- `phoneOffFilled`
- `phoneOutgoing`
- `phoneOutgoingFilled`
- `phoneSettings`
- `phoneVoice`
- `phoneVoiceFilled`
- `phraseSentiment`
- `picnicArea`
- `piggyBank`
- `piggyBankSlot`
- `pills`
- `pillsAdd`
- `pillsSubtract`
- `pin`
- `pinFilled`
- `pipelines`
- `pivotHorizontal`
- `pivotVertical`
- `plan`
- `plane`
- `planePrivate`
- `planeSea`
- `platforms`
- `play`
- `playFilled`
- `playFilledAlt`
- `playOutline`
- `playOutlineFilled`
- `playlist`
- `plug`
- `plugFilled`
- `png`
- `pointOfPresence`
- `pointerText`
- `police`
- `policy`
- `popIn`
- `popup`
- `portDefinition`
- `portInput`
- `portOutput`
- `portUsage`
- `portfolio`
- `power`
- `powerEnterprisePoolsMeteredCapacityIntegration`
- `powerVirtualServerDisasterRecoveryAutomation`
- `ppt`
- `presentationFile`
- `pressure`
- `pressureFilled`
- `previousFilled`
- `previousOutline`
- `pricingConsumption`
- `pricingContainer`
- `pricingQuickProposal`
- `pricingTailored`
- `pricingTraditional`
- `printer`
- `process`
- `processAutomate`
- `product`
- `progressBar`
- `progressBarRound`
- `promote`
- `promptSession`
- `promptTemplate`
- `propertyRelationship`
- `pullRequest`
- `punctuationCheck`
- `purchase`
- `qcLaunch`
- `qiskit`
- `qqPlot`
- `qrCode`
- `quadrantPlot`
- `query`
- `queryQueue`
- `questionAnswering`
- `queued`
- `quotes`
- `radar`
- `radarEnhanced`
- `radarWeather`
- `radio`
- `radioButton`
- `radioButtonChecked`
- `radioCombat`
- `radioPushToTalk`
- `rag`
- `rain`
- `rainDrizzle`
- `rainDrop`
- `rainHeavy`
- `rainScattered`
- `rainScatteredNight`
- `raw`
- `readMe`
- `receipt`
- `recentlyViewed`
- `recommend`
- `recording`
- `recordingFilled`
- `recordingFilledAlt`
- `recycle`
- `redefinition`
- `redo`
- `refEvapotranspiration`
- `referenceArchitecture`
- `reflectHorizontal`
- `reflectVertical`
- `regionAnalysisArea`
- `regionAnalysisVolume`
- `registration`
- `reminder`
- `reminderMedical`
- `renew`
- `repeat`
- `repeatOne`
- `replicate`
- `reply`
- `replyAll`
- `repoArtifact`
- `repoSourceCode`
- `report`
- `reportData`
- `requestQuote`
- `requirementDefinition`
- `requirementUsage`
- `researchBlochSphere`
- `researchHintonPlot`
- `researchMatrix`
- `reset`
- `resetAlt`
- `restart`
- `restaurant`
- `restaurantFine`
- `result`
- `resultDraft`
- `resultNew`
- `resultOld`
- `retryFailed`
- `return`
- `review`
- `rewind10`
- `rewind30`
- `rewind5`
- `rightPanelClose`
- `rightPanelCloseFilled`
- `rightPanelOpen`
- `rightPanelOpenFilled`
- `road`
- `roadWeather`
- `roadmap`
- `rocket`
- `rotate`
- `rotate180`
- `rotate360`
- `rotateClockwise`
- `rotateClockwiseAlt`
- `rotateClockwiseAltFilled`
- `rotateClockwiseFilled`
- `rotateCounterclockwise`
- `rotateCounterclockwiseAlt`
- `rotateCounterclockwiseAltFilled`
- `rotateCounterclockwiseFilled`
- `router`
- `routerVoice`
- `routerWifi`
- `row`
- `rowCollapse`
- `rowDelete`
- `rowExpand`
- `rowInsert`
- `rss`
- `rule`
- `ruleCancelled`
- `ruleDataQuality`
- `ruleDraft`
- `ruleFilled`
- `ruleLocked`
- `rulePartial`
- `ruleTest`
- `ruler`
- `rulerAlt`
- `run`
- `runMirror`
- `running`
- `s`
- `sAlt`
- `sailboatCoastal`
- `sailboatOffshore`
- `salesOps`
- `sankeyDiagram`
- `sankeyDiagramAlt`
- `sap`
- `satellite`
- `satelliteRadar`
- `satelliteWeather`
- `satisfyDefinition`
- `satisfyUsage`
- `save`
- `saveAnnotation`
- `saveImage`
- `saveModel`
- `saveSeries`
- `scale`
- `scales`
- `scalesTipped`
- `scalpel`
- `scalpelCursor`
- `scalpelLasso`
- `scalpelSelect`
- `scan`
- `scanAlt`
- `scanDisabled`
- `scatterMatrix`
- `schematics`
- `scisControlTower`
- `scisTransparentSupply`
- `scooter`
- `scooterFront`
- `screen`
- `screenMap`
- `screenMapSet`
- `screenOff`
- `script`
- `scriptReference`
- `sdk`
- `search`
- `searchAdvanced`
- `searchLocate`
- `searchLocateMirror`
- `security`
- `securityServices`
- `select01`
- `select02`
- `selectWindow`
- `send`
- `sendActionUsage`
- `sendAlt`
- `sendAltFilled`
- `sendBackward`
- `sendFilled`
- `sendToBack`
- `serverDns`
- `serverProxy`
- `serverTime`
- `serviceDesk`
- `serviceId`
- `serviceLevels`
- `sessionBorderControl`
- `settings`
- `settingsAdjust`
- `settingsCheck`
- `settingsEdit`
- `settingsServices`
- `settingsView`
- `shapeExcept`
- `shapeExclude`
- `shapeIntersect`
- `shapeJoin`
- `shapeUnite`
- `shapes`
- `share`
- `shareKnowledge`
- `shoppingBag`
- `shoppingCart`
- `shoppingCartArrowDown`
- `shoppingCartArrowUp`
- `shoppingCartClear`
- `shoppingCartError`
- `shoppingCartMinus`
- `shoppingCartPlus`
- `shoppingCatalog`
- `showDataCards`
- `shrinkScreen`
- `shrinkScreenFilled`
- `shuffle`
- `shuttle`
- `sidePanelClose`
- `sidePanelCloseFilled`
- `sidePanelOpen`
- `sidePanelOpenFilled`
- `sight`
- `sigma`
- `signalStrength`
- `simCard`
- `skillLevel`
- `skillLevelAdvanced`
- `skillLevelBasic`
- `skillLevelIntermediate`
- `skipBack`
- `skipBackFilled`
- `skipBackOutline`
- `skipBackOutlineFilled`
- `skipBackOutlineSolid`
- `skipBackSolidFilled`
- `skipForward`
- `skipForwardFilled`
- `skipForwardOutline`
- `skipForwardOutlineFilled`
- `skipForwardOutlineSolid`
- `skipForwardSolidFilled`
- `sleet`
- `slisor`
- `slm`
- `smell`
- `smoke`
- `smoothing`
- `smoothingCursor`
- `snooze`
- `snow`
- `snowBlizzard`
- `snowDensity`
- `snowHeavy`
- `snowScattered`
- `snowScatteredNight`
- `snowflake`
- `soccer`
- `softwareResource`
- `softwareResourceCluster`
- `softwareResourceResource`
- `soilMoisture`
- `soilMoistureField`
- `soilMoistureGlobal`
- `soilTemperature`
- `soilTemperatureField`
- `soilTemperatureGlobal`
- `solarPanel`
- `sortAscending`
- `sortDescending`
- `sortRemove`
- `sortingAToZ`
- `sortingHighestToLowestNumber`
- `sortingLowestToHighestNumber`
- `sortingZToA`
- `spellCheck`
- `spineLabel`
- `split`
- `splitDiscard`
- `splitScreen`
- `sprayPaint`
- `sprout`
- `spyreAccelerator`
- `sql`
- `squareOutline`
- `stackLimitation`
- `stackedMove`
- `stackedScrolling1`
- `stackedScrolling2`
- `stamp`
- `star`
- `starFilled`
- `starHalf`
- `starReview`
- `statusAcknowledge`
- `statusChange`
- `statusPartialFail`
- `statusResolved`
- `stayInside`
- `stemLeafPlot`
- `stethoscope`
- `stickies`
- `stop`
- `stopFilled`
- `stopFilledAlt`
- `stopOutline`
- `stopOutlineFilled`
- `stopSign`
- `stopSignFilled`
- `storagePool`
- `storageRequest`
- `store`
- `stormTracker`
- `strategyPlay`
- `strawberry`
- `stressBreathEditor`
- `stringInteger`
- `stringText`
- `studyNext`
- `studyPrevious`
- `studyRead`
- `studySkip`
- `studyTransfer`
- `studyUnread`
- `studyView`
- `subVolume`
- `subclassification`
- `subdirectory`
- `subflow`
- `subflowLocal`
- `subjectDefinition`
- `subjectUsage`
- `subnetAclRules`
- `subsetting`
- `subtract`
- `subtractAlt`
- `subtractFilled`
- `subtractLarge`
- `succession`
- `successionFlowConnection`
- `summaryKpi`
- `summaryKpiMirror`
- `sun`
- `sunrise`
- `sunset`
- `supportVectorMachine`
- `surrogateKeyDatabase`
- `surrogateKeyFlatFile`
- `sustainability`
- `svg`
- `swim`
- `swimlaneDVertical`
- `switchLayer2`
- `switchLayer3`
- `switcher`
- `syncSettings`
- `sysProvision`
- `sysplexDistributor`
- `t`
- `tAlt`
- `table`
- `tableAlias`
- `tableBuilt`
- `tableOfContents`
- `tableShortcut`
- `tableSplit`
- `tablet`
- `tabletLandscape`
- `tag`
- `tagEdit`
- `tagExport`
- `tagGroup`
- `tagImport`
- `tagNone`
- `tank`
- `task`
- `taskAdd`
- `taskApproved`
- `taskAssetView`
- `taskComplete`
- `taskLocation`
- `taskRemove`
- `taskSettings`
- `taskStar`
- `taskTools`
- `taskView`
- `taste`
- `taxi`
- `tcpIpService`
- `temperature`
- `temperatureCelsius`
- `temperatureCelsiusAlt`
- `temperatureFahrenheit`
- `temperatureFahrenheitAlt`
- `temperatureFeelsLike`
- `temperatureFrigid`
- `temperatureHot`
- `temperatureInversion`
- `temperatureMax`
- `temperatureMin`
- `temperatureWater`
- `template`
- `tennis`
- `tennisBall`
- `term`
- `termReference`
- `terminal`
- `terminal3270`
- `testTool`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignMixed`
- `textAlignRight`
- `textAllCaps`
- `textAnnotationToggle`
- `textBold`
- `textClearFormat`
- `textColor`
- `textCreation`
- `textFill`
- `textFont`
- `textFootnote`
- `textHighlight`
- `textIndent`
- `textIndentLess`
- `textIndentMore`
- `textItalic`
- `textKerning`
- `textLeading`
- `textLineSpacing`
- `textLink`
- `textLinkAnalysis`
- `textLongParagraph`
- `textMining`
- `textMiningApplier`
- `textNewLine`
- `textScale`
- `textSelection`
- `textShortParagraph`
- `textSmallCaps`
- `textStrikethrough`
- `textSubscript`
- `textSuperscript`
- `textTracking`
- `textUnderline`
- `textVerticalAlignment`
- `textWrap`
- `theater`
- `thisSideUp`
- `threshold`
- `thumbnail1`
- `thumbnail2`
- `thumbnailPreview`
- `thumbsDown`
- `thumbsDownFilled`
- `thumbsUp`
- `thumbsUpDouble`
- `thumbsUpDoubleFilled`
- `thumbsUpFilled`
- `thunderstorm`
- `thunderstormScattered`
- `thunderstormScatteredNight`
- `thunderstormSevere`
- `thunderstormStrong`
- `ticket`
- `tides`
- `tif`
- `time`
- `timeFilled`
- `timePlot`
- `timer`
- `timingBelt`
- `toolBox`
- `toolKit`
- `tools`
- `toolsAlt`
- `tornado`
- `tornadoWarning`
- `touch1`
- `touch1Down`
- `touch1DownFilled`
- `touch1Filled`
- `touch2`
- `touch2Filled`
- `touchInteraction`
- `tour`
- `trafficCone`
- `trafficEvent`
- `trafficFlow`
- `trafficFlowIncident`
- `trafficIncident`
- `trafficWeatherIncident`
- `train`
- `trainHeart`
- `trainProfile`
- `trainSpeed`
- `trainTicket`
- `trainTime`
- `tram`
- `transformBinary`
- `transformCode`
- `transformInstructions`
- `transformLanguage`
- `transgender`
- `translate`
- `transmissionLte`
- `transpose`
- `trashCan`
- `tree`
- `treeFallRisk`
- `treeView`
- `treeViewAlt`
- `triangleDownOutline`
- `triangleDownSolid`
- `triangleLeftOutline`
- `triangleLeftSolid`
- `triangleOutline`
- `triangleRightOutline`
- `triangleRightSolid`
- `triangleSolid`
- `trigger`
- `trophy`
- `trophyFilled`
- `tropicalStorm`
- `tropicalStormModelTracks`
- `tropicalStormTracks`
- `tropicalWarning`
- `tsq`
- `tsunami`
- `tsv`
- `tuning`
- `twoFactorAuthentication`
- `twoPersonLift`
- `txt`
- `txtReference`
- `typePattern`
- `types`
- `u1`
- `u2`
- `u3`
- `umbrella`
- `undefined`
- `undefinedFilled`
- `undo`
- `ungroupObjects`
- `unknown`
- `unknownFilled`
- `unlink`
- `unlocked`
- `unsaved`
- `upToTop`
- `updateNow`
- `upgrade`
- `upload`
- `upstream`
- `url`
- `usageIncludedUseCase`
- `usb`
- `useCaseDefinition`
- `useCaseUsage`
- `user`
- `userAccess`
- `userAccessLocked`
- `userAccessUnlocked`
- `userActivity`
- `userAdmin`
- `userAvatar`
- `userAvatarFilled`
- `userAvatarFilledAlt`
- `userCertification`
- `userData`
- `userFavorite`
- `userFavoriteAlt`
- `userFavoriteAltFilled`
- `userFeedback`
- `userFilled`
- `userFollow`
- `userIdentification`
- `userMilitary`
- `userMultiple`
- `userOnline`
- `userProfile`
- `userProfileAlt`
- `userRole`
- `userService`
- `userServiceDesk`
- `userSettings`
- `userSimulation`
- `userSpeaker`
- `userSponsor`
- `userXRay`
- `uvIndex`
- `uvIndexAlt`
- `uvIndexFilled`
- `valueVariable`
- `van`
- `vegetationAsset`
- `vegetationEncroachment`
- `vegetationHeight`
- `vehicleApi`
- `vehicleConnected`
- `vehicleInsights`
- `vehicleServices`
- `version`
- `versionMajor`
- `versionMinor`
- `versionPatch`
- `verticalView`
- `video`
- `videoAdd`
- `videoChat`
- `videoFilled`
- `videoOff`
- `videoOffFilled`
- `videoPlayer`
- `view`
- `viewFilled`
- `viewMode1`
- `viewMode2`
- `viewNext`
- `viewOff`
- `viewOffFilled`
- `virtualColumn`
- `virtualColumnKey`
- `virtualDesktop`
- `virtualMachine`
- `virtualPrivateCloud`
- `virtualPrivateCloudAlt`
- `visualRecognition`
- `vlan`
- `vlanIbm`
- `vmdkDisk`
- `voiceActivate`
- `voicemail`
- `volumeBlockStorage`
- `volumeDown`
- `volumeDownAlt`
- `volumeDownFilled`
- `volumeDownFilledAlt`
- `volumeFileStorage`
- `volumeMute`
- `volumeMuteFilled`
- `volumeObjectStorage`
- `volumeUp`
- `volumeUpAlt`
- `volumeUpFilled`
- `volumeUpFilledAlt`
- `vpn`
- `vpnConnection`
- `vpnPolicy`
- `wallet`
- `warning`
- `warningAlt`
- `warningAltFilled`
- `warningAltInverted`
- `warningAltInvertedFilled`
- `warningDiamond`
- `warningFilled`
- `warningHex`
- `warningHexFilled`
- `warningMultiple`
- `warningOther`
- `warningSquare`
- `warningSquareFilled`
- `watch`
- `watson`
- `watsonMachineLearning`
- `watsonx`
- `watsonxAi`
- `watsonxData`
- `watsonxGovernance`
- `waveDirection`
- `waveHeight`
- `wavePeriod`
- `waveform`
- `weatherFrontCold`
- `weatherFrontStationary`
- `weatherFrontWarm`
- `weatherStation`
- `webServicesCluster`
- `webServicesContainer`
- `webServicesDefinition`
- `webServicesService`
- `webServicesTask`
- `webServicesTaskDefinitionVersion`
- `webhook`
- `websheet`
- `wheat`
- `whileLoop`
- `whitePaper`
- `wifi`
- `wifiBridge`
- `wifiBridgeAlt`
- `wifiController`
- `wifiNotSecure`
- `wifiOff`
- `wifiSecure`
- `wikis`
- `windGusts`
- `windPower`
- `windStream`
- `windowAuto`
- `windowBase`
- `windowBlackSaturation`
- `windowOverlay`
- `windowPreset`
- `windy`
- `windyDust`
- `windySnow`
- `windyStrong`
- `winterWarning`
- `wintryMix`
- `wirelessCheckout`
- `wmv`
- `wordCloud`
- `workflowAutomation`
- `workspace`
- `workspaceImport`
- `worship`
- `worshipChristian`
- `worshipJewish`
- `worshipMuslim`
- `x`
- `xAxis`
- `xls`
- `xml`
- `y`
- `yAxis`
- `z`
- `zAxis`
- `zLpar`
- `zSystems`
- `zip`
- `zipReference`
- `zoomArea`
- `zoomFit`
- `zoomIn`
- `zoomInArea`
- `zoomOut`
- `zoomOutArea`
- `zoomPan`
- `zoomReset`
- `zos`
- `zosSysplex`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dCursorIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dCursorAltIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dCurveAutoColonIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3dCurveAutoVesselsIcon size="20" class="nav-icon" /> Settings</a>
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
<3dCursorIcon
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
    <3dCursorIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dCursorAltIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dCurveAutoColonIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dCursorIcon size="24" />
   <3dCursorAltIcon size="24" color="#4a90e2" />
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
   <3dCursorIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dCursorIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dCursorIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dCursor } from '@stacksjs/iconify-carbon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dCursor, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dCursor } from '@stacksjs/iconify-carbon'

// Icons are typed as IconData
const myIcon: IconData = 3dCursor
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0



## Credits

- **Icons**: IBM ([Website](https://github.com/carbon-design-system/carbon/tree/main/packages/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/carbon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/carbon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
