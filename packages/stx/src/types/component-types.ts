/**
 * Component System Types
 */

/**
 * Prop type definition for component prop validation
 */
export type PropType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function' | 'any'

/**
 * Component prop definition for validation
 */
export interface PropDefinition {
  /** Type of the prop */
  type: PropType | PropType[]
  /** Whether the prop is required */
  required?: boolean
  /** Default value if not provided */
  default?: unknown
  /** Custom validator function */
  validator?: (value: unknown) => boolean
}

/**
 * Component props schema for validation
 *
 * @example
 * ```typescript
 * const alertProps: ComponentPropsSchema = {
 *   title: { type: 'string', required: true },
 *   type: { type: 'string', default: 'info' },
 *   dismissible: { type: 'boolean', default: false }
 * }
 * ```
 */
export interface ComponentPropsSchema {
  [propName: string]: PropDefinition
}

/**
 * Component definition with metadata
 */
export interface ComponentDefinition {
  /** Component name */
  name: string
  /** Path to component file */
  path?: string
  /** Props schema for validation */
  props?: ComponentPropsSchema
  /** Component description for documentation */
  description?: string
}

/**
 * Component configuration
 */
export interface ComponentConfig {
  /** Enable prop validation */
  validateProps?: boolean
  /** Component definitions for prop validation */
  components?: Record<string, ComponentDefinition>
}

/**
 * Web component definition
 */
export interface WebComponent {
  /** Name of the web component class */
  name: string
  /** HTML tag to register (must include a hyphen) */
  tag: string
  /** Path to the stx component file to convert */
  file: string
  /** Optional element to extend (default: HTMLElement) */
  extends?: string
  /** Whether to use shadow DOM (default: true) */
  shadowDOM?: boolean
  /** Whether to use a template element (default: true) */
  template?: boolean
  /** Path to an external stylesheet to link */
  styleSource?: string
  /** List of attributes to observe */
  attributes?: string[]
  /** Description of the component for documentation */
  description?: string
  /** Output format: 'js' (default) or 'ts' for TypeScript */
  outputFormat?: 'js' | 'ts'
  /** Type definitions for observed attributes (for TypeScript output) */
  attributeTypes?: Record<string, 'string' | 'number' | 'boolean' | 'object'>
}

/**
 * Web components configuration
 */
export interface WebComponentConfig {
  /** Enable web component integration */
  enabled: boolean
  /** Directory to output web components */
  outputDir: string
  /** Web components to build */
  components: WebComponent[]
}

/** Reactive property emitted by the component-library compiler. */
export interface ComponentLibraryProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  default?: unknown
  required?: boolean
  reflect?: boolean
  attribute?: string | false
  description?: string
}

/** Public custom event emitted by a compiled component. */
export interface ComponentLibraryEvent {
  description?: string
  detailType?: string
}

/** One .stx source entry in a component-library build. */
export interface ComponentLibraryComponent {
  file: string
  name?: string
  tag?: string
  description?: string
  shadowDOM?: boolean | 'open' | 'closed'
  progressive?: boolean
  properties?: Record<string, ComponentLibraryProperty>
  events?: Record<string, ComponentLibraryEvent>
  methods?: Record<string, string>
}

/** Build configuration for a standards-based web component library. */
export interface ComponentLibraryConfig {
  /** Directory recursively scanned for .stx files. */
  inputDir: string
  /** Build output directory. */
  outputDir: string
  /** Prefix used for inferred custom-element tags. Defaults to "stx". */
  prefix?: string
  /** Explicit entries. When omitted, every .stx file is discovered. */
  components?: ComponentLibraryComponent[]
  /** Default rendering mode. Light DOM is the progressive default. */
  shadowDOM?: boolean | 'open' | 'closed'
  /** Preserve server-rendered markup until a reactive update. */
  progressive?: boolean
  /** Generate custom-elements.json. */
  manifest?: boolean
  /** Generate per-component, JSX, and index declarations. */
  declarations?: boolean
  /** Generate per-component and bundled CSS. */
  css?: boolean
  /** Generate a single tree-shakeable ESM bundle. */
  bundle?: boolean
  /** Minify JavaScript and CSS output. */
  minify?: boolean
  /** Generate source maps for bundle.js. */
  sourcemap?: boolean | 'inline' | 'external'
}

export interface ComponentLibraryBuildResult {
  components: Array<{
    name: string
    tag: string
    source: string
    module: string
  }>
  files: string[]
  manifest?: string
  bundle?: string
  cssBundle?: string
  totalBytes: number
}

/**
 * Documentation format options
 */
export type DocFormat = 'markdown' | 'html' | 'json'

/**
 * Component property documentation
 */
export interface ComponentPropDoc {
  /** Name of the property */
  name: string
  /** Type of the property (e.g., string, number, boolean) */
  type?: string
  /** Whether the property is required */
  required?: boolean
  /** Default value if any */
  default?: string
  /** Description of the property */
  description?: string
}

/**
 * Component documentation
 */
export interface ComponentDoc {
  /** Name of the component */
  name: string
  /** File path */
  path: string
  /** Component description */
  description?: string
  /** Component properties/attributes */
  props: ComponentPropDoc[]
  /** Example usage */
  example?: string
  /** Whether this is a web component */
  isWebComponent?: boolean
  /** HTML tag if it's a web component */
  tag?: string
}

/**
 * Template documentation
 */
export interface TemplateDoc {
  /** Template name */
  name: string
  /** File path */
  path: string
  /** Description */
  description?: string
  /** Used components */
  components?: string[]
  /** Used directives */
  directives?: string[]
}

/**
 * Directive documentation
 */
export interface DirectiveDoc {
  /** Directive name */
  name: string
  /** Description */
  description?: string
  /** Has end tag */
  hasEndTag: boolean
  /** Example usage */
  example?: string
}

/**
 * Documentation generator configuration
 */
export interface DocGeneratorConfig {
  /** Enable documentation generation */
  enabled: boolean
  /** Output directory for documentation */
  outputDir: string
  /** Format of generated documentation */
  format: DocFormat
  /** Generate docs for components */
  components: boolean
  /** Generate docs for templates */
  templates: boolean
  /** Generate docs for directives */
  directives: boolean
  /** Extra content to include in documentation */
  extraContent?: string
  /** Custom template for documentation */
  template?: string
}
