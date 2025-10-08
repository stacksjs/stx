# Entypo+ Social

> Entypo+ Social icons for stx from Iconify

## Overview

This package provides access to 76 icons from the Entypo+ Social collection through the stx iconify integration.

**Collection ID:** `entypo-social`
**Total Icons:** 76
**Author:** Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-entypo-social
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, 500pxWithCircleIcon, BasecampIcon } from '@stacksjs/iconify-entypo-social'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = 500pxWithCircleIcon({ color: 'red' })

// With multiple props
const customIcon = BasecampIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, 500pxWithCircleIcon, BasecampIcon } from '@stacksjs/iconify-entypo-social'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: 500pxWithCircleIcon({ size: 24, color: '#4a90e2' }),
    settings: BasecampIcon({ size: 32 })
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
import { 500px, 500pxWithCircle, basecamp } from '@stacksjs/iconify-entypo-social'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(500px, { size: 24 })
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
const redIcon = 500pxIcon({ color: 'red' })
const blueIcon = 500pxIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 500pxIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 500pxIcon({ class: 'text-primary' })
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
const icon24 = 500pxIcon({ size: 24 })
const icon1em = 500pxIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 500pxIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 500pxIcon({ height: '1em' })
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
const smallIcon = 500pxIcon({ class: 'icon-small' })
const largeIcon = 500pxIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **76** icons:

- `500px`
- `500pxWithCircle`
- `basecamp`
- `behance`
- `creativeCloud`
- `dribbble`
- `dribbbleWithCircle`
- `dropbox`
- `evernote`
- `facebook`
- `facebookWithCircle`
- `flattr`
- `flickr`
- `flickrWithCircle`
- `foursquare`
- `github`
- `githubWithCircle`
- `google`
- `googleDrive`
- `googleHangouts`
- `googleWithCircle`
- `grooveshark`
- `icloud`
- `instagram`
- `instagramWithCircle`
- `lastfm`
- `lastfmWithCircle`
- `linkedin`
- `linkedinWithCircle`
- `medium`
- `mediumWithCircle`
- `mixi`
- `onedrive`
- `paypal`
- `picasa`
- `pinterest`
- `pinterestWithCircle`
- `qq`
- `qqWithCircle`
- `raft`
- `raftWithCircle`
- `rainbow`
- `rdio`
- `rdioWithCircle`
- `renren`
- `scribd`
- `sinaWeibo`
- `skype`
- `skypeWithCircle`
- `slideshare`
- `smashing`
- `soundcloud`
- `spotify`
- `spotifyWithCircle`
- `stumbleupon`
- `stumbleuponWithCircle`
- `swarm`
- `tripadvisor`
- `tumblr`
- `tumblrWithCircle`
- `twitter`
- `twitterWithCircle`
- `vimeo`
- `vimeoWithCircle`
- `vine`
- `vineWithCircle`
- `vk`
- `vkAlternitive`
- `vkWithCircle`
- `xing`
- `xingWithCircle`
- `yelp`
- `youko`
- `youkoWithCircle`
- `youtube`
- `youtubeWithCircle`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, 500pxWithCircleIcon, BasecampIcon, BehanceIcon } from '@stacksjs/iconify-entypo-social'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: 500pxWithCircleIcon({ size: 20, class: 'nav-icon' }),
    contact: BasecampIcon({ size: 20, class: 'nav-icon' }),
    settings: BehanceIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-entypo-social'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, 500pxWithCircleIcon, BasecampIcon } from '@stacksjs/iconify-entypo-social'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = 500pxWithCircleIcon({ size: 16, color: '#f59e0b' })
const errorIcon = BasecampIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, 500pxWithCircleIcon } from '@stacksjs/iconify-entypo-social'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, 500pxWithCircle } from '@stacksjs/iconify-entypo-social'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, 500pxWithCircleIcon } from '@stacksjs/iconify-entypo-social'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-entypo-social'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-entypo-social'
     global.icon = 500pxIcon({ size: 24 })
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
   const icon = 500pxIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-entypo-social'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Daniel Bruce ([Website](https://github.com/chancancode/entypo-plus))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/entypo-social/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/entypo-social/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
