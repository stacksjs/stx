# Foundation

> Foundation icons for stx from Iconify

## Overview

This package provides access to 283 icons from the Foundation collection through the stx iconify integration.

**Collection ID:** `foundation`
**Total Icons:** 283
**Author:** Zurb ([Website](https://github.com/zurb/foundation-icon-fonts))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-foundation
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddressBookIcon, AlertIcon, AlignCenterIcon } from '@stacksjs/iconify-foundation'

// Basic usage
const icon = AddressBookIcon()

// With size
const sizedIcon = AddressBookIcon({ size: 24 })

// With color
const coloredIcon = AlertIcon({ color: 'red' })

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
  import { AddressBookIcon, AlertIcon, AlignCenterIcon } from '@stacksjs/iconify-foundation'

  global.icons = {
    home: AddressBookIcon({ size: 24 }),
    user: AlertIcon({ size: 24, color: '#4a90e2' }),
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
import { addressBook, alert, alignCenter } from '@stacksjs/iconify-foundation'
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

This package contains **283** icons:

- `addressBook`
- `alert`
- `alignCenter`
- `alignJustify`
- `alignLeft`
- `alignRight`
- `anchor`
- `annotate`
- `archive`
- `arrowDown`
- `arrowLeft`
- `arrowRight`
- `arrowUp`
- `arrowsCompress`
- `arrowsExpand`
- `arrowsIn`
- `arrowsOut`
- `asl`
- `asterisk`
- `atSign`
- `backgroundColor`
- `batteryEmpty`
- `batteryFull`
- `batteryHalf`
- `bitcoin`
- `bitcoinCircle`
- `blind`
- `bluetooth`
- `bold`
- `book`
- `bookBookmark`
- `bookmark`
- `braille`
- `burst`
- `burstNew`
- `burstSale`
- `calendar`
- `camera`
- `check`
- `checkbox`
- `clipboard`
- `clipboardNotes`
- `clipboardPencil`
- `clock`
- `closedCaption`
- `cloud`
- `comment`
- `commentMinus`
- `commentQuotes`
- `commentVideo`
- `comments`
- `compass`
- `contrast`
- `creditCard`
- `crop`
- `crown`
- `css3`
- `database`
- `dieFive`
- `dieFour`
- `dieOne`
- `dieSix`
- `dieThree`
- `dieTwo`
- `dislike`
- `dollar`
- `dollarBill`
- `download`
- `eject`
- `elevator`
- `euro`
- `eye`
- `fastForward`
- `female`
- `femaleSymbol`
- `filter`
- `firstAid`
- `flag`
- `folder`
- `folderAdd`
- `folderLock`
- `foot`
- `foundation`
- `graphBar`
- `graphHorizontal`
- `graphPie`
- `graphTrend`
- `guideDog`
- `hearingAid`
- `heart`
- `home`
- `html5`
- `indentLess`
- `indentMore`
- `info`
- `italic`
- `key`
- `laptop`
- `layout`
- `lightbulb`
- `like`
- `link`
- `list`
- `listBullet`
- `listNumber`
- `listThumbnails`
- `lock`
- `loop`
- `magnifyingGlass`
- `mail`
- `male`
- `maleFemale`
- `maleSymbol`
- `map`
- `marker`
- `megaphone`
- `microphone`
- `minus`
- `minusCircle`
- `mobile`
- `mobileSignal`
- `monitor`
- `mountains`
- `music`
- `next`
- `noDogs`
- `noSmoking`
- `page`
- `pageAdd`
- `pageCopy`
- `pageCsv`
- `pageDelete`
- `pageDoc`
- `pageEdit`
- `pageExport`
- `pageExportCsv`
- `pageExportDoc`
- `pageExportPdf`
- `pageFilled`
- `pageMultiple`
- `pagePdf`
- `pageRemove`
- `pageSearch`
- `paintBucket`
- `paperclip`
- `pause`
- `paw`
- `paypal`
- `pencil`
- `photo`
- `play`
- `playCircle`
- `playVideo`
- `plus`
- `pound`
- `power`
- `previous`
- `priceTag`
- `pricetagMultiple`
- `print`
- `prohibited`
- `projectionScreen`
- `puzzle`
- `quote`
- `record`
- `refresh`
- `results`
- `resultsDemographics`
- `rewind`
- `rewindTen`
- `rss`
- `safetyCone`
- `save`
- `share`
- `sheriffBadge`
- `shield`
- `shoppingBag`
- `shoppingCart`
- `shuffle`
- `skull`
- `social500px`
- `socialAdobe`
- `socialAmazon`
- `socialAndroid`
- `socialApple`
- `socialBehance`
- `socialBing`
- `socialBlogger`
- `socialDelicious`
- `socialDesignerNews`
- `socialDeviantArt`
- `socialDigg`
- `socialDribbble`
- `socialDrive`
- `socialDropbox`
- `socialEvernote`
- `socialFacebook`
- `socialFlickr`
- `socialForrst`
- `socialFoursquare`
- `socialGameCenter`
- `socialGithub`
- `socialGooglePlus`
- `socialHackerNews`
- `socialHi5`
- `socialInstagram`
- `socialJoomla`
- `socialLastfm`
- `socialLinkedin`
- `socialMedium`
- `socialMyspace`
- `socialOrkut`
- `socialPath`
- `socialPicasa`
- `socialPinterest`
- `socialRdio`
- `socialReddit`
- `socialSkillshare`
- `socialSkype`
- `socialSmashingMag`
- `socialSnapchat`
- `socialSpotify`
- `socialSquidoo`
- `socialStackOverflow`
- `socialSteam`
- `socialStumbleupon`
- `socialTreehouse`
- `socialTumblr`
- `socialTwitter`
- `socialVimeo`
- `socialWindows`
- `socialXbox`
- `socialYahoo`
- `socialYelp`
- `socialYoutube`
- `socialZerply`
- `socialZurb`
- `sound`
- `star`
- `stop`
- `strikethrough`
- `subscript`
- `superscript`
- `tabletLandscape`
- `tabletPortrait`
- `target`
- `targetTwo`
- `telephone`
- `telephoneAccessible`
- `textColor`
- `thumbnails`
- `ticket`
- `torso`
- `torsoBusiness`
- `torsoFemale`
- `torsos`
- `torsosAll`
- `torsosAllFemale`
- `torsosFemaleMale`
- `torsosMaleFemale`
- `trash`
- `trees`
- `trophy`
- `underline`
- `universalAccess`
- `unlink`
- `unlock`
- `upload`
- `uploadCloud`
- `usb`
- `video`
- `volume`
- `volumeNone`
- `volumeStrike`
- `web`
- `wheelchair`
- `widget`
- `wrench`
- `x`
- `xCircle`
- `yen`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddressBookIcon, AlertIcon, AlignCenterIcon, AlignJustifyIcon } from '@stacksjs/iconify-foundation'

  global.navIcons = {
    home: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    about: AlertIcon({ size: 20, class: 'nav-icon' }),
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
import { AddressBookIcon } from '@stacksjs/iconify-foundation'

const icon = AddressBookIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddressBookIcon, AlertIcon, AlignCenterIcon } from '@stacksjs/iconify-foundation'

const successIcon = AddressBookIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlertIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignCenterIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddressBookIcon, AlertIcon } from '@stacksjs/iconify-foundation'
   const icon = AddressBookIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addressBook, alert } from '@stacksjs/iconify-foundation'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addressBook, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddressBookIcon, AlertIcon } from '@stacksjs/iconify-foundation'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-foundation'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddressBookIcon } from '@stacksjs/iconify-foundation'
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
import { addressBook } from '@stacksjs/iconify-foundation'

// Icons are typed as IconData
const myIcon: IconData = addressBook
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Zurb ([Website](https://github.com/zurb/foundation-icon-fonts))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/foundation/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/foundation/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
