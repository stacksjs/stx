# Cuida Icons

> Cuida Icons icons for stx from Iconify

## Overview

This package provides access to 182 icons from the Cuida Icons collection through the stx iconify integration.

**Collection ID:** `cuida`
**Total Icons:** 182
**Author:** Sysvale ([Website](https://github.com/Sysvale/cuida-icons))
**License:** Apache 2.0 ([Details](https://github.com/Sysvale/cuida-icons/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cuida
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AlertOutlineIcon height="1em" />
<AlertOutlineIcon width="1em" height="1em" />
<AlertOutlineIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AlertOutlineIcon size="24" />
<AlertOutlineIcon size="1em" />

<!-- Using width and height -->
<AlertOutlineIcon width="24" height="32" />

<!-- With color -->
<AlertOutlineIcon size="24" color="red" />
<AlertOutlineIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AlertOutlineIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AlertOutlineIcon
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
    <AlertOutlineIcon size="24" />
    <AmbulanceOutlineIcon size="24" color="#4a90e2" />
    <ArrowDownCircleOutlineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { alertOutline, ambulanceOutline, arrowDownCircleOutline } from '@stacksjs/iconify-cuida'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(alertOutline, { size: 24 })
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
<AlertOutlineIcon size="24" color="red" />
<AlertOutlineIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AlertOutlineIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AlertOutlineIcon size="24" class="text-primary" />
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
<AlertOutlineIcon height="1em" />
<AlertOutlineIcon width="1em" height="1em" />
<AlertOutlineIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AlertOutlineIcon size="24" />
<AlertOutlineIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.cuida-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AlertOutlineIcon class="cuida-icon" />
```

## Available Icons

This package contains **182** icons:

- `alertOutline`
- `ambulanceOutline`
- `arrowDownCircleOutline`
- `arrowDownOutline`
- `arrowLeftCircleOutline`
- `arrowLeftOutline`
- `arrowRightCircleOutline`
- `arrowRightOutline`
- `arrowUpCircleOutline`
- `arrowUpOutline`
- `atOutline`
- `attachmentClipOutline`
- `bedOutiline`
- `blockOutline`
- `boltOutline`
- `bookmarkOutline`
- `boxOutline`
- `briefcaseOutline`
- `buildingOutline`
- `bulletListOutline`
- `bullseyeOutline`
- `calendarClearOutline`
- `calendarOutline`
- `caretDownOutline`
- `caretLeftOutline`
- `caretRightOutline`
- `caretUpOutline`
- `chartColumnOutline`
- `chatbubbleOutline`
- `chatbubblesOutline`
- `checkCircleOutline`
- `checkOutline`
- `checkboxCheckedOutlined`
- `checkboxUncheckedOutlined`
- `clipboardOutline`
- `clipboardTextOutline`
- `clockOutline`
- `copyOutline`
- `dashboardOutline`
- `dividerOutline`
- `documentOutline`
- `documentTextOutline`
- `documentTextsOutline`
- `downloadCloudOutline`
- `downloadOutline`
- `dropdownOutline`
- `editOutline`
- `expandOutline`
- `figmaLogoOutline`
- `filterOutline`
- `fireOutline`
- `flagOutline`
- `folderOpenOutline`
- `folderOutline`
- `framerLogoOutline`
- `funnelOutline`
- `githubLogoOutline`
- `gitlabLogoOutline`
- `gridOutline`
- `hashtagOutline`
- `heading1Outline`
- `heading2Outline`
- `heading3Outline`
- `headphoneOutline`
- `headsetOutline`
- `heartRateOutline`
- `helpOutline`
- `historyOutline`
- `homeOutline`
- `imageOutline`
- `infoOutline`
- `keyOutline`
- `lampOnOutline`
- `lampOutline`
- `layersOutline`
- `lifebuoyOutline`
- `linkOutline`
- `listOutline`
- `loadingLeftOutline`
- `loadingRightOutline`
- `lockOutline`
- `loginOutline`
- `logoutOutline`
- `longTextOutline`
- `loopOutline`
- `mailOutline`
- `mapOutline`
- `mapPinOutline`
- `maximizeOutline`
- `medicineOutline`
- `menuOutline`
- `minimizeOutline`
- `minusCircleOutline`
- `minusOutline`
- `monitorOutline`
- `moonOutline`
- `moreHorizontalOutline`
- `moreVerticalOutline`
- `mouseOutline`
- `moveOutline`
- `notificationBellOutline`
- `notificationBellTimerOutline`
- `numberOutline`
- `openBookOutline`
- `openInNewTabOutline`
- `packageOutline`
- `paragraphOutline`
- `pauseCircleOutline`
- `pauseOutline`
- `phoneOutline`
- `pieChartOutline`
- `pinFill`
- `pinOutline`
- `playCircleOutline`
- `playOutline`
- `plusCircleOutline`
- `plusOutline`
- `powerOutline`
- `printerOutline`
- `radarOutline`
- `refreshOutline`
- `rendoOutline`
- `reorderOutline`
- `rotateLeftOutline`
- `rotateRightOutline`
- `sampleContainerOutline`
- `scopeOutline`
- `searchOutline`
- `settingsOutline`
- `shareOutline`
- `shieldAlertOutline`
- `shieldOutline`
- `shieldTickOutline`
- `shortTextOutline`
- `shrinkOutline`
- `shuffleOutline`
- `sidebarCollapseOutline`
- `sidebarExpandOutline`
- `singleSelectOutline`
- `slidersOutline`
- `sortAscendingDuotone`
- `sortDescendingDuotone`
- `sparksOutline`
- `starOutline`
- `stethoscopeOutline`
- `stopCircleOutline`
- `subtaskOutline`
- `sunOutline`
- `swapHorizontalArrowsOutline`
- `swapVerticalArrowsOutline`
- `syringeOutline`
- `tagOutline`
- `testTubeOutline`
- `textOutline`
- `ticketOutline`
- `totemOutline`
- `translateOutline`
- `trashOutline`
- `trendingDownOutline`
- `trendingUpOutline`
- `trophyOutline`
- `tubeOutline`
- `tvOutline`
- `undoOutline`
- `unfoldHorizontalOutline`
- `unfoldVerticalOutline`
- `unlockOutline`
- `uploadCloudOutline`
- `uploadOutline`
- `userAddOutline`
- `userOutline`
- `userRemoveOutline`
- `usersOutline`
- `videocamOutline`
- `visibilityOffOutline`
- `visibilityOnOutline`
- `volume1Outline`
- `volume2Outline`
- `warningOutline`
- `weightOutline`
- `xCircleOutline`
- `xOutline`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AlertOutlineIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AmbulanceOutlineIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ArrowDownCircleOutlineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowDownOutlineIcon size="20" class="nav-icon" /> Settings</a>
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
<AlertOutlineIcon
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
    <AlertOutlineIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AmbulanceOutlineIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ArrowDownCircleOutlineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AlertOutlineIcon size="24" />
   <AmbulanceOutlineIcon size="24" color="#4a90e2" />
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
   <AlertOutlineIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AlertOutlineIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AlertOutlineIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { alertOutline } from '@stacksjs/iconify-cuida'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(alertOutline, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { alertOutline } from '@stacksjs/iconify-cuida'

// Icons are typed as IconData
const myIcon: IconData = alertOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Sysvale/cuida-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Sysvale ([Website](https://github.com/Sysvale/cuida-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cuida/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cuida/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
