# Nonicons

> Nonicons icons for stx from Iconify

## Overview

This package provides access to 69 icons from the Nonicons collection through the stx iconify integration.

**Collection ID:** `nonicons`
**Total Icons:** 69
**Author:** yamatsum ([Website](https://github.com/yamatsum/nonicons))
**License:** MIT ([Details](https://github.com/yamatsum/nonicons/blob/master/LICENSE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nonicons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<Angular16Icon height="1em" />
<Angular16Icon width="1em" height="1em" />
<Angular16Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<Angular16Icon size="24" />
<Angular16Icon size="1em" />

<!-- Using width and height -->
<Angular16Icon width="24" height="32" />

<!-- With color -->
<Angular16Icon size="24" color="red" />
<Angular16Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<Angular16Icon size="24" class="icon-primary" />

<!-- With all properties -->
<Angular16Icon
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
    <Angular16Icon size="24" />
    <Babel16Icon size="24" color="#4a90e2" />
    <Biome16Icon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { angular16, babel16, biome16 } from '@stacksjs/iconify-nonicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(angular16, { size: 24 })
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
<Angular16Icon size="24" color="red" />
<Angular16Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<Angular16Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<Angular16Icon size="24" class="text-primary" />
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
<Angular16Icon height="1em" />
<Angular16Icon width="1em" height="1em" />
<Angular16Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<Angular16Icon size="24" />
<Angular16Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.nonicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<Angular16Icon class="nonicons-icon" />
```

## Available Icons

This package contains **69** icons:

- `angular16`
- `babel16`
- `biome16`
- `c16`
- `cPlusplus16`
- `cSharp16`
- `capacitor16`
- `class16`
- `constant16`
- `css16`
- `dart16`
- `docker16`
- `elixir16`
- `elm16`
- `error16`
- `eslint16`
- `field16`
- `go16`
- `graphql16`
- `html16`
- `interface16`
- `ionic16`
- `java16`
- `javascript16`
- `json16`
- `keyword16`
- `kotlin16`
- `kubernetes16`
- `layout16`
- `loading16`
- `lua16`
- `next16`
- `nginx16`
- `node16`
- `notFound16`
- `npm16`
- `perl16`
- `php16`
- `prettier16`
- `prisma16`
- `python16`
- `r16`
- `react16`
- `rust16`
- `scala16`
- `snippet16`
- `struct16`
- `svelte16`
- `swift16`
- `template16`
- `terraform16`
- `tmux16`
- `toml16`
- `turborepo16`
- `type16`
- `typescript16`
- `variable16`
- `vim16`
- `vimCommandMode16`
- `vimInsertMode16`
- `vimNormalMode16`
- `vimReplaceMode16`
- `vimSelectMode16`
- `vimTerminalMode16`
- `vimVisualMode16`
- `vscode16`
- `vue16`
- `yaml16`
- `yarn16`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><Angular16Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><Babel16Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><Biome16Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><C16Icon size="20" class="nav-icon" /> Settings</a>
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
<Angular16Icon
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
    <Angular16Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <Babel16Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <Biome16Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <Angular16Icon size="24" />
   <Babel16Icon size="24" color="#4a90e2" />
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
   <Angular16Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <Angular16Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <Angular16Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { angular16 } from '@stacksjs/iconify-nonicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(angular16, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { angular16 } from '@stacksjs/iconify-nonicons'

// Icons are typed as IconData
const myIcon: IconData = angular16
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/yamatsum/nonicons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: yamatsum ([Website](https://github.com/yamatsum/nonicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nonicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nonicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
