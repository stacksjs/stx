# Ligature Symbols

> Ligature Symbols icons for stx from Iconify

## Overview

This package provides access to 348 icons from the Ligature Symbols collection through the stx iconify integration.

**Collection ID:** `ls`
**Total Icons:** 348
**Author:** Kazuyuki Motoyama ([Website](https://github.com/kudakurage/LigatureSymbols))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ls
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 0Icon, 1Icon, 2Icon } from '@stacksjs/iconify-ls'

// Basic usage
const icon = 0Icon()

// With size
const sizedIcon = 0Icon({ size: 24 })

// With color
const coloredIcon = 1Icon({ color: 'red' })

// With multiple props
const customIcon = 2Icon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 0Icon, 1Icon, 2Icon } from '@stacksjs/iconify-ls'

  global.icons = {
    home: 0Icon({ size: 24 }),
    user: 1Icon({ size: 24, color: '#4a90e2' }),
    settings: 2Icon({ size: 32 })
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
import { 0, 1, 2 } from '@stacksjs/iconify-ls'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0, { size: 24 })
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
const redIcon = 0Icon({ color: 'red' })
const blueIcon = 0Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 0Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 0Icon({ class: 'text-primary' })
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
const icon24 = 0Icon({ size: 24 })
const icon1em = 0Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 0Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 0Icon({ height: '1em' })
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
const smallIcon = 0Icon({ class: 'icon-small' })
const largeIcon = 0Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **348** icons:

- `0`
- `1`
- `2`
- `3`
- `4`
- `5`
- `6`
- `7`
- `8`
- `9`
- `a`
- `aUpperCase`
- `addstar`
- `adjust`
- `aim`
- `album`
- `alignadjust`
- `aligncenter`
- `alignleft`
- `alignright`
- `amazon`
- `ampersand`
- `android`
- `app`
- `apple`
- `arrowdown`
- `arrowleft`
- `arrowright`
- `arrowup`
- `asciicircum`
- `asciitilde`
- `asterisk`
- `at`
- `b`
- `bUpperCase`
- `back`
- `backslash`
- `backspace`
- `bad`
- `bag`
- `ban`
- `bar`
- `barcode`
- `bell`
- `bicycle`
- `bing`
- `blogger`
- `bold`
- `book`
- `bookmark`
- `braceleft`
- `braceright`
- `bracketleft`
- `bracketright`
- `brush`
- `buffalo`
- `building`
- `bus`
- `c`
- `cUpperCase`
- `calendar`
- `camera`
- `car`
- `category`
- `check`
- `checkbox`
- `checkboxempty`
- `chrome`
- `cinnamon`
- `circle`
- `clear`
- `clip`
- `cloud`
- `code`
- `coffee`
- `college`
- `colon`
- `comma`
- `comment`
- `comments`
- `compass`
- `cookpad`
- `copy`
- `crop`
- `crown`
- `cursor`
- `cut`
- `d`
- `dUpperCase`
- `dailycalendar`
- `dark`
- `dashboard`
- `delicious`
- `digg`
- `dollar`
- `down`
- `download`
- `dribbble`
- `dropbox`
- `dropdown`
- `e`
- `eUpperCase`
- `edit`
- `eject`
- `emdash`
- `emphasis`
- `endash`
- `equal`
- `eraser`
- `etc`
- `evernote`
- `exchange`
- `exclam`
- `external`
- `f`
- `fUpperCase`
- `facebook`
- `female`
- `file`
- `firefox`
- `flag`
- `flickr`
- `folder`
- `forward`
- `foursquare`
- `friend`
- `frustrate`
- `full`
- `g`
- `gUpperCase`
- `game`
- `gear`
- `geo`
- `github`
- `globe`
- `good`
- `google`
- `grab`
- `graph`
- `grayscale`
- `gree`
- `group`
- `guillemotleft`
- `guillemotright`
- `guilsinglleft`
- `guilsinglright`
- `gumroad`
- `h`
- `hUpperCase`
- `hatena`
- `hatenabookmark`
- `heart`
- `heartempty`
- `help`
- `heteml`
- `home`
- `horizontal`
- `hot`
- `hyphen`
- `i`
- `iUpperCase`
- `image`
- `info`
- `ink`
- `instagram`
- `instapaper`
- `internetexplorer`
- `invert`
- `iphone`
- `italic`
- `j`
- `jUpperCase`
- `jpa`
- `k`
- `kUpperCase`
- `key`
- `keyboard`
- `kudakurage`
- `l`
- `lUpperCase`
- `laugh`
- `left`
- `light`
- `line`
- `link`
- `linkedin`
- `list`
- `location`
- `lock`
- `login`
- `logout`
- `ltthon`
- `m`
- `mUpperCase`
- `magic`
- `mail`
- `male`
- `map`
- `meal`
- `memo`
- `menu`
- `minus`
- `mixi`
- `mobage`
- `move`
- `music`
- `myspace`
- `n`
- `nUpperCase`
- `next`
- `notify`
- `numbersign`
- `o`
- `oUpperCase`
- `off`
- `opera`
- `ordble`
- `p`
- `pUpperCase`
- `paint`
- `palette`
- `paperboy`
- `paramater`
- `parenleft`
- `parenright`
- `pause`
- `pc`
- `pencil`
- `percent`
- `period`
- `periodcentered`
- `phone`
- `photo`
- `picasa`
- `pin`
- `pinterest`
- `plane`
- `play`
- `playmedia`
- `plus`
- `pointer`
- `present`
- `print`
- `q`
- `qUpperCase`
- `question`
- `quote`
- `quotedbl`
- `quotesingle`
- `r`
- `rUpperCase`
- `readability`
- `record`
- `refresh`
- `refreshbutton`
- `remove`
- `repeat`
- `reply`
- `right`
- `rss`
- `s`
- `sUpperCase`
- `safari`
- `save`
- `search`
- `semicolon`
- `sepia`
- `server`
- `share`
- `shopping`
- `shuffle`
- `sitemap`
- `skype`
- `slash`
- `sleipnir`
- `slideshare`
- `small`
- `smile`
- `sns`
- `sort`
- `soundcloud`
- `spa`
- `sqale`
- `star`
- `starempty`
- `stop`
- `strike`
- `surprise`
- `sync`
- `t`
- `tUpperCase`
- `tabezou`
- `table`
- `tabs`
- `tag`
- `terminal`
- `tile`
- `tilemenu`
- `time`
- `trash`
- `trouble`
- `tumblr`
- `twitter`
- `u`
- `uUpperCase`
- `ubuntu`
- `umbrella`
- `underline`
- `underscore`
- `undo`
- `unlock`
- `up`
- `upload`
- `user`
- `ustream`
- `v`
- `vUpperCase`
- `vertical`
- `video`
- `view`
- `vimeo`
- `vk`
- `volume`
- `volumedown`
- `volumeup`
- `w`
- `wUpperCase`
- `walking`
- `web`
- `wifi`
- `windows`
- `wink`
- `wordpress`
- `wrench`
- `x`
- `xUpperCase`
- `y`
- `yUpperCase`
- `yahoo`
- `yapcasia`
- `yapcasialogo`
- `yapcasialogomark`
- `yelp`
- `youtube`
- `z`
- `zUpperCase`
- `zoomin`
- `zoomout`

## Usage Examples

### Navigation Menu

```html
@js
  import { 0Icon, 1Icon, 2Icon, 3Icon } from '@stacksjs/iconify-ls'

  global.navIcons = {
    home: 0Icon({ size: 20, class: 'nav-icon' }),
    about: 1Icon({ size: 20, class: 'nav-icon' }),
    contact: 2Icon({ size: 20, class: 'nav-icon' }),
    settings: 3Icon({ size: 20, class: 'nav-icon' })
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
import { 0Icon } from '@stacksjs/iconify-ls'

const icon = 0Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 0Icon, 1Icon, 2Icon } from '@stacksjs/iconify-ls'

const successIcon = 0Icon({ size: 16, color: '#22c55e' })
const warningIcon = 1Icon({ size: 16, color: '#f59e0b' })
const errorIcon = 2Icon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 0Icon, 1Icon } from '@stacksjs/iconify-ls'
   const icon = 0Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 0, 1 } from '@stacksjs/iconify-ls'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(0, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 0Icon, 1Icon } from '@stacksjs/iconify-ls'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ls'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 0Icon } from '@stacksjs/iconify-ls'
     global.icon = 0Icon({ size: 24 })
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
   const icon = 0Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0 } from '@stacksjs/iconify-ls'

// Icons are typed as IconData
const myIcon: IconData = 0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Kazuyuki Motoyama ([Website](https://github.com/kudakurage/LigatureSymbols))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ls/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ls/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
