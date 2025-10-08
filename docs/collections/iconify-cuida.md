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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AlertOutlineIcon, AmbulanceOutlineIcon, ArrowDownCircleOutlineIcon } from '@stacksjs/iconify-cuida'

// Basic usage
const icon = AlertOutlineIcon()

// With size
const sizedIcon = AlertOutlineIcon({ size: 24 })

// With color
const coloredIcon = AmbulanceOutlineIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowDownCircleOutlineIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AlertOutlineIcon, AmbulanceOutlineIcon, ArrowDownCircleOutlineIcon } from '@stacksjs/iconify-cuida'

  global.icons = {
    home: AlertOutlineIcon({ size: 24 }),
    user: AmbulanceOutlineIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowDownCircleOutlineIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AlertOutlineIcon({ color: 'red' })
const blueIcon = AlertOutlineIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AlertOutlineIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AlertOutlineIcon({ class: 'text-primary' })
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
const icon24 = AlertOutlineIcon({ size: 24 })
const icon1em = AlertOutlineIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AlertOutlineIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AlertOutlineIcon({ height: '1em' })
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
const smallIcon = AlertOutlineIcon({ class: 'icon-small' })
const largeIcon = AlertOutlineIcon({ class: 'icon-large' })
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
@js
  import { AlertOutlineIcon, AmbulanceOutlineIcon, ArrowDownCircleOutlineIcon, ArrowDownOutlineIcon } from '@stacksjs/iconify-cuida'

  global.navIcons = {
    home: AlertOutlineIcon({ size: 20, class: 'nav-icon' }),
    about: AmbulanceOutlineIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowDownCircleOutlineIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowDownOutlineIcon({ size: 20, class: 'nav-icon' })
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
import { AlertOutlineIcon } from '@stacksjs/iconify-cuida'

const icon = AlertOutlineIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AlertOutlineIcon, AmbulanceOutlineIcon, ArrowDownCircleOutlineIcon } from '@stacksjs/iconify-cuida'

const successIcon = AlertOutlineIcon({ size: 16, color: '#22c55e' })
const warningIcon = AmbulanceOutlineIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowDownCircleOutlineIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AlertOutlineIcon, AmbulanceOutlineIcon } from '@stacksjs/iconify-cuida'
   const icon = AlertOutlineIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { alertOutline, ambulanceOutline } from '@stacksjs/iconify-cuida'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(alertOutline, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AlertOutlineIcon, AmbulanceOutlineIcon } from '@stacksjs/iconify-cuida'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-cuida'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AlertOutlineIcon } from '@stacksjs/iconify-cuida'
     global.icon = AlertOutlineIcon({ size: 24 })
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
   const icon = AlertOutlineIcon({ class: 'icon' })
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
