# Fontelico

> Fontelico icons for stx from Iconify

## Overview

This package provides access to 34 icons from the Fontelico collection through the stx iconify integration.

**Collection ID:** `fontelico`
**Total Icons:** 34
**Author:** Fontello ([Website](https://github.com/fontello/fontelico.font))
**License:** CC BY SA ([Details](https://creativecommons.org/licenses/by-sa/3.0/))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fontelico
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ChromeIcon height="1em" />
<ChromeIcon width="1em" height="1em" />
<ChromeIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ChromeIcon size="24" />
<ChromeIcon size="1em" />

<!-- Using width and height -->
<ChromeIcon width="24" height="32" />

<!-- With color -->
<ChromeIcon size="24" color="red" />
<ChromeIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ChromeIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ChromeIcon
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
    <ChromeIcon size="24" />
    <CrownIcon size="24" color="#4a90e2" />
    <CrownMinusIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { chrome, crown, crownMinus } from '@stacksjs/iconify-fontelico'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(chrome, { size: 24 })
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
<ChromeIcon size="24" color="red" />
<ChromeIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ChromeIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ChromeIcon size="24" class="text-primary" />
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
<ChromeIcon height="1em" />
<ChromeIcon width="1em" height="1em" />
<ChromeIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ChromeIcon size="24" />
<ChromeIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fontelico-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ChromeIcon class="fontelico-icon" />
```

## Available Icons

This package contains **34** icons:

- `chrome`
- `crown`
- `crownMinus`
- `crownPlus`
- `emoAngry`
- `emoBeer`
- `emoCoffee`
- `emoCry`
- `emoDevil`
- `emoDispleased`
- `emoGrin`
- `emoHappy`
- `emoLaugh`
- `emoSaint`
- `emoShoot`
- `emoSleep`
- `emoSquint`
- `emoSunglasses`
- `emoSurprised`
- `emoThumbsup`
- `emoTongue`
- `emoUnhappy`
- `emoWink`
- `emoWink2`
- `firefox`
- `ie`
- `marquee`
- `opera`
- `spin1`
- `spin2`
- `spin3`
- `spin4`
- `spin5`
- `spin6`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><ChromeIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><CrownIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><CrownMinusIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><CrownPlusIcon size="20" class="nav-icon" /> Settings</a>
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
<ChromeIcon
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
    <ChromeIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <CrownIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <CrownMinusIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ChromeIcon size="24" />
   <CrownIcon size="24" color="#4a90e2" />
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
   <ChromeIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ChromeIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ChromeIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { chrome } from '@stacksjs/iconify-fontelico'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(chrome, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { chrome } from '@stacksjs/iconify-fontelico'

// Icons are typed as IconData
const myIcon: IconData = chrome
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY SA

See [license details](https://creativecommons.org/licenses/by-sa/3.0/) for more information.

## Credits

- **Icons**: Fontello ([Website](https://github.com/fontello/fontelico.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fontelico/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fontelico/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
