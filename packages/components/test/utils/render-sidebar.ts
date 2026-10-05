/**
 * Rendering the sidebar components, instead of reading their source as text.
 *
 * `renders-under-current-stx.test.ts` says why at length: a test that greps a
 * `.stx` file cannot catch a change in the engine, because the source is
 * identical either way. The sidebar suite was the largest group of those --
 * ten files, of which one rendered anything -- and the cost was not
 * hypothetical. `sidebar-header-title.test.ts` reimplemented the component's
 * `titleInChrome` predicate in TypeScript and asserted against the copy; the
 * component later gained a `reserveWindowControls` term, the copy did not, and
 * the file went on passing while describing behaviour the component no longer
 * had.
 *
 * `../../stx/src`, never the package entry: `@stacksjs/stx` resolves to
 * packages/stx/dist, a build that lags the source.
 */
import path from 'node:path'
import { Window } from 'very-happy-dom'
import { processDirectives } from '../../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '../..')
const SIDEBAR_DIR = path.join(ROOT, 'src/ui/sidebar')

/** Render a template against the real sidebar components. */
export async function renderSidebar(template: string): Promise<string> {
  return processDirectives(
    template,
    {},
    path.join(ROOT, 'render-audit.stx'),
    { componentsDir: SIDEBAR_DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/**
 * The markup alone.
 *
 * Page-wide assertions otherwise hit the injected signals runtime, which
 * carries `{{` and `}}` in its own source because it is the thing that
 * evaluates them -- so a "nothing was left unexpanded" check run over the whole
 * document reports two hits on every page and means nothing.
 */
export function markup(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
}

/** Every value of one attribute, in document order. */
export function attrValues(html: string, attribute: string): string[] {
  return [...html.matchAll(new RegExp(`${attribute}="([^"]*)"`, 'g'))].map(match => match[1])
}

/** A parsed document of the markup, for questions about structure. */
export function parse(html: string): Document {
  const window = new Window()
  window.document.body.innerHTML = markup(html)
  return window.document as unknown as Document
}

/** Every element whose own text is exactly `text`. */
export function elementsWithText(doc: Document, text: string): Element[] {
  return [...doc.querySelectorAll('*')].filter(el => el.textContent?.trim() === text && el.children.length === 0)
}

/**
 * The window-drag strip -- the row that carries the window controls.
 *
 * It is identified by the drag region rather than by a class the title happens
 * to have, so a restyle of either row does not change the answer.
 */
export const DRAG_ROW = '[class*="app-region:drag"]'
