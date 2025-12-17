/**
 * Reactive Component Generator
 *
 * Generates reactive web component code with state management,
 * computed properties, and automatic DOM updates.
 */

import type { WebComponent } from '../types'

/**
 * Reactive property definition
 */
export interface ReactiveProperty {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  default?: unknown
  reflect?: boolean
}

/**
 * Computed property definition
 */
export interface ComputedProperty {
  name: string
  dependencies: string[]
  getter: string
}

/**
 * Watch definition
 */
export interface WatchDefinition {
  property: string
  handler: string
  immediate?: boolean
  deep?: boolean
}

/**
 * Reactive component options
 */
export interface ReactiveComponentOptions {
  properties?: ReactiveProperty[]
  computed?: ComputedProperty[]
  watchers?: WatchDefinition[]
  methods?: Record<string, string>
  lifecycle?: {
    connected?: string
    disconnected?: string
    adopted?: string
    attributeChanged?: string
  }
}

/**
 * Generate the reactive mixin for web components
 *
 * @returns JavaScript code for the reactive mixin
 */
export function generateReactiveMixin(): string {
  return `
/**
 * Reactive mixin for stx web components
 * Adds reactive state management to custom elements
 */
function StxReactive(Base) {
  return class extends Base {
    #state = {};
    #watchers = new Map();
    #computed = new Map();
    #dirty = new Set();
    #updateScheduled = false;

    constructor() {
      super();
      this.#initializeState();
    }

    #initializeState() {
      // Initialize reactive properties from static definition
      const props = this.constructor.reactiveProperties || {};
      for (const [name, config] of Object.entries(props)) {
        this.#state[name] = config.default;
        this.#defineProperty(name, config);
      }
    }

    #defineProperty(name, config) {
      Object.defineProperty(this, name, {
        get: () => this.#state[name],
        set: (value) => {
          const oldValue = this.#state[name];
          if (oldValue !== value) {
            this.#state[name] = value;
            this.#markDirty(name);
            this.#notifyWatchers(name, value, oldValue);
            if (config.reflect) {
              this.#reflectAttribute(name, value);
            }
          }
        },
        enumerable: true,
        configurable: true
      });
    }

    #reflectAttribute(name, value) {
      const attrName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (value === null || value === undefined || value === false) {
        this.removeAttribute(attrName);
      } else if (value === true) {
        this.setAttribute(attrName, '');
      } else {
        this.setAttribute(attrName, String(value));
      }
    }

    #markDirty(name) {
      this.#dirty.add(name);
      this.#scheduleUpdate();
    }

    #scheduleUpdate() {
      if (!this.#updateScheduled) {
        this.#updateScheduled = true;
        queueMicrotask(() => {
          this.#updateScheduled = false;
          this.#performUpdate();
        });
      }
    }

    #performUpdate() {
      // Recompute computed properties that depend on dirty state
      for (const [name, { deps, getter }] of this.#computed) {
        if (deps.some(dep => this.#dirty.has(dep))) {
          this.#state[name] = getter.call(this);
        }
      }

      // Clear dirty set and trigger re-render
      this.#dirty.clear();
      if (typeof this.render === 'function') {
        this.render();
      }
    }

    #notifyWatchers(name, newValue, oldValue) {
      const handlers = this.#watchers.get(name) || [];
      for (const handler of handlers) {
        try {
          handler.call(this, newValue, oldValue);
        } catch (e) {
          console.error(\`Watcher error for "\${name}":\`, e);
        }
      }
    }

    $watch(property, handler, options = {}) {
      if (!this.#watchers.has(property)) {
        this.#watchers.set(property, []);
      }
      this.#watchers.get(property).push(handler);

      if (options.immediate) {
        handler.call(this, this.#state[property], undefined);
      }

      // Return unwatch function
      return () => {
        const handlers = this.#watchers.get(property);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      };
    }

    $computed(name, deps, getter) {
      this.#computed.set(name, { deps, getter });
      Object.defineProperty(this, name, {
        get: () => {
          if (!(name in this.#state)) {
            this.#state[name] = getter.call(this);
          }
          return this.#state[name];
        },
        enumerable: true,
        configurable: true
      });
    }

    $set(property, value) {
      this[property] = value;
    }

    $batch(fn) {
      // Temporarily disable updates during batch
      const prevScheduled = this.#updateScheduled;
      this.#updateScheduled = true;
      try {
        fn();
      } finally {
        this.#updateScheduled = prevScheduled;
        if (!prevScheduled) {
          this.#scheduleUpdate();
        }
      }
    }
  };
}
`
}

/**
 * Generate reactive component JavaScript code
 *
 * @param component - Web component configuration
 * @param template - Component template HTML
 * @param options - Reactive options
 * @returns JavaScript code for the reactive component
 */
export function generateReactiveComponentJS(
  component: WebComponent,
  template: string,
  options: ReactiveComponentOptions = {},
): string {
  const { properties = [], computed = [], watchers = [], methods = {}, lifecycle = {} } = options
  const className = component.name
  const tagName = component.tag
  const useShadow = component.shadowDOM !== false

  // Generate reactive properties definition
  const propsDefinition = properties.map((prop) => {
    const defaultValue = prop.default !== undefined
      ? JSON.stringify(prop.default)
      : getDefaultForType(prop.type)
    return `    ${prop.name}: { type: '${prop.type}', default: ${defaultValue}, reflect: ${!!prop.reflect} }`
  }).join(',\n')

  // Generate computed properties setup
  const computedSetup = computed.map((c) => {
    const depsArray = JSON.stringify(c.dependencies)
    return `    this.$computed('${c.name}', ${depsArray}, ${c.getter});`
  }).join('\n')

  // Generate watchers setup
  const watchersSetup = watchers.map((w) => {
    const opts = w.immediate || w.deep
      ? `, { immediate: ${!!w.immediate}, deep: ${!!w.deep} }`
      : ''
    return `    this.$watch('${w.property}', ${w.handler}${opts});`
  }).join('\n')

  // Generate methods
  const methodsCode = Object.entries(methods)
    .map(([name, body]) => `  ${name}${body}`)
    .join('\n\n')

  // Generate lifecycle hooks
  const connectedCode = lifecycle.connected || ''
  const disconnectedCode = lifecycle.disconnected || ''
  const adoptedCode = lifecycle.adopted || ''
  const attributeChangedCode = lifecycle.attributeChanged || ''

  // Escape template for embedding
  const escapedTemplate = template
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')

  return `
${generateReactiveMixin()}

class ${className} extends StxReactive(HTMLElement) {
  static reactiveProperties = {
${propsDefinition}
  };

  static get observedAttributes() {
    return ${JSON.stringify(component.attributes || [])};
  }

  #shadowRoot;

  constructor() {
    super();
    ${useShadow ? 'this.#shadowRoot = this.attachShadow({ mode: \'open\' });' : ''}
    this.#setupComputed();
    this.#setupWatchers();
  }

  #setupComputed() {
${computedSetup}
  }

  #setupWatchers() {
${watchersSetup}
  }

  connectedCallback() {
    this.render();
    ${connectedCode}
  }

  disconnectedCallback() {
    ${disconnectedCode}
  }

  adoptedCallback() {
    ${adoptedCode}
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Convert attribute name to property name (kebab-case to camelCase)
    const propName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    // Get the property type
    const propConfig = ${className}.reactiveProperties[propName];
    if (propConfig) {
      let value = newValue;

      // Convert based on type
      switch (propConfig.type) {
        case 'number':
          value = newValue !== null ? Number(newValue) : propConfig.default;
          break;
        case 'boolean':
          value = newValue !== null;
          break;
        case 'object':
        case 'array':
          try {
            value = newValue !== null ? JSON.parse(newValue) : propConfig.default;
          } catch (e) {
            value = propConfig.default;
          }
          break;
      }

      this[propName] = value;
    }

    ${attributeChangedCode}
  }

  render() {
    const root = ${useShadow ? 'this.#shadowRoot' : 'this'};
    root.innerHTML = this.#template();
  }

  #template() {
    return \`${escapedTemplate}\`;
  }

${methodsCode}
}

customElements.define('${tagName}', ${className});

export { ${className} };
`
}

/**
 * Generate reactive component TypeScript code
 *
 * @param component - Web component configuration
 * @param template - Component template HTML
 * @param options - Reactive options
 * @returns TypeScript code for the reactive component
 */
export function generateReactiveComponentTS(
  component: WebComponent,
  template: string,
  options: ReactiveComponentOptions = {},
): string {
  const { properties = [], computed = [], watchers = [], methods = {}, lifecycle = {} } = options
  const className = component.name
  const tagName = component.tag
  const useShadow = component.shadowDOM !== false

  // Generate type for reactive properties
  const propsInterface = properties.map((prop) => {
    const tsType = getTypeScriptType(prop.type)
    return `  ${prop.name}: ${tsType};`
  }).join('\n')

  // Generate reactive properties definition
  const propsDefinition = properties.map((prop) => {
    const defaultValue = prop.default !== undefined
      ? JSON.stringify(prop.default)
      : getDefaultForType(prop.type)
    return `    ${prop.name}: { type: '${prop.type}' as const, default: ${defaultValue}, reflect: ${!!prop.reflect} }`
  }).join(',\n')

  // Generate computed properties setup
  const computedSetup = computed.map((c) => {
    const depsArray = JSON.stringify(c.dependencies)
    return `    this.$computed('${c.name}', ${depsArray}, ${c.getter});`
  }).join('\n')

  // Generate watchers setup
  const watchersSetup = watchers.map((w) => {
    const opts = w.immediate || w.deep
      ? `, { immediate: ${!!w.immediate}, deep: ${!!w.deep} }`
      : ''
    return `    this.$watch('${w.property}', ${w.handler}${opts});`
  }).join('\n')

  // Generate methods with types
  const methodsCode = Object.entries(methods)
    .map(([name, body]) => `  ${name}${body}`)
    .join('\n\n')

  // Generate lifecycle hooks
  const connectedCode = lifecycle.connected || ''
  const disconnectedCode = lifecycle.disconnected || ''
  const adoptedCode = lifecycle.adopted || ''
  const attributeChangedCode = lifecycle.attributeChanged || ''

  // Escape template for embedding
  const escapedTemplate = template
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')

  return `
interface ${className}Props {
${propsInterface}
}

interface ReactivePropertyConfig {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default: unknown;
  reflect: boolean;
}

interface ReactiveElement extends HTMLElement {
  $watch(property: string, handler: (newVal: unknown, oldVal: unknown) => void, options?: { immediate?: boolean; deep?: boolean }): () => void;
  $computed(name: string, deps: string[], getter: () => unknown): void;
  $set(property: string, value: unknown): void;
  $batch(fn: () => void): void;
}

${generateReactiveMixin()}

class ${className} extends StxReactive(HTMLElement) implements ReactiveElement {
  static reactiveProperties: Record<string, ReactivePropertyConfig> = {
${propsDefinition}
  };

  static get observedAttributes(): string[] {
    return ${JSON.stringify(component.attributes || [])};
  }

  #shadowRoot: ShadowRoot | null = null;

  constructor() {
    super();
    ${useShadow ? "this.#shadowRoot = this.attachShadow({ mode: 'open' });" : ''}
    this.#setupComputed();
    this.#setupWatchers();
  }

  #setupComputed(): void {
${computedSetup}
  }

  #setupWatchers(): void {
${watchersSetup}
  }

  connectedCallback(): void {
    this.render();
    ${connectedCode}
  }

  disconnectedCallback(): void {
    ${disconnectedCode}
  }

  adoptedCallback(): void {
    ${adoptedCode}
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    const propName = name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());

    const propConfig = ${className}.reactiveProperties[propName];
    if (propConfig) {
      let value: unknown = newValue;

      switch (propConfig.type) {
        case 'number':
          value = newValue !== null ? Number(newValue) : propConfig.default;
          break;
        case 'boolean':
          value = newValue !== null;
          break;
        case 'object':
        case 'array':
          try {
            value = newValue !== null ? JSON.parse(newValue) : propConfig.default;
          } catch {
            value = propConfig.default;
          }
          break;
      }

      (this as Record<string, unknown>)[propName] = value;
    }

    ${attributeChangedCode}
  }

  render(): void {
    const root = ${useShadow ? 'this.#shadowRoot' : 'this'};
    if (root) {
      root.innerHTML = this.#template();
    }
  }

  #template(): string {
    return \`${escapedTemplate}\`;
  }

${methodsCode}
}

customElements.define('${tagName}', ${className});

export { ${className} };
export type { ${className}Props };
`
}

/**
 * Get default value for a type
 */
function getDefaultForType(type: string): string {
  switch (type) {
    case 'string':
      return '\'\''
    case 'number':
      return '0'
    case 'boolean':
      return 'false'
    case 'array':
      return '[]'
    case 'object':
      return '{}'
    default:
      return 'undefined'
  }
}

/**
 * Get TypeScript type from property type
 */
function getTypeScriptType(type: string): string {
  switch (type) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return 'unknown[]'
    case 'object':
      return 'Record<string, unknown>'
    default:
      return 'unknown'
  }
}

/**
 * Generate the reactive runtime script for browser inclusion
 *
 * @returns Minified runtime script
 */
export function generateReactiveRuntime(): string {
  return `
(function() {
  'use strict';

  // StxReactive mixin for dynamic component creation
  window.StxReactive = ${generateReactiveMixin().replace(/\n/g, ' ').replace(/\s+/g, ' ')};

  // Helper to create reactive components dynamically
  window.createReactiveComponent = function(tag, config) {
    const { properties = {}, template, methods = {}, lifecycle = {} } = config;

    class DynamicComponent extends StxReactive(HTMLElement) {
      static reactiveProperties = properties;
      static get observedAttributes() {
        return Object.keys(properties).map(p =>
          p.replace(/([A-Z])/g, '-$1').toLowerCase()
        );
      }

      constructor() {
        super();
        if (config.shadow !== false) {
          this.attachShadow({ mode: 'open' });
        }
      }

      connectedCallback() {
        this.render();
        if (lifecycle.connected) lifecycle.connected.call(this);
      }

      disconnectedCallback() {
        if (lifecycle.disconnected) lifecycle.disconnected.call(this);
      }

      render() {
        const root = this.shadowRoot || this;
        root.innerHTML = typeof template === 'function'
          ? template.call(this)
          : template;
      }
    }

    // Add methods
    Object.entries(methods).forEach(([name, fn]) => {
      DynamicComponent.prototype[name] = fn;
    });

    customElements.define(tag, DynamicComponent);
    return DynamicComponent;
  };
})();
`
}
