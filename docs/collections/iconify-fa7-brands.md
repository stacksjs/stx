# Font Awesome Brands

> Font Awesome Brands icons for stx from Iconify

## Overview

This package provides access to 548 icons from the Font Awesome Brands collection through the stx iconify integration.

**Collection ID:** `fa7-brands`
**Total Icons:** 548
**Author:** Dave Gandy ([Website](https://github.com/FortAwesome/Font-Awesome))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-fa7-brands
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<11tyIcon height="1em" />
<11tyIcon width="1em" height="1em" />
<11tyIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<11tyIcon size="24" />
<11tyIcon size="1em" />

<!-- Using width and height -->
<11tyIcon width="24" height="32" />

<!-- With color -->
<11tyIcon size="24" color="red" />
<11tyIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<11tyIcon size="24" class="icon-primary" />

<!-- With all properties -->
<11tyIcon
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
    <11tyIcon size="24" />
    <42GroupIcon size="24" color="#4a90e2" />
    <500pxIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 11ty, 42Group, 500px } from '@stacksjs/iconify-fa7-brands'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(11ty, { size: 24 })
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
<11tyIcon size="24" color="red" />
<11tyIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<11tyIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<11tyIcon size="24" class="text-primary" />
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
<11tyIcon height="1em" />
<11tyIcon width="1em" height="1em" />
<11tyIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<11tyIcon size="24" />
<11tyIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.fa7Brands-icon {
  width: 1em;
  height: 1em;
}
```

```html
<11tyIcon class="fa7Brands-icon" />
```

## Available Icons

This package contains **548** icons:

- `11ty`
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
- `behanceSquare`
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
- `cashApp`
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
- `disqus`
- `dochub`
- `docker`
- `draft2digital`
- `dribbble`
- `dribbbleSquare`
- `dropbox`
- `drupal`
- `duolingo`
- `dyalog`
- `earlybirds`
- `ebay`
- `edge`
- `edgeLegacy`
- `elementor`
- `eleventy`
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
- `gitlabSquare`
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
- `googlePlusSquare`
- `googleScholar`
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
- `jxl`
- `kaggle`
- `kakaoTalk`
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
- `letterboxd`
- `line`
- `linkedin`
- `linkedinIn`
- `linktree`
- `linode`
- `linux`
- `lumon`
- `lumonDrop`
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
- `notion`
- `npm`
- `ns8`
- `nutritionix`
- `octopusDeploy`
- `odnoklassniki`
- `odnoklassnikiSquare`
- `odysee`
- `oldRepublic`
- `openai`
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
- `pandora`
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
- `piedPiperSquare`
- `pinterest`
- `pinterestP`
- `pinterestSquare`
- `pix`
- `pixelfed`
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
- `slackHash`
- `slideshare`
- `snapchat`
- `snapchatGhost`
- `snapchatSquare`
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
- `squareFigma`
- `squareFontAwesome`
- `squareFontAwesomeStroke`
- `squareGit`
- `squareGithub`
- `squareGitlab`
- `squareGooglePlus`
- `squareHackerNews`
- `squareInstagram`
- `squareJs`
- `squareKickstarter`
- `squareLastfm`
- `squareLetterboxd`
- `squareLinkedin`
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
- `steamSquare`
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
- `telegramPlane`
- `tencentWeibo`
- `tex`
- `theRedYeti`
- `themeco`
- `themeisle`
- `thinkPeaks`
- `threads`
- `tidal`
- `tiktok`
- `tradeFederation`
- `trello`
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
- `upwork`
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
- `vsco`
- `vuejs`
- `w3c`
- `watchmanMonitoring`
- `waze`
- `webAwesome`
- `webflow`
- `weebly`
- `weibo`
- `weixin`
- `whatsapp`
- `whatsappSquare`
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
- `wsh`
- `xTwitter`
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
  <a href="/"><11tyIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><42GroupIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><500pxIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccessibleIconIcon size="20" class="nav-icon" /> Settings</a>
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
<11tyIcon
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
    <11tyIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <42GroupIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <500pxIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <11tyIcon size="24" />
   <42GroupIcon size="24" color="#4a90e2" />
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
   <11tyIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <11tyIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <11tyIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 11ty } from '@stacksjs/iconify-fa7-brands'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(11ty, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 11ty } from '@stacksjs/iconify-fa7-brands'

// Icons are typed as IconData
const myIcon: IconData = 11ty
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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/fa7-brands/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/fa7-brands/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
