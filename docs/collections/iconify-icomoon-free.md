# IcoMoon Free

> IcoMoon Free icons for stx from Iconify

## Overview

This package provides access to 491 icons from the IcoMoon Free collection through the stx iconify integration.

**Collection ID:** `icomoon-free`
**Total Icons:** 491
**Author:** Keyamoon ([Website](https://github.com/Keyamoon/IcoMoon-Free))
**License:** GPL ([Details](https://www.gnu.org/licenses/gpl.html))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-icomoon-free
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AccessibilityIcon, AddressBookIcon } from '@stacksjs/iconify-icomoon-free'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AccessibilityIcon({ color: 'red' })

// With multiple props
const customIcon = AddressBookIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AccessibilityIcon, AddressBookIcon } from '@stacksjs/iconify-icomoon-free'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AccessibilityIcon({ size: 24, color: '#4a90e2' }),
    settings: AddressBookIcon({ size: 32 })
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
import { 500px, accessibility, addressBook } from '@stacksjs/iconify-icomoon-free'
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

This package contains **491** icons:

- `500px`
- `accessibility`
- `addressBook`
- `aidKit`
- `airplane`
- `alarm`
- `amazon`
- `android`
- `angry`
- `angry2`
- `appleinc`
- `arrowDown`
- `arrowDownLeft`
- `arrowDownLeft2`
- `arrowDownRight`
- `arrowDownRight2`
- `arrowDown2`
- `arrowLeft`
- `arrowLeft2`
- `arrowRight`
- `arrowRight2`
- `arrowUp`
- `arrowUpLeft`
- `arrowUpLeft2`
- `arrowUpRight`
- `arrowUpRight2`
- `arrowUp2`
- `attachment`
- `backward`
- `backward2`
- `baffled`
- `baffled2`
- `barcode`
- `basecamp`
- `behance`
- `behance2`
- `bell`
- `bin`
- `bin2`
- `binoculars`
- `blocked`
- `blog`
- `blogger`
- `blogger2`
- `bold`
- `book`
- `bookmark`
- `bookmarks`
- `books`
- `boxAdd`
- `boxRemove`
- `briefcase`
- `brightnessContrast`
- `bubble`
- `bubble2`
- `bubbles`
- `bubbles2`
- `bubbles3`
- `bubbles4`
- `bug`
- `bullhorn`
- `calculator`
- `calendar`
- `camera`
- `cancelCircle`
- `cart`
- `checkboxChecked`
- `checkboxUnchecked`
- `checkmark`
- `checkmark2`
- `chrome`
- `circleDown`
- `circleLeft`
- `circleRight`
- `circleUp`
- `clearFormatting`
- `clipboard`
- `clock`
- `clock2`
- `cloud`
- `cloudCheck`
- `cloudDownload`
- `cloudUpload`
- `clubs`
- `codepen`
- `cog`
- `cogs`
- `coinDollar`
- `coinEuro`
- `coinPound`
- `coinYen`
- `command`
- `compass`
- `compass2`
- `confused`
- `confused2`
- `connection`
- `contrast`
- `cool`
- `cool2`
- `copy`
- `creditCard`
- `crop`
- `cross`
- `crying`
- `crying2`
- `css3`
- `ctrl`
- `database`
- `delicious`
- `deviantart`
- `diamonds`
- `dice`
- `display`
- `download`
- `download2`
- `download3`
- `drawer`
- `drawer2`
- `dribbble`
- `drive`
- `dropbox`
- `droplet`
- `earth`
- `edge`
- `eject`
- `ello`
- `embed`
- `embed2`
- `enlarge`
- `enlarge2`
- `enter`
- `envelop`
- `equalizer`
- `equalizer2`
- `evil`
- `evil2`
- `exit`
- `eye`
- `eyeBlocked`
- `eyeMinus`
- `eyePlus`
- `eyedropper`
- `facebook`
- `facebook2`
- `feed`
- `fileEmpty`
- `fileExcel`
- `fileMusic`
- `fileOpenoffice`
- `filePdf`
- `filePicture`
- `filePlay`
- `fileText`
- `fileText2`
- `fileVideo`
- `fileWord`
- `fileZip`
- `filesEmpty`
- `film`
- `filter`
- `finder`
- `fire`
- `firefox`
- `first`
- `flag`
- `flattr`
- `flickr`
- `flickr2`
- `flickr3`
- `flickr4`
- `floppyDisk`
- `folder`
- `folderDownload`
- `folderMinus`
- `folderOpen`
- `folderPlus`
- `folderUpload`
- `font`
- `fontSize`
- `forward`
- `forward2`
- `forward3`
- `foursquare`
- `frustrated`
- `frustrated2`
- `gift`
- `git`
- `github`
- `glass`
- `glass2`
- `google`
- `googleDrive`
- `googlePlus`
- `googlePlus2`
- `googlePlus3`
- `google2`
- `google3`
- `grin`
- `grin2`
- `hackernews`
- `hammer`
- `hammer2`
- `hangouts`
- `happy`
- `happy2`
- `headphones`
- `heart`
- `heartBroken`
- `hipster`
- `hipster2`
- `history`
- `home`
- `home2`
- `home3`
- `hourGlass`
- `htmlFive`
- `htmlFive2`
- `icomoon`
- `ie`
- `image`
- `images`
- `indentDecrease`
- `indentIncrease`
- `infinite`
- `info`
- `insertTemplate`
- `instagram`
- `italic`
- `joomla`
- `key`
- `key2`
- `keyboard`
- `lab`
- `lanyrd`
- `laptop`
- `last`
- `lastfm`
- `lastfm2`
- `leaf`
- `library`
- `libreoffice`
- `lifebuoy`
- `ligature`
- `ligature2`
- `link`
- `linkedin`
- `linkedin2`
- `list`
- `listNumbered`
- `list2`
- `location`
- `location2`
- `lock`
- `loop`
- `loop2`
- `ltr`
- `magicWand`
- `magnet`
- `mail`
- `mail2`
- `mail3`
- `mail4`
- `makeGroup`
- `man`
- `manWoman`
- `map`
- `map2`
- `menu`
- `menu2`
- `menu3`
- `menu4`
- `meter`
- `meter2`
- `mic`
- `minus`
- `mobile`
- `mobile2`
- `moveDown`
- `moveUp`
- `mug`
- `music`
- `neutral`
- `neutral2`
- `newTab`
- `newspaper`
- `next`
- `next2`
- `notification`
- `npm`
- `office`
- `omega`
- `onedrive`
- `opera`
- `opt`
- `pacman`
- `pageBreak`
- `pagebreak`
- `paintFormat`
- `paragraphCenter`
- `paragraphJustify`
- `paragraphLeft`
- `paragraphRight`
- `paste`
- `pause`
- `pause2`
- `paypal`
- `pen`
- `pencil`
- `pencil2`
- `phone`
- `phoneHangUp`
- `pieChart`
- `pilcrow`
- `pinterest`
- `pinterest2`
- `play`
- `play2`
- `play3`
- `plus`
- `podcast`
- `pointDown`
- `pointLeft`
- `pointRight`
- `pointUp`
- `power`
- `powerCord`
- `previous`
- `previous2`
- `priceTag`
- `priceTags`
- `printer`
- `profile`
- `pushpin`
- `qrcode`
- `question`
- `quill`
- `quotesLeft`
- `quotesRight`
- `radioChecked`
- `radioChecked2`
- `radioUnchecked`
- `reddit`
- `redo`
- `redo2`
- `renren`
- `reply`
- `road`
- `rocket`
- `rss`
- `rss2`
- `rtl`
- `sad`
- `sad2`
- `safari`
- `scissors`
- `search`
- `section`
- `share`
- `share2`
- `shield`
- `shift`
- `shocked`
- `shocked2`
- `shrink`
- `shrink2`
- `shuffle`
- `sigma`
- `sinaWeibo`
- `skype`
- `sleepy`
- `sleepy2`
- `smile`
- `smile2`
- `sortAlphaAsc`
- `sortAlphaDesc`
- `sortAmountAsc`
- `sortAmountDesc`
- `sortNumbericDesc`
- `sortNumericAsc`
- `soundcloud`
- `soundcloud2`
- `spades`
- `spellCheck`
- `sphere`
- `spinner`
- `spinner10`
- `spinner11`
- `spinner2`
- `spinner3`
- `spinner4`
- `spinner5`
- `spinner6`
- `spinner7`
- `spinner8`
- `spinner9`
- `spoonKnife`
- `spotify`
- `stack`
- `stackoverflow`
- `starEmpty`
- `starFull`
- `starHalf`
- `statsBars`
- `statsBars2`
- `statsDots`
- `steam`
- `steam2`
- `stop`
- `stop2`
- `stopwatch`
- `strikethrough`
- `stumbleupon`
- `stumbleupon2`
- `subscript`
- `subscript2`
- `sun`
- `superscript`
- `superscript2`
- `svg`
- `switch`
- `tab`
- `table`
- `table2`
- `tablet`
- `target`
- `telegram`
- `terminal`
- `textColor`
- `textHeight`
- `textWidth`
- `ticket`
- `tongue`
- `tongue2`
- `tree`
- `trello`
- `trophy`
- `truck`
- `tumblr`
- `tumblr2`
- `tux`
- `tv`
- `twitch`
- `twitter`
- `underline`
- `undo`
- `undo2`
- `ungroup`
- `unlocked`
- `upload`
- `upload2`
- `upload3`
- `user`
- `userCheck`
- `userMinus`
- `userPlus`
- `userTie`
- `users`
- `videoCamera`
- `vimeo`
- `vimeo2`
- `vine`
- `vk`
- `volumeDecrease`
- `volumeHigh`
- `volumeIncrease`
- `volumeLow`
- `volumeMedium`
- `volumeMute`
- `volumeMute2`
- `warning`
- `whatsapp`
- `wikipedia`
- `windows`
- `windows8`
- `wink`
- `wink2`
- `woman`
- `wondering`
- `wondering2`
- `wordpress`
- `wrench`
- `xing`
- `xing2`
- `yahoo`
- `yahoo2`
- `yelp`
- `youtube`
- `youtube2`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AccessibilityIcon, AddressBookIcon, AidKitIcon } from '@stacksjs/iconify-icomoon-free'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    contact: AddressBookIcon({ size: 20, class: 'nav-icon' }),
    settings: AidKitIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-icomoon-free'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AccessibilityIcon, AddressBookIcon } from '@stacksjs/iconify-icomoon-free'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibilityIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AddressBookIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AccessibilityIcon } from '@stacksjs/iconify-icomoon-free'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, accessibility } from '@stacksjs/iconify-icomoon-free'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AccessibilityIcon } from '@stacksjs/iconify-icomoon-free'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-icomoon-free'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-icomoon-free'
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
import { 500px } from '@stacksjs/iconify-icomoon-free'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL

See [license details](https://www.gnu.org/licenses/gpl.html) for more information.

## Credits

- **Icons**: Keyamoon ([Website](https://github.com/Keyamoon/IcoMoon-Free))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/icomoon-free/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/icomoon-free/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
