/**
 * Markdown files as first-class stx templates.
 *
 * A `.md` file renders like a `.stx` one: its frontmatter becomes context, its
 * body becomes HTML, and stx syntax inside it - expressions, directives,
 * components - works exactly as it does in a template. This is the arrangement
 * VitePress popularised with Vue, minus Vue.
 *
 * The order is markdown first, stx second. Markdown converts to HTML, and the
 * result is then processed as an stx template, so a component written in prose
 * survives the conversion as an unknown tag and is resolved afterwards by the
 * normal component pass.
 *
 * The whole difficulty is code blocks. Documentation is mostly *about* syntax,
 * so a page explaining `{{ name }}` or `@if` will contain those sequences in
 * fenced blocks - and a naive pipeline evaluates them, so the documentation for
 * a feature is the input most likely to break it. Every code block is therefore
 * wrapped in `@raw` before the stx pass, which is what makes documenting stx in
 * markdown possible at all.
 */

import { parseFrontmatter, parseMarkdown } from './internal-markdown'

/** Converts markdown source to HTML. */
export type MarkdownRenderer = (source: string) => string | Promise<string>

export interface MarkdownViewOptions {
  /**
   * Renderer to use instead of the built-in one.
   *
   * Exists so a docs site can supply its own - bunpress, for instance, whose
   * output carries the anchors, syntax highlighting and container blocks a
   * documentation site expects. stx keeps a working default so it has no
   * dependency on any of them.
   */
  renderer?: MarkdownRenderer
}

export interface MarkdownView {
  /** HTML ready for the stx pipeline, with code blocks protected. */
  html: string
  /** Frontmatter, to be merged into the render context. */
  frontmatter: Record<string, any>
}

/** Whether a path should be treated as a markdown view. */
export function isMarkdownPath(filePath: string): boolean {
  return filePath.endsWith('.md') || filePath.endsWith('.markdown')
}

/**
 * Wrap code blocks so the stx pass leaves their contents alone.
 *
 * Applies to `<pre>` (fenced blocks) and to any `<code>` not already inside
 * one (inline spans). Without this, a page documenting a directive executes it.
 */
export function protectCodeBlocks(html: string): string {
  const protectedRanges: Array<{ start: number, end: number }> = []

  // `<pre>` first, and inline `<code>` is only considered outside those ranges,
  // so a `<code>` nested in a `<pre>` is not wrapped twice.
  collect(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi)
  const preRanges = [...protectedRanges]
  collect(/<code\b[^>]*>[\s\S]*?<\/code>/gi, preRanges)

  function collect(re: RegExp, skipWithin?: Array<{ start: number, end: number }>) {
    let m: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(html)) !== null) {
      const start = m.index
      const end = start + m[0].length
      if (skipWithin?.some(r => start >= r.start && end <= r.end)) continue
      protectedRanges.push({ start, end })
    }
  }

  if (protectedRanges.length === 0) return html

  protectedRanges.sort((a, b) => a.start - b.start)

  let out = ''
  let cursor = 0
  for (const range of protectedRanges) {
    // Overlaps would emit the same bytes twice; ranges are disjoint by
    // construction, and this keeps that true if the patterns ever change.
    if (range.start < cursor) continue
    out += html.slice(cursor, range.start)
    out += `@raw${html.slice(range.start, range.end)}@endraw`
    cursor = range.end
  }
  out += html.slice(cursor)
  return out
}

/**
 * Turn markdown source into HTML the stx pipeline can process.
 *
 * Frontmatter is returned rather than injected, so the caller decides how it
 * merges with the rest of the render context.
 */
export async function renderMarkdownView(
  source: string,
  options: MarkdownViewOptions = {},
): Promise<MarkdownView> {
  const { data, content } = parseFrontmatter(source)

  const render = options.renderer ?? ((md: string) => parseMarkdown(md))
  const html = await render(content)

  return {
    html: protectCodeBlocks(html),
    frontmatter: (data ?? {}) as Record<string, any>,
  }
}
