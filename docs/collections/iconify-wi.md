# Weather Icons

> Weather Icons icons for stx from Iconify

## Overview

This package provides access to 230 icons from the Weather Icons collection through the stx iconify integration.

**Collection ID:** `wi`
**Total Icons:** 230
**Author:** Erik Flowers ([Website](https://github.com/erikflowers/weather-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-wi
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AlienIcon height="1em" />
<AlienIcon width="1em" height="1em" />
<AlienIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AlienIcon size="24" />
<AlienIcon size="1em" />

<!-- Using width and height -->
<AlienIcon width="24" height="32" />

<!-- With color -->
<AlienIcon size="24" color="red" />
<AlienIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AlienIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AlienIcon
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
    <AlienIcon size="24" />
    <AliensIcon size="24" color="#4a90e2" />
    <BarometerIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { alien, aliens, barometer } from '@stacksjs/iconify-wi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(alien, { size: 24 })
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
<AlienIcon size="24" color="red" />
<AlienIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AlienIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AlienIcon size="24" class="text-primary" />
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
<AlienIcon height="1em" />
<AlienIcon width="1em" height="1em" />
<AlienIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AlienIcon size="24" />
<AlienIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.wi-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AlienIcon class="wi-icon" />
```

## Available Icons

This package contains **230** icons:

- `alien`
- `aliens`
- `barometer`
- `celsius`
- `cloud`
- `cloudDown`
- `cloudRefresh`
- `cloudUp`
- `cloudy`
- `cloudyGusts`
- `cloudyWindy`
- `dayCloudy`
- `dayCloudyGusts`
- `dayCloudyHigh`
- `dayCloudyWindy`
- `dayFog`
- `dayHail`
- `dayHaze`
- `dayLightWind`
- `dayLightning`
- `dayRain`
- `dayRainMix`
- `dayRainWind`
- `dayShowers`
- `daySleet`
- `daySleetStorm`
- `daySnow`
- `daySnowThunderstorm`
- `daySnowWind`
- `daySprinkle`
- `dayStormShowers`
- `daySunny`
- `daySunnyOvercast`
- `dayThunderstorm`
- `dayWindy`
- `degrees`
- `directionDown`
- `directionDownLeft`
- `directionDownRight`
- `directionLeft`
- `directionRight`
- `directionUp`
- `directionUpLeft`
- `directionUpRight`
- `dust`
- `earthquake`
- `fahrenheit`
- `fire`
- `flood`
- `fog`
- `galeWarning`
- `hail`
- `horizon`
- `horizonAlt`
- `hot`
- `humidity`
- `hurricane`
- `hurricaneWarning`
- `lightning`
- `lunarEclipse`
- `meteor`
- `moonAltFirstQuarter`
- `moonAltFull`
- `moonAltNew`
- `moonAltThirdQuarter`
- `moonAltWaningCrescent1`
- `moonAltWaningCrescent2`
- `moonAltWaningCrescent3`
- `moonAltWaningCrescent4`
- `moonAltWaningCrescent5`
- `moonAltWaningCrescent6`
- `moonAltWaningGibbous1`
- `moonAltWaningGibbous2`
- `moonAltWaningGibbous3`
- `moonAltWaningGibbous4`
- `moonAltWaningGibbous5`
- `moonAltWaningGibbous6`
- `moonAltWaxingCrescent1`
- `moonAltWaxingCrescent2`
- `moonAltWaxingCrescent3`
- `moonAltWaxingCrescent4`
- `moonAltWaxingCrescent5`
- `moonAltWaxingCrescent6`
- `moonAltWaxingGibbous1`
- `moonAltWaxingGibbous2`
- `moonAltWaxingGibbous3`
- `moonAltWaxingGibbous4`
- `moonAltWaxingGibbous5`
- `moonAltWaxingGibbous6`
- `moonFirstQuarter`
- `moonFull`
- `moonNew`
- `moonThirdQuarter`
- `moonWaningCrescent1`
- `moonWaningCrescent2`
- `moonWaningCrescent3`
- `moonWaningCrescent4`
- `moonWaningCrescent5`
- `moonWaningCrescent6`
- `moonWaningGibbous1`
- `moonWaningGibbous2`
- `moonWaningGibbous3`
- `moonWaningGibbous4`
- `moonWaningGibbous5`
- `moonWaningGibbous6`
- `moonWaxing6`
- `moonWaxingCrescent1`
- `moonWaxingCrescent2`
- `moonWaxingCrescent3`
- `moonWaxingCrescent4`
- `moonWaxingCrescent5`
- `moonWaxingCrescent6`
- `moonWaxingGibbous1`
- `moonWaxingGibbous2`
- `moonWaxingGibbous3`
- `moonWaxingGibbous4`
- `moonWaxingGibbous5`
- `moonWaxingGibbous6`
- `moonrise`
- `moonset`
- `na`
- `nightAltCloudy`
- `nightAltCloudyGusts`
- `nightAltCloudyHigh`
- `nightAltCloudyWindy`
- `nightAltHail`
- `nightAltLightning`
- `nightAltPartlyCloudy`
- `nightAltRain`
- `nightAltRainMix`
- `nightAltRainWind`
- `nightAltShowers`
- `nightAltSleet`
- `nightAltSleetStorm`
- `nightAltSnow`
- `nightAltSnowThunderstorm`
- `nightAltSnowWind`
- `nightAltSprinkle`
- `nightAltStormShowers`
- `nightAltThunderstorm`
- `nightClear`
- `nightCloudy`
- `nightCloudyGusts`
- `nightCloudyHigh`
- `nightCloudyWindy`
- `nightFog`
- `nightHail`
- `nightLightning`
- `nightPartlyCloudy`
- `nightRain`
- `nightRainMix`
- `nightRainWind`
- `nightShowers`
- `nightSleet`
- `nightSleetStorm`
- `nightSnow`
- `nightSnowThunderstorm`
- `nightSnowWind`
- `nightSprinkle`
- `nightStormShowers`
- `nightThunderstorm`
- `rain`
- `rainMix`
- `rainWind`
- `raindrop`
- `raindrops`
- `refresh`
- `refreshAlt`
- `sandstorm`
- `showers`
- `sleet`
- `smallCraftAdvisory`
- `smog`
- `smoke`
- `snow`
- `snowWind`
- `snowflakeCold`
- `solarEclipse`
- `sprinkle`
- `stars`
- `stormShowers`
- `stormWarning`
- `strongWind`
- `sunrise`
- `sunset`
- `thermometer`
- `thermometerExterior`
- `thermometerInternal`
- `thunderstorm`
- `time1`
- `time10`
- `time11`
- `time12`
- `time2`
- `time3`
- `time4`
- `time5`
- `time6`
- `time7`
- `time8`
- `time9`
- `tornado`
- `train`
- `tsunami`
- `umbrella`
- `volcano`
- `windBeaufort0`
- `windBeaufort1`
- `windBeaufort10`
- `windBeaufort11`
- `windBeaufort12`
- `windBeaufort2`
- `windBeaufort3`
- `windBeaufort4`
- `windBeaufort5`
- `windBeaufort6`
- `windBeaufort7`
- `windBeaufort8`
- `windBeaufort9`
- `windDeg`
- `windDirection`
- `windDirectionE`
- `windDirectionN`
- `windDirectionNe`
- `windDirectionNw`
- `windDirectionS`
- `windDirectionSe`
- `windDirectionSw`
- `windDirectionW`
- `windy`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AlienIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AliensIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><BarometerIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><CelsiusIcon size="20" class="nav-icon" /> Settings</a>
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
<AlienIcon
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
    <AlienIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AliensIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <BarometerIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AlienIcon size="24" />
   <AliensIcon size="24" color="#4a90e2" />
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
   <AlienIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AlienIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AlienIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { alien } from '@stacksjs/iconify-wi'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(alien, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { alien } from '@stacksjs/iconify-wi'

// Icons are typed as IconData
const myIcon: IconData = alien
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Erik Flowers ([Website](https://github.com/erikflowers/weather-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/wi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/wi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
