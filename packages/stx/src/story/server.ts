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
    const parts = pathname.slice('/api/render/'.length).split('/')
    const storyId = parts[0]
    const variantId = parts[1] || 'default'

    const file = ctx.storyFiles.find(f => f.id === storyId)
    if (!file) {
      return new Response('Story not found', { status: 404 })
    }

    try {
      const result = await renderStoryVariant(ctx, file, variantId)
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
<html lang="en" class="${theme.darkClass || ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #ffffff;
      --bg-secondary: #f5f5f5;
      --text: #333333;
      --text-secondary: #666666;
      --border: #e0e0e0;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
    }
    .dark {
      --bg: #1a1a1a;
      --bg-secondary: #2a2a2a;
      --text: #ffffff;
      --text-secondary: #a0a0a0;
      --border: #404040;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
    }
    .sidebar {
      width: 280px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      padding: 1rem;
    }
    .sidebar h1 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .story-list {
      list-style: none;
    }
    .story-item {
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 2px;
    }
    .story-item:hover {
      background: var(--border);
    }
    .story-item.active {
      background: var(--primary);
      color: white;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .toolbar button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
    }
    .toolbar button:hover {
      background: var(--bg-secondary);
    }
    .canvas {
      flex: 1;
      padding: 2rem;
      overflow: auto;
    }
    .canvas iframe {
      width: 100%;
      height: 100%;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: white;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
    }
    .render-error {
      padding: 1rem;
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 4px;
      color: #dc2626;
    }
    .render-error pre {
      margin-top: 0.5rem;
      white-space: pre-wrap;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <h1>📖 ${title}</h1>
    <ul class="story-list" id="story-list">
      <li class="empty-state">Loading stories...</li>
    </ul>
  </aside>
  <main class="main">
    <div class="toolbar">
      <button onclick="toggleTheme()">🌓 Toggle Theme</button>
      <select id="viewport" onchange="changeViewport(this.value)">
        <option value="">Responsive</option>
        ${ctx.config.responsivePresets.map(p => `<option value="${p.width}">${p.label}</option>`).join('')}
      </select>
      <select id="background" onchange="changeBackground(this.value)">
        ${ctx.config.backgroundPresets.map(p => `<option value="${p.color}">${p.label}</option>`).join('')}
      </select>
    </div>
    <div class="canvas" id="canvas">
      <div class="empty-state">Select a story from the sidebar</div>
    </div>
  </main>
  <script>
    let currentStory = null;

    // Load stories
    fetch('/api/stories')
      .then(r => r.json())
      .then(data => {
        const list = document.getElementById('story-list');
        if (data.files.length === 0) {
          list.innerHTML = '<li class="empty-state">No stories found</li>';
          return;
        }
        list.innerHTML = data.files.map(f =>
          '<li class="story-item" onclick="selectStory(\\'' + f.id + '\\')">' + f.fileName + '</li>'
        ).join('');
      });

    function selectStory(id) {
      currentStory = id;
      document.querySelectorAll('.story-item').forEach(el => el.classList.remove('active'));
      event.target.classList.add('active');

      const canvas = document.getElementById('canvas');
      canvas.innerHTML = '<div class="loading">Rendering component...</div>';

      fetch('/api/render/' + id + '/default')
        .then(r => r.json())
        .then(data => {
          if (data.errors && data.errors.length > 0) {
            canvas.innerHTML = '<div class="render-error"><strong>Render Error:</strong><pre>' +
              escapeHtml(data.errors.join('\\n')) + '</pre></div>';
            return;
          }

          // Create an iframe to isolate component styles
          const iframe = document.createElement('iframe');
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = '1px solid var(--border)';
          iframe.style.borderRadius = '4px';
          iframe.style.background = 'white';
          canvas.innerHTML = '';
          canvas.appendChild(iframe);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(\`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    \${data.css || ''}
  </style>
</head>
<body>
  \${data.html || ''}
  <script>\${data.js || ''}<\/script>
</body>
</html>\`);
          iframeDoc.close();
        })
        .catch(err => {
          canvas.innerHTML = '<div class="render-error"><strong>Error:</strong> ' + escapeHtml(err.message) + '</div>';
        });
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function toggleTheme() {
      document.documentElement.classList.toggle('dark');
    }

    function changeViewport(width) {
      const canvas = document.getElementById('canvas');
      if (width) {
        canvas.style.maxWidth = width + 'px';
        canvas.style.margin = '0 auto';
      } else {
        canvas.style.maxWidth = '';
        canvas.style.margin = '';
      }
    }

    function changeBackground(color) {
      document.getElementById('canvas').style.background = color;
    }

    // STX Story global object for HMR
    window.__stxStory = {
      currentStoryId: null,
      reloadCurrentStory: function() {
        if (currentStory) {
          selectStory(currentStory);
        }
      },
      refreshStoryList: function() {
        fetch('/api/stories')
          .then(r => r.json())
          .then(data => {
            const list = document.getElementById('story-list');
            if (data.files.length === 0) {
              list.innerHTML = '<li class="empty-state">No stories found</li>';
              return;
            }
            list.innerHTML = data.files.map(f =>
              '<li class="story-item" onclick="selectStory(\\'' + f.id + '\\')">' + f.fileName + '</li>'
            ).join('');
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
