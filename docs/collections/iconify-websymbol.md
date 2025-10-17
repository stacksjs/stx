# Web Symbols Liga

> Web Symbols Liga icons for stx from Iconify

## Overview

This package provides access to 85 icons from the Web Symbols Liga collection through the stx iconify integration.

**Collection ID:** `websymbol`
**Total Icons:** 85
**Author:** Just Be Nice studio
**License:** Open Font License ([Details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL))

**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-websymbol
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<ArchiveIcon height="1em" />
<ArchiveIcon width="1em" height="1em" />
<ArchiveIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<ArchiveIcon size="24" />
<ArchiveIcon size="1em" />

<!-- Using width and height -->
<ArchiveIcon width="24" height="32" />

<!-- With color -->
<ArchiveIcon size="24" color="red" />
<ArchiveIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<ArchiveIcon size="24" class="icon-primary" />

<!-- With all properties -->
<ArchiveIcon
  size="32"
  color="#4a90e2"
  class="my-icon"
  style="opacity: 0.8;"
/>
```

### In stx Templates

```html
<!DOCTYPE html>
<html>
<head>
  <title>Icon Demo</title>
  <style>
    .icon-grid {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="icon-grid">
    <ArchiveIcon size="24" />
    <ArrowsCwIcon size="24" color="#4a90e2" />
    <AttachIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { archive, arrowsCw, attach } from '@stacksjs/iconify-websymbol'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(archive, { size: 24 })
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

```html
<!-- Via color property -->
<ArchiveIcon size="24" color="red" />
<ArchiveIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<ArchiveIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<ArchiveIcon size="24" class="text-primary" />
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

Unlike other components, SVG + CSS components do not set icon size by default. This has advantages and disadvantages.

**Disadvantages:**
- You need to set size yourself.

**Advantages:**
- You have full control over icon size.

You can change icon size by:
- Setting `width` and `height` properties
- Using CSS

### Properties

All icon components support `width` and `height` properties.

Value is a string or number.

You do not need to set both properties. If you set one property, the other property will automatically be calculated from the icon's width/height ratio.

**Examples:**

```html
<ArchiveIcon height="1em" />
<ArchiveIcon width="1em" height="1em" />
<ArchiveIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<ArchiveIcon size="24" />
<ArchiveIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.websymbol-icon {
  width: 1em;
  height: 1em;
}
```

```html
<ArchiveIcon class="websymbol-icon" />
```

## Available Icons

This package contains **85** icons:

- `archive`
- `arrowsCw`
- `attach`
- `attention`
- `block`
- `cancel`
- `cancelCircle`
- `chat`
- `clock`
- `cloud`
- `code`
- `cog`
- `comment`
- `commentAlt`
- `cwCircle`
- `doc`
- `docsLandscape`
- `downCircle`
- `downDir`
- `downMicro`
- `facebookRect`
- `folder`
- `font`
- `forward`
- `googleplusRect`
- `heart`
- `heartEmpty`
- `indentLeft`
- `indentRight`
- `leftCircle`
- `leftOpen`
- `link`
- `linkedinRect`
- `list`
- `listNumbered`
- `location`
- `lock`
- `lockOpen`
- `logout`
- `mail`
- `minusCircle`
- `odnoklassnikiRect`
- `ok`
- `okCircle`
- `picture`
- `plusCircle`
- `popup`
- `progress0`
- `progress1`
- `progress2`
- `progress3`
- `progress4`
- `progress5`
- `progress6`
- `progress7`
- `reply`
- `replyAll`
- `resizeFull`
- `resizeFullCircle`
- `retweet`
- `rightCircle`
- `rightDir`
- `rightOpen`
- `rss`
- `rssAlt`
- `search`
- `signal`
- `skype`
- `star`
- `tag`
- `target`
- `terminal`
- `th`
- `thLarge`
- `thList`
- `tumblrRect`
- `twitterBird`
- `upCircle`
- `upMicro`
- `updownCircle`
- `user`
- `video`
- `vimeoRect`
- `vkontakteRect`
- `youtube`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><ArchiveIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><ArrowsCwIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AttachIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AttentionIcon size="20" class="nav-icon" /> Settings</a>
</nav>

<style>
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-icon {
    color: currentColor;
  }
</style>
```

### Custom Styling

```html
<ArchiveIcon
  size="24"
  class="icon icon-primary"
  style="opacity: 0.8; transition: opacity 0.2s;"
/>

<style>
  .icon-primary {
    color: #4a90e2;
  }
  .icon-primary:hover {
    opacity: 1;
  }
</style>
```

### Status Indicators

```html
<div class="status-grid">
  <div class="status-item">
    <ArchiveIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <ArrowsCwIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AttachIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <ArchiveIcon size="24" />
   <ArrowsCwIcon size="24" color="#4a90e2" />
   ```

2. **Use CSS for Theming**: Apply consistent styling through CSS classes
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

   ```html
   <ArchiveIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <ArchiveIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <ArchiveIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { archive } from '@stacksjs/iconify-websymbol'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(archive, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { archive } from '@stacksjs/iconify-websymbol'

// Icons are typed as IconData
const myIcon: IconData = archive
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

Open Font License

See [license details](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL) for more information.

## Credits

- **Icons**: Just Be Nice studio
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/websymbol/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/websymbol/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
