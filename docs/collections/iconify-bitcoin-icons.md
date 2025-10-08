# Bitcoin Icons

> Bitcoin Icons icons for stx from Iconify

## Overview

This package provides access to 250 icons from the Bitcoin Icons collection through the stx iconify integration.

**Collection ID:** `bitcoin-icons`
**Total Icons:** 250
**Author:** Bitcoin Design Community ([Website](https://github.com/BitcoinDesign/Bitcoin-Icons))
**License:** MIT ([Details](https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-bitcoin-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AddressBookFilledIcon, AddressBookOutlineIcon, AlertCircleFilledIcon } from '@stacksjs/iconify-bitcoin-icons'

// Basic usage
const icon = AddressBookFilledIcon()

// With size
const sizedIcon = AddressBookFilledIcon({ size: 24 })

// With color
const coloredIcon = AddressBookOutlineIcon({ color: 'red' })

// With multiple props
const customIcon = AlertCircleFilledIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AddressBookFilledIcon, AddressBookOutlineIcon, AlertCircleFilledIcon } from '@stacksjs/iconify-bitcoin-icons'

  global.icons = {
    home: AddressBookFilledIcon({ size: 24 }),
    user: AddressBookOutlineIcon({ size: 24, color: '#4a90e2' }),
    settings: AlertCircleFilledIcon({ size: 32 })
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
import { addressBookFilled, addressBookOutline, alertCircleFilled } from '@stacksjs/iconify-bitcoin-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(addressBookFilled, { size: 24 })
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
const redIcon = AddressBookFilledIcon({ color: 'red' })
const blueIcon = AddressBookFilledIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AddressBookFilledIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AddressBookFilledIcon({ class: 'text-primary' })
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
const icon24 = AddressBookFilledIcon({ size: 24 })
const icon1em = AddressBookFilledIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AddressBookFilledIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AddressBookFilledIcon({ height: '1em' })
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
const smallIcon = AddressBookFilledIcon({ class: 'icon-small' })
const largeIcon = AddressBookFilledIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **250** icons:

- `addressBookFilled`
- `addressBookOutline`
- `alertCircleFilled`
- `alertCircleOutline`
- `alertFilled`
- `alertOutline`
- `arrowDownFilled`
- `arrowDownOutline`
- `arrowLeftFilled`
- `arrowLeftOutline`
- `arrowRightFilled`
- `arrowRightOutline`
- `arrowUpFilled`
- `arrowUpOutline`
- `bellFilled`
- `bellOutline`
- `bitcoinCircleFilled`
- `bitcoinCircleOutline`
- `bitcoinFilled`
- `bitcoinOutline`
- `blockFilled`
- `blockOutline`
- `brushFilled`
- `brushOutline`
- `buoyFilled`
- `buoyOutline`
- `calendarFilled`
- `calendarOutline`
- `carFilled`
- `carOutline`
- `caretDownFilled`
- `caretDownOutline`
- `caretLeftFilled`
- `caretLeftOutline`
- `caretRightFilled`
- `caretRightOutline`
- `caretUpFilled`
- `caretUpOutline`
- `cartFilled`
- `cartOutline`
- `channelFilled`
- `channelOutline`
- `channelsFilled`
- `channelsOutline`
- `checkFilled`
- `checkOutline`
- `clearCharacterFilled`
- `clearCharacterOutline`
- `clockFilled`
- `clockOutline`
- `cloudFilled`
- `cloudOutline`
- `codeFilled`
- `codeOutline`
- `coinsFilled`
- `coinsOutline`
- `confirmations0Filled`
- `confirmations0Outline`
- `confirmations1Filled`
- `confirmations1Outline`
- `confirmations2Filled`
- `confirmations2Outline`
- `confirmations3Filled`
- `confirmations3Outline`
- `confirmations4Filled`
- `confirmations4Outline`
- `confirmations5Filled`
- `confirmations5Outline`
- `confirmations6Filled`
- `confirmations6Outline`
- `consoleFilled`
- `consoleOutline`
- `contactsFilled`
- `contactsOutline`
- `copyFilled`
- `copyOutline`
- `creditCardFilled`
- `creditCardOutline`
- `crossFilled`
- `crossOutline`
- `devicesFilled`
- `devicesOutline`
- `editFilled`
- `editOutline`
- `ellipsisFilled`
- `ellipsisOutline`
- `exchangeFilled`
- `exchangeOutline`
- `exitFilled`
- `exitOutline`
- `exportFilled`
- `exportOutline`
- `fileFilled`
- `fileOutline`
- `flipHorizontalFilled`
- `flipHorizontalOutline`
- `flipVerticalFilled`
- `flipVerticalOutline`
- `gearFilled`
- `gearOutline`
- `globeFilled`
- `globeOutline`
- `graphFilled`
- `graphOutline`
- `gridFilled`
- `gridOutline`
- `hiddenFilled`
- `hiddenOutline`
- `homeFilled`
- `homeOutline`
- `infoCircleFilled`
- `infoCircleOutline`
- `infoFilled`
- `infoOutline`
- `invoiceFilled`
- `invoiceOutline`
- `keyFilled`
- `keyOutline`
- `lightningCircleFilled`
- `lightningCircleOutline`
- `lightningFilled`
- `lightningOutline`
- `linkFilled`
- `linkOutline`
- `linuxTerminalFilled`
- `linuxTerminalOutline`
- `lockFilled`
- `lockOutline`
- `magicWandFilled`
- `magicWandOutline`
- `menuFilled`
- `menuOutline`
- `messageFilled`
- `messageOutline`
- `milkFilled`
- `milkOutline`
- `minerFilled`
- `minerOutline`
- `miningDeviceFilled`
- `miningDeviceOutline`
- `miningFilled`
- `miningOutline`
- `minusFilled`
- `minusOutline`
- `mixedFilled`
- `mixedOutline`
- `mnemonicFilled`
- `mnemonicOutline`
- `moonFilled`
- `moonOutline`
- `noDollarsFilled`
- `noDollarsOutline`
- `node0ConnectionsFilled`
- `node0ConnectionsOutline`
- `node1ConnectionFilled`
- `node1ConnectionOutline`
- `node2ConnectionsFilled`
- `node2ConnectionsOutline`
- `node3ConnectionsFilled`
- `node3ConnectionsOutline`
- `nodeFilled`
- `nodeHardwareFilled`
- `nodeHardwareOutline`
- `nodeOutline`
- `pantheonFilled`
- `pantheonOutline`
- `passwordFilled`
- `passwordOutline`
- `photoFilled`
- `photoOutline`
- `pieChartFilled`
- `pieChartOutline`
- `plusFilled`
- `plusOutline`
- `podcastFilled`
- `podcastOutline`
- `pointOfSaleFilled`
- `pointOfSaleOutline`
- `proxyFilled`
- `proxyOutline`
- `qrCodeFilled`
- `qrCodeOutline`
- `questionCircleFilled`
- `questionCircleOutline`
- `questionFilled`
- `questionOutline`
- `receiveFilled`
- `receiveOutline`
- `refreshFilled`
- `refreshOutline`
- `relayFilled`
- `relayOutline`
- `rocketFilled`
- `rocketOutline`
- `safeFilled`
- `safeOutline`
- `satoshiV1Filled`
- `satoshiV1Outline`
- `satoshiV2Filled`
- `satoshiV2Outline`
- `satoshiV3Filled`
- `satoshiV3Outline`
- `scanFilled`
- `scanOutline`
- `sdCardFilled`
- `sdCardOutline`
- `searchFilled`
- `searchOutline`
- `sendFilled`
- `sendOutline`
- `shareFilled`
- `shareOutline`
- `sharedWalletFilled`
- `sharedWalletOutline`
- `shieldFilled`
- `shieldOutline`
- `signFilled`
- `signOutline`
- `snowflakeFilled`
- `snowflakeOutline`
- `sofaFilled`
- `sofaOutline`
- `starFilled`
- `starOutline`
- `sunFilled`
- `sunOutline`
- `tagFilled`
- `tagOutline`
- `tipJarFilled`
- `tipJarOutline`
- `transactionsFilled`
- `transactionsOutline`
- `transferFilled`
- `transferOutline`
- `trashFilled`
- `trashOutline`
- `twoKeysFilled`
- `twoKeysOutline`
- `unlockFilled`
- `unlockOutline`
- `unmixedFilled`
- `unmixedOutline`
- `usbFilled`
- `usbOutline`
- `verifyFilled`
- `verifyOutline`
- `visibleFilled`
- `visibleOutline`
- `walletFilled`
- `walletOutline`

## Usage Examples

### Navigation Menu

```html
@js
  import { AddressBookFilledIcon, AddressBookOutlineIcon, AlertCircleFilledIcon, AlertCircleOutlineIcon } from '@stacksjs/iconify-bitcoin-icons'

  global.navIcons = {
    home: AddressBookFilledIcon({ size: 20, class: 'nav-icon' }),
    about: AddressBookOutlineIcon({ size: 20, class: 'nav-icon' }),
    contact: AlertCircleFilledIcon({ size: 20, class: 'nav-icon' }),
    settings: AlertCircleOutlineIcon({ size: 20, class: 'nav-icon' })
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
import { AddressBookFilledIcon } from '@stacksjs/iconify-bitcoin-icons'

const icon = AddressBookFilledIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AddressBookFilledIcon, AddressBookOutlineIcon, AlertCircleFilledIcon } from '@stacksjs/iconify-bitcoin-icons'

const successIcon = AddressBookFilledIcon({ size: 16, color: '#22c55e' })
const warningIcon = AddressBookOutlineIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AlertCircleFilledIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AddressBookFilledIcon, AddressBookOutlineIcon } from '@stacksjs/iconify-bitcoin-icons'
   const icon = AddressBookFilledIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { addressBookFilled, addressBookOutline } from '@stacksjs/iconify-bitcoin-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(addressBookFilled, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AddressBookFilledIcon, AddressBookOutlineIcon } from '@stacksjs/iconify-bitcoin-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-bitcoin-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AddressBookFilledIcon } from '@stacksjs/iconify-bitcoin-icons'
     global.icon = AddressBookFilledIcon({ size: 24 })
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
   const icon = AddressBookFilledIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { addressBookFilled } from '@stacksjs/iconify-bitcoin-icons'

// Icons are typed as IconData
const myIcon: IconData = addressBookFilled
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT) for more information.

## Credits

- **Icons**: Bitcoin Design Community ([Website](https://github.com/BitcoinDesign/Bitcoin-Icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/bitcoin-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/bitcoin-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
