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

### Build STX Files

```bash
stx build [entrypoints...] [options]
```

Options:
- `--outdir <dir>` - Output directory for bundled files (default: "dist")
- `--outfile <file>` - Output file name (for single entrypoint)
- `--target <target>` - Target environment: browser, bun, or node (default: "browser")
- `--format <format>` - Output format: esm, cjs, or iife (default: "esm")
- `--minify` - Enable minification
- `--no-minify` - Disable minification
- `--sourcemap <type>` - Sourcemap type: none, linked, inline, or external (default: "none")
- `--splitting` - Enable code splitting
- `--no-splitting` - Disable code splitting

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

### Create a New STX File

```bash
# Create a new file (defaults to index.stx)
stx init [file]

# 'new' is an alias for 'init'
stx new [file]
```

Options:
- `--force` - Overwrite existing file
- `--template <file>` - Path to a template file to use as a base

Examples:
```bash
# Create index.stx in current directory
stx init

# Create a page.stx file
stx init page.stx

# Create a component file (creates directories if needed)
stx new components/button.stx

# Create a file using an existing file as a template
stx new page.stx --template examples/demo.stx
```

### Run Template Tests

```bash
stx test [patterns...] [options]
```

Options:
- `--watch` - Watch for changes and rerun tests
- `--filter <pattern>` - Only run tests matching the given pattern
- `--reporter <reporter>` - Test reporter to use: default, json, verbose (default: "default")
- `--timeout <ms>` - Test timeout in milliseconds (default: 5000)
- `--coverage` - Enable code coverage

### Benchmark Templates

```bash
stx benchmark [templates...] [options]
```

Options:
- `--iterations <n>` - Number of iterations to run (default: 1000)
- `--compare` - Compare with other template engines
- `--output <file>` - Write benchmark results to a file

### Lint Templates

```bash
stx lint [files...] [options]
```

Options:
- `--fix` - Automatically fix problems when possible
- `--config <file>` - Path to lint config file
- `--ignore <patterns>` - Comma-separated list of patterns to ignore
- `--output <file>` - Write lint results to a file

### Format Templates

```bash
stx format [files...] [options]
```

Options:
- `--write` - Write formatted files to disk (default: false, only checks)
- `--config <file>` - Path to formatting config file
- `--ignore <patterns>` - Comma-separated list of patterns to ignore
- `--check` - Check if files are formatted without writing changes

### Generate Files

```bash
stx generate <type> [name] [options]
```

Options:
- `--output <dir>` - Output directory
- `--force` - Overwrite existing files
- `--with <params>` - Parameters to pass to the generator (JSON string)

### Import from Other Template Formats

```bash
stx import <source> [output] [options]
```

Options:
- `--from <format>` - Source format: blade, handlebars, ejs, pug (default: "blade")
- `--force` - Overwrite existing files

### Validate Templates

```bash
stx validate [files...] [options]
```

Options:
- `--schema <file>` - JSON Schema file to validate against
- `--ignore <patterns>` - Comma-separated list of patterns to ignore
- `--output <file>` - Write validation results to a file

### Deploy Templates

```bash
stx deploy [files...] [options]
```

Options:
- `--platform <platform>` - Deployment platform: vercel, netlify, github, custom (default: "vercel")
- `--config <file>` - Path to deployment config file
- `--env <file>` - Path to environment file
- `--production` - Deploy to production environment

### Analyze Templates

```bash
stx analyze [files...] [options]
```

Options:
- `--depth <n>` - Maximum depth for dependency analysis (default: 10)
- `--output <file>` - Write analysis to a file
- `--visualize` - Generate visualization of dependencies

### Version and System Information

```bash
# Show STX version
stx version

# Show system info and config
stx info

# List available syntax highlighting themes
stx themes
```

## Examples

You can find example templates in the `examples/` directory:

```bash
# Start a dev server for the Hello World example
stx examples/hello-world.stx

# Generate a random color palette
stx examples/colors.stx

# Create a new STX file
stx new page.stx

# Create a component file
stx new components/button.stx
```

## Configuration

The STX CLI uses your project's STX configuration by default. You can customize the behavior by creating a `stx.config.js` or `stx.config.ts` file in your project root.

## Exit Codes

- `0` - Success
- `1` - Error (build failure, validation error, etc.)