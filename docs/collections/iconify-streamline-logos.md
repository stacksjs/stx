# Logos free icons

> Logos free icons icons for stx from Iconify

## Overview

This package provides access to 1362 icons from the Logos free icons collection through the stx iconify integration.

**Collection ID:** `streamline-logos`
**Total Icons:** 1362
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-streamline-logos
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<3dsMaxLogoIcon height="1em" />
<3dsMaxLogoIcon width="1em" height="1em" />
<3dsMaxLogoIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<3dsMaxLogoIcon size="24" />
<3dsMaxLogoIcon size="1em" />

<!-- Using width and height -->
<3dsMaxLogoIcon width="24" height="32" />

<!-- With color -->
<3dsMaxLogoIcon size="24" color="red" />
<3dsMaxLogoIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<3dsMaxLogoIcon size="24" class="icon-primary" />

<!-- With all properties -->
<3dsMaxLogoIcon
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
    <3dsMaxLogoIcon size="24" />
    <3dsMaxLogoBlockIcon size="24" color="#4a90e2" />
    <3dsMaxLogoSolidIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 3dsMaxLogo, 3dsMaxLogoBlock, 3dsMaxLogoSolid } from '@stacksjs/iconify-streamline-logos'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3dsMaxLogo, { size: 24 })
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
<3dsMaxLogoIcon size="24" color="red" />
<3dsMaxLogoIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<3dsMaxLogoIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<3dsMaxLogoIcon size="24" class="text-primary" />
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
<3dsMaxLogoIcon height="1em" />
<3dsMaxLogoIcon width="1em" height="1em" />
<3dsMaxLogoIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<3dsMaxLogoIcon size="24" />
<3dsMaxLogoIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.streamlineLogos-icon {
  width: 1em;
  height: 1em;
}
```

```html
<3dsMaxLogoIcon class="streamlineLogos-icon" />
```

## Available Icons

This package contains **1362** icons:

- `3dsMaxLogo`
- `3dsMaxLogoBlock`
- `3dsMaxLogoSolid`
- `500pxLogo1`
- `500pxLogo1Block`
- `500pxLogo1Solid`
- `500pxLogo2`
- `500pxLogo2Block`
- `500pxLogo2Solid`
- `aboutMeLogo`
- `aboutMeLogoBlock`
- `aboutMeLogoSolid`
- `adobeAfterEffectsLogo`
- `adobeAfterEffectsLogoBlock`
- `adobeAfterEffectsLogoSolid`
- `adobeAnimateLogo`
- `adobeAnimateLogoBlock`
- `adobeAnimateLogoSolid`
- `adobeAudioLogo`
- `adobeAudioLogoBlock`
- `adobeAudioLogoSolid`
- `adobeBridgeLogo`
- `adobeBridgeLogoBlock`
- `adobeBridgeLogoSolid`
- `adobeCloudLogo`
- `adobeCloudLogoBlock`
- `adobeCloudLogoSolid`
- `adobeIllustratorLogo`
- `adobeIllustratorLogoBlock`
- `adobeIllustratorLogoSolid`
- `adobeIndesignLogo`
- `adobeIndesignLogoBlock`
- `adobeIndesignLogoSolid`
- `adobeLightroomLogo`
- `adobeLightroomLogoBlock`
- `adobeLightroomLogoSolid`
- `adobeLogo`
- `adobeLogoBlock`
- `adobeLogoSolid`
- `adobePhotoshopLogo`
- `adobePhotoshopLogoBlock`
- `adobePhotoshopLogoSolid`
- `adobePremiereProLogo`
- `adobePremiereProLogoBlock`
- `adobePremiereProLogoSolid`
- `adobeXdLogo`
- `adobeXdLogoBlock`
- `adobeXdLogoSolid`
- `affinityDesignerLogo`
- `affinityDesignerLogoBlock`
- `affinityDesignerLogoSolid`
- `affinityLogo`
- `affinityLogoBlock`
- `affinityLogoSolid`
- `affinityPhotoLogo`
- `affinityPhotoLogoBlock`
- `affinityPhotoLogoSolid`
- `affinityPubliserLogo`
- `affinityPubliserLogoBlock`
- `affinityPubliserLogoSolid`
- `aimLogo`
- `aimLogoBlock`
- `aimLogoSolid`
- `alipayLogo`
- `alipayLogoBlock`
- `alipayLogoSolid`
- `alpineLinuxLogo`
- `alpineLinuxLogoBlock`
- `alpineLinuxLogoSolid`
- `amazonLogo`
- `amazonLogoBlock`
- `amazonLogoSolid`
- `amazonLunaLogo`
- `amazonLunaLogoBlock`
- `amazonLunaLogoSolid`
- `amazonPrimeVideoLogo1`
- `amazonPrimeVideoLogo1Block`
- `amazonPrimeVideoLogo1Solid`
- `amazonPrimeVideoLogo2`
- `amazonPrimeVideoLogo2Block`
- `amazonPrimeVideoLogo2Solid`
- `amazonWebServiceLogo`
- `amazonWebServiceLogoBlock`
- `amazonWebServiceLogoSolid`
- `amdLogo`
- `amdLogoBlock`
- `amdLogoSolid`
- `americanExpressLogo`
- `americanExpressLogoBlock`
- `americanExpressLogoSolid`
- `analogueLogo`
- `analogueLogoBlock`
- `analogueLogoSolid`
- `anchorLogo`
- `anchorLogoBlock`
- `anchorLogoSolid`
- `androidLogo`
- `androidLogoBlock`
- `androidLogoSolid`
- `androidautoLogo`
- `androidautoLogoBlock`
- `androidautoLogoSolid`
- `angularLogo`
- `angularLogoBlock`
- `angularLogoSolid`
- `apacheNetbeansLogo`
- `apacheNetbeansLogoBlock`
- `apacheNetbeansLogoSolid`
- `appStoreLogo`
- `appStoreLogoBlock`
- `appStoreLogoSolid`
- `appleIosLogo1`
- `appleIosLogo1Block`
- `appleIosLogo1Solid`
- `appleIosLogo2`
- `appleIosLogo2Block`
- `appleIosLogo2Solid`
- `appleIosLogo3`
- `appleIosLogo3Block`
- `appleIosLogo3Solid`
- `appleLogo`
- `appleLogoBlock`
- `appleLogoSolid`
- `applePodcastLogo`
- `applePodcastLogoBlock`
- `applePodcastLogoSolid`
- `archLinuxLogo`
- `archLinuxLogoBlock`
- `archLinuxLogoSolid`
- `askfmLogo`
- `askfmLogoBlock`
- `askfmLogoSolid`
- `atiLogo`
- `atiLogoBlock`
- `atiLogoSolid`
- `atlassianLogo`
- `atlassianLogoBlock`
- `atlassianLogoSolid`
- `audacityLogo`
- `audacityLogoBlock`
- `audacityLogoSolid`
- `authyLogo`
- `authyLogoBlock`
- `authyLogoSolid`
- `autodeskLogo1`
- `autodeskLogo1Block`
- `autodeskLogo1Solid`
- `autodeskLogo2`
- `autodeskLogo2Block`
- `autodeskLogo2Solid`
- `backbonejsLogo`
- `backbonejsLogoBlock`
- `backbonejsLogoSolid`
- `badooLogo`
- `badooLogoBlock`
- `badooLogoSolid`
- `bandcampLogo1`
- `bandcampLogo1Block`
- `bandcampLogo1Solid`
- `bandcampLogo2`
- `bandcampLogo2Block`
- `bandcampLogo2Solid`
- `basecampLogo1`
- `basecampLogo1Block`
- `basecampLogo1Solid`
- `basecampLogo2`
- `basecampLogo2Block`
- `basecampLogo2Solid`
- `bbcIplayerLogo1`
- `bbcIplayerLogo1Block`
- `bbcIplayerLogo1Solid`
- `bbcIplayerLogo2`
- `bbcIplayerLogo2Block`
- `bbcIplayerLogo2Solid`
- `beatsStudioLogo`
- `beatsStudioLogoBlock`
- `beatsStudioLogoSolid`
- `beboLogo`
- `beboLogoBlock`
- `beboLogoSolid`
- `behanceLogo`
- `behanceLogoBlock`
- `behanceLogoSolid`
- `betalistLogo`
- `betalistLogoBlock`
- `betalistLogoSolid`
- `beyondcorpEnterpriseLogo`
- `beyondcorpEnterpriseLogoBlock`
- `beyondcorpEnterpriseLogoSolid`
- `bilibiliLogo`
- `bilibiliLogoBlock`
- `bilibiliLogoSolid`
- `bingLogo1`
- `bingLogo1Block`
- `bingLogo1Solid`
- `bingLogo2`
- `bingLogo2Block`
- `bingLogo2Solid`
- `bitbucketLogo`
- `bitbucketLogoBlock`
- `bitbucketLogoSolid`
- `blackberryLogo`
- `blackberryLogoBlock`
- `blackberryLogoSolid`
- `bloggerLogo`
- `bloggerLogoBlock`
- `bloggerLogoSolid`
- `bloglovinLogo`
- `bloglovinLogoBlock`
- `bloglovinLogoSolid`
- `bnterLogo`
- `bnterLogoBlock`
- `bnterLogoSolid`
- `bootstrapLogo`
- `bootstrapLogoBlock`
- `bootstrapLogoSolid`
- `bowerLogo`
- `bowerLogoBlock`
- `bowerLogoSolid`
- `boxLogo`
- `boxLogoBlock`
- `boxLogoSolid`
- `brightkiteLogo`
- `brightkiteLogoBlock`
- `brightkiteLogoSolid`
- `broadcomLogo`
- `broadcomLogoBlock`
- `broadcomLogoSolid`
- `bugsnagLogo`
- `bugsnagLogoBlock`
- `bugsnagLogoSolid`
- `byteLogo`
- `byteLogoBlock`
- `byteLogoSolid`
- `cLanguageLogo`
- `cLanguageLogoBlock`
- `cLanguageLogoSolid`
- `cPlusLanguageLogo`
- `cPlusLanguageLogoBlock`
- `cPlusLanguageLogoSolid`
- `campaignMonitorLogo`
- `campaignMonitorLogoBlock`
- `campaignMonitorLogoSolid`
- `canonicalLogo`
- `canonicalLogoBlock`
- `canonicalLogoSolid`
- `centosLogo`
- `centosLogoBlock`
- `centosLogoSolid`
- `cinema4dLogo`
- `cinema4dLogoBlock`
- `cinema4dLogoSolid`
- `clarisLogo`
- `clarisLogoBlock`
- `clarisLogoSolid`
- `cloudsmithLogo`
- `cloudsmithLogoBlock`
- `cloudsmithLogoSolid`
- `cnnLogo`
- `cnnLogoBlock`
- `cnnLogoSolid`
- `codeClimateLogo`
- `codeClimateLogoBlock`
- `codeClimateLogoSolid`
- `codeSandboxLogo`
- `codeSandboxLogoBlock`
- `codeSandboxLogoSolid`
- `codecovLogo`
- `codecovLogoBlock`
- `codecovLogoSolid`
- `codefactorLogo`
- `codefactorLogoBlock`
- `codefactorLogoSolid`
- `codeigniterLogo`
- `codeigniterLogoBlock`
- `codeigniterLogoSolid`
- `codepenLogo`
- `codepenLogoBlock`
- `codepenLogoSolid`
- `consulLogo`
- `consulLogoBlock`
- `consulLogoSolid`
- `coroflotLogo`
- `coroflotLogoBlock`
- `coroflotLogoSolid`
- `creativeCommonsLogo`
- `creativeCommonsLogoBlock`
- `creativeCommonsLogoSolid`
- `crowdinLogo`
- `crowdinLogoBlock`
- `crowdinLogoSolid`
- `crunchyrollLogo`
- `crunchyrollLogoBlock`
- `crunchyrollLogoSolid`
- `cryengineLogo`
- `cryengineLogoBlock`
- `cryengineLogoSolid`
- `cucumberIoLogo`
- `cucumberIoLogoBlock`
- `cucumberIoLogoSolid`
- `d3jsLogo`
- `d3jsLogoBlock`
- `d3jsLogoSolid`
- `dailyboothLogo`
- `dailyboothLogoBlock`
- `dailyboothLogoSolid`
- `dailymotionLogo`
- `dailymotionLogoBlock`
- `dailymotionLogoSolid`
- `dartLogo`
- `dartLogoBlock`
- `dartLogoSolid`
- `daytumLogo`
- `daytumLogoBlock`
- `daytumLogoSolid`
- `deezerLogo`
- `deezerLogoBlock`
- `deezerLogoSolid`
- `deliciousingLogo`
- `deliciousingLogoBlock`
- `deliciousingLogoSolid`
- `designBumpLogo`
- `designBumpLogoBlock`
- `designBumpLogoSolid`
- `designFloatLogo`
- `designFloatLogoBlock`
- `designFloatLogoSolid`
- `designmooLogo`
- `designmooLogoBlock`
- `designmooLogoSolid`
- `deviantArtLogo1`
- `deviantArtLogo1Block`
- `deviantArtLogo1Solid`
- `deviantArtLogo2`
- `deviantArtLogo2Block`
- `deviantArtLogo2Solid`
- `deviconLogo`
- `deviconLogoBlock`
- `deviconLogoSolid`
- `diggLogo`
- `diggLogoBlock`
- `diggLogoSolid`
- `digitalOceanLogo`
- `digitalOceanLogoBlock`
- `digitalOceanLogoSolid`
- `diigoLogo1`
- `diigoLogo1Block`
- `diigoLogo1Solid`
- `diigoLogo2`
- `diigoLogo2Block`
- `diigoLogo2Solid`
- `diigoLogo3`
- `diigoLogo3Block`
- `diigoLogo3Solid`
- `discordLogo1`
- `discordLogo1Block`
- `discordLogo1Solid`
- `discordLogo2`
- `discordLogo2Block`
- `discordLogo2Solid`
- `discourseLogo`
- `discourseLogoBlock`
- `discourseLogoSolid`
- `disneyPlusLogo`
- `disneyPlusLogoBlock`
- `disneyPlusLogoSolid`
- `dockerLogo`
- `dockerLogoBlock`
- `dockerLogoSolid`
- `doctrineLogo`
- `doctrineLogoBlock`
- `doctrineLogoSolid`
- `doubanLogo`
- `doubanLogoBlock`
- `doubanLogoSolid`
- `dribbbleLogo`
- `dribbbleLogoBlock`
- `dribbbleLogoSolid`
- `dropboxLogo1`
- `dropboxLogo1Block`
- `dropboxLogo1Solid`
- `dropboxLogo2`
- `dropboxLogo2Block`
- `dropboxLogo2Solid`
- `drupalLogo1`
- `drupalLogo1Block`
- `drupalLogo1Solid`
- `drupalLogo2`
- `drupalLogo2Block`
- `drupalLogo2Solid`
- `eclipseIdeLogo`
- `eclipseIdeLogoBlock`
- `eclipseIdeLogoSolid`
- `egnyteLogo`
- `egnyteLogoBlock`
- `egnyteLogoSolid`
- `elasticBeatsLogo`
- `elasticBeatsLogoBlock`
- `elasticBeatsLogoSolid`
- `elasticCloudLogo`
- `elasticCloudLogoBlock`
- `elasticCloudLogoSolid`
- `elasticLogo`
- `elasticLogoBlock`
- `elasticLogoSolid`
- `elasticLogstashLogo`
- `elasticLogstashLogoBlock`
- `elasticLogstashLogoSolid`
- `elasticSearchLogo`
- `elasticSearchLogoBlock`
- `elasticSearchLogoSolid`
- `elasticStackLogo`
- `elasticStackLogoBlock`
- `elasticStackLogoSolid`
- `elasticXPackLogo`
- `elasticXPackLogoBlock`
- `elasticXPackLogoSolid`
- `electronicArtsLogo`
- `electronicArtsLogoBlock`
- `electronicArtsLogoSolid`
- `elixirLogo`
- `elixirLogoBlock`
- `elixirLogoSolid`
- `elloLogo`
- `elloLogoBlock`
- `elloLogoSolid`
- `emailLogo`
- `emailLogoBlock`
- `emailLogoSolid`
- `epicGamesLogo`
- `epicGamesLogoBlock`
- `epicGamesLogoSolid`
- `eseaLogo`
- `eseaLogoBlock`
- `eseaLogoSolid`
- `eslintLogo`
- `eslintLogoBlock`
- `eslintLogoSolid`
- `etsyLogo`
- `etsyLogoBlock`
- `etsyLogoSolid`
- `evernoteLogo`
- `evernoteLogoBlock`
- `evernoteLogoSolid`
- `eyeemLogo`
- `eyeemLogoBlock`
- `eyeemLogoSolid`
- `fDroidLogo`
- `fDroidLogoBlock`
- `fDroidLogoSolid`
- `facebookGamingLogo`
- `facebookGamingLogoBlock`
- `facebookGamingLogoSolid`
- `facebookLogo1`
- `facebookLogo1Block`
- `facebookLogo1Solid`
- `facebookLogo2`
- `facebookLogo2Block`
- `facebookLogo2Solid`
- `facebookMessengerLogo`
- `facebookMessengerLogoBlock`
- `facebookMessengerLogoSolid`
- `fandomLogo1`
- `fandomLogo1Block`
- `fandomLogo1Solid`
- `fandomLogo2`
- `fandomLogo2Block`
- `fandomLogo2Solid`
- `feathubLogo`
- `feathubLogoBlock`
- `feathubLogoSolid`
- `fedoraLogo`
- `fedoraLogoBlock`
- `fedoraLogoSolid`
- `feedBurnerLogo`
- `feedBurnerLogoBlock`
- `feedBurnerLogoSolid`
- `feedlyLogo`
- `feedlyLogoBlock`
- `feedlyLogoSolid`
- `ffffoundingLogo`
- `ffffoundingLogoBlock`
- `ffffoundingLogoSolid`
- `figmaLogo`
- `figmaLogoBlock`
- `figmaLogoSolid`
- `firebaseLogo`
- `firebaseLogoBlock`
- `firebaseLogoSolid`
- `fitbitLogo`
- `fitbitLogoBlock`
- `fitbitLogoSolid`
- `flickrLogo`
- `flickrLogoBlock`
- `flickrLogoSolid`
- `flipboardLogo`
- `flipboardLogoBlock`
- `flipboardLogoSolid`
- `flutterLogo`
- `flutterLogoBlock`
- `flutterLogoSolid`
- `foodSpottingLogo1`
- `foodSpottingLogo1Block`
- `foodSpottingLogo1Solid`
- `foodSpottingLogo2`
- `foodSpottingLogo2Block`
- `foodSpottingLogo2Solid`
- `formspirngLogo`
- `formspirngLogoBlock`
- `formspirngLogoSolid`
- `forrstLogo`
- `forrstLogoBlock`
- `forrstLogoSolid`
- `foursquareLogo`
- `foursquareLogo1`
- `foursquareLogo1Block`
- `foursquareLogo1Solid`
- `foursquareLogo2`
- `foursquareLogo2Block`
- `foursquareLogo2Solid`
- `foursquareLogoBlock`
- `foursquareLogoSolid`
- `framerLogo`
- `framerLogoBlock`
- `framerLogoSolid`
- `friendsFeedLogo`
- `friendsFeedLogoBlock`
- `friendsFeedLogoSolid`
- `funimationLogo`
- `funimationLogoBlock`
- `funimationLogoSolid`
- `gabbrLogo`
- `gabbrLogoBlock`
- `gabbrLogoSolid`
- `gamercasteringLogo`
- `gamercasteringLogoBlock`
- `gamercasteringLogoSolid`
- `gdgtLogo`
- `gdgtLogoBlock`
- `gdgtLogoSolid`
- `geforceNowLogo`
- `geforceNowLogoBlock`
- `geforceNowLogoSolid`
- `githubLogo1`
- `githubLogo1Block`
- `githubLogo1Solid`
- `githubLogo2`
- `githubLogo2Block`
- `githubLogo2Solid`
- `gogComLogo`
- `gogComLogoBlock`
- `gogComLogoSolid`
- `googleAdsLogo`
- `googleAdsLogoBlock`
- `googleAdsLogoSolid`
- `googleAdsenseLogo`
- `googleAdsenseLogoBlock`
- `googleAdsenseLogoSolid`
- `googleAssistantLogo`
- `googleAssistantLogoBlock`
- `googleAssistantLogoSolid`
- `googleBuzzLogo`
- `googleBuzzLogoBlock`
- `googleBuzzLogoSolid`
- `googleCalendarLogo`
- `googleCalendarLogoBlock`
- `googleCalendarLogoSolid`
- `googleCastLogo`
- `googleCastLogoBlock`
- `googleCastLogoSolid`
- `googleChatLogo`
- `googleChatLogoBlock`
- `googleChatLogoSolid`
- `googleCloudLogo`
- `googleCloudLogoBlock`
- `googleCloudLogoSolid`
- `googleDriveLogo1`
- `googleDriveLogo1Block`
- `googleDriveLogo1Solid`
- `googleDriveLogo2`
- `googleDriveLogo2Block`
- `googleDriveLogo2Solid`
- `googleFitLogo`
- `googleFitLogoBlock`
- `googleFitLogoSolid`
- `googleHangoutsChatLogo`
- `googleHangoutsChatLogoBlock`
- `googleHangoutsChatLogoSolid`
- `googleHangoutsLogo`
- `googleHangoutsLogoBlock`
- `googleHangoutsLogoSolid`
- `googleHangoutsMeetLogo`
- `googleHangoutsMeetLogoBlock`
- `googleHangoutsMeetLogoSolid`
- `googleHomeLogo`
- `googleHomeLogoBlock`
- `googleHomeLogoSolid`
- `googleLensLogo`
- `googleLensLogoBlock`
- `googleLensLogoSolid`
- `googleLogo`
- `googleLogoBlock`
- `googleLogoSolid`
- `googleMailLogo`
- `googleMailLogoBlock`
- `googleMailLogoSolid`
- `googleMapsLogo`
- `googleMapsLogoBlock`
- `googleMapsLogoSolid`
- `googleMeetLogo`
- `googleMeetLogoBlock`
- `googleMeetLogoSolid`
- `googleMicrophoneVoiceSearchLogo`
- `googleMicrophoneVoiceSearchLogoBlock`
- `googleMicrophoneVoiceSearchLogoSolid`
- `googleNearByLogo`
- `googleNearByLogoBlock`
- `googleNearByLogoSolid`
- `googleNewsLogo`
- `googleNewsLogoBlock`
- `googleNewsLogoSolid`
- `googlePhotosLogo`
- `googlePhotosLogoBlock`
- `googlePhotosLogoSolid`
- `googlePlayLogo`
- `googlePlayLogoBlock`
- `googlePlayLogoSolid`
- `googlePlusLogo1`
- `googlePlusLogo1Block`
- `googlePlusLogo1Solid`
- `googlePlusLogo2`
- `googlePlusLogo2Block`
- `googlePlusLogo2Solid`
- `googlePodcastLogo`
- `googlePodcastLogoBlock`
- `googlePodcastLogoSolid`
- `googleShoppingLogo`
- `googleShoppingLogoBlock`
- `googleShoppingLogoSolid`
- `googleStadiaLogo`
- `googleStadiaLogoBlock`
- `googleStadiaLogoSolid`
- `googleSurveysLogo`
- `googleSurveysLogoBlock`
- `googleSurveysLogoSolid`
- `googleTabManagerLogo`
- `googleTabManagerLogoBlock`
- `googleTabManagerLogoSolid`
- `googleTalkLogo`
- `googleTalkLogoBlock`
- `googleTalkLogoSolid`
- `gowallaLogo1`
- `gowallaLogo1Block`
- `gowallaLogo1Solid`
- `gowallaLogo2`
- `gowallaLogo2Block`
- `gowallaLogo2Solid`
- `gowallaLogo3`
- `gowallaLogo3Block`
- `gowallaLogo3Solid`
- `gowallaLogo4`
- `gowallaLogo4Block`
- `gowallaLogo4Solid`
- `groovesharkLogo`
- `groovesharkLogoBlock`
- `groovesharkLogoSolid`
- `guildedingLogo`
- `guildedingLogoBlock`
- `guildedingLogoSolid`
- `hboMaxLogo`
- `hboMaxLogoBlock`
- `hboMaxLogoSolid`
- `hiFiveLogo`
- `hiFiveLogoBlock`
- `hiFiveLogoSolid`
- `huluLiveTvLogo`
- `huluLiveTvLogoBlock`
- `huluLiveTvLogoSolid`
- `hyvesLogo`
- `hyvesLogoBlock`
- `hyvesLogoSolid`
- `iconjarLogo`
- `iconjarLogoBlock`
- `iconjarLogoSolid`
- `iconmoonLogo`
- `iconmoonLogoBlock`
- `iconmoonLogoSolid`
- `icqLogo1`
- `icqLogo1Block`
- `icqLogo1Solid`
- `identicaLogo`
- `identicaLogoBlock`
- `identicaLogoSolid`
- `imdbLogo`
- `imdbLogoBlock`
- `imdbLogoSolid`
- `imessageLogo`
- `imessageLogoBlock`
- `imessageLogoSolid`
- `imgurLogo`
- `imgurLogoBlock`
- `imgurLogoSolid`
- `inkscapeLogo`
- `inkscapeLogoBlock`
- `inkscapeLogoSolid`
- `instagramLogo1`
- `instagramLogo1Block`
- `instagramLogo1Solid`
- `instagramLogo2`
- `instagramLogo2Block`
- `instagramLogo2Solid`
- `instapaperLogo`
- `instapaperLogoBlock`
- `instapaperLogoSolid`
- `invisionLogo`
- `invisionLogoBlock`
- `invisionLogoSolid`
- `iqLogo2`
- `iqLogo2Block`
- `iqLogo2Solid`
- `ircGalleriaLogo`
- `ircGalleriaLogoBlock`
- `ircGalleriaLogoSolid`
- `itunesLogo`
- `itunesLogoBlock`
- `itunesLogoSolid`
- `iwiwLogo1`
- `iwiwLogo1Block`
- `iwiwLogo1Solid`
- `iwiwLogo2`
- `iwiwLogo2Block`
- `iwiwLogo2Solid`
- `jiraSoftwareLogo1`
- `jiraSoftwareLogo1Block`
- `jiraSoftwareLogo1Solid`
- `jiraSoftwareLogo2`
- `jiraSoftwareLogo2Block`
- `jiraSoftwareLogo2Solid`
- `jpegLogo`
- `jpegLogoBlock`
- `jpegLogoSolid`
- `kaiOsLogo`
- `kaiOsLogoBlock`
- `kaiOsLogoSolid`
- `kakaoTalkLogo`
- `kakaoTalkLogoBlock`
- `kakaoTalkLogoSolid`
- `kibanaLogo`
- `kibanaLogoBlock`
- `kibanaLogoSolid`
- `kickLogoLogo`
- `kickLogoLogoBlock`
- `kickLogoLogoSolid`
- `kikLogo1`
- `kikLogo1Block`
- `kikLogo1Solid`
- `kikLogo2`
- `kikLogo2Block`
- `kikLogo2Solid`
- `kodiLogo`
- `kodiLogoBlock`
- `kodiLogoSolid`
- `kotlinLogo`
- `kotlinLogoBlock`
- `kotlinLogoSolid`
- `laravelLogo1`
- `laravelLogo1Block`
- `laravelLogo1Solid`
- `laravelLogo2`
- `laravelLogo2Block`
- `laravelLogo2Solid`
- `lastfmLogo`
- `lastfmLogoBlock`
- `lastfmLogoSolid`
- `lastpassLogo`
- `lastpassLogoBlock`
- `lastpassLogoSolid`
- `lineAppLogo`
- `lineAppLogoBlock`
- `lineAppLogoSolid`
- `lineageLogo`
- `lineageLogoBlock`
- `lineageLogoSolid`
- `linkedinLogo`
- `linkedinLogoBlock`
- `linkedinLogoSolid`
- `linuxMintLogo1`
- `linuxMintLogo1Block`
- `linuxMintLogo1Solid`
- `linuxMintLogo2`
- `linuxMintLogo2Block`
- `linuxMintLogo2Solid`
- `livejournalLogo`
- `livejournalLogoBlock`
- `livejournalLogoSolid`
- `logmeinLogo1`
- `logmeinLogo1Block`
- `logmeinLogo1Solid`
- `logmeinLogo2`
- `logmeinLogo2Block`
- `logmeinLogo2Solid`
- `logo`
- `loomLogo`
- `loomLogoBlock`
- `loomLogoSolid`
- `lubuntuLogo`
- `lubuntuLogoBlock`
- `lubuntuLogoSolid`
- `lyftLogo`
- `lyftLogoBlock`
- `lyftLogoSolid`
- `macFinderLogo`
- `macFinderLogoBlock`
- `macFinderLogoSolid`
- `macosOsxLogo`
- `macosOsxLogoBlock`
- `macosOsxLogoSolid`
- `magentoLogo`
- `magentoLogoBlock`
- `magentoLogoSolid`
- `manjaroLogo`
- `manjaroLogoBlock`
- `manjaroLogoSolid`
- `mastercardLogo`
- `mastercardLogoBlock`
- `mastercardLogoSolid`
- `mastodonLogo1`
- `mastodonLogo1Block`
- `mastodonLogo1Solid`
- `mastodonLogo2`
- `mastodonLogo2Block`
- `mastodonLogo2Solid`
- `mastodonLogo3`
- `mastodonLogo3Block`
- `mastodonLogo3Solid`
- `mayaLogo`
- `mayaLogoBlock`
- `mayaLogoSolid`
- `mcafeeLogo`
- `mcafeeLogoBlock`
- `mcafeeLogoSolid`
- `mediumLogo1`
- `mediumLogo1Block`
- `mediumLogo1Solid`
- `mediumLogo2`
- `mediumLogo2Block`
- `mediumLogo2Solid`
- `mediumLogo3`
- `mediumLogo3Block`
- `mediumLogo3Solid`
- `meetupLogo`
- `meetupLogoBlock`
- `meetupLogoSolid`
- `memoriLogo`
- `memoriLogoBlock`
- `memoriLogoSolid`
- `messagesLogo`
- `messagesLogoBlock`
- `messagesLogoSolid`
- `metaCafeLogo`
- `metaCafeLogoBlock`
- `metaCafeLogoSolid`
- `microsoftAzureLogo`
- `microsoftAzureLogoBlock`
- `microsoftAzureLogoSolid`
- `microsoftDynamicsLogo`
- `microsoftDynamicsLogoBlock`
- `microsoftDynamicsLogoSolid`
- `microsoftLogo`
- `microsoftLogoBlock`
- `microsoftLogoSolid`
- `microsoftOnedriveLogo1`
- `microsoftOnedriveLogo1Block`
- `microsoftOnedriveLogo1Solid`
- `microsoftOnedriveLogo2`
- `microsoftOnedriveLogo2Block`
- `microsoftOnedriveLogo2Solid`
- `microsoftSharepointLogo`
- `microsoftSharepointLogoBlock`
- `microsoftSharepointLogoSolid`
- `microsoftTeamsLogo`
- `microsoftTeamsLogoBlock`
- `microsoftTeamsLogoSolid`
- `microsoftWindowsLogo1`
- `microsoftWindowsLogo1Block`
- `microsoftWindowsLogo1Solid`
- `microsoftWindowsLogo2`
- `microsoftWindowsLogo2Block`
- `microsoftWindowsLogo2Solid`
- `microsoftWindowsLogo3`
- `microsoftWindowsLogo3Block`
- `microsoftWindowsLogo3Solid`
- `microsoftYammerLogo1`
- `microsoftYammerLogo1Block`
- `microsoftYammerLogo1Solid`
- `microsoftYammerLogo2`
- `microsoftYammerLogo2Block`
- `microsoftYammerLogo2Solid`
- `midiLogo`
- `midiLogoBlock`
- `midiLogoSolid`
- `mixxLogo`
- `mixxLogoBlock`
- `mixxLogoSolid`
- `mobileMeLogo`
- `mobileMeLogoBlock`
- `mobileMeLogoSolid`
- `mrWongLogo`
- `mrWongLogoBlock`
- `mrWongLogoSolid`
- `msnMessengerLogo`
- `msnMessengerLogoBlock`
- `msnMessengerLogoSolid`
- `mubiLogo`
- `mubiLogoBlock`
- `mubiLogoSolid`
- `mxLinuxLogo`
- `mxLinuxLogoBlock`
- `mxLinuxLogoSolid`
- `mySpaceLogo`
- `mySpaceLogoBlock`
- `mySpaceLogoSolid`
- `nestWifiLogo`
- `nestWifiLogoBlock`
- `nestWifiLogoSolid`
- `netflixLogo`
- `netflixLogoBlock`
- `netflixLogoSolid`
- `newsvineLogo`
- `newsvineLogoBlock`
- `newsvineLogoSolid`
- `nexopiaLogo`
- `nexopiaLogoBlock`
- `nexopiaLogoSolid`
- `niconicoLogo1`
- `niconicoLogo1Block`
- `niconicoLogo1Solid`
- `niconicoLogo2`
- `niconicoLogo2Block`
- `niconicoLogo2Solid`
- `nintendoNetworkLogo`
- `nintendoNetworkLogoBlock`
- `nintendoNetworkLogoSolid`
- `nintendoSwitchLogo`
- `nintendoSwitchLogoBlock`
- `nintendoSwitchLogoSolid`
- `nomadListLogo`
- `nomadListLogoBlock`
- `nomadListLogoSolid`
- `nukeLogo`
- `nukeLogoBlock`
- `nukeLogoSolid`
- `obsStudioLogo`
- `obsStudioLogoBlock`
- `obsStudioLogoSolid`
- `oculusLogo`
- `oculusLogoBlock`
- `oculusLogoSolid`
- `odnoklassnikiLogo`
- `odnoklassnikiLogoBlock`
- `odnoklassnikiLogoSolid`
- `openAccessLogo`
- `openAccessLogoBlock`
- `openAccessLogoSolid`
- `openContainerInitiativeLogo`
- `openContainerInitiativeLogoBlock`
- `openContainerInitiativeLogoSolid`
- `openaiLogo`
- `openaiLogoBlock`
- `openaiLogoSolid`
- `openvpnLogo`
- `openvpnLogoBlock`
- `openvpnLogoSolid`
- `oracleLogo`
- `oracleLogoBlock`
- `oracleLogoSolid`
- `originLogo`
- `originLogoBlock`
- `originLogoSolid`
- `orkutLogo`
- `orkutLogoBlock`
- `orkutLogoSolid`
- `osmcLogo`
- `osmcLogoBlock`
- `osmcLogoSolid`
- `overcastLogo`
- `overcastLogoBlock`
- `overcastLogoSolid`
- `pathLogo`
- `pathLogoBlock`
- `pathLogoSolid`
- `patreonLogo`
- `patreonLogoBlock`
- `patreonLogoSolid`
- `paypalLogo`
- `paypalLogoBlock`
- `paypalLogoSolid`
- `photobucketLogoBlock`
- `photobucketLogoSolid`
- `picasaLogo`
- `picasaLogoBlock`
- `picasaLogoSolid`
- `pingchatLogo`
- `pingchatLogoBlock`
- `pingchatLogoSolid`
- `pinterestLogo`
- `pinterestLogoBlock`
- `pinterestLogoSolid`
- `pixabayLogo`
- `pixabayLogoBlock`
- `pixabayLogoSolid`
- `playerMeLogo`
- `playerMeLogoBlock`
- `playerMeLogoSolid`
- `playerfmLogo`
- `playerfmLogoBlock`
- `playerfmLogoSolid`
- `playstationLogo`
- `playstationLogoBlock`
- `playstationLogoSolid`
- `plurkLogo1`
- `plurkLogo1AlternateBlock`
- `plurkLogo1Solid`
- `plurkLogo2`
- `plurkLogo2Block`
- `plurkLogo2Solid`
- `plurkLogo3`
- `plurkLogo3Block`
- `plurkLogo3Solid`
- `pocketCastsLogo`
- `pocketCastsLogoBlock`
- `pocketCastsLogoSolid`
- `protoIoLogo1`
- `protoIoLogo1Block`
- `protoIoLogo1Solid`
- `protoIoLogo2`
- `protoIoLogo2Block`
- `protoIoLogo2Solid`
- `protonmailLogo1`
- `protonmailLogo1Block`
- `protonmailLogo1Solid`
- `protonmailLogo2`
- `protonmailLogo2Block`
- `protonmailLogo2Solid`
- `proxmoxLogo`
- `proxmoxLogoBlock`
- `proxmoxLogoSolid`
- `qikLogo`
- `qikLogoBlock`
- `qikLogoSolid`
- `qqLogo`
- `qqLogoBlock`
- `qqLogoSolid`
- `qualcommLogo`
- `qualcommLogoBlock`
- `qualcommLogoSolid`
- `rdioLogo`
- `rdioLogoBlock`
- `rdioLogoSolid`
- `reasonStudiosLogo`
- `reasonStudiosLogoBlock`
- `reasonStudiosLogoSolid`
- `redditLogo`
- `redditLogoBlock`
- `redditLogoSolid`
- `renrenLogo1`
- `renrenLogo1Block`
- `renrenLogo1Solid`
- `renrenLogo2`
- `renrenLogo2Block`
- `renrenLogo2Solid`
- `renrenLogo3`
- `renrenLogo3Block`
- `renrenLogo3Solid`
- `retweetLogo`
- `retweetLogoBlock`
- `retweetLogoSolid`
- `riotGamesLogo`
- `riotGamesLogoBlock`
- `riotGamesLogoSolid`
- `rssFeedLogo`
- `rssFeedLogoBlock`
- `rssFeedLogoSolid`
- `shadowTechLogo`
- `shadowTechLogoBlock`
- `shadowTechLogoSolid`
- `shazamLogo`
- `shazamLogoBlock`
- `shazamLogoSolid`
- `sinaWeiboLogo`
- `sinaWeiboLogoBlock`
- `sinaWeiboLogoSolid`
- `sketchLogo`
- `sketchLogoBlock`
- `sketchLogoSolid`
- `skypeLogo1`
- `skypeLogo1Block`
- `skypeLogo1Solid`
- `skypeLogo2`
- `skypeLogo2Block`
- `skypeLogo2Solid`
- `slackLogo`
- `slackLogoBlock`
- `slackLogoSolid`
- `slashDotLogo`
- `slashDotLogoBlock`
- `slashDotLogoSolid`
- `slideShareLogo`
- `slideShareLogoBlock`
- `slideShareLogoSolid`
- `smugMugLogo`
- `smugMugLogoBlock`
- `smugMugLogoSolid`
- `snapchatLogo`
- `snapchatLogoBlock`
- `snapchatLogoSolid`
- `snapdragonLogo`
- `snapdragonLogoBlock`
- `snapdragonLogoSolid`
- `soundcloudLogo`
- `soundcloudLogoBlock`
- `soundcloudLogoSolid`
- `sparkLogo`
- `sparkLogoBlock`
- `sparkLogoSolid`
- `spinrillaLogo`
- `spinrillaLogoBlock`
- `spinrillaLogoSolid`
- `spotifyLogo`
- `spotifyLogoBlock`
- `spotifyLogoSolid`
- `squareEnixLogo`
- `squareEnixLogoBlock`
- `squareEnixLogoSolid`
- `squidooLogo`
- `squidooLogoBlock`
- `squidooLogoSolid`
- `stackoverflowLogo`
- `stackoverflowLogoBlock`
- `stackoverflowLogoSolid`
- `steamLogoBlock`
- `steamLogoSolid`
- `steinbergLogo`
- `steinbergLogoBlock`
- `steinbergLogoSolid`
- `stellarLogo`
- `stellarLogoBlock`
- `stellarLogoSolid`
- `stitcherLogo1`
- `stitcherLogo1Block`
- `stitcherLogo1Solid`
- `stitcherLogo2`
- `stitcherLogo2Block`
- `stitcherLogo2Solid`
- `streamLogo`
- `streamingLogo`
- `streamingLogoBlock`
- `streamingLogoSolid`
- `streamplayLogo`
- `streamplayLogoBlock`
- `streamplayLogoSolid`
- `stripeLogo`
- `stripeLogoBlock`
- `stripeLogoSolid`
- `studenCircleNetworkLogo`
- `studenCircleNetworkLogoBlock`
- `studenCircleNetworkLogoSolid`
- `stumbleUpon2ingLogo`
- `stumbleUpon2ingLogoBlock`
- `stumbleUpon2ingLogoSolid`
- `stumbleUpong1ingLogo`
- `stumbleUpong1ingLogoBlock`
- `stumbleUpong1ingLogoSolid`
- `tedLogo`
- `tedLogoBlock`
- `tedLogoSolid`
- `telegramLogo1`
- `telegramLogo1Block`
- `telegramLogo1Solid`
- `telegramLogo2`
- `telegramLogo2Block`
- `telegramLogo2Solid`
- `tencentWeiboingLogo`
- `tencentWeiboingLogoBlock`
- `tencentWeiboingLogoSolid`
- `threadBlockLogoBlock`
- `threadLogo`
- `threadLogoLogoSolid`
- `tidalLogo`
- `tidalLogoBlock`
- `tidalLogoSolid`
- `tiktokLogo`
- `tiktokLogoBlock`
- `tiktokLogoSolid`
- `tinderLogo`
- `tinderLogoBlock`
- `tinderLogoSolid`
- `trelloLogo`
- `trelloLogoBlock`
- `trelloLogoSolid`
- `tuentiLogo`
- `tuentiLogoBlock`
- `tuentiLogoSolid`
- `tumblrLogo`
- `tumblrLogoBlock`
- `tumblrLogoSolid`
- `tuneinLogo`
- `tuneinLogoBlock`
- `tuneinLogoSolid`
- `twitchLogo`
- `twitchLogoBlock`
- `twitchLogoSolid`
- `twitterLogo1`
- `twitterLogo1Block`
- `twitterLogo1Solid`
- `twitterLogo2`
- `twitterLogo2Block`
- `twitterLogo2Solid`
- `ubisoftLogo`
- `ubisoftLogoBlock`
- `ubisoftLogoSolid`
- `unrealEngineLogo`
- `unrealEngineLogoBlock`
- `unrealEngineLogoSolid`
- `unspashLogo`
- `unspashLogoBlock`
- `unspashLogoSolid`
- `uplabsLogo`
- `uplabsLogoBlock`
- `uplabsLogoSolid`
- `vKontakteLogo`
- `vKontakteLogoBlock`
- `vKontakteLogoSolid`
- `viddlerLogo`
- `viddlerLogoBlock`
- `viddlerLogoSolid`
- `vimeoLogo`
- `vimeoLogoBlock`
- `vimeoLogoSolid`
- `virustotalLogo`
- `virustotalLogoBlock`
- `virustotalLogoSolid`
- `visaLogo`
- `visaLogoBlock`
- `visaLogoSolid`
- `vlcLogo`
- `vlcLogoBlock`
- `vlcLogoSolid`
- `vodafoneLogo`
- `vodafoneLogoBlock`
- `vodafoneLogoSolid`
- `vortexLogo1`
- `vortexLogo1Block`
- `vortexLogo1Solid`
- `vortexLogo2`
- `vortexLogo2Block`
- `vortexLogo2Solid`
- `vrayLogo`
- `vrayLogoBlock`
- `vrayLogoSolid`
- `w3Logo`
- `w3LogoBlock`
- `w3LogoSolid`
- `wearOsLogo`
- `wearOsLogoBlock`
- `wearOsLogoSolid`
- `wechatLogo`
- `wechatLogoBlock`
- `wechatLogoSolid`
- `wechatPayLogo`
- `wechatPayLogoBlock`
- `wechatPayLogoSolid`
- `wetvLogo`
- `wetvLogoBlock`
- `wetvLogoSolid`
- `whatsappLogo`
- `whatsappLogoBlock`
- `whatsappLogoSolid`
- `whitesourceLogo1`
- `whitesourceLogo1Block`
- `whitesourceLogo1Solid`
- `whitesourceLogo2`
- `whitesourceLogo2Block`
- `whitesourceLogo2Solid`
- `whitesourceLogo3`
- `whitesourceLogo3Block`
- `whitesourceLogo3Solid`
- `wipLogo`
- `wipLogoBlock`
- `wipLogoSolid`
- `wiseLogo`
- `wiseLogoBlock`
- `wiseLogoSolid`
- `woocommerceLogo`
- `woocommerceLogoBlock`
- `woocommerceLogoSolid`
- `wordpressLogo1`
- `wordpressLogo1Block`
- `wordpressLogo1Solid`
- `wordpressLogo2`
- `wordpressLogo2Block`
- `wordpressLogo2Solid`
- `xTwitterLogo`
- `xTwitterLogoBlock`
- `xTwitterLogoSolid`
- `xboxLiveLogo`
- `xboxLiveLogoBlock`
- `xboxLiveLogoSolid`
- `xingLogo`
- `xingLogoBlock`
- `xingLogoSolid`
- `xsplitLogo`
- `xsplitLogoBlock`
- `xsplitLogoSolid`
- `yahooLogo`
- `yahooLogoBlock`
- `yahooLogoSolid`
- `yelpLogo`
- `yelpLogoBlock`
- `yelpLogoSolid`
- `youtubeClipLogo`
- `youtubeClipLogoBlock`
- `youtubeClipLogoSolid`
- `youtubeGamingLogo1`
- `youtubeGamingLogo1Block`
- `youtubeGamingLogo1Solid`
- `youtubeGamingLogo2`
- `youtubeGamingLogo2Block`
- `youtubeGamingLogo2Solid`
- `youtubeGamingLogo3`
- `youtubeGamingLogo3Block`
- `youtubeGamingLogo3Solid`
- `youtubeLogo`
- `youtubeLogoBlock`
- `youtubeLogoSolid`
- `youtubeMusicLogo`
- `youtubeMusicLogoBlock`
- `youtubeMusicLogoSolid`
- `youtubeStudioLogo`
- `youtubeStudioLogoBlock`
- `youtubeStudioLogoSolid`
- `youtubeTvLogo`
- `youtubeTvLogoBlock`
- `youtubeTvLogoSolid`
- `zWaveLogo`
- `zWaveLogoBlock`
- `zWaveLogoSolid`
- `zcoolLogo1`
- `zcoolLogo1Block`
- `zcoolLogo1Solid`
- `zcoolLogo2`
- `zcoolLogo2Block`
- `zcoolLogo2Solid`
- `zoomLogo1`
- `zoomLogo1Block`
- `zoomLogo1Solid`
- `zoomLogo2`
- `zoomLogo2Block`
- `zoomLogo2Solid`
- `zootoolLogo`
- `zootoolLogoBlock`
- `zootoolLogoSolid`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><3dsMaxLogoIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dsMaxLogoBlockIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dsMaxLogoSolidIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><500pxLogo1Icon size="20" class="nav-icon" /> Settings</a>
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
<3dsMaxLogoIcon
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
    <3dsMaxLogoIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dsMaxLogoBlockIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dsMaxLogoSolidIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <3dsMaxLogoIcon size="24" />
   <3dsMaxLogoBlockIcon size="24" color="#4a90e2" />
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
   <3dsMaxLogoIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <3dsMaxLogoIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <3dsMaxLogoIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 3dsMaxLogo } from '@stacksjs/iconify-streamline-logos'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(3dsMaxLogo, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3dsMaxLogo } from '@stacksjs/iconify-streamline-logos'

// Icons are typed as IconData
const myIcon: IconData = 3dsMaxLogo
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/streamline-logos/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/streamline-logos/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
