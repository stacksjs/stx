# Maki

> Maki icons for stx from Iconify

## Overview

This package provides access to 418 icons from the Maki collection through the stx iconify integration.

**Collection ID:** `maki`
**Total Icons:** 418
**Author:** Mapbox ([Website](https://github.com/mapbox/maki))
**License:** CC0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-maki
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AerialwayIcon height="1em" />
<AerialwayIcon width="1em" height="1em" />
<AerialwayIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AerialwayIcon size="24" />
<AerialwayIcon size="1em" />

<!-- Using width and height -->
<AerialwayIcon width="24" height="32" />

<!-- With color -->
<AerialwayIcon size="24" color="red" />
<AerialwayIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AerialwayIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AerialwayIcon
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
    <AerialwayIcon size="24" />
    <Aerialway11Icon size="24" color="#4a90e2" />
    <AirfieldIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { aerialway, aerialway11, airfield } from '@stacksjs/iconify-maki'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(aerialway, { size: 24 })
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
<AerialwayIcon size="24" color="red" />
<AerialwayIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AerialwayIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AerialwayIcon size="24" class="text-primary" />
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
<AerialwayIcon height="1em" />
<AerialwayIcon width="1em" height="1em" />
<AerialwayIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AerialwayIcon size="24" />
<AerialwayIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.maki-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AerialwayIcon class="maki-icon" />
```

## Available Icons

This package contains **418** icons:

- `aerialway`
- `aerialway11`
- `airfield`
- `airfield11`
- `airport`
- `airport11`
- `alcoholShop`
- `alcoholShop11`
- `americanFootball`
- `americanFootball11`
- `amusementPark`
- `amusementPark11`
- `animalShelter`
- `aquarium`
- `aquarium11`
- `arrow`
- `artGallery`
- `artGallery11`
- `attraction`
- `attraction11`
- `bakery`
- `bakery11`
- `bakery15`
- `bank`
- `bank11`
- `bankJp`
- `bankJp11`
- `bar`
- `bar11`
- `barrier`
- `barrier11`
- `baseball`
- `baseball11`
- `basketball`
- `basketball11`
- `bbq`
- `bbq11`
- `beach`
- `beach11`
- `beer`
- `beer11`
- `bicycle`
- `bicycle11`
- `bicycleShare`
- `bicycleShare11`
- `bloodBank`
- `bloodBank11`
- `bowlingAlley`
- `bowlingAlley11`
- `bridge`
- `bridge11`
- `building`
- `building11`
- `buildingAlt1`
- `buildingAlt111`
- `bus`
- `bus11`
- `cafe`
- `cafe11`
- `campsite`
- `campsite11`
- `car`
- `car11`
- `car15`
- `carRental`
- `carRental11`
- `carRental15`
- `carRepair`
- `carRepair11`
- `carRepair15`
- `casino`
- `casino11`
- `castle`
- `castle11`
- `castleJp`
- `castleJp11`
- `caution`
- `cemetery`
- `cemetery11`
- `cemeteryJp`
- `cemeteryJp11`
- `chargingStation`
- `chargingStation11`
- `cinema`
- `cinema11`
- `circle`
- `circle11`
- `circleStroked`
- `circleStroked11`
- `city`
- `city11`
- `clothingStore`
- `clothingStore11`
- `college`
- `college11`
- `collegeJp`
- `collegeJp11`
- `commercial`
- `commercial11`
- `communicationsTower`
- `communicationsTower11`
- `confectionery`
- `confectionery11`
- `construction`
- `convenience`
- `convenience11`
- `cricket`
- `cricket11`
- `cross`
- `cross11`
- `dam`
- `dam11`
- `danger`
- `danger11`
- `defibrillator`
- `defibrillator11`
- `dentist`
- `dentist11`
- `diamond`
- `doctor`
- `doctor11`
- `dogPark`
- `dogPark11`
- `drinkingWater`
- `drinkingWater11`
- `drinkingWater15`
- `elevator`
- `embassy`
- `embassy11`
- `emergencyPhone`
- `emergencyPhone11`
- `entrance`
- `entrance11`
- `entrance15`
- `entranceAlt1`
- `entranceAlt111`
- `farm`
- `farm11`
- `fastFood`
- `fastFood11`
- `fence`
- `fence11`
- `ferry`
- `ferry11`
- `ferryJp`
- `fireStation`
- `fireStation11`
- `fireStationJp`
- `fireStationJp11`
- `fitnessCentre`
- `fitnessCentre11`
- `florist`
- `florist11`
- `fuel`
- `fuel11`
- `furniture`
- `furniture11`
- `furniture15`
- `gaming`
- `gaming11`
- `garden`
- `garden11`
- `gardenCentre`
- `gardenCentre11`
- `gate`
- `gift`
- `gift11`
- `globe`
- `globe11`
- `globe15`
- `golf`
- `golf11`
- `grocery`
- `grocery11`
- `hairdresser`
- `hairdresser11`
- `harbor`
- `harbor11`
- `hardware`
- `hardware11`
- `heart`
- `heart11`
- `heliport`
- `heliport11`
- `highwayRestArea`
- `historic`
- `home`
- `home11`
- `horseRiding`
- `horseRiding11`
- `hospital`
- `hospital11`
- `hospitalJp`
- `hospitalJp11`
- `hotSpring`
- `iceCream`
- `iceCream11`
- `iceCream15`
- `industry`
- `industry11`
- `information`
- `information11`
- `jewelryStore`
- `jewelryStore11`
- `karaoke`
- `karaoke11`
- `karaoke15`
- `landmark`
- `landmark11`
- `landmarkJp`
- `landmarkJp11`
- `landuse`
- `landuse11`
- `laundry`
- `laundry11`
- `library`
- `library11`
- `library15`
- `liftGate`
- `lighthouse`
- `lighthouse11`
- `lighthouseJp`
- `lodging`
- `lodging11`
- `logging`
- `logging11`
- `marae`
- `marker`
- `marker11`
- `markerStroked`
- `markerStroked11`
- `mobilePhone`
- `mobilePhone11`
- `monument`
- `monument11`
- `monumentJp`
- `mountain`
- `mountain11`
- `museum`
- `museum11`
- `museum15`
- `music`
- `music11`
- `natural`
- `natural11`
- `nightclub`
- `observationTower`
- `optician`
- `optician11`
- `paint`
- `paint11`
- `park`
- `park11`
- `parkAlt1`
- `parkAlt111`
- `parking`
- `parking11`
- `parkingGarage`
- `parkingGarage11`
- `parkingPaid`
- `pharmacy`
- `pharmacy11`
- `picnicSite`
- `picnicSite11`
- `pitch`
- `pitch11`
- `placeOfWorship`
- `placeOfWorship11`
- `playground`
- `playground11`
- `police`
- `police11`
- `policeJp`
- `policeJp11`
- `post`
- `post11`
- `postJp`
- `postJp11`
- `prison`
- `prison11`
- `racetrack`
- `racetrackBoat`
- `racetrackCycling`
- `racetrackHorse`
- `rail`
- `rail11`
- `railLight`
- `railLight11`
- `railMetro`
- `railMetro11`
- `rangerStation`
- `rangerStation11`
- `recycling`
- `recycling11`
- `religiousBuddhist`
- `religiousBuddhist11`
- `religiousChristian`
- `religiousChristian11`
- `religiousJewish`
- `religiousJewish11`
- `religiousMuslim`
- `religiousMuslim11`
- `religiousShinto`
- `religiousShinto11`
- `residentialCommunity`
- `residentialCommunity11`
- `restaurant`
- `restaurant11`
- `restaurantBbq`
- `restaurantNoodle`
- `restaurantNoodle11`
- `restaurantPizza`
- `restaurantPizza11`
- `restaurantSeafood`
- `restaurantSeafood11`
- `restaurantSushi`
- `roadAccident`
- `roadblock`
- `roadblock11`
- `rocket`
- `rocket11`
- `school`
- `school11`
- `schoolJp`
- `schoolJp11`
- `scooter`
- `scooter11`
- `shelter`
- `shelter11`
- `shoe`
- `shoe11`
- `shoe15`
- `shop`
- `shop11`
- `skateboard`
- `skateboard11`
- `skiing`
- `skiing11`
- `slaughterhouse`
- `slaughterhouse11`
- `slipway`
- `slipway11`
- `snowmobile`
- `snowmobile11`
- `soccer`
- `soccer11`
- `square`
- `square11`
- `squareStroked`
- `squareStroked11`
- `stadium`
- `stadium11`
- `star`
- `star11`
- `starStroked`
- `starStroked11`
- `suitcase`
- `suitcase11`
- `sushi11`
- `swimming`
- `swimming11`
- `tableTennis`
- `tableTennis11`
- `taxi`
- `teahouse`
- `teahouse11`
- `telephone`
- `telephone11`
- `tennis`
- `tennis11`
- `terminal`
- `theatre`
- `theatre11`
- `toilet`
- `toilet11`
- `toll`
- `town`
- `town11`
- `townHall`
- `townHall11`
- `townHall15`
- `triangle`
- `triangle11`
- `triangleStroked`
- `triangleStroked11`
- `tunnel`
- `veterinary`
- `veterinary11`
- `veterinary15`
- `viewpoint`
- `viewpoint11`
- `village`
- `village11`
- `volcano`
- `volcano11`
- `volleyball`
- `volleyball11`
- `warehouse`
- `warehouse11`
- `wasteBasket`
- `wasteBasket11`
- `watch`
- `watch11`
- `watch15`
- `water`
- `water11`
- `waterfall`
- `waterfall11`
- `watermill`
- `watermill11`
- `wetland`
- `wetland11`
- `wheelchair`
- `wheelchair11`
- `windmill`
- `windmill11`
- `zoo`
- `zoo11`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AerialwayIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Aerialway11Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AirfieldIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><Airfield11Icon size="20" class="nav-icon" /> Settings</a>
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
<AerialwayIcon
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
    <AerialwayIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Aerialway11Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AirfieldIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AerialwayIcon size="24" />
   <Aerialway11Icon size="24" color="#4a90e2" />
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
   <AerialwayIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AerialwayIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AerialwayIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { aerialway } from '@stacksjs/iconify-maki'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(aerialway, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { aerialway } from '@stacksjs/iconify-maki'

// Icons are typed as IconData
const myIcon: IconData = aerialway
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: Mapbox ([Website](https://github.com/mapbox/maki))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/maki/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/maki/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
