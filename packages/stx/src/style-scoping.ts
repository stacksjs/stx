/**
 * SFC Style Scoping
 *
 * Processes `<style scoped>` blocks in `.stx` single-file components.
 * Scopes CSS selectors to the component using a deterministic hash attribute,
 * preventing style leakage between components.
 *
 * Uses the CSS scoping utilities from `web-components/css-scoping.ts`.
 *
 * @module style-scoping
 */

import { generateComponentId, scopeCss } from './web-components/css-scoping'

/**
 * Result of processing scoped styles in a template
 */
/**
 * Matches `scoped` only as a standalone attribute.
 *
 * A plain `\bscoped\b` also matches inside `data-stx-scoped`, the marker this
 * module writes onto a style tag it has already handled — so every later
 * scoping pass processed the same block again, prefixing the selectors a
 * second and third time. The selector list grew combinatorially and, worse,
 * ended up carrying a variant with no scope attribute at all, which leaked a
 * component's styles to the whole page. Hyphens are word characters for this
 * purpose, so the boundaries are spelled out explicitly.
 */
const SCOPED_STYLE_ATTR = String.raw`(?<![\w-])scoped(?![\w-])`
const SCOPED_STYLE_PROBE = new RegExp(`<style\\s+[^>]*${SCOPED_STYLE_ATTR}`, 'i')

export interface ScopedStyleResult {
  /** The modified HTML with scope attributes added to root elements and scoped style tags */
  html: string
  /** Whether any scoped styles were found and processed */
  hasScoped: boolean
}

/**
 * Process all `<style scoped>` blocks in a template.
 *
 * For each `<style scoped>` block:
 * 1. Generates a deterministic hash from the file path
 * 2. Prefixes all CSS selectors with `[data-v-{hash}]`
 * 3. Adds `data-v-{hash}` attribute to all top-level HTML elements
 * 4. Replaces the `<style scoped>` tag with scoped CSS
 *
 * Non-scoped `<style>` tags pass through unchanged.
 *
 * @param template - The HTML template string
 * @param filePath - Source file path (used for deterministic hash generation)
 * @returns Processed template with scoped styles
 */
export function processScopedStyles(template: string, filePath: string): ScopedStyleResult {
  // Quick check: does the template have any <style scoped>?
  if (!SCOPED_STYLE_PROBE.test(template)) {
    return { html: template, hasScoped: false }
  }

  const componentId = generateComponentId(filePath)
  const scopeAttr = `data-v-${componentId}`
  let output = template

  // Extract and process all <style scoped> blocks
  const scopedStyleRegex = new RegExp(`<style\\s+([^>]*${SCOPED_STYLE_ATTR}[^>]*)>([\\s\\S]*?)</style>`, 'gi')
  let hasScoped = false

  output = output.replace(scopedStyleRegex, (_match, attrs: string, cssContent: string) => {
    hasScoped = true
    // Scope the CSS: prefix selectors with the attribute selector
    const scopedCss = scopeCssWithAttribute(cssContent, scopeAttr)
    // Remove 'scoped' from attrs, add data-stx-scoped marker
    const cleanAttrs = attrs.replace(new RegExp(SCOPED_STYLE_ATTR, 'gi'), '').trim()
    const attrStr = cleanAttrs ? ` ${cleanAttrs}` : ''
    return `<style data-stx-scoped="${componentId}"${attrStr}>${scopedCss}</style>`
  })

  if (!hasScoped) {
    return { html: template, hasScoped: false }
  }

  // Add the scope attribute to all top-level HTML elements in the template
  output = addScopeAttribute(output, scopeAttr)

  return { html: output, hasScoped: true }
}

/**
 * Scope CSS selectors using an attribute selector instead of a class.
 *
 * Unlike `scopeCss()` which prefixes with `.componentId`, this uses
 * `[data-v-hash]` attribute selectors for Vue-style scoping.
 */
function scopeCssWithAttribute(css: string, scopeAttr: string): string {
  // Use the existing scopeCss with a class-based approach, then transform
  // the class selector to an attribute selector
  const tempId = `__SCOPE_PLACEHOLDER__`
  const scoped = scopeCss(css, tempId, { preserveHost: false })
  // Replace `.__SCOPE_PLACEHOLDER__ ` with `[data-v-hash] ` in selectors
  // and `.__SCOPE_PLACEHOLDER__` (without trailing space, for :host replacements) with `[data-v-hash]`
  return scoped
    .replace(/\.(__SCOPE_PLACEHOLDER__) /g, `[${scopeAttr}] `)
    .replace(/\.(__SCOPE_PLACEHOLDER__)/g, `[${scopeAttr}]`)
}

/**
 * Elements whose *contents* are text, not markup.
 *
 * The attribute injector below recognizes elements by regex, which cannot tell
 * an HTML tag from a `<` that happens to appear inside CSS or JavaScript. Left
 * alone it rewrites things like `@property { syntax: "<color>" }` into
 * `syntax: "<color data-v-hash>"` — silently invalidating the rule — and would
 * do the same to `content: "<"`, a `<length>` syntax descriptor, or a `a < b`
 * comparison in an inline script. So these regions are cut out first and
 * stitched back verbatim.
 */
const TEXT_CONTENT_ELEMENT = /<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi

/**
 * Add a scope attribute to all top-level HTML elements in the template.
 *
 * Skips `<style>`, `<script>`, `<template>`, `<!DOCTYPE>`, and `<html>`/`<head>`/`<body>` tags,
 * along with everything *inside* `<style>` and `<script>`.
 * For component fragments (no document wrapper), adds to all root-level elements.
 * For full documents, adds to elements inside `<body>`.
 */
function addScopeAttribute(html: string, scopeAttr: string): string {
  let output = ''
  let cursor = 0

  TEXT_CONTENT_ELEMENT.lastIndex = 0
  let block: RegExpExecArray | null
  while ((block = TEXT_CONTENT_ELEMENT.exec(html)) !== null) {
    output += injectScopeAttribute(html.slice(cursor, block.index), scopeAttr)
    output += block[0]
    cursor = block.index + block[0].length
  }

  return output + injectScopeAttribute(html.slice(cursor), scopeAttr)
}

/** Inject the scope attribute into every content tag in a markup-only region. */
function injectScopeAttribute(html: string, scopeAttr: string): string {
  // Strategy: add the attribute to every HTML element tag that is NOT
  // a meta tag, script, style, or template wrapper.
  // We use a regex that finds opening tags and injects the attribute.
  //
  // For SFC components, the template content is typically just the component's
  // HTML fragment — all elements need the scope attribute.

  const skipTags = new Set([
    'script', 'style', 'template', 'html', 'head', 'body', 'meta',
    'link', 'title', 'base', '!doctype', '!DOCTYPE',
  ])

  // Match opening HTML tags (not self-closing void elements handled separately)
  return html.replace(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?\/?>/g, (match, tagName: string, attrs: string) => {
    // Skip non-content tags
    if (skipTags.has(tagName.toLowerCase())) {
      return match
    }

    // Skip if already has this scope attribute
    if (match.includes(scopeAttr)) {
      return match
    }

    // Skip style/script tags with attributes (data-stx-scoped etc.)
    if (tagName.toLowerCase() === 'style' || tagName.toLowerCase() === 'script') {
      return match
    }

    // Inject the scope attribute after the tag name
    if (attrs) {
      return match.replace(`<${tagName}${attrs}`, `<${tagName} ${scopeAttr}${attrs}`)
    }
    // Self-closing or no attrs
    if (match.endsWith('/>')) {
      return `<${tagName} ${scopeAttr} />`
    }
    return `<${tagName} ${scopeAttr}>`
  })
}
