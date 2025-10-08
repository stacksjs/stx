# CoreUI Brands

> CoreUI Brands icons for stx from Iconify

## Overview

This package provides access to 830 icons from the CoreUI Brands collection through the stx iconify integration.

**Collection ID:** `cib`
**Total Icons:** 830
**Author:** creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
**License:** CC0 1.0 ([Details](https://creativecommons.org/publicdomain/zero/1.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cib
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
    <500px5Icon size="24" color="#4a90e2" />
    <AboutMeIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 500px, 500px5, aboutMe } from '@stacksjs/iconify-cib'
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
.cib-icon {
  width: 1em;
  height: 1em;
}
```

```html
<500pxIcon class="cib-icon" />
```

## Available Icons

This package contains **830** icons:

- `500px`
- `500px5`
- `aboutMe`
- `abstract`
- `acm`
- `addthis`
- `adguard`
- `adobe`
- `adobeAcrobatReader`
- `adobeAfterEffects`
- `adobeAudition`
- `adobeCreativeCloud`
- `adobeDreamweaver`
- `adobeIllustrator`
- `adobeIndesign`
- `adobeLightroom`
- `adobeLightroomClassic`
- `adobePhotoshop`
- `adobePremiere`
- `adobeTypekit`
- `adobeXd`
- `airbnb`
- `algolia`
- `alipay`
- `allocine`
- `amazon`
- `amazonAws`
- `amazonPay`
- `amd`
- `americanExpress`
- `anaconda`
- `analogue`
- `android`
- `androidAlt`
- `angellist`
- `angular`
- `angularUniversal`
- `ansible`
- `apache`
- `apacheAirflow`
- `apacheFlink`
- `apacheSpark`
- `appStore`
- `appStoreIos`
- `apple`
- `appleMusic`
- `applePay`
- `applePodcasts`
- `appveyor`
- `aral`
- `archLinux`
- `archiveOfOurOwn`
- `arduino`
- `artstation`
- `arxiv`
- `asana`
- `atAndT`
- `atlassian`
- `atom`
- `audible`
- `aurelia`
- `auth0`
- `automatic`
- `autotask`
- `aventrix`
- `azureArtifacts`
- `azureDevops`
- `azurePipelines`
- `babel`
- `baidu`
- `bamboo`
- `bancontact`
- `bandcamp`
- `basecamp`
- `bathasu`
- `behance`
- `bigCartel`
- `bing`
- `bit`
- `bitbucket`
- `bitcoin`
- `bitdefender`
- `bitly`
- `blackberry`
- `blender`
- `blogger`
- `bloggerB`
- `bluetooth`
- `bluetoothB`
- `boeing`
- `boost`
- `bootstrap`
- `bower`
- `brandAi`
- `brave`
- `btc`
- `buddy`
- `buffer`
- `buyMeACoffee`
- `buysellads`
- `buzzfeed`
- `c`
- `cakephp`
- `campaignMonitor`
- `canva`
- `cashapp`
- `cassandra`
- `castro`
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
- `centos`
- `cevo`
- `chase`
- `chef`
- `chromecast`
- `circle`
- `circleci`
- `cirrusci`
- `cisco`
- `civicrm`
- `clockify`
- `clojure`
- `cloudbees`
- `cloudflare`
- `cmake`
- `coOp`
- `codacy`
- `codeClimate`
- `codecademy`
- `codecov`
- `codeigniter`
- `codepen`
- `coderwall`
- `codesandbox`
- `codeship`
- `codewars`
- `codio`
- `coffeescript`
- `commonWorkflowLanguage`
- `composer`
- `condaForge`
- `conekta`
- `confluence`
- `coreui`
- `coreuiC`
- `coursera`
- `coveralls`
- `cpanel`
- `cplusplus`
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
- `crunchbase`
- `crunchyroll`
- `css3`
- `css3Shiled`
- `csswizardry`
- `d3Js`
- `dailymotion`
- `dashlane`
- `dazn`
- `dblp`
- `debian`
- `deepin`
- `deezer`
- `delicious`
- `dell`
- `deno`
- `dependabot`
- `designerNews`
- `devTo`
- `deviantart`
- `devrant`
- `diaspora`
- `digg`
- `digitalOcean`
- `discord`
- `discourse`
- `discover`
- `disqus`
- `disroot`
- `django`
- `docker`
- `docusign`
- `dotNet`
- `draugiemLv`
- `dribbble`
- `drone`
- `dropbox`
- `drupal`
- `dtube`
- `duckduckgo`
- `dynatrace`
- `ebay`
- `eclipseide`
- `elastic`
- `elasticCloud`
- `elasticSearch`
- `elasticStack`
- `electron`
- `elementary`
- `eleventy`
- `ello`
- `elsevier`
- `emlakjet`
- `empirekred`
- `envato`
- `epicGames`
- `epson`
- `esea`
- `eslint`
- `ethereum`
- `etsy`
- `eventStore`
- `eventbrite`
- `evernote`
- `everplaces`
- `evry`
- `exercism`
- `expertsExchange`
- `expo`
- `eyeem`
- `fSecure`
- `facebook`
- `facebookF`
- `faceit`
- `fandango`
- `favro`
- `feathub`
- `fedex`
- `fedora`
- `feedly`
- `fidoAlliance`
- `figma`
- `filezilla`
- `firebase`
- `fitbit`
- `flask`
- `flattr`
- `flickr`
- `flipboard`
- `flutter`
- `fnac`
- `foursquare`
- `framer`
- `freebsd`
- `freecodecamp`
- `furAffinity`
- `furryNetwork`
- `garmin`
- `gatsby`
- `gauges`
- `genius`
- `gentoo`
- `geocaching`
- `gerrit`
- `gg`
- `ghost`
- `gimp`
- `git`
- `gitea`
- `github`
- `gitkraken`
- `gitlab`
- `gitpod`
- `gitter`
- `glassdoor`
- `glitch`
- `gmail`
- `gnu`
- `gnuPrivacyGuard`
- `gnuSocial`
- `go`
- `godotEngine`
- `gogCom`
- `goldenline`
- `goodreads`
- `google`
- `googleAds`
- `googleAllo`
- `googleAnalytics`
- `googleChrome`
- `googleCloud`
- `googleKeep`
- `googlePay`
- `googlePlay`
- `googlePodcasts`
- `googlesCholar`
- `govUk`
- `gradle`
- `grafana`
- `graphcool`
- `graphql`
- `grav`
- `gravatar`
- `greenkeeper`
- `greensock`
- `groovy`
- `groupon`
- `grunt`
- `gulp`
- `gumroad`
- `gumtree`
- `habr`
- `hackaday`
- `hackerearth`
- `hackerone`
- `hackerrank`
- `hackhands`
- `hackster`
- `happycow`
- `hashnode`
- `haskell`
- `hatenaBookmark`
- `haxe`
- `helm`
- `here`
- `heroku`
- `hexo`
- `highly`
- `hipchat`
- `hitachi`
- `hockeyapp`
- `homify`
- `hootsuite`
- `hotjar`
- `houzz`
- `hp`
- `html5`
- `html5Shield`
- `htmlacademy`
- `huawei`
- `hubspot`
- `hulu`
- `humbleBundle`
- `iata`
- `ibm`
- `icloud`
- `iconjar`
- `icq`
- `ideal`
- `ifixit`
- `imdb`
- `indeed`
- `inkscape`
- `instacart`
- `instagram`
- `instapaper`
- `intel`
- `intellijidea`
- `intercom`
- `internetExplorer`
- `invision`
- `ionic`
- `issuu`
- `itchIo`
- `jabber`
- `java`
- `javascript`
- `jekyll`
- `jenkins`
- `jest`
- `jet`
- `jetbrains`
- `jira`
- `joomla`
- `jquery`
- `js`
- `jsdelivr`
- `jsfiddle`
- `json`
- `jupyter`
- `justgiving`
- `kaggle`
- `kaios`
- `kaspersky`
- `kentico`
- `keras`
- `keybase`
- `keycdn`
- `khanAcademy`
- `kibana`
- `kickstarter`
- `kik`
- `kirby`
- `klout`
- `known`
- `koFi`
- `kodi`
- `koding`
- `kotlin`
- `krita`
- `kubernetes`
- `lanyrd`
- `laravel`
- `laravelHorizon`
- `laravelNova`
- `lastFm`
- `latex`
- `launchpad`
- `leetcode`
- `lenovo`
- `less`
- `letsEncrypt`
- `letterboxd`
- `lgtm`
- `liberapay`
- `librarything`
- `libreoffice`
- `line`
- `linkedin`
- `linkedinIn`
- `linux`
- `linuxFoundation`
- `linuxMint`
- `livejournal`
- `livestream`
- `logstash`
- `lua`
- `lumen`
- `lyft`
- `macys`
- `magento`
- `magisk`
- `mailRu`
- `mailchimp`
- `makerbot`
- `manjaro`
- `markdown`
- `marketo`
- `mastercard`
- `mastodon`
- `materialDesign`
- `mathworks`
- `matrix`
- `mattermost`
- `matternet`
- `maxcdn`
- `mcafee`
- `mediaTemple`
- `mediafire`
- `medium`
- `mediumM`
- `meetup`
- `mega`
- `mendeley`
- `messenger`
- `meteor`
- `microBlog`
- `microgenetics`
- `microsoft`
- `microsoftEdge`
- `minetest`
- `minutemailer`
- `mix`
- `mixcloud`
- `mixer`
- `mojang`
- `monero`
- `mongodb`
- `monkeytie`
- `monogram`
- `monzo`
- `moo`
- `mozilla`
- `mozillaFirefox`
- `musescore`
- `mxlinux`
- `myspace`
- `mysql`
- `nativescript`
- `nec`
- `neo4j`
- `netflix`
- `netlify`
- `nextJs`
- `nextcloud`
- `nextdoor`
- `nginx`
- `nim`
- `nintendo`
- `nintendo3ds`
- `nintendoGamecube`
- `nintendoSwitch`
- `nodeJs`
- `nodeRed`
- `nodemon`
- `nokia`
- `notion`
- `npm`
- `nucleo`
- `nuget`
- `nuxtJs`
- `nvidia`
- `ocaml`
- `octave`
- `octopusDeploy`
- `oculus`
- `odnoklassniki`
- `openAccess`
- `openCollective`
- `openId`
- `openSourceInitiative`
- `openstreetmap`
- `opensuse`
- `openvpn`
- `opera`
- `opsgenie`
- `oracle`
- `oracleNetsuite`
- `orcid`
- `origin`
- `osi`
- `osmc`
- `overcast`
- `overleaf`
- `ovh`
- `pagekit`
- `palantir`
- `pandora`
- `pantheon`
- `patreon`
- `paypal`
- `periscope`
- `php`
- `picartoTv`
- `pinboard`
- `pingdom`
- `pingup`
- `pinterest`
- `pinterestP`
- `pivotaltracker`
- `plangrid`
- `playerMe`
- `playerfm`
- `playstation`
- `playstation3`
- `playstation4`
- `plesk`
- `plex`
- `pluralsight`
- `plurk`
- `pocket`
- `postgresql`
- `postman`
- `postwoman`
- `powershell`
- `prettier`
- `prismic`
- `probot`
- `processwire`
- `productHunt`
- `protoIo`
- `protonmail`
- `proxmox`
- `pypi`
- `python`
- `pytorch`
- `qgis`
- `qiita`
- `qq`
- `qualcomm`
- `quantcast`
- `quantopian`
- `quarkus`
- `quora`
- `qwiklabs`
- `qzone`
- `r`
- `radiopublic`
- `rails`
- `raspberryPi`
- `react`
- `readTheDocs`
- `readme`
- `realm`
- `reason`
- `redbubble`
- `reddit`
- `redditAlt`
- `redhat`
- `redis`
- `redux`
- `renren`
- `reverbnation`
- `riot`
- `ripple`
- `riseup`
- `rollupJs`
- `roots`
- `roundcube`
- `rss`
- `rstudio`
- `ruby`
- `rubygems`
- `runkeeper`
- `rust`
- `safari`
- `sahibinden`
- `salesforce`
- `saltstack`
- `samsung`
- `samsungPay`
- `sap`
- `sass`
- `sassAlt`
- `saucelabs`
- `scala`
- `scaleway`
- `scribd`
- `scrutinizerci`
- `seagate`
- `sega`
- `sellfy`
- `semaphoreci`
- `sensu`
- `sentry`
- `serverFault`
- `shazam`
- `shell`
- `shopify`
- `showpad`
- `siemens`
- `signal`
- `sinaWeibo`
- `sitepoint`
- `sketch`
- `skillshare`
- `skyliner`
- `skype`
- `slack`
- `slashdot`
- `slickpic`
- `slides`
- `slideshare`
- `smashingmagazine`
- `snapchat`
- `snapcraft`
- `snyk`
- `society6`
- `socketIo`
- `sogou`
- `solus`
- `songkick`
- `sonos`
- `soundcloud`
- `sourceforge`
- `sourcegraph`
- `spacemacs`
- `spacex`
- `sparkfun`
- `sparkpost`
- `spdx`
- `speakerDeck`
- `spectrum`
- `spotify`
- `spotlight`
- `spreaker`
- `spring`
- `sprint`
- `squarespace`
- `stackbit`
- `stackexchange`
- `stackoverflow`
- `stackpath`
- `stackshare`
- `stadia`
- `statamic`
- `staticman`
- `statuspage`
- `steam`
- `steem`
- `steemit`
- `stitcher`
- `storify`
- `storybook`
- `strapi`
- `strava`
- `stripe`
- `stripeS`
- `stubhub`
- `stumbleupon`
- `styleshare`
- `stylus`
- `sublimeText`
- `subversion`
- `superuser`
- `svelte`
- `svg`
- `swagger`
- `swarm`
- `swift`
- `symantec`
- `symfony`
- `synology`
- `tMobile`
- `tableau`
- `tails`
- `tapas`
- `teamviewer`
- `ted`
- `teespring`
- `telegram`
- `telegramPlane`
- `tencentQq`
- `tencentWeibo`
- `tensorflow`
- `terraform`
- `tesla`
- `theMighty`
- `theMovieDatabase`
- `tidal`
- `tiktok`
- `tinder`
- `todoist`
- `toggl`
- `topcoder`
- `toptal`
- `tor`
- `toshiba`
- `trainerroad`
- `trakt`
- `travisci`
- `treehouse`
- `trello`
- `tripadvisor`
- `trulia`
- `tumblr`
- `twilio`
- `twitch`
- `twitter`
- `twoo`
- `typescript`
- `typo3`
- `uber`
- `ubisoft`
- `ublockOrigin`
- `ubuntu`
- `udacity`
- `udemy`
- `uikit`
- `umbraco`
- `unity`
- `unrealEngine`
- `unsplash`
- `untappd`
- `upwork`
- `usb`
- `v8`
- `vagrant`
- `venmo`
- `verizon`
- `viadeo`
- `viber`
- `vim`
- `vimeo`
- `vimeoV`
- `vine`
- `virb`
- `visa`
- `visualStudio`
- `visualStudioCode`
- `vk`
- `vlc`
- `vsco`
- `vueJs`
- `wattpad`
- `weasyl`
- `webcomponentsOrg`
- `webpack`
- `webstorm`
- `wechat`
- `whatsapp`
- `whenIWork`
- `wii`
- `wiiu`
- `wikipedia`
- `windows`
- `wire`
- `wireguard`
- `wix`
- `wolfram`
- `wolframLanguage`
- `wolframMathematica`
- `wordpress`
- `wpengine`
- `xPack`
- `xbox`
- `xcode`
- `xero`
- `xiaomi`
- `xing`
- `xrp`
- `xsplit`
- `yCombinator`
- `yahoo`
- `yammer`
- `yandex`
- `yarn`
- `yelp`
- `youtube`
- `zalando`
- `zapier`
- `zeit`
- `zendesk`
- `zerply`
- `zillow`
- `zingat`
- `zoom`
- `zorin`
- `zulip`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><500pxIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><500px5Icon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AboutMeIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AbstractIcon size="20" class="nav-icon" /> Settings</a>
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
    <500px5Icon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AboutMeIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <500pxIcon size="24" />
   <500px5Icon size="24" color="#4a90e2" />
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
     import { 500px } from '@stacksjs/iconify-cib'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(500px, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 500px } from '@stacksjs/iconify-cib'

// Icons are typed as IconData
const myIcon: IconData = 500px
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC0 1.0

See [license details](https://creativecommons.org/publicdomain/zero/1.0/) for more information.

## Credits

- **Icons**: creativeLabs Łukasz Holeczek ([Website](https://github.com/coreui/coreui-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cib/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cib/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
