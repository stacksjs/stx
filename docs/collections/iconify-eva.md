# Eva Icons

> Eva Icons icons for stx from Iconify

## Overview

This package provides access to 490 icons from the Eva Icons collection through the stx iconify integration.

**Collection ID:** `eva`
**Total Icons:** 490
**Author:** Akveo ([Website](https://github.com/akveo/eva-icons/))
**License:** MIT ([Details](https://github.com/akveo/eva-icons/blob/master/LICENSE.txt))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-eva
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActivityFillIcon, ActivityOutlineIcon, AlertCircleFillIcon } from '@stacksjs/iconify-eva'

// Basic usage
const icon = ActivityFillIcon()

// With size
const sizedIcon = ActivityFillIcon({ size: 24 })

// With color
const coloredIcon = ActivityOutlineIcon({ color: 'red' })

// With multiple props
const customIcon = AlertCircleFillIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActivityFillIcon, ActivityOutlineIcon, AlertCircleFillIcon } from '@stacksjs/iconify-eva'

  global.icons = {
    home: ActivityFillIcon({ size: 24 }),
    user: ActivityOutlineIcon({ size: 24, color: '#4a90e2' }),
    settings: AlertCircleFillIcon({ size: 32 })
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
import { activityFill, activityOutline, alertCircleFill } from '@stacksjs/iconify-eva'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(activityFill, { size: 24 })
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
const redIcon = ActivityFillIcon({ color: 'red' })
const blueIcon = ActivityFillIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ActivityFillIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ActivityFillIcon({ class: 'text-primary' })
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
const icon24 = ActivityFillIcon({ size: 24 })
const icon1em = ActivityFillIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ActivityFillIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ActivityFillIcon({ height: '1em' })
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
const smallIcon = ActivityFillIcon({ class: 'icon-small' })
const largeIcon = ActivityFillIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **490** icons:

- `activityFill`
- `activityOutline`
- `alertCircleFill`
- `alertCircleOutline`
- `alertTriangleFill`
- `alertTriangleOutline`
- `archiveFill`
- `archiveOutline`
- `arrowBackFill`
- `arrowBackOutline`
- `arrowCircleDownFill`
- `arrowCircleDownOutline`
- `arrowCircleLeftFill`
- `arrowCircleLeftOutline`
- `arrowCircleRightFill`
- `arrowCircleRightOutline`
- `arrowCircleUpFill`
- `arrowCircleUpOutline`
- `arrowDownFill`
- `arrowDownOutline`
- `arrowDownwardFill`
- `arrowDownwardOutline`
- `arrowForwardFill`
- `arrowForwardOutline`
- `arrowIosBackFill`
- `arrowIosBackOutline`
- `arrowIosDownwardFill`
- `arrowIosDownwardOutline`
- `arrowIosForwardFill`
- `arrowIosForwardOutline`
- `arrowIosUpwardFill`
- `arrowIosUpwardOutline`
- `arrowLeftFill`
- `arrowLeftOutline`
- `arrowRightFill`
- `arrowRightOutline`
- `arrowUpFill`
- `arrowUpOutline`
- `arrowUpwardFill`
- `arrowUpwardOutline`
- `arrowheadDownFill`
- `arrowheadDownOutline`
- `arrowheadLeftFill`
- `arrowheadLeftOutline`
- `arrowheadRightFill`
- `arrowheadRightOutline`
- `arrowheadUpFill`
- `arrowheadUpOutline`
- `atFill`
- `atOutline`
- `attach2Fill`
- `attach2Outline`
- `attachFill`
- `attachOutline`
- `awardFill`
- `awardOutline`
- `backspaceFill`
- `backspaceOutline`
- `barChart2Fill`
- `barChart2Outline`
- `barChartFill`
- `barChartOutline`
- `batteryFill`
- `batteryOutline`
- `behanceFill`
- `behanceOutline`
- `bellFill`
- `bellOffFill`
- `bellOffOutline`
- `bellOutline`
- `bluetoothFill`
- `bluetoothOutline`
- `bookFill`
- `bookOpenFill`
- `bookOpenOutline`
- `bookOutline`
- `bookmarkFill`
- `bookmarkOutline`
- `briefcaseFill`
- `briefcaseOutline`
- `browserFill`
- `browserOutline`
- `brushFill`
- `brushOutline`
- `bulbFill`
- `bulbOutline`
- `calendarFill`
- `calendarOutline`
- `cameraFill`
- `cameraOutline`
- `carFill`
- `carOutline`
- `castFill`
- `castOutline`
- `chargingFill`
- `chargingOutline`
- `checkmarkCircle2Fill`
- `checkmarkCircle2Outline`
- `checkmarkCircleFill`
- `checkmarkCircleOutline`
- `checkmarkFill`
- `checkmarkOutline`
- `checkmarkSquare2Fill`
- `checkmarkSquare2Outline`
- `checkmarkSquareFill`
- `checkmarkSquareOutline`
- `chevronDownFill`
- `chevronDownOutline`
- `chevronLeftFill`
- `chevronLeftOutline`
- `chevronRightFill`
- `chevronRightOutline`
- `chevronUpFill`
- `chevronUpOutline`
- `clipboardFill`
- `clipboardOutline`
- `clockFill`
- `clockOutline`
- `closeCircleFill`
- `closeCircleOutline`
- `closeFill`
- `closeOutline`
- `closeSquareFill`
- `closeSquareOutline`
- `cloudDownloadFill`
- `cloudDownloadOutline`
- `cloudUploadFill`
- `cloudUploadOutline`
- `codeDownloadFill`
- `codeDownloadOutline`
- `codeFill`
- `codeOutline`
- `collapseFill`
- `collapseOutline`
- `colorPaletteFill`
- `colorPaletteOutline`
- `colorPickerFill`
- `colorPickerOutline`
- `compassFill`
- `compassOutline`
- `copyFill`
- `copyOutline`
- `cornerDownLeftFill`
- `cornerDownLeftOutline`
- `cornerDownRightFill`
- `cornerDownRightOutline`
- `cornerLeftDownFill`
- `cornerLeftDownOutline`
- `cornerLeftUpFill`
- `cornerLeftUpOutline`
- `cornerRightDownFill`
- `cornerRightDownOutline`
- `cornerRightUpFill`
- `cornerRightUpOutline`
- `cornerUpLeftFill`
- `cornerUpLeftOutline`
- `cornerUpRightFill`
- `cornerUpRightOutline`
- `creditCardFill`
- `creditCardOutline`
- `cropFill`
- `cropOutline`
- `cubeFill`
- `cubeOutline`
- `diagonalArrowLeftDownFill`
- `diagonalArrowLeftDownOutline`
- `diagonalArrowLeftUpFill`
- `diagonalArrowLeftUpOutline`
- `diagonalArrowRightDownFill`
- `diagonalArrowRightDownOutline`
- `diagonalArrowRightUpFill`
- `diagonalArrowRightUpOutline`
- `doneAllFill`
- `doneAllOutline`
- `downloadFill`
- `downloadOutline`
- `dropletFill`
- `dropletOffFill`
- `dropletOffOutline`
- `dropletOutline`
- `edit2Fill`
- `edit2Outline`
- `editFill`
- `editOutline`
- `emailFill`
- `emailOutline`
- `expandFill`
- `expandOutline`
- `externalLinkFill`
- `externalLinkOutline`
- `eyeFill`
- `eyeOff2Fill`
- `eyeOff2Outline`
- `eyeOffFill`
- `eyeOffOutline`
- `eyeOutline`
- `facebookFill`
- `facebookOutline`
- `fileAddFill`
- `fileAddOutline`
- `fileFill`
- `fileOutline`
- `fileRemoveFill`
- `fileRemoveOutline`
- `fileTextFill`
- `fileTextOutline`
- `filmFill`
- `filmOutline`
- `flagFill`
- `flagOutline`
- `flashFill`
- `flashOffFill`
- `flashOffOutline`
- `flashOutline`
- `flip2Fill`
- `flip2Outline`
- `flipFill`
- `flipOutline`
- `folderAddFill`
- `folderAddOutline`
- `folderFill`
- `folderOutline`
- `folderRemoveFill`
- `folderRemoveOutline`
- `funnelFill`
- `funnelOutline`
- `giftFill`
- `giftOutline`
- `githubFill`
- `githubOutline`
- `globe2Fill`
- `globe2Outline`
- `globe3Fill`
- `globeFill`
- `globeOutline`
- `googleFill`
- `googleOutline`
- `gridFill`
- `gridOutline`
- `hardDriveFill`
- `hardDriveOutline`
- `hashFill`
- `hashOutline`
- `headphonesFill`
- `headphonesOutline`
- `heartFill`
- `heartOutline`
- `homeFill`
- `homeOutline`
- `image2Fill`
- `imageFill`
- `imageOutline`
- `inboxFill`
- `inboxOutline`
- `infoFill`
- `infoOutline`
- `keypadFill`
- `keypadOutline`
- `layersFill`
- `layersOutline`
- `layoutFill`
- `layoutOutline`
- `link2Fill`
- `link2Outline`
- `linkFill`
- `linkOutline`
- `linkedinFill`
- `linkedinOutline`
- `listFill`
- `listOutline`
- `loaderOutline`
- `lockFill`
- `lockOutline`
- `logInFill`
- `logInOutline`
- `logOutFill`
- `logOutOutline`
- `mapFill`
- `mapOutline`
- `maximizeFill`
- `maximizeOutline`
- `menu2Fill`
- `menu2Outline`
- `menuArrowFill`
- `menuArrowOutline`
- `menuFill`
- `menuOutline`
- `messageCircleFill`
- `messageCircleOutline`
- `messageSquareFill`
- `messageSquareOutline`
- `micFill`
- `micOffFill`
- `micOffOutline`
- `micOutline`
- `minimizeFill`
- `minimizeOutline`
- `minusCircleFill`
- `minusCircleOutline`
- `minusFill`
- `minusOutline`
- `minusSquareFill`
- `minusSquareOutline`
- `monitorFill`
- `monitorOutline`
- `moonFill`
- `moonOutline`
- `moreHorizontalFill`
- `moreHorizontalOutline`
- `moreVerticalFill`
- `moreVerticalOutline`
- `moveFill`
- `moveOutline`
- `musicFill`
- `musicOutline`
- `navigation2Fill`
- `navigation2Outline`
- `navigationFill`
- `navigationOutline`
- `npmFill`
- `npmOutline`
- `options2Fill`
- `options2Outline`
- `optionsFill`
- `optionsOutline`
- `pantoneFill`
- `pantoneOutline`
- `paperPlaneFill`
- `paperPlaneOutline`
- `pauseCircleFill`
- `pauseCircleOutline`
- `peopleFill`
- `peopleOutline`
- `percentFill`
- `percentOutline`
- `personAddFill`
- `personAddOutline`
- `personDeleteFill`
- `personDeleteOutline`
- `personDoneFill`
- `personDoneOutline`
- `personFill`
- `personOutline`
- `personRemoveFill`
- `personRemoveOutline`
- `phoneCallFill`
- `phoneCallOutline`
- `phoneFill`
- `phoneMissedFill`
- `phoneMissedOutline`
- `phoneOffFill`
- `phoneOffOutline`
- `phoneOutline`
- `pieChart2Fill`
- `pieChartFill`
- `pieChartOutline`
- `pinFill`
- `pinOutline`
- `playCircleFill`
- `playCircleOutline`
- `plusCircleFill`
- `plusCircleOutline`
- `plusFill`
- `plusOutline`
- `plusSquareFill`
- `plusSquareOutline`
- `powerFill`
- `powerOutline`
- `pricetagsFill`
- `pricetagsOutline`
- `printerFill`
- `printerOutline`
- `questionMarkCircleFill`
- `questionMarkCircleOutline`
- `questionMarkFill`
- `questionMarkOutline`
- `radioButtonOffFill`
- `radioButtonOffOutline`
- `radioButtonOnFill`
- `radioButtonOnOutline`
- `radioFill`
- `radioOutline`
- `recordingFill`
- `recordingOutline`
- `refreshFill`
- `refreshOutline`
- `repeatFill`
- `repeatOutline`
- `rewindLeftFill`
- `rewindLeftOutline`
- `rewindRightFill`
- `rewindRightOutline`
- `saveFill`
- `saveOutline`
- `scissorsFill`
- `scissorsOutline`
- `searchFill`
- `searchOutline`
- `settings2Fill`
- `settings2Outline`
- `settingsFill`
- `settingsOutline`
- `shakeFill`
- `shakeOutline`
- `shareFill`
- `shareOutline`
- `shieldFill`
- `shieldOffFill`
- `shieldOffOutline`
- `shieldOutline`
- `shoppingBagFill`
- `shoppingBagOutline`
- `shoppingCartFill`
- `shoppingCartOutline`
- `shuffle2Fill`
- `shuffle2Outline`
- `shuffleFill`
- `shuffleOutline`
- `skipBackFill`
- `skipBackOutline`
- `skipForwardFill`
- `skipForwardOutline`
- `slashFill`
- `slashOutline`
- `smartphoneFill`
- `smartphoneOutline`
- `smilingFaceFill`
- `smilingFaceOutline`
- `speakerFill`
- `speakerOutline`
- `squareFill`
- `squareOutline`
- `starFill`
- `starOutline`
- `stopCircleFill`
- `stopCircleOutline`
- `sunFill`
- `sunOutline`
- `swapFill`
- `swapOutline`
- `syncFill`
- `syncOutline`
- `textFill`
- `textOutline`
- `thermometerFill`
- `thermometerMinusFill`
- `thermometerMinusOutline`
- `thermometerOutline`
- `thermometerPlusFill`
- `thermometerPlusOutline`
- `toggleLeftFill`
- `toggleLeftOutline`
- `toggleRightFill`
- `toggleRightOutline`
- `trash2Fill`
- `trash2Outline`
- `trashFill`
- `trashOutline`
- `trendingDownFill`
- `trendingDownOutline`
- `trendingUpFill`
- `trendingUpOutline`
- `tvFill`
- `tvOutline`
- `twitterFill`
- `twitterOutline`
- `umbrellaFill`
- `umbrellaOutline`
- `undoFill`
- `undoOutline`
- `unlockFill`
- `unlockOutline`
- `uploadFill`
- `uploadOutline`
- `videoFill`
- `videoOffFill`
- `videoOffOutline`
- `videoOutline`
- `volumeDownFill`
- `volumeDownOutline`
- `volumeMuteFill`
- `volumeMuteOutline`
- `volumeOffFill`
- `volumeOffOutline`
- `volumeUpFill`
- `volumeUpOutline`
- `wifiFill`
- `wifiOffFill`
- `wifiOffOutline`
- `wifiOutline`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActivityFillIcon, ActivityOutlineIcon, AlertCircleFillIcon, AlertCircleOutlineIcon } from '@stacksjs/iconify-eva'

  global.navIcons = {
    home: ActivityFillIcon({ size: 20, class: 'nav-icon' }),
    about: ActivityOutlineIcon({ size: 20, class: 'nav-icon' }),
    contact: AlertCircleFillIcon({ size: 20, class: 'nav-icon' }),
    settings: AlertCircleOutlineIcon({ size: 20, class: 'nav-icon' })
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
import { ActivityFillIcon } from '@stacksjs/iconify-eva'

const icon = ActivityFillIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActivityFillIcon, ActivityOutlineIcon, AlertCircleFillIcon } from '@stacksjs/iconify-eva'

const successIcon = ActivityFillIcon({ size: 16, color: '#22c55e' })
const warningIcon = ActivityOutlineIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlertCircleFillIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActivityFillIcon, ActivityOutlineIcon } from '@stacksjs/iconify-eva'
   const icon = ActivityFillIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { activityFill, activityOutline } from '@stacksjs/iconify-eva'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(activityFill, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActivityFillIcon, ActivityOutlineIcon } from '@stacksjs/iconify-eva'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-eva'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActivityFillIcon } from '@stacksjs/iconify-eva'
     global.icon = ActivityFillIcon({ size: 24 })
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
   const icon = ActivityFillIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { activityFill } from '@stacksjs/iconify-eva'

// Icons are typed as IconData
const myIcon: IconData = activityFill
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/akveo/eva-icons/blob/master/LICENSE.txt) for more information.

## Credits

- **Icons**: Akveo ([Website](https://github.com/akveo/eva-icons/))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/eva/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/eva/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
