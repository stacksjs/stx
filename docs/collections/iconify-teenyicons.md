# Teenyicons

> Teenyicons icons for stx from Iconify

## Overview

This package provides access to 1200 icons from the Teenyicons collection through the stx iconify integration.

**Collection ID:** `teenyicons`
**Total Icons:** 1200
**Author:** smhmd ([Website](https://github.com/teenyicons/teenyicons))
**License:** MIT ([Details](https://github.com/teenyicons/teenyicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-teenyicons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<360OutlineIcon height="1em" />
<360OutlineIcon width="1em" height="1em" />
<360OutlineIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<360OutlineIcon size="24" />
<360OutlineIcon size="1em" />

<!-- Using width and height -->
<360OutlineIcon width="24" height="32" />

<!-- With color -->
<360OutlineIcon size="24" color="red" />
<360OutlineIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<360OutlineIcon size="24" class="icon-primary" />

<!-- With all properties -->
<360OutlineIcon
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
    <360OutlineIcon size="24" />
    <360SolidIcon size="24" color="#4a90e2" />
    <AbTestingOutlineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 360Outline, 360Solid, abTestingOutline } from '@stacksjs/iconify-teenyicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(360Outline, { size: 24 })
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
<360OutlineIcon size="24" color="red" />
<360OutlineIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<360OutlineIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<360OutlineIcon size="24" class="text-primary" />
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
<360OutlineIcon height="1em" />
<360OutlineIcon width="1em" height="1em" />
<360OutlineIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<360OutlineIcon size="24" />
<360OutlineIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.teenyicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<360OutlineIcon class="teenyicons-icon" />
```

## Available Icons

This package contains **1200** icons:

- `360Outline`
- `360Solid`
- `abTestingOutline`
- `abTestingSolid`
- `addOutline`
- `addSmallOutline`
- `addSmallSolid`
- `addSolid`
- `addressBookOutline`
- `addressBookSolid`
- `adjustHorizontalAltOutline`
- `adjustHorizontalAltSolid`
- `adjustHorizontalOutline`
- `adjustHorizontalSolid`
- `adjustVerticalAltOutline`
- `adjustVerticalAltSolid`
- `adjustVerticalOutline`
- `adjustVerticalSolid`
- `airplayOutline`
- `airplaySolid`
- `airpodsOutline`
- `airpodsSolid`
- `alarmOutline`
- `alarmSolid`
- `alienOutline`
- `alienSolid`
- `alignBottomOutline`
- `alignBottomSolid`
- `alignCenterHorizontalOutline`
- `alignCenterHorizontalSolid`
- `alignCenterVerticalOutline`
- `alignCenterVerticalSolid`
- `alignLeftOutline`
- `alignLeftSolid`
- `alignRightOutline`
- `alignRightSolid`
- `alignTextCenterOutline`
- `alignTextCenterSolid`
- `alignTextJustifyOutline`
- `alignTextJustifySolid`
- `alignTextLeftOutline`
- `alignTextLeftSolid`
- `alignTextRightOutline`
- `alignTextRightSolid`
- `alignTopOutline`
- `alignTopSolid`
- `anchorOutline`
- `anchorSolid`
- `androidOutline`
- `androidSolid`
- `angularOutline`
- `angularSolid`
- `anjaOutline`
- `anjaSolid`
- `antiClockwiseOutline`
- `antiClockwiseSolid`
- `appleOutline`
- `appleSolid`
- `appointmentsOutline`
- `appointmentsSolid`
- `archiveOutline`
- `archiveSolid`
- `areaChartAltOutline`
- `areaChartAltSolid`
- `areaChartOutline`
- `areaChartSolid`
- `arrowDownCircleOutline`
- `arrowDownCircleSolid`
- `arrowDownOutline`
- `arrowDownSmallOutline`
- `arrowDownSmallSolid`
- `arrowDownSolid`
- `arrowLeftCircleOutline`
- `arrowLeftCircleSolid`
- `arrowLeftOutline`
- `arrowLeftSmallOutline`
- `arrowLeftSmallSolid`
- `arrowLeftSolid`
- `arrowOutline`
- `arrowRightCircleOutline`
- `arrowRightCircleSolid`
- `arrowRightOutline`
- `arrowRightSmallOutline`
- `arrowRightSmallSolid`
- `arrowRightSolid`
- `arrowSolid`
- `arrowUpCircleOutline`
- `arrowUpCircleSolid`
- `arrowUpOutline`
- `arrowUpSmallOutline`
- `arrowUpSmallSolid`
- `arrowUpSolid`
- `artboardOutline`
- `artboardSolid`
- `atOutline`
- `atSolid`
- `attachOutline`
- `attachSolid`
- `attachmentOutline`
- `attachmentSolid`
- `audioCableOutline`
- `audioCableSolid`
- `audioDocumentOutline`
- `audioDocumentSolid`
- `azureOutline`
- `azureSolid`
- `backspaceOutline`
- `backspaceSolid`
- `bagAltOutline`
- `bagAltSolid`
- `bagMinusOutline`
- `bagMinusSolid`
- `bagOutline`
- `bagPlusOutline`
- `bagPlusSolid`
- `bagSolid`
- `bankOutline`
- `bankSolid`
- `barChartOutline`
- `barChartSolid`
- `barcodeOutline`
- `barcodeSolid`
- `basketMinusOutline`
- `basketMinusSolid`
- `basketOutline`
- `basketPlusOutline`
- `basketPlusSolid`
- `basketSolid`
- `bathOutline`
- `bathSolid`
- `battery0Outline`
- `battery0Solid`
- `battery1Outline`
- `battery1Solid`
- `battery2Outline`
- `battery2Solid`
- `battery3Outline`
- `battery3Solid`
- `battery4Outline`
- `battery4Solid`
- `battery5Outline`
- `battery5Solid`
- `batteryChargeOutline`
- `batteryChargeSolid`
- `bedDoubleOutline`
- `bedDoubleSolid`
- `bedSingleOutline`
- `bedSingleSolid`
- `behanceOutline`
- `behanceSolid`
- `bellOutline`
- `bellSolid`
- `binOutline`
- `binSolid`
- `bitbucketOutline`
- `bitbucketSolid`
- `bitcoinOutline`
- `bitcoinSolid`
- `bluetoothOutline`
- `bluetoothSolid`
- `boldOutline`
- `boldSolid`
- `bookOutline`
- `bookSolid`
- `bookmarkOutline`
- `bookmarkSolid`
- `borderAllOutline`
- `borderAllSolid`
- `borderBottomOutline`
- `borderBottomSolid`
- `borderHorizontalOutline`
- `borderHorizontalSolid`
- `borderInnerOutline`
- `borderInnerSolid`
- `borderLeftOutline`
- `borderLeftSolid`
- `borderNoneOutline`
- `borderNoneSolid`
- `borderOuterOutline`
- `borderOuterSolid`
- `borderRadiusOutline`
- `borderRadiusSolid`
- `borderRightOutline`
- `borderRightSolid`
- `borderTopOutline`
- `borderTopSolid`
- `borderVerticalOutline`
- `borderVerticalSolid`
- `bottomLeftOutline`
- `bottomLeftSolid`
- `bottomRightOutline`
- `bottomRightSolid`
- `boxOutline`
- `boxSolid`
- `bracketOutline`
- `bracketSolid`
- `briefcaseAltOutline`
- `briefcaseAltSolid`
- `briefcaseOutline`
- `briefcaseSolid`
- `brushOutline`
- `brushSolid`
- `bugOutline`
- `bugSolid`
- `buildingOutline`
- `buildingSolid`
- `bulbOffOutline`
- `bulbOffSolid`
- `bulbOnOutline`
- `bulbOnSolid`
- `buttonOutline`
- `buttonSolid`
- `cOutline`
- `cSharpOutline`
- `cSharpSolid`
- `cSolid`
- `calculatorOutline`
- `calculatorSolid`
- `calendarMinusOutline`
- `calendarMinusSolid`
- `calendarNoAccessOutline`
- `calendarNoAccessSolid`
- `calendarOutline`
- `calendarPlusOutline`
- `calendarPlusSolid`
- `calendarSolid`
- `calendarTickOutline`
- `calendarTickSolid`
- `calendarXOutline`
- `calendarXSolid`
- `cameraOutline`
- `cameraSolid`
- `candleChartOutline`
- `candleChartSolid`
- `carOutline`
- `carSolid`
- `caretVerticalCircleOutline`
- `caretVerticalCircleSolid`
- `caretVerticalOutline`
- `caretVerticalSmallOutline`
- `caretVerticalSmallSolid`
- `caretVerticalSolid`
- `cartMinusOutline`
- `cartMinusSolid`
- `cartOutline`
- `cartPlusOutline`
- `cartPlusSolid`
- `cartSolid`
- `certificateOutline`
- `certificateSolid`
- `chatOutline`
- `chatSolid`
- `chatTypingAltOutline`
- `chatTypingAltSolid`
- `chatTypingOutline`
- `chatTypingSolid`
- `chatbotOutline`
- `chatbotSolid`
- `chromeOutline`
- `chromeSolid`
- `churchOutline`
- `churchSolid`
- `circleOutline`
- `circleSolid`
- `clipboardMinusOutline`
- `clipboardMinusSolid`
- `clipboardNoAccessOutline`
- `clipboardNoAccessSolid`
- `clipboardOutline`
- `clipboardPlusOutline`
- `clipboardPlusSolid`
- `clipboardSolid`
- `clipboardTickOutline`
- `clipboardTickSolid`
- `clipboardXOutline`
- `clipboardXSolid`
- `clockOutline`
- `clockSolid`
- `clockwiseOutline`
- `clockwiseSolid`
- `codeOutline`
- `codeSolid`
- `codepenOutline`
- `codepenSolid`
- `cogOutline`
- `cogSolid`
- `compassOutline`
- `compassSolid`
- `computerOutline`
- `computerSolid`
- `contactOutline`
- `contactSolid`
- `contractOutline`
- `contractSolid`
- `costEstimateOutline`
- `costEstimateSolid`
- `cplusplusOutline`
- `cplusplusSolid`
- `creditCardOutline`
- `creditCardSolid`
- `cropOutline`
- `cropSolid`
- `css3Outline`
- `css3Solid`
- `csvOutline`
- `csvSolid`
- `cupOutline`
- `cupSolid`
- `curvedConnectorOutline`
- `curvedConnectorSolid`
- `d3Outline`
- `d3Solid`
- `databaseOutline`
- `databaseSolid`
- `deniedOutline`
- `deniedSolid`
- `denoOutline`
- `denoSolid`
- `depthChartOutline`
- `depthChartSolid`
- `desklampOutline`
- `desklampSolid`
- `diamondOutline`
- `diamondSolid`
- `directionOutline`
- `directionSolid`
- `discordOutline`
- `discordSolid`
- `discountOutline`
- `discountSolid`
- `distributeHorizontalOutline`
- `distributeHorizontalSolid`
- `distributeVerticalOutline`
- `distributeVerticalSolid`
- `dividerLineOutline`
- `dividerLineSolid`
- `docOutline`
- `docSolid`
- `dockerOutline`
- `dockerSolid`
- `documentsOutline`
- `documentsSolid`
- `dollarOutline`
- `dollarSolid`
- `donutChartOutline`
- `donutChartSolid`
- `doubleCaretDownCircleOutline`
- `doubleCaretDownCircleSolid`
- `doubleCaretDownOutline`
- `doubleCaretDownSmallOutline`
- `doubleCaretDownSmallSolid`
- `doubleCaretDownSolid`
- `doubleCaretLeftCircleOutline`
- `doubleCaretLeftCircleSolid`
- `doubleCaretLeftOutline`
- `doubleCaretLeftSmallOutline`
- `doubleCaretLeftSmallSolid`
- `doubleCaretLeftSolid`
- `doubleCaretRightCircleOutline`
- `doubleCaretRightCircleSolid`
- `doubleCaretRightOutline`
- `doubleCaretRightSmallOutline`
- `doubleCaretRightSmallSolid`
- `doubleCaretRightSolid`
- `doubleCaretUpCircleOutline`
- `doubleCaretUpCircleSolid`
- `doubleCaretUpOutline`
- `doubleCaretUpSmallOutline`
- `doubleCaretUpSmallSolid`
- `doubleCaretUpSolid`
- `downCircleOutline`
- `downCircleSolid`
- `downOutline`
- `downSmallOutline`
- `downSmallSolid`
- `downSolid`
- `downloadOutline`
- `downloadSolid`
- `dragHorizontalOutline`
- `dragHorizontalSolid`
- `dragOutline`
- `dragSolid`
- `dragVerticalOutline`
- `dragVerticalSolid`
- `dribbbleOutline`
- `dribbbleSolid`
- `dropOutline`
- `dropSolid`
- `dropperOutline`
- `dropperSolid`
- `edgeOutline`
- `edgeSolid`
- `edit1Outline`
- `edit1Solid`
- `editCircleOutline`
- `editCircleSolid`
- `editOutline`
- `editSmallOutline`
- `editSmallSolid`
- `editSolid`
- `elbowConnectorOutline`
- `elbowConnectorSolid`
- `envelopeOpenOutline`
- `envelopeOpenSolid`
- `envelopeOutline`
- `envelopeSolid`
- `epsOutline`
- `epsSolid`
- `eslintOutline`
- `eslintSolid`
- `ethereumOutline`
- `ethereumSolid`
- `euroOutline`
- `euroSolid`
- `exclamationCircleOutline`
- `exclamationCircleSolid`
- `exclamationOutline`
- `exclamationSmallOutline`
- `exclamationSmallSolid`
- `exclamationSolid`
- `expandAltOutline`
- `expandAltSolid`
- `expandOutline`
- `expandSolid`
- `eyeClosedOutline`
- `eyeClosedSolid`
- `eyeOutline`
- `eyeSolid`
- `faceIdOutline`
- `faceIdSolid`
- `facebookOutline`
- `facebookSolid`
- `figmaOutline`
- `figmaSolid`
- `fileMinusOutline`
- `fileMinusSolid`
- `fileNoAccessOutline`
- `fileNoAccessSolid`
- `fileOutline`
- `filePlusOutline`
- `filePlusSolid`
- `fileSolid`
- `fileTickOutline`
- `fileTickSolid`
- `fileXOutline`
- `fileXSolid`
- `filterOutline`
- `filterSolid`
- `fingerprintOutline`
- `fingerprintSolid`
- `firebaseOutline`
- `firebaseSolid`
- `flagAltOutline`
- `flagAltSolid`
- `flagOutline`
- `flagSolid`
- `flipHorizontalOutline`
- `flipHorizontalSolid`
- `flipVerticalOutline`
- `flipVerticalSolid`
- `floatCenterOutline`
- `floatCenterSolid`
- `floatLeftOutline`
- `floatLeftSolid`
- `floatRightOutline`
- `floatRightSolid`
- `floorplanOutline`
- `floorplanSolid`
- `folderMinusOutline`
- `folderMinusSolid`
- `folderNoAccessOutline`
- `folderNoAccessSolid`
- `folderOutline`
- `folderPlusOutline`
- `folderPlusSolid`
- `folderSolid`
- `folderTickOutline`
- `folderTickSolid`
- `folderXOutline`
- `folderXSolid`
- `foldersOutline`
- `foldersSolid`
- `forwardCircleOutline`
- `forwardCircleSolid`
- `forwardOutline`
- `forwardSmallOutline`
- `forwardSmallSolid`
- `forwardSolid`
- `frameOutline`
- `frameSolid`
- `framerOutline`
- `framerSolid`
- `gameControllerOutline`
- `gameControllerRetroOutline`
- `gameControllerRetroSolid`
- `gameControllerSolid`
- `ganttChartOutline`
- `ganttChartSolid`
- `garageOutline`
- `garageSolid`
- `gatsbyjsOutline`
- `gatsbyjsSolid`
- `gbaOutline`
- `gbaSolid`
- `gbcOutline`
- `gbcSolid`
- `ghostOutline`
- `ghostSolid`
- `gifOutline`
- `gifSolid`
- `giftOutline`
- `giftSolid`
- `gitBranchOutline`
- `gitBranchSolid`
- `gitCommitOutline`
- `gitCommitSolid`
- `gitCompareOutline`
- `gitCompareSolid`
- `gitForkOutline`
- `gitForkSolid`
- `gitMergeOutline`
- `gitMergeSolid`
- `gitOutline`
- `gitPullOutline`
- `gitPullSolid`
- `gitSolid`
- `githubOutline`
- `githubSolid`
- `gitlabOutline`
- `gitlabSolid`
- `globeAfricaOutline`
- `globeAfricaSolid`
- `globeAmericasOutline`
- `globeAmericasSolid`
- `globeOutline`
- `globeSolid`
- `googleAdOutline`
- `googleAdSolid`
- `googleDriveOutline`
- `googleDriveSolid`
- `googleOutline`
- `googlePlayStoreOutline`
- `googlePlayStoreSolid`
- `googleSolid`
- `googleStreetviewOutline`
- `googleStreetviewSolid`
- `graphqlOutline`
- `graphqlSolid`
- `gridLayoutOutline`
- `gridLayoutSolid`
- `hashtagOutline`
- `hashtagSolid`
- `hdScreenOutline`
- `hdScreenSolid`
- `hdmiCableOutline`
- `hdmiCableSolid`
- `headphonesOutline`
- `headphonesSolid`
- `headsetOutline`
- `headsetSolid`
- `heartCircleOutline`
- `heartCircleSolid`
- `heartOutline`
- `heartSmallOutline`
- `heartSmallSolid`
- `heartSolid`
- `hexagonOutline`
- `hexagonSolid`
- `historyOutline`
- `historySolid`
- `homeAltOutline`
- `homeAltSolid`
- `homeOutline`
- `homeSolid`
- `hospitalOutline`
- `hospitalSolid`
- `hourglassOutline`
- `hourglassSolid`
- `houseOutline`
- `houseSolid`
- `html5Outline`
- `html5Solid`
- `idOutline`
- `idSolid`
- `imacOutline`
- `imacSolid`
- `imageAltOutline`
- `imageAltSolid`
- `imageDocumentOutline`
- `imageDocumentSolid`
- `imageOutline`
- `imageSolid`
- `inEarHeadphonesOutline`
- `inEarHeadphonesSolid`
- `inboxOutline`
- `inboxSolid`
- `indentDecreaseOutline`
- `indentDecreaseSolid`
- `indentIncreaseOutline`
- `indentIncreaseSolid`
- `infoCircleOutline`
- `infoCircleSolid`
- `infoOutline`
- `infoSmallOutline`
- `infoSmallSolid`
- `infoSolid`
- `instagramOutline`
- `instagramSolid`
- `invoiceOutline`
- `invoiceSolid`
- `italicOutline`
- `italicSolid`
- `javascriptOutline`
- `javascriptSolid`
- `joystickOutline`
- `joystickSolid`
- `jpgOutline`
- `jpgSolid`
- `kanbanOutline`
- `kanbanSolid`
- `keyOutline`
- `keySolid`
- `keyboardOutline`
- `keyboardSolid`
- `lanCableOutline`
- `lanCableSolid`
- `laptopOutline`
- `laptopSolid`
- `laravelOutline`
- `laravelSolid`
- `layersDifferenceOutline`
- `layersDifferenceSolid`
- `layersIntersectOutline`
- `layersIntersectSolid`
- `layersOutline`
- `layersSolid`
- `layersSubtractOutline`
- `layersSubtractSolid`
- `layersUnionOutline`
- `layersUnionSolid`
- `leftCircleOutline`
- `leftCircleSolid`
- `leftOutline`
- `leftSmallOutline`
- `leftSmallSolid`
- `leftSolid`
- `legoOutline`
- `legoSolid`
- `lifebuoyOutline`
- `lifebuoySolid`
- `lightningCableOutline`
- `lightningCableSolid`
- `lineOutline`
- `lineSolid`
- `linkOutline`
- `linkRemoveOutline`
- `linkRemoveSolid`
- `linkSolid`
- `linkedinOutline`
- `linkedinSolid`
- `linuxAltOutline`
- `linuxAltSolid`
- `linuxOutline`
- `linuxSolid`
- `listLayoutOutline`
- `listLayoutSolid`
- `listOrderedOutline`
- `listOrderedSolid`
- `listUnorderedOutline`
- `listUnorderedSolid`
- `litecoinOutline`
- `litecoinSolid`
- `loaderOutline`
- `loaderSolid`
- `locationOutline`
- `locationSolid`
- `lockCircleOutline`
- `lockCircleSolid`
- `lockOutline`
- `lockSmallOutline`
- `lockSmallSolid`
- `lockSolid`
- `logoutOutline`
- `logoutSolid`
- `loopOutline`
- `loopSolid`
- `magsafeOutline`
- `magsafeSolid`
- `markdownOutline`
- `markdownSolid`
- `mediumOutline`
- `mediumSolid`
- `menuOutline`
- `menuSolid`
- `messageMinusOutline`
- `messageMinusSolid`
- `messageNoAccessOutline`
- `messageNoAccessSolid`
- `messageOutline`
- `messagePlusOutline`
- `messagePlusSolid`
- `messageSolid`
- `messageTextAltOutline`
- `messageTextAltSolid`
- `messageTextOutline`
- `messageTextSolid`
- `messageTickOutline`
- `messageTickSolid`
- `messageXOutline`
- `messageXSolid`
- `messengerOutline`
- `messengerSolid`
- `microSdCardOutline`
- `microSdCardSolid`
- `microphoneOutline`
- `microphoneSolid`
- `minimiseAltOutline`
- `minimiseAltSolid`
- `minimiseOutline`
- `minimiseSolid`
- `minusCircleOutline`
- `minusCircleSolid`
- `minusOutline`
- `minusSmallOutline`
- `minusSmallSolid`
- `minusSolid`
- `mobileOutline`
- `mobileSolid`
- `moneyOutline`
- `moneySolid`
- `moneyStackOutline`
- `moneyStackSolid`
- `mongodbOutline`
- `mongodbSolid`
- `moodFlatOutline`
- `moodFlatSolid`
- `moodFrownOutline`
- `moodFrownSolid`
- `moodLaughOutline`
- `moodLaughSolid`
- `moodSadOutline`
- `moodSadSolid`
- `moodSmileOutline`
- `moodSmileSolid`
- `moodSurprisedOutline`
- `moodSurprisedSolid`
- `moodTongueOutline`
- `moodTongueSolid`
- `moonOutline`
- `moonSolid`
- `moreHorizontalOutline`
- `moreHorizontalSolid`
- `moreVerticalOutline`
- `moreVerticalSolid`
- `mouseOutline`
- `mouseSolid`
- `movOutline`
- `movSolid`
- `mp3Outline`
- `mp3Solid`
- `mp4Outline`
- `mp4Solid`
- `msExcelOutline`
- `msExcelSolid`
- `msPowerpointOutline`
- `msPowerpointSolid`
- `msWordOutline`
- `msWordSolid`
- `n64Outline`
- `n64Solid`
- `nesOutline`
- `nesSolid`
- `netlifyOutline`
- `netlifySolid`
- `nextCircleOutline`
- `nextCircleSolid`
- `nextOutline`
- `nextSmallOutline`
- `nextSmallSolid`
- `nextSolid`
- `nextjsOutline`
- `nextjsSolid`
- `ngcOutline`
- `ngcSolid`
- `nintendoSwitchOutline`
- `nintendoSwitchSolid`
- `nodejsOutline`
- `nodejsSolid`
- `noteOutline`
- `noteSolid`
- `npmOutline`
- `npmSolid`
- `nuxtjsOutline`
- `nuxtjsSolid`
- `omegaOutline`
- `omegaSolid`
- `operaOutline`
- `operaSolid`
- `otpOutline`
- `otpSolid`
- `pageBreakOutline`
- `pageBreakSolid`
- `pageNumberOutline`
- `pageNumberSolid`
- `paintbrushOutline`
- `paintbrushSolid`
- `paintbucketOutline`
- `paintbucketSolid`
- `paragraphOutline`
- `paragraphSolid`
- `passwordOutline`
- `passwordSolid`
- `patreonOutline`
- `patreonSolid`
- `pauseCircleOutline`
- `pauseCircleSolid`
- `pauseOutline`
- `pauseSmallOutline`
- `pauseSmallSolid`
- `pauseSolid`
- `pawOutline`
- `pawSolid`
- `pawsOutline`
- `pawsSolid`
- `paypalOutline`
- `paypalSolid`
- `pdfOutline`
- `pdfSolid`
- `penOutline`
- `penSolid`
- `phoneOutline`
- `phoneSolid`
- `phonecallBlockedOutline`
- `phonecallBlockedSolid`
- `phonecallOutline`
- `phonecallReceiveOutline`
- `phonecallReceiveSolid`
- `phonecallSolid`
- `pieChartAltOutline`
- `pieChartAltSolid`
- `pieChartOutline`
- `pieChartSolid`
- `pinAltOutline`
- `pinAltSolid`
- `pinOutline`
- `pinSolid`
- `pinterestOutline`
- `pinterestSolid`
- `plantOutline`
- `plantSolid`
- `playCircleOutline`
- `playCircleSolid`
- `playOutline`
- `playSmallOutline`
- `playSmallSolid`
- `playSolid`
- `plugOutline`
- `plugSolid`
- `plusCircleOutline`
- `plusCircleSolid`
- `pngOutline`
- `pngSolid`
- `poolOutline`
- `poolSolid`
- `poundOutline`
- `poundSolid`
- `powerOutline`
- `powerSolid`
- `pptOutline`
- `pptSolid`
- `printOutline`
- `printSolid`
- `pythonOutline`
- `pythonSolid`
- `qrCodeOutline`
- `qrCodeSolid`
- `questionCircleOutline`
- `questionCircleSolid`
- `questionOutline`
- `questionSmallOutline`
- `questionSmallSolid`
- `questionSolid`
- `quoteOutline`
- `quoteSolid`
- `randOutline`
- `randSolid`
- `reactOutline`
- `reactSolid`
- `receiptOutline`
- `receiptSolid`
- `redditOutline`
- `redditSolid`
- `redwoodjsOutline`
- `redwoodjsSolid`
- `refreshAltOutline`
- `refreshAltSolid`
- `refreshOutline`
- `refreshSolid`
- `rewindCircleOutline`
- `rewindCircleSolid`
- `rewindOutline`
- `rewindSmallOutline`
- `rewindSmallSolid`
- `rewindSolid`
- `rightCircleOutline`
- `rightCircleSolid`
- `rightOutline`
- `rightSmallOutline`
- `rightSmallSolid`
- `rightSolid`
- `rippleOutline`
- `rippleSolid`
- `robotOutline`
- `robotSolid`
- `rollerOutline`
- `rollerSolid`
- `rollupjsOutline`
- `rollupjsSolid`
- `routerOutline`
- `routerSolid`
- `rssOutline`
- `rssSolid`
- `rubyOutline`
- `rubySolid`
- `rupeeOutline`
- `rupeeSolid`
- `rustOutline`
- `rustSolid`
- `safariOutline`
- `safariSolid`
- `safeOutline`
- `safeSolid`
- `saveOutline`
- `saveSolid`
- `scanOutline`
- `scanSolid`
- `schoolOutline`
- `schoolSolid`
- `screenAlt2Outline`
- `screenAlt2Solid`
- `screenAltOutline`
- `screenAltSolid`
- `screenOutline`
- `screenSolid`
- `scribbleOutline`
- `scribbleSolid`
- `sdCardOutline`
- `sdCardSolid`
- `searchCircleOutline`
- `searchCircleSolid`
- `searchOutline`
- `searchPropertyOutline`
- `searchPropertySolid`
- `searchSmallOutline`
- `searchSmallSolid`
- `searchSolid`
- `sectionAddOutline`
- `sectionAddSolid`
- `sectionRemoveOutline`
- `sectionRemoveSolid`
- `sendDownOutline`
- `sendDownSolid`
- `sendLeftOutline`
- `sendLeftSolid`
- `sendOutline`
- `sendRightOutline`
- `sendRightSolid`
- `sendSolid`
- `sendUpOutline`
- `sendUpSolid`
- `serversOutline`
- `serversSolid`
- `shareOutline`
- `shareSolid`
- `shieldOutline`
- `shieldSolid`
- `shieldTickOutline`
- `shieldTickSolid`
- `shieldXOutline`
- `shieldXSolid`
- `shopOutline`
- `shopSolid`
- `signOutline`
- `signSolid`
- `signinOutline`
- `signinSolid`
- `simOutline`
- `simSolid`
- `simohamedOutline`
- `simohamedSolid`
- `skullOutline`
- `skullSolid`
- `skypeOutline`
- `skypeSolid`
- `slackOutline`
- `slackSolid`
- `snapchatOutline`
- `snapchatSolid`
- `snesOutline`
- `snesSolid`
- `sortAlphabeticallyOutline`
- `sortAlphabeticallySolid`
- `sortDownOutline`
- `sortDownSolid`
- `sortHighToLowOutline`
- `sortHighToLowSolid`
- `sortLowToHighOutline`
- `sortLowToHighSolid`
- `sortReverseAlphabeticallyOutline`
- `sortReverseAlphabeticallySolid`
- `sortUpOutline`
- `sortUpSolid`
- `soundOffOutline`
- `soundOffSolid`
- `soundOnOutline`
- `soundOnSolid`
- `spotifyOutline`
- `spotifySolid`
- `spreadsheetOutline`
- `spreadsheetSolid`
- `squareOutline`
- `squareSolid`
- `stackoverflowOutline`
- `stackoverflowSolid`
- `stampOutline`
- `stampSolid`
- `starCircleOutline`
- `starCircleSolid`
- `starOutline`
- `starSmallOutline`
- `starSmallSolid`
- `starSolid`
- `stopCircleOutline`
- `stopCircleSolid`
- `stopOutline`
- `stopSmallOutline`
- `stopSmallSolid`
- `stopSolid`
- `stopwatchOutline`
- `stopwatchSolid`
- `strikethroughOutline`
- `strikethroughSolid`
- `subscriptOutline`
- `subscriptSolid`
- `sunOutline`
- `sunSolid`
- `superscriptOutline`
- `superscriptSolid`
- `svelteOutline`
- `svelteSolid`
- `svgOutline`
- `svgSolid`
- `tableOutline`
- `tableSolid`
- `tabletOutline`
- `tabletSolid`
- `tagOutline`
- `tagSolid`
- `tailwindOutline`
- `tailwindSolid`
- `targetOutline`
- `targetSolid`
- `telegramOutline`
- `telegramSolid`
- `terminalOutline`
- `terminalSolid`
- `textDocumentAltOutline`
- `textDocumentAltSolid`
- `textDocumentOutline`
- `textDocumentSolid`
- `textOutline`
- `textSolid`
- `thumbDownOutline`
- `thumbDownSolid`
- `thumbUpOutline`
- `thumbUpSolid`
- `thumbtackOutline`
- `thumbtackSolid`
- `tickCircleOutline`
- `tickCircleSolid`
- `tickOutline`
- `tickSmallOutline`
- `tickSmallSolid`
- `tickSolid`
- `tiktokOutline`
- `tiktokSolid`
- `toggleOutline`
- `toggleSolid`
- `topLeftOutline`
- `topLeftSolid`
- `topRightOutline`
- `topRightSolid`
- `trendDownOutline`
- `trendDownSolid`
- `trendUpOutline`
- `trendUpSolid`
- `triangleOutline`
- `triangleSolid`
- `trophyOutline`
- `trophySolid`
- `tvOutline`
- `tvSolid`
- `twitchOutline`
- `twitchSolid`
- `twitterOutline`
- `twitterSolid`
- `typescriptOutline`
- `typescriptSolid`
- `underlineOutline`
- `underlineSolid`
- `unlockCircleOutline`
- `unlockCircleSolid`
- `unlockOutline`
- `unlockSmallOutline`
- `unlockSmallSolid`
- `unlockSolid`
- `upCircleOutline`
- `upCircleSolid`
- `upOutline`
- `upSmallOutline`
- `upSmallSolid`
- `upSolid`
- `uploadOutline`
- `uploadSolid`
- `usbCableOutline`
- `usbCableSolid`
- `userCircleOutline`
- `userCircleSolid`
- `userMinusOutline`
- `userMinusSolid`
- `userOutline`
- `userPlusOutline`
- `userPlusSolid`
- `userSolid`
- `userSquareOutline`
- `userSquareSolid`
- `usersOutline`
- `usersSolid`
- `vectorDocumentOutline`
- `vectorDocumentSolid`
- `vennDiagramOutline`
- `vennDiagramSolid`
- `viewColumnOutline`
- `viewColumnSolid`
- `viewGridOutline`
- `viewGridSolid`
- `vimOutline`
- `vimSolid`
- `volume1Outline`
- `volume1Solid`
- `volume2Outline`
- `volume2Solid`
- `volume3Outline`
- `volume3Solid`
- `vrHeadsetOutline`
- `vrHeadsetSolid`
- `vueOutline`
- `vueSolid`
- `walletAltOutline`
- `walletAltSolid`
- `walletOutline`
- `walletSolid`
- `wanOutline`
- `wanSolid`
- `wandOutline`
- `wandSolid`
- `watchOutline`
- `watchSolid`
- `webpackOutline`
- `webpackSolid`
- `whatsappOutline`
- `whatsappSolid`
- `wifiFullOutline`
- `wifiFullSolid`
- `wifiLowOutline`
- `wifiLowSolid`
- `wifiNoneOutline`
- `wifiNoneSolid`
- `windowsOutline`
- `windowsSolid`
- `wordpressOutline`
- `wordpressSolid`
- `xCircleOutline`
- `xCircleSolid`
- `xOutline`
- `xSmallOutline`
- `xSmallSolid`
- `xSolid`
- `xlsOutline`
- `xlsSolid`
- `yenOutline`
- `yenSolid`
- `youtubeOutline`
- `youtubeSolid`
- `zipOutline`
- `zipSolid`
- `zoomInOutline`
- `zoomInSolid`
- `zoomOutOutline`
- `zoomOutSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><360OutlineIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><360SolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AbTestingOutlineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AbTestingSolidIcon size="20" class="nav-icon" /> Settings</a>
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
<360OutlineIcon
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
    <360OutlineIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <360SolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AbTestingOutlineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <360OutlineIcon size="24" />
   <360SolidIcon size="24" color="#4a90e2" />
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
   <360OutlineIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <360OutlineIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <360OutlineIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 360Outline } from '@stacksjs/iconify-teenyicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(360Outline, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 360Outline } from '@stacksjs/iconify-teenyicons'

// Icons are typed as IconData
const myIcon: IconData = 360Outline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/teenyicons/teenyicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: smhmd ([Website](https://github.com/teenyicons/teenyicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/teenyicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/teenyicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
