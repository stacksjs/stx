# HeroIcons v1 Outline

> HeroIcons v1 Outline icons for stx from Iconify

## Overview

This package provides access to 385 icons from the HeroIcons v1 Outline collection through the stx iconify integration.

**Collection ID:** `heroicons-outline`
**Total Icons:** 385
**Author:** Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
**License:** MIT ([Details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-heroicons-outline
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AcademicCapIcon height="1em" />
<AcademicCapIcon width="1em" height="1em" />
<AcademicCapIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AcademicCapIcon size="24" />
<AcademicCapIcon size="1em" />

<!-- Using width and height -->
<AcademicCapIcon width="24" height="32" />

<!-- With color -->
<AcademicCapIcon size="24" color="red" />
<AcademicCapIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AcademicCapIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AcademicCapIcon
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
    <AcademicCapIcon size="24" />
    <AdjustmentsIcon size="24" color="#4a90e2" />
    <AdjustmentsHorizontalIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { academicCap, adjustments, adjustmentsHorizontal } from '@stacksjs/iconify-heroicons-outline'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(academicCap, { size: 24 })
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
<AcademicCapIcon size="24" color="red" />
<AcademicCapIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AcademicCapIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AcademicCapIcon size="24" class="text-primary" />
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
<AcademicCapIcon height="1em" />
<AcademicCapIcon width="1em" height="1em" />
<AcademicCapIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AcademicCapIcon size="24" />
<AcademicCapIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.heroiconsOutline-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AcademicCapIcon class="heroiconsOutline-icon" />
```

## Available Icons

This package contains **385** icons:

- `academicCap`
- `adjustments`
- `adjustmentsHorizontal`
- `adjustmentsVertical`
- `annotation`
- `archive`
- `archiveBox`
- `archiveBoxArrowDown`
- `archiveBoxXMark`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDown`
- `arrowDownCircle`
- `arrowDownLeft`
- `arrowDownOnSquare`
- `arrowDownOnSquareStack`
- `arrowDownRight`
- `arrowDownTray`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowLeftOnRectangle`
- `arrowLongDown`
- `arrowLongLeft`
- `arrowLongRight`
- `arrowLongUp`
- `arrowNarrowDown`
- `arrowNarrowLeft`
- `arrowNarrowRight`
- `arrowNarrowUp`
- `arrowPath`
- `arrowRight`
- `arrowRightCircle`
- `arrowRightOnRectangle`
- `arrowSmDown`
- `arrowSmLeft`
- `arrowSmRight`
- `arrowSmUp`
- `arrowTopRightOnSquare`
- `arrowTrendingDown`
- `arrowTrendingUp`
- `arrowUp`
- `arrowUpCircle`
- `arrowUpLeft`
- `arrowUpOnSquare`
- `arrowUpOnSquareStack`
- `arrowUpRight`
- `arrowUpTray`
- `arrowUturnDown`
- `arrowUturnLeft`
- `arrowUturnRight`
- `arrowUturnUp`
- `arrowsExpand`
- `arrowsPointingIn`
- `arrowsPointingOut`
- `arrowsRightLeft`
- `arrowsUpDown`
- `atSymbol`
- `backspace`
- `backward`
- `badgeCheck`
- `ban`
- `banknotes`
- `bars2`
- `bars3`
- `bars3BottomLeft`
- `bars3BottomRight`
- `bars3CenterLeft`
- `bars4`
- `beaker`
- `bell`
- `bellAlert`
- `bellSlash`
- `bellSnooze`
- `bolt`
- `boltSlash`
- `bookOpen`
- `bookmark`
- `bookmarkAlt`
- `bookmarkSlash`
- `bookmarkSquare`
- `briefcase`
- `buildingLibrary`
- `buildingOffice`
- `buildingOffice2`
- `buildingStorefront`
- `cake`
- `calculator`
- `calendar`
- `calendarDays`
- `camera`
- `cash`
- `chartBar`
- `chartBarSquare`
- `chartPie`
- `chartSquareBar`
- `chat`
- `chatAlt`
- `chatAlt2`
- `chatBubbleBottomCenter`
- `chatBubbleBottomCenterText`
- `chatBubbleLeft`
- `chatBubbleLeftEllipsis`
- `chatBubbleLeftRight`
- `chatBubbleOvalLeft`
- `chatBubbleOvalLeftEllipsis`
- `check`
- `checkBadge`
- `checkCircle`
- `chevronDoubleDown`
- `chevronDoubleLeft`
- `chevronDoubleRight`
- `chevronDoubleUp`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `chip`
- `circleStack`
- `clipboard`
- `clipboardCheck`
- `clipboardCopy`
- `clipboardDocument`
- `clipboardDocumentCheck`
- `clipboardDocumentList`
- `clipboardList`
- `clock`
- `cloud`
- `cloudArrowDown`
- `cloudArrowUp`
- `cloudDownload`
- `cloudUpload`
- `code`
- `codeBracket`
- `codeBracketSquare`
- `cog`
- `cog6Tooth`
- `cog8Tooth`
- `collection`
- `colorSwatch`
- `commandLine`
- `computerDesktop`
- `cpuChip`
- `creditCard`
- `cube`
- `cubeTransparent`
- `currencyBangladeshi`
- `currencyDollar`
- `currencyEuro`
- `currencyPound`
- `currencyRupee`
- `currencyYen`
- `cursorArrowRays`
- `cursorArrowRipple`
- `cursorClick`
- `database`
- `desktopComputer`
- `deviceMobile`
- `devicePhoneMobile`
- `deviceTablet`
- `document`
- `documentAdd`
- `documentArrowDown`
- `documentArrowUp`
- `documentChartBar`
- `documentCheck`
- `documentDownload`
- `documentDuplicate`
- `documentMagnifyingGlass`
- `documentMinus`
- `documentPlus`
- `documentRemove`
- `documentReport`
- `documentSearch`
- `documentText`
- `dotsCircleHorizontal`
- `dotsHorizontal`
- `dotsVertical`
- `download`
- `duplicate`
- `ellipsisHorizontal`
- `ellipsisHorizontalCircle`
- `ellipsisVertical`
- `emojiHappy`
- `emojiSad`
- `envelope`
- `envelopeOpen`
- `exclaimationCircle`
- `exclaimationTriangle`
- `exclamation`
- `exclamationCircle`
- `externalLink`
- `eye`
- `eyeOff`
- `eyeSlash`
- `faceFrown`
- `faceSmile`
- `fastForward`
- `film`
- `filter`
- `fingerPrint`
- `fire`
- `flag`
- `folder`
- `folderAdd`
- `folderArrowDown`
- `folderDownload`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `folderRemove`
- `forward`
- `funnel`
- `gif`
- `gift`
- `giftTop`
- `globe`
- `globeAlt`
- `globeAmericas`
- `globeAsiaAustralia`
- `globeEuropeAfrica`
- `hand`
- `handRaised`
- `handThumbDown`
- `handThumbUp`
- `hashtag`
- `heart`
- `home`
- `homeModern`
- `identification`
- `inbox`
- `inboxArrowDown`
- `inboxIn`
- `inboxStack`
- `informationCircle`
- `key`
- `language`
- `library`
- `lifebuoy`
- `lightBulb`
- `lightningBolt`
- `link`
- `listBullet`
- `locationMarker`
- `lockClosed`
- `lockOpen`
- `login`
- `logout`
- `magnifyingGlass`
- `magnifyingGlassCircle`
- `magnifyingGlassMinus`
- `magnifyingGlassPlus`
- `mail`
- `mailOpen`
- `map`
- `mapPin`
- `megaphone`
- `menu`
- `menuAlt1`
- `menuAlt2`
- `menuAlt3`
- `menuAlt4`
- `microphone`
- `minus`
- `minusCircle`
- `minusSm`
- `moon`
- `musicNote`
- `musicalNote`
- `newspaper`
- `noSymbol`
- `officeBuilding`
- `paperAirplane`
- `paperClip`
- `pause`
- `pencil`
- `pencilAlt`
- `pencilSquare`
- `phone`
- `phoneArrowDownLeft`
- `phoneArrowUpRight`
- `phoneIncoming`
- `phoneMissedCall`
- `phoneOutgoing`
- `phoneXMark`
- `photo`
- `photograph`
- `play`
- `playPause`
- `plus`
- `plusCircle`
- `plusSm`
- `presentationChartBar`
- `presentationChartLine`
- `printer`
- `puzzle`
- `puzzlePiece`
- `qrCode`
- `qrcode`
- `questionMarkCircle`
- `queueList`
- `radio`
- `receiptPercent`
- `receiptRefund`
- `receiptTax`
- `rectangleGroup`
- `rectangleStack`
- `refresh`
- `reply`
- `rewind`
- `rss`
- `save`
- `saveAs`
- `scale`
- `scissors`
- `search`
- `searchCircle`
- `selector`
- `server`
- `serverStack`
- `share`
- `shieldCheck`
- `shieldExclamation`
- `shoppingBag`
- `shoppingCart`
- `signal`
- `signalSlash`
- `sortAscending`
- `sortDescending`
- `sparkles`
- `speakerWave`
- `speakerXMark`
- `speakerphone`
- `square2Stack`
- `squares2x2`
- `squaresPlus`
- `star`
- `statusOffline`
- `statusOnline`
- `stop`
- `sun`
- `support`
- `swatch`
- `switchHorizontal`
- `switchVertical`
- `table`
- `tableCells`
- `tag`
- `template`
- `terminal`
- `thumbDown`
- `thumbUp`
- `ticket`
- `translate`
- `trash`
- `trendingDown`
- `trendingUp`
- `truck`
- `upload`
- `user`
- `userAdd`
- `userCircle`
- `userGroup`
- `userPlus`
- `userRemove`
- `users`
- `variable`
- `videoCamera`
- `videoCameraSlash`
- `viewBoards`
- `viewColumns`
- `viewGrid`
- `viewGridAdd`
- `viewList`
- `volumeOff`
- `volumeUp`
- `wifi`
- `wrench`
- `wrenchScrewdriver`
- `x`
- `xCircle`
- `xMark`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AcademicCapIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdjustmentsIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdjustmentsHorizontalIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdjustmentsVerticalIcon size="20" class="nav-icon" /> Settings</a>
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
<AcademicCapIcon
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
    <AcademicCapIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdjustmentsIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdjustmentsHorizontalIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AcademicCapIcon size="24" />
   <AdjustmentsIcon size="24" color="#4a90e2" />
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
   <AcademicCapIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AcademicCapIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AcademicCapIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { academicCap } from '@stacksjs/iconify-heroicons-outline'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(academicCap, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { academicCap } from '@stacksjs/iconify-heroicons-outline'

// Icons are typed as IconData
const myIcon: IconData = academicCap
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/heroicons-outline/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/heroicons-outline/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
