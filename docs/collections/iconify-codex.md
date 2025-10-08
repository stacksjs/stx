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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddBackgroundIcon, AddBorderIcon, AlignCenterIcon } from '@stacksjs/iconify-codex'

// Basic usage
const icon = AddBackgroundIcon()

// With size
const sizedIcon = AddBackgroundIcon({ size: 24 })

// With color
const coloredIcon = AddBorderIcon({ color: 'red' })

// With multiple props
const customIcon = AlignCenterIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddBackgroundIcon, AddBorderIcon, AlignCenterIcon } from '@stacksjs/iconify-codex'

  global.icons = {
    home: AddBackgroundIcon({ size: 24 }),
    user: AddBorderIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignCenterIcon({ size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.home !!}
  {!! icons.user !!}
  {!! icons.settings !!}
</div>
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

```typescript
// Via color property
const redIcon = AddBackgroundIcon({ color: 'red' })
const blueIcon = AddBackgroundIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddBackgroundIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddBackgroundIcon({ class: 'text-primary' })
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

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AddBackgroundIcon({ size: 24 })
const icon1em = AddBackgroundIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddBackgroundIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddBackgroundIcon({ height: '1em' })
```

### CSS Sizing

You can also control icon size via CSS:

```css
.icon-small {
  width: 1em;
  height: 1em;
}

.icon-large {
  width: 2em;
  height: 2em;
}
```

```typescript
const smallIcon = AddBackgroundIcon({ class: 'icon-small' })
const largeIcon = AddBackgroundIcon({ class: 'icon-large' })
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
@js
  import { AddBackgroundIcon, AddBorderIcon, AlignCenterIcon, AlignJustifyIcon } from '@stacksjs/iconify-codex'

  global.navIcons = {
    home: AddBackgroundIcon({ size: 20, class: 'nav-icon' }),
    about: AddBorderIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignCenterIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignJustifyIcon({ size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.home !!} Home</a>
  <a href="/about">{!! navIcons.about !!} About</a>
  <a href="/contact">{!! navIcons.contact !!} Contact</a>
  <a href="/settings">{!! navIcons.settings !!} Settings</a>
</nav>
```

### Custom Styling

```typescript
import { AddBackgroundIcon } from '@stacksjs/iconify-codex'

const icon = AddBackgroundIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddBackgroundIcon, AddBorderIcon, AlignCenterIcon } from '@stacksjs/iconify-codex'

const successIcon = AddBackgroundIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddBorderIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignCenterIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddBackgroundIcon, AddBorderIcon } from '@stacksjs/iconify-codex'
   const icon = AddBackgroundIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addBackground, addBorder } from '@stacksjs/iconify-codex'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addBackground, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddBackgroundIcon, AddBorderIcon } from '@stacksjs/iconify-codex'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-codex'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddBackgroundIcon } from '@stacksjs/iconify-codex'
     global.icon = AddBackgroundIcon({ size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   {!! icon !!}
   ```

4. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```typescript
   const icon = AddBackgroundIcon({ class: 'icon' })
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
