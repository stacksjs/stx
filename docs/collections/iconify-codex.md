# CodeX Icons

> CodeX Icons icons for stx from Iconify

## Overview

This package provides access to 78 icons from the CodeX Icons collection through the stx iconify integration.

**Collection ID:** `codex`
**Total Icons:** 78
**Author:** CodeX ([Website](https://github.com/codex-team/icons))
**License:** MIT ([Details](https://github.com/codex-team/icons/blob/master/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-codex
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddBackgroundIcon height="1em" />
<AddBackgroundIcon width="1em" height="1em" />
<AddBackgroundIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddBackgroundIcon size="24" />
<AddBackgroundIcon size="1em" />

<!-- Using width and height -->
<AddBackgroundIcon width="24" height="32" />

<!-- With color -->
<AddBackgroundIcon size="24" color="red" />
<AddBackgroundIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddBackgroundIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddBackgroundIcon
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
    <AddBackgroundIcon size="24" />
    <AddBorderIcon size="24" color="#4a90e2" />
    <AlignCenterIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { addBackground, addBorder, alignCenter } from '@stacksjs/iconify-codex'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addBackground, { size: 24 })
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
<AddBackgroundIcon size="24" color="red" />
<AddBackgroundIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddBackgroundIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddBackgroundIcon size="24" class="text-primary" />
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
<AddBackgroundIcon height="1em" />
<AddBackgroundIcon width="1em" height="1em" />
<AddBackgroundIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddBackgroundIcon size="24" />
<AddBackgroundIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.codex-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddBackgroundIcon class="codex-icon" />
```

## Available Icons

This package contains **78** icons:

- `addBackground`
- `addBorder`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `bold`
- `brackets`
- `bracketsVertical`
- `check`
- `checklist`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `clipboard`
- `collapse`
- `color`
- `copy`
- `cross`
- `curlyBrackets`
- `delimiter`
- `directionDownRight`
- `directionLeftDown`
- `directionRightDown`
- `directionUpRight`
- `dotCircle`
- `etcHorisontal`
- `etcVertical`
- `file`
- `gift`
- `globe`
- `h1`
- `h2`
- `h3`
- `h4`
- `h5`
- `h6`
- `heading`
- `heart`
- `hidden`
- `html`
- `instagram`
- `italic`
- `link`
- `linkedin`
- `listBulleted`
- `listNumbered`
- `loader`
- `marker`
- `menu`
- `menuSmall`
- `picture`
- `play`
- `plus`
- `question`
- `quote`
- `redo`
- `removeBackground`
- `replace`
- `save`
- `search`
- `star`
- `stretch`
- `strikethrough`
- `table`
- `tableWithHeadings`
- `tableWithoutHeadings`
- `text`
- `translate`
- `trash`
- `twitter`
- `underline`
- `undo`
- `unlink`
- `user`
- `usersGroup`
- `warning`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AddBackgroundIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddBorderIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignCenterIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignJustifyIcon size="20" class="nav-icon" /> Settings</a>
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
<AddBackgroundIcon
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
    <AddBackgroundIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddBorderIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignCenterIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddBackgroundIcon size="24" />
   <AddBorderIcon size="24" color="#4a90e2" />
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
   <AddBackgroundIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddBackgroundIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddBackgroundIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addBackground } from '@stacksjs/iconify-codex'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addBackground, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addBackground } from '@stacksjs/iconify-codex'

// Icons are typed as IconData
const myIcon: IconData = addBackground
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/codex-team/icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: CodeX ([Website](https://github.com/codex-team/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/codex/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/codex/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
