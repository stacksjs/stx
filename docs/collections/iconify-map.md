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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbseilingIcon, AccountingIcon, AirportIcon } from '@stacksjs/iconify-map'

// Basic usage
const icon = AbseilingIcon()

// With size
const sizedIcon = AbseilingIcon({ size: 24 })

// With color
const coloredIcon = AccountingIcon({ color: 'red' })

// With multiple props
const customIcon = AirportIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbseilingIcon, AccountingIcon, AirportIcon } from '@stacksjs/iconify-map'

  global.icons = {
    home: AbseilingIcon({ size: 24 }),
    user: AccountingIcon({ size: 24, color: '#4a90e2' }),
    settings: AirportIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AbseilingIcon({ color: 'red' })
const blueIcon = AbseilingIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbseilingIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbseilingIcon({ class: 'text-primary' })
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
const icon24 = AbseilingIcon({ size: 24 })
const icon1em = AbseilingIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbseilingIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbseilingIcon({ height: '1em' })
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
const smallIcon = AbseilingIcon({ class: 'icon-small' })
const largeIcon = AbseilingIcon({ class: 'icon-large' })
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
@js
  import { AbseilingIcon, AccountingIcon, AirportIcon, AmusementParkIcon } from '@stacksjs/iconify-map'

  global.navIcons = {
    home: AbseilingIcon({ size: 20, class: 'nav-icon' }),
    about: AccountingIcon({ size: 20, class: 'nav-icon' }),
    contact: AirportIcon({ size: 20, class: 'nav-icon' }),
    settings: AmusementParkIcon({ size: 20, class: 'nav-icon' })
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
import { AbseilingIcon } from '@stacksjs/iconify-map'

const icon = AbseilingIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbseilingIcon, AccountingIcon, AirportIcon } from '@stacksjs/iconify-map'

const successIcon = AbseilingIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccountingIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AirportIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbseilingIcon, AccountingIcon } from '@stacksjs/iconify-map'
   const icon = AbseilingIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abseiling, accounting } from '@stacksjs/iconify-map'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abseiling, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbseilingIcon, AccountingIcon } from '@stacksjs/iconify-map'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-map'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbseilingIcon } from '@stacksjs/iconify-map'
     global.icon = AbseilingIcon({ size: 24 })
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
   const icon = AbseilingIcon({ class: 'icon' })
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
