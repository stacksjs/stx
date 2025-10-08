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

### Component Style (Recommended)

Icons are available as component functions that accept props:

```typescript
import { 360Icon, 3dtilesFileIcon, 3dtilesWebIcon } from '@stacksjs/iconify-gis'

// Basic usage
const icon = 360Icon()

// With size
const sizedIcon = 360Icon({ size: 24 })

// With color
const coloredIcon = 3dtilesFileIcon({ color: 'red' })

// With multiple props
const customIcon = 3dtilesWebIcon({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
```

### In stx Templates

```html
@js
  import { 360Icon, 3dtilesFileIcon, 3dtilesWebIcon } from '@stacksjs/iconify-gis'

  global.icons = {
    home: 360Icon({ size: 24 }),
    user: 3dtilesFileIcon({ size: 24, color: '#4a90e2' }),
    settings: 3dtilesWebIcon({ size: 32 })
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

```typescript
// Via color property
const redIcon = 360Icon({ color: 'red' })
const blueIcon = 360Icon({ color: '#4a90e2' })

// Via inline style
const greenIcon = 360Icon({ style: 'color: green;' })

// Via CSS class
const themedIcon = 360Icon({ class: 'text-primary' })
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
const icon24 = 360Icon({ size: 24 })
const icon1em = 360Icon({ size: '1em' })

// Set individual dimensions
const customIcon = 360Icon({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = 360Icon({ height: '1em' })
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
const smallIcon = 360Icon({ class: 'icon-small' })
const largeIcon = 360Icon({ class: 'icon-large' })
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
@js
  import { 360Icon, 3dtilesFileIcon, 3dtilesWebIcon, ArrowIcon } from '@stacksjs/iconify-gis'

  global.navIcons = {
    home: 360Icon({ size: 20, class: 'nav-icon' }),
    about: 3dtilesFileIcon({ size: 20, class: 'nav-icon' }),
    contact: 3dtilesWebIcon({ size: 20, class: 'nav-icon' }),
    settings: ArrowIcon({ size: 20, class: 'nav-icon' })
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
import { 360Icon } from '@stacksjs/iconify-gis'

const icon = 360Icon({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
```

### Status Indicators

```typescript
import { 360Icon, 3dtilesFileIcon, 3dtilesWebIcon } from '@stacksjs/iconify-gis'

const successIcon = 360Icon({ size: 16, color: '#22c55e' })
const warningIcon = 3dtilesFileIcon({ size: 16, color: '#f59e0b' })
const errorIcon = 3dtilesWebIcon({ size: 16, color: '#ef4444' })
```

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   ```typescript
   // Recommended
   import { 360Icon, 3dtilesFileIcon } from '@stacksjs/iconify-gis'
   const icon = 360Icon({ size: 24 })

   // Also works (data + renderIcon)
   import { 360, 3dtilesFile } from '@stacksjs/iconify-gis'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(360, { size: 24 })
   ```

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   ```typescript
   // Good - only imports what you use
   import { 360Icon, 3dtilesFileIcon } from '@stacksjs/iconify-gis'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-gis'
   ```

3. **Cache Rendered Icons**: Render once and reuse multiple times
   ```html
   @js
     import { 360Icon } from '@stacksjs/iconify-gis'
     global.icon = 360Icon({ size: 24 })
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
   const icon = 360Icon({ class: 'icon' })
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

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

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
