# Devicon Plain

> Devicon Plain icons for stx from Iconify

## Overview

This package provides access to 729 icons from the Devicon Plain collection through the stx iconify integration.

**Collection ID:** `devicon-plain`
**Total Icons:** 729
**Author:** konpa ([Website](https://github.com/devicons/devicon/tree/master))
**License:** MIT ([Details](https://github.com/devicons/devicon/blob/master/LICENSE))
**Category:** Programming
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-devicon-plain
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { Aarch64Icon, AframeIcon, AftereffectsIcon } from '@stacksjs/iconify-devicon-plain'

// Basic usage
const icon = Aarch64Icon()

// With size
const sizedIcon = Aarch64Icon({ size: 24 })

// With color
const coloredIcon = AframeIcon({ color: 'red' })

// With multiple props
const customIcon = AftereffectsIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { Aarch64Icon, AframeIcon, AftereffectsIcon } from '@stacksjs/iconify-devicon-plain'

  global.icons = {
    home: Aarch64Icon({ size: 24 }),
    user: AframeIcon({ size: 24, color: '#4a90e2' }),
    settings: AftereffectsIcon({ size: 32 })
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
import { aarch64, aframe, aftereffects } from '@stacksjs/iconify-devicon-plain'
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

### Monotone Icons

Monotone icons use `currentColor` by default, allowing you to change icon color via the `color` property or CSS:

```typescript
// Via color property
const redIcon = Aarch64Icon({ color: 'red' })
const blueIcon = Aarch64Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = Aarch64Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = Aarch64Icon({ class: 'text-primary' })
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

This package contains **729** icons:

- `aarch64`
- `aframe`
- `aftereffects`
- `akka`
- `akkaWordmark`
- `almalinux`
- `almalinuxWordmark`
- `amazonwebservices`
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
- `apache`
- `apacheWordmark`
- `apacheairflow`
- `apacheairflowWordmark`
- `apachesparkWordmark`
- `apl`
- `appceleratorWordmark`
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
- `awkWordmark`
- `axios`
- `axiosWordmark`
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
- `bash`
- `bazel`
- `bazelWordmark`
- `beats`
- `behance`
- `behanceWordmark`
- `bevyengine`
- `bevyengineWordmark`
- `biomeWordmark`
- `bootstrap`
- `bootstrapWordmark`
- `bower`
- `bowerWordmark`
- `browserstack`
- `browserstackWordmark`
- `bruno`
- `brunoWordmark`
- `bulma`
- `bun`
- `c`
- `cairo`
- `cairoWordmark`
- `cakephp`
- `cakephpWordmark`
- `capacitor`
- `capacitorWordmark`
- `cassandra`
- `cassandraWordmark`
- `centos`
- `centosWordmark`
- `ceylon`
- `ceylonWordmark`
- `chakraui`
- `chakrauiWordmark`
- `chrome`
- `chromeWordmark`
- `circleci`
- `circleciWordmark`
- `clarity`
- `clarityWordmark`
- `clickhouse`
- `clion`
- `clionWordmark`
- `cloudflare`
- `cloudflareWordmark`
- `cloudflareworkers`
- `cloudflareworkersWordmark`
- `cloudrun`
- `cmake`
- `cmakeWordmark`
- `codeberg`
- `codebergWordmark`
- `codecov`
- `codeigniter`
- `codeigniterWordmark`
- `codepen`
- `confluence`
- `confluenceWordmark`
- `consulWordmark`
- `cordova`
- `cordovaWordmark`
- `cosmosdb`
- `cosmosdbWordmark`
- `couchbaseWordmark`
- `couchdb`
- `couchdbWordmark`
- `cplusplus`
- `csharp`
- `css3`
- `css3Wordmark`
- `cucumber`
- `cucumberWordmark`
- `cypressio`
- `cypressioWordmark`
- `dart`
- `dartWordmark`
- `datagrip`
- `datagripWordmark`
- `dataspell`
- `dataspellWordmark`
- `dbeaver`
- `debian`
- `debianWordmark`
- `delphi`
- `devicon`
- `deviconWordmark`
- `digitalocean`
- `digitaloceanWordmark`
- `discloudWordmark`
- `discordjs`
- `discordjsWordmark`
- `django`
- `djangoWordmark`
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
- `dynamodb`
- `dynatrace`
- `dynatraceWordmark`
- `eclipse`
- `eclipseWordmark`
- `ectoWordmark`
- `elasticsearch`
- `elasticsearchWordmark`
- `eleventy`
- `elixir`
- `elixirWordmark`
- `elm`
- `elmWordmark`
- `embeddedc`
- `embeddedcWordmark`
- `ember`
- `entityframeworkcore`
- `envoy`
- `envoyWordmark`
- `erlang`
- `erlangWordmark`
- `eslint`
- `eslintWordmark`
- `facebook`
- `fastapi`
- `fastapiWordmark`
- `fastify`
- `fastifyWordmark`
- `fedora`
- `fiber`
- `figma`
- `filezilla`
- `filezillaWordmark`
- `firebase`
- `firebaseWordmark`
- `firebird`
- `firefox`
- `firefoxWordmark`
- `flutter`
- `forgejo`
- `forgejoWordmark`
- `foundation`
- `foundationWordmark`
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
- `gimp`
- `gimpWordmark`
- `git`
- `gitWordmark`
- `githubactions`
- `githubactionsWordmark`
- `githubcodespaces`
- `gitkrakenWordmark`
- `gitlab`
- `gitlabWordmark`
- `gitpod`
- `gitpodWordmark`
- `gitter`
- `gitterWordmark`
- `gleam`
- `glitch`
- `go`
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
- `graphql`
- `graphqlWordmark`
- `groovy`
- `grpc`
- `grunt`
- `gruntWordmark`
- `gulp`
- `hadoop`
- `hadoopWordmark`
- `harbor`
- `harborWordmark`
- `hardhat`
- `hardhatWordmark`
- `harvesterWordmark`
- `haskell`
- `haskellWordmark`
- `haxe`
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
- `illustrator`
- `inertiajs`
- `inertiajsWordmark`
- `inkscape`
- `inkscapeWordmark`
- `insomnia`
- `insomniaWordmark`
- `intellij`
- `intellijWordmark`
- `jaegertracing`
- `jaegertracingWordmark`
- `jamstackWordmark`
- `jasmine`
- `jasmineWordmark`
- `java`
- `javaWordmark`
- `javascript`
- `jeet`
- `jeetWordmark`
- `jekyll`
- `jekyllWordmark`
- `jenkins`
- `jest`
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
- `julia`
- `juliaWordmark`
- `junit`
- `junitWordmark`
- `jupyter`
- `jupyterWordmark`
- `k3osWordmark`
- `k3sWordmark`
- `kaldi`
- `kaldiWordmark`
- `kalilinuxWordmark`
- `karatelabs`
- `karatelabsWordmark`
- `karma`
- `kdeneon`
- `keras`
- `kerasWordmark`
- `kibana`
- `kibanaWordmark`
- `knexjsWordmark`
- `knockoutWordmark`
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
- `laravel`
- `laravelWordmark`
- `laraveljetstreamWordmark`
- `leetcode`
- `leetcodeWordmark`
- `lessWordmark`
- `libgdx`
- `linkedin`
- `linkedinWordmark`
- `linux`
- `linuxmint`
- `linuxmintWordmark`
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
- `magentoWordmark`
- `materializecss`
- `materialui`
- `matlab`
- `matplotlib`
- `matplotlibWordmark`
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
- `mobx`
- `mocha`
- `modx`
- `modxWordmark`
- `mongodb`
- `mongodbWordmark`
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
- `nomadWordmark`
- `norg`
- `notion`
- `npm`
- `npss`
- `numpy`
- `numpyWordmark`
- `nuxtWordmark`
- `nuxtjs`
- `nuxtjsWordmark`
- `oauth`
- `objectivec`
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
- `openstackWordmark`
- `opensuse`
- `opensuseWordmark`
- `opentelemetry`
- `opentelemetryWordmark`
- `opera`
- `operaWordmark`
- `packer`
- `packerWordmark`
- `pandas`
- `pandasWordmark`
- `passport`
- `perl`
- `phalcon`
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
- `postcss`
- `postcssWordmark`
- `postgresql`
- `postgresqlWordmark`
- `postman`
- `postmanWordmark`
- `powershell`
- `premierepro`
- `primeng`
- `processing`
- `processingWordmark`
- `processwireWordmark`
- `prolog`
- `prologWordmark`
- `prometheusWordmark`
- `protractor`
- `protractorWordmark`
- `proxmox`
- `proxmoxWordmark`
- `pug`
- `pulumi`
- `pulumiWordmark`
- `puppeteer`
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
- `pytorchWordmark`
- `qodana`
- `qodanaWordmark`
- `quarkus`
- `quarkusWordmark`
- `quasar`
- `quasarWordmark`
- `qwik`
- `qwikWordmark`
- `r`
- `rabbitmqWordmark`
- `racket`
- `radstudio`
- `rails`
- `railsWordmark`
- `rancherWordmark`
- `raspberrypi`
- `raspberrypiWordmark`
- `reach`
- `reactrouter`
- `reactrouterWordmark`
- `realm`
- `realmWordmark`
- `rect`
- `redhat`
- `redhatWordmark`
- `redis`
- `redisWordmark`
- `reflex`
- `reflexWordmark`
- `renpy`
- `replitWordmark`
- `rexx`
- `rexxWordmark`
- `rider`
- `riderWordmark`
- `rocksdb`
- `rockylinuxWordmark`
- `rollup`
- `rollupWordmark`
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
- `scala`
- `scalaWordmark`
- `scalingo`
- `scalingoWordmark`
- `scikitlearn`
- `sdl`
- `sequelize`
- `sequelizeWordmark`
- `shotgrid`
- `sketch`
- `sketchWordmark`
- `slack`
- `slackWordmark`
- `solidity`
- `solidjs`
- `solidjsWordmark`
- `sonarqubeWordmark`
- `sourceengine`
- `sourceengineWordmark`
- `spack`
- `spicedb`
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
- `stackblitzWordmark`
- `stackoverflow`
- `stackoverflowWordmark`
- `stenciljs`
- `stenciljsWordmark`
- `storybook`
- `storybookWordmark`
- `streamlit`
- `streamlitWordmark`
- `styledcomponents`
- `styledcomponentsWordmark`
- `subversionWordmark`
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
- `tailwindcssWordmark`
- `talos`
- `tauri`
- `tauriWordmark`
- `terraform`
- `terraformWordmark`
- `thealgorithms`
- `thealgorithmsWordmark`
- `threedsmax`
- `thymeleaf`
- `thymeleafWordmark`
- `tmux`
- `tmuxWordmark`
- `tortoisegit`
- `towergitWordmark`
- `traefikmeshWordmark`
- `traefikproxyWordmark`
- `travis`
- `travisWordmark`
- `trello`
- `trelloWordmark`
- `trpc`
- `trpcWordmark`
- `turboWordmark`
- `typescript`
- `typo3`
- `typo3Wordmark`
- `ubuntu`
- `ubuntuWordmark`
- `unifiedmodelinglanguage`
- `unifiedmodelinglanguageWordmark`
- `unity`
- `unityWordmark`
- `uwsgi`
- `v8`
- `vagrant`
- `vagrantWordmark`
- `vala`
- `valaWordmark`
- `vapor`
- `vaporWordmark`
- `vaultWordmark`
- `vertx`
- `vertxWordmark`
- `vim`
- `visualbasic`
- `visualstudio`
- `visualstudioWordmark`
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
- `vyper`
- `vyperWordmark`
- `waku`
- `wasmWordmark`
- `web3js`
- `webgpu`
- `webgpuWordmark`
- `weblate`
- `weblateWordmark`
- `webpack`
- `webpackWordmark`
- `webstorm`
- `webstormWordmark`
- `wolfram`
- `wolframWordmark`
- `woocommerce`
- `woocommerceWordmark`
- `wordpress`
- `wordpressWordmark`
- `xcode`
- `xd`
- `xml`
- `yaml`
- `yii`
- `yiiWordmark`
- `yugabytedb`
- `yugabytedbWordmark`
- `yunohost`
- `zend`
- `zendWordmark`
- `zigWordmark`
- `zsh`
- `zshWordmark`
- `zustand`

## Usage Examples

### Navigation Menu

```html
@js
  import { Aarch64Icon, AframeIcon, AftereffectsIcon, AkkaIcon } from '@stacksjs/iconify-devicon-plain'

  global.navIcons = {
    home: Aarch64Icon({ size: 20, class: 'nav-icon' }),
    about: AframeIcon({ size: 20, class: 'nav-icon' }),
    contact: AftereffectsIcon({ size: 20, class: 'nav-icon' }),
    settings: AkkaIcon({ size: 20, class: 'nav-icon' })
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
import { Aarch64Icon } from '@stacksjs/iconify-devicon-plain'

const icon = Aarch64Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { Aarch64Icon, AframeIcon, AftereffectsIcon } from '@stacksjs/iconify-devicon-plain'

const successIcon = Aarch64Icon({ size: 16, color: '#22c55e' })
const warningIcon = AframeIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AftereffectsIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { Aarch64Icon, AframeIcon } from '@stacksjs/iconify-devicon-plain'
   const icon = Aarch64Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { aarch64, aframe } from '@stacksjs/iconify-devicon-plain'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(aarch64, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { Aarch64Icon, AframeIcon } from '@stacksjs/iconify-devicon-plain'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-devicon-plain'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { Aarch64Icon } from '@stacksjs/iconify-devicon-plain'
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
import { aarch64 } from '@stacksjs/iconify-devicon-plain'

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
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/devicon-plain/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/devicon-plain/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
