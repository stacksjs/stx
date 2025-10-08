/* eslint-disable no-console */
import type { IconData } from '@stacksjs/iconify-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface IconifyCollection {
  prefix: string
  name: string
  total: number
  author?: {
    name: string
    url?: string
  }
  license?: {
    title: string
    spdx: string
    url?: string
  }
  height?: number
  category?: string
  palette?: boolean
}

export interface IconifyIconData {
  body: string
  width?: number
  height?: number
  left?: number
  top?: number
  rotate?: number
  hFlip?: boolean
  vFlip?: boolean
}

export interface IconifyCollectionData {
  prefix: string
  lastModified: number
  icons: Record<string, IconifyIconData>
  aliases?: Record<string, {
    parent: string
    hFlip?: boolean
    vFlip?: boolean
    rotate?: number
  }>
  width?: number
  height?: number
}

const ICONIFY_API = 'https://api.iconify.design'

/**
 * Fetch available icon collections from Iconify
 */
export async function fetchCollections(): Promise<Record<string, IconifyCollection>> {
  const response = await fetch(`${ICONIFY_API}/collections`)
  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Fetch icons from a specific collection
 */
export async function fetchCollectionIcons(
  prefix: string,
  icons?: string[],
): Promise<IconifyCollectionData> {
  // Try to load from @iconify/json package first
  try {
    const iconifyJsonPath = require.resolve('@iconify/json')
    // The resolve gives us the main module path, get the package directory
    const basePath = `${iconifyJsonPath.substring(0, iconifyJsonPath.lastIndexOf('/node_modules/@iconify/json/'))}/node_modules/@iconify/json`
    const jsonPath = `${basePath}/json/${prefix}.json`

    const file = Bun.file(jsonPath)
    if (await file.exists()) {
      const data: IconifyCollectionData = await file.json()

      // If specific icons are requested, filter them
      if (icons && icons.length > 0) {
        const filteredIcons: Record<string, IconifyIconData> = {}
        for (const iconName of icons) {
          if (data.icons[iconName]) {
            filteredIcons[iconName] = data.icons[iconName]
          }
        }
        return {
          ...data,
          icons: filteredIcons,
        }
      }

      return data
    }
  }
  catch {
    // Fall through to API if local file not found
  }

  // Fallback to API (only works for specific icons, not full collections)
  const url = icons && icons.length > 0
    ? `${ICONIFY_API}/${prefix}.json?icons=${icons.join(',')}`
    : `${ICONIFY_API}/${prefix}.json`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch icons for ${prefix}: ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Convert Iconify icon data to our IconData format
 */
export function convertIconData(data: IconifyIconData, defaultWidth = 24, defaultHeight = 24): IconData {
  return {
    body: data.body,
    width: data.width || defaultWidth,
    height: data.height || defaultHeight,
    viewBox: `0 0 ${data.width || defaultWidth} ${data.height || defaultHeight}`,
  }
}

/**
 * Generate TypeScript icon component file
 */
export function generateIconComponent(
  name: string,
  iconData: IconData,
  prefix: string,
): string {
  const camelCaseName = toCamelCase(name)
  const componentName = `${camelCaseName.charAt(0).toUpperCase()}${camelCaseName.slice(1)}Icon`

  return `import type { IconData, IconProps } from '@stacksjs/iconify-core'
import { renderIcon } from '@stacksjs/iconify-core'

export const ${camelCaseName}: IconData = ${JSON.stringify(iconData, null, 2)}

/**
 * ${componentName} - Icon component
 *
 * @example
 * \`\`\`typescript
 * import { ${componentName} } from '@stacksjs/iconify-${prefix}'
 * const icon = ${componentName}({ size: 24, color: 'currentColor' })
 * \`\`\`
 */
export function ${componentName}(props?: IconProps): string {
  return renderIcon(${camelCaseName}, props)
}

export default ${camelCaseName}
`
}

/**
 * Generate index file for a collection
 */
export function generateIndexFile(iconNames: string[]): string {
  const dataExports = iconNames.map((name) => {
    const camelCaseName = toCamelCase(name)
    return `export { default as ${camelCaseName} } from './${name}.js'`
  }).join('\n')

  const componentExports = iconNames.map((name) => {
    const camelCaseName = toCamelCase(name)
    const componentName = `${camelCaseName.charAt(0).toUpperCase()}${camelCaseName.slice(1)}Icon`
    return `export { ${componentName} } from './${name}.js'`
  }).join('\n')

  return `// Icon data exports
${dataExports}

// Icon component exports
${componentExports}

export * from './types.js'
`
}

/**
 * Generate types file
 */
export function generateTypesFile(prefix: string): string {
  return `import type { IconData, IconProps } from '@stacksjs/iconify-core'

export type { IconData, IconProps }

export type ${toPascalCase(prefix)}Icon = IconData
`
}

/**
 * Generate package.json for a collection
 */
export function generatePackageJson(
  prefix: string,
  collectionInfo: IconifyCollection,
  iconCount: number,
): string {
  const packageJson = {
    name: `@stacksjs/iconify-${prefix}`,
    type: 'module',
    version: '0.0.1',
    description: `${collectionInfo.name} icons for stx from Iconify`,
    author: collectionInfo.author?.name || 'Iconify',
    license: collectionInfo.license?.spdx || 'MIT',
    repository: {
      type: 'git',
      url: 'https://github.com/stacksjs/stx.git',
      directory: `packages/iconify-${prefix}`,
    },
    keywords: [
      'iconify',
      'icons',
      'svg',
      prefix,
      collectionInfo.name,
      'stx',
    ],
    sideEffects: false,
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
      './*': './dist/*',
    },
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    files: [
      'dist',
    ],
    scripts: {
      build: 'bun build.ts',
    },
    dependencies: {
      '@stacksjs/iconify-core': 'workspace:*',
    },
  }

  return JSON.stringify(packageJson, null, 2)
}

/**
 * Generate build.ts file for a collection
 */
export function generateBuildFile(prefix: string): string {
  return `import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'bun-plugin-dtsx'

const __dirname = dirname(fileURLToPath(import.meta.url))

await Bun.build({
  entrypoints: [join(__dirname, 'src/index.ts')],
  outdir: join(__dirname, 'dist'),
  target: 'bun',
  format: 'esm',
  plugins: [dts()],
  minify: false,
  sourcemap: 'external',
  splitting: true,
})

console.log('✓ Built @stacksjs/iconify-${prefix}')
`
}

/**
 * Generate README for a collection
 */
export function generateReadme(
  prefix: string,
  collectionInfo: IconifyCollection,
  iconCount: number,
): string {
  return `# @stacksjs/iconify-${prefix}

${collectionInfo.name} icons for stx from Iconify.

## Installation

\`\`\`bash
bun add @stacksjs/iconify-${prefix}
\`\`\`

## Usage

### In stx templates

\`\`\`html
<script>
  import { home } from '@stacksjs/iconify-${prefix}'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
\`\`\`

### In TypeScript/JavaScript

\`\`\`typescript
import { home, account, settings } from '@stacksjs/iconify-${prefix}'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
\`\`\`

## Available Icons

This package contains ${iconCount} icons from ${collectionInfo.name}.

## License

${collectionInfo.license?.title || 'MIT'}

${collectionInfo.license?.url ? `License: ${collectionInfo.license.url}` : ''}

## Credits

- Icons: ${collectionInfo.author?.name || 'Iconify'}${collectionInfo.author?.url ? ` (${collectionInfo.author.url})` : ''}
- Iconify: https://iconify.design/
`
}

/**
 * Generate documentation file for a collection
 */
export function generateDocumentation(
  prefix: string,
  collectionInfo: IconifyCollection,
  iconNames: string[],
): string {
  const iconCount = iconNames.length
  const exampleIcons = iconNames.slice(0, 5).map(toCamelCase)
  const exampleComponents = exampleIcons.map(name => `${name.charAt(0).toUpperCase()}${name.slice(1)}Icon`)

  // Generate full icon list
  const allIconsList = iconNames.map(name => {
    const camelName = toCamelCase(name)
    return `- \`${camelName}\``
  }).join('\n')

  return `# ${collectionInfo.name}

> ${collectionInfo.name} icons for stx from Iconify

## Overview

This package provides access to ${iconCount} icons from the ${collectionInfo.name} collection through the stx iconify integration.

**Collection ID:** \`${prefix}\`
**Total Icons:** ${iconCount}
${collectionInfo.author?.name ? `**Author:** ${collectionInfo.author.name}${collectionInfo.author.url ? ` ([Website](${collectionInfo.author.url}))` : ''}` : ''}
${collectionInfo.license?.title ? `**License:** ${collectionInfo.license.title}${collectionInfo.license.url ? ` ([Details](${collectionInfo.license.url}))` : ''}` : ''}
${collectionInfo.category ? `**Category:** ${collectionInfo.category}` : ''}
${collectionInfo.palette !== undefined ? `**Palette:** ${collectionInfo.palette ? 'Yes (color icons)' : 'No (monotone icons)'}` : ''}

## Installation

\`\`\`bash
bun add @stacksjs/iconify-${prefix}
\`\`\`

## Quick Start

### Component Style (Recommended)

Icons are available as component functions that accept props:

\`\`\`typescript
import { ${exampleComponents.slice(0, 3).join(', ')} } from '@stacksjs/iconify-${prefix}'

// Basic usage
const icon = ${exampleComponents[0] || 'Icon'}()

// With size
const sizedIcon = ${exampleComponents[0] || 'Icon'}({ size: 24 })

// With color
const coloredIcon = ${exampleComponents[1] || 'Icon'}({ color: 'red' })

// With multiple props
const customIcon = ${exampleComponents[2] || 'Icon'}({
  size: 32,
  color: '#4a90e2',
  class: 'my-icon'
})
\`\`\`

### In stx Templates

\`\`\`html
@js
  import { ${exampleComponents.slice(0, 3).join(', ')} } from '@stacksjs/iconify-${prefix}'

  global.icons = {
    home: ${exampleComponents[0] || 'Icon'}({ size: 24 }),
    user: ${exampleComponents[1] || 'Icon'}({ size: 24, color: '#4a90e2' }),
    settings: ${exampleComponents[2] || 'Icon'}({ size: 32 })
  }
@endjs

<div class="icons">
  {!! icons.home !!}
  {!! icons.user !!}
  {!! icons.settings !!}
</div>
\`\`\`

### Data-Only Import

You can also import icon data and use the \`renderIcon\` function directly:

\`\`\`typescript
import { ${exampleIcons.slice(0, 3).join(', ')} } from '@stacksjs/iconify-${prefix}'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(${exampleIcons[0] || 'icon'}, { size: 24 })
\`\`\`

## Icon Properties

All icon component functions and \`renderIcon\` accept the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`size\` | \`string \\| number\` | - | Icon size (sets both width and height) |
| \`width\` | \`string \\| number\` | - | Icon width (overrides size) |
| \`height\` | \`string \\| number\` | - | Icon height (overrides size) |
| \`color\` | \`string\` | \`'currentColor'\` | Icon color (CSS color or hex) |
| \`hFlip\` | \`boolean\` | \`false\` | Flip horizontally |
| \`vFlip\` | \`boolean\` | \`false\` | Flip vertically |
| \`rotate\` | \`0 \\| 90 \\| 180 \\| 270\` | \`0\` | Rotation in degrees |
| \`class\` | \`string\` | - | Additional CSS classes |
| \`style\` | \`string\` | - | Inline styles |

## Color

${collectionInfo.palette ? '### Color Icons\n\nThis collection contains color icons. While you can still set a color property, it may override the original colors.' : '### Monotone Icons\n\nMonotone icons use \`currentColor\` by default, allowing you to change icon color via the \`color\` property or CSS:'}

\`\`\`typescript
// Via color property
const redIcon = ${exampleComponents[0] || 'Icon'}({ color: 'red' })
const blueIcon = ${exampleComponents[0] || 'Icon'}({ color: '#4a90e2' })

// Via inline style
const greenIcon = ${exampleComponents[0] || 'Icon'}({ style: 'color: green;' })

// Via CSS class
const themedIcon = ${exampleComponents[0] || 'Icon'}({ class: 'text-primary' })
\`\`\`

${!collectionInfo.palette ? `\`\`\`css
/* In your CSS */
.text-primary {
  color: #4a90e2;
}

.icon:hover {
  color: #357abd;
}
\`\`\`` : ''}

## Size

Control icon size using the \`size\`, \`width\`, or \`height\` properties:

\`\`\`typescript
// Set both width and height
const icon24 = ${exampleComponents[0] || 'Icon'}({ size: 24 })
const icon1em = ${exampleComponents[0] || 'Icon'}({ size: '1em' })

// Set individual dimensions
const customIcon = ${exampleComponents[0] || 'Icon'}({ width: 24, height: 32 })

// Only set height (width calculated from ratio)
const heightOnly = ${exampleComponents[0] || 'Icon'}({ height: '1em' })
\`\`\`

### CSS Sizing

You can also control icon size via CSS:

\`\`\`css
.icon-small {
  width: 1em;
  height: 1em;
}

.icon-large {
  width: 2em;
  height: 2em;
}
\`\`\`

\`\`\`typescript
const smallIcon = ${exampleComponents[0] || 'Icon'}({ class: 'icon-small' })
const largeIcon = ${exampleComponents[0] || 'Icon'}({ class: 'icon-large' })
\`\`\`

## Available Icons

This package contains **${iconCount}** icons:

${allIconsList}

## Usage Examples

### Navigation Menu

\`\`\`html
@js
  import { ${exampleComponents.slice(0, 4).join(', ')} } from '@stacksjs/iconify-${prefix}'

  global.navIcons = {
    home: ${exampleComponents[0] || 'Icon'}({ size: 20, class: 'nav-icon' }),
    about: ${exampleComponents[1] || 'Icon'}({ size: 20, class: 'nav-icon' }),
    contact: ${exampleComponents[2] || 'Icon'}({ size: 20, class: 'nav-icon' }),
    settings: ${exampleComponents[3] || 'Icon'}({ size: 20, class: 'nav-icon' })
  }
@endjs

<nav>
  <a href="/">{!! navIcons.home !!} Home</a>
  <a href="/about">{!! navIcons.about !!} About</a>
  <a href="/contact">{!! navIcons.contact !!} Contact</a>
  <a href="/settings">{!! navIcons.settings !!} Settings</a>
</nav>
\`\`\`

### Custom Styling

\`\`\`typescript
import { ${exampleComponents[0] || 'Icon'} } from '@stacksjs/iconify-${prefix}'

const icon = ${exampleComponents[0] || 'Icon'}({
  size: 24,
  class: 'icon icon-primary',
  style: 'opacity: 0.8; transition: opacity 0.2s;'
})
\`\`\`

### Status Indicators

\`\`\`typescript
import { ${exampleComponents.slice(0, 3).join(', ')} } from '@stacksjs/iconify-${prefix}'

const successIcon = ${exampleComponents[0] || 'Icon'}({ size: 16, color: '#22c55e' })
const warningIcon = ${exampleComponents[1] || 'Icon'}({ size: 16, color: '#f59e0b' })
const errorIcon = ${exampleComponents[2] || 'Icon'}({ size: 16, color: '#ef4444' })
\`\`\`

## Best Practices

1. **Use Component Functions**: Import component functions for cleaner code
   \`\`\`typescript
   // Recommended
   import { ${exampleComponents[0] || 'Icon'}, ${exampleComponents[1] || 'Icon2'} } from '@stacksjs/iconify-${prefix}'
   const icon = ${exampleComponents[0] || 'Icon'}({ size: 24 })

   // Also works (data + renderIcon)
   import { ${exampleIcons[0] || 'icon'}, ${exampleIcons[1] || 'icon2'} } from '@stacksjs/iconify-${prefix}'
   import { renderIcon } from '@stacksjs/iconify-core'
   const icon = renderIcon(${exampleIcons[0] || 'icon'}, { size: 24 })
   \`\`\`

2. **Import Only What You Need**: Use named imports to enable tree-shaking
   \`\`\`typescript
   // Good - only imports what you use
   import { ${exampleComponents[0] || 'Icon'}, ${exampleComponents[1] || 'Icon2'} } from '@stacksjs/iconify-${prefix}'

   // Avoid - imports everything
   import * as icons from '@stacksjs/iconify-${prefix}'
   \`\`\`

3. **Cache Rendered Icons**: Render once and reuse multiple times
   \`\`\`html
   @js
     import { ${exampleComponents[0] || 'Icon'} } from '@stacksjs/iconify-${prefix}'
     global.icon = ${exampleComponents[0] || 'Icon'}({ size: 24 })
   @endjs

   {!! icon !!}
   {!! icon !!}
   {!! icon !!}
   \`\`\`

4. **Use CSS for Theming**: Apply consistent styling through CSS classes
   \`\`\`css
   .icon {
     color: currentColor;
     opacity: 0.8;
     transition: opacity 0.2s;
   }

   .icon:hover {
     opacity: 1;
   }
   \`\`\`

   \`\`\`typescript
   const icon = ${exampleComponents[0] || 'Icon'}({ class: 'icon' })
   \`\`\`

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

\`\`\`typescript
import type { IconData } from '@stacksjs/iconify-core'
import { ${exampleIcons[0] || 'icon'} } from '@stacksjs/iconify-${prefix}'

// Icons are typed as IconData
const myIcon: IconData = ${exampleIcons[0] || 'icon'}
\`\`\`

## Related Packages

- [\`@stacksjs/iconify-core\`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

${collectionInfo.license?.title || 'MIT'}

${collectionInfo.license?.url ? `See [license details](${collectionInfo.license.url}) for more information.` : ''}

## Credits

- **Icons**: ${collectionInfo.author?.name || 'Iconify'}${collectionInfo.author?.url ? ` ([Website](${collectionInfo.author.url}))` : ''}
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/${prefix}/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/${prefix}/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
`
}

/**
 * Generate a complete icon package
 */
export async function generatePackage(
  prefix: string,
  outputDir: string,
  icons?: string[],
  docsDir?: string,
): Promise<void> {
  console.log(`\n📦 Generating package for ${prefix}...`)

  // Fetch collection info
  const collections = await fetchCollections()
  const collectionInfo = collections[prefix]

  if (!collectionInfo) {
    throw new Error(`Collection ${prefix} not found`)
  }

  console.log(`   Collection: ${collectionInfo.name}`)
  console.log(`   Total icons: ${collectionInfo.total}`)

  // Fetch icons
  const collectionData = await fetchCollectionIcons(prefix, icons)
  const iconNames = Object.keys(collectionData.icons)

  console.log(`   Generating ${iconNames.length} icons...`)

  // Create package directory structure
  const packageDir = join(outputDir, `iconify-${prefix}`)
  const srcDir = join(packageDir, 'src')

  await mkdir(srcDir, { recursive: true })

  // Generate icon files
  const defaultWidth = collectionData.width || 24
  const defaultHeight = collectionData.height || 24

  for (const iconName of iconNames) {
    const iconData = collectionData.icons[iconName]
    const converted = convertIconData(iconData, defaultWidth, defaultHeight)
    const component = generateIconComponent(iconName, converted, prefix)

    await writeFile(join(srcDir, `${iconName}.ts`), component)
  }

  // Generate index file
  const indexContent = generateIndexFile(iconNames)
  await writeFile(join(srcDir, 'index.ts'), indexContent)

  // Generate types file
  const typesContent = generateTypesFile(prefix)
  await writeFile(join(srcDir, 'types.ts'), typesContent)

  // Generate package.json
  const packageJsonContent = generatePackageJson(prefix, collectionInfo, iconNames.length)
  await writeFile(join(packageDir, 'package.json'), packageJsonContent)

  // Generate build file
  const buildContent = generateBuildFile(prefix)
  await writeFile(join(packageDir, 'build.ts'), buildContent)

  // Generate README
  const readmeContent = generateReadme(prefix, collectionInfo, iconNames.length)
  await writeFile(join(packageDir, 'README.md'), readmeContent)

  // Generate documentation if docsDir is provided
  if (docsDir) {
    const docsPath = join(docsDir, `iconify-${prefix}.md`)
    const docContent = generateDocumentation(prefix, collectionInfo, iconNames)
    await mkdir(docsDir, { recursive: true })
    await writeFile(docsPath, docContent)
    console.log(`   ✓ Generated documentation in ${docsPath}`)
  }

  console.log(`   ✓ Generated ${iconNames.length} icons in ${packageDir}`)
}

/**
 * Convert kebab-case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/-([a-z0-9])/g, g => g[1].toUpperCase())
}

/**
 * Convert kebab-case to PascalCase
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}
