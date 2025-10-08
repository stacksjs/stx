# Stickies color icons

> Stickies color icons icons for stx from Iconify

## Overview

This package provides access to 200 icons from the Stickies color icons collection through the stx iconify integration.

**Collection ID:** `streamline-stickies-color`
**Total Icons:** 200
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-stickies-color
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dIcon, 3dDuoIcon, AddDeviceIcon } from '@stacksjs/iconify-streamline-stickies-color'

// Basic usage
const icon = 3dIcon()

// With size
const sizedIcon = 3dIcon({ size: 24 })

// With color
const coloredIcon = 3dDuoIcon({ color: 'red' })

// With multiple props
const customIcon = AddDeviceIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dIcon, 3dDuoIcon, AddDeviceIcon } from '@stacksjs/iconify-streamline-stickies-color'

  global.icons = {
    home: 3dIcon({ size: 24 }),
    user: 3dDuoIcon({ size: 24, color: '#4a90e2' }),
    settings: AddDeviceIcon({ size: 32 })
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
import { 3d, 3dDuo, addDevice } from '@stacksjs/iconify-streamline-stickies-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3d, { size: 24 })
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
const redIcon = 3dIcon({ color: 'red' })
const blueIcon = 3dIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3dIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3dIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = 3dIcon({ size: 24 })
const icon1em = 3dIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 3dIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3dIcon({ height: '1em' })
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
const smallIcon = 3dIcon({ class: 'icon-small' })
const largeIcon = 3dIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **200** icons:

- `3d`
- `3dDuo`
- `addDevice`
- `addDeviceDuo`
- `airportRailroad`
- `airportRailroadDuo`
- `androidSetting`
- `androidSettingDuo`
- `appWindow`
- `appWindowDuo`
- `astrologyStudy`
- `astrologyStudyDuo`
- `baby`
- `babyCartQuality`
- `babyCartQualityDuo`
- `babyDuo`
- `backpack`
- `backpackDuo`
- `balloonTour`
- `balloonTourDuo`
- `bigben`
- `bigbenDuo`
- `bluetooth`
- `bluetoothDuo`
- `boardingPass`
- `boardingPassDuo`
- `bookLibrary`
- `bookLibraryDuo`
- `bug`
- `bugDuo`
- `busRouteInfo`
- `busRouteInfoDuo`
- `cancel2`
- `cancel2Duo`
- `candyCane`
- `candyCaneDuo`
- `checkingOrder`
- `checkingOrderDuo`
- `cloudDataTransfer`
- `cloudDataTransferDuo`
- `coding`
- `codingDuo`
- `compass1`
- `compass1Duo`
- `constructionArea`
- `constructionAreaDuo`
- `control`
- `controlDuo`
- `cursor`
- `cursorDuo`
- `dangerousChemicalLab`
- `dangerousChemicalLabDuo`
- `dateTimeSetting`
- `dateTimeSettingDuo`
- `drawerInbox`
- `drawerInboxDuo`
- `drone`
- `droneDuo`
- `earpodConnected`
- `earpodConnectedDuo`
- `easterEgg`
- `easterEggDuo`
- `educationDegree`
- `educationDegreeDuo`
- `eiffelTower`
- `eiffelTowerDuo`
- `elevatorLift`
- `elevatorLiftDuo`
- `faceId1`
- `faceId1Duo`
- `filmingMovie`
- `filmingMovieDuo`
- `ghost`
- `ghostDuo`
- `giftReciept`
- `giftRecieptDuo`
- `globe1`
- `globe1Duo`
- `graphBar`
- `graphBarDuo`
- `graphPie`
- `graphPieDuo`
- `guitarAmplifier`
- `guitarAmplifierDuo`
- `help`
- `helpDuo`
- `informationToiletLocation`
- `informationToiletLocationDuo`
- `instrumentsPiano`
- `instrumentsPianoDuo`
- `key`
- `keyDuo`
- `keyboardDirection`
- `keyboardDirectionDuo`
- `labTools`
- `labToolsDuo`
- `labtop`
- `labtopDuo`
- `libraryResearch`
- `libraryResearchDuo`
- `love`
- `loveDuo`
- `mail`
- `mailDuo`
- `mailbox2`
- `mailbox2Duo`
- `medal`
- `medalDuo`
- `mobilePhone`
- `mobilePhoneDuo`
- `moneyBriefcase`
- `moneyBriefcaseDuo`
- `moneyCoin2`
- `moneyCoin2Duo`
- `muslim`
- `muslimDuo`
- `nuclear2`
- `nuclear2Duo`
- `onOff1`
- `onOff1Duo`
- `onlineInformation`
- `onlineInformationDuo`
- `passport`
- `passportDuo`
- `pen`
- `penDuo`
- `photography`
- `photographyDuo`
- `picture`
- `pictureDuo`
- `pileOfMoney`
- `pileOfMoneyDuo`
- `plant1`
- `plant1Duo`
- `productCloth`
- `productClothDuo`
- `programming`
- `programmingDuo`
- `qrCode`
- `qrCodeDuo`
- `reciept1`
- `reciept1Duo`
- `recycle`
- `recycleDuo`
- `refundProductReciept`
- `refundProductRecieptDuo`
- `reward`
- `rewardDuo`
- `rocketLaunchChart`
- `rocketLaunchChartDuo`
- `sadSong`
- `sadSongDuo`
- `safety`
- `safetyDuo`
- `school`
- `schoolDuo`
- `scienceLab`
- `scienceLabDuo`
- `search`
- `searchDuo`
- `sentFromComputer`
- `sentFromComputerDuo`
- `serverNetwork`
- `serverNetworkDuo`
- `shopStore`
- `shopStoreDuo`
- `slate`
- `slateDuo`
- `smartTv`
- `smartTvDuo`
- `snowman`
- `snowmanDuo`
- `solarPowerBattery`
- `solarPowerBatteryDuo`
- `star`
- `starDuo`
- `sun`
- `sunCloundWeather`
- `sunCloundWeatherDuo`
- `sunDuo`
- `taxi`
- `taxiDuo`
- `telescope`
- `telescopeDuo`
- `time`
- `timeDuo`
- `validation1`
- `validation1Duo`
- `viewMail`
- `viewMailDuo`
- `vrGoggle`
- `vrGoggleDuo`
- `wand`
- `wandDuo`
- `winterDayActivities`
- `winterDayActivitiesDuo`
- `worldNature`
- `worldNatureDuo`
- `wrench`
- `wrenchDuo`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dIcon, 3dDuoIcon, AddDeviceIcon, AddDeviceDuoIcon } from '@stacksjs/iconify-streamline-stickies-color'

  global.navIcons = {
    home: 3dIcon({ size: 20, class: 'nav-icon' }),
    about: 3dDuoIcon({ size: 20, class: 'nav-icon' }),
    contact: AddDeviceIcon({ size: 20, class: 'nav-icon' }),
    settings: AddDeviceDuoIcon({ size: 20, class: 'nav-icon' })
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
import { 3dIcon } from '@stacksjs/iconify-streamline-stickies-color'

const icon = 3dIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dIcon, 3dDuoIcon, AddDeviceIcon } from '@stacksjs/iconify-streamline-stickies-color'

const successIcon = 3dIcon({ size: 16, color: '#22c55e' })
const warningIcon = 3dDuoIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddDeviceIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dIcon, 3dDuoIcon } from '@stacksjs/iconify-streamline-stickies-color'
   const icon = 3dIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3d, 3dDuo } from '@stacksjs/iconify-streamline-stickies-color'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3d, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dIcon, 3dDuoIcon } from '@stacksjs/iconify-streamline-stickies-color'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-stickies-color'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dIcon } from '@stacksjs/iconify-streamline-stickies-color'
     global.icon = 3dIcon({ size: 24 })
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
   const icon = 3dIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3d } from '@stacksjs/iconify-streamline-stickies-color'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-stickies-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-stickies-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
