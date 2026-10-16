import * as path from 'node:path'

export function normalizeComponentName(input: string): string | undefined {
  const trimmed = input.trim()
  if (!trimmed || !/^[A-Za-z][A-Za-z0-9 _-]*$/.test(trimmed))
    return undefined

  if (/^[A-Z][A-Za-z0-9]*$/.test(trimmed))
    return trimmed

  const words = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)

  return words.map(word => word[0].toUpperCase() + word.slice(1)).join('')
}

export function extractedComponentContent(selection: string): string {
  const lines = selection.replace(/\r\n/g, '\n').split('\n')
  while (lines[0]?.trim() === '') lines.shift()
  while (lines.at(-1)?.trim() === '') lines.pop()

  const indents = lines
    .filter(line => line.trim())
    .map(line => line.match(/^\s*/)?.[0].length ?? 0)
  const commonIndent = indents.length ? Math.min(...indents) : 0
  return `${lines.map(line => line.slice(commonIndent)).join('\n')}\n`
}

export function componentDirectoryForDocument(workspacePath: string, documentPath: string): string {
  const relative = path.relative(workspacePath, documentPath)
  const segments = relative.split(path.sep)

  if (segments[0] === 'resources' && segments[1] === 'views')
    return path.join(workspacePath, 'resources', 'views', 'components')

  if (segments[0] === 'src')
    return path.join(workspacePath, 'src', 'components')

  return path.join(workspacePath, 'components')
}
