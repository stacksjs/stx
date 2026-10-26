import { scanAtElementPosition } from './html-masking'

/** Insert only at document markup, never tag-like text in scripts or comments. */
export function insertBeforeDocumentClose(html: string, tag: 'head' | 'body', content: string): string | null {
  const close = new RegExp(`</${tag}\\s*>`, 'iy')
  const match = scanAtElementPosition(html, (source, index) => {
    close.lastIndex = index
    return close.exec(source) ? close.lastIndex : -1
  })[0]
  return match ? html.slice(0, match.start) + content + html.slice(match.start) : null
}
