# Configuration

STX is configured through `stx.config.ts` (or `.config/stx.config.ts`) in your project root.

## Basic Configuration

```typescript
// stx.config.ts
import type { StxConfig } from '@stacksjs/stx'

export default {
  // Component directories
  componentsDir: './components',
  partialsDir: './partials',

  // Caching
  cache: true,
  cachePath: '.stx/cache',

  // Development
  debug: false,

  // Custom directives
  customDirectives: [],

  // Middleware
  middleware: [],
} satisfies StxConfig
```

## Configuration Options

### Directories

```typescript
export default {
  // Where to find components
  componentsDir: './components',

  // Where to find partial templates
  partialsDir: './partials',

  // Output directory for builds
  outDir: './dist',
}
```

### Caching

Template caching improves performance in production:

```typescript
export default {
  // Enable/disable caching
  cache: process.env.NODE_ENV === 'production',

  // Cache directory
  cachePath: '.stx/cache',

  // Cache TTL in milliseconds (optional)
  cacheTTL: 3600000,  // 1 hour
}
```

### Debug Mode

Enable detailed error logging:

```typescript
export default {
  // Enable debug mode
  debug: process.env.NODE_ENV !== 'production',

  // Verbose logging
  verbose: false,
}
```

### Custom Directives

Register custom directives:

```typescript
import type { CustomDirective } from '@stacksjs/stx'

const uppercase: CustomDirective = {
  name: 'uppercase',
  handler: (content, params) => params[0]?.toUpperCase() || content.toUpperCase(),
  hasEndTag: false,
  description: 'Converts text to uppercase',
}

export default {
  customDirectives: [uppercase],
}
```

### Middleware

Add pre/post-processing middleware:

```typescript
export default {
  middleware: [
    {
      name: 'minify',
      timing: 'after',  // 'before' or 'after'
      handler: (html) => html.replace(/\s+/g, ' '),
    },
  ],
}
```

### Internationalization

Configure i18n support:

```typescript
export default {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de'],
    translations: {
      en: { greeting: 'Hello' },
      es: { greeting: 'Hola' },
      fr: { greeting: 'Bonjour' },
      de: { greeting: 'Hallo' },
    },
  },
}
```

### Web Components

Generate web components from templates:

```typescript
export default {
  webComponents: {
    enabled: true,
    prefix: 'x',
    shadowDOM: true,
    components: ['Card', 'Button', 'Modal'],
  },
}
```

## Plugin Configuration

Configure the Bun plugin:

```typescript
// build.ts
import { stxPlugin } from 'bun-plugin-stx'

await Bun.build({
  entrypoints: ['./src/index.stx'],
  plugins: [
    stxPlugin({
      // Override config options
      debug: true,
      componentsDir: './src/components',
    }),
  ],
})
```

## Environment Variables

STX respects these environment variables:

| Variable | Description |
|----------|-------------|
| `STX_DEBUG` | Enable debug mode |
| `STX_CACHE` | Enable/disable caching |
| `STX_COMPONENTS_DIR` | Override components directory |
| `NODE_ENV` | Affects caching and debug defaults |

## Complete Example

```typescript
// stx.config.ts
import type { StxConfig, CustomDirective } from '@stacksjs/stx'

// Custom directive
const currency: CustomDirective = {
  name: 'currency',
  handler: (content, [amount, currency = 'USD']) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Number(amount))
  },
}

export default {
  // Directories
  componentsDir: './components',
  partialsDir: './partials',
  outDir: './dist',

  // Caching
  cache: process.env.NODE_ENV === 'production',
  cachePath: '.stx/cache',

  // Development
  debug: process.env.NODE_ENV !== 'production',
  verbose: false,

  // Custom directives
  customDirectives: [currency],

  // Middleware
  middleware: [
    {
      name: 'timing',
      timing: 'after',
      handler: (html) => {
        return `<!-- Generated: ${new Date().toISOString()} -->\n${html}`
      },
    },
  ],

  // i18n
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    translations: {
      en: {
        welcome: 'Welcome',
        goodbye: 'Goodbye',
      },
      es: {
        welcome: 'Bienvenido',
        goodbye: 'Adios',
      },
    },
  },

  // Web Components
  webComponents: {
    enabled: true,
    prefix: 'stx',
    shadowDOM: true,
  },
} satisfies StxConfig
```

## Related

- [Getting Started](/guide/getting-started)
- [Custom Directives](/guide/custom-directives)
- [Server-Side Rendering](/guide/ssr)
