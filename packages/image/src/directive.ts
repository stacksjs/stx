import type { ImageConfig, ImageTagOptions } from './types'
import { generateImageTag } from './html'

const IMG_DIRECTIVE_REGEX = /@img\(\s*'([^']+)'\s*(?:,\s*(\{[^}]*\}))?\s*\)/g

export function processImageDirective(content: string, config?: ImageConfig): string {
  return content.replace(IMG_DIRECTIVE_REGEX, (_match, src: string, optionsStr?: string) => {
    let options: Partial<ImageTagOptions> = {}

    if (optionsStr) {
      try {
        // Parse the options object — use Function for simple JSON-like objects
        options = JSON.parse(optionsStr.replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":'))
      }
      catch {
        // If JSON parse fails, try simple key-value extraction
        options = parseSimpleOptions(optionsStr)
      }
    }

    const tagOptions: ImageTagOptions = {
      src,
      alt: (options as any).alt ?? '',
      width: (options as any).width,
      height: (options as any).height,
      class: (options as any).class,
      lazy: config?.lazyLoad ?? true,
      placeholder: (options as any).placeholder ?? config?.placeholder ?? 'blur',
      loading: (options as any).loading,
      decoding: (options as any).decoding,
    }

    return generateImageTag(tagOptions)
  })
}

function parseSimpleOptions(str: string): Record<string, any> {
  const result: Record<string, any> = {}
  // Match key: value or key: 'value' patterns
  const kvRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+)|(\w+))/g
  let match: RegExpExecArray | null

  match = kvRegex.exec(str)
  while (match !== null) {
    const key = match[1]
    const value = match[2] ?? match[3] ?? (match[4] ? Number(match[4]) : match[5])
    result[key] = value
    match = kvRegex.exec(str)
  }

  return result
}
