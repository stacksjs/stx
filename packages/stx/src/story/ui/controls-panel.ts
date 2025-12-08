/**
 * STX Story - Controls Panel
 * Collapsible panel for editing component props
 */

import type { AnalyzedComponent } from '../types'
import { renderControl } from '../controls'
import { inferControl } from '../generator'

/**
 * Controls panel state
 */
export interface ControlsPanelState {
  /** Whether the panel is collapsed */
  collapsed: boolean
  /** Current prop values */
  values: Record<string, any>
  /** Search filter */
  filter: string
}

/**
 * Create initial controls panel state
 */
export function createControlsPanelState(
  component: AnalyzedComponent | null,
): ControlsPanelState {
  const values: Record<string, any> = {}

  if (component) {
    for (const prop of component.props) {
      values[prop.name] = prop.default
    }
  }

  return {
    collapsed: false,
    values,
    filter: '',
  }
}

/**
 * Generate controls panel HTML
 */
export function generateControlsPanel(
  component: AnalyzedComponent | null,
  state: ControlsPanelState,
): string {
  if (!component) {
    return `
      <div class="stx-controls-panel">
        <div class="stx-controls-empty">
          Select a story to edit props
        </div>
      </div>
    `
  }

  const filteredProps = state.filter
    ? component.props.filter(p =>
        p.name.toLowerCase().includes(state.filter.toLowerCase()),
      )
    : component.props

  const controlsHtml = filteredProps
    .map((prop) => {
      const control = inferControl(prop)
      const value = state.values[prop.name]
      const onChange = `window.__stxStory.setProp('${prop.name}', this.value)`
      return renderControl(control, value, onChange)
    })
    .join('')

  return `
    <div class="stx-controls-panel ${state.collapsed ? 'collapsed' : ''}">
      <div class="stx-controls-header" onclick="window.__stxStory.toggleControlsPanel()">
        <span class="stx-controls-title">Controls</span>
        <span class="stx-controls-toggle">${state.collapsed ? '◀' : '▶'}</span>
      </div>
      <div class="stx-controls-body">
        <div class="stx-controls-search">
          <input
            type="text"
            placeholder="Filter props..."
            value="${escapeHtml(state.filter)}"
            oninput="window.__stxStory.filterProps(this.value)"
          />
        </div>
        <div class="stx-controls-list">
          ${controlsHtml}
        </div>
        <div class="stx-controls-actions">
          <button onclick="window.__stxStory.resetProps()">Reset</button>
          <button onclick="window.__stxStory.copyProps()">Copy JSON</button>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate auto props disabled message
 */
export function generateAutoPropsDisabled(): string {
  return `
    <div class="stx-controls-panel">
      <div class="stx-controls-header">
        <span class="stx-controls-title">Controls</span>
      </div>
      <div class="stx-controls-body">
        <div class="stx-controls-disabled">
          Auto props are disabled for this story.
          <br><br>
          Use <code>&lt;template #controls&gt;</code> to define custom controls.
        </div>
      </div>
    </div>
  `
}

/**
 * Get controls panel styles
 */
export function getControlsPanelStyles(): string {
  return `
    .stx-controls-panel {
      width: 280px;
      border-left: 1px solid var(--border);
      background: var(--bg);
      display: flex;
      flex-direction: column;
      transition: width 0.2s;
    }
    .stx-controls-panel.collapsed {
      width: 40px;
    }
    .stx-controls-panel.collapsed .stx-controls-body {
      display: none;
    }
    .stx-controls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      user-select: none;
    }
    .stx-controls-header:hover {
      background: var(--bg-secondary);
    }
    .stx-controls-title {
      font-weight: 600;
      font-size: 13px;
    }
    .stx-controls-toggle {
      font-size: 10px;
      color: var(--text-secondary);
    }
    .stx-controls-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .stx-controls-search {
      margin-bottom: 12px;
    }
    .stx-controls-search input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
    }
    .stx-controls-search input:focus {
      outline: none;
      border-color: var(--primary);
    }
    .stx-controls-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .stx-controls-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .stx-controls-actions button {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
    }
    .stx-controls-actions button:hover {
      background: var(--bg-secondary);
    }
    .stx-controls-empty,
    .stx-controls-disabled {
      padding: 24px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .stx-controls-disabled code {
      background: var(--bg-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  `
}

/**
 * Escape HTML
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
