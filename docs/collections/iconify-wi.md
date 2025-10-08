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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AlienIcon, AliensIcon, BarometerIcon } from '@stacksjs/iconify-wi'

// Basic usage
const icon = AlienIcon()

// With size
const sizedIcon = AlienIcon({ size: 24 })

// With color
const coloredIcon = AliensIcon({ color: 'red' })

// With multiple props
const customIcon = BarometerIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AlienIcon, AliensIcon, BarometerIcon } from '@stacksjs/iconify-wi'

  global.icons = {
    home: AlienIcon({ size: 24 }),
    user: AliensIcon({ size: 24, color: '#4a90e2' }),
    settings: BarometerIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AlienIcon({ color: 'red' })
const blueIcon = AlienIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AlienIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AlienIcon({ class: 'text-primary' })
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

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AlienIcon({ size: 24 })
const icon1em = AlienIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AlienIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AlienIcon({ height: '1em' })
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
const smallIcon = AlienIcon({ class: 'icon-small' })
const largeIcon = AlienIcon({ class: 'icon-large' })
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
@js
  import { AlienIcon, AliensIcon, BarometerIcon, CelsiusIcon } from '@stacksjs/iconify-wi'

  global.navIcons = {
    home: AlienIcon({ size: 20, class: 'nav-icon' }),
    about: AliensIcon({ size: 20, class: 'nav-icon' }),
    contact: BarometerIcon({ size: 20, class: 'nav-icon' }),
    settings: CelsiusIcon({ size: 20, class: 'nav-icon' })
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
import { AlienIcon } from '@stacksjs/iconify-wi'

const icon = AlienIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AlienIcon, AliensIcon, BarometerIcon } from '@stacksjs/iconify-wi'

const successIcon = AlienIcon({ size: 16, color: '#22c55e' })
const warningIcon = AliensIcon({ size: 16, color: '#f59e0b' })
const errorIcon = BarometerIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AlienIcon, AliensIcon } from '@stacksjs/iconify-wi'
   const icon = AlienIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { alien, aliens } from '@stacksjs/iconify-wi'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(alien, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AlienIcon, AliensIcon } from '@stacksjs/iconify-wi'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-wi'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AlienIcon } from '@stacksjs/iconify-wi'
     global.icon = AlienIcon({ size: 24 })
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
   const icon = AlienIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
