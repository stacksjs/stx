/**
 * Unified Hydration Runtime for Islands Architecture
 *
 * Replaces the per-strategy inline scripts with a single runtime that handles
 * all hydration strategies. Injected once per page when islands are present.
 *
 * The runtime:
 * 1. Component registry — maps names to dynamic imports
 * 2. hydrateIsland(element) — loads component, reads props, calls hydrate/mount
 * 3. Strategy dispatcher — sets up triggers per data-strategy attribute
 * 4. initIslands() — processes all .stx-island:not(.hydrated) on DOMContentLoaded
 *
 * @module hydration-runtime
 */

// ============================================================================
// Types
// ============================================================================

export interface IslandMeta {
  id: string
  component: string
  strategy: string
  props: Record<string, unknown>
}

// ============================================================================
// Runtime Script Generation
// ============================================================================

/**
 * Generate the unified hydration bootstrap script.
 *
 * This replaces the per-island inline scripts with a single runtime
 * that reads data-strategy attributes and sets up appropriate triggers.
 */
export function generateHydrationBootstrap(): string {
  return `<script data-stx-hydration-runtime>
(function() {
  'use strict';

  var stxIslands = window.__stxIslands = window.__stxIslands || {
    _registry: {},
    _hydrated: new Set(),

    register: function(name, loader) {
      this._registry[name] = loader;
    },

    hydrateIsland: function(el) {
      var id = el.getAttribute('data-island');
      if (!id || this._hydrated.has(id)) return Promise.resolve();
      this._hydrated.add(id);

      var componentName = el.getAttribute('data-component');
      var propsScript = el.querySelector('script[data-island-props="' + id + '"]');
      var props = {};
      if (propsScript) {
        try { props = JSON.parse(propsScript.textContent || '{}'); } catch(e) {}
      }

      var loader = componentName ? this._registry[componentName] : null;

      if (loader) {
        return Promise.resolve(typeof loader === 'function' ? loader() : loader)
          .then(function(mod) {
            var comp = mod && mod.default ? mod.default : mod;
            if (comp && comp.hydrate) {
              return comp.hydrate(el, props);
            } else if (comp && comp.mount) {
              return comp.mount(el, props);
            }
          })
          .then(function() {
            el.classList.add('hydrated');
            el.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
          })
          .catch(function(err) {
            console.error('[stx] Hydration failed for island:', id, err);
            el.classList.add('hydrated');
            el.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
          });
      }

      // No loader registered — just mark as hydrated (CSS-only island)
      el.classList.add('hydrated');
      el.dispatchEvent(new CustomEvent('stx:hydrated', { bubbles: true }));
      return Promise.resolve();
    },

    _setupStrategy: function(el) {
      var self = this;
      var strategy = el.getAttribute('data-strategy') || 'load';

      switch (strategy) {
        case 'load':
          self.hydrateIsland(el);
          break;

        case 'idle':
          if ('requestIdleCallback' in window) {
            requestIdleCallback(function() { self.hydrateIsland(el); }, { timeout: 2000 });
          } else {
            setTimeout(function() { self.hydrateIsland(el); }, 200);
          }
          break;

        case 'visible':
          if ('IntersectionObserver' in window) {
            var rootMargin = el.getAttribute('data-root-margin') || '0px';
            var threshold = parseFloat(el.getAttribute('data-threshold') || '0') || 0;
            var obs = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  obs.disconnect();
                  self.hydrateIsland(el);
                }
              });
            }, { rootMargin: rootMargin, threshold: threshold });
            obs.observe(el);
          } else {
            self.hydrateIsland(el);
          }
          break;

        case 'media':
          var mediaQuery = el.getAttribute('data-media') || '(min-width: 768px)';
          var mq = window.matchMedia(mediaQuery);
          if (mq.matches) {
            self.hydrateIsland(el);
          } else {
            var handler = function(e) {
              if (e.matches) {
                mq.removeEventListener('change', handler);
                self.hydrateIsland(el);
              }
            };
            mq.addEventListener('change', handler);
          }
          break;

        case 'hover':
          var events = ['mouseenter', 'focusin', 'touchstart'];
          var hoverHandler = function() {
            events.forEach(function(e) { el.removeEventListener(e, hoverHandler); });
            self.hydrateIsland(el);
          };
          events.forEach(function(e) {
            el.addEventListener(e, hoverHandler, { once: true, passive: true });
          });
          break;

        case 'event':
          var eventName = el.getAttribute('data-event') || 'stx:activate';
          window.addEventListener(eventName, function evtHandler(e) {
            if (!e.detail || e.detail.id === el.getAttribute('data-island') || e.detail.id === '*') {
              window.removeEventListener(eventName, evtHandler);
              self.hydrateIsland(el);
            }
          });
          break;

        case 'only':
          var tmpl = el.querySelector('template[data-client-content]');
          if (tmpl) {
            el.innerHTML = tmpl.innerHTML;
          }
          el.classList.add('hydrated');
          break;

        default:
          self.hydrateIsland(el);
      }
    },

    initIslands: function() {
      var self = this;
      var islands = document.querySelectorAll('.stx-island:not(.hydrated)');
      islands.forEach(function(el) {
        self._setupStrategy(el);
      });
    }
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { stxIslands.initIslands(); });
  } else {
    stxIslands.initIslands();
  }
})();
</script>`
}

/**
 * Generate a component manifest script block that registers
 * all discovered island component names with their import paths.
 *
 * @param islands - Map of component name to import path
 */
export function generateComponentManifest(islands: Map<string, string>): string {
  if (islands.size === 0) return ''

  const registrations = Array.from(islands.entries())
    .map(([name, importPath]) => `  window.__stxIslands.register('${name}', function() { return import('${importPath}'); });`)
    .join('\n')

  return `<script data-stx-island-manifest>
(function() {
  if (!window.__stxIslands) return;
${registrations}
})();
</script>`
}

/**
 * Extract component name from inner content of an island.
 * Looks for PascalCase or kebab-case component tags.
 */
export function extractComponentName(content: string): string | null {
  // Match PascalCase: <InteractiveCarousel or <MyWidget
  const pascalMatch = content.match(/<([A-Z][a-zA-Z0-9]+)[\s/>]/)
  if (pascalMatch) return pascalMatch[1]

  // Match kebab-case custom elements: <interactive-carousel or <my-widget
  const kebabMatch = content.match(/<([a-z][a-z0-9]*-[a-z0-9-]+)[\s/>]/)
  if (kebabMatch) return kebabMatch[1]

  return null
}

/**
 * Extract bound props from component content.
 * Parses :prop="value" bindings.
 */
export function extractBoundProps(
  content: string,
  context: Record<string, unknown>,
): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const bindingRegex = /:([a-zA-Z_][\w-]*)\s*=\s*"([^"]+)"/g
  let match

  while ((match = bindingRegex.exec(content)) !== null) {
    const propName = match[1]
    const expr = match[2]
    // Resolve from context
    if (expr in context) {
      props[propName] = context[expr]
    } else {
      props[propName] = expr
    }
  }

  return props
}
