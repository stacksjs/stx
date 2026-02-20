import type { StxOptions, WebComponent } from './types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { ErrorCodes, inlineError } from './error-handling'
import { fileExists, resolveTemplatePath } from './utils'

/**
 * Builds web components from stx components
 */
export async function buildWebComponents(
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string[]> {
  if (!options.webComponents?.enabled)
    return []

  const webComponents = options.webComponents.components || []
  const builtComponents: string[] = []

  if (webComponents.length > 0) {
    if (options.debug)
      console.log(`Building ${webComponents.length} web components...`)

    for (const component of webComponents) {
      try {
        const outputPath = await buildWebComponent(component, options, dependencies)
        if (outputPath)
          builtComponents.push(outputPath)
      }
      catch (error) {
        console.error(`Error building web component ${component.name}:`, error)
      }
    }
  }

  return builtComponents
}

/**
 * Builds a single web component
 */
async function buildWebComponent(
  component: WebComponent,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string | null> {
  const { name, file, tag, extends: baseElement } = component

  if (!name || !file || !tag) {
    console.error('Invalid web component configuration, missing required fields:', component)
    return null
  }

  // Resolve the source component file path
  let filePath = null

  // Try to resolve as absolute path first
  if (path.isAbsolute(file) && await fileExists(file)) {
    filePath = file
  }
  // Then try as relative to the components directory
  else if (options.componentsDir) {
    const componentsPath = path.join(options.componentsDir, file)
    if (await fileExists(componentsPath)) {
      filePath = componentsPath
    }
  }
  // Finally try using resolveTemplatePath for other resolution strategies
  if (!filePath) {
    filePath = await resolveTemplatePath(file, process.cwd(), options, dependencies)
  }

  if (!filePath) {
    console.error(`Web component source file not found: ${file}`)
    return null
  }

  // Read the component source
  const source = await Bun.file(filePath).text()

  // Track this component as a dependency
  dependencies.add(filePath)

  // Determine output format
  const outputFormat = component.outputFormat || 'js'
  const isTypeScript = outputFormat === 'ts'

  // Create the web component wrapper
  const webComponentCode = isTypeScript
    ? generateWebComponentCodeTypeScript({
        name,
        tag,
        baseElement,
        source,
        shadowDOM: component.shadowDOM ?? true,
        template: component.template ?? true,
        styleSource: component.styleSource,
        attributes: component.attributes || [],
        attributeTypes: component.attributeTypes || {},
      })
    : generateWebComponentCode({
        name,
        tag,
        baseElement,
        source,
        shadowDOM: component.shadowDOM ?? true,
        template: component.template ?? true,
        styleSource: component.styleSource,
        attributes: component.attributes || [],
      })

  // Ensure output directory exists
  const outputDir = options.webComponents?.outputDir || 'dist/web-components'
  await fs.promises.mkdir(outputDir, { recursive: true })

  // Write the web component file
  const extension = isTypeScript ? 'ts' : 'js'
  const outputFile = path.join(outputDir, `${tag}.${extension}`)
  await Bun.write(outputFile, webComponentCode)

  if (options.debug)
    console.log(`Built web component ${name} -> ${outputFile}`)

  return outputFile
}

/**
 * Options for generating web component code
 */
interface WebComponentCodeOptions {
  name: string
  tag: string
  baseElement?: string
  source: string
  shadowDOM: boolean
  template: boolean
  styleSource?: string
  attributes?: string[]
}

// =============================================================================
// Reactive Properties System
// =============================================================================

/**
 * Property definition for reactive web components
 */
export interface ReactivePropertyDefinition {
  /** Property type for serialization/deserialization */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** Default value */
  default?: unknown
  /** Whether property reflects to attribute */
  reflect?: boolean
  /** Custom attribute name (defaults to kebab-case of property name) */
  attribute?: string | false
  /** Observer function name to call when property changes */
  observer?: string
  /** Whether property changes should trigger re-render */
  render?: boolean
}

/**
 * Reactive web component configuration
 */
export interface ReactiveWebComponentConfig {
  /** Component class name */
  name: string
  /** Custom element tag name */
  tag: string
  /** Base element to extend */
  baseElement?: string
  /** Component template HTML */
  template: string
  /** Component styles (CSS) */
  styles?: string
  /** Whether to use Shadow DOM */
  shadowDOM?: boolean
  /** Reactive property definitions */
  properties?: Record<string, ReactivePropertyDefinition>
  /** Lifecycle hooks to include */
  lifecycle?: {
    connected?: string
    disconnected?: string
    adopted?: string
    attributeChanged?: string
  }
  /** Event handlers */
  events?: Record<string, string>
  /** Methods to include in the component */
  methods?: Record<string, string>
  /** Initial state */
  state?: Record<string, unknown>
}

/**
 * Generates the JavaScript code for a web component
 */
function generateWebComponentCode(options: WebComponentCodeOptions): string {
  const {
    name,
    tag,
    baseElement = 'HTMLElement',
    source,
    shadowDOM,
    template,
    styleSource,
    attributes = [],
  } = options

  // Extract HTML content (stripping any <script> tags)
  let htmlContent = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim()

  // For non-shadow DOM mode, transform <slot> elements to data-slot divs
  // since native <slot> only works with shadow DOM
  if (!shadowDOM) {
    // Transform <slot name="xxx">fallback</slot> to <div data-slot="xxx">fallback</div>
    htmlContent = htmlContent.replace(
      /<slot\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/slot>/gi,
      '<div data-slot="$1">$2</div>',
    )
    // Transform <slot name="xxx" /> (self-closing) to <div data-slot="xxx"></div>
    htmlContent = htmlContent.replace(
      /<slot\s+name=["']([^"']+)["']\s*\/>/gi,
      '<div data-slot="$1"></div>',
    )
    // Transform default <slot>fallback</slot> to <div data-default-slot>fallback</div>
    htmlContent = htmlContent.replace(
      /<slot\s*>([\s\S]*?)<\/slot>/gi,
      '<div data-default-slot>$1</div>',
    )
    // Transform <slot /> (self-closing default) to <div data-default-slot></div>
    htmlContent = htmlContent.replace(
      /<slot\s*\/>/gi,
      '<div data-default-slot></div>',
    )
  }

  // Handle styles
  let styles = ''
  if (styleSource) {
    // Reference external stylesheet
    styles = `<link rel="stylesheet" href="${styleSource}">`
  }

  // Generate web component class
  return `/**
 * ${name} Web Component
 * Auto-generated from stx component
 */
class ${name.replace(/\W/g, '')} extends ${baseElement} {
  constructor() {
    super()
    ${shadowDOM ? 'this.attachShadow({ mode: "open" })' : ''}
    ${template ? 'this._createTemplate()' : 'this._render()'}
  }

  ${template
    ? `
  _createTemplate() {
    const template = document.createElement('template')
    template.innerHTML = \`${styles}${htmlContent}\`
    ${shadowDOM ? 'this.shadowRoot.appendChild(template.content.cloneNode(true))' : 'this.appendChild(template.content.cloneNode(true))'}
    this._processSlots()
  }
  `
    : `
  _render() {
    ${shadowDOM ? 'this.shadowRoot.innerHTML' : 'this.innerHTML'} = \`${styles}${htmlContent}\`
    this._processSlots()
  }
  `}

  _processSlots() {
    ${shadowDOM
      ? `// Shadow DOM handles slot assignment automatically
    // Listen for slot changes if needed
    const slots = this.shadowRoot.querySelectorAll('slot')
    slots.forEach(slot => {
      slot.addEventListener('slotchange', (e) => {
        const assignedNodes = slot.assignedNodes()
        this.dispatchEvent(new CustomEvent('slot-changed', {
          detail: { slotName: slot.name || 'default', assignedNodes }
        }))
      })
    })`
      : `// Manual slot processing for non-shadow DOM mode
    const slots = this.querySelectorAll('[data-slot]')
    const lightDOMChildren = Array.from(this.childNodes).filter(
      node => node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('data-slot')
    )

    // Process named slots
    slots.forEach(slotEl => {
      const slotName = slotEl.getAttribute('data-slot')
      const slottedContent = this.querySelector(\`[slot="\${slotName}"]\`)
      if (slottedContent) {
        // Replace slot placeholder with actual content
        slotEl.innerHTML = ''
        slotEl.appendChild(slottedContent.cloneNode(true))
      }
    })

    // Process default slot
    const defaultSlot = this.querySelector('[data-slot=""]') || this.querySelector('[data-default-slot]')
    if (defaultSlot) {
      const unslottedContent = Array.from(this.children).filter(
        child => !child.hasAttribute('slot') && child !== defaultSlot
      )
      if (unslottedContent.length > 0) {
        defaultSlot.innerHTML = ''
        unslottedContent.forEach(content => {
          defaultSlot.appendChild(content.cloneNode(true))
        })
      }
    }`}
  }

  ${attributes.length > 0
    ? `
  static get observedAttributes() {
    return [${attributes.map(attr => `'${attr}'`).join(', ')}]
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[name] = newValue
      ${template ? '' : 'this._render()'}
    }
  }
  `
    : ''}

  connectedCallback() {
    // Component connected to the DOM
  }

  disconnectedCallback() {
    // Component removed from the DOM
  }
}

// Register the web component
customElements.define('${tag}', ${name.replace(/\W/g, '')})
`
}

// =============================================================================
// TypeScript Output Generation
// =============================================================================

/**
 * Options for generating TypeScript web component code
 */
interface WebComponentTypeScriptOptions extends WebComponentCodeOptions {
  attributeTypes: Record<string, 'string' | 'number' | 'boolean' | 'object'>
}

/**
 * Generates TypeScript code for a web component with full type safety.
 *
 * Features:
 * - Strongly typed component class
 * - Props interface for type-safe attribute access
 * - Events interface for custom events
 * - Getters/setters for observed attributes
 * - Global type augmentation for HTMLElementTagNameMap
 *
 * @param options - TypeScript generation options
 * @returns TypeScript source code
 */
function generateWebComponentCodeTypeScript(options: WebComponentTypeScriptOptions): string {
  const {
    name,
    tag,
    baseElement = 'HTMLElement',
    source,
    shadowDOM,
    template,
    styleSource,
    attributes = [],
    attributeTypes = {},
  } = options

  const className = name.replace(/\W/g, '')

  // Extract HTML content
  let htmlContent = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim()

  // Transform slots for non-shadow DOM
  if (!shadowDOM) {
    htmlContent = htmlContent.replace(/<slot\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/slot>/gi, '<div data-slot="$1">$2</div>')
    htmlContent = htmlContent.replace(/<slot\s+name=["']([^"']+)["']\s*\/>/gi, '<div data-slot="$1"></div>')
    htmlContent = htmlContent.replace(/<slot\s*>([\s\S]*?)<\/slot>/gi, '<div data-default-slot>$1</div>')
    htmlContent = htmlContent.replace(/<slot\s*\/>/gi, '<div data-default-slot></div>')
  }

  // Escape backticks and template literals in HTML
  htmlContent = htmlContent.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

  // Handle styles
  const styles = styleSource ? `<link rel="stylesheet" href="${styleSource}">` : ''

  // Type mapping helper
  const getTypeScriptType = (attr: string): string => {
    const type = attributeTypes[attr]
    switch (type) {
      case 'number': return 'number'
      case 'boolean': return 'boolean'
      case 'object': return 'Record<string, unknown>'
      default: return 'string'
    }
  }

  // Convert kebab-case to camelCase
  const toCamelCase = (str: string): string => str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

  // Generate property declarations
  const propertyDeclarations = attributes.map(attr =>
    `  private _${toCamelCase(attr)}: ${getTypeScriptType(attr)} | null = null;`,
  ).join('\n')

  // Generate getters and setters
  const gettersSetters = attributes.map((attr) => {
    const type = getTypeScriptType(attr)
    const camelCase = toCamelCase(attr)
    return `
  get ${camelCase}(): ${type} | null {
    return this._${camelCase};
  }

  set ${camelCase}(value: ${type} | null) {
    this._${camelCase} = value;
    if (value !== null) {
      this.setAttribute('${attr}', String(value));
    } else {
      this.removeAttribute('${attr}');
    }
  }`
  }).join('\n')

  // Generate props interface
  const propsInterface = attributes.length > 0
    ? `/**
 * Props interface for ${name}
 */
export interface ${className}Props {
${attributes.map((attr) => {
  const type = getTypeScriptType(attr)
  return `  ${toCamelCase(attr)}?: ${type};`
}).join('\n')}
}
`
    : ''

  // Generate observed attributes
  const observedAttributesCode = attributes.length > 0
    ? `
  static get observedAttributes(): string[] {
    return [${attributes.map(attr => `'${attr}'`).join(', ')}];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue) {
      const camelCase = name.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
      (this as unknown as Record<string, unknown>)[\`_\${camelCase}\`] = this._parseAttributeValue(name, newValue);
      ${template ? '' : 'this._render();'}
    }
  }

  private _parseAttributeValue(name: string, value: string | null): unknown {
    if (value === null) return null;
    const typeMap: Record<string, string> = ${JSON.stringify(attributeTypes)};
    const type = typeMap[name] || 'string';
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return value !== 'false' && value !== '0';
      case 'object': try { return JSON.parse(value); } catch { return value; }
      default: return value;
    }
  }
`
    : ''

  // Generate the template/render methods
  const templateMethod = template
    ? `
  private _createTemplate(): void {
    const template = document.createElement('template');
    template.innerHTML = \`${styles}${htmlContent}\`;
    ${shadowDOM ? 'this.shadowRoot!.appendChild(template.content.cloneNode(true));' : 'this.appendChild(template.content.cloneNode(true));'}
    this._processSlots();
  }`
    : `
  private _render(): void {
    ${shadowDOM ? 'this.shadowRoot!.innerHTML' : 'this.innerHTML'} = \`${styles}${htmlContent}\`;
    this._processSlots();
  }`

  // Generate slots processing
  const slotsMethod = shadowDOM
    ? `
  private _processSlots(): void {
    const slots = this.shadowRoot!.querySelectorAll('slot');
    slots.forEach((slot) => {
      slot.addEventListener('slotchange', () => {
        const assignedNodes = (slot as HTMLSlotElement).assignedNodes();
        this.dispatchEvent(new CustomEvent<SlotChangeDetail>('slot-changed', {
          detail: { slotName: slot.getAttribute('name') || 'default', assignedNodes }
        }));
      });
    });
  }`
    : `
  private _processSlots(): void {
    const slots = this.querySelectorAll('[data-slot]');
    slots.forEach((slotEl) => {
      const slotName = slotEl.getAttribute('data-slot');
      if (slotName) {
        const slottedContent = this.querySelector(\`[slot="\${slotName}"]\`);
        if (slottedContent) {
          slotEl.innerHTML = '';
          slotEl.appendChild(slottedContent.cloneNode(true));
        }
      }
    });
  }`

  return `/**
 * ${name} Web Component
 * Auto-generated from stx component (TypeScript)
 *
 * @example
 * \`\`\`html
 * <${tag}></${tag}>
 * \`\`\`
 */

/**
 * Detail type for slot-changed event
 */
interface SlotChangeDetail {
  slotName: string;
  assignedNodes: Node[];
}

${propsInterface}
/**
 * ${name} custom element class
 * @customElement ${tag}
 */
export class ${className} extends ${baseElement} {
${propertyDeclarations}

  constructor() {
    super();
    ${shadowDOM ? 'this.attachShadow({ mode: "open" });' : ''}
    ${template ? 'this._createTemplate();' : 'this._render();'}
  }
${templateMethod}
${slotsMethod}
${observedAttributesCode}
${gettersSetters}

  connectedCallback(): void {
    // Component connected to the DOM
  }

  disconnectedCallback(): void {
    // Component removed from the DOM
  }

  adoptedCallback(): void {
    // Component moved to a new document
  }
}

// Type augmentation for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    '${tag}': ${className};
  }
}

// Register the web component
customElements.define('${tag}', ${className});
`
}

// =============================================================================
// CSS Scoping
// =============================================================================

/**
 * CSS scoping strategy
 */
export type CssScopingStrategy = 'shadow' | 'prefix' | 'attribute' | 'bem'

/**
 * CSS scoping configuration
 */
export interface CssScopingConfig {
  /** Scoping strategy to use */
  strategy: CssScopingStrategy
  /** Prefix for class-based scoping (strategy: 'prefix') */
  prefix?: string
  /** Attribute name for attribute-based scoping (strategy: 'attribute') */
  attributeName?: string
  /** Whether to preserve original class names */
  preserveOriginal?: boolean
}

const defaultCssScopingConfig: CssScopingConfig = {
  strategy: 'attribute',
  attributeName: 'data-v',
  preserveOriginal: true,
}

/**
 * Generate a unique scope ID for a component
 */
export function generateScopeId(componentName: string): string {
  const hash = componentName
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
  return Math.abs(hash).toString(36).slice(0, 8)
}

/**
 * Scope CSS for a web component.
 *
 * This function transforms CSS to be scoped to a specific component,
 * preventing style leakage in non-shadow DOM scenarios.
 *
 * @param css - Original CSS content
 * @param componentTag - Component tag name
 * @param config - Scoping configuration
 * @returns Scoped CSS
 *
 * @example
 * // Attribute scoping (default)
 * scopeCSS('.btn { color: red; }', 'my-button')
 * // => '.btn[data-v-a1b2c3d4] { color: red; }'
 *
 * @example
 * // Prefix scoping
 * scopeCSS('.btn { color: red; }', 'my-button', { strategy: 'prefix', prefix: 'my-button' })
 * // => '.my-button-btn { color: red; }'
 */
export function scopeCSS(
  css: string,
  componentTag: string,
  config: Partial<CssScopingConfig> = {},
): string {
  const mergedConfig = { ...defaultCssScopingConfig, ...config }
  const scopeId = generateScopeId(componentTag)

  switch (mergedConfig.strategy) {
    case 'shadow':
      // No transformation needed for shadow DOM
      return css

    case 'prefix':
      return scopeCSSWithPrefix(css, mergedConfig.prefix || componentTag, mergedConfig.preserveOriginal)

    case 'attribute':
      return scopeCSSWithAttribute(css, scopeId, mergedConfig.attributeName || 'data-v', mergedConfig.preserveOriginal)

    case 'bem':
      return scopeCSSWithBEM(css, componentTag, mergedConfig.preserveOriginal)

    default:
      return css
  }
}

/**
 * Scope CSS using attribute selectors
 */
function scopeCSSWithAttribute(
  css: string,
  scopeId: string,
  attributeName: string,
  preserveOriginal?: boolean,
): string {
  const scopeAttr = `[${attributeName}-${scopeId}]`

  return css.replace(
    /([.#]?[\w-]+|\*)\s*(\{|,)/g,
    (match, selector, delimiter) => {
      // Skip keyframes, font-face, etc.
      if (selector.startsWith('@')) {
        return match
      }

      // Skip :root, :host, html, body
      if (/^(?::root|:host|html|body)$/i.test(selector)) {
        return match
      }

      // Add scope attribute to selector
      const scopedSelector = preserveOriginal
        ? `${selector}${scopeAttr}`
        : `${selector}${scopeAttr}`

      return `${scopedSelector}${delimiter}`
    },
  )
}

/**
 * Scope CSS using class prefixes
 */
function scopeCSSWithPrefix(
  css: string,
  prefix: string,
  preserveOriginal?: boolean,
): string {
  return css.replace(
    /\.([a-z_][\w-]*)/gi,
    (match, className) => {
      // Skip already prefixed classes
      if (className.startsWith(prefix)) {
        return match
      }

      const scopedClass = `${prefix}__${className}`
      return preserveOriginal ? `.${scopedClass}` : `.${scopedClass}`
    },
  )
}

/**
 * Scope CSS using BEM-like naming
 */
function scopeCSSWithBEM(
  css: string,
  componentName: string,
  preserveOriginal?: boolean,
): string {
  const block = componentName.replace(/[^a-z0-9]/gi, '-')

  return css.replace(
    /\.([a-z_][\w-]*)/gi,
    (match, className) => {
      // Check if it's already BEM-formatted
      if (className.includes('__') || className.includes('--')) {
        // Add block prefix if not already present
        if (!className.startsWith(block)) {
          return `.${block}__${className}`
        }
        return match
      }

      const scopedClass = `${block}__${className}`
      return preserveOriginal ? `.${scopedClass}` : `.${scopedClass}`
    },
  )
}

/**
 * Transform HTML to include scope attributes
 *
 * @param html - Original HTML content
 * @param componentTag - Component tag name
 * @param config - Scoping configuration
 * @returns HTML with scope attributes added
 */
export function scopeHTML(
  html: string,
  componentTag: string,
  config: Partial<CssScopingConfig> = {},
): string {
  const mergedConfig = { ...defaultCssScopingConfig, ...config }

  if (mergedConfig.strategy === 'shadow') {
    // No transformation needed for shadow DOM
    return html
  }

  if (mergedConfig.strategy === 'attribute') {
    const scopeId = generateScopeId(componentTag)
    const attributeName = mergedConfig.attributeName || 'data-v'
    const scopeAttr = `${attributeName}-${scopeId}`

    // Add scope attribute to all elements
    return html.replace(
      /<([a-z][a-z0-9-]*)([^>]*)>/gi,
      (match, tag, attrs) => {
        // Skip script and style tags
        if (/^(?:script|style|!--)$/i.test(tag)) {
          return match
        }
        // Check if self-closing
        const isSelfClosing = attrs.trimEnd().endsWith('/')
        const cleanAttrs = isSelfClosing ? attrs.slice(0, -1) : attrs
        return `<${tag}${cleanAttrs} ${scopeAttr}${isSelfClosing ? '/' : ''}>`
      },
    )
  }

  if (mergedConfig.strategy === 'prefix' || mergedConfig.strategy === 'bem') {
    const prefix = mergedConfig.strategy === 'bem'
      ? componentTag.replace(/[^a-z0-9]/gi, '-')
      : mergedConfig.prefix || componentTag

    // Transform class names in HTML
    return html.replace(
      /\bclass\s*=\s*["']([^"']+)["']/gi,
      (match, classes) => {
        const scopedClasses = classes
          .split(/\s+/)
          .map((cls: string) => {
            if (!cls)
              return cls
            // Skip already scoped classes
            if (cls.startsWith(prefix))
              return cls
            return `${prefix}__${cls}`
          })
          .join(' ')
        return `class="${scopedClasses}"`
      },
    )
  }

  return html
}

/**
 * Get the scope attribute for a component
 */
export function getScopeAttribute(
  componentTag: string,
  config: Partial<CssScopingConfig> = {},
): string {
  const mergedConfig = { ...defaultCssScopingConfig, ...config }
  const scopeId = generateScopeId(componentTag)
  const attributeName = mergedConfig.attributeName || 'data-v'
  return `${attributeName}-${scopeId}`
}

/**
 * Extract and scope inline styles from HTML
 *
 * @param html - HTML content with style tags
 * @param componentTag - Component tag name
 * @param config - Scoping configuration
 * @returns Object with scoped HTML and extracted scoped CSS
 */
export function extractAndScopeStyles(
  html: string,
  componentTag: string,
  config: Partial<CssScopingConfig> = {},
): { html: string, css: string } {
  let extractedCSS = ''

  // Extract all style tags
  const htmlWithoutStyles = html.replace(
    /<style([^>]*)>([\s\S]*?)<\/style>/gi,
    (_match, attrs, cssContent) => {
      // Check for scoped attribute
      const isScoped = /\bscoped\b/i.test(attrs)

      if (isScoped || config.strategy !== 'shadow') {
        extractedCSS += `${scopeCSS(cssContent, componentTag, config)}\n`
      }
      else {
        extractedCSS += `${cssContent}\n`
      }

      return '' // Remove style tag from HTML
    },
  )

  // Scope the HTML if needed
  const scopedHTML = scopeHTML(htmlWithoutStyles, componentTag, config)

  return {
    html: scopedHTML,
    css: extractedCSS.trim(),
  }
}

// =============================================================================
// Reactive Web Component Generator
// =============================================================================

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert kebab-case to camelCase
 */
function _kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Generate a reactive web component with full lifecycle management.
 *
 * Features:
 * - Reactive properties with automatic re-rendering
 * - Property observers for side effects
 * - Attribute reflection (property <-> attribute sync)
 * - Internal state management with setState()
 * - Batched rendering with requestAnimationFrame
 * - Full lifecycle hooks (connected, disconnected, adopted)
 * - Event handling system
 * - Template interpolation with property values
 *
 * @param config - Reactive web component configuration
 * @returns JavaScript code for the web component
 *
 * @example
 * ```typescript
 * const code = generateReactiveWebComponent({
 *   name: 'CounterButton',
 *   tag: 'counter-button',
 *   template: '<button>Count: {{count}}</button>',
 *   properties: {
 *     count: { type: 'number', default: 0, reflect: true, render: true },
 *     label: { type: 'string', default: 'Click me' }
 *   },
 *   state: { clicks: 0 },
 *   events: {
 *     click: 'this._handleClick()'
 *   },
 *   methods: {
 *     _handleClick: `this.count++; this.setState({ clicks: this._state.clicks + 1 });`
 *   }
 * })
 * ```
 */
export function generateReactiveWebComponent(config: ReactiveWebComponentConfig): string {
  const {
    name,
    tag,
    baseElement = 'HTMLElement',
    template,
    styles = '',
    shadowDOM = true,
    properties = {},
    lifecycle = {},
    events = {},
    methods = {},
    state = {},
  } = config

  const className = name.replace(/\W/g, '')
  const propertyNames = Object.keys(properties)

  // Generate observed attributes list
  const observedAttributes = propertyNames
    .filter(prop => properties[prop].attribute !== false)
    .map(prop => properties[prop].attribute || camelToKebab(prop))

  // Generate property declarations
  const propertyDeclarations = propertyNames.map((prop) => {
    const def = properties[prop]
    const defaultValue = def.default !== undefined
      ? JSON.stringify(def.default)
      : def.type === 'string'
        ? '""'
        : def.type === 'number'
          ? '0'
          : def.type === 'boolean'
            ? 'false'
            : def.type === 'array'
              ? '[]'
              : '{}'
    return `    this._${prop} = ${defaultValue};`
  }).join('\n')

  // Generate property getters/setters
  const propertyAccessors = propertyNames.map((prop) => {
    const def = properties[prop]
    const attrName = def.attribute !== false
      ? (def.attribute || camelToKebab(prop))
      : null

    const reflectCode = def.reflect && attrName
      ? `
      if (value !== null && value !== undefined) {
        ${def.type === 'boolean'
          ? `if (value) { this.setAttribute('${attrName}', ''); } else { this.removeAttribute('${attrName}'); }`
          : `this.setAttribute('${attrName}', ${def.type === 'object' || def.type === 'array' ? 'JSON.stringify(value)' : 'String(value)'});`}
      } else {
        this.removeAttribute('${attrName}');
      }`
      : ''

    const observerCode = def.observer
      ? `this.${def.observer}(value, oldValue);`
      : ''

    const renderCode = def.render !== false
      ? 'this._scheduleRender();'
      : ''

    return `
  get ${prop}() {
    return this._${prop};
  }

  set ${prop}(value) {
    const oldValue = this._${prop};
    if (oldValue === value) return;
    this._${prop} = value;${reflectCode}
    ${observerCode}
    ${renderCode}
    this.dispatchEvent(new CustomEvent('${prop}-changed', {
      detail: { value, oldValue },
      bubbles: true
    }));
  }`
  }).join('\n')

  // Generate attribute changed callback
  const attributeChangedCode = observedAttributes.length > 0
    ? `
  static get observedAttributes() {
    return [${observedAttributes.map(a => `'${a}'`).join(', ')}];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const propName = this._attrToProp[name];
    if (propName) {
      const propDef = this._propertyDefs[propName];
      this[propName] = this._deserializeAttribute(newValue, propDef.type);
    }
    ${lifecycle.attributeChanged || ''}
  }`
    : ''

  // Generate event bindings
  const eventBindings = Object.entries(events).map(([event, handler]) => {
    return `this._root.addEventListener('${event}', (e) => { ${handler} });`
  }).join('\n    ')

  // Generate methods
  const methodDefinitions = Object.entries(methods).map(([methodName, body]) => {
    return `
  ${methodName}() {
    ${body}
  }`
  }).join('\n')

  // Generate property definitions map
  const propertyDefsMap = JSON.stringify(
    Object.fromEntries(
      propertyNames.map(prop => [prop, properties[prop]]),
    ),
  )

  // Generate attribute to property map
  const attrToPropMap = JSON.stringify(
    Object.fromEntries(
      propertyNames
        .filter(prop => properties[prop].attribute !== false)
        .map(prop => [properties[prop].attribute || camelToKebab(prop), prop]),
    ),
  )

  // Escape template for JS string
  const escapedTemplate = template
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  // Escape styles for JS string
  const escapedStyles = styles
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')

  return `/**
 * ${name} - Reactive Web Component
 * Auto-generated with reactive properties and lifecycle management
 *
 * @customElement ${tag}
 */
class ${className} extends ${baseElement} {
  // Property definitions
  _propertyDefs = ${propertyDefsMap};
  _attrToProp = ${attrToPropMap};

  // Internal state
  _state = ${JSON.stringify(state)};
  _renderPending = false;
  _isConnected = false;

  constructor() {
    super();
    ${shadowDOM ? 'this.attachShadow({ mode: "open" });' : ''}
    this._root = ${shadowDOM ? 'this.shadowRoot' : 'this'};

    // Initialize properties with defaults
${propertyDeclarations}

    // Initial render
    this._render();
  }

  // =========================================================================
  // Reactive Properties
  // =========================================================================
${propertyAccessors}

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Get current internal state
   */
  get state() {
    return { ...this._state };
  }

  /**
   * Update internal state and trigger re-render
   * @param {Object} updates - State updates to merge
   */
  setState(updates) {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this._scheduleRender();
    this.dispatchEvent(new CustomEvent('state-changed', {
      detail: { state: this._state, oldState },
      bubbles: true
    }));
  }

  // =========================================================================
  // Rendering
  // =========================================================================

  /**
   * Schedule a render on the next animation frame (batched)
   */
  _scheduleRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    requestAnimationFrame(() => {
      this._renderPending = false;
      this._render();
    });
  }

  /**
   * Render the component template
   */
  _render() {
    const template = \`${escapedStyles ? `<style>${escapedStyles}</style>` : ''}${escapedTemplate}\`;

    // Interpolate template with property values
    const rendered = template.replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (match, propName) => {
      if (propName in this) {
        const value = this[propName];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
      if (propName in this._state) {
        const value = this._state[propName];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
      return match;
    });

    this._root.innerHTML = rendered;
    this._bindEvents();
  }

  /**
   * Bind event handlers after render
   */
  _bindEvents() {
    ${eventBindings}
  }

  // =========================================================================
  // Attribute Handling
  // =========================================================================

  /**
   * Deserialize attribute value to property type
   */
  _deserializeAttribute(value, type) {
    if (value === null) return null;
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return value !== null && value !== 'false' && value !== '0';
      case 'object':
      case 'array':
        try { return JSON.parse(value); }
        catch { return type === 'array' ? [] : {}; }
      default: return value;
    }
  }

${attributeChangedCode}

  // =========================================================================
  // Lifecycle
  // =========================================================================

  connectedCallback() {
    this._isConnected = true;
    ${lifecycle.connected || '// Component connected to DOM'}
  }

  disconnectedCallback() {
    this._isConnected = false;
    ${lifecycle.disconnected || '// Component disconnected from DOM'}
  }

  adoptedCallback() {
    ${lifecycle.adopted || '// Component moved to new document'}
  }

  // =========================================================================
  // Custom Methods
  // =========================================================================
${methodDefinitions}
}

// Register the custom element
customElements.define('${tag}', ${className});

// Export for module usage
export { ${className} };
export default ${className};
`
}

/**
 * Generate TypeScript version of reactive web component
 */
export function generateReactiveWebComponentTS(config: ReactiveWebComponentConfig): string {
  const {
    name,
    tag,
    baseElement = 'HTMLElement',
    template,
    styles = '',
    shadowDOM = true,
    properties = {},
    lifecycle = {},
    events = {},
    methods = {},
    state = {},
  } = config

  const className = name.replace(/\W/g, '')
  const propertyNames = Object.keys(properties)

  // Generate observed attributes list
  const observedAttributes = propertyNames
    .filter(prop => properties[prop].attribute !== false)
    .map(prop => properties[prop].attribute || camelToKebab(prop))

  // Generate TypeScript types
  const getTypeScriptType = (type: string): string => {
    switch (type) {
      case 'string': return 'string'
      case 'number': return 'number'
      case 'boolean': return 'boolean'
      case 'object': return 'Record<string, unknown>'
      case 'array': return 'unknown[]'
      default: return 'unknown'
    }
  }

  // Generate props interface
  const propsInterface = propertyNames.length > 0
    ? `
/**
 * Props interface for ${name}
 */
export interface ${className}Props {
${propertyNames.map(prop => `  ${prop}?: ${getTypeScriptType(properties[prop].type)};`).join('\n')}
}
`
    : ''

  // Generate state interface
  const stateInterface = Object.keys(state).length > 0
    ? `
/**
 * State interface for ${name}
 */
export interface ${className}State {
${Object.entries(state).map(([key, value]) => `  ${key}: ${typeof value};`).join('\n')}
}
`
    : `
export interface ${className}State {
  [key: string]: unknown;
}
`

  // Generate property declarations
  const propertyDeclarations = propertyNames.map((prop) => {
    const def = properties[prop]
    const tsType = getTypeScriptType(def.type)
    return `  private _${prop}: ${tsType};`
  }).join('\n')

  // Generate property getters/setters with TypeScript types
  const propertyAccessors = propertyNames.map((prop) => {
    const def = properties[prop]
    const tsType = getTypeScriptType(def.type)
    const attrName = def.attribute !== false
      ? (def.attribute || camelToKebab(prop))
      : null
    const defaultValue = def.default !== undefined
      ? JSON.stringify(def.default)
      : def.type === 'string'
        ? '""'
        : def.type === 'number'
          ? '0'
          : def.type === 'boolean'
            ? 'false'
            : def.type === 'array'
              ? '[]'
              : '{}'

    const reflectCode = def.reflect && attrName
      ? `
      if (value !== null && value !== undefined) {
        ${def.type === 'boolean'
          ? `if (value) { this.setAttribute('${attrName}', ''); } else { this.removeAttribute('${attrName}'); }`
          : `this.setAttribute('${attrName}', ${def.type === 'object' || def.type === 'array' ? 'JSON.stringify(value)' : 'String(value)'});`}
      } else {
        this.removeAttribute('${attrName}');
      }`
      : ''

    const observerCode = def.observer
      ? `this.${def.observer}(value, oldValue);`
      : ''

    const renderCode = def.render !== false
      ? 'this._scheduleRender();'
      : ''

    return `
  get ${prop}(): ${tsType} {
    return this._${prop};
  }

  set ${prop}(value: ${tsType}) {
    const oldValue = this._${prop};
    if (oldValue === value) return;
    this._${prop} = value;${reflectCode}
    ${observerCode}
    ${renderCode}
    this.dispatchEvent(new CustomEvent('${prop}-changed', {
      detail: { value, oldValue },
      bubbles: true
    }));
  }

  // Property default: ${defaultValue}`
  }).join('\n')

  // Generate attribute changed callback
  const attributeChangedCode = observedAttributes.length > 0
    ? `
  static get observedAttributes(): string[] {
    return [${observedAttributes.map(a => `'${a}'`).join(', ')}];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    const propName = this._attrToProp[name];
    if (propName) {
      const propDef = this._propertyDefs[propName];
      (this as unknown as Record<string, unknown>)[propName] = this._deserializeAttribute(newValue, propDef.type);
    }
    ${lifecycle.attributeChanged || ''}
  }`
    : ''

  // Generate event bindings
  const eventBindings = Object.entries(events).map(([event, handler]) => {
    return `this._root.addEventListener('${event}', (e: Event) => { ${handler} });`
  }).join('\n    ')

  // Generate methods with TypeScript signatures
  const methodDefinitions = Object.entries(methods).map(([methodName, body]) => {
    return `
  ${methodName}(): void {
    ${body}
  }`
  }).join('\n')

  // Escape template for JS string
  const escapedTemplate = template
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  // Escape styles for JS string
  const escapedStyles = styles
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')

  return `/**
 * ${name} - Reactive Web Component (TypeScript)
 * Auto-generated with reactive properties and lifecycle management
 *
 * @customElement ${tag}
 */

${propsInterface}
${stateInterface}

/**
 * Property definition type
 */
interface PropertyDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: unknown;
  reflect?: boolean;
  attribute?: string | false;
  observer?: string;
  render?: boolean;
}

/**
 * ${name} custom element
 */
export class ${className} extends ${baseElement} {
  // Property definitions
  private _propertyDefs: Record<string, PropertyDefinition> = ${JSON.stringify(properties)};
  private _attrToProp: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(
      propertyNames
        .filter(prop => properties[prop].attribute !== false)
        .map(prop => [properties[prop].attribute || camelToKebab(prop), prop]),
    ),
  )};

  // Internal state
  private _state: ${className}State = ${JSON.stringify(state)};
  private _renderPending = false;
  private _isConnected = false;
  private _root: ShadowRoot | HTMLElement;

  // Property backing fields
${propertyDeclarations}

  constructor() {
    super();
    ${shadowDOM ? 'this.attachShadow({ mode: "open" });' : ''}
    this._root = ${shadowDOM ? 'this.shadowRoot!' : 'this'};

    // Initialize properties with defaults
${propertyNames.map((prop) => {
  const def = properties[prop]
  const defaultValue = def.default !== undefined
    ? JSON.stringify(def.default)
    : def.type === 'string'
      ? '""'
      : def.type === 'number'
        ? '0'
        : def.type === 'boolean'
          ? 'false'
          : def.type === 'array'
            ? '[]'
            : '{}'
  return `    this._${prop} = ${defaultValue};`
}).join('\n')}

    // Initial render
    this._render();
  }

  // =========================================================================
  // Reactive Properties
  // =========================================================================
${propertyAccessors}

  // =========================================================================
  // State Management
  // =========================================================================

  /**
   * Get current internal state
   */
  get state(): ${className}State {
    return { ...this._state };
  }

  /**
   * Update internal state and trigger re-render
   */
  setState(updates: Partial<${className}State>): void {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this._scheduleRender();
    this.dispatchEvent(new CustomEvent('state-changed', {
      detail: { state: this._state, oldState },
      bubbles: true
    }));
  }

  // =========================================================================
  // Rendering
  // =========================================================================

  /**
   * Schedule a render on the next animation frame (batched)
   */
  private _scheduleRender(): void {
    if (this._renderPending) return;
    this._renderPending = true;
    requestAnimationFrame(() => {
      this._renderPending = false;
      this._render();
    });
  }

  /**
   * Render the component template
   */
  private _render(): void {
    const template = \`${escapedStyles ? `<style>${escapedStyles}</style>` : ''}${escapedTemplate}\`;

    // Interpolate template with property values
    const rendered = template.replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (match, propName) => {
      if (propName in this) {
        const value = (this as unknown as Record<string, unknown>)[propName];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
      if (propName in this._state) {
        const value = this._state[propName as keyof ${className}State];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
      return match;
    });

    this._root.innerHTML = rendered;
    this._bindEvents();
  }

  /**
   * Bind event handlers after render
   */
  private _bindEvents(): void {
    ${eventBindings}
  }

  // =========================================================================
  // Attribute Handling
  // =========================================================================

  /**
   * Deserialize attribute value to property type
   */
  private _deserializeAttribute(value: string | null, type: string): unknown {
    if (value === null) return null;
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return value !== null && value !== 'false' && value !== '0';
      case 'object':
      case 'array':
        try { return JSON.parse(value); }
        catch { return type === 'array' ? [] : {}; }
      default: return value;
    }
  }

${attributeChangedCode}

  // =========================================================================
  // Lifecycle
  // =========================================================================

  connectedCallback(): void {
    this._isConnected = true;
    ${lifecycle.connected || '// Component connected to DOM'}
  }

  disconnectedCallback(): void {
    this._isConnected = false;
    ${lifecycle.disconnected || '// Component disconnected from DOM'}
  }

  adoptedCallback(): void {
    ${lifecycle.adopted || '// Component moved to new document'}
  }

  // =========================================================================
  // Custom Methods
  // =========================================================================
${methodDefinitions}
}

// Type augmentation for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    '${tag}': ${className};
  }
}

// Register the custom element
customElements.define('${tag}', ${className});

export default ${className};
`
}

/**
 * Create a mixin for adding reactivity to existing web components.
 *
 * @returns JavaScript code for a ReactiveElement mixin
 *
 * @example
 * ```javascript
 * // Generated mixin usage:
 * class MyComponent extends ReactiveElement(HTMLElement) {
 *   static get properties() {
 *     return {
 *       name: { type: 'string', default: 'World' }
 *     }
 *   }
 * }
 * ```
 */
export function generateReactiveMixin(): string {
  return `/**
 * ReactiveElement Mixin
 * Adds reactive properties and lifecycle management to web components
 */
const ReactiveElement = (Base) => class extends Base {
  static get observedAttributes() {
    const props = this.properties || {};
    return Object.keys(props)
      .filter(prop => props[prop].attribute !== false)
      .map(prop => props[prop].attribute || prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase());
  }

  constructor() {
    super();
    this._state = {};
    this._renderPending = false;
    this._propertyValues = new Map();
    this._initializeProperties();
  }

  _initializeProperties() {
    const props = this.constructor.properties || {};
    for (const [name, def] of Object.entries(props)) {
      // Set default value
      if (def.default !== undefined) {
        this._propertyValues.set(name, def.default);
      }

      // Define getter/setter
      Object.defineProperty(this, name, {
        get: () => this._propertyValues.get(name),
        set: (value) => {
          const oldValue = this._propertyValues.get(name);
          if (oldValue === value) return;
          this._propertyValues.set(name, value);

          // Reflect to attribute
          if (def.reflect) {
            const attrName = def.attribute || name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            if (def.type === 'boolean') {
              value ? this.setAttribute(attrName, '') : this.removeAttribute(attrName);
            } else {
              this.setAttribute(attrName, def.type === 'object' ? JSON.stringify(value) : String(value));
            }
          }

          // Call observer
          if (def.observer && typeof this[def.observer] === 'function') {
            this[def.observer](value, oldValue);
          }

          // Schedule render
          if (def.render !== false) {
            this._scheduleRender();
          }

          // Dispatch event
          this.dispatchEvent(new CustomEvent(\`\${name}-changed\`, {
            detail: { value, oldValue },
            bubbles: true
          }));
        },
        enumerable: true,
        configurable: true
      });
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const props = this.constructor.properties || {};
    const propName = Object.keys(props).find(p =>
      (props[p].attribute || p.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()) === name
    );
    if (propName) {
      const def = props[propName];
      this[propName] = this._deserialize(newValue, def.type);
    }
  }

  _deserialize(value, type) {
    if (value === null) return null;
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return value !== null && value !== 'false';
      case 'object':
      case 'array':
        try { return JSON.parse(value); }
        catch { return type === 'array' ? [] : {}; }
      default: return value;
    }
  }

  get state() {
    return { ...this._state };
  }

  setState(updates) {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this._scheduleRender();
    this.dispatchEvent(new CustomEvent('state-changed', {
      detail: { state: this._state, oldState },
      bubbles: true
    }));
  }

  _scheduleRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    requestAnimationFrame(() => {
      this._renderPending = false;
      if (typeof this.render === 'function') {
        this.render();
      }
    });
  }
};

export { ReactiveElement };
export default ReactiveElement;
`
}

/**
 * Generate a complete reactive web component runtime that can be included in pages.
 * This provides the base classes and utilities for reactive components.
 *
 * @returns JavaScript runtime code
 */
export function generateReactiveRuntime(): string {
  return `/**
 * stx Reactive Web Components Runtime
 * Provides base classes and utilities for reactive web components
 */
(function(global) {
  'use strict';

  /**
   * Base class for reactive web components
   */
  class StxElement extends HTMLElement {
    static get observedAttributes() {
      const props = this.properties || {};
      return Object.keys(props)
        .filter(prop => props[prop].attribute !== false)
        .map(prop => props[prop].attribute || toKebabCase(prop));
    }

    constructor() {
      super();
      this._state = {};
      this._renderPending = false;
      this._props = new Map();
      this._setupShadowDOM();
      this._initProperties();
    }

    _setupShadowDOM() {
      if (this.constructor.useShadowDOM !== false) {
        this.attachShadow({ mode: 'open' });
        this._root = this.shadowRoot;
      } else {
        this._root = this;
      }
    }

    _initProperties() {
      const props = this.constructor.properties || {};
      for (const [name, def] of Object.entries(props)) {
        let value = def.default;
        this._props.set(name, value);

        Object.defineProperty(this, name, {
          get: () => this._props.get(name),
          set: (newValue) => this._setProperty(name, newValue, def),
          enumerable: true
        });
      }
    }

    _setProperty(name, value, def) {
      const oldValue = this._props.get(name);
      if (oldValue === value) return;

      this._props.set(name, value);

      if (def.reflect && def.attribute !== false) {
        this._reflectToAttribute(name, value, def);
      }

      if (def.observer && this[def.observer]) {
        this[def.observer](value, oldValue);
      }

      if (def.render !== false) {
        this.requestUpdate();
      }

      this.dispatchEvent(new CustomEvent(name + '-changed', {
        detail: { value, oldValue },
        bubbles: true,
        composed: true
      }));
    }

    _reflectToAttribute(name, value, def) {
      const attrName = def.attribute || toKebabCase(name);
      if (value == null || (def.type === 'boolean' && !value)) {
        this.removeAttribute(attrName);
      } else if (def.type === 'boolean') {
        this.setAttribute(attrName, '');
      } else if (def.type === 'object' || def.type === 'array') {
        this.setAttribute(attrName, JSON.stringify(value));
      } else {
        this.setAttribute(attrName, String(value));
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      const props = this.constructor.properties || {};
      const propName = Object.keys(props).find(p => {
        const def = props[p];
        return (def.attribute || toKebabCase(p)) === name;
      });

      if (propName) {
        const def = props[propName];
        this[propName] = deserialize(newValue, def.type);
      }
    }

    get state() {
      return { ...this._state };
    }

    setState(updates) {
      const oldState = { ...this._state };
      Object.assign(this._state, updates);
      this.requestUpdate();
      this.dispatchEvent(new CustomEvent('state-changed', {
        detail: { state: this._state, oldState },
        bubbles: true
      }));
    }

    requestUpdate() {
      if (this._renderPending) return;
      this._renderPending = true;
      requestAnimationFrame(() => {
        this._renderPending = false;
        this.update();
      });
    }

    update() {
      if (this.render) {
        const content = this.render();
        if (typeof content === 'string') {
          this._root.innerHTML = content;
        }
      }
    }

    connectedCallback() {
      this.update();
      if (this.connected) this.connected();
    }

    disconnectedCallback() {
      if (this.disconnected) this.disconnected();
    }

    adoptedCallback() {
      if (this.adopted) this.adopted();
    }

    // Template helper
    html(strings, ...values) {
      return strings.reduce((result, str, i) => {
        let value = values[i] || '';
        if (Array.isArray(value)) value = value.join('');
        if (typeof value === 'object') value = JSON.stringify(value);
        return result + str + value;
      }, '');
    }
  }

  // Utility functions
  function toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  function deserialize(value, type) {
    if (value === null) return null;
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return value !== null && value !== 'false' && value !== '0';
      case 'object':
      case 'array':
        try { return JSON.parse(value); }
        catch { return type === 'array' ? [] : {}; }
      default: return value;
    }
  }

  // Export to global
  global.StxElement = StxElement;
  global.stxComponents = global.stxComponents || {};

  // Helper to define components
  global.defineStxComponent = function(tag, config) {
    const { properties, template, styles, methods, ...options } = config;

    class Component extends StxElement {
      static get properties() { return properties || {}; }
      static get useShadowDOM() { return options.shadowDOM !== false; }

      render() {
        let html = template || '';
        // Simple interpolation
        html = html.replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (match, key) => {
          if (key in this) return this[key] ?? '';
          if (key in this._state) return this._state[key] ?? '';
          return match;
        });
        return (styles ? '<style>' + styles + '</style>' : '') + html;
      }
    }

    // Add methods
    if (methods) {
      for (const [name, fn] of Object.entries(methods)) {
        Component.prototype[name] = fn;
      }
    }

    customElements.define(tag, Component);
    global.stxComponents[tag] = Component;
    return Component;
  };

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
`
}

// =============================================================================
// SFC Web Component Parser
// =============================================================================

/**
 * Parsed SFC web component structure
 */
export interface ParsedSFCComponent {
  tag: string
  props: string[]
  template: string
  styles: string
  script: string
  shadowDOM: boolean
}

/**
 * Parse an SFC-style web component file
 *
 * Expected format:
 * ```html
 * <script>
 * export default {
 *   tag: 'my-button',
 *   props: ['type', 'text'],
 *   shadowDOM: true // optional, defaults to true
 * }
 * </script>
 *
 * <button class="{{ type }}">{{ text }}</button>
 *
 * <style>
 * button { padding: 8px 16px; }
 * </style>
 * ```
 */
export function parseSFCComponent(source: string, defaultTag: string): ParsedSFCComponent {
  // Extract script block
  const scriptMatch = source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1].trim() : ''

  // Parse component config from script
  let tag = defaultTag
  let props: string[] = []
  let shadowDOM = true

  if (scriptContent) {
    // Try to parse export default { ... }
    const exportMatch = scriptContent.match(/export\s+default\s+({[\s\S]*})/)
    if (exportMatch) {
      try {
        // Simple parsing - extract tag, props, shadowDOM
        const configStr = exportMatch[1]

        // Extract tag
        const tagMatch = configStr.match(/tag\s*:\s*['"`]([^'"`]+)['"`]/)
        if (tagMatch) tag = tagMatch[1]

        // Extract props array
        const propsMatch = configStr.match(/props\s*:\s*\[([\s\S]*?)\]/)
        if (propsMatch) {
          props = propsMatch[1]
            .split(',')
            .map(p => p.trim().replace(/['"`]/g, ''))
            .filter(p => p.length > 0)
        }

        // Extract shadowDOM
        const shadowMatch = configStr.match(/shadowDOM\s*:\s*(true|false)/)
        if (shadowMatch) shadowDOM = shadowMatch[1] === 'true'
      }
      catch {
        // Ignore parsing errors, use defaults
      }
    }
  }

  // Extract template block
  // Only match <template> WITHOUT an id attribute - templates with id are HTML template elements
  // that should be preserved (used for client-side JS template cloning)
  const templateMatch = source.match(/<template\b(?![^>]*\bid\s*=)[^>]*>([\s\S]*?)<\/template>/i)
  const template = templateMatch ? templateMatch[1].trim() : ''

  // Extract style block
  const styleMatch = source.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i)
  const styles = styleMatch ? styleMatch[1].trim() : ''

  return {
    tag,
    props,
    template,
    styles,
    script: scriptContent,
    shadowDOM,
  }
}

/**
 * Generate a web component class from parsed SFC
 */
export function generateSFCWebComponent(parsed: ParsedSFCComponent): string {
  const { tag, props, template, styles, shadowDOM } = parsed

  // Convert tag to class name (my-button -> MyButton)
  const className = tag
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  // Escape template for JS string
  const escapedTemplate = template
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  // Escape styles
  const escapedStyles = styles
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')

  // Generate observed attributes
  const observedAttrs = props.map(p => `'${p}'`).join(', ')

  // Generate property getters/setters
  const propertyAccessors = props.map(prop => `
  get ${prop}() {
    return this.getAttribute('${prop}') || '';
  }
  set ${prop}(value) {
    if (value) {
      this.setAttribute('${prop}', value);
    } else {
      this.removeAttribute('${prop}');
    }
  }`).join('\n')

  return `/**
 * ${className} Web Component
 * Auto-generated from SFC
 */
class ${className} extends HTMLElement {
  constructor() {
    super();
    ${shadowDOM ? "this.attachShadow({ mode: 'open' });" : ''}
    this._render();
  }

  static get observedAttributes() {
    return [${observedAttrs}];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._render();
    }
  }
${propertyAccessors}

  _render() {
    const template = \`${escapedStyles ? `<style>${escapedStyles}</style>` : ''}${escapedTemplate}\`;

    // Interpolate {{ prop }} with attribute values
    const rendered = template.replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (match, prop) => {
      return this.getAttribute(prop) || '';
    });

    ${shadowDOM ? 'this.shadowRoot.innerHTML = rendered;' : 'this.innerHTML = rendered;'}
  }

  connectedCallback() {
    this._render();
  }
}

customElements.define('${tag}', ${className});
`
}

// =============================================================================
// Directive Handler
// =============================================================================

/**
 * Directive handler for embedding web components in templates.
 *
 * The directive looks for an SFC-style component file and generates
 * an inline script with the web component class.
 *
 * Usage:
 * ```html
 * @webcomponent('my-button')
 * <my-button type="primary" text="Click Me"></my-button>
 * ```
 *
 * Component file (components/my-button.stx):
 * ```html
 * <script>
 * export default {
 *   tag: 'my-button',
 *   props: ['type', 'text']
 * }
 * </script>
 *
 * <button class="{{ type }}">{{ text }}</button>
 *
 * <style>
 * button { padding: 8px 16px; }
 * </style>
 * ```
 */
export async function webComponentDirectiveHandler(
  content: string,
  params: string[],
  context: Record<string, any>,
  filePath: string,
): Promise<string> {
  if (params.length < 1) {
    return inlineError('WebComponent', '@webcomponent directive requires at least the tag name parameter', ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
  }

  const tagName = params[0].replace(/['"]/g, '')
  const options = context.__stx_options || {}

  // Try to find the component file
  const componentsDir = options.componentsDir || 'components'
  const possiblePaths = [
    path.join(path.dirname(filePath), componentsDir, `${tagName}.stx`),
    path.join(process.cwd(), componentsDir, `${tagName}.stx`),
    path.join(path.dirname(filePath), `${tagName}.stx`),
  ]

  let componentSource: string | null = null
  for (const componentPath of possiblePaths) {
    if (await fileExists(componentPath)) {
      componentSource = await Bun.file(componentPath).text()
      break
    }
  }

  if (!componentSource) {
    return inlineError('WebComponent', `Component file not found: ${tagName}.stx`, ErrorCodes.FILE_NOT_FOUND)
  }

  // Parse the SFC and generate the web component
  const parsed = parseSFCComponent(componentSource, tagName)
  const webComponentCode = generateSFCWebComponent(parsed)

  // Return inline script with the web component
  return `<script type="module">
${webComponentCode}
</script>`
}
