# Video Component

A video player: ts-video-player's `<video-player>` with its own controls, for a
file, an HLS or DASH stream, a YouTube link (played from youtube-nocookie.com)
or a Vimeo link (with Do Not Track). The controls are drawn over a YouTube or
Vimeo embed, so the provider's title bar and "Watch on YouTube" are never a way
out of the page: the video plays here. The controls speak the page's language
(`<html lang>`).

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<Video
  src="/videos/demo.mp4"
  poster="/images/video-thumbnail.jpg"
  label="Product demo"
  aspectRatio="16/9"
/>
```

One player can play whichever video is chosen. `src`, `poster`, `aspectRatio`
and `label` follow a parent's binding, an empty `src` pauses it (closing the
dialog it sits in stops the video), and with `autoplay` each new video starts by
itself, muted only where the browser refuses sound:

```stx
<Video :src="current.url" :aspectRatio="current.aspect" :label="current.title" autoplay />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | A file, stream, YouTube or Vimeo URL. Follows a binding |
| `poster` | `string` | `''` | Poster image URL. Follows a binding |
| `label` | `string` | `title` | The player's accessible name. Follows a binding |
| `aspectRatio` | `string \| number` | `'16 / 9'` | Width over height: `'16/9'`, `'4/3'`, `0.5625`. Follows a binding |
| `autoplay` | `boolean` | `false` | Play each video as soon as it is chosen |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `false` | Start muted |
| `controls` | `boolean` | `true` | Show the player's controls |
| `playsinline` | `boolean` | `true` | Play inline on iOS |
| `preload` | `'none' \| 'metadata' \| 'auto'` | `'metadata'` | Preload strategy |
| `sources` | `{ src, type? }[]` | - | Several sources for the browser to choose from |
| `tracks` | `{ src, kind, srclang?, label?, default? }[]` | - | Captions and subtitles (WebVTT) |
| `crossorigin` | `'anonymous' \| 'use-credentials'` | - | CORS mode |
| `controlslist` | `string` | `'nodownload'` | Native controls list |
| `disablePictureInPicture` | `boolean` | `false` | Hide picture in picture |
| `width` / `height` | `number \| string` | - | The shape, when `aspectRatio` is not given |
| `title` | `string` | `''` | A caption shown above the player |
| `className` | `string` | `''` | Additional CSS classes |

## Features

- **One player, many videos**: follows a bound `src` and plays each one chosen
- **YouTube and Vimeo in the page**: privacy-enhanced embeds behind the player's own controls
- **Any shape**: a Short is tall, a landscape clip wide, and the shape can change with the video
- **Accessible**: named controls and announcements in the page's language, keyboard shortcuts
- **Captions**: WebVTT tracks through `tracks`
