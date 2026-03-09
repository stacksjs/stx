/**
 * x-element: Lightweight two-way binding for STX
 *
 * Provides client-side reactivity for forms and interactive elements:
 * - x-data: Define reactive data scope
 * - x-model: Two-way binding for inputs
 * - x-text: Reactive text content
 * - x-show: Toggle visibility based on expression
 * - :class: Bind CSS classes from object expression
 * - :disabled, :href, :src, etc.: Bind any attribute
 * - @event: Event handling (e.g., @click, @submit.prevent)
 *
 * Note: Use @if, @for, @foreach for server-side rendering.
 * x-element is only for client-side interactivity that SSR can't handle.
 *
 * @example
 * ```html
 * <div x-data="{ email: '', loading: false, success: false }">
 *   <form @submit.prevent="subscribe()">
 *     <input x-model="email" type="email" />
 *     <button type="submit" :disabled="loading">
 *       <span x-text="loading ? 'Sending...' : 'Subscribe'"></span>
 *     </button>
 *   </form>
 *   <p x-show="success" x-text="'Thanks for subscribing!'"></p>
 * </div>
 * ```
 */

/**
 * Generate the x-element runtime script
 * This is injected once per page that uses x-* directives
 */
export function generateXElementRuntime(): string {
  return `<script data-stx-scoped>
(function() {
  'use strict';

  class XElement {
    constructor(el, data) {
      this.el = el;
      this.data = this.makeReactive(data);
      this.watchers = new Map();
      this.init();
    }

    makeReactive(obj) {
      const self = this;
      return new Proxy(obj, {
        get(target, key) {
          return target[key];
        },
        set(target, key, value) {
          const oldValue = target[key];
          target[key] = value;
          if (oldValue !== value) {
            self.update(key);
          }
          return true;
        }
      });
    }

    init() {
      this.processElement(this.el);
    }

    processElement(el) {
      // Process x-model (two-way binding)
      const models = el.querySelectorAll('[x-model]');
      models.forEach(input => {
        const key = input.getAttribute('x-model');

        // Set initial value
        if (this.data[key] !== undefined) {
          if (input.type === 'checkbox') {
            input.checked = this.data[key];
          } else if (input.type === 'radio') {
            input.checked = input.value === this.data[key];
          } else {
            input.value = this.data[key];
          }
        }

        // Listen for changes
        const eventType = input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input';
        input.addEventListener(eventType, () => {
          if (input.type === 'checkbox') {
            this.data[key] = input.checked;
          } else if (input.type === 'radio') {
            if (input.checked) this.data[key] = input.value;
          } else if (input.type === 'number' || input.type === 'range') {
            this.data[key] = parseFloat(input.value) || 0;
          } else {
            this.data[key] = input.value;
          }
        });

        // Watch for data changes
        this.watch(key, (value) => {
          if (input.type === 'checkbox') {
            input.checked = value;
          } else if (input.type === 'radio') {
            input.checked = input.value === value;
          } else if (input.value !== String(value)) {
            input.value = value;
          }
        });
      });

      // Process x-text (reactive text)
      const texts = el.querySelectorAll('[x-text]');
      texts.forEach(elem => {
        const expr = elem.getAttribute('x-text');
        const update = () => {
          elem.textContent = this.evaluate(expr);
        };
        update();
        this.watchExpression(expr, update);
      });

      // Process x-show (toggle visibility)
      const shows = el.querySelectorAll('[x-show]');
      shows.forEach(elem => {
        const expr = elem.getAttribute('x-show');
        const update = () => {
          elem.style.display = this.evaluate(expr) ? '' : 'none';
        };
        update();
        this.watchExpression(expr, update);
      });

      // Process @event and :bind attributes
      const allElements = el.querySelectorAll('*');
      allElements.forEach(elem => {
        Array.from(elem.attributes).forEach(attr => {
          if (attr.name.startsWith('@')) {
            // Event handling
            const eventName = attr.name.slice(1);
            const expr = attr.value;

            // Handle modifiers
            const parts = eventName.split('.');
            const event = parts[0];
            const modifiers = parts.slice(1);

            elem.addEventListener(event, (e) => {
              if (modifiers.includes('prevent')) e.preventDefault();
              if (modifiers.includes('stop')) e.stopPropagation();
              if (modifiers.includes('self') && e.target !== elem) return;

              // Key modifiers
              if (event === 'keydown' || event === 'keyup' || event === 'keypress') {
                const keyMap = { enter: 'Enter', escape: 'Escape', tab: 'Tab', space: ' ' };
                for (const mod of modifiers) {
                  if (keyMap[mod] && e.key !== keyMap[mod]) return;
                }
              }

              this.execute(expr, { $event: e, $el: elem });
            });
          } else if (attr.name.startsWith(':')) {
            // Attribute binding (:disabled, :class, :href, :src, etc.)
            const bindAttr = attr.name.slice(1);
            const expr = attr.value;

            const update = () => {
              const val = this.evaluate(expr);
              if (bindAttr === 'class') {
                // :class supports object syntax { className: bool }
                if (val && typeof val === 'object') {
                  for (const [cls, active] of Object.entries(val)) {
                    elem.classList.toggle(cls, !!active);
                  }
                } else if (typeof val === 'string') {
                  elem.className = val;
                }
              } else if (typeof val === 'boolean') {
                // Boolean attributes (disabled, hidden, readonly, etc.)
                if (val) {
                  elem.setAttribute(bindAttr, '');
                } else {
                  elem.removeAttribute(bindAttr);
                }
              } else {
                elem.setAttribute(bindAttr, val != null ? String(val) : '');
              }
            };
            update();
            this.watchExpression(expr, update);
          }
        });
      });
    }

    watch(key, callback) {
      if (!this.watchers.has(key)) {
        this.watchers.set(key, []);
      }
      this.watchers.get(key).push(callback);
    }

    watchExpression(expr, callback) {
      const vars = expr.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
      vars.forEach(v => {
        if (v in this.data) {
          this.watch(v, callback);
        }
      });
    }

    update(key) {
      const callbacks = this.watchers.get(key) || [];
      callbacks.forEach(cb => cb(this.data[key]));
    }

    evaluate(expr) {
      try {
        const fn = new Function(...Object.keys(this.data), 'return ' + expr);
        return fn(...Object.values(this.data));
      } catch (e) {
        console.warn('x-element: Error evaluating', expr, e);
        return '';
      }
    }

    execute(expr, extra = {}) {
      try {
        const allData = { ...this.data, ...extra };
        const fn = new Function(...Object.keys(allData), expr);
        fn.call(this.data, ...Object.values(allData));
      } catch (e) {
        console.warn('x-element: Error executing', expr, e);
      }
    }
  }

  // Initialize all x-data elements
  function init() {
    document.querySelectorAll('[x-data]').forEach(el => {
      const dataExpr = el.getAttribute('x-data');
      try {
        const data = new Function('return ' + dataExpr)();
        new XElement(el, data);
      } catch (e) {
        console.error('x-element: Error parsing x-data', e);
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual initialization
  window.XElement = XElement;
})();
</script>`
}

/**
 * Check if template uses x-* directives
 */
export function hasXElementDirectives(template: string): boolean {
  return /\bx-(data|model|text|show)\b/.test(template) || /\s:[a-z]/.test(template)
}

/**
 * Process x-element directives in template
 * Injects the runtime if x-* directives are found
 */
export function processXElementDirectives(template: string): string {
  if (!hasXElementDirectives(template)) {
    return template
  }

  // Inject the runtime before </body> or at the end
  const runtime = generateXElementRuntime()

  if (template.includes('</body>')) {
    return template.replace('</body>', `${runtime}\n</body>`)
  }

  return template + '\n' + runtime
}
