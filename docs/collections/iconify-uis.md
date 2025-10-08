# Unicons Solid

> Unicons Solid icons for stx from Iconify

## Overview

This package provides access to 190 icons from the Unicons Solid collection through the stx iconify integration.

**Collection ID:** `uis`
**Total Icons:** 190
**Author:** Iconscout ([Website](https://github.com/Iconscout/unicons))
**License:** Apache 2.0 ([Details](https://github.com/Iconscout/unicons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-uis
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AirplayIcon, AlignAltIcon, AlignCenterIcon } from '@stacksjs/iconify-uis'

// Basic usage
const icon = AirplayIcon()

// With size
const sizedIcon = AirplayIcon({ size: 24 })

// With color
const coloredIcon = AlignAltIcon({ color: 'red' })

// With multiple props
const customIcon = AlignCenterIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AirplayIcon, AlignAltIcon, AlignCenterIcon } from '@stacksjs/iconify-uis'

  global.icons = {
    home: AirplayIcon({ size: 24 }),
    user: AlignAltIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignCenterIcon({ size: 32 })
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
import { airplay, alignAlt, alignCenter } from '@stacksjs/iconify-uis'
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

```typescript
// Via color property
const redIcon = AirplayIcon({ color: 'red' })
const blueIcon = AirplayIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AirplayIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AirplayIcon({ class: 'text-primary' })
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
const icon24 = AirplayIcon({ size: 24 })
const icon1em = AirplayIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AirplayIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AirplayIcon({ height: '1em' })
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
const smallIcon = AirplayIcon({ class: 'icon-small' })
const largeIcon = AirplayIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **190** icons:

- `airplay`
- `alignAlt`
- `alignCenter`
- `alignCenterJustify`
- `alignJustify`
- `alignLeft`
- `alignLeftJustify`
- `alignLetterRight`
- `alignRight`
- `alignRightJustify`
- `analysis`
- `analytics`
- `anchor`
- `angleDoubleDown`
- `angleDoubleLeft`
- `angleDoubleRight`
- `angleDoubleUp`
- `angleDown`
- `angleLeft`
- `angleRight`
- `angleRightB`
- `angleUp`
- `apps`
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
- `bars`
- `batteryBolt`
- `batteryEmpty`
- `bookmark`
- `borderAlt`
- `borderBottom`
- `borderClear`
- `borderHorizontal`
- `borderInner`
- `borderLeft`
- `borderOut`
- `borderRight`
- `borderTop`
- `borderVertical`
- `briefcase`
- `calendar`
- `calender`
- `chart`
- `chartPie`
- `check`
- `checkCircle`
- `checkSquare`
- `circleLayer`
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
- `coronavirus`
- `dialpad`
- `direction`
- `documentLayoutCenter`
- `documentLayoutLeft`
- `documentLayoutRight`
- `downloadAlt`
- `ellipsisH`
- `ellipsisV`
- `exclamationCircle`
- `exclamationOctagon`
- `exclamationTriangle`
- `favorite`
- `flipH`
- `flipHAlt`
- `flipV`
- `flipVAlt`
- `graphBar`
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
- `imageV`
- `keySkeleton`
- `keySkeletonAlt`
- `keyholeCircle`
- `keyholeSquare`
- `keyholeSquareFull`
- `layerGroup`
- `layersAlt`
- `leftIndent`
- `leftIndentAlt`
- `lineSpacing`
- `linkH`
- `listUiAlt`
- `listUl`
- `lock`
- `lockAccess`
- `lockAlt`
- `lockOpenAlt`
- `microscope`
- `minusSquareFull`
- `multiply`
- `objectGroup`
- `objectUngroup`
- `padlock`
- `paperclip`
- `paragraph`
- `pentagon`
- `polygon`
- `previous`
- `process`
- `recordAudio`
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
- `schedule`
- `shieldPlus`
- `signalAlt`
- `signalAlt3`
- `signout`
- `socialDistancing`
- `sorting`
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
- `thLarge`
- `timesCircle`
- `toggleOff`
- `toggleOn`
- `toiletPaper`
- `triangle`
- `unlock`
- `unlockAlt`
- `uploadAlt`
- `userArrows`
- `userMd`
- `userNurse`
- `vectorSquare`
- `vectorSquareAlt`
- `virusSlash`
- `webGrid`
- `webGridAlt`
- `webSection`
- `webSectionAlt`
- `windowGrid`
- `windowMaximize`
- `windowSection`
- `wrapText`

## Usage Examples

### Navigation Menu

```html
@js
  import { AirplayIcon, AlignAltIcon, AlignCenterIcon, AlignCenterJustifyIcon } from '@stacksjs/iconify-uis'

  global.navIcons = {
    home: AirplayIcon({ size: 20, class: 'nav-icon' }),
    about: AlignAltIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignCenterIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignCenterJustifyIcon({ size: 20, class: 'nav-icon' })
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
import { AirplayIcon } from '@stacksjs/iconify-uis'

const icon = AirplayIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AirplayIcon, AlignAltIcon, AlignCenterIcon } from '@stacksjs/iconify-uis'

const successIcon = AirplayIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlignAltIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignCenterIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AirplayIcon, AlignAltIcon } from '@stacksjs/iconify-uis'
   const icon = AirplayIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { airplay, alignAlt } from '@stacksjs/iconify-uis'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(airplay, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AirplayIcon, AlignAltIcon } from '@stacksjs/iconify-uis'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-uis'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AirplayIcon } from '@stacksjs/iconify-uis'
     global.icon = AirplayIcon({ size: 24 })
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
   const icon = AirplayIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { airplay } from '@stacksjs/iconify-uis'

// Icons are typed as IconData
const myIcon: IconData = airplay
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/uis/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/uis/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
