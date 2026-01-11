/**
 * STX Error Boundaries
 *
 * Provides graceful error handling for component trees.
 * When an error occurs within an error boundary, the fallback content is shown
 * instead of crashing the entire application.
 *
 * @module error-boundaries
 *
 * @example
 * ```html
 * @errorBoundary
 *   <RiskyComponent />
 * @fallback
 *   <div class="error-state">
 *     <p>Something went wrong</p>
 *     <button @click="$retry()">Retry</button>
 *   </div>
 * @enderrorBoundary
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface ErrorBoundaryOptions {
  /** Custom error handler */
  onError?: (error: Error, info: ErrorInfo) => void
  /** Whether to log errors to console (default: true) */
  logErrors?: boolean
  /** Custom error ID for tracking */
  id?: string
}

export interface ErrorInfo {
  /** Component name where error occurred */
  componentName?: string
  /** Stack trace */
  stack?: string
  /** Timestamp */
  timestamp: number
  /** Boundary ID */
  boundaryId: string
}

export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean
  /** The captured error */
  error: Error | null
  /** Error info */
  info: ErrorInfo | null
}

// =============================================================================
// Error Boundary Processing
// =============================================================================

/** Counter for generating unique boundary IDs */
let boundaryIdCounter = 0

/**
 * Generate a unique error boundary ID.
 */
function generateBoundaryId(): string {
  return `eb-${++boundaryIdCounter}-${Date.now().toString(36)}`
}

/**
 * Process @errorBoundary directives in templates.
 *
 * Syntax:
 *   @errorBoundary
 *     <content that might error>
 *   @fallback
 *     <fallback content shown on error>
 *   @enderrorBoundary
 *
 * Or with options:
 *   @errorBoundary(id: 'my-boundary', logErrors: false)
 */
export function processErrorBoundaryDirectives(
  template: string,
  context: Record<string, unknown> = {},
  _filePath?: string,
): string {
  // Match @errorBoundary ... @fallback ... @enderrorBoundary
  const boundaryRegex = /@errorBoundary(?:\s*\(([^)]*)\))?\s*([\s\S]*?)@fallback\s*([\s\S]*?)@enderrorBoundary/gi

  return template.replace(boundaryRegex, (_match, optionsStr, content, fallback) => {
    const boundaryId = generateBoundaryId()
    const options = parseErrorBoundaryOptions(optionsStr || '')

    // Wrap content in an error boundary container
    return generateErrorBoundaryHtml(boundaryId, content.trim(), fallback.trim(), options)
  })
}

/**
 * Parse error boundary options from directive string.
 */
function parseErrorBoundaryOptions(optionsStr: string): ErrorBoundaryOptions {
  const options: ErrorBoundaryOptions = {}

  // Match key: 'value' or key: value patterns
  const keyValueRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\w+))/g
  let match

  while ((match = keyValueRegex.exec(optionsStr)) !== null) {
    const key = match[1]
    const value = match[2] || match[3] || match[4]

    switch (key) {
      case 'id':
        options.id = value
        break
      case 'logErrors':
        options.logErrors = value === 'true'
        break
    }
  }

  return options
}

/**
 * Generate HTML for an error boundary.
 */
function generateErrorBoundaryHtml(
  boundaryId: string,
  content: string,
  fallback: string,
  options: ErrorBoundaryOptions,
): string {
  const logErrors = options.logErrors !== false

  return `
<div class="stx-error-boundary" data-boundary-id="${boundaryId}" data-has-error="false">
  <div class="stx-error-boundary-content" data-boundary-content="${boundaryId}">
    ${content}
  </div>
  <div class="stx-error-boundary-fallback" data-boundary-fallback="${boundaryId}" style="display: none;">
    ${fallback}
  </div>
</div>
<script>
(function() {
  const boundaryId = '${boundaryId}';
  const logErrors = ${logErrors};
  const boundary = document.querySelector('[data-boundary-id="' + boundaryId + '"]');
  const contentEl = document.querySelector('[data-boundary-content="' + boundaryId + '"]');
  const fallbackEl = document.querySelector('[data-boundary-fallback="' + boundaryId + '"]');

  if (!boundary || !contentEl || !fallbackEl) return;

  // Error state
  let hasError = false;
  let lastError = null;

  // Show error fallback
  function showFallback(error) {
    hasError = true;
    lastError = error;
    boundary.setAttribute('data-has-error', 'true');
    contentEl.style.display = 'none';
    fallbackEl.style.display = '';

    if (logErrors) {
      console.error('[stx:errorBoundary:' + boundaryId + ']', error);
    }

    // Dispatch error event
    boundary.dispatchEvent(new CustomEvent('stx:error', {
      detail: { error: error, boundaryId: boundaryId },
      bubbles: true
    }));
  }

  // Retry function (resets the boundary)
  function retry() {
    hasError = false;
    lastError = null;
    boundary.setAttribute('data-has-error', 'false');
    contentEl.style.display = '';
    fallbackEl.style.display = 'none';

    // Dispatch retry event
    boundary.dispatchEvent(new CustomEvent('stx:retry', {
      detail: { boundaryId: boundaryId },
      bubbles: true
    }));
  }

  // Expose retry function
  window['$stxRetry_' + boundaryId.replace(/-/g, '_')] = retry;

  // Make $retry available within the fallback
  fallbackEl.querySelectorAll('[onclick*="$retry"]').forEach(function(el) {
    const onclick = el.getAttribute('onclick');
    if (onclick) {
      el.setAttribute('onclick', onclick.replace(/\\$retry\\(\\)/g, "window['$stxRetry_" + boundaryId.replace(/-/g, '_') + "']()"));
    }
  });

  // Handle @click="$retry()" syntax
  fallbackEl.querySelectorAll('[\\\\@click*="$retry"]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      retry();
    });
  });

  // Also check for data-onclick
  fallbackEl.querySelectorAll('[data-onclick*="$retry"]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      retry();
    });
  });

  // Catch errors in content
  contentEl.addEventListener('error', function(e) {
    showFallback(e.error || new Error('Unknown error'));
  }, true);

  // Wrap global error handler for this boundary
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if error originated from within this boundary
    if (contentEl.contains(document.activeElement) || isErrorFromBoundary(error)) {
      showFallback(error || new Error(String(message)));
      return true; // Prevent default handling
    }
    if (originalOnError) {
      return originalOnError.apply(this, arguments);
    }
    return false;
  };

  // Helper to check if error is from this boundary (basic heuristic)
  function isErrorFromBoundary(error) {
    if (!error || !error.stack) return false;
    return error.stack.includes(boundaryId);
  }

  // Expose error info
  window.STX = window.STX || {};
  window.STX.errorBoundaries = window.STX.errorBoundaries || {};
  window.STX.errorBoundaries[boundaryId] = {
    hasError: function() { return hasError; },
    getError: function() { return lastError; },
    retry: retry,
    showFallback: showFallback
  };
})();
</script>
`
}

// =============================================================================
// Try/Catch Wrapper for SSR
// =============================================================================

/**
 * Wrap content in a try/catch for SSR error handling.
 * Returns the fallback if an error occurs during rendering.
 */
export async function withErrorBoundary<T>(
  render: () => T | Promise<T>,
  fallback: T,
  onError?: (error: Error) => void,
): Promise<T> {
  try {
    return await render()
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)))
    } else {
      console.error('[stx:errorBoundary] SSR Error:', error)
    }
    return fallback
  }
}

/**
 * Create an error boundary wrapper function.
 */
export function createErrorBoundary<T>(
  fallback: T,
  options: ErrorBoundaryOptions = {},
): (render: () => T | Promise<T>) => Promise<T> {
  const onError = options.onError
    ? (error: Error) => options.onError!(error, { timestamp: Date.now(), boundaryId: 'ssr' })
    : undefined
  return (render) => withErrorBoundary(render, fallback, onError)
}

// =============================================================================
// CSS for Error Boundaries
// =============================================================================

/**
 * Generate CSS for error boundary styling.
 */
export function generateErrorBoundaryCSS(): string {
  return `
/* STX Error Boundary Styles */
.stx-error-boundary {
  position: relative;
}

.stx-error-boundary[data-has-error="true"] .stx-error-boundary-content {
  display: none;
}

.stx-error-boundary[data-has-error="true"] .stx-error-boundary-fallback {
  display: block !important;
}

/* Default fallback styling (can be overridden) */
.stx-error-boundary-fallback {
  padding: 1rem;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  background-color: #fef2f2;
  color: #991b1b;
}

.stx-error-boundary-fallback button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ef4444;
  border-radius: 0.25rem;
  background-color: #ef4444;
  color: white;
  cursor: pointer;
}

.stx-error-boundary-fallback button:hover {
  background-color: #dc2626;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .stx-error-boundary-fallback {
    background-color: #450a0a;
    color: #fecaca;
  }
}
`
}

// =============================================================================
// Client-side Error Boundary API
// =============================================================================

/**
 * Generate client-side runtime for error boundaries.
 */
export function generateErrorBoundaryRuntime(): string {
  return `
// STX Error Boundary Runtime
(function() {
  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};
  window.STX.errorBoundaries = window.STX.errorBoundaries || {};

  // Create an error boundary programmatically
  window.STX.createErrorBoundary = function(element, options) {
    options = options || {};
    const boundaryId = 'eb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

    let hasError = false;
    let lastError = null;
    let fallbackContent = options.fallback || '<p>Something went wrong</p>';

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'stx-error-boundary-content';

    const fallbackWrapper = document.createElement('div');
    fallbackWrapper.className = 'stx-error-boundary-fallback';
    fallbackWrapper.style.display = 'none';
    fallbackWrapper.innerHTML = fallbackContent;

    // Move element's children to content wrapper
    while (element.firstChild) {
      contentWrapper.appendChild(element.firstChild);
    }

    element.appendChild(contentWrapper);
    element.appendChild(fallbackWrapper);
    element.classList.add('stx-error-boundary');
    element.setAttribute('data-boundary-id', boundaryId);

    function showFallback(error) {
      hasError = true;
      lastError = error;
      element.setAttribute('data-has-error', 'true');
      contentWrapper.style.display = 'none';
      fallbackWrapper.style.display = '';
      if (options.onError) options.onError(error);
    }

    function retry() {
      hasError = false;
      lastError = null;
      element.setAttribute('data-has-error', 'false');
      contentWrapper.style.display = '';
      fallbackWrapper.style.display = 'none';
      if (options.onRetry) options.onRetry();
    }

    window.STX.errorBoundaries[boundaryId] = {
      hasError: function() { return hasError; },
      getError: function() { return lastError; },
      retry: retry,
      showFallback: showFallback
    };

    return window.STX.errorBoundaries[boundaryId];
  };

  console.log('[stx] Error boundary runtime initialized');
})();
`
}
