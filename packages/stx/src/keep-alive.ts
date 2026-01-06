/**
 * STX Keep-Alive
 *
 * Caches component instances to preserve state when toggling visibility.
 * Similar to Vue's <KeepAlive> component.
 *
 * @module keep-alive
 *
 * @example
 * ```html
 * @keepAlive
 *   @if (currentTab === 'settings')
 *     <SettingsPanel />
 *   @elseif (currentTab === 'profile')
 *     <ProfilePanel />
 *   @endif
 * @endkeepAlive
 * ```
 *
 * With options:
 * ```html
 * @keepAlive(max: 10, include: 'Settings,Profile', exclude: 'Debug')
 *   <component :is="currentComponent" />
 * @endkeepAlive
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface KeepAliveOptions {
  /** Maximum number of component instances to cache */
  max?: number
  /** Comma-separated list of component names to include */
  include?: string
  /** Comma-separated list of component names to exclude */
  exclude?: string
  /** Custom cache key */
  id?: string
}

export interface CachedComponent {
  /** Component identifier */
  key: string
  /** Cached HTML content */
  html: string
  /** Cached state data */
  state: Record<string, unknown>
  /** Timestamp when cached */
  cachedAt: number
  /** Scroll positions */
  scrollPositions: Map<string, { top: number; left: number }>
}

export interface KeepAliveCache {
  /** Unique cache ID */
  id: string
  /** Cached components (LRU order) */
  cache: Map<string, CachedComponent>
  /** Maximum cache size */
  max: number
  /** Include filter */
  include: string[] | null
  /** Exclude filter */
  exclude: string[] | null
}

// =============================================================================
// Keep-Alive Processing
// =============================================================================

/** Counter for generating unique keep-alive IDs */
let keepAliveIdCounter = 0

/**
 * Generate a unique keep-alive ID.
 */
function generateKeepAliveId(): string {
  return `keep-alive-${++keepAliveIdCounter}-${Date.now().toString(36)}`
}

/**
 * Process @keepAlive directives in templates.
 *
 * Syntax:
 *   @keepAlive
 *     <content to cache>
 *   @endkeepAlive
 *
 * With options:
 *   @keepAlive(max: 10, include: 'ComponentA,ComponentB')
 */
export function processKeepAliveDirectives(
  template: string,
  _context: Record<string, unknown> = {},
  _filePath?: string,
): string {
  const keepAliveRegex = /@keepAlive(?:\s*\(([^)]*)\))?\s*([\s\S]*?)@endkeepAlive/gi

  return template.replace(keepAliveRegex, (_match, optionsStr, content) => {
    const keepAliveId = generateKeepAliveId()
    const options = parseKeepAliveOptions(optionsStr || '')

    return generateKeepAliveHtml(keepAliveId, content.trim(), options)
  })
}

/**
 * Parse keep-alive options from directive string.
 */
function parseKeepAliveOptions(optionsStr: string): KeepAliveOptions {
  const options: KeepAliveOptions = {
    max: 10,
  }

  const keyValueRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+)|(\w+))/g
  let match

  while ((match = keyValueRegex.exec(optionsStr)) !== null) {
    const key = match[1]
    const strValue = match[2] || match[3]
    const numValue = match[4]

    switch (key) {
      case 'max':
        options.max = numValue ? parseInt(numValue, 10) : 10
        break
      case 'include':
        options.include = strValue
        break
      case 'exclude':
        options.exclude = strValue
        break
      case 'id':
        options.id = strValue
        break
    }
  }

  return options
}

/**
 * Generate HTML for a keep-alive container.
 */
function generateKeepAliveHtml(
  keepAliveId: string,
  content: string,
  options: KeepAliveOptions,
): string {
  const { max, include, exclude } = options
  const customId = options.id || keepAliveId

  return `
<div class="stx-keep-alive" data-keep-alive-id="${keepAliveId}" data-custom-id="${customId}">
  <div class="stx-keep-alive-content" data-keep-alive-content="${keepAliveId}">
    ${content}
  </div>
  <div class="stx-keep-alive-cache" data-keep-alive-cache="${keepAliveId}" style="display: none;">
  </div>
</div>
<script>
(function() {
  const keepAliveId = '${keepAliveId}';
  const customId = '${customId}';
  const maxCache = ${max || 10};
  const includeFilter = ${include ? JSON.stringify(include.split(',').map((s: string) => s.trim())) : 'null'};
  const excludeFilter = ${exclude ? JSON.stringify(exclude.split(',').map((s: string) => s.trim())) : 'null'};

  const container = document.querySelector('[data-keep-alive-id="' + keepAliveId + '"]');
  const contentEl = document.querySelector('[data-keep-alive-content="' + keepAliveId + '"]');
  const cacheEl = document.querySelector('[data-keep-alive-cache="' + keepAliveId + '"]');

  if (!container || !contentEl || !cacheEl) return;

  // LRU Cache
  const cache = new Map();
  const cacheOrder = [];

  // Check if component should be cached
  function shouldCache(componentName) {
    if (excludeFilter && excludeFilter.includes(componentName)) {
      return false;
    }
    if (includeFilter && !includeFilter.includes(componentName)) {
      return false;
    }
    return true;
  }

  // Get component key from element
  function getComponentKey(element) {
    // Try various ways to identify the component
    return element.getAttribute('data-component') ||
           element.getAttribute('data-key') ||
           element.id ||
           element.className.split(' ')[0] ||
           element.tagName.toLowerCase();
  }

  // Save scroll positions
  function saveScrollPositions(element) {
    const positions = new Map();
    element.querySelectorAll('[data-keep-scroll]').forEach(function(el) {
      const key = el.getAttribute('data-keep-scroll') || el.id || 'default';
      positions.set(key, { top: el.scrollTop, left: el.scrollLeft });
    });
    // Also save the element's own scroll if scrollable
    if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
      positions.set('__self__', { top: element.scrollTop, left: element.scrollLeft });
    }
    return positions;
  }

  // Restore scroll positions
  function restoreScrollPositions(element, positions) {
    if (!positions) return;

    positions.forEach(function(pos, key) {
      if (key === '__self__') {
        element.scrollTop = pos.top;
        element.scrollLeft = pos.left;
      } else {
        const el = element.querySelector('[data-keep-scroll="' + key + '"]') ||
                   document.getElementById(key);
        if (el) {
          el.scrollTop = pos.top;
          el.scrollLeft = pos.left;
        }
      }
    });
  }

  // Save component state (form values, etc.)
  function saveComponentState(element) {
    const state = {};

    // Save form inputs
    element.querySelectorAll('input, textarea, select').forEach(function(input, index) {
      const key = input.name || input.id || 'input_' + index;
      if (input.type === 'checkbox' || input.type === 'radio') {
        state[key] = input.checked;
      } else {
        state[key] = input.value;
      }
    });

    // Save data attributes marked for keeping
    element.querySelectorAll('[data-keep-state]').forEach(function(el) {
      const key = el.getAttribute('data-keep-state');
      const value = el.getAttribute('data-state-value') || el.textContent;
      state['__data__' + key] = value;
    });

    return state;
  }

  // Restore component state
  function restoreComponentState(element, state) {
    if (!state) return;

    // Restore form inputs
    element.querySelectorAll('input, textarea, select').forEach(function(input, index) {
      const key = input.name || input.id || 'input_' + index;
      if (state[key] !== undefined) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = state[key];
        } else {
          input.value = state[key];
        }
      }
    });
  }

  // Cache a component
  function cacheComponent(key, element) {
    if (!shouldCache(key)) return;

    // Remove from cache order if exists (for LRU)
    const existingIndex = cacheOrder.indexOf(key);
    if (existingIndex > -1) {
      cacheOrder.splice(existingIndex, 1);
    }

    // Evict oldest if at max capacity
    while (cacheOrder.length >= maxCache) {
      const oldestKey = cacheOrder.shift();
      const oldCached = cache.get(oldestKey);
      if (oldCached && oldCached.element) {
        oldCached.element.remove();
      }
      cache.delete(oldestKey);
    }

    // Clone and cache
    const clone = element.cloneNode(true);
    clone.style.display = 'none';
    clone.setAttribute('data-cached-key', key);

    const cached = {
      key: key,
      element: clone,
      state: saveComponentState(element),
      scrollPositions: saveScrollPositions(element),
      cachedAt: Date.now()
    };

    cache.set(key, cached);
    cacheOrder.push(key);
    cacheEl.appendChild(clone);

    // Dispatch deactivated event
    element.dispatchEvent(new CustomEvent('stx:deactivated', {
      detail: { key: key, keepAliveId: keepAliveId },
      bubbles: true
    }));
  }

  // Restore a component from cache
  function restoreComponent(key) {
    const cached = cache.get(key);
    if (!cached) return null;

    // Move to end of cache order (most recently used)
    const index = cacheOrder.indexOf(key);
    if (index > -1) {
      cacheOrder.splice(index, 1);
      cacheOrder.push(key);
    }

    // Clone the cached element
    const restored = cached.element.cloneNode(true);
    restored.style.display = '';
    restored.removeAttribute('data-cached-key');

    // Restore state after a tick (to let DOM settle)
    setTimeout(function() {
      restoreComponentState(restored, cached.state);
      restoreScrollPositions(restored, cached.scrollPositions);

      // Dispatch activated event
      restored.dispatchEvent(new CustomEvent('stx:activated', {
        detail: { key: key, keepAliveId: keepAliveId, cachedAt: cached.cachedAt },
        bubbles: true
      }));
    }, 0);

    return restored;
  }

  // Check if component is cached
  function isCached(key) {
    return cache.has(key);
  }

  // Clear cache
  function clearCache(key) {
    if (key) {
      const cached = cache.get(key);
      if (cached && cached.element) {
        cached.element.remove();
      }
      cache.delete(key);
      const index = cacheOrder.indexOf(key);
      if (index > -1) {
        cacheOrder.splice(index, 1);
      }
    } else {
      cache.forEach(function(cached) {
        if (cached.element) {
          cached.element.remove();
        }
      });
      cache.clear();
      cacheOrder.length = 0;
    }
  }

  // Expose API
  window.STX = window.STX || {};
  window.STX.keepAlive = window.STX.keepAlive || { instances: {} };
  window.STX.keepAlive.instances[keepAliveId] = {
    id: keepAliveId,
    customId: customId,
    cache: cacheComponent,
    restore: restoreComponent,
    isCached: isCached,
    clear: clearCache,
    getCacheKeys: function() { return Array.from(cache.keys()); },
    getCacheSize: function() { return cache.size; }
  };

  // Observe for component changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Handle removed nodes (cache them)
      mutation.removedNodes.forEach(function(node) {
        if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute && !node.hasAttribute('data-cached-key')) {
          const key = getComponentKey(node);
          if (key && shouldCache(key)) {
            // Check if this removal is intentional (not just DOM restructuring)
            if (!contentEl.contains(node)) {
              cacheComponent(key, node);
            }
          }
        }
      });

      // Handle added nodes (check if we should restore from cache)
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute) {
          const key = getComponentKey(node);
          if (key && isCached(key)) {
            const restored = restoreComponent(key);
            if (restored) {
              node.replaceWith(restored);
            }
          }
        }
      });
    });
  });

  observer.observe(contentEl, { childList: true, subtree: true });

  // Cleanup on removal
  container.addEventListener('stx:destroy', function() {
    observer.disconnect();
    clearCache();
  });
})();
</script>
`
}

// =============================================================================
// Programmatic Keep-Alive API
// =============================================================================

/**
 * Create a keep-alive cache programmatically.
 */
export function createKeepAliveCache(options: KeepAliveOptions = {}): KeepAliveCache {
  const id = options.id || generateKeepAliveId()

  return {
    id,
    cache: new Map(),
    max: options.max || 10,
    include: options.include ? options.include.split(',').map(s => s.trim()) : null,
    exclude: options.exclude ? options.exclude.split(',').map(s => s.trim()) : null,
  }
}

/**
 * Check if a component should be cached based on filters.
 */
export function shouldCacheComponent(
  componentName: string,
  cache: KeepAliveCache,
): boolean {
  if (cache.exclude && cache.exclude.includes(componentName)) {
    return false
  }
  if (cache.include && !cache.include.includes(componentName)) {
    return false
  }
  return true
}

// =============================================================================
// CSS for Keep-Alive
// =============================================================================

/**
 * Generate CSS for keep-alive styling.
 */
export function generateKeepAliveCSS(): string {
  return `
/* STX Keep-Alive Styles */
.stx-keep-alive {
  position: relative;
}

.stx-keep-alive-cache {
  display: none !important;
  visibility: hidden;
  position: absolute;
  pointer-events: none;
}

/* Activation transition */
.stx-keep-alive-content > * {
  transition: opacity 0.15s ease;
}

.stx-keep-alive-content > [data-activating] {
  opacity: 0;
}

.stx-keep-alive-content > [data-activated] {
  opacity: 1;
}
`
}

// =============================================================================
// Client Runtime
// =============================================================================

/**
 * Generate client-side runtime for keep-alive.
 */
export function generateKeepAliveRuntime(): string {
  return `
// STX Keep-Alive Runtime
(function() {
  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};
  window.STX.keepAlive = window.STX.keepAlive || { instances: {} };

  // Global keep-alive utilities
  window.STX.keepAlive.clearAll = function() {
    Object.values(window.STX.keepAlive.instances).forEach(function(instance) {
      instance.clear();
    });
  };

  window.STX.keepAlive.getTotalCached = function() {
    return Object.values(window.STX.keepAlive.instances).reduce(function(total, instance) {
      return total + instance.getCacheSize();
    }, 0);
  };

  // Lifecycle hooks for keep-alive
  window.STX.onActivated = function(callback) {
    document.addEventListener('stx:activated', function(e) {
      callback(e.detail);
    });
  };

  window.STX.onDeactivated = function(callback) {
    document.addEventListener('stx:deactivated', function(e) {
      callback(e.detail);
    });
  };

  console.log('[stx] Keep-alive runtime initialized');
})();
`
}

// =============================================================================
// Lifecycle Hooks for Keep-Alive
// =============================================================================

/**
 * Hook called when a component is activated from cache.
 * Use in client-side scripts.
 */
export function onActivated(callback: (detail: { key: string; keepAliveId: string; cachedAt: number }) => void): void {
  if (typeof document !== 'undefined') {
    document.addEventListener('stx:activated', ((e: CustomEvent) => {
      callback(e.detail)
    }) as EventListener)
  }
}

/**
 * Hook called when a component is deactivated and cached.
 * Use in client-side scripts.
 */
export function onDeactivated(callback: (detail: { key: string; keepAliveId: string }) => void): void {
  if (typeof document !== 'undefined') {
    document.addEventListener('stx:deactivated', ((e: CustomEvent) => {
      callback(e.detail)
    }) as EventListener)
  }
}
