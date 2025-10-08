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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 12DotsScaleRotateIcon, 180RingIcon, 180RingWithBgIcon } from '@stacksjs/iconify-svg-spinners'

// Basic usage
const icon = 12DotsScaleRotateIcon()

// With size
const sizedIcon = 12DotsScaleRotateIcon({ size: 24 })

// With color
const coloredIcon = 180RingIcon({ color: 'red' })

// With multiple props
const customIcon = 180RingWithBgIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 12DotsScaleRotateIcon, 180RingIcon, 180RingWithBgIcon } from '@stacksjs/iconify-svg-spinners'

  global.icons = {
    home: 12DotsScaleRotateIcon({ size: 24 }),
    user: 180RingIcon({ size: 24, color: '#4a90e2' }),
    settings: 180RingWithBgIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = 12DotsScaleRotateIcon({ color: 'red' })
const blueIcon = 12DotsScaleRotateIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 12DotsScaleRotateIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 12DotsScaleRotateIcon({ class: 'text-primary' })
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
const icon24 = 12DotsScaleRotateIcon({ size: 24 })
const icon1em = 12DotsScaleRotateIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 12DotsScaleRotateIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 12DotsScaleRotateIcon({ height: '1em' })
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
const smallIcon = 12DotsScaleRotateIcon({ class: 'icon-small' })
const largeIcon = 12DotsScaleRotateIcon({ class: 'icon-large' })
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
@js
  import { 12DotsScaleRotateIcon, 180RingIcon, 180RingWithBgIcon, 270RingIcon } from '@stacksjs/iconify-svg-spinners'

  global.navIcons = {
    home: 12DotsScaleRotateIcon({ size: 20, class: 'nav-icon' }),
    about: 180RingIcon({ size: 20, class: 'nav-icon' }),
    contact: 180RingWithBgIcon({ size: 20, class: 'nav-icon' }),
    settings: 270RingIcon({ size: 20, class: 'nav-icon' })
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
import { 12DotsScaleRotateIcon } from '@stacksjs/iconify-svg-spinners'

const icon = 12DotsScaleRotateIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 12DotsScaleRotateIcon, 180RingIcon, 180RingWithBgIcon } from '@stacksjs/iconify-svg-spinners'

const successIcon = 12DotsScaleRotateIcon({ size: 16, color: '#22c55e' })
const warningIcon = 180RingIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 180RingWithBgIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 12DotsScaleRotateIcon, 180RingIcon } from '@stacksjs/iconify-svg-spinners'
   const icon = 12DotsScaleRotateIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 12DotsScaleRotate, 180Ring } from '@stacksjs/iconify-svg-spinners'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(12DotsScaleRotate, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 12DotsScaleRotateIcon, 180RingIcon } from '@stacksjs/iconify-svg-spinners'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-svg-spinners'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 12DotsScaleRotateIcon } from '@stacksjs/iconify-svg-spinners'
     global.icon = 12DotsScaleRotateIcon({ size: 24 })
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
   const icon = 12DotsScaleRotateIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
