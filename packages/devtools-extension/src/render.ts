/**
 * Pure renderers for the DevTools panel (stacksjs/stx#1747): protocol result →
 * HTML string. No DOM dependency, so the panel's view logic is unit-testable
 * without a browser; `panel.ts` just drops the output into an element.
 */

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtValue(v: unknown): string {
  if (typeof v === 'string')
    return escapeHtml(`"${v}"`)
  if (v === null || typeof v !== 'object')
    return escapeHtml(v)
  try {
    return escapeHtml(JSON.stringify(v))
  }
  catch {
    return '[unserializable]'
  }
}

interface TreeNode { scopeId: string, tag?: string, children?: TreeNode[] }

/** Component tree → nested list; each scope id is a click target (`data-scope`). */
export function renderTree(tree: TreeNode[]): string {
  if (!Array.isArray(tree) || tree.length === 0)
    return '<p class="empty">No component scopes on this page.</p>'
  const node = (n: TreeNode): string =>
  `<li><code class="scope-link" data-scope="${escapeHtml(n.scopeId)}">${escapeHtml(n.scopeId)}</code>`
  + `${n.tag ? ` <span class='tag'>&lt;${escapeHtml(n.tag)}&gt;</span>` : ''}`
  + `${n.children && n.children.length ? `<ul>${n.children.map(node).join('')}</ul>` : ''}</li>`
  return `<ul class="tree">${tree.map(node).join('')}</ul>`
}

interface GraphNode { name: string, type: string, value: unknown, setCount: number, subscribers: number }
interface GraphScope { scopeId: string, nodes: GraphNode[] }

/**
 * Filter the reactive graph by a query (case-insensitive). A scope whose id
 * matches is kept whole; otherwise only its signals whose name matches are kept,
 * and a scope with no match is dropped. Empty query → the graph unchanged.
 */
export function filterGraph(graph: GraphScope[], query: string): GraphScope[] {
  const q = (query || '').trim().toLowerCase()
  if (!q || !Array.isArray(graph))
    return graph
  const out: GraphScope[] = []
  for (const scope of graph) {
    if (scope.scopeId.toLowerCase().includes(q)) {
      out.push(scope)
      continue
    }
    const nodes = scope.nodes.filter(n => n.name.toLowerCase().includes(q))
    if (nodes.length > 0)
      out.push({ ...scope, nodes })
  }
  return out
}

/** Reactive graph → per-scope tables of signals (value · set count · subscribers). */
export function renderGraph(graph: GraphScope[]): string {
  if (!Array.isArray(graph) || graph.length === 0)
    return '<p class="empty">No reactive signals tracked.</p>'
  return graph.map(scope =>
  `<section><h3>${escapeHtml(scope.scopeId)}</h3>`
  + `<table><thead><tr><th>signal</th><th>type</th><th>value</th><th>set</th><th>subscribers</th></tr></thead><tbody>`
  + scope.nodes.map((n) => {
    const pill = `<span class="pill ${n.type === 'derived' ? 'derived' : 'signal'}">${escapeHtml(n.type)}</span>`
    // A bar proportional to subscriber count makes "what's heavily depended on"
    // scannable; capped so a hot signal can't blow out the column.
    const barW = Math.min(n.subscribers || 0, 12) * 7
    const subs = `${escapeHtml(n.subscribers)} <span class="subbar" style="width:${barW}px"></span>`
    return `<tr><td><code>${escapeHtml(n.name)}</code></td><td>${pill}</td>`
    + `<td>${fmtValue(n.value)}</td><td>${escapeHtml(n.setCount)}</td><td>${subs}</td></tr>`
  }).join('')
  + `</tbody></table></section>`,
).join('')
}

interface QueryRow { source: string, url: string, method: string, status: number, ok: boolean, ms: number, error?: string }

/** Query timeline → a table (newest last), failures flagged. */
export function renderQueries(queries: QueryRow[]): string {
  if (!Array.isArray(queries) || queries.length === 0)
    return '<p class="empty">No queries recorded (enable tracking, then fetch).</p>'
  return `<table><thead><tr><th>source</th><th>method</th><th>url</th><th>status</th><th>ms</th></tr></thead><tbody>`
  + queries.map((q) => {
    const status = `<span class="pill ${q.ok ? 'ok' : 'bad'}">${q.ok ? escapeHtml(q.status) : escapeHtml(q.error || q.status)}</span>`
    return `<tr class="${q.ok ? 'ok' : 'err'}"><td>${escapeHtml(q.source)}</td><td>${escapeHtml(q.method)}</td>`
    + `<td><code>${escapeHtml(q.url)}</code></td><td>${status}</td>`
    + `<td>${escapeHtml(Math.round(q.ms))}</td></tr>`
  }).join('')
  + `</tbody></table>`
}

interface IfRow { scopeId: string | null, branches: string[], picked: number, pickedAttr?: string | null }

/** :if decision trace → a table of which branch each chain picked. */
export function renderIfTrace(trace: IfRow[]): string {
  if (!Array.isArray(trace) || trace.length === 0)
    return '<p class="empty">No conditional evaluations recorded.</p>'
  return `<table><thead><tr><th>scope</th><th>branches</th><th>picked</th></tr></thead><tbody>`
  + trace.map((t) => {
    const picked = t.picked < 0
      ? '<span class="bad pill">none</span>'
      : `<span class="ok pill">#${escapeHtml(t.picked)} ${escapeHtml(t.pickedAttr || '')}</span>`
    return `<tr><td>${escapeHtml(t.scopeId || '—')}</td><td><code>${escapeHtml((t.branches || []).join(' · '))}</code></td>`
    + `<td>${picked}</td></tr>`
  }).join('')
  + `</tbody></table>`
}

interface ScopeData {
  signals?: Record<string, unknown>
  derived?: Record<string, unknown>
  stores?: Record<string, unknown>
  values?: Record<string, unknown>
  methods?: string[]
}

/** A single scope's inspection (signals · derived · stores · values · methods). */
export function renderScope(scope: ScopeData | null): string {
  if (!scope)
    return '<p class="empty">Scope not found.</p>'
  const table = (title: string, obj?: Record<string, unknown>): string => {
    const entries = Object.entries(obj || {})
    if (entries.length === 0)
      return ''
    return `<h3>${title}</h3><table><tbody>`
    + entries.map(([k, v]) => `<tr><td><code>${escapeHtml(k)}</code></td><td>${fmtValue(v)}</td></tr>`).join('')
    + `</tbody></table>`
  }
  const methods = scope.methods && scope.methods.length
    ? `<h3>methods</h3><p>${scope.methods.map(m => `<code>${escapeHtml(m)}</code>`).join(', ')}</p>`
    : ''
  const out = table('signals', scope.signals) + table('derived', scope.derived)
  + table('stores', scope.stores) + table('values', scope.values) + methods
  return out || '<p class="empty">Empty scope.</p>'
}

/** Registered stores — each id click-to-inspect its state (`data-store`). */
export function renderStores(stores: Record<string, unknown> | null): string {
  const ids = stores ? Object.keys(stores) : []
  if (ids.length === 0)
    return '<p class="empty">No stores registered (defineStore).</p>'
  return `<ul class="tree">${ids.map(id =>
  `<li><code class="scope-link store-link" data-store="${escapeHtml(id)}">${escapeHtml(id)}</code></li>`,
).join('')}</ul>`
}

interface Mutation { name: string, scope: string | null, prev: unknown, next: unknown }

/** State-change log → a table of name · scope · prev → next (newest last). */
export function renderMutations(mutations: Mutation[]): string {
  if (!Array.isArray(mutations) || mutations.length === 0)
    return '<p class="empty">No mutations recorded (enable tracking, then change state).</p>'
  return `<table><thead><tr><th>signal</th><th>scope</th><th>change</th></tr></thead><tbody>`
  + mutations.map(m =>
  `<tr><td><code>${escapeHtml(m.name)}</code></td><td>${escapeHtml(m.scope || '—')}</td>`
  + `<td>${fmtValue(m.prev)} <span class="arrow">→</span> ${fmtValue(m.next)}</td></tr>`,
).join('')
+ `</tbody></table>`
}

interface Stats { signalSets: number, effectRuns: number, tracking: boolean }

/** Global counters. */
export function renderStats(stats: Stats): string {
  return `<dl class="stats">`
  + `<dt>tracking</dt><dd>${stats.tracking ? 'on' : 'off'}</dd>`
  + `<dt>signal sets</dt><dd>${escapeHtml(stats.signalSets)}</dd>`
  + `<dt>effect runs</dt><dd>${escapeHtml(stats.effectRuns)}</dd></dl>`
}
