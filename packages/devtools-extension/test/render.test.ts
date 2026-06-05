/**
 * Pure panel renderers (stacksjs/stx#1747): protocol data → HTML. Verified
 * without a DOM.
 */
import { describe, expect, it } from 'bun:test'
import { escapeHtml, renderGraph, renderIfTrace, renderQueries, renderScope, renderStats, renderTree } from '../src/render'

describe('panel renderers', () => {
  it('escapeHtml neutralizes markup', () => {
    expect(escapeHtml('<b>&"')).toBe('&lt;b&gt;&amp;&quot;')
  })

  it('renderTree nests scopes and is empty-safe', () => {
    const html = renderTree([{ scopeId: 'Outer', tag: 'div', children: [{ scopeId: 'Inner', tag: 'section' }] }])
    expect(html).toContain('Outer')
    expect(html).toContain('Inner')
    expect(html).toContain('&lt;div&gt;')
    expect(renderTree([])).toContain('No component scopes')
  })

  it('renderTree makes each scope id a click target (data-scope)', () => {
    const html = renderTree([{ scopeId: 'Cart', tag: 'div', children: [] }])
    expect(html).toContain('class="scope-link" data-scope="Cart"')
  })

  it('renderGraph tabulates signals with value/setCount/subscribers', () => {
    const html = renderGraph([{ scopeId: 'G', nodes: [{ name: 'count', type: 'signal', value: 6, setCount: 3, subscribers: 2 }] }])
    expect(html).toContain('G')
    expect(html).toContain('count')
    expect(html).toContain('signal')
    expect(html).toContain('>6<') // value cell
    expect(renderGraph([])).toContain('No reactive signals')
  })

  it('renderQueries flags failures and rounds ms', () => {
    const ok = renderQueries([{ source: 'useFetch', url: '/a', method: 'GET', status: 200, ok: true, ms: 12.7 }])
    expect(ok).toContain('class="ok"')
    expect(ok).toContain('13') // rounded
    const err = renderQueries([{ source: 'useQuery', url: '/b', method: 'GET', status: 0, ok: false, ms: 5, error: 'offline' }])
    expect(err).toContain('class="err"')
    expect(err).toContain('offline')
    expect(renderQueries([])).toContain('No queries')
  })

  it('renderIfTrace shows the picked branch', () => {
    const html = renderIfTrace([{ scopeId: 'IF', branches: [':if', ':else'], picked: 0, pickedAttr: ':if' }])
    expect(html).toContain('IF')
    expect(html).toContain(':if · :else')
    expect(html).toContain('#0')
    expect(renderIfTrace([{ scopeId: null, branches: [':if'], picked: -1 }])).toContain('none')
  })

  it('renderStats shows tracking + counters', () => {
    const html = renderStats({ signalSets: 3, effectRuns: 8, tracking: true })
    expect(html).toContain('on')
    expect(html).toContain('3')
    expect(html).toContain('8')
  })

  it('renderScope groups signals/derived/values/methods, empty-safe', () => {
    const html = renderScope({ signals: { n: 1 }, derived: { d: 2 }, values: { label: 'hi' }, methods: ['submit'] })
    expect(html).toContain('signals')
    expect(html).toContain('n')
    expect(html).toContain('derived')
    expect(html).toContain('submit')
    expect(renderScope(null)).toContain('Scope not found')
    expect(renderScope({})).toContain('Empty scope')
  })

  it('escapes hostile content from the inspected page (no injection)', () => {
    const html = renderQueries([{ source: 'useFetch', url: '/x"><img src=x onerror=alert(1)>', method: 'GET', status: 200, ok: true, ms: 1 }])
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })
})
