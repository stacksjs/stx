# STX DevTools

A powerful development UI for the STX templating engine.

## Features

- Dashboard with project overview and quick actions
- Template explorer to browse and analyze templates
- Performance monitoring and optimization suggestions
- Configuration management for STX
- Component explorer

## Getting Started

### Installation

The STX DevTools are included as part of the STX package. If you're using STX in your project, you already have access to the DevTools.

```bash
# If you haven't installed STX yet
npm install stx
# or with bun
bun add stx
```

### Running the DevTools UI

You can run the DevTools UI with the following command from your project root:

```bash
# Using npm
npm run stx:devtools

# Using bun
bun run stx:devtools
```

Or run it directly from within the package:

```bash
cd packages/devtools
bun run dev
```

This will start a local server at <http://localhost:3500> where you can access the DevTools UI.

## Development

If you want to modify or extend the DevTools:

1. Clone the repository
2. Install dependencies with `bun install`
3. Start the development server with `bun run dev`
4. Access the UI at <http://localhost:3500>

## Technical Details

The STX DevTools are built using:

- STX Templating Engine (dogfooding our own technology)
- UnoCSS for styling
- Bun for building and serving

## License

Same as STX
