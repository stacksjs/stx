# Iconify Integration

stx provides seamless integration with [Iconify](https://iconify.design/), giving you access to over 200 icon collections with 275,000+ icons.

## Features

- 🎨 **200+ Icon Collections** - Access Material Design Icons, Lucide, Tabler, Font Awesome, and many more
- 📦 **On-Demand Generation** - Generate only the icon packages you need
- 🌲 **Tree-Shakeable** - Import only the icons you use
- ⚡ **Lightweight** - Pure SVG with zero runtime dependencies
- 🎯 **TypeScript Support** - Full type safety and autocomplete
- 🔧 **Customizable** - Size, color, rotation, and flip transformations

## Installation

### Core Package

First, install the iconify core package:

```bash
bun add @stx/iconify-core
```

### Generating Icon Packages

You can generate icon packages for any Iconify collection using the stx CLI:

#### List Available Collections

```bash
stx iconify list
```

This will show all available icon collections with their names and icon counts.

#### Generate a Full Collection

```bash
stx iconify generate lucide
```

This generates a package with all icons from the Lucide collection.

#### Generate Specific Icons

To save space and only generate specific icons you need:

```bash
stx iconify generate lucide --icons home,settings,user,heart,star
```

This generates a package with only the specified icons.

#### Custom Output Directory

```bash
stx iconify generate mdi --output ./my-packages
```

## Usage

### In stx Templates

```html
<!DOCTYPE html>
<html>
<head>
  <title>Icon Demo</title>
</head>
<body>
  @js
    import { home, settings, user } from '@stx/iconify-lucide'
    import { renderIcon } from '@stx/iconify-core'

    // Render icons with different options
    global.homeIcon = renderIcon(home, { size: 24 })
    global.settingsIcon = renderIcon(settings, { size: 24, color: '#4a90e2' })
    global.userIcon = renderIcon(user, { size: 32, rotate: 90 })
  @endjs

  <div class="icons">
    {!! homeIcon !!}
    {!! settingsIcon !!}
    {!! userIcon !!}
  </div>
</body>
</html>
```

### In TypeScript/JavaScript

```typescript
import { home, settings, user } from '@stx/iconify-lucide'
import { renderIcon } from '@stx/iconify-core'

// Basic usage
const svg = renderIcon(home, { size: 24 })

// With custom color
const coloredIcon = renderIcon(settings, {
  size: 32,
  color: '#ff0000'
})

// With transformations
const transformedIcon = renderIcon(user, {
  size: 24,
  rotate: 90,
  hFlip: true,
  vFlip: false
})

// With custom CSS classes and styles
const styledIcon = renderIcon(home, {
  size: 24,
  class: 'my-icon',
  style: 'opacity: 0.5;'
})
```

## Icon Options

The `renderIcon` function accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (both width and height) |
| `width` | `string \| number` | - | Icon width |
| `height` | `string \| number` | - | Icon height |
| `color` | `string` | `'currentColor'` | Icon color (hex or CSS color) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Additional inline styles |

## Popular Icon Collections

Here are some popular icon collections you can use:

- **lucide** - Lucide Icons (1,636 icons)
- **mdi** - Material Design Icons (7,447 icons)
- **tabler** - Tabler Icons (5,963 icons)
- **heroicons** - Heroicons (584 icons)
- **fa6-solid** - Font Awesome 6 Solid (1,392 icons)
- **fa6-brands** - Font Awesome 6 Brands (488 icons)
- **carbon** - Carbon Icons (2,365 icons)
- **mingcute** - MingCute Icons (3,098 icons)
- **solar** - Solar Icons (7,401 icons)
- **ri** - Remix Icon (3,058 icons)

To see the full list, run:

```bash
stx iconify list
```

## Package Structure

Each generated icon package has the following structure:

```
packages/iconify-{collection}/
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # TypeScript types
│   ├── icon-name-1.ts    # Individual icon files
│   ├── icon-name-2.ts
│   └── ...
├── dist/                 # Built files (after build)
├── package.json
├── build.ts
└── README.md
```

## Building Icon Packages

After generating an icon package, you need to build it:

```bash
cd packages/iconify-lucide
bun install
bun run build
```

Or from the root:

```bash
bun --filter @stx/iconify-lucide run build
```

## Best Practices

1. **Generate Only What You Need**: Use the `--icons` flag to generate only the icons you'll use to keep package size small.

2. **Use Tree-Shaking**: Import individual icons rather than the entire package:
   ```typescript
   // Good
   import { home, settings } from '@stx/iconify-lucide'

   // Avoid (imports everything)
   import * as icons from '@stx/iconify-lucide'
   ```

3. **Cache Icon Renders**: If using the same icon multiple times with the same options, render it once and reuse:
   ```typescript
   @js
     import { home } from '@stx/iconify-lucide'
     import { renderIcon } from '@stx/iconify-core'

     global.homeIcon = renderIcon(home, { size: 24 })
   @endjs

   {!! homeIcon !!}
   {!! homeIcon !!}
   {!! homeIcon !!}
   ```

4. **Use CSS for Styling**: For consistent icon styling, use CSS classes:
   ```typescript
   const icon = renderIcon(home, {
     size: 24,
     class: 'icon icon-nav'
   })
   ```

## Examples

### Navigation Icons

```html
@js
  import { home, users, settings, logout } from '@stx/iconify-lucide'
  import { renderIcon } from '@stx/iconify-core'

  global.navIcons = {
    home: renderIcon(home, { size: 20, class: 'nav-icon' }),
    users: renderIcon(users, { size: 20, class: 'nav-icon' }),
    settings: renderIcon(settings, { size: 20, class: 'nav-icon' }),
    logout: renderIcon(logout, { size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.home !!} Home</a>
  <a href="/users">{!! navIcons.users !!} Users</a>
  <a href="/settings">{!! navIcons.settings !!} Settings</a>
  <a href="/logout">{!! navIcons.logout !!} Logout</a>
</nav>
```

### Status Indicators

```html
@js
  import { checkCircle, alertCircle, xCircle } from '@stx/iconify-lucide'
  import { renderIcon } from '@stx/iconify-core'

  global.statusIcons = {
    success: renderIcon(checkCircle, { size: 16, color: '#22c55e' }),
    warning: renderIcon(alertCircle, { size: 16, color: '#f59e0b' }),
    error: renderIcon(xCircle, { size: 16, color: '#ef4444' })
  }
@endjs

<div class="alert alert-success">
  {!! statusIcons.success !!} Operation successful
</div>
```

## Updating Icon Collections

To update an icon collection with the latest icons from Iconify:

1. Delete the existing package directory
2. Re-generate the package with the same command
3. Rebuild the package

```bash
rm -rf packages/collections/iconify-lucide
stx iconify generate lucide --icons home,settings,user
cd packages/collections/iconify-lucide
bun run build
```

## Credits

- Icons from [Iconify](https://iconify.design/)
- Individual icon collections have their own licenses (see package README files)

## License

The stx iconify integration packages are MIT licensed. Individual icon collections retain their original licenses.
