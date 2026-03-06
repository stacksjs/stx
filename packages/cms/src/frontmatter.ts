/**
 * Parse YAML-like frontmatter delimited by --- from content.
 * Supports strings, numbers, booleans, dates, arrays, and simple nested objects.
 */
export function parseFrontmatter(raw: string): { data: Record<string, unknown>, content: string } {
  const trimmed = raw.trimStart()

  if (!trimmed.startsWith('---')) {
    return { data: {}, content: raw }
  }

  const endIndex = trimmed.indexOf('---', 3)
  if (endIndex === -1) {
    return { data: {}, content: raw }
  }

  const frontmatterBlock = trimmed.slice(3, endIndex).trim()
  const content = trimmed.slice(endIndex + 3).replace(/^\r?\n/, '')
  const data: Record<string, unknown> = {}

  if (!frontmatterBlock) {
    return { data, content }
  }

  const lines = frontmatterBlock.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(/^([a-zA-Z_][\w]*):\s*(.*)$/)

    if (!match) {
      i++
      continue
    }

    const key = match[1]
    const rawValue = match[2].trim()

    // Check if next lines are indented (array or nested object)
    if (rawValue === '' && i + 1 < lines.length) {
      const nextLine = lines[i + 1]

      if (nextLine && nextLine.match(/^\s+-\s+/)) {
        // Array
        const arr: unknown[] = []
        i++
        while (i < lines.length && lines[i].match(/^\s+-\s+/)) {
          const itemMatch = lines[i].match(/^\s+-\s+(.*)$/)
          if (itemMatch) {
            arr.push(parseValue(itemMatch[1].trim()))
          }
          i++
        }
        data[key] = arr
        continue
      }
      else if (nextLine && nextLine.match(/^\s+\w+:/)) {
        // Nested object
        const obj: Record<string, unknown> = {}
        i++
        while (i < lines.length && lines[i].match(/^\s+\w+:/)) {
          const nestedMatch = lines[i].match(/^\s+([a-zA-Z_][\w]*):\s*(.*)$/)
          if (nestedMatch) {
            obj[nestedMatch[1]] = parseValue(nestedMatch[2].trim())
          }
          i++
        }
        data[key] = obj
        continue
      }
    }

    data[key] = parseValue(rawValue)
    i++
  }

  return { data, content }
}

function parseValue(raw: string): unknown {
  if (raw === '') return ''
  if (raw === 'true') return true
  if (raw === 'false') return false

  // Quoted string
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
    return raw.slice(1, -1)
  }

  // Date pattern: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00.000Z`)
    if (!Number.isNaN(d.getTime())) return d
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return Number(raw)
  }

  return raw
}

/**
 * Extract an excerpt from content. Returns the first paragraph
 * or the first maxLength characters, whichever is shorter.
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
  const trimmed = content.trim()
  if (!trimmed) return ''

  // Split on double newline to get first paragraph
  const firstParagraph = trimmed.split(/\n\s*\n/)[0].trim()

  if (firstParagraph.length <= maxLength) {
    return firstParagraph
  }

  return `${firstParagraph.slice(0, maxLength)}...`
}
