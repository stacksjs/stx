# SVG Logos

> SVG Logos icons for stx from Iconify

## Overview

This package provides access to 2063 icons from the SVG Logos collection through the stx iconify integration.

**Collection ID:** `logos`
**Total Icons:** 2063
**Author:** Gil Barbara ([Website](https://github.com/gilbarbara/logos))
**License:** CC0 ([Details](https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt))
**Category:** Logos
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-logos
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<100tbIcon height="1em" />
<100tbIcon width="1em" height="1em" />
<100tbIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<100tbIcon size="24" />
<100tbIcon size="1em" />

<!-- Using width and height -->
<100tbIcon width="24" height="32" />

<!-- With color -->
<100tbIcon size="24" color="red" />
<100tbIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<100tbIcon size="24" class="icon-primary" />

<!-- With all properties -->
<100tbIcon
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
    <100tbIcon size="24" />
    <500pxIcon size="24" color="#4a90e2" />
    <6pxIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 100tb, 500px, 6px } from '@stacksjs/iconify-logos'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(100tb, { size: 24 })
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

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<100tbIcon size="24" color="red" />
<100tbIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<100tbIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<100tbIcon size="24" class="text-primary" />
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
<100tbIcon height="1em" />
<100tbIcon width="1em" height="1em" />
<100tbIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<100tbIcon size="24" />
<100tbIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.logos-icon {
  width: 1em;
  height: 1em;
}
```

```html
<100tbIcon class="logos-icon" />
```

## Available Icons

This package contains **2063** icons:

- `100tb`
- `500px`
- `6px`
- `activeCampaign`
- `activeCampaignIcon`
- `admob`
- `adobe`
- `adobeAfterEffects`
- `adobeAnimate`
- `adobeDreamweaver`
- `adobeIcon`
- `adobeIllustrator`
- `adobeIncopy`
- `adobeIndesign`
- `adobeLightroom`
- `adobePhotoshop`
- `adobePremiere`
- `adobeXd`
- `adonisjs`
- `adonisjsIcon`
- `adroll`
- `adyen`
- `aerogear`
- `aerospike`
- `aerospikeIcon`
- `aha`
- `ai`
- `airbnb`
- `airbnbIcon`
- `airbrake`
- `airflow`
- `airflowIcon`
- `airtable`
- `aix`
- `akamai`
- `akka`
- `alfresco`
- `algolia`
- `alpinejs`
- `alpinejsIcon`
- `altair`
- `amazonChime`
- `amazonConnect`
- `amd`
- `amex`
- `amexDigital`
- `amp`
- `ampIcon`
- `ampersand`
- `amplication`
- `amplicationIcon`
- `amplitude`
- `amplitudeIcon`
- `analog`
- `android`
- `androidIcon`
- `androidVertical`
- `angellist`
- `angular`
- `angularIcon`
- `ansible`
- `antDesign`
- `anthropic`
- `anthropicIcon`
- `apache`
- `apacheCamel`
- `apacheCloudstack`
- `apacheFlink`
- `apacheFlinkIcon`
- `apacheSpark`
- `apacheSuperset`
- `apacheSupersetIcon`
- `apiAi`
- `apiary`
- `apidog`
- `apidogIcon`
- `apigee`
- `apitools`
- `apollostack`
- `apostrophe`
- `appbase`
- `appbaseio`
- `appbaseioIcon`
- `appcelerator`
- `appcenter`
- `appcenterIcon`
- `appcircle`
- `appcircleIcon`
- `appcode`
- `appdynamics`
- `appdynamicsIcon`
- `appfog`
- `apphub`
- `appium`
- `apple`
- `appleAppStore`
- `applePay`
- `applitools`
- `applitoolsIcon`
- `appmaker`
- `apportable`
- `appsignal`
- `appsignalIcon`
- `apptentive`
- `appveyor`
- `appwrite`
- `appwriteIcon`
- `arangodb`
- `arangodbIcon`
- `arc`
- `architect`
- `architectIcon`
- `archlinux`
- `arduino`
- `argo`
- `argoIcon`
- `arm`
- `armory`
- `armoryIcon`
- `asana`
- `asanaIcon`
- `asciidoctor`
- `assembla`
- `assemblaIcon`
- `astro`
- `astroIcon`
- `astronomer`
- `asyncApi`
- `asyncApiIcon`
- `atlassian`
- `atom`
- `atomIcon`
- `atomic`
- `atomicIcon`
- `atomicojs`
- `atomicojsIcon`
- `aurelia`
- `aurora`
- `aurous`
- `auth0`
- `auth0Icon`
- `authy`
- `autocode`
- `autoit`
- `autoprefixer`
- `ava`
- `awesome`
- `aws`
- `awsAmplify`
- `awsApiGateway`
- `awsAppMesh`
- `awsAppflow`
- `awsAppsync`
- `awsAthena`
- `awsAurora`
- `awsBackup`
- `awsBatch`
- `awsCertificateManager`
- `awsCloudformation`
- `awsCloudfront`
- `awsCloudsearch`
- `awsCloudtrail`
- `awsCloudwatch`
- `awsCodebuild`
- `awsCodecommit`
- `awsCodedeploy`
- `awsCodepipeline`
- `awsCodestar`
- `awsCognito`
- `awsConfig`
- `awsDocumentdb`
- `awsDynamodb`
- `awsEc2`
- `awsEcs`
- `awsEks`
- `awsElasticBeanstalk`
- `awsElasticCache`
- `awsElasticache`
- `awsElb`
- `awsEventbridge`
- `awsFargate`
- `awsGlacier`
- `awsGlue`
- `awsIam`
- `awsKeyspaces`
- `awsKinesis`
- `awsKms`
- `awsLakeFormation`
- `awsLambda`
- `awsLightsail`
- `awsMobilehub`
- `awsMq`
- `awsMsk`
- `awsNeptune`
- `awsOpenSearch`
- `awsOpsworks`
- `awsQuicksight`
- `awsRds`
- `awsRedshift`
- `awsRoute53`
- `awsS3`
- `awsSecretsManager`
- `awsSes`
- `awsShield`
- `awsSns`
- `awsSqs`
- `awsStepFunctions`
- `awsSystemsManager`
- `awsTimestream`
- `awsVpc`
- `awsWaf`
- `awsXray`
- `axios`
- `azure`
- `azureIcon`
- `babel`
- `backbone`
- `backboneIcon`
- `backerkit`
- `bakerStreet`
- `balena`
- `bamboo`
- `base`
- `basecamp`
- `basecampIcon`
- `basekit`
- `baseline`
- `bash`
- `bashIcon`
- `batch`
- `beats`
- `behance`
- `bem`
- `bem2`
- `bigpanda`
- `bing`
- `biomejs`
- `biomejsIcon`
- `bitballoon`
- `bitbar`
- `bitbucket`
- `bitcoin`
- `bitnami`
- `bitrise`
- `bitriseIcon`
- `blender`
- `blitzjs`
- `blitzjsIcon`
- `blocs`
- `blogger`
- `blossom`
- `bluemix`
- `blueprint`
- `bluesky`
- `bluetooth`
- `booqable`
- `booqableIcon`
- `bootstrap`
- `bosun`
- `botanalytics`
- `bourbon`
- `bower`
- `bowtie`
- `box`
- `brackets`
- `brainjs`
- `branch`
- `branchIcon`
- `brandfolder`
- `brandfolderIcon`
- `brave`
- `braze`
- `brazeIcon`
- `broadcom`
- `broadcomIcon`
- `broccoli`
- `brotli`
- `browserify`
- `browserifyIcon`
- `browserling`
- `browserslist`
- `browserstack`
- `browsersync`
- `brunch`
- `bubble`
- `bubbleIcon`
- `buck`
- `buddy`
- `buffer`
- `bugherd`
- `bugherdIcon`
- `bugsee`
- `bugsnag`
- `bugsnagIcon`
- `builderIo`
- `builderIoIcon`
- `buildkite`
- `buildkiteIcon`
- `bulma`
- `bun`
- `bunnyNet`
- `bunnyNetIcon`
- `c`
- `cPlusplus`
- `cSharp`
- `cachet`
- `caffe2`
- `cakephp`
- `cakephpIcon`
- `calibre`
- `calibreIcon`
- `campaignmonitor`
- `campaignmonitorIcon`
- `campfire`
- `canjs`
- `capacitorjs`
- `capacitorjsIcon`
- `capistrano`
- `carbide`
- `cardano`
- `cardanoIcon`
- `cassandra`
- `celluloid`
- `centos`
- `centosIcon`
- `certbot`
- `ceylon`
- `chai`
- `chalk`
- `changetip`
- `chargebee`
- `chargebeeIcon`
- `chartblocks`
- `chartjs`
- `chef`
- `chevereto`
- `chroma`
- `chromatic`
- `chromaticIcon`
- `chrome`
- `chromeWebStore`
- `cinder`
- `circleci`
- `cirrus`
- `cirrusCi`
- `claude`
- `claudeIcon`
- `clickdeploy`
- `clioLang`
- `clion`
- `cljs`
- `clojure`
- `close`
- `cloud9`
- `cloudacademy`
- `cloudacademyIcon`
- `cloudant`
- `cloudcraft`
- `cloudera`
- `cloudflare`
- `cloudflareIcon`
- `cloudflareWorkers`
- `cloudflareWorkersIcon`
- `cloudinary`
- `cloudinaryIcon`
- `cloudlinux`
- `clusterhq`
- `cobalt`
- `cockpit`
- `cocoapods`
- `coda`
- `codaIcon`
- `codacy`
- `codebase`
- `codebeat`
- `codecademy`
- `codeception`
- `codeclimate`
- `codeclimateIcon`
- `codecov`
- `codecovIcon`
- `codefactor`
- `codefactorIcon`
- `codefund`
- `codefundIcon`
- `codeigniter`
- `codeigniterIcon`
- `codepen`
- `codepenIcon`
- `codepicnic`
- `codepush`
- `codersrank`
- `codersrankIcon`
- `coderwall`
- `codesandbox`
- `codesandboxIcon`
- `codeschool`
- `codesee`
- `codeseeIcon`
- `codeship`
- `codio`
- `codium`
- `codiumIcon`
- `codrops`
- `coffeescript`
- `commitizen`
- `compass`
- `component`
- `componentkit`
- `compose`
- `composeMultiplatform`
- `composer`
- `conanIo`
- `concourse`
- `concrete5`
- `concretecms`
- `concretecmsIcon`
- `conda`
- `confluence`
- `consul`
- `containership`
- `contentful`
- `convox`
- `convoxIcon`
- `copyleft`
- `copyleftPirate`
- `corda`
- `cordova`
- `coreos`
- `coreosIcon`
- `couchbase`
- `couchdb`
- `couchdbIcon`
- `coursera`
- `coveralls`
- `coverity`
- `cpanel`
- `craft`
- `craftcms`
- `crashlytics`
- `crateio`
- `createReactApp`
- `createjs`
- `crittercism`
- `crossBrowserTesting`
- `crossbrowsertesting`
- `crossplane`
- `crossplaneIcon`
- `crowdprocess`
- `crucible`
- `crystal`
- `css3`
- `css3Official`
- `cssnext`
- `cube`
- `cubeIcon`
- `cucumber`
- `curl`
- `customerio`
- `customerioIcon`
- `cyclejs`
- `cypress`
- `cypressIcon`
- `d3`
- `dailydev`
- `dailydevIcon`
- `daisyui`
- `daisyuiIcon`
- `danfo`
- `dapulse`
- `dart`
- `dashlane`
- `dashlaneIcon`
- `dat`
- `dataStation`
- `databaseLabs`
- `datadog`
- `datadogIcon`
- `datagrip`
- `datasette`
- `datasetteIcon`
- `dataspell`
- `datocms`
- `datocmsIcon`
- `dbt`
- `dbtIcon`
- `dcos`
- `dcosIcon`
- `debian`
- `delicious`
- `deliciousBurger`
- `delighted`
- `delightedIcon`
- `deno`
- `dependabot`
- `dependencyci`
- `deploy`
- `deployhq`
- `deployhqIcon`
- `deppbot`
- `derby`
- `descript`
- `descriptIcon`
- `designernews`
- `desk`
- `dev`
- `devIcon`
- `deviantart`
- `deviantartIcon`
- `dgraph`
- `dgraphIcon`
- `dialogflow`
- `digitalOcean`
- `digitalOceanIcon`
- `dimer`
- `dinersclub`
- `discord`
- `discordIcon`
- `discourse`
- `discourseIcon`
- `discover`
- `disqus`
- `distelli`
- `divshot`
- `django`
- `djangoIcon`
- `dockbit`
- `docker`
- `dockerIcon`
- `doctrine`
- `docusaurus`
- `dojo`
- `dojoIcon`
- `dojoToolkit`
- `dolt`
- `dotcloud`
- `dotnet`
- `doubleclick`
- `dovetail`
- `dovetailIcon`
- `dreamfactory`
- `dreamhost`
- `dribbble`
- `dribbbleIcon`
- `drift`
- `drip`
- `drizzle`
- `drizzleIcon`
- `drone`
- `droneIcon`
- `drools`
- `droolsIcon`
- `dropbox`
- `dropmark`
- `dropzone`
- `drupal`
- `drupalIcon`
- `duckduckgo`
- `dynatrace`
- `dynatraceIcon`
- `dyndns`
- `eager`
- `ebanx`
- `eclipse`
- `eclipseIcon`
- `ecma`
- `edgedb`
- `edgio`
- `edgioIcon`
- `editorconfig`
- `effect`
- `effectIcon`
- `effector`
- `egghead`
- `elasticbox`
- `elasticpath`
- `elasticpathIcon`
- `elasticsearch`
- `electron`
- `element`
- `elementalUi`
- `elementary`
- `eleventy`
- `ello`
- `elm`
- `elmClassic`
- `elo`
- `emacs`
- `emacsClassic`
- `embedly`
- `ember`
- `emberTomster`
- `emmet`
- `enact`
- `engineYard`
- `engineYardIcon`
- `envato`
- `envoy`
- `envoyIcon`
- `envoyer`
- `envoyproxy`
- `enyo`
- `epsagon`
- `epsagonIcon`
- `eraser`
- `eraserIcon`
- `erlang`
- `es6`
- `esbuild`
- `esdoc`
- `eslint`
- `eslintOld`
- `eta`
- `etaIcon`
- `etcd`
- `ethereum`
- `ethereumColor`
- `ethers`
- `ethnio`
- `eventbrite`
- `eventbriteIcon`
- `eventsentry`
- `evergreen`
- `evergreenIcon`
- `expo`
- `expoIcon`
- `exponent`
- `express`
- `fabric`
- `fabricIo`
- `facebook`
- `faker`
- `falcor`
- `famous`
- `fastapi`
- `fastapiIcon`
- `fastify`
- `fastifyIcon`
- `fastlane`
- `fastly`
- `fauna`
- `faunaIcon`
- `feathersjs`
- `fedora`
- `fetch`
- `ffmpeg`
- `ffmpegIcon`
- `figma`
- `firebase`
- `firebaseIcon`
- `firefox`
- `flannel`
- `flarum`
- `flask`
- `flatUi`
- `flattr`
- `flattrIcon`
- `fleep`
- `flexibleGs`
- `flickr`
- `flickrIcon`
- `flight`
- `flocker`
- `floodio`
- `flow`
- `flowxo`
- `floydhub`
- `flutter`
- `flux`
- `fluxxor`
- `fly`
- `flyIcon`
- `flyjs`
- `fogbugz`
- `fogbugzIcon`
- `fomo`
- `fomoIcon`
- `fontAwesome`
- `forest`
- `forestadmin`
- `forestadminIcon`
- `forever`
- `formkeep`
- `fortran`
- `foundation`
- `foundationdb`
- `foundationdbIcon`
- `framed`
- `framer`
- `framework7`
- `framework7Icon`
- `freebsd`
- `freedcamp`
- `freedcampIcon`
- `freedomdefined`
- `fresh`
- `frontapp`
- `fsharp`
- `fuchsia`
- `galliumos`
- `gameAnalytics`
- `gameAnalyticsIcon`
- `ganache`
- `ganacheIcon`
- `gatsby`
- `gaugeio`
- `geekbot`
- `geetest`
- `geetestIcon`
- `getSatisfaction`
- `getyourguide`
- `ghost`
- `giantswarm`
- `gin`
- `git`
- `gitIcon`
- `gitboard`
- `github`
- `githubActions`
- `githubCopilot`
- `githubIcon`
- `githubOctocat`
- `gitkraken`
- `gitlab`
- `gitlabIcon`
- `gitter`
- `gitup`
- `glamorous`
- `glamorousIcon`
- `gleam`
- `glimmerjs`
- `glint`
- `glitch`
- `glitchIcon`
- `gnome`
- `gnomeIcon`
- `gnu`
- `gnuNet`
- `gnupg`
- `gnupgIcon`
- `go`
- `gocd`
- `godot`
- `godotIcon`
- `gohorse`
- `goland`
- `gomix`
- `google`
- `google2014`
- `google360suite`
- `googleAdmob`
- `googleAds`
- `googleAdsense`
- `googleAdwords`
- `googleAnalytics`
- `googleBard`
- `googleBardIcon`
- `googleCalendar`
- `googleCloud`
- `googleCloudFunctions`
- `googleCloudPlatform`
- `googleCloudRun`
- `googleCurrents`
- `googleDataStudio`
- `googleDevelopers`
- `googleDevelopersIcon`
- `googleDomains`
- `googleDomainsIcon`
- `googleDrive`
- `googleFit`
- `googleGemini`
- `googleGmail`
- `googleGsuite`
- `googleHome`
- `googleIcon`
- `googleInbox`
- `googleKeep`
- `googleMaps`
- `googleMarketingPlatform`
- `googleMeet`
- `googleOne`
- `googleOptimize`
- `googlePalm`
- `googlePay`
- `googlePayIcon`
- `googlePhotos`
- `googlePlay`
- `googlePlayConsole`
- `googlePlayConsoleIcon`
- `googlePlayIcon`
- `googlePlus`
- `googleSearchConsole`
- `googleTagManager`
- `googleWallet`
- `googleWorkspace`
- `gopher`
- `gordon`
- `gradio`
- `gradioIcon`
- `gradle`
- `grafana`
- `grails`
- `grammarly`
- `grammarlyIcon`
- `grape`
- `graphcool`
- `graphene`
- `graphql`
- `gratipay`
- `grav`
- `gravatar`
- `gravatarIcon`
- `graylog`
- `graylogIcon`
- `greensock`
- `greensockIcon`
- `gridsome`
- `gridsomeIcon`
- `grommet`
- `groovehq`
- `grove`
- `growthBook`
- `growthBookIcon`
- `grpc`
- `grunt`
- `gulp`
- `gunicorn`
- `gunjs`
- `gusto`
- `gwt`
- `hack`
- `hackerOne`
- `hadoop`
- `haiku`
- `haikuIcon`
- `haml`
- `hanami`
- `handlebars`
- `hapi`
- `hardhat`
- `hardhatIcon`
- `harness`
- `harnessIcon`
- `harrow`
- `hashicorp`
- `hashicorpIcon`
- `hashnode`
- `hashnodeIcon`
- `haskell`
- `haskellIcon`
- `hasura`
- `hasuraIcon`
- `haxe`
- `haxl`
- `hbase`
- `hcaptcha`
- `hcaptchaIcon`
- `headlessui`
- `headlessuiIcon`
- `heap`
- `heapIcon`
- `helm`
- `helpscout`
- `helpscoutIcon`
- `hermes`
- `heroku`
- `herokuIcon`
- `herokuRedis`
- `heron`
- `hexo`
- `hhvm`
- `hibernate`
- `highcharts`
- `hipchat`
- `hipercard`
- `hoa`
- `homebrew`
- `hono`
- `hoodie`
- `hookstate`
- `hootsuite`
- `hootsuiteIcon`
- `horizon`
- `hostedGraphite`
- `hostgator`
- `hostgatorIcon`
- `hotjar`
- `hotjarIcon`
- `houndci`
- `html5`
- `html5Boilerplate`
- `htmx`
- `htmxIcon`
- `httpie`
- `httpieIcon`
- `hubspot`
- `huggingFace`
- `huggingFaceIcon`
- `huggy`
- `hugo`
- `humongous`
- `hyper`
- `hyperapp`
- `ibm`
- `ieee`
- `ietf`
- `ifttt`
- `imagemin`
- `imba`
- `imbaIcon`
- `immer`
- `immerIcon`
- `immutable`
- `impala`
- `importio`
- `importioIcon`
- `incident`
- `incidentIcon`
- `infer`
- `inferno`
- `influxdb`
- `influxdbIcon`
- `ink`
- `insomnia`
- `instagram`
- `instagramIcon`
- `intel`
- `intellijIdea`
- `intercom`
- `intercomIcon`
- `internetComputer`
- `internetComputerIcon`
- `internetexplorer`
- `invision`
- `invisionIcon`
- `io`
- `ionic`
- `ionicIcon`
- `ios`
- `iron`
- `ironIcon`
- `itsalive`
- `itsaliveIcon`
- `jade`
- `jamstack`
- `jamstackIcon`
- `jasmine`
- `java`
- `javascript`
- `jcb`
- `jekyll`
- `jelastic`
- `jelasticIcon`
- `jenkins`
- `jest`
- `jetbrains`
- `jetbrainsIcon`
- `jetbrainsSpace`
- `jetbrainsSpaceIcon`
- `jfrog`
- `jhipster`
- `jhipsterIcon`
- `jira`
- `joomla`
- `jotai`
- `jquery`
- `jqueryMobile`
- `jruby`
- `jsbin`
- `jscs`
- `jsdelivr`
- `jsdom`
- `jsfiddle`
- `json`
- `jsonLd`
- `jsonSchema`
- `jsonSchemaIcon`
- `jspm`
- `jss`
- `juju`
- `julia`
- `jupyter`
- `jwt`
- `jwtIcon`
- `kafka`
- `kafkaIcon`
- `kaios`
- `kallithea`
- `karma`
- `katalon`
- `katalonIcon`
- `kde`
- `keen`
- `kemal`
- `keycdn`
- `keycdnIcon`
- `keydb`
- `keydbIcon`
- `keymetrics`
- `keystonejs`
- `khanAcademy`
- `khanAcademyIcon`
- `kibana`
- `kickstarter`
- `kickstarterIcon`
- `kinto`
- `kintoIcon`
- `kinvey`
- `kirby`
- `kirbyIcon`
- `kissmetrics`
- `kissmetricsMonochromatic`
- `kitematic`
- `kloudless`
- `knex`
- `knockout`
- `koa`
- `kong`
- `kongIcon`
- `kontena`
- `kops`
- `kore`
- `koreio`
- `kotlin`
- `kotlinIcon`
- `kraken`
- `krakenjs`
- `ktor`
- `ktorIcon`
- `kubernetes`
- `kustomer`
- `languagetool`
- `laravel`
- `lastfm`
- `lateral`
- `lateralIcon`
- `launchdarkly`
- `launchdarklyIcon`
- `launchkit`
- `launchrock`
- `leaflet`
- `leankit`
- `leankitIcon`
- `lerna`
- `less`
- `letsCloud`
- `letsencrypt`
- `leveldb`
- `lexical`
- `lexicalIcon`
- `librato`
- `liftweb`
- `lighthouse`
- `lightstep`
- `lightstepIcon`
- `lighttpd`
- `linear`
- `linearIcon`
- `linkedin`
- `linkedinIcon`
- `linkerd`
- `linode`
- `linuxMint`
- `linuxTux`
- `lit`
- `litIcon`
- `litmus`
- `loader`
- `locent`
- `lodash`
- `logentries`
- `loggly`
- `logmatic`
- `logstash`
- `lookback`
- `looker`
- `lookerIcon`
- `loom`
- `loomIcon`
- `loopback`
- `loopbackIcon`
- `losant`
- `lotus`
- `lua`
- `lucene`
- `luceneNet`
- `lumen`
- `lynda`
- `macos`
- `macosx`
- `madge`
- `maestro`
- `mageia`
- `magento`
- `magneto`
- `mailchimp`
- `mailchimpFreddie`
- `maildeveloper`
- `mailgun`
- `mailgunIcon`
- `mailjet`
- `mailjetIcon`
- `malinajs`
- `mandrill`
- `mandrillShield`
- `manifoldjs`
- `manjaro`
- `mantine`
- `mantineIcon`
- `mantl`
- `manuscript`
- `mapbox`
- `mapboxIcon`
- `mapsMe`
- `mapzen`
- `mapzenIcon`
- `mariadb`
- `mariadbIcon`
- `marionette`
- `markdown`
- `marko`
- `marvel`
- `mastercard`
- `mastodon`
- `mastodonIcon`
- `materialUi`
- `materializecss`
- `matomo`
- `matomoIcon`
- `matplotlib`
- `matplotlibIcon`
- `matter`
- `matterIcon`
- `mattermost`
- `mattermostIcon`
- `mautic`
- `mauticIcon`
- `maven`
- `maxcdn`
- `mdn`
- `mdx`
- `meanio`
- `medium`
- `mediumIcon`
- `medusa`
- `medusaIcon`
- `meilisearch`
- `memcached`
- `memgraph`
- `memsql`
- `memsqlIcon`
- `mention`
- `mercurial`
- `mern`
- `mesos`
- `mesosphere`
- `messenger`
- `meta`
- `metaIcon`
- `metabase`
- `metamask`
- `metamaskIcon`
- `meteor`
- `meteorIcon`
- `micro`
- `microIcon`
- `microPython`
- `microcosm`
- `micron`
- `micronIcon`
- `microsoft`
- `microsoftAzure`
- `microsoftEdge`
- `microsoftIcon`
- `microsoftOnedrive`
- `microsoftPowerBi`
- `microsoftTeams`
- `microsoftWindows`
- `microsoftWindowsIcon`
- `mida`
- `midaIcon`
- `middleman`
- `midjourney`
- `milligram`
- `million`
- `millionIcon`
- `milvus`
- `milvusIcon`
- `mindsdb`
- `mindsdbIcon`
- `mintLang`
- `mio`
- `miro`
- `miroIcon`
- `mist`
- `mistralAi`
- `mistralAiIcon`
- `mithril`
- `mixmax`
- `mixpanel`
- `mlab`
- `mobx`
- `mocha`
- `mockflow`
- `mockflowIcon`
- `modernizr`
- `modulus`
- `modx`
- `modxIcon`
- `moltin`
- `moltinIcon`
- `momentjs`
- `monday`
- `mondayIcon`
- `monero`
- `mongodb`
- `mongodbIcon`
- `mongolab`
- `mono`
- `moon`
- `mootools`
- `morpheus`
- `morpheusIcon`
- `mozilla`
- `mparticle`
- `mparticleIcon`
- `mps`
- `mpsIcon`
- `msw`
- `mswIcon`
- `multipass`
- `mysql`
- `mysqlIcon`
- `myth`
- `naiveui`
- `namecheap`
- `nanonets`
- `nasm`
- `nativescript`
- `nats`
- `natsIcon`
- `neat`
- `neo4j`
- `neon`
- `neonIcon`
- `neonmetrics`
- `neovim`
- `nestjs`
- `net`
- `netbeans`
- `netflix`
- `netflixIcon`
- `netlify`
- `netlifyIcon`
- `netuitive`
- `neverinstall`
- `neverinstallIcon`
- `newRelic`
- `newRelicIcon`
- `nextjs`
- `nextjsIcon`
- `nginx`
- `ngrok`
- `nhost`
- `nhostIcon`
- `nightwatch`
- `nimLang`
- `nocodb`
- `nodal`
- `nodeSass`
- `nodebots`
- `nodejitsu`
- `nodejs`
- `nodejsIcon`
- `nodejsIconAlt`
- `nodemon`
- `nodeos`
- `nodewebkit`
- `nomad`
- `nomadIcon`
- `notion`
- `notionIcon`
- `now`
- `noysi`
- `npm`
- `npm2`
- `npmIcon`
- `nuclide`
- `numpy`
- `nuodb`
- `nuxt`
- `nuxtIcon`
- `nvidia`
- `nvm`
- `nx`
- `oauth`
- `observablehq`
- `obsidian`
- `obsidianIcon`
- `ocaml`
- `octodns`
- `octopusDeploy`
- `okta`
- `oktaIcon`
- `olapic`
- `olark`
- `onesignal`
- `opbeat`
- `openGraph`
- `openZeppelin`
- `openZeppelinIcon`
- `openai`
- `openaiIcon`
- `openapi`
- `openapiIcon`
- `opencart`
- `opencollective`
- `opencv`
- `openframeworks`
- `opengl`
- `openjsFoundation`
- `openjsFoundationIcon`
- `openlayers`
- `opensearch`
- `opensearchIcon`
- `openshift`
- `opensource`
- `openstack`
- `openstackIcon`
- `opentelemetry`
- `opentelemetryIcon`
- `opera`
- `opsee`
- `opsgenie`
- `opsmatic`
- `optimizely`
- `optimizelyIcon`
- `oracle`
- `oreilly`
- `origami`
- `origin`
- `oshw`
- `osquery`
- `otto`
- `overloop`
- `overloopIcon`
- `p5js`
- `packer`
- `pagekit`
- `pagekite`
- `pagerduty`
- `pagerdutyIcon`
- `panda`
- `pandacss`
- `pandacssIcon`
- `pandas`
- `pandasIcon`
- `parcel`
- `parcelIcon`
- `parse`
- `parsehub`
- `partytown`
- `partytownIcon`
- `passbolt`
- `passboltIcon`
- `passport`
- `patreon`
- `payload`
- `paypal`
- `peer5`
- `pepperoni`
- `percona`
- `percy`
- `percyIcon`
- `perfRocks`
- `periscope`
- `perl`
- `perplexity`
- `perplexityIcon`
- `phalcon`
- `phoenix`
- `phonegap`
- `phonegapBot`
- `php`
- `phpAlt`
- `phpstorm`
- `picasa`
- `pinecone`
- `pineconeIcon`
- `pingdom`
- `pingy`
- `pinia`
- `pinterest`
- `pipedream`
- `pipedrive`
- `pipefy`
- `pivotalTracker`
- `pixate`
- `pixelapse`
- `pixijs`
- `pkg`
- `planetscale`
- `planless`
- `planlessIcon`
- `plasmic`
- `plasticScm`
- `platformio`
- `play`
- `playwright`
- `pluralsight`
- `pluralsightIcon`
- `pm2`
- `pm2Icon`
- `pnpm`
- `pocketBase`
- `podio`
- `poeditor`
- `polymer`
- `positionly`
- `postcss`
- `postgraphile`
- `postgresql`
- `posthog`
- `posthogIcon`
- `postman`
- `postmanIcon`
- `pouchdb`
- `preact`
- `precursor`
- `prerender`
- `prerenderIcon`
- `prestashop`
- `prestashopIcon`
- `presto`
- `prestoIcon`
- `prettier`
- `prisma`
- `prismic`
- `prismicIcon`
- `processing`
- `processwire`
- `processwireIcon`
- `productboard`
- `productboardIcon`
- `producteev`
- `producthunt`
- `progress`
- `prometheus`
- `promises`
- `proofy`
- `prospect`
- `protoio`
- `protonet`
- `protractor`
- `prott`
- `pug`
- `pulumi`
- `pulumiIcon`
- `pumpkindb`
- `puppet`
- `puppetIcon`
- `puppeteer`
- `puppyLinux`
- `purescript`
- `purescriptIcon`
- `pushbullet`
- `pusher`
- `pusherIcon`
- `pwa`
- `pycharm`
- `pypi`
- `pyscript`
- `python`
- `pytorch`
- `pytorchIcon`
- `pyup`
- `q`
- `qdrant`
- `qdrantIcon`
- `qlik`
- `qordoba`
- `qt`
- `qualcomm`
- `quarkus`
- `quarkusIcon`
- `quay`
- `quobyte`
- `quora`
- `qwik`
- `qwikIcon`
- `rLang`
- `rabbitmq`
- `rabbitmqIcon`
- `rackspace`
- `rackspaceIcon`
- `rails`
- `ramda`
- `raml`
- `rancher`
- `rancherIcon`
- `randomcolor`
- `raphael`
- `raspberryPi`
- `rax`
- `react`
- `reactQuery`
- `reactQueryIcon`
- `reactRouter`
- `reactSpring`
- `reactStyleguidist`
- `reactivex`
- `realm`
- `reapp`
- `reasonml`
- `reasonmlIcon`
- `recaptcha`
- `recoil`
- `recoilIcon`
- `reddit`
- `redditIcon`
- `redhat`
- `redhatIcon`
- `redis`
- `redsmin`
- `redspread`
- `redux`
- `reduxObservable`
- `reduxSaga`
- `redwoodjs`
- `refactor`
- `reindex`
- `relay`
- `release`
- `remergr`
- `remix`
- `remixIcon`
- `renovatebot`
- `replay`
- `replayIcon`
- `replit`
- `replitIcon`
- `require`
- `rescript`
- `rescriptIcon`
- `rest`
- `restLi`
- `rethinkdb`
- `retool`
- `retoolIcon`
- `riak`
- `rider`
- `riot`
- `risingwave`
- `risingwaveIcon`
- `rkt`
- `rocketChat`
- `rocketChatIcon`
- `rocksdb`
- `rockyLinux`
- `rockyLinuxIcon`
- `rollbar`
- `rollbarIcon`
- `rollupjs`
- `rome`
- `romeIcon`
- `ros`
- `rsa`
- `rsmq`
- `rubocop`
- `ruby`
- `rubygems`
- `rubymine`
- `rum`
- `runAbove`
- `runnable`
- `runscope`
- `rush`
- `rushIcon`
- `rust`
- `rxdb`
- `safari`
- `sagui`
- `sails`
- `salesforce`
- `saltstack`
- `sameroom`
- `samsung`
- `sanity`
- `sap`
- `sass`
- `sassDoc`
- `saucelabs`
- `scala`
- `scaledrone`
- `scaphold`
- `scribd`
- `scribdIcon`
- `seaborn`
- `seabornIcon`
- `section`
- `sectionIcon`
- `sectionio`
- `segment`
- `segmentIcon`
- `selenium`
- `semanticRelease`
- `semanticUi`
- `semanticWeb`
- `semaphore`
- `semaphoreci`
- `sencha`
- `sendgrid`
- `sendgridIcon`
- `seneca`
- `sensu`
- `sensuIcon`
- `sentry`
- `sentryIcon`
- `sequelize`
- `serveless`
- `serverless`
- `sherlock`
- `sherlockIcon`
- `shields`
- `shipit`
- `shippable`
- `shogun`
- `shopify`
- `shortcut`
- `shortcutIcon`
- `sidekick`
- `sidekiq`
- `sidekiqIcon`
- `signal`
- `sigstore`
- `sigstoreIcon`
- `sinatra`
- `singlestore`
- `singlestoreIcon`
- `siphon`
- `sitepoint`
- `skHynix`
- `skaffolder`
- `sketch`
- `sketchapp`
- `skylight`
- `skype`
- `slack`
- `slackIcon`
- `slides`
- `slidev`
- `slim`
- `smartling`
- `smashingmagazine`
- `snapSvg`
- `snaplet`
- `snapletIcon`
- `snowflake`
- `snowflakeIcon`
- `snowpack`
- `snupps`
- `snyk`
- `socketIo`
- `solarwinds`
- `solid`
- `solidity`
- `solidjs`
- `solidjsIcon`
- `solr`
- `sonarcloud`
- `sonarcloudIcon`
- `sonarlint`
- `sonarlintIcon`
- `sonarqube`
- `soundcloud`
- `sourcegraph`
- `sourcetrail`
- `sourcetree`
- `spark`
- `sparkcentral`
- `sparkpost`
- `speakerdeck`
- `speedcurve`
- `spidermonkey`
- `spidermonkeyIcon`
- `spinnaker`
- `splunk`
- `spotify`
- `spotifyIcon`
- `spree`
- `spring`
- `springIcon`
- `sqldep`
- `sqlite`
- `square`
- `squarespace`
- `sst`
- `sstIcon`
- `stabilityAi`
- `stabilityAiIcon`
- `stackbit`
- `stackbitIcon`
- `stackblitz`
- `stackblitzIcon`
- `stackoverflow`
- `stackoverflowIcon`
- `stackshare`
- `stacksmith`
- `stash`
- `stately`
- `statelyIcon`
- `statuspage`
- `stdlib`
- `stdlibIcon`
- `steam`
- `steemit`
- `stenciljs`
- `stenciljsIcon`
- `stepsize`
- `stepsizeIcon`
- `steroids`
- `stetho`
- `stickermule`
- `stigg`
- `stiggIcon`
- `stimulus`
- `stimulusIcon`
- `stitch`
- `stoplight`
- `stormpath`
- `storyblocks`
- `storyblocksIcon`
- `storyblok`
- `storyblokIcon`
- `storybook`
- `storybookIcon`
- `strapi`
- `strapiIcon`
- `streamlit`
- `strider`
- `stripe`
- `strongloop`
- `struts`
- `styleci`
- `stylefmt`
- `stylelint`
- `stylis`
- `stylus`
- `stytch`
- `sublimetext`
- `sublimetextIcon`
- `subversion`
- `sugarss`
- `supabase`
- `supabaseIcon`
- `supergiant`
- `supersonic`
- `supertokens`
- `supertokensIcon`
- `supportkit`
- `surge`
- `surrealdb`
- `surrealdbIcon`
- `survicate`
- `survicateIcon`
- `suse`
- `susy`
- `svelte`
- `svelteIcon`
- `svelteKit`
- `svg`
- `svgator`
- `swagger`
- `swc`
- `swift`
- `swiftype`
- `swimm`
- `swr`
- `symfony`
- `sysdig`
- `sysdigIcon`
- `t3`
- `tableau`
- `tableauIcon`
- `taiga`
- `tailwindcss`
- `tailwindcssIcon`
- `tapcart`
- `tapcartIcon`
- `targetprocess`
- `taskade`
- `taskadeIcon`
- `tastejs`
- `tauri`
- `tealium`
- `teamcity`
- `teamgrid`
- `teamwork`
- `teamworkIcon`
- `tectonic`
- `telegram`
- `tensorflow`
- `terminal`
- `terraform`
- `terraformIcon`
- `terser`
- `terserIcon`
- `testcafe`
- `testingLibrary`
- `testlodge`
- `testmunk`
- `thimble`
- `threejs`
- `thymeleaf`
- `thymeleafIcon`
- `tidal`
- `tidalIcon`
- `tiktok`
- `tiktokIcon`
- `titon`
- `tnw`
- `todoist`
- `todoistIcon`
- `todomvc`
- `tomcat`
- `toml`
- `tor`
- `torBrowser`
- `torus`
- `traackr`
- `trac`
- `trace`
- `travisCi`
- `travisCiMonochrome`
- `treasuredata`
- `treasuredataIcon`
- `treehouse`
- `treehouseIcon`
- `trello`
- `trpc`
- `truffle`
- `truffleIcon`
- `tsmc`
- `tsnode`
- `tsu`
- `tsuru`
- `tumblr`
- `tumblrIcon`
- `tunein`
- `tuple`
- `turbopack`
- `turbopackIcon`
- `turborepo`
- `turborepoIcon`
- `turret`
- `tutsplus`
- `tutum`
- `twilio`
- `twilioIcon`
- `twitch`
- `twitter`
- `typeform`
- `typeformIcon`
- `typeorm`
- `typescript`
- `typescriptIcon`
- `typescriptIconRound`
- `typesense`
- `typesenseIcon`
- `typo3`
- `typo3Icon`
- `ubuntu`
- `udacity`
- `udacityIcon`
- `udemy`
- `udemyIcon`
- `uikit`
- `umu`
- `unbounce`
- `unbounceIcon`
- `undertow`
- `unionpay`
- `unitjs`
- `unito`
- `unitoIcon`
- `unity`
- `unjs`
- `unocss`
- `unrealengine`
- `unrealengineIcon`
- `upcase`
- `upstash`
- `upstashIcon`
- `upwork`
- `userTesting`
- `userTestingIcon`
- `uservoice`
- `uservoiceIcon`
- `uwsgi`
- `v8`
- `v8Ignition`
- `v8Turbofan`
- `vaadin`
- `vaddy`
- `vagrant`
- `vagrantIcon`
- `vault`
- `vaultIcon`
- `vector`
- `vectorTimber`
- `vercel`
- `vercelIcon`
- `verdaccio`
- `verdaccioIcon`
- `vernemq`
- `victorops`
- `vim`
- `vimeo`
- `vimeoIcon`
- `vine`
- `visa`
- `visaelectron`
- `visualStudio`
- `visualStudioCode`
- `visualWebsiteOptimizer`
- `vitejs`
- `vitess`
- `vitest`
- `vivaldi`
- `vivaldiIcon`
- `vlang`
- `vmware`
- `void`
- `volar`
- `vue`
- `vuetifyjs`
- `vueuse`
- `vulkan`
- `vultr`
- `vultrIcon`
- `vwo`
- `w3c`
- `waffle`
- `waffleIcon`
- `wagtail`
- `wakatime`
- `walkme`
- `watchman`
- `waypoint`
- `waypointIcon`
- `wayscript`
- `wayscriptIcon`
- `wearos`
- `weave`
- `webDev`
- `webDevIcon`
- `webFundamentals`
- `web3js`
- `webassembly`
- `webcomponents`
- `webdriverio`
- `webflow`
- `webgpu`
- `webhint`
- `webhintIcon`
- `webhooks`
- `webix`
- `webixIcon`
- `webkit`
- `webmin`
- `webpack`
- `webplatform`
- `webrtc`
- `websocket`
- `webstorm`
- `webtask`
- `webtorrent`
- `weebly`
- `wercker`
- `whalar`
- `whalarIcon`
- `whatsapp`
- `whatsappIcon`
- `whatsappMonochromeIcon`
- `whatwg`
- `wicket`
- `wicketIcon`
- `wifi`
- `wildfly`
- `windiCss`
- `winglang`
- `winglangIcon`
- `wire`
- `wiredtree`
- `wix`
- `wmr`
- `woocommerce`
- `woocommerceIcon`
- `woopra`
- `wordpress`
- `wordpressIcon`
- `wordpressIconAlt`
- `workboard`
- `workos`
- `workosIcon`
- `workplace`
- `workplaceIcon`
- `wpengine`
- `wufoo`
- `x`
- `xRayGoggles`
- `xamarin`
- `xampp`
- `xata`
- `xataIcon`
- `xcart`
- `xcode`
- `xero`
- `xplenty`
- `xrayForJira`
- `xstate`
- `xtend`
- `xwiki`
- `xwikiIcon`
- `yahoo`
- `yaml`
- `yammer`
- `yandexRu`
- `yarn`
- `ycombinator`
- `yeoman`
- `yii`
- `youtrack`
- `youtube`
- `youtubeIcon`
- `yugabyte`
- `yugabyteIcon`
- `zabbix`
- `zapier`
- `zapierIcon`
- `zeit`
- `zeitIcon`
- `zendFramework`
- `zendesk`
- `zendeskIcon`
- `zenhub`
- `zenhubIcon`
- `zeplin`
- `zeroheight`
- `zeroheightIcon`
- `zest`
- `zig`
- `zigbee`
- `zod`
- `zoho`
- `zoom`
- `zoomIcon`
- `zorinOs`
- `zsh`
- `zube`
- `zulip`
- `zulipIcon`
- `zwave`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><100tbIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><500pxIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><6pxIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ActiveCampaignIcon size="20" class="nav-icon" /> Settings</a>
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
<100tbIcon
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
    <100tbIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <500pxIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <6pxIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <100tbIcon size="24" />
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
   <100tbIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <100tbIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <100tbIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 100tb } from '@stacksjs/iconify-logos'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(100tb, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 100tb } from '@stacksjs/iconify-logos'

// Icons are typed as IconData
const myIcon: IconData = 100tb
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC0

See [license details](https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt) for more information.

## Credits

- **Icons**: Gil Barbara ([Website](https://github.com/gilbarbara/logos))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/logos/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/logos/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
