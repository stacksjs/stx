# Web Components with bun-plugin-stx

This example demonstrates how to use the web components integration in bun-plugin-stx.

## Project Setup

1. Install bun-plugin-stx

```bash
bun add bun-plugin-stx
```

2. Create your stx components

```html
<!-- components/button.stx -->
<button class="btn {{ type ? 'btn-' + type : '' }}" {{ disabled ? 'disabled' : '' }}>
  <span class="btn-icon">{{ icon || '' }}</span>
  <span class="btn-text">{{ text || slot }}</span>
</button>

<!-- components/card.stx -->
<div class="card {{ cardClass }}">
  <div class="card-header">{{ title }}</div>
  <div class="card-body">
    {{ content || slot }}
  </div>
  <div class="card-footer">{{ footer }}</div>
</div>
```

3. Configure your build

```ts
// build.ts
import { build } from 'bun'
import stxPlugin from 'bun-plugin-stx'

await build({
  entrypoints: ['./src/index.ts', './templates/index.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
  config: {
    stx: {
      webComponents: {
        enabled: true,
        outputDir: 'dist/web-components',
        components: [
          {
            name: 'MyButton',
            tag: 'my-button',
            file: 'components/button.stx',
            attributes: ['type', 'text', 'disabled', 'icon']
          },
          {
            name: 'MyCard',
            tag: 'my-card',
            file: 'components/card.stx',
            attributes: ['title', 'footer', 'cardClass']
          }
        ]
      }
    }
  }
})
```

4. Use web components in your templates

```html
<!-- templates/index.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>Web Component Demo</title>

  <!-- Include the web components -->
  @webcomponent('my-button')
  @webcomponent('my-card')

  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .card-header {
      background: #f5f5f5;
      padding: 1rem;
      font-weight: bold;
    }

    .card-body {
      padding: 1rem;
    }

    .card-footer {
      border-top: 1px solid #ddd;
      padding: 1rem;
      font-size: 0.9rem;
      color: #666;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #3490dc;
      color: white;
    }

    .btn-success {
      background: #38c172;
      color: white;
    }

    .btn-danger {
      background: #e3342f;
      color: white;
    }
  </style>
</head>
<body>
  <h1>Web Components Demo</h1>

  <my-button type="primary" text="Click Me" icon="👍"></my-button>
  <my-button type="success" text="Save"></my-button>
  <my-button type="danger" text="Delete" disabled="true"></my-button>

  <my-card title="Card Title" footer="Last updated: Today">
    This is the card content
  </my-card>

  <my-card title="Features" footer="Web Components Documentation" cardClass="feature-card">
    <ul>
      <li>Easy to use</li>
      <li>Reusable components</li>
      <li>Shadow DOM isolation</li>
    </ul>
  </my-card>
</body>
</html>
```

## Running the Example

1. Run the build

```bash
bun build.ts
```

2. Serve the files

```bash
bun --hot serve ./dist
```

3. Open in your browser

```
http://localhost:3000
```

## Customizing Web Components

You can customize web components with various options:

```ts
{
  name: 'MyComponent',
  tag: 'my-component',
  file: 'path/to/component.stx',
  shadowDOM: false,           // Disable Shadow DOM
  template: true,             // Use template element
  extends: 'HTMLButtonElement', // Extend a specific element
  styleSource: 'styles.css',  // External stylesheet
  attributes: ['prop1', 'prop2'] // Observed attributes
}
```
