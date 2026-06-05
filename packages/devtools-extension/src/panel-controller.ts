/**
 * Panel orchestration (stacksjs/stx#1747), decoupled from chrome + the DOM: pick
 * a view → request it → render the result (or an error / JSON fallback) → hand
 * the HTML to a sink. `panel.ts` wires the real transport + element to this;
 * keeping it abstract makes the panel's core logic unit-testable.
 */
import type { DevtoolsRequestType, DevtoolsResponse } from './protocol'
import { escapeHtml, renderGraph, renderIfTrace, renderQueries, renderStats, renderTree } from './render'

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
  show: (view: DevtoolsRequestType) => Promise<void>
}

export function createPanelController(deps: PanelDeps): PanelController {
  return {
    async show(view) {
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
      const renderer = RENDERERS[view]
      deps.setHtml(renderer ? renderer(res.result) : `<pre>${escapeHtml(JSON.stringify(res.result, null, 2))}</pre>`)
    },
  }
}
