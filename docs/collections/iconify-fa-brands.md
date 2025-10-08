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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<500pxIcon size="24" />
<500pxIcon size="1em" />

<!-- Using width and height -->
<500pxIcon width="24" height="32" />

<!-- With color -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<500pxIcon size="24" class="icon-primary" />

<!-- With all properties -->
<500pxIcon
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
    <500pxIcon size="24" />
    <AccessibleIconIcon size="24" color="#4a90e2" />
    <AccusoftIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<500pxIcon size="24" color="red" />
<500pxIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<500pxIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<500pxIcon size="24" class="text-primary" />
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
<500pxIcon height="1em" />
<500pxIcon width="1em" height="1em" />
<500pxIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<500pxIcon size="24" />
<500pxIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.faBrands-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="faBrands-icon" />
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
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccessibleIconIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccusoftIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AcquisitionsIncorporatedIcon size="20" class="nav-icon" /> Settings</a>
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
<500pxIcon
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
    <500pxIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccessibleIconIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccusoftIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <AccessibleIconIcon size="24" color="#4a90e2" />
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
   <500pxIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <500pxIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <500pxIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 500px } from '@stacksjs/iconify-fa-brands'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
