# Bun Plugin stx - Serve Examples

This directory contains examples demonstrating how to use `bun-plugin-stx` to serve `.stx` files with Bun.

## Examples

### Single File Server (`serve-single.ts`)

Demonstrates how to:
- Build a single `.stx` file using the plugin
- Serve the compiled HTML with Bun's built-in server
- Access the rendered content at runtime

**Usage:**
```bash
cd packages/bun-plugin
bun test/examples/serve-single.ts
```

Then open http://localhost:3456 in your browser.

### Multiple Files Server (`serve-multiple.ts`)

Demonstrates how to:
- Build multiple `.stx` files in one build
- Set up routing for multiple pages
- Create a simple 404 handler with navigation

**Usage:**
```bash
cd packages/bun-plugin
bun test/examples/serve-multiple.ts
```

Available routes:
- http://localhost:3456/ (Home - basic.stx)
- http://localhost:3456/about (About - about.stx)

## Test Fixtures

The `fixtures/` directory contains sample `.stx` files used in the examples:

- **basic.stx**: Demonstrates basic stx features including:
  - Variable interpolation (`{{ variable }}`)
  - Loops (`@foreach`)
  - Conditionals (`@if`)
  - ESM exports in script tags

- **about.stx**: Shows how to render structured data like team member lists

## Running Tests

To run the automated tests:

```bash
cd packages/bun-plugin
bun test test/serve.test.ts
```

The tests verify:
- ✅ Single file building
- ✅ Multiple file building
- ✅ Directive processing (@foreach, @if, etc.)
- ✅ Variable interpolation
- ✅ SEO meta tag injection

## Plugin Features Demonstrated

1. **Template Processing**: The plugin processes `.stx` files and compiles them to HTML
2. **Directive Support**: Full support for Blade-like directives
3. **ESM Exports**: Use modern ESM exports in script tags
4. **SEO Enhancement**: Automatic injection of SEO meta tags
5. **Hot Module Replacement**: Works seamlessly with Bun's HMR (in dev mode)

## How It Works

1. The plugin registers an `onLoad` handler for `.stx` files
2. When a `.stx` file is encountered, it:
   - Extracts the `<script>` section and executes it to get variables
   - Processes template directives (@if, @foreach, etc.)
   - Replaces variable placeholders ({{ var }})
   - Returns the compiled HTML
3. Bun bundles the result with the configured loader (`html`)
