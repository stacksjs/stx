/**
 * STX Async Components
 *
 * Provides lazy loading capabilities for components with loading and error states.
 *
 * @module async-components
 *
 * @example
 * ```html
 * @async(component: 'HeavyChart', timeout: 5000)
 *   <div class="loading">Loading chart...</div>
 * @error
 *   <div class="error">Failed to load chart</div>
 * @endasync
 * ```
 *
 * Or inline:
 * ```html
 * <AsyncComponent
 *   :component="() => import('./HeavyChart.stx')"
 *   :timeout="5000"
 * >
 *   <template #loading>Loading...</template>
 *   <template #error="{ error }">Error: {{ error.message }}</template>
 * </AsyncComponent>
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface AsyncComponentOptions {
  /** Component path or name to load */
  component: string
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Delay before showing loading state in ms (default: 200) */
  delay?: number
  /** Whether to suspend parent Suspense boundary */
  suspensible?: boolean
  /** Custom loading component */
  loadingComponent?: string
  /** Custom error component */
  errorComponent?: string
  /** Retry attempts on failure (default: 0) */
  retries?: number
  /** Props to pass to the loaded component */
  props?: Record<string, unknown>
}

export interface AsyncComponentState {
  /** Current loading state */
  status: 'pending' | 'loading' | 'resolved' | 'rejected'
  /** The loaded component content */
  component: string | null
  /** Error if loading failed */
  error: Error | null
  /** Number of retry attempts made */
  attempts: number
}

// =============================================================================
// Async Component Processing
// =============================================================================

/** Counter for generating unique async component IDs */
let asyncIdCounter = 0

/**
 * Generate a unique async component ID.
 */
function generateAsyncId(): string {
  return `async-${++asyncIdCounter}-${Date.now().toString(36)}`
}

/**
 * Process @async directives in templates.
 *
 * Syntax:
 *   @async(component: 'ComponentName', timeout: 5000)
 *     <loading content>
 *   @error
 *     <error content>
 *   @endasync
 */
export function processAsyncDirectives(
  template: string,
  _context: Record<string, unknown> = {},
  _filePath?: string,
): string {
  // Match @async ... @error ... @endasync (error section is optional)
  const asyncWithErrorRegex = /@async\s*\(([^)]*)\)\s*([\s\S]*?)@error\s*([\s\S]*?)@endasync/gi
  const asyncWithoutErrorRegex = /@async\s*\(([^)]*)\)\s*([\s\S]*?)@endasync/gi

  let result = template

  // First, process @async blocks with @error
  result = result.replace(asyncWithErrorRegex, (_match, optionsStr, loadingContent, errorContent) => {
    const asyncId = generateAsyncId()
    const options = parseAsyncOptions(optionsStr)

    return generateAsyncComponentHtml(
      asyncId,
      options,
      loadingContent.trim(),
      errorContent.trim(),
    )
  })

  // Then, process @async blocks without @error
  result = result.replace(asyncWithoutErrorRegex, (_match, optionsStr, loadingContent) => {
    const asyncId = generateAsyncId()
    const options = parseAsyncOptions(optionsStr)

    return generateAsyncComponentHtml(
      asyncId,
      options,
      loadingContent.trim(),
      '<div class="stx-async-error">Failed to load component</div>',
    )
  })

  return result
}

/**
 * Parse async component options from directive string.
 */
function parseAsyncOptions(optionsStr: string): AsyncComponentOptions {
  const options: AsyncComponentOptions = {
    component: '',
    timeout: 30000,
    delay: 200,
    suspensible: true,
    retries: 0,
  }

  // Match key: 'value' or key: value patterns
  const keyValueRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+)|(\w+))/g
  let match

  while ((match = keyValueRegex.exec(optionsStr)) !== null) {
    const key = match[1]
    const strValue = match[2] || match[3]
    const numValue = match[4]
    const boolOrId = match[5]

    switch (key) {
      case 'component':
        options.component = strValue || boolOrId || ''
        break
      case 'timeout':
        options.timeout = numValue ? parseInt(numValue, 10) : 30000
        break
      case 'delay':
        options.delay = numValue ? parseInt(numValue, 10) : 200
        break
      case 'suspensible':
        options.suspensible = boolOrId === 'true'
        break
      case 'retries':
        options.retries = numValue ? parseInt(numValue, 10) : 0
        break
      case 'loadingComponent':
        options.loadingComponent = strValue || boolOrId
        break
      case 'errorComponent':
        options.errorComponent = strValue || boolOrId
        break
    }
  }

  return options
}

/**
 * Generate HTML for an async component.
 */
function generateAsyncComponentHtml(
  asyncId: string,
  options: AsyncComponentOptions,
  loadingContent: string,
  errorContent: string,
): string {
  const { component, timeout, delay, suspensible, retries } = options

  return `
<div class="stx-async-component" data-async-id="${asyncId}" data-component="${component}" data-status="pending">
  <div class="stx-async-loading" data-async-loading="${asyncId}">
    ${loadingContent}
  </div>
  <div class="stx-async-content" data-async-content="${asyncId}" style="display: none;">
  </div>
  <div class="stx-async-error" data-async-error="${asyncId}" style="display: none;">
    ${errorContent}
  </div>
</div>
<script>
(function() {
  const asyncId = '${asyncId}';
  const componentPath = '${component}';
  const timeout = ${timeout};
  const delay = ${delay};
  const suspensible = ${suspensible};
  const maxRetries = ${retries};

  const container = document.querySelector('[data-async-id="' + asyncId + '"]');
  const loadingEl = document.querySelector('[data-async-loading="' + asyncId + '"]');
  const contentEl = document.querySelector('[data-async-content="' + asyncId + '"]');
  const errorEl = document.querySelector('[data-async-error="' + asyncId + '"]');

  if (!container || !loadingEl || !contentEl || !errorEl) return;

  let attempts = 0;
  let delayTimer = null;
  let timeoutTimer = null;
  let resolved = false;

  // Update state
  function setState(status) {
    container.setAttribute('data-status', status);
    loadingEl.style.display = status === 'loading' ? '' : 'none';
    contentEl.style.display = status === 'resolved' ? '' : 'none';
    errorEl.style.display = status === 'rejected' ? '' : 'none';
  }

  // Show loading after delay
  function showLoading() {
    if (!resolved) {
      setState('loading');
    }
  }

  // Load component
  async function loadComponent() {
    attempts++;

    // Start delay timer for loading state
    delayTimer = setTimeout(showLoading, delay);

    // Start timeout timer
    timeoutTimer = setTimeout(function() {
      if (!resolved) {
        handleError(new Error('Component load timeout after ' + timeout + 'ms'));
      }
    }, timeout);

    try {
      // Notify Suspense boundary if suspensible
      if (suspensible && window.STX && window.STX.suspense) {
        window.STX.suspense.register(asyncId);
      }

      // Fetch the component
      const response = await fetch('/_stx/component/' + encodeURIComponent(componentPath));

      if (!response.ok) {
        throw new Error('Failed to load component: ' + response.statusText);
      }

      const html = await response.text();

      // Clear timers
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);

      resolved = true;
      contentEl.innerHTML = html;
      setState('resolved');

      // Execute any scripts in the loaded component
      contentEl.querySelectorAll('script').forEach(function(script) {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        script.parentNode.replaceChild(newScript, script);
      });

      // Notify Suspense boundary
      if (suspensible && window.STX && window.STX.suspense) {
        window.STX.suspense.resolve(asyncId);
      }

      // Dispatch loaded event
      container.dispatchEvent(new CustomEvent('stx:async:loaded', {
        detail: { asyncId: asyncId, component: componentPath },
        bubbles: true
      }));

    } catch (error) {
      handleError(error);
    }
  }

  // Handle errors
  function handleError(error) {
    clearTimeout(delayTimer);
    clearTimeout(timeoutTimer);

    if (attempts < maxRetries) {
      // Retry
      console.warn('[stx:async:' + asyncId + '] Retrying... (' + attempts + '/' + maxRetries + ')');
      setTimeout(loadComponent, 1000 * attempts); // Exponential backoff
      return;
    }

    resolved = true;
    setState('rejected');

    // Update error content with error message
    const errorMsgEl = errorEl.querySelector('[data-error-message]');
    if (errorMsgEl) {
      errorMsgEl.textContent = error.message;
    }

    // Notify Suspense boundary
    if (suspensible && window.STX && window.STX.suspense) {
      window.STX.suspense.reject(asyncId, error);
    }

    // Dispatch error event
    container.dispatchEvent(new CustomEvent('stx:async:error', {
      detail: { asyncId: asyncId, component: componentPath, error: error },
      bubbles: true
    }));

    console.error('[stx:async:' + asyncId + ']', error);
  }

  // Retry function
  function retry() {
    resolved = false;
    attempts = 0;
    setState('pending');
    loadComponent();
  }

  // Expose retry function
  window['$stxAsyncRetry_' + asyncId.replace(/-/g, '_')] = retry;

  // Make $retry available within the error content
  errorEl.querySelectorAll('[onclick*="$retry"]').forEach(function(el) {
    const onclick = el.getAttribute('onclick');
    if (onclick) {
      el.setAttribute('onclick', onclick.replace(/\\$retry\\(\\)/g, "window['$stxAsyncRetry_" + asyncId.replace(/-/g, '_') + "']()"));
    }
  });

  // Expose API
  window.STX = window.STX || {};
  window.STX.asyncComponents = window.STX.asyncComponents || {};
  window.STX.asyncComponents[asyncId] = {
    getStatus: function() { return container.getAttribute('data-status'); },
    retry: retry,
    getAttempts: function() { return attempts; }
  };

  // Start loading
  loadComponent();
})();
</script>
`
}

// =============================================================================
// Define Async Component (Programmatic API)
// =============================================================================

/**
 * Define an async component for programmatic use.
 *
 * @example
 * ```typescript
 * const AsyncChart = defineAsyncComponent({
 *   loader: () => import('./Chart.stx'),
 *   loadingComponent: LoadingSpinner,
 *   errorComponent: ErrorDisplay,
 *   delay: 200,
 *   timeout: 3000
 * })
 * ```
 */
export interface DefineAsyncComponentOptions {
  /** Function that returns a Promise resolving to the component */
  loader: () => Promise<{ default: string } | string>
  /** Component to show while loading */
  loadingComponent?: string
  /** Component to show on error */
  errorComponent?: string
  /** Delay before showing loading component (ms) */
  delay?: number
  /** Timeout before showing error (ms) */
  timeout?: number
  /** Whether to suspend parent Suspense */
  suspensible?: boolean
  /** Called when loading starts */
  onLoadStart?: () => void
  /** Called when component is loaded */
  onLoadEnd?: () => void
  /** Called on error */
  onError?: (error: Error, retry: () => void, fail: () => void, attempts: number) => void
}

/**
 * Define an async component.
 */
export function defineAsyncComponent(
  options: DefineAsyncComponentOptions | (() => Promise<{ default: string } | string>),
): AsyncComponentDefinition {
  const normalizedOptions: DefineAsyncComponentOptions =
    typeof options === 'function' ? { loader: options } : options

  return {
    __asyncComponent: true,
    ...normalizedOptions,
  }
}

export interface AsyncComponentDefinition extends DefineAsyncComponentOptions {
  __asyncComponent: true
}

/**
 * Check if a value is an async component definition.
 */
export function isAsyncComponent(value: unknown): value is AsyncComponentDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__asyncComponent' in value &&
    (value as AsyncComponentDefinition).__asyncComponent === true
  )
}

// =============================================================================
// CSS for Async Components
// =============================================================================

/**
 * Generate CSS for async component styling.
 */
export function generateAsyncComponentCSS(): string {
  return `
/* STX Async Component Styles */
.stx-async-component {
  position: relative;
}

.stx-async-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.stx-async-error {
  padding: 1rem;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  background-color: #fef2f2;
  color: #991b1b;
}

.stx-async-error button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ef4444;
  border-radius: 0.25rem;
  background-color: #ef4444;
  color: white;
  cursor: pointer;
}

.stx-async-error button:hover {
  background-color: #dc2626;
}

/* Loading spinner animation */
@keyframes stx-async-spin {
  to { transform: rotate(360deg); }
}

.stx-async-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: stx-async-spin 0.8s linear infinite;
}

/* Skeleton loading */
.stx-async-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: stx-async-shimmer 1.5s infinite;
  border-radius: 0.25rem;
}

@keyframes stx-async-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .stx-async-error {
    background-color: #450a0a;
    color: #fecaca;
  }

  .stx-async-skeleton {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200% 100%;
  }
}
`
}

// =============================================================================
// Client Runtime
// =============================================================================

/**
 * Generate client-side runtime for async components.
 */
export function generateAsyncComponentRuntime(): string {
  return `
// STX Async Component Runtime
(function() {
  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};
  window.STX.asyncComponents = window.STX.asyncComponents || {};

  // Load a component dynamically
  window.STX.loadComponent = async function(componentPath, targetSelector, options) {
    options = options || {};
    const target = document.querySelector(targetSelector);
    if (!target) {
      throw new Error('Target element not found: ' + targetSelector);
    }

    const loadingHtml = options.loading || '<div class="stx-async-spinner"></div>';
    target.innerHTML = loadingHtml;

    try {
      const response = await fetch('/_stx/component/' + encodeURIComponent(componentPath));
      if (!response.ok) {
        throw new Error('Failed to load: ' + response.statusText);
      }

      const html = await response.text();
      target.innerHTML = html;

      // Execute scripts
      target.querySelectorAll('script').forEach(function(script) {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        script.parentNode.replaceChild(newScript, script);
      });

      if (options.onLoad) options.onLoad();
      return true;
    } catch (error) {
      if (options.error) {
        target.innerHTML = options.error;
      }
      if (options.onError) options.onError(error);
      throw error;
    }
  };

  console.log('[stx] Async component runtime initialized');
})();
`
}
