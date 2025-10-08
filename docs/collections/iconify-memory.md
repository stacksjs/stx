# Memory Icons

> Memory Icons icons for stx from Iconify

## Overview

This package provides access to 651 icons from the Memory Icons collection through the stx iconify integration.

**Collection ID:** `memory`
**Total Icons:** 651
**Author:** Pictogrammers ([Website](https://github.com/Pictogrammers/Memory))
**License:** Apache 2.0 ([Details](https://github.com/Pictogrammers/Memory/blob/main/LICENSE))
**Category:** UI Other / Mixed Grid
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-memory
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AccountIcon, AccountBoxIcon, AlertIcon } from '@stacksjs/iconify-memory'

// Basic usage
const icon = AccountIcon()

// With size
const sizedIcon = AccountIcon({ size: 24 })

// With color
const coloredIcon = AccountBoxIcon({ color: 'red' })

// With multiple props
const customIcon = AlertIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AccountIcon, AccountBoxIcon, AlertIcon } from '@stacksjs/iconify-memory'

  global.icons = {
    home: AccountIcon({ size: 24 }),
    user: AccountBoxIcon({ size: 24, color: '#4a90e2' }),
    settings: AlertIcon({ size: 32 })
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
import { account, accountBox, alert } from '@stacksjs/iconify-memory'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(account, { size: 24 })
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
const redIcon = AccountIcon({ color: 'red' })
const blueIcon = AccountIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AccountIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AccountIcon({ class: 'text-primary' })
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
const icon24 = AccountIcon({ size: 24 })
const icon1em = AccountIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AccountIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AccountIcon({ height: '1em' })
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
const smallIcon = AccountIcon({ class: 'icon-small' })
const largeIcon = AccountIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **651** icons:

- `account`
- `accountBox`
- `alert`
- `alertBox`
- `alertBoxFill`
- `alertCircle`
- `alertCircleFill`
- `alertHexagon`
- `alertHexagonFill`
- `alertOctagon`
- `alertRhombus`
- `alertRhombusFill`
- `alignHorizontalCenter`
- `alignHorizontalDistribute`
- `alignHorizontalLeft`
- `alignHorizontalRight`
- `alignVerticalBottom`
- `alignVerticalCenter`
- `alignVerticalDistribute`
- `alignVerticalTop`
- `alphaA`
- `alphaAFill`
- `alphaB`
- `alphaBFill`
- `alphaC`
- `alphaCFill`
- `alphaD`
- `alphaDFill`
- `alphaE`
- `alphaEFill`
- `alphaF`
- `alphaFFill`
- `alphaG`
- `alphaGFill`
- `alphaH`
- `alphaHFill`
- `alphaI`
- `alphaIFill`
- `alphaJ`
- `alphaJFill`
- `alphaK`
- `alphaKFill`
- `alphaL`
- `alphaLFill`
- `alphaM`
- `alphaMFill`
- `alphaN`
- `alphaNFill`
- `alphaO`
- `alphaOFill`
- `alphaP`
- `alphaPFill`
- `alphaQ`
- `alphaQFill`
- `alphaR`
- `alphaRFill`
- `alphaS`
- `alphaSFill`
- `alphaT`
- `alphaTFill`
- `alphaU`
- `alphaUFill`
- `alphaV`
- `alphaVFill`
- `alphaW`
- `alphaWFill`
- `alphaX`
- `alphaXFill`
- `alphaY`
- `alphaYFill`
- `alphaZ`
- `alphaZFill`
- `anvil`
- `application`
- `applicationCode`
- `apps`
- `appsBox`
- `appsBoxFill`
- `archive`
- `arrow`
- `arrowBottomLeft`
- `arrowBottomLeftCircle`
- `arrowBottomRight`
- `arrowBottomRightCircle`
- `arrowDown`
- `arrowDownBold`
- `arrowDownBox`
- `arrowDownCircle`
- `arrowDownLeft`
- `arrowDownLeftBox`
- `arrowDownRight`
- `arrowDownRightBox`
- `arrowLeft`
- `arrowLeftBold`
- `arrowLeftBox`
- `arrowLeftCircle`
- `arrowLeftDown`
- `arrowLeftRight`
- `arrowLeftUp`
- `arrowRight`
- `arrowRightBold`
- `arrowRightBox`
- `arrowRightCircle`
- `arrowRightDown`
- `arrowRightUp`
- `arrowTopLeft`
- `arrowTopLeftCircle`
- `arrowTopRight`
- `arrowTopRightCircle`
- `arrowUp`
- `arrowUpBold`
- `arrowUpBox`
- `arrowUpCircle`
- `arrowUpDown`
- `arrowUpLeft`
- `arrowUpLeftBox`
- `arrowUpRight`
- `arrowUpRightBox`
- `aspectRatio`
- `axe`
- `bagPersonal`
- `bagPersonalFill`
- `bank`
- `barcode`
- `battery0`
- `battery100`
- `battery25`
- `battery50`
- `battery75`
- `battleAxe`
- `beer`
- `bell`
- `blood`
- `book`
- `bookmark`
- `borderBottom`
- `borderBottomLeft`
- `borderBottomLeftRight`
- `borderBottomRight`
- `borderInside`
- `borderLeft`
- `borderLeftRight`
- `borderNone`
- `borderOutside`
- `borderRight`
- `borderTop`
- `borderTopBottom`
- `borderTopLeft`
- `borderTopLeftBottom`
- `borderTopLeftRight`
- `borderTopRight`
- `borderTopRightBottom`
- `bow`
- `bowArrow`
- `box`
- `boxLightDashedDownLeft`
- `boxLightDashedDownRight`
- `boxLightDashedHorizontal`
- `boxLightDashedUpLeft`
- `boxLightDashedUpRight`
- `boxLightDashedVertical`
- `boxLightDashedVerticalHorizontal`
- `boxLightDoubleDownLeft`
- `boxLightDoubleDownRight`
- `boxLightDoubleHorizontal`
- `boxLightDoubleHorizontalDown`
- `boxLightDoubleHorizontalLightDown`
- `boxLightDoubleHorizontalLightUp`
- `boxLightDoubleHorizontalUp`
- `boxLightDoubleRoundDownLeft`
- `boxLightDoubleRoundDownRight`
- `boxLightDoubleRoundUpLeft`
- `boxLightDoubleRoundUpRight`
- `boxLightDoubleUpLeft`
- `boxLightDoubleUpRight`
- `boxLightDoubleVertical`
- `boxLightDoubleVerticalHorizontal`
- `boxLightDoubleVerticalLeft`
- `boxLightDoubleVerticalLightLeft`
- `boxLightDoubleVerticalLightRight`
- `boxLightDoubleVerticalRight`
- `boxLightDownLeft`
- `boxLightDownLeftCircle`
- `boxLightDownLeftStipple`
- `boxLightDownLeftStippleInner`
- `boxLightDownLeftStippleOuter`
- `boxLightDownRight`
- `boxLightDownRightCircle`
- `boxLightDownRightStipple`
- `boxLightDownRightStippleInner`
- `boxLightDownRightStippleOuter`
- `boxLightFoldDownLeft`
- `boxLightFoldDownRight`
- `boxLightFoldUpLeft`
- `boxLightFoldUpRight`
- `boxLightHorizontal`
- `boxLightHorizontalCircle`
- `boxLightHorizontalDown`
- `boxLightHorizontalDownStipple`
- `boxLightHorizontalDownStippleDown`
- `boxLightHorizontalDownStippleDownLeft`
- `boxLightHorizontalDownStippleDownRight`
- `boxLightHorizontalMenuDown`
- `boxLightHorizontalMenuLeft`
- `boxLightHorizontalMenuRight`
- `boxLightHorizontalMenuUp`
- `boxLightHorizontalStipple`
- `boxLightHorizontalStippleDown`
- `boxLightHorizontalStippleUp`
- `boxLightHorizontalUp`
- `boxLightHorizontalUpStipple`
- `boxLightHorizontalUpStippleDown`
- `boxLightHorizontalUpStippleUp`
- `boxLightHorizontalUpStippleUpLeft`
- `boxLightHorizontalUpStippleUpRight`
- `boxLightRoundDownLeft`
- `boxLightRoundDownLeftStipple`
- `boxLightRoundDownLeftStippleInner`
- `boxLightRoundDownLeftStippleOuter`
- `boxLightRoundDownRight`
- `boxLightRoundDownRightStipple`
- `boxLightRoundDownRightStippleInner`
- `boxLightRoundDownRightStippleOuter`
- `boxLightRoundUpLeft`
- `boxLightRoundUpLeftStipple`
- `boxLightRoundUpLeftStippleInner`
- `boxLightRoundUpLeftStippleOuter`
- `boxLightRoundUpRight`
- `boxLightRoundUpRightStipple`
- `boxLightRoundUpRightStippleInner`
- `boxLightRoundUpRightStippleOuter`
- `boxLightUpLeft`
- `boxLightUpLeftCircle`
- `boxLightUpLeftStipple`
- `boxLightUpLeftStippleInner`
- `boxLightUpLeftStippleOuter`
- `boxLightUpRight`
- `boxLightUpRightCircle`
- `boxLightUpRightStipple`
- `boxLightUpRightStippleInner`
- `boxLightUpRightStippleOuter`
- `boxLightVertical`
- `boxLightVerticalCircle`
- `boxLightVerticalHorizontal`
- `boxLightVerticalHorizontalStipple`
- `boxLightVerticalHorizontalStippleDown`
- `boxLightVerticalHorizontalStippleDownLeft`
- `boxLightVerticalHorizontalStippleDownRight`
- `boxLightVerticalHorizontalStippleLeft`
- `boxLightVerticalHorizontalStippleLeftDownRight`
- `boxLightVerticalHorizontalStippleLeftUpRight`
- `boxLightVerticalHorizontalStippleRight`
- `boxLightVerticalHorizontalStippleRightDownLeft`
- `boxLightVerticalHorizontalStippleRightUpLeft`
- `boxLightVerticalHorizontalStippleUp`
- `boxLightVerticalHorizontalStippleUpLeft`
- `boxLightVerticalHorizontalStippleUpRight`
- `boxLightVerticalLeft`
- `boxLightVerticalLeftStipple`
- `boxLightVerticalLeftStippleDownLeft`
- `boxLightVerticalLeftStippleLeft`
- `boxLightVerticalLeftStippleUpLeft`
- `boxLightVerticalMenuDown`
- `boxLightVerticalMenuLeft`
- `boxLightVerticalMenuRight`
- `boxLightVerticalMenuUp`
- `boxLightVerticalRight`
- `boxLightVerticalRightStipple`
- `boxLightVerticalRightStippleDownRight`
- `boxLightVerticalRightStippleLeft`
- `boxLightVerticalRightStippleRight`
- `boxLightVerticalRightStippleUpRight`
- `boxLightVerticalStipple`
- `boxLightVerticalStippleLeft`
- `boxLightVerticalStippleRight`
- `boxOuterLightAll`
- `boxOuterLightDashedAll`
- `boxOuterLightDashedDown`
- `boxOuterLightDashedDownLeft`
- `boxOuterLightDashedDownLeftRight`
- `boxOuterLightDashedDownRight`
- `boxOuterLightDashedFoldDownLeft`
- `boxOuterLightDashedFoldDownRight`
- `boxOuterLightDashedFoldUpLeft`
- `boxOuterLightDashedFoldUpRight`
- `boxOuterLightDashedLeft`
- `boxOuterLightDashedLeftRight`
- `boxOuterLightDashedRight`
- `boxOuterLightDashedUp`
- `boxOuterLightDashedUpDown`
- `boxOuterLightDashedUpDownLeft`
- `boxOuterLightDashedUpDownRight`
- `boxOuterLightDashedUpLeft`
- `boxOuterLightDashedUpLeftRight`
- `boxOuterLightDashedUpRight`
- `boxOuterLightDown`
- `boxOuterLightDownLeft`
- `boxOuterLightDownLeftRight`
- `boxOuterLightDownLeftStipple`
- `boxOuterLightDownRight`
- `boxOuterLightDownRightStipple`
- `boxOuterLightDownStipple`
- `boxOuterLightDownVerticalStipple`
- `boxOuterLightDownVerticalStippleLeft`
- `boxOuterLightDownVerticalStippleRight`
- `boxOuterLightLeft`
- `boxOuterLightLeftHorizontalStipple`
- `boxOuterLightLeftHorizontalStippleDown`
- `boxOuterLightLeftHorizontalStippleUp`
- `boxOuterLightLeftRight`
- `boxOuterLightLeftRightStipple`
- `boxOuterLightLeftStipple`
- `boxOuterLightRight`
- `boxOuterLightRightHorizontalStipple`
- `boxOuterLightRightHorizontalStippleDown`
- `boxOuterLightRightHorizontalStippleUp`
- `boxOuterLightRightStipple`
- `boxOuterLightRoundDownLeft`
- `boxOuterLightRoundDownRight`
- `boxOuterLightRoundUpLeft`
- `boxOuterLightRoundUpRight`
- `boxOuterLightUp`
- `boxOuterLightUpDown`
- `boxOuterLightUpDownLeft`
- `boxOuterLightUpDownRight`
- `boxOuterLightUpDownStipple`
- `boxOuterLightUpLeft`
- `boxOuterLightUpLeftRight`
- `boxOuterLightUpLeftStipple`
- `boxOuterLightUpRight`
- `boxOuterLightUpRightStipple`
- `boxOuterLightUpStipple`
- `boxOuterLightUpVerticalStipple`
- `boxOuterLightUpVerticalStippleLeft`
- `boxOuterLightUpVerticalStippleRight`
- `briefcase`
- `broadcast`
- `bug`
- `bugFill`
- `calculator`
- `calendar`
- `calendarImport`
- `calendarMonth`
- `cancel`
- `card`
- `cardText`
- `cart`
- `cash`
- `cast`
- `castle`
- `chartBar`
- `chat`
- `chatProcessing`
- `check`
- `checkboxBlank`
- `checkboxCross`
- `checkboxIntermediate`
- `checkboxIntermediateVariant`
- `checkboxMarked`
- `checkerLarge`
- `checkerMedium`
- `checkerSmall`
- `checkerboard`
- `chest`
- `chestFill`
- `chevronDown`
- `chevronDownCircle`
- `chevronLeft`
- `chevronLeftCircle`
- `chevronRight`
- `chevronRightCircle`
- `chevronUp`
- `chevronUpCircle`
- `circle`
- `clipboard`
- `clock`
- `clockFill`
- `close`
- `closeOutline`
- `cloud`
- `cloudDown`
- `cloudUp`
- `coffee`
- `coinCopper`
- `coinElectrum`
- `coinGold`
- `coinPlatinum`
- `coinSilver`
- `comment`
- `commentText`
- `commentUser`
- `compass`
- `compassEastArrow`
- `compassNorthArrow`
- `compassNorthEast`
- `compassNorthWest`
- `compassSouthArrow`
- `compassSouthEast`
- `compassSouthWest`
- `compassWestArrow`
- `creditCard`
- `crossbow`
- `crown`
- `cube`
- `cubeUnfolded`
- `dagger`
- `database`
- `device`
- `diamond`
- `division`
- `door`
- `doorBox`
- `doorOpen`
- `dotHexagon`
- `dotHexagonFill`
- `dotOctagon`
- `dotOctagonFill`
- `download`
- `email`
- `eye`
- `eyeFill`
- `file`
- `fill`
- `filter`
- `fire`
- `flask`
- `flaskEmpty`
- `flaskRoundBottom`
- `flaskRoundBottomEmpty`
- `floppyDisk`
- `folder`
- `folderOpen`
- `formatAlignBottom`
- `formatAlignCenter`
- `formatAlignJustify`
- `formatAlignLeft`
- `formatAlignRight`
- `formatAlignTop`
- `formatBold`
- `formatFloatLeft`
- `formatFloatRight`
- `formatHorizontalAlignCenter`
- `formatItalic`
- `formatLineSpacing`
- `formatText`
- `formatTextMultiline`
- `formatTextSingleLine`
- `formatVerticalAlignCenter`
- `gamepad`
- `gamepadCenter`
- `gamepadCenterFill`
- `gamepadDown`
- `gamepadDownFill`
- `gamepadDownLeft`
- `gamepadDownLeftFill`
- `gamepadDownRight`
- `gamepadDownRightFill`
- `gamepadFill`
- `gamepadLeft`
- `gamepadLeftFill`
- `gamepadRight`
- `gamepadRightFill`
- `gamepadUp`
- `gamepadUpFill`
- `gamepadUpLeft`
- `gamepadUpLeftFill`
- `gamepadUpRight`
- `gamepadUpRightFill`
- `glaive`
- `glasses`
- `halberd`
- `heart`
- `heartBroken`
- `help`
- `helpBox`
- `helpBoxFill`
- `hexagon`
- `homeThatched`
- `image`
- `javalin`
- `journal`
- `key`
- `label`
- `labelVariant`
- `lance`
- `led`
- `lightbulb`
- `linen`
- `lock`
- `lockOpen`
- `login`
- `logout`
- `magnifyMinus`
- `magnifyPlus`
- `map`
- `menuBottomLeft`
- `menuBottomRight`
- `menuDown`
- `menuDownFill`
- `menuLeft`
- `menuLeftFill`
- `menuLeftRight`
- `menuRight`
- `menuRightFill`
- `menuTopLeft`
- `menuTopRight`
- `menuUp`
- `menuUpDown`
- `menuUpFill`
- `message`
- `messageProcessing`
- `messageText`
- `messageUser`
- `microphone`
- `minus`
- `minusBox`
- `minusBoxFill`
- `minusCircle`
- `minusCircleFill`
- `monitor`
- `monitorImage`
- `multiply`
- `musicNote`
- `necklace`
- `note`
- `noteNailed`
- `notebook`
- `notification`
- `number`
- `octagon`
- `paperclip`
- `pause`
- `peace`
- `pencil`
- `pickaxe`
- `pictogrammers`
- `pike`
- `play`
- `plus`
- `plusBox`
- `plusBoxFill`
- `plusCircle`
- `plusCircleFill`
- `poll`
- `pound`
- `quarterstaff`
- `radiobox`
- `radioboxMarked`
- `range`
- `relativeScale`
- `removeCircle`
- `ring`
- `rotateClockwise`
- `rotateCounterclockwise`
- `scimitar`
- `script`
- `search`
- `shield`
- `shovel`
- `skull`
- `sliderEnd`
- `sliderRight`
- `speaker`
- `spear`
- `stool`
- `stop`
- `sword`
- `tableTopDoorHorizontal`
- `tableTopDoorOneWayDown`
- `tableTopDoorOneWayLeft`
- `tableTopDoorOneWayRight`
- `tableTopDoorOneWayUp`
- `tableTopDoorSecretHorizontal`
- `tableTopDoorSecretVertical`
- `tableTopDoorVertical`
- `tableTopHorizontalRotateClockwise`
- `tableTopHorizontalRotateCounterclockwise`
- `tableTopHorizontalStairsAscendLeft`
- `tableTopHorizontalStairsAscendRight`
- `tableTopHorizontalStairsDescendDown`
- `tableTopHorizontalStairsDescendLeft`
- `tableTopHorizontalStairsDescendRight`
- `tableTopHorizontalStairsDescendUp`
- `tableTopSpiralStairsDown`
- `tableTopSpiralStairsLeft`
- `tableTopSpiralStairsRight`
- `tableTopSpiralStairsRoundDown`
- `tableTopSpiralStairsRoundLeft`
- `tableTopSpiralStairsRoundRight`
- `tableTopSpiralStairsRoundUp`
- `tableTopSpiralStairsUp`
- `tableTopStairsDown`
- `tableTopStairsLeft`
- `tableTopStairsRight`
- `tableTopStairsUp`
- `tableTopVerticalRotateClockwise`
- `tableTopVerticalRotateCounterclockwise`
- `tableTopVerticalStairsAscendDown`
- `tableTopVerticalStairsAscendUp`
- `tag`
- `tagText`
- `target`
- `tent`
- `terminal`
- `textBox`
- `textImage`
- `tileCautionHeavy`
- `tileCautionThin`
- `tileDiamondHex`
- `timeSand`
- `toggleSwitchOff`
- `toggleSwitchOn`
- `toolbox`
- `tooltipAbove`
- `tooltipAboveAlert`
- `tooltipAboveHelp`
- `tooltipAboveText`
- `tooltipBelow`
- `tooltipBelowAlert`
- `tooltipBelowHelp`
- `tooltipBelowText`
- `tooltipEnd`
- `tooltipEndAlert`
- `tooltipEndHelp`
- `tooltipEndText`
- `tooltipStart`
- `tooltipStartAlert`
- `tooltipStartHelp`
- `tooltipStartText`
- `torch`
- `toyBrick`
- `trash`
- `trident`
- `umbrella`
- `upload`
- `volumeHigh`
- `volumeLow`
- `volumeMedium`
- `volumeMute`
- `wall`
- `wallFill`
- `wallFront`
- `wallFrontDamaged`
- `wallFrontGate`
- `water`
- `waterFill`
- `weight`
- `weightFill`
- `well`
- `whip`
- `wind`

## Usage Examples

### Navigation Menu

```html
@js
  import { AccountIcon, AccountBoxIcon, AlertIcon, AlertBoxIcon } from '@stacksjs/iconify-memory'

  global.navIcons = {
    home: AccountIcon({ size: 20, class: 'nav-icon' }),
    about: AccountBoxIcon({ size: 20, class: 'nav-icon' }),
    contact: AlertIcon({ size: 20, class: 'nav-icon' }),
    settings: AlertBoxIcon({ size: 20, class: 'nav-icon' })
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
import { AccountIcon } from '@stacksjs/iconify-memory'

const icon = AccountIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AccountIcon, AccountBoxIcon, AlertIcon } from '@stacksjs/iconify-memory'

const successIcon = AccountIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccountBoxIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlertIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AccountIcon, AccountBoxIcon } from '@stacksjs/iconify-memory'
   const icon = AccountIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { account, accountBox } from '@stacksjs/iconify-memory'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(account, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AccountIcon, AccountBoxIcon } from '@stacksjs/iconify-memory'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-memory'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AccountIcon } from '@stacksjs/iconify-memory'
     global.icon = AccountIcon({ size: 24 })
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
   const icon = AccountIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { account } from '@stacksjs/iconify-memory'

// Icons are typed as IconData
const myIcon: IconData = account
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Apache 2.0

See [license details](https://github.com/Pictogrammers/Memory/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Pictogrammers ([Website](https://github.com/Pictogrammers/Memory))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/memory/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/memory/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
