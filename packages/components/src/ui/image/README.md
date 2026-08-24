# Image Component

An optimized image component with lazy loading, placeholders, and responsive features.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Basic Image

```stx
<Image
  src="/path/to/image.jpg"
  alt="Description of image"
  :width="400"
  :height="300"
/>
```

### Lazy loading (default)

Native `loading="lazy"`, so it works with scripts disabled.

```stx
<Image src="/large-image.jpg" alt="Large image" />
```

### The one image above the fold

```stx
<Image src="/hero.jpg" alt="Hero" priority />
```

### Responsive

```stx
<Image
  src="/photo-960.webp"
  srcSet="/photo-320.webp 320w, /photo-640.webp 640w, /photo-960.webp 960w"
  sizes="(min-width: 1024px) 45vw, 95vw"
  alt="Photo"
/>
```

### Aspect Ratio

```stx
<Image
  src="/hero.jpg"
  alt="Hero image"
  :aspectRatio="16/9"
  objectFit="cover"
/>
```

### Rounded Images

```stx
<!-- Rounded corners -->
<Image
  src="/avatar.jpg"
  alt="Avatar"
  rounded
/>

<!-- Circular -->
<Image
  src="/profile.jpg"
  alt="Profile"
  rounded="full"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image source URL (required) |
| `alt` | `string` | - | Alt text (required) |
| `srcSet` | `string` | - | Responsive candidates, e.g. `"a.jpg 320w, b.jpg 640w"` |
| `sizes` | `string` | - | How wide the slot is. Pair it with a `w` srcset |
| `width` | `number \| string` | - | Intrinsic width, to reserve space |
| `height` | `number \| string` | - | Intrinsic height, to reserve space |
| `lazy` | `boolean` | `true` | Native `loading="lazy"`. Ignored when `priority` |
| `priority` | `boolean` | `false` | Above the fold: eager, `fetchpriority="high"` |
| `decoding` | `'async' \| 'sync' \| 'auto'` | `'async'` | Decode hint |
| `fetchpriority` | `'high' \| 'low' \| 'auto'` | `'auto'` | Priority hint |
| `placeholder` | `string` | - | CSS painted *behind* the image while it loads |
| `aspectRatio` | `number \| string` | - | Only when you want one — see below |
| `objectFit` | `'contain' \| 'cover' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'` | How the image fills its box |
| `objectPosition` | `string` | `'center'` | Focal point of the crop |
| `rounded` | `boolean \| 'full' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `false` | Corner radius |
| `zoomOnHover` | `boolean` | `false` | Transition hook for a hover scale |
| `className` | `string` | `''` | Extra classes on the `<picture>` |

### Blur-up placeholders

`placeholder` takes any CSS `background` value and paints it behind the image,
so the real file simply covers it as it arrives. No script runs, which means
it is there in the first paint and survives with JavaScript off.

```stx
<Image
  src="/photo.jpg"
  alt="…"
  placeholder='url("data:image/bmp;base64,Qk02DAAA…")'
/>
```

Generate the data URL at build time — `ts-images` will give you a SplatHash
(16 bytes) or a thumbhash, and both decode to something you can inline. A flat
dominant colour works too, and costs twenty bytes:

```stx
<Image src="/photo.jpg" alt="…" placeholder="#655449" />
```

Behind the image rather than on it, deliberately: a background set on an
`<img>` shows through anything transparent in the file, and stays there after
it loads.

### On `aspectRatio`

Left unset, the component does not impose one. `width` and `height` already
reserve the right space, and an app that sets its own crop in CSS should win —
deriving a ratio from the intrinsic dimensions silently overrides it and the
images come out the wrong shape.

## Features

- **Native lazy loading** — `loading="lazy"`, not an IntersectionObserver
- **No JavaScript required** — renders and loads with scripts disabled
- **Self-contained styling** — inline styles, no utility framework needed
- **Placeholders** — any CSS background, painted behind the image
- **Responsive** — `srcSet` and `sizes` passed straight through
- **Priority hint** — one prop for the above-the-fold image
- **Layout-transparent wrapper** — sizes to its parent or to its content
- **WebP** — an optional `<source>` ahead of the fallback

## Object Fit Options

- `contain` - Image fits within container, maintains aspect ratio
- `cover` - Image covers container, may crop
- `fill` - Image stretches to fill container
- `none` - Image maintains original size
- `scale-down` - Uses smallest of `none` or `contain`

## Rounded Options

- `true` - `rounded-lg` (8px)
- `'full'` - `rounded-full` (fully circular)
- `'sm'` - `rounded-sm` (2px)
- `'md'` - `rounded-md` (6px)
- `'lg'` - `rounded-lg` (8px)
- `'xl'` - `rounded-xl` (12px)
- `'2xl'` - `rounded-2xl` (16px)

## Accessibility

- Always provide meaningful `alt` text
- Component automatically handles loading states
- Error states show user-friendly fallback
- Works without JavaScript (progressive enhancement)

## Performance Tips

1. Use `aspectRatio` to prevent layout shift
2. Enable `lazy` loading for below-the-fold images
3. Provide appropriate `width` and `height`
4. Use appropriate image formats (WebP, AVIF)
5. Optimize images before upload

## Example: Image Gallery

```stx
<div class="grid grid-cols-3 gap-4">
  @foreach(image in images)
    <Image
      :src="image.url"
      :alt="image.description"
      :aspectRatio="1"
      objectFit="cover"
      rounded
      lazy
    />
  @endforeach
</div>
```
