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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dIcon height="1em" />
<3dIcon width="1em" height="1em" />
<3dIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dIcon size="24" />
<3dIcon size="1em" />

<!-- Using width and height -->
<3dIcon width="24" height="32" />

<!-- With color -->
<3dIcon size="24" color="red" />
<3dIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dIcon
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
    <3dIcon size="24" />
    <3dDuoIcon size="24" color="#4a90e2" />
    <AddDeviceIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<3dIcon size="24" color="red" />
<3dIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dIcon size="24" class="text-primary" />
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
<3dIcon height="1em" />
<3dIcon width="1em" height="1em" />
<3dIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dIcon size="24" />
<3dIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineStickiesColor-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dIcon class="streamlineStickiesColor-icon" />
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
<nav>
  <a href="/"><3dIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dDuoIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddDeviceIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AddDeviceDuoIcon size="20" class="nav-icon" /> Settings</a>
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
<3dIcon
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
    <3dIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dDuoIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddDeviceIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dIcon size="24" />
   <3dDuoIcon size="24" color="#4a90e2" />
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
   <3dIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3d } from '@stacksjs/iconify-streamline-stickies-color'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3d, { size: 24 })
   @endjs

   {!! customIcon !!}
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
