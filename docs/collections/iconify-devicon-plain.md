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
    <AframeIcon size="24" color="#4a90e2" />
    <AftereffectsIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<Aarch64Icon size="24" color="red" />
<Aarch64Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<Aarch64Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<Aarch64Icon size="24" class="text-primary" />
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
.deviconPlain-icon {
  width: 1em;
  height: 1em;
}
```

```html
<Aarch64Icon class="deviconPlain-icon" />
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
<nav>
  <a href="/"><Aarch64Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AframeIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AftereffectsIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AkkaIcon size="20" class="nav-icon" /> Settings</a>
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
    <AframeIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AftereffectsIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <Aarch64Icon size="24" />
   <AframeIcon size="24" color="#4a90e2" />
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
     import { aarch64 } from '@stacksjs/iconify-devicon-plain'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(aarch64, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
