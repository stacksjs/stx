/* eslint-disable no-console */
import type { StxOptions, WebComponent } from './types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
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

  // Create the web component wrapper
  const webComponentCode = generateWebComponentCode({
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
  const outputFile = path.join(outputDir, `${tag}.js`)
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
  const htmlContent = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '').trim()

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
    // Handle any slot processing if needed
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
    return '[Error: @webcomponent directive requires at least the tag name parameter]'
  }

  const tag = params[0].replace(/['"]/g, '')
  const path = context.__stx?.webComponentsPath || '/web-components'
  return `<script type="module" src="${path}/${tag}.js"></script>`
}
