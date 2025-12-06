/**
 * STX Story - Auto-generate Stories
 * Create stories from components without .story.stx files
 */

import type { AnalyzedComponent } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { analyzeComponentFile } from './collect/analyzer'

/**
 * Story variant for auto-generation
 */
interface StoryVariant {
  id: string
  title: string
  state: Record<string, any>
}

/**
 * Auto-generation options
 */
export interface AutoGenerateOptions {
  /** Components directory */
  componentsDir: string
  /** Output directory for generated stories */
  outputDir?: string
  /** File patterns to include */
  include?: string[]
  /** File patterns to exclude */
  exclude?: string[]
  /** Generate variants for each prop type */
  generateVariants?: boolean
  /** Include default values in variants */
  includeDefaults?: boolean
  /** Overwrite existing story files */
  overwrite?: boolean
}

/**
 * Generated story result
 */
export interface GeneratedStory {
  /** Component path */
  componentPath: string
  /** Story file path */
  storyPath: string
  /** Story content */
  content: string
  /** Whether file was created or skipped */
  status: 'created' | 'skipped' | 'updated'
}

/**
 * Auto-generate stories for components
 */
export async function autoGenerateStories(
  options: AutoGenerateOptions,
): Promise<GeneratedStory[]> {
  const {
    componentsDir,
    outputDir = componentsDir,
    include = ['**/*.stx'],
    exclude = ['**/*.story.stx', '**/node_modules/**'],
    generateVariants = true,
    includeDefaults = true,
    overwrite = false,
  } = options

  const results: GeneratedStory[] = []

  // Find all component files
  const componentFiles = await findComponentFiles(componentsDir, include, exclude)

  for (const componentPath of componentFiles) {
    const storyPath = componentPath.replace(/\.stx$/, '.story.stx')
    const storyExists = await fileExists(storyPath)

    if (storyExists && !overwrite) {
      results.push({
        componentPath,
        storyPath,
        content: '',
        status: 'skipped',
      })
      continue
    }

    // Analyze the component
    const analysis = await analyzeComponentFile(componentPath)

    // Generate story content
    const content = generateStoryContent(analysis, {
      generateVariants,
      includeDefaults,
    })

    // Write story file
    const actualStoryPath = outputDir === componentsDir
      ? storyPath
      : path.join(outputDir, path.basename(storyPath))

    await fs.promises.mkdir(path.dirname(actualStoryPath), { recursive: true })
    await fs.promises.writeFile(actualStoryPath, content)

    results.push({
      componentPath,
      storyPath: actualStoryPath,
      content,
      status: storyExists ? 'updated' : 'created',
    })
  }

  return results
}

/**
 * Generate story content for a component
 */
export function generateStoryContent(
  analysis: AnalyzedComponent,
  options: { generateVariants?: boolean, includeDefaults?: boolean } = {},
): string {
  const { generateVariants = true, includeDefaults = true } = options
  const variants: StoryVariant[] = []

  // Default variant
  const defaultProps: Record<string, any> = {}
  if (includeDefaults) {
    for (const prop of analysis.props) {
      if (prop.default !== undefined) {
        defaultProps[prop.name] = prop.default
      }
    }
  }

  variants.push({
    id: 'default',
    title: 'Default',
    state: defaultProps,
  })

  // Generate variants for different prop combinations
  if (generateVariants) {
    // Boolean variants
    for (const prop of analysis.props) {
      if (prop.type === 'boolean') {
        variants.push({
          id: `${prop.name}-true`,
          title: `${formatPropName(prop.name)} (true)`,
          state: { ...defaultProps, [prop.name]: true },
        })
        variants.push({
          id: `${prop.name}-false`,
          title: `${formatPropName(prop.name)} (false)`,
          state: { ...defaultProps, [prop.name]: false },
        })
      }
    }

    // Enum/options variants
    for (const prop of analysis.props) {
      if (prop.options && prop.options.length > 0) {
        for (const option of prop.options) {
          variants.push({
            id: `${prop.name}-${option}`,
            title: `${formatPropName(prop.name)}: ${option}`,
            state: { ...defaultProps, [prop.name]: option },
          })
        }
      }
    }
  }

  // Generate story file content
  const componentName = analysis.name
  const description = analysis.description || `Stories for ${componentName} component`

  const variantBlocks = variants.map((v) => {
    const propsStr = Object.entries(v.state)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`
        }
        return `:${key}="${JSON.stringify(value)}"`
      })
      .join(' ')

    return `
@story('${v.title}')
<${componentName} ${propsStr} />
@endstory`
  }).join('\n')

  return `<!--
  ${description}
  Auto-generated by STX Story
-->

<script>
import ${componentName} from './${componentName}.stx'

// Story metadata
const meta = {
  title: '${componentName}',
  component: ${componentName},
}
</script>

${variantBlocks}
`
}

/**
 * Generate story for a single component
 */
export async function generateStoryForComponent(
  componentPath: string,
  options: { generateVariants?: boolean, includeDefaults?: boolean } = {},
): Promise<string> {
  const analysis = await analyzeComponentFile(componentPath)
  return generateStoryContent(analysis, options)
}

/**
 * Find component files
 */
async function findComponentFiles(
  dir: string,
  include: string[],
  exclude: string[],
): Promise<string[]> {
  const files: string[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      const relativePath = path.relative(dir, fullPath)

      // Check excludes
      if (exclude.some(pattern => matchGlob(relativePath, pattern))) {
        continue
      }

      if (entry.isDirectory()) {
        await walk(fullPath)
      }
      else if (entry.isFile()) {
        // Check includes
        if (include.some(pattern => matchGlob(relativePath, pattern))) {
          files.push(fullPath)
        }
      }
    }
  }

  await walk(dir)
  return files
}

/**
 * Simple glob matching
 */
function matchGlob(str: string, pattern: string): boolean {
  // Convert glob to regex
  const regex = pattern
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')

  return new RegExp(`^${regex}$`).test(str)
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath)
    return true
  }
  catch {
    return false
  }
}

/**
 * Format prop name for display
 */
function formatPropName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

/**
 * CLI command for auto-generating stories
 */
export async function autoGenerateCommand(args: string[]): Promise<void> {
  const componentsDir = args[0] || './src/components'
  const outputDir = args[1] || componentsDir

  console.log(`Scanning for components in ${componentsDir}...`)

  const results = await autoGenerateStories({
    componentsDir,
    outputDir,
    generateVariants: true,
    includeDefaults: true,
  })

  const created = results.filter(r => r.status === 'created').length
  const updated = results.filter(r => r.status === 'updated').length
  const skipped = results.filter(r => r.status === 'skipped').length

  console.log(`\nResults:`)
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Total: ${results.length}`)
}
