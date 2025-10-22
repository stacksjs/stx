import type * as vscode from 'vscode'

/**
 * Match result containing class name and positions
 */
export interface ClassMatch {
  className: string
  start: number
  end: number
}

/**
 * Extract utility classes from a document
 */
export function extractClassesFromDocument(
  document: vscode.TextDocument,
  position?: vscode.Position,
): ClassMatch[] {
  const text = document.getText()
  const matches: ClassMatch[] = []

  // Match class="..." or className="..."
  const classRegex = /class(?:Name)?=["']([^"']*)["']/g
  let match

  while ((match = classRegex.exec(text)) !== null) {
    const classContent = match[1]
    const classStartOffset = match.index + match[0].indexOf(classContent)

    // If position is provided, check if it's within this class attribute
    if (position) {
      const matchStart = document.positionAt(classStartOffset)
      const matchEnd = document.positionAt(classStartOffset + classContent.length)

      if (position.isBefore(matchStart) || position.isAfter(matchEnd))
        continue
    }

    // Split by spaces to get individual classes
    const classes = classContent.split(/\s+/).filter(Boolean)
    let currentOffset = classStartOffset

    for (const className of classes) {
      const classIndex = text.indexOf(className, currentOffset)
      if (classIndex !== -1) {
        matches.push({
          className,
          start: classIndex,
          end: classIndex + className.length,
        })
        currentOffset = classIndex + className.length
      }
    }
  }

  return matches
}

/**
 * Get the utility class at a specific position
 */
export function getClassAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | null {
  const matches = extractClassesFromDocument(document, position)
  const offset = document.offsetAt(position)

  for (const match of matches) {
    if (offset >= match.start && offset <= match.end)
      return match.className
  }

  return null
}

/**
 * Extract classes from a line of text
 */
export function extractClassesFromLine(line: string): string[] {
  const classRegex = /class(?:Name)?=["']([^"']*)["']/g
  const match = classRegex.exec(line)

  if (match && match[1]) {
    return match[1].split(/\s+/).filter(Boolean)
  }

  return []
}
