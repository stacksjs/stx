/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Component processing functions extracted from process.ts.
 *
 * Handles component tag parsing, attribute parsing, built-in STX components,
 * @import directives, @component directives, and custom element resolution
 * (kebab-case and PascalCase).
 */

import type { StxOptions } from './types'
import path from 'node:path'
import { createSafeFunction, isExpressionSafe, safeEvaluateObject } from './safe-evaluator'
import { renderComponentWithSlot } from './utils'

/**
 * Convert PascalCase to kebab-case with proper handling of consecutive uppercase letters.
 *
 * Examples:
 * - `UserCard` → `user-card`
 * - `XMLParser` → `xml-parser` (not `x-m-l-parser`)
 * - `HTMLElement` → `html-element`
 * - `MyURLParser` → `my-url-parser`
 * - `IOStream` → `io-stream`
 *
 * The algorithm:
 * 1. Insert hyphen before uppercase letters that follow lowercase letters
 * 2. Insert hyphen before the last uppercase in a sequence of uppercase letters (before lowercase)
 * 3. Convert to lowercase
 */
export function pascalToKebab(str: string): string {
  return str
    // Insert hyphen between lowercase and uppercase: userCard → user-Card
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Insert hyphen between consecutive uppercase and lowercase: XMLParser → XML-Parser
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

// Element-position-aware script stashing lives in the leaf html-masking module
// (no stx imports) so process.ts / expressions.ts can share it without a cycle.
// Imported for local use here and re-exported for existing import sites.
import { restoreStashedScripts, stashScriptElements } from './html-masking'

export { restoreStashedScripts, stashScriptElements }

/**
 * Parse HTML/JSX-like attributes from a string.
 *
 * Properly handles:
 * - Simple attributes: `name="value"`
 * - Boolean attributes: `disabled`
 * - Dynamic values: `prop="{{ expr }}"` (evaluated at SSR)
 * - Attributes with `=` in values: `url="https://example.com?a=1&b=2"`
 * - Single and double quoted values
 * - Escaped quotes within values
 *
 * ## Dynamic Data Syntax
 *
 * Use `{{ }}` for all dynamic data interpolation:
 * ```html
 * <Component title="{{ pageTitle }}" count="{{ items.length }}" />
 * <div class="{{ isActive ? 'active' : '' }}">{{ content }}</div>
 * ```
 *
 * ## Event Syntax (Alpine-style)
 *
 * ```html
 * <button @click="handleClick()">Click me</button>
 * <form @submit.prevent="handleSubmit()">...</form>
 * <input @keydown.enter="send()" @keydown.escape="cancel()">
 * ```
 *
 * @param attributesStr - The attributes portion of a tag (between tag name and closing)
 * @returns Array of parsed attributes with name and value
 */
export interface ParsedAttribute {
  name: string
  value: string | true // true for boolean attributes
}

/**
 * Component tag match result
 */
export interface ComponentTagMatch {
  fullMatch: string
  tagName: string
  attributes: string
  content: string
  startIndex: number
  endIndex: number
  isSelfClosing: boolean
}

/**
 * Find component tags in HTML, properly handling quoted strings
 * This solves the issue where `>` inside attribute values would incorrectly end the tag
 *
 * @param html - The HTML string to search
 * @param tagPattern - Regex pattern for tag name (for PascalCase components)
 * @param skipTags - Optional set of tag names to skip (for HTML tags)
 * @returns Array of found component tags
 */
export function findComponentTags(html: string, tagPattern: RegExp, skipTags?: Set<string>): ComponentTagMatch[] {
  const matches: ComponentTagMatch[] = []
  let pos = 0

  while (pos < html.length) {
    // Find the start of a potential tag
    const tagStart = html.indexOf('<', pos)
    if (tagStart === -1)
      break

    // Check if this matches our tag pattern
    const afterLt = html.slice(tagStart + 1)
    const tagNameMatch = afterLt.match(new RegExp(`^(${tagPattern.source})`))

    if (!tagNameMatch) {
      pos = tagStart + 1
      continue
    }

    const tagName = tagNameMatch[1]

    // Skip HTML tags - only advance past the opening tag, not the content
    if (skipTags && skipTags.has(tagName.toLowerCase())) {
      // Find the end of just the opening tag
      let currentPos = tagStart + 1 + tagName.length
      while (currentPos < html.length && html[currentPos] !== '>') {
        currentPos++
      }
      pos = currentPos + 1 // Move past the '>'
      continue
    }

    let currentPos = tagStart + 1 + tagName.length

    // Now find the end of this tag, respecting quoted strings
    let inQuote: string | null = null
    let attributesStart = currentPos
    let tagEnd = -1
    let isSelfClosing = false

    while (currentPos < html.length) {
      const char = html[currentPos]

      // Handle quote state
      if (inQuote) {
        if (char === '\\' && currentPos + 1 < html.length) {
          // Skip escaped character
          currentPos += 2
          continue
        }
        if (char === inQuote) {
          inQuote = null
        }
        currentPos++
        continue
      }

      // Not in quote - check for quote start
      if (char === '"' || char === '\'') {
        inQuote = char
        currentPos++
        continue
      }

      // Check for self-closing tag end
      if (char === '/' && currentPos + 1 < html.length && html[currentPos + 1] === '>') {
        tagEnd = currentPos + 2
        isSelfClosing = true
        break
      }

      // Check for tag end
      if (char === '>') {
        tagEnd = currentPos + 1
        break
      }

      currentPos++
    }

    if (tagEnd === -1) {
      pos = tagStart + 1
      continue
    }

    const attributes = html.slice(attributesStart, isSelfClosing ? tagEnd - 2 : tagEnd - 1).trim()

    if (isSelfClosing) {
      matches.push({
        fullMatch: html.slice(tagStart, tagEnd),
        tagName,
        attributes,
        content: '',
        startIndex: tagStart,
        endIndex: tagEnd,
        isSelfClosing: true,
      })
      pos = tagEnd
    }
    else {
      // Find the matching closing tag using balanced depth tracking
      const openingTag = `<${tagName}`
      const closingTag = `</${tagName}>`
      let depth = 1
      let searchPos = tagEnd
      let contentEnd = -1

      while (depth > 0 && searchPos < html.length) {
        const nextOpen = html.indexOf(openingTag, searchPos)
        const nextClose = html.indexOf(closingTag, searchPos)

        if (nextClose === -1) break

        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Check it's a real tag (followed by space, >, or /)
          const charAfter = html[nextOpen + openingTag.length]
          if (charAfter === ' ' || charAfter === '>' || charAfter === '/' || charAfter === '\n' || charAfter === '\t') {
            depth++
          }
          searchPos = nextOpen + openingTag.length
        }
        else {
          depth--
          if (depth === 0) {
            contentEnd = nextClose
            break
          }
          searchPos = nextClose + closingTag.length
        }
      }

      if (contentEnd === -1) {
        // No matching closing tag found, skip
        pos = tagEnd
        continue
      }

      const content = html.slice(tagEnd, contentEnd)
      const fullEndIndex = contentEnd + closingTag.length

      matches.push({
        fullMatch: html.slice(tagStart, fullEndIndex),
        tagName,
        attributes,
        content,
        startIndex: tagStart,
        endIndex: fullEndIndex,
        isSelfClosing: false,
      })
      pos = fullEndIndex
    }
  }

  return matches
}

/**
 * Decode a pre-evaluated `__stx_` prop value produced by loop processing.
 *
 * Loop iterations serialise component prop values so they survive until the
 * component directive is processed. The current wire format is base64-encoded
 * JSON — chosen because base64 contains no quotes, backslashes or angle
 * brackets, so it passes through `parseMultilineAttributes` (which strips
 * backslash escapes) and HTML attribute quoting completely intact.
 *
 * A legacy HTML-entity-escaped JSON format is still accepted as a fallback so
 * that any externally-produced markup keeps working.
 */
export function decodeStxProp(attrValue: string, options?: { debug?: boolean }): unknown {
  // Preferred format: base64-encoded JSON.
  try {
    const json = Buffer.from(attrValue, 'base64').toString('utf8')
    return JSON.parse(json)
  }
  catch {
    // Fall through to the legacy format below.
  }

  // Legacy format: HTML-entity-escaped JSON.
  try {
    const unescaped = attrValue
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    return JSON.parse(unescaped)
  }
  catch (error) {
    if (options?.debug)
      console.error('Error decoding __stx_ prop:', error)
    return attrValue
  }
}

/**
 * Parse multiline attributes from a component tag
 * Handles HTML content inside attribute values correctly
 *
 * @param attributesStr - The attributes string (may be multiline)
 * @returns Object mapping attribute names to values
 */
export function parseMultilineAttributes(attributesStr: string): Record<string, string> {
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

    // Skip @ event attributes and : directive attributes (handled by event/directive processing)
    if (name.startsWith('@') || name.startsWith(':')) {
      // Skip to next attribute
      while (pos < len && attributesStr[pos] !== '"' && attributesStr[pos] !== '\'') {
        pos++
      }
      if (pos < len) {
        const quote = attributesStr[pos]
        pos++
        while (pos < len && attributesStr[pos] !== quote) {
          if (attributesStr[pos] === '\\') pos++
          pos++
        }
        pos++
      }
      continue
    }

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
            // Handle escape sequence - include the escaped character
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

export function parseAttributes(attributesStr: string): ParsedAttribute[] {
  const attributes: ParsedAttribute[] = []
  let pos = 0
  const len = attributesStr.length

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    if (pos >= len)
      break

    // Read attribute name (until = or whitespace or end)
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
        while (pos < len && attributesStr[pos] !== quote) {
          if (attributesStr[pos] === '\\' && pos + 1 < len) {
            // Handle escape sequence
            pos++
            value += attributesStr[pos]
          }
          else {
            value += attributesStr[pos]
          }
          pos++
        }
        if (pos < len) pos++ // Skip closing quote (with bounds check)
      }
      else {
        // Unquoted value (read until whitespace)
        while (pos < len && !/\s/.test(attributesStr[pos])) {
          value += attributesStr[pos]
          pos++
        }
      }

      attributes.push({ name, value })
    }
    else {
      // Boolean attribute (no value)
      attributes.push({ name, value: true })
    }
  }

  return attributes
}

/**
 * Process built-in STX components like <stx-loading-indicator>
 */
export async function processBuiltInComponents(
  template: string,
  _context: Record<string, any>,
  _filePath: string,
  _options: StxOptions,
): Promise<string> {
  let output = template

  // Process <stx-loading-indicator> component
  output = output.replace(
    /<stx-loading-indicator([^>]*?)(?:\s*\/>|><\/stx-loading-indicator>)/gi,
    (_match, attrs) => {
      // Parse attributes
      const colorMatch = attrs.match(/color=["']([^"']+)["']/i)
      const initialColorMatch = attrs.match(/initial-color=["']([^"']+)["']/i)
      const heightMatch = attrs.match(/height=["']([^"']+)["']/i)
      const durationMatch = attrs.match(/duration=["']([^"']+)["']/i)
      const throttleMatch = attrs.match(/throttle=["']([^"']+)["']/i)
      const zIndexMatch = attrs.match(/z-index=["']([^"']+)["']/i)

      // Sanitize CSS values to prevent injection (strip semicolons, braces, url())
      const sanitizeCss = (v: string): string => v.replace(/[;{}()]/g, '').replace(/url/gi, '')
      const options = {
        color: sanitizeCss(colorMatch?.[1] || '#6366f1'),
        initialColor: sanitizeCss(initialColorMatch?.[1] || ''),
        height: sanitizeCss(heightMatch?.[1] || '3px'),
        duration: durationMatch ? Number.parseInt(durationMatch[1]) : 2000,
        throttle: throttleMatch ? Number.parseInt(throttleMatch[1]) : 200,
        zIndex: zIndexMatch ? Number.parseInt(zIndexMatch[1]) : 999999,
      }

      const gradient = options.initialColor
        ? `linear-gradient(to right, ${options.initialColor}, ${options.color})`
        : options.color

      return `
<div id="stx-loading-indicator" style="position:fixed;top:0;left:0;right:0;height:${options.height};background:${gradient};z-index:${options.zIndex};transform:scaleX(0);transform-origin:left;transition:transform 0.1s ease-out,opacity 0.3s ease;opacity:0;pointer-events:none">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%);animation:stx-shimmer 1.5s infinite"></div>
</div>
<style>@keyframes stx-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>
<script>
(function(){var el=document.getElementById('stx-loading-indicator'),p=0,l=!1,i=null;function u(v){p=Math.min(Math.max(v,0),100);if(el){el.style.opacity=p>0?'1':'0';el.style.transform='scaleX('+(p/100)+')'}}window.stxLoading={start:function(){l=!0;p=0;u(10);if(i)clearInterval(i);i=setInterval(function(){if(!l)return;var r=90-p,inc=Math.max(0.5,r*0.1);if(p<90)u(p+inc)},${options.throttle})},finish:function(){l=!1;if(i){clearInterval(i);i=null}u(100);setTimeout(function(){if(el)el.style.opacity='0';setTimeout(function(){p=0;if(el)el.style.transform='scaleX(0)'},300)},200)},set:function(v){u(v)},clear:function(){l=!1;p=0;if(i){clearInterval(i);i=null}if(el){el.style.opacity='0';el.style.transform='scaleX(0)'}}};document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.getAttribute('href');if(!h||h.startsWith('http')||h.startsWith('#')||h.startsWith('mailto:')||h.startsWith('tel:')||a.target==='_blank')return;window.stxLoading.start()});window.addEventListener('popstate',function(){window.stxLoading.start()});window.addEventListener('load',function(){window.stxLoading.finish()})})();
</script>`
    },
  )

  return output
}

/**
 * Process @import directives for explicit component imports.
 *
 * Syntax:
 *   @import('components/Card')
 *   @import('ui/Button', 'ui/Modal')
 *   @import('Card', 'Button', 'Modal')
 *
 * This allows explicit importing of components from any path,
 * overriding the auto-import from the components directory.
 */
export async function processImportDirectives(
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
 * Process @component directives
 */
export async function processComponentDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Use shared processedComponents set from context to prevent infinite recursion
  // across nested processDirectives calls
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
    let d = 1, p = openP + 1
    while (p < output.length && d > 0) { if (output[p] === '(') d++; else if (output[p] === ')') { d--; if (d === 0) break } p++ }
    if (d !== 0) break
    const innerArgs = output.substring(openP + 1, p)
    const directiveEnd = p + 1 // position after closing paren

    // Parse: 'componentPath', optional { props }
    const pathMatch = innerArgs.match(/^\s*['"]([^'"]+)['"]/)
    if (!pathMatch) { componentPat.lastIndex = 0; continue }
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

    // eslint-disable-next-line pickier/no-unused-vars
    const fullMatch = output.substring(cStart, fullMatchEnd)

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
 * Process custom element components (both kebab-case and PascalCase)
 * Uses a proper parser that handles HTML content inside attribute values
 */
export async function processCustomElements(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Use shared processedComponents set from context to prevent infinite recursion
  // across nested processDirectives calls
  if (!context.__processedComponents) {
    context.__processedComponents = new Set<string>()
  }
  const processedComponents = context.__processedComponents as Set<string>

  // Standard HTML tags to exclude from component processing
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

  // Stash <script> bodies before the three-pass scan so JS string
  // literals containing tag-like substrings aren't mis-resolved as
  // component references. See stacksjs/stx#1730 — the live path in
  // component-renderer.ts has the same fix; this branch isn't on the
  // current call graph but matches the fix defensively in case it
  // gets reintroduced.
  const stashedScripts: string[] = []
  output = output.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    const idx = stashedScripts.length
    stashedScripts.push(match)
    return `\x00STX_SCRIPT_${idx}\x00`
  })

  // Process kebab-case components (e.g., <my-component />)
  const kebabPattern = /[a-z][a-z0-9]*-[a-z0-9-]*/
  output = await processComponentsWithParser(output, kebabPattern, false)

  // Process PascalCase components (e.g., <MyComponent />)
  const pascalPattern = /[A-Z][a-zA-Z0-9]*/
  output = await processComponentsWithParser(output, pascalPattern, true)

  // Process single-word lowercase components (e.g., <card />) - skip HTML tags
  const lowercasePattern = /[a-z][a-z0-9]*/
  output = await processComponentsWithParser(output, lowercasePattern, false, htmlTags)

  // Restore the stashed <script> blocks.
  if (stashedScripts.length > 0) {
    output = output.replace(/\x00STX_SCRIPT_(\d+)\x00/g, (_, idx) => stashedScripts[+idx])
  }

  return output

  /**
   * Process components using the proper parser that handles quoted strings
   */
  async function processComponentsWithParser(html: string, tagPattern: RegExp, isPascalCase: boolean, skipTags?: Set<string>): Promise<string> {
    let result = html

    // Find all matching component tags (pass skipTags to avoid consuming HTML tag content)
    const tags = findComponentTags(result, tagPattern, skipTags)

    // Process from end to start to preserve indices
    for (let i = tags.length - 1; i >= 0; i--) {
      const tag = tags[i]

      // Convert the tag name to a component path
      const componentPath = isPascalCase
        ? pascalToKebab(tag.tagName)
        : tag.tagName

      // Parse attributes using the robust parser that handles HTML in values
      const rawProps = parseMultilineAttributes(tag.attributes)

      // Process props: evaluate {{ }} expressions and :prop="var" bindings
      const props: Record<string, unknown> = {}
      for (const [attrName, attrValue] of Object.entries(rawProps)) {
        // Skip @ event attributes - they're processed by processEventDirectives
        if (attrName.startsWith('@')) {
          continue
        }

        // Handle pre-evaluated props from loop processing (__stx_propName="serialized_json")
        // These were evaluated at loop iteration time and serialized as JSON
        if (attrName.startsWith('__stx_')) {
          const propName = attrName.slice(6) // Remove __stx_ prefix
          props[propName] = decodeStxProp(attrValue as string, options)
          continue
        }

        // Handle :prop="expression" or :prop (shorthand) dynamic binding
        // Shorthand syntax: :propName is equivalent to :propName="propName"
        if (attrName.startsWith(':')) {
          const propName = attrName.slice(1) // Remove the : prefix
          // If value is 'true' (boolean attribute), use shorthand syntax
          // :trail becomes :trail="trail"
          const expression = attrValue === 'true' ? propName : attrValue

          try {
            // Use safe evaluation to prevent code injection
            if (!isExpressionSafe(expression)) {
              if (options.debug) {
                console.error(`Unsafe expression in :${propName} binding: ${expression}`)
              }
              props[propName] = attrValue
            }
            else {
              const valueFn = createSafeFunction(expression, Object.keys(context))
              props[propName] = valueFn(...Object.values(context))
            }
          }
          catch (error) {
            if (options.debug) {
              console.error(`Error evaluating :${propName} binding:`, error)
            }
            props[propName] = attrValue // Fall back to string value
          }
          continue
        }

        // Check if value contains {{ }} expressions
        if (typeof attrValue === 'string' && attrValue.includes('{{') && attrValue.includes('}}')) {
          // Check if the entire value is a single expression: {{ expr }}
          const singleExprMatch = attrValue.match(/^\{\{\s*([\s\S]+?)\s*\}\}$/)
          if (singleExprMatch) {
            // Single expression - evaluate and use the result directly
            try {
              const expression = singleExprMatch[1]
              if (!isExpressionSafe(expression)) {
                if (options.debug) {
                  console.error(`Unsafe expression in ${attrName}: ${expression}`)
                }
                props[attrName] = attrValue
              }
              else {
                const valueFn = createSafeFunction(expression, Object.keys(context))
                props[attrName] = valueFn(...Object.values(context))
              }
            }
            catch (error) {
              if (options.debug) {
                console.error(`Error evaluating expression for ${attrName}:`, error)
              }
              props[attrName] = attrValue // Fall back to string value
            }
          }
          else {
            // Mixed content - interpolate expressions within the string
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
            props[attrName] = result
          }
        }
        else {
          // Static attribute
          props[attrName] = attrValue
        }
      }

      // Process the component
      const processedContent = await renderComponentWithSlot(
        componentPath,
        props,
        tag.content,
        componentsDir,
        context,
        filePath,
        options,
        processedComponents,
        dependencies,
      )

      // Replace the tag with processed content
      result = result.substring(0, tag.startIndex) + processedContent + result.substring(tag.endIndex)
    }

    return result
  }

}
