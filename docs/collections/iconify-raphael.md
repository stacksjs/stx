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
    <AcwIcon size="24" color="#4a90e2" />
    <AlarmIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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
.raphael-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="raphael-icon" />
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
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AcwIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AndroidIcon size="20" class="nav-icon" /> Settings</a>
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
    <AcwIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <AcwIcon size="24" color="#4a90e2" />
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
     import { 500px } from '@stacksjs/iconify-raphael'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
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
