import type { StxOptions, SyntaxHighlightTheme } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { parseFrontmatter, parseMarkdown } from './internal-markdown'
import { createHighlighter } from 'ts-syntax-highlighter'
import { config } from './config'
import { createDetailedErrorMessage, fileExists } from './utils'

// Define a cache for markdown files to avoid repeated file reads
export const markdownCache: Map<string, {
  content: string
  data: Record<string, any>
  updatedAt: number
}> = new Map()

/**
 * Read and parse a markdown file with frontmatter
 * @param filePath Path to the markdown file
 * @param options stx options
 * @returns Object containing parsed content and frontmatter data
 */
export async function readMarkdownFile(
  filePath: string,
  options: StxOptions = {},
): Promise<{ content: string, data: Record<string, any> }> {
  try {
    // Check if the file exists
    if (!await fileExists(filePath)) {
      throw new Error(`Markdown file not found: ${filePath}`)
    }

    // Get file stats to check modification time
    const stats = await fs.promises.stat(filePath)
    const mtime = stats.mtime.getTime()

    // Check cache first if enabled
    if (options.cache && markdownCache.has(filePath)) {
      const cached = markdownCache.get(filePath)!

      // Use cache if it's still valid (file hasn't been modified)
      if (cached.updatedAt >= mtime) {
        return {
          content: cached.content,
          data: cached.data,
        }
      }
    }

    // Read the file using Bun's native file API
    const fileContent = await Bun.file(filePath).text()

    // Parse the content and frontmatter
    const { data, content: markdownContent } = parseFrontmatter(fileContent)

    // Get the markdown configuration
    const markdownConfig = options.markdown || config.markdown || {
      enabled: true,
      syntaxHighlighting: {
        enabled: true,
        serverSide: true,
        defaultTheme: 'github-dark' as SyntaxHighlightTheme,
        highlightUnknownLanguages: true,
      },
    }

    // Parse the markdown content to HTML
    const parsedContent = parseMarkdown(markdownContent, { gfm: true })
    let htmlContent = parsedContent

    // Apply syntax highlighting to code blocks if enabled
    if (markdownConfig.syntaxHighlighting?.enabled && markdownConfig.syntaxHighlighting?.serverSide) {
      // Find all code blocks in the HTML and apply syntax highlighting
      htmlContent = await applyCodeHighlighting(
        htmlContent,
        markdownConfig.syntaxHighlighting?.defaultTheme || 'github-dark',
        markdownConfig.syntaxHighlighting?.highlightUnknownLanguages || false,
      )
    }

    // Prepare the result
    const parsedResult = {
      content: htmlContent,
      data: data || {},
    }

    // Cache the result if caching is enabled
    if (options.cache) {
      markdownCache.set(filePath, {
        ...parsedResult,
        updatedAt: mtime,
      })
    }

    return parsedResult
  }
  catch (error) {
    if (options.debug) {
      console.error(`Error reading/parsing markdown file ${filePath}:`, error)
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorHtml = createDetailedErrorMessage(
      'Markdown File',
      `Error reading/parsing markdown file: ${errorMessage}`,
      filePath,
      '',
      0,
      '',
    )

    return {
      content: errorHtml,
      data: {},
    }
  }
}

// Cache the highlighter instance
let highlighterCache: any = null

/**
 * Apply syntax highlighting to code blocks in HTML content using ts-syntax-highlighter
 */
async function applyCodeHighlighting(html: string, theme: SyntaxHighlightTheme, highlightUnknown: boolean): Promise<string> {
  // Find all code blocks in the HTML
  const codeRegex = /<pre><code( class="language-([^"]+)")?>([^<]+)<\/code><\/pre>/g

  // Initialize highlighter if needed
  if (!highlighterCache) {
    try {
      highlighterCache = await createHighlighter({
        theme: theme || 'github-dark',
        cache: true,
      })
    }
    catch (err) {
      console.error('Failed to initialize ts-syntax-highlighter:', err)
      return html // Return original HTML if we can't initialize the highlighter
    }
  }

  // Function to process each code block match
  const processCodeBlock = async (match: string, languageClass: string, language: string, code: string) => {
    // Unescape HTML entities in the code
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')

    // Determine the language to use
    const langToUse = language || (highlightUnknown ? 'text' : '')

    // If no language specified and auto-detection disabled, return as-is
    if (!langToUse) {
      return match
    }

    try {
      // Use cached highlighter to render the code
      // Check if language is supported, if not return unhighlighted code
      const supportedLanguages = highlighterCache.getSupportedLanguages()
      if (!supportedLanguages.includes(langToUse)) {
        // Return unhighlighted code block for unsupported languages
        return match
      }

      // Generate highlighted HTML
      const result = await highlighterCache.highlight(decodedCode, langToUse, {
        theme,
      })

      // Return the HTML from ts-syntax-highlighter
      return result.html
    }
    catch (err) {
      console.error(`Error highlighting code block with language ${language}:`, err)
    }

    // Return original if highlighting fails
    return match
  }

  // Replace each code block with a highlighted version
  let result = html
  const matches = html.matchAll(codeRegex)

  for (const match of matches) {
    const [fullMatch, languageClass, language, code] = match
    const highlightedBlock = await processCodeBlock(fullMatch, languageClass, language, code)
    result = result.replace(fullMatch, highlightedBlock)
  }

  return result
}

/**
 * Process @markdown-file directive
 * This directive includes markdown files in templates
 */
export async function processMarkdownFileDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string = '',
  options: StxOptions = {},
): Promise<string> {
  const output = template
  // Regex to match @markdown-file('path/to/file.md') directives
  // Fixed regex to avoid super-linear backtracking
  const regex = /@markdown-file\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[^}]*\}))?\)/g

  // Process all matches
  return await replaceAsync(output, regex, async (match, mdFilePath, contextStr, offset) => {
    try {
      // Resolve the markdown file path - relative to the current template
      let resolvedPath = mdFilePath

      // If it's a relative path, resolve it based on the current template's directory
      if (!path.isAbsolute(mdFilePath)) {
        resolvedPath = path.resolve(path.dirname(filePath), mdFilePath)
      }

      // Parse any additional context/props if provided
      let additionalContext: Record<string, any> = {}
      if (contextStr) {
        try {
          // Safely parse JSON using JSON.parse
          // Wrap contextStr in try/catch since it's user-provided and might not be valid JSON
          try {
            additionalContext = JSON.parse(contextStr)
          }
          catch {
            // If it's not valid JSON, it might be a JS object literal
            // Use a safer approach than Function constructor
            if (options.debug) {
              console.warn('Using safer alternative for parsing JS object literal')
            }

            // Use a simple approach without regex to parse the object literal
            // First, clean up the string by removing the braces
            const cleanContextStr = contextStr.replace(/^\s*\{|\}\s*$/g, '').trim()

            // Split by commas that are not inside quotes
            const entries = cleanContextStr.split(/,(?=\s*\w+\s*:)/)

            // Process each entry
            for (const entry of entries) {
              const colonIndex = entry.indexOf(':')
              if (colonIndex > 0) {
                // Extract key (trimming whitespace)
                const key = entry.substring(0, colonIndex).trim()

                // Extract value (trimming whitespace and quotes)
                let value = entry.substring(colonIndex + 1).trim()

                // Remove quotes if present
                const hasDoubleQuotes = value.startsWith('"') && value.endsWith('"')
                const hasSingleQuotes = value.startsWith('\'') && value.endsWith('\'')
                if (hasDoubleQuotes || hasSingleQuotes) {
                  value = value.substring(1, value.length - 1)
                }

                additionalContext[key] = value
              }
            }
          }
        }
        catch (contextError) {
          if (options.debug) {
            console.error(`Error parsing context in @markdown-file directive:`, contextError)
          }
        }
      }

      // Read and parse the markdown file
      const { content, data } = await readMarkdownFile(resolvedPath, options)

      // Merge any frontmatter data into the context for variable substitution
      const mergedContext = {
        ...context,
        ...data,
        ...additionalContext,
      }

      // Process any variables in the HTML content
      let processedContent = content

      // Look for {{ variable }} expressions in the HTML content
      const expressionRegex = /\{\{([^}]+)\}\}/g
      processedContent = processedContent.replace(expressionRegex, (exprMatch, exprKey) => {
        const trimmedKey = exprKey.trim()
        return mergedContext[trimmedKey] !== undefined ? String(mergedContext[trimmedKey]) : exprMatch
      })

      return processedContent
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorHtml = createDetailedErrorMessage(
        'Markdown File',
        `Error including markdown file: ${errorMessage}`,
        filePath,
        template,
        offset,
        match,
      )
      return errorHtml
    }
  })
}

/**
 * Helper function to perform async replacements on strings
 */
async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (
    match: string,
    ...groups: any[]
  ) => Promise<string>,
): Promise<string> {
  // Define the type for our promise results
  interface PromiseResult {
    match: string
    replacement: string
    index: number
  }

  const promises: Promise<PromiseResult>[] = []
  let match

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(str)) !== null) {
    const matchText = match[0]
    const matchIndex = match.index

    // Store the promise with its original match for later replacement
    const args = match as unknown as [string, ...any[]]
    promises.push(
      asyncFn(...args).then(replacement => ({
        match: matchText,
        replacement,
        index: matchIndex,
      })),
    )
  }

  // Wait for all replacements to be processed
  const results = await Promise.all(promises)

  // Sort results by index to replace from end to start (avoid index shifting)
  results.sort((a, b) => b.index - a.index)

  // Create a new string with all replacements
  let result = str
  for (const { match, replacement } of results) {
    result = result.replace(match, replacement)
  }

  return result
}
