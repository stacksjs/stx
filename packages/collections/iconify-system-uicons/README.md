# @stacksjs/iconify-system-uicons

System UIcons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-system-uicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-system-uicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-system-uicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 430 icons from System UIcons.

## License

Unlicense

License: https://github.com/CoreyGinnivan/system-uicons/blob/master/LICENSE

## Credits

- Icons: Corey Ginnivan (https://github.com/CoreyGinnivan/system-uicons)
- Iconify: https://iconify.design/
