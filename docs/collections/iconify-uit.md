# Unicons Thin Line

> Unicons Thin Line icons for stx from Iconify

## Overview

This package provides access to 216 icons from the Unicons Thin Line collection through the stx iconify integration.

**Collection ID:** `uit`
**Total Icons:** 216
**Author:** Iconscout ([Website](https://github.com/Iconscout/unicons))
**License:** Apache 2.0 ([Details](https://github.com/Iconscout/unicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uit
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdobeAltIcon, AirplayIcon, AlignAltIcon } from '@stacksjs/iconify-uit'

// Basic usage
const icon = AdobeAltIcon()

// With size
const sizedIcon = AdobeAltIcon({ size: 24 })

// With color
const coloredIcon = AirplayIcon({ color: 'red' })

// With multiple props
const customIcon = AlignAltIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdobeAltIcon, AirplayIcon, AlignAltIcon } from '@stacksjs/iconify-uit'

  global.icons = {
    home: AdobeAltIcon({ size: 24 }),
    user: AirplayIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignAltIcon({ size: 32 })
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
import { adobeAlt, airplay, alignAlt } from '@stacksjs/iconify-uit'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adobeAlt, { size: 24 })
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
const redIcon = AdobeAltIcon({ color: 'red' })
const blueIcon = AdobeAltIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdobeAltIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdobeAltIcon({ class: 'text-primary' })
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
const icon24 = AdobeAltIcon({ size: 24 })
const icon1em = AdobeAltIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdobeAltIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdobeAltIcon({ height: '1em' })
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
const smallIcon = AdobeAltIcon({ class: 'icon-small' })
const largeIcon = AdobeAltIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **216** icons:

- `adobeAlt`
- `airplay`
- `alignAlt`
- `alignCenter`
- `alignCenterAlt`
- `alignCenterJustify`
- `alignLeft`
- `alignLeftJustify`
- `alignLetterRight`
- `alignRight`
- `alignRightJustify`
- `anchor`
- `androidAlt`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleUp`
- `ankh`
- `appleAlt`
- `arrowCircleDown`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleUp`
- `arrowDownLeft`
- `arrowDownRight`
- `arrowUpLeft`
- `arrowUpRight`
- `at`
- `bag`
- `batteryBolt`
- `batteryEmpty`
- `behanceAlt`
- `bitcoinAlt`
- `bloggerAlt`
- `bookmark`
- `borderAlt`
- `borderBottom`
- `borderClear`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderOut`
- `borderTop`
- `borderVertical`
- `calendar`
- `calender`
- `chartGrowth`
- `chartPie`
- `check`
- `checkCircle`
- `checkSquare`
- `circleLayer`
- `circuit`
- `clinicMedical`
- `clock`
- `clockEight`
- `clockFive`
- `clockNine`
- `clockSeven`
- `clockTen`
- `clockThree`
- `clockTwo`
- `columns`
- `commentDots`
- `compress`
- `cornerDownLeft`
- `cornerDownRight`
- `cornerLeftDown`
- `cornerRightDown`
- `cornerUpLeft`
- `cornerUpRight`
- `covid19`
- `createDashboard`
- `desktopAltSlash`
- `dialpad`
- `direction`
- `documentLayoutCenter`
- `documentLayoutLeft`
- `documentLayoutRight`
- `downloadAlt`
- `dropbox`
- `ellipsisH`
- `ellipsisV`
- `exclamationCircle`
- `exclamationOctagon`
- `exclamationTriangle`
- `facebookF`
- `facebookMessengerAlt`
- `favorite`
- `flipH`
- `flipHAlt`
- `flipV`
- `flipVAlt`
- `githubAlt`
- `gold`
- `google`
- `googleDriveAlt`
- `googleHangoutsAlt`
- `googlePlay`
- `grid`
- `grids`
- `gripHorizontalLine`
- `headSide`
- `headSideCough`
- `headSideMask`
- `history`
- `historyAlt`
- `horizontalAlignLeft`
- `hospital`
- `hospitalSquareSign`
- `hospitalSymbol`
- `houseUser`
- `html3Alt`
- `imageV`
- `intercomAlt`
- `keySkeleton`
- `keySkeletonAlt`
- `laptop`
- `layerGroup`
- `layersAlt`
- `leftIndent`
- `leftIndentAlt`
- `lineSpacing`
- `linkBroken`
- `linkH`
- `linkedinAlt`
- `listUiAlt`
- `listUl`
- `masterCard`
- `microscope`
- `minusSquareFull`
- `modem`
- `mouseAlt2`
- `multiply`
- `objectGroup`
- `objectUngroup`
- `operaAlt`
- `paperclip`
- `paragraph`
- `paypal`
- `pentagon`
- `polygon`
- `previous`
- `print`
- `process`
- `pump`
- `questionCircle`
- `recordAudio`
- `redditAlienAlt`
- `redo`
- `refresh`
- `repeat`
- `rightIndent`
- `rightIndentAlt`
- `rocket`
- `ruler`
- `rulerCombined`
- `sanitizer`
- `sanitizerAlt`
- `scenery`
- `shield`
- `shieldCheck`
- `shieldExclamation`
- `shieldPlus`
- `shieldQuestion`
- `shieldSlash`
- `signalAlt`
- `signalAlt3`
- `signout`
- `simCard`
- `skypeAlt`
- `slackAlt`
- `snapchatAlt`
- `socialDistancing`
- `socialMediaLogo`
- `spaceKey`
- `squareFull`
- `star`
- `starHalfAlt`
- `stepForward`
- `stethoscope`
- `stethoscopeAlt`
- `stopwatch`
- `storeSlash`
- `subject`
- `syncExclamation`
- `syncSlash`
- `table`
- `telegramAlt`
- `th`
- `thLarge`
- `timesCircle`
- `toggleOff`
- `toggleOn`
- `toiletPaper`
- `trafficLight`
- `triangle`
- `tumblrAlt`
- `twitterAlt`
- `umbrella`
- `uploadAlt`
- `userArrows`
- `vectorSquare`
- `vectorSquareAlt`
- `vkAlt`
- `vuejsAlt`
- `wallet`
- `webGrid`
- `webGridAlt`
- `webSection`
- `webSectionAlt`
- `windowGrid`
- `windowMaximize`
- `windowSection`
- `wrapText`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdobeAltIcon, AirplayIcon, AlignAltIcon, AlignCenterIcon } from '@stacksjs/iconify-uit'

  global.navIcons = {
    home: AdobeAltIcon({ size: 20, class: 'nav-icon' }),
    about: AirplayIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignAltIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignCenterIcon({ size: 20, class: 'nav-icon' })
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
import { AdobeAltIcon } from '@stacksjs/iconify-uit'

const icon = AdobeAltIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdobeAltIcon, AirplayIcon, AlignAltIcon } from '@stacksjs/iconify-uit'

const successIcon = AdobeAltIcon({ size: 16, color: '#22c55e' })
const warningIcon = AirplayIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignAltIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdobeAltIcon, AirplayIcon } from '@stacksjs/iconify-uit'
   const icon = AdobeAltIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adobeAlt, airplay } from '@stacksjs/iconify-uit'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adobeAlt, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdobeAltIcon, AirplayIcon } from '@stacksjs/iconify-uit'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-uit'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdobeAltIcon } from '@stacksjs/iconify-uit'
     global.icon = AdobeAltIcon({ size: 24 })
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
   const icon = AdobeAltIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adobeAlt } from '@stacksjs/iconify-uit'

// Icons are typed as IconData
const myIcon: IconData = adobeAlt
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Iconscout/unicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Iconscout ([Website](https://github.com/Iconscout/unicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uit/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uit/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
