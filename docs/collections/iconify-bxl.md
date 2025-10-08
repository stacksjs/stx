# BoxIcons Logo

> BoxIcons Logo icons for stx from Iconify

## Overview

This package provides access to 155 icons from the BoxIcons Logo collection through the stx iconify integration.

**Collection ID:** `bxl`
**Total Icons:** 155
**Author:** Atisa ([Website](https://github.com/atisawd/boxicons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bxl
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, 99designsIcon, AdobeIcon } from '@stacksjs/iconify-bxl'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = 99designsIcon({ color: 'red' })

// With multiple props
const customIcon = AdobeIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, 99designsIcon, AdobeIcon } from '@stacksjs/iconify-bxl'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: 99designsIcon({ size: 24, color: '#4a90e2' }),
    settings: AdobeIcon({ size: 32 })
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
import { 500px, 99designs, adobe } from '@stacksjs/iconify-bxl'
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

This package contains **155** icons:

- `500px`
- `99designs`
- `adobe`
- `airbnb`
- `algolia`
- `amazon`
- `android`
- `angular`
- `apple`
- `audible`
- `aws`
- `baidu`
- `behance`
- `bing`
- `bitcoin`
- `blender`
- `blogger`
- `bootstrap`
- `cPlusPlus`
- `chrome`
- `codepen`
- `creativeCommons`
- `css3`
- `dailymotion`
- `deezer`
- `devTo`
- `deviantart`
- `digg`
- `digitalocean`
- `discord`
- `discordAlt`
- `discourse`
- `django`
- `docker`
- `dribbble`
- `dropbox`
- `drupal`
- `ebay`
- `edge`
- `etsy`
- `facebook`
- `facebookCircle`
- `facebookSquare`
- `figma`
- `firebase`
- `firefox`
- `flask`
- `flickr`
- `flickrSquare`
- `flutter`
- `foursquare`
- `git`
- `github`
- `gitlab`
- `gmail`
- `goLang`
- `google`
- `googleCloud`
- `googlePlus`
- `googlePlusCircle`
- `graphql`
- `heroku`
- `html5`
- `imdb`
- `instagram`
- `instagramAlt`
- `internetExplorer`
- `invision`
- `java`
- `javascript`
- `joomla`
- `jquery`
- `jsfiddle`
- `kickstarter`
- `kubernetes`
- `less`
- `linkedin`
- `linkedinSquare`
- `magento`
- `mailchimp`
- `markdown`
- `mastercard`
- `mastodon`
- `medium`
- `mediumOld`
- `mediumSquare`
- `messenger`
- `meta`
- `microsoft`
- `microsoftTeams`
- `mongodb`
- `netlify`
- `nodejs`
- `okRu`
- `opera`
- `patreon`
- `paypal`
- `periscope`
- `php`
- `pinterest`
- `pinterestAlt`
- `playStore`
- `pocket`
- `postgresql`
- `productHunt`
- `python`
- `quora`
- `react`
- `redbubble`
- `reddit`
- `redux`
- `sass`
- `shopify`
- `sketch`
- `skype`
- `slack`
- `slackOld`
- `snapchat`
- `soundcloud`
- `spotify`
- `springBoot`
- `squarespace`
- `stackOverflow`
- `steam`
- `stripe`
- `tailwindCss`
- `telegram`
- `tiktok`
- `trello`
- `tripAdvisor`
- `tumblr`
- `tux`
- `twitch`
- `twitter`
- `typescript`
- `unity`
- `unsplash`
- `upwork`
- `venmo`
- `vimeo`
- `visa`
- `visualStudio`
- `vk`
- `vuejs`
- `whatsapp`
- `whatsappSquare`
- `wikipedia`
- `windows`
- `wix`
- `wordpress`
- `xing`
- `yahoo`
- `yelp`
- `youtube`
- `zoom`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, 99designsIcon, AdobeIcon, AirbnbIcon } from '@stacksjs/iconify-bxl'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: 99designsIcon({ size: 20, class: 'nav-icon' }),
    contact: AdobeIcon({ size: 20, class: 'nav-icon' }),
    settings: AirbnbIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-bxl'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, 99designsIcon, AdobeIcon } from '@stacksjs/iconify-bxl'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = 99designsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdobeIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, 99designsIcon } from '@stacksjs/iconify-bxl'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, 99designs } from '@stacksjs/iconify-bxl'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, 99designsIcon } from '@stacksjs/iconify-bxl'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-bxl'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-bxl'
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
import { 500px } from '@stacksjs/iconify-bxl'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Atisa ([Website](https://github.com/atisawd/boxicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bxl/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bxl/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
