# TopCoat Icons

> TopCoat Icons icons for stx from Iconify

## Overview

This package provides access to 89 icons from the TopCoat Icons collection through the stx iconify integration.

**Collection ID:** `topcoat`
**Total Icons:** 89
**Author:** TopCoat ([Website](https://github.com/topcoat/icons))
**License:** Apache 2.0 ([Details](https://github.com/topcoat/icons/blob/master/LICENSE))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-topcoat
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AlertIcon height="1em" />
<AlertIcon width="1em" height="1em" />
<AlertIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AlertIcon size="24" />
<AlertIcon size="1em" />

<!-- Using width and height -->
<AlertIcon width="24" height="32" />

<!-- With color -->
<AlertIcon size="24" color="red" />
<AlertIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AlertIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AlertIcon
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
    <AlertIcon size="24" />
    <ArrowDownIcon size="24" color="#4a90e2" />
    <ArrowLeftIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { alert, arrowDown, arrowLeft } from '@stacksjs/iconify-topcoat'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(alert, { size: 24 })
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
<AlertIcon size="24" color="red" />
<AlertIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AlertIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AlertIcon size="24" class="text-primary" />
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
<AlertIcon height="1em" />
<AlertIcon width="1em" height="1em" />
<AlertIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AlertIcon size="24" />
<AlertIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.topcoat-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AlertIcon class="topcoat-icon" />
```

## Available Icons

This package contains **89** icons:

- `alert`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `attachment`
- `audio`
- `audiooff`
- `back`
- `backLight`
- `behance`
- `bookmark`
- `brush`
- `build`
- `calendar`
- `call`
- `camera`
- `cancel`
- `cart`
- `chat`
- `checkmark`
- `circle`
- `circleOutline`
- `cloud`
- `collapse`
- `comment`
- `computer`
- `delete`
- `download`
- `dribble`
- `email`
- `error`
- `expand`
- `facebook`
- `favorite`
- `feedback`
- `flickr`
- `folder`
- `github`
- `githubText`
- `googleplus`
- `group`
- `home`
- `image`
- `imageOutline`
- `instagram`
- `like`
- `linkedin`
- `listview`
- `location`
- `lock`
- `minus`
- `next`
- `nextLight`
- `page`
- `path`
- `pencil`
- `phone`
- `picasa`
- `pinterest`
- `plugin`
- `plus`
- `preview`
- `print`
- `question`
- `rectangle`
- `rectangleOutline`
- `refresh`
- `retweet`
- `roundedrectangle`
- `roundedrectangleOutline`
- `rss`
- `save`
- `search`
- `settings`
- `share`
- `tablet`
- `text`
- `tileview`
- `tumblr`
- `twitter`
- `unlock`
- `user`
- `videocamera`
- `view`
- `vimeo`
- `w3c`
- `wifi`
- `wordpress`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AlertIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ArrowDownIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ArrowLeftIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowRightIcon size="20" class="nav-icon" /> Settings</a>
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
<AlertIcon
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
    <AlertIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ArrowDownIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ArrowLeftIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AlertIcon size="24" />
   <ArrowDownIcon size="24" color="#4a90e2" />
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
   <AlertIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AlertIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AlertIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { alert } from '@stacksjs/iconify-topcoat'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(alert, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { alert } from '@stacksjs/iconify-topcoat'

// Icons are typed as IconData
const myIcon: IconData = alert
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Apache 2.0

See [license details](https://github.com/topcoat/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: TopCoat ([Website](https://github.com/topcoat/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/topcoat/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/topcoat/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
