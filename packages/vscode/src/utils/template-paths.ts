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

export interface TemplatePathReference extends TemplatePathCompletionContext {
  start: number
  end: number
}

type TemplateDirectiveName = 'include' | 'includeIf' | 'includeWhen' | 'includeUnless' | 'includeFirst' | 'component' | 'webcomponent'

const TEMPLATE_DIRECTIVE_PATTERN = /@(includeFirst|includeUnless|includeWhen|includeIf|include|webcomponent|component)\s*\(/g

function argumentStart(source: string, openParen: number, targetArgument: number): number | undefined {
  if (targetArgument === 0)
    return openParen + 1

  let argument = 0
  let depth = 0
  let quote = ''

  for (let index = openParen + 1; index < source.length; index++) {
    const character = source[index]

    if (quote) {
      if (character === '\\')
        index++
      else if (character === quote)
        quote = ''
      continue
    }

    if (character === '\'' || character === '"' || character === '`') {
      quote = character
    }
    else if (character === '(' || character === '[' || character === '{') {
      depth++
    }
    else if (character === ')' || character === ']' || character === '}') {
      if (character === ')' && depth === 0)
        return undefined
      depth--
    }
    else if (character === ',' && depth === 0) {
      argument++
      if (argument === targetArgument)
        return index + 1
    }
  }

  return undefined
}

function quotedReferences(source: string, start: number, end = source.length): Array<Pick<TemplatePathReference, 'path' | 'start' | 'end'>> {
  const references: Array<Pick<TemplatePathReference, 'path' | 'start' | 'end'>> = []

  for (let index = start; index < end; index++) {
    const quote = source[index]
    if (quote !== '\'' && quote !== '"' && quote !== '`')
      continue

    const pathStart = index + 1
    let pathEnd = pathStart
    while (pathEnd < end && source[pathEnd] !== quote) {
      if (source[pathEnd] === '\\')
        pathEnd++
      pathEnd++
    }

    if (pathEnd < end) {
      references.push({ path: source.slice(pathStart, pathEnd), start: pathStart, end: pathEnd })
      index = pathEnd
    }
  }

  return references
}

export function getTemplatePathCompletionContext(linePrefix: string): TemplatePathCompletionContext | undefined {
  TEMPLATE_DIRECTIVE_PATTERN.lastIndex = 0
  const directives = [...linePrefix.matchAll(TEMPLATE_DIRECTIVE_PATTERN)]
  const directive = directives.at(-1)
  if (!directive)
    return undefined

  const name = directive[1] as TemplateDirectiveName
  const openParen = directive.index + directive[0].lastIndexOf('(')
  const targetArgument = name === 'includeWhen' || name === 'includeUnless' ? 1 : 0
  const start = argumentStart(linePrefix, openParen, targetArgument)
  if (start === undefined)
    return undefined

  const argument = linePrefix.slice(start)
  const pathMatch = name === 'includeFirst'
    ? argument.match(/\[[\s\S]*['"`]([^'"`]*)$/)
    : argument.match(/^\s*['"`]([^'"`]*)$/)

  return pathMatch
    ? { kind: name === 'component' || name === 'webcomponent' ? 'component' : 'include', path: pathMatch[1] }
    : undefined
}

/** Find every navigable template path on a line, including includeFirst arrays. */
export function findTemplatePathReferences(line: string): TemplatePathReference[] {
  const references: TemplatePathReference[] = []
  TEMPLATE_DIRECTIVE_PATTERN.lastIndex = 0

  for (const directive of line.matchAll(TEMPLATE_DIRECTIVE_PATTERN)) {
    const name = directive[1] as TemplateDirectiveName
    const openParen = directive.index + directive[0].lastIndexOf('(')
    const targetArgument = name === 'includeWhen' || name === 'includeUnless' ? 1 : 0
    const start = argumentStart(line, openParen, targetArgument)
    if (start === undefined)
      continue

    const kind = name === 'component' || name === 'webcomponent' ? 'component' : 'include'
    const candidates = name === 'includeFirst'
      ? quotedReferences(line, line.indexOf('[', start) + 1, line.indexOf(']', start))
      : quotedReferences(line, start).slice(0, 1)

    for (const candidate of candidates)
      references.push({ kind, ...candidate })
  }

  return references.sort((a, b) => a.start - b.start)
}
