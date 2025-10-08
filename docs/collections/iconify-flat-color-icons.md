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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AboutIcon, AcceptDatabaseIcon, AddColumnIcon } from '@stacksjs/iconify-flat-color-icons'

// Basic usage
const icon = AboutIcon()

// With size
const sizedIcon = AboutIcon({ size: 24 })

// With color
const coloredIcon = AcceptDatabaseIcon({ color: 'red' })

// With multiple props
const customIcon = AddColumnIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AboutIcon, AcceptDatabaseIcon, AddColumnIcon } from '@stacksjs/iconify-flat-color-icons'

  global.icons = {
    home: AboutIcon({ size: 24 }),
    user: AcceptDatabaseIcon({ size: 24, color: '#4a90e2' }),
    settings: AddColumnIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AboutIcon({ color: 'red' })
const blueIcon = AboutIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AboutIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AboutIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AboutIcon({ size: 24 })
const icon1em = AboutIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AboutIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AboutIcon({ height: '1em' })
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
const smallIcon = AboutIcon({ class: 'icon-small' })
const largeIcon = AboutIcon({ class: 'icon-large' })
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
@js
  import { AboutIcon, AcceptDatabaseIcon, AddColumnIcon, AddDatabaseIcon } from '@stacksjs/iconify-flat-color-icons'

  global.navIcons = {
    home: AboutIcon({ size: 20, class: 'nav-icon' }),
    about: AcceptDatabaseIcon({ size: 20, class: 'nav-icon' }),
    contact: AddColumnIcon({ size: 20, class: 'nav-icon' }),
    settings: AddDatabaseIcon({ size: 20, class: 'nav-icon' })
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
import { AboutIcon } from '@stacksjs/iconify-flat-color-icons'

const icon = AboutIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AboutIcon, AcceptDatabaseIcon, AddColumnIcon } from '@stacksjs/iconify-flat-color-icons'

const successIcon = AboutIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcceptDatabaseIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddColumnIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AboutIcon, AcceptDatabaseIcon } from '@stacksjs/iconify-flat-color-icons'
   const icon = AboutIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { about, acceptDatabase } from '@stacksjs/iconify-flat-color-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(about, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AboutIcon, AcceptDatabaseIcon } from '@stacksjs/iconify-flat-color-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-flat-color-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AboutIcon } from '@stacksjs/iconify-flat-color-icons'
     global.icon = AboutIcon({ size: 24 })
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
   const icon = AboutIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
