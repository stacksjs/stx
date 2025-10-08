# Flat UI Icons

> Flat UI Icons icons for stx from Iconify

## Overview

This package provides access to 100 icons from the Flat UI Icons collection through the stx iconify integration.

**Collection ID:** `flat-ui`
**Total Icons:** 100
**Author:** Designmodo, Inc. ([Website](https://github.com/designmodo/Flat-UI))
**License:** MIT ([Details](https://github.com/designmodo/Flat-UI/blob/master/LICENSE))

**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-flat-ui
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AndroidIcon height="1em" />
<AndroidIcon width="1em" height="1em" />
<AndroidIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AndroidIcon size="24" />
<AndroidIcon size="1em" />

<!-- Using width and height -->
<AndroidIcon width="24" height="32" />

<!-- With color -->
<AndroidIcon size="24" color="red" />
<AndroidIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AndroidIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AndroidIcon
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
    <AndroidIcon size="24" />
    <Android1Icon size="24" color="#4a90e2" />
    <AppStoreIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { android, android1, appStore } from '@stacksjs/iconify-flat-ui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(android, { size: 24 })
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<AndroidIcon size="24" color="red" />
<AndroidIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AndroidIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AndroidIcon size="24" class="text-primary" />
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
<AndroidIcon height="1em" />
<AndroidIcon width="1em" height="1em" />
<AndroidIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AndroidIcon size="24" />
<AndroidIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.flatUi-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AndroidIcon class="flatUi-icon" />
```

## Available Icons

This package contains **100** icons:

- `android`
- `android1`
- `appStore`
- `arrow`
- `art`
- `bag`
- `basket`
- `book`
- `bowling`
- `box`
- `brush`
- `building`
- `bulb`
- `button`
- `calculator`
- `calendar`
- `camera`
- `car`
- `card`
- `chair`
- `chat`
- `clipboard`
- `clocks`
- `compas`
- `converse`
- `cup`
- `dj`
- `donut`
- `dude`
- `dynamite`
- `earth`
- `egg`
- `eye`
- `file`
- `fit`
- `flag`
- `flask`
- `flower`
- `games`
- `giftBox`
- `girl`
- `goal`
- `google`
- `graph`
- `icecream`
- `imac`
- `ipad`
- `iphone`
- `key`
- `lettersymbol`
- `lock`
- `loop`
- `macbook`
- `magic`
- `magicmouse`
- `mail`
- `map`
- `medal`
- `mic`
- `money`
- `mortarboard`
- `mountain`
- `news`
- `paperBag`
- `pc`
- `pencil`
- `pencils`
- `picture`
- `pig`
- `pills`
- `play`
- `printer`
- `responsive`
- `retina`
- `ring`
- `rocket`
- `rss`
- `safe`
- `save`
- `search`
- `settings`
- `shield`
- `shirt`
- `skateboard`
- `spray`
- `storage`
- `support`
- `ticket`
- `toiletPaper`
- `touch`
- `trash`
- `tripBag`
- `trunk`
- `ubmrella`
- `userInterface`
- `video`
- `weather`
- `wiFi`
- `wine`
- `yinyang`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AndroidIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Android1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AppStoreIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowIcon size="20" class="nav-icon" /> Settings</a>
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
<AndroidIcon
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
    <AndroidIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Android1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AppStoreIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AndroidIcon size="24" />
   <Android1Icon size="24" color="#4a90e2" />
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
   <AndroidIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AndroidIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AndroidIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { android } from '@stacksjs/iconify-flat-ui'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(android, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { android } from '@stacksjs/iconify-flat-ui'

// Icons are typed as IconData
const myIcon: IconData = android
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/designmodo/Flat-UI/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Designmodo, Inc. ([Website](https://github.com/designmodo/Flat-UI))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/flat-ui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/flat-ui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
