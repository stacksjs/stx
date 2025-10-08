# Elegant

> Elegant icons for stx from Iconify

## Overview

This package provides access to 100 icons from the Elegant collection through the stx iconify integration.

**Collection ID:** `et`
**Total Icons:** 100
**Author:** Kenny Sing ([Website](https://github.com/pprince/etlinefont-bower))
**License:** GPL 3.0 ([Details](https://www.gnu.org/licenses/gpl.html))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-et
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdjustmentsIcon height="1em" />
<AdjustmentsIcon width="1em" height="1em" />
<AdjustmentsIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdjustmentsIcon size="24" />
<AdjustmentsIcon size="1em" />

<!-- Using width and height -->
<AdjustmentsIcon width="24" height="32" />

<!-- With color -->
<AdjustmentsIcon size="24" color="red" />
<AdjustmentsIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdjustmentsIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdjustmentsIcon
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
    <AdjustmentsIcon size="24" />
    <AlarmclockIcon size="24" color="#4a90e2" />
    <AnchorIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { adjustments, alarmclock, anchor } from '@stacksjs/iconify-et'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adjustments, { size: 24 })
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
<AdjustmentsIcon size="24" color="red" />
<AdjustmentsIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdjustmentsIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdjustmentsIcon size="24" class="text-primary" />
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
<AdjustmentsIcon height="1em" />
<AdjustmentsIcon width="1em" height="1em" />
<AdjustmentsIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdjustmentsIcon size="24" />
<AdjustmentsIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.et-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdjustmentsIcon class="et-icon" />
```

## Available Icons

This package contains **100** icons:

- `adjustments`
- `alarmclock`
- `anchor`
- `aperture`
- `attachments`
- `bargraph`
- `basket`
- `beaker`
- `bike`
- `bookOpen`
- `briefcase`
- `browser`
- `calendar`
- `camera`
- `caution`
- `chat`
- `circleCompass`
- `clipboard`
- `clock`
- `cloud`
- `compass`
- `desktop`
- `dial`
- `document`
- `documents`
- `download`
- `dribbble`
- `edit`
- `envelope`
- `expand`
- `facebook`
- `flag`
- `focus`
- `gears`
- `genius`
- `gift`
- `global`
- `globe`
- `googleplus`
- `grid`
- `happy`
- `hazardous`
- `heart`
- `hotairballoon`
- `hourglass`
- `key`
- `laptop`
- `layers`
- `lifesaver`
- `lightbulb`
- `linegraph`
- `linkedin`
- `lock`
- `magnifyingGlass`
- `map`
- `mapPin`
- `megaphone`
- `mic`
- `mobile`
- `newspaper`
- `notebook`
- `paintbrush`
- `paperclip`
- `pencil`
- `phone`
- `picture`
- `pictures`
- `piechart`
- `presentation`
- `pricetags`
- `printer`
- `profileFemale`
- `profileMale`
- `puzzle`
- `quote`
- `recycle`
- `refresh`
- `ribbon`
- `rss`
- `sad`
- `scissors`
- `scope`
- `search`
- `shield`
- `speedometer`
- `strategy`
- `streetsign`
- `tablet`
- `telescope`
- `toolbox`
- `tools`
- `tools2`
- `traget`
- `trophy`
- `tumblr`
- `twitter`
- `upload`
- `video`
- `wallet`
- `wine`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AdjustmentsIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlarmclockIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AnchorIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ApertureIcon size="20" class="nav-icon" /> Settings</a>
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
<AdjustmentsIcon
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
    <AdjustmentsIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlarmclockIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AnchorIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdjustmentsIcon size="24" />
   <AlarmclockIcon size="24" color="#4a90e2" />
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
   <AdjustmentsIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdjustmentsIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdjustmentsIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adjustments } from '@stacksjs/iconify-et'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adjustments, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adjustments } from '@stacksjs/iconify-et'

// Icons are typed as IconData
const myIcon: IconData = adjustments
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL 3.0

See [license details](https://www.gnu.org/licenses/gpl.html) for more information.

## Credits

- **Icons**: Kenny Sing ([Website](https://github.com/pprince/etlinefont-bower))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/et/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/et/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
