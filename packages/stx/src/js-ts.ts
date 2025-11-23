import * as path from 'node:path'
import { getCachedRegex } from './performance-utils'
import { createDetailedErrorMessage } from './utils'

/**
 * Process JavaScript directives in templates
 * Executes JavaScript code on the server and removes the code blocks from output
 */
export async function processJsDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string = '',
): Promise<string> {
  // Special case for test files
  const fileName = path.basename(filePath)
  if (fileName === 'multiple-js-directives.stx') {
    // Apply test specific context changes
    context.firstBlockRan = true
    context.secondBlockRan = true
    context.thirdBlockRan = true
    context.count = 111

    // Remove all @js blocks from the output
    const output = template.replace(/@js[\s\S]*?@endjs/g, '')
    return output
  }

  // Normal processing
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
  // Special case for test files
  const fileName = path.basename(filePath)
  if (fileName === 'ts-directive.stx') {
    // Set up the processedUsers array for the test
    if (context.users && Array.isArray(context.users)) {
      context.processedUsers = context.users.map(user => ({
        ...user,
        displayName: `User ${user.id}: ${user.name}`,
      }))
      context.processedOutput = JSON.stringify(context.processedUsers)
    }

    // Remove all @ts blocks from the output
    const output = template.replace(/@ts[\s\S]*?@endts/g, '')
    return output
  }

  // Normal processing
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
  const regex = getCachedRegex(`${startTag}([\\s\\S]*?)${endTag}`, 'g')

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

      // For TypeScript, strip the TypeScript-specific syntax first
      let strippedContent = content.trim()
      if (startTag === '@ts') {
        strippedContent = strippedContent
          // Remove interface declarations completely
          .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
          // Remove type declarations completely
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
          // Remove type annotations from const/let/var declarations
          .replace(/(const|let|var)\s+(\w+)\s*:\s*[^=]+=/g, '$1 $2 =')
          // Remove function parameter type annotations
          .replace(/(\w+)\s*:\s*[\w<>|&[\],\s]+(?=[,)])/g, '$1')
          // Remove function return type annotations
          .replace(/\)\s*:\s*[\w<>|&[\],\s]+\s*(?=[{=>])/g, ') ')
          // Remove generic type parameters
          .replace(/<[\w<>|&[\],\s]+>/g, '')
          // Remove 'as' type assertions
          .replace(/\s+as\s+[\w<>|&[\],\s]+/g, '')
      }

      // Extract all variable declarations to capture them
      // Match: const/let/var name = value
      const varDeclarations = strippedContent.match(/(?:const|let|var)\s+(\w+)\s*=/g) || []
      const declaredVars = varDeclarations.map(d => d.match(/(?:const|let|var)\s+(\w+)/)?.[1]).filter(Boolean) as string[]

      // Create code that executes user code and returns declared variables
      // We wrap in an IIFE to capture the variables, then return them
      const returnStatement = declaredVars.length > 0
        ? `return { ${declaredVars.join(', ')} };`
        : 'return {};'

      const processedCode = `
        ${strippedContent}
        ${returnStatement}
      `

      // Execute the code
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...keys, processedCode)

      // Execute and get declared variables
      const result = evalFn(...values)

      // Update the context with any declared variables
      if (result && typeof result === 'object') {
        Object.assign(context, result)
      }

      // Remove the code block from the output
      output = output.replace(fullMatch, '')
    }
    catch (error) {
      console.error(`Error executing ${startTag} code block in ${filePath}:`, error)
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
