# Catppuccin Icons

> Catppuccin Icons icons for stx from Iconify

## Overview

This package provides access to 659 icons from the Catppuccin Icons collection through the stx iconify integration.

**Collection ID:** `catppuccin`
**Total Icons:** 659
**Author:** Catppuccin ([Website](https://github.com/catppuccin/vscode-icons))
**License:** MIT ([Details](https://github.com/catppuccin/vscode-icons/blob/main/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-catppuccin
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 3dIcon, AdobeAeIcon, AdobeAiIcon } from '@stacksjs/iconify-catppuccin'

// Basic usage
const icon = 3dIcon()

// With size
const sizedIcon = 3dIcon({ size: 24 })

// With color
const coloredIcon = AdobeAeIcon({ color: 'red' })

// With multiple props
const customIcon = AdobeAiIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 3dIcon, AdobeAeIcon, AdobeAiIcon } from '@stacksjs/iconify-catppuccin'

  global.icons = {
    home: 3dIcon({ size: 24 }),
    user: AdobeAeIcon({ size: 24, color: '#4a90e2' }),
    settings: AdobeAiIcon({ size: 32 })
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
import { 3d, adobeAe, adobeAi } from '@stacksjs/iconify-catppuccin'
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

This package contains **659** icons:

- `3d`
- `adobeAe`
- `adobeAi`
- `adobeId`
- `adobePs`
- `adobeXd`
- `adonis`
- `alex`
- `amber`
- `android`
- `angular`
- `angularComponent`
- `angularDirective`
- `angularGuard`
- `angularPipe`
- `angularService`
- `ansibleLint`
- `antlr`
- `apache`
- `apiBlueprint`
- `apollo`
- `apple`
- `arduino`
- `asciidoc`
- `assembly`
- `astro`
- `astroConfig`
- `audio`
- `autohotkey`
- `azurePipelines`
- `babel`
- `bash`
- `batch`
- `bazel`
- `benchmark`
- `bicep`
- `binary`
- `biome`
- `bitbucket`
- `blink`
- `blitz`
- `bower`
- `browserslist`
- `bun`
- `bunLock`
- `c`
- `cHeader`
- `cabal`
- `caddy`
- `capacitor`
- `cargo`
- `cargoLock`
- `certificate`
- `changelog`
- `circleCi`
- `clojure`
- `cmake`
- `cobol`
- `codeClimate`
- `codeOfConduct`
- `codeowners`
- `coffeescript`
- `commitlint`
- `config`
- `contributing`
- `cpp`
- `cppHeader`
- `crystal`
- `csharp`
- `cspell`
- `css`
- `cssMap`
- `css3`
- `csv`
- `cucumber`
- `cuda`
- `cue`
- `cursor`
- `cursorIgnore`
- `cypress`
- `d`
- `darklua`
- `dart`
- `dartGenerated`
- `database`
- `deno`
- `denoLock`
- `dependabot`
- `devcontainer`
- `dhall`
- `diff`
- `django`
- `docker`
- `dockerCompose`
- `dockerIgnore`
- `docusaurus`
- `drawio`
- `drizzleOrm`
- `dub`
- `dubSelections`
- `editorconfig`
- `ejs`
- `eleventy`
- `elixir`
- `elm`
- `ember`
- `env`
- `envrc`
- `erlang`
- `esbuild`
- `eslint`
- `eslintIgnore`
- `exe`
- `fastlane`
- `favicon`
- `figma`
- `file`
- `firebase`
- `flutter`
- `folder`
- `folderAdmin`
- `folderAdminOpen`
- `folderAndroid`
- `folderAndroidOpen`
- `folderAnimation`
- `folderAnimationOpen`
- `folderApi`
- `folderApiOpen`
- `folderApp`
- `folderAppOpen`
- `folderAssets`
- `folderAssetsOpen`
- `folderAudio`
- `folderAudioOpen`
- `folderAudit`
- `folderAuditOpen`
- `folderAws`
- `folderAwsOpen`
- `folderAzureDevops`
- `folderAzureDevopsOpen`
- `folderAzurePipelines`
- `folderAzurePipelinesOpen`
- `folderBenchmark`
- `folderBenchmarkOpen`
- `folderCaddy`
- `folderCaddyOpen`
- `folderCargo`
- `folderCargoOpen`
- `folderCircleCi`
- `folderCircleCiOpen`
- `folderClient`
- `folderClientOpen`
- `folderCloud`
- `folderCloudOpen`
- `folderCommand`
- `folderCommandOpen`
- `folderComponents`
- `folderComponentsOpen`
- `folderComposables`
- `folderComposablesOpen`
- `folderConfig`
- `folderConfigOpen`
- `folderConnection`
- `folderConnectionOpen`
- `folderConstant`
- `folderConstantOpen`
- `folderContent`
- `folderContentOpen`
- `folderControllers`
- `folderControllersOpen`
- `folderCore`
- `folderCoreOpen`
- `folderCoverage`
- `folderCoverageOpen`
- `folderCursor`
- `folderCursorOpen`
- `folderCypress`
- `folderCypressOpen`
- `folderDatabase`
- `folderDatabaseOpen`
- `folderDebug`
- `folderDebugOpen`
- `folderDevcontainer`
- `folderDevcontainerOpen`
- `folderDirenv`
- `folderDirenvOpen`
- `folderDist`
- `folderDistOpen`
- `folderDocker`
- `folderDockerOpen`
- `folderDocs`
- `folderDocsOpen`
- `folderDownload`
- `folderDownloadOpen`
- `folderDrizzleOrm`
- `folderDrizzleOrmOpen`
- `folderExamples`
- `folderExamplesOpen`
- `folderFastlane`
- `folderFastlaneOpen`
- `folderFirebase`
- `folderFirebaseOpen`
- `folderFonts`
- `folderFontsOpen`
- `folderForgejo`
- `folderForgejoOpen`
- `folderFunctions`
- `folderFunctionsOpen`
- `folderFvm`
- `folderFvmOpen`
- `folderGit`
- `folderGitOpen`
- `folderGithub`
- `folderGithubOpen`
- `folderGitlab`
- `folderGitlabOpen`
- `folderGradle`
- `folderGradleOpen`
- `folderGraphql`
- `folderGraphqlOpen`
- `folderHooks`
- `folderHooksOpen`
- `folderHusky`
- `folderHuskyOpen`
- `folderImages`
- `folderImagesOpen`
- `folderInclude`
- `folderIncludeOpen`
- `folderIntellij`
- `folderIntellijOpen`
- `folderJavascript`
- `folderJavascriptOpen`
- `folderKubernetes`
- `folderKubernetesOpen`
- `folderLayouts`
- `folderLayoutsOpen`
- `folderLib`
- `folderLibOpen`
- `folderLinux`
- `folderLinuxOpen`
- `folderLocales`
- `folderLocalesOpen`
- `folderLuau`
- `folderLuauOpen`
- `folderLune`
- `folderLuneOpen`
- `folderMacos`
- `folderMacosOpen`
- `folderMessages`
- `folderMessagesOpen`
- `folderMiddleware`
- `folderMiddlewareOpen`
- `folderMocks`
- `folderMocksOpen`
- `folderMoonrepo`
- `folderMoonrepoOpen`
- `folderNext`
- `folderNextOpen`
- `folderNix`
- `folderNixOpen`
- `folderNode`
- `folderNodeOpen`
- `folderNuxt`
- `folderNuxtOpen`
- `folderOpen`
- `folderPackages`
- `folderPackagesOpen`
- `folderPesde`
- `folderPesdeOpen`
- `folderPlugins`
- `folderPluginsOpen`
- `folderPreCommit`
- `folderPreCommitOpen`
- `folderPrisma`
- `folderPrismaOpen`
- `folderPrivate`
- `folderPrivateOpen`
- `folderProto`
- `folderProtoOpen`
- `folderPublic`
- `folderPublicOpen`
- `folderQueue`
- `folderQueueOpen`
- `folderRedux`
- `folderReduxOpen`
- `folderRenovate`
- `folderRenovateOpen`
- `folderRoblox`
- `folderRobloxOpen`
- `folderRoutes`
- `folderRoutesOpen`
- `folderSass`
- `folderSassOpen`
- `folderScripts`
- `folderScriptsOpen`
- `folderSecurity`
- `folderSecurityOpen`
- `folderServer`
- `folderServerOpen`
- `folderShared`
- `folderSharedOpen`
- `folderSrc`
- `folderSrcOpen`
- `folderStorybook`
- `folderStorybookOpen`
- `folderStyles`
- `folderStylesOpen`
- `folderSvg`
- `folderSvgOpen`
- `folderSymlink`
- `folderSymlinkOpen`
- `folderTauri`
- `folderTauriOpen`
- `folderTemp`
- `folderTempOpen`
- `folderTemplates`
- `folderTemplatesOpen`
- `folderTests`
- `folderTestsOpen`
- `folderThemes`
- `folderThemesOpen`
- `folderTurbo`
- `folderTurboOpen`
- `folderTypes`
- `folderTypesOpen`
- `folderUpload`
- `folderUploadOpen`
- `folderUtils`
- `folderUtilsOpen`
- `folderVercel`
- `folderVercelOpen`
- `folderVideo`
- `folderVideoOpen`
- `folderViews`
- `folderViewsOpen`
- `folderVscode`
- `folderVscodeOpen`
- `folderWindows`
- `folderWindowsOpen`
- `folderWorkflows`
- `folderWorkflowsOpen`
- `folderWxt`
- `folderWxtOpen`
- `folderXcode`
- `folderXcodeOpen`
- `folderXmake`
- `folderXmakeOpen`
- `folderYarn`
- `folderYarnOpen`
- `font`
- `foreman`
- `forgejo`
- `fortran`
- `fsharp`
- `fvm`
- `gatsby`
- `gcp`
- `git`
- `gitCliff`
- `gitlab`
- `gitpod`
- `gleam`
- `gleamConfig`
- `go`
- `goMod`
- `goTemplate`
- `godot`
- `godotAssets`
- `gradle`
- `graphql`
- `groovy`
- `gulp`
- `hacking`
- `haml`
- `handlebars`
- `hardhat`
- `hare`
- `haskell`
- `haxe`
- `helm`
- `heroku`
- `histoire`
- `html`
- `http`
- `huff`
- `hugo`
- `humans`
- `husky`
- `image`
- `ionic`
- `java`
- `javaAlt1`
- `javaAlt2`
- `javaAlt3`
- `javaAnnotation`
- `javaClass`
- `javaClassAbstract`
- `javaClassFinal`
- `javaClassSealed`
- `javaEnum`
- `javaException`
- `javaInterface`
- `javaJar`
- `javaRecord`
- `javascript`
- `javascriptConfig`
- `javascriptMap`
- `javascriptReact`
- `javascriptTest`
- `jest`
- `jinja`
- `json`
- `jsonSchema`
- `juce`
- `jule`
- `julia`
- `jupyter`
- `just`
- `kdl`
- `key`
- `knip`
- `kotlin`
- `laravel`
- `latex`
- `latte`
- `lerna`
- `less`
- `lib`
- `license`
- `lintStaged`
- `liquid`
- `lisp`
- `lock`
- `log`
- `lua`
- `luaCheck`
- `luaClient`
- `luaRocks`
- `luaServer`
- `luaTest`
- `luau`
- `luauCheck`
- `luauClient`
- `luauConfig`
- `luauServer`
- `luauTest`
- `macos`
- `makefile`
- `mantle`
- `markdown`
- `markdownMdx`
- `marko`
- `matlab`
- `mdbook`
- `mermaid`
- `meson`
- `midi`
- `mjml`
- `modernizr`
- `moonrepo`
- `moonwave`
- `msExcel`
- `msPowerpoint`
- `msWord`
- `msbuild`
- `nativescript`
- `nest`
- `nestController`
- `nestDecorator`
- `nestFilter`
- `nestGateway`
- `nestGuard`
- `nestMiddleware`
- `nestPipe`
- `nestService`
- `netlify`
- `next`
- `nextflow`
- `nginx`
- `nim`
- `ninja`
- `nix`
- `nixLock`
- `nodemon`
- `npm`
- `npmIgnore`
- `npmLock`
- `nuget`
- `nunjucks`
- `nuxt`
- `nuxtIgnore`
- `nx`
- `nxIgnore`
- `ocaml`
- `odin`
- `opentofu`
- `org`
- `packageJson`
- `pandaCss`
- `pdf`
- `perl`
- `pesde`
- `pesdeLock`
- `php`
- `phrase`
- `phtml`
- `pixi`
- `pixiLock`
- `plantuml`
- `playwright`
- `plop`
- `pnpm`
- `pnpmLock`
- `poetryLock`
- `postcss`
- `powershell`
- `preCommit`
- `premake`
- `prettier`
- `prettierIgnore`
- `prisma`
- `prolog`
- `properties`
- `proto`
- `prototools`
- `pug`
- `puppet`
- `puppeteer`
- `python`
- `pythonCompiled`
- `pythonConfig`
- `qwik`
- `r`
- `racket`
- `razor`
- `rdata`
- `readme`
- `reason`
- `redwood`
- `release`
- `remix`
- `renovate`
- `rescript`
- `rmd`
- `roblox`
- `robots`
- `rocket`
- `rojo`
- `rokit`
- `rollup`
- `root`
- `rootOpen`
- `rproj`
- `rsml`
- `ruby`
- `rubyGem`
- `rubyGemLock`
- `ruff`
- `rust`
- `rustAlt`
- `rustAltConfig`
- `rustConfig`
- `salesforce`
- `sass`
- `scala`
- `scheme`
- `search`
- `security`
- `semanticRelease`
- `semgrep`
- `semgrepIgnore`
- `sentry`
- `serverless`
- `shader`
- `sketch`
- `slidesk`
- `snowpack`
- `solid`
- `solidity`
- `sonarCloud`
- `spwn`
- `squirrel`
- `stackblitz`
- `stata`
- `stencil`
- `stitches`
- `storybook`
- `storybookSvelte`
- `storybookVue`
- `stylelint`
- `stylelintIgnore`
- `stylua`
- `styluaIgnore`
- `sublime`
- `superCollider`
- `svelte`
- `svelteConfig`
- `svg`
- `swift`
- `swiftformat`
- `symlink`
- `tailwind`
- `taskfile`
- `tauri`
- `tauriIgnore`
- `terraform`
- `text`
- `todo`
- `toml`
- `turbo`
- `twig`
- `twine`
- `typescript`
- `typescriptConfig`
- `typescriptDef`
- `typescriptReact`
- `typescriptTest`
- `typst`
- `unity`
- `unocss`
- `url`
- `uv`
- `v`
- `vala`
- `vanillaExtract`
- `vapi`
- `vento`
- `vercel`
- `vercelIgnore`
- `verilog`
- `vhs`
- `video`
- `vim`
- `visualStudio`
- `vital`
- `vite`
- `vitest`
- `vsCodium`
- `vscode`
- `vscodeIgnore`
- `vue`
- `vueConfig`
- `wally`
- `webAssembly`
- `webpack`
- `windi`
- `workflow`
- `wrangler`
- `wxt`
- `xaml`
- `xcode`
- `xmake`
- `xml`
- `yaml`
- `yarn`
- `yarnLock`
- `zap`
- `zig`
- `zip`

## Usage Examples

### Navigation Menu

```html
@js
  import { 3dIcon, AdobeAeIcon, AdobeAiIcon, AdobeIdIcon } from '@stacksjs/iconify-catppuccin'

  global.navIcons = {
    home: 3dIcon({ size: 20, class: 'nav-icon' }),
    about: AdobeAeIcon({ size: 20, class: 'nav-icon' }),
    contact: AdobeAiIcon({ size: 20, class: 'nav-icon' }),
    settings: AdobeIdIcon({ size: 20, class: 'nav-icon' })
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
import { 3dIcon } from '@stacksjs/iconify-catppuccin'

const icon = 3dIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 3dIcon, AdobeAeIcon, AdobeAiIcon } from '@stacksjs/iconify-catppuccin'

const successIcon = 3dIcon({ size: 16, color: '#22c55e' })
const warningIcon = AdobeAeIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AdobeAiIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 3dIcon, AdobeAeIcon } from '@stacksjs/iconify-catppuccin'
   const icon = 3dIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 3d, adobeAe } from '@stacksjs/iconify-catppuccin'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(3d, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 3dIcon, AdobeAeIcon } from '@stacksjs/iconify-catppuccin'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-catppuccin'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 3dIcon } from '@stacksjs/iconify-catppuccin'
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
import { 3d } from '@stacksjs/iconify-catppuccin'

// Icons are typed as IconData
const myIcon: IconData = 3d
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/catppuccin/vscode-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Catppuccin ([Website](https://github.com/catppuccin/vscode-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/catppuccin/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/catppuccin/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
