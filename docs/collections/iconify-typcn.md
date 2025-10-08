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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdjustBrightnessIcon, AdjustContrastIcon, AnchorIcon } from '@stacksjs/iconify-typcn'

// Basic usage
const icon = AdjustBrightnessIcon()

// With size
const sizedIcon = AdjustBrightnessIcon({ size: 24 })

// With color
const coloredIcon = AdjustContrastIcon({ color: 'red' })

// With multiple props
const customIcon = AnchorIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdjustBrightnessIcon, AdjustContrastIcon, AnchorIcon } from '@stacksjs/iconify-typcn'

  global.icons = {
    home: AdjustBrightnessIcon({ size: 24 }),
    user: AdjustContrastIcon({ size: 24, color: '#4a90e2' }),
    settings: AnchorIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AdjustBrightnessIcon({ color: 'red' })
const blueIcon = AdjustBrightnessIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdjustBrightnessIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdjustBrightnessIcon({ class: 'text-primary' })
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
const icon24 = AdjustBrightnessIcon({ size: 24 })
const icon1em = AdjustBrightnessIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdjustBrightnessIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdjustBrightnessIcon({ height: '1em' })
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
const smallIcon = AdjustBrightnessIcon({ class: 'icon-small' })
const largeIcon = AdjustBrightnessIcon({ class: 'icon-large' })
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
@js
  import { AdjustBrightnessIcon, AdjustContrastIcon, AnchorIcon, AnchorOutlineIcon } from '@stacksjs/iconify-typcn'

  global.navIcons = {
    home: AdjustBrightnessIcon({ size: 20, class: 'nav-icon' }),
    about: AdjustContrastIcon({ size: 20, class: 'nav-icon' }),
    contact: AnchorIcon({ size: 20, class: 'nav-icon' }),
    settings: AnchorOutlineIcon({ size: 20, class: 'nav-icon' })
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
import { AdjustBrightnessIcon } from '@stacksjs/iconify-typcn'

const icon = AdjustBrightnessIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdjustBrightnessIcon, AdjustContrastIcon, AnchorIcon } from '@stacksjs/iconify-typcn'

const successIcon = AdjustBrightnessIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdjustContrastIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AnchorIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdjustBrightnessIcon, AdjustContrastIcon } from '@stacksjs/iconify-typcn'
   const icon = AdjustBrightnessIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adjustBrightness, adjustContrast } from '@stacksjs/iconify-typcn'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adjustBrightness, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdjustBrightnessIcon, AdjustContrastIcon } from '@stacksjs/iconify-typcn'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-typcn'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdjustBrightnessIcon } from '@stacksjs/iconify-typcn'
     global.icon = AdjustBrightnessIcon({ size: 24 })
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
   const icon = AdjustBrightnessIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
