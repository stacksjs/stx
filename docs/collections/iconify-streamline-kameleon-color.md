# Kameleon color icons

> Kameleon color icons icons for stx from Iconify

## Overview

This package provides access to 400 icons from the Kameleon color icons collection through the stx iconify integration.

**Collection ID:** `streamline-kameleon-color`
**Total Icons:** 400
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Multicolor
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-kameleon-color
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AidKitIcon, AidKitDuoIcon, AirconditionerIcon } from '@stacksjs/iconify-streamline-kameleon-color'

// Basic usage
const icon = AidKitIcon()

// With size
const sizedIcon = AidKitIcon({ size: 24 })

// With color
const coloredIcon = AidKitDuoIcon({ color: 'red' })

// With multiple props
const customIcon = AirconditionerIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AidKitIcon, AidKitDuoIcon, AirconditionerIcon } from '@stacksjs/iconify-streamline-kameleon-color'

  global.icons = {
    home: AidKitIcon({ size: 24 }),
    user: AidKitDuoIcon({ size: 24, color: '#4a90e2' }),
    settings: AirconditionerIcon({ size: 32 })
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
import { aidKit, aidKitDuo, airconditioner } from '@stacksjs/iconify-streamline-kameleon-color'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(aidKit, { size: 24 })
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
const redIcon = AidKitIcon({ color: 'red' })
const blueIcon = AidKitIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AidKitIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AidKitIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AidKitIcon({ size: 24 })
const icon1em = AidKitIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AidKitIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AidKitIcon({ height: '1em' })
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
const smallIcon = AidKitIcon({ class: 'icon-small' })
const largeIcon = AidKitIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **400** icons:

- `aidKit`
- `aidKitDuo`
- `airconditioner`
- `airconditionerDuo`
- `airdropBox`
- `airdropBoxDuo`
- `antenna`
- `antennaDuo`
- `anvil`
- `anvilDuo`
- `apartment2`
- `apartment2Duo`
- `articleFile2`
- `articleFile2Duo`
- `astronaut`
- `astronautDuo`
- `babyCart`
- `babyCartDuo`
- `bank`
- `bankCheck`
- `bankCheckDuo`
- `bankDuo`
- `baseball`
- `baseballDuo`
- `basket2`
- `basket2Duo`
- `batteryMedium`
- `batteryMediumDuo`
- `beach2`
- `beach2Duo`
- `bluetooth`
- `bluetoothDuo`
- `bomb`
- `bombDuo`
- `boss6`
- `boss6Duo`
- `boxOpen`
- `boxOpenDuo`
- `boxTrolley`
- `boxTrolleyDuo`
- `briefcase`
- `briefcaseDuo`
- `bullhorn`
- `bullhornDuo`
- `businessmanGlobe`
- `businessmanGlobeDuo`
- `businesswoman3`
- `businesswoman3Duo`
- `butterfly`
- `butterflyDuo`
- `cableCar`
- `cableCarDuo`
- `cameraFront`
- `cameraFrontDuo`
- `captainShield`
- `captainShieldDuo`
- `carList`
- `carListDuo`
- `cart`
- `cartDuo`
- `castle`
- `castleDuo`
- `certificate2`
- `certificate2Duo`
- `chair4`
- `chair4Duo`
- `chalkboard`
- `chalkboardDuo`
- `chartPie`
- `chartPieDuo`
- `chicken`
- `chickenDuo`
- `christmasTree`
- `christmasTreeDuo`
- `cigarette`
- `cigaretteDuo`
- `clipboard2`
- `clipboard2Duo`
- `cocktail`
- `cocktailDuo`
- `codingFile2`
- `codingFile2Duo`
- `coffeePaperGlass`
- `coffeePaperGlassDuo`
- `cone`
- `coneDuo`
- `constructionBlueprint`
- `constructionBlueprintDuo`
- `constructionWorker4`
- `constructionWorker4Duo`
- `conversion`
- `conversionDuo`
- `coupons`
- `couponsDuo`
- `crab`
- `crabDuo`
- `creditCard3`
- `creditCard3Duo`
- `crosshair`
- `crosshairDuo`
- `dartboard`
- `dartboardDuo`
- `dataTransfer`
- `dataTransferDuo`
- `databseNetwork`
- `databseNetworkDuo`
- `delivery`
- `deliveryDuo`
- `dices`
- `dicesDuo`
- `donut`
- `donutDuo`
- `downloadCloud`
- `downloadCloudDuo`
- `drakkar`
- `drakkarDuo`
- `drawer2`
- `drawer2Duo`
- `drum`
- `drumDuo`
- `ecoTag`
- `ecoTagDuo`
- `educationGlobe`
- `educationGlobeDuo`
- `enterKey`
- `enterKeyDuo`
- `excavator`
- `excavatorDuo`
- `eyeglasses`
- `eyeglassesDuo`
- `farm`
- `farmDuo`
- `favoriteFile`
- `favoriteFileDuo`
- `filter`
- `filterDuo`
- `fireman2`
- `fireman2Duo`
- `frightenedSmiley`
- `frightenedSmileyDuo`
- `glasses`
- `glassesDuo`
- `graphMagnifier`
- `graphMagnifierDuo`
- `grinder`
- `grinderDuo`
- `hammer`
- `hammerDuo`
- `harp`
- `harpDuo`
- `hat2`
- `hat2Duo`
- `headset2`
- `headset2Duo`
- `heartKey`
- `heartKeyDuo`
- `heartWatch`
- `heartWatchDuo`
- `hook`
- `hookDuo`
- `houseLocation`
- `houseLocationDuo`
- `imageFile`
- `imageFileDuo`
- `joystick`
- `joystickDuo`
- `keyboard`
- `keyboardDuo`
- `ladybug`
- `ladybugDuo`
- `lamp`
- `lampDuo`
- `laptop`
- `laptopDuo`
- `lightBulb`
- `lightBulbDuo`
- `lighter`
- `lighterDuo`
- `lockers`
- `lockersDuo`
- `love`
- `loveDuo`
- `loveSmiley`
- `loveSmileyDuo`
- `luggageCart`
- `luggageCartDuo`
- `macSignal`
- `macSignalDuo`
- `magicWand`
- `magicWandDuo`
- `man12`
- `man12Duo`
- `man15`
- `man15Duo`
- `man18`
- `man18Duo`
- `map`
- `mapDuo`
- `mapPin`
- `mapPinDuo`
- `medicine`
- `medicineDuo`
- `meteor`
- `meteorDuo`
- `microphone2`
- `microphone2Duo`
- `microphone3`
- `microphone3Duo`
- `microwave`
- `microwaveDuo`
- `moneyAtm`
- `moneyAtmDuo`
- `moneyGraph`
- `moneyGraphDuo`
- `moneyLetter`
- `moneyLetterDuo`
- `motorbike`
- `motorbikeDuo`
- `mountain`
- `mountainDuo`
- `movieFile3`
- `movieFile3Duo`
- `movieFilm`
- `movieFilmDuo`
- `nailVarnish`
- `nailVarnishDuo`
- `newspaper`
- `newspaperDuo`
- `nuclearMushroom`
- `nuclearMushroomDuo`
- `ovenGlove`
- `ovenGloveDuo`
- `oxygenTank`
- `oxygenTankDuo`
- `partyPoppers`
- `partyPoppersDuo`
- `peace`
- `peaceDuo`
- `pen`
- `penDuo`
- `pencil2`
- `pencil2Duo`
- `pencilRuler2`
- `pencilRuler2Duo`
- `perfume`
- `perfumeDuo`
- `photoFile2`
- `photoFile2Duo`
- `pineTree`
- `pineTreeDuo`
- `play`
- `playDuo`
- `plug`
- `plugDuo`
- `podium`
- `podiumDuo`
- `pointer`
- `pointerDuo`
- `pokeball`
- `pokeballDuo`
- `popcorn`
- `popcornDuo`
- `postcard`
- `postcardDuo`
- `poundsCoin`
- `poundsCoinDuo`
- `power`
- `powerDuo`
- `predator`
- `predatorDuo`
- `prism2`
- `prism2Duo`
- `quillPaper`
- `quillPaperDuo`
- `r2d2`
- `r2d2Duo`
- `rainbow`
- `rainbowDuo`
- `rapper`
- `rapperDuo`
- `receptionist`
- `receptionistDuo`
- `reindeer`
- `reindeerDuo`
- `robot`
- `robotDuo`
- `santa`
- `santaDuo`
- `scaleWeight`
- `scaleWeightDuo`
- `scriptPaper`
- `scriptPaperDuo`
- `sea`
- `seaDuo`
- `servers`
- `serversDuo`
- `serviceBell`
- `serviceBellDuo`
- `settings4`
- `settings4Duo`
- `shopping4`
- `shopping4Duo`
- `skate`
- `skateDuo`
- `smartphone`
- `smartphoneDuo`
- `smartphoneForbiden`
- `smartphoneForbidenDuo`
- `smartphoneQrcode`
- `smartphoneQrcodeDuo`
- `smartphoneRotate`
- `smartphoneRotateDuo`
- `sneakers3`
- `sneakers3Duo`
- `soccerField`
- `soccerFieldDuo`
- `sofa3`
- `sofa3Duo`
- `soldier`
- `soldierDuo`
- `spaceShuttle`
- `spaceShuttleDuo`
- `speaker`
- `speakerDuo`
- `spongebob`
- `spongebobDuo`
- `sprout`
- `sproutDuo`
- `stampPaper`
- `stampPaperDuo`
- `start`
- `startDuo`
- `steeringWheel`
- `steeringWheelDuo`
- `stethoscope`
- `stethoscopeDuo`
- `strawberry`
- `strawberryDuo`
- `studentWoman2`
- `studentWoman2Duo`
- `taxi2`
- `taxi2Duo`
- `teaCup`
- `teaCupDuo`
- `teaseSmiley`
- `teaseSmileyDuo`
- `telemarketerWoman`
- `telemarketerWomanDuo`
- `testTube`
- `testTubeDuo`
- `textFile`
- `textFileDuo`
- `theater`
- `theaterDuo`
- `towel`
- `towelDuo`
- `trafficLight`
- `trafficLightDuo`
- `transferCloud`
- `transferCloudDuo`
- `truck`
- `truckDuo`
- `truckFront`
- `truckFrontDuo`
- `ufo`
- `ufoDuo`
- `uploadCloudComputer`
- `uploadCloudComputerDuo`
- `urbanWoman`
- `urbanWomanDuo`
- `vespa`
- `vespaDuo`
- `wallE`
- `wallEDuo`
- `wallet`
- `walletDuo`
- `webcam`
- `webcamDuo`
- `wiiRemote`
- `wiiRemoteDuo`
- `windFlag`
- `windFlagDuo`
- `windVane`
- `windVaneDuo`
- `windWheel`
- `windWheelDuo`
- `windowsCoding`
- `windowsCodingDuo`
- `woman15`
- `woman15Duo`
- `wrench`
- `wrench2`
- `wrench2Duo`
- `wrenchDuo`
- `yacht`
- `yachtDuo`
- `yenCoin`
- `yenCoinDuo`
- `yinYang`
- `yinYangDuo`

## Usage Examples

### Navigation Menu

```html
@js
  import { AidKitIcon, AidKitDuoIcon, AirconditionerIcon, AirconditionerDuoIcon } from '@stacksjs/iconify-streamline-kameleon-color'

  global.navIcons = {
    home: AidKitIcon({ size: 20, class: 'nav-icon' }),
    about: AidKitDuoIcon({ size: 20, class: 'nav-icon' }),
    contact: AirconditionerIcon({ size: 20, class: 'nav-icon' }),
    settings: AirconditionerDuoIcon({ size: 20, class: 'nav-icon' })
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
import { AidKitIcon } from '@stacksjs/iconify-streamline-kameleon-color'

const icon = AidKitIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AidKitIcon, AidKitDuoIcon, AirconditionerIcon } from '@stacksjs/iconify-streamline-kameleon-color'

const successIcon = AidKitIcon({ size: 16, color: '#22c55e' })
const warningIcon = AidKitDuoIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AirconditionerIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AidKitIcon, AidKitDuoIcon } from '@stacksjs/iconify-streamline-kameleon-color'
   const icon = AidKitIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { aidKit, aidKitDuo } from '@stacksjs/iconify-streamline-kameleon-color'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(aidKit, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AidKitIcon, AidKitDuoIcon } from '@stacksjs/iconify-streamline-kameleon-color'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-streamline-kameleon-color'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AidKitIcon } from '@stacksjs/iconify-streamline-kameleon-color'
     global.icon = AidKitIcon({ size: 24 })
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
   const icon = AidKitIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { aidKit } from '@stacksjs/iconify-streamline-kameleon-color'

// Icons are typed as IconData
const myIcon: IconData = aidKit
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-kameleon-color/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-kameleon-color/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
