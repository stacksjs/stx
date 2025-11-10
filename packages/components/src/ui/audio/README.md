# Audio Component

A styled audio player with optional waveform visualization.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Audio', {
  src: '/audio/podcast.mp3',
  title: 'Episode 42: Building with STX',
  controls: true
})
@endcomponent
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Audio file URL (required) |
| `autoplay` | `boolean` | `false` | Auto-play on load |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `false` | Start muted |
| `controls` | `boolean` | `true` | Show native controls |
| `preload` | `'none' \| 'metadata' \| 'auto'` | `'metadata'` | Preload strategy |
| `className` | `string` | `''` | Additional CSS classes |
| `showWaveform` | `boolean` | `false` | Show waveform visualization |
| `title` | `string` | `''` | Optional title above player |

## Features

- **Native controls** - Uses browser's native audio controls
- **Dark mode** - Styled for dark mode
- **Waveform** - Optional visual waveform display
- **Accessible** - Proper fallback text
- **Responsive** - Full-width design
