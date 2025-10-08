# Duoicons

> Duoicons icons for stx from Iconify

## Overview

This package provides access to 91 icons from the Duoicons collection through the stx iconify integration.

**Collection ID:** `duo-icons`
**Total Icons:** 91
**Author:** fernandcf ([Website](https://github.com/fazdiu/duo-icons))
**License:** MIT ([Details](https://github.com/fazdiu/duo-icons/blob/master/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-duo-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddCircleIcon height="1em" />
<AddCircleIcon width="1em" height="1em" />
<AddCircleIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddCircleIcon size="24" />
<AddCircleIcon size="1em" />

<!-- Using width and height -->
<AddCircleIcon width="24" height="32" />

<!-- With color -->
<AddCircleIcon size="24" color="red" />
<AddCircleIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddCircleIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddCircleIcon
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
    <AddCircleIcon size="24" />
    <AirplayIcon size="24" color="#4a90e2" />
    <AlertOctagonIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addCircle, airplay, alertOctagon } from '@stacksjs/iconify-duo-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addCircle, { size: 24 })
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
<AddCircleIcon size="24" color="red" />
<AddCircleIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddCircleIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddCircleIcon size="24" class="text-primary" />
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
<AddCircleIcon height="1em" />
<AddCircleIcon width="1em" height="1em" />
<AddCircleIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddCircleIcon size="24" />
<AddCircleIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.duoIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddCircleIcon class="duoIcons-icon" />
```

## Available Icons

This package contains **91** icons:

- `addCircle`
- `airplay`
- `alertOctagon`
- `alertTriangle`
- `alignBottom`
- `alignCenter`
- `android`
- `app`
- `appDots`
- `apple`
- `approved`
- `appstore`
- `award`
- `babyCarriage`
- `bank`
- `battery`
- `bell`
- `bellBadge`
- `book`
- `book2`
- `book3`
- `bookmark`
- `box`
- `box2`
- `bread`
- `bridge`
- `briefcase`
- `brush`
- `brush2`
- `bug`
- `building`
- `bus`
- `cake`
- `calendar`
- `camera`
- `cameraSquare`
- `campground`
- `candle`
- `car`
- `certificate`
- `chartPie`
- `checkCircle`
- `chip`
- `clapperboard`
- `clipboard`
- `clock`
- `cloudLightning`
- `cloudSnow`
- `coinStack`
- `compass`
- `computerCamera`
- `computerCameraOff`
- `confetti`
- `creditCard`
- `currencyEuro`
- `dashboard`
- `discount`
- `disk`
- `file`
- `fire`
- `folderOpen`
- `folderUpload`
- `gTranslate`
- `idCard`
- `info`
- `lamp`
- `lamp2`
- `location`
- `marker`
- `menu`
- `message`
- `message2`
- `message3`
- `moon2`
- `moonStars`
- `palette`
- `rocket`
- `settings`
- `shoppingBag`
- `slideshow`
- `smartphone`
- `smartphoneVibration`
- `smartwatch`
- `sun`
- `target`
- `toggle`
- `translation`
- `uploadFile`
- `user`
- `userCard`
- `world`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddCircleIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlertOctagonIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlertTriangleIcon size="20" class="nav-icon" /> Settings</a>
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
<AddCircleIcon
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
    <AddCircleIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AirplayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlertOctagonIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddCircleIcon size="24" />
   <AirplayIcon size="24" color="#4a90e2" />
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
   <AddCircleIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddCircleIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddCircleIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addCircle } from '@stacksjs/iconify-duo-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addCircle, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addCircle } from '@stacksjs/iconify-duo-icons'

// Icons are typed as IconData
const myIcon: IconData = addCircle
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/fazdiu/duo-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: fernandcf ([Website](https://github.com/fazdiu/duo-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/duo-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/duo-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
