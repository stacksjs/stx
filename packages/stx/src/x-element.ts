/**
 * x-element: Lightweight two-way binding for STX
 *
 * Provides Alpine.js-like reactivity with minimal overhead:
 * - x-data: Define reactive data scope
 * - x-model: Two-way binding for inputs
 * - x-text: Reactive text content
 * - x-html: Reactive HTML content
 * - x-show: Reactive visibility
 * - x-if: Conditional rendering
 * - x-for: List rendering
 * - x-on / @event: Event handling
 * - x-bind / :attr: Attribute binding
 *
 * @example
 * ```html
 * <div x-data="{ name: '', count: 0 }">
 *   <input x-model="name" />
 *   <p x-text="name"></p>
 *   <button @click="count++">Count: <span x-text="count"></span></button>
 * </div>
 * ```
 */

/**
 * Generate the x-element runtime script
 * This is injected once per page that uses x-* directives
 */
export function generateXElementRuntime(): string {
  return `<script>
(function() {
  'use strict';

  // Simple reactive state management
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
        input.addEventListener(eventType, (e) => {
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

      // Process x-html (reactive HTML)
      const htmls = el.querySelectorAll('[x-html]');
      htmls.forEach(elem => {
        const expr = elem.getAttribute('x-html');
        const update = () => {
          elem.innerHTML = this.evaluate(expr);
        };
        update();
        this.watchExpression(expr, update);
      });

      // Process x-show (reactive visibility)
      const shows = el.querySelectorAll('[x-show]');
      shows.forEach(elem => {
        const expr = elem.getAttribute('x-show');
        const originalDisplay = elem.style.display || '';
        const update = () => {
          const value = this.evaluate(expr);
          elem.style.display = value ? originalDisplay : 'none';
        };
        update();
        this.watchExpression(expr, update);
      });

      // Process x-if (conditional rendering)
      const ifs = el.querySelectorAll('[x-if]');
      ifs.forEach(elem => {
        const expr = elem.getAttribute('x-if');
        const placeholder = document.createComment('x-if');
        const template = elem.cloneNode(true);
        template.removeAttribute('x-if');
        let current = null;

        const update = () => {
          const value = this.evaluate(expr);
          if (value && !current) {
            current = template.cloneNode(true);
            placeholder.parentNode.insertBefore(current, placeholder);
          } else if (!value && current) {
            current.remove();
            current = null;
          }
        };

        elem.parentNode.insertBefore(placeholder, elem);
        elem.remove();
        update();
        this.watchExpression(expr, update);
      });

      // Process x-bind / :attr (attribute binding)
      const allElements = el.querySelectorAll('*');
      allElements.forEach(elem => {
        Array.from(elem.attributes).forEach(attr => {
          if (attr.name.startsWith('x-bind:') || attr.name.startsWith(':')) {
            const attrName = attr.name.startsWith(':') ? attr.name.slice(1) : attr.name.slice(7);
            const expr = attr.value;

            const update = () => {
              const value = this.evaluate(expr);
              if (attrName === 'class' && typeof value === 'object') {
                Object.entries(value).forEach(([cls, active]) => {
                  elem.classList.toggle(cls, !!active);
                });
              } else if (attrName === 'style' && typeof value === 'object') {
                Object.entries(value).forEach(([prop, val]) => {
                  elem.style[prop] = val;
                });
              } else if (value === false || value === null || value === undefined) {
                elem.removeAttribute(attrName);
              } else {
                elem.setAttribute(attrName, value);
              }
            };
            update();
            this.watchExpression(expr, update);
          }
        });
      });

      // Process x-on / @event (event handling)
      allElements.forEach(elem => {
        Array.from(elem.attributes).forEach(attr => {
          if (attr.name.startsWith('x-on:') || attr.name.startsWith('@')) {
            const eventName = attr.name.startsWith('@') ? attr.name.slice(1) : attr.name.slice(5);
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
                const keyModifiers = ['enter', 'escape', 'tab', 'space', 'delete', 'backspace', 'up', 'down', 'left', 'right'];
                const keyMap = { enter: 'Enter', escape: 'Escape', tab: 'Tab', space: ' ', delete: 'Delete', backspace: 'Backspace', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
                for (const mod of modifiers) {
                  if (keyModifiers.includes(mod) && e.key !== keyMap[mod]) return;
                }
              }

              this.execute(expr, { $event: e, $el: elem });
            });
          }
        });
      });

      // Process x-for (list rendering)
      const fors = el.querySelectorAll('[x-for]');
      fors.forEach(elem => {
        const expr = elem.getAttribute('x-for');
        const match = expr.match(/^(\\w+)(?:\\s*,\\s*(\\w+))?\\s+(?:in|of)\\s+(.+)$/);
        if (!match) return;

        const [, itemVar, indexVar, listExpr] = match;
        const placeholder = document.createComment('x-for');
        const template = elem.cloneNode(true);
        template.removeAttribute('x-for');
        let items = [];

        const update = () => {
          items.forEach(item => item.remove());
          items = [];

          const list = this.evaluate(listExpr);
          if (!Array.isArray(list)) return;

          list.forEach((item, index) => {
            const clone = template.cloneNode(true);

            // Replace template expressions
            const walk = (node) => {
              if (node.nodeType === 3) { // Text node
                node.textContent = node.textContent.replace(new RegExp('{{\\\\s*' + itemVar + '\\\\s*}}', 'g'), item);
                if (indexVar) {
                  node.textContent = node.textContent.replace(new RegExp('{{\\\\s*' + indexVar + '\\\\s*}}', 'g'), index);
                }
              }
              if (node.attributes) {
                Array.from(node.attributes).forEach(attr => {
                  attr.value = attr.value.replace(new RegExp(itemVar, 'g'), JSON.stringify(item));
                  if (indexVar) {
                    attr.value = attr.value.replace(new RegExp(indexVar, 'g'), index);
                  }
                });
              }
              node.childNodes.forEach(walk);
            };
            walk(clone);

            items.push(clone);
            placeholder.parentNode.insertBefore(clone, placeholder);
          });
        };

        elem.parentNode.insertBefore(placeholder, elem);
        elem.remove();
        update();
        this.watchExpression(listExpr, update);
      });
    }

    watch(key, callback) {
      if (!this.watchers.has(key)) {
        this.watchers.set(key, []);
      }
      this.watchers.get(key).push(callback);
    }

    watchExpression(expr, callback) {
      // Extract variable names from expression
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
  return /\bx-(data|model|text|html|show|if|for|on|bind)\b|@\w+|:\w+/.test(template)
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
