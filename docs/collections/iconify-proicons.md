# ProIcons

> ProIcons icons for stx from Iconify

## Overview

This package provides access to 529 icons from the ProIcons collection through the stx iconify integration.

**Collection ID:** `proicons`
**Total Icons:** 529
**Author:** ProCode ([Website](https://github.com/ProCode-Software/proicons))
**License:** MIT ([Details](https://github.com/ProCode-Software/proicons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-proicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AddIcon, AddCircleIcon } from '@stacksjs/iconify-proicons'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AddIcon({ color: 'red' })

// With multiple props
const customIcon = AddCircleIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AddIcon, AddCircleIcon } from '@stacksjs/iconify-proicons'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AddIcon({ size: 24, color: '#4a90e2' }),
    settings: AddCircleIcon({ size: 32 })
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
import { accessibility, add, addCircle } from '@stacksjs/iconify-proicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **529** icons:

- `accessibility`
- `add`
- `addCircle`
- `addRhombus`
- `addSquare`
- `addSquareMultiple`
- `airplane`
- `airplaneLanding`
- `airplaneTakeoff`
- `alarmClock`
- `album`
- `alertCircle`
- `alertRhombus`
- `alertTriangle`
- `alignBottom`
- `alignHorizontalCenters`
- `alignLeft`
- `alignRight`
- `alignTop`
- `alignVerticalCenters`
- `amazon`
- `anchor`
- `android`
- `angle`
- `appRemove`
- `appStore`
- `apple`
- `apps`
- `appsAdd`
- `arc`
- `archive`
- `archiveAdd2`
- `arrowClockwise`
- `arrowCounterclockwise`
- `arrowDown`
- `arrowDownload`
- `arrowEnter`
- `arrowExport`
- `arrowForward`
- `arrowImport`
- `arrowLeft`
- `arrowLeftRight`
- `arrowMaximize`
- `arrowMinimize`
- `arrowMove`
- `arrowRedo`
- `arrowRedo2`
- `arrowReply`
- `arrowRight`
- `arrowRotateClockwise`
- `arrowRotateCounterclockwise`
- `arrowSort`
- `arrowSwap`
- `arrowSync`
- `arrowSync2`
- `arrowTrending`
- `arrowUndo`
- `arrowUndo2`
- `arrowUp`
- `arrowUpDown`
- `arrowUpload`
- `asterisk`
- `attach`
- `backgroundColor`
- `backgroundColorAccent`
- `backspace`
- `badge`
- `bank`
- `barChart`
- `barGraph`
- `basketball`
- `battery`
- `batteryFull`
- `beach`
- `beaker`
- `bell`
- `bellDot`
- `bellOff`
- `bluesky`
- `bluetooth`
- `board`
- `bolt`
- `book`
- `book2`
- `bookAdd`
- `bookAdd2`
- `bookInfo`
- `bookInfo2`
- `bookLetter`
- `bookMarked`
- `bookOpen`
- `bookmark`
- `bookmarkAdd`
- `bookmarkMultiple`
- `bookmarkMultipleVar`
- `borderAll`
- `box`
- `boxAdd`
- `braces`
- `bracesVariable`
- `brackets`
- `branch`
- `branchCompare`
- `branchFork`
- `branchFork2`
- `branchPullRequest`
- `briefcase`
- `briefcase2`
- `brightness`
- `broom`
- `bug`
- `bugAdd`
- `bugPlay`
- `buildingMultiple`
- `bulletList`
- `bulletListSquare`
- `bulletListSquareAdd`
- `bulletListTree`
- `button`
- `cake`
- `calculator`
- `calendar`
- `call`
- `callEnd`
- `calligraphyPen`
- `camera`
- `cancel`
- `cancelCircle`
- `cancelOctagon`
- `cancelSquare`
- `candy`
- `cart`
- `cent`
- `centerHorizontal`
- `centerVertical`
- `chat`
- `chatQuestion`
- `checkboxChecked`
- `checkboxIndeterminate`
- `checkboxIndeterminate2`
- `checkboxList`
- `checkboxUnchecked`
- `checkmark`
- `checkmarkCircle`
- `checkmarkStarburst`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chromeRestore`
- `chromeRestoreVar`
- `circle`
- `circleSmall`
- `clipboard`
- `clipboardPaste`
- `clipboardSearch`
- `clock`
- `closedCaptions`
- `cloud`
- `cloudAdd`
- `cloudArrowDown`
- `cloudArrowUp`
- `cloudOff`
- `code`
- `codeSquare`
- `coffeeHot`
- `colorPalette`
- `comment`
- `commentAdd`
- `commentAdd2`
- `commentExclamation`
- `commentMultiple`
- `compareSize`
- `compass`
- `component`
- `compose`
- `computer`
- `computerMac`
- `cone`
- `contractDown`
- `cookies`
- `copy`
- `copyVar`
- `copyleft`
- `copyright`
- `cornerRadius`
- `creditCard`
- `crop`
- `css`
- `css2`
- `cube`
- `cursor`
- `cursorClick`
- `cursorDrag`
- `cut`
- `cylinder`
- `darkTheme`
- `database`
- `databaseAdd`
- `delete`
- `diamond`
- `diff`
- `directions`
- `doNotDisturb`
- `document`
- `dollar`
- `dollarCircle`
- `door`
- `doorOpen`
- `dotCircle`
- `dotSquare`
- `drawText`
- `drop`
- `emoji`
- `emojiFrown`
- `emojiGrin`
- `emojiLaughter`
- `eraser`
- `eraserSparkle`
- `exclamationMark`
- `expand`
- `extension`
- `eye`
- `eyeOff`
- `eyedropper`
- `eyedropperColor`
- `eyedropperColorAccent`
- `facebook`
- `fastForward`
- `figma`
- `file`
- `fileAdd`
- `fileMultiple`
- `fileSync`
- `fileText`
- `filter`
- `filter2`
- `filterCancel`
- `filterCancel2`
- `flag`
- `flag2`
- `flashlight`
- `foldableHorizontal`
- `foldableHorizontalHalf`
- `foldableVertical`
- `foldableVerticalHalf`
- `folder`
- `folderAdd`
- `folderMultiple`
- `folderOpen`
- `fullScreenMaximize`
- `fullScreenMinimize`
- `game`
- `gift`
- `gitCommit`
- `github`
- `gitlab`
- `globe`
- `google`
- `google2`
- `googleChrome`
- `googlePlay`
- `graph`
- `grid`
- `gridDots`
- `hamburger`
- `hand`
- `hardDrive`
- `hash`
- `hatGraduation`
- `headphones`
- `headphonesOff`
- `heart`
- `heartStylistic`
- `hexagon`
- `highlighter`
- `highlighterAccent`
- `history`
- `home`
- `home2`
- `hourglass`
- `html`
- `infinity`
- `info`
- `infoSquare`
- `instagram`
- `javascript`
- `keyboard`
- `keyboardCommand`
- `keyboardShift`
- `kotlin`
- `laptop`
- `layers`
- `layout`
- `leaf`
- `leafThree`
- `leafTwo`
- `library`
- `lightbulb`
- `lineDiagonal`
- `link`
- `linux`
- `location`
- `lock`
- `lockOpen`
- `magnet`
- `mail`
- `mailOpen`
- `map`
- `mask`
- `math`
- `megaphone`
- `megaphoneLoud`
- `mention`
- `menu`
- `microphone`
- `microphoneOff`
- `microsoft`
- `microsoftEdge`
- `moon`
- `more`
- `moreVertical`
- `motherboard`
- `movie`
- `musicNote`
- `musicNote2`
- `narrator`
- `nodejs`
- `note`
- `noteAdd`
- `npm`
- `octagon`
- `open`
- `openSource`
- `openai`
- `pageMargins`
- `paintBucket`
- `paintBucketAccent`
- `paintbrush`
- `paintbrush2`
- `paintbrush2Sparkle`
- `panelBottom`
- `panelBottomOpen`
- `panelLeft`
- `panelLeftContract`
- `panelLeftExpand`
- `panelLeftOpen`
- `panelRight`
- `panelRightContract`
- `panelRightExpand`
- `panelRightOpen`
- `parentheses`
- `pause`
- `pdf`
- `pdf2`
- `pencil`
- `pencilSparkle`
- `pentagon`
- `person`
- `person2`
- `personAdd`
- `personAdd2`
- `personCircle`
- `personMultiple`
- `phone`
- `phoneAccept`
- `phoneHangUp`
- `photo`
- `photoAdd`
- `photoFilter`
- `photoMultiple`
- `photoSparkle`
- `pictureInPicture`
- `pictureInPicture2`
- `pictureInPictureEnter`
- `pictureInPictureExit`
- `pieChart`
- `pin`
- `pinOff`
- `play`
- `playCircle`
- `power`
- `printer`
- `prohibited`
- `python`
- `qrCode`
- `question`
- `questionCircle`
- `quote`
- `reactjs`
- `record`
- `recordStop`
- `rectangleWide`
- `regularExpression`
- `reverse`
- `rhombus`
- `ribbon`
- `ribbonStar`
- `roadBarrier`
- `roadCone`
- `roblox`
- `ruler`
- `rulerDiagonal`
- `save`
- `saveMultiple`
- `savePencil`
- `screenSize`
- `script`
- `script2`
- `search`
- `searchCancel`
- `sectionBreak`
- `send`
- `server`
- `settings`
- `shapeDifference`
- `shapeIntersect`
- `shapeSubtract`
- `shapeUnion`
- `shield`
- `shieldCancel`
- `shieldCheckmark`
- `shieldKeyhole`
- `skull`
- `slashSquare`
- `soundwave`
- `spacebar`
- `sparkle`
- `sparkle2`
- `spinner`
- `splitHorizontal`
- `splitVertical`
- `square`
- `squareDrag`
- `squareMargins`
- `star`
- `strokeThickness`
- `subtract`
- `subtractSquare`
- `subtractSquareMultiple`
- `svelte`
- `symbols`
- `table`
- `tableSimple`
- `tablet`
- `tag`
- `tagAccent`
- `tagAdd`
- `tagMultiple`
- `tagMultipleVar`
- `tagRemove`
- `target`
- `taskList`
- `terminal`
- `text`
- `textAdd`
- `textAlignCenter`
- `textAlignJustify`
- `textAlignLeft`
- `textAlignRight`
- `textBold`
- `textCaseLowercase`
- `textCaseTitle`
- `textCaseUppercase`
- `textClearFormatting`
- `textCollapse`
- `textColor`
- `textColorAccent`
- `textDescription`
- `textEditStyle`
- `textEffects`
- `textExpand`
- `textFont`
- `textFontSize`
- `textFootnote`
- `textHighlightColor`
- `textHighlightColorAccent`
- `textIndentDecrease`
- `textIndentIncrease`
- `textItalic`
- `textLarge`
- `textLetterSpacing`
- `textLineHeight`
- `textLineSpacing`
- `textNumberList`
- `textPositionBottom`
- `textPositionMiddle`
- `textPositionTop`
- `textSmall`
- `textStrikethrough`
- `textSubscript`
- `textSuperscript`
- `textTypography`
- `textUnderline`
- `thumbsDown`
- `thumbsUp`
- `tiktok`
- `timer`
- `timerOff`
- `toolbox`
- `toyBrick`
- `treasureChest`
- `triangle`
- `tune`
- `tv`
- `typescript`
- `ubuntu`
- `vehicleCar`
- `video`
- `videoClip`
- `visualStudioCode`
- `volume`
- `volumeLow`
- `volumeMute`
- `vuejs`
- `watch`
- `weatherCloudy`
- `webpack`
- `wiFi`
- `window`
- `windowAdd`
- `windowMultiple`
- `windowMultipleVar`
- `wrench`
- `xTwitter`
- `youtube`
- `youtubeShorts`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccessibilityIcon, AddIcon, AddCircleIcon, AddRhombusIcon } from '@stacksjs/iconify-proicons'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AddIcon({ size: 20, class: 'nav-icon' }),
    contact: AddCircleIcon({ size: 20, class: 'nav-icon' }),
    settings: AddRhombusIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-proicons'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AddIcon, AddCircleIcon } from '@stacksjs/iconify-proicons'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddCircleIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AddIcon } from '@stacksjs/iconify-proicons'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, add } from '@stacksjs/iconify-proicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AddIcon } from '@stacksjs/iconify-proicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-proicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-proicons'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-proicons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/ProCode-Software/proicons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: ProCode ([Website](https://github.com/ProCode-Software/proicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/proicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/proicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
