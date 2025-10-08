# Grommet Icons

> Grommet Icons icons for stx from Iconify

## Overview

This package provides access to 635 icons from the Grommet Icons collection through the stx iconify integration.

**Collection ID:** `grommet-icons`
**Total Icons:** 635
**Author:** Grommet ([Website](https://github.com/grommet/grommet-icons))
**License:** Apache 2.0 ([Details](https://www.apache.org/licenses/LICENSE-2.0))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-grommet-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />

<!-- Using width and height -->
<AccessibilityIcon width="24" height="32" />

<!-- With color -->
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AccessibilityIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AccessibilityIcon
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
    <AccessibilityIcon size="24" />
    <AchievementIcon size="24" color="#4a90e2" />
    <ActionIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { accessibility, achievement, action } from '@stacksjs/iconify-grommet-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(accessibility, { size: 24 })
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
<AccessibilityIcon size="24" color="red" />
<AccessibilityIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AccessibilityIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AccessibilityIcon size="24" class="text-primary" />
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
<AccessibilityIcon height="1em" />
<AccessibilityIcon width="1em" height="1em" />
<AccessibilityIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AccessibilityIcon size="24" />
<AccessibilityIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.grommetIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AccessibilityIcon class="grommetIcons-icon" />
```

## Available Icons

This package contains **635** icons:

- `accessibility`
- `achievement`
- `action`
- `actions`
- `ad`
- `add`
- `addCircle`
- `adobeCreativeCloud`
- `aed`
- `aggregate`
- `aid`
- `aidOption`
- `alarm`
- `alert`
- `amazon`
- `amex`
- `analytics`
- `anchor`
- `android`
- `announce`
- `apple`
- `appleAppStore`
- `appleMusic`
- `applePodcasts`
- `apps`
- `appsRounded`
- `archive`
- `archlinux`
- `article`
- `aruba`
- `ascend`
- `ascending`
- `assistListening`
- `atm`
- `attachment`
- `attraction`
- `baby`
- `backTen`
- `bar`
- `barChart`
- `basket`
- `beacon`
- `bike`
- `bitcoin`
- `bladesHorizontal`
- `bladesVertical`
- `blockQuote`
- `blog`
- `bluetooth`
- `bold`
- `book`
- `bookmark`
- `bottomCorner`
- `braille`
- `briefcase`
- `brush`
- `bucket`
- `bug`
- `bundle`
- `bus`
- `businessService`
- `cafeteria`
- `calculator`
- `calendar`
- `camera`
- `capacity`
- `car`
- `caretDown`
- `caretDownFill`
- `caretLeftFill`
- `caretNext`
- `caretPrevious`
- `caretRightFill`
- `caretUp`
- `caretUpFill`
- `cart`
- `catalog`
- `catalogOption`
- `centos`
- `certificate`
- `channel`
- `chapterAdd`
- `chapterNext`
- `chapterPrevious`
- `chat`
- `chatOption`
- `checkbox`
- `checkboxSelected`
- `checkmark`
- `chrome`
- `circleAlert`
- `circleInformation`
- `circlePlay`
- `circleQuestion`
- `clear`
- `clearOption`
- `cli`
- `clipboard`
- `clock`
- `clone`
- `close`
- `closedCaption`
- `cloud`
- `cloudComputer`
- `cloudDownload`
- `cloudSoftware`
- `cloudUpload`
- `cloudlinux`
- `cluster`
- `coatCheck`
- `code`
- `codeSandbox`
- `codepen`
- `coffee`
- `columns`
- `command`
- `compare`
- `compass`
- `compliance`
- `configure`
- `connect`
- `connectivity`
- `console`
- `contact`
- `contactInfo`
- `contract`
- `copy`
- `cpu`
- `creativeCommons`
- `creditCard`
- `css3`
- `cube`
- `cubes`
- `currency`
- `cursor`
- `cut`
- `cycle`
- `dashboard`
- `database`
- `debian`
- `deliver`
- `deploy`
- `descend`
- `descending`
- `desktop`
- `detach`
- `device`
- `diamond`
- `directions`
- `disabledOutline`
- `disc`
- `dislike`
- `dislikeFill`
- `docker`
- `document`
- `documentCloud`
- `documentConfig`
- `documentCsv`
- `documentDownload`
- `documentExcel`
- `documentImage`
- `documentLocked`
- `documentMissing`
- `documentNotes`
- `documentOutlook`
- `documentPdf`
- `documentPerformance`
- `documentPpt`
- `documentRtf`
- `documentSound`
- `documentStore`
- `documentTest`
- `documentText`
- `documentThreat`
- `documentTime`
- `documentTransfer`
- `documentTxt`
- `documentUpdate`
- `documentUpload`
- `documentUser`
- `documentVerified`
- `documentVideo`
- `documentWindows`
- `documentWord`
- `documentZip`
- `domain`
- `dos`
- `down`
- `download`
- `downloadOption`
- `drag`
- `drawer`
- `dribbble`
- `driveCage`
- `dropbox`
- `duplicate`
- `dxc`
- `edge`
- `edit`
- `eject`
- `elevator`
- `emergency`
- `emoji`
- `emptyCircle`
- `erase`
- `escalator`
- `expand`
- `ezmeral`
- `facebook`
- `facebookOption`
- `fan`
- `fanOption`
- `fastForward`
- `favorite`
- `fedora`
- `figma`
- `filter`
- `fingerPrint`
- `fireball`
- `firefox`
- `firewall`
- `flag`
- `flagFill`
- `flows`
- `folder`
- `folderCycle`
- `folderOpen`
- `formAdd`
- `formAttachment`
- `formCalendar`
- `formCheckmark`
- `formClock`
- `formClose`
- `formCut`
- `formDown`
- `formEdit`
- `formFilter`
- `formFolder`
- `formLocation`
- `formLock`
- `formNext`
- `formNextLink`
- `formPin`
- `formPrevious`
- `formPreviousLink`
- `formRefresh`
- `formSchedule`
- `formSearch`
- `formSubtract`
- `formTrash`
- `formUp`
- `formUpload`
- `formView`
- `formViewHide`
- `forwardTen`
- `freebsd`
- `gallery`
- `gamepad`
- `gateway`
- `gatsbyjs`
- `gem`
- `gift`
- `github`
- `globe`
- `golang`
- `google`
- `googlePay`
- `googlePlay`
- `googlePlus`
- `googleWallet`
- `graphQl`
- `gremlin`
- `grid`
- `grommet`
- `group`
- `grow`
- `hadoop`
- `halt`
- `help`
- `helpBook`
- `helpOption`
- `heroku`
- `hide`
- `history`
- `home`
- `homeOption`
- `homeRounded`
- `horton`
- `host`
- `hostMaintenance`
- `hp`
- `hpe`
- `hpeLabs`
- `hpi`
- `html5`
- `iceCream`
- `image`
- `impact`
- `inProgress`
- `inbox`
- `indicator`
- `info`
- `inherit`
- `insecure`
- `inspect`
- `instagram`
- `install`
- `installOption`
- `integration`
- `internetExplorer`
- `italic`
- `iteration`
- `java`
- `js`
- `key`
- `keyboard`
- `kubernetes`
- `language`
- `lastfm`
- `launch`
- `layer`
- `license`
- `like`
- `likeFill`
- `lineChart`
- `link`
- `linkBottom`
- `linkDown`
- `linkNext`
- `linkPrevious`
- `linkTop`
- `linkUp`
- `linkedin`
- `linkedinOption`
- `list`
- `local`
- `location`
- `locationPin`
- `lock`
- `login`
- `logout`
- `lounge`
- `magic`
- `mail`
- `mailOption`
- `mandriva`
- `manual`
- `map`
- `mapLocation`
- `mastercard`
- `medium`
- `memory`
- `menu`
- `meta`
- `microfocus`
- `microphone`
- `money`
- `monitor`
- `monospace`
- `moon`
- `more`
- `moreVertical`
- `mouse`
- `multimedia`
- `multiple`
- `music`
- `mysql`
- `navigate`
- `network`
- `networkDrive`
- `new`
- `newWindow`
- `next`
- `node`
- `nodes`
- `norton`
- `note`
- `notes`
- `notification`
- `npm`
- `objectGroup`
- `objectUngroup`
- `offlineStorage`
- `onedrive`
- `opera`
- `optimize`
- `oracle`
- `orderedList`
- `organization`
- `overview`
- `package`
- `paint`
- `pan`
- `pause`
- `pauseFill`
- `paypal`
- `performance`
- `personalComputer`
- `phone`
- `phoneFlip`
- `phoneHorizontal`
- `phoneVertical`
- `pieChart`
- `piedPiper`
- `pin`
- `pinterest`
- `plan`
- `play`
- `playFill`
- `plug`
- `pocket`
- `power`
- `powerCycle`
- `powerForceShutdown`
- `powerReset`
- `powerShutdown`
- `previous`
- `print`
- `productHunt`
- `projects`
- `qr`
- `radial`
- `radialSelected`
- `raspberry`
- `reactjs`
- `reddit`
- `redhat`
- `redo`
- `refresh`
- `resources`
- `restaurant`
- `restroom`
- `restroomMen`
- `restroomWomen`
- `resume`
- `return`
- `revert`
- `rewind`
- `risk`
- `robot`
- `rotateLeft`
- `rotateRight`
- `rss`
- `run`
- `safariOption`
- `samsungPay`
- `sans`
- `satellite`
- `save`
- `scan`
- `schedule`
- `scheduleNew`
- `schedulePlay`
- `schedules`
- `sco`
- `scorecard`
- `script`
- `sd`
- `search`
- `searchAdvanced`
- `secure`
- `select`
- `selection`
- `semantics`
- `send`
- `server`
- `serverCluster`
- `servers`
- `servicePlay`
- `services`
- `settingsOption`
- `share`
- `shareOption`
- `shareRounded`
- `shield`
- `shieldSecurity`
- `shift`
- `shop`
- `sidebar`
- `sign`
- `skype`
- `slack`
- `snapchat`
- `solaris`
- `sort`
- `soundcloud`
- `spa`
- `spectrum`
- `split`
- `splits`
- `spotify`
- `square`
- `stackOverflow`
- `stakeholder`
- `star`
- `starHalf`
- `starOutline`
- `statusCritical`
- `statusCriticalSmall`
- `statusDisabled`
- `statusDisabledSmall`
- `statusGood`
- `statusGoodSmall`
- `statusInfo`
- `statusInfoSmall`
- `statusPlaceholder`
- `statusPlaceholderSmall`
- `statusUnknown`
- `statusUnknownSmall`
- `statusWarning`
- `statusWarningSmall`
- `steps`
- `stepsOption`
- `stop`
- `stopFill`
- `storage`
- `streetView`
- `strikeThrough`
- `stripe`
- `subscript`
- `subtract`
- `subtractCircle`
- `sun`
- `superscript`
- `support`
- `suse`
- `swift`
- `swim`
- `switch`
- `sync`
- `system`
- `table`
- `tableAdd`
- `tag`
- `tape`
- `tapeOption`
- `target`
- `task`
- `tasks`
- `technology`
- `template`
- `terminal`
- `test`
- `testDesktop`
- `textAlignCenter`
- `textAlignFull`
- `textAlignLeft`
- `textAlignRight`
- `textWrap`
- `threads`
- `threats`
- `threeD`
- `threeDEffects`
- `ticket`
- `tictok`
- `tiktok`
- `time`
- `tip`
- `toast`
- `tools`
- `tooltip`
- `topCorner`
- `train`
- `transaction`
- `trash`
- `tree`
- `treeOption`
- `trigger`
- `trophy`
- `troubleshoot`
- `tty`
- `tumblr`
- `turbolinux`
- `twitch`
- `twitter`
- `ubuntu`
- `underline`
- `undo`
- `unlink`
- `unlock`
- `unorderedList`
- `unsorted`
- `up`
- `update`
- `upgrade`
- `upload`
- `uploadOption`
- `usbKey`
- `user`
- `userAdd`
- `userAdmin`
- `userExpert`
- `userFemale`
- `userManager`
- `userNew`
- `userPolice`
- `userSettings`
- `userWorker`
- `validate`
- `vend`
- `venmo`
- `video`
- `view`
- `vimeo`
- `virtualMachine`
- `virtualStorage`
- `visa`
- `vmMaintenance`
- `vmware`
- `volume`
- `volumeControl`
- `volumeLow`
- `volumeMute`
- `vulnerability`
- `waypoint`
- `webcam`
- `wechat`
- `whatsapp`
- `wheelchair`
- `wheelchairActive`
- `wifi`
- `wifiLow`
- `wifiMedium`
- `wifiNone`
- `windows`
- `windowsLegacy`
- `wordpress`
- `workshop`
- `x`
- `xing`
- `yoga`
- `youtube`
- `zoom`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AccessibilityIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AchievementIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ActionIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ActionsIcon size="20" class="nav-icon" /> Settings</a>
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
<AccessibilityIcon
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
    <AccessibilityIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AchievementIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ActionIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AccessibilityIcon size="24" />
   <AchievementIcon size="24" color="#4a90e2" />
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
   <AccessibilityIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AccessibilityIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AccessibilityIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { accessibility } from '@stacksjs/iconify-grommet-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(accessibility, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { accessibility } from '@stacksjs/iconify-grommet-icons'

// Icons are typed as IconData
const myIcon: IconData = accessibility
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Apache 2.0

See [license details](https://www.apache.org/licenses/LICENSE-2.0) for more information.

## Credits

- **Icons**: Grommet ([Website](https://github.com/grommet/grommet-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/grommet-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/grommet-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
