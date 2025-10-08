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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AbletonDarkIcon, AbletonLightIcon, ActivitypubDarkIcon } from '@stacksjs/iconify-skill-icons'

// Basic usage
const icon = AbletonDarkIcon()

// With size
const sizedIcon = AbletonDarkIcon({ size: 24 })

// With color
const coloredIcon = AbletonLightIcon({ color: 'red' })

// With multiple props
const customIcon = ActivitypubDarkIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AbletonDarkIcon, AbletonLightIcon, ActivitypubDarkIcon } from '@stacksjs/iconify-skill-icons'

  global.icons = {
    home: AbletonDarkIcon({ size: 24 }),
    user: AbletonLightIcon({ size: 24, color: '#4a90e2' }),
    settings: ActivitypubDarkIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = AbletonDarkIcon({ color: 'red' })
const blueIcon = AbletonDarkIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AbletonDarkIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AbletonDarkIcon({ class: 'text-primary' })
```



## Size

Control icon size using the `size`, `width`, or `height` properties:

```typescript
// Set both width and height
const icon24 = AbletonDarkIcon({ size: 24 })
const icon1em = AbletonDarkIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AbletonDarkIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AbletonDarkIcon({ height: '1em' })
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
const smallIcon = AbletonDarkIcon({ class: 'icon-small' })
const largeIcon = AbletonDarkIcon({ class: 'icon-large' })
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
@js
  import { AbletonDarkIcon, AbletonLightIcon, ActivitypubDarkIcon, ActivitypubLightIcon } from '@stacksjs/iconify-skill-icons'

  global.navIcons = {
    home: AbletonDarkIcon({ size: 20, class: 'nav-icon' }),
    about: AbletonLightIcon({ size: 20, class: 'nav-icon' }),
    contact: ActivitypubDarkIcon({ size: 20, class: 'nav-icon' }),
    settings: ActivitypubLightIcon({ size: 20, class: 'nav-icon' })
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
import { AbletonDarkIcon } from '@stacksjs/iconify-skill-icons'

const icon = AbletonDarkIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AbletonDarkIcon, AbletonLightIcon, ActivitypubDarkIcon } from '@stacksjs/iconify-skill-icons'

const successIcon = AbletonDarkIcon({ size: 16, color: '#22c55e' })
const warningIcon = AbletonLightIcon({ size: 16, color: '#f59e0b' })
const errorIcon = ActivitypubDarkIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AbletonDarkIcon, AbletonLightIcon } from '@stacksjs/iconify-skill-icons'
   const icon = AbletonDarkIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { abletonDark, abletonLight } from '@stacksjs/iconify-skill-icons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(abletonDark, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AbletonDarkIcon, AbletonLightIcon } from '@stacksjs/iconify-skill-icons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-skill-icons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AbletonDarkIcon } from '@stacksjs/iconify-skill-icons'
     global.icon = AbletonDarkIcon({ size: 24 })
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
   const icon = AbletonDarkIcon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
