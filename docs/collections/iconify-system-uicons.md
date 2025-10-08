# System UIcons

> System UIcons icons for stx from Iconify

## Overview

This package provides access to 430 icons from the System UIcons collection through the stx iconify integration.

**Collection ID:** `system-uicons`
**Total Icons:** 430
**Author:** Corey Ginnivan ([Website](https://github.com/CoreyGinnivan/system-uicons))
**License:** Unlicense ([Details](https://github.com/CoreyGinnivan/system-uicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-system-uicons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AirplayIcon height="1em" />
<AirplayIcon width="1em" height="1em" />
<AirplayIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AirplayIcon size="24" />
<AirplayIcon size="1em" />

<!-- Using width and height -->
<AirplayIcon width="24" height="32" />

<!-- With color -->
<AirplayIcon size="24" color="red" />
<AirplayIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AirplayIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AirplayIcon
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
    <AirplayIcon size="24" />
    <AlarmClockIcon size="24" color="#4a90e2" />
    <AlignHorizontalIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { airplay, alarmClock, alignHorizontal } from '@stacksjs/iconify-system-uicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(airplay, { size: 24 })
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
<AirplayIcon size="24" color="red" />
<AirplayIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AirplayIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AirplayIcon size="24" class="text-primary" />
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
<AirplayIcon height="1em" />
<AirplayIcon width="1em" height="1em" />
<AirplayIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AirplayIcon size="24" />
<AirplayIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.systemUicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirplayIcon class="systemUicons-icon" />
```

## Available Icons

This package contains **430** icons:

- `airplay`
- `alarmClock`
- `alignHorizontal`
- `alignVertical`
- `angle`
- `archive`
- `arrowBottomLeft`
- `arrowBottomRight`
- `arrowDown`
- `arrowDownCircle`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowRight`
- `arrowRightCircle`
- `arrowTopLeft`
- `arrowTopRight`
- `arrowUp`
- `arrowUpCircle`
- `audioWave`
- `backspace`
- `backward`
- `bag`
- `battery75`
- `batteryCharging`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `batteryLow`
- `bell`
- `bellDisabled`
- `bellRinging`
- `bellSnooze`
- `bluetooth`
- `book`
- `bookClosed`
- `bookText`
- `bookmark`
- `bookmarkBook`
- `box`
- `boxAdd`
- `boxDownload`
- `boxOpen`
- `boxRemove`
- `boxes`
- `branch`
- `briefcase`
- `browser`
- `browserAlt`
- `buttonAdd`
- `buttonMinus`
- `calculator`
- `calendar`
- `calendarAdd`
- `calendarDate`
- `calendarDay`
- `calendarDays`
- `calendarLastDay`
- `calendarMonth`
- `calendarMove`
- `calendarRemove`
- `calendarSplit`
- `calendarWeek`
- `camera`
- `cameraAlt`
- `cameraNoflash`
- `cameraNoflashAlt`
- `capture`
- `cardTimeline`
- `cardView`
- `carousel`
- `cart`
- `cast`
- `chain`
- `chatAdd`
- `check`
- `checkCircle`
- `checkCircleOutside`
- `checkboxChecked`
- `checkboxEmpty`
- `chevronClose`
- `chevronDown`
- `chevronDownCircle`
- `chevronDownDouble`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronLeftDouble`
- `chevronOpen`
- `chevronRight`
- `chevronRightCircle`
- `chevronRightDouble`
- `chevronUp`
- `chevronUpCircle`
- `chevronUpDouble`
- `circle`
- `circleMenu`
- `circleSplit`
- `clipboard`
- `clipboardAdd`
- `clipboardCheck`
- `clipboardCopy`
- `clipboardCross`
- `clipboardNotes`
- `clipboardRemove`
- `clock`
- `close`
- `cloud`
- `cloudDisconnect`
- `cloudDownload`
- `cloudDownloadAlt`
- `cloudUpload`
- `cloudUploadAlt`
- `code`
- `coffee`
- `coin`
- `coins`
- `compass`
- `componentAdd`
- `contacts`
- `contract`
- `create`
- `creditCard`
- `crop`
- `cross`
- `crossCircle`
- `crosshair`
- `cube`
- `cubes`
- `cylinder`
- `database`
- `diamond`
- `directions`
- `disc`
- `display`
- `displayAlt`
- `document`
- `documentJustified`
- `documentList`
- `documentStack`
- `documentWords`
- `door`
- `doorAlt`
- `download`
- `downloadAlt`
- `downward`
- `drag`
- `dragCircle`
- `dragVertical`
- `duplicate`
- `duplicateAlt`
- `enter`
- `enterAlt`
- `episodes`
- `exitLeft`
- `exitRight`
- `expand`
- `expandHeight`
- `expandWidth`
- `external`
- `eye`
- `eyeClosed`
- `eyeNo`
- `faceDelighted`
- `faceHappy`
- `faceNeutral`
- `faceSad`
- `fileDownload`
- `fileUpload`
- `filesHistory`
- `filesMulti`
- `filesStack`
- `film`
- `filter`
- `filterCircle`
- `filterSingle`
- `filtering`
- `fingerprint`
- `flag`
- `flame`
- `flameAlt`
- `flipView`
- `floppy`
- `folderAdd`
- `folderClosed`
- `folderMinus`
- `folderOpen`
- `forkGit`
- `forward`
- `frame`
- `fullscreen`
- `funnel`
- `gauge`
- `gift`
- `globe`
- `gps`
- `grab`
- `graphBar`
- `graphBox`
- `graphIncrease`
- `grid`
- `gridCircles`
- `gridCirclesAdd`
- `gridSmall`
- `gridSquares`
- `gridSquaresAdd`
- `hand`
- `harddrive`
- `hash`
- `heart`
- `heartRate`
- `heartRemove`
- `height`
- `hierarchy`
- `home`
- `homeAlt`
- `homeCheck`
- `homeDoor`
- `import`
- `inbox`
- `inboxAlt`
- `infoCircle`
- `iphoneLandscape`
- `iphonePortrait`
- `jumpBackward`
- `jumpForward`
- `jumpLeft`
- `jumpRight`
- `keyboard`
- `laptop`
- `lightbulb`
- `lightbulbOn`
- `lightning`
- `lightningAlt`
- `lineweight`
- `link`
- `linkAlt`
- `linkBroken`
- `linkHorizontal`
- `linkVertical`
- `list`
- `listAdd`
- `listNumbered`
- `loader`
- `location`
- `lock`
- `lockOpen`
- `mail`
- `mailAdd`
- `mailDelete`
- `mailMinus`
- `mailNew`
- `mailOpen`
- `mailRemove`
- `marquee`
- `maximise`
- `menuHamburger`
- `menuHorizontal`
- `menuVertical`
- `message`
- `messageWriting`
- `microphone`
- `microphoneDisabled`
- `microphoneMuted`
- `midpoint`
- `miniPlayer`
- `minimise`
- `minus`
- `minusCircle`
- `moon`
- `move`
- `newspaper`
- `noSign`
- `notebook`
- `notification`
- `nut`
- `pages`
- `panelBottom`
- `panelCenter`
- `panelLeft`
- `panelRight`
- `panelSectioned`
- `panelTop`
- `paper`
- `paperFolded`
- `paperPlane`
- `paperPlaneAlt`
- `paperclip`
- `paragraphCenter`
- `paragraphEnd`
- `paragraphLeft`
- `paragraphRight`
- `paragraphStart`
- `pen`
- `phoneLandscape`
- `phonePortrait`
- `picture`
- `pieHalf`
- `pieQuarter`
- `pieThird`
- `pill`
- `playButton`
- `plus`
- `plusCircle`
- `postcard`
- `printer`
- `projector`
- `pullDown`
- `pullLeft`
- `pullRight`
- `pullUp`
- `pushDown`
- `pushLeft`
- `pushRight`
- `pushUp`
- `questionCircle`
- `radioOn`
- `receipt`
- `record`
- `redo`
- `refresh`
- `refreshAlt`
- `replicate`
- `replicateAlt`
- `reset`
- `resetAlt`
- `resetForward`
- `resetHard`
- `resetTemporary`
- `retweet`
- `reuse`
- `reverse`
- `reverseAlt`
- `revert`
- `rocket`
- `ruler`
- `scale`
- `scaleContract`
- `scaleExtend`
- `scalpel`
- `search`
- `server`
- `settings`
- `share`
- `shareAlt`
- `shuffle`
- `sideMenu`
- `signalFull`
- `signalLow`
- `signalMedium`
- `signalNone`
- `slashBackward`
- `slashForward`
- `sliders`
- `sort`
- `sortAlt`
- `speaker`
- `speechBubble`
- `speechTyping`
- `split`
- `splitThree`
- `star`
- `sun`
- `support`
- `swap`
- `switch`
- `table`
- `tableHeader`
- `tag`
- `tagMilestone`
- `tags`
- `target`
- `terminal`
- `thread`
- `thumbsDown`
- `thumbsUp`
- `ticket`
- `timeline`
- `todo`
- `toggle`
- `toggles`
- `translate`
- `trash`
- `trashAlt`
- `trophy`
- `tvMode`
- `unarchive`
- `undo`
- `undoHistory`
- `unlinkHorizontal`
- `unlinkVertical`
- `upload`
- `uploadAlt`
- `upward`
- `user`
- `userAdd`
- `userCircle`
- `userMale`
- `userMaleCircle`
- `userRemove`
- `users`
- `venn`
- `version`
- `versions`
- `video`
- `volume0`
- `volumeAdd`
- `volumeDisabled`
- `volumeHigh`
- `volumeLow`
- `volumeMinus`
- `volumeMuted`
- `wallet`
- `warningCircle`
- `warningHex`
- `warningTriangle`
- `waves`
- `width`
- `wifi`
- `wifiError`
- `wifiNone`
- `window`
- `windowCollapseLeft`
- `windowCollapseRight`
- `windowContent`
- `wrapBack`
- `wrapForward`
- `write`
- `zoomCancel`
- `zoomIn`
- `zoomOut`
- `zoomReset`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AirplayIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlarmClockIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignHorizontalIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignVerticalIcon size="20" class="nav-icon" /> Settings</a>
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
<AirplayIcon
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
    <AirplayIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlarmClockIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignHorizontalIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirplayIcon size="24" />
   <AlarmClockIcon size="24" color="#4a90e2" />
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
   <AirplayIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AirplayIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AirplayIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { airplay } from '@stacksjs/iconify-system-uicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(airplay, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { airplay } from '@stacksjs/iconify-system-uicons'

// Icons are typed as IconData
const myIcon: IconData = airplay
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Unlicense

See [license details](https://github.com/CoreyGinnivan/system-uicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Corey Ginnivan ([Website](https://github.com/CoreyGinnivan/system-uicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/system-uicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/system-uicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
