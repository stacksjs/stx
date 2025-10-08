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
    <AlignAltIcon size="24" color="#4a90e2" />
    <AlignCenterIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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
.uis-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AirplayIcon class="uis-icon" />
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
<nav>
  <a href="/"><AirplayIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlignAltIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignCenterIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignCenterJustifyIcon size="20" class="nav-icon" /> Settings</a>
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
    <AlignAltIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignCenterIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AirplayIcon size="24" />
   <AlignAltIcon size="24" color="#4a90e2" />
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
     import { airplay } from '@stacksjs/iconify-uis'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(airplay, { size: 24 })
   @endjs

   {!! customIcon !!}
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
