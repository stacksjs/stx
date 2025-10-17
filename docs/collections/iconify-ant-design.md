# Ant Design Icons

> Ant Design Icons icons for stx from Iconify

## Overview

This package provides access to 830 icons from the Ant Design Icons collection through the stx iconify integration.

**Collection ID:** `ant-design`
**Total Icons:** 830
**Author:** HeskeyBaozi ([Website](https://github.com/ant-design/ant-design-icons))
**License:** MIT ([Details](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ant-design
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccountBookFilledIcon height="1em" />
<AccountBookFilledIcon width="1em" height="1em" />
<AccountBookFilledIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccountBookFilledIcon size="24" />
<AccountBookFilledIcon size="1em" />

<!-- Using width and height -->
<AccountBookFilledIcon width="24" height="32" />

<!-- With color -->
<AccountBookFilledIcon size="24" color="red" />
<AccountBookFilledIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccountBookFilledIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccountBookFilledIcon
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
    <AccountBookFilledIcon size="24" />
    <AccountBookOutlinedIcon size="24" color="#4a90e2" />
    <AccountBookTwotoneIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accountBookFilled, accountBookOutlined, accountBookTwotone } from '@stacksjs/iconify-ant-design'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accountBookFilled, { size: 24 })
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
<AccountBookFilledIcon size="24" color="red" />
<AccountBookFilledIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccountBookFilledIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccountBookFilledIcon size="24" class="text-primary" />
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
<AccountBookFilledIcon height="1em" />
<AccountBookFilledIcon width="1em" height="1em" />
<AccountBookFilledIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccountBookFilledIcon size="24" />
<AccountBookFilledIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.antDesign-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccountBookFilledIcon class="antDesign-icon" />
```

## Available Icons

This package contains **830** icons:

- `accountBookFilled`
- `accountBookOutlined`
- `accountBookTwotone`
- `aimOutlined`
- `alertFilled`
- `alertOutlined`
- `alertTwotone`
- `alibabaOutlined`
- `alignCenterOutlined`
- `alignLeftOutlined`
- `alignRightOutlined`
- `alipayCircleFilled`
- `alipayCircleOutlined`
- `alipayOutlined`
- `alipaySquareFilled`
- `aliwangwangFilled`
- `aliwangwangOutlined`
- `aliyunOutlined`
- `amazonCircleFilled`
- `amazonOutlined`
- `amazonSquareFilled`
- `androidFilled`
- `androidOutlined`
- `antCloudOutlined`
- `antDesignOutlined`
- `apartmentOutlined`
- `apiFilled`
- `apiOutlined`
- `apiTwotone`
- `appleFilled`
- `appleOutlined`
- `appstoreAddOutlined`
- `appstoreFilled`
- `appstoreOutlined`
- `appstoreTwotone`
- `areaChartOutlined`
- `arrowDownOutlined`
- `arrowLeftOutlined`
- `arrowRightOutlined`
- `arrowUpOutlined`
- `arrowsAltOutlined`
- `audioFilled`
- `audioMutedOutlined`
- `audioOutlined`
- `audioTwotone`
- `auditOutlined`
- `backwardFilled`
- `backwardOutlined`
- `baiduOutlined`
- `bankFilled`
- `bankOutlined`
- `bankTwotone`
- `barChartOutlined`
- `barcodeOutlined`
- `barsOutlined`
- `behanceCircleFilled`
- `behanceOutlined`
- `behanceSquareFilled`
- `behanceSquareOutlined`
- `bellFilled`
- `bellOutlined`
- `bellTwotone`
- `bgColorsOutlined`
- `bilibiliFilled`
- `bilibiliOutlined`
- `blockOutlined`
- `boldOutlined`
- `bookFilled`
- `bookOutlined`
- `bookTwotone`
- `borderBottomOutlined`
- `borderHorizontalOutlined`
- `borderInnerOutlined`
- `borderLeftOutlined`
- `borderOuterOutlined`
- `borderOutlined`
- `borderRightOutlined`
- `borderTopOutlined`
- `borderVerticleOutlined`
- `borderlessTableOutlined`
- `boxPlotFilled`
- `boxPlotOutlined`
- `boxPlotTwotone`
- `branchesOutlined`
- `bugFilled`
- `bugOutlined`
- `bugTwotone`
- `buildFilled`
- `buildOutlined`
- `buildTwotone`
- `bulbFilled`
- `bulbOutlined`
- `bulbTwotone`
- `calculatorFilled`
- `calculatorOutlined`
- `calculatorTwotone`
- `calendarFilled`
- `calendarOutlined`
- `calendarTwotone`
- `cameraFilled`
- `cameraOutlined`
- `cameraTwotone`
- `carFilled`
- `carOutlined`
- `carTwotone`
- `caretDownFilled`
- `caretDownOutlined`
- `caretLeftFilled`
- `caretLeftOutlined`
- `caretRightFilled`
- `caretRightOutlined`
- `caretUpFilled`
- `caretUpOutlined`
- `carryOutFilled`
- `carryOutOutlined`
- `carryOutTwotone`
- `checkCircleFilled`
- `checkCircleOutlined`
- `checkCircleTwotone`
- `checkOutlined`
- `checkSquareFilled`
- `checkSquareOutlined`
- `checkSquareTwotone`
- `chromeFilled`
- `chromeOutlined`
- `ciCircleFilled`
- `ciCircleOutlined`
- `ciCircleTwotone`
- `ciOutlined`
- `ciTwotone`
- `clearOutlined`
- `clockCircleFilled`
- `clockCircleOutlined`
- `clockCircleTwotone`
- `closeCircleFilled`
- `closeCircleOutlined`
- `closeCircleTwotone`
- `closeOutlined`
- `closeSquareFilled`
- `closeSquareOutlined`
- `closeSquareTwotone`
- `cloudDownloadOutlined`
- `cloudFilled`
- `cloudOutlined`
- `cloudServerOutlined`
- `cloudSyncOutlined`
- `cloudTwotone`
- `cloudUploadOutlined`
- `clusterOutlined`
- `codeFilled`
- `codeOutlined`
- `codeSandboxCircleFilled`
- `codeSandboxOutlined`
- `codeSandboxSquareFilled`
- `codeTwotone`
- `codepenCircleFilled`
- `codepenCircleOutlined`
- `codepenOutlined`
- `codepenSquareFilled`
- `coffeeOutlined`
- `columnHeightOutlined`
- `columnWidthOutlined`
- `commentOutlined`
- `compassFilled`
- `compassOutlined`
- `compassTwotone`
- `compressOutlined`
- `consoleSqlOutlined`
- `contactsFilled`
- `contactsOutlined`
- `contactsTwotone`
- `containerFilled`
- `containerOutlined`
- `containerTwotone`
- `controlFilled`
- `controlOutlined`
- `controlTwotone`
- `copyFilled`
- `copyOutlined`
- `copyTwotone`
- `copyrightCircleFilled`
- `copyrightCircleOutlined`
- `copyrightCircleTwotone`
- `copyrightOutlined`
- `copyrightTwotone`
- `creditCardFilled`
- `creditCardOutlined`
- `creditCardTwotone`
- `crownFilled`
- `crownOutlined`
- `crownTwotone`
- `customerServiceFilled`
- `customerServiceOutlined`
- `customerServiceTwotone`
- `dashOutlined`
- `dashboardFilled`
- `dashboardOutlined`
- `dashboardTwotone`
- `databaseFilled`
- `databaseOutlined`
- `databaseTwotone`
- `deleteColumnOutlined`
- `deleteFilled`
- `deleteOutlined`
- `deleteRowOutlined`
- `deleteTwotone`
- `deliveredProcedureOutlined`
- `deploymentUnitOutlined`
- `desktopOutlined`
- `diffFilled`
- `diffOutlined`
- `diffTwotone`
- `dingdingOutlined`
- `dingtalkCircleFilled`
- `dingtalkOutlined`
- `dingtalkSquareFilled`
- `disconnectOutlined`
- `discordFilled`
- `discordOutlined`
- `dislikeFilled`
- `dislikeOutlined`
- `dislikeTwotone`
- `dockerOutlined`
- `dollarCircleFilled`
- `dollarCircleOutlined`
- `dollarCircleTwotone`
- `dollarOutlined`
- `dollarTwotone`
- `dotChartOutlined`
- `dotNetOutlined`
- `doubleLeftOutlined`
- `doubleRightOutlined`
- `downCircleFilled`
- `downCircleOutlined`
- `downCircleTwotone`
- `downOutlined`
- `downSquareFilled`
- `downSquareOutlined`
- `downSquareTwotone`
- `downloadOutlined`
- `dragOutlined`
- `dribbbleCircleFilled`
- `dribbbleOutlined`
- `dribbbleSquareFilled`
- `dribbbleSquareOutlined`
- `dropboxCircleFilled`
- `dropboxOutlined`
- `dropboxSquareFilled`
- `editFilled`
- `editOutlined`
- `editTwotone`
- `ellipsisOutlined`
- `enterOutlined`
- `environmentFilled`
- `environmentOutlined`
- `environmentTwotone`
- `euroCircleFilled`
- `euroCircleOutlined`
- `euroCircleTwotone`
- `euroOutlined`
- `euroTwotone`
- `exceptionOutlined`
- `exclamationCircleFilled`
- `exclamationCircleOutlined`
- `exclamationCircleTwotone`
- `exclamationOutlined`
- `expandAltOutlined`
- `expandOutlined`
- `experimentFilled`
- `experimentOutlined`
- `experimentTwotone`
- `exportOutlined`
- `eyeFilled`
- `eyeInvisibleFilled`
- `eyeInvisibleOutlined`
- `eyeInvisibleTwotone`
- `eyeOutlined`
- `eyeTwotone`
- `facebookFilled`
- `facebookOutlined`
- `fallOutlined`
- `fastBackwardFilled`
- `fastBackwardOutlined`
- `fastForwardFilled`
- `fastForwardOutlined`
- `fieldBinaryOutlined`
- `fieldNumberOutlined`
- `fieldStringOutlined`
- `fieldTimeOutlined`
- `fileAddFilled`
- `fileAddOutlined`
- `fileAddTwotone`
- `fileDoneOutlined`
- `fileExcelFilled`
- `fileExcelOutlined`
- `fileExcelTwotone`
- `fileExclamationFilled`
- `fileExclamationOutlined`
- `fileExclamationTwotone`
- `fileFilled`
- `fileGifOutlined`
- `fileImageFilled`
- `fileImageOutlined`
- `fileImageTwotone`
- `fileJpgOutlined`
- `fileMarkdownFilled`
- `fileMarkdownOutlined`
- `fileMarkdownTwotone`
- `fileOutlined`
- `filePdfFilled`
- `filePdfOutlined`
- `filePdfTwotone`
- `filePptFilled`
- `filePptOutlined`
- `filePptTwotone`
- `fileProtectOutlined`
- `fileSearchOutlined`
- `fileSyncOutlined`
- `fileTextFilled`
- `fileTextOutlined`
- `fileTextTwotone`
- `fileTwotone`
- `fileUnknownFilled`
- `fileUnknownOutlined`
- `fileUnknownTwotone`
- `fileWordFilled`
- `fileWordOutlined`
- `fileWordTwotone`
- `fileZipFilled`
- `fileZipOutlined`
- `fileZipTwotone`
- `filterFilled`
- `filterOutlined`
- `filterTwotone`
- `fireFilled`
- `fireOutlined`
- `fireTwotone`
- `flagFilled`
- `flagOutlined`
- `flagTwotone`
- `folderAddFilled`
- `folderAddOutlined`
- `folderAddTwotone`
- `folderFilled`
- `folderOpenFilled`
- `folderOpenOutlined`
- `folderOpenTwotone`
- `folderOutlined`
- `folderTwotone`
- `folderViewOutlined`
- `fontColorsOutlined`
- `fontSizeOutlined`
- `forkOutlined`
- `formOutlined`
- `formatPainterFilled`
- `formatPainterOutlined`
- `forwardFilled`
- `forwardOutlined`
- `frownFilled`
- `frownOutlined`
- `frownTwotone`
- `fullscreenExitOutlined`
- `fullscreenOutlined`
- `functionOutlined`
- `fundFilled`
- `fundOutlined`
- `fundProjectionScreenOutlined`
- `fundTwotone`
- `fundViewOutlined`
- `funnelPlotFilled`
- `funnelPlotOutlined`
- `funnelPlotTwotone`
- `gatewayOutlined`
- `gifOutlined`
- `giftFilled`
- `giftOutlined`
- `giftTwotone`
- `githubFilled`
- `githubOutlined`
- `gitlabFilled`
- `gitlabOutlined`
- `globalOutlined`
- `goldFilled`
- `goldOutlined`
- `goldTwotone`
- `goldenFilled`
- `googleCircleFilled`
- `googleOutlined`
- `googlePlusCircleFilled`
- `googlePlusOutlined`
- `googlePlusSquareFilled`
- `googleSquareFilled`
- `groupOutlined`
- `harmonyOSOutlined`
- `hddFilled`
- `hddOutlined`
- `hddTwotone`
- `heartFilled`
- `heartOutlined`
- `heartTwotone`
- `heatMapOutlined`
- `highlightFilled`
- `highlightOutlined`
- `highlightTwotone`
- `historyOutlined`
- `holderOutlined`
- `homeFilled`
- `homeOutlined`
- `homeTwotone`
- `hourglassFilled`
- `hourglassOutlined`
- `hourglassTwotone`
- `html5Filled`
- `html5Outlined`
- `html5Twotone`
- `idcardFilled`
- `idcardOutlined`
- `idcardTwotone`
- `ieCircleFilled`
- `ieOutlined`
- `ieSquareFilled`
- `importOutlined`
- `inboxOutlined`
- `infoCircleFilled`
- `infoCircleOutlined`
- `infoCircleTwotone`
- `infoOutlined`
- `insertRowAboveOutlined`
- `insertRowBelowOutlined`
- `insertRowLeftOutlined`
- `insertRowRightOutlined`
- `instagramFilled`
- `instagramOutlined`
- `insuranceFilled`
- `insuranceOutlined`
- `insuranceTwotone`
- `interactionFilled`
- `interactionOutlined`
- `interactionTwotone`
- `issuesCloseOutlined`
- `italicOutlined`
- `javaOutlined`
- `javaScriptOutlined`
- `keyOutlined`
- `kubernetesOutlined`
- `laptopOutlined`
- `layoutFilled`
- `layoutOutlined`
- `layoutTwotone`
- `leftCircleFilled`
- `leftCircleOutlined`
- `leftCircleTwotone`
- `leftOutlined`
- `leftSquareFilled`
- `leftSquareOutlined`
- `leftSquareTwotone`
- `likeFilled`
- `likeOutlined`
- `likeTwotone`
- `lineChartOutlined`
- `lineHeightOutlined`
- `lineOutlined`
- `linkOutlined`
- `linkedinFilled`
- `linkedinOutlined`
- `linuxOutlined`
- `loading3QuartersOutlined`
- `loadingOutlined`
- `lockFilled`
- `lockOutlined`
- `lockTwotone`
- `loginOutlined`
- `logoutOutlined`
- `macCommandFilled`
- `macCommandOutlined`
- `mailFilled`
- `mailOutlined`
- `mailTwotone`
- `manOutlined`
- `medicineBoxFilled`
- `medicineBoxOutlined`
- `medicineBoxTwotone`
- `mediumCircleFilled`
- `mediumOutlined`
- `mediumSquareFilled`
- `mediumWorkmarkOutlined`
- `mehFilled`
- `mehOutlined`
- `mehTwotone`
- `menuFoldOutlined`
- `menuOutlined`
- `menuUnfoldOutlined`
- `mergeCellsOutlined`
- `mergeFilled`
- `mergeOutlined`
- `messageFilled`
- `messageOutlined`
- `messageTwotone`
- `minusCircleFilled`
- `minusCircleOutlined`
- `minusCircleTwotone`
- `minusOutlined`
- `minusSquareFilled`
- `minusSquareOutlined`
- `minusSquareTwotone`
- `mobileFilled`
- `mobileOutlined`
- `mobileTwotone`
- `moneyCollectFilled`
- `moneyCollectOutlined`
- `moneyCollectTwotone`
- `monitorOutlined`
- `moonFilled`
- `moonOutlined`
- `moreOutlined`
- `mutedFilled`
- `mutedOutlined`
- `nodeCollapseOutlined`
- `nodeExpandOutlined`
- `nodeIndexOutlined`
- `notificationFilled`
- `notificationOutlined`
- `notificationTwotone`
- `numberOutlined`
- `oneToOneOutlined`
- `openAIFilled`
- `openAIOutlined`
- `orderedListOutlined`
- `paperClipOutlined`
- `partitionOutlined`
- `pauseCircleFilled`
- `pauseCircleOutlined`
- `pauseCircleTwotone`
- `pauseOutlined`
- `payCircleFilled`
- `payCircleOutlined`
- `percentageOutlined`
- `phoneFilled`
- `phoneOutlined`
- `phoneTwotone`
- `picCenterOutlined`
- `picLeftOutlined`
- `picRightOutlined`
- `pictureFilled`
- `pictureOutlined`
- `pictureTwotone`
- `pieChartFilled`
- `pieChartOutlined`
- `pieChartTwotone`
- `pinterestFilled`
- `pinterestOutlined`
- `playCircleFilled`
- `playCircleOutlined`
- `playCircleTwotone`
- `playSquareFilled`
- `playSquareOutlined`
- `playSquareTwotone`
- `plusCircleFilled`
- `plusCircleOutlined`
- `plusCircleTwotone`
- `plusOutlined`
- `plusSquareFilled`
- `plusSquareOutlined`
- `plusSquareTwotone`
- `poundCircleFilled`
- `poundCircleOutlined`
- `poundCircleTwotone`
- `poundOutlined`
- `poweroffOutlined`
- `printerFilled`
- `printerOutlined`
- `printerTwotone`
- `productFilled`
- `productOutlined`
- `profileFilled`
- `profileOutlined`
- `profileTwotone`
- `projectFilled`
- `projectOutlined`
- `projectTwotone`
- `propertySafetyFilled`
- `propertySafetyOutlined`
- `propertySafetyTwotone`
- `pullRequestOutlined`
- `pushpinFilled`
- `pushpinOutlined`
- `pushpinTwotone`
- `pythonOutlined`
- `qqCircleFilled`
- `qqOutlined`
- `qqSquareFilled`
- `qrcodeOutlined`
- `questionCircleFilled`
- `questionCircleOutlined`
- `questionCircleTwotone`
- `questionOutlined`
- `radarChartOutlined`
- `radiusBottomleftOutlined`
- `radiusBottomrightOutlined`
- `radiusSettingOutlined`
- `radiusUpleftOutlined`
- `radiusUprightOutlined`
- `readFilled`
- `readOutlined`
- `reconciliationFilled`
- `reconciliationOutlined`
- `reconciliationTwotone`
- `redEnvelopeFilled`
- `redEnvelopeOutlined`
- `redEnvelopeTwotone`
- `redditCircleFilled`
- `redditOutlined`
- `redditSquareFilled`
- `redoOutlined`
- `reloadOutlined`
- `restFilled`
- `restOutlined`
- `restTwotone`
- `retweetOutlined`
- `rightCircleFilled`
- `rightCircleOutlined`
- `rightCircleTwotone`
- `rightOutlined`
- `rightSquareFilled`
- `rightSquareOutlined`
- `rightSquareTwotone`
- `riseOutlined`
- `robotFilled`
- `robotOutlined`
- `rocketFilled`
- `rocketOutlined`
- `rocketTwotone`
- `rollbackOutlined`
- `rotateLeftOutlined`
- `rotateRightOutlined`
- `rubyOutlined`
- `safetyCertificateFilled`
- `safetyCertificateOutlined`
- `safetyCertificateTwotone`
- `safetyOutlined`
- `saveFilled`
- `saveOutlined`
- `saveTwotone`
- `scanOutlined`
- `scheduleFilled`
- `scheduleOutlined`
- `scheduleTwotone`
- `scissorOutlined`
- `searchOutlined`
- `securityScanFilled`
- `securityScanOutlined`
- `securityScanTwotone`
- `selectOutlined`
- `sendOutlined`
- `settingFilled`
- `settingOutlined`
- `settingTwotone`
- `shakeOutlined`
- `shareAltOutlined`
- `shopFilled`
- `shopOutlined`
- `shopTwotone`
- `shoppingCartOutlined`
- `shoppingFilled`
- `shoppingOutlined`
- `shoppingTwotone`
- `shrinkOutlined`
- `signalFilled`
- `signatureFilled`
- `signatureOutlined`
- `sisternodeOutlined`
- `sketchCircleFilled`
- `sketchOutlined`
- `sketchSquareFilled`
- `skinFilled`
- `skinOutlined`
- `skinTwotone`
- `skypeFilled`
- `skypeOutlined`
- `slackCircleFilled`
- `slackOutlined`
- `slackSquareFilled`
- `slackSquareOutlined`
- `slidersFilled`
- `slidersOutlined`
- `slidersTwotone`
- `smallDashOutlined`
- `smileFilled`
- `smileOutlined`
- `smileTwotone`
- `snippetsFilled`
- `snippetsOutlined`
- `snippetsTwotone`
- `solutionOutlined`
- `sortAscendingOutlined`
- `sortDescendingOutlined`
- `soundFilled`
- `soundOutlined`
- `soundTwotone`
- `splitCellsOutlined`
- `spotifyFilled`
- `spotifyOutlined`
- `starFilled`
- `starOutlined`
- `starTwotone`
- `stepBackwardFilled`
- `stepBackwardOutlined`
- `stepForwardFilled`
- `stepForwardOutlined`
- `stockOutlined`
- `stopFilled`
- `stopOutlined`
- `stopTwotone`
- `strikethroughOutlined`
- `subnodeOutlined`
- `sunFilled`
- `sunOutlined`
- `swapLeftOutlined`
- `swapOutlined`
- `swapRightOutlined`
- `switcherFilled`
- `switcherOutlined`
- `switcherTwotone`
- `syncOutlined`
- `tableOutlined`
- `tabletFilled`
- `tabletOutlined`
- `tabletTwotone`
- `tagFilled`
- `tagOutlined`
- `tagTwotone`
- `tagsFilled`
- `tagsOutlined`
- `tagsTwotone`
- `taobaoCircleFilled`
- `taobaoCircleOutlined`
- `taobaoOutlined`
- `taobaoSquareFilled`
- `teamOutlined`
- `thunderboltFilled`
- `thunderboltOutlined`
- `thunderboltTwotone`
- `tikTokFilled`
- `tikTokOutlined`
- `toTopOutlined`
- `toolFilled`
- `toolOutlined`
- `toolTwotone`
- `trademarkCircleFilled`
- `trademarkCircleOutlined`
- `trademarkCircleTwotone`
- `trademarkOutlined`
- `transactionOutlined`
- `translationOutlined`
- `trophyFilled`
- `trophyOutlined`
- `trophyTwotone`
- `truckFilled`
- `truckOutlined`
- `twitchOutlined`
- `twitterCircleFilled`
- `twitterOutlined`
- `twitterSquareFilled`
- `underlineOutlined`
- `undoOutlined`
- `ungroupOutlined`
- `unlockFilled`
- `unlockOutlined`
- `unlockTwotone`
- `unorderedListOutlined`
- `upCircleFilled`
- `upCircleOutlined`
- `upCircleTwotone`
- `upOutlined`
- `upSquareFilled`
- `upSquareOutlined`
- `upSquareTwotone`
- `uploadOutlined`
- `usbFilled`
- `usbOutlined`
- `usbTwotone`
- `userAddOutlined`
- `userDeleteOutlined`
- `userOutlined`
- `userSwitchOutlined`
- `usergroupAddOutlined`
- `usergroupDeleteOutlined`
- `verifiedOutlined`
- `verticalAlignBottomOutlined`
- `verticalAlignMiddleOutlined`
- `verticalAlignTopOutlined`
- `verticalLeftOutlined`
- `verticalRightOutlined`
- `videoCameraAddOutlined`
- `videoCameraFilled`
- `videoCameraOutlined`
- `videoCameraTwotone`
- `walletFilled`
- `walletOutlined`
- `walletTwotone`
- `warningFilled`
- `warningOutlined`
- `warningTwotone`
- `wechatFilled`
- `wechatOutlined`
- `wechatWorkFilled`
- `wechatWorkOutlined`
- `weiboCircleFilled`
- `weiboCircleOutlined`
- `weiboOutlined`
- `weiboSquareFilled`
- `weiboSquareOutlined`
- `whatsAppOutlined`
- `wifiOutlined`
- `windowsFilled`
- `windowsOutlined`
- `womanOutlined`
- `xFilled`
- `xOutlined`
- `yahooFilled`
- `yahooOutlined`
- `youtubeFilled`
- `youtubeOutlined`
- `yuqueFilled`
- `yuqueOutlined`
- `zhihuCircleFilled`
- `zhihuOutlined`
- `zhihuSquareFilled`
- `zoomInOutlined`
- `zoomOutOutlined`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccountBookFilledIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccountBookOutlinedIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccountBookTwotoneIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AimOutlinedIcon size="20" class="nav-icon" /> Settings</a>
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
<AccountBookFilledIcon
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
    <AccountBookFilledIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccountBookOutlinedIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccountBookTwotoneIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccountBookFilledIcon size="24" />
   <AccountBookOutlinedIcon size="24" color="#4a90e2" />
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
   <AccountBookFilledIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccountBookFilledIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccountBookFilledIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accountBookFilled } from '@stacksjs/iconify-ant-design'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accountBookFilled, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accountBookFilled } from '@stacksjs/iconify-ant-design'

// Icons are typed as IconData
const myIcon: IconData = accountBookFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: HeskeyBaozi ([Website](https://github.com/ant-design/ant-design-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ant-design/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ant-design/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
