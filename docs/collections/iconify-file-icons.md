# File Icons

> File Icons icons for stx from Iconify

## Overview

This package provides access to 930 icons from the File Icons collection through the stx iconify integration.

**Collection ID:** `file-icons`
**Total Icons:** 930
**Author:** John Gardner ([Website](https://github.com/file-icons/icons))
**License:** ISC ([Details](https://github.com/file-icons/icons/blob/master/LICENSE.md))
**Category:** Programming
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-file-icons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 1cIcon, 1cAltIcon, 3dModelIcon } from '@stacksjs/iconify-file-icons'

// Basic usage
const icon = 1cIcon()

// With size
const sizedIcon = 1cIcon({ size: 24 })

// With color
const coloredIcon = 1cAltIcon({ color: 'red' })

// With multiple props
const customIcon = 3dModelIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 1cIcon, 1cAltIcon, 3dModelIcon } from '@stacksjs/iconify-file-icons'

  global.icons = {
    home: 1cIcon({ size: 24 }),
    user: 1cAltIcon({ size: 24, color: '#4a90e2' }),
    settings: 3dModelIcon({ size: 32 })
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
import { 1c, 1cAlt, 3dModel } from '@stacksjs/iconify-file-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(1c, { size: 24 })
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
const redIcon = 1cIcon({ color: 'red' })
const blueIcon = 1cIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 1cIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 1cIcon({ class: 'text-primary' })
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
const icon24 = 1cIcon({ size: 24 })
const icon1em = 1cIcon({ size: '1em' })

// Set individual dimensions
const customIcon = 1cIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 1cIcon({ height: '1em' })
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
const smallIcon = 1cIcon({ class: 'icon-small' })
const largeIcon = 1cIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **930** icons:

- `1c`
- `1cAlt`
- `3dModel`
- `3dsMax`
- `4d`
- `a`
- `abap`
- `abif`
- `acre`
- `actionscript`
- `ada`
- `adobe`
- `adobeAcrobat`
- `adobeAftereffects`
- `adobeAnimate`
- `adobeAudition`
- `adobeBridge`
- `adobeCharacteranimator`
- `adobeCreativecloud`
- `adobeDimension`
- `adobeDreamweaver`
- `adobeFlash`
- `adobeFuse`
- `adobeIllustrator`
- `adobeIncopy`
- `adobeIndesign`
- `adobeLightroom`
- `adobeMediaencoder`
- `adobePhotoshop`
- `adobePrelude`
- `adobePremiere`
- `adobePremiererush`
- `adobeXd`
- `adonisjs`
- `aeternity`
- `affectscript`
- `affinitydesigner`
- `agc`
- `agda`
- `akka`
- `alacritty`
- `alacrittyAlt`
- `alex`
- `alloy`
- `alpineLinux`
- `amd`
- `amigaos`
- `ampl`
- `amusewiki`
- `analytica`
- `angelscript`
- `animestudio`
- `ansible`
- `ansibleAlt`
- `antlr`
- `antwar`
- `anyscript`
- `apacheAnt`
- `apiBlueprint`
- `apiextractor`
- `apl`
- `aplOld`
- `apollo`
- `apple`
- `appveyor`
- `arc`
- `archLinux`
- `arduino`
- `arm`
- `arttext`
- `arttext4`
- `asciidoc`
- `asciidoctor`
- `assemblyAgc`
- `assemblyAmd`
- `assemblyArm`
- `assemblyAtt`
- `assemblyAvr`
- `assemblyGeneric`
- `assemblyHitachi`
- `assemblyIntel`
- `assemblyMotorola`
- `assemblyPowerpc`
- `assemblyRiscv`
- `assemblySparc`
- `assemblyVax`
- `assemblyZilog`
- `asymptote`
- `asymptoteAlt`
- `atoum`
- `ats`
- `att`
- `audacity`
- `augeas`
- `aurelia`
- `autohotkey`
- `autoit`
- `automator`
- `avr`
- `avro`
- `awk`
- `azurePipelines`
- `babel`
- `ballerina`
- `bazaar`
- `bazel`
- `bazelOld`
- `behat`
- `bem`
- `bibtex`
- `bikeshed`
- `biml`
- `binder`
- `bintray`
- `bison`
- `bithound`
- `blender`
- `blitzbasic`
- `bloc`
- `bluespec`
- `bnf`
- `boo`
- `bors`
- `bosque`
- `brainfuck`
- `brakeman`
- `bro`
- `broccoli`
- `brotli`
- `brotliOld`
- `browserslist`
- `browsersync`
- `brunch`
- `buck`
- `buildBoot`
- `buildkite`
- `bundler`
- `byond`
- `c`
- `cScript`
- `cabal`
- `caddy`
- `caddyOld`
- `caffe`
- `caffe2`
- `cairo`
- `cake`
- `cakefile`
- `cakephp`
- `cakephpOld`
- `calva`
- `carthage`
- `casc`
- `cdf`
- `ceylon`
- `chai`
- `chapel`
- `chartjs`
- `cheetah3d`
- `chef`
- `chocolatey`
- `chuck`
- `circleci`
- `cirru`
- `ckeditor`
- `clarion`
- `clean`
- `click`
- `clips`
- `clojurejs`
- `closuretemplate`
- `cloudfoundry`
- `cmake`
- `cnab`
- `cobol`
- `cocoapods`
- `codacy`
- `codeClimate`
- `codecov`
- `codekit`
- `codemeta`
- `codemirror`
- `codeship`
- `coldfusion`
- `commitizen`
- `commitlint`
- `commonLisp`
- `componentPascal`
- `composer`
- `conan`
- `conda`
- `config`
- `configCoffeescript`
- `configGo`
- `configHaskell`
- `configJs`
- `configPerl`
- `configPython`
- `configReact`
- `configRuby`
- `configRust`
- `configTypescript`
- `conll`
- `coq`
- `cordova`
- `coreldraw`
- `coreldrawAlt`
- `coveralls`
- `cpan`
- `cpcdosc`
- `crafttweaker`
- `creole`
- `crowdin`
- `crystal`
- `csound`
- `cubit`
- `cucumber`
- `cuneiform`
- `curl`
- `curlLang`
- `curry`
- `cvs`
- `cwl`
- `cython`
- `d3`
- `dafny`
- `darcsPatch`
- `dashboard`
- `dataweave`
- `dbase`
- `default`
- `delphi`
- `deno`
- `dependabot`
- `devcontainer`
- `devicetree`
- `dhall`
- `dia`
- `diff`
- `digdag`
- `dna`
- `docbook`
- `docker`
- `doclets`
- `docpad`
- `docz`
- `dogescript`
- `dom`
- `donejs`
- `dosbox`
- `dosboxAlt`
- `dotenv`
- `dotjs`
- `doxygen`
- `dragonflybsd`
- `dragula`
- `drawIo`
- `drone`
- `dub`
- `dvc`
- `dyalog`
- `dylib`
- `e`
- `eagle`
- `easybuild`
- `ec`
- `ecere`
- `eclipseLang`
- `edge`
- `editorconfig`
- `eiffel`
- `ejs`
- `electron`
- `elementaryos`
- `elm`
- `emacs`
- `ember`
- `emberscript`
- `ensime`
- `eq`
- `esdoc`
- `eslint`
- `eslintOld`
- `expo`
- `fabfile`
- `fabric`
- `factor`
- `falcon`
- `fancy`
- `fantom`
- `fauna`
- `faust`
- `fbx`
- `fexl`
- `ffmpeg`
- `fiddle`
- `figma`
- `finaldraft`
- `finder`
- `firebase`
- `firebaseBolt`
- `flask`
- `floobits`
- `flow`
- `flutter`
- `flux`
- `font`
- `fontBitmap`
- `fontOutline`
- `fontforge`
- `fork`
- `fortherecord`
- `fortran`
- `fossa`
- `fossil`
- `fountain`
- `franca`
- `freedesktop`
- `freedos`
- `freemarker`
- `freemat`
- `frege`
- `fthtml`
- `fuelux`
- `fusebox`
- `futhark`
- `galaxy`
- `galen`
- `gamemaker`
- `gams`
- `gap`
- `gatsby`
- `gauss`
- `gdb`
- `genshi`
- `genstat`
- `gentoo`
- `gf`
- `ghostscript`
- `gimp`
- `gitlab`
- `gitpod`
- `glade`
- `glide`
- `gltf`
- `glyphs`
- `gn`
- `gnu`
- `gnuplot`
- `go`
- `goOld`
- `godot`
- `golo`
- `goreleaser`
- `gosu`
- `gradle`
- `grapher`
- `graphite`
- `graphql`
- `graphqlCodegenerator`
- `graphviz`
- `gravitDesigner`
- `greenkeeper`
- `gridsome`
- `groovy`
- `grunt`
- `gulp`
- `hack`
- `haml`
- `harbour`
- `hashicorp`
- `haxe`
- `haxedevelop`
- `helix`
- `hewlettpackard`
- `hie`
- `hitachi`
- `hjson`
- `homebrew`
- `hop`
- `hoplon`
- `houdini`
- `houndci`
- `hugo`
- `husky`
- `hy`
- `hygen`
- `hyper`
- `icomoon`
- `icu`
- `idl`
- `idris`
- `igorPro`
- `illumos`
- `image`
- `imba`
- `imbaAlt`
- `imbaOld`
- `imgbot`
- `influxdata`
- `inform7`
- `ink`
- `inkscape`
- `innosetup`
- `intel`
- `io`
- `ioke`
- `ionicProject`
- `isabelle`
- `istanbul`
- `j`
- `jade`
- `jakefile`
- `janet`
- `jasmine`
- `jenkins`
- `jest`
- `jinja`
- `jison`
- `jolie`
- `jscpd`
- `json1`
- `json2`
- `jsonLd1`
- `jsonLd2`
- `json5`
- `jsonnet`
- `jsx`
- `jsxAlt`
- `jsxAtom`
- `julia`
- `junos`
- `jupyter`
- `kaitai`
- `karma`
- `keybase`
- `keynote`
- `khronos`
- `kibo`
- `kicad`
- `kitchenci`
- `kivy`
- `knime`
- `knockout`
- `kos`
- `kotlin`
- `krl`
- `kubernetes`
- `kusto`
- `kustoAlt`
- `kx`
- `labview`
- `laravel`
- `lark`
- `lasso`
- `latex`
- `latino`
- `leaflet`
- `lean`
- `lefthook`
- `lefthookAlt`
- `leiningen`
- `lektor`
- `lerna`
- `lex`
- `lexAlt`
- `lfe`
- `lgtm`
- `libuv`
- `lighthouse`
- `lightwave`
- `lilypond`
- `lime`
- `linqpad`
- `lisp`
- `livescript`
- `llvm`
- `logtalk`
- `lolcode`
- `lookml`
- `lsl`
- `lua`
- `macaulay2`
- `macvim`
- `magit`
- `mako`
- `manjaro`
- `manpage`
- `mapbox`
- `markdownlint`
- `marko`
- `mathematica`
- `mathjax`
- `matlab`
- `matroska`
- `max`
- `maya`
- `mdx`
- `mediawiki`
- `melpa`
- `mercurial`
- `mercury`
- `mermaid`
- `meson`
- `mesonOld`
- `metal`
- `metapost`
- `meteor`
- `microsoftAccess`
- `microsoftExcel`
- `microsoftInfopath`
- `microsoftLync`
- `microsoftOnenote`
- `microsoftOutlook`
- `microsoftPowerpoint`
- `microsoftProject`
- `microsoftPublisher`
- `microsoftVisio`
- `microsoftWord`
- `minecraft`
- `minizinc`
- `mint`
- `mirah`
- `miranda`
- `mirc`
- `mixin`
- `mjml`
- `mocha`
- `modelica`
- `modernweb`
- `modo`
- `modula2`
- `modula3`
- `moho`
- `moleculer`
- `moment`
- `momentTimezone`
- `monkey`
- `mono`
- `monotone`
- `motorola`
- `moustache`
- `mruby`
- `msDos`
- `mupad`
- `nano`
- `nanoc`
- `nant`
- `nasm`
- `ndepend`
- `neko`
- `nemerle`
- `neo4j`
- `neon`
- `nessus`
- `nestjs`
- `netlify`
- `netlinx`
- `netlogo`
- `newRelic`
- `nextflow`
- `nextjs`
- `nginx`
- `ngrx`
- `nib`
- `nickle`
- `nightwatch`
- `nimble`
- `nimrod`
- `nintendo64`
- `nit`
- `nix`
- `nmap`
- `nodemon`
- `nokogiri`
- `nomad`
- `noon`
- `normalise`
- `npm`
- `npmOld`
- `nsis`
- `nsisOld`
- `nsri`
- `nsriAlt`
- `nuclide`
- `nuget`
- `numpy`
- `numpyOld`
- `nunjucks`
- `nuxt`
- `nvidia`
- `nwscript`
- `nx`
- `nxc`
- `oberon`
- `objectiveJ`
- `ocaml`
- `octave`
- `odin`
- `ogone`
- `omnigraffle`
- `ooc`
- `opa`
- `openapi`
- `openbsd`
- `openbsdAlt`
- `opencl`
- `opencv`
- `openexr`
- `opengl`
- `openindiana`
- `openoffice`
- `openpolicyagent`
- `openscad`
- `opensolaris`
- `openstack`
- `openvms`
- `openvpn`
- `openzfs`
- `orgMode`
- `os2`
- `owl`
- `ox`
- `oxygene`
- `oz`
- `p4`
- `pan`
- `papyrus`
- `parrot`
- `pascal`
- `patch`
- `patreon`
- `pawn`
- `pcd`
- `pegjs`
- `perl6`
- `phalcon`
- `phoenix`
- `photorec`
- `php`
- `phpunit`
- `phraseapp`
- `pickle`
- `pico8`
- `picolisp`
- `pike`
- `pinescript`
- `pipenv`
- `pkgsrc`
- `platformio`
- `pm2`
- `pnpm`
- `pod`
- `pogoscript`
- `pointwise`
- `polymer`
- `pony`
- `postcss`
- `postscript`
- `povRay`
- `powerbuilder`
- `powerpc`
- `powershell`
- `precision`
- `precommit`
- `prettier`
- `prisma`
- `processing`
- `progress`
- `progressOld`
- `propeller`
- `pros`
- `proselint`
- `protractor`
- `pug`
- `pugOld`
- `pullapprove`
- `puppet`
- `pure`
- `purebasic`
- `purescript`
- `pypi`
- `pyret`
- `pytest`
- `pyup`
- `q`
- `qiskit`
- `qlikview`
- `qt`
- `quasar`
- `r`
- `racket`
- `raml`
- `rascal`
- `razzle`
- `rdata`
- `rdoc`
- `reactos`
- `readthedocs`
- `realbasic`
- `reason`
- `reasonstudios`
- `reasonstudiosAlt`
- `rebol`
- `red`
- `redOld`
- `redux`
- `reek`
- `regex`
- `remark`
- `renovate`
- `rescript`
- `restql`
- `restructuredtext`
- `rexx`
- `rhino3d`
- `ring`
- `riot`
- `riotOld`
- `riscV`
- `rmarkdown`
- `robotframework`
- `robotframeworkOld`
- `robots`
- `rollup`
- `rollupOld`
- `rspec`
- `rstudio`
- `rsync`
- `rubocop`
- `rubygems`
- `sac`
- `sage`
- `sails`
- `saltstack`
- `san`
- `sandbox`
- `sas`
- `sbt`
- `scheme`
- `scilab`
- `scilla`
- `scratch`
- `scrutinizer`
- `self`
- `semanticrelease`
- `sentry`
- `sequelize`
- `serverless`
- `serviceFabric`
- `shadowcljs`
- `shellcheck`
- `shen`
- `shipit`
- `shippable`
- `shopify`
- `shuriken`
- `sigils`
- `silicongraphics`
- `silverstripe`
- `sinatra`
- `sketch`
- `sketchupLayout`
- `sketchupMake`
- `sketchupStylebuilder`
- `slash`
- `smartos`
- `smartosAlt`
- `snapcraft`
- `snort`
- `snowpack`
- `snyk`
- `solidarity`
- `solidity`
- `sophia`
- `sorbet`
- `source`
- `spacemacs`
- `spacengine`
- `sparc`
- `spray`
- `sqf`
- `sqlite`
- `squarespace`
- `stan`
- `stata`
- `stdlibjs`
- `stencil`
- `stitches`
- `storybook`
- `storyist`
- `strings`
- `stylable`
- `styledcomponents`
- `stylelint`
- `stylishhaskell`
- `stylus`
- `stylusOrb`
- `stylusS`
- `sublime`
- `supercollider`
- `svelte`
- `svn`
- `swagger`
- `systemverilog`
- `tag`
- `tailwind`
- `tcl`
- `telegram`
- `templatetoolkit`
- `templeos`
- `terminal`
- `tern`
- `terraform`
- `terser`
- `testCoffeescript`
- `testDirectory`
- `testGeneric`
- `testGo`
- `testHaskell`
- `testJs`
- `testPerl`
- `testPython`
- `testReact`
- `testRuby`
- `testRust`
- `testTypescript`
- `testcafe`
- `textile`
- `textmate`
- `tfs`
- `thor`
- `tilt`
- `tinymce`
- `tipe`
- `tla`
- `tmux`
- `toml`
- `tortoisesvn`
- `totvs`
- `truffle`
- `tsx`
- `tsxAlt`
- `ttcn3`
- `turing`
- `twig`
- `twine`
- `txl`
- `typedoc`
- `typescript`
- `typescriptAlt`
- `typings`
- `ufo`
- `unibeautify`
- `unicode`
- `uno`
- `unrealscript`
- `urweb`
- `v`
- `vRay`
- `v8`
- `v8Turbofan`
- `vagrant`
- `vala`
- `vax`
- `vcl`
- `velocity`
- `verilog`
- `vertexshader`
- `vhdl`
- `video`
- `virtualbox`
- `virtualboxAlt`
- `vite`
- `vmware`
- `vscode`
- `vsts`
- `vue`
- `vyper`
- `w3c`
- `wallaby`
- `walt`
- `warcraftIii`
- `wasi`
- `watchman`
- `wdl`
- `webassembly`
- `webgl`
- `webhint`
- `webpack`
- `webpackOld`
- `webvtt`
- `wenyan`
- `wercker`
- `wget`
- `windi`
- `wine`
- `winui`
- `wix`
- `wolfram`
- `workbox`
- `wurst`
- `x10`
- `xamarin`
- `xmake`
- `xmos`
- `xpages`
- `xtend`
- `xubuntu`
- `yaml`
- `yamlAlt1`
- `yamlAlt2`
- `yamlAlt3`
- `yamlAlt4`
- `yamllint`
- `yandex`
- `yang`
- `yara`
- `yarn`
- `yasm`
- `yorick`
- `yui`
- `zbrush`
- `zeit`
- `zephir`
- `zig`
- `zilog`
- `zimpl`
- `zorinos`
- `zork`

## Usage Examples

### Navigation Menu

```html
@js
  import { 1cIcon, 1cAltIcon, 3dModelIcon, 3dsMaxIcon } from '@stacksjs/iconify-file-icons'

  global.navIcons = {
    home: 1cIcon({ size: 20, class: 'nav-icon' }),
    about: 1cAltIcon({ size: 20, class: 'nav-icon' }),
    contact: 3dModelIcon({ size: 20, class: 'nav-icon' }),
    settings: 3dsMaxIcon({ size: 20, class: 'nav-icon' })
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
import { 1cIcon } from '@stacksjs/iconify-file-icons'

const icon = 1cIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 1cIcon, 1cAltIcon, 3dModelIcon } from '@stacksjs/iconify-file-icons'

const successIcon = 1cIcon({ size: 16, color: '#22c55e' })
const warningIcon = 1cAltIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 3dModelIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 1cIcon, 1cAltIcon } from '@stacksjs/iconify-file-icons'
   const icon = 1cIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { 1c, 1cAlt } from '@stacksjs/iconify-file-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(1c, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 1cIcon, 1cAltIcon } from '@stacksjs/iconify-file-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-file-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 1cIcon } from '@stacksjs/iconify-file-icons'
     global.icon = 1cIcon({ size: 24 })
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
   const icon = 1cIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 1c } from '@stacksjs/iconify-file-icons'

// Icons are typed as IconData
const myIcon: IconData = 1c
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

ISC

See [license details](https://github.com/file-icons/icons/blob/master/LICENSE.md) for more information.

## Credits

- **Icons**: John Gardner ([Website](https://github.com/file-icons/icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/file-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/file-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
