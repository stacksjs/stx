# Font Awesome 6 Brands

> Font Awesome 6 Brands icons for stx from Iconify

## Overview

This package provides access to 495 icons from the Font Awesome 6 Brands collection through the stx iconify integration.

**Collection ID:** `fa6-brands`
**Total Icons:** 495
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Archive / Unmaintained
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa6-brands
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 42GroupIcon, 500pxIcon, AccessibleIconIcon } from '@stacksjs/iconify-fa6-brands'

// Basic usage
const icon = 42GroupIcon()

// With size
const sizedIcon = 42GroupIcon({ size: 24 })

// With color
const coloredIcon = 500pxIcon({ color: 'red' })

// With multiple props
const customIcon = AccessibleIconIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 42GroupIcon, 500pxIcon, AccessibleIconIcon } from '@stacksjs/iconify-fa6-brands'

  global.icons = {
    home: 42GroupIcon({ size: 24 }),
    user: 500pxIcon({ size: 24, color: '#4a90e2' }),
    settings: AccessibleIconIcon({ size: 32 })
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
import { 42Group, 500px, accessibleIcon } from '@stacksjs/iconify-fa6-brands'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(42Group, { size: 24 })
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
const redIcon = 42GroupIcon({ color: 'red' })
const blueIcon = 42GroupIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 42GroupIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 42GroupIcon({ class: 'text-primary' })
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
const icon24 = 42GroupIcon({ size: 24 })
const icon1em = 42GroupIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 42GroupIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 42GroupIcon({ height: '1em' })
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
const smallIcon = 42GroupIcon({ class: 'icon-small' })
const largeIcon = 42GroupIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **495** icons:

- `42Group`
- `500px`
- `accessibleIcon`
- `accusoft`
- `adn`
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
- `bilibili`
- `bimobject`
- `bitbucket`
- `bitcoin`
- `bity`
- `blackTie`
- `blackberry`
- `blogger`
- `bloggerB`
- `bluesky`
- `bluetooth`
- `bluetoothB`
- `bootstrap`
- `bots`
- `brave`
- `braveReverse`
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
- `cmplid`
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
- `css`
- `css3`
- `css3Alt`
- `cuttlefish`
- `dAndD`
- `dAndDBeyond`
- `dailymotion`
- `dartLang`
- `dashcube`
- `debian`
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
- `fantasyFlightGames`
- `fedex`
- `fedora`
- `figma`
- `filesPinwheel`
- `firefox`
- `firefoxBrowser`
- `firstOrder`
- `firstOrderAlt`
- `firstdraft`
- `flickr`
- `flipboard`
- `flutter`
- `fly`
- `fontAwesome`
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
- `github`
- `githubAlt`
- `gitkraken`
- `gitlab`
- `gitter`
- `glide`
- `glideG`
- `gofore`
- `golang`
- `goodreads`
- `goodreadsG`
- `google`
- `googleDrive`
- `googlePay`
- `googlePlay`
- `googlePlus`
- `googlePlusG`
- `googleScholar`
- `googleWallet`
- `gratipay`
- `grav`
- `gripfire`
- `grunt`
- `guilded`
- `gulp`
- `hackerNews`
- `hackerrank`
- `hashnode`
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
- `instagram`
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
- `jsfiddle`
- `jxl`
- `kaggle`
- `keybase`
- `keycdn`
- `kickstarter`
- `kickstarterK`
- `korvue`
- `laravel`
- `lastfm`
- `leanpub`
- `less`
- `letterboxd`
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
- `medrt`
- `meetup`
- `megaport`
- `mendeley`
- `meta`
- `microblog`
- `microsoft`
- `mintbit`
- `mix`
- `mixcloud`
- `mixer`
- `mizuni`
- `modx`
- `monero`
- `napster`
- `neos`
- `nfcDirectional`
- `nfcSymbol`
- `nimblr`
- `node`
- `nodeJs`
- `npm`
- `ns8`
- `nutritionix`
- `octopusDeploy`
- `odnoklassniki`
- `odysee`
- `oldRepublic`
- `opencart`
- `openid`
- `opensuse`
- `opera`
- `optinMonster`
- `orcid`
- `osi`
- `padlet`
- `page4`
- `pagelines`
- `palfed`
- `patreon`
- `paypal`
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
- `pinterest`
- `pinterestP`
- `pix`
- `pixiv`
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
- `redhat`
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
- `screenpal`
- `scribd`
- `searchengin`
- `sellcast`
- `sellsy`
- `servicestack`
- `shirtsinbulk`
- `shoelace`
- `shopify`
- `shopware`
- `signalMessenger`
- `simplybuilt`
- `sistrix`
- `sith`
- `sitrox`
- `sketch`
- `skyatlas`
- `skype`
- `slack`
- `slideshare`
- `snapchat`
- `soundcloud`
- `sourcetree`
- `spaceAwesome`
- `speakap`
- `speakerDeck`
- `spotify`
- `squareBehance`
- `squareBluesky`
- `squareDribbble`
- `squareFacebook`
- `squareFontAwesome`
- `squareFontAwesomeStroke`
- `squareGit`
- `squareGithub`
- `squareGitlab`
- `squareGooglePlus`
- `squareHackerNews`
- `squareInstagram`
- `squareJs`
- `squareLastfm`
- `squareLetterboxd`
- `squareOdnoklassniki`
- `squarePiedPiper`
- `squarePinterest`
- `squareReddit`
- `squareSnapchat`
- `squareSteam`
- `squareThreads`
- `squareTumblr`
- `squareTwitter`
- `squareUpwork`
- `squareViadeo`
- `squareVimeo`
- `squareWebAwesome`
- `squareWebAwesomeStroke`
- `squareWhatsapp`
- `squareXTwitter`
- `squareXing`
- `squareYoutube`
- `squarespace`
- `stackExchange`
- `stackOverflow`
- `stackpath`
- `staylinked`
- `steam`
- `steamSymbol`
- `stickerMule`
- `strava`
- `stripe`
- `stripeS`
- `stubber`
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
- `tencentWeibo`
- `theRedYeti`
- `themeco`
- `themeisle`
- `thinkPeaks`
- `threads`
- `tiktok`
- `tradeFederation`
- `trello`
- `tumblr`
- `twitch`
- `twitter`
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
- `upwork`
- `usb`
- `usps`
- `ussunnah`
- `vaadin`
- `viacoin`
- `viadeo`
- `viber`
- `vimeo`
- `vimeoV`
- `vine`
- `vk`
- `vnv`
- `vuejs`
- `watchmanMonitoring`
- `waze`
- `webAwesome`
- `webflow`
- `weebly`
- `weibo`
- `weixin`
- `whatsapp`
- `whmcs`
- `wikipediaW`
- `windows`
- `wirsindhandwerk`
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
- `xTwitter`
- `xbox`
- `xing`
- `yCombinator`
- `yahoo`
- `yammer`
- `yandex`
- `yandexInternational`
- `yarn`
- `yelp`
- `yoast`
- `youtube`
- `zhihu`

## Usage Examples

### Navigation Menu

```html
@js
  import { 42GroupIcon, 500pxIcon, AccessibleIconIcon, AccusoftIcon } from '@stacksjs/iconify-fa6-brands'

  global.navIcons = {
    home: 42GroupIcon({ size: 20, class: 'nav-icon' }),
    about: 500pxIcon({ size: 20, class: 'nav-icon' }),
    contact: AccessibleIconIcon({ size: 20, class: 'nav-icon' }),
    settings: AccusoftIcon({ size: 20, class: 'nav-icon' })
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
import { 42GroupIcon } from '@stacksjs/iconify-fa6-brands'

const icon = 42GroupIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 42GroupIcon, 500pxIcon, AccessibleIconIcon } from '@stacksjs/iconify-fa6-brands'

const successIcon = 42GroupIcon({ size: 16, color: '#22c55e' })
const warningIcon = 500pxIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AccessibleIconIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 42GroupIcon, 500pxIcon } from '@stacksjs/iconify-fa6-brands'
   const icon = 42GroupIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 42Group, 500px } from '@stacksjs/iconify-fa6-brands'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(42Group, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 42GroupIcon, 500pxIcon } from '@stacksjs/iconify-fa6-brands'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-fa6-brands'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 42GroupIcon } from '@stacksjs/iconify-fa6-brands'
     global.icon = 42GroupIcon({ size: 24 })
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
   const icon = 42GroupIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 42Group } from '@stacksjs/iconify-fa6-brands'

// Icons are typed as IconData
const myIcon: IconData = 42Group
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa6-brands/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa6-brands/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
