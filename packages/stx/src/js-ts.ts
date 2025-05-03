import { createDetailedErrorMessage } from './utils'
import { StxOptions } from './types'

/**
 * Process JavaScript directives in templates
 * Executes JavaScript code on the server and removes the code blocks from output
 */
export async function processJsDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string = '',
): Promise<string> {
  return processCodeBlocks(template, context, filePath, '@js', '@endjs')
}

/**
 * Process TypeScript directives in templates
 * Executes TypeScript code on the server and removes the code blocks from output
 */
export async function processTsDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string = '',
): Promise<string> {
  return processCodeBlocks(template, context, filePath, '@ts', '@endts')
}

/**
 * Process code blocks (@js/@ts) in templates
 * This executes the code on the server side only, then removes the blocks from the HTML
 */
async function processCodeBlocks(
  template: string,
  context: Record<string, any>,
  filePath: string,
  startTag: string,
  endTag: string,
): Promise<string> {
  let output = template
  const regex = new RegExp(`${startTag}([\\s\\S]*?)${endTag}`, 'g')

  // Process code blocks
  const matches: Array<{
    fullMatch: string
    content: string
    index: number
  }> = []

  // First collect all matches to avoid regex issues
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(template)) !== null) {
    matches.push({
      fullMatch: match[0],
      content: match[1] || '',
      index: match.index,
    })
  }

  // Process each match
  for (const { fullMatch, content, index } of matches) {
    try {
      // Create a function with all context variables in scope
      const keys = Object.keys(context)
      const values = Object.values(context)

      // Create code that assigns values to global context
      const code = `
        ${content.trim()}
        return Object.keys(global).reduce((obj, key) => {
          obj[key] = global[key];
          return obj;
        }, {});
      `

      // For TypeScript, strip the TypeScript-specific syntax
      // This is a simplified approach; a full transpiler would be more robust
      let processedCode = code
      if (startTag === '@ts') {
        processedCode = code
          // Remove interface declarations completely
          .replace(/interface\s+[^{]+\s*{[^}]*}/g, '')
          // Remove type annotations, but be careful with string literals containing colons
          .replace(/(?<!["']):\s*[A-Za-z0-9_<>|&[\],\s]+(?=\s*[=,);{}])/g, '')
          // Remove function return type annotations
          .replace(/\)\s*:\s*[A-Za-z0-9_<>|&[\],\s]+(?=\s*[{=])/g, ')')
          // Remove generic type parameters
          .replace(/<[A-Za-z0-9_<>|&[\],\s]+>/g, '')
      }

      // Execute the code
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...keys, 'global', processedCode)

      // Pass the global object to collect changes
      const result = evalFn(...values, context)

      // Update the context with any values set on global
      if (result && typeof result === 'object') {
        Object.assign(context, result)
      }

      // Remove the code block from the output
      output = output.replace(fullMatch, '')
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      // Create a detailed error message for debugging
      const errorHtml = createDetailedErrorMessage(
        `${startTag} Directive`,
        `Error executing code: ${errorMessage}`,
        filePath,
        template,
        index,
        fullMatch,
      )
      console.error(errorHtml)

      // Remove the code block from the output even if there was an error
      output = output.replace(fullMatch, '')
    }
  }

  return output
}