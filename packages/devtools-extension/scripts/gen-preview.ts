/**
 * Generate a standalone preview of the DevTools panel — every view rendered with
 * mock data via the real renderers, in the panel's dark theme. Openable in any
 * browser (or screenshot headlessly) to see/iterate the UI without installing
 * the extension. `bun scripts/gen-preview.ts [outFile]`.
 */
import { renderGraph, renderIfTrace, renderQueries, renderScope, renderStats, renderStores, renderTree } from '../src/render'

const tree = [
  { scopeId: 'AppShell', tag: 'div', children: [
    { scopeId: 'Header', tag: 'header', children: [] },
    { scopeId: 'CartDrawer', tag: 'aside', children: [
      { scopeId: 'CartItem', tag: 'li', children: [] },
    ] },
  ] },
  { scopeId: 'Footer', tag: 'footer', children: [] },
]

const graph = [
  { scopeId: 'CartDrawer', nodes: [
    { name: 'items', type: 'signal', value: [{ id: 1 }, { id: 2 }, { id: 3 }], setCount: 7, subscribers: 4 },
    { name: 'total', type: 'derived', value: 59.97, setCount: 0, subscribers: 2 },
    { name: 'open', type: 'signal', value: true, setCount: 12, subscribers: 1 },
  ] },
  { scopeId: 'Header', nodes: [
    { name: 'query', type: 'signal', value: 'shoes', setCount: 23, subscribers: 3 },
  ] },
]

const queries = [
  { source: 'useFetch', url: '/api/products?q=shoes', method: 'GET', status: 200, ok: true, ms: 84.3 },
  { source: 'useQuery', url: '/api/cart', method: 'GET', status: 200, ok: true, ms: 41.1 },
  { source: 'useMutation', url: '/api/cart/add', method: 'POST', status: 201, ok: true, ms: 120.6 },
  { source: 'useFetch', url: '/api/reviews/16', method: 'GET', status: 0, ok: false, ms: 5002, error: 'timed out' },
]

const ifTrace = [
  { scopeId: 'CartDrawer', branches: [':if', ':else'], picked: 0, pickedAttr: ':if' },
  { scopeId: 'Header', branches: [':if', ':else-if', ':else'], picked: 2, pickedAttr: ':else' },
  { scopeId: 'CartItem', branches: [':if'], picked: -1, pickedAttr: null },
]

const stats = { signalSets: 42, effectRuns: 117, tracking: true }

const scope = {
  signals: { items: [{ id: 1 }, { id: 2 }], open: true },
  derived: { total: 59.97 },
  values: { currency: 'USD' },
  methods: ['add', 'remove', 'clear'],
}

const CSS = `
  body { font: 12px/1.5 ui-monospace, monospace; margin: 0; color: #ddd; background: #1e1e1e; }
  h2 { color: #4ec9b0; font-size: 12px; margin: 16px 8px 4px; padding-top: 8px; border-top: 1px solid #333; }
  .out { padding: 4px 8px 8px; }
  code { color: #9cdcfe; }
  .scope-link { cursor: pointer; text-decoration: underline dotted; }
  .tag { color: #888; }
  .empty { color: #888; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
  th, td { text-align: left; padding: 2px 8px; border-bottom: 1px solid #2d2d2d; }
  th { color: #888; font-weight: normal; }
  tr.err td { color: #f48771; }
  ul.tree, ul.tree ul { list-style: none; margin: 0; padding-left: 14px; }
  h3 { margin: 8px 0 4px; color: #4ec9b0; font-size: 12px; }
  dl.stats { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; max-width: 240px; }
  dl.stats dt { color: #888; }
  .subbar { display: inline-block; height: 8px; background: #4ec9b0; border-radius: 2px; vertical-align: middle; }
  .pill { display: inline-block; padding: 0 6px; border-radius: 8px; font-size: 11px; }
  .pill.signal { background: #264f78; color: #9cdcfe; }
  .pill.derived { background: #3a3d2a; color: #c5cea0; }
  .pill.ok { background: #213e2a; color: #89d185; }
  .pill.bad { background: #4a2326; color: #f48771; }
`

const views: [string, string][] = [
  ['Tree', renderTree(tree)],
  ['Graph', renderGraph(graph)],
  ['Queries', renderQueries(queries)],
  ['If Trace', renderIfTrace(ifTrace)],
  ['Stats', renderStats(stats)],
  ['Scope (CartDrawer)', renderScope(scope)],
  ['Stores', renderStores({ cart: true, auth: true, theme: true })],
  ['Store (cart) — state', renderScope({ signals: { items: [{ id: 1 }, { id: 2 }], open: true }, derived: { total: 59.97, count: 2 }, methods: ['add', 'remove', 'clear'] })],
]

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Stacks DevTools — preview</title><style>${CSS}</style></head>
<body>${views.map(([t, h]) => `<h2>${t}</h2><div class="out">${h}</div>`).join('\n')}</body></html>`

const outFile = process.argv[2] || `${import.meta.dir}/../preview.html`
await Bun.write(outFile, html)
// eslint-disable-next-line no-console
console.log(`wrote ${outFile}`)
