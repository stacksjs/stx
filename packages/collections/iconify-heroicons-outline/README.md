# @stacksjs/iconify-heroicons-outline

HeroIcons v1 Outline icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-heroicons-outline
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-heroicons-outline'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-heroicons-outline'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 385 icons from HeroIcons v1 Outline.

## License

MIT

License: https://github.com/tailwindlabs/heroicons/blob/master/LICENSE

## Credits

- Icons: Refactoring UI Inc (https://github.com/tailwindlabs/heroicons)
- Iconify: https://iconify.design/
