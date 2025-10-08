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

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<AcademiaIcon height="1em" />
<AcademiaIcon width="1em" height="1em" />
<AcademiaIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<AcademiaIcon size="24" />
<AcademiaIcon size="1em" />

<!-- Using width and height -->
<AcademiaIcon width="24" height="32" />

<!-- With color -->
<AcademiaIcon size="24" color="red" />
<AcademiaIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<AcademiaIcon size="24" class="icon-primary" />

<!-- With all properties -->
<AcademiaIcon
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
    <AcademiaIcon size="24" />
    <AcademiaSquareIcon size="24" color="#4a90e2" />
    <AcclaimIcon size="32" class="my-icon" />
  </div>
</body>
</html>
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

```html
<!-- Via color property -->
<AcademiaIcon size="24" color="red" />
<AcademiaIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<AcademiaIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<AcademiaIcon size="24" class="text-primary" />
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
<AcademiaIcon height="1em" />
<AcademiaIcon width="1em" height="1em" />
<AcademiaIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<AcademiaIcon size="24" />
<AcademiaIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.academicons-icon {
  width: 1em;
  height: 1em;
}
```

```html
<AcademiaIcon class="academicons-icon" />
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
<nav>
  <a href="/"><AcademiaIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AcademiaSquareIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AcclaimIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AcclaimSquareIcon size="20" class="nav-icon" /> Settings</a>
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
<AcademiaIcon
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
    <AcademiaIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AcademiaSquareIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AcclaimIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <AcademiaIcon size="24" />
   <AcademiaSquareIcon size="24" color="#4a90e2" />
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
   <AcademiaIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <AcademiaIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <AcademiaIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { academia } from '@stacksjs/iconify-academicons'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(academia, { size: 24 })
   @endjs

   {!! customIcon !!}
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

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

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
