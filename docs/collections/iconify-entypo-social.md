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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<500pxIcon size="24" />
<500pxIcon size="1em" />

<!-- Using width and height -->
<500pxIcon width="24" height="32" />

<!-- With color -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<500pxIcon size="24" class="icon-primary" />

<!-- With all properties -->
<500pxIcon
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
    <500pxIcon size="24" />
    <500pxWithCircleIcon size="24" color="#4a90e2" />
    <BasecampIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<500pxIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<500pxIcon size="24" class="text-primary" />
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
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<500pxIcon size="24" />
<500pxIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.entypoSocial-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="entypoSocial-icon" />
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
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><500pxWithCircleIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><BasecampIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><BehanceIcon size="20" class="nav-icon" /> Settings</a>
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
<500pxIcon
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
    <500pxIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <500pxWithCircleIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <BasecampIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <500pxWithCircleIcon size="24" color="#4a90e2" />
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
   <500pxIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <500pxIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <500pxIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-entypo-social'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
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
