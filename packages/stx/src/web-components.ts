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
// Directive Handler
// =============================================================================

/**
 * Directive handler for embedding web components in templates
 */
export function webComponentDirectiveHandler(
  content: string,
  params: string[],
  context: Record<string, any>,
  _filePath: string,
): string {
  if (params.length < 1) {
    return inlineError('WebComponent', '@webcomponent directive requires at least the tag name parameter', ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
  }

  const tag = params[0].replace(/['"]/g, '')
  const path = context.__stx?.webComponentsPath || '/web-components'
  return `<script type="module" src="${path}/${tag}.js"></script>`
}
