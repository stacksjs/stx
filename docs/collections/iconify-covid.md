# Covid Icons

> Covid Icons icons for stx from Iconify

## Overview

This package provides access to 142 icons from the Covid Icons collection through the stx iconify integration.

**Collection ID:** `covid`
**Total Icons:** 142
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-covid
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Covid19Virus4Icon, Covid19VirusPandemic1Icon, Covid19VirusPandemic2Icon } from '@stacksjs/iconify-covid'

// Basic usage
const icon = Covid19Virus4Icon()

// With size
const sizedIcon = Covid19Virus4Icon({ size: 24 })

// With color
const coloredIcon = Covid19VirusPandemic1Icon({ color: 'red' })

// With multiple props
const customIcon = Covid19VirusPandemic2Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Covid19Virus4Icon, Covid19VirusPandemic1Icon, Covid19VirusPandemic2Icon } from '@stacksjs/iconify-covid'

  global.icons = {
    home: Covid19Virus4Icon({ size: 24 }),
    user: Covid19VirusPandemic1Icon({ size: 24, color: '#4a90e2' }),
    settings: Covid19VirusPandemic2Icon({ size: 32 })
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
import { covid19Virus4, covid19VirusPandemic1, covid19VirusPandemic2 } from '@stacksjs/iconify-covid'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(covid19Virus4, { size: 24 })
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
const redIcon = Covid19Virus4Icon({ color: 'red' })
const blueIcon = Covid19Virus4Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Covid19Virus4Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Covid19Virus4Icon({ class: 'text-primary' })
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
const icon24 = Covid19Virus4Icon({ size: 24 })
const icon1em = Covid19Virus4Icon({ size: '1em' })

// Set individual dimensions
const customIcon = Covid19Virus4Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Covid19Virus4Icon({ height: '1em' })
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
const smallIcon = Covid19Virus4Icon({ class: 'icon-small' })
const largeIcon = Covid19Virus4Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **142** icons:

- `covid19Virus4`
- `covid19VirusPandemic1`
- `covid19VirusPandemic2`
- `covid19VirusPandemic3`
- `covidCarrierBlood1`
- `covidCarrierBlood2`
- `covidCarrierHuman`
- `covidCarrierPackages`
- `covid19Virus1`
- `covid19Virus2`
- `covid19Virus3`
- `covid19VirusBat`
- `covid19VirusHeal1`
- `covid19VirusHeal2`
- `covid19VirusLifelong1`
- `covid19VirusLifelong2`
- `covid19VirusPatient1`
- `covid19VirusPatient2`
- `covid19VirusReinfected`
- `covid19VirusWarning1`
- `covid19VirusWarning2`
- `covid19VirusWarning3`
- `graphCuredDecreasing`
- `graphCuredIncreasing`
- `graphCuredStable`
- `graphDeathRateDecreasing`
- `graphDeathRateIncreasing`
- `graphDeathRateStable`
- `graphDocumentInfectedReport`
- `graphInfectedDecreasing`
- `graphInfectedIncreasing`
- `graphInfectedStable`
- `mutation1`
- `mutation2`
- `mutationStronger`
- `mutationTemperatureChange`
- `personalHygieneCleanBottleShield`
- `personalHygieneCleanBottleVirus`
- `personalHygieneCleanBottleVirusBlock`
- `personalHygieneCleanGel`
- `personalHygieneCleanToothpaste`
- `personalHygieneHandLiquidSoap`
- `personalHygieneHandSanitizerLiquid1`
- `personalHygieneHandSanitizerLiquid2`
- `personalHygieneHandSanitizerLiquid3`
- `personalHygieneHandSanitizerLiquidDrop`
- `personalHygieneHandSanitizerLiquidVirusBlock`
- `personalHygieneHandSanitizerSpray`
- `personalHygieneHandSanitizerSprayVirusBlock`
- `personalHygieneHandSanitizerVirusBlock`
- `personalHygieneHandSanitizerVirusShield`
- `personalHygieneHandSoap1`
- `personalHygieneHandSoap2`
- `personalHygieneHandWash`
- `personalHygieneHandWipePaper1`
- `personalHygieneHandWipePaper2`
- `personalHygieneHandWipePaper3`
- `personalHygieneHandWipePaper4`
- `quarantinePlaceBed`
- `quarantinePlaceHospital`
- `quarantinePlaceHouse1`
- `quarantinePlaceHouse2`
- `quarantinePlaceHouseShield`
- `quarantinePlaceSelfLockdown1`
- `quarantinePlaceSelfLockdown2`
- `quarantinePlaceTimeCalendar1`
- `quarantinePlaceTimeCalendar2`
- `quarantinePlaceTimeCalendarDay`
- `quarantinePlaceTimeDateDay`
- `socialDistancing1`
- `socialDistancing2`
- `socialDistancingAttention`
- `socialDistancingCorrect1`
- `socialDistancingCorrect2`
- `socialDistancingCorrect3`
- `socialDistancingCorrect4`
- `socialDistancingCorrect5`
- `socialDistancingCorrect6`
- `socialDistancingDoNotClose1`
- `socialDistancingDoNotClose2`
- `socialDistancingDoNotClose3`
- `socialDistancingDoNotClose4`
- `socialDistancingDoNotTouch`
- `socialDistancingMan`
- `socialDistancingNotAllowedSpaceMan`
- `socialDistancingNotAllowedSpaceWoman`
- `socialDistancingProtectShield1`
- `socialDistancingProtectShield2`
- `socialDistancingVirus`
- `socialDistancingWoman`
- `symptomsColdFever`
- `symptomsFever`
- `symptomsNausea`
- `symptomsVirusDiarrhea1`
- `symptomsVirusDiarrhea2`
- `symptomsVirusHeadache1`
- `symptomsVirusHeadache2`
- `symptomsVirusLossSmell1`
- `symptomsVirusLossSmell2`
- `symptomsVirusLungDamage`
- `symptomsVirusStomach`
- `transmissionVirusAirplaneFlight`
- `transmissionVirusBriefcase`
- `transmissionVirusCough`
- `transmissionVirusCrowd`
- `transmissionVirusExpand`
- `transmissionVirusFloatWind`
- `transmissionVirusHandshake`
- `transmissionVirusHumanInfected`
- `transmissionVirusHumanTransmit1`
- `transmissionVirusHumanTransmit2`
- `transmissionVirusIncreaseRate`
- `transmissionVirusInhale`
- `transmissionVirusMobileApplication`
- `transmissionVirusRatMouse`
- `transmissionVirusTouchFinger`
- `transmissionVirusTouchHand1`
- `transmissionVirusTouchHand2`
- `transmissionVirusTransmit`
- `transmissionVirusTransportation`
- `transmissionVirusTrashBin`
- `transmissionVirusVisible`
- `transmissionVirusWindBreath`
- `vaccineProtectionFaceMask1`
- `vaccineProtectionFaceMask2`
- `vaccineProtectionFaceMask3`
- `vaccineProtectionFaceShield1`
- `vaccineProtectionFaceShield2`
- `vaccineProtectionInfraredThermometerGun`
- `vaccineProtectionMedicinePill`
- `vaccineProtectionPeopleShield`
- `vaccineProtectionSanitizerSpray`
- `vaccineProtectionShield`
- `vaccineProtectionSyringe`
- `vaccineProtectionVirus`
- `vaccineProtectionWashHands`
- `virusLabResearchMagnifier1`
- `virusLabResearchMagnifier2`
- `virusLabResearchMedicinePill`
- `virusLabResearchMicroscope`
- `virusLabResearchSyringe`
- `virusLabResearchTestTube`

## Usage Examples

### Navigation Menu

```html
@js
  import { Covid19Virus4Icon, Covid19VirusPandemic1Icon, Covid19VirusPandemic2Icon, Covid19VirusPandemic3Icon } from '@stacksjs/iconify-covid'

  global.navIcons = {
    home: Covid19Virus4Icon({ size: 20, class: 'nav-icon' }),
    about: Covid19VirusPandemic1Icon({ size: 20, class: 'nav-icon' }),
    contact: Covid19VirusPandemic2Icon({ size: 20, class: 'nav-icon' }),
    settings: Covid19VirusPandemic3Icon({ size: 20, class: 'nav-icon' })
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
import { Covid19Virus4Icon } from '@stacksjs/iconify-covid'

const icon = Covid19Virus4Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Covid19Virus4Icon, Covid19VirusPandemic1Icon, Covid19VirusPandemic2Icon } from '@stacksjs/iconify-covid'

const successIcon = Covid19Virus4Icon({ size: 16, color: '#22c55e' })
const warningIcon = Covid19VirusPandemic1Icon({ size: 16, color: '#f59e0b' })
const errorIcon = Covid19VirusPandemic2Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Covid19Virus4Icon, Covid19VirusPandemic1Icon } from '@stacksjs/iconify-covid'
   const icon = Covid19Virus4Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { covid19Virus4, covid19VirusPandemic1 } from '@stacksjs/iconify-covid'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(covid19Virus4, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Covid19Virus4Icon, Covid19VirusPandemic1Icon } from '@stacksjs/iconify-covid'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-covid'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Covid19Virus4Icon } from '@stacksjs/iconify-covid'
     global.icon = Covid19Virus4Icon({ size: 24 })
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
   const icon = Covid19Virus4Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { covid19Virus4 } from '@stacksjs/iconify-covid'

// Icons are typed as IconData
const myIcon: IconData = covid19Virus4
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/covid/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/covid/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
