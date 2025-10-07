import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { IconData } from '@stx/iconify-core'

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
    const basePath = iconifyJsonPath.substring(0, iconifyJsonPath.lastIndexOf('/node_modules/@iconify/json/')) + '/node_modules/@iconify/json'
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
          icons: filteredIcons
        }
      }

      return data
    }
  } catch (error) {
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

  return `import type { IconData } from '@stx/iconify-core'

export const ${camelCaseName}: IconData = ${JSON.stringify(iconData, null, 2)}

export default ${camelCaseName}
`
}

/**
 * Generate index file for a collection
 */
export function generateIndexFile(iconNames: string[]): string {
  const exports = iconNames.map((name) => {
    const camelCaseName = toCamelCase(name)
    return `export { default as ${camelCaseName} } from './${name}.js'`
  }).join('\n')

  return `${exports}

export * from './types.js'
`
}

/**
 * Generate types file
 */
export function generateTypesFile(prefix: string): string {
  return `import type { IconData, IconProps } from '@stx/iconify-core'

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
    name: `@stx/iconify-${prefix}`,
    version: '0.0.1',
    description: `${collectionInfo.name} icons for stx from Iconify`,
    author: collectionInfo.author?.name || 'Iconify',
    license: collectionInfo.license?.spdx || 'MIT',
    type: 'module',
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
      '@stx/iconify-core': 'workspace:*',
    },
    keywords: [
      'iconify',
      'icons',
      'svg',
      prefix,
      collectionInfo.name,
      'stx',
    ],
    repository: {
      type: 'git',
      url: 'https://github.com/stacksjs/stx.git',
      directory: `packages/collections/iconify-${prefix}`,
    },
    sideEffects: false,
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

console.log('✓ Built @stx/iconify-${prefix}')
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
  return `# @stx/iconify-${prefix}

${collectionInfo.name} icons for stx from Iconify.

## Installation

\`\`\`bash
bun add @stx/iconify-${prefix}
\`\`\`

## Usage

### In stx templates

\`\`\`html
<script>
  import { home } from '@stx/iconify-${prefix}'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
\`\`\`

### In TypeScript/JavaScript

\`\`\`typescript
import { home, account, settings } from '@stx/iconify-${prefix}'
import { renderIcon } from '@stx/iconify-core'

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
 * Generate a complete icon package
 */
export async function generatePackage(
  prefix: string,
  outputDir: string,
  icons?: string[],
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
