import { parseMarkdown } from './internal-markdown'
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

  // Process @markdown directive with balanced @markdown/@endmarkdown matching
  const matches: Array<{
    fullMatch: string
    options: string
    content: string
    index: number
  }> = []

  // Find @markdown blocks using balanced depth tracking
  const mdOpenRe = /@markdown(?:\([^)]*\))?/g
  let mdMatch: RegExpExecArray | null
  while ((mdMatch = mdOpenRe.exec(template)) !== null) {
    const startIdx = mdMatch.index
    const optMatch = mdMatch[0].match(/@markdown\(([^)]*)\)/)
    const options = optMatch ? optMatch[1] : ''
    const contentStart = startIdx + mdMatch[0].length

    // Find matching @endmarkdown using depth tracking
    let depth = 1
    let searchPos = contentStart
    let endPos = -1
    while (depth > 0 && searchPos < template.length) {
      const nextOpen = template.indexOf('@markdown', searchPos)
      const nextClose = template.indexOf('@endmarkdown', searchPos)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose && nextOpen !== startIdx) {
        // Check it's actually a directive (not text)
        const charAfter = template[nextOpen + '@markdown'.length]
        if (charAfter === '(' || charAfter === '\n' || charAfter === '\r' || charAfter === ' ' || charAfter === undefined) {
          depth++
        }
        searchPos = nextOpen + '@markdown'.length
      } else {
        depth--
        if (depth === 0) { endPos = nextClose; break }
        searchPos = nextClose + '@endmarkdown'.length
      }
    }
    if (endPos === -1) continue

    const content = template.slice(contentStart, endPos)
    const fullMatch = template.slice(startIdx, endPos + '@endmarkdown'.length)

    matches.push({ fullMatch, options, content, index: startIdx })
    mdOpenRe.lastIndex = endPos + '@endmarkdown'.length
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
