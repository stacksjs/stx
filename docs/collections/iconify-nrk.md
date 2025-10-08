# NRK Core Icons

> NRK Core Icons icons for stx from Iconify

## Overview

This package provides access to 241 icons from the NRK Core Icons collection through the stx iconify integration.

**Collection ID:** `nrk`
**Total Icons:** 241
**Author:** Norsk rikskringkasting ([Website](https://github.com/nrkno/core-icons))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-nrk
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 360Icon, 404Icon, AlarmClockIcon } from '@stacksjs/iconify-nrk'

// Basic usage
const icon = 360Icon()

// With size
const sizedIcon = 360Icon({ size: 24 })

// With color
const coloredIcon = 404Icon({ color: 'red' })

// With multiple props
const customIcon = AlarmClockIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 360Icon, 404Icon, AlarmClockIcon } from '@stacksjs/iconify-nrk'

  global.icons = {
    home: 360Icon({ size: 24 }),
    user: 404Icon({ size: 24, color: '#4a90e2' }),
    settings: AlarmClockIcon({ size: 32 })
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
import { 360, 404, alarmClock } from '@stacksjs/iconify-nrk'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(360, { size: 24 })
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
const redIcon = 360Icon({ color: 'red' })
const blueIcon = 360Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 360Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 360Icon({ class: 'text-primary' })
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
const icon24 = 360Icon({ size: 24 })
const icon1em = 360Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 360Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 360Icon({ height: '1em' })
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
const smallIcon = 360Icon({ class: 'icon-small' })
const largeIcon = 360Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **241** icons:

- `360`
- `404`
- `alarmClock`
- `arrangeList`
- `arrowDown`
- `arrowDropdown`
- `arrowLeft`
- `arrowLeftLong`
- `arrowNested`
- `arrowRight`
- `arrowRightLong`
- `arrowUp`
- `article`
- `back`
- `bell`
- `bellActive`
- `bookmark`
- `bookmarkActive`
- `broadcast`
- `bulletSquare`
- `bulletedList`
- `calendar`
- `category`
- `categoryActive`
- `check`
- `checkActive`
- `checkRadioUnchecked`
- `checkbox`
- `checkboxActive`
- `chevronDown`
- `chevronLeft`
- `chevronRight`
- `chevronUp`
- `clock`
- `close`
- `closeActive`
- `comment`
- `dialogue`
- `dice1`
- `dice1Active`
- `dice2`
- `dice2Active`
- `dice3`
- `dice3Active`
- `dice4`
- `dice4Active`
- `dice5`
- `dice5Active`
- `dice6`
- `dice6Active`
- `download`
- `downloaded`
- `duration`
- `edit`
- `ellipsis`
- `ellipsisActive`
- `fullscreen`
- `fullscreenActive`
- `gallery`
- `geo`
- `geoActive`
- `geopoint`
- `geopointActive`
- `globe`
- `hardwareCamera`
- `hardwareComputer`
- `hardwareGame`
- `hardwareHeadphones`
- `hardwareLaptop`
- `hardwareMicrophone`
- `hardwareMicrophoneActive`
- `hardwareMobile`
- `hardwarePrinter`
- `hardwareRadio`
- `hardwareSmartSpeaker`
- `hardwareSmartWatch`
- `hardwareSpeaker`
- `hardwareTablet`
- `hardwareTv`
- `hardwareWatch`
- `heart`
- `heartActive`
- `help`
- `hide`
- `home`
- `homeActive`
- `info`
- `latestNews`
- `latestNewsActive`
- `link`
- `list`
- `listActive`
- `liveActivity`
- `liveActivityActive`
- `lock`
- `lockActive`
- `logout`
- `longread`
- `longreadActive`
- `lyn`
- `mat`
- `media404Notfound`
- `mediaAgelimit12`
- `mediaAgelimit15`
- `mediaAgelimit18`
- `mediaAgelimit6`
- `mediaAgelimit9`
- `mediaAgelimitA`
- `mediaAirplay`
- `mediaAirplayActive`
- `mediaBeamNote`
- `mediaBluetooth`
- `mediaChromecast`
- `mediaChromecast1`
- `mediaChromecast2`
- `mediaChromecast3`
- `mediaChromecastActive`
- `mediaCompleted`
- `mediaDirekte`
- `mediaDirekteGolive`
- `mediaDirekteNotlive`
- `mediaDirektetv`
- `mediaDirektetvActive`
- `mediaFfw`
- `mediaFfw15sec`
- `mediaFfw30sec`
- `mediaFfw5sec`
- `mediaIndexQuaverTiny`
- `mediaJumpto`
- `mediaMediaComplete`
- `mediaMediaIncomplete`
- `mediaNext`
- `mediaNy`
- `mediaPause`
- `mediaPictureInPicture`
- `mediaPictureInPictureActive`
- `mediaPlay`
- `mediaPlayFail`
- `mediaPlaylist`
- `mediaPlaylistAdd`
- `mediaPlaylistAddLater`
- `mediaPlaylistAddNext`
- `mediaPlaylistAdded`
- `mediaPlaylistRemove`
- `mediaPrevious`
- `mediaProgramguide`
- `mediaProgramguideActive`
- `mediaQuaver`
- `mediaQuaverActive`
- `mediaQuaverOff`
- `mediaRwd`
- `mediaRwd15sec`
- `mediaRwd30sec`
- `mediaRwd5sec`
- `mediaSoundwave`
- `mediaSpeed08x`
- `mediaSpeed125x`
- `mediaSpeed15x`
- `mediaSpeed1x`
- `mediaSpeed2x`
- `mediaStop`
- `mediaSubtitles`
- `mediaSubtitlesActive`
- `mediaSubtitlesUnavailable`
- `mediaTheater`
- `mediaTheaterActive`
- `mediaTilgjengelighetGeoblocked`
- `mediaTilgjengelighetIkkelengertilgjengelig`
- `mediaTilgjengelighetKommer`
- `mediaTilgjengelighetSnartutilgjengelig`
- `mediaVideo`
- `mediaVolume1`
- `mediaVolume2`
- `mediaVolume3`
- `mediaVolumeMuted`
- `mening`
- `minus`
- `more`
- `moreActive`
- `newChat`
- `note1`
- `note1Off`
- `note2`
- `offline`
- `online`
- `openInNew`
- `person`
- `plus`
- `poll`
- `progress`
- `quiz`
- `radioActive`
- `refresh`
- `refreshExpressive`
- `reload`
- `reloadExpressive`
- `reorder`
- `rotate`
- `search`
- `searchActive`
- `settings`
- `settingsActive`
- `show`
- `sleep`
- `someEmail`
- `someEmailExpressive`
- `someEmbed`
- `someFacebook`
- `someGoogle`
- `someInstagram`
- `somePinterest`
- `someShare`
- `someShareIos`
- `someSnapchat`
- `someTommelned`
- `someTommelnedActive`
- `someTommelopp`
- `someTommeloppActive`
- `someTwitter`
- `someYoutube`
- `spinner`
- `star`
- `starActive`
- `superEmojiPoopAngry`
- `tilgjengelighet`
- `tilgjengelighetHorbarhet`
- `tilgjengelighetLydtekst`
- `tilgjengelighetSynstolking`
- `tilgjengelighetTegnspraak`
- `trash`
- `trashActive`
- `unlock`
- `unlockActive`
- `upload`
- `userAvatar`
- `userAvatarExpressive`
- `userLoggedin`
- `userLoggedinActive`
- `userNotloggedin`
- `userNotloggedinActive`
- `warning`

## Usage Examples

### Navigation Menu

```html
@js
  import { 360Icon, 404Icon, AlarmClockIcon, ArrangeListIcon } from '@stacksjs/iconify-nrk'

  global.navIcons = {
    home: 360Icon({ size: 20, class: 'nav-icon' }),
    about: 404Icon({ size: 20, class: 'nav-icon' }),
    contact: AlarmClockIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrangeListIcon({ size: 20, class: 'nav-icon' })
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
import { 360Icon } from '@stacksjs/iconify-nrk'

const icon = 360Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 360Icon, 404Icon, AlarmClockIcon } from '@stacksjs/iconify-nrk'

const successIcon = 360Icon({ size: 16, color: '#22c55e' })
const warningIcon = 404Icon({ size: 16, color: '#f59e0b' })
const errorIcon = AlarmClockIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 360Icon, 404Icon } from '@stacksjs/iconify-nrk'
   const icon = 360Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 360, 404 } from '@stacksjs/iconify-nrk'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(360, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 360Icon, 404Icon } from '@stacksjs/iconify-nrk'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-nrk'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 360Icon } from '@stacksjs/iconify-nrk'
     global.icon = 360Icon({ size: 24 })
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
   const icon = 360Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 360 } from '@stacksjs/iconify-nrk'

// Icons are typed as IconData
const myIcon: IconData = 360
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Norsk rikskringkasting ([Website](https://github.com/nrkno/core-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/nrk/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/nrk/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
