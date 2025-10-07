# @stx/iconify-skill-icons

Skill Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-skill-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-skill-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-skill-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 397 icons from Skill Icons.

## License

MIT

License: https://github.com/tandpfun/skill-icons/blob/main/LICENSE

## Credits

- Icons: tandpfun (https://github.com/tandpfun/skill-icons)
- Iconify: https://iconify.design/
