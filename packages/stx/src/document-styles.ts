import { scanHtmlTags } from './html-masking'

const protectedTags = new Set(['template', 'svg', 'noscript', 'math', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext'])
const styleBoundaryTags = new Set(['head', 'style', ...protectedTags])

/**
 * Put authored page and component CSS before the first body paint.
 * Components are rendered in place, often after a large log or table. Leaving
 * their styles there lets the browser paint the shell before those bytes arrive.
 * Keep template/shadow, SVG and noscript styles in their own rendering context.
 *
 * Each distinct stylesheet is hoisted once. A component's `<style>` is the same
 * for every instance, and only one carrying `data-stx-scoped` was deduplicated:
 * a settings window of six panes shipped its rows' plain stylesheets 92 times,
 * 727 KB for 72 KB of CSS (#2219). Once they all sit in the head, a later
 * identical copy changes nothing but the size of the page.
 */
export function hoistDocumentStyles(html: string): string {
  const tags = scanHtmlTags(html, styleBoundaryTags)
  const headClose = tags.find(tag => tag.closing && tag.name.toLowerCase() === 'head')
  if (!headClose)
    return html

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
      // An implicit @scope root is the style element's parent. Relocating it
      // changes that meaning, so it must remain in its original context.
      if (/@scope\s*\{/.test(html.slice(tag.end, close.start)))
        continue
      ranges.push({ start: tag.start, end: close.end })
      index++
    }
  }
  if (!ranges.length)
    return html

  const seen = new Set<string>()
  const styles = ranges
    .map(range => html.slice(range.start, range.end))
    .filter(style => !seen.has(style) && Boolean(seen.add(style)))
    .join('\n')
  const chunks = [html.slice(0, headClose.start), styles, '\n']
  let cursor = headClose.start
  for (const range of ranges) {
    chunks.push(html.slice(cursor, range.start))
    cursor = range.end
  }
  chunks.push(html.slice(cursor))
  return chunks.join('')
}
