/**
 * Panel orchestration (stacksjs/stx#1747), decoupled from chrome + the DOM: pick
 * a view → request it → render the result (or an error / JSON fallback) → hand
 * the HTML to a sink. `panel.ts` wires the real transport + element to this;
 * keeping it abstract makes the panel's core logic unit-testable.
 */
import type { DevtoolsRequestType, DevtoolsResponse } from './protocol'
import { escapeHtml, filterGraph, renderGraph, renderIfTrace, renderQueries, renderScope, renderStats, renderTree } from './render'

// eslint-disable-next-line ts/no-explicit-any
const RENDERERS: Partial<Record<DevtoolsRequestType, (result: any) => string>> = {
  tree: renderTree,
  graph: renderGraph,
  queries: renderQueries,
  ifTrace: renderIfTrace,
  stats: renderStats,
}

export interface PanelDeps {
  request: (type: DevtoolsRequestType, payload?: Record<string, unknown>) => Promise<DevtoolsResponse>
  /** Receives the rendered HTML for the current view. */
  setHtml: (html: string) => void
}

export interface PanelController {
  /** Switch to a view, fetch it, and render it (becomes the current view). */
  show: (view: DevtoolsRequestType) => Promise<void>
  /** Re-fetch + re-render the current view (used by live refresh). No-op if none. */
  refresh: () => Promise<void>
  /** Drill into one scope: fetch `scope(id)` and render its inspector. */
  inspectScope: (scopeId: string) => Promise<void>
  /** Filter the graph view by signal/scope name; re-renders the cached graph. */
  setGraphFilter: (query: string) => void
  /** The view currently shown, or null before the first `show`. */
  current: () => DevtoolsRequestType | null
}

export function createPanelController(deps: PanelDeps): PanelController {
  let currentView: DevtoolsRequestType | null = null
  let graphFilter = ''
  // eslint-disable-next-line ts/no-explicit-any
  let lastGraph: any = null

  async function render(view: DevtoolsRequestType): Promise<void> {
    let res: DevtoolsResponse
    try {
      res = await deps.request(view)
    }
    catch (e) {
      deps.setHtml(`<p class="empty">error: ${escapeHtml(e instanceof Error ? e.message : String(e))}</p>`)
      return
    }
    if (!res.ok) {
      deps.setHtml(`<p class="empty">error: ${escapeHtml(res.error)}</p>`)
      return
    }
    // Cache the graph so the filter can re-render without re-fetching.
    if (view === 'graph') {
      lastGraph = res.result
      deps.setHtml(renderGraph(filterGraph(lastGraph, graphFilter)))
      return
    }
    const renderer = RENDERERS[view]
    deps.setHtml(renderer ? renderer(res.result) : `<pre>${escapeHtml(JSON.stringify(res.result, null, 2))}</pre>`)
  }

  return {
    async show(view) {
      currentView = view
      await render(view)
    },
    async refresh() {
      if (currentView)
        await render(currentView)
    },
    async inspectScope(scopeId) {
      let res: DevtoolsResponse
      try {
        res = await deps.request('scope', { scopeId })
      }
      catch (e) {
        deps.setHtml(`<p class="empty">error: ${escapeHtml(e instanceof Error ? e.message : String(e))}</p>`)
        return
      }
      // eslint-disable-next-line ts/no-explicit-any
      deps.setHtml(res.ok ? renderScope(res.result as any) : `<p class="empty">error: ${escapeHtml(res.error)}</p>`)
    },
    setGraphFilter(query) {
      graphFilter = query
      // Re-render the cached graph (no re-fetch) if the graph view is showing.
      if (currentView === 'graph' && lastGraph)
        deps.setHtml(renderGraph(filterGraph(lastGraph, graphFilter)))
    },
    current() {
      return currentView
    },
  }
}
