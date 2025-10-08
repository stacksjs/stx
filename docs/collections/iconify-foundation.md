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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddressBookIcon height="1em" />
<AddressBookIcon width="1em" height="1em" />
<AddressBookIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddressBookIcon size="24" />
<AddressBookIcon size="1em" />

<!-- Using width and height -->
<AddressBookIcon width="24" height="32" />

<!-- With color -->
<AddressBookIcon size="24" color="red" />
<AddressBookIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddressBookIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddressBookIcon
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
    <AddressBookIcon size="24" />
    <AlertIcon size="24" color="#4a90e2" />
    <AlignCenterIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AddressBookIcon size="24" color="red" />
<AddressBookIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddressBookIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddressBookIcon size="24" class="text-primary" />
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
<AddressBookIcon height="1em" />
<AddressBookIcon width="1em" height="1em" />
<AddressBookIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddressBookIcon size="24" />
<AddressBookIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.foundation-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddressBookIcon class="foundation-icon" />
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
<nav>
  <a href="/"><AddressBookIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AlertIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlignCenterIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AlignJustifyIcon size="20" class="nav-icon" /> Settings</a>
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
<AddressBookIcon
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
    <AddressBookIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AlertIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlignCenterIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddressBookIcon size="24" />
   <AlertIcon size="24" color="#4a90e2" />
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
   <AddressBookIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddressBookIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddressBookIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addressBook } from '@stacksjs/iconify-foundation'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addressBook, { size: 24 })
   @endjs

   {!! customIcon !!}
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
