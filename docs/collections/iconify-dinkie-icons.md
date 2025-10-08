# Dinkie Icons

> Dinkie Icons icons for stx from Iconify

## Overview

This package provides access to 1198 icons from the Dinkie Icons collection through the stx iconify integration.

**Collection ID:** `dinkie-icons`
**Total Icons:** 1198
**Author:** atelierAnchor ([Website](https://github.com/atelier-anchor/dinkie-icons))
**License:** MIT ([Details](https://github.com/atelier-anchor/dinkie-icons/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-dinkie-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbacusIcon, AcceptCircleIcon, AcceptCircleFilledIcon } from '@stacksjs/iconify-dinkie-icons'

// Basic usage
const icon = AbacusIcon()

// With size
const sizedIcon = AbacusIcon({ size: 24 })

// With color
const coloredIcon = AcceptCircleIcon({ color: 'red' })

// With multiple props
const customIcon = AcceptCircleFilledIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbacusIcon, AcceptCircleIcon, AcceptCircleFilledIcon } from '@stacksjs/iconify-dinkie-icons'

  global.icons = {
    home: AbacusIcon({ size: 24 }),
    user: AcceptCircleIcon({ size: 24, color: '#4a90e2' }),
    settings: AcceptCircleFilledIcon({ size: 32 })
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
import { abacus, acceptCircle, acceptCircleFilled } from '@stacksjs/iconify-dinkie-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abacus, { size: 24 })
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
const redIcon = AbacusIcon({ color: 'red' })
const blueIcon = AbacusIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbacusIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbacusIcon({ class: 'text-primary' })
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
const icon24 = AbacusIcon({ size: 24 })
const icon1em = AbacusIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbacusIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbacusIcon({ height: '1em' })
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
const smallIcon = AbacusIcon({ class: 'icon-small' })
const largeIcon = AbacusIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1198** icons:

- `abacus`
- `acceptCircle`
- `acceptCircleFilled`
- `accordion`
- `addressBook`
- `addressBookFilled`
- `addressBookSmall`
- `addressBookSmallFilled`
- `adjustments`
- `adjustmentsFilled`
- `adobeAfterEffects`
- `adobeAfterEffectsFilled`
- `adobeAnimate`
- `adobeAnimateFilled`
- `adobeAudition`
- `adobeAuditionFilled`
- `adobeIllustrator`
- `adobeIllustratorFilled`
- `adobeInDesign`
- `adobeInDesignFilled`
- `adobePhotoshop`
- `adobePhotoshopFilled`
- `adobePremiere`
- `adobePremiereFilled`
- `adult`
- `adultFilled`
- `adultSmall`
- `adultSmallFilled`
- `advantageCircle`
- `advantageCircleFilled`
- `airplane`
- `alarmClock`
- `alarmClockFilled`
- `alarmClockSmallFilled`
- `alienMonster`
- `alienMonsterSmall`
- `alipay`
- `alipayFilled`
- `alipaySmall`
- `alipaySmallFilled`
- `anchor`
- `anchorSmall`
- `android`
- `annotation`
- `antennaBars`
- `antennaBarsFilled`
- `anywayFm`
- `appNotifacation`
- `appNotifacationSmall`
- `appStore`
- `appStoreFilled`
- `apple`
- `appleFilled`
- `appleSmall`
- `appleSmallFilled`
- `arrowsMaximize`
- `arrowsMinimize`
- `artistPalette`
- `astonishedFace`
- `atom`
- `automobile`
- `automobileFilled`
- `automobileSmall`
- `autumnMahjong`
- `axe`
- `axeFilled`
- `backMahjong`
- `backMahjongFilled`
- `balloon`
- `balloonFilled`
- `ballotBoxWithCheck`
- `ballotBoxWithCheckFilled`
- `ballotBoxWithCheckSmall`
- `ballotBoxWithCheckSmallFilled`
- `bambooMahjong`
- `banana`
- `banjo`
- `basket`
- `battery`
- `batteryFilled`
- `batterySmall`
- `batterySmallFilled`
- `beaker`
- `beakerFilled`
- `beerMug`
- `bell`
- `bellFilled`
- `bellWithCancellationStroke`
- `bellWithCancellationStrokeFilled`
- `bezier`
- `bezierSmall`
- `bigger`
- `biggerSmall`
- `bilibili`
- `bilibiliSmall`
- `billedCap`
- `billedCapSmall`
- `biohazard`
- `bird`
- `birdFilled`
- `birthdayCake`
- `blackCircleForRecord`
- `blackCircleForRecordFilled`
- `blackCrossSquare`
- `blackCrossSquareFilled`
- `blackCrossSquareSmall`
- `blackCrossSquareSmallFilled`
- `blackJokerCards`
- `blackLeftDoubleTriangle`
- `blackLeftDoubleTriangleFilled`
- `blackLeftDoubleTriangleWithVerticalBar`
- `blackLeftDoubleTriangleWithVerticalBarFilled`
- `blackRightDoubleTriangle`
- `blackRightDoubleTriangleFilled`
- `blackRightDoubleTriangleWithVerticalBar`
- `blackRightDoubleTriangleWithVerticalBarFilled`
- `blackRightTriangleWithDoubleVerticalBar`
- `blackRightTriangleWithDoubleVerticalBarFilled`
- `blackScissors`
- `blackScissorsFilled`
- `blackSquareForStop`
- `blackSquareForStopFilled`
- `blackSunWithRays`
- `blackSunWithRaysFilled`
- `blackSunWithRaysSmall`
- `blackSunWithRaysSmallFilled`
- `boBlog`
- `bomb`
- `bombFilled`
- `bowAndArrow`
- `boy`
- `boyFilled`
- `boySmall`
- `boySmallFilled`
- `bread`
- `briefcase`
- `briefcaseSmall`
- `brokenHeart`
- `brokenHeartFilled`
- `brush`
- `buddy`
- `bug`
- `buildingConstruction`
- `bus`
- `busAlt`
- `byeFace`
- `calendar`
- `calendarAlt`
- `calendarSmall`
- `camera`
- `candle`
- `carrot`
- `catFace`
- `catFaceSmall`
- `checkmarkCircled`
- `checkmarkCircledFilled`
- `checkmarkCircledSmall`
- `checkmarkCircledSmallFilled`
- `cherries`
- `cherriesFilled`
- `cherriesSmall`
- `cherryBlossom`
- `chestnut`
- `christmasTree`
- `chrysanthemumMahjong`
- `circle`
- `circleFilled`
- `circleSmall`
- `circleSmallFilled`
- `circledInformationSource`
- `circledInformationSourceFilled`
- `circledInformationSourceSmall`
- `circledInformationSourceSmallFilled`
- `clapperBoard`
- `clappingHandsSign`
- `clipboard`
- `clipboardFilled`
- `clipboardSmall`
- `clipboardSmallFilled`
- `clock`
- `clockFilled`
- `clockSmallFilled`
- `closedBook`
- `closedBookFilled`
- `closedBookSmall`
- `closedBookSmallFilled`
- `closedMailboxLoweredFlag`
- `closedMailboxRaisedFlag`
- `cloud`
- `coconut`
- `code`
- `codeFilled`
- `codeSmall`
- `compass`
- `compassFilled`
- `compassSmall`
- `compassSmallFilled`
- `confettiBall`
- `contrast`
- `contrastFilled`
- `contrastSmall`
- `contrastSmallFilled`
- `cookedRice`
- `cookie`
- `cookieFilled`
- `coolBox`
- `coolBoxFilled`
- `copies`
- `copiesFilled`
- `copiesSmall`
- `copiesSmallFilled`
- `cowFace`
- `crab`
- `crescentMoon`
- `crescentMoonFilled`
- `crescentMoonSmall`
- `crescentMoonSmallFilled`
- `crown`
- `cube`
- `cubeSmall`
- `cupWithStraw`
- `cupWithStrawFilled`
- `cursingFace`
- `cursorArrow`
- `cursorArrowFilled`
- `cursorArrowSmall`
- `cursorArrowSmallFilled`
- `cursorText`
- `cursorTextSmall`
- `daggerKnife`
- `daggerKnifeFilled`
- `daggerKnifeSmall`
- `darkSunglasses`
- `deciduousTree`
- `deliveryTruck`
- `deliveryTruckFilled`
- `deliveryTruckSmall`
- `deliveryTruckSmallFilled`
- `desertIsland`
- `desktopComputer`
- `desktopComputerFilled`
- `desktopComputerSmall`
- `desktopComputerSmallFilled`
- `deviceRotate`
- `diagonalCross`
- `diagonalCrossSmall`
- `dieFace1`
- `dieFace1Filled`
- `dieFace1Small`
- `dieFace1SmallFilled`
- `dieFace2`
- `dieFace2Filled`
- `dieFace2Small`
- `dieFace2SmallFilled`
- `dieFace3`
- `dieFace3Filled`
- `dieFace3Small`
- `dieFace3SmallFilled`
- `dieFace4`
- `dieFace4Filled`
- `dieFace4Small`
- `dieFace4SmallFilled`
- `dieFace5`
- `dieFace5Filled`
- `dieFace5Small`
- `dieFace5SmallFilled`
- `dieFace6`
- `dieFace6Filled`
- `dieFace6Small`
- `dieFace6SmallFilled`
- `directionsSign`
- `displayDotMatrix`
- `displayDotMatrixSmall`
- `dizzyFace`
- `dnaDoubleHelix`
- `dogFace`
- `doge`
- `dogeSmall`
- `doubleVerticalBar`
- `doubleVerticalBarFilled`
- `download`
- `downloadSmall`
- `dragonFace`
- `dress`
- `dropOfBlood`
- `droplet`
- `drumWithDrumsticks`
- `duplicate`
- `duplicateFilled`
- `duplicateSmall`
- `duplicateSmallFilled`
- `earthGlobeAsiaAustralia`
- `eastWindMahjong`
- `eightOfBamboosMahjong`
- `eightOfBamboosMahjongFilled`
- `eightOfCharactersMahjong`
- `eightOfCirclesMahjong`
- `eightOfCirclesMahjongFilled`
- `ejectsymbol`
- `ejectsymbolFilled`
- `electricLightBulb`
- `electricLightBulbFilled`
- `electricLightBulbSmall`
- `electricLightBulbSmallFilled`
- `elephant`
- `elevator`
- `elevatorFilled`
- `elevatorSmallFilled`
- `entry`
- `envelope`
- `envelopeFilled`
- `envelopeSmall`
- `envelopeSmallFilled`
- `evergreenTree`
- `exit`
- `expressionlessFace`
- `extraterrestrialAlien`
- `eye`
- `eyeSmall`
- `eyeglasses`
- `faceEatingMelon`
- `faceSavouringDeliciousFood`
- `faceScreamingInFear`
- `faceSplit`
- `faceThrowingAKiss`
- `faceWithColdSweat`
- `faceWithHeadBandage`
- `faceWithMedicalMask`
- `faceWithNoGoodGesture`
- `faceWithOkGesture`
- `faceWithOpenMouthVomiting`
- `faceWithOpenMouthZerowidthjoinerDashSymbol`
- `faceWithPartyHornAndPartyHat`
- `faceWithPleadingEyes`
- `faceWithStuckOutTongueAndTightlyClosedEyes`
- `faceWithTearsOfJoy`
- `facebook`
- `facebookAlt`
- `facebookAltSmall`
- `facebookSmall`
- `factory`
- `factorySmall`
- `ferrisWheel`
- `figma`
- `fileCabinet`
- `fileFolder`
- `fileFolderFilled`
- `fileFolderSmall`
- `fileFolderSmallFilled`
- `fileFont`
- `fileFontFilled`
- `fileFontSmallFilled`
- `fileGraphics`
- `fileGraphicsFilled`
- `fileGraphicsSmallFilled`
- `fileOtf`
- `fileOtfFilled`
- `fileOtfSmallFilled`
- `fileTtf`
- `fileTtfFilled`
- `fileTtfSmallFilled`
- `fileVector`
- `fileVectorFilled`
- `fileVectorSmallFilled`
- `fileWoff`
- `fileWoffFilled`
- `fileWoffSmallFilled`
- `fileWoff2`
- `fileWoff2Filled`
- `fileWoff2SmallFilled`
- `filmFrames`
- `filmFramesSmall`
- `filter`
- `filterSmall`
- `finder`
- `finderSmall`
- `fire`
- `fireSmall`
- `firstQuarterMoonSymbol`
- `fish`
- `fistPalmSalute`
- `fistedHandSign`
- `fiveOfBamboosMahjong`
- `fiveOfBamboosMahjongFilled`
- `fiveOfCharactersMahjong`
- `fiveOfCirclesMahjong`
- `fiveOfCirclesMahjongFilled`
- `flask`
- `flaskFilled`
- `floppyDisk`
- `floppyDiskFilled`
- `floppyDiskSmall`
- `floppyDiskSmallFilled`
- `flyingSaucer`
- `fork`
- `forkAndKnife`
- `fourLeafClover`
- `fourOfBamboosMahjong`
- `fourOfBamboosMahjongFilled`
- `fourOfCharactersMahjong`
- `fourOfCirclesMahjong`
- `fourOfCirclesMahjongFilled`
- `foxFace`
- `frogFace`
- `fullMoonSymbol`
- `gameDie`
- `gameDieSmall`
- `gear`
- `gearFilled`
- `gemStone`
- `ghost`
- `girl`
- `girlFilled`
- `girlSmall`
- `girlSmallFilled`
- `github`
- `githubSmall`
- `globeMeridians`
- `globeMeridiansSmall`
- `glowingStar`
- `glyphs`
- `glyphsFilled`
- `graduationCap`
- `grapes`
- `grassCaoSymbol`
- `greenDragonMahjong`
- `grid`
- `gridDisabled`
- `gridEnabled`
- `gridSmall`
- `grinningFaceWithStarEyes`
- `grinningfacewithonelargeandoneeye`
- `guitar`
- `gyroscope`
- `hamburger`
- `hamburgerSmall`
- `hammer`
- `hammerFilled`
- `handshake`
- `happyPersonRaisingOneHand`
- `hashtag`
- `hashtagSmall`
- `headphone`
- `headphoneFilled`
- `heartBlackSuit`
- `heartBlackSuitCircled`
- `heartBlackSuitCircledSmall`
- `heartBlackSuitSmall`
- `heartWhiteSuit`
- `heartWhiteSuitCircled`
- `heartWhiteSuitCircledFilled`
- `heartWhiteSuitCircledSmall`
- `heartWhiteSuitCircledSmallFilled`
- `heartWhiteSuitSmall`
- `heavyDollarSign`
- `heavyDollarSignSmall`
- `helicopter`
- `herb`
- `hibiscus`
- `highHeeledShoe`
- `highSpeedTrain`
- `highVoltageSign`
- `hocho`
- `hochoFilled`
- `hochoSmall`
- `hochoSmallFilled`
- `hook`
- `horseFace`
- `hotBeverage`
- `hourglass`
- `hourglassWithFlowingSand`
- `houseBuilding`
- `houseBuildingSmall`
- `houseBuildings`
- `houseBuildingsSmall`
- `hundredPointsSymbol`
- `informationDeskPerson`
- `informationsource`
- `informationsourceFilled`
- `informationsourceSmall`
- `informationsourceSmallFilled`
- `inputLatinCapitalLetters`
- `inputLatinCapitalLettersFilled`
- `inputLatinLowerLetters`
- `inputLatinLowerLettersFilled`
- `inputNumbers`
- `inputNumbersFilled`
- `instagram`
- `instagramSmall`
- `invert`
- `invertSmall`
- `javaSparrowSilver`
- `javaSparrowWhite`
- `jeans`
- `jigsawPuzzle`
- `jigsawPuzzlePiece`
- `jigsawPuzzlePieceSmall`
- `jokerMahjong`
- `joystick`
- `keyboard`
- `keyboardFilled`
- `keyboardSmallFilled`
- `keycapAsterisk`
- `keycapAsteriskFilled`
- `keycapAsteriskSmall`
- `keycapAsteriskSmallFilled`
- `keycapCommand`
- `keycapCommandFilled`
- `keycapCommandSmall`
- `keycapCommandSmallFilled`
- `keycapControl`
- `keycapControlFilled`
- `keycapControlSmall`
- `keycapControlSmallFilled`
- `keycapDigitEight`
- `keycapDigitEightFilled`
- `keycapDigitEightSmall`
- `keycapDigitEightSmallFilled`
- `keycapDigitFive`
- `keycapDigitFiveFilled`
- `keycapDigitFiveSmall`
- `keycapDigitFiveSmallFilled`
- `keycapDigitFour`
- `keycapDigitFourFilled`
- `keycapDigitFourSmall`
- `keycapDigitFourSmallFilled`
- `keycapDigitNine`
- `keycapDigitNineFilled`
- `keycapDigitNineSmall`
- `keycapDigitNineSmallFilled`
- `keycapDigitOne`
- `keycapDigitOneFilled`
- `keycapDigitOneSmall`
- `keycapDigitOneSmallFilled`
- `keycapDigitSeven`
- `keycapDigitSevenFilled`
- `keycapDigitSevenSmall`
- `keycapDigitSevenSmallFilled`
- `keycapDigitSix`
- `keycapDigitSixFilled`
- `keycapDigitSixSmall`
- `keycapDigitSixSmallFilled`
- `keycapDigitThree`
- `keycapDigitThreeFilled`
- `keycapDigitThreeSmall`
- `keycapDigitThreeSmallFilled`
- `keycapDigitTwo`
- `keycapDigitTwoFilled`
- `keycapDigitTwoSmall`
- `keycapDigitTwoSmallFilled`
- `keycapDigitZero`
- `keycapDigitZeroFilled`
- `keycapDigitZeroSmall`
- `keycapDigitZeroSmallFilled`
- `keycapEleven`
- `keycapElevenFilled`
- `keycapElevenSmall`
- `keycapElevenSmallFilled`
- `keycapFn`
- `keycapFnFilled`
- `keycapFnSmall`
- `keycapFnSmallFilled`
- `keycapNumberSign`
- `keycapNumberSignFilled`
- `keycapNumberSignSmall`
- `keycapNumberSignSmallFilled`
- `keycapOption`
- `keycapOptionFilled`
- `keycapOptionSmall`
- `keycapOptionSmallFilled`
- `keycapReturn`
- `keycapReturnFilled`
- `keycapReturnSmall`
- `keycapReturnSmallFilled`
- `keycapShift`
- `keycapShiftFilled`
- `keycapShiftSmall`
- `keycapShiftSmallFilled`
- `keycapTab`
- `keycapTabFilled`
- `keycapTabSmall`
- `keycapTabSmallFilled`
- `keycapTen`
- `keycapTenFilled`
- `keycapTenSmall`
- `keycapTenSmallFilled`
- `keycapWindows`
- `keycapWindowsFilled`
- `keycapWindowsSmall`
- `keycapWindowsSmallFilled`
- `kite`
- `koKoKataBox`
- `koKoKataBoxFilled`
- `label`
- `labelFilled`
- `labelSmall`
- `labelSmallFilled`
- `languageCyrillic`
- `languageCyrillicFilled`
- `languageCyrillicSmall`
- `languageCyrillicSmallFilled`
- `languageGreek`
- `languageGreekFilled`
- `languageGreekSmall`
- `languageGreekSmallFilled`
- `languageHan`
- `languageHanFilled`
- `languageHanSmall`
- `languageHanSmallFilled`
- `languageHangul`
- `languageHangulFilled`
- `languageHangulSmall`
- `languageHangulSmallFilled`
- `languageHebrew`
- `languageHebrewFilled`
- `languageHebrewSmall`
- `languageHebrewSmallFilled`
- `languageHira`
- `languageHiraFilled`
- `languageHiraSmall`
- `languageHiraSmallFilled`
- `languageLatin`
- `languageLatinFilled`
- `languageLatinSmall`
- `languageLatinSmallFilled`
- `languageThai`
- `languageThaiFilled`
- `languageThaiSmall`
- `languageThaiSmallFilled`
- `largeQuestionFace`
- `lastQuarterMoonSymbol`
- `leafyGreen`
- `leftArrowCircled`
- `leftArrowCircledFilled`
- `leftArrowCircledSmall`
- `leftArrowCircledSmallFilled`
- `leftHookArrow`
- `leftHookArrowFilled`
- `leftHookArrowSmall`
- `leftHookArrowSmallFilled`
- `leftMagnifyingGlass`
- `leftMagnifyingGlassFilled`
- `leftMagnifyingGlassSmall`
- `leftMagnifyingGlassSmallFilled`
- `lemon`
- `lightRail`
- `lineGap`
- `lineGapSmall`
- `lineHeight`
- `lineHeightSmall`
- `linkSymbol`
- `linkSymbolSmall`
- `locationPin`
- `locationPinFilled`
- `locationPinSmall`
- `locationPinSmallFilled`
- `lock`
- `lockFilled`
- `lockSmallFilled`
- `loudlyCryingFace`
- `love`
- `magicWand`
- `magnet`
- `magnetFilled`
- `mango`
- `memo`
- `memoFilled`
- `memoSmall`
- `memoSmallFilled`
- `menu`
- `menuSmall`
- `metro`
- `mic`
- `micMv51`
- `micSmall`
- `microbe`
- `microphone`
- `microphoneFilled`
- `microscope`
- `milkPackage`
- `milkPackageSmall`
- `mobilePhone`
- `mobilePhoneAlt`
- `mobilePhoneAlt2`
- `mobilePhoneAlt2Small`
- `moneyBag`
- `moneyBagCny`
- `moneyBagEur`
- `moneyBagFilled`
- `moneyBagFrf`
- `moneyBagGbp`
- `moneyBagSmall`
- `moneyBagUsd`
- `moneyMouthFace`
- `monkeyFace`
- `monospaced`
- `mountain`
- `mouseFace`
- `mouth`
- `movieCamera`
- `multipleMusicalNotes`
- `mushroom`
- `musicalKeyboard`
- `musicalKeyboardFilled`
- `musicalNote`
- `musicalNoteSmall`
- `musicalScore`
- `nerdFace`
- `neteaseMusic`
- `neteaseMusicSmall`
- `neutralFace`
- `newMoonSymbol`
- `newspaper`
- `nineOfBamboosMahjong`
- `nineOfBamboosMahjongFilled`
- `nineOfCharactersMahjong`
- `nineOfCirclesMahjong`
- `nineOfCirclesMahjongFilled`
- `nintendoSwitch`
- `noEntrySign`
- `noOneUnderEighteenSymbol`
- `noOneUnderEighteenSymbolFilled`
- `noSmokingSymbol`
- `northWindMahjong`
- `notion`
- `octopus`
- `okBox`
- `okBoxFilled`
- `okHandSign`
- `okHandSignSmall`
- `oneOfBamboosMahjong`
- `oneOfBamboosMahjongSs02`
- `oneOfCharactersMahjong`
- `oneOfCirclesMahjong`
- `oneOfCirclesMahjongFilled`
- `onion`
- `openBook`
- `openBookSmall`
- `openLock`
- `openLockFilled`
- `openLockSmallFilled`
- `openMailboxLoweredFlag`
- `openMailboxRaisedFlag`
- `opticalDisc`
- `optionKey`
- `orchidMahjong`
- `orthogon7x7`
- `orthogon7x9`
- `orthogon9x7`
- `orthogon9x9`
- `otfeatureAcps`
- `otfeatureAcpsSmallFilled`
- `otfeatureC2sc`
- `otfeatureC2scSmallFilled`
- `otfeatureCalt`
- `otfeatureCaltSmallFilled`
- `otfeatureCcmp`
- `otfeatureCcmpSmallFilled`
- `otfeatureDlig`
- `otfeatureDligSmallFilled`
- `otfeatureFrac`
- `otfeatureFracSmallFilled`
- `otfeatureFwid`
- `otfeatureFwidSmallFilled`
- `otfeatureHrzt`
- `otfeatureHrztSmallFilled`
- `otfeatureHwid`
- `otfeatureHwidSmallFilled`
- `otfeatureLiga`
- `otfeatureLigaSmallFilled`
- `otfeatureOnum`
- `otfeatureOnumSmallFilled`
- `otfeatureOrdn`
- `otfeatureOrdnSmallFilled`
- `otfeatureSmcp`
- `otfeatureSmcpSmallFilled`
- `otfeatureSs01`
- `otfeatureSs01SmallFilled`
- `otfeatureSs02`
- `otfeatureSs02SmallFilled`
- `otfeatureSs03`
- `otfeatureSs03SmallFilled`
- `otfeatureSubs`
- `otfeatureSubsSmallFilled`
- `otfeatureSups`
- `otfeatureSupsSmallFilled`
- `otfeatureVert`
- `otfeatureVertSmallFilled`
- `otfeatureZero`
- `otfeatureZeroSmallFilled`
- `pageCurl`
- `pageCurlFilled`
- `pageCurlSmall`
- `pageCurlSmallFilled`
- `pageFacingUp`
- `pageFacingUpFilled`
- `pageFacingUpSmall`
- `pageFacingUpSmallFilled`
- `pageGraphics`
- `pageGraphicsFilled`
- `pageGraphicsSmallFilled`
- `pager`
- `palmFace`
- `palmTree`
- `paperclip`
- `paperclipSmall`
- `parallelogram`
- `partyPopper`
- `partyPopperSmall`
- `paypal`
- `peach`
- `pear`
- `pearLogo`
- `pearLogoFilled`
- `pearLogoSmall`
- `pearLogoSmallFilled`
- `peekFace`
- `pencil`
- `pencilSmall`
- `personWithFoldedHands`
- `personWithFoldedHandsFilled`
- `personalComputer`
- `petriDish`
- `pigFace`
- `pileOfPoo`
- `pill`
- `pillFilled`
- `pineapple`
- `pistol`
- `pistolFilled`
- `placard`
- `placardAlt`
- `placardSmall`
- `playstation`
- `plumMahjong`
- `podcast`
- `podcastSmall`
- `podium`
- `potableWaterSymbol`
- `pottedPlant`
- `poultryLeg`
- `poultryLegFilled`
- `propellor`
- `publicAddressLoudspeaker`
- `publicAddressLoudspeakerSmall`
- `pushpin`
- `pushpinFilled`
- `pushpinSmall`
- `pushpinSmallFilled`
- `qq`
- `qqFilled`
- `questionFace`
- `rabbitFace`
- `radioButton`
- `radioButtonSmall`
- `radioactive`
- `radioactiveSmall`
- `railwayCar`
- `raisedBackOfHand`
- `raisedBackOfHandSmall`
- `raisedHand`
- `raisedHandSmall`
- `redApple`
- `redAppleSmall`
- `redDragonMahjong`
- `redDragonMahjongFilled`
- `repeatArrow`
- `repeatArrowFilled`
- `restroom`
- `restroomFilled`
- `restroomSmallFilled`
- `revert`
- `ribbon`
- `rightArrowCircled`
- `rightArrowCircledFilled`
- `rightArrowCircledSmall`
- `rightArrowCircledSmallFilled`
- `rightBlackTriangle`
- `rightBlackTriangleFilled`
- `rightHookArrow`
- `rightHookArrowFilled`
- `rightHookArrowSmall`
- `rightHookArrowSmallFilled`
- `rightMagnifyingGlass`
- `rightMagnifyingGlassFilled`
- `rightMagnifyingGlassSmall`
- `rightMagnifyingGlassSmallFilled`
- `rightThenCurvingDownArrow`
- `rightThenCurvingDownArrowFilled`
- `rightThenCurvingDownArrowSmall`
- `rightThenCurvingDownArrowSmallFilled`
- `rightThenCurvingUpArrow`
- `rightThenCurvingUpArrowFilled`
- `rightThenCurvingUpArrowSmall`
- `rightThenCurvingUpArrowSmallFilled`
- `roastedSweetPotato`
- `robot`
- `robotFace`
- `robotFilled`
- `rocket`
- `rose`
- `rostrum`
- `roundPushpin`
- `roundPushpinFilled`
- `roundPushpinSmall`
- `roundPushpinSmallFilled`
- `rulerRightAngle`
- `sandwich`
- `satellite`
- `satelliteAntenna`
- `sauropod`
- `saxophone`
- `saxophoneFilled`
- `scales`
- `scan`
- `scanSmall`
- `secretHanCircled`
- `secretHanCircledFilled`
- `seedling`
- `sevenOfBamboosMahjong`
- `sevenOfBamboosMahjongFilled`
- `sevenOfCharactersMahjong`
- `sevenOfCirclesMahjong`
- `sevenOfCirclesMahjongFilled`
- `shamrock`
- `share`
- `shark`
- `shield`
- `shintoShrine`
- `ship`
- `shockedFaceWithExplodingHead`
- `shoppingBag`
- `shoppingTrolley`
- `shoppingTrolleySmall`
- `shortcake`
- `shorts`
- `shrug`
- `shuffleArrows`
- `shuffleArrowsFilled`
- `sinaWeibo`
- `sinaWeiboSmall`
- `sixOfBamboosMahjong`
- `sixOfBamboosMahjongFilled`
- `sixOfCharactersMahjong`
- `sixOfCirclesMahjong`
- `sixOfCirclesMahjongFilled`
- `sizeEmoji`
- `sizeEmojiSmall`
- `sizeText`
- `sizeTextFilled`
- `sizeTextSmall`
- `sizeTextSmallFilled`
- `skull`
- `sleepingFace`
- `sliceOfPizza`
- `slightlyFrowningFace`
- `slightlyFrowningFaceFilled`
- `slightlyFrowningFaceSmall`
- `slightlyFrowningFaceSmallFilled`
- `slightlySmilingFace`
- `slightlySmilingFaceFilled`
- `slightlySmilingFaceSmall`
- `slightlySmilingFaceSmallFilled`
- `slotMachine`
- `smaller`
- `smallerSmall`
- `smilingFaceWithHeartShapedEyes`
- `smilingFaceWithOpenMouth`
- `smilingFaceWithOpenMouthAndColdSweat`
- `smilingFaceWithOpenMouthAndSmilingEyes`
- `smirkingFace`
- `smokingSymbol`
- `snail`
- `snake`
- `snowCappedMountain`
- `snowflake`
- `softIceCream`
- `southWindMahjong`
- `sparkles`
- `speaker`
- `speakerWithCancellationStroke`
- `speakerWithOneSoundWave`
- `speakerWithThreeSoundWaves`
- `speechBalloon`
- `speechBalloonEmpty`
- `speechBalloonEmptySmall`
- `speechBalloonEmptySmallFilled`
- `speechBalloonHeart`
- `speechBalloonHeartSmallFilled`
- `speechBalloonInfo`
- `speechBalloonInfoSmallFilled`
- `speechBalloonQuestion`
- `speechBalloonQuestionSmallFilled`
- `speechBalloonSmall`
- `speechBalloonSmallFilled`
- `spider`
- `spoutingWhale`
- `springMahjong`
- `squintSmilingFace`
- `squintSmilingFaceSmall`
- `steam`
- `steamLocomotive`
- `steamingBowl`
- `stopwatch`
- `stopwatchFilled`
- `stopwatchSmallFilled`
- `straightRuler`
- `strawberry`
- `summerMahjong`
- `sunflower`
- `suspensionRailway`
- `swan`
- `syringe`
- `tRex`
- `tRexFilled`
- `tRexSmall`
- `tRexSmallFilled`
- `tShirt`
- `tableTennisPaddleAndBall`
- `tangerine`
- `telegram`
- `telegramAlt`
- `telegramAltSmall`
- `television`
- `televisionFilled`
- `tent`
- `testTube`
- `testTubeFilled`
- `textEdit`
- `textEditSmall`
- `thermometer`
- `thinkingFace`
- `threeButtonMouse`
- `threeButtonMouseAlt`
- `threeNetworkedComputers`
- `threeOfBamboosMahjong`
- `threeOfBamboosMahjongFilled`
- `threeOfCharactersMahjong`
- `threeOfCirclesMahjong`
- `threeOfCirclesMahjongFilled`
- `thumbUpFace`
- `thumbsUpSign`
- `thumbsUpSignFilled`
- `tigerFace`
- `tiktok`
- `tiktokSmall`
- `toilet`
- `tomato`
- `topHat`
- `topHatSmall`
- `torch`
- `train`
- `trainSmall`
- `translateArabicLatin`
- `translateCyrillicLatin`
- `translateGreekLatin`
- `translateHanLatin`
- `translateHangulLatin`
- `translateHebrewLatin`
- `translateHiraLatin`
- `translateLatinHan`
- `translateThaiLatin`
- `triangularRuler`
- `trolleybus`
- `trophy`
- `trumpet`
- `turtle`
- `twitter`
- `twitterAlt`
- `twitterAltSmall`
- `twitterSmall`
- `twoButtonMouse`
- `twoButtonMouseFilled`
- `twoButtonMouseSmall`
- `twoOfBamboosMahjong`
- `twoOfBamboosMahjongFilled`
- `twoOfCharactersMahjong`
- `twoOfCirclesMahjong`
- `twoOfCirclesMahjongFilled`
- `u1faaa`
- `u1faaaSmall`
- `u1faab`
- `u1faabSmall`
- `u1fad9`
- `u1fae0`
- `u1fae4`
- `u1fae5`
- `u1fae5Small`
- `u1fae7`
- `umbrella`
- `umbrellaOnGround`
- `uni5475Box`
- `uni5475BoxFilled`
- `uni54c8Box`
- `uni54c8BoxFilled`
- `uni597dBox`
- `uni597dBoxFilled`
- `uni5f3aBox`
- `uni5f3aBoxFilled`
- `uni5f97Box`
- `uni5f97BoxFilled`
- `uni6709Box`
- `uni6709BoxFilled`
- `uni7121Box`
- `uni7121BoxFilled`
- `uni7981Box`
- `uni7981BoxFilled`
- `uni8279Circled`
- `uni8279CircledFilled`
- `uni8349Circled`
- `uni8349CircledFilled`
- `uni8d5eBox`
- `uni8d5eBoxFilled`
- `unicode`
- `unicodeSmall`
- `unsplash`
- `unsplashFilled`
- `upsideDownFace`
- `upsideDownFaceFilled`
- `upsideDownFaceSmall`
- `upsideDownFaceSmallFilled`
- `victoryHand`
- `videoGame`
- `videoGameFilled`
- `videoGameSmall`
- `viewGrid`
- `viewGridAlt`
- `viewGridSmall`
- `viewList`
- `viewListSmall`
- `violin`
- `volcano`
- `waningCrescentMoonSymbol`
- `waningGibbousMoonSymbol`
- `watch`
- `watermelon`
- `waxingCrescentMoonSymbol`
- `waxingGibbousMoonSymbol`
- `webcam`
- `webcamSmall`
- `wechat`
- `wechatFilled`
- `wechatMoments`
- `wechatMomentsSmall`
- `wechatSmall`
- `wechatSmallFilled`
- `westWindMahjong`
- `whatsApp`
- `whiteDownBackhandIndex`
- `whiteDragonMahjong`
- `whiteDragonMahjongFilled`
- `whiteHeavyCheckMark`
- `whiteHeavyCheckMarkFilled`
- `whiteHeavyCheckMarkSmall`
- `whiteHeavyCheckMarkSmallFilled`
- `whiteLeftBackhandIndex`
- `whiteMediumStar`
- `whiteMediumStarFilled`
- `whiteMediumStarSmall`
- `whiteMediumStarSmallFilled`
- `whiteRightBackhandIndex`
- `whiteUpBackhandIndex`
- `whitesquare`
- `whitesquareSmall`
- `wiltedFlower`
- `windowBrowser`
- `windowBrowserSmall`
- `windows`
- `windowsAlt`
- `windowsAlt2`
- `windowsAlt3`
- `windowsSmall`
- `wineGlass`
- `wineGlassFilled`
- `winkingFace`
- `winterMahjong`
- `wireless`
- `wirelessFilled`
- `wirelessSmall`
- `womansBoots`
- `womansHat`
- `wrappedPresent`
- `wrench`
- `wrenchFilled`
- `wrenchSmallFilled`
- `writingHand`
- `xiaohongshu`
- `xiaoyuzhou`
- `zhubai`
- `zipperMouthFace`
- `zoomIn`
- `zoomInFilled`
- `zoomInSmall`
- `zoomInSmallFilled`
- `zoomOut`
- `zoomOutFilled`
- `zoomOutSmall`
- `zoomOutSmallFilled`

## Usage Examples

### Navigation Menu

```html
@js
  import { AbacusIcon, AcceptCircleIcon, AcceptCircleFilledIcon, AccordionIcon } from '@stacksjs/iconify-dinkie-icons'

  global.navIcons = {
    home: AbacusIcon({ size: 20, class: 'nav-icon' }),
    about: AcceptCircleIcon({ size: 20, class: 'nav-icon' }),
    contact: AcceptCircleFilledIcon({ size: 20, class: 'nav-icon' }),
    settings: AccordionIcon({ size: 20, class: 'nav-icon' })
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
import { AbacusIcon } from '@stacksjs/iconify-dinkie-icons'

const icon = AbacusIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbacusIcon, AcceptCircleIcon, AcceptCircleFilledIcon } from '@stacksjs/iconify-dinkie-icons'

const successIcon = AbacusIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcceptCircleIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AcceptCircleFilledIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbacusIcon, AcceptCircleIcon } from '@stacksjs/iconify-dinkie-icons'
   const icon = AbacusIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abacus, acceptCircle } from '@stacksjs/iconify-dinkie-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abacus, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbacusIcon, AcceptCircleIcon } from '@stacksjs/iconify-dinkie-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-dinkie-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbacusIcon } from '@stacksjs/iconify-dinkie-icons'
     global.icon = AbacusIcon({ size: 24 })
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
   const icon = AbacusIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abacus } from '@stacksjs/iconify-dinkie-icons'

// Icons are typed as IconData
const myIcon: IconData = abacus
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/atelier-anchor/dinkie-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: atelierAnchor ([Website](https://github.com/atelier-anchor/dinkie-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/dinkie-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/dinkie-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
