/**
 * STX Story - Documentation Generator
 * Generates markdown documentation from component analysis
 */

import type { AnalyzedComponent, ServerStoryFile, StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Documentation options
 */
export interface DocsOptions {
  /** Output directory */
  outDir?: string
  /** Include story previews */
  includeStories?: boolean
  /** Include source code */
  includeSource?: boolean
  /** Custom template */
  template?: string
}

/**
 * Generate documentation for all components
 */
export async function generateStoryDocs(
  ctx: StoryContext,
  components: AnalyzedComponent[],
  options: DocsOptions = {},
): Promise<void> {
  const outDir = options.outDir || path.join(ctx.root, '.stx', 'docs')

  // Ensure output directory exists
  await fs.promises.mkdir(outDir, { recursive: true })

  // Generate index
  const indexContent = generateDocsIndex(components)
  await fs.promises.writeFile(path.join(outDir, 'README.md'), indexContent)

  // Generate individual component docs
  for (const component of components) {
    const storyFile = ctx.storyFiles.find(f =>
      f.fileName.replace('.story', '') === component.name,
    )
    const content = generateComponentDocs(component, storyFile, options)
    await fs.promises.writeFile(
      path.join(outDir, `${component.name}.md`),
      content,
    )
  }
}

/**
 * Generate documentation index
 */
export function generateDocsIndex(components: AnalyzedComponent[]): string {
  const lines: string[] = []

  lines.push('# Component Documentation')
  lines.push('')
  lines.push('This documentation is auto-generated from component source files.')
  lines.push('')
  lines.push('## Components')
  lines.push('')

  // Group by category if available
  const categorized = new Map<string, AnalyzedComponent[]>()
  const uncategorized: AnalyzedComponent[] = []

  for (const component of components) {
    if (component.category) {
      const list = categorized.get(component.category) || []
      list.push(component)
      categorized.set(component.category, list)
    }
    else {
      uncategorized.push(component)
    }
  }

  // Output categorized components
  for (const [category, comps] of categorized) {
    lines.push(`### ${category}`)
    lines.push('')
    for (const comp of comps) {
      lines.push(`- [${comp.name}](./${comp.name}.md) - ${comp.description || 'No description'}`)
    }
    lines.push('')
  }

  // Output uncategorized components
  if (uncategorized.length > 0) {
    if (categorized.size > 0) {
      lines.push('### Other')
      lines.push('')
    }
    for (const comp of uncategorized) {
      lines.push(`- [${comp.name}](./${comp.name}.md) - ${comp.description || 'No description'}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate documentation for a single component
 */
export function generateComponentDocs(
  component: AnalyzedComponent,
  storyFile?: ServerStoryFile,
  options: DocsOptions = {},
): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${component.name}`)
  lines.push('')

  // Description
  if (component.description) {
    lines.push(component.description)
    lines.push('')
  }

  // Tags
  if (component.tags && component.tags.length > 0) {
    lines.push(`**Tags:** ${component.tags.join(', ')}`)
    lines.push('')
  }

  // Props table
  if (component.props.length > 0) {
    lines.push('## Props')
    lines.push('')
    lines.push('| Name | Type | Required | Default | Description |')
    lines.push('|------|------|----------|---------|-------------|')

    for (const prop of component.props) {
      const required = prop.required ? '✓' : ''
      const defaultVal = prop.default !== undefined ? `\`${JSON.stringify(prop.default)}\`` : '-'
      const description = prop.description || '-'
      lines.push(`| ${prop.name} | \`${prop.type}\` | ${required} | ${defaultVal} | ${description} |`)
    }
    lines.push('')
  }

  // Slots
  if (component.slots.length > 0) {
    lines.push('## Slots')
    lines.push('')
    lines.push('| Name | Description |')
    lines.push('|------|-------------|')

    for (const slot of component.slots) {
      const description = slot.description || '-'
      lines.push(`| ${slot.name} | ${description} |`)
    }
    lines.push('')
  }

  // Dependencies
  if (component.dependencies.length > 0) {
    lines.push('## Dependencies')
    lines.push('')
    lines.push('This component uses the following components:')
    lines.push('')
    for (const dep of component.dependencies) {
      lines.push(`- ${dep}`)
    }
    lines.push('')
  }

  // CSS Classes
  if (component.cssClasses.length > 0) {
    lines.push('## CSS Classes')
    lines.push('')
    lines.push('The following CSS classes are used:')
    lines.push('')
    lines.push('```')
    lines.push(component.cssClasses.join(' '))
    lines.push('```')
    lines.push('')
  }

  // Story examples
  if (options.includeStories && storyFile?.story) {
    lines.push('## Examples')
    lines.push('')

    for (const variant of storyFile.story.variants) {
      lines.push(`### ${variant.title}`)
      lines.push('')
      if (variant.source) {
        lines.push('```html')
        lines.push(variant.source)
        lines.push('```')
        lines.push('')
      }
    }
  }

  // Usage example
  lines.push('## Usage')
  lines.push('')
  lines.push('```html')
  lines.push(generateUsageExample(component))
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

/**
 * Generate a usage example for a component
 */
function generateUsageExample(component: AnalyzedComponent): string {
  const props = component.props
    .filter(p => p.required || p.default !== undefined)
    .map((p) => {
      if (p.type === 'boolean') {
        return p.default ? p.name : ''
      }
      if (p.type === 'string') {
        return `${p.name}="${p.default || 'value'}"`
      }
      return `:${p.name}="${JSON.stringify(p.default)}"`
    })
    .filter(Boolean)
    .join(' ')

  const hasSlots = component.slots.length > 0
  const defaultSlot = component.slots.find(s => s.name === 'default')

  if (hasSlots && defaultSlot) {
    return `<${component.name} ${props}>\n  Content goes here\n</${component.name}>`
  }

  return `<${component.name} ${props} />`
}

/**
 * Generate JSON catalog of all components
 */
export function generateComponentCatalog(
  components: AnalyzedComponent[],
): string {
  const catalog = components.map(c => ({
    name: c.name,
    description: c.description,
    category: c.category,
    tags: c.tags,
    props: c.props.map(p => ({
      name: p.name,
      type: p.type,
      required: p.required,
      default: p.default,
      description: p.description,
    })),
    slots: c.slots.map(s => ({
      name: s.name,
      description: s.description,
    })),
  }))

  return JSON.stringify(catalog, null, 2)
}

/**
 * Export design tokens from components
 */
export function exportDesignTokens(
  components: AnalyzedComponent[],
): Record<string, any> {
  const tokens: Record<string, any> = {
    colors: new Set<string>(),
    spacing: new Set<string>(),
    typography: new Set<string>(),
    borders: new Set<string>(),
    shadows: new Set<string>(),
  }

  // Extract tokens from CSS classes
  for (const component of components) {
    for (const cls of component.cssClasses) {
      // Color classes
      if (cls.match(/^(?:text|bg|border|fill|stroke)-/)) {
        tokens.colors.add(cls)
      }
      // Spacing classes
      if (cls.match(/^(?:p|m|gap|space)-/)) {
        tokens.spacing.add(cls)
      }
      // Typography classes
      if (cls.match(/^(?:text|font|leading|tracking)-/)) {
        tokens.typography.add(cls)
      }
      // Border classes
      if (cls.match(/^(?:border|rounded)-/)) {
        tokens.borders.add(cls)
      }
      // Shadow classes
      if (cls.match(/^shadow/)) {
        tokens.shadows.add(cls)
      }
    }
  }

  // Convert sets to arrays
  return {
    colors: Array.from(tokens.colors),
    spacing: Array.from(tokens.spacing),
    typography: Array.from(tokens.typography),
    borders: Array.from(tokens.borders),
    shadows: Array.from(tokens.shadows),
  }
}
