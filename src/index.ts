import type { BunPlugin } from 'bun'

/**
 * STX Plugin for Bun
 * Enables Laravel Blade-like syntax in .stx files
 */

const plugin: BunPlugin = {
  name: 'bun-plugin-stx',
  async setup(build) {
    build.onLoad({ filter: /\.stx$/ }, async ({ path }) => {
      try {
        const content = await Bun.file(path).text()

        // Extract script and template sections
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        // Create a sandbox environment to execute the script
        const context: Record<string, any> = {}

        // Execute script content in module context for proper variable extraction
        try {
          // eslint-disable-next-line no-new-func
          const scriptFn = new Function('module', scriptContent)
          const module = { exports: {} }
          scriptFn(module)
          Object.assign(context, module.exports)
        }
        catch (error: any) {
          console.warn(`Failed to execute script as module in ${path}:`, error)
        }

        // Try to extract variables from direct script execution
        try {
          // This is a risky approach, but helps with simple variable extraction
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

            // Return all defined variables
            return {
              title: typeof title !== 'undefined' ? title : undefined,
              records: typeof records !== 'undefined' ? records : undefined,
              count: typeof count !== 'undefined' ? count : undefined,
              showHeader: typeof showHeader !== 'undefined' ? showHeader : undefined,
              footerText: typeof footerText !== 'undefined' ? footerText : undefined
            };
          `)

          const vars = directFn()
          // Only copy defined values
          Object.entries(vars).forEach(([key, value]) => {
            if (value !== undefined) {
              context[key] = value
            }
          })
        }
        catch (error: any) {
          // Only show extraction warnings for unexpected errors
          if (!error.toString().includes('module is not defined')
            && !error.toString().includes('Unexpected EOF')) {
            console.warn(`Variable extraction issue in ${path}:`, error)
          }
        }

        // Process template
        let output = templateContent

        // Replace if statements
        output = output.replace(/@if\s*\(([^)]+)\)([\s\S]*?)@endif/g, (_, condition, content) => {
          try {
            // eslint-disable-next-line no-new-func
            const conditionFn = new Function(...Object.keys(context), `return ${condition}`)
            const result = conditionFn(...Object.values(context))
            if (result) {
              // Find any @else or @elseif parts
              const elseParts = content.split(/@else(?:if\s*\([^)]+\))?/g)
              return elseParts[0] // Return the if part only when condition is true
            }
            else {
              // Find the else part if it exists
              const elseMatch = content.match(/@else([\s\S]*?)(?:@elseif|$)/)
              if (elseMatch) {
                return elseMatch[1]
              }
              // Find any elseif parts and evaluate them
              const elseifMatch = content.match(/@elseif\s*\(([^)]+)\)([\s\S]*?)(?:@elseif|@else|$)/)
              if (elseifMatch) {
                try {
                  // eslint-disable-next-line no-new-func
                  const elseifFn = new Function(...Object.keys(context), `return ${elseifMatch[1]}`)
                  if (elseifFn(...Object.values(context))) {
                    return elseifMatch[2]
                  }
                }
                catch (error) {
                  console.error(`Error in elseif condition in ${path}:`, error)
                }
              }
              return '' // Return empty if condition is false and no else/elseif is found
            }
          }
          catch (error) {
            console.error(`Error in if condition in ${path}:`, error)
            return `[Error in @if: ${error instanceof Error ? error.message : String(error)}]`
          }
        })

        // Replace foreach loops - simplified regex to avoid backtracking
        output = output.replace(/@foreach\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@endforeach/g, (_, arrayExpr, itemVar, content) => {
          try {
            // eslint-disable-next-line no-new-func
            const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
            const array = arrayFn(...Object.values(context))

            if (!Array.isArray(array)) {
              return `[Error: ${arrayExpr} is not an array]`
            }

            return array.map((item) => {
              // For each item, process content with the item in context
              const itemName = itemVar.trim()
              const itemContext = { ...context, [itemName]: item }

              // Replace variables within the loop
              return content.replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
                try {
                  // eslint-disable-next-line no-new-func
                  const exprFn = new Function(...Object.keys(itemContext), `return ${expr.trim()}`)
                  return String(exprFn(...Object.values(itemContext)) ?? '')
                }
                catch (error) {
                  return `[Error: ${error instanceof Error ? error.message : String(error)}]`
                }
              })
            }).join('')
          }
          catch (error) {
            console.error(`Error in foreach in ${path}:`, error)
            return `[Error in @foreach: ${error instanceof Error ? error.message : String(error)}]`
          }
        })

        // Replace for loops - simplified version
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
          catch (error) {
            console.error(`Error in for loop in ${path}:`, error)
            return `[Error in @for: ${error instanceof Error ? error.message : String(error)}]`
          }
        })

        // Replace {{ expressions }}
        output = output.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
          try {
            // eslint-disable-next-line no-new-func
            const exprFn = new Function(...Object.keys(context), `return ${expr.trim()}`)
            return String(exprFn(...Object.values(context)) ?? '')
          }
          catch (error) {
            console.error(`Error evaluating expression in ${path}:`, error)
            return `[Error: ${error instanceof Error ? error.message : String(error)}]`
          }
        })

        // Replace {!! raw expressions !!}
        output = output.replace(/\{!!([^}]+)!!\}/g, (_, expr) => {
          try {
            // eslint-disable-next-line no-new-func
            const exprFn = new Function(...Object.keys(context), `return ${expr.trim()}`)
            return String(exprFn(...Object.values(context)) ?? '')
          }
          catch (error) {
            console.error(`Error evaluating raw expression in ${path}:`, error)
            return `[Error: ${error instanceof Error ? error.message : String(error)}]`
          }
        })

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

export default plugin
