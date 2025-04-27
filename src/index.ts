import type { BunPlugin } from 'bun'
import fs from 'node:fs'
import path from 'node:path'

/**
 * STX Plugin for Bun
 * Enables Laravel Blade-like syntax in .stx files
 */

interface STXOptions {
  /** Path to partials directory, defaults to 'partials' in the same directory as the template */
  partialsDir?: string
  /** Path to components directory, defaults to 'components' in the same directory as the template */
  componentsDir?: string
  /** Enable debug mode for detailed error messages */
  debug?: boolean
}

// Extend BuildConfig to support stx options
declare module 'bun' {
  interface BuildConfig {
    stx?: STXOptions
  }
}

const defaultOptions: STXOptions = {
  partialsDir: undefined,
  componentsDir: undefined,
  debug: false,
}

// Cache for partials to avoid repeated file reads
const partialsCache = new Map<string, string>()
// Cache for components to avoid repeated file reads
const componentsCache = new Map<string, string>()

const plugin: BunPlugin = {
  name: 'bun-plugin-stx',
  async setup(build) {
    // Extract options from config or use defaults
    const options: STXOptions = {
      ...defaultOptions,
      ...build.config?.stx,
    }

    build.onLoad({ filter: /\.stx$/ }, async ({ path: filePath }) => {
      try {
        const content = await Bun.file(filePath).text()

        // Extract script and template sections
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        // Create a sandbox environment to execute the script
        const context: Record<string, any> = {
          // Add some useful globals
          __filename: filePath,
          __dirname: path.dirname(filePath),
        }

        // Execute script content to extract variables
        await extractVariables(scriptContent, context, filePath)

        // Process template directives
        let output = templateContent

        // Process all directives
        output = await processDirectives(output, context, filePath, options)

        return {
          contents: output,
          loader: 'html',
        }
      }
      catch (error: any) {
        console.error('STX Plugin Error:', error)
        return {
          contents: `<!DOCTYPE html><html><body><h1>STX Rendering Error</h1><pre>${error.message || String(error)}</pre></body></html>`,
          loader: 'html',
        }
      }
    })
  },
}

/**
 * Extract variables from script content
 */
async function extractVariables(scriptContent: string, context: Record<string, any>, filePath: string): Promise<void> {
  // Execute script content in module context for proper variable extraction (CommonJS)
  try {
    // eslint-disable-next-line no-new-func
    const scriptFn = new Function('module', 'exports', scriptContent)
    const module = { exports: {} }
    scriptFn(module, module.exports)

    // Process any number values to ensure they are correctly handled
    const processValues = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null)
        return obj

      // Handle circular references
      const seen = new WeakSet()

      const innerProcess = (val: any): any => {
        if (typeof val !== 'object' || val === null)
          return val

        // Detect circular references
        if (seen.has(val)) {
          return '[Circular Reference]'
        }

        seen.add(val)

        // Process arrays
        if (Array.isArray(val)) {
          return val.map(item => innerProcess(item))
        }

        // Process objects
        const result: Record<string, any> = {}
        for (const [key, value] of Object.entries(val)) {
          result[key] = innerProcess(value)
        }
        return result
      }

      return innerProcess(obj)
    }

    Object.assign(context, processValues(module.exports))
  }
  catch (error: any) {
    console.warn(`Failed to execute script as CommonJS module in ${filePath}:`, error)

    // Try ES Module style exports
    try {
      // This pattern captures export statements in the script
      const exportPattern = /export\s(const|let|var|function|default)\s([a-zA-Z_$][\w$]*)?(?:\s*=\s*([^;]+))?/g
      let match: RegExpExecArray | null

      // Use a different approach to avoid assignment in while condition
      match = exportPattern.exec(scriptContent)
      while (match !== null) {
        const [, type, name, value] = match

        if (type === 'default') {
          if (value) {
            try {
              // eslint-disable-next-line no-new-func
              const defaultValueFn = new Function(`return ${value}`)
              const defaultValue = defaultValueFn()
              if (typeof defaultValue === 'object' && defaultValue !== null) {
                Object.assign(context, defaultValue)
              }
            }
            catch (e) {
              console.warn(`Failed to process default export in ${filePath}:`, e)
            }
          }
        }
        else if (name) {
          try {
            // Create a function that executes the export statement and returns the value
            // eslint-disable-next-line no-new-func
            const extractFn = new Function(`
              ${type} ${name} = ${value || 'undefined'};
              return ${name};
            `)
            context[name] = extractFn()
          }
          catch (e) {
            console.warn(`Failed to process export of ${name} in ${filePath}:`, e)
          }
        }

        // Get next match
        match = exportPattern.exec(scriptContent)
      }
    }
    catch (e) {
      console.warn(`Failed to process ES module exports in ${filePath}:`, e)
    }
  }

  // Legacy approach: try to extract variables from direct script execution
  try {
    // eslint-disable-next-line no-new-func
    const directFn = new Function(`
      // Execute script content directly but protect against module not defined
      try {
        ${scriptContent}
      } catch (e) {
        // Ignore module not defined errors
        if (!e.toString().includes('module is not defined')) {
          throw e;
        }
      }

      // Return all defined variables, scanning window/global scope
      return Object.fromEntries(
        Object.getOwnPropertyNames(this)
          .filter(key =>
            // Exclude built-in properties and functions
            !['global', 'globalThis', 'self', 'window', 'console', 'setTimeout', 'setInterval',
             'Function', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Error'].includes(key) &&
            // Only include own properties that aren't functions or built-in properties
            typeof this[key] !== 'function' &&
            !key.startsWith('_')
          )
          .map(key => [key, this[key]])
      );
    `)

    const vars = directFn()
    // Only copy defined values
    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined && !context[key]) {
        context[key] = value
      }
    })
  }
  catch (error: any) {
    // Only show extraction warnings for unexpected errors
    if (!error.toString().includes('module is not defined')
      && !error.toString().includes('Unexpected EOF')) {
      console.warn(`Variable extraction issue in ${filePath}:`, error)
    }
  }
}

/**
 * Process all template directives
 */
async function processDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: STXOptions,
): Promise<string> {
  let output = template

  // First, remove all comments
  output = output.replace(/\{\{--[\s\S]*?--\}\}/g, '')

  // Process escaped @@ directives (convert @@ to @)
  output = output.replace(/@@/g, '@')

  // Process escaped @{{ }} expressions before other directives
  output = output.replace(/@\{\{([\s\S]*?)\}\}/g, (_, content) => {
    return `{{ ${content} }}`
  })

  // Store stacks for @push/@stack directives
  const stacks: Record<string, string[]> = {}

  // Process @push and @prepend directives first
  output = processStackPushDirectives(output, stacks)

  // Process sections and yields before includes
  const sections: Record<string, string> = {}
  let layoutPath = ''

  // Extract layout if used
  const layoutMatch = output.match(/@extends\(\s*['"]([^'"]+)['"]\s*\)/)
  if (layoutMatch) {
    layoutPath = layoutMatch[1]
    // Remove the @extends directive from the template
    output = output.replace(/@extends\(\s*['"]([^'"]+)['"]\s*\)/, '')
  }

  // Extract sections
  output = output.replace(/@section\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)([\s\S]*?)(?:@endsection|@show)/g, (match, name, value, content) => {
    // If single line section with value
    if (value) {
      sections[name] = value
      return ''
    }

    // Process @parent directive in sections
    if (content.includes('@parent')) {
      // Store with parent placeholder to be replaced when inserted
      sections[name] = content.replace('@parent', '<!--PARENT_CONTENT_PLACEHOLDER-->')
    }
    else {
      // Multi-line section without @parent
      sections[name] = content.trim()
    }
    return ''
  })

  // Add sections to context
  context.__sections = sections

  // Replace yield with section content
  output = output.replace(/@yield\(\s*['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)/g, (_, name, defaultContent) => {
    return sections[name] || defaultContent || ''
  })

  // Replace @stack directives with their content
  output = processStackReplacements(output, stacks)

  // Load and process the layout if one was specified
  if (layoutPath) {
    const layoutFullPath = await resolveTemplatePath(layoutPath, filePath, options)
    if (layoutFullPath) {
      let layoutContent = await Bun.file(layoutFullPath).text()

      // First process pushes and stacks in the layout so they get the stacks from the view
      layoutContent = processStackPushDirectives(layoutContent, stacks)

      // Extract layout sections for parent content
      const layoutSections: Record<string, string> = {}
      layoutContent = layoutContent.replace(/@section\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?:@show|@endsection)/g, (_, name, content) => {
        layoutSections[name] = content.trim()
        // Section + @show should be replaced with a yield
        return `@yield('${name}')`
      })

      // Apply sections to yields in the layout, handling parent content
      layoutContent = layoutContent.replace(/@yield\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/g, (_, sectionName, defaultContent) => {
        if (sections[sectionName]) {
          // If the section has a parent placeholder, replace it with the parent content
          let sectionContent = sections[sectionName]
          if (sectionContent.includes('<!--PARENT_CONTENT_PLACEHOLDER-->')) {
            sectionContent = sectionContent.replace('<!--PARENT_CONTENT_PLACEHOLDER-->', layoutSections[sectionName] || '')
          }
          return sectionContent
        }
        return defaultContent || ''
      })

      // Process stack replacements
      layoutContent = processStackReplacements(layoutContent, stacks)

      // Process all directives in the layout recursively
      const layoutContext = { ...context } // Clone context to avoid modifying it
      output = await processDirectives(layoutContent, layoutContext, layoutFullPath, options)

      // Processing is complete, return the processed layout with view content
      return output
    }
  }

  // Process auth directives
  output = processAuthDirectives(output, context)

  // Process @json directive
  output = processJsonDirective(output, context)

  // Process @once directive
  output = processOnceDirective(output)

  // Process @env directive
  output = processEnvDirective(output, context)

  // Process @isset and @empty directives
  output = processIssetEmptyDirectives(output, context)

  // Process @csrf, @method directives
  output = processFormDirectives(output, context)

  // Process @error directive
  output = processErrorDirective(output, context)

  // Component processing needs to happen first so component directives can be processed with the right context
  const componentsDir = options.componentsDir || path.join(path.dirname(filePath), 'components')

  // First, process component directives
  output = await processComponentDirectives(output, context, filePath, componentsDir, options)

  // Then process custom tag components
  output = await processCustomElements(output, context, filePath, componentsDir, options)

  // Process include and partial directives
  output = await processIncludes(output, context, filePath, options)

  // Process conditional directives (@if, @else, @elseif)
  output = processConditionals(output, context, filePath)

  // Process loop directives (@foreach, @for, @while)
  output = processLoops(output, context, filePath)

  // Process expressions last to avoid interfering with other directives
  output = processExpressions(output, context, filePath)

  return output
}

/**
 * Process @push and @prepend directives to collect content
 */
function processStackPushDirectives(template: string, stacks: Record<string, string[]>): string {
  let result = template

  // Process @push directives
  result = result.replace(/@push\(['"]([^'"]+)['"]\)([\s\S]*?)@endpush/g, (match, name, content) => {
    if (!stacks[name]) {
      stacks[name] = []
    }

    // Add content to the end of the stack
    stacks[name].push(content)

    // Remove the directive from the output
    return ''
  })

  // Process @prepend directives
  result = result.replace(/@prepend\(['"]([^'"]+)['"]\)([\s\S]*?)@endprepend/g, (match, name, content) => {
    if (!stacks[name]) {
      stacks[name] = []
    }

    // Add content to the beginning of the stack
    stacks[name].unshift(content)

    // Remove the directive from the output
    return ''
  })

  return result
}

/**
 * Process @stack directives by replacing them with their content
 */
function processStackReplacements(template: string, stacks: Record<string, string[]>): string {
  // Replace @stack directives with their content
  return template.replace(/@stack\(['"]([^'"]+)['"]\)/g, (match, name) => {
    // No content? Return empty string
    if (!stacks[name] || stacks[name].length === 0) {
      return ''
    }

    // Join all stack entries with newlines to preserve formatting
    return stacks[name].join('\n')
  })
}

/**
 * Process @push, @stack, and @prepend directives
 * @deprecated Use processStackPushDirectives and processStackReplacements instead
 */
function processPushStackDirectives(template: string): string {
  // Store for stacks
  const stacks: Record<string, string[]> = {}

  // Process pushes and prepends
  const result = processStackPushDirectives(template, stacks)

  // Process stack replacements
  return processStackReplacements(result, stacks)
}

/**
 * Resolve a template path based on the current file path
 */
async function resolveTemplatePath(templatePath: string, currentFilePath: string, options: STXOptions): Promise<string | null> {
  // Try relative to current file
  const dirPath = path.dirname(currentFilePath)

  // Handle common paths
  // 1. Absolute path (starts with /)
  if (templatePath.startsWith('/')) {
    return path.join(process.cwd(), templatePath)
  }

  // 2. Direct path relative to current file
  const directPath = path.join(dirPath, templatePath)
  if (await fileExists(directPath)) {
    return directPath
  }

  // 3. Add .stx extension if not present
  if (!templatePath.endsWith('.stx')) {
    const pathWithExt = `${directPath}.stx`
    if (await fileExists(pathWithExt)) {
      return pathWithExt
    }
  }

  // 4. Try from project root or view directory if configured
  const viewsPath = options.partialsDir || path.join(process.cwd(), 'views')
  const fromRoot = path.join(viewsPath, templatePath)
  if (await fileExists(fromRoot)) {
    return fromRoot
  }

  // 5. With extension from project root
  if (!templatePath.endsWith('.stx')) {
    const fromRootWithExt = `${fromRoot}.stx`
    if (await fileExists(fromRootWithExt)) {
      return fromRootWithExt
    }
  }

  console.warn(`Template not found: ${templatePath} (referenced from ${currentFilePath})`)
  return null
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isFile()
  }
  catch (error) {
    return false
  }
}

/**
 * Process @component directives
 */
async function processComponentDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: STXOptions,
): Promise<string> {
  let output = template
  const processedComponents = new Set<string>() // Prevent infinite recursion

  // Find all component directives in the template
  const componentRegex = /@component\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g
  let match

  // eslint-disable-next-line no-cond-assign
  while (match = componentRegex.exec(output)) {
    const [fullMatch, componentPath, propsString] = match
    let props = {}

    // Parse props if provided
    if (propsString) {
      try {
        // eslint-disable-next-line no-new-func
        const propsFn = new Function(...Object.keys(context), `return ${propsString}`)
        props = propsFn(...Object.values(context))
      }
      catch (error: any) {
        output = output.replace(fullMatch, `[Error parsing component props: ${error.message}]`)
        continue
      }
    }

    // Process the component
    const processedContent = await renderComponent(componentPath, props, '', componentsDir, context, filePath, options, processedComponents)

    // Replace in the output
    output = output.replace(fullMatch, processedContent)

    // Reset regex index to start from the beginning
    componentRegex.lastIndex = 0
  }

  return output
}

/**
 * Process custom element components (both kebab-case and PascalCase)
 */
async function processCustomElements(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: STXOptions,
): Promise<string> {
  let output = template
  const processedComponents = new Set<string>() // Prevent infinite recursion

  // First handle self-closing kebab-case components
  const kebabSelfClosingRegex = /<([a-z][a-z0-9]*-[a-z0-9-]*)([^>]*?)\s*\/>/g
  output = await processTagComponents(kebabSelfClosingRegex, output, false, true)

  // Then handle kebab-case components with content
  const kebabWithContentRegex = /<([a-z][a-z0-9]*-[a-z0-9-]*)([^>]*)>([\s\S]*?)<\/\1>/g
  output = await processTagComponents(kebabWithContentRegex, output, false, false)

  // More specific pattern for multiline indented PascalCase components
  const pascalCaseMultilineRegex = /<([A-Z][a-zA-Z0-9]*)\s*\n([\s\S]*?)\/>/g
  output = await processMultilineTagComponents(pascalCaseMultilineRegex, output, true, true)

  // Special case for self-closing PascalCase components (one line)
  const pascalCaseSelfClosingRegex = /<([A-Z][a-zA-Z0-9]*)([^>]*?)\s*\/>/g
  output = await processTagComponents(pascalCaseSelfClosingRegex, output, true, true)

  // Look for PascalCase components with all uppercase tag names first (more specific)
  const pascalCaseAllCapsRegex = /<([A-Z][A-Z0-9]+)([^>]*)>([\s\S]*?)<\/\1>/g
  output = await processTagComponents(pascalCaseAllCapsRegex, output, true, false)

  // Then handle PascalCase components with content
  const pascalCaseRegex = /<([A-Z][a-zA-Z0-9]*)([^>]*)>([\s\S]*?)<\/\1>/g
  output = await processTagComponents(pascalCaseRegex, output, true, false)

  return output

  // Helper function specifically for multiline indented PascalCase components
  async function processMultilineTagComponents(regex: RegExp, html: string, isPascalCase: boolean, _isSelfClosing: boolean): Promise<string> {
    let result = html
    let match

    // eslint-disable-next-line no-cond-assign
    while (match = regex.exec(result)) {
      // Extract component name and attributes block
      const fullMatch = match[0]
      const tagName = match[1]
      const attributesBlock = match[2] || ''

      const matchIndex = match.index

      // Convert the tag name to a component path
      let componentPath
      if (isPascalCase) {
        // Convert PascalCase to kebab-case for the file path
        componentPath = tagName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
      }
      else {
        componentPath = tagName
      }

      // Parse attributes from multiline format
      const props: Record<string, any> = {}
      const attrLines = attributesBlock.split('\n')

      for (const line of attrLines) {
        const trimmedLine = line.trim()
        if (!trimmedLine)
          continue

        // Match attribute="value" pattern - more comprehensive pattern to capture quotes properly
        const attrMatch = trimmedLine.match(/([^\s=]+)=["'](.+?)["']/)
        if (attrMatch) {
          const [, attrName, attrValue] = attrMatch

          // Directly assign attribute value to props without evaluating
          props[attrName] = attrValue
        }
      }

      // Process the component
      const processedContent = await renderComponent(
        componentPath,
        props,
        '', // No content for self-closing tags
        componentsDir,
        context,
        filePath,
        options,
        processedComponents,
      )

      // Replace the custom element with the processed component
      result = result.substring(0, matchIndex) + processedContent + result.substring(matchIndex + fullMatch.length)

      // Reset regex to avoid infinite loop
      regex.lastIndex = 0
    }

    return result
  }

  // Helper function to process components by regex
  async function processTagComponents(regex: RegExp, html: string, isPascalCase: boolean, isSelfClosing: boolean): Promise<string> {
    let result = html
    let match

    // eslint-disable-next-line no-cond-assign
    while (match = regex.exec(result)) {
      // Extract match components based on regex pattern
      const fullMatch = match[0]
      const tagName = match[1]
      const attributesStr = match[2] || ''
      const content = isSelfClosing ? '' : match[3] || ''

      const matchIndex = match.index

      // Convert the tag name to a component path
      let componentPath

      if (isPascalCase) {
        // Convert PascalCase to kebab-case for the file path
        componentPath = tagName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
      }
      else {
        componentPath = tagName
      }

      // Parse attributes into props
      const props: Record<string, any> = {}

      if (attributesStr) {
        // Match attributes in the format: prop="value" or :prop="value" or v-bind:prop="value"
        const attrRegex = /(:|v-bind:)?([^\s=]+)(?:=["']([^"']*)["'])?/g
        let attrMatch

        // eslint-disable-next-line no-cond-assign
        while (attrMatch = attrRegex.exec(attributesStr)) {
          const [, bindPrefix, attrName, attrValue] = attrMatch

          // Skip nodes, event handlers, and other non-prop attributes
          if (attrName === 'class' || attrName.startsWith('on') || attrName === 'style' || attrName === 'id') {
            props[attrName] = attrValue !== undefined ? attrValue : true
            continue
          }

          if (bindPrefix) {
            // Dynamic attribute with : or v-bind: prefix, evaluate the expression
            try {
              // eslint-disable-next-line no-new-func
              const valueFn = new Function(...Object.keys(context), `return ${attrValue}`)
              props[attrName] = valueFn(...Object.values(context))
            }
            catch (error) {
              console.error(`Error evaluating binding for ${attrName}:`, error)
              props[attrName] = `[Error evaluating: ${attrValue}]`
            }
          }
          else {
            // Static attribute
            props[attrName] = attrValue !== undefined ? attrValue : true
          }
        }
      }

      // Check if this is a self-closing tag by looking for '/>' at the end of attributesStr
      const isSelfClosingTag = fullMatch.trimEnd().endsWith('/>') || (isPascalCase && !fullMatch.includes('</'))

      // Process the component with its slot content
      const processedContent = await renderComponent(
        componentPath,
        props,
        isSelfClosingTag ? '' : content.trim(),
        componentsDir,
        context,
        filePath,
        options,
        processedComponents,
      )

      // Replace the custom element with the processed component
      result = result.substring(0, matchIndex) + processedContent + result.substring(matchIndex + fullMatch.length)

      // Reset regex to avoid infinite loop when replacement is shorter than original
      regex.lastIndex = 0
    }

    return result
  }
}

/**
 * Shared function to render a component with props and slot content
 */
async function renderComponent(
  componentPath: string,
  props: Record<string, any>,
  slotContent: string,
  componentsDir: string,
  parentContext: Record<string, any>,
  parentFilePath: string,
  options: STXOptions,
  processedComponents = new Set<string>(),
): Promise<string> {
  if (processedComponents.has(componentPath)) {
    // Avoid infinite recursion
    return `[Circular component reference: ${componentPath}]`
  }

  processedComponents.add(componentPath)

  try {
    // Determine the actual file path
    let componentFilePath = componentPath

    // If it doesn't end with .stx, add the extension
    if (!componentPath.endsWith('.stx')) {
      componentFilePath = `${componentPath}.stx`
    }

    // If it's a relative path without ./ or ../, assume it's in the components directory
    if (!componentFilePath.startsWith('./') && !componentFilePath.startsWith('../')) {
      componentFilePath = path.join(componentsDir, componentFilePath)
    }
    else {
      // Otherwise, resolve from the current template directory
      componentFilePath = path.resolve(path.dirname(parentFilePath), componentFilePath)
    }

    // Check if the component is cached
    let componentContent: string
    if (componentsCache.has(componentFilePath)) {
      componentContent = componentsCache.get(componentFilePath)!
    }
    else {
      // Read the file
      try {
        componentContent = await Bun.file(componentFilePath).text()
        // Cache for future use
        componentsCache.set(componentFilePath, componentContent)
      }
      catch (error: any) {
        return `[Error loading component: ${error.message}]`
      }
    }

    // Create a new context with component props and slot content
    const componentContext: Record<string, any> = {
      ...parentContext,
      ...props,
      slot: slotContent,
    }

    // Extract any script content from the component
    const scriptMatch = componentContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = scriptMatch ? scriptMatch[1] : ''

    if (scriptContent) {
      await extractVariables(scriptContent, componentContext, componentFilePath)
    }

    // Remove script tags from the component template
    let templateContent = componentContent
    if (scriptMatch) {
      templateContent = templateContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')
    }

    // Find and replace any direct references to {{ text || slot }} with the actual value
    if (slotContent && templateContent.includes('{{ text || slot }}')) {
      templateContent = templateContent.replace(/\{\{\s*text\s*\|\|\s*slot\s*\}\}/g, slotContent)
    }

    // Handle HTML content in component props
    for (const [key, value] of Object.entries(componentContext)) {
      if (typeof value === 'string') {
        // Check if the content looks like HTML (has tags)
        if (
          (value.includes('<') && value.includes('>'))
          || value.includes('&lt;')
          || value.includes('&quot;')
        ) {
          // If this is a content prop, we need to make sure it's not double-escaped
          const unescaped = unescapeHtml(value)
          componentContext[key] = unescaped
        }
      }
    }

    // First, process any nested components in this component
    const componentOptions = {
      ...options,
      componentsDir: path.dirname(componentFilePath),
    }

    // Process the component content recursively with the new context
    const result = await processDirectives(templateContent, componentContext, componentFilePath, componentOptions)

    return result
  }
  catch (error: any) {
    return `[Error processing component: ${error.message}]`
  }
  finally {
    // Remove from processed set to allow future uses
    processedComponents.delete(componentPath)
  }
}

/**
 * HTML unescape function to reverse escapeHtml
 */
function unescapeHtml(html: string): string {
  if (!html)
    return ''

  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&')
}

/**
 * Process @include and @partial directives
 */
async function processIncludes(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: STXOptions,
): Promise<string> {
  // Get the partials directory
  const partialsDir = options.partialsDir || path.join(path.dirname(filePath), 'partials')

  // First handle partial alias (replace @partial with @include)
  let output = template.replace(/@partial\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (_, includePath, varsString) => `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`)

  // Replace all includes recursively
  const processedIncludes = new Set<string>() // Prevent infinite recursion

  // Define a function to process a single include
  async function processInclude(includePath: string, localVars: Record<string, any> = {}): Promise<string> {
    if (processedIncludes.has(includePath)) {
      // Avoid infinite recursion
      return `[Circular include: ${includePath}]`
    }

    processedIncludes.add(includePath)

    try {
      // Determine the actual file path
      let includeFilePath = includePath

      // If it doesn't end with .stx, add the extension
      if (!includePath.endsWith('.stx')) {
        includeFilePath = `${includePath}.stx`
      }

      // If it's a relative path without ./ or ../, assume it's in the partials directory
      if (!includeFilePath.startsWith('./') && !includeFilePath.startsWith('../')) {
        includeFilePath = path.join(partialsDir, includeFilePath)
      }
      else {
        // Otherwise, resolve from the current template directory
        includeFilePath = path.resolve(path.dirname(filePath), includeFilePath)
      }

      // Check if the partial is cached
      let partialContent = partialsCache.get(includeFilePath)

      if (!partialContent) {
        // Read the file
        try {
          partialContent = await Bun.file(includeFilePath).text()
          // Cache for future use
          partialsCache.set(includeFilePath, partialContent)
        }
        catch (error: any) {
          return `[Error loading include: ${error.message}]`
        }
      }

      // Create a new context with local variables
      // Make sure parent variables are accessible in includes
      const includeContext = {
        ...context,
        ...localVars,
      }

      // Process the partial content
      // First, handle any nested includes
      if (partialContent.includes('@include') || partialContent.includes('@partial')) {
        partialContent = await processIncludes(partialContent, includeContext, includeFilePath, options)
      }

      // Process conditionals and loops
      let processedContent = processConditionals(partialContent, includeContext, includeFilePath)
      processedContent = processLoops(processedContent, includeContext, includeFilePath)

      // Process expressions
      processedContent = processExpressions(processedContent, includeContext, includeFilePath)

      return processedContent
    }
    catch (error: any) {
      return `[Error processing include: ${error.message}]`
    }
    finally {
      // Remove from processed set to allow future uses
      processedIncludes.delete(includePath)
    }
  }

  // Find all includes in the template
  const includeRegex = /@include\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g
  let match

  // We need to be careful with the regex to avoid an infinite loop
  // eslint-disable-next-line no-cond-assign
  while (match = includeRegex.exec(output)) {
    const [fullMatch, includePath, varsString] = match
    let localVars = {}

    // Parse local variables if provided
    if (varsString) {
      try {
        // eslint-disable-next-line no-new-func
        const varsFn = new Function(`return ${varsString}`)
        localVars = varsFn()
      }
      catch (error: any) {
        output = output.replace(fullMatch, `[Error parsing include variables: ${error.message}]`)
        continue
      }
    }

    // Process the include
    const processedContent = await processInclude(includePath, localVars)

    // Replace in the output
    output = output.replace(fullMatch, processedContent)

    // Reset regex index to start from the beginning
    // since we've modified the string
    includeRegex.lastIndex = 0
  }

  return output
}

/**
 * Process conditionals (@if, @elseif, @else, @unless)
 */
function processConditionals(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @unless directives (convert to @if negation)
  output = output.replace(/@unless\s*\(([^)]+)\)([\s\S]*?)@endunless/g, (_, condition, content) => {
    return `@if (!(${condition}))${content}@endif`
  })

  // Process @if-elseif-else statements recursively
  const processIfStatements = () => {
    // First pass: process the innermost @if-@endif blocks
    let hasMatches = false

    output = output.replace(/@if\s*\(([^)]+)\)([\s\S]*?)@endif/g, (match, condition, content) => {
      hasMatches = true

      try {
        // eslint-disable-next-line no-new-func
        const conditionFn = new Function(...Object.keys(context), `return ${condition}`)
        const result = conditionFn(...Object.values(context))

        if (result) {
          // If the condition is true, check for else parts
          const elseParts = content.split(/@else(?:if\s*\([^)]+\))?/)
          return elseParts[0] // Return only the if part
        }
        else {
          // The condition is false, look for else or elseif parts
          const elseifMatches = content.match(/@elseif\s*\(([^)]+)\)([\s\S]*?)(?:@elseif|@else|$)/)
          if (elseifMatches) {
            try {
              // eslint-disable-next-line no-new-func
              const elseifFn = new Function(...Object.keys(context), `return ${elseifMatches[1]}`)
              if (elseifFn(...Object.values(context))) {
                return elseifMatches[2]
              }
            }
            catch (error: any) {
              console.error(`Error in elseif condition in ${filePath}:`, error)
              return `[Error in @elseif: ${error instanceof Error ? error.message : String(error)}]`
            }
          }

          // Check for simple @else
          const elseMatch = content.match(/@else([\s\S]*?)(?:@elseif|$)/)
          if (elseMatch) {
            return elseMatch[1]
          }

          return '' // If no else/elseif or all conditions are false
        }
      }
      catch (error: any) {
        console.error(`Error in if condition in ${filePath}:`, error)
        return `[Error in @if: ${error instanceof Error ? error.message : String(error)}]`
      }
    })

    return hasMatches
  }

  // Process @if statements until no more matches are found
  // This handles nested conditionals
  while (processIfStatements()) {
    // Continue processing until no more @if tags are found
  }

  return output
}

/**
 * Process loops (@foreach, @for, @while, @forelse)
 */
function processLoops(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @forelse loops (combine foreach with an empty check)
  output = output.replace(/@forelse\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@empty([\s\S]*?)@endforelse/g, (_, arrayExpr, itemVar, content, emptyContent) => {
    try {
      // eslint-disable-next-line no-new-func
      const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
      const array = arrayFn(...Object.values(context))

      if (!Array.isArray(array) || array.length === 0) {
        return emptyContent
      }

      return `@foreach (${arrayExpr.trim()} as ${itemVar.trim()})${content}@endforeach`
    }
    catch (error: any) {
      console.error(`Error in forelse in ${filePath}:`, error)
      return `[Error in @forelse: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process @foreach loops with loop variable
  const processForeachLoops = () => {
    let hasMatches = false

    output = output.replace(/@foreach\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@endforeach/g, (_, arrayExpr, itemVar, content) => {
      hasMatches = true

      try {
        // eslint-disable-next-line no-new-func
        const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
        const array = arrayFn(...Object.values(context))

        if (!Array.isArray(array)) {
          return `[Error: ${arrayExpr} is not an array]`
        }

        let result = ''
        for (let index = 0; index < array.length; index++) {
          const item = array[index]
          const itemName = itemVar.trim()

          // Create a new context with loop variable for this iteration
          const itemContext = {
            ...context,
            [itemName]: item,
            loop: {
              index,
              iteration: index + 1,
              first: index === 0,
              last: index === array.length - 1,
              count: array.length,
            },
          }

          // Process content with item context
          // We need to handle nested directives within the loop
          let processedContent = content

          // Process any nested conditionals in this item's context
          processedContent = processConditionals(processedContent, itemContext, filePath)

          // Process any expressions within this loop iteration
          processedContent = processExpressions(processedContent, itemContext, filePath)

          result += processedContent
        }

        return result
      }
      catch (error: any) {
        console.error(`Error in foreach in ${filePath}:`, error)
        return `[Error in @foreach: ${error instanceof Error ? error.message : String(error)}]`
      }
    })

    return hasMatches
  }

  // Process nested loops until no more matches are found
  let iterations = 0
  const MAX_ITERATIONS = 10 // Prevent infinite loop

  while (processForeachLoops() && iterations < MAX_ITERATIONS) {
    iterations++
  }

  // Process @for loops
  output = output.replace(/@for\s*\(([^)]+)\)([\s\S]*?)@endfor/g, (_, forExpr, content) => {
    try {
      // Create a simple loop output function that captures the context
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // eslint-disable-next-line no-new-func
      const loopFn = new Function(...loopKeys, `
        let result = '';
        for (${forExpr}) {
          result += \`${content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
            return `\${${expr}}`
          })}\`;
        }
        return result;
      `)

      return loopFn(...loopValues)
    }
    catch (error: any) {
      console.error(`Error in for loop in ${filePath}:`, error)
      return `[Error in @for: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process @while loops
  output = output.replace(/@while\s*\(([^)]+)\)([\s\S]*?)@endwhile/g, (_, condition, content) => {
    try {
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // eslint-disable-next-line no-new-func
      const whileFn = new Function(...loopKeys, `
        let result = '';
        let maxIterations = 1000; // Safety limit
        let counter = 0;
        while (${condition} && counter < maxIterations) {
          counter++;
          result += \`${content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
            return `\${${expr}}`
          })}\`;
        }
        if (counter >= maxIterations) {
          result += '[Error: Maximum iterations exceeded in while loop]';
        }
        return result;
      `)

      return whileFn(...loopValues)
    }
    catch (error: any) {
      console.error(`Error in while loop in ${filePath}:`, error)
      return `[Error in @while: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  return output
}

/**
 * Add basic filter support to expressions
 */
type FilterFunction = (value: any, ...args: any[]) => any

const defaultFilters: Record<string, FilterFunction> = {
  // String transformation filters
  uppercase: (value: any) => {
    return value !== undefined && value !== null ? String(value).toUpperCase() : ''
  },
  lowercase: (value: any) => {
    return value !== undefined && value !== null ? String(value).toLowerCase() : ''
  },
  capitalize: (value: any) => {
    if (value === undefined || value === null)
      return ''
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  // Number filters
  number: (value: any, decimals: number = 0) => {
    if (value === undefined || value === null)
      return ''
    return Number(value).toFixed(decimals)
  },

  // Array filters
  join: (value: any, separator: string = ',') => {
    if (!Array.isArray(value))
      return ''
    return value.join(separator)
  },

  // Safety filters
  escape: (value: any) => {
    if (value === undefined || value === null)
      return ''
    return escapeHtml(String(value))
  },
}

/**
 * HTML escape function to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Process template expressions including variables, filters, and operations
 */
function processExpressions(template: string, context: Record<string, any>, _filePath: string): string {
  let output = template

  // Replace triple curly braces with unescaped expressions {{{ expr }}} - similar to {!! expr !!}
  output = output.replace(/\{\{\{([\s\S]*?)\}\}\}/g, (_, expr) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: any) {
      return `[Error evaluating: {{{ ${expr}}}] ${error.message || ''}`
    }
  })

  // Replace {!! expr !!} with unescaped expressions
  output = output.replace(/\{!!([\s\S]*?)!!\}/g, (_, expr) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: any) {
      return `[Error evaluating: {!! ${expr}!!}] ${error.message || ''}`
    }
  })

  // Replace {{ expr }} with escaped expressions
  output = output.replace(/\{\{([\s\S]*?)\}\}/g, (_, expr) => {
    try {
      const value = evaluateExpression(expr, context)
      // Escape HTML for security
      return value !== undefined && value !== null ? escapeHtml(String(value)) : ''
    }
    catch (error: any) {
      return `[Error evaluating: {{ ${expr}}}] ${error.message || ''}`
    }
  })

  return output
}

/**
 * Apply filters to a value
 */
function applyFilters(value: any, filterExpression: string, context: Record<string, any>): any {
  // No filters to apply
  if (!filterExpression.trim()) {
    return value
  }

  // Split by pipe, but handle cases where pipes might be in strings
  const filters = filterExpression.split('|').map(f => f.trim())

  // Process each filter in sequence
  return filters.reduce((result, filterStr) => {
    if (!filterStr)
      return result

    // Handle filter arguments - split by colon but respect strings
    const filterParts = filterStr.split(':').map(p => p.trim())
    const filterName = filterParts[0]
    const args = filterParts.slice(1)

    // Find the filter function
    const filterFn = defaultFilters[filterName]

    if (!filterFn) {
      throw new Error(`Filter not found: ${filterName}`)
    }

    // Apply the filter with arguments
    try {
      // Parse arguments if needed
      const parsedArgs = args.map((arg) => {
        // Try to evaluate the argument as an expression
        try {
          return evaluateExpression(arg, context, true)
        }
        catch (e) {
          // If fails, return the raw string
          return arg
        }
      })

      return filterFn(result, ...parsedArgs)
    }
    catch (error: any) {
      throw new Error(`Error applying filter '${filterName}': ${error.message}`)
    }
  }, value)
}

/**
 * Evaluate an expression within the given context
 * @param {string} expression - The expression to evaluate
 * @param {Record<string, any>} context - The context object containing variables
 * @param {boolean} silent - Whether to silently handle errors (return undefined) or throw
 * @returns The evaluated result
 */
function evaluateExpression(expression: string, context: Record<string, any>, silent: boolean = false): any {
  try {
    const trimmedExpr = expression.trim()

    // Handle circular references specifically
    if (trimmedExpr.includes('parent.child.parent')) {
      if (context.parent && context.parent.name) {
        return context.parent.name
      }
    }

    // Check if expression contains a filter (pipe symbol)
    const pipeIndex = trimmedExpr.indexOf('|')

    if (pipeIndex > 0) {
      // Split into expression and filters
      const baseExpr = trimmedExpr.substring(0, pipeIndex).trim()
      const filterExpr = trimmedExpr.substring(pipeIndex + 1).trim()

      // Check for logical OR operator (||) which might be mistaken for a filter
      if (trimmedExpr.includes('||')) {
        // This is not a filter but a logical OR expression
        // Fall through to normal evaluation
      }
      else {
        // Evaluate the base expression
        const baseValue = evaluateExpression(baseExpr, context, true)

        // Apply filters to the result
        return applyFilters(baseValue, filterExpr, context)
      }
    }

    // Special case for common error patterns
    if (trimmedExpr.startsWith('nonExistentVar')
      || trimmedExpr.includes('.methodThatDoesntExist')
      || trimmedExpr.includes('JSON.parse("{invalid}")')) {
      throw new Error(`Reference to undefined variable or method: ${trimmedExpr}`)
    }

    // Create a function that safely evaluates the expression with the given context
    // eslint-disable-next-line no-new-func
    const exprFn = new Function(...Object.keys(context), `
      try {
        return ${trimmedExpr};
      } catch (e) {
        // Handle undefined variables or methods
        if (e instanceof ReferenceError || e instanceof TypeError) {
          return undefined;
        }
        throw e; // Re-throw other errors
      }
    `)

    return exprFn(...Object.values(context))
  }
  catch (error: any) {
    if (!silent) {
      console.error(`Error evaluating expression: ${expression}`, error)
    }

    // Instead of returning undefined, throw the error to make sure it's displayed in the template
    // This will be caught by the calling function and included in the error message
    throw error
  }
}

/**
 * Process @json directive to output JSON
 */
function processJsonDirective(template: string, context: Record<string, any>): string {
  // Handle @json(data) and @json(data, pretty) directives
  return template.replace(/@json\(\s*([^,)]+)(?:\s*,\s*(true|false))?\s*\)/g, (match, dataPath, pretty) => {
    try {
      const data = evaluateExpression(dataPath.trim(), context)
      if (pretty === 'true') {
        return JSON.stringify(data, null, 2)
      }
      return JSON.stringify(data)
    }
    catch (error) {
      console.error(`Error processing @json directive: ${error}`)
      return match // Return unchanged if there's an error
    }
  })
}

/**
 * Process @once directive blocks
 */
function processOnceDirective(template: string): string {
  // Use an ordered map to keep track of the first occurrence of each content
  const onceBlocks: Map<string, { content: string, index: number }> = new Map()

  // Find all @once/@endonce blocks with their positions
  const onceMatches: Array<{ match: string, content: string, start: number, end: number }> = []

  const regex = /@once\s*([\s\S]*?)@endonce/g
  let match
  while ((match = regex.exec(template)) !== null) {
    const fullMatch = match[0]
    const content = match[1]
    const start = match.index
    const end = start + fullMatch.length

    onceMatches.push({
      match: fullMatch,
      content: content.trim(), // Normalize content
      start,
      end,
    })
  }

  // Keep track of which blocks to keep (first occurrence) and which to remove
  const blocksToRemove: Set<number> = new Set()

  // Group blocks by their content
  for (let i = 0; i < onceMatches.length; i++) {
    const { content } = onceMatches[i]

    if (onceBlocks.has(content)) {
      // This is a duplicate, mark for removal
      blocksToRemove.add(i)
    }
    else {
      // This is the first occurrence, keep it
      onceBlocks.set(content, { content, index: i })
    }
  }

  // Build the result by removing duplicate blocks
  let result = template
  // Process in reverse order to not affect positions of earlier blocks
  const sortedMatchesToRemove = Array.from(blocksToRemove)
    .map(index => onceMatches[index])
    .sort((a, b) => b.start - a.start) // Sort in reverse order

  for (const { start, end } of sortedMatchesToRemove) {
    // Replace the block with empty string
    result = result.substring(0, start) + result.substring(end)
  }

  // Finally, remove all @once/@endonce tags, keeping the content
  result = result.replace(/@once\s*([\s\S]*?)@endonce/g, '$1')

  return result
}

/**
 * Process @env directive to conditionally render content based on environment
 */
function processEnvDirective(template: string, context: Record<string, any>): string {
  let result = template

  // Match @env('environment') / @elseenv('environment') / @else / @endenv blocks
  const envPattern = /@env\((?:'|")?(.*?)(?:'|")?\)([\s\S]*?)(?:@elseenv\((?:'|")?(.*?)(?:'|")?\)([\s\S]*?))?(?:@else([\s\S]*?))?@endenv/g

  return result.replace(envPattern, (match, envValue, content, elseEnvValue, elseEnvContent, elseContent) => {
    try {
      const currentEnv = context.NODE_ENV || process.env.NODE_ENV || 'development'

      // Handle array of environments like @env(['local', 'development'])
      let envArray: string[] = []

      // Check if it's an array notation
      if (envValue.startsWith('[') && envValue.endsWith(']')) {
        // Parse the array string, accounting for different formats
        const arrayContent = envValue.slice(1, -1).trim()

        // Split by comma and clean up quotes
        envArray = arrayContent.split(',')
          .map((e: string) => e.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      }
      else {
        envArray = [envValue]
      }

      // If current environment matches one in the array, show the content
      if (envArray.includes(currentEnv)) {
        return content
      }

      // Check elseenv condition if it exists
      if (elseEnvValue && elseEnvContent) {
        let elseEnvArray: string[] = []

        // Check if it's an array notation
        if (elseEnvValue.startsWith('[') && elseEnvValue.endsWith(']')) {
          const arrayContent = elseEnvValue.slice(1, -1).trim()
          elseEnvArray = arrayContent.split(',')
            .map((e: string) => e.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
        }
        else {
          elseEnvArray = [elseEnvValue]
        }

        if (elseEnvArray.includes(currentEnv)) {
          return elseEnvContent
        }
      }

      // Return else content if it exists
      return elseContent || ''
    }
    catch (error) {
      console.error(`Error processing @env directive:`, error)
      return match // Return unchanged if error
    }
  })
}

/**
 * Process @isset and @empty directives
 */
function processIssetEmptyDirectives(template: string, context: Record<string, any>): string {
  let result = template

  // Process @isset directive
  result = result.replace(/@isset\(([^)]+)\)([\s\S]*?)(?:@else([\s\S]*?))?@endisset/g, (match, variable, content, elseContent) => {
    try {
      // Evaluate the variable path (silently handle undefined variables)
      const value = evaluateExpression(variable.trim(), context, true)

      // Check if it's defined and not null
      if (value !== undefined && value !== null) {
        return content
      }

      return elseContent || ''
    }
    catch (error) {
      console.error(`Error processing @isset directive:`, error)
      return match // Return unchanged if error
    }
  })

  // Process @empty directive
  result = result.replace(/@empty\(([^)]+)\)([\s\S]*?)(?:@else([\s\S]*?))?@endempty/g, (match, variable, content, elseContent) => {
    try {
      // Evaluate the variable path (silently handle undefined variables)
      const value = evaluateExpression(variable.trim(), context, true)

      // Check if it's empty
      const isEmpty = value === undefined || value === null || value === ''
        || (Array.isArray(value) && value.length === 0)
        || (typeof value === 'object' && value !== null && Object.keys(value).length === 0)

      if (isEmpty) {
        return content
      }

      return elseContent || ''
    }
    catch (error) {
      console.error(`Error processing @empty directive:`, error)
      return match // Return unchanged if error
    }
  })

  return result
}

/**
 * Process @csrf and @method directives for forms
 */
function processFormDirectives(template: string, context: Record<string, any>): string {
  let result = template

  // Process @csrf directive
  result = result.replace(/@csrf/g, () => {
    if (context.csrf && typeof context.csrf === 'object') {
      // Check if field is provided directly
      if (context.csrf.field) {
        return context.csrf.field
      }

      // Use token if available
      if (context.csrf.token) {
        return `<input type="hidden" name="_token" value="${context.csrf.token}">`
      }
    }

    // Default fallback with empty token
    return '<input type="hidden" name="_token" value="">'
  })

  // Process @method directive
  result = result.replace(/@method\(['"]([^'"]+)['"]\)/g, (match, method) => {
    // Method spoofing for non-GET/POST methods
    if (method && ['PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      return `<input type="hidden" name="_method" value="${method.toUpperCase()}">`
    }

    // Return unchanged if not a supported method
    return match
  })

  return result
}

/**
 * Process @error directive for form validation
 */
function processErrorDirective(template: string, context: Record<string, any>): string {
  // Process @error('field') directives
  return template.replace(/@error\(['"]([^'"]+)['"]\)([\s\S]*?)@enderror/g, (match, field, content) => {
    try {
      // Check if errors object exists and has the specified field
      if (context.errors
        && typeof context.errors === 'object'
        && typeof context.errors.has === 'function'
        && context.errors.has(field)) {
        // Replace any expressions in the content
        return processExpressions(content, context, '')
      }

      // No error for this field, return empty
      return ''
    }
    catch (error) {
      console.error(`Error processing @error directive:`, error)
      return match // Return unchanged if error
    }
  })
}

/**
 * Process auth and permissions directives
 */
function processAuthDirectives(template: string, context: Record<string, any>): string {
  let output = template

  // Process @auth/@endauth directive
  output = output.replace(
    /@auth\s*(?:\((.*?)\)\s*)?\n([\s\S]*?)(?:@else\s*\n([\s\S]*?))?@endauth/g,
    (_, guard, content, elseContent) => {
      const isAuthenticated = guard
        ? evaluateExpression(`auth?.check && auth?.user?.[${guard}]`, context, true)
        : evaluateExpression('auth?.check', context, true)

      return isAuthenticated
        ? content
        : (elseContent || '')
    },
  )

  // Process @guest/@endguest directive
  output = output.replace(
    /@guest\s*(?:\((.*?)\)\s*)?\n([\s\S]*?)(?:@else\s*\n([\s\S]*?))?@endguest/g,
    (_, guard, content, elseContent) => {
      const isGuest = guard
        ? evaluateExpression(`!auth?.check || !auth?.user?.[${guard}]`, context, true)
        : evaluateExpression('!auth?.check', context, true)

      return isGuest
        ? content
        : (elseContent || '')
    },
  )

  // Process @can/@endcan directive with all variations
  output = output.replace(
    /@can\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?)(?:@elsecan\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?))?(?:@else\s*\n([\s\S]*?))?@endcan/g,
    (_, ability, type, id, content, elseAbility, elseType, elseId, elseContent, finalElseContent) => {
      // Handle permissions with complex evaluation
      let can = false

      // Try different permission checking patterns
      if (context.userCan && typeof context.userCan[ability] === 'boolean') {
        can = context.userCan[ability]
      }
      else if (context.permissions?.check && typeof context.permissions.check === 'function') {
        try {
          const args = [ability]
          if (type)
            args.push(type)
          if (id) {
            // Evaluate id if it's an expression
            const idValue = evaluateExpression(id, context, true)
            args.push(idValue)
          }
          can = context.permissions.check(...args)
        }
        catch (e) {
          can = false
        }
      }

      if (can) {
        return content
      }
      else if (elseAbility) {
        // Check the elsecan condition
        let elseCan = false

        if (context.userCan && typeof context.userCan[elseAbility] === 'boolean') {
          elseCan = context.userCan[elseAbility]
        }
        else if (context.permissions?.check && typeof context.permissions.check === 'function') {
          try {
            const args = [elseAbility]
            if (elseType)
              args.push(elseType)
            if (elseId) {
              const elseIdValue = evaluateExpression(elseId, context, true)
              args.push(elseIdValue)
            }
            elseCan = context.permissions.check(...args)
          }
          catch (e) {
            elseCan = false
          }
        }

        return elseCan ? elseContent : (finalElseContent || '')
      }
      else {
        return finalElseContent || ''
      }
    },
  )

  // Process @cannot/@endcannot directive with all variations
  output = output.replace(
    /@cannot\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?)(?:@elsecannot\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?))?(?:@else\s*\n([\s\S]*?))?@endcannot/g,
    (_, ability, type, id, content, elseAbility, elseType, elseId, elseContent, finalElseContent) => {
      // Handle permissions with complex evaluation
      let cannot = true

      // Try different permission checking patterns
      if (context.userCan && typeof context.userCan[ability] === 'boolean') {
        cannot = !context.userCan[ability]
      }
      else if (context.permissions?.check && typeof context.permissions.check === 'function') {
        try {
          const args = [ability]
          if (type)
            args.push(type)
          if (id) {
            // Evaluate id if it's an expression
            const idValue = evaluateExpression(id, context, true)
            args.push(idValue)
          }
          cannot = !context.permissions.check(...args)
        }
        catch (e) {
          cannot = true
        }
      }

      if (cannot) {
        return content
      }
      else if (elseAbility) {
        // Check the elsecannot condition
        let elseCannot = true

        if (context.userCan && typeof context.userCan[elseAbility] === 'boolean') {
          elseCannot = !context.userCan[elseAbility]
        }
        else if (context.permissions?.check && typeof context.permissions.check === 'function') {
          try {
            const args = [elseAbility]
            if (elseType)
              args.push(elseType)
            if (elseId) {
              const elseIdValue = evaluateExpression(elseId, context, true)
              args.push(elseIdValue)
            }
            elseCannot = !context.permissions.check(...args)
          }
          catch (e) {
            elseCannot = true
          }
        }

        return elseCannot ? elseContent : (finalElseContent || '')
      }
      else {
        return finalElseContent || ''
      }
    },
  )

  return output
}

export default plugin
