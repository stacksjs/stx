# Open Iconic

> Open Iconic icons for stx from Iconify

## Overview

This package provides access to 223 icons from the Open Iconic collection through the stx iconify integration.

**Collection ID:** `oi`
**Total Icons:** 223
**Author:** Iconic ([Website](https://github.com/iconic/open-iconic))
**License:** MIT ([Details](https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-oi
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccountLoginIcon height="1em" />
<AccountLoginIcon width="1em" height="1em" />
<AccountLoginIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccountLoginIcon size="24" />
<AccountLoginIcon size="1em" />

<!-- Using width and height -->
<AccountLoginIcon width="24" height="32" />

<!-- With color -->
<AccountLoginIcon size="24" color="red" />
<AccountLoginIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccountLoginIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccountLoginIcon
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
    <AccountLoginIcon size="24" />
    <AccountLogoutIcon size="24" color="#4a90e2" />
    <ActionRedoIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accountLogin, accountLogout, actionRedo } from '@stacksjs/iconify-oi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accountLogin, { size: 24 })
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
<AccountLoginIcon size="24" color="red" />
<AccountLoginIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccountLoginIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccountLoginIcon size="24" class="text-primary" />
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
<AccountLoginIcon height="1em" />
<AccountLoginIcon width="1em" height="1em" />
<AccountLoginIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccountLoginIcon size="24" />
<AccountLoginIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.oi-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccountLoginIcon class="oi-icon" />
```

## Available Icons

This package contains **223** icons:

- `accountLogin`
- `accountLogout`
- `actionRedo`
- `actionUndo`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `aperture`
- `arrowBottom`
- `arrowCircleBottom`
- `arrowCircleLeft`
- `arrowCircleRight`
- `arrowCircleTop`
- `arrowLeft`
- `arrowRight`
- `arrowThickBottom`
- `arrowThickLeft`
- `arrowThickRight`
- `arrowThickTop`
- `arrowTop`
- `audio`
- `audioSpectrum`
- `badge`
- `ban`
- `barChart`
- `basket`
- `batteryEmpty`
- `batteryFull`
- `beaker`
- `bell`
- `bluetooth`
- `bold`
- `bolt`
- `book`
- `bookmark`
- `box`
- `briefcase`
- `britishPound`
- `browser`
- `brush`
- `bug`
- `bullhorn`
- `calculator`
- `calendar`
- `cameraSlr`
- `caretBottom`
- `caretLeft`
- `caretRight`
- `caretTop`
- `cart`
- `chat`
- `check`
- `chevronBottom`
- `chevronLeft`
- `chevronRight`
- `chevronTop`
- `circleCheck`
- `circleX`
- `clipboard`
- `clock`
- `cloud`
- `cloudDownload`
- `cloudUpload`
- `cloudy`
- `code`
- `cog`
- `collapseDown`
- `collapseLeft`
- `collapseRight`
- `collapseUp`
- `command`
- `commentSquare`
- `compass`
- `contrast`
- `copywriting`
- `creditCard`
- `crop`
- `dashboard`
- `dataTransferDownload`
- `dataTransferUpload`
- `delete`
- `dial`
- `document`
- `dollar`
- `doubleQuoteSansLeft`
- `doubleQuoteSansRight`
- `doubleQuoteSerifLeft`
- `doubleQuoteSerifRight`
- `droplet`
- `eject`
- `elevator`
- `ellipses`
- `envelopeClosed`
- `envelopeOpen`
- `euro`
- `excerpt`
- `expandDown`
- `expandLeft`
- `expandRight`
- `expandUp`
- `externalLink`
- `eye`
- `eyedropper`
- `file`
- `fire`
- `flag`
- `flash`
- `folder`
- `fork`
- `fullscreenEnter`
- `fullscreenExit`
- `globe`
- `graph`
- `gridFourUp`
- `gridThreeUp`
- `gridTwoUp`
- `hardDrive`
- `header`
- `headphones`
- `heart`
- `home`
- `image`
- `inbox`
- `infinity`
- `info`
- `italic`
- `justifyCenter`
- `justifyLeft`
- `justifyRight`
- `key`
- `laptop`
- `layers`
- `lightbulb`
- `linkBroken`
- `linkIntact`
- `list`
- `listRich`
- `location`
- `lockLocked`
- `lockUnlocked`
- `loop`
- `loopCircular`
- `loopSquare`
- `magnifyingGlass`
- `map`
- `mapMarker`
- `mediaPause`
- `mediaPlay`
- `mediaRecord`
- `mediaSkipBackward`
- `mediaSkipForward`
- `mediaStepBackward`
- `mediaStepForward`
- `mediaStop`
- `medicalCross`
- `menu`
- `microphone`
- `minus`
- `monitor`
- `moon`
- `move`
- `musicalNote`
- `paperclip`
- `pencil`
- `people`
- `person`
- `phone`
- `pieChart`
- `pin`
- `playCircle`
- `plus`
- `powerStandby`
- `print`
- `project`
- `pulse`
- `puzzlePiece`
- `questionMark`
- `rain`
- `random`
- `reload`
- `resizeBoth`
- `resizeHeight`
- `resizeWidth`
- `rss`
- `rssAlt`
- `script`
- `share`
- `shareBoxed`
- `shield`
- `signal`
- `signpost`
- `sortAscending`
- `sortDescending`
- `spreadsheet`
- `star`
- `sun`
- `tablet`
- `tag`
- `tags`
- `target`
- `task`
- `terminal`
- `text`
- `thumbDown`
- `thumbUp`
- `timer`
- `transfer`
- `trash`
- `underline`
- `verticalAlignBottom`
- `verticalAlignCenter`
- `verticalAlignTop`
- `video`
- `volumeHigh`
- `volumeLow`
- `volumeOff`
- `warning`
- `wifi`
- `wrench`
- `x`
- `yen`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccountLoginIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccountLogoutIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ActionRedoIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ActionUndoIcon size="20" class="nav-icon" /> Settings</a>
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
<AccountLoginIcon
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
    <AccountLoginIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccountLogoutIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ActionRedoIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccountLoginIcon size="24" />
   <AccountLogoutIcon size="24" color="#4a90e2" />
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
   <AccountLoginIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccountLoginIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccountLoginIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accountLogin } from '@stacksjs/iconify-oi'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accountLogin, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accountLogin } from '@stacksjs/iconify-oi'

// Icons are typed as IconData
const myIcon: IconData = accountLogin
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/iconic/open-iconic/blob/master/ICON-LICENSE) for more information.

## Credits

- **Icons**: Iconic ([Website](https://github.com/iconic/open-iconic))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/oi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/oi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
