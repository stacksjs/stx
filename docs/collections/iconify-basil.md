# Basil

> Basil icons for stx from Iconify

## Overview

This package provides access to 496 icons from the Basil collection through the stx iconify integration.

**Collection ID:** `basil`
**Total Icons:** 496
**Author:** Craftwork ([Website](https://www.figma.com/community/file/931906394678748246))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-basil
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddOutlineIcon, AddSolidIcon, AdobeAfterEffectsOutlineIcon } from '@stacksjs/iconify-basil'

// Basic usage
const icon = AddOutlineIcon()

// With size
const sizedIcon = AddOutlineIcon({ size: 24 })

// With color
const coloredIcon = AddSolidIcon({ color: 'red' })

// With multiple props
const customIcon = AdobeAfterEffectsOutlineIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddOutlineIcon, AddSolidIcon, AdobeAfterEffectsOutlineIcon } from '@stacksjs/iconify-basil'

  global.icons = {
    home: AddOutlineIcon({ size: 24 }),
    user: AddSolidIcon({ size: 24, color: '#4a90e2' }),
    settings: AdobeAfterEffectsOutlineIcon({ size: 32 })
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
import { addOutline, addSolid, adobeAfterEffectsOutline } from '@stacksjs/iconify-basil'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addOutline, { size: 24 })
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
const redIcon = AddOutlineIcon({ color: 'red' })
const blueIcon = AddOutlineIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddOutlineIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddOutlineIcon({ class: 'text-primary' })
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
const icon24 = AddOutlineIcon({ size: 24 })
const icon1em = AddOutlineIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddOutlineIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddOutlineIcon({ height: '1em' })
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
const smallIcon = AddOutlineIcon({ class: 'icon-small' })
const largeIcon = AddOutlineIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **496** icons:

- `addOutline`
- `addSolid`
- `adobeAfterEffectsOutline`
- `adobeAfterEffectsSolid`
- `adobeExperinceDesignOutline`
- `adobeExperinceDesignSolid`
- `adobeIllustratorOutline`
- `adobeIllustratorSolid`
- `adobeIndesignOutline`
- `adobeIndesignSolid`
- `adobeLightroomOutline`
- `adobeLightroomSolid`
- `adobePhotoshopOutline`
- `adobePhotoshopSolid`
- `adobePremiereOutline`
- `adobePremiereSolid`
- `alarmOutline`
- `alarmSolid`
- `androidOutline`
- `androidSolid`
- `appStoreOutline`
- `appStoreSolid`
- `appleOutline`
- `appleSolid`
- `appsOutline`
- `appsSolid`
- `arrowDownOutline`
- `arrowDownSolid`
- `arrowLeftOutline`
- `arrowLeftSolid`
- `arrowRightOutline`
- `arrowRightSolid`
- `arrowUpOutline`
- `arrowUpSolid`
- `asanaOutline`
- `asanaSolid`
- `atSignOutline`
- `atSignSolid`
- `attachOutline`
- `attachSolid`
- `awardOutline`
- `awardSolid`
- `backspaceOutline`
- `backspaceSolid`
- `bagOutline`
- `bagSolid`
- `bankOutline`
- `bankSolid`
- `batteryEmptyOutline`
- `batteryFullOutline`
- `batteryFullSolid`
- `batteryLowOutline`
- `batteryLowSolid`
- `batteryMostOutline`
- `batteryMostSolid`
- `batteryQuarterOutline`
- `batteryQuarterSolid`
- `battryHalfOutline`
- `battryHalfSolid`
- `behanceOutline`
- `behanceSolid`
- `binocularOutline`
- `binocularSolid`
- `bluetoothOutline`
- `bluetoothSolid`
- `bookCheckOutline`
- `bookCheckSolid`
- `bookMarkOutline`
- `bookMarkSolid`
- `bookOpenOutline`
- `bookOpenSolid`
- `bookOutline`
- `bookSolid`
- `bookmarkOutline`
- `bookmarkSolid`
- `boxOutline`
- `boxSolid`
- `bullhornOutline`
- `bullhornSolid`
- `calendarOutline`
- `calendarSolid`
- `cameraOutline`
- `cameraSolid`
- `cancelOutline`
- `cancelSolid`
- `cardOutline`
- `cardSolid`
- `caretDownOutline`
- `caretDownSolid`
- `caretLeftOutline`
- `caretLeftSolid`
- `caretRightOutline`
- `caretRightSolid`
- `caretUpOutline`
- `caretUpSolid`
- `chartPieAltOutline`
- `chartPieAltSolid`
- `chartPieOutline`
- `chartPieSolid`
- `chatOutline`
- `chatSolid`
- `checkOutline`
- `checkSolid`
- `checkedBoxOutline`
- `checkedBoxSolid`
- `chromeOutline`
- `chromeSolid`
- `clipboardAltOutline`
- `clipboardAltSolid`
- `clipboardOutline`
- `clipboardSolid`
- `clockOutline`
- `clockSolid`
- `cloudCheckOutline`
- `cloudCheckSolid`
- `cloudDownloadOutline`
- `cloudDownloadSolid`
- `cloudOffOutline`
- `cloudOffSolid`
- `cloudOutline`
- `cloudSolid`
- `cloudUploadOutline`
- `cloudUploadSolid`
- `collapseOutline`
- `collapseSolid`
- `columnsOutline`
- `columnsSolid`
- `commentBlockOutline`
- `commentBlockSolid`
- `commentMinusOutline`
- `commentMinusSolid`
- `commentOutline`
- `commentPlusOutline`
- `commentPlusSolid`
- `commentSolid`
- `contactsOutline`
- `contactsSolid`
- `copyOutline`
- `copySolid`
- `crossOutline`
- `crossSolid`
- `currentLocationOutline`
- `currentLocationSolid`
- `cursorOutline`
- `cursorSolid`
- `desktopOutline`
- `desktopSolid`
- `dialpadOutline`
- `dialpadSolid`
- `diamondOutline`
- `diamondSolid`
- `dislikeOutline`
- `dislikeSolid`
- `documentOutline`
- `documentSolid`
- `downloadOutline`
- `downloadSolid`
- `dribbbleOutline`
- `dribbbleSolid`
- `dropboxOutline`
- `dropboxSolid`
- `editAltOutline`
- `editAltSolid`
- `editOutline`
- `editSolid`
- `envelopeOpenOutline`
- `envelopeOpenSolid`
- `envelopeOutline`
- `envelopeSolid`
- `exchangeOutline`
- `exchangeSolid`
- `expandOutline`
- `expandSolid`
- `exploreOutline`
- `exploreSolid`
- `eyeClosedOutline`
- `eyeClosedSolid`
- `eyeOutline`
- `eyeSolid`
- `facebookMessengerOutline`
- `facebookMessengerSolid`
- `facebookOutline`
- `facebookSolid`
- `fastForwardOutline`
- `fastForwardSolid`
- `fastRewindOutline`
- `fastRewindSolid`
- `figmaOutline`
- `figmaSolid`
- `fileDownloadOutline`
- `fileDownloadSolid`
- `fileOutline`
- `fileSolid`
- `fileUploadOutline`
- `fileUploadSolid`
- `fileUserOutline`
- `fileUserSolid`
- `filterOutline`
- `filterSolid`
- `fireOutline`
- `fireSolid`
- `flaskAltOutline`
- `flaskAltSolid`
- `flaskOutline`
- `flaskSolid`
- `folderBlockOutline`
- `folderBlockSolid`
- `folderDeleteOutline`
- `folderDeleteSolid`
- `folderLockOutline`
- `folderLockSolid`
- `folderOpenOutline`
- `folderOpenSolid`
- `folderOutline`
- `folderPlusOutline`
- `folderPlusSolid`
- `folderSolid`
- `folderUserOutline`
- `folderUserSolid`
- `forwardOutline`
- `forwardSolid`
- `gamepadOutline`
- `gamepadSolid`
- `globeOutline`
- `globeSolid`
- `gmailOutline`
- `gmailSolid`
- `googleAltOutline`
- `googleAltSolid`
- `googleDriveOutline`
- `googleDriveSolid`
- `googleOutline`
- `googlePlayOutline`
- `googlePlaySolid`
- `googleSolid`
- `group151Outline`
- `group23Solid`
- `headphoneOutline`
- `headphoneSolid`
- `headsetOutline`
- `headsetSolid`
- `heartOffOutline`
- `heartOffSolid`
- `heartOutline`
- `heartPlusOutline`
- `heartSolid`
- `heartbeatOutline`
- `heartbeatSolid`
- `historyOutline`
- `historySolid`
- `homeOutline`
- `homeSolid`
- `hotspotOutline`
- `hotspotSolid`
- `imageOutline`
- `imageSolid`
- `infoCircleOutline`
- `infoCircleSolid`
- `infoRectOutline`
- `infoRectSolid`
- `infoTriangleOutline`
- `infoTriangleSolid`
- `instagramOutline`
- `instagramSolid`
- `invoiceOutline`
- `invoiceSolid`
- `keyOutline`
- `keySolid`
- `layoutOutline`
- `layoutSolid`
- `lightbulbAltOutline`
- `lightbulbAltSolid`
- `lightbulbOffOutline`
- `lightbulbOffSolid`
- `lightbulbOutline`
- `lightbulbSolid`
- `lightningAltOutline`
- `lightningAltSolid`
- `lightningOutline`
- `lightningSolid`
- `likeOutline`
- `likeSolid`
- `linkedinOutline`
- `linkedinSolid`
- `locationCheckOutline`
- `locationCheckSolid`
- `locationOutline`
- `locationPlusOutline`
- `locationPlusSolid`
- `locationQuestionOutline`
- `locationQuestionSolid`
- `locationSolid`
- `lockOutline`
- `lockSolid`
- `lockTimeOutline`
- `lockTimeSolid`
- `loginOutline`
- `loginSolid`
- `logoutOutline`
- `logoutSolid`
- `mapLocationOutline`
- `mapLocationSolid`
- `mediumOutline`
- `mediumSolid`
- `medkitOutline`
- `medkitSolid`
- `menuOutline`
- `menuSolid`
- `microphoneOffOutline`
- `microphoneOffSolid`
- `microphoneOutline`
- `microphoneSolid`
- `mobilePhoneOutline`
- `mobilePhoneSolid`
- `moonOutline`
- `moonSolid`
- `mouseAltOutline`
- `mouseAltSolid`
- `mouseOutline`
- `mouseSolid`
- `moveOutline`
- `moveSolid`
- `musicOutline`
- `musicSolid`
- `navigationOutline`
- `navigationSolid`
- `notificationOffOutline`
- `notificationOffSolid`
- `notificationOnOutline`
- `notificationOnSolid`
- `notificationOutline`
- `notificationSolid`
- `notionOutline`
- `notionSolid`
- `other1Outline`
- `other1Solid`
- `other2Outline`
- `paletteOutline`
- `paletteSolid`
- `pauseOutline`
- `pauseSolid`
- `phoneInOutline`
- `phoneInSolid`
- `phoneMissOutline`
- `phoneMissSolid`
- `phoneOffOutline`
- `phoneOffSolid`
- `phoneOutOutline`
- `phoneOutSolid`
- `phoneOutline`
- `phoneSolid`
- `pictureOutline`
- `pictureSolid`
- `pinOutline`
- `pinSolid`
- `pinterestOutline`
- `pinterestSolid`
- `playOutline`
- `playSolid`
- `plusOutline`
- `plusSolid`
- `powerButtonOutline`
- `powerButtonSolid`
- `presentOutline`
- `presentSolid`
- `printerOutline`
- `printerSolid`
- `processorOutline`
- `processorSolid`
- `pulseOutline`
- `pulseSolid`
- `qqOutline`
- `qqSolid`
- `redditOutline`
- `redditSolid`
- `refreshOutline`
- `refreshSolid`
- `replyOutline`
- `replySolid`
- `rowsOutline`
- `rowsSolid`
- `sandWatchOutline`
- `sandWatchSolid`
- `saveOutline`
- `saveSolid`
- `searchOutline`
- `searchSolid`
- `sendOutline`
- `sendSolid`
- `serverOutline`
- `serverSolid`
- `settingsAdjustOutline`
- `settingsAdjustSolid`
- `settingsAltOutline`
- `settingsAltSolid`
- `settingsOutline`
- `settingsSolid`
- `shareBoxOutline`
- `shareBoxSolid`
- `shareOutline`
- `shareSolid`
- `shieldOutline`
- `shieldSolid`
- `shoppingBagOutline`
- `shoppingBagSolid`
- `shoppingBasketOutline`
- `shoppingBasketSolid`
- `shoppingCartOutline`
- `shoppingCartSolid`
- `shuffleOutline`
- `shuffleSolid`
- `sketchOutline`
- `sketchSolid`
- `skipNextOutline`
- `skipNextSolid`
- `skipPrevOutline`
- `skipPrevSolid`
- `skypeOutline`
- `skypeSolid`
- `slackOutline`
- `slackSolid`
- `snapchatOutline`
- `snapchatSolid`
- `sortOutline`
- `sortSolid`
- `stackOutline`
- `stackSolid`
- `starHalfOutline`
- `starHalfSolid`
- `starOutline`
- `starSolid`
- `sunOutline`
- `sunSolid`
- `telegramOutline`
- `telegramSolid`
- `timerOutline`
- `timerSolid`
- `toggleOffOutline`
- `toggleOffSolid`
- `toggleOnOutline`
- `toggleOnSolid`
- `trashAltOutline`
- `trashAltSolid`
- `trashOutline`
- `trashSolid`
- `trelloOutline`
- `trelloSolid`
- `tumblrOutline`
- `tumblrSolid`
- `twitchOutline`
- `twitchSolid`
- `twitterOutline`
- `twitterSolid`
- `umbrellaOutline`
- `umbrellaSolid`
- `universityOutline`
- `universitySolid`
- `unlockOutline`
- `unlockSolid`
- `uploadOutline`
- `uploadSolid`
- `userBlockOutline`
- `userBlockSolid`
- `userClockOutline`
- `userClockSolid`
- `userOutline`
- `userPlusOutline`
- `userPlusSolid`
- `userSolid`
- `viberOutline`
- `viberSolid`
- `videoOutline`
- `videoSolid`
- `vkOutline`
- `vkSolid`
- `volumeDownOutline`
- `volumeDownSolid`
- `volumeOffOutline`
- `volumeOffSolid`
- `volumeUpOutline`
- `volumeUpSolid`
- `walletOutline`
- `walletSolid`
- `watchOutline`
- `watchSolid`
- `wechatSolid`
- `whatsappOutline`
- `whatsappSolid`
- `windowsOutline`
- `windowsSolid`
- `youtubeOutline`
- `youtubeSolid`
- `zoomInOutline`
- `zoomInSolid`
- `zoomOutOutline`
- `zoomOutSolid`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddOutlineIcon, AddSolidIcon, AdobeAfterEffectsOutlineIcon, AdobeAfterEffectsSolidIcon } from '@stacksjs/iconify-basil'

  global.navIcons = {
    home: AddOutlineIcon({ size: 20, class: 'nav-icon' }),
    about: AddSolidIcon({ size: 20, class: 'nav-icon' }),
    contact: AdobeAfterEffectsOutlineIcon({ size: 20, class: 'nav-icon' }),
    settings: AdobeAfterEffectsSolidIcon({ size: 20, class: 'nav-icon' })
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
import { AddOutlineIcon } from '@stacksjs/iconify-basil'

const icon = AddOutlineIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddOutlineIcon, AddSolidIcon, AdobeAfterEffectsOutlineIcon } from '@stacksjs/iconify-basil'

const successIcon = AddOutlineIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddSolidIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdobeAfterEffectsOutlineIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddOutlineIcon, AddSolidIcon } from '@stacksjs/iconify-basil'
   const icon = AddOutlineIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addOutline, addSolid } from '@stacksjs/iconify-basil'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addOutline, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddOutlineIcon, AddSolidIcon } from '@stacksjs/iconify-basil'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-basil'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddOutlineIcon } from '@stacksjs/iconify-basil'
     global.icon = AddOutlineIcon({ size: 24 })
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
   const icon = AddOutlineIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addOutline } from '@stacksjs/iconify-basil'

// Icons are typed as IconData
const myIcon: IconData = addOutline
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Craftwork ([Website](https://www.figma.com/community/file/931906394678748246))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/basil/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/basil/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
