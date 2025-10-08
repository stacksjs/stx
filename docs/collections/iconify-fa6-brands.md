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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<42GroupIcon height="1em" />
<42GroupIcon width="1em" height="1em" />
<42GroupIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<42GroupIcon size="24" />
<42GroupIcon size="1em" />

<!-- Using width and height -->
<42GroupIcon width="24" height="32" />

<!-- With color -->
<42GroupIcon size="24" color="red" />
<42GroupIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<42GroupIcon size="24" class="icon-primary" />

<!-- With all properties -->
<42GroupIcon
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
    <42GroupIcon size="24" />
    <500pxIcon size="24" color="#4a90e2" />
    <AccessibleIconIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<42GroupIcon size="24" color="red" />
<42GroupIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<42GroupIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<42GroupIcon size="24" class="text-primary" />
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
<42GroupIcon height="1em" />
<42GroupIcon width="1em" height="1em" />
<42GroupIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<42GroupIcon size="24" />
<42GroupIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fa6Brands-icon {
  width: 1em;
  height: 1em;
}
```

```html
<42GroupIcon class="fa6Brands-icon" />
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
<nav>
  <a href="/"><42GroupIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><500pxIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccessibleIconIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccusoftIcon size="20" class="nav-icon" /> Settings</a>
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
<42GroupIcon
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
    <42GroupIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <500pxIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccessibleIconIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <42GroupIcon size="24" />
   <500pxIcon size="24" color="#4a90e2" />
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
   <42GroupIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <42GroupIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <42GroupIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 42Group } from '@stacksjs/iconify-fa6-brands'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(42Group, { size: 24 })
   @endjs

   {!! customIcon !!}
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
