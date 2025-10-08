# Raphael

> Raphael icons for stx from Iconify

## Overview

This package provides access to 266 icons from the Raphael collection through the stx iconify integration.

**Collection ID:** `raphael`
**Total Icons:** 266
**Author:** Dmitry Baranovskiy ([Website](https://github.com/dmitrybaranovskiy/raphael))
**License:** MIT
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-raphael
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AcwIcon, AlarmIcon } from '@stacksjs/iconify-raphael'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AcwIcon({ color: 'red' })

// With multiple props
const customIcon = AlarmIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AcwIcon, AlarmIcon } from '@stacksjs/iconify-raphael'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AcwIcon({ size: 24, color: '#4a90e2' }),
    settings: AlarmIcon({ size: 32 })
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
import { 500px, acw, alarm } from '@stacksjs/iconify-raphael'
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

This package contains **266** icons:

- `500px`
- `acw`
- `alarm`
- `android`
- `anonymous`
- `apple`
- `apps`
- `arrowalt`
- `arrowdown`
- `arrowleft`
- `arrowleft2`
- `arrowleftalt`
- `arrowright`
- `arrowright2`
- `arrowup`
- `aumade`
- `barchart`
- `bell`
- `biohazard`
- `bolt`
- `book`
- `bookmark`
- `books`
- `brush`
- `bubble`
- `bucket`
- `bug`
- `bus`
- `calendar`
- `calendar2`
- `car`
- `cart`
- `ccw`
- `charging`
- `chat`
- `check`
- `checkbox`
- `checked`
- `chrome`
- `clip`
- `clock`
- `cloud`
- `cloud2`
- `clouddown`
- `cloudup`
- `cloudy`
- `code`
- `codetalk`
- `coffee`
- `commandline`
- `connect`
- `contract`
- `crop`
- `cross`
- `crown`
- `cube`
- `customer`
- `db`
- `detour`
- `diagram`
- `disconnect`
- `dockbottom`
- `dockleft`
- `dockright`
- `docktop`
- `dollar`
- `download`
- `dribbble`
- `dry`
- `edit`
- `employee`
- `end`
- `ethernet`
- `exchange`
- `exclamation`
- `expand`
- `export`
- `facebook`
- `fave`
- `feed`
- `ff`
- `filter`
- `firefox`
- `fitocracy`
- `flag`
- `flagAlt`
- `flickr`
- `folder`
- `font`
- `fork`
- `forkAlt`
- `fullBattery`
- `fullcube`
- `future`
- `gear`
- `github`
- `githubalt`
- `glasses`
- `globe`
- `globealt`
- `globealt2`
- `gplus`
- `graphael`
- `green`
- `hail`
- `hammer`
- `hammerandscrewdriver`
- `hangup`
- `help`
- `history`
- `home`
- `hp`
- `icons`
- `ie`
- `ie9`
- `imac`
- `import`
- `inbox`
- `info`
- `inkscape`
- `instagram`
- `ios`
- `ipad`
- `iphone`
- `jigsaw`
- `jquery`
- `js`
- `key`
- `lab`
- `lamp`
- `lampAlt`
- `landing`
- `landscape1`
- `landscape2`
- `linechart`
- `link`
- `linkedin`
- `linux`
- `list`
- `loaction2`
- `location`
- `lock`
- `locked`
- `lowBattery`
- `magic`
- `magnet`
- `mail`
- `man`
- `merge`
- `mic`
- `micmute`
- `minus`
- `music`
- `mute`
- `newwindow`
- `no`
- `nodejs`
- `nomagnet`
- `notebook`
- `noview`
- `opensource`
- `opera`
- `package`
- `page`
- `page2`
- `paint`
- `pallete`
- `palm`
- `paper`
- `parent`
- `pc`
- `pen`
- `pensil`
- `people`
- `phone`
- `photo`
- `picker`
- `picture`
- `piechart`
- `plane`
- `play`
- `plugin`
- `plus`
- `power`
- `ppt`
- `printer`
- `question`
- `question2`
- `quote`
- `rain`
- `raphael`
- `reflecth`
- `reflectv`
- `refresh`
- `resize2`
- `roadmap`
- `rotate`
- `ruler`
- `run`
- `rw`
- `safari`
- `scissors`
- `screwdriver`
- `search`
- `sencha`
- `settings`
- `settingsalt`
- `shuffle`
- `skull`
- `skype`
- `slideshare`
- `smallgear`
- `smile`
- `smile2`
- `snow`
- `speaker`
- `split`
- `star`
- `star2`
- `star2off`
- `star3`
- `star3off`
- `staroff`
- `start`
- `sticker`
- `stop`
- `stopsign`
- `stopwatch`
- `sun`
- `svg`
- `tag`
- `takeoff`
- `talke`
- `talkq`
- `taxi`
- `temp`
- `terminal`
- `thunder`
- `ticket`
- `train`
- `trash`
- `tshirt`
- `twitter`
- `twitterbird`
- `umbrella`
- `undo`
- `unlock`
- `usb`
- `user`
- `users`
- `video`
- `view`
- `vim`
- `volume0`
- `volume1`
- `volume2`
- `volume3`
- `warning`
- `wheelchair`
- `windows`
- `woman`
- `wrench`
- `wrench2`
- `wrench3`
- `zoomin`
- `zoomout`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AcwIcon, AlarmIcon, AndroidIcon } from '@stacksjs/iconify-raphael'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AcwIcon({ size: 20, class: 'nav-icon' }),
    contact: AlarmIcon({ size: 20, class: 'nav-icon' }),
    settings: AndroidIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-raphael'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AcwIcon, AlarmIcon } from '@stacksjs/iconify-raphael'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcwIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AcwIcon } from '@stacksjs/iconify-raphael'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, acw } from '@stacksjs/iconify-raphael'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AcwIcon } from '@stacksjs/iconify-raphael'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-raphael'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-raphael'
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
import { 500px } from '@stacksjs/iconify-raphael'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT



## Credits

- **Icons**: Dmitry Baranovskiy ([Website](https://github.com/dmitrybaranovskiy/raphael))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/raphael/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/raphael/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
