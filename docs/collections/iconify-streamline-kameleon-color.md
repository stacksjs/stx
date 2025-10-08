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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AidKitIcon height="1em" />
<AidKitIcon width="1em" height="1em" />
<AidKitIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AidKitIcon size="24" />
<AidKitIcon size="1em" />

<!-- Using width and height -->
<AidKitIcon width="24" height="32" />

<!-- With color -->
<AidKitIcon size="24" color="red" />
<AidKitIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AidKitIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AidKitIcon
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
    <AidKitIcon size="24" />
    <AidKitDuoIcon size="24" color="#4a90e2" />
    <AirconditionerIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AidKitIcon size="24" color="red" />
<AidKitIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AidKitIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AidKitIcon size="24" class="text-primary" />
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
<AidKitIcon height="1em" />
<AidKitIcon width="1em" height="1em" />
<AidKitIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AidKitIcon size="24" />
<AidKitIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineKameleonColor-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AidKitIcon class="streamlineKameleonColor-icon" />
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
<nav>
  <a href="/"><AidKitIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AidKitDuoIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AirconditionerIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AirconditionerDuoIcon size="20" class="nav-icon" /> Settings</a>
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
<AidKitIcon
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
    <AidKitIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AidKitDuoIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AirconditionerIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AidKitIcon size="24" />
   <AidKitDuoIcon size="24" color="#4a90e2" />
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
   <AidKitIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AidKitIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AidKitIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { aidKit } from '@stacksjs/iconify-streamline-kameleon-color'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(aidKit, { size: 24 })
   @endjs

   {!! customIcon !!}
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
