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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccessibilityIcon, AchievementIcon, ActionIcon } from '@stacksjs/iconify-grommet-icons'

// Basic usage
const icon = AccessibilityIcon()

// With size
const sizedIcon = AccessibilityIcon({ size: 24 })

// With color
const coloredIcon = AchievementIcon({ color: 'red' })

// With multiple props
const customIcon = ActionIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccessibilityIcon, AchievementIcon, ActionIcon } from '@stacksjs/iconify-grommet-icons'

  global.icons = {
    home: AccessibilityIcon({ size: 24 }),
    user: AchievementIcon({ size: 24, color: '#4a90e2' }),
    settings: ActionIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AccessibilityIcon({ color: 'red' })
const blueIcon = AccessibilityIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccessibilityIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccessibilityIcon({ class: 'text-primary' })
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
const icon24 = AccessibilityIcon({ size: 24 })
const icon1em = AccessibilityIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccessibilityIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccessibilityIcon({ height: '1em' })
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
const smallIcon = AccessibilityIcon({ class: 'icon-small' })
const largeIcon = AccessibilityIcon({ class: 'icon-large' })
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
@js
  import { AccessibilityIcon, AchievementIcon, ActionIcon, ActionsIcon } from '@stacksjs/iconify-grommet-icons'

  global.navIcons = {
    home: AccessibilityIcon({ size: 20, class: 'nav-icon' }),
    about: AchievementIcon({ size: 20, class: 'nav-icon' }),
    contact: ActionIcon({ size: 20, class: 'nav-icon' }),
    settings: ActionsIcon({ size: 20, class: 'nav-icon' })
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
import { AccessibilityIcon } from '@stacksjs/iconify-grommet-icons'

const icon = AccessibilityIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccessibilityIcon, AchievementIcon, ActionIcon } from '@stacksjs/iconify-grommet-icons'

const successIcon = AccessibilityIcon({ size: 16, color: '#22c55e' })
const warningIcon = AchievementIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActionIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccessibilityIcon, AchievementIcon } from '@stacksjs/iconify-grommet-icons'
   const icon = AccessibilityIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { accessibility, achievement } from '@stacksjs/iconify-grommet-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(accessibility, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccessibilityIcon, AchievementIcon } from '@stacksjs/iconify-grommet-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-grommet-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccessibilityIcon } from '@stacksjs/iconify-grommet-icons'
     global.icon = AccessibilityIcon({ size: 24 })
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
   const icon = AccessibilityIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
