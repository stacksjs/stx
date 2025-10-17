# Font-GIS

> Font-GIS icons for stx from Iconify

## Overview

This package provides access to 367 icons from the Font-GIS collection through the stx iconify integration.

**Collection ID:** `gis`
**Total Icons:** 367
**Author:** Jean-Marc Viglino ([Website](https://github.com/viglino/font-gis))
**License:** CC BY 4.0 ([Details](https://github.com/Viglino/font-gis/blob/main/LICENSE-CC-BY.md))
**Category:** Flags / Maps
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-gis
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<360Icon height="1em" />
<360Icon width="1em" height="1em" />
<360Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<360Icon size="24" />
<360Icon size="1em" />

<!-- Using width and height -->
<360Icon width="24" height="32" />

<!-- With color -->
<360Icon size="24" color="red" />
<360Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<360Icon size="24" class="icon-primary" />

<!-- With all properties -->
<360Icon
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
    <360Icon size="24" />
    <3dtilesFileIcon size="24" color="#4a90e2" />
    <3dtilesWebIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 360, 3dtilesFile, 3dtilesWeb } from '@stacksjs/iconify-gis'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(360, { size: 24 })
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
<360Icon size="24" color="red" />
<360Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<360Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<360Icon size="24" class="text-primary" />
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
<360Icon height="1em" />
<360Icon width="1em" height="1em" />
<360Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<360Icon size="24" />
<360Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.gis-icon {
  width: 1em;
  height: 1em;
}
```

```html
<360Icon class="gis-icon" />
```

## Available Icons

This package contains **367** icons:

- `360`
- `3dtilesFile`
- `3dtilesWeb`
- `arrow`
- `arrowO`
- `azimuth`
- `bbox`
- `bboxAlt`
- `bicycle`
- `bookmarkPoi`
- `bookmarkPoiB`
- `buffer`
- `busMap`
- `cadastreMap`
- `car`
- `circle`
- `circleO`
- `color`
- `compareMap`
- `compass`
- `compassAlt`
- `compassAltO`
- `compassNeedle`
- `compassRose`
- `compassRoseN`
- `contourMap`
- `convexHull`
- `coordGrid`
- `coordSystem`
- `coordSystem3d`
- `coordSystem3dAlt`
- `coordSystemAlt`
- `copyLine`
- `copyPoint`
- `copyPoly`
- `csw`
- `cube3d`
- `difference`
- `dilatation`
- `direct`
- `direction`
- `directions`
- `drone`
- `earth`
- `earthAmerica`
- `earthAmericaO`
- `earthAsia`
- `earthAsiaO`
- `earthAtlantic`
- `earthAtlanticO`
- `earthAustralia`
- `earthAustraliaO`
- `earthEuroAfrica`
- `earthEuroAfricaO`
- `earthGear`
- `earthNet`
- `earthNetO`
- `earthNetwork`
- `earthNetworkO`
- `earthNorth`
- `earthNorthO`
- `earthO`
- `earthPacific`
- `earthPacificO`
- `earthSouth`
- `earthSouthO`
- `erosion`
- `esriJsonFile`
- `extent`
- `extentAlt`
- `finish`
- `flabBO`
- `flag`
- `flagB`
- `flagFinish`
- `flagFinishBO`
- `flagO`
- `flagStart`
- `flagStartB`
- `flagStartBO`
- `flagStartO`
- `flipH`
- `flipV`
- `flowMap`
- `folderGlobe`
- `folderGlobeO`
- `folderMap`
- `folderMaps`
- `folderPoi`
- `folderPoiO`
- `folderPois`
- `fullScreen`
- `geojsonFile`
- `globe`
- `globeAlt`
- `globeAltO`
- `globeEarth`
- `globeEarthAlt`
- `globeFavorite`
- `globeGear`
- `globeO`
- `globeOptions`
- `globePoi`
- `globeShare`
- `globeShield`
- `globeSmiley`
- `globeStar`
- `globeUser`
- `globeUsers`
- `gnss`
- `gnssAntenna`
- `gpxFile`
- `grid`
- `heightMap`
- `helpLarrow`
- `helpRarrow`
- `hexMap`
- `hiker`
- `home`
- `hydroMap`
- `i3sFile`
- `i3sWeb`
- `intersection`
- `kmlFile`
- `landcoverMap`
- `layer`
- `layer2AddO`
- `layer2RmO`
- `layerAdd`
- `layerAddO`
- `layerAlt`
- `layerAltAddO`
- `layerAltEdit`
- `layerAltO`
- `layerAltPoi`
- `layerAltRmO`
- `layerAltXO`
- `layerContour`
- `layerDown`
- `layerDownload`
- `layerEdit`
- `layerHeight`
- `layerHydro`
- `layerLandcover`
- `layerO`
- `layerPoi`
- `layerRm`
- `layerRmO`
- `layerRoad`
- `layerStack`
- `layerStackO`
- `layerStat`
- `layerStatAlt`
- `layerUp`
- `layerUpload`
- `layers`
- `layersO`
- `layersPoi`
- `location`
- `locationArrow`
- `locationArrowO`
- `locationMan`
- `locationManAlt`
- `locationOn`
- `locationPoi`
- `locationPoiO`
- `magnifyMap`
- `map`
- `mapAdd`
- `mapBook`
- `mapBookmark`
- `mapControl`
- `mapEdit`
- `mapExtent`
- `mapFavorite`
- `mapLegend`
- `mapLegendO`
- `mapLock`
- `mapO`
- `mapOptions`
- `mapOptionsAlt`
- `mapPlay`
- `mapPoi`
- `mapPrint`
- `mapRm`
- `mapRoute`
- `mapSearch`
- `mapSend`
- `mapShare`
- `mapShareAlt`
- `mapSmiley`
- `mapStar`
- `mapStat`
- `mapTag`
- `mapTags`
- `mapTime`
- `mapUnlock`
- `mapUser`
- `mapUsers`
- `measure`
- `measureArea`
- `measureAreaAlt`
- `measureLine`
- `modifyLine`
- `modifyPoly`
- `modifyPolyO`
- `mosaic`
- `move`
- `moveAlt`
- `multipoint`
- `mvt`
- `network`
- `networkO`
- `northArrow`
- `northArrowN`
- `offset`
- `openls`
- `pedestrian`
- `phoneMap`
- `phoneRoute`
- `phoneRouteAlt`
- `phoneRouteAltR`
- `photogrammetry`
- `pin`
- `pinEarth`
- `pirateMap`
- `piratePoi`
- `poi`
- `poiAlt`
- `poiAltO`
- `poiEarth`
- `poiFavorite`
- `poiFavoriteO`
- `poiHome`
- `poiHomeO`
- `poiInfo`
- `poiInfoO`
- `poiMap`
- `poiMapO`
- `poiO`
- `poiSlash`
- `poiSlashO`
- `point`
- `pois`
- `poisO`
- `polygon`
- `polygonHole`
- `polygonHoleO`
- `polygonHolePt`
- `polygonO`
- `polygonODash`
- `polygonPt`
- `polyline`
- `polylineDash`
- `polylinePt`
- `position`
- `positionMan`
- `positionO`
- `profile`
- `profileO`
- `projConic`
- `projGeo`
- `projPoint`
- `projSquare`
- `projStereo`
- `projUtm`
- `pushpin`
- `pyramid`
- `rectangle`
- `rectangleO`
- `rectanglePt`
- `regularShape`
- `regularShapeO`
- `regularShapePt`
- `revers`
- `roadMap`
- `rotate`
- `route`
- `routeEnd`
- `routeStart`
- `satellite`
- `satelliteEarth`
- `scale`
- `scalePoly`
- `screenDub`
- `screenDubO`
- `screenDub1`
- `screenDub2`
- `screenMag`
- `screenMagAlt`
- `screenMagO`
- `screenSplitH`
- `screenSplitV`
- `searchAddress`
- `searchAttribtues`
- `searchCoord`
- `searchCountry`
- `searchData`
- `searchFeature`
- `searchGlobe`
- `searchGlobeAlt`
- `searchHome`
- `searchLayer`
- `searchMap`
- `searchPoi`
- `searchPropertie`
- `selectExtent`
- `shapeFile`
- `signpost`
- `simplify`
- `skeletonize`
- `sld`
- `snap`
- `snapOrtho`
- `sos`
- `split`
- `splitLine`
- `splitPolygon`
- `sps`
- `square`
- `squareO`
- `squarePt`
- `start`
- `startO`
- `statisticMap`
- `step`
- `stepO`
- `storyMap`
- `storyMapO`
- `storyMaps`
- `swipeMapH`
- `swipeMapV`
- `symDifference`
- `tacheometer`
- `tag`
- `tagO`
- `tags`
- `tagsO`
- `theodolite`
- `timeMap`
- `timer`
- `tjs`
- `topography`
- `topojsonFile`
- `translate`
- `translateX`
- `translateY`
- `triangleMap`
- `union`
- `voronoiMap`
- `wcps`
- `wcs`
- `weatherMap`
- `wfs`
- `wfsT`
- `wmc`
- `wms`
- `wmts`
- `worldFolder`
- `worldFolderO`
- `worldMap`
- `worldMapAlt`
- `worldMapAltO`
- `wps`
- `xyz`
- `zoomIn`
- `zoomOut`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><360Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><3dtilesFileIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><3dtilesWebIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><ArrowIcon size="20" class="nav-icon" /> Settings</a>
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
<360Icon
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
    <360Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <3dtilesFileIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <3dtilesWebIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <360Icon size="24" />
   <3dtilesFileIcon size="24" color="#4a90e2" />
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
   <360Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <360Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <360Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 360 } from '@stacksjs/iconify-gis'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(360, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 360 } from '@stacksjs/iconify-gis'

// Icons are typed as IconData
const myIcon: IconData = 360
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

CC BY 4.0

See [license details](https://github.com/Viglino/font-gis/blob/main/LICENSE-CC-BY.md) for more information.

## Credits

- **Icons**: Jean-Marc Viglino ([Website](https://github.com/viglino/font-gis))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/gis/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/gis/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
