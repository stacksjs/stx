/**
 * STX Story - Hot Swap
 * Switch story variants without full page reload
 */

/**
 * Hot swap state
 */
export interface HotSwapState {
  /** Current story ID */
  storyId: string | null
  /** Current variant ID */
  variantId: string | null
  /** Current props */
  props: Record<string, any>
  /** Iframe element reference */
  iframe: HTMLIFrameElement | null
}

/**
 * Hot swap options
 */
export interface HotSwapOptions {
  /** Animation duration in ms */
  animationDuration?: number
  /** Preserve scroll position */
  preserveScroll?: boolean
  /** Callback before swap */
  onBeforeSwap?: (state: HotSwapState) => void
  /** Callback after swap */
  onAfterSwap?: (state: HotSwapState) => void
}

/**
 * Generate hot swap client script
 * Injects into the story UI for seamless variant switching
 */
export function getHotSwapScript(): string {
  return `
<script>
(function() {
  // Hot swap state
  window.__stxHotSwap = {
    storyId: null,
    variantId: null,
    props: {},
    iframe: null,

    // Initialize hot swap
    init: function(iframeSelector) {
      this.iframe = document.querySelector(iframeSelector);
      if (!this.iframe) {
        console.warn('[STX Story] Hot swap iframe not found');
        return;
      }

      // Listen for variant changes
      window.addEventListener('stx:variant-change', this.handleVariantChange.bind(this));
      window.addEventListener('stx:props-change', this.handlePropsChange.bind(this));

      console.log('[STX Story] Hot swap initialized');
    },

    // Handle variant change
    handleVariantChange: function(event) {
      const { storyId, variantId } = event.detail;

      if (this.storyId === storyId && this.variantId === variantId) {
        return; // No change
      }

      this.storyId = storyId;
      this.variantId = variantId;

      this.swapContent();
    },

    // Handle props change
    handlePropsChange: function(event) {
      const { props } = event.detail;
      this.props = { ...this.props, ...props };
      this.updateProps();
    },

    // Swap iframe content without reload
    swapContent: async function() {
      if (!this.iframe || !this.storyId || !this.variantId) return;

      // Save scroll position
      const scrollTop = this.iframe.contentWindow?.scrollY || 0;
      const scrollLeft = this.iframe.contentWindow?.scrollX || 0;

      // Fetch new content
      try {
        const response = await fetch('/api/render/' + this.storyId + '/' + this.variantId);
        const data = await response.json();

        if (data.html) {
          // Fade out
          this.iframe.style.opacity = '0.5';
          this.iframe.style.transition = 'opacity 150ms ease';

          // Update content
          const doc = this.iframe.contentDocument;
          if (doc) {
            // Find body or create one
            let body = doc.body;
            if (!body) {
              doc.write('<html><head></head><body></body></html>');
              body = doc.body;
            }

            // Update body content
            body.innerHTML = data.html;

            // Update styles if provided
            if (data.css) {
              let styleEl = doc.getElementById('stx-component-styles');
              if (!styleEl) {
                styleEl = doc.createElement('style');
                styleEl.id = 'stx-component-styles';
                doc.head.appendChild(styleEl);
              }
              styleEl.textContent = data.css;
            }

            // Restore scroll position
            this.iframe.contentWindow?.scrollTo(scrollLeft, scrollTop);
          }

          // Fade in
          setTimeout(() => {
            this.iframe.style.opacity = '1';
          }, 50);

          // Dispatch event
          window.dispatchEvent(new CustomEvent('stx:swap-complete', {
            detail: { storyId: this.storyId, variantId: this.variantId }
          }));
        }
      } catch (error) {
        console.error('[STX Story] Hot swap failed:', error);
        // Fallback to full reload
        this.iframe.src = '/preview/' + this.storyId + '/' + this.variantId;
      }
    },

    // Update props in iframe without content swap
    updateProps: function() {
      if (!this.iframe) return;

      const win = this.iframe.contentWindow;
      if (win && win.__stxProps) {
        Object.assign(win.__stxProps, this.props);

        // Trigger re-render if component supports it
        if (win.__stxRerender) {
          win.__stxRerender(this.props);
        }

        window.dispatchEvent(new CustomEvent('stx:props-updated', {
          detail: { props: this.props }
        }));
      }
    },

    // Select a variant
    selectVariant: function(storyId, variantId) {
      window.dispatchEvent(new CustomEvent('stx:variant-change', {
        detail: { storyId, variantId }
      }));
    },

    // Update a prop
    updateProp: function(name, value) {
      window.dispatchEvent(new CustomEvent('stx:props-change', {
        detail: { props: { [name]: value } }
      }));
    },

    // Reset props to defaults
    resetProps: function() {
      this.props = {};
      this.swapContent();
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.__stxHotSwap.init('#preview-iframe');
    });
  } else {
    window.__stxHotSwap.init('#preview-iframe');
  }
})();
</script>
`
}

/**
 * Generate variant selector UI
 */
export function getVariantSelectorHtml(
  variants: Array<{ id: string, title: string }>,
  currentVariantId: string,
): string {
  const options = variants.map(v => `
    <button
      class="variant-btn ${v.id === currentVariantId ? 'active' : ''}"
      onclick="window.__stxHotSwap.selectVariant(window.__stxHotSwap.storyId, '${v.id}')"
    >
      ${v.title}
    </button>
  `).join('')

  return `
    <div class="variant-selector">
      ${options}
    </div>
  `
}

/**
 * Generate variant selector styles
 */
export function getVariantSelectorStyles(): string {
  return `
    .variant-selector {
      display: flex;
      gap: 4px;
      padding: 8px;
      background: var(--bg-secondary);
      border-radius: 6px;
    }
    .variant-btn {
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
      font-size: 13px;
      transition: all 150ms ease;
    }
    .variant-btn:hover {
      background: var(--bg-secondary);
    }
    .variant-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
  `
}
