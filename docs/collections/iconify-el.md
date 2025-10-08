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
    <AddressBookAltIcon size="24" color="#4a90e2" />
    <AdjustIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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
.el-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddressBookIcon class="el-icon" />
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
<nav>
  <a href="/"><AddressBookIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddressBookAltIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdjustIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdjustAltIcon size="20" class="nav-icon" /> Settings</a>
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
    <AddressBookAltIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdjustIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddressBookIcon size="24" />
   <AddressBookAltIcon size="24" color="#4a90e2" />
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
     import { addressBook } from '@stacksjs/iconify-el'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addressBook, { size: 24 })
   @endjs

   {!! customIcon !!}
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
