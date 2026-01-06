/**
 * STX Suspense
 *
 * Coordinates async loading across component trees, showing a fallback
 * until all async children are resolved.
 *
 * @module suspense
 *
 * @example
 * ```html
 * @suspense
 *   <UserProfile :id="userId" />
 *   <UserActivity :id="userId" />
 *   <UserStats :id="userId" />
 * @fallback
 *   <PageSkeleton />
 * @endsuspense
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface SuspenseOptions {
  /** Custom ID for tracking */
  id?: string
  /** Timeout before showing error (ms) */
  timeout?: number
  /** Callback when all children resolve */
  onResolve?: () => void
  /** Callback when any child rejects */
  onError?: (error: Error) => void
  /** Callback when loading starts */
  onPending?: () => void
}

export interface SuspenseState {
  /** Current state */
  status: 'pending' | 'resolved' | 'rejected'
  /** Pending async children */
  pending: Set<string>
  /** Resolved async children */
  resolved: Set<string>
  /** First error encountered */
  error: Error | null
}

export interface SuspenseBoundary {
  /** Unique boundary ID */
  id: string
  /** Current state */
  state: SuspenseState
  /** Register an async child */
  register: (childId: string) => void
  /** Mark a child as resolved */
  resolve: (childId: string) => void
  /** Mark a child as rejected */
  reject: (childId: string, error: Error) => void
  /** Reset the boundary */
  reset: () => void
}

// =============================================================================
// Suspense Processing
// =============================================================================

/** Counter for generating unique suspense IDs */
let suspenseIdCounter = 0

/**
 * Generate a unique suspense boundary ID.
 */
function generateSuspenseId(): string {
  return `suspense-${++suspenseIdCounter}-${Date.now().toString(36)}`
}

/**
 * Process @suspense directives in templates.
 *
 * Syntax:
 *   @suspense
 *     <async content>
 *   @fallback
 *     <loading fallback>
 *   @endsuspense
 *
 * With options:
 *   @suspense(timeout: 10000)
 */
export function processSuspenseDirectives(
  template: string,
  _context: Record<string, unknown> = {},
  _filePath?: string,
): string {
  // Match @suspense ... @fallback ... @endsuspense
  const suspenseRegex = /@suspense(?:\s*\(([^)]*)\))?\s*([\s\S]*?)@fallback\s*([\s\S]*?)@endsuspense/gi

  return template.replace(suspenseRegex, (_match, optionsStr, content, fallback) => {
    const suspenseId = generateSuspenseId()
    const options = parseSuspenseOptions(optionsStr || '')

    return generateSuspenseHtml(suspenseId, content.trim(), fallback.trim(), options)
  })
}

/**
 * Parse suspense options from directive string.
 */
function parseSuspenseOptions(optionsStr: string): SuspenseOptions {
  const options: SuspenseOptions = {}

  const keyValueRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+)|(\w+))/g
  let match

  while ((match = keyValueRegex.exec(optionsStr)) !== null) {
    const key = match[1]
    const strValue = match[2] || match[3]
    const numValue = match[4]

    switch (key) {
      case 'id':
        options.id = strValue
        break
      case 'timeout':
        options.timeout = numValue ? parseInt(numValue, 10) : undefined
        break
    }
  }

  return options
}

/**
 * Generate HTML for a suspense boundary.
 */
function generateSuspenseHtml(
  suspenseId: string,
  content: string,
  fallback: string,
  options: SuspenseOptions,
): string {
  const timeout = options.timeout || 30000
  const customId = options.id || suspenseId

  return `
<div class="stx-suspense" data-suspense-id="${suspenseId}" data-custom-id="${customId}" data-status="pending">
  <div class="stx-suspense-fallback" data-suspense-fallback="${suspenseId}">
    ${fallback}
  </div>
  <div class="stx-suspense-content" data-suspense-content="${suspenseId}" style="display: none;">
    ${content}
  </div>
</div>
<script>
(function() {
  const suspenseId = '${suspenseId}';
  const customId = '${customId}';
  const timeout = ${timeout};

  const container = document.querySelector('[data-suspense-id="' + suspenseId + '"]');
  const fallbackEl = document.querySelector('[data-suspense-fallback="' + suspenseId + '"]');
  const contentEl = document.querySelector('[data-suspense-content="' + suspenseId + '"]');

  if (!container || !fallbackEl || !contentEl) return;

  // State
  const pending = new Set();
  const resolved = new Set();
  let status = 'pending';
  let error = null;
  let timeoutTimer = null;

  // Update UI based on state
  function updateUI() {
    container.setAttribute('data-status', status);

    if (status === 'resolved') {
      fallbackEl.style.display = 'none';
      contentEl.style.display = '';
    } else if (status === 'rejected') {
      fallbackEl.style.display = 'none';
      contentEl.style.display = '';
      // Show error in content area if needed
    } else {
      fallbackEl.style.display = '';
      contentEl.style.display = 'none';
    }
  }

  // Check if all children are resolved
  function checkResolved() {
    if (pending.size === 0 && resolved.size > 0) {
      clearTimeout(timeoutTimer);
      status = 'resolved';
      updateUI();

      container.dispatchEvent(new CustomEvent('stx:suspense:resolved', {
        detail: { suspenseId: suspenseId, customId: customId },
        bubbles: true
      }));
    }
  }

  // Register an async child
  function register(childId) {
    if (status === 'resolved') {
      // Reset if we get a new child after resolution
      status = 'pending';
      updateUI();
    }
    pending.add(childId);

    // Start timeout on first registration
    if (pending.size === 1 && !timeoutTimer) {
      timeoutTimer = setTimeout(function() {
        if (status === 'pending') {
          error = new Error('Suspense timeout after ' + timeout + 'ms');
          status = 'rejected';
          updateUI();

          container.dispatchEvent(new CustomEvent('stx:suspense:timeout', {
            detail: { suspenseId: suspenseId, customId: customId, pending: Array.from(pending) },
            bubbles: true
          }));
        }
      }, timeout);
    }
  }

  // Resolve a child
  function resolve(childId) {
    pending.delete(childId);
    resolved.add(childId);
    checkResolved();
  }

  // Reject a child
  function reject(childId, err) {
    pending.delete(childId);
    error = err;
    status = 'rejected';
    clearTimeout(timeoutTimer);
    updateUI();

    container.dispatchEvent(new CustomEvent('stx:suspense:error', {
      detail: { suspenseId: suspenseId, customId: customId, error: err, childId: childId },
      bubbles: true
    }));
  }

  // Reset the boundary
  function reset() {
    pending.clear();
    resolved.clear();
    status = 'pending';
    error = null;
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
    updateUI();
  }

  // Expose API globally for async components to use
  window.STX = window.STX || {};
  window.STX.suspense = window.STX.suspense || {
    boundaries: {},
    // Find the nearest suspense boundary for a child
    findBoundary: function(element) {
      const boundary = element.closest('[data-suspense-id]');
      if (boundary) {
        return boundary.getAttribute('data-suspense-id');
      }
      return null;
    },
    register: function(childId, boundaryId) {
      if (!boundaryId) {
        // Find nearest boundary
        const asyncEl = document.querySelector('[data-async-id="' + childId + '"]');
        if (asyncEl) {
          boundaryId = this.findBoundary(asyncEl);
        }
      }
      if (boundaryId && this.boundaries[boundaryId]) {
        this.boundaries[boundaryId].register(childId);
      }
    },
    resolve: function(childId, boundaryId) {
      if (!boundaryId) {
        const asyncEl = document.querySelector('[data-async-id="' + childId + '"]');
        if (asyncEl) {
          boundaryId = this.findBoundary(asyncEl);
        }
      }
      if (boundaryId && this.boundaries[boundaryId]) {
        this.boundaries[boundaryId].resolve(childId);
      }
    },
    reject: function(childId, error, boundaryId) {
      if (!boundaryId) {
        const asyncEl = document.querySelector('[data-async-id="' + childId + '"]');
        if (asyncEl) {
          boundaryId = this.findBoundary(asyncEl);
        }
      }
      if (boundaryId && this.boundaries[boundaryId]) {
        this.boundaries[boundaryId].reject(childId, error);
      }
    }
  };

  // Register this boundary
  window.STX.suspense.boundaries[suspenseId] = {
    id: suspenseId,
    customId: customId,
    getStatus: function() { return status; },
    getPending: function() { return Array.from(pending); },
    getResolved: function() { return Array.from(resolved); },
    getError: function() { return error; },
    register: register,
    resolve: resolve,
    reject: reject,
    reset: reset
  };

  // Initial state - if no async children register within a tick, show content
  setTimeout(function() {
    if (pending.size === 0 && resolved.size === 0) {
      status = 'resolved';
      updateUI();
    }
  }, 0);
})();
</script>
`
}

// =============================================================================
// SSR Suspense Support
// =============================================================================

/**
 * Server-side suspense boundary for SSR streaming.
 */
export interface SSRSuspenseBoundary {
  id: string
  fallback: string
  content: Promise<string>
}

/**
 * Create an SSR suspense boundary.
 * Returns the fallback immediately, then streams the content when ready.
 */
export function createSSRSuspense(
  id: string,
  contentPromise: Promise<string>,
  fallback: string,
): SSRSuspenseBoundary {
  return {
    id,
    fallback,
    content: contentPromise,
  }
}

/**
 * Render SSR suspense boundaries for streaming.
 * Returns initial HTML with fallbacks, plus a script to replace them when content loads.
 */
export async function renderSSRSuspense(
  boundaries: SSRSuspenseBoundary[],
): Promise<{ initial: string; streaming: AsyncGenerator<string> }> {
  // Generate initial HTML with fallbacks
  const initial = boundaries
    .map(
      (b) => `
<div id="stx-ssr-suspense-${b.id}" class="stx-ssr-suspense">
  ${b.fallback}
</div>
`,
    )
    .join('\n')

  // Create streaming generator for resolved content
  async function* streamContent(): AsyncGenerator<string> {
    for (const boundary of boundaries) {
      try {
        const content = await boundary.content
        yield `
<script>
(function() {
  const el = document.getElementById('stx-ssr-suspense-${boundary.id}');
  if (el) {
    el.innerHTML = ${JSON.stringify(content)};
    el.classList.add('stx-ssr-suspense-resolved');
  }
})();
</script>
`
      } catch (error) {
        yield `
<script>
(function() {
  const el = document.getElementById('stx-ssr-suspense-${boundary.id}');
  if (el) {
    el.classList.add('stx-ssr-suspense-error');
    console.error('SSR Suspense error for ${boundary.id}:', ${JSON.stringify(String(error))});
  }
})();
</script>
`
      }
    }
  }

  return {
    initial,
    streaming: streamContent(),
  }
}

// =============================================================================
// CSS for Suspense
// =============================================================================

/**
 * Generate CSS for suspense styling.
 */
export function generateSuspenseCSS(): string {
  return `
/* STX Suspense Styles */
.stx-suspense {
  position: relative;
}

.stx-suspense[data-status="pending"] .stx-suspense-fallback {
  display: block;
}

.stx-suspense[data-status="pending"] .stx-suspense-content {
  display: none;
}

.stx-suspense[data-status="resolved"] .stx-suspense-fallback {
  display: none;
}

.stx-suspense[data-status="resolved"] .stx-suspense-content {
  display: block;
}

/* SSR Suspense */
.stx-ssr-suspense {
  transition: opacity 0.3s ease;
}

.stx-ssr-suspense-resolved {
  animation: stx-suspense-fade-in 0.3s ease;
}

@keyframes stx-suspense-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Skeleton fallback helper */
.stx-suspense-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: stx-suspense-shimmer 1.5s infinite;
  border-radius: 0.25rem;
}

@keyframes stx-suspense-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .stx-suspense-skeleton {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200% 100%;
  }
}
`
}

// =============================================================================
// Suspense Runtime
// =============================================================================

/**
 * Generate client-side runtime for suspense.
 */
export function generateSuspenseRuntime(): string {
  return `
// STX Suspense Runtime
(function() {
  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};

  // Suspense boundary management is set up per-boundary in the HTML
  // This just provides additional utilities

  window.STX.suspense = window.STX.suspense || {
    boundaries: {},
    findBoundary: function(element) {
      const boundary = element.closest('[data-suspense-id]');
      return boundary ? boundary.getAttribute('data-suspense-id') : null;
    },
    register: function(childId, boundaryId) {},
    resolve: function(childId, boundaryId) {},
    reject: function(childId, error, boundaryId) {}
  };

  // Wait for all suspense boundaries to resolve
  window.STX.suspense.waitForAll = function() {
    return new Promise(function(resolve, reject) {
      const boundaries = Object.values(window.STX.suspense.boundaries);
      if (boundaries.length === 0) {
        resolve();
        return;
      }

      let resolved = 0;
      let rejected = false;

      boundaries.forEach(function(boundary) {
        if (boundary.getStatus() === 'resolved') {
          resolved++;
          if (resolved === boundaries.length) resolve();
        } else if (boundary.getStatus() === 'rejected') {
          if (!rejected) {
            rejected = true;
            reject(boundary.getError());
          }
        } else {
          // Listen for resolution
          const container = document.querySelector('[data-suspense-id="' + boundary.id + '"]');
          if (container) {
            container.addEventListener('stx:suspense:resolved', function() {
              resolved++;
              if (resolved === boundaries.length && !rejected) resolve();
            }, { once: true });

            container.addEventListener('stx:suspense:error', function(e) {
              if (!rejected) {
                rejected = true;
                reject(e.detail.error);
              }
            }, { once: true });
          }
        }
      });
    });
  };

  console.log('[stx] Suspense runtime initialized');
})();
`
}
