# Elusive Icons

> Elusive Icons icons for stx from Iconify

## Overview

This package provides access to 304 icons from the Elusive Icons collection through the stx iconify integration.

**Collection ID:** `el`
**Total Icons:** 304
**Author:** Team Redux ([Website](https://github.com/dovy/elusive-icons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-el
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddressBookIcon, AddressBookAltIcon, AdjustIcon } from '@stacksjs/iconify-el'

// Basic usage
const icon = AddressBookIcon()

// With size
const sizedIcon = AddressBookIcon({ size: 24 })

// With color
const coloredIcon = AddressBookAltIcon({ color: 'red' })

// With multiple props
const customIcon = AdjustIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddressBookIcon, AddressBookAltIcon, AdjustIcon } from '@stacksjs/iconify-el'

  global.icons = {
    home: AddressBookIcon({ size: 24 }),
    user: AddressBookAltIcon({ size: 24, color: '#4a90e2' }),
    settings: AdjustIcon({ size: 32 })
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
import { addressBook, addressBookAlt, adjust } from '@stacksjs/iconify-el'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addressBook, { size: 24 })
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
const redIcon = AddressBookIcon({ color: 'red' })
const blueIcon = AddressBookIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddressBookIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddressBookIcon({ class: 'text-primary' })
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
const icon24 = AddressBookIcon({ size: 24 })
const icon1em = AddressBookIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddressBookIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddressBookIcon({ height: '1em' })
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
const smallIcon = AddressBookIcon({ class: 'icon-small' })
const largeIcon = AddressBookIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **304** icons:

- `addressBook`
- `addressBookAlt`
- `adjust`
- `adjustAlt`
- `adult`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `asl`
- `asterisk`
- `backward`
- `banCircle`
- `barcode`
- `behance`
- `bell`
- `blind`
- `blogger`
- `bold`
- `book`
- `bookmark`
- `bookmarkEmpty`
- `braille`
- `briefcase`
- `broom`
- `brush`
- `bulb`
- `bullhorn`
- `calendar`
- `calendarSign`
- `camera`
- `car`
- `caretDown`
- `caretLeft`
- `caretRight`
- `caretUp`
- `cc`
- `certificate`
- `check`
- `checkEmpty`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `child`
- `circleArrowDown`
- `circleArrowLeft`
- `circleArrowRight`
- `circleArrowUp`
- `cloud`
- `cloudAlt`
- `cog`
- `cogAlt`
- `cogs`
- `comment`
- `commentAlt`
- `compass`
- `compassAlt`
- `creditCard`
- `css`
- `dashboard`
- `delicious`
- `deviantart`
- `digg`
- `download`
- `downloadAlt`
- `dribbble`
- `edit`
- `eject`
- `envelope`
- `envelopeAlt`
- `error`
- `errorAlt`
- `eur`
- `exclamationSign`
- `eyeClose`
- `eyeOpen`
- `facebook`
- `facetimeVideo`
- `fastBackward`
- `fastForward`
- `female`
- `file`
- `fileAlt`
- `fileEdit`
- `fileEditAlt`
- `fileNew`
- `fileNewAlt`
- `film`
- `filter`
- `fire`
- `flag`
- `flagAlt`
- `flickr`
- `folder`
- `folderClose`
- `folderOpen`
- `folderSign`
- `font`
- `fontsize`
- `fork`
- `forward`
- `forwardAlt`
- `foursquare`
- `friendfeed`
- `friendfeedRect`
- `fullscreen`
- `gbp`
- `gift`
- `github`
- `githubText`
- `glass`
- `glasses`
- `globe`
- `globeAlt`
- `googleplus`
- `graph`
- `graphAlt`
- `group`
- `groupAlt`
- `guidedog`
- `handDown`
- `handLeft`
- `handRight`
- `handUp`
- `hdd`
- `headphones`
- `hearingImpaired`
- `heart`
- `heartAlt`
- `heartEmpty`
- `home`
- `homeAlt`
- `hourglass`
- `idea`
- `ideaAlt`
- `inbox`
- `inboxAlt`
- `inboxBox`
- `indentLeft`
- `indentRight`
- `infoCircle`
- `instagram`
- `iphoneHome`
- `italic`
- `key`
- `laptop`
- `laptopAlt`
- `lastfm`
- `leaf`
- `lines`
- `link`
- `linkedin`
- `list`
- `listAlt`
- `livejournal`
- `lock`
- `lockAlt`
- `magic`
- `magnet`
- `male`
- `mapMarker`
- `mapMarkerAlt`
- `mic`
- `micAlt`
- `minus`
- `minusSign`
- `move`
- `music`
- `myspace`
- `network`
- `off`
- `ok`
- `okCircle`
- `okSign`
- `opensource`
- `paperClip`
- `paperClipAlt`
- `path`
- `pause`
- `pauseAlt`
- `pencil`
- `pencilAlt`
- `person`
- `phone`
- `phoneAlt`
- `photo`
- `photoAlt`
- `picasa`
- `picture`
- `pinterest`
- `plane`
- `play`
- `playAlt`
- `playCircle`
- `plurk`
- `plurkAlt`
- `plus`
- `plusSign`
- `podcast`
- `print`
- `puzzle`
- `qrcode`
- `question`
- `questionSign`
- `quoteAlt`
- `quoteRight`
- `quoteRightAlt`
- `quotes`
- `random`
- `record`
- `reddit`
- `redux`
- `refresh`
- `remove`
- `removeCircle`
- `removeSign`
- `repeat`
- `repeatAlt`
- `resizeFull`
- `resizeHorizontal`
- `resizeSmall`
- `resizeVertical`
- `returnKey`
- `retweet`
- `reverseAlt`
- `road`
- `rss`
- `scissors`
- `screen`
- `screenAlt`
- `screenshot`
- `search`
- `searchAlt`
- `share`
- `shareAlt`
- `shoppingCart`
- `shoppingCartSign`
- `signal`
- `skype`
- `slideshare`
- `smiley`
- `smileyAlt`
- `soundcloud`
- `speaker`
- `spotify`
- `stackoverflow`
- `star`
- `starAlt`
- `starEmpty`
- `stepBackward`
- `stepForward`
- `stop`
- `stopAlt`
- `stumbleupon`
- `tag`
- `tags`
- `tasks`
- `textHeight`
- `textWidth`
- `th`
- `thLarge`
- `thList`
- `thumbsDown`
- `thumbsUp`
- `time`
- `timeAlt`
- `tint`
- `torso`
- `trash`
- `trashAlt`
- `tumblr`
- `twitter`
- `universalAccess`
- `unlock`
- `unlockAlt`
- `upload`
- `usd`
- `user`
- `viadeo`
- `video`
- `videoAlt`
- `videoChat`
- `viewMode`
- `vimeo`
- `vkontakte`
- `volumeDown`
- `volumeOff`
- `volumeUp`
- `w3c`
- `warningSign`
- `website`
- `websiteAlt`
- `wheelchair`
- `wordpress`
- `wrench`
- `wrenchAlt`
- `youtube`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddressBookIcon, AddressBookAltIcon, AdjustIcon, AdjustAltIcon } from '@stacksjs/iconify-el'

  global.navIcons = {
    home: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    about: AddressBookAltIcon({ size: 20, class: 'nav-icon' }),
    contact: AdjustIcon({ size: 20, class: 'nav-icon' }),
    settings: AdjustAltIcon({ size: 20, class: 'nav-icon' })
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
import { AddressBookIcon } from '@stacksjs/iconify-el'

const icon = AddressBookIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddressBookIcon, AddressBookAltIcon, AdjustIcon } from '@stacksjs/iconify-el'

const successIcon = AddressBookIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddressBookAltIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdjustIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddressBookIcon, AddressBookAltIcon } from '@stacksjs/iconify-el'
   const icon = AddressBookIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addressBook, addressBookAlt } from '@stacksjs/iconify-el'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addressBook, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddressBookIcon, AddressBookAltIcon } from '@stacksjs/iconify-el'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-el'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddressBookIcon } from '@stacksjs/iconify-el'
     global.icon = AddressBookIcon({ size: 24 })
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
   const icon = AddressBookIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBook } from '@stacksjs/iconify-el'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Team Redux ([Website](https://github.com/dovy/elusive-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/el/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/el/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
