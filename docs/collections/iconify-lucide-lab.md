# Lucide Lab

> Lucide Lab icons for stx from Iconify

## Overview

This package provides access to 373 icons from the Lucide Lab collection through the stx iconify integration.

**Collection ID:** `lucide-lab`
**Total Icons:** 373
**Author:** Lucide Contributors ([Website](https://github.com/lucide-icons/lucide-lab))
**License:** ISC ([Details](https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-lucide-lab
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AmpersandSquareIcon, AppleCoreIcon, ArrowsUpDownSquareIcon } from '@stacksjs/iconify-lucide-lab'

// Basic usage
const icon = AmpersandSquareIcon()

// With size
const sizedIcon = AmpersandSquareIcon({ size: 24 })

// With color
const coloredIcon = AppleCoreIcon({ color: 'red' })

// With multiple props
const customIcon = ArrowsUpDownSquareIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AmpersandSquareIcon, AppleCoreIcon, ArrowsUpDownSquareIcon } from '@stacksjs/iconify-lucide-lab'

  global.icons = {
    home: AmpersandSquareIcon({ size: 24 }),
    user: AppleCoreIcon({ size: 24, color: '#4a90e2' }),
    settings: ArrowsUpDownSquareIcon({ size: 32 })
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
import { ampersandSquare, appleCore, arrowsUpDownSquare } from '@stacksjs/iconify-lucide-lab'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(ampersandSquare, { size: 24 })
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
const redIcon = AmpersandSquareIcon({ color: 'red' })
const blueIcon = AmpersandSquareIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AmpersandSquareIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AmpersandSquareIcon({ class: 'text-primary' })
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
const icon24 = AmpersandSquareIcon({ size: 24 })
const icon1em = AmpersandSquareIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AmpersandSquareIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AmpersandSquareIcon({ height: '1em' })
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
const smallIcon = AmpersandSquareIcon({ class: 'icon-small' })
const largeIcon = AmpersandSquareIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **373** icons:

- `ampersandSquare`
- `appleCore`
- `arrowsUpDownSquare`
- `astronautHelmet`
- `atSignCircle`
- `atSignSquare`
- `avocado`
- `babyPacifier`
- `bacon`
- `bagHand`
- `barbecue`
- `barberPole`
- `barn`
- `baseball`
- `baselineSquare`
- `basketball`
- `batBall`
- `bathBubble`
- `beachBall`
- `bearFace`
- `bedBunk`
- `bee`
- `beeHive`
- `beetleScarab`
- `bellConcierge`
- `bellConciergeDot`
- `bellConciergeOff`
- `belt`
- `boldSquare`
- `bottleBaby`
- `bottleChampagne`
- `bottleDispenser`
- `bottlePerfume`
- `bottlePlastic`
- `bottleSpray`
- `bottleToothbrushComb`
- `bowlChopsticks`
- `bowlOverflow`
- `bowling`
- `braSports`
- `briefcasePlus`
- `broom`
- `bucket`
- `bullHead`
- `burger`
- `butterfly`
- `cabin`
- `cabinetFiling`
- `cactus`
- `candleHolder`
- `candleHolderLit`
- `candleTealight`
- `candleTealightLit`
- `candlestick`
- `candlestickBig`
- `candlestickBigLit`
- `candlestickLit`
- `cardCredit`
- `cardSd`
- `cardSim`
- `carton`
- `cartonOff`
- `caseCamel`
- `caseKebab`
- `caseSnake`
- `caseSnakeUpper`
- `catBig`
- `cauldron`
- `cent`
- `centCircle`
- `centSquare`
- `chairsTableParasol`
- `chairsTablePlatter`
- `chameleon`
- `cheese`
- `chest`
- `chevronsLeftRightSquare`
- `chevronsUpDownSquare`
- `cloth`
- `coatHanger`
- `cocktail`
- `coconut`
- `coffeeBean`
- `coffeemaker`
- `coinsExchange`
- `coinsStack`
- `copyCode`
- `copyDown`
- `copyFilePath`
- `copyImage`
- `copyText`
- `copyType`
- `cowHead`
- `cowUdderDroplets`
- `crab`
- `cricketBall`
- `cricketWicket`
- `crossSquare`
- `crosshair2`
- `crosshair2Dot`
- `crosshairPlus`
- `crosshairPlusDot`
- `crosshairSquare`
- `cupSaucer`
- `cupToGo`
- `currencySquare`
- `deskLamp`
- `diaper`
- `dishwasher`
- `dollarSignCircle`
- `dollarSignSquare`
- `doorbellIntercom`
- `dress`
- `eggCup`
- `elephant`
- `elephantFace`
- `escalatorArrowDownLeft`
- `escalatorArrowUpRight`
- `euroCircle`
- `euroSquare`
- `faceAlien`
- `fanHandheld`
- `farm`
- `faucet`
- `featherPlus`
- `featherSquare`
- `featherText`
- `flippers`
- `floorPlan`
- `floppyDisk`
- `floppyDisk2`
- `floppyDiskRear`
- `floppyDisks`
- `floppyDisks2`
- `floppyDisksRear`
- `flowerLotus`
- `flowerPot`
- `flowerRose`
- `flowerRoseSingle`
- `flowerStem`
- `flowerTulip`
- `football`
- `footballGoal`
- `footballHelmet`
- `forkKnife`
- `forkKnifeCrossed`
- `foxFaceTail`
- `frogFace`
- `fruit`
- `garlic`
- `gearbox`
- `gearboxSquare`
- `gemRing`
- `glassesSquare`
- `glassesSun`
- `goalNet`
- `goblet`
- `gobletCrack`
- `golfDriver`
- `grapes`
- `gridLines`
- `gridLinesOffset`
- `hairdryer`
- `hatBaseball`
- `hatBeanie`
- `hatBowler`
- `hatChef`
- `hatHard`
- `hatTop`
- `headingCircle`
- `headingSquare`
- `hedgehog`
- `helmetDiving`
- `hexagons3`
- `hexagons7`
- `highHeel`
- `hockey`
- `hockeyMask`
- `horseHead`
- `hotDog`
- `house`
- `houseManor`
- `houseOff`
- `houseRoof`
- `houseRoofOff`
- `houses`
- `iceHockey`
- `iceSkate`
- `igloo`
- `indianRupeeCircle`
- `indianRupeeSquare`
- `intercom`
- `iron`
- `ironOff`
- `ironingBoard`
- `italicSquare`
- `jacket`
- `jacketSports`
- `japaneseYenCircle`
- `japaneseYenSquare`
- `jar`
- `jug`
- `kebab`
- `kettle`
- `kettleElectric`
- `kiwi`
- `layoutGridMoveHorizontal`
- `layoutGridMoveVertical`
- `layoutGridPlus`
- `layoutListMove`
- `lemon`
- `lifeJacket`
- `ligatureSquare`
- `lightSwitch`
- `lingerie`
- `locateSquare`
- `luggageCabin`
- `lunchBox`
- `mailboxFlag`
- `maskSnorkel`
- `mealBox`
- `mortarPestle`
- `motorRacingHelmet`
- `mug`
- `mugTeabag`
- `mustache`
- `olive`
- `onion`
- `owl`
- `pacMan`
- `pacManGhost`
- `palmtreeIslandSun`
- `pancakes`
- `peace`
- `peach`
- `pear`
- `penguin`
- `pepperChilli`
- `pie`
- `pig`
- `pigHead`
- `pillow`
- `pinSafety`
- `pinSafetyOpen`
- `pineappleRing`
- `planet`
- `pond`
- `poundSterlingCircle`
- `poundSterlingSquare`
- `pram`
- `pretzel`
- `pumpkin`
- `razor`
- `razorBlade`
- `reelThread`
- `refrigeratorFreezer`
- `removeFormattingSquare`
- `rugby`
- `russianRubleCircle`
- `russianRubleSquare`
- `sausage`
- `scarf`
- `scissorsHairComb`
- `shark`
- `shaveFace`
- `shirtFoldedButtons`
- `shirtLongSleeve`
- `shirtT`
- `shirtTRuler`
- `shirtTVNeck`
- `shorts`
- `shortsBoxer`
- `shovelDig`
- `shower`
- `skirt`
- `skis`
- `slotCard`
- `slotCardCredit`
- `slotDisc`
- `sneaker`
- `snowboard`
- `snowman`
- `soapBar`
- `soccerBall`
- `soccerPitch`
- `socketEu`
- `socketUk`
- `socketUsa`
- `socks`
- `spider`
- `spiderWeb`
- `stairs`
- `stairsArch`
- `stairsArrowDownLeft`
- `stairsArrowUpRight`
- `starNorth`
- `steeringWheel`
- `strawberry`
- `strikethroughSquare`
- `stroller`
- `sunloungerParasolSun`
- `sunloungerParasolSunPalmtree`
- `sunloungerParasolTable`
- `surfboard`
- `sushi`
- `sushi2`
- `sushi3`
- `sushiChopsticks`
- `sweater`
- `swissFrancCircle`
- `swissFrancSquare`
- `tab`
- `tabArrowDown`
- `tabArrowUpRight`
- `tabCheck`
- `tabDot`
- `tabPlus`
- `tabSlash`
- `tabText`
- `tabX`
- `targetArrow`
- `tennisBall`
- `tennisRacket`
- `textSquare`
- `tie`
- `tieBow`
- `tieBowRibbon`
- `tire`
- `toast`
- `toaster`
- `toiletRoll`
- `toolbox`
- `toolbox2`
- `topCrop`
- `towelFolded`
- `towelRack`
- `treesForest`
- `triangleStripes`
- `trousers`
- `tuxedo`
- `typeSquare`
- `ufo`
- `underlineSquare`
- `unicornHead`
- `venn`
- `vest`
- `volleyball`
- `waffle`
- `wardrobe`
- `watchActivity`
- `watchAlarm`
- `watchBars`
- `watchCharging`
- `watchCheck`
- `watchLoader`
- `watchMusic`
- `watchSquare`
- `watchSquareAlarm`
- `watchText`
- `watermelon`
- `waveCircle`
- `wavesBirds`
- `wavesSharkFin`
- `whale`
- `whaleNarwhal`
- `wheel`
- `whisk`
- `whiskForkKnife`
- `whisks`
- `windmill`
- `wineGlassBottle`
- `yarnBall`
- `yinYang`

## Usage Examples

### Navigation Menu

```html
@js
  import { AmpersandSquareIcon, AppleCoreIcon, ArrowsUpDownSquareIcon, AstronautHelmetIcon } from '@stacksjs/iconify-lucide-lab'

  global.navIcons = {
    home: AmpersandSquareIcon({ size: 20, class: 'nav-icon' }),
    about: AppleCoreIcon({ size: 20, class: 'nav-icon' }),
    contact: ArrowsUpDownSquareIcon({ size: 20, class: 'nav-icon' }),
    settings: AstronautHelmetIcon({ size: 20, class: 'nav-icon' })
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
import { AmpersandSquareIcon } from '@stacksjs/iconify-lucide-lab'

const icon = AmpersandSquareIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AmpersandSquareIcon, AppleCoreIcon, ArrowsUpDownSquareIcon } from '@stacksjs/iconify-lucide-lab'

const successIcon = AmpersandSquareIcon({ size: 16, color: '#22c55e' })
const warningIcon = AppleCoreIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ArrowsUpDownSquareIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AmpersandSquareIcon, AppleCoreIcon } from '@stacksjs/iconify-lucide-lab'
   const icon = AmpersandSquareIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { ampersandSquare, appleCore } from '@stacksjs/iconify-lucide-lab'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(ampersandSquare, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AmpersandSquareIcon, AppleCoreIcon } from '@stacksjs/iconify-lucide-lab'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-lucide-lab'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AmpersandSquareIcon } from '@stacksjs/iconify-lucide-lab'
     global.icon = AmpersandSquareIcon({ size: 24 })
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
   const icon = AmpersandSquareIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { ampersandSquare } from '@stacksjs/iconify-lucide-lab'

// Icons are typed as IconData
const myIcon: IconData = ampersandSquare
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/lucide-icons/lucide-lab/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Lucide Contributors ([Website](https://github.com/lucide-icons/lucide-lab))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/lucide-lab/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/lucide-lab/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
