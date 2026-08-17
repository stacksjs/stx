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
  /** The component's script, compiled: hoisted imports and the derived scope. */
  scope: { imports: string[], body: string, propNames: string[], defaults: Record<string, string> }
  /** The template's control flow, compiled into a render function body. */
  render: string
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
    let code: string
    try {
      code = new Bun.Transpiler({ loader: 'ts' }).transformSync(script[2])
    }
    catch (error) {
      throw new Error(`${file}: failed to transpile <script client> (${(error as Error).message})`)
    }
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

/**
 * Compile the template's control flow into a render function.
 *
 * The build compiles; the runtime executes. Everything a component needs to
 * decide is decided here, in Node, and what ships is a plain JavaScript
 * function that concatenates a string. Nothing is interpreted in the browser.
 *
 * That is not only about speed. Evaluating a template at runtime means either
 * `new Function` or an interpreter, and the first is refused outright by any
 * page with a Content Security Policy worth having, which is exactly the sort
 * of page a component library is dropped into. Compiling ahead of time means a
 * component works under `script-src 'self'` with no exception carved for it.
 *
 * Handles `@if` / `@elseif` / `@else` / `@endif` and `@foreach (xs as x)`,
 * nested to any depth, plus `{{ }}` and `{!! !!}` interpolation. Anything it
 * does not recognise is left as literal text rather than guessed at, so an
 * unsupported directive is visible in the output instead of silently dropped.
 */
/**
 * What kind of thing a prop holds, read from the default it was given.
 *
 * A default is the only evidence available: the TypeScript interface that
 * declared the prop is gone by now, and guessing from the name would be worse
 * than guessing from the value. With no default at all the answer is `object`,
 * because an undeclared prop is far more often a payload than a string, and an
 * object property round-trips a string unchanged while the reverse loses the
 * structure.
 */
/**
 * The property type a component declared, or null when it declared nothing.
 *
 * Preferred over inference because it is a statement rather than a guess. A
 * union or anything exotic falls through to `object`, which round-trips a JSON
 * payload and is the safe answer for a type this does not understand.
 */
function typeFromDeclaration(declaration: string | undefined): 'string' | 'number' | 'boolean' | 'object' | null {
  if (!declaration) return null

  const type = declaration.replace(/\s*\|\s*(?:undefined|null)\b/g, '').trim()

  if (/^string$/.test(type)) return 'string'
  if (/^number$/.test(type)) return 'number'
  if (/^boolean$/.test(type)) return 'boolean'
  // A string union is still a string as far as an attribute is concerned.
  if (/^(?:'[^']*'|"[^"]*")(?:\s*\|\s*(?:'[^']*'|"[^"]*"))*$/.test(type)) return 'string'

  return 'object'
}

function inferPropertyType(fallback: string | undefined): 'string' | 'number' | 'boolean' | 'object' {
  if (fallback === undefined) return 'object'
  if (fallback === 'true' || fallback === 'false') return 'boolean'
  if (/^-?\d+(?:\.\d+)?$/.test(fallback)) return 'number'
  if (/^['"`]/.test(fallback)) return 'string'
  return 'object'
}

/** The default as a value rather than as the source text that produced it. */
function literalValue(fallback: string): unknown {
  if (fallback === 'true') return true
  if (fallback === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(fallback)) return Number(fallback)
  if (/^['"`]/.test(fallback)) return fallback.slice(1, -1)
  try { return JSON.parse(fallback) }
  catch { return undefined }
}

function compileTemplateToRender(template: string): string {
  const parts: string[] = []
  let cursor = 0

  // The comment form is stripped rather than emitted: it is a note to whoever
  // reads the component, not to whoever loads the page.
  const source = template.replace(/\{\{--[\s\S]*?--\}\}/g, '')

  const directive = /@(if|elseif|else|endif|foreach|endforeach)\s*(?:\(([\s\S]*?)\))?/g
  let match: RegExpExecArray | null

  const text = (raw: string): void => {
    if (raw === '') return
    // Interpolation splits the literal, so the pieces around it are emitted as
    // string constants and the expressions as real JavaScript.
    let index = 0
    const interpolation = /\{!!\s*([\s\S]*?)\s*!!\}|\{\{\s*([\s\S]*?)\s*\}\}/g
    let hit: RegExpExecArray | null
    while ((hit = interpolation.exec(raw))) {
      if (hit.index > index) parts.push(`out += ${JSON.stringify(raw.slice(index, hit.index))};`)
      // `{!! !!}` is the author saying "this is markup". `{{ }}` is the author
      // saying "this is a value", and a value is escaped, always.
      parts.push(hit[1] !== undefined
        ? `out += __raw(${hit[1]});`
        : `out += __escape(${hit[2]});`)
      index = hit.index + hit[0].length
    }
    if (index < raw.length) parts.push(`out += ${JSON.stringify(raw.slice(index))};`)
  }

  while ((match = directive.exec(source))) {
    text(source.slice(cursor, match.index))
    cursor = match.index + match[0].length

    switch (match[1]) {
      case 'if':
        parts.push(`if (${match[2]}) {`)
        break
      case 'elseif':
        parts.push(`} else if (${match[2]}) {`)
        break
      case 'else':
        parts.push('} else {')
        break
      case 'endif':
      case 'endforeach':
        parts.push('}')
        break
      case 'foreach': {
        // `xs as x` and `xs as key => value`, which is the form the templates
        // use. Written as a for-of over entries so an object iterates as
        // happily as an array; a loop that only works on arrays is a trap the
        // author finds at runtime.
        const pair = /^([\s\S]+?)\s+as\s+(?:([A-Za-z_$][\w$]*)\s*=>\s*)?([A-Za-z_$][\w$]*)$/.exec((match[2] || '').trim())
        if (!pair) {
          parts.push(`out += ${JSON.stringify(match[0])};`)
          break
        }
        const [, iterable, key, value] = pair
        parts.push(key
          ? `for (const [${key}, ${value}] of __entries(${iterable})) {`
          : `for (const ${value} of __values(${iterable})) {`)
        break
      }
    }
  }

  text(source.slice(cursor))

  return parts.join('\n    ')
}

/**
 * Carry the component's computed values into the element.
 *
 * A component's script is where its thinking lives: the formatted total, the
 * colour that says whether a number moved the right way, the geometry of a
 * path. Dropping it and keeping only the markup, which is what this build did
 * before, leaves a component that can display a value but cannot derive one,
 * and every real component derives something.
 *
 * Top-level `const` and `let` declarations become the scope the template reads.
 * Imports are hoisted to the generated module so a component can share helpers
 * with the rest of a codebase rather than restating them, which is the whole
 * reason to write the component in stx and not in the consuming language.
 *
 * `defineProps` / `withDefaults` are recognised and removed: they declare the
 * element's public surface, which is already expressed as properties, and
 * leaving the call in would reference an import that does not exist at runtime.
 */
function compileScriptScope(source: string, file: string, outputDir: string): {
  imports: string[]
  body: string
  propNames: string[]
  defaults: Record<string, string>
  declared: Record<string, string>
} {
  const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  const block = scripts.find(script => !/\bcomponent\b|\bstx:component\b|\bclient\b/i.test(script[1]))

  if (!block) return { imports: [], body: '', propNames: [], defaults: {}, declared: {} }

  let code = block[2]
  const imports: string[] = []
  const propNames: string[] = []
  const defaults: Record<string, string> = {}
  /** Prop name to the TypeScript type the component declared for it. */
  const declared: Record<string, string> = {}

  // Hoist imports, minus stx's own compile-time helpers, which have no runtime
  // meaning once the props they declare have become element properties.
  code = code.replace(/^\s*import\s+[\s\S]*?from\s*['"][^'"]+['"];?\s*$/gm, (statement) => {
    if (/from\s*['"]stx['"]/.test(statement)) return ''

    // A relative specifier was written against the component's own directory,
    // and the generated module lives in the output one. Left alone it resolves
    // to nothing and the bundle fails with a path the author never typed, so
    // it is rewritten to mean the same file from where it now sits.
    imports.push(statement.trim().replace(/(from\s*['"])(\.[^'"]*)(['"])/, (_all, open, specifier, close) => {
      const target = path.resolve(path.dirname(file), specifier)
      const rewritten = path.relative(outputDir, target)
      return `${open}${rewritten.startsWith('.') ? rewritten : `./${rewritten}`}${close}`
    }))
    return ''
  })

  // The props declaration, in either form, tells us the public surface and the
  // defaults. It is then removed rather than compiled.
  // No trailing wildcard. An earlier form ended `[\s\S]*?$` under /m, which
  // looks harmless and is not: with no withDefaults wrapper to close the match,
  // it ran on and ate the first declaration after the props line, so the very
  // values the component derives were removed before anything could read them.
  // The bug appeared only in the plainer of the two forms, which is exactly the
  // one a small component uses.
  const destructure = /const\s*\{([^}]*)\}\s*=\s*(?:withDefaults\s*\(\s*)?defineProps\s*<[^>]*>\s*\(\s*\)\s*(?:,\s*(\{[\s\S]*?\})\s*,?\s*\))?/
  const propMatch = destructure.exec(code)

  if (propMatch) {
    for (const name of propMatch[1].split(',')) {
      const clean = name.split(':')[0].trim()
      if (clean) propNames.push(clean)
    }
    for (const pair of (propMatch[2] || '').matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([^,}]+)/g)) {
      defaults[pair[1]] = pair[2].trim()
    }
    code = code.replace(propMatch[0], '')
  }

  /*
   * Read the declared types before the interface is stripped.
   *
   * This is the only place a prop's type is actually stated. Inferring it from
   * a default guesses, and guesses wrongly for the common case: a `title?:
   * string` has no default, so it was typed as an object, and the attribute
   * "Revenue" was then JSON-parsed, failed, and rendered as [object Object] on
   * the page. The interface says `string`; there is no reason to guess.
   */
  for (const block of code.matchAll(/(?:export\s+)?interface\s+[A-Za-z_$][\w$]*\s*\{([\s\S]*?)\n\}/g)) {
    for (const member of block[1].matchAll(/^\s*(?:\/\*\*[\s\S]*?\*\/\s*)?([A-Za-z_$][\w$]*)\??\s*:\s*([^\n;]+)/gm)) {
      declared[member[1]] = member[2].trim()
    }
  }

  // The interface that typed the props has no runtime form.
  code = code.replace(/(?:export\s+)?interface\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\n\}/g, '')

  // Returned as TypeScript, deliberately unbuilt. Transpiling the script on its
  // own hands the compiler a set of declarations nothing reads, and it removes
  // them as dead: the template that uses them has not been attached yet. The
  // two are built together further down, where `const doubled = total * 2` is
  // visibly used by the line that prints it and survives.
  return { imports, body: code.trim(), propNames, defaults, declared }
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
  defaults: Pick<ComponentLibraryConfig, 'prefix' | 'shadowDOM' | 'progressive' | 'outputDir'>,
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
  const scope = compileScriptScope(source, sourcePath, path.resolve(defaults.outputDir))
  const render = compileTemplateToRender(bindingCompilation.template)

  // A prop declared with defineProps is part of the element's public surface,
  // so it becomes a real property here. Without this the component compiles
  // perfectly and then reads undefined for everything, because assigning to an
  // undeclared name stores a value the element never looks at: a failure that
  // looks like the compiler is broken when it is the declaration that is
  // missing. Anything named explicitly in the component's own metadata wins,
  // since that is the author being deliberate.
  for (const propertyName of scope.propNames) {
    if (properties[propertyName]) continue
    const fallback = scope.defaults[propertyName]
    properties[propertyName] = normalizeProperty(propertyName, {
      type: typeFromDeclaration(scope.declared[propertyName]) ?? inferPropertyType(fallback),
      ...(fallback === undefined ? {} : { default: literalValue(fallback) }),
    })
  }
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
    scope,
    render,
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

const cloneDefault = (value, type) => {
  if (value == null || (type !== 'object' && type !== 'array')) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const defaultFor = property => cloneDefault(
  property.default ?? ({ string: '', number: 0, boolean: false, object: {}, array: [] })[property.type],
  property.type,
);

export class StxElement extends HTMLElementBase {
  static definition = {};
  static get observedAttributes() { return this.definition.observedAttributes || []; }

  constructor() {
    super();
    this._values = Object.create(null);
    this._reflecting = false;
    this._connected = false;
    this._hasConnected = false;
    this._initializing = false;
    this._updatePending = false;
    this._listeners = new Map();
    const definition = this.constructor.definition;
    for (const [name, property] of Object.entries(definition.properties || {})) {
      this._values[name] = defaultFor(property);
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
    this._initializing = true;
    const definition = this.constructor.definition;
    for (const [name, property] of Object.entries(definition.properties || {})) {
      const attribute = property.attribute === false ? null : (property.attribute || name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()));
      if (attribute && this.hasAttribute?.(attribute)) this._values[name] = deserialize(this.getAttribute(attribute), property.type, defaultFor(property));
    }
    // Properties assigned before customElements.define() become own properties.
    // Upgrade them after attributes so imperative state wins, matching the
    // platform's property-first custom-element initialization convention.
    for (const name of Object.keys(definition.properties || {})) this._upgradeProperty(name);
    this._initializing = false;
    const root = this.renderRoot;
    const hasMarkup = [...(root.childNodes || [])].some(node => node.nodeType !== 3 || node.textContent.trim());
    const firstConnection = !this._hasConnected;
    if (!(firstConnection && definition.progressive && hasMarkup)) this._render();
    else this._upgradeDeclarativeEvents();
    this._bindEvents();
    if (firstConnection) {
      this._hasConnected = true;
      this.setAttribute?.('hydrated', '');
      this.dispatchEvent?.(new CustomEvent('stx:hydrated', { bubbles: true, composed: true }));
    }
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
    const value = deserialize(newValue, property.type, defaultFor(property));
    if (!Object.is(this._values[name], value)) {
      this._values[name] = value;
      this.requestUpdate();
    }
  }

  /**
   * The props a compiled render reads.
   *
   * Its own method rather than _values directly, so a component that sets a
   * property before upgrade still sees it, and so the generated code has one
   * name to depend on rather than a private field's shape.
   */
  _props() {
    return this._values;
  }

  requestUpdate() {
    if (!this._connected || this._initializing || this._updatePending) return this.updateComplete;
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
    // A compiled component renders itself: the control flow and the derived
    // values were turned into JavaScript at build time, so there is nothing to
    // interpret here and nothing that needs an eval the page's CSP forbids.
    // The string template remains for components that carry no logic.
    let html = typeof this.render === 'function'
      ? this.render(RENDER_HELPERS)
      : definition.template
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

/**
 * What a compiled render is handed.
 *
 * Passed in rather than closed over so the generated code names no globals, and
 * a component module stays readable on its own: __escape is visibly a
 * parameter, not something the bundler happened to leave in scope.
 */
const RENDER_HELPERS = {
  escape: escapeHTML,
  // The raw form is the author declaring the value is markup. Null becomes an
  // empty string rather than the word "null", which is the only sensible
  // reading of a missing fragment.
  raw: (value) => String(value ?? ''),
  // A loop over something absent runs zero times. Throwing here would fail a
  // whole page over one empty list, which is never what the author meant.
  values: (value) => value == null ? [] : (value[Symbol.iterator] ? value : Object.values(value)),
  entries: (value) => value == null ? [] : (Array.isArray(value) ? value.entries() : Object.entries(value)),
};

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

  const scope = component.scope

  // Every declared property, not only the ones defineProps named. A component
  // may declare its surface in script metadata instead, and those templates
  // reference the prop by bare name exactly the same way; destructuring only
  // the defineProps set leaves the others as free identifiers and the render
  // throws a ReferenceError for a prop that is declared and working.
  const destructured = [...new Set([...Object.keys(component.properties), ...scope.propNames])]
    .map(name => scope.defaults[name] === undefined ? name : `${name} = ${scope.defaults[name]}`)
    .join(', ')
  const indent = (code: string): string =>
    code.split('\n').map(line => line.trim() === '' ? line : `    ${line}`).join('\n')

  // A component with no control flow and no script keeps the string template it
  // had before, so a purely presentational element gains nothing it does not
  // use and nothing that already worked changes shape.
  let renderMethod = ''

  if (component.render.trim() !== '' || scope.body !== '' || destructured !== '') {
    const inner = [
      destructured ? `const { ${destructured} } = this._props();` : '',
      scope.body,
      `let out = '';`,
      component.render,
      'return out;',
    ].filter(Boolean).join('\n')

    // Wrapped in an exported function before it is transpiled, for two
    // reasons that both bite silently. A bare statement list is treated as a
    // module body, so `this` is rewritten to `exports` and the element's own
    // props accessor stops resolving; and nothing in that body is reachable
    // from an export, so the compiler removes the derived values as dead code
    // and the render prints undefined for every one of them. Inside an
    // exported function, `this` is left alone and every declaration is kept.
    let compiled: string
    try {
      const wrapped = new Bun.Transpiler({ loader: 'ts' })
        .transformSync(`export function __render(__helpers) {\n${inner}\n}`)
      const opening = wrapped.indexOf('{')
      const closing = wrapped.lastIndexOf('}')
      compiled = wrapped.slice(opening + 1, closing).trim()
    }
    catch (error) {
      throw new Error(`${component.sourcePath}: failed to compile render (${(error as Error).message})`)
    }

    renderMethod = `
  render(__helpers) {
    const { escape: __escape, raw: __raw, values: __values, entries: __entries } = __helpers;
${indent(compiled.trim())}
  }
`
  }

  return `import { StxElement, defineComponent } from './runtime.js';
${scope.imports.length ? `${scope.imports.join('\n')}\n` : ''}
/** ${component.description || `${component.name} web component generated from ${component.file}.`} */
export class ${component.name} extends StxElement {
${methodCode}${renderMethod}
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
    let result: Awaited<ReturnType<typeof Bun.build>>
    try {
      result = await Bun.build({
        entrypoints: [path.join(outputDir, 'index.js')],
        outdir: outputDir,
        naming: 'bundle.js',
        target: 'browser',
        format: 'esm',
        minify: config.minify ?? true,
        sourcemap: config.sourcemap || 'none',
      })
    }
    catch (error) {
      const logs = error instanceof AggregateError ? error.errors : [error]
      const details = logs.map(log => String(log).trim()).filter(Boolean).join('\n')
      throw new AggregateError(
        logs,
        `Failed to bundle component library${details ? `\n${details}` : ''}`,
      )
    }
    if (!result.success) {
      const details = result.logs.map(log => String(log).trim()).filter(Boolean).join('\n')
      throw new AggregateError(
        result.logs,
        `Failed to bundle component library${details ? `\n${details}` : ''}`,
      )
    }
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
