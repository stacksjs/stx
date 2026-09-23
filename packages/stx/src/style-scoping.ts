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

import { maskAtElementPosition, matchScriptElement, matchStyleElement } from './html-masking'
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
// The lookbehind in SCOPED_STYLE_ATTR is what made one whole-document probe
// slow: with it in the pattern the engine cannot skip to the next '<style', so
// the probe walked every character of a page with a 190KB component bundle
// inlined, per component, per render (#1945). Finding the tags with a plain
// pattern and applying the lookbehind to each tag's attributes is the same test.
const STYLE_OPEN_TAG = /<style\s+([^>]*)>/gi
const STYLE_TAG_WITH_ATTRS = /<style\s+([^>]*)>([\s\S]*?)<\/style>/gi
const SCOPED_ATTR_IN_TAG = new RegExp(SCOPED_STYLE_ATTR, 'i')
const SCOPED_ATTR_EVERYWHERE = new RegExp(SCOPED_STYLE_ATTR, 'gi')
const RENDERED_SCOPED_STYLE = /<style\b[^>]*\bdata-stx-scoped(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>[\s\S]*?<\/style>\s*/gi

function hasScopedStyleTag(template: string): boolean {
  STYLE_OPEN_TAG.lastIndex = 0
  let tag = STYLE_OPEN_TAG.exec(template)
  while (tag !== null) {
    if (SCOPED_ATTR_IN_TAG.test(tag[1]))
      return true
    tag = STYLE_OPEN_TAG.exec(template)
  }
  return false
}

export interface ScopedStyleResult {
  /** The modified HTML with scope attributes added to root elements and scoped style tags */
  html: string
  /** Whether any scoped styles were found and processed */
  hasScoped: boolean
}

export interface SourceRange {
  start: number
  end: number
}

/**
 * Locate repeated rendered scoped styles without rebuilding the document.
 * The ranges include the same trailing whitespace consumed by the standalone
 * dedupe pass, so callers can fold the removals into another document edit.
 */
export function findDuplicateScopedStyleRanges(html: string): SourceRange[] {
  const seen = new Set<string>()
  const duplicates: SourceRange[] = []
  RENDERED_SCOPED_STYLE.lastIndex = 0

  let match = RENDERED_SCOPED_STYLE.exec(html)
  while (match !== null) {
    const key = match[0].trim()
    if (seen.has(key))
      duplicates.push({ start: match.index, end: match.index + match[0].length })
    else
      seen.add(key)

    match = RENDERED_SCOPED_STYLE.exec(html)
  }

  return duplicates
}

/**
 * Keep one copy of each rendered scoped stylesheet.
 *
 * Reusing the same component more than once produces the same deterministic
 * scope attribute and CSS. A single stylesheet covers every instance, just as
 * it does in a compiled Vue SFC, so repeating it only increases the document
 * payload and CSS parse work.
 */
export function dedupeScopedStyles(html: string): string {
  const duplicates = findDuplicateScopedStyleRanges(html)
  if (duplicates.length === 0)
    return html

  const kept = new Array<string>(duplicates.length + 1)
  let cursor = 0
  for (let i = 0; i < duplicates.length; i++) {
    const duplicate = duplicates[i]
    kept[i] = html.slice(cursor, duplicate.start)
    cursor = duplicate.end
  }
  kept[duplicates.length] = html.slice(cursor)
  return kept.join('')
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
  if (!hasScopedStyleTag(template)) {
    return { html: template, hasScoped: false }
  }

  const componentId = generateComponentId(filePath)
  const scopeAttr = `data-v-${componentId}`
  let output = template

  // Extract and process all <style scoped> blocks.
  //
  // Same shape as the probe above, and for the same reason: with the lookbehind
  // inside the pattern the engine cannot anchor on the `<style` literal and
  // walks every character of the output. This one runs over a component's
  // RENDERED output, which includes an inlined client bundle on the
  // stx-hydrate path — measured at ~4ms per render on a 200KB one, against
  // 0.03ms for the plain pattern. Match the tags plainly, then apply the
  // lookbehind to each tag's own attributes, which is the identical test.
  let hasScoped = false

  STYLE_TAG_WITH_ATTRS.lastIndex = 0
  output = output.replace(STYLE_TAG_WITH_ATTRS, (match, attrs: string, cssContent: string) => {
    if (!SCOPED_ATTR_IN_TAG.test(attrs))
      return match
    hasScoped = true
    // Scope the CSS: prefix selectors with the attribute selector
    const scopedCss = scopeCssWithAttribute(cssContent, scopeAttr)
    // Remove 'scoped' from attrs, add data-stx-scoped marker
    const cleanAttrs = attrs.replace(SCOPED_ATTR_EVERYWHERE, '').trim()
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
 * Placeholder standing in for a masked `<script>`/`<style>` element.
 *
 * Contains no `<`, so the attribute injector's tag regex cannot see it.
 */
const MASK_TOKEN = (index: number): string => `\u0000stx-scope-mask-${index}\u0000`
const MASK_TOKEN_PATTERN = /\u0000stx-scope-mask-(\d+)\u0000/g

/**
 * Add a scope attribute to all top-level HTML elements in the template.
 *
 * Skips `<style>`, `<script>`, `<template>`, `<!DOCTYPE>`, and `<html>`/`<head>`/`<body>` tags,
 * along with everything *inside* `<style>` and `<script>`.
 * For component fragments (no document wrapper), adds to all root-level elements.
 * For full documents, adds to elements inside `<body>`.
 */
function addScopeAttribute(html: string, scopeAttr: string): string {
  // Text-content elements are masked out before the injector runs, because it
  // recognizes elements by regex and cannot tell an HTML tag from a `<` that
  // happens to appear inside CSS or JavaScript. Left in, it rewrote
  // `@property { syntax: "<color>" }` into `syntax: "<color data-v-hash>"` —
  // silently invalidating the rule — and would do the same to `content: "<"`,
  // a `<length>` descriptor, or `a < b` in an inline script.
  //
  // The masking is position-aware rather than a plain global regex: a token
  // like `aria-label="<script>alert(1)</script>"` is NOT an element, and
  // carving it out would tear a hole through the middle of a real tag (and
  // hand the raw script back unescaped afterwards). `maskAtElementPosition`
  // only masks tokens that begin where an element could actually start.
  const masked = maskAtElementPosition(
    html,
    (source, index) => {
      const script = matchScriptElement(source, index)
      return script > index ? script : matchStyleElement(source, index)
    },
    (_token, index) => MASK_TOKEN(index),
  )

  const injected = injectScopeAttribute(masked.output, scopeAttr)

  MASK_TOKEN_PATTERN.lastIndex = 0
  return injected.replace(MASK_TOKEN_PATTERN, (_match, index) => masked.tokens[Number(index)])
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
