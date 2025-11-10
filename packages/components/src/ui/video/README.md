# Video Component

A responsive video player with aspect ratio support and poster images.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Video', {
  src: '/videos/demo.mp4',
  poster: '/images/video-thumbnail.jpg',
  title: 'Product Demo',
  aspectRatio: '16/9',
  controls: true
})
@endcomponent
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Video file URL (required) |
| `poster` | `string` | `''` | Poster image URL |
| `autoplay` | `boolean` | `false` | Auto-play on load |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `false` | Start muted |
| `controls` | `boolean` | `true` | Show native controls |
| `preload` | `'none' \| 'metadata' \| 'auto'` | `'metadata'` | Preload strategy |
| `width` | `number \| string` | - | Video width |
| `height` | `number \| string` | - | Video height |
| `aspectRatio` | `'16/9' \| '4/3' \| '1/1' \| string` | `'16/9'` | Aspect ratio |
| `className` | `string` | `''` | Additional CSS classes |
| `title` | `string` | `''` | Optional title above player |

## Features

- **Aspect ratios** - 16:9, 4:3, 1:1 built-in
- **Poster images** - Show thumbnail before play
- **Native controls** - Uses browser's native video controls
- **Dark mode** - Styled for dark mode
- **Responsive** - Full-width with aspect ratio
- **Accessible** - Proper fallback text
