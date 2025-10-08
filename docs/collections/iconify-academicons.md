# Academicons

> Academicons icons for stx from Iconify

## Overview

This package provides access to 158 icons from the Academicons collection through the stx iconify integration.

**Collection ID:** `academicons`
**Total Icons:** 158
**Author:** James Walsh ([Website](https://github.com/jpswalsh/academicons))
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))
**Category:** Thematic
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-academicons
```

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { AcademiaIcon, AcademiaSquareIcon, AcclaimIcon } from '@stacksjs/iconify-academicons'

// Basic usage
const icon = AcademiaIcon()

// With size
const sizedIcon = AcademiaIcon({ size: 24 })

// With color
const coloredIcon = AcademiaSquareIcon({ color: 'red' })

// With multiple props
const customIcon = AcclaimIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { AcademiaIcon, AcademiaSquareIcon, AcclaimIcon } from '@stacksjs/iconify-academicons'

  global.icons = {
    home: AcademiaIcon({ size: 24 }),
    user: AcademiaSquareIcon({ size: 24, color: '#4a90e2' }),
    settings: AcclaimIcon({ size: 32 })
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
import { academia, academiaSquare, acclaim } from '@stacksjs/iconify-academicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(academia, { size: 24 })
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
const redIcon = AcademiaIcon({ color: 'red' })
const blueIcon = AcademiaIcon({ color: '#4a90e2' })

// Via inline style
const greenIcon = AcademiaIcon({ style: 'color: green;' })

// Via CSS class
const themedIcon = AcademiaIcon({ class: 'text-primary' })
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
const icon24 = AcademiaIcon({ size: 24 })
const icon1em = AcademiaIcon({ size: '1em' })

// Set individual dimensions
const customIcon = AcademiaIcon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = AcademiaIcon({ height: '1em' })
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
const smallIcon = AcademiaIcon({ class: 'icon-small' })
const largeIcon = AcademiaIcon({ class: 'icon-large' })
```

## Available Icons

This package contains **158** icons:

- `academia`
- `academiaSquare`
- `acclaim`
- `acclaimSquare`
- `acm`
- `acmSquare`
- `acmdl`
- `acmdlSquare`
- `ads`
- `adsSquare`
- `africarxiv`
- `africarxivSquare`
- `archive`
- `archiveSquare`
- `arxiv`
- `arxivSquare`
- `biorxiv`
- `biorxivSquare`
- `ceur`
- `ceurSquare`
- `cienciaVitae`
- `cienciaVitaeSquare`
- `clarivate`
- `clarivateSquare`
- `closedAccess`
- `closedAccessSquare`
- `conversation`
- `conversationSquare`
- `coursera`
- `courseraSquare`
- `crossref`
- `crossrefSquare`
- `cv`
- `cvSquare`
- `datacite`
- `dataciteSquare`
- `dataverse`
- `dataverseSquare`
- `dblp`
- `dblpSquare`
- `depsy`
- `depsySquare`
- `doi`
- `doiSquare`
- `dryad`
- `dryadSquare`
- `elsevier`
- `elsevierSquare`
- `figshare`
- `figshareSquare`
- `googleScholar`
- `googleScholarSquare`
- `hal`
- `halSquare`
- `hypothesis`
- `hypothesisSquare`
- `ideasRepec`
- `ideasRepecSquare`
- `ieee`
- `ieeeSquare`
- `impactstory`
- `impactstorySquare`
- `inaturalist`
- `inaturalistSquare`
- `inpn`
- `inpnSquare`
- `inspire`
- `inspireSquare`
- `isidore`
- `isidoreSquare`
- `isni`
- `isniSquare`
- `jstor`
- `jstorSquare`
- `lattes`
- `lattesSquare`
- `mathoverflow`
- `mathoverflowSquare`
- `mendeley`
- `mendeleySquare`
- `moodle`
- `moodleSquare`
- `mtmt`
- `mtmtSquare`
- `nakala`
- `nakalaSquare`
- `obp`
- `obpSquare`
- `openAccess`
- `openAccessSquare`
- `openData`
- `openDataSquare`
- `openMaterials`
- `openMaterialsSquare`
- `openedition`
- `openeditionSquare`
- `orcid`
- `orcidSquare`
- `osf`
- `osfSquare`
- `overleaf`
- `overleafSquare`
- `philpapers`
- `philpapersSquare`
- `piazza`
- `piazzaSquare`
- `preregistered`
- `preregisteredDe`
- `preregisteredDePlus`
- `preregisteredDePlusSquare`
- `preregisteredDeSquare`
- `preregisteredDeTc`
- `preregisteredDeTcPlus`
- `preregisteredDeTcPlusSquare`
- `preregisteredDeTcSquare`
- `preregisteredSquare`
- `preregisteredTc`
- `preregisteredTcPlus`
- `preregisteredTcPlusSquare`
- `preregisteredTcSquare`
- `protocols`
- `protocolsSquare`
- `psyarxiv`
- `psyarxivSquare`
- `publons`
- `publonsSquare`
- `pubmed`
- `pubmedSquare`
- `pubpeer`
- `pubpeerSquare`
- `researcherid`
- `researcheridSquare`
- `researchgate`
- `researchgateSquare`
- `ror`
- `rorSquare`
- `sciHub`
- `sciHubSquare`
- `scirate`
- `scirateSquare`
- `scopus`
- `scopusSquare`
- `semanticScholar`
- `semanticScholarSquare`
- `springer`
- `springerSquare`
- `ssrn`
- `ssrnSquare`
- `stackoverflow`
- `stackoverflowSquare`
- `viaf`
- `viafSquare`
- `wiley`
- `wileySquare`
- `zenodo`
- `zenodoSquare`
- `zotero`
- `zoteroSquare`

## Usage Examples

### Navigation Menu

```html
@js
  import { AcademiaIcon, AcademiaSquareIcon, AcclaimIcon, AcclaimSquareIcon } from '@stacksjs/iconify-academicons'

  global.navIcons = {
    home: AcademiaIcon({ size: 20, class: 'nav-icon' }),
    about: AcademiaSquareIcon({ size: 20, class: 'nav-icon' }),
    contact: AcclaimIcon({ size: 20, class: 'nav-icon' }),
    settings: AcclaimSquareIcon({ size: 20, class: 'nav-icon' })
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
import { AcademiaIcon } from '@stacksjs/iconify-academicons'

const icon = AcademiaIcon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { AcademiaIcon, AcademiaSquareIcon, AcclaimIcon } from '@stacksjs/iconify-academicons'

const successIcon = AcademiaIcon({ size: 16, color: '#22c55e' })
const warningIcon = AcademiaSquareIcon({ size: 16, color: '#f59e0b' })
const errorIcon = AcclaimIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { AcademiaIcon, AcademiaSquareIcon } from '@stacksjs/iconify-academicons'
   const icon = AcademiaIcon({ size: 24 })

   // Also works (data + renderIcon)
   import { academia, academiaSquare } from '@stacksjs/iconify-academicons'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(academia, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { AcademiaIcon, AcademiaSquareIcon } from '@stacksjs/iconify-academicons'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-academicons'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { AcademiaIcon } from '@stacksjs/iconify-academicons'
     global.icon = AcademiaIcon({ size: 24 })
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
   const icon = AcademiaIcon({ class: 'icon' })
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { academia } from '@stacksjs/iconify-academicons'

// Icons are typed as IconData
const myIcon: IconData = academia
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: James Walsh ([Website](https://github.com/jpswalsh/academicons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/academicons/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/academicons/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
