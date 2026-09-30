/**
 * Breadcrumb's maxItems budget and its icon prop.
 *
 * Both reported in stacksjs/stx#1999 by an app that had adopted the component
 * across 25 views and was auditing the props it had not used yet.
 */
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const DIR = path.join(ROOT, 'src/ui/breadcrumb')

async function renderBreadcrumb(tag: string): Promise<string> {
  return processDirectives(
    tag,
    {},
    path.join(ROOT, 'breadcrumb-audit.stx'),
    { componentsDir: DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** Markup only: a component ships its own template inside a client script too. */
function markup(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

/**
 * The crumb labels, in order.
 *
 * Counted from list items rather than from the props, because the whole bug
 * was a disagreement between what was asked for and what was rendered.
 */
function crumbs(html: string): string[] {
  return [...markup(html).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
    .map(([, body]) => body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .map(text => text.replace(/\s*\/\s*$/, '').trim())
}

const TRAIL = `[
  { label: 'a', href: '/a' },
  { label: 'b', href: '/b' },
  { label: 'c', href: '/c' },
  { label: 'd', href: '/d' },
  { label: 'e', href: '/e' },
]`

describe('Breadcrumb maxItems renders exactly that many crumbs (#1999)', () => {
  /*
   * The ellipsis was not counted against the budget: the tail was
   * `items.slice(-(maxItems - 1))` taken AFTER the first item, so the result
   * was maxItems + 1 at every setting. maxItems: 2 was the only value that
   * kept its promise, and by coincidence.
   */
  it('collapses a five-item trail to the number asked for', async () => {
    for (const [maxItems, expected] of [[2, 2], [3, 3], [4, 4]] as const) {
      const html = await renderBreadcrumb(`<Breadcrumb :items="${TRAIL}" :maxItems="${maxItems}" />`)

      expect(crumbs(html).length).toBe(expected)
    }
  })

  it('keeps the first crumb, the ellipsis, and the end of the trail', async () => {
    const html = await renderBreadcrumb(`<Breadcrumb :items="${TRAIL}" :maxItems="3" />`)

    expect(crumbs(html)).toEqual(['a', '...', 'e'])
  })

  /*
   * The sharp edge. `-(1 - 1)` is `-0`, and `slice(-0)` is `slice(0)`, so the
   * tail was the WHOLE array: asking for one crumb rendered seven, with `a`
   * appearing both before and after the ellipsis - more than no collapse at
   * all.
   */
  it('renders first + ellipsis at maxItems 1, not the whole trail twice', async () => {
    const html = await renderBreadcrumb(`<Breadcrumb :items="${TRAIL}" :maxItems="1" />`)

    expect(crumbs(html)).toEqual(['a', '...'])
  })

  it('leaves the trail alone when maxItems is off or big enough', async () => {
    for (const maxItems of [0, 5, 9]) {
      const html = await renderBreadcrumb(`<Breadcrumb :items="${TRAIL}" :maxItems="${maxItems}" />`)

      expect(crumbs(html)).toEqual(['a', 'b', 'c', 'd', 'e'])
    }
  })
})

describe('Breadcrumb renders the icon prop (#1999)', () => {
  /*
   * The icon was written into an attribute called `innerHTML`, which is not an
   * HTML attribute and not an stx directive - so the markup landed in the
   * attribute value and the span stayed empty. Silent, and the surrounding
   * `inline-flex gap-1.5` wrapper still reserved the gap, so the label sat
   * with a stray space in front of it.
   */
  /*
   * Unquoted attributes in the icon markup on purpose: a double quote inside
   * a double-quoted `:items` value truncates the attribute before the prop is
   * ever parsed, which is a separate limitation and not what this is about.
   */
  const WITH_ICON = `[
    { label: 'Home', href: '/', icon: '<svg id=firsticon></svg>' },
    { label: 'Now', href: '/now', icon: '<svg id=lasticon></svg>' },
  ]`

  it('puts the icon in the element, not in an attribute', async () => {
    const html = markup(await renderBreadcrumb(`<Breadcrumb :items="${WITH_ICON}" />`))

    expect(html).not.toContain('innerHTML')
    expect(html).toContain('<svg id=firsticon>')
  })

  it('renders it for the current page too, not only for links', async () => {
    const html = markup(await renderBreadcrumb(`<Breadcrumb :items="${WITH_ICON}" />`))

    expect(html).toContain('<svg id=lasticon>')
  })
})
