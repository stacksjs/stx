# VSCode Icons

> VSCode Icons icons for stx from Iconify

## Overview

This package provides access to 1400 icons from the VSCode Icons collection through the stx iconify integration.

**Collection ID:** `vscode-icons`
**Total Icons:** 1400
**Author:** Roberto Huertas ([Website](https://github.com/vscode-icons/vscode-icons))
**License:** MIT ([Details](https://github.com/vscode-icons/vscode-icons/blob/master/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-vscode-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<DefaultFileIcon height="1em" />
<DefaultFileIcon width="1em" height="1em" />
<DefaultFileIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<DefaultFileIcon size="24" />
<DefaultFileIcon size="1em" />

<!-- Using width and height -->
<DefaultFileIcon width="24" height="32" />

<!-- With color -->
<DefaultFileIcon size="24" color="red" />
<DefaultFileIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<DefaultFileIcon size="24" class="icon-primary" />

<!-- With all properties -->
<DefaultFileIcon
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
    <DefaultFileIcon size="24" />
    <DefaultFolderIcon size="24" color="#4a90e2" />
    <DefaultFolderOpenedIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { defaultFile, defaultFolder, defaultFolderOpened } from '@stacksjs/iconify-vscode-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(defaultFile, { size: 24 })
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
<DefaultFileIcon size="24" color="red" />
<DefaultFileIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<DefaultFileIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<DefaultFileIcon size="24" class="text-primary" />
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
<DefaultFileIcon height="1em" />
<DefaultFileIcon width="1em" height="1em" />
<DefaultFileIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<DefaultFileIcon size="24" />
<DefaultFileIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.vscodeIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<DefaultFileIcon class="vscodeIcons-icon" />
```

## Available Icons

This package contains **1400** icons:

- `defaultFile`
- `defaultFolder`
- `defaultFolderOpened`
- `defaultRootFolder`
- `defaultRootFolderOpened`
- `fileTypeAccess`
- `fileTypeAccess2`
- `fileTypeActionscript`
- `fileTypeActionscript2`
- `fileTypeAda`
- `fileTypeAdvpl`
- `fileTypeAffinitydesigner`
- `fileTypeAffinityphoto`
- `fileTypeAffinitypublisher`
- `fileTypeAgda`
- `fileTypeAi`
- `fileTypeAi2`
- `fileTypeAl`
- `fileTypeAlDal`
- `fileTypeAllcontributors`
- `fileTypeAlloy`
- `fileTypeAngular`
- `fileTypeAnsible`
- `fileTypeAntlersHtml`
- `fileTypeAntlr`
- `fileTypeAnyscript`
- `fileTypeApache`
- `fileTypeApex`
- `fileTypeApiExtractor`
- `fileTypeApib`
- `fileTypeApib2`
- `fileTypeApl`
- `fileTypeApplescript`
- `fileTypeAppscript`
- `fileTypeAppsemble`
- `fileTypeAppveyor`
- `fileTypeArduino`
- `fileTypeAsciidoc`
- `fileTypeAseprite`
- `fileTypeAsp`
- `fileTypeAspx`
- `fileTypeAssembly`
- `fileTypeAstro`
- `fileTypeAstroconfig`
- `fileTypeAtom`
- `fileTypeAts`
- `fileTypeAttw`
- `fileTypeAudio`
- `fileTypeAurelia`
- `fileTypeAutohotkey`
- `fileTypeAutoit`
- `fileTypeAvif`
- `fileTypeAvro`
- `fileTypeAwk`
- `fileTypeAws`
- `fileTypeAzure`
- `fileTypeAzurepipelines`
- `fileTypeBabel`
- `fileTypeBabel2`
- `fileTypeBak`
- `fileTypeBallerina`
- `fileTypeBat`
- `fileTypeBats`
- `fileTypeBazaar`
- `fileTypeBazel`
- `fileTypeBazelIgnore`
- `fileTypeBazelVersion`
- `fileTypeBefunge`
- `fileTypeBicep`
- `fileTypeBiml`
- `fileTypeBinary`
- `fileTypeBiome`
- `fileTypeBitbucketpipeline`
- `fileTypeBithound`
- `fileTypeBlade`
- `fileTypeBlender`
- `fileTypeBlitzbasic`
- `fileTypeBolt`
- `fileTypeBosque`
- `fileTypeBower`
- `fileTypeBower2`
- `fileTypeBrowserslist`
- `fileTypeBruno`
- `fileTypeBuckbuild`
- `fileTypeBuf`
- `fileTypeBun`
- `fileTypeBundlemon`
- `fileTypeBundler`
- `fileTypeBunfig`
- `fileTypeC`
- `fileTypeCAl`
- `fileTypeC2`
- `fileTypeC3`
- `fileTypeCabal`
- `fileTypeCaddy`
- `fileTypeCake`
- `fileTypeCakephp`
- `fileTypeCapacitor`
- `fileTypeCapnp`
- `fileTypeCargo`
- `fileTypeCasc`
- `fileTypeCddl`
- `fileTypeCert`
- `fileTypeCeylon`
- `fileTypeCf`
- `fileTypeCf2`
- `fileTypeCfc`
- `fileTypeCfc2`
- `fileTypeCfm`
- `fileTypeCfm2`
- `fileTypeChangie`
- `fileTypeCheader`
- `fileTypeChef`
- `fileTypeChefCookbook`
- `fileTypeCircleci`
- `fileTypeClass`
- `fileTypeClaude`
- `fileTypeClojure`
- `fileTypeClojurescript`
- `fileTypeCloudfoundry`
- `fileTypeCmake`
- `fileTypeCobol`
- `fileTypeCodacy`
- `fileTypeCodeclimate`
- `fileTypeCodecov`
- `fileTypeCodekit`
- `fileTypeCodemagic`
- `fileTypeCodeowners`
- `fileTypeCodeql`
- `fileTypeCoderabbit`
- `fileTypeCoffeelint`
- `fileTypeCoffeescript`
- `fileTypeCommitizen`
- `fileTypeCommitlint`
- `fileTypeCompass`
- `fileTypeComposer`
- `fileTypeConan`
- `fileTypeConda`
- `fileTypeConfig`
- `fileTypeConfluence`
- `fileTypeCopilot`
- `fileTypeCoverage`
- `fileTypeCoveralls`
- `fileTypeCpp`
- `fileTypeCpp2`
- `fileTypeCpp3`
- `fileTypeCppheader`
- `fileTypeCraco`
- `fileTypeCrowdin`
- `fileTypeCrystal`
- `fileTypeCsharp`
- `fileTypeCsharp2`
- `fileTypeCspell`
- `fileTypeCsproj`
- `fileTypeCss`
- `fileTypeCss2`
- `fileTypeCss2map`
- `fileTypeCsscomb`
- `fileTypeCsslint`
- `fileTypeCssmap`
- `fileTypeCucumber`
- `fileTypeCuda`
- `fileTypeCursorrules`
- `fileTypeCvs`
- `fileTypeCypress`
- `fileTypeCypressSpec`
- `fileTypeCython`
- `fileTypeDal`
- `fileTypeDarcs`
- `fileTypeDartlang`
- `fileTypeDartlangGenerated`
- `fileTypeDartlangIgnore`
- `fileTypeDatadog`
- `fileTypeDb`
- `fileTypeDebian`
- `fileTypeDelphi`
- `fileTypeDeno`
- `fileTypeDenoify`
- `fileTypeDependabot`
- `fileTypeDependencies`
- `fileTypeDevcontainer`
- `fileTypeDhall`
- `fileTypeDiff`
- `fileTypeDjango`
- `fileTypeDlang`
- `fileTypeDocker`
- `fileTypeDocker2`
- `fileTypeDockertest`
- `fileTypeDockertest2`
- `fileTypeDocpad`
- `fileTypeDocusaurus`
- `fileTypeDocz`
- `fileTypeDojo`
- `fileTypeDoppler`
- `fileTypeDotenv`
- `fileTypeDotjs`
- `fileTypeDoxygen`
- `fileTypeDrawio`
- `fileTypeDrone`
- `fileTypeDrools`
- `fileTypeDtd`
- `fileTypeDune`
- `fileTypeDustjs`
- `fileTypeDvc`
- `fileTypeDylan`
- `fileTypeEarthly`
- `fileTypeEasMetadata`
- `fileTypeEdge`
- `fileTypeEdge2`
- `fileTypeEditorconfig`
- `fileTypeEex`
- `fileTypeEjs`
- `fileTypeElastic`
- `fileTypeElasticbeanstalk`
- `fileTypeEleventy`
- `fileTypeEleventy2`
- `fileTypeElixir`
- `fileTypeElm`
- `fileTypeElm2`
- `fileTypeEmacs`
- `fileTypeEmber`
- `fileTypeEnsime`
- `fileTypeEps`
- `fileTypeEpub`
- `fileTypeErb`
- `fileTypeErlang`
- `fileTypeErlang2`
- `fileTypeEsbuild`
- `fileTypeEslint`
- `fileTypeEslint2`
- `fileTypeEsphome`
- `fileTypeExcalidraw`
- `fileTypeExcel`
- `fileTypeExcel2`
- `fileTypeExpo`
- `fileTypeFalcon`
- `fileTypeFantasticon`
- `fileTypeFastly`
- `fileTypeFauna`
- `fileTypeFavicon`
- `fileTypeFbx`
- `fileTypeFirebase`
- `fileTypeFirebasehosting`
- `fileTypeFirebasestorage`
- `fileTypeFirestore`
- `fileTypeFitbit`
- `fileTypeFla`
- `fileTypeFlareact`
- `fileTypeFlash`
- `fileTypeFloobits`
- `fileTypeFlow`
- `fileTypeFlutter`
- `fileTypeFlutterPackage`
- `fileTypeFlyio`
- `fileTypeFont`
- `fileTypeFormkit`
- `fileTypeFortran`
- `fileTypeFossa`
- `fileTypeFossil`
- `fileTypeFreemarker`
- `fileTypeFrontcommerce`
- `fileTypeFsharp`
- `fileTypeFsharp2`
- `fileTypeFsproj`
- `fileTypeFthtml`
- `fileTypeFunding`
- `fileTypeFusebox`
- `fileTypeGalen`
- `fileTypeGalen2`
- `fileTypeGamemaker`
- `fileTypeGamemaker2`
- `fileTypeGamemaker81`
- `fileTypeGatsby`
- `fileTypeGcloud`
- `fileTypeGcode`
- `fileTypeGdscript`
- `fileTypeGenstat`
- `fileTypeGeojson`
- `fileTypeGit`
- `fileTypeGit2`
- `fileTypeGitlab`
- `fileTypeGitpod`
- `fileTypeGleam`
- `fileTypeGleamconfig`
- `fileTypeGlide`
- `fileTypeGlimmer`
- `fileTypeGlitter`
- `fileTypeGlsl`
- `fileTypeGltf`
- `fileTypeGlyphs`
- `fileTypeGnu`
- `fileTypeGnuplot`
- `fileTypeGo`
- `fileTypeGoAqua`
- `fileTypeGoBlack`
- `fileTypeGoFuchsia`
- `fileTypeGoGopher`
- `fileTypeGoLightblue`
- `fileTypeGoPackage`
- `fileTypeGoWhite`
- `fileTypeGoWork`
- `fileTypeGoYellow`
- `fileTypeGoctl`
- `fileTypeGodot`
- `fileTypeGpg`
- `fileTypeGradle`
- `fileTypeGradle2`
- `fileTypeGrain`
- `fileTypeGraphql`
- `fileTypeGraphqlConfig`
- `fileTypeGraphviz`
- `fileTypeGreenkeeper`
- `fileTypeGridsome`
- `fileTypeGroovy`
- `fileTypeGroovy2`
- `fileTypeGrunt`
- `fileTypeGulp`
- `fileTypeHaml`
- `fileTypeHandlebars`
- `fileTypeHandlebars2`
- `fileTypeHarbour`
- `fileTypeHardhat`
- `fileTypeHashicorp`
- `fileTypeHaskell`
- `fileTypeHaskell2`
- `fileTypeHaxe`
- `fileTypeHaxecheckstyle`
- `fileTypeHaxedevelop`
- `fileTypeHelix`
- `fileTypeHelm`
- `fileTypeHistoire`
- `fileTypeHjson`
- `fileTypeHlsl`
- `fileTypeHomeassistant`
- `fileTypeHorusec`
- `fileTypeHost`
- `fileTypeHtml`
- `fileTypeHtmlhint`
- `fileTypeHtmlvalidate`
- `fileTypeHttp`
- `fileTypeHugo`
- `fileTypeHumanstxt`
- `fileTypeHunspell`
- `fileTypeHusky`
- `fileTypeHy`
- `fileTypeHygen`
- `fileTypeHypr`
- `fileTypeIcl`
- `fileTypeIdris`
- `fileTypeIdrisbin`
- `fileTypeIdrispkg`
- `fileTypeImage`
- `fileTypeImba`
- `fileTypeInc`
- `fileTypeInfopath`
- `fileTypeInformix`
- `fileTypeIni`
- `fileTypeInk`
- `fileTypeInnosetup`
- `fileTypeIo`
- `fileTypeIodine`
- `fileTypeIonic`
- `fileTypeJake`
- `fileTypeJanet`
- `fileTypeJar`
- `fileTypeJasmine`
- `fileTypeJava`
- `fileTypeJbuilder`
- `fileTypeJekyll`
- `fileTypeJenkins`
- `fileTypeJest`
- `fileTypeJestSnapshot`
- `fileTypeJinja`
- `fileTypeJpm`
- `fileTypeJs`
- `fileTypeJsOfficial`
- `fileTypeJsbeautify`
- `fileTypeJsconfig`
- `fileTypeJscpd`
- `fileTypeJshint`
- `fileTypeJsmap`
- `fileTypeJson`
- `fileTypeJsonOfficial`
- `fileTypeJsonSchema`
- `fileTypeJson2`
- `fileTypeJson5`
- `fileTypeJsonld`
- `fileTypeJsonnet`
- `fileTypeJsp`
- `fileTypeJsr`
- `fileTypeJss`
- `fileTypeJuice`
- `fileTypeJulia`
- `fileTypeJulia2`
- `fileTypeJupyter`
- `fileTypeJust`
- `fileTypeK`
- `fileTypeKarma`
- `fileTypeKey`
- `fileTypeKitchenci`
- `fileTypeKite`
- `fileTypeKivy`
- `fileTypeKnip`
- `fileTypeKos`
- `fileTypeKotlin`
- `fileTypeKusto`
- `fileTypeLanguageConfiguration`
- `fileTypeLark`
- `fileTypeLatino`
- `fileTypeLayout`
- `fileTypeLean`
- `fileTypeLeanconfig`
- `fileTypeLefthook`
- `fileTypeLerna`
- `fileTypeLess`
- `fileTypeLex`
- `fileTypeLiara`
- `fileTypeLibreofficeBase`
- `fileTypeLibreofficeCalc`
- `fileTypeLibreofficeDraw`
- `fileTypeLibreofficeImpress`
- `fileTypeLibreofficeMath`
- `fileTypeLibreofficeWriter`
- `fileTypeLicense`
- `fileTypeLicensebat`
- `fileTypeLightActionscript2`
- `fileTypeLightAda`
- `fileTypeLightAgda`
- `fileTypeLightApl`
- `fileTypeLightAstro`
- `fileTypeLightAstroconfig`
- `fileTypeLightBabel`
- `fileTypeLightBabel2`
- `fileTypeLightCabal`
- `fileTypeLightCircleci`
- `fileTypeLightCloudfoundry`
- `fileTypeLightCodacy`
- `fileTypeLightCodeclimate`
- `fileTypeLightCodeowners`
- `fileTypeLightConfig`
- `fileTypeLightCopilot`
- `fileTypeLightCrystal`
- `fileTypeLightCypress`
- `fileTypeLightCypressSpec`
- `fileTypeLightDb`
- `fileTypeLightDeno`
- `fileTypeLightDhall`
- `fileTypeLightDocpad`
- `fileTypeLightDrone`
- `fileTypeLightEasMetadata`
- `fileTypeLightEleventy`
- `fileTypeLightEleventy2`
- `fileTypeLightEsphome`
- `fileTypeLightExpo`
- `fileTypeLightFirebasehosting`
- `fileTypeLightFla`
- `fileTypeLightFont`
- `fileTypeLightGamemaker2`
- `fileTypeLightGradle`
- `fileTypeLightHashicorp`
- `fileTypeLightHjson`
- `fileTypeLightIni`
- `fileTypeLightIo`
- `fileTypeLightJs`
- `fileTypeLightJsconfig`
- `fileTypeLightJsmap`
- `fileTypeLightJson`
- `fileTypeLightJsonSchema`
- `fileTypeLightJson5`
- `fileTypeLightJsonld`
- `fileTypeLightKite`
- `fileTypeLightLark`
- `fileTypeLightLean`
- `fileTypeLightLeanconfig`
- `fileTypeLightLerna`
- `fileTypeLightMailing`
- `fileTypeLightMarkuplint`
- `fileTypeLightMcp`
- `fileTypeLightMdx`
- `fileTypeLightMdxComponents`
- `fileTypeLightMlang`
- `fileTypeLightMustache`
- `fileTypeLightMypy`
- `fileTypeLightNeo4j`
- `fileTypeLightNetlify`
- `fileTypeLightNext`
- `fileTypeLightNim`
- `fileTypeLightNx`
- `fileTypeLightObjidconfig`
- `fileTypeLightOpenhab`
- `fileTypeLightPackship`
- `fileTypeLightPcl`
- `fileTypeLightPnpm`
- `fileTypeLightPrettier`
- `fileTypeLightPrisma`
- `fileTypeLightPurescript`
- `fileTypeLightQuasar`
- `fileTypeLightRaku`
- `fileTypeLightRazzle`
- `fileTypeLightReactrouter`
- `fileTypeLightRehype`
- `fileTypeLightRemark`
- `fileTypeLightReplit`
- `fileTypeLightRetext`
- `fileTypeLightRome`
- `fileTypeLightRubocop`
- `fileTypeLightRust`
- `fileTypeLightRustToolchain`
- `fileTypeLightSafetensors`
- `fileTypeLightShadcn`
- `fileTypeLightShaderlab`
- `fileTypeLightSolidity`
- `fileTypeLightSpin`
- `fileTypeLightStylelint`
- `fileTypeLightStylus`
- `fileTypeLightSymfony`
- `fileTypeLightSystemd`
- `fileTypeLightSystemverilog`
- `fileTypeLightTestcafe`
- `fileTypeLightTestjs`
- `fileTypeLightTex`
- `fileTypeLightTm`
- `fileTypeLightTmux`
- `fileTypeLightTodo`
- `fileTypeLightToit`
- `fileTypeLightToml`
- `fileTypeLightTree`
- `fileTypeLightTurbo`
- `fileTypeLightUnibeautify`
- `fileTypeLightVash`
- `fileTypeLightVercel`
- `fileTypeLightVsix`
- `fileTypeLightVsixmanifest`
- `fileTypeLightXfl`
- `fileTypeLightXorg`
- `fileTypeLightYaml`
- `fileTypeLightYamlOfficial`
- `fileTypeLightZeit`
- `fileTypeLighthouse`
- `fileTypeLilypond`
- `fileTypeLime`
- `fileTypeLintstagedrc`
- `fileTypeLiquid`
- `fileTypeLisp`
- `fileTypeLivescript`
- `fileTypeLnk`
- `fileTypeLocale`
- `fileTypeLog`
- `fileTypeLolcode`
- `fileTypeLsl`
- `fileTypeLua`
- `fileTypeLuau`
- `fileTypeLync`
- `fileTypeMailing`
- `fileTypeManifest`
- `fileTypeManifestBak`
- `fileTypeManifestSkip`
- `fileTypeMap`
- `fileTypeMariadb`
- `fileTypeMarkdown`
- `fileTypeMarkdownlint`
- `fileTypeMarkdownlintIgnore`
- `fileTypeMarko`
- `fileTypeMarkojs`
- `fileTypeMarkuplint`
- `fileTypeMasterCo`
- `fileTypeMatlab`
- `fileTypeMaven`
- `fileTypeMaxscript`
- `fileTypeMaya`
- `fileTypeMcp`
- `fileTypeMdx`
- `fileTypeMdxComponents`
- `fileTypeMdxlint`
- `fileTypeMediawiki`
- `fileTypeMercurial`
- `fileTypeMermaid`
- `fileTypeMeson`
- `fileTypeMetal`
- `fileTypeMeteor`
- `fileTypeMinecraft`
- `fileTypeMivascript`
- `fileTypeMjml`
- `fileTypeMlang`
- `fileTypeMocha`
- `fileTypeModernizr`
- `fileTypeMojo`
- `fileTypeMojolicious`
- `fileTypeMoleculer`
- `fileTypeMondoo`
- `fileTypeMongo`
- `fileTypeMonotone`
- `fileTypeMotif`
- `fileTypeMson`
- `fileTypeMustache`
- `fileTypeMvt`
- `fileTypeMvtcss`
- `fileTypeMvtjs`
- `fileTypeMypy`
- `fileTypeMysql`
- `fileTypeNanostaged`
- `fileTypeNdst`
- `fileTypeNearly`
- `fileTypeNeo4j`
- `fileTypeNestAdapterJs`
- `fileTypeNestAdapterTs`
- `fileTypeNestControllerJs`
- `fileTypeNestControllerTs`
- `fileTypeNestDecoratorJs`
- `fileTypeNestDecoratorTs`
- `fileTypeNestFilterJs`
- `fileTypeNestFilterTs`
- `fileTypeNestGatewayJs`
- `fileTypeNestGatewayTs`
- `fileTypeNestGuardJs`
- `fileTypeNestGuardTs`
- `fileTypeNestInterceptorJs`
- `fileTypeNestInterceptorTs`
- `fileTypeNestMiddlewareJs`
- `fileTypeNestMiddlewareTs`
- `fileTypeNestModuleJs`
- `fileTypeNestModuleTs`
- `fileTypeNestPipeJs`
- `fileTypeNestPipeTs`
- `fileTypeNestServiceJs`
- `fileTypeNestServiceTs`
- `fileTypeNestjs`
- `fileTypeNetlify`
- `fileTypeNext`
- `fileTypeNextflow`
- `fileTypeNgComponentCss`
- `fileTypeNgComponentDart`
- `fileTypeNgComponentHtml`
- `fileTypeNgComponentJs`
- `fileTypeNgComponentJs2`
- `fileTypeNgComponentLess`
- `fileTypeNgComponentSass`
- `fileTypeNgComponentScss`
- `fileTypeNgComponentTs`
- `fileTypeNgComponentTs2`
- `fileTypeNgControllerJs`
- `fileTypeNgControllerTs`
- `fileTypeNgDirectiveDart`
- `fileTypeNgDirectiveJs`
- `fileTypeNgDirectiveJs2`
- `fileTypeNgDirectiveTs`
- `fileTypeNgDirectiveTs2`
- `fileTypeNgGuardDart`
- `fileTypeNgGuardJs`
- `fileTypeNgGuardTs`
- `fileTypeNgInterceptorDart`
- `fileTypeNgInterceptorJs`
- `fileTypeNgInterceptorTs`
- `fileTypeNgModuleDart`
- `fileTypeNgModuleJs`
- `fileTypeNgModuleJs2`
- `fileTypeNgModuleTs`
- `fileTypeNgModuleTs2`
- `fileTypeNgPipeDart`
- `fileTypeNgPipeJs`
- `fileTypeNgPipeJs2`
- `fileTypeNgPipeTs`
- `fileTypeNgPipeTs2`
- `fileTypeNgRoutingDart`
- `fileTypeNgRoutingJs`
- `fileTypeNgRoutingJs2`
- `fileTypeNgRoutingTs`
- `fileTypeNgRoutingTs2`
- `fileTypeNgServiceDart`
- `fileTypeNgServiceJs`
- `fileTypeNgServiceJs2`
- `fileTypeNgServiceTs`
- `fileTypeNgServiceTs2`
- `fileTypeNgSmartComponentDart`
- `fileTypeNgSmartComponentJs`
- `fileTypeNgSmartComponentJs2`
- `fileTypeNgSmartComponentTs`
- `fileTypeNgSmartComponentTs2`
- `fileTypeNgTailwind`
- `fileTypeNginx`
- `fileTypeNim`
- `fileTypeNimble`
- `fileTypeNinja`
- `fileTypeNix`
- `fileTypeNjsproj`
- `fileTypeNoc`
- `fileTypeNode`
- `fileTypeNode2`
- `fileTypeNodemon`
- `fileTypeNpm`
- `fileTypeNpmpackagejsonlint`
- `fileTypeNsi`
- `fileTypeNsri`
- `fileTypeNsriIntegrity`
- `fileTypeNuget`
- `fileTypeNumpy`
- `fileTypeNunjucks`
- `fileTypeNuxt`
- `fileTypeNx`
- `fileTypeNyc`
- `fileTypeObjectivec`
- `fileTypeObjectivecpp`
- `fileTypeObjidconfig`
- `fileTypeOcaml`
- `fileTypeOcamlIntf`
- `fileTypeOgone`
- `fileTypeOnenote`
- `fileTypeOpam`
- `fileTypeOpencl`
- `fileTypeOpenhab`
- `fileTypeOpenscad`
- `fileTypeOpentofu`
- `fileTypeOrg`
- `fileTypeOutlook`
- `fileTypeOvpn`
- `fileTypeOxlint`
- `fileTypePackage`
- `fileTypePackship`
- `fileTypePaket`
- `fileTypePandacss`
- `fileTypePatch`
- `fileTypePcl`
- `fileTypePddl`
- `fileTypePddlHappenings`
- `fileTypePddlPlan`
- `fileTypePdf2`
- `fileTypePdm`
- `fileTypePeeky`
- `fileTypePerl`
- `fileTypePerl2`
- `fileTypePerl6`
- `fileTypePgsql`
- `fileTypePhotoshop`
- `fileTypePhotoshop2`
- `fileTypePhp`
- `fileTypePhp2`
- `fileTypePhp3`
- `fileTypePhpcsfixer`
- `fileTypePhpstan`
- `fileTypePhpunit`
- `fileTypePhraseapp`
- `fileTypePine`
- `fileTypePip`
- `fileTypePipeline`
- `fileTypePlantuml`
- `fileTypePlatformio`
- `fileTypePlaywright`
- `fileTypePlsql`
- `fileTypePlsqlPackage`
- `fileTypePlsqlPackageBody`
- `fileTypePlsqlPackageHeader`
- `fileTypePlsqlPackageSpec`
- `fileTypePm2`
- `fileTypePnpm`
- `fileTypePoedit`
- `fileTypePoetry`
- `fileTypePolymer`
- `fileTypePony`
- `fileTypePostcss`
- `fileTypePostcssconfig`
- `fileTypePostman`
- `fileTypePowerpoint`
- `fileTypePowerpoint2`
- `fileTypePowershell`
- `fileTypePowershellFormat`
- `fileTypePowershellPsd`
- `fileTypePowershellPsd2`
- `fileTypePowershellPsm`
- `fileTypePowershellPsm2`
- `fileTypePowershellTypes`
- `fileTypePowershell2`
- `fileTypePreact`
- `fileTypePrecommit`
- `fileTypePrettier`
- `fileTypePrisma`
- `fileTypeProcessinglang`
- `fileTypeProcfile`
- `fileTypeProgress`
- `fileTypeProlog`
- `fileTypePrometheus`
- `fileTypeProtobuf`
- `fileTypeProtractor`
- `fileTypePubliccode`
- `fileTypePublisher`
- `fileTypePug`
- `fileTypePulumi`
- `fileTypePuppet`
- `fileTypePurescript`
- `fileTypePurgecss`
- `fileTypePyenv`
- `fileTypePyret`
- `fileTypePyscript`
- `fileTypePytest`
- `fileTypePython`
- `fileTypePythowo`
- `fileTypePytyped`
- `fileTypePyup`
- `fileTypeQ`
- `fileTypeQbs`
- `fileTypeQlikview`
- `fileTypeQml`
- `fileTypeQmldir`
- `fileTypeQsharp`
- `fileTypeQuasar`
- `fileTypeR`
- `fileTypeRaSyntaxTree`
- `fileTypeRacket`
- `fileTypeRails`
- `fileTypeRake`
- `fileTypeRaku`
- `fileTypeRaml`
- `fileTypeRazor`
- `fileTypeRazzle`
- `fileTypeReactjs`
- `fileTypeReactrouter`
- `fileTypeReacttemplate`
- `fileTypeReactts`
- `fileTypeReason`
- `fileTypeRed`
- `fileTypeRegistry`
- `fileTypeRego`
- `fileTypeRehype`
- `fileTypeRemark`
- `fileTypeRenovate`
- `fileTypeReplit`
- `fileTypeRescript`
- `fileTypeRest`
- `fileTypeRetext`
- `fileTypeRexx`
- `fileTypeRiot`
- `fileTypeRmd`
- `fileTypeRnc`
- `fileTypeRobotframework`
- `fileTypeRobots`
- `fileTypeRolldown`
- `fileTypeRollup`
- `fileTypeRome`
- `fileTypeRon`
- `fileTypeRproj`
- `fileTypeRspec`
- `fileTypeRss`
- `fileTypeRubocop`
- `fileTypeRuby`
- `fileTypeRust`
- `fileTypeRustToolchain`
- `fileTypeSLang`
- `fileTypeSafetensors`
- `fileTypeSails`
- `fileTypeSaltstack`
- `fileTypeSan`
- `fileTypeSapphireFrameworkCli`
- `fileTypeSas`
- `fileTypeSass`
- `fileTypeSbt`
- `fileTypeScala`
- `fileTypeScilab`
- `fileTypeScript`
- `fileTypeScss`
- `fileTypeScss2`
- `fileTypeSdlang`
- `fileTypeSearchResult`
- `fileTypeSeedkit`
- `fileTypeSentry`
- `fileTypeSequelize`
- `fileTypeServerless`
- `fileTypeShadcn`
- `fileTypeShaderlab`
- `fileTypeShell`
- `fileTypeShuttle`
- `fileTypeSilverstripe`
- `fileTypeSino`
- `fileTypeSiyuan`
- `fileTypeSketch`
- `fileTypeSkipper`
- `fileTypeSlang`
- `fileTypeSlashup`
- `fileTypeSlice`
- `fileTypeSlim`
- `fileTypeSlint`
- `fileTypeSln`
- `fileTypeSln2`
- `fileTypeSmarty`
- `fileTypeSmithery`
- `fileTypeSnakemake`
- `fileTypeSnapcraft`
- `fileTypeSnaplet`
- `fileTypeSnort`
- `fileTypeSnyk`
- `fileTypeSolidarity`
- `fileTypeSolidity`
- `fileTypeSource`
- `fileTypeSpacengine`
- `fileTypeSparql`
- `fileTypeSpin`
- `fileTypeSqf`
- `fileTypeSql`
- `fileTypeSqlite`
- `fileTypeSquirrel`
- `fileTypeSss`
- `fileTypeSst`
- `fileTypeStackblitz`
- `fileTypeStan`
- `fileTypeStata`
- `fileTypeStencil`
- `fileTypeStoryboard`
- `fileTypeStorybook`
- `fileTypeStryker`
- `fileTypeStylable`
- `fileTypeStyle`
- `fileTypeStyled`
- `fileTypeStylelint`
- `fileTypeStylishHaskell`
- `fileTypeStylus`
- `fileTypeSublime`
- `fileTypeSubversion`
- `fileTypeSvelte`
- `fileTypeSvelteconfig`
- `fileTypeSvg`
- `fileTypeSvgo`
- `fileTypeSwagger`
- `fileTypeSwc`
- `fileTypeSwift`
- `fileTypeSwig`
- `fileTypeSymfony`
- `fileTypeSyncpack`
- `fileTypeSystemd`
- `fileTypeSystemverilog`
- `fileTypeT4tt`
- `fileTypeTailwind`
- `fileTypeTamagui`
- `fileTypeTaplo`
- `fileTypeTaskfile`
- `fileTypeTauri`
- `fileTypeTcl`
- `fileTypeTeal`
- `fileTypeTempl`
- `fileTypeTera`
- `fileTypeTerraform`
- `fileTypeTest`
- `fileTypeTestcafe`
- `fileTypeTestjs`
- `fileTypeTestplane`
- `fileTypeTestts`
- `fileTypeTex`
- `fileTypeText`
- `fileTypeTextile`
- `fileTypeTfs`
- `fileTypeTiltfile`
- `fileTypeTm`
- `fileTypeTmux`
- `fileTypeTodo`
- `fileTypeToit`
- `fileTypeToml`
- `fileTypeTox`
- `fileTypeTravis`
- `fileTypeTree`
- `fileTypeTres`
- `fileTypeTruffle`
- `fileTypeTrunk`
- `fileTypeTsbuildinfo`
- `fileTypeTscn`
- `fileTypeTsconfig`
- `fileTypeTsconfigOfficial`
- `fileTypeTsdoc`
- `fileTypeTslint`
- `fileTypeTt`
- `fileTypeTtcn`
- `fileTypeTuc`
- `fileTypeTurbo`
- `fileTypeTwig`
- `fileTypeTypedoc`
- `fileTypeTypescript`
- `fileTypeTypescriptOfficial`
- `fileTypeTypescriptdef`
- `fileTypeTypescriptdefOfficial`
- `fileTypeTypo3`
- `fileTypeUiua`
- `fileTypeUnibeautify`
- `fileTypeUnison`
- `fileTypeUnlicense`
- `fileTypeUnocss`
- `fileTypeUv`
- `fileTypeVagrant`
- `fileTypeVala`
- `fileTypeVanillaExtract`
- `fileTypeVapi`
- `fileTypeVapor`
- `fileTypeVash`
- `fileTypeVb`
- `fileTypeVba`
- `fileTypeVbhtml`
- `fileTypeVbproj`
- `fileTypeVcxproj`
- `fileTypeVelocity`
- `fileTypeVento`
- `fileTypeVercel`
- `fileTypeVerilog`
- `fileTypeVhdl`
- `fileTypeVideo`
- `fileTypeView`
- `fileTypeVim`
- `fileTypeVite`
- `fileTypeVitest`
- `fileTypeVlang`
- `fileTypeVolt`
- `fileTypeVscode`
- `fileTypeVscodeInsiders`
- `fileTypeVscodeTest`
- `fileTypeVscode2`
- `fileTypeVscode3`
- `fileTypeVsix`
- `fileTypeVsixmanifest`
- `fileTypeVue`
- `fileTypeVueconfig`
- `fileTypeVyper`
- `fileTypeWallaby`
- `fileTypeWally`
- `fileTypeWasm`
- `fileTypeWatchmanconfig`
- `fileTypeWdio`
- `fileTypeWeblate`
- `fileTypeWebp`
- `fileTypeWebpack`
- `fileTypeWenyan`
- `fileTypeWercker`
- `fileTypeWgsl`
- `fileTypeWikitext`
- `fileTypeWindi`
- `fileTypeWolfram`
- `fileTypeWord`
- `fileTypeWord2`
- `fileTypeWpml`
- `fileTypeWurst`
- `fileTypeWxml`
- `fileTypeWxss`
- `fileTypeWxt`
- `fileTypeXcode`
- `fileTypeXfl`
- `fileTypeXib`
- `fileTypeXliff`
- `fileTypeXmake`
- `fileTypeXml`
- `fileTypeXo`
- `fileTypeXorg`
- `fileTypeXquery`
- `fileTypeXsl`
- `fileTypeYacc`
- `fileTypeYaml`
- `fileTypeYamlOfficial`
- `fileTypeYamllint`
- `fileTypeYandex`
- `fileTypeYang`
- `fileTypeYarn`
- `fileTypeYeoman`
- `fileTypeZeit`
- `fileTypeZig`
- `fileTypeZip`
- `fileTypeZip2`
- `folderTypeAndroid`
- `folderTypeAndroidOpened`
- `folderTypeApi`
- `folderTypeApiOpened`
- `folderTypeApp`
- `folderTypeAppOpened`
- `folderTypeArangodb`
- `folderTypeArangodbOpened`
- `folderTypeAsset`
- `folderTypeAssetOpened`
- `folderTypeAstro`
- `folderTypeAstroOpened`
- `folderTypeAudio`
- `folderTypeAudioOpened`
- `folderTypeAurelia`
- `folderTypeAureliaOpened`
- `folderTypeAws`
- `folderTypeAwsOpened`
- `folderTypeAzure`
- `folderTypeAzureOpened`
- `folderTypeAzurepipelines`
- `folderTypeAzurepipelinesOpened`
- `folderTypeBinary`
- `folderTypeBinaryOpened`
- `folderTypeBloc`
- `folderTypeBlocOpened`
- `folderTypeBlueprint`
- `folderTypeBlueprintOpened`
- `folderTypeBot`
- `folderTypeBotOpened`
- `folderTypeBower`
- `folderTypeBowerOpened`
- `folderTypeBuildkite`
- `folderTypeBuildkiteOpened`
- `folderTypeCake`
- `folderTypeCakeOpened`
- `folderTypeCertificate`
- `folderTypeCertificateOpened`
- `folderTypeChangesets`
- `folderTypeChangesetsOpened`
- `folderTypeChef`
- `folderTypeChefOpened`
- `folderTypeCircleci`
- `folderTypeCircleciOpened`
- `folderTypeCli`
- `folderTypeCliOpened`
- `folderTypeClient`
- `folderTypeClientOpened`
- `folderTypeCmake`
- `folderTypeCmakeOpened`
- `folderTypeCommon`
- `folderTypeCommonOpened`
- `folderTypeComponent`
- `folderTypeComponentOpened`
- `folderTypeComposer`
- `folderTypeComposerOpened`
- `folderTypeConfig`
- `folderTypeConfigOpened`
- `folderTypeController`
- `folderTypeControllerOpened`
- `folderTypeCoverage`
- `folderTypeCoverageOpened`
- `folderTypeCss`
- `folderTypeCssOpened`
- `folderTypeCss2`
- `folderTypeCss2Opened`
- `folderTypeCubit`
- `folderTypeCubitOpened`
- `folderTypeCypress`
- `folderTypeCypressOpened`
- `folderTypeDapr`
- `folderTypeDaprOpened`
- `folderTypeDatadog`
- `folderTypeDatadogOpened`
- `folderTypeDb`
- `folderTypeDbOpened`
- `folderTypeDebian`
- `folderTypeDebianOpened`
- `folderTypeDependabot`
- `folderTypeDependabotOpened`
- `folderTypeDevcontainer`
- `folderTypeDevcontainerOpened`
- `folderTypeDist`
- `folderTypeDistOpened`
- `folderTypeDocker`
- `folderTypeDockerOpened`
- `folderTypeDocs`
- `folderTypeDocsOpened`
- `folderTypeE2e`
- `folderTypeE2eOpened`
- `folderTypeElasticbeanstalk`
- `folderTypeElasticbeanstalkOpened`
- `folderTypeElectron`
- `folderTypeElectronOpened`
- `folderTypeExpo`
- `folderTypeExpoOpened`
- `folderTypeFavicon`
- `folderTypeFaviconOpened`
- `folderTypeFlow`
- `folderTypeFlowOpened`
- `folderTypeFonts`
- `folderTypeFontsOpened`
- `folderTypeFrontcommerce`
- `folderTypeFrontcommerceOpened`
- `folderTypeGcp`
- `folderTypeGcpOpened`
- `folderTypeGit`
- `folderTypeGitOpened`
- `folderTypeGithub`
- `folderTypeGithubOpened`
- `folderTypeGitlab`
- `folderTypeGitlabOpened`
- `folderTypeGradle`
- `folderTypeGradleOpened`
- `folderTypeGraphql`
- `folderTypeGraphqlOpened`
- `folderTypeGrunt`
- `folderTypeGruntOpened`
- `folderTypeGulp`
- `folderTypeGulpOpened`
- `folderTypeHaxelib`
- `folderTypeHaxelibOpened`
- `folderTypeHelper`
- `folderTypeHelperOpened`
- `folderTypeHook`
- `folderTypeHookOpened`
- `folderTypeHusky`
- `folderTypeHuskyOpened`
- `folderTypeIdea`
- `folderTypeIdeaOpened`
- `folderTypeImages`
- `folderTypeImagesOpened`
- `folderTypeInclude`
- `folderTypeIncludeOpened`
- `folderTypeInterfaces`
- `folderTypeInterfacesOpened`
- `folderTypeIos`
- `folderTypeIosOpened`
- `folderTypeJs`
- `folderTypeJsOpened`
- `folderTypeJson`
- `folderTypeJsonOfficial`
- `folderTypeJsonOfficialOpened`
- `folderTypeJsonOpened`
- `folderTypeKubernetes`
- `folderTypeKubernetesOpened`
- `folderTypeLess`
- `folderTypeLessOpened`
- `folderTypeLibrary`
- `folderTypeLibraryOpened`
- `folderTypeLightCypress`
- `folderTypeLightCypressOpened`
- `folderTypeLightElectron`
- `folderTypeLightElectronOpened`
- `folderTypeLightExpo`
- `folderTypeLightExpoOpened`
- `folderTypeLightFonts`
- `folderTypeLightFontsOpened`
- `folderTypeLightGradle`
- `folderTypeLightGradleOpened`
- `folderTypeLightMeteor`
- `folderTypeLightMeteorOpened`
- `folderTypeLightMypy`
- `folderTypeLightMypyOpened`
- `folderTypeLightMysql`
- `folderTypeLightMysqlOpened`
- `folderTypeLightNode`
- `folderTypeLightNodeOpened`
- `folderTypeLightRedux`
- `folderTypeLightReduxOpened`
- `folderTypeLightSass`
- `folderTypeLightSassOpened`
- `folderTypeLinux`
- `folderTypeLinuxOpened`
- `folderTypeLocale`
- `folderTypeLocaleOpened`
- `folderTypeLog`
- `folderTypeLogOpened`
- `folderTypeMacos`
- `folderTypeMacosOpened`
- `folderTypeMariadb`
- `folderTypeMariadbOpened`
- `folderTypeMaven`
- `folderTypeMavenOpened`
- `folderTypeMediawiki`
- `folderTypeMediawikiOpened`
- `folderTypeMemcached`
- `folderTypeMemcachedOpened`
- `folderTypeMeteor`
- `folderTypeMeteorOpened`
- `folderTypeMiddleware`
- `folderTypeMiddlewareOpened`
- `folderTypeMinecraft`
- `folderTypeMinecraftOpened`
- `folderTypeMinikube`
- `folderTypeMinikubeOpened`
- `folderTypeMjml`
- `folderTypeMjmlOpened`
- `folderTypeMock`
- `folderTypeMockOpened`
- `folderTypeModel`
- `folderTypeModelOpened`
- `folderTypeModule`
- `folderTypeModuleOpened`
- `folderTypeMojo`
- `folderTypeMojoOpened`
- `folderTypeMongodb`
- `folderTypeMongodbOpened`
- `folderTypeMypy`
- `folderTypeMypyOpened`
- `folderTypeMysql`
- `folderTypeMysqlOpened`
- `folderTypeNetlify`
- `folderTypeNetlifyOpened`
- `folderTypeNext`
- `folderTypeNextOpened`
- `folderTypeNginx`
- `folderTypeNginxOpened`
- `folderTypeNix`
- `folderTypeNixOpened`
- `folderTypeNode`
- `folderTypeNodeOpened`
- `folderTypeNotebooks`
- `folderTypeNotebooksOpened`
- `folderTypeNotification`
- `folderTypeNotificationOpened`
- `folderTypeNuget`
- `folderTypeNugetOpened`
- `folderTypeNuxt`
- `folderTypeNuxtOpened`
- `folderTypePackage`
- `folderTypePackageOpened`
- `folderTypePaket`
- `folderTypePaketOpened`
- `folderTypePhp`
- `folderTypePhpOpened`
- `folderTypePlatformio`
- `folderTypePlatformioOpened`
- `folderTypePlugin`
- `folderTypePluginOpened`
- `folderTypePrisma`
- `folderTypePrismaOpened`
- `folderTypePrivate`
- `folderTypePrivateOpened`
- `folderTypePublic`
- `folderTypePublicOpened`
- `folderTypePytest`
- `folderTypePytestOpened`
- `folderTypePython`
- `folderTypePythonOpened`
- `folderTypeRavendb`
- `folderTypeRavendbOpened`
- `folderTypeRedis`
- `folderTypeRedisOpened`
- `folderTypeRedux`
- `folderTypeReduxOpened`
- `folderTypeRoute`
- `folderTypeRouteOpened`
- `folderTypeSass`
- `folderTypeSassOpened`
- `folderTypeScript`
- `folderTypeScriptOpened`
- `folderTypeSeedkit`
- `folderTypeSeedkitOpened`
- `folderTypeServer`
- `folderTypeServerOpened`
- `folderTypeServices`
- `folderTypeServicesOpened`
- `folderTypeShared`
- `folderTypeSharedOpened`
- `folderTypeSnaplet`
- `folderTypeSnapletOpened`
- `folderTypeSpin`
- `folderTypeSpinOpened`
- `folderTypeSrc`
- `folderTypeSrcOpened`
- `folderTypeSso`
- `folderTypeSsoOpened`
- `folderTypeStory`
- `folderTypeStoryOpened`
- `folderTypeStyle`
- `folderTypeStyleOpened`
- `folderTypeSupabase`
- `folderTypeSupabaseOpened`
- `folderTypeSvelte`
- `folderTypeSvelteOpened`
- `folderTypeTauri`
- `folderTypeTauriOpened`
- `folderTypeTemp`
- `folderTypeTempOpened`
- `folderTypeTemplate`
- `folderTypeTemplateOpened`
- `folderTypeTest`
- `folderTypeTestOpened`
- `folderTypeTheme`
- `folderTypeThemeOpened`
- `folderTypeTools`
- `folderTypeToolsOpened`
- `folderTypeTravis`
- `folderTypeTravisOpened`
- `folderTypeTrunk`
- `folderTypeTrunkOpened`
- `folderTypeTurbo`
- `folderTypeTurboOpened`
- `folderTypeTypescript`
- `folderTypeTypescriptOpened`
- `folderTypeTypings`
- `folderTypeTypingsOpened`
- `folderTypeTypings2`
- `folderTypeTypings2Opened`
- `folderTypeVagrant`
- `folderTypeVagrantOpened`
- `folderTypeVercel`
- `folderTypeVercelOpened`
- `folderTypeVideo`
- `folderTypeVideoOpened`
- `folderTypeView`
- `folderTypeViewOpened`
- `folderTypeVs`
- `folderTypeVsOpened`
- `folderTypeVs2`
- `folderTypeVs2Opened`
- `folderTypeVscode`
- `folderTypeVscodeOpened`
- `folderTypeVscodeTest`
- `folderTypeVscodeTestOpened`
- `folderTypeVscodeTest2`
- `folderTypeVscodeTest2Opened`
- `folderTypeVscodeTest3`
- `folderTypeVscodeTest3Opened`
- `folderTypeVscode2`
- `folderTypeVscode2Opened`
- `folderTypeVscode3`
- `folderTypeVscode3Opened`
- `folderTypeWebpack`
- `folderTypeWebpackOpened`
- `folderTypeWindows`
- `folderTypeWindowsOpened`
- `folderTypeWww`
- `folderTypeWwwOpened`
- `folderTypeYarn`
- `folderTypeYarnOpened`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><DefaultFileIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><DefaultFolderIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><DefaultFolderOpenedIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><DefaultRootFolderIcon size="20" class="nav-icon" /> Settings</a>
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
<DefaultFileIcon
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
    <DefaultFileIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <DefaultFolderIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <DefaultFolderOpenedIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <DefaultFileIcon size="24" />
   <DefaultFolderIcon size="24" color="#4a90e2" />
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
   <DefaultFileIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <DefaultFileIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <DefaultFileIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { defaultFile } from '@stacksjs/iconify-vscode-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(defaultFile, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { defaultFile } from '@stacksjs/iconify-vscode-icons'

// Icons are typed as IconData
const myIcon: IconData = defaultFile
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/vscode-icons/vscode-icons/blob/master/LICENSE) for more information.

## Credits

- **Icons**: Roberto Huertas ([Website](https://github.com/vscode-icons/vscode-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/vscode-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/vscode-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
