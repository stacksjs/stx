/**
 * Hot Reload Module
 *
 * Provides WebSocket-based hot module reload (HMR) for the stx dev server.
 * When template files change, connected browsers automatically refresh.
 *
 * ## Features
 *
 * - WebSocket server for real-time browser communication
 * - Client script injection into HTML
 * - Full page reload on template changes
 * - CSS-only updates without full reload (when possible)
 * - Connection status overlay
 * - Automatic reconnection on disconnect
 *
 * ## Usage
 *
 * The hot reload is automatically enabled when using `stx dev` or `serveStxFile()`.
 * No additional configuration needed.
 *
 * ## Architecture
 *
 * ```
 * File System Watch → HMR Server → WebSocket → Browser Client → Reload
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface HotReloadOptions {
  /** WebSocket port (defaults to HTTP port + 1) */
  wsPort?: number
  /** Show connection overlay in browser */
  showOverlay?: boolean
  /** Reconnection interval in ms */
  reconnectInterval?: number
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number
  /** Log verbose messages */
  verbose?: boolean
}

export interface HotReloadMessage {
  type: 'reload' | 'css-update' | 'connected' | 'error'
  path?: string
  content?: string
  timestamp?: number
}

interface WebSocketClient {
  send: (data: string) => void
  close: () => void
  readyState: number
}

// =============================================================================
// Hot Reload Server
// =============================================================================

/**
 * Hot Reload Server
 *
 * Manages WebSocket connections and broadcasts reload messages to browsers.
 */
export class HotReloadServer {
  private clients: Set<WebSocketClient> = new Set()
  private server: ReturnType<typeof Bun.serve> | null = null
  private options: Required<HotReloadOptions>

  constructor(options: HotReloadOptions = {}) {
    this.options = {
      wsPort: options.wsPort ?? 3001,
      showOverlay: options.showOverlay ?? true,
      reconnectInterval: options.reconnectInterval ?? 1000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      verbose: options.verbose ?? false,
    }
  }

  /**
   * Start the WebSocket server
   */
  start(port?: number): number {
    let wsPort = port ?? this.options.wsPort
    const maxAttempts = 20

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.server = Bun.serve({
          port: wsPort,
          fetch(req, server) {
            // Upgrade HTTP requests to WebSocket
            const success = server.upgrade(req, { data: {} })
            if (success) {
              return undefined
            }
            // Return info for non-WebSocket requests
            return new Response('stx Hot Reload Server', {
              headers: { 'Content-Type': 'text/plain' },
            })
          },
          websocket: {
            open: (ws) => {
              this.clients.add(ws as unknown as WebSocketClient)
              if (this.options.verbose) {
                console.log(`[HMR] Client connected (${this.clients.size} total)`)
              }
              // Send connected message
              ws.send(JSON.stringify({
                type: 'connected',
                timestamp: Date.now(),
              } as HotReloadMessage))
            },
            close: (ws) => {
              this.clients.delete(ws as unknown as WebSocketClient)
              if (this.options.verbose) {
                console.log(`[HMR] Client disconnected (${this.clients.size} total)`)
              }
            },
            message: (_ws, message) => {
              // Handle ping/pong for connection keep-alive
              if (message === 'ping') {
                // Pong is automatic in Bun
              }
            },
          },
        })

        if (this.options.verbose) {
          console.log(`[HMR] WebSocket server started on port ${wsPort}`)
        }

        return wsPort
      }
      catch (error: unknown) {
        const err = error as { code?: string }
        if (err?.code === 'EADDRINUSE') {
          // Port is in use, try the next one
          wsPort++
          continue
        }
        // Re-throw other errors
        throw error
      }
    }

    throw new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${port ?? this.options.wsPort}`)
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    // Close all client connections
    for (const client of this.clients) {
      try {
        client.close()
      }
      catch {
        // Ignore close errors
      }
    }
    this.clients.clear()

    // Stop the server
    if (this.server) {
      this.server.stop()
      this.server = null
    }

    if (this.options.verbose) {
      console.log('[HMR] Server stopped')
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: HotReloadMessage): void {
    const data = JSON.stringify(message)
    let sent = 0

    for (const client of this.clients) {
      try {
        if (client.readyState === 1) { // OPEN
          client.send(data)
          sent++
        }
      }
      catch {
        // Remove dead clients
        this.clients.delete(client)
      }
    }

    if (this.options.verbose && sent > 0) {
      console.log(`[HMR] Broadcast ${message.type} to ${sent} client(s)`)
    }
  }

  /**
   * Trigger a full page reload
   */
  reload(filePath?: string): void {
    if (this.options.verbose) {
      console.log(`[HMR] Sending reload to ${this.clients.size} client(s) for: ${filePath || 'all'}`)
    }
    this.broadcast({
      type: 'reload',
      path: filePath,
      timestamp: Date.now(),
    })
  }

  /**
   * Trigger a CSS-only update (no full reload)
   */
  updateCss(filePath: string, content?: string): void {
    this.broadcast({
      type: 'css-update',
      path: filePath,
      content,
      timestamp: Date.now(),
    })
  }

  /**
   * Send an error message to clients
   */
  error(message: string): void {
    this.broadcast({
      type: 'error',
      content: message,
      timestamp: Date.now(),
    })
  }

  /**
   * Get the number of connected clients
   */
  get clientCount(): number {
    return this.clients.size
  }

  /**
   * Get the WebSocket port
   */
  get port(): number {
    return this.options.wsPort
  }
}

// =============================================================================
// Client Script Generation
// =============================================================================

/**
 * Generate the hot reload client script to inject into HTML
 */
export function generateHotReloadScript(wsPort: number, options: HotReloadOptions = {}): string {
  const {
    showOverlay = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 10,
  } = options

  return `
<script>
(function() {
  // stx Hot Reload Client
  var wsUrl = 'ws://' + window.location.hostname + ':${wsPort}';
  var reconnectAttempts = 0;
  var maxAttempts = ${maxReconnectAttempts};
  var reconnectInterval = ${reconnectInterval};
  var socket = null;
  var overlay = null;
  var wasConnected = false; // Track if we ever connected successfully

  ${showOverlay
    ? `
  // Create connection status overlay
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'stx-hmr-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:8px 16px;background:#f59e0b;color:#000;font-family:system-ui,sans-serif;font-size:14px;text-align:center;z-index:999999;display:none;';
    document.body.appendChild(overlay);
  }

  function showOverlay(message, isError) {
    // Only show overlay if we were previously connected (don't show during initial connection)
    if (!wasConnected && !isError) return;
    if (!overlay) createOverlay();
    overlay.textContent = message;
    overlay.style.background = isError ? '#ef4444' : '#f59e0b';
    overlay.style.color = isError ? '#fff' : '#000';
    overlay.style.display = 'block';
  }

  function hideOverlay() {
    if (overlay) overlay.style.display = 'none';
  }
  `
    : `
  function showOverlay() {}
  function hideOverlay() {}
  `}

  function connect() {
    try {
      socket = new WebSocket(wsUrl);
    } catch (e) {
      // Silent fail for initial connection attempts
      if (wasConnected) {
        scheduleReconnect();
      }
      return;
    }

    socket.onopen = function() {
      console.log('[stx] Hot reload connected');
      wasConnected = true;
      reconnectAttempts = 0;
      hideOverlay();
    };

    socket.onmessage = function(event) {
      try {
        var msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'reload':
            console.log('[stx] Reloading...', msg.path || '');
            window.location.reload();
            break;

          case 'css-update':
            console.log('[stx] CSS update:', msg.path);
            updateCss(msg.path, msg.content);
            break;

          case 'error':
            console.error('[stx] Error:', msg.content);
            showOverlay('Build Error: ' + msg.content, true);
            break;

          case 'connected':
            console.log('[stx] Server ready');
            break;
        }
      } catch (e) {
        console.error('[stx] Invalid message:', e);
      }
    };

    socket.onclose = function() {
      socket = null;
      // Only log and show overlay if we were previously connected
      if (wasConnected) {
        console.log('[stx] Connection closed, reconnecting...');
        scheduleReconnect();
      } else {
        // Silently retry initial connection
        setTimeout(connect, reconnectInterval);
      }
    };

    socket.onerror = function() {
      // Errors are handled in onclose
    };
  }

  function scheduleReconnect() {
    if (reconnectAttempts < maxAttempts) {
      reconnectAttempts++;
      showOverlay('Reconnecting... (' + reconnectAttempts + '/' + maxAttempts + ')');
      setTimeout(connect, reconnectInterval);
    } else {
      showOverlay('Connection lost. Refresh to reconnect.', true);
    }
  }

  // CSS hot update without full reload
  function updateCss(path, content) {
    // Try to find and update existing stylesheet
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href && href.indexOf(path) !== -1) {
        // Add cache-busting query param
        var newHref = href.split('?')[0] + '?t=' + Date.now();
        links[i].setAttribute('href', newHref);
        return;
      }
    }

    // If content provided, inject as style tag
    if (content) {
      var style = document.createElement('style');
      style.setAttribute('data-stx-hmr', path);
      style.textContent = content;

      // Remove old injected style
      var old = document.querySelector('style[data-stx-hmr="' + path + '"]');
      if (old) old.remove();

      document.head.appendChild(style);
    }
  }

  // Start connection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }

  // Expose for debugging
  window.__stxHmr = {
    reconnect: connect,
    status: function() { return socket ? socket.readyState : -1; }
  };
})();
</script>
`
}

/**
 * Inject hot reload script into HTML content
 */
export function injectHotReload(html: string, wsPort: number, options: HotReloadOptions = {}): string {
  const script = generateHotReloadScript(wsPort, options)

  // Try to inject before </body>
  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}</body>`)
  }

  // Try to inject before </html>
  if (html.includes('</html>')) {
    return html.replace('</html>', `${script}</html>`)
  }

  // Append to end if no closing tags found
  return html + script
}

// =============================================================================
// File Watcher Integration
// =============================================================================

/**
 * Determine if a file change should trigger a CSS-only update
 */
export function isCssOnlyChange(filename: string): boolean {
  const ext = filename.toLowerCase()
  return ext.endsWith('.css') || ext.endsWith('.scss') || ext.endsWith('.sass') || ext.endsWith('.less')
}

/**
 * Determine if a file change should trigger a reload
 */
export function shouldReloadOnChange(filename: string): boolean {
  const ext = filename.toLowerCase()
  const reloadExtensions = ['.stx', '.html', '.htm', '.md', '.js', '.ts', '.jsx', '.tsx', '.json']
  return reloadExtensions.some(e => ext.endsWith(e))
}

/**
 * Determine if a file should be ignored
 */
export function shouldIgnoreFile(filename: string): boolean {
  // Ignore hidden files, node_modules, and temp files
  const ignorePatterns = [
    /^\./,
    /node_modules/,
    /\.stx\/output/,
    /\.stx\/cache/,
    /~$/,
    /\.swp$/,
    /\.swo$/,
  ]
  return ignorePatterns.some(pattern => pattern.test(filename))
}

// =============================================================================
// Singleton Instance
// =============================================================================

let globalHmrServer: HotReloadServer | null = null

/**
 * Get or create the global HMR server instance
 */
export function getHmrServer(options?: HotReloadOptions): HotReloadServer {
  if (!globalHmrServer) {
    globalHmrServer = new HotReloadServer(options)
  }
  return globalHmrServer
}

/**
 * Stop and clear the global HMR server
 */
export function stopHmrServer(): void {
  if (globalHmrServer) {
    globalHmrServer.stop()
    globalHmrServer = null
  }
}
