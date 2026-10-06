/**
 * Rendering a component, instead of reading its source as text.
 *
 * `render-sidebar.ts` says why at length for the sidebar group; this is the
 * same helper widened to the whole library, for the suites that ask what the
 * BROWSER receives -- accessibility above all.
 *
 * A grep for `aria-expanded` in a `.stx` file passes when the attribute sits in
 * a branch that never runs, in a commented-out block, or on an element the
 * engine strips. The rendered document is the only place the question "does a
 * screen reader see this" can actually be asked.
 *
 * `../../stx/src`, never the package entry: `@stacksjs/stx` resolves to
 * packages/stx/dist, a build that lags the source.
 */
import path from 'node:path'
import { Window } from 'very-happy-dom'
import { processDirectives } from '../../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '../..')
const UI_DIR = path.join(ROOT, 'src/ui')

/** Render a template against the real component library. */
export async function render(template: string): Promise<string> {
  return processDirectives(
    template,
    {},
    path.join(ROOT, 'render-audit.stx'),
    { componentsDir: UI_DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** The markup alone -- without the injected runtime, which carries its own `{{`. */
export function markup(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
}

/** A parsed document of the markup, for questions about structure. */
export function parse(html: string): Document {
  const window = new Window()
  window.document.body.innerHTML = markup(html)
  return window.document as unknown as Document
}

/**
 * Every `aria-*` attribute the component exposes, bound ones included.
 *
 * A reactive binding stays as `:aria-checked="isChecked() ? …"` in the server
 * output and is applied by the signals runtime on hydration, so counting only
 * the static spelling reports `role="switch"` with no `aria-checked` -- a WCAG
 * 4.1.2 failure the component does not actually have. Normalised to the plain
 * name so a requirement can be satisfied either way.
 */
export function ariaAttributes(html: string): string[] {
  return [...new Set([...markup(html).matchAll(/[\s:](aria-[\w-]+)=/g)].map(m => m[1]))].sort()
}

/** Every `role` value present in the rendered markup. */
export function roles(html: string): string[] {
  return [...new Set([...markup(html).matchAll(/\srole="([^"]*)"/g)].map(m => m[1]))].sort()
}
