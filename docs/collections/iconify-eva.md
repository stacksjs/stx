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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ActivityFillIcon height="1em" />
<ActivityFillIcon width="1em" height="1em" />
<ActivityFillIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ActivityFillIcon size="24" />
<ActivityFillIcon size="1em" />

<!-- Using width and height -->
<ActivityFillIcon width="24" height="32" />

<!-- With color -->
<ActivityFillIcon size="24" color="red" />
<ActivityFillIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ActivityFillIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ActivityFillIcon
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
    <ActivityFillIcon size="24" />
    <ActivityOutlineIcon size="24" color="#4a90e2" />
    <AlertCircleFillIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<ActivityFillIcon size="24" color="red" />
<ActivityFillIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ActivityFillIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ActivityFillIcon size="24" class="text-primary" />
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
<ActivityFillIcon height="1em" />
<ActivityFillIcon width="1em" height="1em" />
<ActivityFillIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ActivityFillIcon size="24" />
<ActivityFillIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.eva-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ActivityFillIcon class="eva-icon" />
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
<nav>
  <a href="/"><ActivityFillIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ActivityOutlineIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlertCircleFillIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlertCircleOutlineIcon size="20" class="nav-icon" /> Settings</a>
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
<ActivityFillIcon
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
    <ActivityFillIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ActivityOutlineIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlertCircleFillIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ActivityFillIcon size="24" />
   <ActivityOutlineIcon size="24" color="#4a90e2" />
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
   <ActivityFillIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ActivityFillIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ActivityFillIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { activityFill } from '@stacksjs/iconify-eva'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(activityFill, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
