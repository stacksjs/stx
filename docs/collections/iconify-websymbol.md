# Web Symbols Liga

> Web Symbols Liga icons for stx from Iconify

## Overview

This package provides access to 85 icons from the Web Symbols Liga collection through the stx iconify integration.

**Collection ID:** `websymbol`
**Total Icons:** 85
**Author:** Just Be Nice studio
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-websymbol
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { ArchiveIcon, ArrowsCwIcon, AttachIcon } from '@stacksjs/iconify-websymbol'

// Basic usage
const icon = ArchiveIcon()

// With size
const sizedIcon = ArchiveIcon({ size: 24 })

// With color
const coloredIcon = ArrowsCwIcon({ color: 'red' })

// With multiple props
const customIcon = AttachIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { ArchiveIcon, ArrowsCwIcon, AttachIcon } from '@stacksjs/iconify-websymbol'

  global.icons = {
    home: ArchiveIcon({ size: 24 }),
    user: ArrowsCwIcon({ size: 24, color: '#4a90e2' }),
    settings: AttachIcon({ size: 32 })
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
import { archive, arrowsCw, attach } from '@stacksjs/iconify-websymbol'
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

This package contains **85** icons:

- `archive`
- `arrowsCw`
- `attach`
- `attention`
- `block`
- `cancel`
- `cancelCircle`
- `chat`
- `clock`
- `cloud`
- `code`
- `cog`
- `comment`
- `commentAlt`
- `cwCircle`
- `doc`
- `docsLandscape`
- `downCircle`
- `downDir`
- `downMicro`
- `facebookRect`
- `folder`
- `font`
- `forward`
- `googleplusRect`
- `heart`
- `heartEmpty`
- `indentLeft`
- `indentRight`
- `leftCircle`
- `leftOpen`
- `link`
- `linkedinRect`
- `list`
- `listNumbered`
- `location`
- `lock`
- `lockOpen`
- `logout`
- `mail`
- `minusCircle`
- `odnoklassnikiRect`
- `ok`
- `okCircle`
- `picture`
- `plusCircle`
- `popup`
- `progress0`
- `progress1`
- `progress2`
- `progress3`
- `progress4`
- `progress5`
- `progress6`
- `progress7`
- `reply`
- `replyAll`
- `resizeFull`
- `resizeFullCircle`
- `retweet`
- `rightCircle`
- `rightDir`
- `rightOpen`
- `rss`
- `rssAlt`
- `search`
- `signal`
- `skype`
- `star`
- `tag`
- `target`
- `terminal`
- `th`
- `thLarge`
- `thList`
- `tumblrRect`
- `twitterBird`
- `upCircle`
- `upMicro`
- `updownCircle`
- `user`
- `video`
- `vimeoRect`
- `vkontakteRect`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { ArchiveIcon, ArrowsCwIcon, AttachIcon, AttentionIcon } from '@stacksjs/iconify-websymbol'

  global.navIcons = {
    home: ArchiveIcon({ size: 20, class: 'nav-icon' }),
    about: ArrowsCwIcon({ size: 20, class: 'nav-icon' }),
    contact: AttachIcon({ size: 20, class: 'nav-icon' }),
    settings: AttentionIcon({ size: 20, class: 'nav-icon' })
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
import { ArchiveIcon } from '@stacksjs/iconify-websymbol'

const icon = ArchiveIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { ArchiveIcon, ArrowsCwIcon, AttachIcon } from '@stacksjs/iconify-websymbol'

const successIcon = ArchiveIcon({ size: 16, color: '#22c55e' })
const warningIcon = ArrowsCwIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AttachIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { ArchiveIcon, ArrowsCwIcon } from '@stacksjs/iconify-websymbol'
   const icon = ArchiveIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { archive, arrowsCw } from '@stacksjs/iconify-websymbol'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(archive, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { ArchiveIcon, ArrowsCwIcon } from '@stacksjs/iconify-websymbol'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-websymbol'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { ArchiveIcon } from '@stacksjs/iconify-websymbol'
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
import { archive } from '@stacksjs/iconify-websymbol'

// Icons are typed as IconData
const myIcon: IconData = archive
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Just Be Nice studio
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/websymbol/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/websymbol/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
