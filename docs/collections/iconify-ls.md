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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<0Icon height="1em" />
<0Icon width="1em" height="1em" />
<0Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<0Icon size="24" />
<0Icon size="1em" />

<!-- Using width and height -->
<0Icon width="24" height="32" />

<!-- With color -->
<0Icon size="24" color="red" />
<0Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<0Icon size="24" class="icon-primary" />

<!-- With all properties -->
<0Icon
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
    <0Icon size="24" />
    <1Icon size="24" color="#4a90e2" />
    <2Icon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<0Icon size="24" color="red" />
<0Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<0Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<0Icon size="24" class="text-primary" />
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
<0Icon height="1em" />
<0Icon width="1em" height="1em" />
<0Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<0Icon size="24" />
<0Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.ls-icon {
  width: 1em;
  height: 1em;
}
```

```html
<0Icon class="ls-icon" />
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
<nav>
  <a href="/"><0Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><1Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><2Icon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><3Icon size="20" class="nav-icon" /> Settings</a>
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
<0Icon
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
    <0Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <1Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <2Icon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <0Icon size="24" />
   <1Icon size="24" color="#4a90e2" />
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
   <0Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <0Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <0Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 0 } from '@stacksjs/iconify-ls'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(0, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
