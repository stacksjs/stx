# Bytesize Icons

> Bytesize Icons icons for stx from Iconify

## Overview

This package provides access to 102 icons from the Bytesize Icons collection through the stx iconify integration.

**Collection ID:** `bytesize`
**Total Icons:** 102
**Author:** Dan Klammer ([Website](https://github.com/danklammer/bytesize-icons))
**License:** MIT ([Details](https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md))
**Category:** UI 16px / 32px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bytesize
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ActivityIcon, AlertIcon, ArchiveIcon } from '@stacksjs/iconify-bytesize'

// Basic usage
const icon = ActivityIcon()

// With size
const sizedIcon = ActivityIcon({ size: 24 })

// With color
const coloredIcon = AlertIcon({ color: 'red' })

// With multiple props
const customIcon = ArchiveIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ActivityIcon, AlertIcon, ArchiveIcon } from '@stacksjs/iconify-bytesize'

  global.icons = {
    home: ActivityIcon({ size: 24 }),
    user: AlertIcon({ size: 24, color: '#4a90e2' }),
    settings: ArchiveIcon({ size: 32 })
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
import { activity, alert, archive } from '@stacksjs/iconify-bytesize'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(activity, { size: 24 })
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
const redIcon = ActivityIcon({ color: 'red' })
const blueIcon = ActivityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = ActivityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = ActivityIcon({ class: 'text-primary' })
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
const icon24 = ActivityIcon({ size: 24 })
const icon1em = ActivityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = ActivityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ActivityIcon({ height: '1em' })
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
const smallIcon = ActivityIcon({ class: 'icon-small' })
const largeIcon = ActivityIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **102** icons:

- `activity`
- `alert`
- `archive`
- `arrowBottom`
- `arrowLeft`
- `arrowRight`
- `arrowTop`
- `backwards`
- `bag`
- `ban`
- `bell`
- `book`
- `bookmark`
- `calendar`
- `camera`
- `caretBottom`
- `caretLeft`
- `caretRight`
- `caretTop`
- `cart`
- `checkmark`
- `chevronBottom`
- `chevronLeft`
- `chevronRight`
- `chevronTop`
- `clipboard`
- `clock`
- `close`
- `code`
- `compose`
- `creditcard`
- `desktop`
- `download`
- `edit`
- `eject`
- `ellipsisHorizontal`
- `ellipsisVertical`
- `end`
- `export`
- `external`
- `eye`
- `feed`
- `file`
- `filter`
- `fire`
- `flag`
- `folder`
- `folderOpen`
- `forwards`
- `fullscreen`
- `fullscreenExit`
- `gift`
- `github`
- `heart`
- `home`
- `import`
- `inbox`
- `info`
- `lightning`
- `link`
- `location`
- `lock`
- `mail`
- `menu`
- `message`
- `microphone`
- `minus`
- `mobile`
- `moon`
- `move`
- `music`
- `mute`
- `options`
- `paperclip`
- `pause`
- `photo`
- `play`
- `plus`
- `portfolio`
- `print`
- `reload`
- `reply`
- `search`
- `send`
- `settings`
- `signIn`
- `signOut`
- `star`
- `start`
- `tag`
- `telephone`
- `trash`
- `twitter`
- `unlock`
- `upload`
- `user`
- `video`
- `volume`
- `work`
- `zoomIn`
- `zoomOut`
- `zoomReset`

## Usage Examples

### Navigation Menu

```html
@js
  import { ActivityIcon, AlertIcon, ArchiveIcon, ArrowBottomIcon } from '@stacksjs/iconify-bytesize'

  global.navIcons = {
    home: ActivityIcon({ size: 20, class: 'nav-icon' }),
    about: AlertIcon({ size: 20, class: 'nav-icon' }),
    contact: ArchiveIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowBottomIcon({ size: 20, class: 'nav-icon' })
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
import { ActivityIcon } from '@stacksjs/iconify-bytesize'

const icon = ActivityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ActivityIcon, AlertIcon, ArchiveIcon } from '@stacksjs/iconify-bytesize'

const successIcon = ActivityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlertIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArchiveIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ActivityIcon, AlertIcon } from '@stacksjs/iconify-bytesize'
   const icon = ActivityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { activity, alert } from '@stacksjs/iconify-bytesize'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(activity, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ActivityIcon, AlertIcon } from '@stacksjs/iconify-bytesize'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-bytesize'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ActivityIcon } from '@stacksjs/iconify-bytesize'
     global.icon = ActivityIcon({ size: 24 })
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
   const icon = ActivityIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { activity } from '@stacksjs/iconify-bytesize'

// Icons are typed as IconData
const myIcon: IconData = activity
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Dan Klammer ([Website](https://github.com/danklammer/bytesize-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bytesize/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bytesize/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
