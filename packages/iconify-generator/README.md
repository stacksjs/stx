# @stacksjs/iconify-generator

Generator for creating Iconify icon packages for stx.

## Installation

This package is typically used through the stx CLI and doesn't need to be installed separately.

## Usage via stx CLI

### List Available Icon Collections

```bash
stx iconify list
```

### Generate a Complete Icon Collection

```bash
stx iconify generate lucide
```

### Generate Specific Icons

```bash
stx iconify generate lucide --icons home,settings,user,heart,star
```

### Custom Output Directory

```bash
stx iconify generate mdi --output ./my-packages
```

## Direct Usage

You can also use the generator programmatically:

```typescript
import { fetchCollections, generatePackage } from '@stacksjs/iconify-generator'

// List all available collections
const collections = await fetchCollections()
console.log(Object.keys(collections))

// Generate a package
await generatePackage(
  'lucide',                           // Collection prefix
  './packages',                        // Output directory
  ['home', 'settings', 'user']        // Optional: specific icons
)
```

## Generated Package Structure

Each generated package includes:

- `src/` - TypeScript source files for each icon
- `package.json` - Package configuration
- `build.ts` - Build script
- `README.md` - Usage documentation

## Building Generated Packages

After generating a package:

```bash
cd packages/iconify-{collection}
bun install
bun run build
```

## Features

- Fetches icon data from Iconify API
- Generates TypeScript icon components
- Creates fully typed packages
- Supports tree-shaking
- Customizable icon selection
- Automatic package.json and README generation

## API

### `fetchCollections(): Promise<Record<string, IconifyCollection>>`

Fetches all available icon collections from Iconify.

### `fetchCollectionIcons(prefix: string, icons?: string[]): Promise<IconifyCollectionData>`

Fetches icons from a specific collection.

### `generatePackage(prefix: string, outputDir: string, icons?: string[]): Promise<void>`

Generates a complete icon package.

## License

MIT
