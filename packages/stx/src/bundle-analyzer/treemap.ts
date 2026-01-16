/**
 * Bundle Analyzer - Treemap Visualization
 *
 * Generates interactive HTML treemap visualization of bundle composition.
 */

import type { BundleStats, ModuleInfo, ChunkInfo, ModuleType } from './collector'
import { formatBytes, percentage } from './collector'

// ============================================================================
// Types
// ============================================================================

export interface TreemapOptions {
  /** Output file path */
  output?: string
  /** Open in browser after generation */
  open?: boolean
  /** Report title */
  title?: string
  /** Show gzip sizes */
  gzip?: boolean
  /** Color scheme */
  colorScheme?: 'default' | 'pastel' | 'monochrome'
}

interface TreeNode {
  name: string
  path?: string
  size: number
  gzipSize: number
  type?: ModuleType
  children?: TreeNode[]
}

// ============================================================================
// Color Schemes
// ============================================================================

const COLOR_SCHEMES = {
  default: {
    js: '#f7df1e',
    css: '#264de4',
    html: '#e34c26',
    image: '#4caf50',
    font: '#9c27b0',
    other: '#607d8b',
    vendor: '#ff5722',
  },
  pastel: {
    js: '#fff3b0',
    css: '#b0d4ff',
    html: '#ffb0b0',
    image: '#b0ffb0',
    font: '#e0b0ff',
    other: '#d0d0d0',
    vendor: '#ffcfb0',
  },
  monochrome: {
    js: '#333333',
    css: '#555555',
    html: '#777777',
    image: '#999999',
    font: '#bbbbbb',
    other: '#dddddd',
    vendor: '#444444',
  },
}

// ============================================================================
// Treemap Generation
// ============================================================================

/**
 * Generate interactive HTML treemap
 */
export function generateTreemap(stats: BundleStats, options: TreemapOptions = {}): string {
  const {
    title = 'Bundle Analysis',
    gzip = true,
    colorScheme = 'default',
  } = options

  const colors = COLOR_SCHEMES[colorScheme]
  const treeData = buildTreeData(stats)
  const jsonData = JSON.stringify(treeData)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
    }

    .header {
      background: #16213e;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #0f3460;
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 500;
    }

    .stats {
      display: flex;
      gap: 2rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: bold;
      color: #e94560;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
    }

    .controls {
      background: #16213e;
      padding: 0.75rem 2rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      border-bottom: 1px solid #0f3460;
    }

    .controls label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .controls input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
    }

    .search-box {
      flex: 1;
      max-width: 300px;
    }

    .search-box input {
      width: 100%;
      padding: 0.5rem 1rem;
      border: 1px solid #0f3460;
      border-radius: 4px;
      background: #1a1a2e;
      color: #eee;
      font-size: 0.875rem;
    }

    .search-box input:focus {
      outline: none;
      border-color: #e94560;
    }

    .breadcrumb {
      background: #16213e;
      padding: 0.5rem 2rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.875rem;
      border-bottom: 1px solid #0f3460;
    }

    .breadcrumb-item {
      color: #888;
      cursor: pointer;
    }

    .breadcrumb-item:hover {
      color: #e94560;
    }

    .breadcrumb-item.active {
      color: #eee;
      cursor: default;
    }

    .breadcrumb-sep {
      color: #444;
    }

    #treemap {
      width: 100%;
      height: calc(100vh - 180px);
      min-height: 400px;
    }

    .tooltip {
      position: fixed;
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      pointer-events: none;
      z-index: 1000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .tooltip-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
      word-break: break-all;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      font-size: 0.875rem;
      color: #888;
    }

    .tooltip-row span:last-child {
      color: #eee;
      font-weight: 500;
    }

    .legend {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: #16213e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      padding: 0.75rem 1rem;
    }

    .legend-title {
      font-size: 0.75rem;
      color: #888;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .node {
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .node:hover {
      opacity: 0.8;
    }

    .node-label {
      font-size: 11px;
      fill: #000;
      pointer-events: none;
      text-anchor: middle;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="total-size">${formatBytes(stats.totalSize)}</div>
        <div class="stat-label">Total Size</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="gzip-size">${formatBytes(stats.totalGzipSize)}</div>
        <div class="stat-label">Gzip Size</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.moduleCount}</div>
        <div class="stat-label">Modules</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.chunks.length}</div>
        <div class="stat-label">Chunks</div>
      </div>
    </div>
  </div>

  <div class="controls">
    <div class="search-box">
      <input type="text" id="search" placeholder="Search modules...">
    </div>
    <label>
      <input type="checkbox" id="show-gzip" ${gzip ? 'checked' : ''}>
      Show Gzip Size
    </label>
  </div>

  <div class="breadcrumb" id="breadcrumb">
    <span class="breadcrumb-item active">root</span>
  </div>

  <div id="treemap"></div>

  <div class="tooltip" id="tooltip" style="display: none;"></div>

  <div class="legend">
    <div class="legend-title">File Types</div>
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors.js}"></div>
      <span>JavaScript</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors.css}"></div>
      <span>CSS</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors.html}"></div>
      <span>HTML</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors.image}"></div>
      <span>Images</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors.font}"></div>
      <span>Fonts</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: ${colors.other}"></div>
      <span>Other</span>
    </div>
  </div>

  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script>
    const data = ${jsonData};
    const colors = ${JSON.stringify(colors)};

    let showGzip = ${gzip};
    let currentRoot = data;
    let searchTerm = '';

    const container = document.getElementById('treemap');
    const tooltip = document.getElementById('tooltip');
    const breadcrumb = document.getElementById('breadcrumb');
    const searchInput = document.getElementById('search');
    const showGzipCheckbox = document.getElementById('show-gzip');

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function getColor(d) {
      if (d.data.type) {
        return colors[d.data.type] || colors.other;
      }
      if (d.data.name.includes('node_modules') || d.data.name.includes('vendor')) {
        return colors.vendor;
      }
      return colors.other;
    }

    function getSizeValue(d) {
      return showGzip ? d.data.gzipSize : d.data.size;
    }

    function render() {
      container.innerHTML = '';

      const width = container.clientWidth;
      const height = container.clientHeight;

      const hierarchy = d3.hierarchy(currentRoot)
        .sum(d => {
          if (searchTerm && d.name && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return 0;
          }
          return d.children ? 0 : getSizeValue({ data: d });
        })
        .sort((a, b) => getSizeValue(b) - getSizeValue(a));

      const treemap = d3.treemap()
        .size([width, height])
        .paddingOuter(3)
        .paddingTop(19)
        .paddingInner(1)
        .round(true);

      const root = treemap(hierarchy);

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      const node = svg.selectAll('g')
        .data(root.descendants().filter(d => d.depth > 0))
        .join('g')
        .attr('transform', d => \`translate(\${d.x0},\${d.y0})\`);

      node.append('rect')
        .attr('class', 'node')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('fill', d => getColor(d))
        .attr('stroke', '#1a1a2e')
        .attr('stroke-width', 1)
        .on('click', (event, d) => {
          if (d.children) {
            zoomIn(d.data);
          }
        })
        .on('mouseover', (event, d) => showTooltip(event, d))
        .on('mousemove', (event) => moveTooltip(event))
        .on('mouseout', hideTooltip);

      node.append('text')
        .attr('class', 'node-label')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', d => (d.y1 - d.y0) / 2 + 4)
        .text(d => {
          const width = d.x1 - d.x0;
          const height = d.y1 - d.y0;
          if (width < 40 || height < 20) return '';
          const name = d.data.name;
          const maxLen = Math.floor(width / 7);
          return name.length > maxLen ? name.slice(0, maxLen - 2) + '..' : name;
        });

      // Group headers
      node.filter(d => d.children)
        .append('text')
        .attr('x', 4)
        .attr('y', 14)
        .attr('fill', '#000')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(d => {
          const width = d.x1 - d.x0;
          const name = d.data.name;
          const maxLen = Math.floor(width / 7);
          return name.length > maxLen ? name.slice(0, maxLen - 2) + '..' : name;
        });
    }

    function showTooltip(event, d) {
      const size = d.data.size || d.value;
      const gzipSize = d.data.gzipSize || Math.round(size * 0.3);
      const path = d.data.path || d.data.name;

      tooltip.innerHTML = \`
        <div class="tooltip-title">\${path}</div>
        <div class="tooltip-row">
          <span>Size</span>
          <span>\${formatSize(size)}</span>
        </div>
        <div class="tooltip-row">
          <span>Gzip</span>
          <span>\${formatSize(gzipSize)}</span>
        </div>
        \${d.data.type ? \`<div class="tooltip-row"><span>Type</span><span>\${d.data.type}</span></div>\` : ''}
        \${d.children ? \`<div class="tooltip-row"><span>Children</span><span>\${d.children.length}</span></div>\` : ''}
      \`;
      tooltip.style.display = 'block';
      moveTooltip(event);
    }

    function moveTooltip(event) {
      const x = event.clientX + 10;
      const y = event.clientY + 10;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }

    function hideTooltip() {
      tooltip.style.display = 'none';
    }

    function zoomIn(node) {
      currentRoot = node;
      updateBreadcrumb();
      render();
    }

    function zoomOut(index) {
      let node = data;
      const parts = getBreadcrumbParts();
      for (let i = 1; i <= index; i++) {
        const child = node.children?.find(c => c.name === parts[i]);
        if (child) node = child;
      }
      currentRoot = node;
      updateBreadcrumb();
      render();
    }

    function getBreadcrumbParts() {
      const parts = ['root'];
      let node = currentRoot;
      const path = [];

      function findPath(current, target, currentPath) {
        if (current === target) {
          path.push(...currentPath);
          return true;
        }
        if (current.children) {
          for (const child of current.children) {
            if (findPath(child, target, [...currentPath, child.name])) {
              return true;
            }
          }
        }
        return false;
      }

      if (currentRoot !== data) {
        findPath(data, currentRoot, []);
        parts.push(...path);
      }

      return parts;
    }

    function updateBreadcrumb() {
      const parts = getBreadcrumbParts();
      breadcrumb.innerHTML = parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        const sep = i > 0 ? '<span class="breadcrumb-sep">/</span>' : '';
        return \`\${sep}<span class="breadcrumb-item \${isLast ? 'active' : ''}" onclick="zoomOut(\${i})">\${part}</span>\`;
      }).join('');
    }

    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      render();
    });

    showGzipCheckbox.addEventListener('change', (e) => {
      showGzip = e.target.checked;
      render();
    });

    window.addEventListener('resize', render);

    render();
  </script>
</body>
</html>`
}

/**
 * Build tree data structure from bundle stats
 */
function buildTreeData(stats: BundleStats): TreeNode {
  const root: TreeNode = {
    name: 'root',
    size: stats.totalSize,
    gzipSize: stats.totalGzipSize,
    children: [],
  }

  // Group modules by directory structure
  for (const chunk of stats.chunks) {
    const chunkNode: TreeNode = {
      name: chunk.name,
      size: chunk.size,
      gzipSize: chunk.gzipSize,
      children: [],
    }

    // Build nested structure from module paths
    for (const module of chunk.modules) {
      addModuleToTree(chunkNode, module)
    }

    root.children!.push(chunkNode)
  }

  return root
}

/**
 * Add a module to the tree structure
 */
function addModuleToTree(parent: TreeNode, module: ModuleInfo): void {
  const parts = module.path.split('/')
  let current = parent

  // Navigate/create path
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    let child = current.children?.find(c => c.name === part)

    if (!child) {
      child = {
        name: part,
        size: 0,
        gzipSize: 0,
        children: [],
      }
      if (!current.children) current.children = []
      current.children.push(child)
    }

    current = child
  }

  // Add leaf node (file)
  const fileName = parts[parts.length - 1]
  if (!current.children) current.children = []

  current.children.push({
    name: fileName,
    path: module.path,
    size: module.size,
    gzipSize: module.gzipSize,
    type: module.type,
  })

  // Update parent sizes
  updateParentSizes(parent, module.size, module.gzipSize)
}

/**
 * Update parent node sizes recursively
 */
function updateParentSizes(node: TreeNode, size: number, gzipSize: number): void {
  // Sizes are already calculated at chunk level, no need to update
  // This is a placeholder for future enhancements
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Open URL in default browser
 */
export function openInBrowser(filePath: string): void {
  const platform = process.platform
  const command = platform === 'darwin'
    ? 'open'
    : platform === 'win32'
      ? 'start'
      : 'xdg-open'

  Bun.spawn([command, filePath], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
}
