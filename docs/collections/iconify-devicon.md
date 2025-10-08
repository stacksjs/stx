# Devicon

> Devicon icons for stx from Iconify

## Overview

This package provides access to 962 icons from the Devicon collection through the stx iconify integration.

**Collection ID:** `devicon`
**Total Icons:** 962
**Author:** konpa ([Website](https://github.com/devicons/devicon/tree/master))
**License:** MIT ([Details](https://github.com/devicons/devicon/blob/master/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-devicon
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Aarch64Icon, AdonisjsIcon, AdonisjsWordmarkIcon } from '@stacksjs/iconify-devicon'

// Basic usage
const icon = Aarch64Icon()

// With size
const sizedIcon = Aarch64Icon({ size: 24 })

// With color
const coloredIcon = AdonisjsIcon({ color: 'red' })

// With multiple props
const customIcon = AdonisjsWordmarkIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Aarch64Icon, AdonisjsIcon, AdonisjsWordmarkIcon } from '@stacksjs/iconify-devicon'

  global.icons = {
    home: Aarch64Icon({ size: 24 }),
    user: AdonisjsIcon({ size: 24, color: '#4a90e2' }),
    settings: AdonisjsWordmarkIcon({ size: 32 })
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
import { aarch64, adonisjs, adonisjsWordmark } from '@stacksjs/iconify-devicon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(aarch64, { size: 24 })
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

```typescript
// Via color property
const redIcon = Aarch64Icon({ color: 'red' })
const blueIcon = Aarch64Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Aarch64Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Aarch64Icon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = Aarch64Icon({ size: 24 })
const icon1em = Aarch64Icon({ size: '1em' })

// Set individual dimensions
const customIcon = Aarch64Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = Aarch64Icon({ height: '1em' })
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
const smallIcon = Aarch64Icon({ class: 'icon-small' })
const largeIcon = Aarch64Icon({ class: 'icon-large' })
```

## Available Icons

This package contains **962** icons:

- `aarch64`
- `adonisjs`
- `adonisjsWordmark`
- `aerospike`
- `aerospikeWordmark`
- `aframe`
- `aframeWordmark`
- `aftereffects`
- `akka`
- `akkaWordmark`
- `algolia`
- `algoliaWordmark`
- `almalinux`
- `almalinuxWordmark`
- `alpinejs`
- `alpinejsWordmark`
- `amazonwebservices`
- `anaconda`
- `anacondaWordmark`
- `android`
- `androidWordmark`
- `androidstudio`
- `androidstudioWordmark`
- `angular`
- `angularWordmark`
- `angularjs`
- `angularjsWordmark`
- `angularmaterial`
- `ansible`
- `ansibleWordmark`
- `ansys`
- `ansysWordmark`
- `antdesign`
- `antdesignWordmark`
- `apache`
- `apacheWordmark`
- `apacheairflow`
- `apacheairflowWordmark`
- `apachekafka`
- `apachekafkaWordmark`
- `apachespark`
- `apachesparkWordmark`
- `apex`
- `apl`
- `apollographql`
- `apollographqlWordmark`
- `appcelerator`
- `appceleratorWordmark`
- `apple`
- `appwrite`
- `appwriteWordmark`
- `archlinux`
- `archlinuxWordmark`
- `arduino`
- `arduinoWordmark`
- `argocd`
- `argocdWordmark`
- `artixlinux`
- `artixlinuxWordmark`
- `astro`
- `astroWordmark`
- `atom`
- `atomWordmark`
- `awk`
- `awkWordmark`
- `azure`
- `azureWordmark`
- `azuredatafactory`
- `azuredevops`
- `azuresqldatabase`
- `babel`
- `babylonjs`
- `babylonjsWordmark`
- `backbonejs`
- `backbonejsWordmark`
- `ballerina`
- `ballerinaWordmark`
- `bamboo`
- `bambooWordmark`
- `bash`
- `bazel`
- `bazelWordmark`
- `beats`
- `behance`
- `behanceWordmark`
- `bevyengine`
- `bevyengineWordmark`
- `biome`
- `biomeWordmark`
- `bitbucket`
- `bitbucketWordmark`
- `blazor`
- `blender`
- `blenderWordmark`
- `bootstrap`
- `bootstrapWordmark`
- `bower`
- `bowerWordmark`
- `browserstack`
- `browserstackWordmark`
- `bruno`
- `brunoWordmark`
- `bun`
- `c`
- `cairo`
- `cairoWordmark`
- `cakephp`
- `cakephpWordmark`
- `canva`
- `capacitor`
- `capacitorWordmark`
- `carbon`
- `cassandra`
- `cassandraWordmark`
- `centos`
- `centosWordmark`
- `ceylon`
- `ceylonWordmark`
- `chakraui`
- `chakrauiWordmark`
- `chartjs`
- `chartjsWordmark`
- `chrome`
- `chromeWordmark`
- `clarity`
- `clarityWordmark`
- `clickhouse`
- `clion`
- `clionWordmark`
- `clojure`
- `clojurescript`
- `cloudflare`
- `cloudflareWordmark`
- `cloudflareworkers`
- `cloudflareworkersWordmark`
- `cloudrun`
- `cmake`
- `cmakeWordmark`
- `cobol`
- `codeac`
- `codeberg`
- `codebergWordmark`
- `codepen`
- `codepenWordmark`
- `coffeescript`
- `coffeescriptWordmark`
- `composer`
- `confluence`
- `confluenceWordmark`
- `consul`
- `consulWordmark`
- `contao`
- `contaoWordmark`
- `cordova`
- `cordovaWordmark`
- `corejs`
- `corejsWordmark`
- `cosmosdb`
- `cosmosdbWordmark`
- `couchbase`
- `couchbaseWordmark`
- `couchdb`
- `couchdbWordmark`
- `cpanel`
- `cpanelWordmark`
- `cplusplus`
- `crystal`
- `crystalWordmark`
- `csharp`
- `css3`
- `css3Wordmark`
- `cypressio`
- `cypressioWordmark`
- `d3js`
- `dart`
- `dartWordmark`
- `datadog`
- `datadogWordmark`
- `datagrip`
- `datagripWordmark`
- `dataspell`
- `dataspellWordmark`
- `datatables`
- `dbeaver`
- `debian`
- `debianWordmark`
- `delphi`
- `denojs`
- `denojsWordmark`
- `detaspace`
- `detaspaceWordmark`
- `devicon`
- `deviconWordmark`
- `digitalocean`
- `digitaloceanWordmark`
- `discloud`
- `discloudWordmark`
- `discordjs`
- `discordjsWordmark`
- `djangorest`
- `djangorestWordmark`
- `docker`
- `dockerWordmark`
- `doctrine`
- `doctrineWordmark`
- `dotNet`
- `dotNetWordmark`
- `dotnetcore`
- `dovecot`
- `dreamweaver`
- `dropwizard`
- `drupal`
- `drupalWordmark`
- `duckdb`
- `dyalog`
- `dyalogWordmark`
- `dynamodb`
- `dynatrace`
- `dynatraceWordmark`
- `eclipse`
- `eclipseWordmark`
- `ecto`
- `ectoWordmark`
- `elasticsearch`
- `elasticsearchWordmark`
- `electron`
- `electronWordmark`
- `eleventy`
- `elixir`
- `elixirWordmark`
- `elm`
- `elmWordmark`
- `emacs`
- `embeddedc`
- `embeddedcWordmark`
- `ember`
- `emberWordmark`
- `entityframeworkcore`
- `envoy`
- `envoyWordmark`
- `erlang`
- `erlangWordmark`
- `eslint`
- `eslintWordmark`
- `expo`
- `expoWordmark`
- `express`
- `expressWordmark`
- `facebook`
- `fastapi`
- `fastapiWordmark`
- `fastify`
- `fastifyWordmark`
- `faunadb`
- `faunadbWordmark`
- `feathersjs`
- `fedora`
- `fiber`
- `figma`
- `filamentphp`
- `filezilla`
- `filezillaWordmark`
- `firebase`
- `firebaseWordmark`
- `firebird`
- `firefox`
- `firefoxWordmark`
- `flask`
- `flaskWordmark`
- `flutter`
- `forgejo`
- `forgejoWordmark`
- `fortran`
- `foundation`
- `foundationWordmark`
- `framermotion`
- `framermotionWordmark`
- `framework7`
- `framework7Wordmark`
- `fsharp`
- `fusion`
- `gardener`
- `gatling`
- `gatlingWordmark`
- `gatsby`
- `gatsbyWordmark`
- `gazebo`
- `gazeboWordmark`
- `gcc`
- `gentoo`
- `gentooWordmark`
- `ghost`
- `ghostWordmark`
- `gimp`
- `gimpWordmark`
- `git`
- `gitWordmark`
- `gitbook`
- `gitbookWordmark`
- `github`
- `githubWordmark`
- `githubactions`
- `githubactionsWordmark`
- `githubcodespaces`
- `gitkraken`
- `gitkrakenWordmark`
- `gitlab`
- `gitlabWordmark`
- `gitpod`
- `gitpodWordmark`
- `gleam`
- `glitch`
- `go`
- `goWordmark`
- `godot`
- `godotWordmark`
- `goland`
- `golandWordmark`
- `google`
- `googleWordmark`
- `googlecloud`
- `googlecloudWordmark`
- `googlecolab`
- `gradle`
- `gradleWordmark`
- `grafana`
- `grafanaWordmark`
- `grails`
- `groovy`
- `grpc`
- `grunt`
- `gruntWordmark`
- `hadoop`
- `hadoopWordmark`
- `handlebars`
- `handlebarsWordmark`
- `harbor`
- `harborWordmark`
- `hardhat`
- `hardhatWordmark`
- `harvester`
- `harvesterWordmark`
- `haskell`
- `haskellWordmark`
- `haxe`
- `helm`
- `heroku`
- `herokuWordmark`
- `hibernate`
- `hibernateWordmark`
- `homebrew`
- `homebrewWordmark`
- `hoppscotch`
- `html5`
- `html5Wordmark`
- `htmx`
- `htmxWordmark`
- `hugo`
- `hugoWordmark`
- `hyperv`
- `hypervWordmark`
- `ie10`
- `ifttt`
- `illustrator`
- `inertiajs`
- `inertiajsWordmark`
- `influxdb`
- `influxdbWordmark`
- `inkscape`
- `inkscapeWordmark`
- `insomnia`
- `insomniaWordmark`
- `intellij`
- `intellijWordmark`
- `ionic`
- `ionicWordmark`
- `jaegertracing`
- `jaegertracingWordmark`
- `jamstack`
- `jamstackWordmark`
- `jasmine`
- `jasmineWordmark`
- `java`
- `javaWordmark`
- `javascript`
- `jeet`
- `jeetWordmark`
- `jekyll`
- `jenkins`
- `jetbrains`
- `jetpackcompose`
- `jetpackcomposeWordmark`
- `jhipster`
- `jhipsterWordmark`
- `jira`
- `jiraWordmark`
- `jiraalign`
- `jiraalignWordmark`
- `jquery`
- `jqueryWordmark`
- `json`
- `jule`
- `juleWordmark`
- `julia`
- `juliaWordmark`
- `junit`
- `junitWordmark`
- `jupyter`
- `jupyterWordmark`
- `k3os`
- `k3osWordmark`
- `k3s`
- `k3sWordmark`
- `k6`
- `kaggle`
- `kaggleWordmark`
- `kaldi`
- `kaldiWordmark`
- `kalilinux`
- `kalilinuxWordmark`
- `karatelabs`
- `karatelabsWordmark`
- `karma`
- `kdeneon`
- `keras`
- `kerasWordmark`
- `kibana`
- `kibanaWordmark`
- `knexjs`
- `knexjsWordmark`
- `kotlin`
- `kotlinWordmark`
- `krakenjs`
- `krakenjsWordmark`
- `ktor`
- `ktorWordmark`
- `kubeflow`
- `kubeflowWordmark`
- `kubernetes`
- `kubernetesWordmark`
- `labview`
- `labviewWordmark`
- `laminas`
- `laminasWordmark`
- `laravel`
- `laravelWordmark`
- `laraveljetstream`
- `laraveljetstreamWordmark`
- `latex`
- `leetcode`
- `leetcodeWordmark`
- `libgdx`
- `linkedin`
- `linkedinWordmark`
- `linux`
- `linuxmint`
- `linuxmintWordmark`
- `liquibase`
- `liquibaseWordmark`
- `livewire`
- `livewireWordmark`
- `llvm`
- `lodash`
- `logstash`
- `logstashWordmark`
- `love2d`
- `lua`
- `luaWordmark`
- `luau`
- `lumen`
- `magento`
- `magentoWordmark`
- `mapbox`
- `mariadb`
- `mariadbWordmark`
- `markdown`
- `materializecss`
- `materialui`
- `matlab`
- `matplotlib`
- `matplotlibWordmark`
- `mattermost`
- `mattermostWordmark`
- `maven`
- `mavenWordmark`
- `maya`
- `mayaWordmark`
- `memcached`
- `memcachedWordmark`
- `mercurial`
- `mercurialWordmark`
- `meteor`
- `meteorWordmark`
- `microsoftsqlserver`
- `microsoftsqlserverWordmark`
- `minitab`
- `mithril`
- `mobx`
- `mocha`
- `modx`
- `modxWordmark`
- `moleculer`
- `moleculerWordmark`
- `mongodb`
- `mongodbWordmark`
- `mongoose`
- `mongooseWordmark`
- `monogame`
- `monogameWordmark`
- `moodle`
- `moodleWordmark`
- `msdos`
- `mysql`
- `mysqlWordmark`
- `nano`
- `nanoWordmark`
- `nasm`
- `nasmWordmark`
- `nats`
- `neo4j`
- `neo4jWordmark`
- `neovim`
- `neovimWordmark`
- `nestjs`
- `nestjsWordmark`
- `netbeans`
- `netbeansWordmark`
- `netbox`
- `netboxWordmark`
- `netlify`
- `netlifyWordmark`
- `networkx`
- `networkxWordmark`
- `newrelic`
- `nextjs`
- `nextjsWordmark`
- `nginx`
- `ngrok`
- `ngrx`
- `nhibernate`
- `nhibernateWordmark`
- `nim`
- `nimWordmark`
- `nimble`
- `nixos`
- `nixosWordmark`
- `nodejs`
- `nodejsWordmark`
- `nodemon`
- `nodered`
- `nodewebkit`
- `nodewebkitWordmark`
- `nomad`
- `nomadWordmark`
- `norg`
- `notion`
- `npm`
- `npmWordmark`
- `npss`
- `nuget`
- `nugetWordmark`
- `numpy`
- `numpyWordmark`
- `nuxt`
- `nuxtWordmark`
- `nuxtjs`
- `nuxtjsWordmark`
- `oauth`
- `ocaml`
- `ocamlWordmark`
- `ohmyzsh`
- `okta`
- `oktaWordmark`
- `openal`
- `openapi`
- `openapiWordmark`
- `opencl`
- `opencv`
- `opencvWordmark`
- `opengl`
- `openstack`
- `openstackWordmark`
- `opensuse`
- `opensuseWordmark`
- `opentelemetry`
- `opentelemetryWordmark`
- `opera`
- `operaWordmark`
- `oracle`
- `ory`
- `oryWordmark`
- `p5js`
- `packer`
- `packerWordmark`
- `pandas`
- `pandasWordmark`
- `passport`
- `passportWordmark`
- `perl`
- `pfsense`
- `pfsenseWordmark`
- `phalcon`
- `phoenix`
- `phoenixWordmark`
- `photonengine`
- `photoshop`
- `php`
- `phpstorm`
- `phpstormWordmark`
- `pixijs`
- `pixijsWordmark`
- `playwright`
- `plotly`
- `plotlyWordmark`
- `pm2`
- `pm2Wordmark`
- `pnpm`
- `pnpmWordmark`
- `podman`
- `podmanWordmark`
- `poetry`
- `polygon`
- `polygonWordmark`
- `portainer`
- `portainerWordmark`
- `postcss`
- `postcssWordmark`
- `postgresql`
- `postgresqlWordmark`
- `postman`
- `postmanWordmark`
- `powershell`
- `premierepro`
- `primeng`
- `prisma`
- `prismaWordmark`
- `processing`
- `processingWordmark`
- `processwire`
- `processwireWordmark`
- `prolog`
- `prologWordmark`
- `prometheus`
- `prometheusWordmark`
- `protractor`
- `protractorWordmark`
- `proxmox`
- `proxmoxWordmark`
- `pug`
- `pulsar`
- `pulsarWordmark`
- `pulumi`
- `pulumiWordmark`
- `puppeteer`
- `purescript`
- `purescriptWordmark`
- `putty`
- `pycharm`
- `pycharmWordmark`
- `pypi`
- `pypiWordmark`
- `pyscriptWordmark`
- `pytest`
- `pytestWordmark`
- `python`
- `pythonWordmark`
- `pytorch`
- `pytorchWordmark`
- `qodana`
- `qt`
- `qtest`
- `qtestWordmark`
- `quarkus`
- `quarkusWordmark`
- `quasar`
- `quasarWordmark`
- `qwik`
- `qwikWordmark`
- `r`
- `rabbitmq`
- `rabbitmqWordmark`
- `racket`
- `radstudio`
- `railsWordmark`
- `railway`
- `railwayWordmark`
- `rancher`
- `rancherWordmark`
- `raspberrypi`
- `raspberrypiWordmark`
- `reach`
- `react`
- `reactWordmark`
- `reactbootstrap`
- `reactnative`
- `reactnativeWordmark`
- `reactnavigation`
- `reactrouter`
- `reactrouterWordmark`
- `readthedocs`
- `readthedocsWordmark`
- `realm`
- `realmWordmark`
- `rect`
- `redhat`
- `redhatWordmark`
- `redis`
- `redisWordmark`
- `redux`
- `reflex`
- `reflexWordmark`
- `remix`
- `remixWordmark`
- `renpy`
- `replit`
- `replitWordmark`
- `rexx`
- `rexxWordmark`
- `rider`
- `riderWordmark`
- `rocksdb`
- `rockylinux`
- `rockylinuxWordmark`
- `rollup`
- `rollupWordmark`
- `ros`
- `rosWordmark`
- `rspec`
- `rspecWordmark`
- `rstudio`
- `ruby`
- `rubyWordmark`
- `rubymine`
- `rubymineWordmark`
- `rust`
- `rxjs`
- `safari`
- `safariWordmark`
- `salesforce`
- `sanity`
- `sass`
- `scala`
- `scalaWordmark`
- `scalingo`
- `scalingoWordmark`
- `scikitlearn`
- `sdl`
- `selenium`
- `sema`
- `semaWordmark`
- `sentry`
- `sentryWordmark`
- `sequelize`
- `sequelizeWordmark`
- `shopware`
- `shopwareWordmark`
- `shotgrid`
- `shotgridWordmark`
- `sketch`
- `sketchWordmark`
- `slack`
- `slackWordmark`
- `socketio`
- `socketioWordmark`
- `solidity`
- `solidjs`
- `solidjsWordmark`
- `sonarqube`
- `sonarqubeWordmark`
- `sourceengine`
- `sourceengineWordmark`
- `sourcetree`
- `sourcetreeWordmark`
- `spack`
- `spicedb`
- `splunkWordmark`
- `spring`
- `springWordmark`
- `spss`
- `spyder`
- `spyderWordmark`
- `sqlalchemy`
- `sqlalchemyWordmark`
- `sqldeveloper`
- `sqlite`
- `sqliteWordmark`
- `ssh`
- `sshWordmark`
- `stackblitz`
- `stackblitzWordmark`
- `stackoverflow`
- `stackoverflowWordmark`
- `stataWordmark`
- `stenciljs`
- `stenciljsWordmark`
- `storybook`
- `storybookWordmark`
- `streamlit`
- `streamlitWordmark`
- `styledcomponents`
- `styledcomponentsWordmark`
- `stylus`
- `subversion`
- `subversionWordmark`
- `sulu`
- `suluWordmark`
- `supabase`
- `supabaseWordmark`
- `surrealdb`
- `surrealdbWordmark`
- `svelte`
- `svelteWordmark`
- `svgo`
- `svgoWordmark`
- `swagger`
- `swaggerWordmark`
- `swift`
- `swiftWordmark`
- `swiper`
- `symfony`
- `symfonyWordmark`
- `tailwindcss`
- `tailwindcssWordmark`
- `talos`
- `tauri`
- `tauriWordmark`
- `teleport`
- `teleportWordmark`
- `tensorflow`
- `tensorflowWordmark`
- `tenzir`
- `tenzirWordmark`
- `terraform`
- `terraformWordmark`
- `terramate`
- `terramateWordmark`
- `tex`
- `thealgorithms`
- `thealgorithmsWordmark`
- `threedsmax`
- `threejs`
- `threejsWordmark`
- `thymeleaf`
- `thymeleafWordmark`
- `titaniumsdk`
- `tmux`
- `tmuxWordmark`
- `tomcat`
- `tomcatWordmark`
- `tortoisegit`
- `towergit`
- `towergitWordmark`
- `traefikmesh`
- `traefikmeshWordmark`
- `traefikproxy`
- `traefikproxyWordmark`
- `travis`
- `travisWordmark`
- `trello`
- `trelloWordmark`
- `trpc`
- `trpcWordmark`
- `turbo`
- `turboWordmark`
- `twilio`
- `twilioWordmark`
- `twitter`
- `typescript`
- `typo3`
- `typo3Wordmark`
- `ubuntu`
- `ubuntuWordmark`
- `unifiedmodelinglanguage`
- `unifiedmodelinglanguageWordmark`
- `unity`
- `unityWordmark`
- `unix`
- `unrealengine`
- `unrealengineWordmark`
- `uv`
- `uwsgi`
- `v8`
- `vaadin`
- `vaadinWordmark`
- `vagrant`
- `vagrantWordmark`
- `vala`
- `valaWordmark`
- `vapor`
- `vaporWordmark`
- `vault`
- `vaultWordmark`
- `veevalidate`
- `vercel`
- `vercelWordmark`
- `vertx`
- `vertxWordmark`
- `vim`
- `visualbasic`
- `visualstudio`
- `visualstudioWordmark`
- `vite`
- `viteWordmark`
- `vitejs`
- `vitess`
- `vitessWordmark`
- `vitest`
- `vscode`
- `vscodeWordmark`
- `vscodium`
- `vsphere`
- `vsphereWordmark`
- `vuejs`
- `vuejsWordmark`
- `vuestorefront`
- `vuetify`
- `vulkan`
- `vyper`
- `vyperWordmark`
- `waku`
- `wasm`
- `wasmWordmark`
- `web3js`
- `webflow`
- `webgpu`
- `webgpuWordmark`
- `weblate`
- `weblateWordmark`
- `webpack`
- `webpackWordmark`
- `webstorm`
- `webstormWordmark`
- `windows11`
- `windows11Wordmark`
- `windows8`
- `windows8Wordmark`
- `wolfram`
- `wolframWordmark`
- `woocommerce`
- `woocommerceWordmark`
- `wordpress`
- `xamarin`
- `xamarinWordmark`
- `xcode`
- `xd`
- `xml`
- `yaml`
- `yarn`
- `yarnWordmark`
- `yii`
- `yiiWordmark`
- `yugabytedb`
- `yugabytedbWordmark`
- `yunohost`
- `zed`
- `zend`
- `zendWordmark`
- `zig`
- `zigWordmark`
- `zsh`
- `zshWordmark`
- `zustand`

## Usage Examples

### Navigation Menu

```html
@js
  import { Aarch64Icon, AdonisjsIcon, AdonisjsWordmarkIcon, AerospikeIcon } from '@stacksjs/iconify-devicon'

  global.navIcons = {
    home: Aarch64Icon({ size: 20, class: 'nav-icon' }),
    about: AdonisjsIcon({ size: 20, class: 'nav-icon' }),
    contact: AdonisjsWordmarkIcon({ size: 20, class: 'nav-icon' }),
    settings: AerospikeIcon({ size: 20, class: 'nav-icon' })
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
import { Aarch64Icon } from '@stacksjs/iconify-devicon'

const icon = Aarch64Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Aarch64Icon, AdonisjsIcon, AdonisjsWordmarkIcon } from '@stacksjs/iconify-devicon'

const successIcon = Aarch64Icon({ size: 16, color: '#22c55e' })
const warningIcon = AdonisjsIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdonisjsWordmarkIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Aarch64Icon, AdonisjsIcon } from '@stacksjs/iconify-devicon'
   const icon = Aarch64Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { aarch64, adonisjs } from '@stacksjs/iconify-devicon'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(aarch64, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Aarch64Icon, AdonisjsIcon } from '@stacksjs/iconify-devicon'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-devicon'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Aarch64Icon } from '@stacksjs/iconify-devicon'
     global.icon = Aarch64Icon({ size: 24 })
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
   const icon = Aarch64Icon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { aarch64 } from '@stacksjs/iconify-devicon'

// Icons are typed as IconData
const myIcon: IconData = aarch64
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/devicons/devicon/blob/master/LICENSE) for more information.

## Credits

- **Icons**: konpa ([Website](https://github.com/devicons/devicon/tree/master))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/devicon/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/devicon/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
