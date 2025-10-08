# HeroIcons v1 Solid

> HeroIcons v1 Solid icons for stx from Iconify

## Overview

This package provides access to 387 icons from the HeroIcons v1 Solid collection through the stx iconify integration.

**Collection ID:** `heroicons-solid`
**Total Icons:** 387
**Author:** Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
**License:** MIT ([Details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-heroicons-solid
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AcademicCapIcon, AdjustmentsIcon, AdjustmentsHorizontalIcon } from '@stacksjs/iconify-heroicons-solid'

// Basic usage
const icon = AcademicCapIcon()

// With size
const sizedIcon = AcademicCapIcon({ size: 24 })

// With color
const coloredIcon = AdjustmentsIcon({ color: 'red' })

// With multiple props
const customIcon = AdjustmentsHorizontalIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AcademicCapIcon, AdjustmentsIcon, AdjustmentsHorizontalIcon } from '@stacksjs/iconify-heroicons-solid'

  global.icons = {
    home: AcademicCapIcon({ size: 24 }),
    user: AdjustmentsIcon({ size: 24, color: '#4a90e2' }),
    settings: AdjustmentsHorizontalIcon({ size: 32 })
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
import { academicCap, adjustments, adjustmentsHorizontal } from '@stacksjs/iconify-heroicons-solid'
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

```typescript
// Via color property
const redIcon = AcademicCapIcon({ color: 'red' })
const blueIcon = AcademicCapIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AcademicCapIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AcademicCapIcon({ class: 'text-primary' })
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
const icon24 = AcademicCapIcon({ size: 24 })
const icon1em = AcademicCapIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AcademicCapIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AcademicCapIcon({ height: '1em' })
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
const smallIcon = AcademicCapIcon({ class: 'icon-small' })
const largeIcon = AcademicCapIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **387** icons:

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
- `barsArrowDown`
- `barsArrowUp`
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
- `chevronUpDown`
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
- `exclamation`
- `exclamationCircle`
- `exclamationTriangle`
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
@js
  import { AcademicCapIcon, AdjustmentsIcon, AdjustmentsHorizontalIcon, AdjustmentsVerticalIcon } from '@stacksjs/iconify-heroicons-solid'

  global.navIcons = {
    home: AcademicCapIcon({ size: 20, class: 'nav-icon' }),
    about: AdjustmentsIcon({ size: 20, class: 'nav-icon' }),
    contact: AdjustmentsHorizontalIcon({ size: 20, class: 'nav-icon' }),
    settings: AdjustmentsVerticalIcon({ size: 20, class: 'nav-icon' })
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
import { AcademicCapIcon } from '@stacksjs/iconify-heroicons-solid'

const icon = AcademicCapIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AcademicCapIcon, AdjustmentsIcon, AdjustmentsHorizontalIcon } from '@stacksjs/iconify-heroicons-solid'

const successIcon = AcademicCapIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdjustmentsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdjustmentsHorizontalIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AcademicCapIcon, AdjustmentsIcon } from '@stacksjs/iconify-heroicons-solid'
   const icon = AcademicCapIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { academicCap, adjustments } from '@stacksjs/iconify-heroicons-solid'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(academicCap, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AcademicCapIcon, AdjustmentsIcon } from '@stacksjs/iconify-heroicons-solid'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-heroicons-solid'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AcademicCapIcon } from '@stacksjs/iconify-heroicons-solid'
     global.icon = AcademicCapIcon({ size: 24 })
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
   const icon = AcademicCapIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { academicCap } from '@stacksjs/iconify-heroicons-solid'

// Icons are typed as IconData
const myIcon: IconData = academicCap
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Refactoring UI Inc ([Website](https://github.com/tailwindlabs/heroicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/heroicons-solid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/heroicons-solid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
