# Evil Icons

> Evil Icons icons for stx from Iconify

## Overview

This package provides access to 70 icons from the Evil Icons collection through the stx iconify integration.

**Collection ID:** `ei`
**Total Icons:** 70
**Author:** Alexander Madyankin and Roman Shamin ([Website](https://github.com/evil-icons/evil-icons))
**License:** MIT ([Details](https://github.com/evil-icons/evil-icons/blob/master/LICENSE.txt))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ei
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ArchiveIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-ei'

// Basic usage
const icon = ArchiveIcon()

// With size
const sizedIcon = ArchiveIcon({ size: 24 })

// With color
const coloredIcon = ArrowDownIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowLeftIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ArchiveIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-ei'

  global.icons = {
    home: ArchiveIcon({ size: 24 }),
    user: ArrowDownIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowLeftIcon({ size: 32 })
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
import { archive, arrowDown, arrowLeft } from '@stacksjs/iconify-ei'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(archive, { size: 24 })
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
const redIcon = ArchiveIcon({ color: 'red' })
const blueIcon = ArchiveIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ArchiveIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ArchiveIcon({ class: 'text-primary' })
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
const icon24 = ArchiveIcon({ size: 24 })
const icon1em = ArchiveIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ArchiveIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ArchiveIcon({ height: '1em' })
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
const smallIcon = ArchiveIcon({ class: 'icon-small' })
const largeIcon = ArchiveIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **70** icons:

- `archive`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `bell`
- `calendar`
- `camera`
- `cart`
- `chart`
- `check`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `clock`
- `close`
- `closeO`
- `comment`
- `creditCard`
- `envelope`
- `exclamation`
- `externalLink`
- `eye`
- `gear`
- `heart`
- `image`
- `like`
- `link`
- `location`
- `lock`
- `minus`
- `navicon`
- `paperclip`
- `pencil`
- `play`
- `plus`
- `pointer`
- `question`
- `redo`
- `refresh`
- `retweet`
- `scFacebook`
- `scGithub`
- `scGooglePlus`
- `scInstagram`
- `scLinkedin`
- `scOdnoklassniki`
- `scPinterest`
- `scSkype`
- `scSoundcloud`
- `scTelegram`
- `scTumblr`
- `scTwitter`
- `scVimeo`
- `scVk`
- `scYoutube`
- `search`
- `shareApple`
- `shareGoogle`
- `spinner`
- `spinner2`
- `spinner3`
- `star`
- `tag`
- `trash`
- `trophy`
- `undo`
- `unlock`
- `user`

## Usage Examples

### Navigation Menu

```html
@js
  import { ArchiveIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@stacksjs/iconify-ei'

  global.navIcons = {
    home: ArchiveIcon({ size: 20, class: 'nav-icon' }),
    about: ArrowDownIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowLeftIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowRightIcon({ size: 20, class: 'nav-icon' })
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
import { ArchiveIcon } from '@stacksjs/iconify-ei'

const icon = ArchiveIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ArchiveIcon, ArrowDownIcon, ArrowLeftIcon } from '@stacksjs/iconify-ei'

const successIcon = ArchiveIcon({ size: 16, color: '#22c55e' })
const warningIcon = ArrowDownIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowLeftIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ArchiveIcon, ArrowDownIcon } from '@stacksjs/iconify-ei'
   const icon = ArchiveIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { archive, arrowDown } from '@stacksjs/iconify-ei'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(archive, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ArchiveIcon, ArrowDownIcon } from '@stacksjs/iconify-ei'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ei'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ArchiveIcon } from '@stacksjs/iconify-ei'
     global.icon = ArchiveIcon({ size: 24 })
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
   const icon = ArchiveIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { archive } from '@stacksjs/iconify-ei'

// Icons are typed as IconData
const myIcon: IconData = archive
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/evil-icons/evil-icons/blob/master/LICENSE.txt) for more information.

## Credits

- **Icons**: Alexander Madyankin and Roman Shamin ([Website](https://github.com/evil-icons/evil-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ei/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ei/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
