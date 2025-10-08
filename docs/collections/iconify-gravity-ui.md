# Gravity UI Icons

> Gravity UI Icons icons for stx from Iconify

## Overview

This package provides access to 744 icons from the Gravity UI Icons collection through the stx iconify integration.

**Collection ID:** `gravity-ui`
**Total Icons:** 744
**Author:** YANDEX LLC ([Website](https://github.com/gravity-ui/icons/))
**License:** MIT ([Details](https://github.com/gravity-ui/icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gravity-ui
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbbrApiIcon, AbbrMlIcon, AbbrQlIcon } from '@stacksjs/iconify-gravity-ui'

// Basic usage
const icon = AbbrApiIcon()

// With size
const sizedIcon = AbbrApiIcon({ size: 24 })

// With color
const coloredIcon = AbbrMlIcon({ color: 'red' })

// With multiple props
const customIcon = AbbrQlIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbbrApiIcon, AbbrMlIcon, AbbrQlIcon } from '@stacksjs/iconify-gravity-ui'

  global.icons = {
    home: AbbrApiIcon({ size: 24 }),
    user: AbbrMlIcon({ size: 24, color: '#4a90e2' }),
    settings: AbbrQlIcon({ size: 32 })
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
import { abbrApi, abbrMl, abbrQl } from '@stacksjs/iconify-gravity-ui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abbrApi, { size: 24 })
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
const redIcon = AbbrApiIcon({ color: 'red' })
const blueIcon = AbbrApiIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbbrApiIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbbrApiIcon({ class: 'text-primary' })
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
const icon24 = AbbrApiIcon({ size: 24 })
const icon1em = AbbrApiIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbbrApiIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbbrApiIcon({ height: '1em' })
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
const smallIcon = AbbrApiIcon({ class: 'icon-small' })
const largeIcon = AbbrApiIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **744** icons:

- `abbrApi`
- `abbrMl`
- `abbrQl`
- `abbrSql`
- `abbrZip`
- `antennaSignal`
- `aperture`
- `archive`
- `arrowChevronDown`
- `arrowChevronLeft`
- `arrowChevronRight`
- `arrowChevronUp`
- `arrowDown`
- `arrowDownFromLine`
- `arrowDownToLine`
- `arrowDownToSquare`
- `arrowLeft`
- `arrowLeftFromLine`
- `arrowLeftToLine`
- `arrowRight`
- `arrowRightArrowLeft`
- `arrowRightFromLine`
- `arrowRightFromSquare`
- `arrowRightToLine`
- `arrowRightToSquare`
- `arrowRotateLeft`
- `arrowRotateRight`
- `arrowShapeDown`
- `arrowShapeDownFromLine`
- `arrowShapeDownToLine`
- `arrowShapeLeft`
- `arrowShapeLeftFromLine`
- `arrowShapeLeftToLine`
- `arrowShapeRight`
- `arrowShapeRightFromLine`
- `arrowShapeRightToLine`
- `arrowShapeTurnUpLeft`
- `arrowShapeTurnUpRight`
- `arrowShapeUp`
- `arrowShapeUpFromLine`
- `arrowShapeUpToLine`
- `arrowUp`
- `arrowUpArrowDown`
- `arrowUpFromLine`
- `arrowUpFromSquare`
- `arrowUpFromSquareSlash`
- `arrowUpRightFromSquare`
- `arrowUpToLine`
- `arrowUturnCcwDown`
- `arrowUturnCcwLeft`
- `arrowUturnCcwRight`
- `arrowUturnCwDown`
- `arrowUturnCwLeft`
- `arrowUturnCwRight`
- `arrows3RotateLeft`
- `arrows3RotateLeftLetterA`
- `arrows3RotateRight`
- `arrowsExpand`
- `arrowsExpandHorizontal`
- `arrowsExpandVertical`
- `arrowsOppositeToDots`
- `arrowsRotateLeft`
- `arrowsRotateLeftSlash`
- `arrowsRotateRight`
- `arrowsRotateRightSlash`
- `at`
- `backwardStep`
- `backwardStepFill`
- `ban`
- `bars`
- `barsAscendingAlignCenter`
- `barsAscendingAlignLeft`
- `barsAscendingAlignLeftArrowDown`
- `barsAscendingAlignLeftArrowUp`
- `barsAscendingAlignRight`
- `barsDescendingAlignCenter`
- `barsDescendingAlignLeft`
- `barsDescendingAlignLeftArrowDown`
- `barsDescendingAlignLeftArrowUp`
- `barsDescendingAlignRight`
- `barsPlay`
- `barsUnaligned`
- `bell`
- `bellDot`
- `bellFill`
- `bellSlash`
- `binoculars`
- `bold`
- `book`
- `bookOpen`
- `bookmark`
- `bookmarkFill`
- `box`
- `boxes3`
- `branchesDown`
- `branchesRight`
- `branchesRightArrowRight`
- `briefcase`
- `broadcastSignal`
- `broomMotion`
- `brush`
- `bucket`
- `bucketPaint`
- `bug`
- `bulb`
- `calculator`
- `calendar`
- `camera`
- `car`
- `cardClub`
- `cardDiamond`
- `cardHeart`
- `cardSpade`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `caretsExpandVertical`
- `chartAreaStacked`
- `chartAreaStackedNormalized`
- `chartBar`
- `chartBarStacked`
- `chartColumn`
- `chartColumnStacked`
- `chartDonut`
- `chartLine`
- `chartLineLabel`
- `chartMixed`
- `chartPie`
- `chartTreemap`
- `check`
- `checkDouble`
- `checkShape`
- `checkShapeFill`
- `cherry`
- `chevronDown`
- `chevronDownWide`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chevronUpWide`
- `chevronsCollapseFromLines`
- `chevronsCollapseHorizontal`
- `chevronsCollapseToLine`
- `chevronsCollapseUpRight`
- `chevronsCollapseVertical`
- `chevronsDown`
- `chevronsDownWide`
- `chevronsExpandFromLine`
- `chevronsExpandHorizontal`
- `chevronsExpandToLines`
- `chevronsExpandUpRight`
- `chevronsExpandVertical`
- `chevronsLeft`
- `chevronsRight`
- `chevronsUp`
- `chevronsUpWide`
- `circle`
- `circleArrowDown`
- `circleArrowDownFill`
- `circleArrowLeft`
- `circleArrowLeftFill`
- `circleArrowRight`
- `circleArrowRightFill`
- `circleArrowUp`
- `circleArrowUpFill`
- `circleCheck`
- `circleCheckFill`
- `circleChevronDown`
- `circleChevronDownFill`
- `circleChevronLeft`
- `circleChevronLeftFill`
- `circleChevronRight`
- `circleChevronRightFill`
- `circleChevronUp`
- `circleChevronUpFill`
- `circleChevronsDown`
- `circleChevronsLeft`
- `circleChevronsRight`
- `circleChevronsUp`
- `circleDashed`
- `circleDollar`
- `circleExclamation`
- `circleExclamationFill`
- `circleFill`
- `circleInfo`
- `circleInfoFill`
- `circleLetterA`
- `circleLetterB`
- `circleLetterC`
- `circleLetterD`
- `circleLetterE`
- `circleLetterF`
- `circleLetterG`
- `circleLetterH`
- `circleLetterI`
- `circleLetterJ`
- `circleLetterK`
- `circleLetterL`
- `circleLetterM`
- `circleLetterN`
- `circleLetterO`
- `circleLetterP`
- `circleLetterQ`
- `circleLetterR`
- `circleLetterS`
- `circleLetterT`
- `circleLetterU`
- `circleLetterV`
- `circleLetterW`
- `circleLetterX`
- `circleLetterY`
- `circleLetterZ`
- `circleLink`
- `circleMinus`
- `circleMinusFill`
- `circleNumber0`
- `circleNumber1`
- `circleNumber2`
- `circleNumber3`
- `circleNumber4`
- `circleNumber5`
- `circleNumber6`
- `circleNumber7`
- `circleNumber8`
- `circleNumber9`
- `circlePause`
- `circlePauseFill`
- `circlePlay`
- `circlePlayFill`
- `circlePlus`
- `circlePlusFill`
- `circleQuestion`
- `circleQuestionDot`
- `circleQuestionFill`
- `circleRuble`
- `circleStop`
- `circleStopFill`
- `circleXmark`
- `circleXmarkFill`
- `circles3Plus`
- `circles4Diamond`
- `circles4Square`
- `circles5Random`
- `circlesConcentric`
- `circlesIntersection`
- `clock`
- `clockArrowRotateLeft`
- `clockFill`
- `cloud`
- `cloudArrowUpIn`
- `cloudCheck`
- `cloudGear`
- `cloudNutHex`
- `cloudSlash`
- `clouds`
- `code`
- `codeCommit`
- `codeCommitHorizontal`
- `codeCommits`
- `codeCompare`
- `codeFork`
- `codeMerge`
- `codePullRequest`
- `codePullRequestArrowLeft`
- `codePullRequestArrowRight`
- `codePullRequestCheck`
- `codePullRequestXmark`
- `codeTrunk`
- `comment`
- `commentDot`
- `commentFill`
- `commentPlus`
- `commentSlash`
- `comments`
- `compass`
- `copy`
- `copyArrowRight`
- `copyCheck`
- `copyCheckXmark`
- `copyChevronRight`
- `copyMinus`
- `copyPicture`
- `copyPlus`
- `copyTransparent`
- `copyXmark`
- `cpu`
- `cpus`
- `creditCard`
- `crop`
- `crownDiamond`
- `cube`
- `cubes3`
- `cubes3Overlap`
- `cup`
- `curlyBrackets`
- `curlyBracketsFunction`
- `curlyBracketsLock`
- `database`
- `databaseArrowRight`
- `databaseFill`
- `databaseMagnifier`
- `databases`
- `databasesFill`
- `delete`
- `diamond`
- `diamondExclamation`
- `diamondExclamationFill`
- `diamondFill`
- `dice1`
- `dice2`
- `dice3`
- `dice4`
- `dice5`
- `dice6`
- `display`
- `displayPulse`
- `dots9`
- `droplet`
- `ear`
- `ellipsis`
- `ellipsisVertical`
- `envelope`
- `envelopeOpen`
- `envelopeOpenXmark`
- `equal`
- `eraser`
- `exclamationShape`
- `exclamationShapeFill`
- `eye`
- `eyeDashed`
- `eyeSlash`
- `eyesLookLeft`
- `eyesLookRight`
- `faceAlien`
- `faceAngry`
- `faceFun`
- `faceNeutral`
- `faceNeutralDashed`
- `faceRobot`
- `faceSad`
- `faceSmile`
- `faceSurprise`
- `factory`
- `file`
- `fileArrowDown`
- `fileArrowLeft`
- `fileArrowRight`
- `fileArrowRightOut`
- `fileArrowUp`
- `fileCheck`
- `fileCode`
- `fileDollar`
- `fileExclamation`
- `fileLetterP`
- `fileLetterW`
- `fileLetterX`
- `fileMagnifier`
- `fileMinus`
- `filePlus`
- `fileQuestion`
- `fileRuble`
- `fileText`
- `fileXmark`
- `fileZipper`
- `files`
- `filmstrip`
- `fingerprint`
- `flag`
- `flame`
- `flask`
- `floppyDisk`
- `folder`
- `folderArrowDown`
- `folderArrowLeft`
- `folderArrowRight`
- `folderArrowUp`
- `folderArrowUpIn`
- `folderCheck`
- `folderCode`
- `folderExclamation`
- `folderFill`
- `folderFlows`
- `folderHouse`
- `folderKeyhole`
- `folderLock`
- `folderMagnifier`
- `folderOpen`
- `folderOpenFill`
- `folderPlus`
- `folderTree`
- `folders`
- `font`
- `fontCase`
- `fontCursor`
- `forwardStep`
- `forwardStepFill`
- `frame`
- `frames`
- `function`
- `funnel`
- `funnelXmark`
- `gear`
- `gearBranches`
- `gearDot`
- `gearPlay`
- `geo`
- `geoDots`
- `geoFill`
- `geoPin`
- `geoPolygons`
- `ghost`
- `gift`
- `globe`
- `gpu`
- `graduationCap`
- `graphNode`
- `grip`
- `gripHorizontal`
- `hammer`
- `hand`
- `handOk`
- `handPointDown`
- `handPointLeft`
- `handPointRight`
- `handPointUp`
- `handStop`
- `handset`
- `handsetArrowIn`
- `handsetArrowOut`
- `hardDrive`
- `hashtag`
- `heading`
- `heading1`
- `heading2`
- `heading3`
- `heading4`
- `heading5`
- `heading6`
- `headphones`
- `heart`
- `heartCrack`
- `heartFill`
- `heartPulse`
- `hierarchy`
- `house`
- `houseFill`
- `italic`
- `key`
- `keyboard`
- `layers`
- `layers3Diagonal`
- `layersVertical`
- `layoutCells`
- `layoutCellsLarge`
- `layoutColumns`
- `layoutColumns3`
- `layoutFooter`
- `layoutHeader`
- `layoutHeaderCells`
- `layoutHeaderCellsLarge`
- `layoutHeaderCellsLargeFill`
- `layoutHeaderCellsLargeLetterD`
- `layoutHeaderCellsLargeThunderbolt`
- `layoutHeaderColumns`
- `layoutHeaderCursor`
- `layoutHeaderSideContent`
- `layoutList`
- `layoutRows`
- `layoutRows3`
- `layoutSideContent`
- `layoutSideContentLeft`
- `layoutSideContentRight`
- `layoutSplitColumns`
- `layoutSplitColumns3`
- `layoutSplitRows`
- `layoutSplitSideContentLeft`
- `layoutSplitSideContentRight`
- `layoutTabs`
- `letterAUnderline`
- `letterGroup`
- `letterM`
- `lifeRing`
- `link`
- `linkSlash`
- `listCheck`
- `listCheckLock`
- `listOl`
- `listTimeline`
- `listUl`
- `locationArrow`
- `locationArrowFill`
- `lock`
- `lockOpen`
- `logoAcrobat`
- `logoAndroid`
- `logoDocker`
- `logoDrawIo`
- `logoFacebook`
- `logoGitlab`
- `logoLinux`
- `logoMacos`
- `logoMarkdown`
- `logoMcp`
- `logoMermaid`
- `logoNotion`
- `logoOsi`
- `logoPython`
- `logoStackOverflow`
- `logoTelegram`
- `logoUbuntu`
- `logoWindows`
- `logoYandex`
- `logoYandexCloud`
- `logoYandexMessenger`
- `logoYandexTracker`
- `magicWand`
- `magnet`
- `magnifier`
- `magnifierMinus`
- `magnifierPlus`
- `mapPin`
- `mapPinMinus`
- `mapPinPlus`
- `mathIntersectionShape`
- `mathOperations`
- `mathUnionShape`
- `medal`
- `megaphone`
- `microphone`
- `microphoneSlash`
- `minus`
- `minusShape`
- `minusShapeFill`
- `molecule`
- `moon`
- `mug`
- `musicNote`
- `nodesDown`
- `nodesLeft`
- `nodesRight`
- `nodesUp`
- `nutHex`
- `objectAlignBottom`
- `objectAlignCenterHorizontal`
- `objectAlignCenterVertical`
- `objectAlignJustifyHorizontal`
- `objectAlignJustifyVertical`
- `objectAlignLeft`
- `objectAlignRight`
- `objectAlignTop`
- `objectsAlignBottom`
- `objectsAlignCenterHorizontal`
- `objectsAlignCenterVertical`
- `objectsAlignJustifyHorizontal`
- `objectsAlignJustifyVertical`
- `objectsAlignLeft`
- `objectsAlignRight`
- `objectsAlignTop`
- `octagonXmark`
- `officeBadge`
- `palette`
- `paperPlane`
- `paperclip`
- `passport`
- `pause`
- `pauseFill`
- `pencil`
- `pencilToLine`
- `pencilToSquare`
- `percent`
- `person`
- `personFill`
- `personGear`
- `personMagnifier`
- `personNutHex`
- `personPencil`
- `personPlanetEarth`
- `personPlus`
- `personSpeaker`
- `personWorker`
- `personXmark`
- `persons`
- `personsLock`
- `picture`
- `pill`
- `pin`
- `pinFill`
- `pinSlash`
- `pinSlashFill`
- `pipeline`
- `planetEarth`
- `play`
- `playFill`
- `plugConnection`
- `plugWire`
- `plus`
- `plusShape`
- `plusShapeFill`
- `power`
- `printer`
- `pulse`
- `puzzle`
- `qrCode`
- `quoteClose`
- `quoteOpen`
- `receipt`
- `rectanglePulse`
- `rectangles4`
- `rocket`
- `roundBrackets`
- `route`
- `sack`
- `scalesBalanced`
- `scalesUnbalanced`
- `scissors`
- `sealCheck`
- `sealPercent`
- `server`
- `shapes3`
- `shapes4`
- `shield`
- `shieldCheck`
- `shieldExclamation`
- `shieldKeyhole`
- `shoppingBag`
- `shoppingBasket`
- `shoppingCart`
- `shuffle`
- `signal`
- `skull`
- `sliders`
- `slidersVertical`
- `smartphone`
- `snail`
- `snowflake`
- `sparkles`
- `sparklesFill`
- `sphere`
- `square`
- `squareArticle`
- `squareBars`
- `squareBarsVertical`
- `squareBrackets`
- `squareBracketsBarsVertical`
- `squareBracketsLetterA`
- `squareChartBar`
- `squareChartColumn`
- `squareCheck`
- `squareDashed`
- `squareDashedCircle`
- `squareDashedLetterA`
- `squareDashedLetterT`
- `squareDashedText`
- `squareDot`
- `squareExclamation`
- `squareFill`
- `squareHashtag`
- `squareLetterP`
- `squareLetterT`
- `squareLineHorizontal`
- `squareLineVertical`
- `squareListUl`
- `squareMinus`
- `squarePlus`
- `squareXmark`
- `star`
- `starFill`
- `stethoscope`
- `sticker`
- `stop`
- `stopFill`
- `stopwatch`
- `strikethrough`
- `suitcase`
- `sun`
- `tShirt`
- `tag`
- `tagDollar`
- `tagRuble`
- `tags`
- `target`
- `targetDart`
- `terminal`
- `terminalLine`
- `text`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignRight`
- `textIndent`
- `textOutdent`
- `thumbsDown`
- `thumbsDownFill`
- `thumbsUp`
- `thumbsUp2`
- `thumbsUpFill`
- `thunderbolt`
- `thunderboltFill`
- `ticket`
- `timeline`
- `timestamps`
- `toggleOff`
- `toggleOn`
- `trafficLight`
- `trapezoidLeftLineHorizontal`
- `trapezoidUpLineVertical`
- `trashBin`
- `tray`
- `triangleDown`
- `triangleDownFill`
- `triangleExclamation`
- `triangleExclamationFill`
- `triangleLeft`
- `triangleLeftFill`
- `triangleRight`
- `triangleRightFill`
- `triangleThunderbolt`
- `triangleUp`
- `triangleUpFill`
- `trolley`
- `tv`
- `tvRetro`
- `umbrella`
- `underline`
- `vault`
- `vectorCircle`
- `vectorSquare`
- `video`
- `volume`
- `volumeFill`
- `volumeLow`
- `volumeLowFill`
- `volumeOff`
- `volumeOffFill`
- `volumeSlash`
- `volumeSlashFill`
- `volumeXmark`
- `volumeXmarkFill`
- `weightHanging`
- `wrench`
- `xmark`
- `xmarkShape`
- `xmarkShapeFill`

## Usage Examples

### Navigation Menu

```html
@js
  import { AbbrApiIcon, AbbrMlIcon, AbbrQlIcon, AbbrSqlIcon } from '@stacksjs/iconify-gravity-ui'

  global.navIcons = {
    home: AbbrApiIcon({ size: 20, class: 'nav-icon' }),
    about: AbbrMlIcon({ size: 20, class: 'nav-icon' }),
    contact: AbbrQlIcon({ size: 20, class: 'nav-icon' }),
    settings: AbbrSqlIcon({ size: 20, class: 'nav-icon' })
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
import { AbbrApiIcon } from '@stacksjs/iconify-gravity-ui'

const icon = AbbrApiIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbbrApiIcon, AbbrMlIcon, AbbrQlIcon } from '@stacksjs/iconify-gravity-ui'

const successIcon = AbbrApiIcon({ size: 16, color: '#22c55e' })
const warningIcon = AbbrMlIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AbbrQlIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbbrApiIcon, AbbrMlIcon } from '@stacksjs/iconify-gravity-ui'
   const icon = AbbrApiIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abbrApi, abbrMl } from '@stacksjs/iconify-gravity-ui'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abbrApi, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbbrApiIcon, AbbrMlIcon } from '@stacksjs/iconify-gravity-ui'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-gravity-ui'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbbrApiIcon } from '@stacksjs/iconify-gravity-ui'
     global.icon = AbbrApiIcon({ size: 24 })
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
   const icon = AbbrApiIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abbrApi } from '@stacksjs/iconify-gravity-ui'

// Icons are typed as IconData
const myIcon: IconData = abbrApi
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/gravity-ui/icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: YANDEX LLC ([Website](https://github.com/gravity-ui/icons/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gravity-ui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gravity-ui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
