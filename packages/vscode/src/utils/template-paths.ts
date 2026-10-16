export const TEMPLATE_SEARCH_DIRECTORIES = [
  '',
  'views',
  'templates',
  'resources/views',
  'resources/templates',
  'src/views',
  'src/templates',
  'app/views',
  'partials',
  'components',
  'layouts',
  'examples/partials',
  'examples/components',
] as const

export const COMPONENT_SEARCH_DIRECTORIES = [
  'components',
  'resources/views/components',
  'src/components',
  'app/components',
  'ui',
  'src/ui',
] as const

export interface TemplatePathCompletionContext {
  kind: 'include' | 'component'
  path: string
}

export function getTemplatePathCompletionContext(linePrefix: string): TemplatePathCompletionContext | undefined {
  const component = linePrefix.match(/@(?:component|webcomponent)\s*\(\s*['"`]([^'"`]*)$/)
  if (component)
    return { kind: 'component', path: component[1] }

  const regularInclude = linePrefix.match(/@include\s*\(\s*['"`]([^'"`]*)$/)
  if (regularInclude)
    return { kind: 'include', path: regularInclude[1] }

  const conditionalInclude = linePrefix.match(/@include(?:If|When|Unless)\s*\([^,]+,\s*['"`]([^'"`]*)$/)
  if (conditionalInclude)
    return { kind: 'include', path: conditionalInclude[1] }

  const firstInclude = linePrefix.match(/@includeFirst\s*\(\s*\[\s*['"`]([^'"`]*)$/)
  if (firstInclude)
    return { kind: 'include', path: firstInclude[1] }

  return undefined
}
