# Fluent UI MDL2

> Fluent UI MDL2 icons for stx from Iconify

## Overview

This package provides access to 1735 icons from the Fluent UI MDL2 collection through the stx iconify integration.

**Collection ID:** `fluent-mdl2`
**Total Icons:** 1735
**Author:** Microsoft Corporation ([Website](https://github.com/microsoft/fluentui/tree/master/packages/react-icons-mdl2))
**License:** MIT ([Details](https://github.com/microsoft/fluentui/blob/master/packages/react-icons-mdl2/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fluent-mdl2
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AcceptIcon height="1em" />
<AcceptIcon width="1em" height="1em" />
<AcceptIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AcceptIcon size="24" />
<AcceptIcon size="1em" />

<!-- Using width and height -->
<AcceptIcon width="24" height="32" />

<!-- With color -->
<AcceptIcon size="24" color="red" />
<AcceptIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AcceptIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AcceptIcon
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
    <AcceptIcon size="24" />
    <AcceptMediumIcon size="24" color="#4a90e2" />
    <AccessLogoIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accept, acceptMedium, accessLogo } from '@stacksjs/iconify-fluent-mdl2'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accept, { size: 24 })
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
<AcceptIcon size="24" color="red" />
<AcceptIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AcceptIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AcceptIcon size="24" class="text-primary" />
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
<AcceptIcon height="1em" />
<AcceptIcon width="1em" height="1em" />
<AcceptIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AcceptIcon size="24" />
<AcceptIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fluentMdl2-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AcceptIcon class="fluentMdl2-icon" />
```

## Available Icons

This package contains **1735** icons:

- `accept`
- `acceptMedium`
- `accessLogo`
- `accessibiltyChecker`
- `accountActivity`
- `accountBrowser`
- `accountManagement`
- `accounts`
- `actionCenter`
- `activateOrders`
- `activityFeed`
- `add`
- `addBookmark`
- `addEvent`
- `addFavorite`
- `addFavoriteFill`
- `addFriend`
- `addGroup`
- `addHome`
- `addIn`
- `addLink`
- `addNotes`
- `addOnlineMeeting`
- `addPhone`
- `addReaction`
- `addSpaceAfter`
- `addSpaceBefore`
- `addTo`
- `addToShoppingList`
- `addWork`
- `airTickets`
- `airplane`
- `airplaneSolid`
- `alarmClock`
- `album`
- `albumRemove`
- `alertSettings`
- `alertSolid`
- `alignCenter`
- `alignHorizontalCenter`
- `alignHorizontalLeft`
- `alignHorizontalRight`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `alignVerticalBottom`
- `alignVerticalCenter`
- `alignVerticalTop`
- `allApps`
- `allAppsMirrored`
- `allCurrency`
- `altText`
- `amazonWebServicesLogo`
- `analyticsQuery`
- `analyticsReport`
- `analyticsView`
- `anchorLock`
- `androidLogo`
- `annotation`
- `apacheIvyLogo32`
- `apacheMavenLogo`
- `archive`
- `archiveUndo`
- `areaChart`
- `arrangeBringForward`
- `arrangeBringToFront`
- `arrangeByFrom`
- `arrangeSendBackward`
- `arrangeSendToBack`
- `arrivals`
- `arrowDownRight8`
- `arrowDownRightMirrored8`
- `arrowTallDownLeft`
- `arrowTallDownRight`
- `arrowTallUpLeft`
- `arrowTallUpRight`
- `arrowUpRight`
- `arrowUpRight8`
- `arrowUpRightMirrored8`
- `articles`
- `ascending`
- `aspectRatio`
- `assessmentGroup`
- `assessmentGroupTemplate`
- `assetLibrary`
- `assign`
- `assignPolicy`
- `asterisk`
- `asteriskSolid`
- `attach`
- `australianRules`
- `autoDeploySettings`
- `autoEnhanceOff`
- `autoEnhanceOn`
- `autoFillTemplate`
- `autoFitContents`
- `autoFitWindow`
- `autoHeight`
- `autoRacing`
- `automateFlow`
- `awayStatus`
- `bIDashboard`
- `back`
- `backToWindow`
- `backgroundColor`
- `backlog`
- `backlogBoard`
- `backlogList`
- `badge`
- `balloons`
- `bank`
- `bankSolid`
- `barChart4`
- `barChartHorizontal`
- `barChartVertical`
- `barChartVerticalEdit`
- `barChartVerticalFill`
- `barChartVerticalFilter`
- `barChartVerticalFilterSolid`
- `baseball`
- `beerMug`
- `bidiLtr`
- `bidiRtl`
- `birthdayCake`
- `bitbucketLogo32`
- `blobStorage`
- `blockContact`
- `blocked`
- `blocked12`
- `blocked2`
- `blocked2Solid`
- `blockedSite`
- `blockedSiteSolid12`
- `blockedSolid`
- `blog`
- `blowingSnow`
- `blur`
- `boards`
- `bold`
- `bookAnswers`
- `bookmarkReport`
- `bookmarks`
- `bookmarksMirrored`
- `borderDash`
- `borderDot`
- `boxAdditionSolid`
- `boxCheckmarkSolid`
- `boxLogo`
- `boxMultiplySolid`
- `boxPlaySolid`
- `boxSubtractSolid`
- `branchCommit`
- `branchCompare`
- `branchFork`
- `branchFork2`
- `branchLocked`
- `branchMerge`
- `branchPullRequest`
- `branchSearch`
- `branchShelveset`
- `breadcrumb`
- `breakfast`
- `brightness`
- `broom`
- `browserScreenShot`
- `browserTab`
- `browserTabScreenshot`
- `brunch`
- `brush`
- `bucketColor`
- `bucketColorFill`
- `bufferTimeAfter`
- `bufferTimeBefore`
- `bufferTimeBoth`
- `bug`
- `bugBlock`
- `bugSolid`
- `bugSync`
- `build`
- `buildDefinition`
- `buildIssue`
- `buildQueue`
- `buildQueueNew`
- `bulkUpload`
- `bulletedList`
- `bulletedList2`
- `bulletedList2Mirrored`
- `bulletedListBullet`
- `bulletedListBulletMirrored`
- `bulletedListMirrored`
- `bulletedListText`
- `bulletedListTextMirrored`
- `bulletedTreeList`
- `bullseye`
- `bullseyeTarget`
- `bullseyeTargetEdit`
- `bus`
- `busSolid`
- `businessHoursSign`
- `buttonControl`
- `cPlusPlus`
- `cPlusPlusLanguage`
- `cRMProcesses`
- `cRMReport`
- `cRMServices`
- `cSS`
- `cafe`
- `cake`
- `calculator`
- `calculatorAddition`
- `calculatorDelta`
- `calculatorEqualTo`
- `calculatorGroup`
- `calculatorMultiply`
- `calculatorNotEqualTo`
- `calculatorPercentage`
- `calculatorSubtract`
- `calendar`
- `calendarAgenda`
- `calendarDay`
- `calendarMirrored`
- `calendarReply`
- `calendarSettings`
- `calendarSettingsMirrored`
- `calendarWeek`
- `calendarWorkWeek`
- `calendarYear`
- `calories`
- `caloriesAdd`
- `camera`
- `campaignTemplate`
- `cancel`
- `cannedChat`
- `car`
- `caretBottomLeftCenter8`
- `caretBottomLeftSolid8`
- `caretBottomRightCenter8`
- `caretBottomRightSolid8`
- `caretDown8`
- `caretDownSolid8`
- `caretHollow`
- `caretHollowMirrored`
- `caretLeft8`
- `caretLeftSolid8`
- `caretRight`
- `caretRight8`
- `caretRightSolid8`
- `caretSolid`
- `caretSolid16`
- `caretSolidDown`
- `caretSolidLeft`
- `caretSolidMirrored`
- `caretSolidRight`
- `caretSolidUp`
- `caretTopLeftCenter8`
- `caretTopLeftSolid8`
- `caretTopRightCenter8`
- `caretTopRightSolid8`
- `caretUp8`
- `caretUpSolid8`
- `cat`
- `cellPhone`
- `certificate`
- `certifiedDatabase`
- `changeEntitlements`
- `chart`
- `chartSeries`
- `chartTemplate`
- `chartXAngle`
- `chartYAngle`
- `chat`
- `chatBot`
- `chatInviteFriend`
- `chatSolid`
- `checkList`
- `checkListCheck`
- `checkListCheckMirrored`
- `checkListText`
- `checkListTextMirrored`
- `checkMark`
- `checkbox`
- `checkboxComposite`
- `checkboxCompositeReversed`
- `checkboxFill`
- `checkboxIndeterminate`
- `checkedOutByOther12`
- `checkedOutByYou12`
- `chevronDown`
- `chevronDownEnd6`
- `chevronDownMed`
- `chevronDownSmall`
- `chevronFold10`
- `chevronLeft`
- `chevronLeftEnd6`
- `chevronLeftMed`
- `chevronLeftSmall`
- `chevronRight`
- `chevronRightEnd6`
- `chevronRightMed`
- `chevronRightSmall`
- `chevronUnfold10`
- `chevronUp`
- `chevronUpEnd6`
- `chevronUpMed`
- `chevronUpSmall`
- `childof`
- `chopsticks`
- `chromeBack`
- `chromeBackMirrored`
- `chromeClose`
- `chromeFullScreen`
- `chromeMinimize`
- `chromeRestore`
- `chronosLogo`
- `circleAddition`
- `circleAdditionSolid`
- `circleFill`
- `circleHalfFull`
- `circlePause`
- `circlePauseSolid`
- `circlePlus`
- `circleRing`
- `circleShape`
- `circleShapeSolid`
- `circleStop`
- `circleStopSolid`
- `cityNext`
- `cityNext2`
- `clear`
- `clearFilter`
- `clearFormatting`
- `clearFormattingA`
- `clearFormattingEraser`
- `clearNight`
- `clearSelection`
- `clearSelectionMirrored`
- `clipboardList`
- `clipboardListMirrored`
- `clipboardSolid`
- `clock`
- `cloneToDesktop`
- `closePane`
- `closePaneMirrored`
- `closedCaption`
- `cloudWeather`
- `cloudy`
- `cocktails`
- `code`
- `codeEdit`
- `coffee`
- `coffeeScript`
- `collapseContent`
- `collapseContentSingle`
- `collapseMenu`
- `collegeFootball`
- `collegeHoops`
- `color`
- `colorSolid`
- `column`
- `columnLeftTwoThirds`
- `columnLeftTwoThirdsEdit`
- `columnOptions`
- `columnRightTwoThirds`
- `columnRightTwoThirdsEdit`
- `columnVerticalSection`
- `columnVerticalSectionEdit`
- `combine`
- `combobox`
- `commandPrompt`
- `comment`
- `commentActive`
- `commentAdd`
- `commentNext`
- `commentPrevious`
- `commentSolid`
- `commentUrgent`
- `commitments`
- `commonDataServiceCDS`
- `communications`
- `companyDirectory`
- `companyDirectoryMirrored`
- `compare`
- `compareUneven`
- `compassNW`
- `completed`
- `completedSolid`
- `complianceAudit`
- `configurationSolid`
- `connectContacts`
- `connectVirtualMachine`
- `constructionCone`
- `constructionConeSolid`
- `contact`
- `contactCard`
- `contactCardSettings`
- `contactCardSettingsMirrored`
- `contactHeart`
- `contactInfo`
- `contactLink`
- `contactList`
- `contactLock`
- `contentFeed`
- `contentSettings`
- `contextMenu`
- `contrast`
- `copy`
- `copyEdit`
- `cotton`
- `coupon`
- `createMailRule`
- `cricket`
- `crop`
- `crown`
- `crownSolid`
- `cubeShape`
- `cubeShapeSolid`
- `currency`
- `customList`
- `customListMirrored`
- `customizeToolbar`
- `cut`
- `cycling`
- `dOM`
- `dRM`
- `dashboardAdd`
- `dataConnectionLibrary`
- `dataManagementSettings`
- `database`
- `databaseSync`
- `databaseView`
- `dataflows`
- `dataflowsLink`
- `dateTime`
- `dateTime12`
- `dateTime2`
- `dateTimeMirrored`
- `deactivateOrders`
- `decimals`
- `decisionSolid`
- `declineCall`
- `decreaseIndent`
- `decreaseIndentArrow`
- `decreaseIndentArrowMirrored`
- `decreaseIndentLegacy`
- `decreaseIndentMirrored`
- `decreaseIndentText`
- `decreaseIndentTextMirrored`
- `defaultRatio`
- `defectSolid`
- `delete`
- `deleteColumns`
- `deleteRows`
- `deleteRowsMirrored`
- `deleteTable`
- `deliveryTruck`
- `dependencyAdd`
- `dependencyRemove`
- `deploy`
- `descending`
- `design`
- `desktopScreenshot`
- `developerTools`
- `deviceBug`
- `deviceOff`
- `deviceRun`
- `devices2`
- `devices3`
- `devices4`
- `diagnostic`
- `diagnosticDataBarTooltip`
- `dialpad`
- `diamond`
- `diamondSolid`
- `dictionary`
- `dictionaryRemove`
- `dietPlanNotebook`
- `diffInline`
- `diffSideBySide`
- `disableUpdates`
- `disconnectVirtualMachine`
- `dislike`
- `dislikeSolid`
- `distributeDown`
- `docLibrary`
- `dockLeft`
- `dockLeftMirrored`
- `dockRight`
- `dockerLogo`
- `document`
- `documentApproval`
- `documentManagement`
- `documentReply`
- `documentSearch`
- `documentSet`
- `documentation`
- `donutChart`
- `door`
- `doubleBookmark`
- `doubleChevronDown`
- `doubleChevronDown12`
- `doubleChevronDown8`
- `doubleChevronLeft`
- `doubleChevronLeft12`
- `doubleChevronLeft8`
- `doubleChevronLeftMed`
- `doubleChevronLeftMedMirrored`
- `doubleChevronRight`
- `doubleChevronRight12`
- `doubleChevronRight8`
- `doubleChevronUp`
- `doubleChevronUp12`
- `doubleChevronUp8`
- `doubleColumn`
- `doubleColumnEdit`
- `doubleDownArrow`
- `down`
- `download`
- `downloadDocument`
- `dragObject`
- `drillDown`
- `drillDownSolid`
- `drillExpand`
- `drillShow`
- `drillThrough`
- `driverOff`
- `drop`
- `dropShape`
- `dropShapeSolid`
- `dropboxLogo`
- `dropdown`
- `duplicateRow`
- `duststorm`
- `eDiscovery`
- `eMI`
- `eatDrink`
- `edit`
- `editContact`
- `editCreate`
- `editMail`
- `editMirrored`
- `editNote`
- `editPhoto`
- `editSolid12`
- `editSolidMirrored12`
- `editStyle`
- `education`
- `egnyteLogo`
- `ellipse`
- `embed`
- `emoji`
- `emoji2`
- `emojiDisappointed`
- `emojiNeutral`
- `emojiTabSymbols`
- `emptyRecycleBin`
- `encryption`
- `endPointSolid`
- `engineeringGroup`
- `entitlementPolicy`
- `entitlementRedemption`
- `entryDecline`
- `entryView`
- `equalizer`
- `eraseTool`
- `error`
- `errorBadge`
- `event`
- `event12`
- `eventAccepted`
- `eventDate`
- `eventDateMissed12`
- `eventDeclined`
- `eventInfo`
- `eventTentative`
- `eventTentativeMirrored`
- `eventToDoLogo`
- `exerciseTracker`
- `expandMenu`
- `exploreContent`
- `exploreContentSingle`
- `exploreData`
- `export`
- `exportMirrored`
- `externalBuild`
- `externalGit`
- `externalTFVC`
- `externalXAML`
- `eyeShadow`
- `eyedropper`
- `f12DevTools`
- `facebookLogo`
- `family`
- `fangBody`
- `fastForward`
- `fastForwardEightX`
- `fastForwardFourX`
- `fastForwardOneFiveX`
- `fastForwardOneX`
- `fastForwardPointFiveX`
- `fastForwardTwoX`
- `fastMode`
- `favicon`
- `favoriteList`
- `favoriteStar`
- `favoriteStarFill`
- `fax`
- `feedback`
- `feedbackRequestMirroredSolid`
- `feedbackRequestSolid`
- `feedbackResponseSolid`
- `ferry`
- `ferrySolid`
- `fieldChanged`
- `fieldEmpty`
- `fieldFilled`
- `fieldNotChanged`
- `fieldReadOnly`
- `fieldRequired`
- `fileASPX`
- `fileBug`
- `fileCSS`
- `fileCode`
- `fileComment`
- `fileHTML`
- `fileImage`
- `fileJAVA`
- `fileLess`
- `fileOff`
- `filePDB`
- `fileRequest`
- `fileSQL`
- `fileSass`
- `fileSymlink`
- `fileSystem`
- `fileTemplate`
- `fileYML`
- `filter`
- `filterAscending`
- `filterDescending`
- `filterSettings`
- `filterSolid`
- `filters`
- `filtersSolid`
- `financial`
- `financialMirroredSolid`
- `financialSolid`
- `fingerprint`
- `fitPage`
- `fitWidth`
- `fiveTileGrid`
- `fixedAssetManagement`
- `fixedColumnWidth`
- `flag`
- `flameSolid`
- `flashAuto`
- `flashOff`
- `flashlight`
- `flickDown`
- `flickLeft`
- `flickRight`
- `flickUp`
- `flow`
- `flowChart`
- `flower`
- `focalPoint`
- `focus`
- `focusView`
- `fog`
- `folder`
- `folderFill`
- `folderHorizontal`
- `folderList`
- `folderListMirrored`
- `folderOpen`
- `folderQuery`
- `folderSearch`
- `followUser`
- `font`
- `fontColor`
- `fontColorA`
- `fontColorSwatch`
- `fontDecrease`
- `fontIncrease`
- `fontSize`
- `fontSize2`
- `footer`
- `formLibrary`
- `formLibraryMirrored`
- `formatPainter`
- `forum`
- `forward`
- `forwardEvent`
- `freezing`
- `frigid`
- `frontCamera`
- `fullCircleMask`
- `fullHistory`
- `fullScreen`
- `fullView`
- `fullWidth`
- `fullWidthEdit`
- `functionalManagerDashboard`
- `funnelChart`
- `gIF`
- `gUID`
- `game`
- `gather`
- `generate`
- `genericScan`
- `genericScanFilled`
- `giftBoxSolid`
- `giftCard`
- `giftbox`
- `giftboxOpen`
- `gitFork`
- `gitGraph`
- `gitHubLogo`
- `gitLogo`
- `glasses`
- `glimmer`
- `globalNavButton`
- `globalNavButtonActive`
- `globe`
- `globe2`
- `globeFavorite`
- `go`
- `goMirrored`
- `goToDashboard`
- `golf`
- `googleDriveLogo`
- `googleDriveLogoBottomBlue`
- `googleDriveLogoLeftGreen`
- `googleDriveLogoRightYellow`
- `gotoToday`
- `gradleLogo32`
- `greetingCard`
- `gridViewLarge`
- `gridViewMedium`
- `gridViewSmall`
- `gripperBarHorizontal`
- `gripperBarVertical`
- `gripperDotsVertical`
- `gripperTool`
- `group`
- `groupList`
- `groupObject`
- `groupedAscending`
- `groupedDescending`
- `groupedList`
- `guitar`
- `hailDay`
- `hailNight`
- `halfAlpha`
- `halfCircle`
- `handsFree`
- `handwriting`
- `hardDrive`
- `hardDriveGroup`
- `hardDriveLock`
- `hardDriveUnlock`
- `header`
- `header1`
- `header2`
- `header3`
- `header4`
- `headset`
- `headsetSolid`
- `health`
- `healthRefresh`
- `healthSolid`
- `heart`
- `heartBroken`
- `heartFill`
- `help`
- `helpMirrored`
- `hexaditeInvestigation`
- `hexaditeInvestigationCancel`
- `hexaditeInvestigationSemiAuto`
- `hexagon`
- `hide`
- `hide2`
- `hide3`
- `highlight`
- `highlightMappedShapes`
- `hintText`
- `historicalWeather`
- `history`
- `home`
- `homeDropdown`
- `homeGroup`
- `homeSolid`
- `homeVerify`
- `horizontalDistributeCenter`
- `horizontalTabKey`
- `hospital`
- `hotel`
- `hourGlass`
- `iDBadge`
- `iOSAppStoreLogo`
- `iOT`
- `iRMForward`
- `iRMForwardMirrored`
- `iRMReply`
- `iRMReplyMirrored`
- `iconSetsFlag`
- `ignoreConversation`
- `imageCrosshair`
- `imageDiff`
- `imageInAR`
- `imagePixel`
- `imageSearch`
- `import`
- `importAllMirrored`
- `importMirrored`
- `important`
- `inbox`
- `inboxCheck`
- `incidentTriangle`
- `incomingCall`
- `increaseIndent`
- `increaseIndentArrow`
- `increaseIndentArrowMirrored`
- `increaseIndentHanging`
- `increaseIndentHangingMirrored`
- `increaseIndentLegacy`
- `increaseIndentMirrored`
- `increaseIndentText`
- `increaseIndentTextMirrored`
- `indentFirstLine`
- `info`
- `info2`
- `infoSolid`
- `informationBarriers`
- `inkingTool`
- `inputAddress`
- `insert`
- `insertColumnsLeft`
- `insertColumnsRight`
- `insertRowsAbove`
- `insertRowsBelow`
- `insertSignatureLine`
- `insertTextBox`
- `insights`
- `installToDrive`
- `installation`
- `internalInvestigation`
- `internetSharing`
- `issueSolid`
- `issueTracking`
- `issueTrackingMirrored`
- `italic`
- `jS`
- `javaLogo`
- `javaScriptLanguage`
- `jenkinsLogo`
- `joinOnlineMeeting`
- `keubernetesLogo`
- `keyPhraseExtraction`
- `keyboardClassic`
- `knowledgeArticle`
- `label`
- `ladybugSolid`
- `lamp`
- `landscapeOrientation`
- `laptopSecure`
- `laptopSelected`
- `largeGrid`
- `learningTools`
- `leave`
- `leaveUser`
- `library`
- `lifesaver`
- `lifesaverLock`
- `light`
- `lightWeight`
- `lightbulb`
- `lightningBolt`
- `lightningBoltSolid`
- `like`
- `likeSolid`
- `line`
- `lineChart`
- `lineSpacing`
- `lineStyle`
- `lineThickness`
- `link`
- `link12`
- `linkedDatabase`
- `linuxLogo32`
- `list`
- `listMirrored`
- `liveSite`
- `localeLanguage`
- `location`
- `locationCircle`
- `locationDot`
- `locationFill`
- `locationOutline`
- `lock`
- `lock12`
- `lockShare`
- `lockSolid`
- `logRemove`
- `lookupEntities`
- `lowerBrightness`
- `machineLearning`
- `mail`
- `mailAlert`
- `mailAttached`
- `mailCheck`
- `mailFill`
- `mailForward`
- `mailForwardMirrored`
- `mailLowImportance`
- `mailOptions`
- `mailPause`
- `mailReminder`
- `mailRepeat`
- `mailReply`
- `mailReplyAll`
- `mailReplyAllMirrored`
- `mailReplyMirrored`
- `mailSchedule`
- `mailSolid`
- `mailTentative`
- `mailTentativeMirrored`
- `mailUndelivered`
- `managerSelfService`
- `manufacturing`
- `mapDirections`
- `mapLayers`
- `mapPin`
- `mapPin12`
- `mapPinSolid`
- `markAsProtected`
- `markDownLanguage`
- `market`
- `marketDown`
- `masterDatabase`
- `maximumValue`
- `medal`
- `medalSolid`
- `media`
- `mediaAdd`
- `medical`
- `megaphone`
- `megaphoneSolid`
- `memo`
- `merge`
- `mergeDuplicate`
- `message`
- `messageFill`
- `messageFriendRequest`
- `micOff`
- `micOff2`
- `microphone`
- `miniContract`
- `miniContractMirrored`
- `miniExpand`
- `miniExpandMirrored`
- `miniLink`
- `minimumValue`
- `miracastLogoLarge`
- `mobileAngled`
- `mobileReport`
- `mobileSelected`
- `modelingView`
- `money`
- `more`
- `moreSports`
- `moreVertical`
- `mountainClimbing`
- `move`
- `moveToFolder`
- `movers`
- `multiSelect`
- `multiSelectMirrored`
- `musicInCollection`
- `musicInCollectionFill`
- `musicNote`
- `muteChat`
- `myMoviesTV`
- `myNetwork`
- `nPMLogo`
- `nav2DMapView`
- `navigateBack`
- `navigateBackMirrored`
- `navigateExternalInline`
- `navigateForward`
- `navigateForwardMirrored`
- `navigationFlipper`
- `networkTower`
- `newAnalyticsQuery`
- `newFolder`
- `newMail`
- `newTeamProject`
- `news`
- `newsSearch`
- `next`
- `nonprofitLogo32`
- `normalWeight`
- `notExecuted`
- `notImpactedSolid`
- `noteForward`
- `notePinned`
- `noteReply`
- `number`
- `numberField`
- `numberSequence`
- `numberSymbol`
- `numberedList`
- `numberedListMirrored`
- `numberedListNumber`
- `numberedListNumberMirrored`
- `numberedListText`
- `numberedListTextMirrored`
- `oEM`
- `octagon`
- `officeChat`
- `officeChatSolid`
- `offlineStorage`
- `offlineStorageSolid`
- `onboarding`
- `openEnrollment`
- `openFile`
- `openFolderHorizontal`
- `openInNewTab`
- `openInNewWindow`
- `openPane`
- `openPaneMirrored`
- `openSource`
- `openWith`
- `openWithMirrored`
- `org`
- `orientation`
- `orientation2`
- `outOfOffice`
- `pC1`
- `pDF`
- `pOI`
- `pOISolid`
- `pY`
- `package`
- `packages`
- `padding`
- `paddingBottom`
- `paddingLeft`
- `paddingRight`
- `paddingTop`
- `page`
- `pageAdd`
- `pageArrowRight`
- `pageCheckedOut`
- `pageCheckedin`
- `pageData`
- `pageEdit`
- `pageHeader`
- `pageHeaderEdit`
- `pageLeft`
- `pageLink`
- `pageList`
- `pageListFilter`
- `pageListMirroredSolid`
- `pageListSolid`
- `pageLock`
- `pageRemove`
- `pageRight`
- `pageShared`
- `pageSolid`
- `panoIndicator`
- `parachute`
- `parachuteSolid`
- `parameter`
- `paratureLogo`
- `parkingLocation`
- `parkingLocationMirrored`
- `parkingMirroredSolid`
- `parkingSolid`
- `partlyCloudyDay`
- `partlyCloudyNight`
- `partyLeader`
- `passiveAuthentication`
- `passwordField`
- `paste`
- `pasteAsCode`
- `pasteAsText`
- `pause`
- `paymentCard`
- `penWorkspace`
- `pencilReply`
- `pentagon`
- `people`
- `peopleAdd`
- `peopleAlert`
- `peopleBlock`
- `peoplePause`
- `peopleRepeat`
- `permissions`
- `permissionsSolid`
- `personalize`
- `phishing`
- `phone`
- `photo`
- `photo2`
- `photo2Add`
- `photo2Fill`
- `photo2Remove`
- `photoCollection`
- `photoError`
- `photoVideoMedia`
- `picture`
- `pictureCenter`
- `pictureFill`
- `pictureLibrary`
- `picturePosition`
- `pictureStretch`
- `pictureTile`
- `pieDouble`
- `pieSingle`
- `pieSingleSolid`
- `pill`
- `pin`
- `pinSolid12`
- `pinSolidOff12`
- `pinned`
- `pinnedFill`
- `pinnedSolid`
- `pivotChart`
- `plainText`
- `planView`
- `play`
- `playResume`
- `playReverse`
- `playReverseResume`
- `playSolid`
- `playbackRate1x`
- `playerSettings`
- `plug`
- `plugConnected`
- `plugDisconnected`
- `plugSolid`
- `pollResults`
- `postUpdate`
- `powerButton`
- `precipitation`
- `presenceChickletVideo`
- `presentation`
- `presentation12`
- `preview`
- `previewLink`
- `previous`
- `primaryCalendar`
- `print`
- `printfaxPrinterFile`
- `proFootball`
- `proHockey`
- `processMetaTask`
- `processing`
- `processingCancel`
- `processingPause`
- `processingRun`
- `product`
- `productCatalog`
- `productList`
- `productRelease`
- `productVariant`
- `productionFloorManagement`
- `profileSearch`
- `progressLoopInner`
- `progressLoopOuter`
- `progressRingDots`
- `promotedDatabase`
- `protectRestrict`
- `protectedDocument`
- `provisioningPackage`
- `publicCalendar`
- `publicContactCard`
- `publicContactCardMirrored`
- `publicEmail`
- `publicFolder`
- `publishContent`
- `publishCourse`
- `puzzle`
- `pythonLanguage`
- `pythonLogoBlue`
- `pythonLogoYellow`
- `qRCode`
- `qandA`
- `qandAMirror`
- `quadColumn`
- `quantity`
- `quarterCircle`
- `queryList`
- `questionnaire`
- `questionnaireMirrored`
- `quickNote`
- `quickNoteSolid`
- `r`
- `radioBtnOff`
- `radioBtnOn`
- `radioBullet`
- `rain`
- `rainShowersDay`
- `rainShowersNight`
- `rainSnow`
- `rawSource`
- `reactLogo`
- `read`
- `readOutLoud`
- `readingMode`
- `readingModeSolid`
- `realEstate`
- `receiptCheck`
- `receiptForward`
- `receiptReply`
- `receiptTentative`
- `receiptTentativeMirrored`
- `receiptUndelivered`
- `recent`
- `record2`
- `recruitmentManagement`
- `rectangleShape`
- `rectangleShapeSolid`
- `rectangularClipping`
- `recurringEvent`
- `recurringTask`
- `redEye`
- `redEye12`
- `redeploy`
- `redo`
- `refresh`
- `registryEditor`
- `relationship`
- `releaseDefinition`
- `releaseGate`
- `releaseGateCheck`
- `releaseGateError`
- `reminderGroup`
- `reminderPerson`
- `reminderTime`
- `remote`
- `remove`
- `removeContent`
- `removeEvent`
- `removeFilter`
- `removeFromShoppingList`
- `removeFromTrash`
- `removeLink`
- `removeLinkChain`
- `removeLinkX`
- `removeOccurrence`
- `rename`
- `renewalCurrent`
- `renewalFuture`
- `reopenPages`
- `repair`
- `repeatAll`
- `repeatHeaderRows`
- `repeatOne`
- `reply`
- `replyAll`
- `replyAllAlt`
- `replyAllMirrored`
- `replyAlt`
- `replyMirrored`
- `repo`
- `repoSolid`
- `reportAdd`
- `reportDocument`
- `reportHacked`
- `reportLibrary`
- `reportLibraryMirrored`
- `reportLock`
- `reportWarning`
- `rerun`
- `reservationOrders`
- `reset`
- `resetDevice`
- `responsesMenu`
- `returnKey`
- `returnToSession`
- `revToggleKey`
- `reviewRequestMirroredSolid`
- `reviewRequestSolid`
- `reviewResponseSolid`
- `reviewSolid`
- `rewind`
- `rewindEightX`
- `rewindFourX`
- `rewindOneFiveX`
- `rewindOneX`
- `rewindPointFiveX`
- `rewindTwoX`
- `ribbon`
- `ribbonSolid`
- `rightDoubleQuote`
- `rightTriangle`
- `ringer`
- `ringerOff`
- `ringerRemove`
- `ringerSolid`
- `robot`
- `rocket`
- `room`
- `rotate`
- `rotate90Clockwise`
- `rotate90CounterClockwise`
- `rowsChild`
- `rowsGroup`
- `rubyGemsLogo`
- `rugby`
- `running`
- `rustLanguageLogo`
- `sDCard`
- `sIPMove`
- `sQLAnalyticsPool`
- `sVNLogo`
- `sad`
- `sadSolid`
- `save`
- `saveAll`
- `saveAndClose`
- `saveAs`
- `saveTemplate`
- `saveToMobile`
- `savings`
- `scaleUp`
- `scaleVolume`
- `scatterChart`
- `scheduleEventAction`
- `scopeTemplate`
- `screenCast`
- `screenTime`
- `script`
- `scrollUpDown`
- `search`
- `searchAndApps`
- `searchBookmark`
- `searchCalendar`
- `searchData`
- `searchIssue`
- `searchIssueMirrored`
- `searchNearby`
- `secondaryNav`
- `section`
- `sections`
- `securityGroup`
- `seeDo`
- `selectAll`
- `sell`
- `semiboldWeight`
- `send`
- `sendMirrored`
- `sentimentAnalysis`
- `separator`
- `server`
- `serverEnviroment`
- `serverProcesses`
- `serviceOff`
- `setAction`
- `settings`
- `shakeDevice`
- `shapeSolid`
- `shapes`
- `share`
- `sharedDatabase`
- `shareiOS`
- `shirt`
- `shop`
- `shopServer`
- `shoppingCart`
- `shoppingCartSolid`
- `showGrid`
- `showResults`
- `showResultsMirrored`
- `showTimeAs`
- `sidePanel`
- `sidePanelMirrored`
- `signOut`
- `signin`
- `singleBookmark`
- `singleBookmarkSolid`
- `singleColumn`
- `singleColumnEdit`
- `siteScan`
- `sixPointStar`
- `sizeLegacy`
- `skiResorts`
- `skipBack10`
- `skipForward30`
- `skypeArrow`
- `skypeCheck`
- `skypeClock`
- `skypeMinus`
- `slider`
- `sliderHandleSize`
- `sliderThumb`
- `slideshow`
- `smartGlassRemote`
- `snapToGrid`
- `snooze`
- `snow`
- `snowShowerDay`
- `snowShowerNight`
- `snowflake`
- `soccer`
- `sort`
- `sortDown`
- `sortLines`
- `sortLinesAscending`
- `sortUp`
- `source`
- `spacer`
- `speakers`
- `specialEvent`
- `speedHigh`
- `spelling`
- `split`
- `splitObject`
- `sprint`
- `squalls`
- `squareShape`
- `squareShapeSolid`
- `stack`
- `stackColumnChart`
- `stackIndicator`
- `stackedBarChart`
- `stackedColumnChart2`
- `stackedColumnChart2Fill`
- `stackedLineChart`
- `starburst`
- `starburstSolid`
- `statusCircleBlock`
- `statusCircleBlock2`
- `statusCircleCheckmark`
- `statusCircleErrorX`
- `statusCircleExclamation`
- `statusCircleInfo`
- `statusCircleInner`
- `statusCircleOuter`
- `statusCircleQuestionMark`
- `statusCircleRing`
- `statusCircleSync`
- `statusErrorFull`
- `statusTriangle`
- `statusTriangleExclamation`
- `statusTriangleInner`
- `statusTriangleOuter`
- `step`
- `stepInsert`
- `stepShared`
- `stepSharedAdd`
- `stepSharedInsert`
- `stockDown`
- `stockUp`
- `stop`
- `stopSolid`
- `stopwatch`
- `storageAcount`
- `storageOptical`
- `storyboard`
- `streaming`
- `streamingOff`
- `street`
- `streetsideSplitMinimize`
- `strikethrough`
- `subscribe`
- `subscript`
- `substitutionsIn`
- `suitcase`
- `sunAdd`
- `sunQuestionMark`
- `sunny`
- `superscript`
- `surveyQuestions`
- `swiftLogo`
- `switch`
- `switchUser`
- `switcherStartEnd`
- `sync`
- `syncFolder`
- `syncOccurence`
- `syncStatus`
- `syncStatusSolid`
- `syncToPC`
- `system`
- `tVMonitor`
- `tVMonitorSelected`
- `tab`
- `tabCenter`
- `tabOneColumn`
- `tabThreeColumn`
- `tabTwoColumn`
- `table`
- `tableBrandedColumn`
- `tableBrandedRow`
- `tableComputed`
- `tableFirstColumn`
- `tableGroup`
- `tableHeaderRow`
- `tableLastColumn`
- `tableLink`
- `tableTotalRow`
- `tablet`
- `tabletMode`
- `tabletSelected`
- `tag`
- `tagGroup`
- `tagSolid`
- `tagUnknown`
- `tagUnknown12`
- `tagUnknown12Mirror`
- `tagUnknownMirror`
- `taskGroup`
- `taskGroupMirrored`
- `taskList`
- `taskManager`
- `taskManagerMirrored`
- `taskSolid`
- `taskboard`
- `taxi`
- `teamFavorite`
- `teamwork`
- `teeth`
- `telemarketer`
- `temporaryUser`
- `tennis`
- `testAutoSolid`
- `testBeaker`
- `testBeakerSolid`
- `testCase`
- `testExploreSolid`
- `testImpactSolid`
- `testParameter`
- `testPlan`
- `testStep`
- `testSuite`
- `testUserSolid`
- `textAlignBottom`
- `textAlignMiddle`
- `textAlignTop`
- `textBox`
- `textCallout`
- `textDocument`
- `textDocumentEdit`
- `textDocumentSettings`
- `textDocumentShared`
- `textField`
- `textOverflow`
- `textParagraphOption`
- `textRecognition`
- `textRotate270Degrees`
- `textRotate90Degrees`
- `textRotateHorizontal`
- `textRotation`
- `thisPC`
- `threeQuarterCircle`
- `thumbnailView`
- `thumbnailViewMirrored`
- `thunderstorms`
- `ticket`
- `tiles`
- `tiles2`
- `timeEntry`
- `timePicker`
- `timeSheet`
- `timeline`
- `timelineDelivery`
- `timelineMatrixView`
- `timelineProgress`
- `timer`
- `toggleBorder`
- `toggleFilled`
- `toggleLeft`
- `toggleRight`
- `toggleThumb`
- `toll`
- `toolbox`
- `total`
- `touch`
- `touchPointer`
- `trackers`
- `trackersMirrored`
- `train`
- `trainSolid`
- `transferCall`
- `transition`
- `transitionEffect`
- `transitionPop`
- `transitionPush`
- `translate`
- `trending12`
- `triangleDown12`
- `triangleLeft12`
- `triangleRight12`
- `triangleShape`
- `triangleShapeSolid`
- `triangleSolid`
- `triangleSolidDown12`
- `triangleSolidLeft12`
- `triangleSolidRight12`
- `triangleSolidUp12`
- `triangleUp12`
- `triggerApproval`
- `triggerAuto`
- `triggerUser`
- `trim`
- `trimEnd`
- `trimStart`
- `tripleColumn`
- `tripleColumnEdit`
- `tripleColumnWide`
- `trophy`
- `trophy2`
- `trophy2Solid`
- `turnRight`
- `twelvePointStar`
- `twitterLogo`
- `uRLBlock`
- `uSB`
- `umbrella`
- `unSetColor`
- `underline`
- `undo`
- `uneditable`
- `uneditable2`
- `uneditable2Mirrored`
- `uneditableMirrored`
- `uneditableSolid12`
- `uneditableSolidMirrored12`
- `unfavorite`
- `ungroupObject`
- `unknown`
- `unknownCall`
- `unknownMirrored`
- `unknownMirroredSolid`
- `unknownSolid`
- `unlock`
- `unlockSolid`
- `unpin`
- `unpublishContent`
- `unstackSelected`
- `unsubscribe`
- `unsyncFolder`
- `unsyncOccurence`
- `untag`
- `up`
- `updateRestore`
- `upgradeAnalysis`
- `upload`
- `userEvent`
- `userFollowed`
- `userGauge`
- `userOptional`
- `userPause`
- `userRemove`
- `userSync`
- `userWarning`
- `vB`
- `vacation`
- `vaccination`
- `variable`
- `variable2`
- `variableGroup`
- `vennDiagram`
- `verifiedBrand`
- `verifiedBrandSolid`
- `versionControlPush`
- `verticalDistributeCenter`
- `video`
- `video360Generic`
- `videoLightOff`
- `videoOff`
- `videoOff2`
- `videoSearch`
- `videoSolid`
- `view`
- `viewAll`
- `viewAll2`
- `viewDashboard`
- `viewInAR`
- `viewList`
- `viewListGroup`
- `viewListTree`
- `viewOriginal`
- `visuallyImpaired`
- `visualsFolder`
- `visualsStore`
- `voicemailForward`
- `voicemailIRM`
- `voicemailReply`
- `volume0`
- `volume1`
- `volume2`
- `volume3`
- `volumeDisabled`
- `waffle`
- `waitlistConfirm`
- `waitlistConfirmMirrored`
- `warning`
- `warning12`
- `warningSolid`
- `wavingHand`
- `webComponents`
- `webEnvironment`
- `webPublish`
- `webTemplate`
- `webcam2`
- `webcam2Off`
- `website`
- `weights`
- `wheelchair`
- `wifiEthernet`
- `wifiWarning4`
- `windDirection`
- `windowEdit`
- `wines`
- `wipePhone`
- `work`
- `workFlow`
- `workItem`
- `workItemAlert`
- `workItemBar`
- `workItemBarSolid`
- `workItemBug`
- `workforceManagement`
- `world`
- `worldClock`
- `xamarinLogo`
- `xboxController`
- `zipFolder`
- `zoom`
- `zoomIn`
- `zoomOut`
- `zoomToFit`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AcceptIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AcceptMediumIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccessLogoIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccessibiltyCheckerIcon size="20" class="nav-icon" /> Settings</a>
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
<AcceptIcon
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
    <AcceptIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AcceptMediumIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccessLogoIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AcceptIcon size="24" />
   <AcceptMediumIcon size="24" color="#4a90e2" />
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
   <AcceptIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AcceptIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AcceptIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accept } from '@stacksjs/iconify-fluent-mdl2'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accept, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accept } from '@stacksjs/iconify-fluent-mdl2'

// Icons are typed as IconData
const myIcon: IconData = accept
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/microsoft/fluentui/blob/master/packages/react-icons-mdl2/LICENSE) for more information.

## Credits

- **Icons**: Microsoft Corporation ([Website](https://github.com/microsoft/fluentui/tree/master/packages/react-icons-mdl2))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fluent-mdl2/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fluent-mdl2/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
