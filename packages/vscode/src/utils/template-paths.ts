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

export function getTemplatePathCompletionContext(linePrefix: string): TemplatePathCompletionContext | undefined {
  const component = linePrefix.match(/@(?:component|webcomponent)\s*\(\s*['"`]([^'"`]*)$/)
  if (component)
    return { kind: 'component', path: component[1] }

  const regularInclude = linePrefix.match(/@include(?:If)?\s*\(\s*['"`]([^'"`]*)$/)
  if (regularInclude)
    return { kind: 'include', path: regularInclude[1] }

  const conditionalInclude = linePrefix.match(/@include(?:When|Unless)\s*\([^,]+,\s*['"`]([^'"`]*)$/)
  if (conditionalInclude)
    return { kind: 'include', path: conditionalInclude[1] }

  const firstInclude = linePrefix.match(/@includeFirst\s*\(\s*\[\s*['"`]([^'"`]*)$/)
  if (firstInclude)
    return { kind: 'include', path: firstInclude[1] }

  return undefined
}

function referenceFromMatch(
  match: RegExpExecArray,
  pathGroup: number,
  kind: TemplatePathReference['kind'],
): TemplatePathReference {
  const path = match[pathGroup]
  const start = match.index + match[0].lastIndexOf(path)
  return { kind, path, start, end: start + path.length }
}

/** Find every navigable template path on a line, including includeFirst arrays. */
export function findTemplatePathReferences(line: string): TemplatePathReference[] {
  const references: TemplatePathReference[] = []
  const direct = /@(include|includeIf|component|webcomponent)\s*\(\s*(['"`])([^'"`]+)\2/g
  const conditional = /@include(?:When|Unless)\s*\([^,]+,\s*(['"`])([^'"`]+)\1/g
  const includeFirst = /@includeFirst\s*\(\s*\[([^\]]*)\]/g

  for (const match of line.matchAll(direct))
    references.push(referenceFromMatch(match, 3, match[1] === 'component' || match[1] === 'webcomponent' ? 'component' : 'include'))

  for (const match of line.matchAll(conditional))
    references.push(referenceFromMatch(match, 2, 'include'))

  for (const arrayMatch of line.matchAll(includeFirst)) {
    const contents = arrayMatch[1]
    const contentsStart = arrayMatch.index + arrayMatch[0].indexOf(contents)
    const quotedPath = /(['"`])([^'"`]+)\1/g

    for (const pathMatch of contents.matchAll(quotedPath)) {
      const path = pathMatch[2]
      const start = contentsStart + pathMatch.index + pathMatch[0].indexOf(path)
      references.push({ kind: 'include', path, start, end: start + path.length })
    }
  }

  return references.sort((a, b) => a.start - b.start)
}
