# Dashicons

> Dashicons icons for stx from Iconify

## Overview

This package provides access to 345 icons from the Dashicons collection through the stx iconify integration.

**Collection ID:** `dashicons`
**Total Icons:** 345
**Author:** WordPress ([Website](https://github.com/WordPress/dashicons))
**License:** GPL ([Details](https://github.com/WordPress/dashicons/blob/master/gpl.txt))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-dashicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AdminAppearanceIcon, AdminCollapseIcon, AdminCommentsIcon } from '@stacksjs/iconify-dashicons'

// Basic usage
const icon = AdminAppearanceIcon()

// With size
const sizedIcon = AdminAppearanceIcon({ size: 24 })

// With color
const coloredIcon = AdminCollapseIcon({ color: 'red' })

// With multiple props
const customIcon = AdminCommentsIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AdminAppearanceIcon, AdminCollapseIcon, AdminCommentsIcon } from '@stacksjs/iconify-dashicons'

  global.icons = {
    home: AdminAppearanceIcon({ size: 24 }),
    user: AdminCollapseIcon({ size: 24, color: '#4a90e2' }),
    settings: AdminCommentsIcon({ size: 32 })
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
import { adminAppearance, adminCollapse, adminComments } from '@stacksjs/iconify-dashicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(adminAppearance, { size: 24 })
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
const redIcon = AdminAppearanceIcon({ color: 'red' })
const blueIcon = AdminAppearanceIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AdminAppearanceIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AdminAppearanceIcon({ class: 'text-primary' })
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
const icon24 = AdminAppearanceIcon({ size: 24 })
const icon1em = AdminAppearanceIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AdminAppearanceIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AdminAppearanceIcon({ height: '1em' })
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
const smallIcon = AdminAppearanceIcon({ class: 'icon-small' })
const largeIcon = AdminAppearanceIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **345** icons:

- `adminAppearance`
- `adminCollapse`
- `adminComments`
- `adminCustomizer`
- `adminGeneric`
- `adminHome`
- `adminLinks`
- `adminMedia`
- `adminMultisite`
- `adminNetwork`
- `adminPage`
- `adminPlugins`
- `adminPost`
- `adminSettings`
- `adminSite`
- `adminSiteAlt`
- `adminSiteAlt2`
- `adminSiteAlt3`
- `adminTools`
- `adminUsers`
- `airplane`
- `album`
- `alignCenter`
- `alignFullWidth`
- `alignLeft`
- `alignNone`
- `alignPullLeft`
- `alignPullRight`
- `alignRight`
- `alignWide`
- `amazon`
- `analytics`
- `archive`
- `arrowDown`
- `arrowDownAlt`
- `arrowDownAlt2`
- `arrowLeft`
- `arrowLeftAlt`
- `arrowLeftAlt2`
- `arrowRight`
- `arrowRightAlt`
- `arrowRightAlt2`
- `arrowUp`
- `arrowUpAlt`
- `arrowUpAlt2`
- `arrowUpDuplicate`
- `art`
- `awards`
- `backup`
- `bank`
- `beer`
- `bell`
- `blockDefault`
- `book`
- `bookAlt`
- `buddiconsActivity`
- `buddiconsBbpressLogo`
- `buddiconsBuddypressLogo`
- `buddiconsCommunity`
- `buddiconsForums`
- `buddiconsFriends`
- `buddiconsGroups`
- `buddiconsPm`
- `buddiconsReplies`
- `buddiconsTopics`
- `buddiconsTracking`
- `building`
- `businessman`
- `businessperson`
- `businesswoman`
- `button`
- `calculator`
- `calendar`
- `calendarAlt`
- `camera`
- `cameraAlt`
- `car`
- `carrot`
- `cart`
- `category`
- `chartArea`
- `chartBar`
- `chartLine`
- `chartPie`
- `clipboard`
- `clock`
- `cloud`
- `cloudSaved`
- `cloudUpload`
- `codeStandards`
- `coffee`
- `colorPicker`
- `columns`
- `controlsBack`
- `controlsForward`
- `controlsPause`
- `controlsPlay`
- `controlsRepeat`
- `controlsSkipback`
- `controlsSkipforward`
- `controlsVolumeoff`
- `controlsVolumeon`
- `coverImage`
- `dashboard`
- `database`
- `databaseAdd`
- `databaseExport`
- `databaseImport`
- `databaseRemove`
- `databaseView`
- `desktop`
- `dismiss`
- `download`
- `drumstick`
- `edit`
- `editLarge`
- `editPage`
- `editorAligncenter`
- `editorAlignleft`
- `editorAlignright`
- `editorBold`
- `editorBreak`
- `editorCode`
- `editorCodeDuplicate`
- `editorContract`
- `editorCustomchar`
- `editorExpand`
- `editorHelp`
- `editorIndent`
- `editorInsertmore`
- `editorItalic`
- `editorJustify`
- `editorKitchensink`
- `editorLtr`
- `editorOl`
- `editorOlRtl`
- `editorOutdent`
- `editorParagraph`
- `editorPasteText`
- `editorPasteWord`
- `editorQuote`
- `editorRemoveformatting`
- `editorRtl`
- `editorSpellcheck`
- `editorStrikethrough`
- `editorTable`
- `editorTextcolor`
- `editorUl`
- `editorUnderline`
- `editorUnlink`
- `editorVideo`
- `ellipsis`
- `email`
- `emailAlt`
- `emailAlt2`
- `embedAudio`
- `embedGeneric`
- `embedPhoto`
- `embedPost`
- `embedVideo`
- `excerptView`
- `exit`
- `external`
- `facebook`
- `facebookAlt`
- `feedback`
- `filter`
- `flag`
- `food`
- `formatAside`
- `formatAudio`
- `formatChat`
- `formatGallery`
- `formatImage`
- `formatQuote`
- `formatStatus`
- `formatVideo`
- `forms`
- `fullscreenAlt`
- `fullscreenExitAlt`
- `games`
- `google`
- `googleplus`
- `gridView`
- `groups`
- `hammer`
- `heading`
- `heart`
- `hidden`
- `hourglass`
- `html`
- `id`
- `idAlt`
- `imageCrop`
- `imageFilter`
- `imageFlipHorizontal`
- `imageFlipVertical`
- `imageRotate`
- `imageRotateLeft`
- `imageRotateRight`
- `imagesAlt`
- `imagesAlt2`
- `indexCard`
- `info`
- `infoOutline`
- `insert`
- `insertAfter`
- `insertBefore`
- `instagram`
- `laptop`
- `layout`
- `leftright`
- `lightbulb`
- `linkedin`
- `listView`
- `location`
- `locationAlt`
- `lock`
- `lockAlt`
- `lockDuplicate`
- `marker`
- `mediaArchive`
- `mediaAudio`
- `mediaCode`
- `mediaDefault`
- `mediaDocument`
- `mediaInteractive`
- `mediaSpreadsheet`
- `mediaText`
- `mediaVideo`
- `megaphone`
- `menu`
- `menuAlt`
- `menuAlt2`
- `menuAlt3`
- `menu2`
- `microphone`
- `migrate`
- `minus`
- `money`
- `moneyAlt`
- `move`
- `nametag`
- `networking`
- `no`
- `noAlt`
- `openFolder`
- `palmtree`
- `paperclip`
- `pdf`
- `performance`
- `pets`
- `phone`
- `pinterest`
- `playlistAudio`
- `playlistVideo`
- `pluginsChecked`
- `plus`
- `plusAlt`
- `plusAlt2`
- `podio`
- `portfolio`
- `postStatus`
- `pressthis`
- `printer`
- `privacy`
- `products`
- `randomize`
- `reddit`
- `redo`
- `remove`
- `restApi`
- `rss`
- `saved`
- `schedule`
- `screenoptions`
- `search`
- `share`
- `shareAlt`
- `shareAlt2`
- `shield`
- `shieldAlt`
- `shortcode`
- `slides`
- `smartphone`
- `smiley`
- `sort`
- `sos`
- `spotify`
- `starEmpty`
- `starFilled`
- `starHalf`
- `sticky`
- `store`
- `superhero`
- `superheroAlt`
- `tableColAfter`
- `tableColBefore`
- `tableColDelete`
- `tableRowAfter`
- `tableRowBefore`
- `tableRowDelete`
- `tablet`
- `tag`
- `tagcloud`
- `testimonial`
- `text`
- `textPage`
- `thumbsDown`
- `thumbsUp`
- `tickets`
- `ticketsAlt`
- `tide`
- `translation`
- `trash`
- `twitch`
- `twitter`
- `twitterAlt`
- `undo`
- `universalAccess`
- `universalAccessAlt`
- `unlock`
- `update`
- `updateAlt`
- `update2`
- `upload`
- `vault`
- `videoAlt`
- `videoAlt2`
- `videoAlt3`
- `visibility`
- `warning`
- `welcomeAddPage`
- `welcomeComments`
- `welcomeLearnMore`
- `welcomeViewSite`
- `welcomeWidgetsMenus`
- `welcomeWriteBlog`
- `whatsapp`
- `wordpress`
- `wordpressAlt`
- `xing`
- `yes`
- `yesAlt`
- `youtube`

## Usage Examples

### Navigation Menu

```html
@js
  import { AdminAppearanceIcon, AdminCollapseIcon, AdminCommentsIcon, AdminCustomizerIcon } from '@stacksjs/iconify-dashicons'

  global.navIcons = {
    home: AdminAppearanceIcon({ size: 20, class: 'nav-icon' }),
    about: AdminCollapseIcon({ size: 20, class: 'nav-icon' }),
    contact: AdminCommentsIcon({ size: 20, class: 'nav-icon' }),
    settings: AdminCustomizerIcon({ size: 20, class: 'nav-icon' })
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
import { AdminAppearanceIcon } from '@stacksjs/iconify-dashicons'

const icon = AdminAppearanceIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AdminAppearanceIcon, AdminCollapseIcon, AdminCommentsIcon } from '@stacksjs/iconify-dashicons'

const successIcon = AdminAppearanceIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdminCollapseIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdminCommentsIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AdminAppearanceIcon, AdminCollapseIcon } from '@stacksjs/iconify-dashicons'
   const icon = AdminAppearanceIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { adminAppearance, adminCollapse } from '@stacksjs/iconify-dashicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(adminAppearance, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AdminAppearanceIcon, AdminCollapseIcon } from '@stacksjs/iconify-dashicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-dashicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AdminAppearanceIcon } from '@stacksjs/iconify-dashicons'
     global.icon = AdminAppearanceIcon({ size: 24 })
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
   const icon = AdminAppearanceIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { adminAppearance } from '@stacksjs/iconify-dashicons'

// Icons are typed as IconData
const myIcon: IconData = adminAppearance
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

GPL

See [license details](https://github.com/WordPress/dashicons/blob/master/gpl.txt) for more information.

## Credits

- **Icons**: WordPress ([Website](https://github.com/WordPress/dashicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/dashicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/dashicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
