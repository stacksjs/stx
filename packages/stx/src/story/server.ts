/**
 * STX Story - Development server
 * Serves the story UI and handles API requests with WebSocket HMR
 */

import type { StoryContext } from './types'
import process from 'node:process'
import { AnalyticsTracker } from './analytics'
import { BookmarksManager } from './bookmarks'
import { scanStoryFiles, watchStoryFiles } from './collect/scanner'
import { buildTree } from './collect/tree'
import { updateContextStoryFiles, updateContextTree } from './context'
import { createHmrHandler, getHmrClientScript, notifyStoryAdd, notifyStoryRemove, notifyStoryUpdate } from './hmr'
import { getHotSwapScript } from './hot-swap'
import { getShortcutsModalHtml, getShortcutsScript, getShortcutsStyles } from './keyboard-shortcuts'
import { getPerformanceScript } from './performance'
import { PresetsManager } from './presets'
import { renderStoryVariant } from './renderer'

/**
 * Server options
 */
export interface ServerOptions {
  /** Port to listen on */
  port: number
  /** Open browser automatically */
  open?: boolean
  /** Host to bind to */
  host?: string | boolean
}

/**
 * Story server instance
 */
export interface StoryServer {
  /** Bun server instance */
  server: ReturnType<typeof Bun.serve>
  /** Server URL */
  url: string
  /** Close the server */
  close: () => Promise<void>
}

/**
 * Create and start the story server
 */
export async function createStoryServer(
  ctx: StoryContext,
  options: ServerOptions,
): Promise<StoryServer> {
  // Scan for story files
  const storyFiles = await scanStoryFiles(ctx)
  updateContextStoryFiles(ctx, storyFiles)

  // Build tree
  const tree = buildTree(ctx.config, storyFiles)
  updateContextTree(ctx, tree)

  console.log(`  Found ${storyFiles.length} story files`)

  // Determine host
  const hostname = typeof options.host === 'string'
    ? options.host
    : options.host === true
      ? '0.0.0.0'
      : 'localhost'

  // Initialize managers
  const presetsManager = new PresetsManager(ctx.root)
  const bookmarksManager = new BookmarksManager(ctx.root)
  const analyticsTracker = new AnalyticsTracker(ctx.root)

  // Create HMR handler
  const hmrHandler = createHmrHandler()

  // Create server with WebSocket support
  const server = Bun.serve<{ isHmr: boolean }>({
    port: options.port,
    hostname,
    fetch: async (req, server) => {
      const url = new URL(req.url)
      const pathname = url.pathname

      // WebSocket upgrade for HMR
      if (pathname === '/__hmr') {
        const upgraded = server.upgrade(req, { data: { isHmr: true } })
        if (upgraded)
          return undefined as unknown as Response
        return new Response('WebSocket upgrade failed', { status: 400 })
      }

      // API routes
      if (pathname.startsWith('/api/')) {
        return handleApiRequest(ctx, pathname, req, {
          presetsManager,
          bookmarksManager,
          analyticsTracker,
        })
      }

      // Serve story UI
      return serveStoryUI(ctx, pathname, options.port)
    },
    websocket: {
      open(ws) {
        hmrHandler.open(ws as any)
      },
      close(ws) {
        hmrHandler.close(ws as any)
      },
      message(ws, message) {
        hmrHandler.message(ws as any, message as any)
      },
    },
  })

  const serverUrl = `http://${hostname}:${options.port}`

  // Watch for file changes
  const stopWatching = watchStoryFiles(ctx, async (event, file) => {
    console.log(`  [${event}] ${file.relativePath}`)

    // Rescan and rebuild tree
    const updatedFiles = await scanStoryFiles(ctx)
    updateContextStoryFiles(ctx, updatedFiles)
    const updatedTree = buildTree(ctx.config, updatedFiles)
    updateContextTree(ctx, updatedTree)

    // Notify connected clients via WebSocket
    if (event === 'add') {
      notifyStoryAdd(file.id, { fileName: file.fileName })
    }
    else if (event === 'unlink') {
      notifyStoryRemove(file.id)
    }
    else {
      notifyStoryUpdate(file.id, { fileName: file.fileName })
    }
  })

  // Open browser if requested
  if (options.open) {
    const openUrl = serverUrl
    try {
      const { exec } = await import('node:child_process')
      const platform = process.platform
      const cmd = platform === 'darwin'
        ? 'open'
        : platform === 'win32'
          ? 'start'
          : 'xdg-open'
      exec(`${cmd} ${openUrl}`)
    }
    catch {
      // Ignore errors opening browser
    }
  }

  return {
    server,
    url: serverUrl,
    close: async () => {
      stopWatching()
      server.stop()
    },
  }
}

/**
 * API managers
 */
interface ApiManagers {
  presetsManager: PresetsManager
  bookmarksManager: BookmarksManager
  analyticsTracker: AnalyticsTracker
}

/**
 * Handle API requests
 */
async function handleApiRequest(
  ctx: StoryContext,
  pathname: string,
  req: Request,
  managers: ApiManagers,
): Promise<Response> {
  const { presetsManager, bookmarksManager, analyticsTracker } = managers

  // GET /api/stories - List all stories
  if (pathname === '/api/stories') {
    return Response.json({
      files: ctx.storyFiles.map(f => ({
        id: f.id,
        fileName: f.fileName,
        relativePath: f.relativePath,
        treePath: f.treePath,
      })),
      tree: ctx.tree,
    })
  }

  // GET /api/story/:id - Get story details
  if (pathname.startsWith('/api/story/')) {
    const id = pathname.slice('/api/story/'.length)
    const file = ctx.storyFiles.find(f => f.id === id)

    if (!file) {
      return new Response('Story not found', { status: 404 })
    }

    // Read and return story content
    try {
      const content = await Bun.file(file.path).text()
      return Response.json({
        id: file.id,
        fileName: file.fileName,
        relativePath: file.relativePath,
        content,
      })
    }
    catch {
      return new Response('Error reading story', { status: 500 })
    }
  }

  // GET /api/config - Get story config
  if (pathname === '/api/config') {
    return Response.json({
      theme: ctx.config.theme,
      responsivePresets: ctx.config.responsivePresets,
      backgroundPresets: ctx.config.backgroundPresets,
    })
  }

  // GET /api/render/:storyId/:variantId - Render a story variant
  if (pathname.startsWith('/api/render/')) {
    const url = new URL(req.url)
    const parts = pathname.slice('/api/render/'.length).split('/')
    const storyId = parts[0]
    const variantId = parts[1] || 'default'

    // Parse props from query string
    let customProps: Record<string, any> | undefined
    const propsParam = url.searchParams.get('props')
    if (propsParam) {
      try {
        customProps = JSON.parse(propsParam)
      }
      catch {
        // Ignore invalid JSON
      }
    }

    const file = ctx.storyFiles.find(f => f.id === storyId)
    if (!file) {
      return new Response('Story not found', { status: 404 })
    }

    try {
      const result = await renderStoryVariant(ctx, file, variantId, customProps)
      return Response.json({
        html: result.html,
        css: result.css,
        js: result.js,
        errors: result.errors,
        duration: result.duration,
      })
    }
    catch (error) {
      return Response.json({
        html: '',
        css: '',
        js: '',
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
      }, { status: 500 })
    }
  }

  // ============ PRESETS API ============

  // GET /api/presets - List all presets
  if (pathname === '/api/presets' && req.method === 'GET') {
    return Response.json({ presets: presetsManager.getAllPresets() })
  }

  // POST /api/presets - Create preset
  if (pathname === '/api/presets' && req.method === 'POST') {
    try {
      const body = await req.json() as { name: string, props: Record<string, any>, componentId?: string, description?: string }
      const preset = presetsManager.createPreset(body.name, body.props, {
        componentId: body.componentId,
        description: body.description,
      })
      await presetsManager.save()
      return Response.json(preset)
    }
    catch (error) {
      return Response.json({ error: String(error) }, { status: 400 })
    }
  }

  // GET /api/presets/:id - Get preset
  if (pathname.startsWith('/api/presets/') && !pathname.includes('/use') && req.method === 'GET') {
    const id = pathname.slice('/api/presets/'.length)
    const preset = presetsManager.getPreset(id)
    if (!preset) {
      return new Response('Preset not found', { status: 404 })
    }
    return Response.json(preset)
  }

  // POST /api/presets/:id/use - Use preset
  if (pathname.endsWith('/use') && req.method === 'POST') {
    const id = pathname.slice('/api/presets/'.length, -4)
    const preset = presetsManager.usePreset(id)
    if (!preset) {
      return new Response('Preset not found', { status: 404 })
    }
    await presetsManager.save()
    return Response.json(preset)
  }

  // DELETE /api/presets/:id - Delete preset
  if (pathname.startsWith('/api/presets/') && req.method === 'DELETE') {
    const id = pathname.slice('/api/presets/'.length)
    const deleted = presetsManager.deletePreset(id)
    if (!deleted) {
      return new Response('Preset not found', { status: 404 })
    }
    await presetsManager.save()
    return Response.json({ success: true })
  }

  // ============ BOOKMARKS API ============

  // GET /api/bookmarks - List all bookmarks
  if (pathname === '/api/bookmarks' && req.method === 'GET') {
    return Response.json({ bookmarks: bookmarksManager.getAllBookmarks() })
  }

  // POST /api/bookmarks - Create bookmark
  if (pathname === '/api/bookmarks' && req.method === 'POST') {
    try {
      const body = await req.json() as { name: string, storyId: string, variantId: string, props: Record<string, any>, notes?: string, color?: string }
      const bookmark = bookmarksManager.addBookmark(body.storyId, body.variantId, body.props, {
        name: body.name,
        notes: body.notes,
        color: body.color,
      })
      await bookmarksManager.save()
      return Response.json(bookmark)
    }
    catch (error) {
      return Response.json({ error: String(error) }, { status: 400 })
    }
  }

  // POST /api/bookmarks/toggle - Toggle bookmark
  if (pathname === '/api/bookmarks/toggle' && req.method === 'POST') {
    try {
      const body = await req.json() as { storyId: string, variantId: string, props: Record<string, any> }
      const result = bookmarksManager.toggleBookmark(body.storyId, body.variantId, body.props)
      await bookmarksManager.save()
      return Response.json(result)
    }
    catch (error) {
      return Response.json({ error: String(error) }, { status: 400 })
    }
  }

  // GET /api/bookmarks/:id - Get bookmark
  if (pathname.startsWith('/api/bookmarks/') && pathname !== '/api/bookmarks/toggle' && req.method === 'GET') {
    const id = pathname.slice('/api/bookmarks/'.length)
    const bookmark = bookmarksManager.getBookmark(id)
    if (!bookmark) {
      return new Response('Bookmark not found', { status: 404 })
    }
    return Response.json(bookmark)
  }

  // DELETE /api/bookmarks/:id - Delete bookmark
  if (pathname.startsWith('/api/bookmarks/') && req.method === 'DELETE') {
    const id = pathname.slice('/api/bookmarks/'.length)
    const deleted = bookmarksManager.deleteBookmark(id)
    if (!deleted) {
      return new Response('Bookmark not found', { status: 404 })
    }
    await bookmarksManager.save()
    return Response.json({ success: true })
  }

  // ============ ANALYTICS API ============

  // POST /api/analytics/track - Track event
  if (pathname === '/api/analytics/track' && req.method === 'POST') {
    try {
      const body = await req.json() as { type: string, componentId?: string, variantId?: string, propName?: string, query?: string }
      if (body.type === 'view' && body.componentId) {
        analyticsTracker.trackView(body.componentId, body.variantId)
      }
      else if (body.type === 'prop_change' && body.componentId && body.propName) {
        analyticsTracker.trackPropChange(body.componentId, body.propName, null)
      }
      else if (body.type === 'variant_switch' && body.componentId && body.variantId) {
        analyticsTracker.trackVariantSwitch(body.componentId, body.variantId)
      }
      else if (body.type === 'search' && body.query) {
        analyticsTracker.trackSearch(body.query, 0)
      }
      await analyticsTracker.save()
      return Response.json({ success: true })
    }
    catch (error) {
      return Response.json({ error: String(error) }, { status: 400 })
    }
  }

  // GET /api/analytics/summary - Get analytics summary
  if (pathname === '/api/analytics/summary' && req.method === 'GET') {
    return Response.json({
      mostViewed: analyticsTracker.getMostViewedComponents(10),
      mostChangedProps: analyticsTracker.getMostChangedProps(10),
      searchAnalytics: analyticsTracker.getSearchAnalytics(),
    })
  }

  // GET /api/analytics/component/:id - Get component analytics
  if (pathname.startsWith('/api/analytics/component/') && req.method === 'GET') {
    const id = pathname.slice('/api/analytics/component/'.length)
    const file = ctx.storyFiles.find(f => f.id === id)
    const analytics = analyticsTracker.getComponentAnalytics(id, file?.fileName || id)
    return Response.json(analytics)
  }

  return new Response('Not found', { status: 404 })
}

/**
 * Serve the story UI
 */
function serveStoryUI(ctx: StoryContext, _pathname: string, port: number): Response {
  const html = generateStoryHTML(ctx, port)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

/**
 * Generate the story UI HTML with HMR support
 */
function generateStoryHTML(ctx: StoryContext, port: number): string {
  const { theme } = ctx.config
  const title = theme.title || 'STX Story'
  const wsUrl = `ws://localhost:${port}/__hmr`
  const hmrScript = getHmrClientScript(wsUrl)

  return `<!DOCTYPE html>
<html lang="en" class="${theme.darkClass || 'dark'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #ffffff;
      --bg-secondary: #f8f9fa;
      --bg-tertiary: #e9ecef;
      --text: #212529;
      --text-secondary: #6c757d;
      --border: #dee2e6;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    .dark {
      --bg: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --text: #f0f6fc;
      --text-secondary: #8b949e;
      --border: #30363d;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      min-width: 260px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sidebar-header h1 {
      font-size: 16px;
      font-weight: 600;
    }
    .sidebar-search {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-search input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
    }
    .sidebar-search input:focus {
      outline: none;
      border-color: var(--primary);
    }
    .story-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      list-style: none;
    }
    .story-item {
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 2px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .story-item:hover { background: var(--bg-tertiary); }
    .story-item.active {
      background: var(--primary);
      color: white;
    }
    .story-icon { font-size: 14px; }

    /* Main content */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Toolbar */
    .toolbar {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-secondary);
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: var(--border);
    }
    .toolbar select, .toolbar button {
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
    }
    .toolbar select:hover, .toolbar button:hover {
      background: var(--bg-tertiary);
    }
    .toolbar-spacer { flex: 1; }

    /* Variant tabs */
    .variant-tabs {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      overflow-x: auto;
    }
    .variant-tab {
      padding: 6px 14px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .variant-tab:hover { background: var(--bg-tertiary); }
    .variant-tab.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    /* Content area */
    .content-wrapper {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* Canvas */
    .canvas-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-tertiary);
    }
    .canvas {
      flex: 1;
      padding: 24px;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .canvas-frame {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      width: 100%;
      max-width: 100%;
    }
    .canvas-frame iframe {
      width: 100%;
      height: 400px;
      border: none;
      display: block;
    }

    /* Controls Panel */
    .controls-panel {
      width: 300px;
      min-width: 300px;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .controls-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      font-weight: 600;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .controls-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .control-group {
      margin-bottom: 16px;
    }
    .control-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--text-secondary);
    }
    .control-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
    }
    .control-input:focus {
      outline: none;
      border-color: var(--primary);
    }
    .control-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .control-checkbox input {
      width: 16px;
      height: 16px;
    }
    .controls-actions {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
    }
    .controls-actions button {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
    }
    .controls-actions button:hover {
      background: var(--bg-tertiary);
    }

    /* States */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      font-size: 14px;
      gap: 8px;
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
    }
    .loading::after {
      content: '';
      width: 20px;
      height: 20px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .render-error {
      padding: 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
    }
    .dark .render-error {
      background: #450a0a;
      border-color: #7f1d1d;
      color: #fca5a5;
    }
    .render-error pre {
      margin-top: 8px;
      white-space: pre-wrap;
      font-size: 12px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span style="font-size: 20px;">📖</span>
      <h1>${title}</h1>
    </div>
    <div class="sidebar-search">
      <input type="text" placeholder="Search components..." id="search-input" oninput="filterStories(this.value)">
    </div>
    <ul class="story-list" id="story-list">
      <li class="empty-state">Loading stories...</li>
    </ul>
  </aside>

  <main class="main">
    <div class="toolbar">
      <div class="toolbar-group">
        <button onclick="toggleTheme()" title="Toggle theme">🌓</button>
        <button onclick="reloadStory()" title="Reload">↻</button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <select id="viewport" onchange="changeViewport(this.value)">
          <option value="">Responsive</option>
          ${ctx.config.responsivePresets.map(p => `<option value="${p.width}">${p.label}</option>`).join('')}
        </select>
        <select id="background" onchange="changeBackground(this.value)">
          ${ctx.config.backgroundPresets.map(p => `<option value="${p.color}">${p.label}</option>`).join('')}
        </select>
      </div>
      <div class="toolbar-spacer"></div>
      <div class="toolbar-group">
        <button onclick="toggleControls()" id="controls-toggle">Controls ▶</button>
      </div>
    </div>

    <div class="variant-tabs" id="variant-tabs" style="display: none;">
      <!-- Variant tabs will be populated here -->
    </div>

    <div class="content-wrapper">
      <div class="canvas-container">
        <div class="canvas" id="canvas">
          <div class="empty-state">
            <span style="font-size: 32px;">🎨</span>
            <span>Select a component from the sidebar</span>
          </div>
        </div>
      </div>

      <div class="controls-panel" id="controls-panel" style="display: none;">
        <div class="controls-header">
          <span>Controls</span>
          <button onclick="resetProps()" style="font-size: 11px; padding: 4px 8px;">Reset</button>
        </div>
        <div class="controls-body" id="controls-body">
          <div class="empty-state">Select a story to edit props</div>
        </div>
        <div class="controls-actions">
          <button onclick="copyProps()">Copy JSON</button>
          <button onclick="applyProps()">Apply</button>
        </div>
      </div>
    </div>
  </main>

  <script>
    let currentStory = null;
    let currentVariant = 'default';
    let currentStoryData = null;
    let currentProps = {};
    let allStories = [];

    // Load stories
    fetch('/api/stories')
      .then(r => r.json())
      .then(data => {
        allStories = data.files;
        renderStoryList(allStories);
      });

    function renderStoryList(stories) {
      const list = document.getElementById('story-list');
      if (stories.length === 0) {
        list.innerHTML = '<li class="empty-state">No stories found</li>';
        return;
      }
      list.innerHTML = stories.map(f =>
        '<li class="story-item" data-id="' + f.id + '" onclick="selectStory(\\'' + f.id + '\\', this)">' +
        '<span class="story-icon">📦</span>' + f.fileName + '</li>'
      ).join('');
    }

    function filterStories(query) {
      const filtered = allStories.filter(f =>
        f.fileName.toLowerCase().includes(query.toLowerCase())
      );
      renderStoryList(filtered);
    }

    function selectStory(id, element) {
      currentStory = id;
      currentVariant = 'default';

      document.querySelectorAll('.story-item').forEach(el => el.classList.remove('active'));
      if (element) element.classList.add('active');

      // Fetch story details with variants
      fetch('/api/story/' + id)
        .then(r => r.json())
        .then(data => {
          currentStoryData = data;
          currentProps = {};

          // Parse variants from content
          const variants = parseVariants(data.content);
          renderVariantTabs(variants);

          // Parse props from content
          const props = parseProps(data.content);
          renderControls(props);

          // Render the default variant
          renderVariant('default');
        })
        .catch(err => {
          showError('Failed to load story: ' + err.message);
        });
    }

    function parseVariants(content) {
      const match = content.match(/const\\s+variants\\s*=\\s*\\[([\\s\\S]*?)\\]/);
      if (!match) return [{ id: 'default', title: 'Default' }];

      try {
        const variantsStr = '[' + match[1] + ']';
        const cleaned = variantsStr
          .replace(/'/g, '"')
          .replace(/(\\w+):/g, '"$1":')
          .replace(/,\\s*}/g, '}')
          .replace(/,\\s*]/g, ']');
        return JSON.parse(cleaned);
      } catch {
        return [{ id: 'default', title: 'Default' }];
      }
    }

    function parseProps(content) {
      const props = [];
      const scriptMatch = content.match(/<script>([\\s\\S]*?)<\\/script>/);
      if (!scriptMatch) return props;

      const script = scriptMatch[1];
      const propMatches = script.matchAll(/const\\s+(\\w+)\\s*=\\s*([^\\n]+)/g);

      for (const m of propMatches) {
        const name = m[1];
        const valueStr = m[2].trim();

        // Skip variants and title
        if (name === 'variants' || name === 'title') continue;

        let type = 'text';
        let value = valueStr;

        if (valueStr === 'true' || valueStr === 'false') {
          type = 'boolean';
          value = valueStr === 'true';
        } else if (valueStr.match(/^\\d+$/)) {
          type = 'number';
          value = parseInt(valueStr);
        } else if (valueStr.startsWith("'") || valueStr.startsWith('"')) {
          value = valueStr.slice(1, -1);
        }

        props.push({ name, type, value, default: value });
        currentProps[name] = value;
      }

      return props;
    }

    function renderVariantTabs(variants) {
      const container = document.getElementById('variant-tabs');
      if (variants.length <= 1) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'flex';
      container.innerHTML = variants.map(v =>
        '<button class="variant-tab' + (v.id === currentVariant ? ' active' : '') +
        '" onclick="selectVariant(\\'' + v.id + '\\')">' + v.title + '</button>'
      ).join('');
    }

    function renderControls(props) {
      const body = document.getElementById('controls-body');
      if (props.length === 0) {
        body.innerHTML = '<div class="empty-state">No props available</div>';
        return;
      }

      body.innerHTML = props.map(p => {
        if (p.type === 'boolean') {
          return '<div class="control-group">' +
            '<label class="control-checkbox">' +
            '<input type="checkbox" ' + (currentProps[p.name] ? 'checked' : '') +
            ' onchange="updateProp(\\'' + p.name + '\\', this.checked)">' +
            '<span>' + p.name + '</span>' +
            '</label></div>';
        }
        return '<div class="control-group">' +
          '<label class="control-label">' + p.name + '</label>' +
          '<input type="' + (p.type === 'number' ? 'number' : 'text') + '" ' +
          'class="control-input" value="' + escapeHtml(String(currentProps[p.name] || '')) + '" ' +
          'onchange="updateProp(\\'' + p.name + '\\', this.value)">' +
          '</div>';
      }).join('');
    }

    function selectVariant(variantId) {
      currentVariant = variantId;

      document.querySelectorAll('.variant-tab').forEach(el => el.classList.remove('active'));
      event.target.classList.add('active');

      // Get variant state and apply to props
      const variants = parseVariants(currentStoryData.content);
      const variant = variants.find(v => v.id === variantId);
      if (variant && variant.state) {
        Object.assign(currentProps, variant.state);
        renderControls(parseProps(currentStoryData.content));
      }

      renderVariant(variantId);
    }

    function renderVariant(variantId) {
      const canvas = document.getElementById('canvas');
      canvas.innerHTML = '<div class="loading">Rendering</div>';

      // Build URL with props
      const propsParam = Object.keys(currentProps).length > 0
        ? '?props=' + encodeURIComponent(JSON.stringify(currentProps))
        : '';

      fetch('/api/render/' + currentStory + '/' + variantId + propsParam)
        .then(r => r.json())
        .then(data => {
          if (data.errors && data.errors.length > 0 && !data.html) {
            canvas.innerHTML = '<div class="render-error"><strong>Render Error:</strong><pre>' +
              escapeHtml(data.errors.join('\\n')) + '</pre></div>';
            return;
          }

          canvas.innerHTML = '<div class="canvas-frame"><iframe id="preview-iframe"></iframe></div>';
          const iframe = document.getElementById('preview-iframe');
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

          iframeDoc.open();
          iframeDoc.write('<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<style>' +
            '* { box-sizing: border-box; }' +
            'body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; }' +
            (data.css || '') +
            '</style>' +
            '</head>' +
            '<body>' +
            (data.html || '') +
            '</body>' +
            '</html>');
          iframeDoc.close();

          // Auto-resize iframe
          setTimeout(() => {
            const height = iframeDoc.body.scrollHeight + 40;
            iframe.style.height = Math.max(200, height) + 'px';
          }, 100);
        })
        .catch(err => {
          canvas.innerHTML = '<div class="render-error"><strong>Error:</strong> ' + escapeHtml(err.message) + '</div>';
        });
    }

    function updateProp(name, value) {
      currentProps[name] = value;
    }

    function applyProps() {
      if (currentStory) {
        renderVariant(currentVariant);
      }
    }

    function resetProps() {
      if (currentStoryData) {
        currentProps = {};
        const props = parseProps(currentStoryData.content);
        props.forEach(p => { currentProps[p.name] = p.default; });
        renderControls(props);
        renderVariant(currentVariant);
      }
    }

    function copyProps() {
      navigator.clipboard.writeText(JSON.stringify(currentProps, null, 2))
        .then(() => alert('Props copied to clipboard!'));
    }

    function reloadStory() {
      if (currentStory) {
        renderVariant(currentVariant);
      }
    }

    function showError(message) {
      document.getElementById('canvas').innerHTML =
        '<div class="render-error">' + escapeHtml(message) + '</div>';
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function toggleTheme() {
      document.documentElement.classList.toggle('dark');
    }

    function toggleControls() {
      const panel = document.getElementById('controls-panel');
      const btn = document.getElementById('controls-toggle');
      if (panel.style.display === 'none') {
        panel.style.display = 'flex';
        btn.textContent = 'Controls ◀';
      } else {
        panel.style.display = 'none';
        btn.textContent = 'Controls ▶';
      }
    }

    function changeViewport(width) {
      const frame = document.querySelector('.canvas-frame');
      if (frame) {
        frame.style.maxWidth = width ? width + 'px' : '';
      }
    }

    function changeBackground(color) {
      const canvas = document.getElementById('canvas');
      canvas.style.background = color || '';
    }

    // STX Story global object for HMR
    window.__stxStory = {
      currentStoryId: null,
      reloadCurrentStory: function() {
        if (currentStory) renderVariant(currentVariant);
      },
      refreshStoryList: function() {
        fetch('/api/stories')
          .then(r => r.json())
          .then(data => {
            allStories = data.files;
            renderStoryList(allStories);
          });
      }
    };
  </script>
  ${hmrScript}
  ${getHotSwapScript()}
  ${getShortcutsScript()}
  ${getPerformanceScript()}
  <style>${getShortcutsStyles()}</style>
  ${getShortcutsModalHtml()}
</body>
</html>`
}
