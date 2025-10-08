# Gala Icons

> Gala Icons icons for stx from Iconify

## Overview

This package provides access to 51 icons from the Gala Icons collection through the stx iconify integration.

**Collection ID:** `gala`
**Total Icons:** 51
**Author:** Jake Wells ([Website](https://github.com/cyberalien/gala-icons))
**License:** GPL ([Details](https://github.com/cyberalien/gala-icons/blob/main/LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gala
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
    <AirplayIcon size="24" color="#4a90e2" />
    <AppleIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { add, airplay, apple } from '@stacksjs/iconify-gala'
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
.gala-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddIcon class="gala-icon" />
```

## Available Icons

This package contains **51** icons:

- `add`
- `airplay`
- `apple`
- `bag`
- `bell`
- `book`
- `brochure`
- `calendar`
- `chart`
- `chat`
- `clock`
- `copy`
- `data`
- `display`
- `editor`
- `file`
- `fileCode1`
- `fileCode2`
- `fileDocument`
- `fileError`
- `fileScript`
- `fileSpreadsheet`
- `fileText`
- `folder`
- `globe`
- `help`
- `image`
- `issue`
- `layer`
- `lock`
- `mouse`
- `multi`
- `orbit`
- `portrait1`
- `portrait2`
- `radar`
- `remove`
- `search`
- `secure`
- `select`
- `settings`
- `shield`
- `sidebarLeft`
- `sidebarRight`
- `store`
- `terminal`
- `tv`
- `unlock`
- `usb`
- `video`
- `window`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AirplayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AppleIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><BagIcon size="20" class="nav-icon" /> Settings</a>
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
    <AirplayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AppleIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddIcon size="24" />
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
     import { add } from '@stacksjs/iconify-gala'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(add, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { add } from '@stacksjs/iconify-gala'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

GPL

See [license details](https://github.com/cyberalien/gala-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Jake Wells ([Website](https://github.com/cyberalien/gala-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gala/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gala/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
