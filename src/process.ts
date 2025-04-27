/* eslint-disable no-console, regexp/no-super-linear-backtracking */
import type { StxOptions } from './types'
import path from 'node:path'
import { processAuthDirectives, processConditionals, processEnvDirective, processIssetEmptyDirectives } from './conditionals'
import { processCustomDirectives } from './custom-directives'
import { processExpressions } from './expressions'
import { processForms } from './forms'
import { processTranslateDirective } from './i18n'
import { processIncludes, processStackPushDirectives, processStackReplacements } from './includes'
import { processLoops } from './loops'
import { runPostProcessingMiddleware, runPreProcessingMiddleware } from './middleware'
import { renderComponent, resolveTemplatePath } from './utils'

/**
 * Process all template directives
 */
export async function processDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
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
    try {
      if (options.debug) {
        console.log(`Processing layout: ${layoutPath} for file ${filePath}`)
      }

      const layoutFullPath = await resolveTemplatePath(layoutPath, filePath, options, dependencies)
      if (!layoutFullPath) {
        console.warn(`Layout not found: ${layoutPath} (referenced from ${filePath})`)
        return output
      }

      // Read the layout content
      const layoutContent = await Bun.file(layoutFullPath).text()

      // Check if the layout itself extends another layout
      const nestedLayoutMatch = layoutContent.match(/@extends\(\s*['"]([^'"]+)['"]\s*\)/)
      if (nestedLayoutMatch) {
        if (options.debug) {
          console.log(`Found nested layout: ${nestedLayoutMatch[1]} in ${layoutFullPath}`)
        }

        // First process the current layout
        // Extract layout sections for parent content
        const layoutSections: Record<string, string> = {}
        const processedLayout = layoutContent.replace(/@section\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?:@show|@endsection)/g, (_, name, content) => {
          layoutSections[name] = content.trim()
          return '' // Remove the section from the template
        })

        // Merge current sections with layout sections, handling @parent
        // This is important for nested layouts
        for (const [name, content] of Object.entries(layoutSections)) {
          if (sections[name] && sections[name].includes('<!--PARENT_CONTENT_PLACEHOLDER-->')) {
            sections[name] = sections[name].replace('<!--PARENT_CONTENT_PLACEHOLDER-->', content)
          }
          else if (!sections[name]) {
            sections[name] = content
          }
        }

        // Create a new context with merged sections for the nested layout
        const nestedContext = { ...context, __sections: sections }

        // Process the nested layout by recursively calling processDirectives
        // with the modified template that includes the @extends directive
        const nestedTemplate = `@extends('${nestedLayoutMatch[1]}')${processedLayout}`
        return await processDirectives(nestedTemplate, nestedContext, layoutFullPath, options, dependencies)
      }

      // This is the final layout (doesn't extend another one)
      // First process pushes and stacks in the layout
      let processedLayout = processStackPushDirectives(layoutContent, stacks)

      // Extract layout sections
      const layoutSections: Record<string, string> = {}
      processedLayout = processedLayout.replace(/@section\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?:@show|@endsection)/g, (_, name, content) => {
        layoutSections[name] = content.trim()
        return `@yield('${name}')`
      })

      // Apply sections to yields in the layout, handling parent content
      processedLayout = processedLayout.replace(/@yield\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/g, (_, sectionName, defaultContent) => {
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

      // Process stack replacements in the layout
      processedLayout = processStackReplacements(processedLayout, stacks)

      // Process the fully combined layout content with all other directives
      output = await processOtherDirectives(processedLayout, context, layoutFullPath, options, dependencies)
      return output
    }
    catch (error) {
      console.error(`Error processing layout ${layoutPath}:`, error)
      return `[Error processing layout: ${error instanceof Error ? error.message : String(error)}]`
    }
  }

  // If no layout, process all other directives
  return await processOtherDirectives(output, context, filePath, options, dependencies)
}

// Helper function to process all non-layout directives
async function processOtherDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Run pre-processing middleware before any directives
  output = await runPreProcessingMiddleware(output, context, filePath, options)

  // Process custom directives first
  output = await processCustomDirectives(output, context, filePath, options)

  // Process auth directives
  output = processAuthDirectives(output, context)

  // Process @translate directives
  output = await processTranslateDirective(output, context, filePath, options)

  // Process @json directive
  output = processJsonDirective(output, context)

  // Process @once directive
  output = processOnceDirective(output)

  // Process @env directive
  output = processEnvDirective(output, context)

  // Process @isset and @empty directives
  output = processIssetEmptyDirectives(output, context)

  // Component processing needs to happen first so component directives can be processed with the right context
  const componentsDir = path.resolve(path.dirname(filePath), options.componentsDir || 'components')

  // First, process component directives
  output = await processComponentDirectives(output, context, filePath, componentsDir, options, dependencies)

  // Then process custom tag components
  output = await processCustomElements(output, context, filePath, componentsDir, options, dependencies)

  // Process include and partial directives
  output = await processIncludes(output, context, filePath, options, dependencies)

  // Process conditional directives (@if, @else, @elseif)
  output = processConditionals(output, context, filePath)

  // Process loop directives (@foreach, @for, @while)
  output = processLoops(output, context, filePath)

  // Process form directives
  output = processFormDirectives(output, context, filePath, options)

  // Process @error directive
  output = processErrorDirective(output, context)

  // Process expressions last so other directives have a chance
  // to modify the output first
  output = processExpressions(output, context, filePath)

  // Run post-processing middleware after all directives
  output = await runPostProcessingMiddleware(output, context, filePath, options)

  return output
}

/**
 * Process @component directives
 */
async function processComponentDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: StxOptions,
  dependencies: Set<string>,
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
    const processedContent = await renderComponent(
      componentPath,
      props,
      '',
      componentsDir,
      context,
      filePath,
      options,
      processedComponents,
      dependencies,
    )

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
  options: StxOptions,
  dependencies: Set<string>,
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
        dependencies,
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
        dependencies,
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
 * Process @form directives for forms
 */
export function processFormDirectives(template: string, context: Record<string, any>, filePath: string = '', options: StxOptions = {}): string {
  return processForms(template, context, filePath, options)
}

/**
 * Process @error directive for form validation
 */
export function processErrorDirective(template: string, context: Record<string, any>): string {
  // Process @error('field') directives
  return template.replace(/@error\(['"]([^'"]+)['"]\)([\s\S]*?)@enderror/g, (match, field, content) => {
    try {
      // Check if errors object exists and has the specified field
      if (context.errors
        && typeof context.errors === 'object'
        && typeof context.errors.has === 'function'
        && context.errors.has(field)) {
        // Replace any expressions in the content with actual values
        return content.replace(/\{\{([^}]+)\}\}/g, (_: string, expr: string) => {
          try {
            // Simple expression evaluation for error messages
            if (expr.trim() === '$message' || expr.trim() === 'message') {
              return context.errors.get(field)
            }

            // Handle expressions with errors.first() call
            if (expr.trim().includes('errors.first') || expr.trim().includes('$errors.first')) {
              // Extract the message using the errors.first method
              return context.errors.first(field)
            }

            // For other expressions, try to evaluate them
            // eslint-disable-next-line no-new-func
            const evalFn = new Function(...Object.keys(context), `
              try { return ${expr.trim()}; } catch (e) { return '${expr.trim()}'; }
            `)
            return evalFn(...Object.values(context))
          }
          catch {
            return expr
          }
        })
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
 * Process @json directive to output JSON
 */
export function processJsonDirective(template: string, context: Record<string, any>): string {
  // Handle @json(data) and @json(data, pretty) directives
  return template.replace(/@json\(\s*([^,)]+)(?:,\s*(true|false))?\)/g, (match, dataPath, pretty) => {
    try {
      // Simple expression evaluation
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...Object.keys(context), `
        try { return ${dataPath.trim()}; } catch (e) { return undefined; }
      `)
      const data = evalFn(...Object.values(context))

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
export function processOnceDirective(template: string): string {
  // Use an ordered map to keep track of the first occurrence of each content
  const onceBlocks: Map<string, { content: string, index: number }> = new Map()

  // Find all @once/@endonce blocks with their positions
  const onceMatches: Array<{ match: string, content: string, start: number, end: number }> = []

  const regex = /@once\s*([\s\S]*?)@endonce/g
  let match = regex.exec(template)
  while (match !== null) {
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

    match = regex.exec(template)
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
