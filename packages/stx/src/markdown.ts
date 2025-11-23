import { parseMarkdown } from 'ts-md'
import { createDetailedErrorMessage } from './utils'

/**
 * Process markdown directives in templates
 * Converts markdown content to HTML
 */
export async function processMarkdownDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string = '',
): Promise<string> {
  let output = template
  const regex = /@markdown(?:\(([^)]*)\))?([\s\S]*?)@endmarkdown/g

  // Process @markdown directive with closing tag @endmarkdown
  const matches: Array<{
    fullMatch: string
    options: string
    content: string
    index: number
  }> = []

  // First collect all matches to avoid regex issues
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(template)) !== null) {
    matches.push({
      fullMatch: match[0],
      options: match[1] || '',
      content: match[2] || '',
      index: match.index,
    })
  }

  // Process each match
  for (const { fullMatch, options, content, index } of matches) {
    try {
      // Parse options if provided
      const optionsObj: Record<string, boolean> = {}

      if (options) {
        // Handle comma-separated options like @markdown(breaks, gfm)
        options.split(',').forEach((opt: string) => {
          const trimmed = opt.trim()
          if (trimmed)
            optionsObj[trimmed] = true
        })
      }

      // Configure markdown parser with the provided options
      const parserOptions = {
        gfm: optionsObj.gfm ?? true, // GitHub Flavored Markdown
        breaks: optionsObj.breaks ?? false, // Convert line breaks to <br>
      }

      // Render the markdown to HTML
      const html = parseMarkdown(content.trim(), parserOptions)
      output = output.replace(fullMatch, html)
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorHtml = createDetailedErrorMessage(
        'Markdown Directive',
        `Error processing markdown: ${errorMessage}`,
        filePath,
        template,
        index,
        fullMatch,
      )
      output = output.replace(fullMatch, errorHtml)
    }
  }

  return output
}

/**
 * Custom directive handler for markdown
 * Can be registered as a custom directive
 */
export async function markdownDirectiveHandler(
  content: string,
  params: string[],
  _context: Record<string, any>,
  _filePath: string,
): Promise<string> {
  // Configure parser with the provided options
  const options = {
    gfm: true,
    breaks: false,
  }

  // Parse options from parameters
  params.forEach((param) => {
    const trimmed = param.trim().replace(/['"]/g, '')
    if (trimmed === 'breaks')
      options.breaks = true
    if (trimmed === 'no-gfm')
      options.gfm = false
  })

  // Render the markdown to HTML
  return parseMarkdown(content.trim(), options)
}
