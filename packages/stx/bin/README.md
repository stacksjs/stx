# STX CLI

The STX Command Line Interface (CLI) provides tools for working with STX templates, including a built-in development server, documentation generation, and accessibility scanning.

## Quick Start

The easiest way to start developing with STX is to use the built-in dev server:

```bash
# Start a dev server for an STX file
stx my-template.stx
```

This command automatically starts a development server with live reloading enabled.

## Available Commands

### Development Server

```bash
# Direct file mode (recommended)
stx path/to/template.stx [options]

# Explicit command mode
stx dev path/to/template.stx [options]
```

Options:
- `--port <number>` - Specify the port for the dev server (default: 3000)
- `--no-watch` - Disable file watching and auto-reload

### Documentation Generation

```bash
stx docs [options]
```

Options:
- `--output <dir>` - Output directory for documentation (default: "docs")
- `--format <format>` - Documentation format: markdown, html, or json (default: "markdown")
- `--components-dir <dir>` - Components directory (default: "components")
- `--templates-dir <dir>` - Templates directory (default: ".")
- `--no-components` - Disable components documentation
- `--no-templates` - Disable templates documentation
- `--no-directives` - Disable directives documentation
- `--extra-content <content>` - Extra content to include in documentation

### Accessibility Scanning

```bash
stx a11y [directory] [options]
```

Options:
- `--no-recursive` - Disable recursive scanning of directories
- `--ignore <paths>` - Comma-separated paths to ignore
- `--json` - Output results as JSON
- `--output <file>` - Write results to a file instead of stdout
- `--fix` - Automatically fix common accessibility issues (experimental)

### Version Information

```bash
stx version
```

Displays the current version of STX.

## Examples

You can find example templates in the `examples/` directory:

```bash
# Start a dev server for the Hello World example
stx examples/hello-world.stx

# Generate a random color palette
stx examples/colors.stx
```

## Configuration

The STX CLI uses your project's STX configuration by default. You can customize the behavior by creating a `stx.config.js` or `stx.config.ts` file in your project root.

## Exit Codes

- `0` - Success
- `1` - Error (build failure, validation error, etc.)