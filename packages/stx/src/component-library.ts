import type {
  ComponentLibraryBuildResult,
  ComponentLibraryComponent,
  ComponentLibraryConfig,
  ComponentLibraryEvent,
  ComponentLibraryProperty,
} from './types'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface SourceMetadata {
  name?: string
  tag?: string
  description?: string
  shadowDOM?: boolean | 'open' | 'closed'
  progressive?: boolean
  properties?: Record<string, ComponentLibraryProperty>
  props?: Record<string, ComponentLibraryProperty>
  events?: Record<string, ComponentLibraryEvent>
  methods?: Record<string, string>
}

interface CompiledComponent {
  file: string
  sourcePath: string
  name: string
  tag: string
  description: string
  template: string
  styles: string
  shadowMode: false | 'open' | 'closed'
  progressive: boolean
  properties: Record<string, ComponentLibraryProperty>
  events: Record<string, ComponentLibraryEvent>
  methods: Record<string, string>
  eventTypes: string[]
  bindings: Array<{ id: number, name: string, expression: string }>
  slots: Array<{ name: string, description?: string }>
  cssProperties: Array<{ name: string, description?: string }>
}

const RESERVED_METHODS = new Set([
  'constructor',
  'connectedCallback',
  'disconnectedCallback',
  'attributeChangedCallback',
  'adoptedCallback',
])

function toPascalCase(value: string): string {
  return value
    .replace(/\.stx$/i, '')
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function validCustomElementTag(tag: string): boolean {
  return /^[a-z][.0-9_a-z-]*-[.0-9_a-z-]*$/.test(tag)
    && !tag.startsWith('xml')
    && !/[A-Z]/.test(tag)
}

function normalizeShadowMode(value: boolean | 'open' | 'closed' | undefined): false | 'open' | 'closed' {
  if (value === true) return 'open'
  if (value === 'open' || value === 'closed') return value
  return false
}

async function discoverStxFiles(inputDir: string): Promise<string[]> {
  const files: string[] = []

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') await visit(entryPath)
      }
      else if (entry.isFile() && entry.name.endsWith('.stx') && !/\.(?:test|spec)\.stx$/i.test(entry.name)) {
        files.push(entryPath)
      }
    }
  }

  await visit(inputDir)
  return files
}

function parseMetadata(source: string, file: string): SourceMetadata {
  const match = source.match(/<script\b(?=[^>]*(?:\bcomponent\b|\bstx:component\b))[^>]*>([\s\S]*?)<\/script>/i)
  if (!match) return {}

  const raw = match[1].trim()
  if (!raw) return {}

  try {
    return JSON.parse(raw) as SourceMetadata
  }
  catch (error) {
    throw new Error(`${file}: <script component> must contain JSON metadata (${(error as Error).message})`)
  }
}

function extractClientMethods(source: string, file: string): Record<string, string> {
  const methods: Record<string, string> = {}
  const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]

  for (const script of scripts) {
    if (!/\bclient\b/i.test(script[1]) || /\bcomponent\b|\bstx:component\b/i.test(script[1])) continue
    const code = script[2]
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g
    let match: RegExpExecArray | null
    while ((match = functionPattern.exec(code))) {
      const name = match[1]
      if (RESERVED_METHODS.has(name)) throw new Error(`${file}: client method "${name}" is reserved`)
      const bodyStart = functionPattern.lastIndex
      let depth = 1
      let quote = ''
      let escaped = false
      let cursor = bodyStart
      for (; cursor < code.length && depth > 0; cursor++) {
        const char = code[cursor]
        if (escaped) {
          escaped = false
          continue
        }
        if (quote) {
          if (char === '\\') escaped = true
          else if (char === quote) quote = ''
          continue
        }
        if (char === '"' || char === "'" || char === '`') quote = char
        else if (char === '{') depth++
        else if (char === '}') depth--
      }
      if (depth !== 0) throw new Error(`${file}: unterminated client function "${name}"`)
      const asyncPrefix = match[0].includes('async') ? 'async ' : ''
      methods[name] = `${asyncPrefix}${name}(${match[2]}) {${code.slice(bodyStart, cursor - 1)}}`
      functionPattern.lastIndex = cursor
    }
  }

  return methods
}

function extractTemplate(source: string): string {
  const templateMatch = source.match(/<template\b(?![^>]*\bshadowrootmode\b)[^>]*>([\s\S]*?)<\/template>/i)
  const template = templateMatch ? templateMatch[1] : source
  return template
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim()
}

function extractStyles(source: string): string {
  return [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean)
    .join('\n\n')
}

function compileEventDirectives(template: string): { template: string, eventTypes: string[] } {
  const eventTypes = new Set<string>()
  const compiled = template.replace(
    /\s@([a-z][\w:-]*)(\.[\w.-]+)?\s*=\s*(["'])([A-Za-z_$][\w$]*)\3/gi,
    (_match, eventName: string, modifiers: string | undefined, _quote: string, method: string) => {
      const event = eventName.toLowerCase()
      eventTypes.add(event)
      const normalizedModifiers = (modifiers || '').split('.').filter(Boolean).join(' ')
      return ` data-stx-on-${event}="${method}"${normalizedModifiers ? ` data-stx-mod-${event}="${normalizedModifiers}"` : ''}`
    },
  )
  return { template: compiled, eventTypes: [...eventTypes].sort() }
}

function compileDynamicBindings(template: string): {
  template: string
  bindings: Array<{ id: number, name: string, expression: string }>
} {
  const bindings: Array<{ id: number, name: string, expression: string }> = []
  const compiled = template.replace(
    /\s:([a-z][\w:-]*)\s*=\s*(["'])([\w$.]+)\2/gi,
    (_match, name: string, _quote: string, expression: string) => {
      const id = bindings.length
      bindings.push({ id, name, expression })
      return ` data-stx-bind-${id}=""`
    },
  )
  return { template: compiled, bindings }
}

function extractSlots(template: string): Array<{ name: string }> {
  const names = new Set<string>()
  for (const match of template.matchAll(/<slot\b([^>]*)>/gi)) {
    names.add(match[1].match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1] || '')
  }
  return [...names].map(name => ({ name }))
}

function extractCssProperties(styles: string): Array<{ name: string }> {
  return [...new Set([...styles.matchAll(/(--[a-z0-9_-]+)\s*:/gi)].map(match => match[1]))]
    .sort()
    .map(name => ({ name }))
}

function normalizeProperty(name: string, property: ComponentLibraryProperty): ComponentLibraryProperty {
  const supported = new Set(['string', 'number', 'boolean', 'object', 'array'])
  if (!property || !supported.has(property.type)) {
    throw new Error(`Property "${name}" must declare one of: string, number, boolean, object, array`)
  }
  return {
    ...property,
    reflect: property.reflect ?? property.attribute !== false,
  }
}

async function compileComponent(
  inputDir: string,
  entry: ComponentLibraryComponent,
  defaults: Pick<ComponentLibraryConfig, 'prefix' | 'shadowDOM' | 'progressive'>,
): Promise<CompiledComponent> {
  const sourcePath = path.isAbsolute(entry.file) ? entry.file : path.resolve(inputDir, entry.file)
  const source = await readFile(sourcePath, 'utf8')
  const metadata = parseMetadata(source, sourcePath)
  const baseName = path.basename(sourcePath, '.stx')
  const name = entry.name || metadata.name || toPascalCase(baseName)
  const inferredTag = `${toKebabCase(defaults.prefix || 'stx')}-${toKebabCase(baseName)}`
  const tag = entry.tag || metadata.tag || inferredTag

  if (!name || !/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`${sourcePath}: invalid component class name "${name}"`)
  if (!validCustomElementTag(tag)) throw new Error(`${sourcePath}: invalid custom-element tag "${tag}"; tags must be lowercase and contain a hyphen`)

  const propertyInput = entry.properties || metadata.properties || metadata.props || {}
  const properties = Object.fromEntries(
    Object.entries(propertyInput).map(([propertyName, property]) => [propertyName, normalizeProperty(propertyName, property)]),
  )
  const eventCompilation = compileEventDirectives(extractTemplate(source))
  const bindingCompilation = compileDynamicBindings(eventCompilation.template)
  const metadataMethods = metadata.methods || {}
  const configuredMethods = entry.methods || {}
  const extractedMethods = extractClientMethods(source, sourcePath)

  return {
    file: path.relative(inputDir, sourcePath),
    sourcePath,
    name,
    tag,
    description: entry.description || metadata.description || '',
    template: bindingCompilation.template,
    styles: extractStyles(source),
    shadowMode: normalizeShadowMode(entry.shadowDOM ?? metadata.shadowDOM ?? defaults.shadowDOM),
    progressive: entry.progressive ?? metadata.progressive ?? defaults.progressive ?? true,
    properties,
    events: entry.events || metadata.events || {},
    methods: { ...metadataMethods, ...configuredMethods, ...extractedMethods },
    eventTypes: eventCompilation.eventTypes,
    bindings: bindingCompilation.bindings,
    slots: extractSlots(bindingCompilation.template),
    cssProperties: extractCssProperties(extractStyles(source)),
  }
}

function runtimeModule(): string {
  const rawInterpolation = JSON.stringify('\\{!!\\s*([\\w$.]+)\\s*!!\\}')
  const escapedInterpolation = JSON.stringify('\\{\\{\\s*([\\w$.]+)\\s*\\}\\}')
  return `const HTMLElementBase = globalThis.HTMLElement || class {};

const escapeHTML = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const valueAt = (host, path) => {
  const parts = path.trim().split('.');
  let value = host;
  for (const part of parts) value = value?.[part];
  return typeof value === 'function' ? value.call(host) : value;
};

const deserialize = (value, type, fallback) => {
  if (value === null) return type === 'boolean' ? false : fallback;
  if (type === 'boolean') return value !== 'false' && value !== '0';
  if (type === 'number') return Number(value);
  if (type === 'object' || type === 'array') {
    try { return JSON.parse(value); }
    catch { return fallback; }
  }
  return value;
};

const serialize = (value, type) => {
  if (value == null || value === false) return null;
  if (type === 'boolean') return '';
  if (type === 'object' || type === 'array') return JSON.stringify(value);
  return String(value);
};

export class StxElement extends HTMLElementBase {
  static definition = {};
  static get observedAttributes() { return this.definition.observedAttributes || []; }

  constructor() {
    super();
    this._values = Object.create(null);
    this._reflecting = false;
    this._connected = false;
    this._updatePending = false;
    this._listeners = new Map();
    const definition = this.constructor.definition;
    for (const [name, property] of Object.entries(definition.properties || {})) {
      this._values[name] = property.default ?? ({ string: '', number: 0, boolean: false, object: {}, array: [] })[property.type];
    }
    if (definition.shadowMode && this.attachShadow && !this.shadowRoot) {
      this._closedRoot = this.attachShadow({ mode: definition.shadowMode });
    }
  }

  get updateComplete() { return this._updateComplete || Promise.resolve(); }
  get renderRoot() { return this._closedRoot || this.shadowRoot || this; }

  connectedCallback() {
    if (this._connected) return;
    this._connected = true;
    const definition = this.constructor.definition;
    for (const name of Object.keys(definition.properties || {})) this._upgradeProperty(name);
    for (const [name, property] of Object.entries(definition.properties || {})) {
      const attribute = property.attribute === false ? null : (property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()));
      if (attribute && this.hasAttribute?.(attribute)) this._values[name] = deserialize(this.getAttribute(attribute), property.type, this._values[name]);
    }
    const root = this.renderRoot;
    const hasMarkup = [...(root.childNodes || [])].some(node => node.nodeType !== 3 || node.textContent.trim());
    if (!(definition.progressive && hasMarkup)) this._render();
    else this._upgradeDeclarativeEvents();
    this._bindEvents();
    this.setAttribute?.('hydrated', '');
    this.dispatchEvent?.(new CustomEvent('stx:hydrated', { bubbles: true, composed: true }));
  }

  disconnectedCallback() {
    this._connected = false;
    for (const [event, listener] of this._listeners) this.renderRoot.removeEventListener(event, listener);
    this._listeners.clear();
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue || this._reflecting) return;
    const definition = this.constructor.definition;
    const name = definition.attributeToProperty?.[attribute];
    if (!name) return;
    const property = definition.properties[name];
    const value = deserialize(newValue, property.type, property.default);
    if (!Object.is(this._values[name], value)) {
      this._values[name] = value;
      this.requestUpdate();
    }
  }

  requestUpdate() {
    if (!this._connected || this._updatePending) return this.updateComplete;
    this._updatePending = true;
    this._updateComplete = new Promise((resolve) => {
      queueMicrotask(() => {
        this._updatePending = false;
        if (this._connected) this._render();
        resolve();
      });
    });
    return this._updateComplete;
  }

  emit(name, detail, options = {}) {
    return this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true, ...options,
    }));
  }

  _upgradeProperty(name) {
    if (!Object.prototype.hasOwnProperty.call(this, name)) return;
    const value = this[name];
    delete this[name];
    this[name] = value;
  }

  _upgradeDeclarativeEvents() {
    for (const element of this.renderRoot.querySelectorAll?.('*') || []) {
      const names = element.getAttributeNames?.() || [...(element.attributes || [])].filter(Boolean).map(attribute => attribute.name);
      for (const attributeName of names) {
        if (!attributeName?.startsWith('@')) continue;
        const [event, ...modifiers] = attributeName.slice(1).split('.');
        element.setAttribute('data-stx-on-' + event, element.getAttribute(attributeName));
        if (modifiers.length) element.setAttribute('data-stx-mod-' + event, modifiers.join(' '));
        element.removeAttribute(attributeName);
      }
    }
  }

  _bindEvents() {
    for (const event of this.constructor.definition.eventTypes || []) {
      if (this._listeners.has(event)) continue;
      const listener = ($event) => {
        const selector = '[data-stx-on-' + event + ']';
        const target = $event.target?.closest?.(selector);
        if (!target || !this.renderRoot.contains(target)) return;
        const modifiers = (target.getAttribute('data-stx-mod-' + event) || '').split(' ');
        if (modifiers.includes('prevent')) $event.preventDefault();
        if (modifiers.includes('stop')) $event.stopPropagation();
        const method = target.getAttribute('data-stx-on-' + event);
        if (typeof this[method] === 'function') this[method]($event);
      };
      this.renderRoot.addEventListener(event, listener);
      this._listeners.set(event, listener);
    }
  }

  _render() {
    const definition = this.constructor.definition;
    const root = this.renderRoot;
    const active = root.activeElement || (root.contains?.(globalThis.document?.activeElement) ? globalThis.document.activeElement : null);
    const focusKey = active && (active.getAttribute?.('data-key') || active.id || active.getAttribute?.('name'));
    const selection = active && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
    let html = definition.template
      .replace(new RegExp(${rawInterpolation}, 'g'), (_match, expression) => String(valueAt(this, expression) ?? ''))
      .replace(new RegExp(${escapedInterpolation}, 'g'), (_match, expression) => escapeHTML(valueAt(this, expression)));
    if (definition.shadowMode && definition.styles) html = '<style>' + definition.styles + '</style>' + html;
    root.innerHTML = html;
    this._applyBindings();
    this._bindEvents();
    if (focusKey) {
      const escaped = globalThis.CSS?.escape ? globalThis.CSS.escape(focusKey) : focusKey.replace(/["\\\\]/g, '\\$&');
      const next = root.querySelector('[data-key="' + escaped + '"],#' + escaped + ',[name="' + escaped + '"]');
      next?.focus?.();
      if (selection && next?.setSelectionRange) next.setSelectionRange(selection[0], selection[1]);
    }
    this.dispatchEvent?.(new CustomEvent('stx:updated', { bubbles: false }));
  }

  _applyBindings() {
    for (const binding of this.constructor.definition.bindings || []) {
      const element = this.renderRoot.querySelector('[data-stx-bind-' + binding.id + ']');
      if (!element) continue;
      const value = valueAt(this, binding.expression);
      if (binding.name === 'class') element.className = value || '';
      else if (binding.name === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      }
      else if (typeof value === 'boolean') {
        element.toggleAttribute(binding.name, value);
        if (binding.name in element) element[binding.name] = value;
      }
      else if (value == null || value === false) element.removeAttribute(binding.name);
      else element.setAttribute(binding.name, String(value));
    }
  }
}

export function defineComponent(Component, definition) {
  const properties = definition.properties || {};
  const attributeToProperty = {};
  const observedAttributes = [];
  for (const [name, property] of Object.entries(properties)) {
    const attribute = property.attribute === false ? null : (property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()));
    if (attribute) {
      attributeToProperty[attribute] = name;
      observedAttributes.push(attribute);
    }
    Object.defineProperty(Component.prototype, name, {
      configurable: true,
      enumerable: true,
      get() { return this._values[name]; },
      set(value) {
        const oldValue = this._values[name];
        if (Object.is(oldValue, value)) return;
        this._values[name] = value;
        if (property.reflect && attribute && !this._reflecting) {
          const serialized = serialize(value, property.type);
          this._reflecting = true;
          if (serialized === null) this.removeAttribute(attribute);
          else this.setAttribute(attribute, serialized);
          this._reflecting = false;
        }
        this.requestUpdate();
        this.dispatchEvent?.(new CustomEvent(name + '-changed', {
          detail: { value, oldValue }, bubbles: true, composed: true,
        }));
      },
    });
  }
  Component.definition = { ...definition, attributeToProperty, observedAttributes };
  const registry = globalThis.customElements || globalThis.window?.customElements;
  if (registry && !registry.get(definition.tag)) {
    registry.define(definition.tag, Component);
  }
  return Component;
}
`
}

function componentModule(component: CompiledComponent): string {
  const definition = JSON.stringify({
    tag: component.tag,
    template: component.template,
    styles: component.styles,
    shadowMode: component.shadowMode,
    progressive: component.progressive,
    properties: component.properties,
    eventTypes: component.eventTypes,
    bindings: component.bindings,
  }, null, 2)
  const methodCode = Object.entries(component.methods).map(([name, body]) => {
    if (RESERVED_METHODS.has(name)) throw new Error(`${component.sourcePath}: method "${name}" is reserved`)
    if (/^(?:async\s+)?[A-Za-z_$][\w$]*\s*\(/.test(body.trim())) return `  ${body.trim()}`
    return `  ${name}($event) {\n${body}\n  }`
  }).join('\n\n')

  return `import { StxElement, defineComponent } from './runtime.js';

/** ${component.description || `${component.name} web component generated from ${component.file}.`} */
export class ${component.name} extends StxElement {
${methodCode}
}

defineComponent(${component.name}, ${definition});
export default ${component.name};
`
}

function typeForProperty(property: ComponentLibraryProperty): string {
  switch (property.type) {
    case 'boolean': return 'boolean'
    case 'number': return 'number'
    case 'array': return 'unknown[]'
    case 'object': return 'Record<string, unknown>'
    default: return 'string'
  }
}

function componentDeclaration(component: CompiledComponent): string {
  const props = Object.entries(component.properties).map(([name, property]) =>
    `  ${name}${property.required ? '' : '?'}: ${typeForProperty(property)}`,
  ).join('\n')
  const fields = Object.entries(component.properties).map(([name, property]) =>
    `  ${name}: ${typeForProperty(property)}`,
  ).join('\n')
  const events = Object.entries(component.events).map(([name, event]) =>
    `  ${JSON.stringify(name)}: CustomEvent<${event.detailType || 'unknown'}>`).join('\n')
  const methods = Object.keys(component.methods).map(name => `  ${name}($event?: Event): unknown`).join('\n')

  return `export interface ${component.name}Props {
${props}
}

export interface ${component.name}EventMap {
${events}
}

export declare class ${component.name} extends HTMLElement {
${fields}
${methods}
  readonly updateComplete: Promise<void>
  requestUpdate(): Promise<void>
  emit<T = unknown>(name: string, detail?: T, options?: CustomEventInit<T>): boolean
}

declare global {
  interface HTMLElementTagNameMap {
    ${JSON.stringify(component.tag)}: ${component.name}
  }
}

export default ${component.name}
`
}

function customElementsDeclaration(components: CompiledComponent[]): string {
  const intrinsic = components.map((component) => {
    const props = Object.entries(component.properties).map(([name, property]) =>
      `      ${JSON.stringify(name)}?: ${typeForProperty(property)}`).join('\n')
    const events = Object.keys(component.events).map((event) => {
      const handler = `on${event.split(/[-:]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`
      return `      ${handler}?: (event: CustomEvent<${component.events[event].detailType || 'unknown'}>) => void`
    }).join('\n')
    return `    ${JSON.stringify(component.tag)}: {
${props}
${events}
      children?: unknown
      slot?: string
      class?: string
      className?: string
    }`
  }).join('\n')

  return `declare global {
  namespace JSX {
    interface IntrinsicElements {
${intrinsic}
    }
  }
}

export {}
`
}

function customElementsManifest(components: CompiledComponent[]): Record<string, unknown> {
  return {
    schemaVersion: '1.0.0',
    modules: components.map(component => ({
      kind: 'javascript-module',
      path: `./${component.tag}.js`,
      declarations: [{
        kind: 'class',
        name: component.name,
        description: component.description || undefined,
        customElement: true,
        tagName: component.tag,
        members: Object.entries(component.properties).map(([name, property]) => ({
          kind: 'field',
          name,
          description: property.description,
          type: { text: typeForProperty(property) },
          default: property.default === undefined ? undefined : JSON.stringify(property.default),
          attribute: property.attribute === false ? undefined : (property.attribute || toKebabCase(name)),
          reflects: property.reflect,
        })),
        events: Object.entries(component.events).map(([name, event]) => ({
          name,
          description: event.description,
          type: { text: `CustomEvent<${event.detailType || 'unknown'}>` },
        })),
        slots: component.slots,
        cssProperties: component.cssProperties,
      }],
      exports: [{ kind: 'js', name: component.name, declaration: { name: component.name, module: `./${component.tag}.js` } }],
    })),
  }
}

function scopeLightDomCss(component: CompiledComponent): string {
  if (!component.styles) return ''
  const lightDomStyles = component.styles.replace(/:host\b/g, ':scope')
  if (/\@scope\s*\(/.test(lightDomStyles)) return lightDomStyles
  return `@scope (${component.tag}) {\n${lightDomStyles}\n}`
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

function ssrModule(components: CompiledComponent[]): string {
  const rawInterpolation = JSON.stringify('\\{!!\\s*([\\w$.]+)\\s*!!\\}')
  const escapedInterpolation = JSON.stringify('\\{\\{\\s*([\\w$.]+)\\s*\\}\\}')
  const slotPattern = JSON.stringify('<slot(?:\\s+name=["\\\']([^"\\\']+)["\\\'])?\\s*\\/?>(?:<\\/slot>)?')
  const definitions = Object.fromEntries(components.map(component => [component.tag, {
    template: component.template,
    styles: component.styles,
    shadowMode: component.shadowMode,
    properties: component.properties,
  }]))
  const renderers = components.map(component =>
    `export const render${component.name} = (props = {}, slots = {}) => renderComponent('${component.tag}', props, slots);`,
  ).join('\n')

  return `const definitions = ${JSON.stringify(definitions, null, 2)};
const escapeHTML = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const valueAt = (values, path) => path.trim().split('.').reduce((value, part) => value?.[part], values);

export function renderComponent(tag, props = {}, slots = {}) {
  const definition = definitions[tag];
  if (!definition) throw new Error('Unknown STX component: ' + tag);
  const values = Object.fromEntries(Object.entries(definition.properties).map(([name, property]) => [name, property.default]));
  Object.assign(values, props);
  let template = definition.template
    .replace(new RegExp(${rawInterpolation}, 'g'), (_match, expression) => String(valueAt(values, expression) ?? ''))
    .replace(new RegExp(${escapedInterpolation}, 'g'), (_match, expression) => escapeHTML(valueAt(values, expression)))
    .replace(new RegExp(${slotPattern}, 'gi'), (_match, name) => String(slots[name || 'default'] ?? ''));
  const attributes = Object.entries(definition.properties).flatMap(([name, property]) => {
    if (property.attribute === false || !(name in props)) return [];
    const attribute = property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
    const value = props[name];
    if (value == null || value === false) return [];
    if (value === true) return [attribute];
    const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
    return [attribute + '=\\"' + escapeHTML(serialized) + '\\"'];
  }).join(' ');
  if (definition.shadowMode) {
    template = '<template shadowrootmode="' + definition.shadowMode + '">' +
      (definition.styles ? '<style>' + definition.styles + '</style>' : '') + template + '</template>' +
      String(slots.default ?? '');
  }
  return '<' + tag + (attributes ? ' ' + attributes : '') + '>' + template + '</' + tag + '>';
}

${renderers}
`
}

/**
 * Compile a directory of .stx single-file components into a progressive,
 * framework-agnostic custom-element library.
 */
export async function buildComponentLibrary(config: ComponentLibraryConfig): Promise<ComponentLibraryBuildResult> {
  const inputDir = path.resolve(config.inputDir)
  const outputDir = path.resolve(config.outputDir)
  const inputStats = await stat(inputDir).catch(() => null)
  if (!inputStats?.isDirectory()) throw new Error(`Component-library input directory does not exist: ${inputDir}`)

  const entries: ComponentLibraryComponent[] = config.components?.length
    ? config.components
    : (await discoverStxFiles(inputDir)).map(file => ({ file }))
  if (!entries.length) throw new Error(`No .stx components found in ${inputDir}`)

  const components = await Promise.all(entries.map(entry => compileComponent(inputDir, entry, config)))
  components.sort((a, b) => a.tag.localeCompare(b.tag))
  const duplicateTags = components.filter((component, index) => components.findIndex(item => item.tag === component.tag) !== index)
  if (duplicateTags.length) throw new Error(`Duplicate custom-element tag: ${duplicateTags[0].tag}`)
  const duplicateNames = components.filter((component, index) => components.findIndex(item => item.name === component.name) !== index)
  if (duplicateNames.length) throw new Error(`Duplicate component class name: ${duplicateNames[0].name}`)

  await mkdir(outputDir, { recursive: true })
  const files: string[] = []
  const emit = async (filename: string, content: string): Promise<string> => {
    const target = path.join(outputDir, filename)
    await writeFile(target, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
    files.push(target)
    return target
  }

  await emit('runtime.js', runtimeModule())
  for (const component of components) {
    await emit(`${component.tag}.js`, componentModule(component))
    if (config.declarations !== false) await emit(`${component.tag}.d.ts`, componentDeclaration(component))
    if (config.css !== false && component.styles) {
      const css = component.shadowMode ? component.styles : scopeLightDomCss(component)
      await emit(`${component.tag}.css`, config.minify ? minifyCss(css) : css)
    }
  }

  const indexSource = components.map(component =>
    `export { ${component.name}, default as ${component.name}Element } from './${component.tag}.js';`,
  ).join('\n')
  await emit('index.js', indexSource)
  await emit('ssr.js', ssrModule(components))

  if (config.declarations !== false) {
    await emit('index.d.ts', components.map(component => `export * from './${component.tag}.js'`).join('\n'))
    await emit('custom-elements.d.ts', customElementsDeclaration(components))
    await emit('ssr.d.ts', `${components.map(component => `export declare const render${component.name}: (props?: ${component.name}Props, slots?: Record<string, string>) => string`).join('\n')}\nexport declare function renderComponent(tag: string, props?: Record<string, unknown>, slots?: Record<string, string>): string\n${components.map(component => `import type { ${component.name}Props } from './${component.tag}.js'`).join('\n')}`)
  }

  let manifest: string | undefined
  if (config.manifest !== false) manifest = await emit('custom-elements.json', JSON.stringify(customElementsManifest(components), null, 2))

  let cssBundle: string | undefined
  if (config.css !== false) {
    const bundledCss = components.filter(component => !component.shadowMode && component.styles).map(scopeLightDomCss).join('\n\n')
    if (bundledCss) cssBundle = await emit('bundle.css', config.minify ? minifyCss(bundledCss) : bundledCss)
  }

  let bundle: string | undefined
  if (config.bundle !== false) {
    bundle = path.join(outputDir, 'bundle.js')
    const result = await Bun.build({
      entrypoints: [path.join(outputDir, 'index.js')],
      outdir: outputDir,
      naming: 'bundle.js',
      target: 'browser',
      format: 'esm',
      minify: config.minify ?? true,
      sourcemap: config.sourcemap || 'none',
    })
    if (!result.success) throw new AggregateError(result.logs, 'Failed to bundle component library')
    files.push(bundle)
    if (config.sourcemap === 'external') files.push(`${bundle}.map`)
  }

  const sizes = await Promise.all(files.map(async file => (await stat(file)).size))
  return {
    components: components.map(component => ({
      name: component.name,
      tag: component.tag,
      source: component.sourcePath,
      module: path.join(outputDir, `${component.tag}.js`),
    })),
    files,
    manifest,
    bundle,
    cssBundle,
    totalBytes: sizes.reduce((total, size) => total + size, 0),
  }
}
