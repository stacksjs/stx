# Material Icon Theme

> Material Icon Theme icons for stx from Iconify

## Overview

This package provides access to 1104 icons from the Material Icon Theme collection through the stx iconify integration.

**Collection ID:** `material-icon-theme`
**Total Icons:** 1104
**Author:** Material Extensions ([Website](https://github.com/material-extensions/vscode-material-icon-theme))
**License:** MIT ([Details](https://github.com/material-extensions/vscode-material-icon-theme/blob/main/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-material-icon-theme
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dIcon, AbapIcon, AbcIcon } from '@stacksjs/iconify-material-icon-theme'

// Basic usage
const icon = 3dIcon()

// With size
const sizedIcon = 3dIcon({ size: 24 })

// With color
const coloredIcon = AbapIcon({ color: 'red' })

// With multiple props
const customIcon = AbcIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dIcon, AbapIcon, AbcIcon } from '@stacksjs/iconify-material-icon-theme'

  global.icons = {
    home: 3dIcon({ size: 24 }),
    user: AbapIcon({ size: 24, color: '#4a90e2' }),
    settings: AbcIcon({ size: 32 })
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
import { 3d, abap, abc } from '@stacksjs/iconify-material-icon-theme'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(3d, { size: 24 })
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
const redIcon = 3dIcon({ color: 'red' })
const blueIcon = 3dIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 3dIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 3dIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = 3dIcon({ size: 24 })
const icon1em = 3dIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 3dIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 3dIcon({ height: '1em' })
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
const smallIcon = 3dIcon({ class: 'icon-small' })
const largeIcon = 3dIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **1104** icons:

- `3d`
- `abap`
- `abc`
- `actionscript`
- `ada`
- `adobeIllustrator`
- `adobeIllustratorLight`
- `adobePhotoshop`
- `adobePhotoshopLight`
- `adobeSwc`
- `adonis`
- `advpl`
- `amplify`
- `android`
- `angular`
- `antlr`
- `apiblueprint`
- `apollo`
- `applescript`
- `appsScript`
- `appveyor`
- `architecture`
- `arduino`
- `asciidoc`
- `assembly`
- `astro`
- `astroConfig`
- `astyle`
- `audio`
- `aurelia`
- `authors`
- `auto`
- `autoLight`
- `autohotkey`
- `autoit`
- `azure`
- `azurePipelines`
- `babel`
- `ballerina`
- `bashly`
- `bashlyHook`
- `bazel`
- `bbx`
- `beancount`
- `benchJs`
- `benchJsx`
- `benchTs`
- `bibliography`
- `bibtexStyle`
- `bicep`
- `biome`
- `bitbucket`
- `bithound`
- `blender`
- `blink`
- `blinkLight`
- `blitz`
- `bower`
- `brainfuck`
- `browserlist`
- `browserlistLight`
- `bruno`
- `buck`
- `bucklescript`
- `buildkite`
- `bun`
- `bunLight`
- `c`
- `c3`
- `cabal`
- `caddy`
- `cadence`
- `cairo`
- `cake`
- `capacitor`
- `capnp`
- `cbx`
- `cds`
- `certificate`
- `changelog`
- `chess`
- `chessLight`
- `chrome`
- `circleci`
- `circleciLight`
- `citation`
- `clangd`
- `claude`
- `cline`
- `clojure`
- `cloudfoundry`
- `cmake`
- `coala`
- `cobol`
- `coconut`
- `codeClimate`
- `codeClimateLight`
- `codecov`
- `codeowners`
- `coderabbitAi`
- `coffee`
- `coldfusion`
- `coloredpetrinets`
- `command`
- `commitizen`
- `commitlint`
- `concourse`
- `conduct`
- `console`
- `contentlayer`
- `context`
- `contributing`
- `controller`
- `copilot`
- `copilotLight`
- `cpp`
- `craco`
- `credits`
- `crystal`
- `crystalLight`
- `csharp`
- `css`
- `cssMap`
- `cucumber`
- `cuda`
- `cursor`
- `cursorLight`
- `cypress`
- `d`
- `dart`
- `dartGenerated`
- `database`
- `deepsource`
- `denizenscript`
- `deno`
- `denoLight`
- `dependabot`
- `dependenciesUpdate`
- `dhall`
- `diff`
- `dinophp`
- `disc`
- `django`
- `dll`
- `docker`
- `doctexInstaller`
- `document`
- `dotjs`
- `drawio`
- `drizzle`
- `drone`
- `droneLight`
- `duc`
- `dune`
- `edge`
- `editorconfig`
- `ejs`
- `elixir`
- `elm`
- `email`
- `ember`
- `epub`
- `erlang`
- `esbuild`
- `eslint`
- `excalidraw`
- `exe`
- `fastlane`
- `favicon`
- `figma`
- `firebase`
- `flash`
- `flow`
- `folderAdmin`
- `folderAdminOpen`
- `folderAndroid`
- `folderAndroidOpen`
- `folderAngular`
- `folderAngularOpen`
- `folderAnimation`
- `folderAnimationOpen`
- `folderAnsible`
- `folderAnsibleOpen`
- `folderApi`
- `folderApiOpen`
- `folderApollo`
- `folderApolloOpen`
- `folderApp`
- `folderAppOpen`
- `folderArchive`
- `folderArchiveOpen`
- `folderAstro`
- `folderAstroOpen`
- `folderAtom`
- `folderAtomOpen`
- `folderAttachment`
- `folderAttachmentOpen`
- `folderAudio`
- `folderAudioOpen`
- `folderAurelia`
- `folderAureliaOpen`
- `folderAws`
- `folderAwsOpen`
- `folderAzurePipelines`
- `folderAzurePipelinesOpen`
- `folderBackup`
- `folderBackupOpen`
- `folderBase`
- `folderBaseOpen`
- `folderBatch`
- `folderBatchOpen`
- `folderBenchmark`
- `folderBenchmarkOpen`
- `folderBibliography`
- `folderBibliographyOpen`
- `folderBicep`
- `folderBicepOpen`
- `folderBlender`
- `folderBlenderOpen`
- `folderBloc`
- `folderBlocOpen`
- `folderBower`
- `folderBowerOpen`
- `folderBuildkite`
- `folderBuildkiteOpen`
- `folderCart`
- `folderCartOpen`
- `folderChangesets`
- `folderChangesetsOpen`
- `folderCi`
- `folderCiOpen`
- `folderCircleci`
- `folderCircleciOpen`
- `folderClass`
- `folderClassOpen`
- `folderClaude`
- `folderClaudeOpen`
- `folderClient`
- `folderClientOpen`
- `folderCline`
- `folderClineOpen`
- `folderCloudFunctions`
- `folderCloudFunctionsOpen`
- `folderCloudflare`
- `folderCloudflareOpen`
- `folderCluster`
- `folderClusterOpen`
- `folderCobol`
- `folderCobolOpen`
- `folderCommand`
- `folderCommandOpen`
- `folderComponents`
- `folderComponentsOpen`
- `folderConfig`
- `folderConfigOpen`
- `folderConnection`
- `folderConnectionOpen`
- `folderConsole`
- `folderConsoleOpen`
- `folderConstant`
- `folderConstantOpen`
- `folderContainer`
- `folderContainerOpen`
- `folderContent`
- `folderContentOpen`
- `folderContext`
- `folderContextOpen`
- `folderContract`
- `folderContractOpen`
- `folderController`
- `folderControllerOpen`
- `folderCore`
- `folderCoreOpen`
- `folderCoverage`
- `folderCoverageOpen`
- `folderCss`
- `folderCssOpen`
- `folderCursor`
- `folderCursorLight`
- `folderCursorOpen`
- `folderCursorOpenLight`
- `folderCustom`
- `folderCustomOpen`
- `folderCypress`
- `folderCypressOpen`
- `folderDart`
- `folderDartOpen`
- `folderDatabase`
- `folderDatabaseOpen`
- `folderDebug`
- `folderDebugOpen`
- `folderDecorators`
- `folderDecoratorsOpen`
- `folderDelta`
- `folderDeltaOpen`
- `folderDesktop`
- `folderDesktopOpen`
- `folderDirective`
- `folderDirectiveOpen`
- `folderDist`
- `folderDistOpen`
- `folderDocker`
- `folderDockerOpen`
- `folderDocs`
- `folderDocsOpen`
- `folderDownload`
- `folderDownloadOpen`
- `folderDrizzle`
- `folderDrizzleOpen`
- `folderDump`
- `folderDumpOpen`
- `folderElement`
- `folderElementOpen`
- `folderEnum`
- `folderEnumOpen`
- `folderEnvironment`
- `folderEnvironmentOpen`
- `folderError`
- `folderErrorOpen`
- `folderEvent`
- `folderEventOpen`
- `folderExamples`
- `folderExamplesOpen`
- `folderExpo`
- `folderExpoOpen`
- `folderExport`
- `folderExportOpen`
- `folderFastlane`
- `folderFastlaneOpen`
- `folderFavicon`
- `folderFaviconOpen`
- `folderFilter`
- `folderFilterOpen`
- `folderFirebase`
- `folderFirebaseOpen`
- `folderFirestore`
- `folderFirestoreOpen`
- `folderFlow`
- `folderFlowOpen`
- `folderFlutter`
- `folderFlutterOpen`
- `folderFont`
- `folderFontOpen`
- `folderForgejo`
- `folderForgejoOpen`
- `folderFunctions`
- `folderFunctionsOpen`
- `folderGamemaker`
- `folderGamemakerOpen`
- `folderGenerator`
- `folderGeneratorOpen`
- `folderGhWorkflows`
- `folderGhWorkflowsOpen`
- `folderGit`
- `folderGitOpen`
- `folderGitea`
- `folderGiteaOpen`
- `folderGithub`
- `folderGithubOpen`
- `folderGitlab`
- `folderGitlabOpen`
- `folderGlobal`
- `folderGlobalOpen`
- `folderGodot`
- `folderGodotOpen`
- `folderGradle`
- `folderGradleOpen`
- `folderGraphql`
- `folderGraphqlOpen`
- `folderGuard`
- `folderGuardOpen`
- `folderGulp`
- `folderGulpOpen`
- `folderHelm`
- `folderHelmOpen`
- `folderHelper`
- `folderHelperOpen`
- `folderHome`
- `folderHomeOpen`
- `folderHook`
- `folderHookOpen`
- `folderHusky`
- `folderHuskyOpen`
- `folderI18n`
- `folderI18nOpen`
- `folderImages`
- `folderImagesOpen`
- `folderImport`
- `folderImportOpen`
- `folderInclude`
- `folderIncludeOpen`
- `folderIntellij`
- `folderIntellijLight`
- `folderIntellijOpen`
- `folderIntellijOpenLight`
- `folderInterceptor`
- `folderInterceptorOpen`
- `folderInterface`
- `folderInterfaceOpen`
- `folderIos`
- `folderIosOpen`
- `folderJava`
- `folderJavaOpen`
- `folderJavascript`
- `folderJavascriptOpen`
- `folderJinja`
- `folderJinjaLight`
- `folderJinjaOpen`
- `folderJinjaOpenLight`
- `folderJob`
- `folderJobOpen`
- `folderJson`
- `folderJsonOpen`
- `folderJupyter`
- `folderJupyterOpen`
- `folderKeys`
- `folderKeysOpen`
- `folderKubernetes`
- `folderKubernetesOpen`
- `folderKusto`
- `folderKustoOpen`
- `folderLayout`
- `folderLayoutOpen`
- `folderLefthook`
- `folderLefthookOpen`
- `folderLess`
- `folderLessOpen`
- `folderLib`
- `folderLibOpen`
- `folderLink`
- `folderLinkOpen`
- `folderLinux`
- `folderLinuxOpen`
- `folderLiquibase`
- `folderLiquibaseOpen`
- `folderLog`
- `folderLogOpen`
- `folderLottie`
- `folderLottieOpen`
- `folderLua`
- `folderLuaOpen`
- `folderLuau`
- `folderLuauOpen`
- `folderMacos`
- `folderMacosOpen`
- `folderMail`
- `folderMailOpen`
- `folderMappings`
- `folderMappingsOpen`
- `folderMarkdown`
- `folderMarkdownOpen`
- `folderMercurial`
- `folderMercurialOpen`
- `folderMessages`
- `folderMessagesOpen`
- `folderMeta`
- `folderMetaOpen`
- `folderMetro`
- `folderMetroOpen`
- `folderMiddleware`
- `folderMiddlewareOpen`
- `folderMjml`
- `folderMjmlOpen`
- `folderMobile`
- `folderMobileOpen`
- `folderMock`
- `folderMockOpen`
- `folderMojo`
- `folderMojoOpen`
- `folderMolecule`
- `folderMoleculeOpen`
- `folderMoon`
- `folderMoonOpen`
- `folderNetlify`
- `folderNetlifyOpen`
- `folderNext`
- `folderNextOpen`
- `folderNgrxStore`
- `folderNgrxStoreOpen`
- `folderNode`
- `folderNodeOpen`
- `folderNuxt`
- `folderNuxtOpen`
- `folderObsidian`
- `folderObsidianOpen`
- `folderOrganism`
- `folderOrganismOpen`
- `folderOther`
- `folderOtherOpen`
- `folderPackages`
- `folderPackagesOpen`
- `folderPdf`
- `folderPdfOpen`
- `folderPdm`
- `folderPdmOpen`
- `folderPhp`
- `folderPhpOpen`
- `folderPhpmailer`
- `folderPhpmailerOpen`
- `folderPipe`
- `folderPipeOpen`
- `folderPlastic`
- `folderPlasticOpen`
- `folderPlugin`
- `folderPluginOpen`
- `folderPolicy`
- `folderPolicyOpen`
- `folderPowershell`
- `folderPowershellOpen`
- `folderPrisma`
- `folderPrismaOpen`
- `folderPrivate`
- `folderPrivateOpen`
- `folderProject`
- `folderProjectOpen`
- `folderPrompts`
- `folderPromptsOpen`
- `folderProto`
- `folderProtoOpen`
- `folderPublic`
- `folderPublicOpen`
- `folderPython`
- `folderPythonOpen`
- `folderPytorch`
- `folderPytorchOpen`
- `folderQuasar`
- `folderQuasarOpen`
- `folderQueue`
- `folderQueueOpen`
- `folderReactComponents`
- `folderReactComponentsOpen`
- `folderReduxReducer`
- `folderReduxReducerOpen`
- `folderRepository`
- `folderRepositoryOpen`
- `folderResolver`
- `folderResolverOpen`
- `folderResource`
- `folderResourceOpen`
- `folderReview`
- `folderReviewOpen`
- `folderRobot`
- `folderRobotOpen`
- `folderRoutes`
- `folderRoutesOpen`
- `folderRules`
- `folderRulesOpen`
- `folderRust`
- `folderRustOpen`
- `folderSandbox`
- `folderSandboxOpen`
- `folderSass`
- `folderSassOpen`
- `folderScala`
- `folderScalaOpen`
- `folderScons`
- `folderSconsOpen`
- `folderScripts`
- `folderScriptsOpen`
- `folderSecure`
- `folderSecureOpen`
- `folderSeeders`
- `folderSeedersOpen`
- `folderServer`
- `folderServerOpen`
- `folderServerless`
- `folderServerlessOpen`
- `folderShader`
- `folderShaderOpen`
- `folderShared`
- `folderSharedOpen`
- `folderSnapcraft`
- `folderSnapcraftOpen`
- `folderSnippet`
- `folderSnippetOpen`
- `folderSrc`
- `folderSrcOpen`
- `folderSrcTauri`
- `folderSrcTauriOpen`
- `folderStack`
- `folderStackOpen`
- `folderStencil`
- `folderStencilOpen`
- `folderStore`
- `folderStoreOpen`
- `folderStorybook`
- `folderStorybookOpen`
- `folderStylus`
- `folderStylusOpen`
- `folderSublime`
- `folderSublimeOpen`
- `folderSupabase`
- `folderSupabaseOpen`
- `folderSvelte`
- `folderSvelteOpen`
- `folderSvg`
- `folderSvgOpen`
- `folderSyntax`
- `folderSyntaxOpen`
- `folderTarget`
- `folderTargetOpen`
- `folderTaskfile`
- `folderTaskfileOpen`
- `folderTasks`
- `folderTasksOpen`
- `folderTelevision`
- `folderTelevisionOpen`
- `folderTemp`
- `folderTempOpen`
- `folderTemplate`
- `folderTemplateOpen`
- `folderTerraform`
- `folderTerraformOpen`
- `folderTest`
- `folderTestOpen`
- `folderTheme`
- `folderThemeOpen`
- `folderToc`
- `folderTocOpen`
- `folderTools`
- `folderToolsOpen`
- `folderTrash`
- `folderTrashOpen`
- `folderTrigger`
- `folderTriggerOpen`
- `folderTurborepo`
- `folderTurborepoOpen`
- `folderTypescript`
- `folderTypescriptOpen`
- `folderUi`
- `folderUiOpen`
- `folderUnity`
- `folderUnityOpen`
- `folderUpdate`
- `folderUpdateOpen`
- `folderUpload`
- `folderUploadOpen`
- `folderUtils`
- `folderUtilsOpen`
- `folderVercel`
- `folderVercelOpen`
- `folderVerdaccio`
- `folderVerdaccioOpen`
- `folderVideo`
- `folderVideoOpen`
- `folderViews`
- `folderViewsOpen`
- `folderVm`
- `folderVmOpen`
- `folderVscode`
- `folderVscodeOpen`
- `folderVue`
- `folderVueDirectives`
- `folderVueDirectivesOpen`
- `folderVueOpen`
- `folderVuepress`
- `folderVuepressOpen`
- `folderVuexStore`
- `folderVuexStoreOpen`
- `folderWakatime`
- `folderWakatimeOpen`
- `folderWebpack`
- `folderWebpackOpen`
- `folderWindows`
- `folderWindowsOpen`
- `folderWordpress`
- `folderWordpressOpen`
- `folderYarn`
- `folderYarnOpen`
- `folderZeabur`
- `folderZeaburOpen`
- `font`
- `forth`
- `fortran`
- `foxpro`
- `freemarker`
- `fsharp`
- `fusebox`
- `gamemaker`
- `garden`
- `gatsby`
- `gcp`
- `gemfile`
- `gemini`
- `geminiAi`
- `git`
- `githubActionsWorkflow`
- `githubSponsors`
- `gitlab`
- `gitpod`
- `gleam`
- `gnuplot`
- `go`
- `goGopher`
- `goMod`
- `godot`
- `godotAssets`
- `google`
- `gradle`
- `grafanaAlloy`
- `grain`
- `graphcool`
- `graphql`
- `gridsome`
- `groovy`
- `grunt`
- `gulp`
- `h`
- `hack`
- `hadolint`
- `haml`
- `handlebars`
- `happo`
- `hardhat`
- `harmonix`
- `haskell`
- `haxe`
- `hcl`
- `hclLight`
- `helm`
- `heroku`
- `hex`
- `histoire`
- `hjson`
- `horusec`
- `hosts`
- `hostsLight`
- `hpp`
- `html`
- `http`
- `huff`
- `huffLight`
- `hurl`
- `husky`
- `i18n`
- `idris`
- `ifanrCloud`
- `image`
- `imba`
- `installation`
- `ionic`
- `istanbul`
- `jar`
- `java`
- `javaclass`
- `javascript`
- `javascriptMap`
- `jenkins`
- `jest`
- `jinja`
- `jinjaLight`
- `jsconfig`
- `json`
- `jsr`
- `jsrLight`
- `julia`
- `jupyter`
- `just`
- `karma`
- `kcl`
- `key`
- `keystatic`
- `kivy`
- `kl`
- `knip`
- `kotlin`
- `kubernetes`
- `kusto`
- `label`
- `laravel`
- `latexmk`
- `lbx`
- `lefthook`
- `lerna`
- `less`
- `liara`
- `lib`
- `lighthouse`
- `lilypond`
- `lintstaged`
- `liquid`
- `lisp`
- `livescript`
- `lock`
- `log`
- `lolcode`
- `lottie`
- `lua`
- `luau`
- `lyric`
- `makefile`
- `markdoc`
- `markdocConfig`
- `markdown`
- `markdownlint`
- `markojs`
- `mathematica`
- `matlab`
- `maven`
- `mdsvex`
- `mdx`
- `mercurial`
- `merlin`
- `mermaid`
- `meson`
- `metro`
- `minecraft`
- `minecraftFabric`
- `mint`
- `mjml`
- `mocha`
- `modernizr`
- `mojo`
- `moon`
- `moonscript`
- `mxml`
- `nanoStaged`
- `nanoStagedLight`
- `ndst`
- `nest`
- `netlify`
- `netlifyLight`
- `next`
- `nextLight`
- `nginx`
- `ngrxActions`
- `ngrxEffects`
- `ngrxEntity`
- `ngrxReducer`
- `ngrxSelectors`
- `ngrxState`
- `nim`
- `nix`
- `nodejs`
- `nodejsAlt`
- `nodemon`
- `npm`
- `nuget`
- `nunjucks`
- `nuxt`
- `nx`
- `objectiveC`
- `objectiveCpp`
- `ocaml`
- `odin`
- `onnx`
- `opa`
- `opam`
- `openapi`
- `openapiLight`
- `opentofu`
- `opentofuLight`
- `otne`
- `oxlint`
- `packship`
- `palette`
- `panda`
- `parcel`
- `pascal`
- `pawn`
- `payload`
- `payloadLight`
- `pdf`
- `pdm`
- `percy`
- `perl`
- `php`
- `phpCsFixer`
- `phpElephant`
- `phpElephantPink`
- `phpstan`
- `phpunit`
- `pinejs`
- `pipeline`
- `pkl`
- `plastic`
- `playwright`
- `plop`
- `pm2Ecosystem`
- `pnpm`
- `pnpmLight`
- `poetry`
- `postcss`
- `posthtml`
- `powerpoint`
- `powershell`
- `preCommit`
- `prettier`
- `prisma`
- `processing`
- `prolog`
- `prompt`
- `proto`
- `protractor`
- `pug`
- `puppet`
- `puppeteer`
- `purescript`
- `python`
- `pythonMisc`
- `pytorch`
- `qsharp`
- `quarto`
- `quasar`
- `quokka`
- `qwik`
- `r`
- `racket`
- `raml`
- `razor`
- `rbxmk`
- `rc`
- `react`
- `reactTs`
- `readme`
- `reason`
- `red`
- `reduxAction`
- `reduxReducer`
- `reduxSelector`
- `reduxStore`
- `regedit`
- `remark`
- `remix`
- `remixLight`
- `renovate`
- `replit`
- `rescript`
- `rescriptInterface`
- `restql`
- `riot`
- `roadmap`
- `roblox`
- `robot`
- `robots`
- `rocket`
- `rojo`
- `rollup`
- `rome`
- `routing`
- `rspec`
- `rubocop`
- `rubocopLight`
- `ruby`
- `ruff`
- `rust`
- `salesforce`
- `san`
- `sas`
- `sass`
- `sbt`
- `scala`
- `scheme`
- `scons`
- `sconsLight`
- `screwdriver`
- `search`
- `semanticRelease`
- `semanticReleaseLight`
- `semgrep`
- `sentry`
- `sequelize`
- `serverless`
- `settings`
- `shader`
- `silverstripe`
- `simulink`
- `siyuan`
- `sketch`
- `slim`
- `slint`
- `slug`
- `smarty`
- `sml`
- `snakemake`
- `snapcraft`
- `snowpack`
- `snowpackLight`
- `snyk`
- `solidity`
- `sonarcloud`
- `spwn`
- `stackblitz`
- `stan`
- `steadybit`
- `stencil`
- `stitches`
- `stitchesLight`
- `storybook`
- `stryker`
- `stylable`
- `stylelint`
- `stylelintLight`
- `stylus`
- `sublime`
- `subtitles`
- `supabase`
- `svelte`
- `svg`
- `svgo`
- `svgr`
- `swagger`
- `sway`
- `swc`
- `swift`
- `syncpack`
- `systemd`
- `systemdLight`
- `table`
- `tailwindcss`
- `taskfile`
- `tauri`
- `taze`
- `tcl`
- `teal`
- `templ`
- `template`
- `terraform`
- `testJs`
- `testJsx`
- `testTs`
- `tex`
- `textlint`
- `tilt`
- `tldraw`
- `tldrawLight`
- `tobi`
- `tobimake`
- `toc`
- `todo`
- `toml`
- `tomlLight`
- `travis`
- `tree`
- `trigger`
- `tsconfig`
- `tsdoc`
- `tsil`
- `tune`
- `turborepo`
- `turborepoLight`
- `twig`
- `twine`
- `typescript`
- `typescriptDef`
- `typst`
- `umi`
- `uml`
- `umlLight`
- `unity`
- `unocss`
- `url`
- `uv`
- `vagrant`
- `vala`
- `vanillaExtract`
- `varnish`
- `vedic`
- `velite`
- `velocity`
- `vercel`
- `vercelLight`
- `verdaccio`
- `verified`
- `verilog`
- `verse`
- `verseLight`
- `vfl`
- `video`
- `vim`
- `virtual`
- `visualstudio`
- `vite`
- `vitest`
- `vlang`
- `vscode`
- `vue`
- `vueConfig`
- `vuexStore`
- `wakatime`
- `wakatimeLight`
- `wallaby`
- `wally`
- `watchman`
- `webassembly`
- `webhint`
- `webpack`
- `wepy`
- `werf`
- `windicss`
- `wolframlanguage`
- `word`
- `wrangler`
- `wxt`
- `xaml`
- `xmake`
- `xml`
- `yaml`
- `yang`
- `yarn`
- `zeabur`
- `zeaburLight`
- `zig`
- `zip`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dIcon, AbapIcon, AbcIcon, ActionscriptIcon } from '@stacksjs/iconify-material-icon-theme'

  global.navIcons = {
    home: 3dIcon({ size: 20, class: 'nav-icon' }),
    about: AbapIcon({ size: 20, class: 'nav-icon' }),
    contact: AbcIcon({ size: 20, class: 'nav-icon' }),
    settings: ActionscriptIcon({ size: 20, class: 'nav-icon' })
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
import { 3dIcon } from '@stacksjs/iconify-material-icon-theme'

const icon = 3dIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dIcon, AbapIcon, AbcIcon } from '@stacksjs/iconify-material-icon-theme'

const successIcon = 3dIcon({ size: 16, color: '#22c55e' })
const warningIcon = AbapIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AbcIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dIcon, AbapIcon } from '@stacksjs/iconify-material-icon-theme'
   const icon = 3dIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3d, abap } from '@stacksjs/iconify-material-icon-theme'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3d, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dIcon, AbapIcon } from '@stacksjs/iconify-material-icon-theme'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-material-icon-theme'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dIcon } from '@stacksjs/iconify-material-icon-theme'
     global.icon = 3dIcon({ size: 24 })
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
   const icon = 3dIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 3d } from '@stacksjs/iconify-material-icon-theme'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/material-extensions/vscode-material-icon-theme/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Material Extensions ([Website](https://github.com/material-extensions/vscode-material-icon-theme))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/material-icon-theme/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/material-icon-theme/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
