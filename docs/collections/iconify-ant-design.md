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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccountBookFilledIcon, AccountBookOutlinedIcon, AccountBookTwotoneIcon } from '@stacksjs/iconify-ant-design'

// Basic usage
const icon = AccountBookFilledIcon()

// With size
const sizedIcon = AccountBookFilledIcon({ size: 24 })

// With color
const coloredIcon = AccountBookOutlinedIcon({ color: 'red' })

// With multiple props
const customIcon = AccountBookTwotoneIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccountBookFilledIcon, AccountBookOutlinedIcon, AccountBookTwotoneIcon } from '@stacksjs/iconify-ant-design'

  global.icons = {
    home: AccountBookFilledIcon({ size: 24 }),
    user: AccountBookOutlinedIcon({ size: 24, color: '#4a90e2' }),
    settings: AccountBookTwotoneIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AccountBookFilledIcon({ color: 'red' })
const blueIcon = AccountBookFilledIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccountBookFilledIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccountBookFilledIcon({ class: 'text-primary' })
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
const icon24 = AccountBookFilledIcon({ size: 24 })
const icon1em = AccountBookFilledIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccountBookFilledIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccountBookFilledIcon({ height: '1em' })
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
const smallIcon = AccountBookFilledIcon({ class: 'icon-small' })
const largeIcon = AccountBookFilledIcon({ class: 'icon-large' })
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
@js
  import { AccountBookFilledIcon, AccountBookOutlinedIcon, AccountBookTwotoneIcon, AimOutlinedIcon } from '@stacksjs/iconify-ant-design'

  global.navIcons = {
    home: AccountBookFilledIcon({ size: 20, class: 'nav-icon' }),
    about: AccountBookOutlinedIcon({ size: 20, class: 'nav-icon' }),
    contact: AccountBookTwotoneIcon({ size: 20, class: 'nav-icon' }),
    settings: AimOutlinedIcon({ size: 20, class: 'nav-icon' })
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
import { AccountBookFilledIcon } from '@stacksjs/iconify-ant-design'

const icon = AccountBookFilledIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccountBookFilledIcon, AccountBookOutlinedIcon, AccountBookTwotoneIcon } from '@stacksjs/iconify-ant-design'

const successIcon = AccountBookFilledIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccountBookOutlinedIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccountBookTwotoneIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccountBookFilledIcon, AccountBookOutlinedIcon } from '@stacksjs/iconify-ant-design'
   const icon = AccountBookFilledIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accountBookFilled, accountBookOutlined } from '@stacksjs/iconify-ant-design'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accountBookFilled, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccountBookFilledIcon, AccountBookOutlinedIcon } from '@stacksjs/iconify-ant-design'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ant-design'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccountBookFilledIcon } from '@stacksjs/iconify-ant-design'
     global.icon = AccountBookFilledIcon({ size: 24 })
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
   const icon = AccountBookFilledIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
