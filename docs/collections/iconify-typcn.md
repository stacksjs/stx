# Typicons

> Typicons icons for stx from Iconify

## Overview

This package provides access to 336 icons from the Typicons collection through the stx iconify integration.

**Collection ID:** `typcn`
**Total Icons:** 336
**Author:** Stephen Hutchings ([Website](https://github.com/stephenhutchings/typicons.font))
**License:** CC BY-SA 4.0 ([Details](https://creativecommons.org/licenses/by-sa/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-typcn
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdjustBrightnessIcon height="1em" />
<AdjustBrightnessIcon width="1em" height="1em" />
<AdjustBrightnessIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdjustBrightnessIcon size="24" />
<AdjustBrightnessIcon size="1em" />

<!-- Using width and height -->
<AdjustBrightnessIcon width="24" height="32" />

<!-- With color -->
<AdjustBrightnessIcon size="24" color="red" />
<AdjustBrightnessIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdjustBrightnessIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdjustBrightnessIcon
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
    <AdjustBrightnessIcon size="24" />
    <AdjustContrastIcon size="24" color="#4a90e2" />
    <AnchorIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { adjustBrightness, adjustContrast, anchor } from '@stacksjs/iconify-typcn'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adjustBrightness, { size: 24 })
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
<AdjustBrightnessIcon size="24" color="red" />
<AdjustBrightnessIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdjustBrightnessIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdjustBrightnessIcon size="24" class="text-primary" />
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
<AdjustBrightnessIcon height="1em" />
<AdjustBrightnessIcon width="1em" height="1em" />
<AdjustBrightnessIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdjustBrightnessIcon size="24" />
<AdjustBrightnessIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.typcn-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdjustBrightnessIcon class="typcn-icon" />
```

## Available Icons

This package contains **336** icons:

- `adjustBrightness`
- `adjustContrast`
- `anchor`
- `anchorOutline`
- `archive`
- `arrowBack`
- `arrowBackOutline`
- `arrowDown`
- `arrowDownOutline`
- `arrowDownThick`
- `arrowForward`
- `arrowForwardOutline`
- `arrowLeft`
- `arrowLeftOutline`
- `arrowLeftThick`
- `arrowLoop`
- `arrowLoopOutline`
- `arrowMaximise`
- `arrowMaximiseOutline`
- `arrowMinimise`
- `arrowMinimiseOutline`
- `arrowMove`
- `arrowMoveOutline`
- `arrowRepeat`
- `arrowRepeatOutline`
- `arrowRight`
- `arrowRightOutline`
- `arrowRightThick`
- `arrowShuffle`
- `arrowSortedDown`
- `arrowSortedUp`
- `arrowSync`
- `arrowSyncOutline`
- `arrowUnsorted`
- `arrowUp`
- `arrowUpOutline`
- `arrowUpThick`
- `at`
- `attachment`
- `attachmentOutline`
- `backspace`
- `backspaceOutline`
- `batteryCharge`
- `batteryFull`
- `batteryHigh`
- `batteryLow`
- `batteryMid`
- `beaker`
- `beer`
- `bell`
- `book`
- `bookmark`
- `briefcase`
- `brush`
- `businessCard`
- `calculator`
- `calendar`
- `calendarOutline`
- `camera`
- `cameraOutline`
- `cancel`
- `cancelOutline`
- `chartArea`
- `chartAreaOutline`
- `chartBar`
- `chartBarOutline`
- `chartLine`
- `chartLineOutline`
- `chartPie`
- `chartPieOutline`
- `chevronLeft`
- `chevronLeftOutline`
- `chevronRight`
- `chevronRightOutline`
- `clipboard`
- `cloudStorage`
- `cloudStorageOutline`
- `code`
- `codeOutline`
- `coffee`
- `cog`
- `cogOutline`
- `compass`
- `contacts`
- `creditCard`
- `css3`
- `database`
- `delete`
- `deleteOutline`
- `deviceDesktop`
- `deviceLaptop`
- `devicePhone`
- `deviceTablet`
- `directions`
- `divide`
- `divideOutline`
- `document`
- `documentAdd`
- `documentDelete`
- `documentText`
- `download`
- `downloadOutline`
- `dropbox`
- `edit`
- `eject`
- `ejectOutline`
- `equals`
- `equalsOutline`
- `export`
- `exportOutline`
- `eye`
- `eyeOutline`
- `feather`
- `film`
- `filter`
- `flag`
- `flagOutline`
- `flash`
- `flashOutline`
- `flowChildren`
- `flowMerge`
- `flowParallel`
- `flowSwitch`
- `folder`
- `folderAdd`
- `folderDelete`
- `folderOpen`
- `gift`
- `globe`
- `globeOutline`
- `group`
- `groupOutline`
- `headphones`
- `heart`
- `heartFullOutline`
- `heartHalfOutline`
- `heartOutline`
- `home`
- `homeOutline`
- `html5`
- `image`
- `imageOutline`
- `infinity`
- `infinityOutline`
- `info`
- `infoLarge`
- `infoLargeOutline`
- `infoOutline`
- `inputChecked`
- `inputCheckedOutline`
- `key`
- `keyOutline`
- `keyboard`
- `leaf`
- `lightbulb`
- `link`
- `linkOutline`
- `location`
- `locationArrow`
- `locationArrowOutline`
- `locationOutline`
- `lockClosed`
- `lockClosedOutline`
- `lockOpen`
- `lockOpenOutline`
- `mail`
- `map`
- `mediaEject`
- `mediaEjectOutline`
- `mediaFastForward`
- `mediaFastForwardOutline`
- `mediaPause`
- `mediaPauseOutline`
- `mediaPlay`
- `mediaPlayOutline`
- `mediaPlayReverse`
- `mediaPlayReverseOutline`
- `mediaRecord`
- `mediaRecordOutline`
- `mediaRewind`
- `mediaRewindOutline`
- `mediaStop`
- `mediaStopOutline`
- `message`
- `messageTyping`
- `messages`
- `microphone`
- `microphoneOutline`
- `minus`
- `minusOutline`
- `mortarBoard`
- `news`
- `notes`
- `notesOutline`
- `pen`
- `pencil`
- `phone`
- `phoneOutline`
- `pi`
- `piOutline`
- `pin`
- `pinOutline`
- `pipette`
- `plane`
- `planeOutline`
- `plug`
- `plus`
- `plusOutline`
- `pointOfInterest`
- `pointOfInterestOutline`
- `power`
- `powerOutline`
- `printer`
- `puzzle`
- `puzzleOutline`
- `radar`
- `radarOutline`
- `refresh`
- `refreshOutline`
- `rss`
- `rssOutline`
- `scissors`
- `scissorsOutline`
- `shoppingBag`
- `shoppingCart`
- `socialAtCircular`
- `socialDribbble`
- `socialDribbbleCircular`
- `socialFacebook`
- `socialFacebookCircular`
- `socialFlickr`
- `socialFlickrCircular`
- `socialGithub`
- `socialGithubCircular`
- `socialGooglePlus`
- `socialGooglePlusCircular`
- `socialInstagram`
- `socialInstagramCircular`
- `socialLastFm`
- `socialLastFmCircular`
- `socialLinkedin`
- `socialLinkedinCircular`
- `socialPinterest`
- `socialPinterestCircular`
- `socialSkype`
- `socialSkypeOutline`
- `socialTumbler`
- `socialTumblerCircular`
- `socialTwitter`
- `socialTwitterCircular`
- `socialVimeo`
- `socialVimeoCircular`
- `socialYoutube`
- `socialYoutubeCircular`
- `sortAlphabetically`
- `sortAlphabeticallyOutline`
- `sortNumerically`
- `sortNumericallyOutline`
- `spanner`
- `spannerOutline`
- `spiral`
- `star`
- `starFullOutline`
- `starHalf`
- `starHalfOutline`
- `starOutline`
- `starburst`
- `starburstOutline`
- `stopwatch`
- `support`
- `tabsOutline`
- `tag`
- `tags`
- `thLarge`
- `thLargeOutline`
- `thList`
- `thListOutline`
- `thMenu`
- `thMenuOutline`
- `thSmall`
- `thSmallOutline`
- `thermometer`
- `thumbsDown`
- `thumbsOk`
- `thumbsUp`
- `tick`
- `tickOutline`
- `ticket`
- `time`
- `times`
- `timesOutline`
- `trash`
- `tree`
- `upload`
- `uploadOutline`
- `user`
- `userAdd`
- `userAddOutline`
- `userDelete`
- `userDeleteOutline`
- `userOutline`
- `vendorAndroid`
- `vendorApple`
- `vendorMicrosoft`
- `video`
- `videoOutline`
- `volume`
- `volumeDown`
- `volumeMute`
- `volumeUp`
- `warning`
- `warningOutline`
- `watch`
- `waves`
- `wavesOutline`
- `weatherCloudy`
- `weatherDownpour`
- `weatherNight`
- `weatherPartlySunny`
- `weatherShower`
- `weatherSnow`
- `weatherStormy`
- `weatherSunny`
- `weatherWindy`
- `weatherWindyCloudy`
- `wiFi`
- `wiFiOutline`
- `wine`
- `world`
- `worldOutline`
- `zoom`
- `zoomIn`
- `zoomInOutline`
- `zoomOut`
- `zoomOutOutline`
- `zoomOutline`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AdjustBrightnessIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdjustContrastIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AnchorIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AnchorOutlineIcon size="20" class="nav-icon" /> Settings</a>
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
<AdjustBrightnessIcon
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
    <AdjustBrightnessIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdjustContrastIcon size="16" color="#f59e0b" />
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
   <AdjustBrightnessIcon size="24" />
   <AdjustContrastIcon size="24" color="#4a90e2" />
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
   <AdjustBrightnessIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdjustBrightnessIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdjustBrightnessIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adjustBrightness } from '@stacksjs/iconify-typcn'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adjustBrightness, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adjustBrightness } from '@stacksjs/iconify-typcn'

// Icons are typed as IconData
const myIcon: IconData = adjustBrightness
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY-SA 4.0

See [license details](https://creativecommons.org/licenses/by-sa/4.0/) for more information.

## Credits

- **Icons**: Stephen Hutchings ([Website](https://github.com/stephenhutchings/typicons.font))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/typcn/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/typcn/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
