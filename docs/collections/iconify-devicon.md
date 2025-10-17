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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<Aarch64Icon height="1em" />
<Aarch64Icon width="1em" height="1em" />
<Aarch64Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<Aarch64Icon size="24" />
<Aarch64Icon size="1em" />

<!-- Using width and height -->
<Aarch64Icon width="24" height="32" />

<!-- With color -->
<Aarch64Icon size="24" color="red" />
<Aarch64Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<Aarch64Icon size="24" class="icon-primary" />

<!-- With all properties -->
<Aarch64Icon
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
    <Aarch64Icon size="24" />
    <AdonisjsIcon size="24" color="#4a90e2" />
    <AdonisjsWordmarkIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<Aarch64Icon size="24" color="red" />
<Aarch64Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<Aarch64Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<Aarch64Icon size="24" class="text-primary" />
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
<Aarch64Icon height="1em" />
<Aarch64Icon width="1em" height="1em" />
<Aarch64Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<Aarch64Icon size="24" />
<Aarch64Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.devicon-icon {
  width: 1em;
  height: 1em;
}
```

```html
<Aarch64Icon class="devicon-icon" />
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
<nav>
  <a href="/"><Aarch64Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AdonisjsIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AdonisjsWordmarkIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AerospikeIcon size="20" class="nav-icon" /> Settings</a>
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
<Aarch64Icon
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
    <Aarch64Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AdonisjsIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AdonisjsWordmarkIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <Aarch64Icon size="24" />
   <AdonisjsIcon size="24" color="#4a90e2" />
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
   <Aarch64Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <Aarch64Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <Aarch64Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { aarch64 } from '@stacksjs/iconify-devicon'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(aarch64, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
