/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Unified Component Renderer
 *
 * Replaces all existing component processing with a single `processComponents()`
 * entry point. Handles:
 *
 * 1. Built-in components (StxLink, StxImage, StxLoadingIndicator) — resolved
 *    via the component registry and rendered directly to HTML.
 * 2. File-based user components — resolved from the filesystem and rendered
 *    via `renderComponentWithSlot()`.
 * 3. `@component` directives — `@component('name', { props })...@endcomponent`.
 * 4. `@import` directives — `@import('ComponentName', './path/to/component')`.
 *
 * Props are categorized into static, serverDynamic, clientReactive, and events
 * through `parseComponentProps()` before being passed to the appropriate renderer.
 *
 * @module component-renderer
 */

import type { StxOptions } from './types'
import type { ResolvedProps, RenderContext } from './component-registry'
import { registry } from './component-registry'
import { registerBuiltins } from './builtins'
import { decodeStxProp, findComponentTags, parseMultilineAttributes, pascalToKebab, restoreStashedScripts, stashScriptElements } from './component-processing'
import { renderComponentWithSlot, userComponentFileExists } from './utils'
import { createSafeFunction, isExpressionSafe, safeEvaluateObject } from './safe-evaluator'
import fs from 'node:fs'
import path from 'node:path'

/** Guard flag to ensure builtins are registered exactly once. */
let builtinsRegistered = false

/**
 * Standard HTML tags to exclude from component processing.
 * Any tag whose lowercase name appears here is treated as a native HTML element.
 */
const htmlTags = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'menu', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'picture', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
  // SVG elements
  'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse',
  'text', 'tspan', 'textPath',
  'g', 'defs', 'use', 'symbol', 'image',
  'clipPath', 'mask', 'pattern', 'marker',
  'linearGradient', 'radialGradient', 'stop',
  'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDropShadow', 'feFlood', 'feGaussianBlur',
  'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting',
  'feTile', 'feTurbulence', 'foreignObject',
  'animate', 'animateMotion', 'animateTransform', 'set', 'mpath',
  'desc', 'metadata', 'switch', 'view',
])

/**
 * Parse raw attribute key/value pairs into categorized `ResolvedProps`.
 *
 * Categories:
 * - `events` — attributes starting with `@` (event handlers)
 * - `serverDynamic` — `:prop` bindings that can be evaluated in the current context,
 *   or `__stx_` prefixed pre-evaluated values from loop processing
 * - `clientReactive` — `:prop` bindings that cannot be evaluated server-side
 *   (e.g., signal expressions or variables not in context)
 * - `static` — plain attributes and `{{ }}` interpolated values
 */
function parseComponentProps(
  rawProps: Record<string, string>,
  context: Record<string, any>,
  options: StxOptions,
): ResolvedProps {
  const resolved: ResolvedProps = {
    static: {},
    serverDynamic: {},
    clientReactive: {},
    events: {},
  }

  // Alpine-style element directives that must remain passthrough so the
  // client-side signals runtime can bind them on the rendered DOM element,
  // rather than being captured as component prop bindings here.
  const ALPINE_PASSTHROUGH = new Set([
    'x-cloak', 'x-show', 'x-if', 'x-for', 'x-data', 'x-init',
    'x-transition', 'x-ref', 'x-effect', 'x-model',
    'x-text', 'x-html', 'x-class', 'x-style', 'x-on', 'x-bind',
  ])

  // Vue-aligned: `<MyComp :nav-html="…" />` should arrive as `props.navHtml`
  // inside the component (and `const { navHtml } = defineProps()` must work).
  // HTML normalizes attribute names to lowercase, so authors writing
  // PascalCase / camelCase props on a kebab-cased element get kebab-case keys
  // back. Without this normalization the kebab key is unreachable from a JS
  // destructure (you can't write `const { nav-html } = …`) and silently
  // becomes undefined — which used to force userland workarounds like
  // pre-rendering the component's HTML and dropping it via `{{{ raw }}}`.
  const kebabToCamel = (key: string): string => {
    if (!key.includes('-') || key.startsWith('@') || key.startsWith(':') || key.startsWith('x-') || key.startsWith('__'))
      return key
    return key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
  }

  for (const [rawAttrName, attrValue] of Object.entries(rawProps)) {
    // Normalize x-propName to :propName for component prop bindings.
    // Alpine element-level directives stay passthrough.
    const attrName = (rawAttrName.startsWith('x-')
      && !ALPINE_PASSTHROUGH.has(rawAttrName)
      && !rawAttrName.startsWith('x-bind:')
      && !rawAttrName.startsWith('x-on:'))
      ? `:${rawAttrName.slice(2)}`
      : rawAttrName

    // --- Event attributes: @click, @submit.prevent, etc. ---
    if (attrName.startsWith('@')) {
      resolved.events[attrName] = attrValue
      continue
    }

    // --- Pre-evaluated props from loop processing: __stx_propName ---
    if (attrName.startsWith('__stx_')) {
      const propName = kebabToCamel(attrName.slice(6)) // Remove __stx_ prefix
      resolved.serverDynamic[propName] = decodeStxProp(attrValue as string, options)
      continue
    }

    // --- Dynamic binding: :prop="expression" or :prop (shorthand) ---
    if (attrName.startsWith(':')) {
      const propName = kebabToCamel(attrName.slice(1))
      // Shorthand: :propName with no value is equivalent to :propName="propName"
      const expression = attrValue === 'true' ? propName : attrValue
      try {
        if (!isExpressionSafe(expression)) {
          if (options.debug) {
            console.error(`Unsafe expression in :${propName} binding: ${expression}`)
          }
          resolved.clientReactive[propName] = expression
          continue
        }

        const contextKeys = Object.keys(context)
        const valueFn = createSafeFunction(expression, contextKeys)
        const evaluated = valueFn(...Object.values(context))

        // If evaluation returned undefined, check if the expression references
        // variables not in the server context — if so, it's a client-side expression
        // (e.g. loop variables from :for, signal values from <script client>)
        if (evaluated === undefined) {
          // Extract identifiers from the expression
          const exprVars = expression.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || []
          const jsKeywords = new Set(['true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'in', 'of', 'new', 'this', 'return', 'void', 'delete', 'throw', 'if', 'else'])
          const hasUnresolved = exprVars.some(v => !jsKeywords.has(v) && !contextKeys.includes(v))
          if (hasUnresolved) {
            resolved.clientReactive[propName] = expression
            continue
          }
        }

        resolved.serverDynamic[propName] = evaluated
      }
      catch {
        // Evaluation failed — preserve for client
        resolved.clientReactive[propName] = expression
      }
      continue
    }

    // --- {{ }} interpolation ---
    if (typeof attrValue === 'string' && attrValue.includes('{{') && attrValue.includes('}}')) {
      const singleExprMatch = attrValue.match(/^\{\{\s*([\s\S]+?)\s*\}\}$/)
      if (singleExprMatch) {
        // Entire value is a single expression
        try {
          const expression = singleExprMatch[1]
          if (isExpressionSafe(expression)) {
            const valueFn = createSafeFunction(expression, Object.keys(context))
            const evaluated = valueFn(...Object.values(context))
            resolved.static[attrName] = evaluated != null ? String(evaluated) : ''
          }
          else {
            if (options.debug) {
              console.error(`Unsafe expression in ${attrName}: ${expression}`)
            }
            resolved.static[attrName] = attrValue
          }
        }
        catch (error) {
          if (options.debug) {
            console.error(`Error evaluating expression for ${attrName}:`, error)
          }
          resolved.static[attrName] = attrValue
        }
      }
      else {
        // Mixed content — interpolate expressions within the string
        let result = attrValue
        const exprPattern = /\{\{\s*([\s\S]+?)\s*\}\}/g
        let match
        while ((match = exprPattern.exec(attrValue)) !== null) {
          try {
            const expression = match[1]
            if (!isExpressionSafe(expression)) {
              if (options.debug) {
                console.error(`Unsafe expression in ${attrName}: ${expression}`)
              }
              continue
            }
            const valueFn = createSafeFunction(expression, Object.keys(context))
            const evaluated = valueFn(...Object.values(context))
            result = result.replace(match[0], String(evaluated ?? ''))
          }
          catch (error) {
            if (options.debug) {
              console.error(`Error evaluating expression in ${attrName}:`, error)
            }
          }
        }
        resolved.static[attrName] = result
      }
      continue
    }

    // --- Plain static attribute ---
    resolved.static[attrName] = attrValue
  }

  return resolved
}

/**
 * Parse ALL attributes from an attribute string, including @event and :dynamic
 * attributes. Unlike `parseMultilineAttributes()` (which skips @ and : attrs),
 * this captures everything so that `parseComponentProps` can categorize them.
 */
function parseAllAttributes(attributesStr: string): Record<string, string> {
  const props: Record<string, string> = {}
  let pos = 0
  const len = attributesStr.length

  while (pos < len) {
    // Skip whitespace (including newlines)
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    if (pos >= len)
      break

    // Read attribute name
    let name = ''
    while (pos < len && !/[\s=]/.test(attributesStr[pos])) {
      name += attributesStr[pos]
      pos++
    }

    if (!name)
      break

    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    // Check for = sign
    if (pos < len && attributesStr[pos] === '=') {
      pos++ // Skip =

      // Skip whitespace after =
      while (pos < len && /\s/.test(attributesStr[pos])) {
        pos++
      }

      // Read value
      let value = ''
      if (pos < len && (attributesStr[pos] === '"' || attributesStr[pos] === '\'')) {
        const quote = attributesStr[pos]
        pos++ // Skip opening quote

        // Read until closing quote, handling escapes
        while (pos < len) {
          const char = attributesStr[pos]

          if (char === '\\' && pos + 1 < len) {
            pos++
            value += attributesStr[pos]
            pos++
            continue
          }

          if (char === quote) {
            pos++ // Skip closing quote
            break
          }

          value += char
          pos++
        }
      }
      else {
        // Unquoted value (read until whitespace)
        while (pos < len && !/\s/.test(attributesStr[pos])) {
          value += attributesStr[pos]
          pos++
        }
      }

      props[name] = value
    }
    else {
      // Boolean attribute
      props[name] = 'true'
    }
  }

  return props
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function findUnresolvedBuiltinTags(template: string): string[] {
  const unresolved = new Set<string>()
  const tagRegex = /<([A-Z][A-Za-z0-9]*|stx-[a-z0-9-]+)\b[^>]*>/g
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(template)) !== null) {
    const name = match[1]
    if (registry.isBuiltin(name))
      unresolved.add(name)
  }

  return [...unresolved].sort()
}

/**
 * Resolve a `.stx` file inside a package directory by component name.
 *
 * Looks for `<Name>.stx` (PascalCase) anywhere under `pkgDir/src/` or `pkgDir/dist/`,
 * preferring shallower matches. Returns the absolute path or null.
 *
 * Cache keyed by pkgDir so repeated lookups don't re-walk the tree.
 */
const pkgStxIndexCache = new Map<string, Map<string, string>>()

function buildStxIndex(pkgDir: string): Map<string, string> {
  const cached = pkgStxIndexCache.get(pkgDir)
  if (cached) return cached

  const index = new Map<string, string>()
  const roots = [path.join(pkgDir, 'src'), path.join(pkgDir, 'dist'), pkgDir]

  function walk(dir: string, depth: number) {
    if (depth > 6) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    }
    catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        walk(full, depth + 1)
      }
      else if (entry.isFile() && entry.name.endsWith('.stx')) {
        const base = entry.name.slice(0, -4)
        // Prefer shallower matches — only set if not already present
        if (!index.has(base)) index.set(base, full)
        const lower = base.toLowerCase()
        if (!index.has(lower)) index.set(lower, full)
        const kebab = base.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        if (!index.has(kebab)) index.set(kebab, full)
      }
    }
  }

  for (const root of roots) {
    walk(root, 0)
    if (index.size > 0) break
  }

  pkgStxIndexCache.set(pkgDir, index)
  return index
}

/**
 * Resolve a module specifier (e.g. '@stacksjs/components' or './foo') to a
 * package directory on disk, walking up node_modules from `fromDir`.
 */
function resolvePackageDir(spec: string, fromDir: string): string | null {
  // Handle relative paths — caller should resolve those before calling here
  if (spec.startsWith('.') || spec.startsWith('/')) return null

  // Walk up looking for node_modules/<spec>
  let dir = fromDir
  while (true) {
    const candidate = path.join(dir, 'node_modules', spec)
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate
    }
    catch {
      // Not here — keep walking
    }
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * Process ES `import { A, B } from '<spec>'` statements inside `<script>` tags
 * for component tag registration. Registers each named import as a tag pointing
 * at the matching `.stx` file (resolved by component name within the package or
 * relative directory) and strips the import line from the script body so it
 * doesn't run as JS at template runtime.
 *
 * - `<spec>` may be a bare module specifier (resolved via node_modules walk) or
 *   a relative path to a directory or a single `.stx` file.
 * - Default imports (`import Foo from '...'`) are also supported when `<spec>`
 *   resolves to a single `.stx` file.
 * - Named imports referencing non-`.stx` exports are left untouched in the script.
 */
export async function processESImports(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  if (!template.includes('import')) return template

  if (!context.__importedComponents) {
    context.__importedComponents = new Map<string, string>()
  }
  const registered = context.__importedComponents as Map<string, string>

  const fromDir = path.dirname(filePath)
  let output = template

  // Find all <script ...>...</script> blocks
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  output = output.replace(scriptRe, (full, attrs: string, body: string) => {
    // import { A, B as C } from 'spec'
    // import Default from 'spec'
    // (also matches multi-line forms)
    const importRe = /import\s+(?:(\{[^}]*\})|([A-Za-z_$][\w$]*))\s+from\s+['"]([^'"]+)['"]\s*;?\s*\n?/g
    let newBody = body
    let m: RegExpExecArray | null
    const removals: Array<{ start: number; end: number }> = []

    while ((m = importRe.exec(body)) !== null) {
      const [matchStr, namedBlock, defaultName, spec] = m

      // Resolve the spec to a directory or single file
      let pkgDir: string | null = null
      let singleFile: string | null = null

      if (spec.startsWith('.') || spec.startsWith('/')) {
        const abs = path.resolve(fromDir, spec)
        if (abs.endsWith('.stx')) {
          singleFile = abs
        }
        else {
          // Try as a single .stx file with extension
          const withExt = `${abs}.stx`
          try {
            if (fs.statSync(withExt).isFile()) singleFile = withExt
          }
          catch {
            // Not a file — try as directory
            try {
              if (fs.statSync(abs).isDirectory()) pkgDir = abs
            }
            catch {
              // Skip
            }
          }
        }
      }
      else {
        pkgDir = resolvePackageDir(spec, fromDir)
      }

      if (!pkgDir && !singleFile) continue // Leave as-is (regular JS import)

      let consumedAny = false

      const register = (name: string, file: string) => {
        registered.set(name, file)
        registered.set(name.toLowerCase(), file)
        const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        registered.set(kebab, file)
        dependencies.add(file)
      }

      if (defaultName && singleFile) {
        register(defaultName, singleFile)
        consumedAny = true
      }
      else if (namedBlock) {
        // Parse "{ A, B as C, D }" — capture identifier and optional alias
        const names = namedBlock
          .slice(1, -1)
          .split(',')
          .map(n => n.trim())
          .filter(Boolean)
          .map((n) => {
            const asMatch = n.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/)
            if (asMatch) return { source: asMatch[1], local: asMatch[2] }
            return { source: n, local: n }
          })

        const index = pkgDir ? buildStxIndex(pkgDir) : null
        for (const { source, local } of names) {
          let file: string | null = null
          if (singleFile) {
            file = singleFile
          }
          else if (index) {
            file = index.get(source)
              ?? index.get(source.toLowerCase())
              ?? index.get(source.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
              ?? null
          }
          if (file) {
            register(local, file)
            consumedAny = true
          }
        }
      }

      if (consumedAny) {
        removals.push({ start: m.index, end: m.index + matchStr.length })
      }
    }

    // Remove consumed imports from script body (in reverse to preserve indices)
    if (removals.length === 0) return full
    for (let i = removals.length - 1; i >= 0; i--) {
      newBody = newBody.slice(0, removals[i].start) + newBody.slice(removals[i].end)
    }
    return `<script${attrs}>${newBody}</script>`
  })

  return output
}

/**
 * Process @import directives.
 *
 * Extracts `@import('path')` or `@import('path1', 'path2', ...)` directives,
 * resolves each component path to an absolute file path, registers them in
 * `context.__importedComponents`, tracks dependencies, and removes the
 * directives from the template.
 */
async function processImports(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Initialize imported components registry in context
  if (!context.__importedComponents) {
    context.__importedComponents = new Map<string, string>()
  }
  const importedComponents = context.__importedComponents as Map<string, string>

  // Match @import('path') or @import('path1', 'path2', ...)
  const importRegex = /@import\s*\(\s*([^)]+)\s*\)/g
  let match

  while ((match = importRegex.exec(output)) !== null) {
    const [fullMatch, pathsString] = match

    // Parse the paths (handle quoted strings separated by commas)
    const paths = pathsString
      .split(',')
      .map(p => p.trim().replace(/^['"]|['"]$/g, ''))
      .filter(p => p.length > 0)

    for (const componentPath of paths) {
      // Get the component name from the path (last segment)
      const segments = componentPath.split('/')
      const fileName = segments[segments.length - 1]
      // Remove .stx extension if present, convert to PascalCase for matching
      const baseName = fileName.replace(/\.stx$/, '')
      const componentName = baseName.includes('-')
        ? baseName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
        : baseName.charAt(0).toUpperCase() + baseName.slice(1)

      // Resolve the full path
      let resolvedPath: string | null = null

      // Try different resolution strategies
      const possiblePaths = [
        // Relative to current file
        path.resolve(path.dirname(filePath), `${componentPath}.stx`),
        path.resolve(path.dirname(filePath), componentPath),
        // Relative to components dir
        path.resolve(options.componentsDir || 'components', `${componentPath}.stx`),
        path.resolve(options.componentsDir || 'components', componentPath),
        // Absolute path
        componentPath.endsWith('.stx') ? componentPath : `${componentPath}.stx`,
      ]

      for (const tryPath of possiblePaths) {
        try {
          const stat = await Bun.file(tryPath).exists()
          if (stat) {
            resolvedPath = tryPath
            break
          }
        }
        catch {
          // Continue trying
        }
      }

      if (resolvedPath) {
        // Register the component for both PascalCase and kebab-case usage
        importedComponents.set(componentName, resolvedPath)
        importedComponents.set(baseName, resolvedPath)
        importedComponents.set(baseName.toLowerCase(), resolvedPath)
        // Also register kebab-case version
        const kebabCase = componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        importedComponents.set(kebabCase, resolvedPath)

        // Track as dependency
        dependencies.add(resolvedPath)

        if (options.debug) {
          console.log(`Imported component: ${componentName} -> ${resolvedPath}`)
        }
      }
      else if (options.debug) {
        console.warn(`Could not resolve imported component: ${componentPath}`)
      }
    }

    // Remove the @import directive from output
    output = output.replace(fullMatch, '')
    importRegex.lastIndex = 0
  }

  return output
}

/**
 * Process @component directives.
 *
 * Syntax: `@component('componentPath', { prop: value })...@endcomponent`
 *
 * Uses balanced parenthesis matching to support nested objects in the props
 * argument, then resolves the component and renders it via
 * `renderComponentWithSlot()`.
 */
async function processComponentDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template
  const componentsDir = options.componentsDir || 'components'

  // Use shared processedComponents set from context to prevent infinite recursion
  if (!context.__processedComponents) {
    context.__processedComponents = new Set<string>()
  }
  const processedComponents = context.__processedComponents as Set<string>

  // Find all component directives with balanced paren matching for nested objects
  const componentPat = /@component\s*\(/g
  let match: RegExpExecArray | null

  while ((match = componentPat.exec(output)) !== null) {
    const cStart = match.index
    const openP = cStart + match[0].length - 1
    let d = 1
    let p = openP + 1
    while (p < output.length && d > 0) {
      if (output[p] === '(') d++
      else if (output[p] === ')') {
        d--
        if (d === 0) break
      }
      p++
    }
    if (d !== 0) break
    const innerArgs = output.substring(openP + 1, p)
    const directiveEnd = p + 1 // position after closing paren

    // Parse: 'componentPath', optional { props }
    const pathMatch = innerArgs.match(/^\s*['"]([^'"]+)['"]/)
    if (!pathMatch) {
      componentPat.lastIndex = 0
      continue
    }
    const componentPath = pathMatch[1]
    let propsString: string | undefined
    const afterPath = innerArgs.slice(pathMatch[0].length)
    const propsMatch = afterPath.match(/^\s*,\s*/)
    if (propsMatch) {
      propsString = afterPath.slice(propsMatch[0].length).trim()
    }
    let props = {}

    // Parse props if provided — use safe evaluation to prevent code injection
    if (propsString) {
      try {
        props = safeEvaluateObject(propsString, context)
      }
      catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        output = output.replace(output.substring(cStart, directiveEnd), `[Error parsing component props: ${msg}]`)
        continue
      }
    }

    // Check for @endcomponent to extract slot content
    let slotContent = ''
    let fullMatchEnd = directiveEnd
    const afterDirective = output.substring(directiveEnd)
    const endComponentMatch = afterDirective.match(/^([\s\S]*?)@endcomponent/)
    if (endComponentMatch) {
      slotContent = endComponentMatch[1].trim()
      fullMatchEnd = directiveEnd + endComponentMatch[0].length
    }

    // Process the component
    const processedContent = await renderComponentWithSlot(
      componentPath,
      props,
      slotContent,
      componentsDir,
      context,
      filePath,
      options,
      processedComponents,
      dependencies,
    )

    // Replace in the output
    output = output.substring(0, cStart) + processedContent + output.substring(fullMatchEnd)

    // Reset regex index to start from the beginning
    componentPat.lastIndex = 0
  }

  return output
}

/**
 * Process custom element tags (kebab-case, PascalCase, and single-word lowercase).
 *
 * For each matched tag:
 * 1. Parse all attributes via `parseAllAttributes()`
 * 2. Categorize props via `parseComponentProps()`
 * 3. If the tag is a builtin → call its `render()` function directly
 * 4. Otherwise → resolve as a file component and call `renderComponentWithSlot()`
 *
 * Tags are processed in reverse document order to preserve source indices.
 */
async function processCustomElementTags(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  if (!template) return template
  let output = template
  const componentsDir = options.componentsDir || 'components'

  // Use shared processedComponents set from context to prevent infinite recursion
  if (!context.__processedComponents) {
    context.__processedComponents = new Set<string>()
  }
  const processedComponents = context.__processedComponents as Set<string>

  // Stash <script> bodies behind sentinel markers before the three-pass
  // scan so JS string literals like Leaflet's `div.innerHTML = '<v:shape ...>'`
  // aren't mis-resolved as component references. Pre-fix
  // (stacksjs/stx#1730) the lowercase pass below caught the `v` inside
  // `<v:shape>` (the regex charset doesn't include `:`), couldn't find a
  // `v.stx`, and injected the ENOENT error string verbatim into the
  // emitted JS — producing an unbalanced quote chain that crashed the
  // browser parser with a misleading "Unexpected identifier 'v'" pointing
  // into Leaflet's internals. Markers use NUL bytes so they can't appear
  // in legitimate input. The same shape is mirrored in
  // component-processing.ts for defense.
  const stashed = stashScriptElements(output)
  output = stashed.output

  // Process kebab-case components (e.g., <my-component />)
  const kebabPattern = /[a-z][a-z0-9]*-[a-z0-9-]*/
  output = await processTagsWithParser(output, kebabPattern, false)

  // Process PascalCase components (e.g., <MyComponent />)
  const pascalPattern = /[A-Z][a-zA-Z0-9]*/
  output = await processTagsWithParser(output, pascalPattern, true)

  // Process single-word lowercase components (e.g., <card />) - skip HTML tags
  const lowercasePattern = /[a-z][a-z0-9]*/
  output = await processTagsWithParser(output, lowercasePattern, false, htmlTags)

  // Restore the stashed <script> blocks.
  output = restoreStashedScripts(output, stashed.scripts)

  return output

  /**
   * Find and process all component tags matching the given pattern.
   */
  async function processTagsWithParser(
    html: string,
    tagPattern: RegExp,
    isPascalCase: boolean,
    skipTags?: Set<string>,
  ): Promise<string> {
    if (!html) return html
    let result = html

    // Find all matching component tags
    const tags = findComponentTags(result, tagPattern, skipTags)

    // Process from end to start to preserve indices
    for (let i = tags.length - 1; i >= 0; i--) {
      const tag = tags[i]

      // Convert the tag name to a component path
      const componentPath = isPascalCase
        ? pascalToKebab(tag.tagName)
        : tag.tagName

      // Parse ALL attributes (including @ and : prefixed ones)
      const rawProps = parseAllAttributes(tag.attributes)

      // Categorize into ResolvedProps
      const resolvedProps = parseComponentProps(rawProps, context, options)

      // --- Check if this is a builtin component ---
      // A project-authored component file of the same name takes precedence so
      // users can override built-ins (e.g. a custom `components/Icon.stx`
      // shadowing the built-in Lucide `Icon`).
      const builtinDef = registry.getBuiltin(tag.tagName)
      const overriddenByUser = builtinDef
        ? await userComponentFileExists(componentPath, componentsDir, context, filePath, options)
        : false

      if (builtinDef && !overriddenByUser) {
        // Build the render context
        const renderCtx: RenderContext = {
          context,
          filePath,
          options,
          dependencies,
        }

        // Render the builtin directly
        let rendered = builtinDef.render(resolvedProps, tag.content, renderCtx)

        // Emit clientReactive bindings on the rendered output (same as file components)
        // This preserves :for, :to, :text etc. that couldn't be evaluated server-side
        if (Object.keys(resolvedProps.clientReactive).length > 0) {
          rendered = emitClientReactiveAttrs(rendered, resolvedProps.clientReactive)
        }

        // Forward @event attributes from parent to builtin's root element
        if (Object.keys(resolvedProps.events).length > 0) {
          const eventAttrs = Object.entries(resolvedProps.events)
            .map(([event, handler]) => `${event}="${escapeAttribute(handler)}"`)
            .join(' ')
          rendered = rendered.replace(/^(\s*<[a-zA-Z][a-zA-Z0-9-]*)/, `$1 ${eventAttrs}`)
        }

        result = result.substring(0, tag.startIndex) + rendered + result.substring(tag.endIndex)
        continue
      }

      // --- File-based component ---

      // Merge static + serverDynamic into a single props object for renderComponentWithSlot
      const mergedProps: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(resolvedProps.static)) {
        mergedProps[key] = value
      }

      for (const [key, value] of Object.entries(resolvedProps.serverDynamic)) {
        mergedProps[key] = value
      }

      // Render the file component
      const processedContent = await renderComponentWithSlot(
        componentPath,
        mergedProps,
        tag.content,
        componentsDir,
        context,
        filePath,
        options,
        processedComponents,
        dependencies,
      )

      // If there are clientReactive bindings, emit them as :attr="expr" on the
      // outermost element of the rendered output so that the client runtime can
      // pick them up.
      let finalContent = processedContent
      if (Object.keys(resolvedProps.clientReactive).length > 0) {
        finalContent = emitClientReactiveAttrs(finalContent, resolvedProps.clientReactive)
      }

      // Forward @event attributes from parent to component's root element.
      // This connects parent handlers to child defineEmits() — the child emits
      // a CustomEvent that bubbles up, and the root element's @event listener catches it.
      if (Object.keys(resolvedProps.events).length > 0) {
        const firstTagMatch = finalContent.match(/^(\s*<)([a-zA-Z][a-zA-Z0-9-]*)(\s|>|\/)/s)
        if (firstTagMatch) {
          const eventAttrs = Object.entries(resolvedProps.events)
            .map(([event, handler]) => `${event}="${escapeAttribute(handler)}"`)
            .join(' ')
          const insertPos = firstTagMatch[1].length + firstTagMatch[2].length
          finalContent = finalContent.substring(0, insertPos) + ' ' + eventAttrs + finalContent.substring(insertPos)
        }
      }

      // Replace the tag with processed content
      result = result.substring(0, tag.startIndex) + finalContent + result.substring(tag.endIndex)
    }

    return result
  }
}

/**
 * Emit client-reactive bindings as `:attr="expression"` attributes on the
 * outermost HTML element of the rendered component output.
 *
 * This allows the client-side runtime to bind signal expressions to the
 * appropriate DOM elements.
 */
// eslint-disable-next-line pickier/no-unused-vars
function emitClientReactiveAttrs(html: string, clientReactive: Record<string, string>): string {
  // Find the first opening HTML tag in the rendered output
  const firstTagMatch = html.match(/^(\s*<)([a-zA-Z][a-zA-Z0-9-]*)(\s|>|\/)/s)
  if (!firstTagMatch) {
    return html
  }

  // Build the reactive attributes string
  const reactiveAttrs = Object.entries(clientReactive)
    .map(([key, expr]) => `:${key}="${expr.replace(/"/g, '&quot;')}"`)
    .join(' ')

  // Insert after the tag name
  const insertPos = firstTagMatch[1].length + firstTagMatch[2].length
  return html.substring(0, insertPos) + ' ' + reactiveAttrs + html.substring(insertPos)
}

/**
 * Unified component processing entry point.
 *
 * Processes all component-related syntax in the template in the correct order:
 * 1. Register builtin components (once)
 * 2. Process `@import` directives
 * 3. Process `@component` directives
 * 4. Process custom element tags (builtins and file-based)
 *
 * @param template - The template string to process
 * @param context - Template variable context
 * @param filePath - Absolute path of the template being processed
 * @param options - Compiler options
 * @param dependencies - Set to track file dependencies for cache invalidation
 * @returns The processed template with all components rendered
 */
export async function processComponents(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  // Step 1: Register builtins once
  if (!builtinsRegistered) {
    registerBuiltins()
    builtinsRegistered = true
  }

  // Step 2: Process ES `import { X } from 'pkg'` statements in <script> blocks
  // and register matching .stx files as component tags.
  let output = await processESImports(template, context, filePath, options, dependencies)

  // Step 3: Process @import directives
  output = await processImports(output, context, filePath, options, dependencies)

  // Step 3: Process @component directives
  output = await processComponentDirectives(output, context, filePath, options, dependencies)

  // Step 4: Process custom element tags (builtins + file-based)
  // Run multiple passes — builtins nested inside other builtins (e.g., <Icon>
  // inside <StxLink>) aren't resolved in a single pass because the outer
  // builtin's children are raw HTML during the first pass. Re-scan until
  // no more unresolved builtins remain (max 3 passes to prevent infinite loops).
  for (let pass = 0; pass < 3; pass++) {
    const before = output
    output = await processCustomElementTags(output, context, filePath, options, dependencies)
    if (output === before) break // No more changes — all builtins resolved
  }

  if (options.debug) {
    const unresolved = findUnresolvedBuiltinTags(output)
    if (unresolved.length > 0) {
      console.warn(
        `[stx] ${filePath}: unresolved component tag(s) after render passes: ${unresolved.join(', ')}. `
        + 'Check nested component output for malformed root tags or recursive component markup.',
      )
    }
  }

  return output
}
