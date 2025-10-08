# Font Awesome 5 Brands

> Font Awesome 5 Brands icons for stx from Iconify

## Overview

This package provides access to 460 icons from the Font Awesome 5 Brands collection through the stx iconify integration.

**Collection ID:** `fa-brands`
**Total Icons:** 460
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa-brands
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 500pxIcon, AccessibleIconIcon, AccusoftIcon } from '@stacksjs/iconify-fa-brands'

// Basic usage
const icon = 500pxIcon()

// With size
const sizedIcon = 500pxIcon({ size: 24 })

// With color
const coloredIcon = AccessibleIconIcon({ color: 'red' })

// With multiple props
const customIcon = AccusoftIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 500pxIcon, AccessibleIconIcon, AccusoftIcon } from '@stacksjs/iconify-fa-brands'

  global.icons = {
    home: 500pxIcon({ size: 24 }),
    user: AccessibleIconIcon({ size: 24, color: '#4a90e2' }),
    settings: AccusoftIcon({ size: 32 })
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
import { 500px, accessibleIcon, accusoft } from '@stacksjs/iconify-fa-brands'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(500px, { size: 24 })
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
const redIcon = 500pxIcon({ color: 'red' })
const blueIcon = 500pxIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 500pxIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 500pxIcon({ class: 'text-primary' })
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
const icon24 = 500pxIcon({ size: 24 })
const icon1em = 500pxIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 500pxIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 500pxIcon({ height: '1em' })
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
const smallIcon = 500pxIcon({ class: 'icon-small' })
const largeIcon = 500pxIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **460** icons:

- `500px`
- `accessibleIcon`
- `accusoft`
- `acquisitionsIncorporated`
- `adn`
- `adobe`
- `adversal`
- `affiliatetheme`
- `airbnb`
- `algolia`
- `alipay`
- `amazon`
- `amazonPay`
- `amilia`
- `android`
- `angellist`
- `angrycreative`
- `angular`
- `appStore`
- `appStoreIos`
- `apper`
- `apple`
- `applePay`
- `artstation`
- `asymmetrik`
- `atlassian`
- `audible`
- `autoprefixer`
- `avianex`
- `aviato`
- `aws`
- `bandcamp`
- `battleNet`
- `behance`
- `behanceSquare`
- `bimobject`
- `bitbucket`
- `bitcoin`
- `bity`
- `blackTie`
- `blackberry`
- `blogger`
- `bloggerB`
- `bluetooth`
- `bluetoothB`
- `bootstrap`
- `btc`
- `buffer`
- `buromobelexperte`
- `buyNLarge`
- `buysellads`
- `canadianMapleLeaf`
- `ccAmazonPay`
- `ccAmex`
- `ccApplePay`
- `ccDinersClub`
- `ccDiscover`
- `ccJcb`
- `ccMastercard`
- `ccPaypal`
- `ccStripe`
- `ccVisa`
- `centercode`
- `centos`
- `chrome`
- `chromecast`
- `cloudflare`
- `cloudscale`
- `cloudsmith`
- `cloudversify`
- `codepen`
- `codiepie`
- `confluence`
- `connectdevelop`
- `contao`
- `cottonBureau`
- `cpanel`
- `creativeCommons`
- `creativeCommonsBy`
- `creativeCommonsNc`
- `creativeCommonsNcEu`
- `creativeCommonsNcJp`
- `creativeCommonsNd`
- `creativeCommonsPd`
- `creativeCommonsPdAlt`
- `creativeCommonsRemix`
- `creativeCommonsSa`
- `creativeCommonsSampling`
- `creativeCommonsSamplingPlus`
- `creativeCommonsShare`
- `creativeCommonsZero`
- `criticalRole`
- `css3`
- `css3Alt`
- `cuttlefish`
- `dAndD`
- `dAndDBeyond`
- `dailymotion`
- `dashcube`
- `deezer`
- `delicious`
- `deploydog`
- `deskpro`
- `dev`
- `deviantart`
- `dhl`
- `diaspora`
- `digg`
- `digitalOcean`
- `discord`
- `discourse`
- `dochub`
- `docker`
- `draft2digital`
- `dribbble`
- `dribbbleSquare`
- `dropbox`
- `drupal`
- `dyalog`
- `earlybirds`
- `ebay`
- `edge`
- `edgeLegacy`
- `elementor`
- `ello`
- `ember`
- `empire`
- `envira`
- `erlang`
- `ethereum`
- `etsy`
- `evernote`
- `expeditedssl`
- `facebook`
- `facebookF`
- `facebookMessenger`
- `facebookSquare`
- `fantasyFlightGames`
- `fedex`
- `fedora`
- `figma`
- `firefox`
- `firefoxBrowser`
- `firstOrder`
- `firstOrderAlt`
- `firstdraft`
- `flickr`
- `flipboard`
- `fly`
- `fontAwesome`
- `fontAwesomeAlt`
- `fontAwesomeFlag`
- `fonticons`
- `fonticonsFi`
- `fortAwesome`
- `fortAwesomeAlt`
- `forumbee`
- `foursquare`
- `freeCodeCamp`
- `freebsd`
- `fulcrum`
- `galacticRepublic`
- `galacticSenate`
- `getPocket`
- `gg`
- `ggCircle`
- `git`
- `gitAlt`
- `gitSquare`
- `github`
- `githubAlt`
- `githubSquare`
- `gitkraken`
- `gitlab`
- `gitter`
- `glide`
- `glideG`
- `gofore`
- `goodreads`
- `goodreadsG`
- `google`
- `googleDrive`
- `googlePay`
- `googlePlay`
- `googlePlus`
- `googlePlusG`
- `googlePlusSquare`
- `googleWallet`
- `gratipay`
- `grav`
- `gripfire`
- `grunt`
- `guilded`
- `gulp`
- `hackerNews`
- `hackerNewsSquare`
- `hackerrank`
- `hips`
- `hireAHelper`
- `hive`
- `hooli`
- `hornbill`
- `hotjar`
- `houzz`
- `html5`
- `hubspot`
- `ideal`
- `imdb`
- `innosoft`
- `instagram`
- `instagramSquare`
- `instalod`
- `intercom`
- `internetExplorer`
- `invision`
- `ioxhost`
- `itchIo`
- `itunes`
- `itunesNote`
- `java`
- `jediOrder`
- `jenkins`
- `jira`
- `joget`
- `joomla`
- `js`
- `jsSquare`
- `jsfiddle`
- `kaggle`
- `keybase`
- `keycdn`
- `kickstarter`
- `kickstarterK`
- `korvue`
- `laravel`
- `lastfm`
- `lastfmSquare`
- `leanpub`
- `less`
- `line`
- `linkedin`
- `linkedinIn`
- `linode`
- `linux`
- `lyft`
- `magento`
- `mailchimp`
- `mandalorian`
- `markdown`
- `mastodon`
- `maxcdn`
- `mdb`
- `medapps`
- `medium`
- `mediumM`
- `medrt`
- `meetup`
- `megaport`
- `mendeley`
- `microblog`
- `microsoft`
- `mix`
- `mixcloud`
- `mixer`
- `mizuni`
- `modx`
- `monero`
- `napster`
- `neos`
- `nimblr`
- `nintendoSwitch`
- `node`
- `nodeJs`
- `npm`
- `ns8`
- `nutritionix`
- `octopusDeploy`
- `odnoklassniki`
- `odnoklassnikiSquare`
- `oldRepublic`
- `opencart`
- `openid`
- `opera`
- `optinMonster`
- `orcid`
- `osi`
- `page4`
- `pagelines`
- `palfed`
- `patreon`
- `paypal`
- `pennyArcade`
- `perbyte`
- `periscope`
- `phabricator`
- `phoenixFramework`
- `phoenixSquadron`
- `php`
- `piedPiper`
- `piedPiperAlt`
- `piedPiperHat`
- `piedPiperPp`
- `piedPiperSquare`
- `pinterest`
- `pinterestP`
- `pinterestSquare`
- `playstation`
- `productHunt`
- `pushed`
- `python`
- `qq`
- `quinscape`
- `quora`
- `rProject`
- `raspberryPi`
- `ravelry`
- `react`
- `reacteurope`
- `readme`
- `rebel`
- `redRiver`
- `reddit`
- `redditAlien`
- `redditSquare`
- `redhat`
- `rendact`
- `renren`
- `replyd`
- `researchgate`
- `resolving`
- `rev`
- `rocketchat`
- `rockrms`
- `rust`
- `safari`
- `salesforce`
- `sass`
- `schlix`
- `scribd`
- `searchengin`
- `sellcast`
- `sellsy`
- `servicestack`
- `shirtsinbulk`
- `shopify`
- `shopware`
- `simplybuilt`
- `sistrix`
- `sith`
- `sketch`
- `skyatlas`
- `skype`
- `slack`
- `slackHash`
- `slideshare`
- `snapchat`
- `snapchatGhost`
- `snapchatSquare`
- `soundcloud`
- `sourcetree`
- `speakap`
- `speakerDeck`
- `spotify`
- `squarespace`
- `stackExchange`
- `stackOverflow`
- `stackpath`
- `staylinked`
- `steam`
- `steamSquare`
- `steamSymbol`
- `stickerMule`
- `strava`
- `stripe`
- `stripeS`
- `studiovinari`
- `stumbleupon`
- `stumbleuponCircle`
- `superpowers`
- `supple`
- `suse`
- `swift`
- `symfony`
- `teamspeak`
- `telegram`
- `telegramPlane`
- `tencentWeibo`
- `theRedYeti`
- `themeco`
- `themeisle`
- `thinkPeaks`
- `tiktok`
- `tradeFederation`
- `trello`
- `tripadvisor`
- `tumblr`
- `tumblrSquare`
- `twitch`
- `twitter`
- `twitterSquare`
- `typo3`
- `uber`
- `ubuntu`
- `uikit`
- `umbraco`
- `uncharted`
- `uniregistry`
- `unity`
- `unsplash`
- `untappd`
- `ups`
- `usb`
- `usps`
- `ussunnah`
- `vaadin`
- `viacoin`
- `viadeo`
- `viadeoSquare`
- `viber`
- `vimeo`
- `vimeoSquare`
- `vimeoV`
- `vine`
- `vk`
- `vnv`
- `vuejs`
- `watchmanMonitoring`
- `waze`
- `weebly`
- `weibo`
- `weixin`
- `whatsapp`
- `whatsappSquare`
- `whmcs`
- `wikipediaW`
- `windows`
- `wix`
- `wizardsOfTheCoast`
- `wodu`
- `wolfPackBattalion`
- `wordpress`
- `wordpressSimple`
- `wpbeginner`
- `wpexplorer`
- `wpforms`
- `wpressr`
- `xbox`
- `xing`
- `xingSquare`
- `yCombinator`
- `yahoo`
- `yammer`
- `yandex`
- `yandexInternational`
- `yarn`
- `yelp`
- `yoast`
- `youtube`
- `youtubeSquare`
- `zhihu`

## Usage Examples

### Navigation Menu

```html
@js
  import { 500pxIcon, AccessibleIconIcon, AccusoftIcon, AcquisitionsIncorporatedIcon } from '@stacksjs/iconify-fa-brands'

  global.navIcons = {
    home: 500pxIcon({ size: 20, class: 'nav-icon' }),
    about: AccessibleIconIcon({ size: 20, class: 'nav-icon' }),
    contact: AccusoftIcon({ size: 20, class: 'nav-icon' }),
    settings: AcquisitionsIncorporatedIcon({ size: 20, class: 'nav-icon' })
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
import { 500pxIcon } from '@stacksjs/iconify-fa-brands'

const icon = 500pxIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 500pxIcon, AccessibleIconIcon, AccusoftIcon } from '@stacksjs/iconify-fa-brands'

const successIcon = 500pxIcon({ size: 16, color: '#22c55e' })
const warningIcon = AccessibleIconIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccusoftIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 500pxIcon, AccessibleIconIcon } from '@stacksjs/iconify-fa-brands'
   const icon = 500pxIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 500px, accessibleIcon } from '@stacksjs/iconify-fa-brands'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(500px, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 500pxIcon, AccessibleIconIcon } from '@stacksjs/iconify-fa-brands'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fa-brands'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 500pxIcon } from '@stacksjs/iconify-fa-brands'
     global.icon = 500pxIcon({ size: 24 })
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
   const icon = 500pxIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-fa-brands'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa-brands/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa-brands/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
