![Social Card of Bun Plugin blade](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

<!-- [![Codecov][codecov-src]][codecov-href] -->

# stx

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
import { build } from "bun";
import stxPlugin from "bun-plugin-stx";

await build({
  entrypoints: ["./src/index.ts", "./templates/home.stx"],
  outdir: "./dist",
  plugins: [stxPlugin],
});
```

## Usage with ESM

### 1. Configure Bun to use the plugin

In your build script or Bun configuration:

```js
// build.js
import { build } from "bun";
import stxPlugin from "bun-plugin-stx";

await build({
  entrypoints: ["./src/index.ts", "./templates/home.stx"],
  outdir: "./dist",
  plugins: [stxPlugin],
});
```

### 2. Import and use .stx files directly

You can import .stx files directly in your ESM code:

```js
// app.js
import homeTemplate from "./templates/home.stx";

// Use the processed HTML content
document.body.innerHTML = homeTemplate;
```

### 3. Use with Bun's server

You can serve .stx files directly with Bun's server:

```js
// server.js
import { serve } from "bun";
import homeTemplate from "./home.stx";

serve({
  port: 3000,
  fetch(req) {
    return new Response(homeTemplate, {
      headers: { "Content-Type": "text/html" },
    });
  },
});
```

Or use as route handlers:

```js
import about from "./about.stx";
// server.js
import home from "./home.stx";

export default {
  port: 3000,
  routes: {
    "/": home,
    "/about": about,
  },
};
```

## stx Template Syntax

`stx` templates use a syntax inspired by Laravel Blade. Templates can contain HTML with special directives for rendering dynamic content.

### Basic Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>stx Example</title>
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

There are two ways to expose data in your `stx` templates:

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
    showDetails: true,
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
    showFooter: true,
  };
</script>
```

### Template Directives

#### Custom Directives

`stx` supports defining your own custom directives for template processing:

```ts
import type { CustomDirective } from "bun-plugin-stx";
// Configure custom directives
import stxPlugin from "bun-plugin-stx";

// Create custom directives
const uppercaseDirective: CustomDirective = {
  name: "uppercase",
  handler: (content, params) => {
    return params[0] ? params[0].toUpperCase() : content.toUpperCase();
  },
  // No hasEndTag needed for single-parameter directives
};

const wrapDirective: CustomDirective = {
  name: "wrap",
  handler: (content, params) => {
    const className = params[0] || "default-wrapper";
    return `<div class="${className}">${content}</div>`;
  },
  hasEndTag: true, // This directive requires an end tag (@wrap...@endwrap)
};

// Register custom directives
await build({
  entrypoints: ["./src/index.ts", "./templates/home.stx"],
  outdir: "./dist",
  plugins: [stxPlugin],
  stx: {
    customDirectives: [uppercaseDirective, wrapDirective],
  },
});
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

#### Server-Side JavaScript and TypeScript

`stx` allows you to execute JavaScript or TypeScript code directly on the server during template processing. This code runs only on the server and is removed from the final HTML output.

##### JavaScript (@js)

Use `@js` to execute JavaScript code on the server:

```html
<script>
  module.exports = {
    initialValue: 5,
  };
</script>

<p>Before: {{ result }}</p>

@js // This code runs on the server and is not included in the output HTML
global.result = initialValue * 10; // You can access Node.js APIs here if
(typeof process !== 'undefined') { global.nodeVersion = process.version; }
@endjs

<p>After: {{ result }}</p>
<p>Node.js Version: {{ nodeVersion }}</p>
```

##### TypeScript (@ts)

Use `@ts` to execute TypeScript code on the server:

```html
<script>
  module.exports = {
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  };
</script>

<h1>User List</h1>

@ts // Define TypeScript interfaces interface User { id: number; name: string;
displayName?: string; } // Process data with TypeScript function
processUsers(users: User[]): User[] { return users.map(user => ({ ...user,
displayName: `User ${user.id}: ${user.name}` })); } // Store the processed data
in the context global.processedUsers = processUsers(users); @endts

<ul>
  @foreach (processedUsers as user)
  <li>{{ user.displayName }}</li>
  @endforeach
</ul>
```

#### Markdown Support

`stx` supports rendering Markdown content directly in your templates using the `@markdown` directive:

````html
<div class="content">
  @markdown # Heading 1 This is a paragraph with **bold text** and *italic
  text*. - List item 1 - List item 2 - List item 3 ```js // Code block function
  hello() { console.log('Hello world'); }
</div>
````

@endmarkdown

</div>
```

You can also pass options to the markdown renderer:

```html
<!-- Enable line breaks (converts single line breaks to <br>) -->
@markdown(breaks) Line 1 Line 2 @endmarkdown

<!-- Disable GitHub Flavored Markdown -->
@markdown(no-gfm) Content here @endmarkdown
```

### Internationalization (i18n)

`stx` supports internationalization to help you build multilingual applications. Translation files are stored in YAML format (JSON also supported) and support nested keys and parameter replacements.

#### Configuration

Configure i18n in your build script:

```js
import stxPlugin from "bun-plugin-stx";

await build({
  entrypoints: ["./templates/home.stx"],
  outdir: "./dist",
  plugins: [stxPlugin],
  stx: {
    i18n: {
      locale: "en", // Current locale
      defaultLocale: "en", // Fallback locale
      translationsDir: "translations", // Directory containing translations
      format: "yaml", // Format of translation files (yaml, yml, json, or js)
      fallbackToKey: true, // Use key as fallback when translation not found
      cache: true, // Cache translations in memory
    },
  },
});
```

#### Translation Files

Create translation files in your translationsDir:

```yaml
# translations/en.yaml
welcome: Welcome to `stx`
greeting: Hello, :name!
nav:
  home: Home
  about: About
  contact: Contact
```

```yaml
# translations/de.yaml
welcome: Willkommen bei `stx`
greeting: Hallo, :name!
nav:
  home: Startseite
  about: Über uns
  contact: Kontakt
```

#### Using Translations

`stx` provides multiple ways to use translations in your templates:

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

### Web Components Integration

`stx` now provides seamless integration with Web Components, allowing you to automatically build and use custom elements from your `stx` components.

#### Configuration

Enable web component integration in your build configuration:

```ts
import { build } from "bun";
import stxPlugin from "bun-plugin-stx";

await build({
  entrypoints: ["./templates/home.stx"],
  outdir: "./dist",
  plugins: [stxPlugin],
  config: {
    stx: {
      webComponents: {
        enabled: true,
        outputDir: "dist/web-components",
        components: [
          {
            name: "MyButton", // Class name for the component
            tag: "my-button", // HTML tag name (must contain a hyphen)
            file: "components/button.stx", // Path to the stx component
            attributes: ["type", "text", "disabled"], // Observed attributes
          },
          {
            name: "MyCard",
            tag: "my-card",
            file: "components/card.stx",
            shadowDOM: true, // Use Shadow DOM (default: true)
            template: true, // Use template element (default: true)
            styleSource: "styles/card.css", // Optional external stylesheet
            attributes: ["title", "footer"],
          },
        ],
      },
    },
  },
});
```

#### Using Web Components in Templates

Include web components in your templates with the `@webcomponent` directive:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Web Component Demo</title>

    <!-- Include the web components -->
    @webcomponent('my-button') @webcomponent('my-card')
  </head>
  <body>
    <h1>Web Components Demo</h1>

    <!-- Use the custom elements -->
    <my-button type="primary" text="Click Me"></my-button>

    <my-card title="Card Title" footer="Card Footer">
      This is the card content
    </my-card>
  </body>
</html>
```

#### Source `stx` Components

The original `stx` components can be simple:

```html
<!-- components/button.stx -->
<button class="btn {{ type ? 'btn-' + type : '' }}" {{ disabled ? 'disabled' : '' }}>
  {{ text || slot }}
</button>

<!-- components/card.stx -->
<div class="card">
  <div class="card-header">{{ title }}</div>
  <div class="card-body">
    {{ slot }}
  </div>
  <div class="card-footer">{{ footer }}</div>
</div>
```

#### Advanced Options

Web components support several configuration options:

- `shadowDOM`: Enable/disable Shadow DOM (default: true)
- `template`: Use template element for better performance (default: true)
- `extends`: Extend a specific HTML element class
- `styleSource`: Path to external stylesheet
- `attributes`: List of attributes to observe for changes

## TypeScript Support

`stx` includes TypeScript declarations for importing .stx files. Make sure your `tsconfig.json` includes the necessary configuration:

```jsonc
{
  "compilerOptions": {
    // ... your other options
    "types": ["bun"],
  },
  "files": ["src/stx.d.ts"],
  "include": ["**/*.ts", "**/*.d.ts", "*.stx", "./**/*.stx"],
}
```

Create a declaration file (`src/stx.d.ts`):

```ts
// Allow importing .stx files
declare module "*.stx";
```

## Example Server

Run a development server with your `stx` templates:

```ts
// serve.ts
import home from "./home.stx";

const server = Bun.serve({
  routes: {
    "/": home,
  },
  development: true,

  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
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

## Documentation Generation

`stx` can automatically generate documentation for your components, templates, and directives. This helps developers understand your UI components and how to use them.

### Command Line

Generate documentation using the CLI:

```bash
# Generate markdown documentation (default)
stx docs

# Generate HTML documentation
stx docs --format html

# Generate JSON documentation
stx docs --format json

# Specify output directory
stx docs --output my-docs

# Only generate specific sections
stx docs --no-components
stx docs --no-templates
stx docs --no-directives

# Specify custom directories
stx docs --components-dir src/components --templates-dir src/views
```

### Configuration

You can configure documentation generation in your `stx.config.ts` file:

```ts
export default {
  // ...other config options
  docs: {
    enabled: true,
    outputDir: "docs",
    format: "markdown", // 'markdown', 'html', or 'json'
    components: true,
    templates: true,
    directives: true,
    extraContent:
      "## Getting Started\n\nThis is additional content to include in the documentation.",
  },
};
```

### Component Documentation

`stx` can extract component metadata from JSDoc comments in your component files:

```html
<!--
  Alert component for displaying messages to the user.
  This component supports different types (success, warning, error).
-->
<div class="alert alert-{{ type }}">
  <div class="alert-title">{{ title }}</div>
  <div class="alert-body">{{ message }}</div>
</div>

<script>
  /**
   * The type of alert to display
   * @type {string}
   * @default "info"
   */
  const type = module.exports.type || "info";

  /**
   * The alert title
   * @type {string}
   * @required
   */
  const title = module.exports.title;

  /**
   * The alert message
   * @type {string}
   */
  const message = module.exports.message || "";

  // Prepare the component's context
  module.exports = {
    type,
    title,
    message,
  };
</script>
```

This component will be documented with all its properties, types, default values, and requirements.

### Web Component Documentation

`stx` will automatically document web components defined in your configuration:

```ts
export default {
  // ... other config
  webComponents: {
    enabled: true,
    outputDir: "dist/web-components",
    components: [
      {
        name: "MyButton",
        tag: "my-button",
        file: "components/button.stx",
        attributes: ["type", "text", "disabled"],
        description: "A customizable button component",
      },
    ],
  },
};
```

The documentation will include:

- Component name and description
- Custom element tag
- Observed attributes
- Usage examples

This makes it easy for developers to understand how to use your web components in their HTML.

## Other Familiar Features

`stx` includes several convenient features inspired by Laravel's Blade templating engine:

### View Composers

Register callbacks to be executed when specific views are rendered:

```typescript
import { composer, composerPattern } from "stx";

// Register for specific view
composer("dashboard", (context) => {
  context.menuItems = ["Home", "Settings", "Profile"];
});

// Register for any view matching a pattern
composerPattern(/user/, (context) => {
  context.section = "User Management";
});
```

### CSRF Protection

Built-in CSRF token generation and verification:

```html
<form method="POST" action="/submit">
  @csrf
  <!-- Creates a hidden input with the CSRF token -->

  <!-- Custom field name -->
  @csrf("my_token")
</form>
```

### Form Method Spoofing

Support for RESTful routes with HTML forms:

```html
<form method="POST" action="/users/1">
  @method('PUT')
  <!-- Creates a hidden input for PUT method -->

  <!-- Custom field name -->
  @method('DELETE', 'http_method')
</form>
```

### Named Routes

Generate URLs based on named routes:

```typescript
import { defineRoute, route } from 'stx';

// Define routes
defineRoute('users.profile', '/users/:id/profile');
defineRoute('dashboard', '/dashboard');

// In templates
<a href="@route('users.profile', {id: 1})">User Profile</a>
<a href="@route('dashboard')">Dashboard</a>

// Generate URLs in server code
const url = route('users.profile', {id: 1}); // => '/users/1/profile'
```

### Environment-Specific Directives

Conditionally render content based on environment:

```html
@production
<script src="/js/analytics.min.js"></script>
@else
<!-- Development tools -->
<script src="/js/debug.js"></script>
@endproduction @development
<div class="dev-banner">Development Mode</div>
@enddevelopment @env('staging')
<div class="staging-notice">Staging Environment</div>
@endenv
```

## Icon Components

stx includes a powerful icon component system powered by [Iconify](https://iconify.design/), giving you access to over 200,000 icons from 150+ icon sets as ready-to-use components.

### Available Icon Collections

All icons are available as PascalCase components. For example, the Material Symbols collection includes icons like:

```html
<DraftsIcon size="24" />
<HomeIcon size="24" />
<SettingsIcon size="24" />
<SearchIcon size="24" />
```

Browse all available collections:

- [Material Symbols](./docs/collections/iconify-material-symbols.md) (2,500+ icons)
- [Heroicons](./docs/collections/iconify-heroicons.md) (300+ icons)
- [Lucide](./docs/collections/iconify-lucide.md) (1,000+ icons)
- [And 150+ more...](./docs/collections/)

### Usage

Icon components work seamlessly in your `.stx` templates:

```html
<!-- Basic usage -->
<HomeIcon />

<!-- With size -->
<HomeIcon size="24" />
<HomeIcon height="1em" />

<!-- With color -->
<HomeIcon size="24" color="red" />
<HomeIcon size="24" color="#4a90e2" />

<!-- With transformations -->
<ArrowRightIcon hFlip="true" />
<ArrowDownIcon rotate="1" />  <!-- 90° rotation -->

<!-- With CSS classes -->
<SettingsIcon size="20" className="nav-icon" />

<!-- Inline in text -->
<p>Welcome <WavingHandIcon height="1em" /> to our app!</p>
```

### Component Props

All icon components support these props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `string \| number` | `24` | Sets both width and height |
| `width` | `string \| number` | - | Icon width |
| `height` | `string \| number` | - | Icon height |
| `color` | `string` | `currentColor` | Icon color (hex, rgb, or CSS color name) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 1 \| 2 \| 3 \| number` | `0` | Rotation (0-3 = multiples of 90°, or degrees) |
| `className` | `string` | - | CSS classes to apply |
| `style` | `string` | - | Inline styles |

### Generating Icon Packages

To generate icon packages from any Iconify collection:

```bash
# List available collections
bun stx iconify list

# Generate a specific collection
bun stx iconify generate material-symbols
bun stx iconify generate heroicons
bun stx iconify generate lucide

# Generate specific icons only
bun stx iconify generate lucide --icons home,settings,user
```

This creates a package with:

- TypeScript icon data files (`.ts`)
- stx component files (`.stx`)
- Full TypeScript types
- Component documentation

### Example: Navigation Menu

```html
<nav>
  <a href="/"><HomeIcon size="20" className="nav-icon" /> Home</a>
  <a href="/about"><InfoIcon size="20" className="nav-icon" /> About</a>
  <a href="/contact"><MailIcon size="20" className="nav-icon" /> Contact</a>
  <a href="/settings"><SettingsIcon size="20" className="nav-icon" /> Settings</a>
</nav>

<style>
  .nav-icon {
    vertical-align: middle;
    margin-right: 0.5rem;
  }
</style>
```

### Example: Status Indicators

```html
<div class="status">
  <CheckCircleIcon size="16" color="green" /> Success
</div>
<div class="status">
  <AlertCircleIcon size="16" color="orange" /> Warning
</div>
<div class="status">
  <XCircleIcon size="16" color="red" /> Error
</div>
```

For more details, see the [icon collections documentation](./docs/collections/).

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stacksjs/stx/releases) page for more information on what has changed recently.

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

- [Laravel Blade](https://laravel.com) - for the initial inspiration
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/stx/tree/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/stx?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/stx
[npm-downloads-src]: https://img.shields.io/npm/dm/@stacksjs/stx?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@stacksjs/stx
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/stx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/stx -->
