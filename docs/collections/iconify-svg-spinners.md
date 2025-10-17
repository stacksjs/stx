# SVG Spinners

> SVG Spinners icons for stx from Iconify

## Overview

This package provides access to 46 icons from the SVG Spinners collection through the stx iconify integration.

**Collection ID:** `svg-spinners`
**Total Icons:** 46
**Author:** Utkarsh Verma ([Website](https://github.com/n3r4zzurr0/svg-spinners))
**License:** MIT ([Details](https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-svg-spinners
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<12DotsScaleRotateIcon height="1em" />
<12DotsScaleRotateIcon width="1em" height="1em" />
<12DotsScaleRotateIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<12DotsScaleRotateIcon size="24" />
<12DotsScaleRotateIcon size="1em" />

<!-- Using width and height -->
<12DotsScaleRotateIcon width="24" height="32" />

<!-- With color -->
<12DotsScaleRotateIcon size="24" color="red" />
<12DotsScaleRotateIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<12DotsScaleRotateIcon size="24" class="icon-primary" />

<!-- With all properties -->
<12DotsScaleRotateIcon
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
    <12DotsScaleRotateIcon size="24" />
    <180RingIcon size="24" color="#4a90e2" />
    <180RingWithBgIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 12DotsScaleRotate, 180Ring, 180RingWithBg } from '@stacksjs/iconify-svg-spinners'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(12DotsScaleRotate, { size: 24 })
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
<12DotsScaleRotateIcon size="24" color="red" />
<12DotsScaleRotateIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<12DotsScaleRotateIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<12DotsScaleRotateIcon size="24" class="text-primary" />
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
<12DotsScaleRotateIcon height="1em" />
<12DotsScaleRotateIcon width="1em" height="1em" />
<12DotsScaleRotateIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<12DotsScaleRotateIcon size="24" />
<12DotsScaleRotateIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.svgSpinners-icon {
  width: 1em;
  height: 1em;
}
```

```html
<12DotsScaleRotateIcon class="svgSpinners-icon" />
```

## Available Icons

This package contains **46** icons:

- `12DotsScaleRotate`
- `180Ring`
- `180RingWithBg`
- `270Ring`
- `270RingWithBg`
- `3DotsBounce`
- `3DotsFade`
- `3DotsMove`
- `3DotsRotate`
- `3DotsScale`
- `3DotsScaleMiddle`
- `6DotsRotate`
- `6DotsScale`
- `6DotsScaleMiddle`
- `8DotsRotate`
- `90Ring`
- `90RingWithBg`
- `barsFade`
- `barsRotateFade`
- `barsScale`
- `barsScaleFade`
- `barsScaleMiddle`
- `blocksScale`
- `blocksShuffle2`
- `blocksShuffle3`
- `blocksWave`
- `bouncingBall`
- `clock`
- `dotRevolve`
- `eclipse`
- `eclipseHalf`
- `gooeyBalls1`
- `gooeyBalls2`
- `pulse`
- `pulse2`
- `pulse3`
- `pulseMultiple`
- `pulseRing`
- `pulseRings2`
- `pulseRings3`
- `pulseRingsMultiple`
- `ringResize`
- `tadpole`
- `wifi`
- `wifiFade`
- `windToy`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><12DotsScaleRotateIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><180RingIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><180RingWithBgIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><270RingIcon size="20" class="nav-icon" /> Settings</a>
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
<12DotsScaleRotateIcon
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
    <12DotsScaleRotateIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <180RingIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <180RingWithBgIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <12DotsScaleRotateIcon size="24" />
   <180RingIcon size="24" color="#4a90e2" />
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
   <12DotsScaleRotateIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <12DotsScaleRotateIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <12DotsScaleRotateIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 12DotsScaleRotate } from '@stacksjs/iconify-svg-spinners'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(12DotsScaleRotate, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 12DotsScaleRotate } from '@stacksjs/iconify-svg-spinners'

// Icons are typed as IconData
const myIcon: IconData = 12DotsScaleRotate
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Utkarsh Verma ([Website](https://github.com/n3r4zzurr0/svg-spinners))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/svg-spinners/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/svg-spinners/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
