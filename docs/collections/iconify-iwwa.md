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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, Add15mIcon, Add1dIcon } from '@stacksjs/iconify-iwwa'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = Add15mIcon({ color: 'red' })

// With multiple props
const customIcon = Add1dIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, Add15mIcon, Add1dIcon } from '@stacksjs/iconify-iwwa'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: Add15mIcon({ size: 24, color: '#4a90e2' }),
    settings: Add1dIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AddIcon({ color: 'red' })
const blueIcon = AddIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddIcon({ class: 'text-primary' })
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
const icon24 = AddIcon({ size: 24 })
const icon1em = AddIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddIcon({ height: '1em' })
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
const smallIcon = AddIcon({ class: 'icon-small' })
const largeIcon = AddIcon({ class: 'icon-large' })
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
@js
  import { AddIcon, Add15mIcon, Add1dIcon, Add1mIcon } from '@stacksjs/iconify-iwwa'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: Add15mIcon({ size: 20, class: 'nav-icon' }),
    contact: Add1dIcon({ size: 20, class: 'nav-icon' }),
    settings: Add1mIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-iwwa'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, Add15mIcon, Add1dIcon } from '@stacksjs/iconify-iwwa'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = Add15mIcon({ size: 16, color: '#f59e0b' })
const errorIcon = Add1dIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, Add15mIcon } from '@stacksjs/iconify-iwwa'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, add15m } from '@stacksjs/iconify-iwwa'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, Add15mIcon } from '@stacksjs/iconify-iwwa'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-iwwa'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-iwwa'
     global.icon = AddIcon({ size: 24 })
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
   const icon = AddIcon({ class: 'icon' })
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
