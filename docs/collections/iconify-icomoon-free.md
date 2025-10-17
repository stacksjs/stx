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
    <AccessibilityIcon size="24" color="#4a90e2" />
    <AddressBookIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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
.icomoonFree-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="icomoonFree-icon" />
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
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessibilityIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AddressBookIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AidKitIcon size="20" class="nav-icon" /> Settings</a>
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
    <AccessibilityIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AddressBookIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <AccessibilityIcon size="24" color="#4a90e2" />
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
     import { 500px } from '@stacksjs/iconify-icomoon-free'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
