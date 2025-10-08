# Innowatio Font

> Innowatio Font icons for stx from Iconify

## Overview

This package provides access to 105 icons from the Innowatio Font collection through the stx iconify integration.

**Collection ID:** `iwwa`
**Total Icons:** 105
**Author:** Innowatio ([Website](https://github.com/innowatio/iwwa-icons))
**License:** Apache 2.0 ([Details](https://www.apache.org/licenses/LICENSE-2.0))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-iwwa
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddIcon height="1em" />
<AddIcon width="1em" height="1em" />
<AddIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddIcon size="24" />
<AddIcon size="1em" />

<!-- Using width and height -->
<AddIcon width="24" height="32" />

<!-- With color -->
<AddIcon size="24" color="red" />
<AddIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddIcon
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
    <AddIcon size="24" />
    <Add15mIcon size="24" color="#4a90e2" />
    <Add1dIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { add, add15m, add1d } from '@stacksjs/iconify-iwwa'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(add, { size: 24 })
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
<AddIcon size="24" color="red" />
<AddIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddIcon size="24" class="text-primary" />
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
<AddIcon height="1em" />
<AddIcon width="1em" height="1em" />
<AddIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddIcon size="24" />
<AddIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.iwwa-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddIcon class="iwwa-icon" />
```

## Available Icons

This package contains **105** icons:

- `add`
- `add15m`
- `add1d`
- `add1m`
- `add1w`
- `add1y`
- `alarm`
- `alarmO`
- `alert`
- `angleLeft`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `assign`
- `bad`
- `badO`
- `box`
- `calendar`
- `chart`
- `chartStyle1`
- `chartStyle2`
- `chartStyle3`
- `chartStyle4`
- `circumflex`
- `clone`
- `close`
- `closeBraket`
- `co2`
- `confront`
- `connectionO`
- `consumptionO`
- `csv`
- `danger`
- `dashboard`
- `delete`
- `delta`
- `divide`
- `dragDrop`
- `duplicate`
- `edit`
- `expand`
- `export`
- `fileCsv`
- `filePdf`
- `filePng`
- `fileXsl`
- `filter`
- `flag`
- `gauge`
- `good`
- `goodO`
- `help`
- `history`
- `humidity`
- `info`
- `information`
- `innowatioLogo`
- `lightbulb`
- `listFavourite`
- `lock`
- `logout`
- `map`
- `menu`
- `merge`
- `middleO`
- `middling`
- `minus`
- `monitoring`
- `month`
- `multiply`
- `numberAsc`
- `numberDesc`
- `openBraket`
- `option`
- `optionHorizontal`
- `pause`
- `percentage`
- `pinch`
- `png`
- `power`
- `remoteControlO`
- `remove15m`
- `remove1d`
- `remove1m`
- `remove1w`
- `remove1y`
- `reset`
- `search`
- `settings`
- `sortBy`
- `squareRoot`
- `star`
- `starO`
- `swipe`
- `tag`
- `textAsc`
- `textDesc`
- `thermometer`
- `trash`
- `upload`
- `user`
- `userFunctions`
- `week`
- `year`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Add15mIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><Add1dIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><Add1mIcon size="20" class="nav-icon" /> Settings</a>
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
<AddIcon
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
    <AddIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Add15mIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <Add1dIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddIcon size="24" />
   <Add15mIcon size="24" color="#4a90e2" />
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
   <AddIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { add } from '@stacksjs/iconify-iwwa'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(add, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { add } from '@stacksjs/iconify-iwwa'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://www.apache.org/licenses/LICENSE-2.0) for more information.

## Credits

- **Icons**: Innowatio ([Website](https://github.com/innowatio/iwwa-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/iwwa/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/iwwa/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
