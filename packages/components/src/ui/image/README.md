# Image Component

An optimized image component with lazy loading, placeholders, and responsive features.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Basic Image

```stx
@component('Image', {
  src: '/path/to/image.jpg',
  alt: 'Description of image',
  width: 400,
  height: 300
})
@endcomponent
```

### Lazy Loading (default)

```stx
@component('Image', {
  src: '/large-image.jpg',
  alt: 'Large image',
  lazy: true,
  placeholder: '/thumbnail.jpg'
})
@endcomponent
```

### Aspect Ratio

```stx
@component('Image', {
  src: '/hero.jpg',
  alt: 'Hero image',
  aspectRatio: 16/9,
  objectFit: 'cover'
})
@endcomponent
```

### Rounded Images

```stx
<!-- Rounded corners -->
@component('Image', {
  src: '/avatar.jpg',
  alt: 'Avatar',
  rounded: true
})
@endcomponent

<!-- Circular -->
@component('Image', {
  src: '/profile.jpg',
  alt: 'Profile',
  rounded: 'full'
})
@endcomponent
```

### With Callbacks

```stx
<script>
export const handleLoad = () => {
  console.log('Image loaded!')
}

export const handleError = () => {
  console.error('Failed to load image')
}
</script>

@component('Image', {
  src: '/photo.jpg',
  alt: 'Photo',
  onLoad: handleLoad,
  onError: handleError
})
@endcomponent
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Image source URL (required) |
| `alt` | `string` | - | Alt text (required) |
| `width` | `number \| string` | - | Image width |
| `height` | `number \| string` | - | Image height |
| `lazy` | `boolean` | `true` | Enable lazy loading |
| `placeholder` | `string` | gray SVG | Placeholder image while loading |
| `onLoad` | `function` | - | Callback when image loads |
| `onError` | `function` | - | Callback when image fails |
| `aspectRatio` | `number` | - | Aspect ratio (e.g., 16/9, 4/3) |
| `objectFit` | `'contain' \| 'cover' \| 'fill' \| 'none' \| 'scale-down'` | `'cover'` | How image fits container |
| `rounded` | `boolean \| 'full' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `false` | Border radius |
| `className` | `string` | `''` | Additional CSS classes |

## Features

- **Lazy loading** - Loads images only when visible (Intersection Observer)
- **Placeholders** - Shows placeholder until image loads
- **Aspect ratio** - Maintains aspect ratio to prevent layout shift
- **Object fit** - Control how images fill their container
- **Responsive** - Adapts to container size
- **Error handling** - Shows fallback on load failure
- **Dark mode** - Skeleton loader adapts to dark mode
- **Smooth transitions** - Fade-in effect on load
- **Performance** - Optimized with intersection observer
- **Modern ES modules** - Clean export syntax
- **Headwind styling** - Utility-first CSS classes

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
    @component('Image', {
      src: image.url,
      alt: image.description,
      aspectRatio: 1,
      objectFit: 'cover',
      rounded: true,
      lazy: true
    })
    @endcomponent
  @endforeach
</div>
```
