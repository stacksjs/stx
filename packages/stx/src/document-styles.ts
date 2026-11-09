import { scanHtmlTags } from './html-masking'

/**
 * Put authored page and component CSS before the first body paint.
 * Components are rendered in place, often after a large log or table. Leaving
 * their styles there lets the browser paint the shell before those bytes arrive.
 * Keep template/shadow, SVG and noscript styles in their own rendering context.
 */
export function hoistDocumentStyles(html: string): string {
  const tags = scanHtmlTags(html)
  const headClose = tags.find(tag => tag.closing && tag.name.toLowerCase() === 'head')
  if (!headClose)
    return html

  const protectedTags = new Set(['template', 'svg', 'noscript', 'math'])
  let protectedDepth = 0
  const ranges: { start: number, end: number }[] = []
  for (let index = 0; index < tags.length; index++) {
    const tag = tags[index]
    if (tag.start < headClose.end)
      continue
    const name = tag.name.toLowerCase()
    if (protectedTags.has(name)) {
      protectedDepth = Math.max(0, protectedDepth + (tag.closing ? -1 : tag.selfClosing ? 0 : 1))
      continue
    }
    if (name !== 'style' || tag.closing || protectedDepth > 0)
      continue
    const close = tags[index + 1]
    if (close?.name.toLowerCase() === 'style' && close.closing) {
      ranges.push({ start: tag.start, end: close.end })
      index++
    }
  }
  if (!ranges.length)
    return html

  const styles = ranges.map(range => html.slice(range.start, range.end)).join('\n')
  const chunks = [html.slice(0, headClose.start), styles, '\n']
  let cursor = headClose.start
  for (const range of ranges) {
    chunks.push(html.slice(cursor, range.start))
    cursor = range.end
  }
  chunks.push(html.slice(cursor))
  return chunks.join('')
}
