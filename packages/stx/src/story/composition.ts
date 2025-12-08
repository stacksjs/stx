/**
 * STX Story - Component Composition
 * Dependency graph and component navigation
 */

import type { AnalyzedComponent } from './types'

/**
 * Dependency graph node
 */
export interface DependencyNode {
  /** Component name */
  name: string
  /** Component path */
  path: string
  /** Components this depends on */
  dependencies: string[]
  /** Components that depend on this */
  dependents: string[]
  /** Depth in the graph (0 = root) */
  depth: number
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  /** All nodes by name */
  nodes: Map<string, DependencyNode>
  /** Root components (no dependents) */
  roots: string[]
  /** Leaf components (no dependencies) */
  leaves: string[]
}

/**
 * Build dependency graph from analyzed components
 */
export function buildDependencyGraph(components: AnalyzedComponent[]): DependencyGraph {
  const nodes = new Map<string, DependencyNode>()

  // Create nodes
  for (const component of components) {
    nodes.set(component.name, {
      name: component.name,
      path: component.path,
      dependencies: component.dependencies,
      dependents: [],
      depth: 0,
    })
  }

  // Build reverse dependencies
  for (const component of components) {
    for (const dep of component.dependencies) {
      const depNode = nodes.get(dep)
      if (depNode) {
        depNode.dependents.push(component.name)
      }
    }
  }

  // Calculate depths
  const visited = new Set<string>()
  function calculateDepth(name: string, depth: number): void {
    const node = nodes.get(name)
    if (!node || visited.has(name))
      return

    node.depth = Math.max(node.depth, depth)
    visited.add(name)

    for (const dep of node.dependencies) {
      calculateDepth(dep, depth + 1)
    }

    visited.delete(name)
  }

  // Find roots and leaves
  const roots: string[] = []
  const leaves: string[] = []

  for (const [name, node] of nodes) {
    if (node.dependents.length === 0) {
      roots.push(name)
      calculateDepth(name, 0)
    }
    if (node.dependencies.length === 0) {
      leaves.push(name)
    }
  }

  return { nodes, roots, leaves }
}

/**
 * Get all dependencies of a component (recursive)
 */
export function getAllDependencies(
  graph: DependencyGraph,
  componentName: string,
): string[] {
  const result = new Set<string>()
  const visited = new Set<string>()

  function collect(name: string): void {
    if (visited.has(name))
      return
    visited.add(name)

    const node = graph.nodes.get(name)
    if (!node)
      return

    for (const dep of node.dependencies) {
      result.add(dep)
      collect(dep)
    }
  }

  collect(componentName)
  return Array.from(result)
}

/**
 * Get all dependents of a component (recursive)
 */
export function getAllDependents(
  graph: DependencyGraph,
  componentName: string,
): string[] {
  const result = new Set<string>()
  const visited = new Set<string>()

  function collect(name: string): void {
    if (visited.has(name))
      return
    visited.add(name)

    const node = graph.nodes.get(name)
    if (!node)
      return

    for (const dep of node.dependents) {
      result.add(dep)
      collect(dep)
    }
  }

  collect(componentName)
  return Array.from(result)
}

/**
 * Detect circular dependencies
 */
export function detectCircularDependencies(graph: DependencyGraph): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const path: string[] = []

  function dfs(name: string): void {
    if (path.includes(name)) {
      // Found a cycle
      const cycleStart = path.indexOf(name)
      cycles.push([...path.slice(cycleStart), name])
      return
    }

    if (visited.has(name))
      return
    visited.add(name)
    path.push(name)

    const node = graph.nodes.get(name)
    if (node) {
      for (const dep of node.dependencies) {
        dfs(dep)
      }
    }

    path.pop()
  }

  for (const name of graph.nodes.keys()) {
    dfs(name)
  }

  return cycles
}

/**
 * Generate dependency graph visualization HTML
 */
export function generateDependencyGraphHTML(
  graph: DependencyGraph,
  selectedComponent?: string,
): string {
  const nodes = Array.from(graph.nodes.values())
  const maxDepth = Math.max(...nodes.map(n => n.depth), 0)

  // Group by depth
  const levels: DependencyNode[][] = []
  for (let i = 0; i <= maxDepth; i++) {
    levels.push(nodes.filter(n => n.depth === i))
  }

  const levelsHtml = levels
    .map((level, depth) => {
      const nodesHtml = level
        .map((node) => {
          const isSelected = node.name === selectedComponent
          const classes = ['dep-node']
          if (isSelected)
            classes.push('selected')
          if (graph.roots.includes(node.name))
            classes.push('root')
          if (graph.leaves.includes(node.name))
            classes.push('leaf')

          return `
            <div
              class="${classes.join(' ')}"
              onclick="window.__stxStory.selectComponent('${node.name}')"
              title="${node.path}"
            >
              <span class="dep-node-name">${node.name}</span>
              <span class="dep-node-count">
                ${node.dependencies.length > 0 ? `↓${node.dependencies.length}` : ''}
                ${node.dependents.length > 0 ? `↑${node.dependents.length}` : ''}
              </span>
            </div>
          `
        })
        .join('')

      return `
        <div class="dep-level" data-depth="${depth}">
          <div class="dep-level-label">Level ${depth}</div>
          <div class="dep-level-nodes">${nodesHtml}</div>
        </div>
      `
    })
    .join('')

  return `
    <div class="stx-dependency-graph">
      <div class="dep-graph-header">
        <span>Component Dependencies</span>
        <span class="dep-graph-stats">
          ${graph.nodes.size} components,
          ${graph.roots.length} roots,
          ${graph.leaves.length} leaves
        </span>
      </div>
      <div class="dep-graph-body">
        ${levelsHtml}
      </div>
    </div>
  `
}

/**
 * Get dependency graph styles
 */
export function getDependencyGraphStyles(): string {
  return `
    .stx-dependency-graph {
      padding: 16px;
    }
    .dep-graph-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .dep-graph-stats {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: normal;
    }
    .dep-graph-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dep-level {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .dep-level-label {
      width: 60px;
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      padding-top: 8px;
    }
    .dep-level-nodes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
    }
    .dep-node {
      padding: 8px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dep-node:hover {
      border-color: var(--primary);
    }
    .dep-node.selected {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .dep-node.root {
      border-left: 3px solid #22c55e;
    }
    .dep-node.leaf {
      border-left: 3px solid #f59e0b;
    }
    .dep-node-name {
      font-size: 13px;
    }
    .dep-node-count {
      font-size: 11px;
      color: var(--text-secondary);
    }
    .dep-node.selected .dep-node-count {
      color: rgba(255,255,255,0.7);
    }
  `
}

/**
 * Generate component detail panel HTML
 */
export function generateComponentDetailHTML(
  graph: DependencyGraph,
  componentName: string,
): string {
  const node = graph.nodes.get(componentName)
  if (!node)
    return '<div class="dep-detail-empty">Component not found</div>'

  const depsHtml = node.dependencies.length > 0
    ? node.dependencies.map(d => `
        <div class="dep-link" onclick="window.__stxStory.selectComponent('${d}')">
          ↓ ${d}
        </div>
      `).join('')
    : '<div class="dep-none">No dependencies</div>'

  const dependentsHtml = node.dependents.length > 0
    ? node.dependents.map(d => `
        <div class="dep-link" onclick="window.__stxStory.selectComponent('${d}')">
          ↑ ${d}
        </div>
      `).join('')
    : '<div class="dep-none">No dependents</div>'

  return `
    <div class="stx-component-detail">
      <div class="dep-detail-header">
        <span class="dep-detail-name">${componentName}</span>
        <span class="dep-detail-path">${node.path}</span>
      </div>

      <div class="dep-detail-section">
        <div class="dep-detail-title">Dependencies (${node.dependencies.length})</div>
        ${depsHtml}
      </div>

      <div class="dep-detail-section">
        <div class="dep-detail-title">Used by (${node.dependents.length})</div>
        ${dependentsHtml}
      </div>

      <div class="dep-detail-actions">
        <button onclick="window.__stxStory.openStory('${componentName}')">
          Open Story
        </button>
        <button onclick="window.__stxStory.openSource('${node.path}')">
          View Source
        </button>
      </div>
    </div>
  `
}
