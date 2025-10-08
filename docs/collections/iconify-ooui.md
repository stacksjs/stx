# OOUI

> OOUI icons for stx from Iconify

## Overview

This package provides access to 370 icons from the OOUI collection through the stx iconify integration.

**Collection ID:** `ooui`
**Total Icons:** 370
**Author:** OOUI Team ([Website](https://github.com/wikimedia/oojs-ui))
**License:** MIT ([Details](https://github.com/wikimedia/oojs-ui/blob/master/LICENSE-MIT))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-ooui
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddIcon, AlertIcon, AlignCenterIcon } from '@stacksjs/iconify-ooui'

// Basic usage
const icon = AddIcon()

// With size
const sizedIcon = AddIcon({ size: 24 })

// With color
const coloredIcon = AlertIcon({ color: 'red' })

// With multiple props
const customIcon = AlignCenterIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddIcon, AlertIcon, AlignCenterIcon } from '@stacksjs/iconify-ooui'

  global.icons = {
    home: AddIcon({ size: 24 }),
    user: AlertIcon({ size: 24, color: '#4a90e2' }),
    settings: AlignCenterIcon({ size: 32 })
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
import { add, alert, alignCenter } from '@stacksjs/iconify-ooui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(add, { size: 24 })
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
const redIcon = AddIcon({ color: 'red' })
const blueIcon = AddIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddIcon({ class: 'text-primary' })
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
const icon24 = AddIcon({ size: 24 })
const icon1em = AddIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddIcon({ height: '1em' })
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
const smallIcon = AddIcon({ class: 'icon-small' })
const largeIcon = AddIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **370** icons:

- `add`
- `alert`
- `alignCenter`
- `alignLeft`
- `alignRight`
- `appearance`
- `arrowDown`
- `arrowNextLtr`
- `arrowNextRtl`
- `arrowPreviousLtr`
- `arrowPreviousRtl`
- `arrowUp`
- `articleAdd`
- `articleCheck`
- `articleDisambiguationLtr`
- `articleDisambiguationRtl`
- `articleLtr`
- `articleNotFoundLtr`
- `articleNotFoundRtl`
- `articleRedirectLtr`
- `articleRedirectRtl`
- `articleRtl`
- `articleSearch`
- `articlesLtr`
- `articlesRtl`
- `articlesSearchLtr`
- `articlesSearchRtl`
- `attachment`
- `bell`
- `bellOutline`
- `bigger`
- `block`
- `boldA`
- `boldArabAin`
- `boldArabDad`
- `boldArabJeem`
- `boldArmnTo`
- `boldB`
- `boldCyrlBe`
- `boldCyrlPalochka`
- `boldCyrlTe`
- `boldCyrlZhe`
- `boldF`
- `boldG`
- `boldGeorMan`
- `boldL`
- `boldN`
- `boldQ`
- `boldV`
- `bookLtr`
- `bookRtl`
- `bookmark`
- `bookmarkListLtr`
- `bookmarkListRtl`
- `bookmarkOutline`
- `bright`
- `browserLtr`
- `browserRtl`
- `calendar`
- `camera`
- `cancel`
- `chart`
- `check`
- `checkAll`
- `clear`
- `clock`
- `close`
- `code`
- `collapse`
- `copyLtr`
- `copyRtl`
- `cutLtr`
- `cutRtl`
- `database`
- `die`
- `doubleChevronEndLtr`
- `doubleChevronEndRtl`
- `doubleChevronStartLtr`
- `doubleChevronStartRtl`
- `downTriangle`
- `download`
- `draggable`
- `edit`
- `editLock`
- `editUndoLtr`
- `editUndoRtl`
- `ellipsis`
- `error`
- `exitFullscreen`
- `expand`
- `eye`
- `eyeClosed`
- `feedbackLtr`
- `feedbackRtl`
- `flagLtr`
- `flagRtl`
- `folderPlaceholderLtr`
- `folderPlaceholderRtl`
- `fullScreen`
- `function`
- `functionArgumentLtr`
- `functionArgumentRtl`
- `funnelLtr`
- `funnelRtl`
- `globe`
- `halfBrightLtr`
- `halfBrightRtl`
- `halfStarLtr`
- `halfStarRtl`
- `hand`
- `heart`
- `helpLtr`
- `helpNoticeLtr`
- `helpNoticeRtl`
- `helpRtl`
- `hieroglyph`
- `highlight`
- `history`
- `home`
- `image`
- `imageAddLtr`
- `imageAddRtl`
- `imageBroken`
- `imageGallery`
- `imageLayoutBasic`
- `imageLayoutFrame`
- `imageLayoutFrameless`
- `imageLayoutThumbnail`
- `imageLockLtr`
- `imageLockRtl`
- `indentLtr`
- `indentRtl`
- `info`
- `infoFilled`
- `instanceLtr`
- `instanceRtl`
- `italicA`
- `italicArabKehehJeem`
- `italicArabMeem`
- `italicArabTeh`
- `italicArmnSha`
- `italicC`
- `italicD`
- `italicE`
- `italicGeorKan`
- `italicI`
- `italicK`
- `italicS`
- `journalLtr`
- `journalRtl`
- `key`
- `keyboard`
- `labFlask`
- `language`
- `largerText`
- `layoutLtr`
- `layoutRtl`
- `lightbulb`
- `link`
- `linkExternalLtr`
- `linkExternalRtl`
- `linkSecure`
- `listBulletLtr`
- `listBulletRtl`
- `listNumberedLtr`
- `listNumberedRtl`
- `literalLtr`
- `literalRtl`
- `lock`
- `logInLtr`
- `logInRtl`
- `logOutLtr`
- `logOutRtl`
- `logoCc`
- `logoCodex`
- `logoMediaWiki`
- `logoMetaWiki`
- `logoWikibooks`
- `logoWikidata`
- `logoWikifunctions`
- `logoWikimedia`
- `logoWikimediaCommons`
- `logoWikimediaDiscovery`
- `logoWikinews`
- `logoWikipedia`
- `logoWikiquote`
- `logoWikisource`
- `logoWikispecies`
- `logoWikiversity`
- `logoWikivoyage`
- `logoWiktionary`
- `mapLtr`
- `mapPin`
- `mapPinAdd`
- `mapRtl`
- `mapTrail`
- `markup`
- `mathematics`
- `mathematicsDisplayBlock`
- `mathematicsDisplayDefault`
- `mathematicsDisplayInline`
- `menu`
- `mergeLtr`
- `mergeRtl`
- `message`
- `moon`
- `move`
- `moveFirstLtr`
- `moveFirstRtl`
- `moveLastLtr`
- `moveLastRtl`
- `musicalScore`
- `network`
- `networkOff`
- `newWindowLtr`
- `newWindowRtl`
- `newlineLtr`
- `newlineRtl`
- `newspaperLtr`
- `newspaperRtl`
- `nextLtr`
- `nextRtl`
- `noWikiText`
- `notBright`
- `notice`
- `ocr`
- `ongoingConversationLtr`
- `ongoingConversationRtl`
- `outdentLtr`
- `outdentRtl`
- `outlineLtr`
- `outlineRtl`
- `pageSettings`
- `paletteLtr`
- `paletteRtl`
- `pasteLtr`
- `pasteRtl`
- `pause`
- `play`
- `power`
- `previousLtr`
- `previousRtl`
- `printer`
- `pushPin`
- `puzzleLtr`
- `puzzleRtl`
- `qrCode`
- `quotesLtr`
- `quotesRtl`
- `recentChangesLtr`
- `recentChangesRtl`
- `redoLtr`
- `redoRtl`
- `reference`
- `referenceExistingLtr`
- `referenceExistingRtl`
- `referencesLtr`
- `referencesRtl`
- `reload`
- `restore`
- `robot`
- `sandbox`
- `search`
- `searchCaseSensitive`
- `searchDiacritics`
- `searchRegularExpression`
- `settings`
- `share`
- `signatureLtr`
- `signatureRtl`
- `smaller`
- `smallerText`
- `sortVertical`
- `specialCharacter`
- `specialPagesLtr`
- `specialPagesRtl`
- `speechBubbleAddLtr`
- `speechBubbleAddRtl`
- `speechBubbleLtr`
- `speechBubbleRtl`
- `speechBubblesLtr`
- `speechBubblesRtl`
- `star`
- `stop`
- `strikethroughA`
- `strikethroughS`
- `strikethroughY`
- `subscriptLtr`
- `subscriptRtl`
- `subtract`
- `success`
- `superscriptLtr`
- `superscriptRtl`
- `table`
- `tableAddColumnAfterLtr`
- `tableAddColumnAfterRtl`
- `tableAddColumnBeforeLtr`
- `tableAddColumnBeforeRtl`
- `tableAddRowAfter`
- `tableAddRowBefore`
- `tableCaption`
- `tableMergeCells`
- `tableMoveColumnAfterLtr`
- `tableMoveColumnAfterRtl`
- `tableMoveColumnBeforeLtr`
- `tableMoveColumnBeforeRtl`
- `tableMoveRowAfter`
- `tableMoveRowBefore`
- `tagLtr`
- `tagRtl`
- `templateAddLtr`
- `templateAddRtl`
- `textDirLtr`
- `textDirRtl`
- `textFlowLtr`
- `textFlowRtl`
- `textStyle`
- `textSummaryLtr`
- `textSummaryRtl`
- `trash`
- `tray`
- `unBlock`
- `unFlagLtr`
- `unFlagRtl`
- `unLink`
- `unLock`
- `unStar`
- `underlineA`
- `underlineU`
- `undoLtr`
- `undoRtl`
- `upTriangle`
- `updateLtr`
- `updateRtl`
- `upload`
- `userActive`
- `userAddLtr`
- `userAddRtl`
- `userAnonymous`
- `userAvatar`
- `userAvatarOutline`
- `userContributionsLtr`
- `userContributionsRtl`
- `userGroupLtr`
- `userGroupRtl`
- `userRightsLtr`
- `userRightsRtl`
- `userTalkLtr`
- `userTalkRtl`
- `userTemporaryLocationLtr`
- `userTemporaryLocationRtl`
- `userTemporaryLtr`
- `userTemporaryRtl`
- `verticalEllipsis`
- `viewCompact`
- `viewDetailsLtr`
- `viewDetailsRtl`
- `visionSimulator`
- `volumeDownLtr`
- `volumeDownRtl`
- `volumeOffLtr`
- `volumeOffRtl`
- `volumeUpLtr`
- `volumeUpRtl`
- `watchlistLtr`
- `watchlistRtl`
- `wikiText`
- `window`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddIcon, AlertIcon, AlignCenterIcon, AlignLeftIcon } from '@stacksjs/iconify-ooui'

  global.navIcons = {
    home: AddIcon({ size: 20, class: 'nav-icon' }),
    about: AlertIcon({ size: 20, class: 'nav-icon' }),
    contact: AlignCenterIcon({ size: 20, class: 'nav-icon' }),
    settings: AlignLeftIcon({ size: 20, class: 'nav-icon' })
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
import { AddIcon } from '@stacksjs/iconify-ooui'

const icon = AddIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddIcon, AlertIcon, AlignCenterIcon } from '@stacksjs/iconify-ooui'

const successIcon = AddIcon({ size: 16, color: '#22c55e' })
const warningIcon = AlertIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlignCenterIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddIcon, AlertIcon } from '@stacksjs/iconify-ooui'
   const icon = AddIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { add, alert } from '@stacksjs/iconify-ooui'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(add, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddIcon, AlertIcon } from '@stacksjs/iconify-ooui'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-ooui'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddIcon } from '@stacksjs/iconify-ooui'
     global.icon = AddIcon({ size: 24 })
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
   const icon = AddIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { add } from '@stacksjs/iconify-ooui'

// Icons are typed as IconData
const myIcon: IconData = add
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/wikimedia/oojs-ui/blob/master/LICENSE-MIT) for more information.

## Credits

- **Icons**: OOUI Team ([Website](https://github.com/wikimedia/oojs-ui))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/ooui/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/ooui/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
