# Audio Component

ts-video-player's audio player with seek, time, volume, speed, settings, AirPlay, Remote Playback and a native fallback.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<Audio
  src="/audio/podcast.mp3"
  title="Episode 42: Building with STX"
  controls
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Audio file URL (required) |
| `autoplay` | `boolean` | `false` | Auto-play on load |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `false` | Start muted |
| `controls` | `boolean` | `true` | Show player controls |
| `preload` | `'none' \| 'metadata' \| 'auto'` | `'metadata'` | Preload strategy |
| `className` | `string` | `''` | Additional CSS classes |
| `showWaveform` | `boolean` | `false` | Show waveform visualization |
| `sources` | `{ src, type? }[]` | - | File, HLS or DASH candidates |
| `tracks` | `{ src, kind, srclang?, label?, default? }[]` | - | Chapter and transcript tracks |
| `drm` | `MediaDrm` | - | Same Widevine, PlayReady and FairPlay descriptors as Video; applied to DASH |
| `artist` | `string` | `''` | Artist below the title |
| `artwork` | `string` | `''` | Cover image URL |
| `waveform` | `string` | `''` | Waveform image URL, also used on the seek bar |
| `crossorigin` | `'anonymous' \| 'use-credentials'` | - | Media CORS mode |
| `class` | `string` | `''` | Alias for className |
| `title` | `string` | `''` | Optional title above player |

## Features

- **Progressive enhancement** - Native audio before custom elements load or with scripts disabled
- **Dark mode** - Styled for dark mode
- **Waveform** - Supply a waveform image for the display and seek bar
- **Accessible** - Proper fallback text
- **Responsive** - Full-width design
