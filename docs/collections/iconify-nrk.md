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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<360Icon height="1em" />
<360Icon width="1em" height="1em" />
<360Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<360Icon size="24" />
<360Icon size="1em" />

<!-- Using width and height -->
<360Icon width="24" height="32" />

<!-- With color -->
<360Icon size="24" color="red" />
<360Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<360Icon size="24" class="icon-primary" />

<!-- With all properties -->
<360Icon
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
    <360Icon size="24" />
    <404Icon size="24" color="#4a90e2" />
    <AlarmClockIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<360Icon size="24" color="red" />
<360Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<360Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<360Icon size="24" class="text-primary" />
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
<360Icon height="1em" />
<360Icon width="1em" height="1em" />
<360Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<360Icon size="24" />
<360Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.nrk-icon {
  width: 1em;
  height: 1em;
}
```

```html
<360Icon class="nrk-icon" />
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
<nav>
  <a href="/"><360Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><404Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AlarmClockIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrangeListIcon size="20" class="nav-icon" /> Settings</a>
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
<360Icon
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
    <360Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <404Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AlarmClockIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <360Icon size="24" />
   <404Icon size="24" color="#4a90e2" />
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
   <360Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <360Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <360Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 360 } from '@stacksjs/iconify-nrk'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(360, { size: 24 })
   @endjs

   {!! customIcon !!}
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
