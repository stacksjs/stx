# RenderSurface

A box shared TypeScript draws into, frame by frame, with no WebView
(stacksjs/stx#2108). On a native screen it is the host's RenderSurface, drawn
with Metal (craft-native/craft#578); in a browser it is a `<canvas>`. The same
page and the same drawing code serve both.

```html
<script client>
import { startRenderLoop } from '@stacksjs/components/render-surface'

let loop = null
const frame = new Uint32Array(320 * 180) // 0xAARRGGBB, row by row

function start(event) {
  loop = startRenderLoop(event.surface, () => {
    paint(frame) // the game's own CPU renderer
    return { pixels: frame, width: 320, height: 180 }
  })
}
</script>

<RenderSurface class="flex-1" filter="nearest" label="Map"
  @ready="start($event)" @restored="loop.wake()" @error="report($event)" />
```

## Props

| Prop | Default | |
| --- | --- | --- |
| `surface` | one per instance | The name frames are given to, unique on the screen. |
| `filter` | `nearest` | How a frame of another size is scaled: `nearest` keeps pixel art crisp, `linear` smooths. |
| `opaque` | `true` | A surface that is not opaque takes premultiplied alpha. |
| `label` | | What a screen reader says for it. |
| `unavailableText` | "This device cannot draw this view." | Shown in its place where nothing can draw one. |

## Events

- `ready` the first time it has a size, then `resize` on each change:
  `{ surface, width, height, scale, pixelWidth, pixelHeight }` (points, then pixels).
- `lost` (`{ surface, reason }`) when a phone's app goes to the background, and
  `restored` (the metrics) when it returns. Nothing is kept across a loss:
  draw a whole frame again.
- `error` with `{ surface, code, message }`: `UNAVAILABLE` where the device
  cannot draw one (the box then says so instead of staying blank), or
  `DUPLICATE` when another live surface already has the name. That one stays
  blank and the first keeps drawing.

## Drawing

From `@stacksjs/components/render-surface`:

- `presentFrame(surface, pixels, width, height)` draws one frame of
  `width * height` 0xAARRGGBB words, scaled to the box. A frame can be any size
  up to 8192 pixels a side. It answers `true`, or `false` while the surface is
  not ready or is lost. It throws a `TypeError` for a wrong array or size, and
  an Error with `code` set to `NOT_FOUND` (no mounted surface has that name,
  from its removal on) or `UNAVAILABLE`.
- `startRenderLoop(surface, draw, { onError })` draws on every display frame.
  It waits after a `false` until `wake()`, call that from `ready` and
  `restored`. The surface's removal ends it quietly.
- `renderSurfaceHost()` says where frames would go: `native`, `canvas`, or
  `none`. Read it before mounting to decide whether to offer a surface.

On a phone, frames go to the host's own `craft.renderSurface.present`, which
copies the words where the script runs. It is a function, not a message, so a
frame is never serialized; stx never defines or replaces it.

Android has no RenderSurface yet (craft-native/craft#393).
