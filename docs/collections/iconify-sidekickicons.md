# SidekickIcons

> SidekickIcons icons for stx from Iconify

## Overview

This package provides access to 224 icons from the SidekickIcons collection through the stx iconify integration.

**Collection ID:** `sidekickicons`
**Total Icons:** 224
**Author:** Andri Soone ([Website](https://github.com/ndri/sidekickicons))
**License:** MIT ([Details](https://github.com/ndri/sidekickicons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-sidekickicons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ArcThirdIcon height="1em" />
<ArcThirdIcon width="1em" height="1em" />
<ArcThirdIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ArcThirdIcon size="24" />
<ArcThirdIcon size="1em" />

<!-- Using width and height -->
<ArcThirdIcon width="24" height="32" />

<!-- With color -->
<ArcThirdIcon size="24" color="red" />
<ArcThirdIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ArcThirdIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ArcThirdIcon
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
    <ArcThirdIcon size="24" />
    <ArcThird16SolidIcon size="24" color="#4a90e2" />
    <ArcThird20SolidIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { arcThird, arcThird16Solid, arcThird20Solid } from '@stacksjs/iconify-sidekickicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(arcThird, { size: 24 })
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
<ArcThirdIcon size="24" color="red" />
<ArcThirdIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ArcThirdIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ArcThirdIcon size="24" class="text-primary" />
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
<ArcThirdIcon height="1em" />
<ArcThirdIcon width="1em" height="1em" />
<ArcThirdIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ArcThirdIcon size="24" />
<ArcThirdIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.sidekickicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ArcThirdIcon class="sidekickicons-icon" />
```

## Available Icons

This package contains **224** icons:

- `arcThird`
- `arcThird16Solid`
- `arcThird20Solid`
- `arcThirdSolid`
- `archiveBoxArrowUp`
- `archiveBoxArrowUp16Solid`
- `archiveBoxArrowUp20Solid`
- `archiveBoxArrowUpSolid`
- `arrowPathClock`
- `arrowPathClock16Solid`
- `arrowPathClock20Solid`
- `arrowPathClockSolid`
- `arrowPathSingleClockwise`
- `arrowPathSingleClockwise16Solid`
- `arrowPathSingleClockwise20Solid`
- `arrowPathSingleClockwiseSolid`
- `arrowPathSingleCounterclockwise`
- `arrowPathSingleCounterclockwise16Solid`
- `arrowPathSingleCounterclockwise20Solid`
- `arrowPathSingleCounterclockwiseSolid`
- `arrowsCrossing`
- `arrowsCrossing16Solid`
- `arrowsCrossing20Solid`
- `arrowsCrossingSolid`
- `badge`
- `badge16Solid`
- `badge20Solid`
- `badgeSolid`
- `bars3BottomCenter`
- `bars3BottomCenter16Solid`
- `bars3BottomCenter20Solid`
- `bars3BottomCenterSolid`
- `blockquote`
- `blockquote16Solid`
- `blockquote20Solid`
- `blockquoteSolid`
- `checkDouble`
- `checkDouble16Solid`
- `checkDouble20Solid`
- `checkDoubleSolid`
- `checklist`
- `checklist16Solid`
- `checklist20Solid`
- `checklistBoxes`
- `checklistBoxes16Solid`
- `checklistBoxes20Solid`
- `checklistBoxesSolid`
- `checklistSolid`
- `chevronDownUp`
- `chevronDownUp16Solid`
- `chevronDownUp20Solid`
- `chevronDownUpSolid`
- `chevronLeftRight`
- `chevronLeftRight16Solid`
- `chevronLeftRight20Solid`
- `chevronLeftRightSolid`
- `chevronRightLeft`
- `chevronRightLeft16Solid`
- `chevronRightLeft20Solid`
- `chevronRightLeftSolid`
- `circle`
- `circle16Solid`
- `circle20Solid`
- `circleDashed`
- `circleDashed16Solid`
- `circleDashed20Solid`
- `circleDashedSolid`
- `circleSolid`
- `compass`
- `compass16Solid`
- `compass20Solid`
- `compassSolid`
- `computerLaptop`
- `computerLaptop16Solid`
- `computerLaptop20Solid`
- `computerLaptopSolid`
- `cookie`
- `cookie16Solid`
- `cookie20Solid`
- `cookieSolid`
- `crown`
- `crown16Solid`
- `crown20Solid`
- `crownSolid`
- `dice`
- `dice16Solid`
- `dice20Solid`
- `diceSolid`
- `dots2x2`
- `dots2x216Solid`
- `dots2x220Solid`
- `dots2x2Solid`
- `dots2x3`
- `dots2x316Solid`
- `dots2x320Solid`
- `dots2x3Solid`
- `dots3x2`
- `dots3x216Solid`
- `dots3x220Solid`
- `dots3x2Solid`
- `dots3x3`
- `dots3x316Solid`
- `dots3x320Solid`
- `dots3x3Solid`
- `faceSmilePlus`
- `faceSmilePlus16Solid`
- `faceSmilePlus20Solid`
- `faceSmilePlusSolid`
- `floppyDisk`
- `floppyDisk16Solid`
- `floppyDisk20Solid`
- `floppyDiskSolid`
- `gamepad`
- `gamepad16Solid`
- `gamepad20Solid`
- `gamepadSolid`
- `h4`
- `h416Solid`
- `h420Solid`
- `h4Solid`
- `h5`
- `h516Solid`
- `h520Solid`
- `h5Solid`
- `h6`
- `h616Solid`
- `h620Solid`
- `h6Solid`
- `heading`
- `heading16Solid`
- `heading20Solid`
- `headingSolid`
- `headphones`
- `headphones16Solid`
- `headphones20Solid`
- `headphonesSlash`
- `headphonesSlash16Solid`
- `headphonesSlash20Solid`
- `headphonesSlashSolid`
- `headphonesSolid`
- `indent`
- `indent16Solid`
- `indent20Solid`
- `indentSolid`
- `letteredList`
- `letteredList16Solid`
- `letteredList20Solid`
- `letteredListSolid`
- `lockSemiOpen`
- `lockSemiOpen16Solid`
- `lockSemiOpen20Solid`
- `lockSemiOpenSolid`
- `mask`
- `mask16Solid`
- `mask20Solid`
- `maskSolid`
- `microphoneSlash`
- `microphoneSlash16Solid`
- `microphoneSlash20Solid`
- `microphoneSlashSolid`
- `outdent`
- `outdent16Solid`
- `outdent20Solid`
- `outdentSolid`
- `password`
- `password16Solid`
- `password20Solid`
- `passwordPencil`
- `passwordPencil16Solid`
- `passwordPencil20Solid`
- `passwordPencilSolid`
- `passwordSolid`
- `photoPlus`
- `photoPlus16Solid`
- `photoPlus20Solid`
- `photoPlusSolid`
- `pilcrow`
- `pilcrow16Solid`
- `pilcrow20Solid`
- `pilcrowSolid`
- `pin`
- `pin16Solid`
- `pin20Solid`
- `pinSlash`
- `pinSlash16Solid`
- `pinSlash20Solid`
- `pinSlashSolid`
- `pinSolid`
- `quotationMark`
- `quotationMark16Solid`
- `quotationMark20Solid`
- `quotationMarkSolid`
- `radialRays`
- `radialRays16Solid`
- `radialRays20Solid`
- `radialRaysSolid`
- `robot`
- `robot16Solid`
- `robot20Solid`
- `robotSolid`
- `shield`
- `shield16Solid`
- `shield20Solid`
- `shieldSolid`
- `sidebarLeft`
- `sidebarLeft16Solid`
- `sidebarLeft20Solid`
- `sidebarLeftSolid`
- `sidebarRight`
- `sidebarRight16Solid`
- `sidebarRight20Solid`
- `sidebarRightSolid`
- `square`
- `square16Solid`
- `square20Solid`
- `squareSolid`
- `triangle`
- `triangle16Solid`
- `triangle20Solid`
- `triangleSolid`
- `viewSplit`
- `viewSplit16Solid`
- `viewSplit20Solid`
- `viewSplitSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><ArcThirdIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ArcThird16SolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ArcThird20SolidIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArcThirdSolidIcon size="20" class="nav-icon" /> Settings</a>
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
<ArcThirdIcon
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
    <ArcThirdIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ArcThird16SolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ArcThird20SolidIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ArcThirdIcon size="24" />
   <ArcThird16SolidIcon size="24" color="#4a90e2" />
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
   <ArcThirdIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ArcThirdIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ArcThirdIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { arcThird } from '@stacksjs/iconify-sidekickicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(arcThird, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { arcThird } from '@stacksjs/iconify-sidekickicons'

// Icons are typed as IconData
const myIcon: IconData = arcThird
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/ndri/sidekickicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Andri Soone ([Website](https://github.com/ndri/sidekickicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/sidekickicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/sidekickicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
