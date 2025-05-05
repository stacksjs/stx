# STX Examples

This directory contains examples for the STX templating engine.

## Hello World Example

To quickly see STX in action and test the new dev server feature, you can run the "Hello World" example using the following command:

```bash
# Run directly with the file name
stx examples/hello-world.stx

# Or use the explicit dev command
stx dev examples/hello-world.stx
```

This will start a development server on port 3000 (by default) and open the Hello World example in your browser.

### Options

You can use the following options with the dev server:

```bash
# Change the port
stx examples/hello-world.stx --port 8080

# Disable file watching
stx examples/hello-world.stx --no-watch
```

### Features

The Hello World example demonstrates several STX features:

1. Variable interpolation with `{{ ... }}` syntax
2. Loops with `@for` directives
3. Conditional classes with ternary expressions
4. Inline JavaScript in the `<script>` tag
5. Interactive elements with event listeners

## Testing Live Reloading

To test the live reloading feature:

1. Start the dev server with `stx examples/hello-world.stx`
2. Open the example in your browser at http://localhost:3000
3. Edit the `examples/hello-world.stx` file, for example:
   - Change the `name` variable from 'World' to your name
   - Add a new color to the `colors` array
   - Modify the HTML structure or styles
4. Save the file and watch the browser automatically reload with your changes

## Using as a Template

You can use this example as a starting point for your own STX templates. Copy the file and modify it to suit your needs:

```bash
cp examples/hello-world.stx my-project/my-template.stx
stx my-project/my-template.stx
```