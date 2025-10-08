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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AddOutlineIcon height="1em" />
<AddOutlineIcon width="1em" height="1em" />
<AddOutlineIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AddOutlineIcon size="24" />
<AddOutlineIcon size="1em" />

<!-- Using width and height -->
<AddOutlineIcon width="24" height="32" />

<!-- With color -->
<AddOutlineIcon size="24" color="red" />
<AddOutlineIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AddOutlineIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AddOutlineIcon
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
    <AddOutlineIcon size="24" />
    <AddSolidIcon size="24" color="#4a90e2" />
    <AdobeAfterEffectsOutlineIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AddOutlineIcon size="24" color="red" />
<AddOutlineIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AddOutlineIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AddOutlineIcon size="24" class="text-primary" />
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
<AddOutlineIcon height="1em" />
<AddOutlineIcon width="1em" height="1em" />
<AddOutlineIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AddOutlineIcon size="24" />
<AddOutlineIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.basil-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AddOutlineIcon class="basil-icon" />
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
<nav>
  <a href="/"><AddOutlineIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AddSolidIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdobeAfterEffectsOutlineIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdobeAfterEffectsSolidIcon size="20" class="nav-icon" /> Settings</a>
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
<AddOutlineIcon
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
    <AddOutlineIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AddSolidIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdobeAfterEffectsOutlineIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AddOutlineIcon size="24" />
   <AddSolidIcon size="24" color="#4a90e2" />
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
   <AddOutlineIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AddOutlineIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AddOutlineIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { addOutline } from '@stacksjs/iconify-basil'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(addOutline, { size: 24 })
   @endjs

   {!! customIcon !!}
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
