# Simple line icons

> Simple line icons icons for stx from Iconify

## Overview

This package provides access to 194 icons from the Simple line icons collection through the stx iconify integration.

**Collection ID:** `simple-line-icons`
**Total Icons:** 194
**Author:** Sabbir Ahmed ([Website](https://github.com/thesabbir/simple-line-icons))
**License:** MIT ([Details](https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-simple-line-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ActionRedoIcon height="1em" />
<ActionRedoIcon width="1em" height="1em" />
<ActionRedoIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ActionRedoIcon size="24" />
<ActionRedoIcon size="1em" />

<!-- Using width and height -->
<ActionRedoIcon width="24" height="32" />

<!-- With color -->
<ActionRedoIcon size="24" color="red" />
<ActionRedoIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ActionRedoIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ActionRedoIcon
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
    <ActionRedoIcon size="24" />
    <ActionUndoIcon size="24" color="#4a90e2" />
    <AnchorIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { actionRedo, actionUndo, anchor } from '@stacksjs/iconify-simple-line-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(actionRedo, { size: 24 })
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
<ActionRedoIcon size="24" color="red" />
<ActionRedoIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ActionRedoIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ActionRedoIcon size="24" class="text-primary" />
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
<ActionRedoIcon height="1em" />
<ActionRedoIcon width="1em" height="1em" />
<ActionRedoIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ActionRedoIcon size="24" />
<ActionRedoIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.simpleLineIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ActionRedoIcon class="simpleLineIcons-icon" />
```

## Available Icons

This package contains **194** icons:

- `actionRedo`
- `actionUndo`
- `anchor`
- `arrowDown`
- `arrowDownCircle`
- `arrowLeft`
- `arrowLeftCircle`
- `arrowRight`
- `arrowRightCircle`
- `arrowUp`
- `arrowUpCircle`
- `badge`
- `bag`
- `ban`
- `basket`
- `basketLoaded`
- `bell`
- `bookOpen`
- `briefcase`
- `bubble`
- `bubbles`
- `bulb`
- `calculator`
- `calendar`
- `calender`
- `callEnd`
- `callIn`
- `callOut`
- `camera`
- `camrecorder`
- `chart`
- `check`
- `chemistry`
- `clock`
- `close`
- `cloudDownload`
- `cloudUpload`
- `compass`
- `controlEnd`
- `controlForward`
- `controlPause`
- `controlPlay`
- `controlRewind`
- `controlStart`
- `creditCard`
- `crop`
- `cup`
- `cursor`
- `cursorMove`
- `diamond`
- `direction`
- `directions`
- `disc`
- `dislike`
- `doc`
- `docs`
- `drawer`
- `drop`
- `earphones`
- `earphonesAlt`
- `emotsmile`
- `energy`
- `envelope`
- `envelopeLetter`
- `envelopeOpen`
- `envolope`
- `envolopeLetter`
- `equalizer`
- `event`
- `exclamation`
- `eye`
- `eyeglass`
- `feed`
- `film`
- `fire`
- `flag`
- `folder`
- `folderAlt`
- `frame`
- `gameController`
- `ghost`
- `globe`
- `globeAlt`
- `graduation`
- `graph`
- `grid`
- `handbag`
- `heart`
- `home`
- `hourglass`
- `info`
- `key`
- `layers`
- `like`
- `link`
- `list`
- `locationPin`
- `lock`
- `lockOpen`
- `login`
- `logout`
- `loop`
- `magicWand`
- `magnet`
- `magnifier`
- `magnifierAdd`
- `magnifierRemove`
- `map`
- `menu`
- `microphone`
- `minus`
- `mouse`
- `musicTone`
- `musicToneAlt`
- `mustache`
- `note`
- `notebook`
- `options`
- `optionsVertical`
- `organization`
- `paperClip`
- `paperPlane`
- `paypal`
- `pencil`
- `people`
- `phone`
- `picture`
- `pieChart`
- `pin`
- `plane`
- `playlist`
- `plus`
- `power`
- `present`
- `printer`
- `puzzle`
- `question`
- `refresh`
- `reload`
- `rocket`
- `screenDesktop`
- `screenSmartphone`
- `screenTablet`
- `settings`
- `share`
- `shareAlt`
- `shield`
- `shuffle`
- `sizeActual`
- `sizeFullscreen`
- `socialBehance`
- `socialDribbble`
- `socialDropbox`
- `socialFacebook`
- `socialFoursqare`
- `socialGithub`
- `socialGoogle`
- `socialInstagram`
- `socialLinkedin`
- `socialPintarest`
- `socialPinterest`
- `socialReddit`
- `socialSkype`
- `socialSoundcloud`
- `socialSpotify`
- `socialSteam`
- `socialStumbleupon`
- `socialTumblr`
- `socialTwitter`
- `socialVkontakte`
- `socialYoutube`
- `speech`
- `speedometer`
- `star`
- `support`
- `symbleFemale`
- `symbolFemale`
- `symbolMale`
- `tag`
- `target`
- `trash`
- `trophy`
- `umbrella`
- `user`
- `userFemale`
- `userFollow`
- `userFollowing`
- `userUnfollow`
- `vector`
- `volume1`
- `volume2`
- `volumeOff`
- `wallet`
- `wrench`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><ActionRedoIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ActionUndoIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AnchorIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowDownIcon size="20" class="nav-icon" /> Settings</a>
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
<ActionRedoIcon
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
    <ActionRedoIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ActionUndoIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AnchorIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ActionRedoIcon size="24" />
   <ActionUndoIcon size="24" color="#4a90e2" />
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
   <ActionRedoIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ActionRedoIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ActionRedoIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { actionRedo } from '@stacksjs/iconify-simple-line-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(actionRedo, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { actionRedo } from '@stacksjs/iconify-simple-line-icons'

// Icons are typed as IconData
const myIcon: IconData = actionRedo
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: Sabbir Ahmed ([Website](https://github.com/thesabbir/simple-line-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/simple-line-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/simple-line-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
