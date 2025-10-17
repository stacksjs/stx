# Skill Icons

> Skill Icons icons for stx from Iconify

## Overview

This package provides access to 397 icons from the Skill Icons collection through the stx iconify integration.

**Collection ID:** `skill-icons`
**Total Icons:** 397
**Author:** tandpfun ([Website](https://github.com/tandpfun/skill-icons))
**License:** MIT ([Details](https://github.com/tandpfun/skill-icons/blob/main/LICENSE))
**Category:** Programming
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-skill-icons
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AbletonDarkIcon height="1em" />
<AbletonDarkIcon width="1em" height="1em" />
<AbletonDarkIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AbletonDarkIcon size="24" />
<AbletonDarkIcon size="1em" />

<!-- Using width and height -->
<AbletonDarkIcon width="24" height="32" />

<!-- With color -->
<AbletonDarkIcon size="24" color="red" />
<AbletonDarkIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AbletonDarkIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AbletonDarkIcon
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
    <AbletonDarkIcon size="24" />
    <AbletonLightIcon size="24" color="#4a90e2" />
    <ActivitypubDarkIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { abletonDark, abletonLight, activitypubDark } from '@stacksjs/iconify-skill-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(abletonDark, { size: 24 })
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
<AbletonDarkIcon size="24" color="red" />
<AbletonDarkIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AbletonDarkIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AbletonDarkIcon size="24" class="text-primary" />
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
<AbletonDarkIcon height="1em" />
<AbletonDarkIcon width="1em" height="1em" />
<AbletonDarkIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AbletonDarkIcon size="24" />
<AbletonDarkIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.skillIcons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AbletonDarkIcon class="skillIcons-icon" />
```

## Available Icons

This package contains **397** icons:

- `abletonDark`
- `abletonLight`
- `activitypubDark`
- `activitypubLight`
- `actixDark`
- `actixLight`
- `adonis`
- `aftereffects`
- `aiscriptDark`
- `aiscriptLight`
- `alpinejsDark`
- `alpinejsLight`
- `anacondaDark`
- `anacondaLight`
- `androidstudioDark`
- `androidstudioLight`
- `angularDark`
- `angularLight`
- `ansible`
- `apollo`
- `appleDark`
- `appleLight`
- `appwrite`
- `archDark`
- `archLight`
- `arduino`
- `astro`
- `atom`
- `audition`
- `autocadDark`
- `autocadLight`
- `awsDark`
- `awsLight`
- `azul`
- `azureDark`
- `azureLight`
- `babel`
- `bashDark`
- `bashLight`
- `bevyDark`
- `bevyLight`
- `bitbucketDark`
- `bitbucketLight`
- `blenderDark`
- `blenderLight`
- `bootstrap`
- `bsdDark`
- `bsdLight`
- `bunDark`
- `bunLight`
- `c`
- `cassandraDark`
- `cassandraLight`
- `clionDark`
- `clionLight`
- `clojureDark`
- `clojureLight`
- `cloudflareDark`
- `cloudflareLight`
- `cmakeDark`
- `cmakeLight`
- `codepenDark`
- `codepenLight`
- `coffeescriptDark`
- `coffeescriptLight`
- `cpp`
- `crystalDark`
- `crystalLight`
- `cs`
- `css`
- `cypressDark`
- `cypressLight`
- `d3Dark`
- `d3Light`
- `dartDark`
- `dartLight`
- `debianDark`
- `debianLight`
- `denoDark`
- `denoLight`
- `devtoDark`
- `devtoLight`
- `discord`
- `discordbots`
- `discordjsDark`
- `discordjsLight`
- `django`
- `docker`
- `dotnet`
- `dynamodbDark`
- `dynamodbLight`
- `eclipseDark`
- `eclipseLight`
- `elasticsearchDark`
- `elasticsearchLight`
- `electron`
- `elixirDark`
- `elixirLight`
- `elysiaDark`
- `elysiaLight`
- `emacs`
- `ember`
- `emotionDark`
- `emotionLight`
- `expressjsDark`
- `expressjsLight`
- `fastapi`
- `fediverseDark`
- `fediverseLight`
- `figmaDark`
- `figmaLight`
- `flaskDark`
- `flaskLight`
- `flutterDark`
- `flutterLight`
- `forth`
- `fortran`
- `gamemakerstudio`
- `gatsby`
- `gcpDark`
- `gcpLight`
- `gherkinDark`
- `gherkinLight`
- `git`
- `githubDark`
- `githubLight`
- `githubactionsDark`
- `githubactionsLight`
- `gitlabDark`
- `gitlabLight`
- `gmailDark`
- `gmailLight`
- `godotDark`
- `godotLight`
- `golang`
- `gradleDark`
- `gradleLight`
- `grafanaDark`
- `grafanaLight`
- `graphqlDark`
- `graphqlLight`
- `gtkDark`
- `gtkLight`
- `gulp`
- `haskellDark`
- `haskellLight`
- `haxeDark`
- `haxeLight`
- `haxeflixelDark`
- `haxeflixelLight`
- `heroku`
- `hibernateDark`
- `hibernateLight`
- `html`
- `htmxDark`
- `htmxLight`
- `ideaDark`
- `ideaLight`
- `illustrator`
- `instagram`
- `ipfsDark`
- `ipfsLight`
- `javaDark`
- `javaLight`
- `javascript`
- `jenkinsDark`
- `jenkinsLight`
- `jest`
- `jquery`
- `juliaDark`
- `juliaLight`
- `kafka`
- `kaliDark`
- `kaliLight`
- `kotlinDark`
- `kotlinLight`
- `ktorDark`
- `ktorLight`
- `kubernetes`
- `laravelDark`
- `laravelLight`
- `latexDark`
- `latexLight`
- `lessDark`
- `lessLight`
- `linkedin`
- `linuxDark`
- `linuxLight`
- `litDark`
- `litLight`
- `luaDark`
- `luaLight`
- `markdownDark`
- `markdownLight`
- `mastodonDark`
- `mastodonLight`
- `materialuiDark`
- `materialuiLight`
- `matlabDark`
- `matlabLight`
- `mavenDark`
- `mavenLight`
- `mintDark`
- `mintLight`
- `misskeyDark`
- `misskeyLight`
- `mongodb`
- `mysqlDark`
- `mysqlLight`
- `neovimDark`
- `neovimLight`
- `nestjsDark`
- `nestjsLight`
- `netlifyDark`
- `netlifyLight`
- `nextjsDark`
- `nextjsLight`
- `nginx`
- `nimDark`
- `nimLight`
- `nixDark`
- `nixLight`
- `nodejsDark`
- `nodejsLight`
- `notionDark`
- `notionLight`
- `npmDark`
- `npmLight`
- `nuxtjsDark`
- `nuxtjsLight`
- `obsidianDark`
- `obsidianLight`
- `ocaml`
- `octaveDark`
- `octaveLight`
- `opencvDark`
- `opencvLight`
- `openshift`
- `openstackDark`
- `openstackLight`
- `p5js`
- `perl`
- `photoshop`
- `phpDark`
- `phpLight`
- `phpstormDark`
- `phpstormLight`
- `piniaDark`
- `piniaLight`
- `pklDark`
- `pklLight`
- `plan9Dark`
- `plan9Light`
- `planetscaleDark`
- `planetscaleLight`
- `pnpmDark`
- `pnpmLight`
- `postgresqlDark`
- `postgresqlLight`
- `postman`
- `powershellDark`
- `powershellLight`
- `premiere`
- `prisma`
- `processingDark`
- `processingLight`
- `prometheus`
- `pugDark`
- `pugLight`
- `pycharmDark`
- `pycharmLight`
- `pythonDark`
- `pythonLight`
- `pytorchDark`
- `pytorchLight`
- `qtDark`
- `qtLight`
- `rDark`
- `rLight`
- `rabbitmqDark`
- `rabbitmqLight`
- `rails`
- `raspberrypiDark`
- `raspberrypiLight`
- `reactDark`
- `reactLight`
- `reactivexDark`
- `reactivexLight`
- `redhatDark`
- `redhatLight`
- `redisDark`
- `redisLight`
- `redux`
- `regexDark`
- `regexLight`
- `remixDark`
- `remixLight`
- `replitDark`
- `replitLight`
- `riderDark`
- `riderLight`
- `robloxstudio`
- `rocket`
- `rollupjsDark`
- `rollupjsLight`
- `rosDark`
- `rosLight`
- `ruby`
- `rust`
- `sass`
- `scalaDark`
- `scalaLight`
- `scikitlearnDark`
- `scikitlearnLight`
- `selenium`
- `sentry`
- `sequelizeDark`
- `sequelizeLight`
- `sketchupDark`
- `sketchupLight`
- `solidity`
- `solidjsDark`
- `solidjsLight`
- `springDark`
- `springLight`
- `sqlite`
- `stackoverflowDark`
- `stackoverflowLight`
- `styledcomponents`
- `sublimeDark`
- `sublimeLight`
- `supabaseDark`
- `supabaseLight`
- `svelte`
- `svgDark`
- `svgLight`
- `swift`
- `symfonyDark`
- `symfonyLight`
- `tailwindcssDark`
- `tailwindcssLight`
- `tauriDark`
- `tauriLight`
- `tensorflowDark`
- `tensorflowLight`
- `terraformDark`
- `terraformLight`
- `threejsDark`
- `threejsLight`
- `twitter`
- `typescript`
- `ubuntuDark`
- `ubuntuLight`
- `unityDark`
- `unityLight`
- `unrealengine`
- `vDark`
- `vLight`
- `vala`
- `vercelDark`
- `vercelLight`
- `vimDark`
- `vimLight`
- `visualstudioDark`
- `visualstudioLight`
- `viteDark`
- `viteLight`
- `vitestDark`
- `vitestLight`
- `vscodeDark`
- `vscodeLight`
- `vscodiumDark`
- `vscodiumLight`
- `vuejsDark`
- `vuejsLight`
- `vuetifyDark`
- `vuetifyLight`
- `webassembly`
- `webflow`
- `webpackDark`
- `webpackLight`
- `webstormDark`
- `webstormLight`
- `windicssDark`
- `windicssLight`
- `windowsDark`
- `windowsLight`
- `wordpress`
- `workersDark`
- `workersLight`
- `xd`
- `yarnDark`
- `yarnLight`
- `yewDark`
- `yewLight`
- `zigDark`
- `zigLight`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><AbletonDarkIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AbletonLightIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><ActivitypubDarkIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ActivitypubLightIcon size="20" class="nav-icon" /> Settings</a>
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
<AbletonDarkIcon
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
    <AbletonDarkIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AbletonLightIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <ActivitypubDarkIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AbletonDarkIcon size="24" />
   <AbletonLightIcon size="24" color="#4a90e2" />
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
   <AbletonDarkIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AbletonDarkIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AbletonDarkIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { abletonDark } from '@stacksjs/iconify-skill-icons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(abletonDark, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { abletonDark } from '@stacksjs/iconify-skill-icons'

// Icons are typed as IconData
const myIcon: IconData = abletonDark
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/tandpfun/skill-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: tandpfun ([Website](https://github.com/tandpfun/skill-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/skill-icons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/skill-icons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
