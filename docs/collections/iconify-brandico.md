# Brandico

> Brandico icons for stx from Iconify

## Overview

This package provides access to 45 icons from the Brandico collection through the stx iconify integration.

**Collection ID:** `brandico`
**Total Icons:** 45
**Author:** Fontello ([Website](https://github.com/fontello/brandico.font))
**License:** CC BY SA ([Details](https://creativecommons.org/licenses/by-sa/3.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-brandico
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AmexIcon, BandcampIcon, BloggerIcon } from '@stacksjs/iconify-brandico'

// Basic usage
const icon = AmexIcon()

// With size
const sizedIcon = AmexIcon({ size: 24 })

// With color
const coloredIcon = BandcampIcon({ color: 'red' })

// With multiple props
const customIcon = BloggerIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AmexIcon, BandcampIcon, BloggerIcon } from '@stacksjs/iconify-brandico'

  global.icons = {
    home: AmexIcon({ size: 24 }),
    user: BandcampIcon({ size: 24, color: '#4a90e2' }),
    settings: BloggerIcon({ size: 32 })
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
import { amex, bandcamp, blogger } from '@stacksjs/iconify-brandico'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(amex, { size: 24 })
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
const redIcon = AmexIcon({ color: 'red' })
const blueIcon = AmexIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AmexIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AmexIcon({ class: 'text-primary' })
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
const icon24 = AmexIcon({ size: 24 })
const icon1em = AmexIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AmexIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AmexIcon({ height: '1em' })
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
const smallIcon = AmexIcon({ class: 'icon-small' })
const largeIcon = AmexIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **45** icons:

- `amex`
- `bandcamp`
- `blogger`
- `bloggerRect`
- `box`
- `boxRect`
- `codepen`
- `deviantart`
- `diigo`
- `discover`
- `facebook`
- `facebookRect`
- `friendfeed`
- `friendfeedRect`
- `github`
- `githubText`
- `googleplusRect`
- `houzz`
- `icq`
- `instagram`
- `instagramFilled`
- `jabber`
- `lastfm`
- `lastfmRect`
- `linkedin`
- `linkedinRect`
- `mastercard`
- `odnoklassniki`
- `odnoklassnikiRect`
- `picasa`
- `skype`
- `tudou`
- `tumblr`
- `tumblrRect`
- `twitter`
- `twitterBird`
- `vimeo`
- `vimeoRect`
- `visa`
- `vkontakteRect`
- `win8`
- `wordpress`
- `yandex`
- `yandexRect`
- `youku`

## Usage Examples

### Navigation Menu

```html
@js
  import { AmexIcon, BandcampIcon, BloggerIcon, BloggerRectIcon } from '@stacksjs/iconify-brandico'

  global.navIcons = {
    home: AmexIcon({ size: 20, class: 'nav-icon' }),
    about: BandcampIcon({ size: 20, class: 'nav-icon' }),
    contact: BloggerIcon({ size: 20, class: 'nav-icon' }),
    settings: BloggerRectIcon({ size: 20, class: 'nav-icon' })
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
import { AmexIcon } from '@stacksjs/iconify-brandico'

const icon = AmexIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AmexIcon, BandcampIcon, BloggerIcon } from '@stacksjs/iconify-brandico'

const successIcon = AmexIcon({ size: 16, color: '#22c55e' })
const warningIcon = BandcampIcon({ size: 16, color: '#f59e0b' })
const errorIcon = BloggerIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AmexIcon, BandcampIcon } from '@stacksjs/iconify-brandico'
   const icon = AmexIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { amex, bandcamp } from '@stacksjs/iconify-brandico'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(amex, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AmexIcon, BandcampIcon } from '@stacksjs/iconify-brandico'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-brandico'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AmexIcon } from '@stacksjs/iconify-brandico'
     global.icon = AmexIcon({ size: 24 })
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
   const icon = AmexIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { amex } from '@stacksjs/iconify-brandico'

// Icons are typed as IconData
const myIcon: IconData = amex
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY SA

See [license details](https://creativecommons.org/licenses/by-sa/3.0/) for more information.

## Credits

- **Icons**: Fontello ([Website](https://github.com/fontello/brandico.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/brandico/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/brandico/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
