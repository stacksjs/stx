import type { CustomDirective, StreamingConfig, StreamRenderer, StxOptions } from './types'
import path from 'node:path'
import { defaultConfig } from './config'
import { processDirectives } from './process'
import { createDetailedErrorMessage, extractVariables } from './utils'

/**
 * Default streaming configuration
 */
const defaultStreamingConfig: StreamingConfig = {
  enabled: true,
  bufferSize: 1024 * 16, // 16KB chunks
  strategy: 'auto',
  timeout: 30000, // 30 seconds
}

/**
 * Section regex pattern to extract sections from templates
 */
const SECTION_PATTERN = /<!-- @section:([\w-]+) -->([\s\S]*?)<!-- @endsection:\1 -->/g

/**
 * Stream a template with data
 * @param templatePath Path to the template
 * @param data Data to render with the template
 * @param options stx options
 */
export async function streamTemplate(
  templatePath: string,
  data: Record<string, any> = {},
  options: StxOptions = {},
): Promise<ReadableStream<string>> {
  const fullOptions = {
    ...defaultConfig,
    ...options,
    streaming: {
      ...defaultStreamingConfig,
      ...options.streaming,
    },
  }

  // Create a ReadableStream
  return new ReadableStream<string>({
    async start(controller) {
      try {
        // Read the template file
        const content = await Bun.file(templatePath).text()

        // Extract script content
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        // Create context with data
        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        // Extract variables from script
        await extractVariables(scriptContent, context, templatePath)

        // Process template with directives
        const dependencies = new Set<string>()
        const output = await processDirectives(templateContent, context, templatePath, fullOptions, dependencies)

        // Enqueue the processed template
        controller.enqueue(output)

        // Close the stream
        controller.close()
      }
      catch (error: any) {
        controller.error(error)
      }
    },
  })
}

/**
 * Create a stream renderer for progressive loading
 * @param templatePath Path to the template
 * @param options stx options
 */
export async function createStreamRenderer(
  templatePath: string,
  options: StxOptions = {},
): Promise<StreamRenderer> {
  const fullOptions = {
    ...defaultConfig,
    ...options,
    streaming: {
      ...defaultStreamingConfig,
      ...options.streaming,
    },
  }

  // Read the template file
  const content = await Bun.file(templatePath).text()

  // Extract script and template sections
  const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

  // Store template original content
  const originalTemplate = templateContent

  // Extract sections from the template
  const sections: Record<string, string> = {}
  let match

  // Reset the regex
  SECTION_PATTERN.lastIndex = 0

  // Extract all sections
  // eslint-disable-next-line no-cond-assign
  while ((match = SECTION_PATTERN.exec(templateContent)) !== null) {
    const sectionName = match[1]
    const sectionContent = match[2]
    sections[sectionName] = sectionContent
  }

  // Replace all sections with placeholders to create the shell
  const shellTemplate = templateContent.replace(SECTION_PATTERN, '')

  // Create the stream renderer
  const renderer: StreamRenderer = {
    // Render the shell (initial HTML)
    renderShell: async (data: Record<string, any> = {}): Promise<string> => {
      // Create context with data
      const context: Record<string, any> = {
        ...data,
        __filename: templatePath,
        __dirname: path.dirname(templatePath),
      }

      // Extract variables from script
      await extractVariables(scriptContent, context, templatePath)

      // Process shell template
      const dependencies = new Set<string>()
      return processDirectives(shellTemplate, context, templatePath, fullOptions, dependencies)
    },

    // Render a specific section
    renderSection: async (sectionName: string, data: Record<string, any> = {}): Promise<string> => {
      try {
        if (!sections[sectionName]) {
          return `<div class="error-message">Section "${sectionName}" not found in template "${templatePath}"</div>`
        }

        // Create context with data
        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        // Extract variables from script (though we might already have done this in renderShell)
        await extractVariables(scriptContent, context, templatePath)

        // Process section template
        const dependencies = new Set<string>()
        return await processDirectives(sections[sectionName], context, templatePath, fullOptions, dependencies)
      }
      catch (error: any) {
        // Handle errors gracefully
        const errorMessage = error instanceof Error ? error.message : String(error)
        return createDetailedErrorMessage(
          'Expression',
          errorMessage,
          templatePath,
          sections[sectionName] || '',
          0,
          sections[sectionName] || '',
        )
      }
    },

    // Get all section names
    getSections: (): string[] => {
      return Object.keys(sections)
    },

    // Get the original template content
    getTemplate: (): string => {
      return originalTemplate
    },
  }

  return renderer
}

/**
 * Custom directive for creating islands (for partial hydration)
 */
export const islandDirective: CustomDirective = {
  name: 'island',
  hasEndTag: true,
  handler: (content: string, params: string[], _context: Record<string, any>, _filePath: string): string => {
    if (!params || params.length === 0) {
      throw new Error('Island directive requires a name parameter')
    }

    const islandName = params[0].replace(/['"`]/g, '') // Remove quotes
    const priority = params[1] ? params[1].replace(/['"`]/g, '') : 'lazy'
    const id = `island-${islandName}-${Math.random().toString(36).substring(2, 9)}`

    // Extract props from content (if any)
    const propsMatch = content.match(/<script\s+props\s*>([\s\S]*?)<\/script>/i)
    const propsScript = propsMatch ? propsMatch[1].trim() : ''

    // Remove props script from content if found
    const contentWithoutProps = propsMatch
      ? content.replace(propsMatch[0], '')
      : content

    // Create hydration wrapper
    return `<div data-island="${islandName}" data-island-id="${id}" data-priority="${priority}">
      ${contentWithoutProps}
      <script type="application/json" data-island-props="${id}">
        ${propsScript ? `{${propsScript}}` : '{}'}
      </script>
    </div>`
  },
}

/**
 * Register streaming and hydration directives
 */
export function registerStreamingDirectives(options: StxOptions = {}): CustomDirective[] {
  const directives: CustomDirective[] = []

  // Add hydration directives if enabled
  if (options.hydration?.enabled) {
    directives.push(islandDirective)
  }

  return directives
}

/**
 * Process section directives
 * @param content Template content
 * @param context Data context
 * @param filePath Template file path
 * @param _options stx options
 */
export async function processSectionDirectives(
  content: string,
  context: Record<string, any>,
  filePath: string,
  _options: StxOptions = {},
): Promise<string> {
  // Just extract sections for now, actual processing is done by the stream renderer
  return content
}
