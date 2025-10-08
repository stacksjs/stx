# Medical Icons

> Medical Icons icons for stx from Iconify

## Overview

This package provides access to 144 icons from the Medical Icons collection through the stx iconify integration.

**Collection ID:** `medical-icon`
**Total Icons:** 144
**Author:** Samuel Frémondière ([Website](https://github.com/samcome/webfont-medical-icons))
**License:** MIT ([Details](https://github.com/samcome/webfont-medical-icons/blob/master/LICENSE))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-medical-icon
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AdministrationIcon, AlternativeComplementaryIcon } from '@stacksjs/iconify-medical-icon'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AdministrationIcon({ color: 'red' })

// With multiple props
const customIcon = AlternativeComplementaryIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AdministrationIcon, AlternativeComplementaryIcon } from '@stacksjs/iconify-medical-icon'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AdministrationIcon({ size: 24, color: '#4a90e2' }),
    settings: AlternativeComplementaryIcon({ size: 32 })
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
import { accessibility, administration, alternativeComplementary } from '@stacksjs/iconify-medical-icon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **144** icons:

- `accessibility`
- `administration`
- `alternativeComplementary`
- `ambulance`
- `anesthesia`
- `billing`
- `cardiology`
- `careStaffArea`
- `cathLab`
- `chapel`
- `coffeeShop`
- `dental`
- `dermatology`
- `diabetesEducation`
- `drinkingFountain`
- `earNoseThroat`
- `elevators`
- `emergency`
- `familyPractice`
- `fireExtinguisher`
- `firstAid`
- `genetics`
- `giftShop`
- `healthEducation`
- `healthServices`
- `hearingAssistance`
- `hospital`
- `iAccessibility`
- `iAdministration`
- `iAlternativeComplementary`
- `iAmbulance`
- `iAnesthesia`
- `iBilling`
- `iCardiology`
- `iCareStaffArea`
- `iCathLab`
- `iChapel`
- `iCoffeeShop`
- `iDental`
- `iDermatology`
- `iDiabetesEducation`
- `iDrinkingFountain`
- `iEarNoseThroat`
- `iElevators`
- `iEmergency`
- `iFamilyPractice`
- `iFireExtinguisher`
- `iFirstAid`
- `iGenetics`
- `iGiftShop`
- `iHealthEducation`
- `iHealthServices`
- `iHearingAssistance`
- `iHospital`
- `iImagingAlternativeCt`
- `iImagingAlternativeMri`
- `iImagingAlternativeMriTwo`
- `iImagingAlternativePet`
- `iImagingRootCategory`
- `iImmunizations`
- `iInfectiousDiseases`
- `iInformationUs`
- `iInpatient`
- `iIntensiveCare`
- `iInternalMedicine`
- `iInterpreterServices`
- `iKidney`
- `iLaborDelivery`
- `iLaboratory`
- `iMammography`
- `iMedicalLibrary`
- `iMedicalRecords`
- `iMentalHealth`
- `iMriPet`
- `iNeurology`
- `iNoSmoking`
- `iNursery`
- `iNutrition`
- `iOncology`
- `iOphthalmology`
- `iOutpatient`
- `iPathology`
- `iPediatrics`
- `iPharmacy`
- `iPhysicalTherapy`
- `iRadiology`
- `iRegistration`
- `iRespiratory`
- `iRestaurant`
- `iRestrooms`
- `iSmoking`
- `iSocialServices`
- `iStairs`
- `iSurgery`
- `iTextTelephone`
- `iUltrasound`
- `iVolumeControl`
- `iWaitingArea`
- `iWomensHealth`
- `imagingAlternativeCt`
- `imagingAlternativeMri`
- `imagingAlternativeMriTwo`
- `imagingAlternativePet`
- `imagingRootCategory`
- `immunizations`
- `infectiousDiseases`
- `informationUs`
- `inpatient`
- `intensiveCare`
- `internalMedicine`
- `interpreterServices`
- `kidney`
- `laborDelivery`
- `laboratory`
- `mammography`
- `medicalLibrary`
- `medicalRecords`
- `mentalHealth`
- `mriPet`
- `neurology`
- `noSmoking`
- `nursery`
- `nutrition`
- `oncology`
- `ophthalmology`
- `outpatient`
- `pathology`
- `pediatrics`
- `pharmacy`
- `physicalTherapy`
- `radiology`
- `registration`
- `respiratory`
- `restaurant`
- `restrooms`
- `smoking`
- `socialServices`
- `stairs`
- `surgery`
- `textTelephone`
- `ultrasound`
- `volumeControl`
- `waitingArea`
- `womensHealth`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccessibilityIcon, AdministrationIcon, AlternativeComplementaryIcon, AmbulanceIcon } from '@stacksjs/iconify-medical-icon'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AdministrationIcon({ size: 20, class: 'nav-icon' }),
    contact: AlternativeComplementaryIcon({ size: 20, class: 'nav-icon' }),
    settings: AmbulanceIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-medical-icon'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AdministrationIcon, AlternativeComplementaryIcon } from '@stacksjs/iconify-medical-icon'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdministrationIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlternativeComplementaryIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AdministrationIcon } from '@stacksjs/iconify-medical-icon'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, administration } from '@stacksjs/iconify-medical-icon'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AdministrationIcon } from '@stacksjs/iconify-medical-icon'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-medical-icon'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-medical-icon'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-medical-icon'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/samcome/webfont-medical-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Samuel Frémondière ([Website](https://github.com/samcome/webfont-medical-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/medical-icon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/medical-icon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
