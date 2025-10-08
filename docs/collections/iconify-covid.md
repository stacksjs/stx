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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<Covid19Virus4Icon height="1em" />
<Covid19Virus4Icon width="1em" height="1em" />
<Covid19Virus4Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<Covid19Virus4Icon size="24" />
<Covid19Virus4Icon size="1em" />

<!-- Using width and height -->
<Covid19Virus4Icon width="24" height="32" />

<!-- With color -->
<Covid19Virus4Icon size="24" color="red" />
<Covid19Virus4Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<Covid19Virus4Icon size="24" class="icon-primary" />

<!-- With all properties -->
<Covid19Virus4Icon
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
    <Covid19Virus4Icon size="24" />
    <Covid19VirusPandemic1Icon size="24" color="#4a90e2" />
    <Covid19VirusPandemic2Icon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<Covid19Virus4Icon size="24" color="red" />
<Covid19Virus4Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<Covid19Virus4Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<Covid19Virus4Icon size="24" class="text-primary" />
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
<Covid19Virus4Icon height="1em" />
<Covid19Virus4Icon width="1em" height="1em" />
<Covid19Virus4Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<Covid19Virus4Icon size="24" />
<Covid19Virus4Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.covid-icon {
  width: 1em;
  height: 1em;
}
```

```html
<Covid19Virus4Icon class="covid-icon" />
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
<nav>
  <a href="/"><Covid19Virus4Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Covid19VirusPandemic1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><Covid19VirusPandemic2Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><Covid19VirusPandemic3Icon size="20" class="nav-icon" /> Settings</a>
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
<Covid19Virus4Icon
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
    <Covid19Virus4Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Covid19VirusPandemic1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <Covid19VirusPandemic2Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <Covid19Virus4Icon size="24" />
   <Covid19VirusPandemic1Icon size="24" color="#4a90e2" />
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
   <Covid19Virus4Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <Covid19Virus4Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <Covid19Virus4Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { covid19Virus4 } from '@stacksjs/iconify-covid'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(covid19Virus4, { size: 24 })
   @endjs

   {!! customIcon !!}
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
