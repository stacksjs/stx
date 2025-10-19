/**
 * stx Documentation Generator
 * Generate documentation for components, templates, and directives
 */
import type { ComponentDoc, ComponentPropDoc, DirectiveDoc, DocFormat, DocGeneratorConfig, TemplateDoc } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config'
import { fileExists } from './utils'

/**
 * Extract component properties from a component file
 */
export async function extractComponentProps(
  componentPath: string,
): Promise<ComponentPropDoc[]> {
  try {
    // Read the component file
    const content = await Bun.file(componentPath).text()

    // Look for script tags with component properties
    const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    if (!scriptMatch)
      return []

    const scriptContent = scriptMatch[1]
    const props: ComponentPropDoc[] = []

    // Look for comments above properties
    // Match JSDoc blocks followed by variable declaration or object property
    const propRegex = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*(?:(?:const|let|var)\s*)?(?:([\w$]+)\s*=|module\.exports\.([\w$]+)\s*=|\s*([\w$]+)\s*:)/g

    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = propRegex.exec(scriptContent)) !== null) {
      const commentBlock = match[1]
      // Get property name from one of the capture groups that matched
      const propName = match[2] || match[3] || match[4]

      if (!propName)
        continue

      // Parse comment block for property metadata
      const propDoc: ComponentPropDoc = { name: propName }

      // Extract property type
      const typeMatch = commentBlock.match(/@type\s+\{([^}]+)\}/i)
      if (typeMatch)
        propDoc.type = typeMatch[1].trim()

      // Extract if required
      const requiredMatch = commentBlock.match(/@required/i)
      if (requiredMatch)
        propDoc.required = true

      // Extract default value
      const defaultMatch = commentBlock.match(/@default\s+(.+?)(?:\s+|$)/i)
      if (defaultMatch)
        propDoc.default = defaultMatch[1].trim()

      // Extract description (lines without @ tags)
      const descLines = commentBlock
        .split('\n')
        .map(line => line.trim().replace(/^\*\s*/, ''))
        .filter(line => !line.startsWith('@') && line.length > 0)

      propDoc.description = descLines.join(' ').trim()

      props.push(propDoc)
    }

    // If no JSDoc comments are found, try to extract props from module.exports
    if (props.length === 0) {
      const exportsMatch = scriptContent.match(/module\.exports\s*=\s*\{([^}]+)\}/i)
      if (exportsMatch) {
        const exportsObject = exportsMatch[1]
        const propLines = exportsObject.split(',').map(line => line.trim()).filter(Boolean)

        for (const propLine of propLines) {
          const [propName] = propLine.split(':').map(part => part.trim())
          if (propName) {
            props.push({ name: propName })
          }
        }
      }
    }

    return props
  }
  catch (error) {
    console.error(`Error extracting props from ${componentPath}:`, error)
    return []
  }
}

/**
 * Extract component description from a component file
 */
export async function extractComponentDescription(componentPath: string): Promise<string> {
  try {
    const content = await Bun.file(componentPath).text()

    // Look for a component description in a comment at the top of the file
    const commentMatch = content.match(/^\s*<!--\s*([\s\S]*?)\s*-->/) || content.match(/^\s*\/\*\*\s*([\s\S]*?)\s*\*\//)

    if (commentMatch) {
      return commentMatch[1]
        .split('\n')
        .map(line => line.trim().replace(/^\*\s*/, ''))
        .join(' ')
        .trim()
    }

    return ''
  }
  catch {
    return ''
  }
}

/**
 * Generate documentation for a component
 */
export async function generateComponentDoc(
  componentPath: string,
  isWebComponent = false,
  webComponentTag?: string,
): Promise<ComponentDoc> {
  const name = path.basename(componentPath, '.stx')

  // Extract component properties
  const props = await extractComponentProps(componentPath)

  // Extract description
  const description = await extractComponentDescription(componentPath)

  // Create example usage
  let example = ''

  if (isWebComponent && webComponentTag) {
    // Web component example
    example = `<${webComponentTag}></${webComponentTag}>`
  }
  else {
    // Regular component example with detected props
    const propsExample = props
      .map((prop) => {
        if (prop.type === 'boolean')
          return `:${prop.name}="true"`
        return `${prop.name}="value"`
      })
      .join('\n  ')

    example = `<${name}
  ${propsExample}
/>`
  }

  return {
    name,
    path: componentPath,
    description,
    props,
    example,
    isWebComponent,
    tag: webComponentTag,
  }
}

/**
 * Find all component files in a directory
 */
export async function findComponentFiles(componentsDir: string): Promise<string[]> {
  try {
    if (!await fileExists(componentsDir)) {
      console.warn(`Components directory does not exist: ${componentsDir}`)
      return []
    }

    const entries = await fs.promises.readdir(componentsDir, { withFileTypes: true })

    const componentFiles: string[] = []

    for (const entry of entries) {
      const entryPath = path.join(componentsDir, entry.name)

      if (entry.isDirectory()) {
        // Recursively find components in subdirectories
        const subComponents = await findComponentFiles(entryPath)
        componentFiles.push(...subComponents)
      }
      else if (entry.isFile() && entry.name.endsWith('.stx')) {
        componentFiles.push(entryPath)
      }
    }

    return componentFiles
  }
  catch (error) {
    console.error(`Error finding component files in ${componentsDir}:`, error)
    return []
  }
}

/**
 * Generate documentation for all components
 */
export async function generateComponentsDocs(componentsDir: string, webComponentsConfig?: any): Promise<ComponentDoc[]> {
  try {
    if (!await fileExists(componentsDir)) {
      return []
    }

    const componentFiles = await findComponentFiles(componentsDir)
    const componentDocs: ComponentDoc[] = []

    // Map of web component file paths to their config
    const webComponentsMap = new Map<string, any>()

    // If web components config is available, create a lookup map
    if (webComponentsConfig?.components?.length) {
      for (const component of webComponentsConfig.components) {
        webComponentsMap.set(component.file, component)
      }
    }

    for (const componentFile of componentFiles) {
      // Check if this is a web component
      const webComponent = webComponentsMap.get(componentFile)
      const isWebComponent = !!webComponent
      const webComponentTag = webComponent?.tag

      const doc = await generateComponentDoc(componentFile, isWebComponent, webComponentTag)
      componentDocs.push(doc)
    }

    return componentDocs
  }
  catch (error) {
    console.error(`Error generating component docs:`, error)
    return []
  }
}

/**
 * Generate documentation for templates
 */
export async function generateTemplatesDocs(templatesDir: string): Promise<TemplateDoc[]> {
  try {
    if (!await fileExists(templatesDir)) {
      return []
    }

    const entries = await fs.promises.readdir(templatesDir, { withFileTypes: true })
    const templateDocs: TemplateDoc[] = []

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.stx'))
        continue

      const templatePath = path.join(templatesDir, entry.name)
      const content = await Bun.file(templatePath).text()

      const name = path.basename(templatePath, '.stx')

      // Extract description from comments
      const descriptionMatch = content.match(/^\s*<!--\s*([\s\S]*?)\s*-->/) || content.match(/^\s*\/\*\*\s*([\s\S]*?)\s*\*\//)
      const description = descriptionMatch
        ? descriptionMatch[1].split('\n').map(line => line.trim().replace(/^\*\s*/, '')).join(' ').trim()
        : ''

      // Find components used in template
      const componentRegex = /@component\(\s*['"]([^'"]+)['"]/g
      const componentTags = /<([A-Z][a-zA-Z0-9]*|[a-z]+-[a-z0-9-]+)(?:\s[^>]*)?\/?>|\{\{\s*slot\s*\}\}/g

      const components = new Set<string>()
      let match

      // eslint-disable-next-line no-cond-assign
      while ((match = componentRegex.exec(content)) !== null) {
        components.add(match[1])
      }

      // eslint-disable-next-line no-cond-assign
      while ((match = componentTags.exec(content)) !== null) {
        if (match[1] && match[1] !== 'slot') {
          components.add(match[1])
        }
      }

      // Find directives used in template
      const directiveRegex = /@([a-z]+)(?:\s*\(|\s+|$)/g
      const directives = new Set<string>()

      // eslint-disable-next-line no-cond-assign
      while ((match = directiveRegex.exec(content)) !== null) {
        directives.add(match[1])
      }

      templateDocs.push({
        name,
        path: templatePath,
        description,
        components: [...components],
        directives: [...directives],
      })
    }

    return templateDocs
  }
  catch (error) {
    console.error(`Error generating template docs:`, error)
    return []
  }
}

/**
 * Generate documentation for directives
 */
export async function generateDirectivesDocs(customDirectives: any[] = []): Promise<DirectiveDoc[]> {
  try {
    const directiveDocs: DirectiveDoc[] = [
      // Built-in directives
      {
        name: 'if',
        description: 'Conditionally render content based on a condition',
        hasEndTag: true,
        example: '@if(user.isLoggedIn)\n  <p>Welcome, {{ user.name }}!</p>\n@endif',
      },
      {
        name: 'else',
        description: 'Provides an alternative if a condition is not met',
        hasEndTag: false,
        example: '@if(user.isLoggedIn)\n  <p>Welcome back!</p>\n@else\n  <p>Please log in</p>\n@endif',
      },
      {
        name: 'elseif',
        description: 'Provides an alternative condition',
        hasEndTag: false,
        example: '@if(score > 90)\n  <p>A</p>\n@elseif(score > 80)\n  <p>B</p>\n@elseif(score > 70)\n  <p>C</p>\n@endif',
      },
      {
        name: 'unless',
        description: 'Conditionally render content if a condition is false',
        hasEndTag: true,
        example: '@unless(user.isLoggedIn)\n  <p>Please log in</p>\n@endunless',
      },
      {
        name: 'for',
        description: 'Loop through an array or object',
        hasEndTag: true,
        example: '@for(item of items)\n  <li>{{ item.name }}</li>\n@endfor',
      },
      {
        name: 'while',
        description: 'Loop while a condition is true',
        hasEndTag: true,
        example: '@while(page < totalPages)\n  <p>Page {{ page }}</p>\n@endwhile',
      },
      {
        name: 'component',
        description: 'Include a component in the template',
        hasEndTag: false,
        example: '@component("alert", { type: "warning", title: "Warning", message: "This is a warning" })',
      },
      {
        name: 'include',
        description: 'Include a partial template',
        hasEndTag: false,
        example: '@include("partials/header")',
      },
      {
        name: 'raw',
        description: 'Display content without processing expressions',
        hasEndTag: true,
        example: '@raw\n  {{ This will be displayed as-is }}\n@endraw',
      },
      {
        name: 'translate',
        description: 'Translate a string using the i18n system',
        hasEndTag: false,
        example: '@translate("welcome.message", { name: user.name })',
      },
      {
        name: 't',
        description: 'Short alias for translate directive',
        hasEndTag: false,
        example: '@t("welcome.message", { name: user.name })',
      },
    ]

    // Add custom directives
    for (const directive of customDirectives) {
      directiveDocs.push({
        name: directive.name,
        description: directive.description || '',
        hasEndTag: directive.hasEndTag || false,
        example: '', // Would need examples for custom directives
      })
    }

    return directiveDocs
  }
  catch (error) {
    console.error(`Error generating directive docs:`, error)
    return []
  }
}

/**
 * Format documentation as Markdown
 */
export function formatDocsAsMarkdown(
  componentDocs: ComponentDoc[] = [],
  templateDocs: TemplateDoc[] = [],
  directiveDocs: DirectiveDoc[] = [],
  extraContent?: string,
): string {
  let markdown = `# stx Documentation\n\n`

  if (extraContent) {
    markdown += `${extraContent}\n\n`
  }

  // Components
  if (componentDocs.length > 0) {
    markdown += `## Components\n\n`

    for (const doc of componentDocs) {
      markdown += `### ${doc.name}\n\n`

      if (doc.description) {
        markdown += `${doc.description}\n\n`
      }

      if (doc.isWebComponent) {
        markdown += `**Web Component Tag:** \`${doc.tag}\`\n\n`
      }

      if (doc.props.length > 0) {
        markdown += `#### Properties\n\n`
        markdown += `| Name | Type | Required | Default | Description |\n`
        markdown += `| ---- | ---- | -------- | ------- | ----------- |\n`

        for (const prop of doc.props) {
          markdown += `| ${prop.name} | ${prop.type || 'any'} | ${prop.required ? 'Yes' : 'No'} | ${prop.default || '-'} | ${prop.description || '-'} |\n`
        }

        markdown += `\n`
      }

      if (doc.example) {
        markdown += `#### Example\n\n`
        markdown += '```html\n'
        markdown += doc.example
        markdown += '\n```\n\n'
      }
    }
  }

  // Templates
  if (templateDocs.length > 0) {
    markdown += `## Templates\n\n`

    for (const doc of templateDocs) {
      markdown += `### ${doc.name}\n\n`

      if (doc.description) {
        markdown += `${doc.description}\n\n`
      }

      if (doc.components && doc.components.length > 0) {
        markdown += `**Components Used:** ${doc.components.join(', ')}\n\n`
      }

      if (doc.directives && doc.directives.length > 0) {
        markdown += `**Directives Used:** ${doc.directives.join(', ')}\n\n`
      }
    }
  }

  // Directives
  if (directiveDocs.length > 0) {
    markdown += `## Directives\n\n`

    markdown += `| Directive | Description | Has End Tag |\n`
    markdown += `| --------- | ----------- | ----------- |\n`

    for (const doc of directiveDocs) {
      markdown += `| @${doc.name} | ${doc.description || '-'} | ${doc.hasEndTag ? 'Yes' : 'No'} |\n`
    }

    markdown += `\n`

    // Examples of directives with examples
    for (const doc of directiveDocs) {
      if (doc.example) {
        markdown += `### @${doc.name}\n\n`
        markdown += `${doc.description || ''}\n\n`
        markdown += `#### Example\n\n`
        markdown += '```html\n'
        markdown += doc.example
        markdown += '\n```\n\n'
      }
    }
  }

  return markdown
}

/**
 * Format documentation as HTML
 */
export function formatDocsAsHtml(
  componentDocs: ComponentDoc[] = [],
  templateDocs: TemplateDoc[] = [],
  directiveDocs: DirectiveDoc[] = [],
  extraContent?: string,
): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>stx Documentation</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3, h4 { margin-top: 2rem; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    th, td {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 1px solid #ddd;
    }
    th { border-bottom: 2px solid #ddd; }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>stx Documentation</h1>
  `

  if (extraContent) {
    html += `<div>${extraContent}</div>`
  }

  // Components
  if (componentDocs.length > 0) {
    html += `<h2>Components</h2>`

    for (const doc of componentDocs) {
      html += `<h3>${doc.name}</h3>`

      if (doc.description) {
        html += `<p>${doc.description}</p>`
      }

      if (doc.isWebComponent) {
        html += `<p><strong>Web Component Tag:</strong> <code>${doc.tag}</code></p>`
      }

      if (doc.props.length > 0) {
        html += `<h4>Properties</h4>`
        html += `<table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Required</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>`

        for (const prop of doc.props) {
          html += `<tr>
            <td>${prop.name}</td>
            <td>${prop.type || 'any'}</td>
            <td>${prop.required ? 'Yes' : 'No'}</td>
            <td>${prop.default || '-'}</td>
            <td>${prop.description || '-'}</td>
          </tr>`
        }

        html += `</tbody></table>`
      }

      if (doc.example) {
        html += `<h4>Example</h4>`
        html += `<pre><code>${doc.example
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')}</code></pre>`
      }
    }
  }

  // Templates
  if (templateDocs.length > 0) {
    html += `<h2>Templates</h2>`

    for (const doc of templateDocs) {
      html += `<h3>${doc.name}</h3>`

      if (doc.description) {
        html += `<p>${doc.description}</p>`
      }

      if (doc.components && doc.components.length > 0) {
        html += `<p><strong>Components Used:</strong> ${doc.components.join(', ')}</p>`
      }

      if (doc.directives && doc.directives.length > 0) {
        html += `<p><strong>Directives Used:</strong> ${doc.directives.join(', ')}</p>`
      }
    }
  }

  // Directives
  if (directiveDocs.length > 0) {
    html += `<h2>Directives</h2>`

    html += `<table>
      <thead>
        <tr>
          <th>Directive</th>
          <th>Description</th>
          <th>Has End Tag</th>
        </tr>
      </thead>
      <tbody>`

    for (const doc of directiveDocs) {
      html += `<tr>
        <td>@${doc.name}</td>
        <td>${doc.description || '-'}</td>
        <td>${doc.hasEndTag ? 'Yes' : 'No'}</td>
      </tr>`
    }

    html += `</tbody></table>`

    // Examples of directives with examples
    for (const doc of directiveDocs) {
      if (doc.example) {
        html += `<h3>@${doc.name}</h3>`
        html += `<p>${doc.description || ''}</p>`
        html += `<h4>Example</h4>`
        html += `<pre><code>${doc.example
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')}</code></pre>`
      }
    }
  }

  html += `</body></html>`

  return html
}

/**
 * Format documentation as JSON
 */
export function formatDocsAsJson(
  componentDocs: ComponentDoc[] = [],
  templateDocs: TemplateDoc[] = [],
  directiveDocs: DirectiveDoc[] = [],
  extraContent?: string,
): string {
  const json = {
    components: componentDocs,
    templates: templateDocs,
    directives: directiveDocs,
    extraContent: extraContent || '',
  }

  return JSON.stringify(json, null, 2)
}

/**
 * Generate documentation
 */
export async function generateDocs(options: {
  componentsDir?: string
  templatesDir?: string
  webComponentsConfig?: any
  customDirectives?: any[]
  config: Partial<DocGeneratorConfig>
}): Promise<boolean> {
  try {
    const { componentsDir, templatesDir, webComponentsConfig, customDirectives, config: docConfig } = options

    if (!docConfig.enabled) {
      return false
    }

    // Create output directory if it doesn't exist
    const outputDir = docConfig.outputDir || 'docs'
    await fs.promises.mkdir(outputDir, { recursive: true })

    // Log the directories we're using for debugging

    console.log(`Generating documentation...`)
    if (componentsDir)
      console.log(`Components directory: ${componentsDir}`)
    if (templatesDir)
      console.log(`Templates directory: ${templatesDir}`)
    console.log(`Output directory: ${outputDir}`)

    // Generate documentation for components
    let componentDocs: ComponentDoc[] = []
    if (docConfig.components !== false && componentsDir) {
      console.log(`Generating component documentation...`)
      componentDocs = await generateComponentsDocs(componentsDir, webComponentsConfig)
      console.log(`Found ${componentDocs.length} components`)
    }

    // Generate documentation for templates
    let templateDocs: TemplateDoc[] = []
    if (docConfig.templates !== false && templatesDir) {
      console.log(`Generating template documentation...`)
      templateDocs = await generateTemplatesDocs(templatesDir)
      console.log(`Found ${templateDocs.length} templates`)
    }

    // Generate documentation for directives
    let directiveDocs: DirectiveDoc[] = []
    if (docConfig.directives !== false) {
      console.log(`Generating directive documentation...`)
      directiveDocs = await generateDirectivesDocs(customDirectives)
      console.log(`Found ${directiveDocs.length} directives`)
    }

    // Format documentation based on requested format
    const format = docConfig.format || 'markdown'
    const extraContent = docConfig.extraContent

    let docContent = ''
    let extension = ''

    switch (format) {
      case 'markdown':
        docContent = formatDocsAsMarkdown(
          componentDocs,
          templateDocs,
          directiveDocs,
          extraContent,
        )
        extension = 'md'
        break

      case 'html':
        docContent = formatDocsAsHtml(
          componentDocs,
          templateDocs,
          directiveDocs,
          extraContent,
        )
        extension = 'html'
        break

      case 'json':
        docContent = formatDocsAsJson(
          componentDocs,
          templateDocs,
          directiveDocs,
          extraContent,
        )
        extension = 'json'
        break

      default:
        throw new Error(`Unsupported documentation format: ${format}`)
    }

    // Write documentation to file
    const outputPath = path.join(outputDir, `stx-docs.${extension}`)
    await Bun.write(outputPath, docContent)

    console.log(`Documentation generated: ${outputPath}`)
    return true
  }
  catch (error) {
    console.error('Error generating documentation:', error)
    return false
  }
}

/**
 * Documentation generation command handler for CLI
 */
export async function docsCommand(options: any): Promise<boolean> {
  // Set defaults for CLI command
  const docsConfig: Partial<DocGeneratorConfig> = {
    enabled: true,
    outputDir: options.output || 'docs',
    format: (options.format || 'markdown') as DocFormat,
    components: options.components !== false,
    templates: options.templates !== false,
    directives: options.directives !== false,
    extraContent: options.extraContent,
  }

  // Determine components and templates directories
  const componentsDir = options.componentsDir || config.componentsDir
  const templatesDir = options.templatesDir || '.'

  return generateDocs({
    componentsDir,
    templatesDir,
    webComponentsConfig: config.webComponents,
    customDirectives: config.customDirectives,
    config: docsConfig,
  })
}
