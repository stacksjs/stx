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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AdminAppearanceIcon height="1em" />
<AdminAppearanceIcon width="1em" height="1em" />
<AdminAppearanceIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AdminAppearanceIcon size="24" />
<AdminAppearanceIcon size="1em" />

<!-- Using width and height -->
<AdminAppearanceIcon width="24" height="32" />

<!-- With color -->
<AdminAppearanceIcon size="24" color="red" />
<AdminAppearanceIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AdminAppearanceIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AdminAppearanceIcon
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
    <AdminAppearanceIcon size="24" />
    <AdminCollapseIcon size="24" color="#4a90e2" />
    <AdminCommentsIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AdminAppearanceIcon size="24" color="red" />
<AdminAppearanceIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AdminAppearanceIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AdminAppearanceIcon size="24" class="text-primary" />
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
<AdminAppearanceIcon height="1em" />
<AdminAppearanceIcon width="1em" height="1em" />
<AdminAppearanceIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AdminAppearanceIcon size="24" />
<AdminAppearanceIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.dashicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AdminAppearanceIcon class="dashicons-icon" />
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
<nav>
  <a href="/"><AdminAppearanceIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdminCollapseIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdminCommentsIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AdminCustomizerIcon size="20" class="nav-icon" /> Settings</a>
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
<AdminAppearanceIcon
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
    <AdminAppearanceIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdminCollapseIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdminCommentsIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AdminAppearanceIcon size="24" />
   <AdminCollapseIcon size="24" color="#4a90e2" />
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
   <AdminAppearanceIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AdminAppearanceIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AdminAppearanceIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { adminAppearance } from '@stacksjs/iconify-dashicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(adminAppearance, { size: 24 })
   @endjs

   {!! customIcon !!}
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
