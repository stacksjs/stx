/**
 * Pure panel renderers (stacksjs/stx#1747): protocol data → HTML. Verified
 * without a DOM.
 */
import { describe, expect, it } from 'bun:test'
import { escapeHtml, filterGraph, renderGraph, renderIfTrace, renderMutations, renderQueries, renderScope, renderStats, renderStores, renderTree } from '../src/render'

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
    expect(html).toContain('>6<') // value cell
    expect(renderGraph([])).toContain('No reactive signals')
  })

  it('renderGraph emits a type pill and a subscriber bar', () => {
    const html = renderGraph([{ scopeId: 'G', nodes: [
      { name: 's', type: 'signal', value: 1, setCount: 0, subscribers: 3 },
      { name: 'd', type: 'derived', value: 2, setCount: 0, subscribers: 0 },
    ] }])
    expect(html).toContain('class="pill signal"')
    expect(html).toContain('class="pill derived"')
    expect(html).toContain('class="subbar"')
    expect(html).toContain('width:21px') // 3 subscribers × 7
  })

  it('renderQueries flags failures and rounds ms', () => {
    const ok = renderQueries([{ source: 'useFetch', url: '/a', method: 'GET', status: 200, ok: true, ms: 12.7 }])
    expect(ok).toContain('class="ok"')
    expect(ok).toContain('13') // rounded
    expect(ok).toContain('pill ok') // green status pill
    const err = renderQueries([{ source: 'useQuery', url: '/b', method: 'GET', status: 0, ok: false, ms: 5, error: 'offline' }])
    expect(err).toContain('class="err"')
    expect(err).toContain('pill bad') // red status pill
    expect(err).toContain('offline')
    expect(renderQueries([])).toContain('No queries')
  })

  it('renderIfTrace shows the picked branch', () => {
    const html = renderIfTrace([{ scopeId: 'IF', branches: [':if', ':else'], picked: 0, pickedAttr: ':if' }])
    expect(html).toContain('IF')
    expect(html).toContain(':if · :else')
    expect(html).toContain('#0')
    expect(html).toContain('pill ok') // picked branch highlighted
    const none = renderIfTrace([{ scopeId: null, branches: [':if'], picked: -1 }])
    expect(none).toContain('none')
    expect(none).toContain('pill bad') // no branch matched
  })

  it('renderMutations shows prev → next per change, empty-safe', () => {
    const html = renderMutations([{ name: 'open', scope: 'Drawer', prev: false, next: true }])
    expect(html).toContain('open')
    expect(html).toContain('Drawer')
    expect(html).toContain('→')
    expect(html).toContain('false')
    expect(html).toContain('true')
    expect(renderMutations([])).toContain('No mutations recorded')
  })

  it('renderStores lists stores as click targets, empty-safe', () => {
    const html = renderStores({ cart: true, auth: true })
    expect(html).toContain('data-store="cart"')
    expect(html).toContain('data-store="auth"')
    expect(renderStores({})).toContain('No stores registered')
    expect(renderStores(null)).toContain('No stores registered')
  })

  it('renderStats shows tracking + counters', () => {
    const html = renderStats({ signalSets: 3, effectRuns: 8, tracking: true })
    expect(html).toContain('on')
    expect(html).toContain('3')
    expect(html).toContain('8')
  })

  it('filterGraph matches by signal name, keeps a matching scope whole, drops the rest', () => {
    const graph = [
      { scopeId: 'Cart', nodes: [
        { name: 'items', type: 'signal', value: 0, setCount: 0, subscribers: 0 },
        { name: 'total', type: 'derived', value: 0, setCount: 0, subscribers: 0 },
      ] },
      { scopeId: 'Header', nodes: [{ name: 'query', type: 'signal', value: 0, setCount: 0, subscribers: 0 }] },
    ]
    // by signal name → only matching nodes, scope dropped if none match
    const byNode = filterGraph(graph, 'tot')
    expect(byNode.map(s => s.scopeId)).toEqual(['Cart'])
    expect(byNode[0].nodes.map(n => n.name)).toEqual(['total'])
    // by scope id → that scope kept whole
    const byScope = filterGraph(graph, 'header')
    expect(byScope).toHaveLength(1)
    expect(byScope[0].nodes).toHaveLength(1)
    // empty query → unchanged; no match → empty
    expect(filterGraph(graph, '')).toBe(graph)
    expect(filterGraph(graph, 'zzz')).toEqual([])
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
