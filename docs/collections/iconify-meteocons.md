# Meteocons

> Meteocons icons for stx from Iconify

## Overview

This package provides access to 450 icons from the Meteocons collection through the stx iconify integration.

**Collection ID:** `meteocons`
**Total Icons:** 450
**Author:** Bas Milius ([Website](https://github.com/basmilius/weather-icons))
**License:** MIT ([Details](https://github.com/basmilius/weather-icons/blob/dev/LICENSE))
**Category:** Thematic
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-meteocons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<BarometerIcon height="1em" />
<BarometerIcon width="1em" height="1em" />
<BarometerIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<BarometerIcon size="24" />
<BarometerIcon size="1em" />

<!-- Using width and height -->
<BarometerIcon width="24" height="32" />

<!-- With color -->
<BarometerIcon size="24" color="red" />
<BarometerIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<BarometerIcon size="24" class="icon-primary" />

<!-- With all properties -->
<BarometerIcon
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
    <BarometerIcon size="24" />
    <BarometerFillIcon size="24" color="#4a90e2" />
    <BeanieIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { barometer, barometerFill, beanie } from '@stacksjs/iconify-meteocons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(barometer, { size: 24 })
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
<BarometerIcon size="24" color="red" />
<BarometerIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<BarometerIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<BarometerIcon size="24" class="text-primary" />
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
<BarometerIcon height="1em" />
<BarometerIcon width="1em" height="1em" />
<BarometerIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<BarometerIcon size="24" />
<BarometerIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.meteocons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<BarometerIcon class="meteocons-icon" />
```

## Available Icons

This package contains **450** icons:

- `barometer`
- `barometerFill`
- `beanie`
- `beanieFill`
- `celsius`
- `celsiusFill`
- `clearDay`
- `clearDayFill`
- `clearNight`
- `clearNightFill`
- `cloudDown`
- `cloudDownFill`
- `cloudUp`
- `cloudUpFill`
- `cloudy`
- `cloudyFill`
- `codeGreen`
- `codeGreenFill`
- `codeOrange`
- `codeOrangeFill`
- `codeRed`
- `codeRedFill`
- `codeYellow`
- `codeYellowFill`
- `compass`
- `compassFill`
- `drizzle`
- `drizzleFill`
- `dust`
- `dustDay`
- `dustDayFill`
- `dustFill`
- `dustNight`
- `dustNightFill`
- `dustWind`
- `dustWindFill`
- `extreme`
- `extremeDay`
- `extremeDayDrizzle`
- `extremeDayDrizzleFill`
- `extremeDayFill`
- `extremeDayFog`
- `extremeDayFogFill`
- `extremeDayHail`
- `extremeDayHailFill`
- `extremeDayHaze`
- `extremeDayHazeFill`
- `extremeDayRain`
- `extremeDayRainFill`
- `extremeDaySleet`
- `extremeDaySleetFill`
- `extremeDaySmoke`
- `extremeDaySmokeFill`
- `extremeDaySnow`
- `extremeDaySnowFill`
- `extremeDrizzle`
- `extremeDrizzleFill`
- `extremeFill`
- `extremeFog`
- `extremeFogFill`
- `extremeHail`
- `extremeHailFill`
- `extremeHaze`
- `extremeHazeFill`
- `extremeNight`
- `extremeNightDrizzle`
- `extremeNightDrizzleFill`
- `extremeNightFill`
- `extremeNightFog`
- `extremeNightFogFill`
- `extremeNightHail`
- `extremeNightHailFill`
- `extremeNightHaze`
- `extremeNightHazeFill`
- `extremeNightRain`
- `extremeNightRainFill`
- `extremeNightSleet`
- `extremeNightSleetFill`
- `extremeNightSmoke`
- `extremeNightSmokeFill`
- `extremeNightSnow`
- `extremeNightSnowFill`
- `extremeRain`
- `extremeRainFill`
- `extremeSleet`
- `extremeSleetFill`
- `extremeSmoke`
- `extremeSmokeFill`
- `extremeSnow`
- `extremeSnowFill`
- `fahrenheit`
- `fahrenheitFill`
- `fallingStars`
- `fallingStarsFill`
- `flagGaleWarning`
- `flagGaleWarningFill`
- `flagHurricaneWarning`
- `flagHurricaneWarningFill`
- `flagSmallCraftAdvisory`
- `flagSmallCraftAdvisoryFill`
- `flagStormWarning`
- `flagStormWarningFill`
- `fog`
- `fogDay`
- `fogDayFill`
- `fogFill`
- `fogNight`
- `fogNightFill`
- `glove`
- `gloveFill`
- `hail`
- `hailFill`
- `haze`
- `hazeDay`
- `hazeDayFill`
- `hazeFill`
- `hazeNight`
- `hazeNightFill`
- `horizon`
- `horizonFill`
- `humidity`
- `humidityFill`
- `hurricane`
- `hurricaneFill`
- `lightningBolt`
- `lightningBoltFill`
- `mist`
- `mistFill`
- `moonFirstQuarter`
- `moonFirstQuarterFill`
- `moonFull`
- `moonFullFill`
- `moonLastQuarter`
- `moonLastQuarterFill`
- `moonNew`
- `moonNewFill`
- `moonWaningCrescent`
- `moonWaningCrescentFill`
- `moonWaningGibbous`
- `moonWaningGibbousFill`
- `moonWaxingCrescent`
- `moonWaxingCrescentFill`
- `moonWaxingGibbous`
- `moonWaxingGibbousFill`
- `moonrise`
- `moonriseFill`
- `moonset`
- `moonsetFill`
- `notAvailable`
- `notAvailableFill`
- `overcast`
- `overcastDay`
- `overcastDayDrizzle`
- `overcastDayDrizzleFill`
- `overcastDayFill`
- `overcastDayFog`
- `overcastDayFogFill`
- `overcastDayHail`
- `overcastDayHailFill`
- `overcastDayHaze`
- `overcastDayHazeFill`
- `overcastDayRain`
- `overcastDayRainFill`
- `overcastDaySleet`
- `overcastDaySleetFill`
- `overcastDaySmoke`
- `overcastDaySmokeFill`
- `overcastDaySnow`
- `overcastDaySnowFill`
- `overcastDrizzle`
- `overcastDrizzleFill`
- `overcastFill`
- `overcastFog`
- `overcastFogFill`
- `overcastHail`
- `overcastHailFill`
- `overcastHaze`
- `overcastHazeFill`
- `overcastNight`
- `overcastNightDrizzle`
- `overcastNightDrizzleFill`
- `overcastNightFill`
- `overcastNightFog`
- `overcastNightFogFill`
- `overcastNightHail`
- `overcastNightHailFill`
- `overcastNightHaze`
- `overcastNightHazeFill`
- `overcastNightRain`
- `overcastNightRainFill`
- `overcastNightSleet`
- `overcastNightSleetFill`
- `overcastNightSmoke`
- `overcastNightSmokeFill`
- `overcastNightSnow`
- `overcastNightSnowFill`
- `overcastRain`
- `overcastRainFill`
- `overcastSleet`
- `overcastSleetFill`
- `overcastSmoke`
- `overcastSmokeFill`
- `overcastSnow`
- `overcastSnowFill`
- `partlyCloudyDay`
- `partlyCloudyDayDrizzle`
- `partlyCloudyDayDrizzleFill`
- `partlyCloudyDayFill`
- `partlyCloudyDayFog`
- `partlyCloudyDayFogFill`
- `partlyCloudyDayHail`
- `partlyCloudyDayHailFill`
- `partlyCloudyDayHaze`
- `partlyCloudyDayHazeFill`
- `partlyCloudyDayRain`
- `partlyCloudyDayRainFill`
- `partlyCloudyDaySleet`
- `partlyCloudyDaySleetFill`
- `partlyCloudyDaySmoke`
- `partlyCloudyDaySmokeFill`
- `partlyCloudyDaySnow`
- `partlyCloudyDaySnowFill`
- `partlyCloudyNight`
- `partlyCloudyNightDrizzle`
- `partlyCloudyNightDrizzleFill`
- `partlyCloudyNightFill`
- `partlyCloudyNightFog`
- `partlyCloudyNightFogFill`
- `partlyCloudyNightHail`
- `partlyCloudyNightHailFill`
- `partlyCloudyNightHaze`
- `partlyCloudyNightHazeFill`
- `partlyCloudyNightRain`
- `partlyCloudyNightRainFill`
- `partlyCloudyNightSleet`
- `partlyCloudyNightSleetFill`
- `partlyCloudyNightSmoke`
- `partlyCloudyNightSmokeFill`
- `partlyCloudyNightSnow`
- `partlyCloudyNightSnowFill`
- `pollen`
- `pollenFill`
- `pollenFlower`
- `pollenFlowerFill`
- `pollenGrass`
- `pollenGrassFill`
- `pollenTree`
- `pollenTreeFill`
- `pressureHigh`
- `pressureHighAlt`
- `pressureHighAltFill`
- `pressureHighFill`
- `pressureLow`
- `pressureLowAlt`
- `pressureLowAltFill`
- `pressureLowFill`
- `rain`
- `rainFill`
- `rainbow`
- `rainbowClear`
- `rainbowClearFill`
- `rainbowFill`
- `raindrop`
- `raindropFill`
- `raindropMeasure`
- `raindropMeasureFill`
- `raindrops`
- `raindropsFill`
- `sleet`
- `sleetFill`
- `smoke`
- `smokeFill`
- `smokeParticles`
- `smokeParticlesFill`
- `snow`
- `snowFill`
- `snowflake`
- `snowflakeFill`
- `snowman`
- `snowmanFill`
- `solarEclipse`
- `solarEclipseFill`
- `star`
- `starFill`
- `starryNight`
- `starryNightFill`
- `sunHot`
- `sunHotFill`
- `sunrise`
- `sunriseFill`
- `sunset`
- `sunsetFill`
- `thermometer`
- `thermometerCelsius`
- `thermometerCelsiusFill`
- `thermometerColder`
- `thermometerColderFill`
- `thermometerFahrenheit`
- `thermometerFahrenheitFill`
- `thermometerFill`
- `thermometerGlass`
- `thermometerGlassCelsius`
- `thermometerGlassCelsiusFill`
- `thermometerGlassFahrenheit`
- `thermometerGlassFahrenheitFill`
- `thermometerGlassFill`
- `thermometerMercury`
- `thermometerMercuryCold`
- `thermometerMercuryColdFill`
- `thermometerMercuryFill`
- `thermometerMoon`
- `thermometerMoonFill`
- `thermometerRaindrop`
- `thermometerRaindropFill`
- `thermometerSnow`
- `thermometerSnowFill`
- `thermometerSun`
- `thermometerSunFill`
- `thermometerWarmer`
- `thermometerWarmerFill`
- `thermometerWater`
- `thermometerWaterFill`
- `thunderstorms`
- `thunderstormsDay`
- `thunderstormsDayExtreme`
- `thunderstormsDayExtremeFill`
- `thunderstormsDayExtremeSnow`
- `thunderstormsDayExtremeSnowFill`
- `thunderstormsDayFill`
- `thunderstormsDayOvercast`
- `thunderstormsDayOvercastFill`
- `thunderstormsDayOvercastSnow`
- `thunderstormsDayOvercastSnowFill`
- `thunderstormsDaySnow`
- `thunderstormsDaySnowFill`
- `thunderstormsExtreme`
- `thunderstormsExtremeFill`
- `thunderstormsExtremeSnow`
- `thunderstormsExtremeSnowFill`
- `thunderstormsFill`
- `thunderstormsNight`
- `thunderstormsNightExtreme`
- `thunderstormsNightExtremeFill`
- `thunderstormsNightExtremeSnow`
- `thunderstormsNightExtremeSnowFill`
- `thunderstormsNightFill`
- `thunderstormsNightOvercast`
- `thunderstormsNightOvercastFill`
- `thunderstormsNightOvercastSnow`
- `thunderstormsNightOvercastSnowFill`
- `thunderstormsNightSnow`
- `thunderstormsNightSnowFill`
- `thunderstormsOvercast`
- `thunderstormsOvercastFill`
- `thunderstormsOvercastSnow`
- `thunderstormsOvercastSnowFill`
- `thunderstormsSnow`
- `thunderstormsSnowFill`
- `tideHigh`
- `tideHighFill`
- `tideLow`
- `tideLowFill`
- `timeAfternoon`
- `timeAfternoonFill`
- `timeEvening`
- `timeEveningFill`
- `timeLateAfternoon`
- `timeLateAfternoonFill`
- `timeLateEvening`
- `timeLateEveningFill`
- `timeLateMorning`
- `timeLateMorningFill`
- `timeLateNight`
- `timeLateNightFill`
- `timeMorning`
- `timeMorningFill`
- `timeNight`
- `timeNightFill`
- `tornado`
- `tornadoFill`
- `umbrella`
- `umbrellaFill`
- `umbrellaWind`
- `umbrellaWindAlt`
- `umbrellaWindAltFill`
- `umbrellaWindFill`
- `uvIndex`
- `uvIndex1`
- `uvIndex1Fill`
- `uvIndex10`
- `uvIndex10Fill`
- `uvIndex11`
- `uvIndex11Fill`
- `uvIndex2`
- `uvIndex2Fill`
- `uvIndex3`
- `uvIndex3Fill`
- `uvIndex4`
- `uvIndex4Fill`
- `uvIndex5`
- `uvIndex5Fill`
- `uvIndex6`
- `uvIndex6Fill`
- `uvIndex7`
- `uvIndex7Fill`
- `uvIndex8`
- `uvIndex8Fill`
- `uvIndex9`
- `uvIndex9Fill`
- `uvIndexFill`
- `wind`
- `windAlert`
- `windAlertFill`
- `windBeaufort0`
- `windBeaufort0Fill`
- `windBeaufort1`
- `windBeaufort1Fill`
- `windBeaufort10`
- `windBeaufort10Fill`
- `windBeaufort11`
- `windBeaufort11Fill`
- `windBeaufort12`
- `windBeaufort12Fill`
- `windBeaufort2`
- `windBeaufort2Fill`
- `windBeaufort3`
- `windBeaufort3Fill`
- `windBeaufort4`
- `windBeaufort4Fill`
- `windBeaufort5`
- `windBeaufort5Fill`
- `windBeaufort6`
- `windBeaufort6Fill`
- `windBeaufort7`
- `windBeaufort7Fill`
- `windBeaufort8`
- `windBeaufort8Fill`
- `windBeaufort9`
- `windBeaufort9Fill`
- `windFill`
- `windOffshore`
- `windOffshoreFill`
- `windOnshore`
- `windOnshoreFill`
- `windSnow`
- `windSnowFill`
- `windsock`
- `windsockFill`
- `windsockWeak`
- `windsockWeakFill`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><BarometerIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><BarometerFillIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><BeanieIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><BeanieFillIcon size="20" class="nav-icon" /> Settings</a>
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
<BarometerIcon
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
    <BarometerIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <BarometerFillIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <BeanieIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <BarometerIcon size="24" />
   <BarometerFillIcon size="24" color="#4a90e2" />
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
   <BarometerIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <BarometerIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <BarometerIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { barometer } from '@stacksjs/iconify-meteocons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(barometer, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { barometer } from '@stacksjs/iconify-meteocons'

// Icons are typed as IconData
const myIcon: IconData = barometer
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/basmilius/weather-icons/blob/dev/LICENSE) for more information.

## Credits

- **Icons**: Bas Milius ([Website](https://github.com/basmilius/weather-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/meteocons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/meteocons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
