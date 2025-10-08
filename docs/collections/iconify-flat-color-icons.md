# Flat Color Icons

> Flat Color Icons icons for stx from Iconify

## Overview

This package provides access to 329 icons from the Flat Color Icons collection through the stx iconify integration.

**Collection ID:** `flat-color-icons`
**Total Icons:** 329
**Author:** Icons8 ([Website](https://github.com/icons8/flat-Color-icons))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flat-color-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AboutIcon height="1em" />
<AboutIcon width="1em" height="1em" />
<AboutIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AboutIcon size="24" />
<AboutIcon size="1em" />

<!-- Using width and height -->
<AboutIcon width="24" height="32" />

<!-- With color -->
<AboutIcon size="24" color="red" />
<AboutIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AboutIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AboutIcon
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
    <AboutIcon size="24" />
    <AcceptDatabaseIcon size="24" color="#4a90e2" />
    <AddColumnIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { about, acceptDatabase, addColumn } from '@stacksjs/iconify-flat-color-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(about, { size: 24 })
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<AboutIcon size="24" color="red" />
<AboutIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AboutIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AboutIcon size="24" class="text-primary" />
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
<AboutIcon height="1em" />
<AboutIcon width="1em" height="1em" />
<AboutIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AboutIcon size="24" />
<AboutIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.flatColorIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AboutIcon class="flatColorIcons-icon" />
```

## Available Icons

This package contains **329** icons:

- `about`
- `acceptDatabase`
- `addColumn`
- `addDatabase`
- `addImage`
- `addRow`
- `addressBook`
- `advance`
- `advertising`
- `alarmClock`
- `alphabeticalSortingAz`
- `alphabeticalSortingZa`
- `androidOs`
- `answers`
- `approval`
- `approve`
- `areaChart`
- `assistant`
- `audioFile`
- `automatic`
- `automotive`
- `badDecision`
- `barChart`
- `bbc`
- `bearish`
- `binoculars`
- `biohazard`
- `biomass`
- `biotech`
- `bookmark`
- `briefcase`
- `brokenLink`
- `bullish`
- `business`
- `businessContact`
- `businessman`
- `businesswoman`
- `buttingIn`
- `cableRelease`
- `calculator`
- `calendar`
- `callTransfer`
- `callback`
- `camcorder`
- `camcorderPro`
- `camera`
- `cameraAddon`
- `cameraIdentification`
- `cancel`
- `candleSticks`
- `capacitor`
- `cdLogo`
- `cellPhone`
- `chargeBattery`
- `checkmark`
- `circuit`
- `clapperboard`
- `clearFilters`
- `clock`
- `closeUpMode`
- `cloth`
- `collaboration`
- `collapse`
- `collect`
- `comboChart`
- `commandLine`
- `comments`
- `compactCamera`
- `conferenceCall`
- `contacts`
- `copyleft`
- `copyright`
- `crystalOscillator`
- `currencyExchange`
- `cursor`
- `customerSupport`
- `dam`
- `dataBackup`
- `dataConfiguration`
- `dataEncryption`
- `dataProtection`
- `dataRecovery`
- `dataSheet`
- `database`
- `debian`
- `debt`
- `decision`
- `deleteColumn`
- `deleteDatabase`
- `deleteRow`
- `department`
- `deployment`
- `diploma1`
- `diploma2`
- `disapprove`
- `disclaimer`
- `dislike`
- `display`
- `doNotInhale`
- `doNotInsert`
- `doNotMix`
- `document`
- `donate`
- `doughnutChart`
- `down`
- `downLeft`
- `downRight`
- `download`
- `dribbble`
- `dvdLogo`
- `editImage`
- `electricalSensor`
- `electricalThreshold`
- `electricity`
- `electroDevices`
- `electronics`
- `emptyBattery`
- `emptyFilter`
- `emptyTrash`
- `endCall`
- `engineering`
- `enteringHeavenAlive`
- `expand`
- `expired`
- `export`
- `external`
- `factory`
- `factoryBreakdown`
- `faq`
- `feedIn`
- `feedback`
- `file`
- `filingCabinet`
- `filledFilter`
- `film`
- `filmReel`
- `finePrint`
- `flashAuto`
- `flashOff`
- `flashOn`
- `flowChart`
- `folder`
- `frame`
- `fullBattery`
- `fullTrash`
- `gallery`
- `genealogy`
- `genericSortingAsc`
- `genericSortingDesc`
- `globe`
- `goodDecision`
- `google`
- `graduationCap`
- `grid`
- `headset`
- `heatMap`
- `highBattery`
- `highPriority`
- `home`
- `icons8Cup`
- `idea`
- `imageFile`
- `import`
- `inTransit`
- `info`
- `inspection`
- `integratedWebcam`
- `internal`
- `invite`
- `ipad`
- `iphone`
- `key`
- `kindle`
- `landscape`
- `leave`
- `left`
- `leftDown`
- `leftDown2`
- `leftUp`
- `leftUp2`
- `library`
- `lightAtTheEndOfTunnel`
- `like`
- `likePlaceholder`
- `lineChart`
- `link`
- `linux`
- `list`
- `lock`
- `lockLandscape`
- `lockPortrait`
- `lowBattery`
- `lowPriority`
- `makeDecision`
- `manager`
- `mediumPriority`
- `menu`
- `middleBattery`
- `mindMap`
- `minus`
- `missedCall`
- `mms`
- `moneyTransfer`
- `multipleCameras`
- `multipleDevices`
- `multipleInputs`
- `multipleSmartphones`
- `music`
- `negativeDynamic`
- `neutralDecision`
- `neutralTrading`
- `news`
- `next`
- `nfcSign`
- `nightLandscape`
- `nightPortrait`
- `noIdea`
- `noVideo`
- `nook`
- `numericalSorting12`
- `numericalSorting21`
- `ok`
- `oldTimeCamera`
- `onlineSupport`
- `openedFolder`
- `orgUnit`
- `organization`
- `overtime`
- `package`
- `paid`
- `panorama`
- `parallelTasks`
- `phone`
- `phoneAndroid`
- `photoReel`
- `picture`
- `pieChart`
- `planner`
- `plus`
- `podiumWithAudience`
- `podiumWithSpeaker`
- `podiumWithoutSpeaker`
- `portraitMode`
- `positiveDynamic`
- `previous`
- `print`
- `privacy`
- `process`
- `puzzle`
- `questions`
- `radarPlot`
- `rating`
- `ratings`
- `reading`
- `readingEbook`
- `reddit`
- `redo`
- `refresh`
- `registeredTrademark`
- `removeImage`
- `reuse`
- `right`
- `rightDown`
- `rightDown2`
- `rightUp`
- `rightUp2`
- `rotateCamera`
- `rotateToLandscape`
- `rotateToPortrait`
- `ruler`
- `rules`
- `safe`
- `salesPerformance`
- `scatterPlot`
- `search`
- `selfServiceKiosk`
- `selfie`
- `serialTasks`
- `serviceMark`
- `services`
- `settings`
- `share`
- `shipped`
- `shop`
- `signature`
- `simCard`
- `simCardChip`
- `slrBackSide`
- `smartphoneTablet`
- `sms`
- `soundRecordingCopyright`
- `speaker`
- `sportsMode`
- `stackOfPhotos`
- `start`
- `statistics`
- `steam`
- `stumbleupon`
- `support`
- `survey`
- `switchCamera`
- `synchronize`
- `tabletAndroid`
- `template`
- `timeline`
- `todoList`
- `touchscreenSmartphone`
- `trademark`
- `treeStructure`
- `twoSmartphones`
- `undo`
- `unlock`
- `up`
- `upLeft`
- `upRight`
- `upload`
- `usb`
- `videoCall`
- `videoFile`
- `videoProjector`
- `viewDetails`
- `vip`
- `vlc`
- `voicePresentation`
- `voicemail`
- `webcam`
- `wiFiLogo`
- `wikipedia`
- `workflow`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AboutIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AcceptDatabaseIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddColumnIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddDatabaseIcon size="20" class="nav-icon" /> Settings</a>
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
<AboutIcon
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
    <AboutIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AcceptDatabaseIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddColumnIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AboutIcon size="24" />
   <AcceptDatabaseIcon size="24" color="#4a90e2" />
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
   <AboutIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AboutIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AboutIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { about } from '@stacksjs/iconify-flat-color-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(about, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { about } from '@stacksjs/iconify-flat-color-icons'

// Icons are typed as IconData
const myIcon: IconData = about
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT



## Credits

- **Icons**: Icons8 ([Website](https://github.com/icons8/flat-Color-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flat-color-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flat-color-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
