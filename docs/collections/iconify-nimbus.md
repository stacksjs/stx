# Nimbus

> Nimbus icons for stx from Iconify

## Overview

This package provides access to 140 icons from the Nimbus collection through the stx iconify integration.

**Collection ID:** `nimbus`
**Total Icons:** 140
**Author:** Linkedstore S.A. ([Website](https://github.com/cyberalien/nimbus-icons))
**License:** MIT ([Details](https://github.com/cyberalien/nimbus-icons/blob/main/LICENSE))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nimbus
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccordionIcon height="1em" />
<AccordionIcon width="1em" height="1em" />
<AccordionIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccordionIcon size="24" />
<AccordionIcon size="1em" />

<!-- Using width and height -->
<AccordionIcon width="24" height="32" />

<!-- With color -->
<AccordionIcon size="24" color="red" />
<AccordionIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccordionIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccordionIcon
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
    <AccordionIcon size="24" />
    <AlignCenterIcon size="24" color="#4a90e2" />
    <AlignLeftIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accordion, alignCenter, alignLeft } from '@stacksjs/iconify-nimbus'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accordion, { size: 24 })
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
<AccordionIcon size="24" color="red" />
<AccordionIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccordionIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccordionIcon size="24" class="text-primary" />
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
<AccordionIcon height="1em" />
<AccordionIcon width="1em" height="1em" />
<AccordionIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccordionIcon size="24" />
<AccordionIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.nimbus-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccordionIcon class="nimbus-icon" />
```

## Available Icons

This package contains **140** icons:

- `accordion`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `apps`
- `archive`
- `arrowLeft`
- `arrowRight`
- `arrowsHorizontal`
- `arrowsVertical`
- `backspace`
- `barcode`
- `bold`
- `boxPacked`
- `boxUnpacked`
- `briefcase`
- `browser`
- `browserSearch`
- `calendar`
- `calendarDays`
- `camera`
- `cash`
- `chatDots`
- `check`
- `checkCircle`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `christ`
- `clock`
- `close`
- `code`
- `cog`
- `colorPalette`
- `copy`
- `creditCard`
- `desktop`
- `discountCircle`
- `diskette`
- `download`
- `drag`
- `dragDots`
- `drink`
- `drop`
- `drums`
- `duplicate`
- `ecosystem`
- `edit`
- `ellipsis`
- `exclamationCircle`
- `exclamationTriangle`
- `externalLink`
- `eye`
- `eyeOff`
- `file`
- `fileAlt`
- `fingerprint`
- `fire`
- `flag`
- `font`
- `forbidden`
- `giftBox`
- `giftCard`
- `glasses`
- `globe`
- `guitar`
- `heart`
- `history`
- `home`
- `infinite`
- `infoCircle`
- `invoice`
- `italic`
- `lifeRing`
- `lightbulb`
- `link`
- `linkOff`
- `list`
- `location`
- `lock`
- `lockOpen`
- `logOut`
- `mail`
- `marketing`
- `mate`
- `menu`
- `mobile`
- `money`
- `moon`
- `notification`
- `obelisk`
- `orderedList`
- `pencil`
- `peso`
- `picture`
- `pix`
- `planet`
- `plusCircle`
- `printer`
- `pyramid`
- `qrCode`
- `questionCircle`
- `real`
- `redo`
- `removeFormat`
- `rocket`
- `scooter`
- `search`
- `share`
- `shoppingCart`
- `shot`
- `sizeHeight`
- `sizeWidth`
- `sliders`
- `star`
- `stats`
- `stickyNote`
- `stop`
- `store`
- `sun`
- `tag`
- `telephone`
- `textSize`
- `tiendanube`
- `tools`
- `transferPeso`
- `transferReal`
- `trash`
- `truck`
- `undo`
- `university`
- `upload`
- `user`
- `userCircle`
- `userGroup`
- `verticalStacks`
- `volume`
- `wallet`
- `whatsapp`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccordionIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlignCenterIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignLeftIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignRightIcon size="20" class="nav-icon" /> Settings</a>
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
<AccordionIcon
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
    <AccordionIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlignCenterIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignLeftIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccordionIcon size="24" />
   <AlignCenterIcon size="24" color="#4a90e2" />
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
   <AccordionIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccordionIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccordionIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accordion } from '@stacksjs/iconify-nimbus'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accordion, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accordion } from '@stacksjs/iconify-nimbus'

// Icons are typed as IconData
const myIcon: IconData = accordion
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/cyberalien/nimbus-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Linkedstore S.A. ([Website](https://github.com/cyberalien/nimbus-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nimbus/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nimbus/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
