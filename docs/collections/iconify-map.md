# Map Icons

> Map Icons icons for stx from Iconify

## Overview

This package provides access to 167 icons from the Map Icons collection through the stx iconify integration.

**Collection ID:** `map`
**Total Icons:** 167
**Author:** Scott de Jonge ([Website](https://github.com/scottdejonge/map-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Flags / Maps
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-map
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbseilingIcon height="1em" />
<AbseilingIcon width="1em" height="1em" />
<AbseilingIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbseilingIcon size="24" />
<AbseilingIcon size="1em" />

<!-- Using width and height -->
<AbseilingIcon width="24" height="32" />

<!-- With color -->
<AbseilingIcon size="24" color="red" />
<AbseilingIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbseilingIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbseilingIcon
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
    <AbseilingIcon size="24" />
    <AccountingIcon size="24" color="#4a90e2" />
    <AirportIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { abseiling, accounting, airport } from '@stacksjs/iconify-map'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abseiling, { size: 24 })
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
<AbseilingIcon size="24" color="red" />
<AbseilingIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbseilingIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbseilingIcon size="24" class="text-primary" />
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
<AbseilingIcon height="1em" />
<AbseilingIcon width="1em" height="1em" />
<AbseilingIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbseilingIcon size="24" />
<AbseilingIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.map-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbseilingIcon class="map-icon" />
```

## Available Icons

This package contains **167** icons:

- `abseiling`
- `accounting`
- `airport`
- `amusementPark`
- `aquarium`
- `archery`
- `artGallery`
- `assistiveListeningSystem`
- `atm`
- `audioDescription`
- `bakery`
- `bank`
- `bar`
- `baseball`
- `beautySalon`
- `bicycleStore`
- `boatRamp`
- `boatTour`
- `boating`
- `bookStore`
- `bowlingAlley`
- `braille`
- `busStation`
- `cafe`
- `campground`
- `canoe`
- `carDealer`
- `carRental`
- `carRepair`
- `carWash`
- `casino`
- `cemetery`
- `chairlift`
- `church`
- `circle`
- `cityHall`
- `climbing`
- `closedCaptioning`
- `clothingStore`
- `compass`
- `convenienceStore`
- `courthouse`
- `crossCountrySkiing`
- `crosshairs`
- `dentist`
- `departmentStore`
- `diving`
- `doctor`
- `electrician`
- `electronicsStore`
- `embassy`
- `expand`
- `female`
- `finance`
- `fireStation`
- `fishCleaning`
- `fishingPier`
- `florist`
- `food`
- `fullscreen`
- `funeralHome`
- `furnitureStore`
- `gasStation`
- `generalContractor`
- `groceryOrSupermarket`
- `gym`
- `hairCare`
- `hangGliding`
- `hardwareStore`
- `health`
- `hinduTemple`
- `hospital`
- `iceFishing`
- `iceSkating`
- `inlineSkating`
- `insuranceAgency`
- `jetSkiing`
- `jewelryStore`
- `kayaking`
- `laundry`
- `lawyer`
- `library`
- `liquorStore`
- `localGovernment`
- `locationArrow`
- `locksmith`
- `lodging`
- `lowVisionAccess`
- `male`
- `mapPin`
- `marina`
- `mosque`
- `movieRental`
- `movieTheater`
- `movingCompany`
- `museum`
- `naturalFeature`
- `nightClub`
- `openCaptioning`
- `painter`
- `park`
- `parking`
- `petStore`
- `pharmacy`
- `physiotherapist`
- `placeOfWorship`
- `playground`
- `plumber`
- `pointOfInterest`
- `police`
- `political`
- `postBox`
- `postOffice`
- `postalCode`
- `postalCodePrefix`
- `rafting`
- `realEstateAgency`
- `restaurant`
- `roofingContractor`
- `route`
- `routePin`
- `rvPark`
- `sailing`
- `school`
- `scubaDiving`
- `search`
- `sheild`
- `shoppingMall`
- `signLanguage`
- `skateboarding`
- `skiJumping`
- `skiing`
- `sledding`
- `snow`
- `snowShoeing`
- `snowboarding`
- `snowmobile`
- `spa`
- `square`
- `squarePin`
- `squareRounded`
- `stadium`
- `storage`
- `store`
- `subwayStation`
- `surfing`
- `swimming`
- `synagogue`
- `taxiStand`
- `tennis`
- `toilet`
- `trainStation`
- `transitStation`
- `travelAgency`
- `unisex`
- `university`
- `veterinaryCare`
- `volumeControlTelephone`
- `waterskiing`
- `whaleWatching`
- `wheelchair`
- `windSurfing`
- `zoo`
- `zoomIn`
- `zoomInAlt`
- `zoomOut`
- `zoomOutAlt`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AbseilingIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccountingIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AirportIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AmusementParkIcon size="20" class="nav-icon" /> Settings</a>
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
<AbseilingIcon
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
    <AbseilingIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccountingIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AirportIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbseilingIcon size="24" />
   <AccountingIcon size="24" color="#4a90e2" />
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
   <AbseilingIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbseilingIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbseilingIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abseiling } from '@stacksjs/iconify-map'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abseiling, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abseiling } from '@stacksjs/iconify-map'

// Icons are typed as IconData
const myIcon: IconData = abseiling
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Scott de Jonge ([Website](https://github.com/scottdejonge/map-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/map/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/map/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
