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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />

<!-- Using width and height -->
<AccessibilityIcon width="24" height="32" />

<!-- With color -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessibilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessibilityIcon
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
    <AccessibilityIcon size="24" />
    <AddIcon size="24" color="#4a90e2" />
    <AddCircleIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessibilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessibilityIcon size="24" class="text-primary" />
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
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.proicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessibilityIcon class="proicons-icon" />
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
<nav>
  <a href="/"><AccessibilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddCircleIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddRhombusIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessibilityIcon
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
    <AccessibilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddCircleIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessibilityIcon size="24" />
   <AddIcon size="24" color="#4a90e2" />
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
   <AccessibilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessibilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessibilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-proicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
