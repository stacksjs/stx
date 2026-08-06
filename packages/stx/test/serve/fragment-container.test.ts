/**
 * #1853: the SPA swap region was located two different ways.
 *
 * The client uses a CSS selector (router.container, then [data-stx-content],
 * then main). The server ignored it and sliced from the first `<main …>` to the
 * LAST `</main>`, so: a configured container produced a mismatched fragment, a
 * page with two <main> elements swapped the wrong span, and a page with no
 * <main> shipped its whole body and silently lost SPA navigation at HTTP 200.
 */
import { describe, expect, it } from 'bun:test'
import { findContainerRegion, parseContainerSelector } from '../../src/fragment-container'

function inner(html: string, selector?: string): string | null {
  const region = findContainerRegion(html, selector)
  return region ? html.slice(region.start, region.end).trim() : null
}

describe('parseContainerSelector (#1853)', () => {
  it('parses the shapes a swap container actually uses', () => {
    expect(parseContainerSelector('main')).toEqual({ tag: 'main' })
    expect(parseContainerSelector('[data-stx-content]')).toEqual({ attr: 'data-stx-content' })
    expect(parseContainerSelector('#app')).toEqual({ id: 'app' })
    expect(parseContainerSelector('.content')).toEqual({ className: 'content' })
    expect(parseContainerSelector('div[data-stx-content]')).toEqual({ tag: 'div', attr: 'data-stx-content' })
  })

  it('refuses what it cannot honour, rather than approximating', () => {
    // A wrong container is worse than a reported one.
    expect(parseContainerSelector('body > main')).toBeNull()
    expect(parseContainerSelector('main, aside')).toBeNull()
    expect(parseContainerSelector('main:has(.x)')).toBeNull()
    expect(parseContainerSelector('')).toBeNull()
  })
})

describe('findContainerRegion (#1853)', () => {
  it('extracts the inner content of <main> by default', () => {
    const html = '<body><header>chrome</header><main class="x">CONTENT</main></body>'
    expect(inner(html)).toBe('CONTENT')
  })

  it('honours a configured attribute container instead of <main>', () => {
    // Previously this produced a <main>-shaped fragment that the client then
    // injected into a different element, duplicating the chrome.
    const html = '<body><main>WRONG</main><div data-stx-content>RIGHT</div></body>'
    expect(inner(html, '[data-stx-content]')).toBe('RIGHT')
  })

  it('honours an id container', () => {
    expect(inner('<div id="app">RIGHT</div><main>WRONG</main>', '#app')).toBe('RIGHT')
  })

  it('honours a class container, matching whole tokens only', () => {
    const html = '<div class="not-content">NO</div><div class="a content b">YES</div>'
    expect(inner(html, '.content')).toBe('YES')
  })

  it('stops at the FIRST container\'s own close when a page has two', () => {
    // The old lastIndexOf('</main>') swallowed everything between the first
    // open and the second close, chrome included.
    const html = '<main>FIRST</main><aside>CHROME</aside><main>SECOND</main>'
    expect(inner(html)).toBe('FIRST')
  })

  it('handles a container nested inside another of the same name', () => {
    const html = '<main>OUTER<main>INNER</main>TAIL</main>'
    expect(inner(html)).toBe('OUTER<main>INNER</main>TAIL')
  })

  it('returns null when there is no container at all', () => {
    // The caller must be able to tell the difference. Shipping the whole body
    // as a "fragment" is what silently disabled SPA nav on the dashboard.
    expect(findContainerRegion('<body><div>no container</div></body>')).toBeNull()
  })

  it('returns null for unbalanced markup rather than slicing to the end', () => {
    expect(findContainerRegion('<body><main>never closed</body>')).toBeNull()
  })

  it('ignores a self-closing or void element that matches the selector', () => {
    expect(findContainerRegion('<input data-stx-content /><div data-stx-content>OK</div>', '[data-stx-content]')?.tagName).toBe('div')
  })

  it('preserves the container\'s own attributes for the client to reapply', () => {
    const html = '<main class="flex min-h-[100dvh]" data-x="1">C</main>'
    const region = findContainerRegion(html)
    expect(region?.openTag).toBe('<main class="flex min-h-[100dvh]" data-x="1">')
    expect(region?.tagName).toBe('main')
  })

  it('matches an attribute selector with a value', () => {
    const html = '<div data-role="side">NO</div><div data-role="main">YES</div>'
    expect(inner(html, '[data-role=main]')).toBe('YES')
  })

  it('does not match an attribute whose name is a prefix of another', () => {
    const html = '<div data-stx-content-extra>NO</div><div data-stx-content>YES</div>'
    expect(inner(html, '[data-stx-content]')).toBe('YES')
  })
})
