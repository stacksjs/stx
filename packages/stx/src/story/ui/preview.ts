/**
 * STX Story - Live Preview
 * Real-time component rendering with iframe isolation
 */

import type { ResponsivePreset, ServerStoryFile, StoryContext } from '../types'

/**
 * Preview state
 */
export interface PreviewState {
  /** Current viewport width */
  viewportWidth: number | null
  /** Current viewport height */
  viewportHeight: number | null
  /** Current zoom level (1 = 100%) */
  zoom: number
  /** Current background color */
  background: string
  /** Show grid overlay */
  showGrid: boolean
  /** Show ruler overlay */
  showRuler: boolean
  /** Show outline overlay */
  showOutline: boolean
  /** Current prop values */
  props: Record<string, any>
}

/**
 * Create initial preview state
 */
export function createPreviewState(): PreviewState {
  return {
    viewportWidth: null,
    viewportHeight: null,
    zoom: 1,
    background: '#ffffff',
    showGrid: false,
    showRuler: false,
    showOutline: false,
    props: {},
  }
}

/**
 * Generate iframe HTML for component preview
 */
export function generatePreviewIframe(
  story: ServerStoryFile,
  variantId: string,
  state: PreviewState,
  ctx: StoryContext,
): string {
  const variant = story.story?.variants.find(v => v.id === variantId)
  if (!variant)
    return ''

  const { theme } = ctx.config
  const darkClass = theme.darkClass || 'dark'

  // Merge variant state with current props
  const props = { ...variant.state, ...state.props }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${state.background};
    }
    ${state.showGrid ? generateGridStyles() : ''}
    ${state.showOutline ? generateOutlineStyles() : ''}
  </style>
</head>
<body class="${theme.defaultColorScheme === 'dark' ? darkClass : ''}">
  <div id="preview-root">
    ${variant.source || '<!-- No source -->'}
  </div>
  <script>
    // Props available to the component
    window.__stxProps = ${JSON.stringify(props)};

    // Notify parent of render complete
    window.parent.postMessage({ type: 'preview-ready' }, '*');
  </script>
</body>
</html>
`
}

/**
 * Generate grid overlay styles
 */
function generateGridStyles(): string {
  return `
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
      background-size: 8px 8px;
      z-index: 9999;
    }
  `
}

/**
 * Generate outline overlay styles
 */
function generateOutlineStyles(): string {
  return `
    * {
      outline: 1px solid rgba(59, 130, 246, 0.3) !important;
    }
  `
}

/**
 * Generate viewport selector HTML
 */
export function generateViewportSelector(
  presets: ResponsivePreset[],
  currentWidth: number | null,
): string {
  const options = presets
    .map(p => `<option value="${p.width}" ${p.width === currentWidth ? 'selected' : ''}>${p.label}</option>`)
    .join('')

  return `
    <select class="stx-viewport-select" onchange="window.__stxStory.setViewport(this.value)">
      <option value="">Responsive</option>
      ${options}
    </select>
  `
}

/**
 * Generate zoom controls HTML
 */
export function generateZoomControls(currentZoom: number): string {
  const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2]

  const options = zoomLevels
    .map(z => `<option value="${z}" ${z === currentZoom ? 'selected' : ''}>${Math.round(z * 100)}%</option>`)
    .join('')

  return `
    <div class="stx-zoom-controls">
      <button onclick="window.__stxStory.zoomOut()" title="Zoom out">−</button>
      <select onchange="window.__stxStory.setZoom(this.value)">
        ${options}
      </select>
      <button onclick="window.__stxStory.zoomIn()" title="Zoom in">+</button>
    </div>
  `
}

/**
 * Generate background selector HTML
 */
export function generateBackgroundSelector(
  presets: { label: string, color: string }[],
  currentColor: string,
): string {
  const options = presets
    .map(p => `
      <button
        class="stx-bg-btn ${p.color === currentColor ? 'active' : ''}"
        style="background: ${p.color}"
        onclick="window.__stxStory.setBackground('${p.color}')"
        title="${p.label}"
      ></button>
    `)
    .join('')

  return `
    <div class="stx-background-selector">
      ${options}
    </div>
  `
}

/**
 * Generate toolbar overlay buttons
 */
export function generateOverlayButtons(state: PreviewState): string {
  return `
    <div class="stx-overlay-buttons">
      <button
        class="${state.showGrid ? 'active' : ''}"
        onclick="window.__stxStory.toggleGrid()"
        title="Toggle grid"
      >⊞</button>
      <button
        class="${state.showRuler ? 'active' : ''}"
        onclick="window.__stxStory.toggleRuler()"
        title="Toggle ruler"
      >📏</button>
      <button
        class="${state.showOutline ? 'active' : ''}"
        onclick="window.__stxStory.toggleOutline()"
        title="Toggle outline"
      >▢</button>
    </div>
  `
}

/**
 * Generate side-by-side comparison view
 */
export function generateComparisonView(
  story: ServerStoryFile,
  variantId1: string,
  variantId2: string,
  ctx: StoryContext,
): string {
  const state1 = createPreviewState()
  const state2 = createPreviewState()

  const iframe1 = generatePreviewIframe(story, variantId1, state1, ctx)
  const iframe2 = generatePreviewIframe(story, variantId2, state2, ctx)

  return `
    <div class="stx-comparison-view">
      <div class="stx-comparison-pane">
        <div class="stx-comparison-label">Variant A</div>
        <iframe srcdoc="${escapeHtml(iframe1)}"></iframe>
      </div>
      <div class="stx-comparison-divider"></div>
      <div class="stx-comparison-pane">
        <div class="stx-comparison-label">Variant B</div>
        <iframe srcdoc="${escapeHtml(iframe2)}"></iframe>
      </div>
    </div>
  `
}

/**
 * Get preview styles
 */
export function getPreviewStyles(): string {
  return `
    .stx-preview-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stx-preview-iframe {
      border: 1px solid var(--border);
      border-radius: 4px;
      background: white;
      transition: width 0.2s, height 0.2s, transform 0.2s;
    }
    .stx-viewport-select,
    .stx-zoom-controls select {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
    }
    .stx-zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .stx-zoom-controls button {
      width: 24px;
      height: 24px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
    }
    .stx-zoom-controls button:hover {
      background: var(--bg-secondary);
    }
    .stx-background-selector {
      display: flex;
      gap: 4px;
    }
    .stx-bg-btn {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
    }
    .stx-bg-btn.active {
      border-color: var(--primary);
    }
    .stx-overlay-buttons {
      display: flex;
      gap: 4px;
    }
    .stx-overlay-buttons button {
      width: 28px;
      height: 28px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      cursor: pointer;
    }
    .stx-overlay-buttons button.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .stx-comparison-view {
      display: flex;
      width: 100%;
      height: 100%;
    }
    .stx-comparison-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .stx-comparison-label {
      padding: 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }
    .stx-comparison-pane iframe {
      flex: 1;
      border: none;
    }
    .stx-comparison-divider {
      width: 4px;
      background: var(--border);
      cursor: col-resize;
    }
  `
}

/**
 * Escape HTML for srcdoc attribute
 */
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
