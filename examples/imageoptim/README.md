# ImageOptim — stx + Craft example

A native macOS image-optimization app that mirrors [ImageOptim](https://imageoptim.com),
built end-to-end with stx, [Craft](../../craft) (the native webview shell), and
our own pure-TypeScript image libraries — **no third-party runtime deps, only
Bun and our own libs**.

```
┌──────────────────────────────────────────────────────────┐
│ ●●●            ImageOptim                                │
├──────────────────────────────────────────────────────────┤
│  cover.jpg     84.2 KB   21.0 KB   −75.0%  ⬇  ✕         │
│  hero.png       1.2 MB    872 KB   −28.4%  ⬇  ✕         │
│  banner.gif      62 KB    21 KB    −64.9%  ⬇  ✕         │
│                                                ┌────┐    │
│                                                │ ↓  │    │
│                                                └────┘    │
├──────────────────────────────────────────────────────────┤
│  +  3 files · saved 1.4 MB (66.2%)            ⋯  ↻ Again │
└──────────────────────────────────────────────────────────┘
```

## Run it

From the stx repo root, use the regular stx CLI:

```bash
./stx examples/imageoptim              # browser (default)
./stx examples/imageoptim --native     # native Craft window
```

`./stx` is the source-loader shell script at the repo root; `./bin/stx`
is the compiled binary (also works once it's been recompiled with the
recent changes). The example registers `/optimize` via stx's standard
`apiRoutes` config — no custom server bootstrap.

The `--native` flag relies on:

- `@stacksjs/desktop` being built — `cd packages/desktop && bun run build`
- the `craft` binary on your PATH (or at `~/.bun/bin/craft` / `CRAFT_BINARY_PATH=…`)

If `--native` can't find a craft binary, it transparently falls back to
opening the system browser at the dev URL.

## Architecture

```
┌─────────────────────────────────────┐
│  Craft native window (WKWebView)     │  ← UI
│   (or system browser w/o --native)   │
└────────────────┬────────────────────┘
                 │ fetch /optimize
                 ▼
┌─────────────────────────────────────┐
│  stx dev server (Bun.serve)          │  ← server
│   ├ /        → pages/index.stx       │
│   └ /optimize → apiRoutes (config)   │
└────────────────┬────────────────────┘
                 │ dispatch by magic bytes
                 ▼
┌─────────────────────────────────────────────────────────┐
│  ts-png · ts-jpeg · ts-webp · ts-bmp · ts-gif · ts-avif │  ← image libs
│   (pure TS, zero runtime deps)                          │
└─────────────────────────────────────────────────────────┘
```

- `stx.config.ts` — registers `/optimize` via `apiRoutes`.
- `pages/index.stx` — the ImageOptim UI (drop zone + result list + toolbar).
- `components/{DropZone,Toolbar,FileRow}.stx` — wrap the native-feeling chrome.
- `optimize.ts` — magic-byte format detection → per-format pipeline.

## Format coverage

Every format has a real, lossless-or-near-lossless re-encode path. Output
is only kept when smaller than the input — already-optimized files come
back unchanged with `passthrough: true` in `x-stx-result`.

| Format | Strategy                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------- |
| PNG    | decode → re-deflate at level 9 across 4 strategies, keep smallest                                     |
| JPEG   | decode → re-encode at q=85 (note: drops EXIF / orientation)                                           |
| WebP   | decode → re-encode lossless                                                                           |
| BMP    | decode → re-encode (drops alpha when fully opaque)                                                    |
| SVG    | text minify, CDATA-aware (preserves embedded `<style>` / `<script>` content)                          |
| GIF    | palette tightening per-frame + global-palette consolidation (lossless, pixel-exact)                   |
| AVIF   | ISOBMFF re-mux: strip Exif/XMP/`mime` items, thumbnails, redundant compatible brands. AV1 bytes preserved bit-exact. |
| TIFF · ICO · HEIC | detected and reported, but no optimizer yet (passthrough with note) |

A note on AVIF: a real AV1 *encoder* is months of work (libaom is ~250 k
lines). Stripping container metadata is what every production AVIF
optimizer (`cavif --strip`, `avifenc --keep-only-primary`) actually does
— and it's the source of most real-world savings on phone-camera AVIFs.

### Sample runs

```
JPEG: cover.jpg               84,266 → 21,040 B   −75.0 %   q=85 re-encode
GIF:  sparse-palette.gif       1,262 →    443 B   −64.9 %   palette tighten
AVIF: with-exif-thumb.avif    90,169 → 75,648 B   −16.1 %   strip av01, Exif, mime
SVG:  hand-written.svg           251 →    128 B   −49.0 %   text minify
```

## UX

- **Drag and drop** any number of images onto the window
- **Click `+`** to pick files via the system dialog
- **Per-row download** button to save the optimized bytes
- **Per-row remove** button to drop a file from the list
- **Toolbar summary** shows total bytes saved across all rows in real time
- **`Again`** button re-runs the optimizer on every file (useful after a
  settings change)
- After the first drop the **drop zone shrinks into the corner** but stays
  interactive — you can keep dropping files into it
- **Errors surface in the toolbar in red** so failures aren't silent

## What got fixed in the libs along the way

Wiring the example up surfaced several real bugs in our image libs. They've
been fixed in-place:

**ts-gif:**

- `Reader` LSD parser was off-by-one — read 6 bytes instead of 7, missing
  the `bg_color_index` field, which shifted every decoded color in the
  global palette by one byte.
- `Reader` rejected real-world GIFs that have stray `0x00` bytes between
  blocks. Now treated as no-op padding (matches every popular decoder).
- `Writer` accepted out-of-range palette colours silently. Now validates.

**ts-avif:**

- `parseISOBMFF` recursed into FullBox containers (`meta`, `iref`) without
  skipping their 4-byte version+flags prefix, so children showed up
  garbled — masking every real `meta` / `iref` child.
- `getImageData` was double-adding `mdat`'s offset, so it returned
  truncated AV1 reads.
- `parseISOBMFF` allocated a fresh `Uint8Array` per box via `slice`. Now
  uses `subarray` (a view) to avoid quadratic memory churn.

## Other improvements in this round

| # | Where | Improvement |
|---|---|---|
| 1 | ts-avif | `parseISOBMFF` skips FullBox prefix for `iref` (was already done for `meta`) |
| 2 | ts-avif | Refuse to downgrade item IDs > 0xFFFF (rather than corrupting the file) |
| 3 | ts-avif | `parseISOBMFF` uses `subarray` instead of `slice` |
| 4 | ts-avif | New `optimizeWithStats()` returns `{ keptItemIds, droppedItemIds, droppedItemTypes, … }` |
| 5 | ts-avif | Construction-method != 0 is handled gracefully (returns input) |
| 6 | ts-gif | `Writer` validates palette entries are 24-bit RGB integers |
| 7 | ts-gif | `optimize()` accepts an `{ force }` option |
| 8 | example | PNG sweep no longer iterates the unsupported `filterType` axis (4× faster, same output) |
| 9 | example | Format detection covers TIFF, ICO, HEIC |
| 10 | example | SVG minifier preserves CDATA contents |
| 11 | example | `/optimize` returns `405 Method Not Allowed` for non-POST |
| 12 | example | `/optimize` enforces a 256 MB upload cap (DoS guard) |
| 13 | example UI | Per-row download button |
| 14 | example UI | Errors surface in the toolbar in red |
| 15 | example UI | Drop zone shrinks but stays interactive after first drop |
| 16 | example UI | Per-row remove button + total savings + correct Again button state |
| 17 | example | `HEADLESS=1` auto-opens the system browser |
| 18 | example | `DEBUG=1` enables Craft DevTools + verbose logs |
| 19 | example | AVIF strip details surface in `x-stx-result` (`droppedItemTypes`) |
| 20 | example | Falls back to browser when no Craft binary is found, instead of bailing |

## Why no `ts-images` aggregator?

`ts-images` pulls `svgo` as a runtime dep, which violates the "only Bun +
our own" rule. So this example calls each format library directly.
