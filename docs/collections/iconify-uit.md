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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdobeAltIcon height="1em" />
<AdobeAltIcon width="1em" height="1em" />
<AdobeAltIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdobeAltIcon size="24" />
<AdobeAltIcon size="1em" />

<!-- Using width and height -->
<AdobeAltIcon width="24" height="32" />

<!-- With color -->
<AdobeAltIcon size="24" color="red" />
<AdobeAltIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdobeAltIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdobeAltIcon
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
    <AdobeAltIcon size="24" />
    <AirplayIcon size="24" color="#4a90e2" />
    <AlignAltIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AdobeAltIcon size="24" color="red" />
<AdobeAltIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdobeAltIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdobeAltIcon size="24" class="text-primary" />
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
<AdobeAltIcon height="1em" />
<AdobeAltIcon width="1em" height="1em" />
<AdobeAltIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdobeAltIcon size="24" />
<AdobeAltIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.uit-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdobeAltIcon class="uit-icon" />
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
<nav>
  <a href="/"><AdobeAltIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignAltIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignCenterIcon size="20" class="nav-icon" /> Settings</a>
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
<AdobeAltIcon
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
    <AdobeAltIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AirplayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignAltIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdobeAltIcon size="24" />
   <AirplayIcon size="24" color="#4a90e2" />
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
   <AdobeAltIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdobeAltIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdobeAltIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adobeAlt } from '@stacksjs/iconify-uit'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adobeAlt, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
