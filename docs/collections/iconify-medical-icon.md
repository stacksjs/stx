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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />

<!-- Using width and height -->
<AccessibilityIcon width="24" height="32" />

<!-- With color -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessibilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessibilityIcon
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
    <AccessibilityIcon size="24" />
    <AdministrationIcon size="24" color="#4a90e2" />
    <AlternativeComplementaryIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessibilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessibilityIcon size="24" class="text-primary" />
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
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.medicalIcon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessibilityIcon class="medicalIcon-icon" />
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
<nav>
  <a href="/"><AccessibilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdministrationIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlternativeComplementaryIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AmbulanceIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessibilityIcon
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
    <AccessibilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdministrationIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlternativeComplementaryIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessibilityIcon size="24" />
   <AdministrationIcon size="24" color="#4a90e2" />
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
   <AccessibilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessibilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessibilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-medical-icon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
