/**
 * Craft Bridge Integration for stx
 *
 * Provides native desktop/mobile APIs when running in a Craft webview.
 * This module generates client-side JavaScript that can be injected into stx templates
 * to enable access to Craft's native capabilities.
 *
 * @example
 * ```html
 * <script>
 *   // In your stx template
 *   if (window.craft) {
 *     await window.craft.tray.setTitle('🎙️ Listening...')
 *     await window.craft.app.notify({ title: 'Ready', body: 'App is ready' })
 *   }
 * </script>
 * ```
 */

export interface CraftBridgeConfig {
  /**
   * Enable debug logging for bridge messages
   */
  debug?: boolean
  /**
   * Timeout for bridge requests in milliseconds
   */
  timeout?: number
  /**
   * Enable offline message queue
   */
  enableOfflineQueue?: boolean
}

/**
 * Client-side Craft bridge script
 * This gets injected into stx templates when running in a Craft webview
 */
export const CRAFT_BRIDGE_SCRIPT = `
<script>
(function() {
  'use strict';

  // Skip if already initialized or not in Craft environment
  if (window.__craftBridgeInitialized) return;
  window.__craftBridgeInitialized = true;

  // Message ID counter
  let messageId = 0;
  const generateId = () => 'msg_' + Date.now() + '_' + (++messageId);

  // Pending requests
  const pending = new Map();

  // Event listeners
  const eventListeners = new Map();

  // Configuration
  const config = {
    debug: false,
    timeout: 30000
  };

  // Send message to native
  function send(message) {
    const json = JSON.stringify(message);

    if (config.debug) {
      console.log('[Craft Bridge] Sending:', message.method, message.params);
    }

    // iOS WKWebView
    if (window.webkit?.messageHandlers?.craft) {
      window.webkit.messageHandlers.craft.postMessage(message);
      return true;
    }

    // Android WebView
    if (window.CraftBridge) {
      window.CraftBridge.postMessage(json);
      return true;
    }

    // Electron IPC
    if (window.craftIPC) {
      window.craftIPC.send('bridge-message', message);
      return true;
    }

    return false;
  }

  // Make a request and wait for response
  function request(method, params) {
    return new Promise((resolve, reject) => {
      const id = generateId();
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Request timeout: ' + method));
      }, config.timeout);

      pending.set(id, { resolve, reject, timeout });

      const sent = send({
        id,
        type: 'request',
        method,
        params
      });

      if (!sent) {
        clearTimeout(timeout);
        pending.delete(id);
        // Return gracefully if not in Craft environment
        resolve(undefined);
      }
    });
  }

  // Handle incoming messages
  function handleMessage(event) {
    let data;
    try {
      data = event.detail || (typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
    } catch (e) {
      return;
    }

    if (!data || !data.id) return;

    if (config.debug) {
      console.log('[Craft Bridge] Received:', data);
    }

    if (data.type === 'response') {
      const req = pending.get(data.id);
      if (req) {
        clearTimeout(req.timeout);
        pending.delete(data.id);
        if (data.error) {
          req.reject(new Error(data.error.message));
        } else {
          req.resolve(data.result);
        }
      }
    } else if (data.type === 'event' && data.method) {
      const listeners = eventListeners.get(data.method) || [];
      listeners.forEach(fn => fn(data.params));
    }
  }

  // Listen for messages
  window.addEventListener('message', handleMessage);
  window.addEventListener('craft-bridge-message', handleMessage);

  // Check if running in Craft
  function isCraft() {
    return !!(
      window.webkit?.messageHandlers?.craft ||
      window.CraftBridge ||
      window.craftIPC
    );
  }

  // Subscribe to events
  function on(event, callback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
    return () => {
      const listeners = eventListeners.get(event);
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  // Build the craft API object
  window.craft = {
    // Meta
    isCraft,
    on,
    config,

    // Window API
    window: {
      show: () => request('window.show'),
      hide: () => request('window.hide'),
      close: () => request('window.close'),
      minimize: () => request('window.minimize'),
      maximize: () => request('window.maximize'),
      restore: () => request('window.restore'),
      focus: () => request('window.focus'),
      blur: () => request('window.blur'),
      setTitle: (title) => request('window.setTitle', { title }),
      setSize: (width, height) => request('window.setSize', { width, height }),
      setPosition: (x, y) => request('window.setPosition', { x, y }),
      setFullscreen: (fullscreen) => request('window.setFullscreen', { fullscreen }),
      setAlwaysOnTop: (alwaysOnTop) => request('window.setAlwaysOnTop', { alwaysOnTop }),
      getSize: () => request('window.getSize'),
      getPosition: () => request('window.getPosition'),
      isFullscreen: () => request('window.isFullscreen'),
      isMaximized: () => request('window.isMaximized'),
      isMinimized: () => request('window.isMinimized'),
      isVisible: () => request('window.isVisible'),
      center: () => request('window.center'),
      toggleFullscreen: () => request('window.toggleFullscreen'),
      startDrag: () => request('window.startDrag'),
    },

    // System Tray/Menubar API
    tray: {
      setTitle: (title) => request('tray.setTitle', { title }),
      setTooltip: (tooltip) => request('tray.setTooltip', { tooltip }),
      setIcon: (icon) => request('tray.setIcon', { icon }),
      setMenu: (menu) => request('tray.setMenu', { menu }),
      show: () => request('tray.show'),
      hide: () => request('tray.hide'),
      onClick: (callback) => on('tray.click', callback),
      onDoubleClick: (callback) => on('tray.doubleClick', callback),
      onRightClick: (callback) => on('tray.rightClick', callback),
    },

    // App API
    app: {
      quit: () => request('app.quit'),
      hide: () => request('app.hide'),
      show: () => request('app.show'),
      focus: () => request('app.focus'),
      getInfo: () => request('app.getInfo'),
      getVersion: () => request('app.getVersion'),
      getName: () => request('app.getName'),
      getPath: (name) => request('app.getPath', { name }),
      isDarkMode: () => request('app.isDarkMode'),
      getLocale: () => request('app.getLocale'),
      setBadge: (badge) => request('app.setBadge', { badge }),
      hideDockIcon: () => request('app.hideDockIcon'),
      showDockIcon: () => request('app.showDockIcon'),
      notify: (options) => request('app.notify', options),
      registerShortcut: (accelerator, callback) => {
        const id = generateId();
        on('shortcut.' + id, callback);
        return request('app.registerShortcut', { accelerator, id });
      },
      unregisterShortcut: (accelerator) => request('app.unregisterShortcut', { accelerator }),
    },

    // Dialog API
    dialog: {
      openFile: (options) => request('dialog.openFile', options),
      openFolder: (options) => request('dialog.openFolder', options),
      saveFile: (options) => request('dialog.saveFile', options),
      showAlert: (options) => request('dialog.showAlert', options),
      showConfirm: (options) => request('dialog.showConfirm', options),
      showPrompt: (options) => request('dialog.showPrompt', options),
      showColorPicker: (options) => request('dialog.showColorPicker', options),
    },

    // Clipboard API
    clipboard: {
      writeText: (text) => request('clipboard.writeText', { text }),
      readText: () => request('clipboard.readText'),
      writeHTML: (html) => request('clipboard.writeHTML', { html }),
      readHTML: () => request('clipboard.readHTML'),
      clear: () => request('clipboard.clear'),
    },

    // File System API (limited for security)
    fs: {
      readFile: (path, encoding) => request('fs.readFile', { path, encoding }),
      writeFile: (path, content, encoding) => request('fs.writeFile', { path, content, encoding }),
      exists: (path) => request('fs.exists', { path }),
      stat: (path) => request('fs.stat', { path }),
      readDir: (path) => request('fs.readDir', { path }),
      createDir: (path, recursive) => request('fs.createDir', { path, recursive }),
      remove: (path, recursive) => request('fs.remove', { path, recursive }),
    },

    // Process/Shell API (limited for security)
    process: {
      exec: (command, options) => request('process.exec', { command, ...options }),
      spawn: (command, args, options) => request('process.spawn', { command, args, ...options }),
      env: () => request('process.env'),
      cwd: () => request('process.cwd'),
      platform: () => request('process.platform'),
    },

    // Native component helpers
    components: {
      createSidebar: (config) => request('component.createSidebar', config),
      createFileBrowser: (config) => request('component.createFileBrowser', config),
      createSplitView: (config) => request('component.createSplitView', config),
      updateComponent: (id, props) => request('component.update', { componentId: id, props }),
      destroyComponent: (id) => request('component.destroy', { componentId: id }),
    }
  };

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('craft:ready', { detail: { isCraft: isCraft() } }));

  if (config.debug) {
    console.log('[Craft Bridge] Initialized, isCraft:', isCraft());
  }
})();
</script>
`

/**
 * Generate the Craft bridge script with custom configuration
 */
export function generateCraftBridgeScript(config: CraftBridgeConfig = {}): string {
  const { debug = false, timeout = 30000 } = config

  return CRAFT_BRIDGE_SCRIPT.replace(
    'debug: false,',
    `debug: ${debug},`,
  ).replace(
    'timeout: 30000',
    `timeout: ${timeout}`,
  )
}

/**
 * Check if the current environment supports Craft
 * This is for server-side detection
 */
export function isCraftEnvironment(): boolean {
  // Server-side, we can't detect this directly
  // The client-side script handles detection
  return false
}

/**
 * Craft directive for stx templates
 * Injects the Craft bridge script when the template is processed
 *
 * Usage in template:
 * @craft
 * or
 * @craft({ debug: true })
 */
export function processCraftDirective(
  content: string,
  _context: Record<string, unknown> = {},
): string {
  // Check if @craft directive is present
  const craftDirectivePattern = /@craft(?:\(([\s\S]*?)\))?/g

  return content.replace(craftDirectivePattern, (match, configStr) => {
    let config: CraftBridgeConfig = {}

    if (configStr) {
      try {
        // Parse the config object
        config = JSON.parse(configStr.replace(/'/g, '"'))
      }
      catch {
        // Try evaluating as JS object literal
        try {
          // eslint-disable-next-line no-new-func
          config = new Function(`return ${configStr}`)()
        }
        catch {
          console.warn(`[stx] Invalid @craft config: ${configStr}`)
        }
      }
    }

    return generateCraftBridgeScript(config)
  })
}

/**
 * Auto-inject Craft bridge into head if not already present
 */
export function injectCraftBridge(
  html: string,
  config: CraftBridgeConfig = {},
): string {
  // Check if bridge is already injected
  if (html.includes('__craftBridgeInitialized')) {
    return html
  }

  const script = generateCraftBridgeScript(config)

  // Try to inject before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${script}\n</head>`)
  }

  // Try to inject after <body>
  if (html.includes('<body')) {
    return html.replace(/(<body[^>]*>)/, `$1\n${script}`)
  }

  // Prepend to content
  return script + html
}

const craftBridge: {
  CRAFT_BRIDGE_SCRIPT: string
  generateCraftBridgeScript: typeof generateCraftBridgeScript
  processCraftDirective: typeof processCraftDirective
  injectCraftBridge: typeof injectCraftBridge
  isCraftEnvironment: typeof isCraftEnvironment
} = {
  CRAFT_BRIDGE_SCRIPT,
  generateCraftBridgeScript,
  processCraftDirective,
  injectCraftBridge,
  isCraftEnvironment,
}

export default craftBridge
