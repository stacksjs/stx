# stx TODO

## Heatmap Native Component

### Privacy-Compliant Heatmap Library
**Status:** Completed
**Description:** Privacy-compliant heatmap tracking library that is a native component in stx.

**Reference:** https://www.patrick-wied.at/static/heatmapjs/

**Features:**
- Track mouse movement
- Track clicks
- Track scroll depth
- Privacy compliant (no PII, no cookies, honors DNT)
- Export data as JSON/CSV
- Visual heatmap generation
- Zone-based tracking
- Configurable sampling rates
- Works alongside Fathom/analytics

**Tasks:**
- [x] Build heatmap tracking library (`packages/stx/src/heatmap.ts`)
- [x] Make privacy compliant (no PII collection)
- [x] Create stx native component integration (`packages/components/src/ui/heatmap/Heatmap.stx`)
- [x] Design component API for easy embedding (`@heatmap` directive)
- [x] Add configuration options (sampling rate, batch size, zones, etc.)

**Implementation Details:**

1. **Core Library** (`packages/stx/src/heatmap.ts`):
   - `generateHeatmapScript()` - Generates client-side tracking script
   - `injectHeatmap()` - Auto-injects script into HTML
   - `heatmapDirective` - Custom `@heatmap` directive
   - `HeatmapAggregator` - Server-side data aggregation

2. **Configuration** (in `stx.config.ts`):
   ```typescript
   heatmap: {
     enabled: true,
     trackMouse: true,
     trackClicks: true,
     trackScroll: true,
     samplingRate: 100,
     honorDnt: true,
     endpoint: '/api/heatmap',
     batchSize: 50,
     zones: [{ id: 'cta', selector: '.cta-button' }]
   }
   ```

3. **Client API** (via `window.stxHeatmap`):
   - `getData()` - Get session data
   - `exportJSON()` / `exportCSV()` - Export data
   - `visualize()` - Generate heatmap canvas
   - `track(type, data)` - Manual event tracking
   - `flush()` - Force send data
   - `clear()` - Clear stored data

4. **Component** (`<Heatmap />`):
   - Multiple modes: overlay, standalone, thumbnail
   - Interactive controls (zoom/pan)
   - Color schemes: default, fire, cool, grayscale
   - Legend support

---

## Notes

- Should be exportable alongside the Fathom alternative - ✅ Works with analytics config
- Native stx component makes it easy to add to any page - ✅ `@heatmap` directive
- Privacy is key - no personally identifiable information - ✅ No cookies, no IDs, no PII
