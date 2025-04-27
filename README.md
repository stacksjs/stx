![Social Card of Bun Plugin blade](https://github.com/stacksjs/bun-plugin-stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]
<!-- [![Codecov][codecov-src]][codecov-href] -->

# bun-plugin-stx

A Blade-like template engine plugin for Bun, enabling simple and powerful templating with .stx files.

## Features

- 🦋 Laravel Blade-like syntax
- 🚀 Fast and lightweight
- 📦 Zero config

## Installation

```bash
bun add bun-plugin-stx
```

## Setup

Add the plugin to your `bunfig.toml`:

```toml
preload = [ "bun-plugin-stx" ]

# or as a serve plugin
[serve.static]
plugins = [ "bun-plugin-stx" ]
```

Or register the plugin in your build script:

```ts
import { build } from 'bun'
import stxPlugin from 'bun-plugin-stx'

await build({
  entrypoints: ['./src/index.ts', './templates/home.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

## Usage with ESM

### 1. Configure Bun to use the plugin

In your build script or Bun configuration:

```js
// build.js
import { build } from 'bun'
import stxPlugin from 'bun-plugin-stx'

await build({
  entrypoints: ['./src/index.ts', './templates/home.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

### 2. Import and use .stx files directly

You can import .stx files directly in your ESM code:

```js
// app.js
import homeTemplate from './templates/home.stx'

// Use the processed HTML content
document.body.innerHTML = homeTemplate
```

### 3. Use with Bun's server

You can serve .stx files directly with Bun's server:

```js
// server.js
import { serve } from 'bun'
import homeTemplate from './home.stx'

serve({
  port: 3000,
  fetch(req) {
    return new Response(homeTemplate, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})
```

Or use as route handlers:

```js
import about from './about.stx'
// server.js
import home from './home.stx'

export default {
  port: 3000,
  routes: {
    '/': home,
    '/about': about
  }
}
```

## STX Template Syntax

STX templates use a syntax inspired by Laravel Blade. Templates can contain HTML with special directives for rendering dynamic content.

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>STX Example</title>
  <script>
    // Define your data as an ESM export
    export const title = "Hello World";
    export const items = ["Apple", "Banana", "Cherry"];
    export const showFooter = true;
  </script>
</head>
<body>
  <h1>{{ title }}</h1>

  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>

  @if (showFooter)
    <footer>Copyright 2023</footer>
  @endif
</body>
</html>
```

### Data Export Options

There are two ways to expose data in your STX templates:

#### 1. ESM exports (recommended)

```html
<script>
  // Modern ESM named exports
  export const title = "Hello World";
  export const count = 42;

  // Export functions
  export function getFullName(first, last) {
    return `${first} ${last}`;
  }

  // Export default object
  export default {
    items: ["Apple", "Banana", "Cherry"],
    showDetails: true
  };
</script>
```

#### 2. Legacy CommonJS (module.exports)

```html
<script>
  // Legacy CommonJS exports
  module.exports = {
    title: "Hello World",
    items: ["Apple", "Banana", "Cherry"],
    showFooter: true
  };
</script>
```

### Template Directives

#### Custom Directives

STX supports defining your own custom directives for template processing:

```ts
import type { CustomDirective } from 'bun-plugin-stx'
// Configure custom directives
import stxPlugin from 'bun-plugin-stx'

// Create custom directives
const uppercaseDirective: CustomDirective = {
  name: 'uppercase',
  handler: (content, params) => {
    return params[0] ? params[0].toUpperCase() : content.toUpperCase()
  },
  // No hasEndTag needed for single-parameter directives
}

const wrapDirective: CustomDirective = {
  name: 'wrap',
  handler: (content, params) => {
    const className = params[0] || 'default-wrapper'
    return `<div class="${className}">${content}</div>`
  },
  hasEndTag: true, // This directive requires an end tag (@wrap...@endwrap)
}

// Register custom directives
await build({
  entrypoints: ['./src/index.ts', './templates/home.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
  stx: {
    customDirectives: [uppercaseDirective, wrapDirective],
  },
})
```

Then use them in your templates:

```html
<!-- Single-parameter directive -->
<p>@uppercase('hello world')</p>

<!-- Block directive with content and optional parameter -->
@wrap(highlight)
  <p>This content will be wrapped in a div with class "highlight"</p>
@endwrap
```

Custom directives have access to:

- `content`: The content between start and end tags (for block directives)
- `params`: Array of parameters passed to the directive
- `context`: The template data context (all variables)
- `filePath`: The current template file path

#### Variables

Display content with double curly braces:

```html
<h1>{{ title }}</h1>
<p>{{ user.name }}</p>
```

#### Conditionals

Use `@if`, `@elseif`, and `@else` for conditional rendering:

```html
@if (user.isAdmin)
  <div class="admin-panel">Admin content</div>
@elseif (user.isEditor)
  <div class="editor-tools">Editor tools</div>
@else
  <div class="user-view">Regular user view</div>
@endif
```

#### Loops

Iterate over arrays with `@foreach`:

```html
<ul>
  @foreach (items as item)
    <li>{{ item }}</li>
  @endforeach
</ul>
```

Use `@for` for numeric loops:

```html
<ol>
  @for (let i = 1; i <= 5; i++)
    <li>Item {{ i }}</li>
  @endfor
</ol>
```

#### Raw HTML

Output unescaped HTML content:

```html
{!! rawHtmlContent !!}
```

### Internationalization (i18n)

STX supports internationalization to help you build multilingual applications. Translation files are stored in YAML format (JSON also supported) and support nested keys and parameter replacements.

#### Configuration

Configure i18n in your build script:

```js
import stxPlugin from 'bun-plugin-stx'

await build({
  entrypoints: ['./templates/home.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
  stx: {
    i18n: {
      locale: 'en',               // Current locale
      defaultLocale: 'en',        // Fallback locale
      translationsDir: 'translations', // Directory containing translations
      format: 'yaml',             // Format of translation files (yaml, yml, json, or js)
      fallbackToKey: true,        // Use key as fallback when translation not found
      cache: true                 // Cache translations in memory
    }
  }
})
```

#### Translation Files

Create translation files in your translationsDir:

```yaml
# translations/en.yaml
welcome: Welcome to STX
greeting: Hello, :name!
nav:
  home: Home
  about: About
  contact: Contact
```

```yaml
# translations/de.yaml
welcome: Willkommen bei STX
greeting: Hallo, :name!
nav:
  home: Startseite
  about: Über uns
  contact: Kontakt
```

#### Using Translations

STX provides multiple ways to use translations in your templates:

1. **@translate Directive**

   ```html
   <!-- Basic translation -->
   <p>@translate('welcome')</p>

   <!-- With parameters -->
   <p>@translate('greeting', { "name": "John" })</p>

   <!-- Nested keys -->
   <p>@translate('nav.home')</p>

   <!-- With fallback content -->
   <p>@translate('missing.key')Fallback Content@endtranslate</p>
   ```

2. **Filter Syntax**

   ```html
   <!-- Basic translation as filter -->
   <p>{{ 'welcome' | translate }}</p>

   <!-- With parameters -->
   <p>{{ 'greeting' | translate({ "name": "Alice" }) }}</p>

   <!-- Short alias -->
   <p>{{ 'nav.home' | t }}</p>
   ```

Parameters in translations use the `:param` syntax, similar to Laravel:

```yaml
greeting: Hello, :name!
items: You have :count items in your cart.
```

Then in your template:

```html
<p>@translate('greeting', { "name": "John" })</p>
<p>@translate('items', { "count": 5 })</p>
```

## TypeScript Support

STX includes TypeScript declarations for importing .stx files. Make sure your `tsconfig.json` includes the necessary configuration:

```json
{
  "compilerOptions": {
    // ... your other options
    "types": ["bun"]
  },
  "files": ["src/stx.d.ts"],
  "include": ["**/*.ts", "**/*.d.ts", "*.stx", "./**/*.stx"]
}
```

Create a declaration file (`src/stx.d.ts`):

```ts
// Allow importing .stx files
declare module '*.stx';
```

## Example Server

Run a development server with your STX templates:

```ts
// serve.ts
import home from './home.stx'

const server = Bun.serve({
  routes: {
    '/': home,
  },
  development: true,

  fetch(req) {
    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Listening on ${server.url}`)
```

## Testing This Plugin

To test the plugin with the included examples:

1. Build the test file:

```bash
bun run test-build.ts
```

2. Run the test server:

```bash
bun run serve-test.ts
```

3. Open your browser to the displayed URL (typically `http://localhost:3000`).

## How It Works

The plugin works by:

1. Extracting script tags from .stx files
2. Creating an execution context with variables from the script
3. Processing Blade-like directives (@if, @foreach, etc.) into HTML
4. Processing variable tags ({{ var }}) with their values
5. Returning the processed HTML content

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stacksjs/bun-plugin-stx/releases) page for more information on what has changed recently.

## Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

You will always be free to use any of the Stacks OSS software. We would also love to see which parts of the world Stacks ends up in. _Receiving postcards makes us happy—and we will publish them on our website._

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

Many thanks to the following core technologies & people who have contributed to this package:

- [Laravel](https://laravel.com)
- [Anthony Fu](https://github.com/antfu)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/bun-plugin-stx/tree/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: <https://img.shields.io/npm/v/bun-plugin-stx?style=flat-square>
[npm-version-href]: <https://npmjs.com/package/bun-plugin-stx>
[npm-downloads-src]: <https://img.shields.io/npm/dm/bun-plugin-stx?style=flat-square>
[npm-downloads-href]: <https://npmjs.com/package/bun-plugin-stx>
[github-actions-src]: <https://img.shields.io/github/actions/workflow/status/stacksjs/bun-plugin-stx/ci.yml?style=flat-square&branch=main>
[github-actions-href]: <https://github.com/stacksjs/bun-plugin-stx/actions?query=workflow%3Aci>

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/bun-plugin-stx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/bun-plugin-stx -->
